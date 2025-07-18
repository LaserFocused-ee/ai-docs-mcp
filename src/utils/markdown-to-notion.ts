/**
 * Markdown to Notion conversion engine
 */

import { ConversionMetadata, ConversionOptions, ConversionResult, ConversionStatistics, DEFAULT_CONVERSION_OPTIONS, MarkdownNode } from '../types/markdown.js';

// Notion API limits
const NOTION_CODE_BLOCK_MAX_CHARACTERS = 2000;
import {
    NotionBlockData,
    buildBulletedListItemBlock,
    buildCodeBlock,
    buildDividerBlock,
    buildFallbackBlock,
    buildHeadingBlock,
    buildImageBlock,
    buildNumberedListItemBlock,
    buildParagraphBlock,
    buildQuoteBlock,
    buildTableBlockFromNodes,
    buildToDoBlock,
    normalizeHeadingLevel,
} from './notion-blocks.js';

/**
 * Convert markdown AST to Notion blocks
 */
export function markdownASTToNotionBlocks(
    ast: MarkdownNode[],
    options: Partial<ConversionOptions> = {},
): ConversionResult {
    const config = { ...DEFAULT_CONVERSION_OPTIONS, ...options };
    const startTime = Date.now();

    const warnings: string[] = [];
    const errors: string[] = [];
    const unsupportedBlocks: string[] = [];

    let totalBlocks = 0;
    let convertedBlocks = 0;
    let skippedBlocks = 0;
    let errorBlocks = 0;

    try {
        const blocks = convertNodeArray(ast, config, warnings, errors, unsupportedBlocks);

        // Count blocks
        totalBlocks = countBlocks(ast);
        convertedBlocks = blocks.length;
        skippedBlocks = totalBlocks - convertedBlocks - errorBlocks;

        const processingTime = Date.now() - startTime;

        const metadata: ConversionMetadata = {
            sourceFormat: 'markdown',
            targetFormat: 'notion',
            conversionDate: new Date(),
            toolVersion: '1.0.0',
            options: config,
            processingTime,
            nodeCount: totalBlocks,
        };

        const statistics: ConversionStatistics = {
            totalBlocks,
            convertedBlocks,
            skippedBlocks,
            errorBlocks,
            unsupportedBlocks: Array.from(new Set(unsupportedBlocks)), // Remove duplicates
            warnings,
        };

        return {
            content: blocks,
            warnings,
            errors,
            metadata,
            statistics,
        };
    } catch (error) {
        errors.push(`Conversion failed: ${error instanceof Error ? error.message : String(error)}`);
        errorBlocks = totalBlocks;

        return {
            content: [],
            warnings,
            errors,
            metadata: {
                sourceFormat: 'markdown',
                targetFormat: 'notion',
                conversionDate: new Date(),
                toolVersion: '1.0.0',
                options: config,
                processingTime: Date.now() - startTime,
                nodeCount: totalBlocks,
            },
            statistics: {
                totalBlocks,
                convertedBlocks: 0,
                skippedBlocks: 0,
                errorBlocks,
                unsupportedBlocks: Array.from(new Set(unsupportedBlocks)),
                warnings,
            },
        };
    }
}

/**
 * Convert an array of markdown nodes to Notion blocks
 */
function convertNodeArray(
    nodes: MarkdownNode[],
    options: ConversionOptions,
    warnings: string[],
    errors: string[],
    unsupportedBlocks: string[],
): NotionBlockData[] {
    const blocks: NotionBlockData[] = [];

    for (const node of nodes) {
        try {
            const convertedBlocks = convertMarkdownNode(node, options, warnings, errors, unsupportedBlocks);
            blocks.push(...convertedBlocks);
        } catch (error) {
            errors.push(`Error converting node ${node.type}: ${error instanceof Error ? error.message : String(error)}`);

            if (options.handleUnsupportedBlocks === 'convert') {
                blocks.push(buildFallbackBlock(
                    node.content ?? 'Error converting content',
                    node.type,
                ));
            } else if (options.handleUnsupportedBlocks === 'error') {
                throw new Error(`Failed to convert ${node.type}: ${error instanceof Error ? error.message : String(error)}`);
            }
            // 'ignore' option skips the block
        }
    }

    return blocks;
}

/**
 * Convert a single markdown node to Notion blocks
 */
function convertMarkdownNode(
    node: MarkdownNode,
    options: ConversionOptions,
    warnings: string[],
    errors: string[],
    unsupportedBlocks: string[],
): NotionBlockData[] {
    switch (node.type) {
        case 'heading':
            return convertHeading(node, options, warnings);

        case 'paragraph':
            return convertParagraph(node, options);

        case 'list':
            return convertList(node, options, warnings, errors, unsupportedBlocks);

        case 'list_item':
            return convertListItem(node, options, warnings, errors, unsupportedBlocks);

        case 'code':
            return convertCodeBlock(node, options, errors);

        case 'quote':
            return convertQuote(node, options, warnings, errors, unsupportedBlocks);

        case 'table':
            return convertTable(node, options, warnings);

        case 'image':
            return convertImage(node, options, warnings);

        case 'divider':
            return [buildDividerBlock()];

        default:
            unsupportedBlocks.push(node.type);
            warnings.push(`Unsupported block type: ${node.type}`);

            if (options.handleUnsupportedBlocks === 'convert') {
                return [buildFallbackBlock(
                    node.content ?? 'Unsupported content',
                    node.type,
                )];
            } else if (options.handleUnsupportedBlocks === 'error') {
                throw new Error(`Unsupported block type: ${node.type}`);
            }

            return []; // ignore
    }
}

/**
 * Convert heading node
 */
function convertHeading(
    node: MarkdownNode,
    options: ConversionOptions,
    _warnings: string[],
): NotionBlockData[] {
    const level = node.level ?? 1;

    // Silently normalize heading levels to Notion's supported range (H1-H3)
    const notionLevel = normalizeHeadingLevel(Math.min(level, options.maxHeadingLevel));

    return [buildHeadingBlock(
        node.children ?? node.content ?? '',
        notionLevel,
    )];
}

/**
 * Convert paragraph node
 */
function convertParagraph(
    node: MarkdownNode,
    options: ConversionOptions,
): NotionBlockData[] {
    const content = node.children ?? node.content ?? '';

    // Skip empty paragraphs unless explicitly preserving formatting
    if ((content === '' || content === null || content === undefined) && !options.preserveFormatting) {
        return [];
    }

    // Handle line breaks - preserve them as separate paragraph blocks
    if (typeof content === 'string' && content.includes('\n')) {
        // Split on any line breaks and create separate paragraph blocks
        const lines = content.split('\n');
        const blocks: NotionBlockData[] = [];

        for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine) {
                blocks.push(buildParagraphBlock(trimmedLine));
            }
        }

        return blocks.length > 0 ? blocks : [buildParagraphBlock(content)];
    }

    return [buildParagraphBlock(content)];
}

/**
 * Convert list node
 */
function convertList(
    node: MarkdownNode,
    options: ConversionOptions,
    warnings: string[],
    errors: string[],
    unsupportedBlocks: string[],
): NotionBlockData[] {
    if (!node.children) {
        warnings.push('List node has no children');
        return [];
    }

    const blocks: NotionBlockData[] = [];

    for (const child of node.children) {
        if (child.type === 'list_item') {
            const childBlocks = convertListItem(
                child,
                options,
                warnings,
                errors,
                unsupportedBlocks,
                node.ordered === true ? 'numbered' : 'bulleted',
            );
            blocks.push(...childBlocks);
        } else {
            warnings.push(`Non-list-item child in list: ${child.type}`);
        }
    }

    return blocks;
}

/**
 * Convert list item node
 */
function convertListItem(
    node: MarkdownNode,
    options: ConversionOptions,
    warnings: string[],
    errors: string[],
    unsupportedBlocks: string[],
    listType?: 'bulleted' | 'numbered',
): NotionBlockData[] {
    // Extract text content from children if available, otherwise use direct content
    let content: string | MarkdownNode[] = '';

    if (node.children !== null && node.children !== undefined && Array.isArray(node.children)) {
        // Check if first child is a paragraph containing the text content
        const firstChild = node.children[0];
        if (firstChild !== null && firstChild !== undefined && firstChild.type === 'paragraph' && firstChild.children !== null && firstChild.children !== undefined) {
            content = firstChild.children; // Use the paragraph's children for rich text
        } else {
            // Extract text content from all text nodes
            const textNodes = node.children.filter(child => child.type === 'text');
            if (textNodes.length > 0) {
                content = textNodes;
            } else {
                content = node.content ?? '';
            }
        }
    } else {
        content = node.content ?? '';
    }

    // Determine list type
    let type: 'bulleted' | 'numbered' | 'todo' = listType ?? 'bulleted';

    // Check if it's a task list item
    if (node.checked !== undefined) {
        type = 'todo';
    }

    // Convert nested children (skip the first paragraph if it was used for content)
    let childBlocks: NotionBlockData[] = [];
    if (node.children && Array.isArray(node.children)) {
        const blockChildren = node.children.filter((child, index) => {
            // Skip first paragraph if it was used for content
            if (index === 0 && child.type === 'paragraph' && Array.isArray(content)) {
                return false;
            }
            // Include block-level children
            return ['list', 'paragraph', 'code', 'quote'].includes(child.type);
        });

        if (blockChildren.length > 0) {
            childBlocks = convertNodeArray(blockChildren, options, warnings, errors, unsupportedBlocks);
        }
    }

    switch (type) {
        case 'bulleted':
            return [buildBulletedListItemBlock(content, childBlocks)];
        case 'numbered':
            return [buildNumberedListItemBlock(content, childBlocks)];
        case 'todo':
            return [buildToDoBlock(content, node.checked ?? false, childBlocks)];
        default:
            return [buildBulletedListItemBlock(content, childBlocks)];
    }
}

/**
 * Convert code block node
 */
function convertCodeBlock(
    node: MarkdownNode,
    options: ConversionOptions,
    errors: string[],
): NotionBlockData[] {
    const content = node.content ?? '';

    // Validate code block length against Notion's limit
    if (content.length > NOTION_CODE_BLOCK_MAX_CHARACTERS) {
        const error = `Code block exceeds Notion's ${NOTION_CODE_BLOCK_MAX_CHARACTERS} character limit: ${content.length} characters found. Language: ${node.language ?? 'none'}`;
        errors.push(error);
        throw new Error(error);
    }

    return [buildCodeBlock(
        content,
        node.language,
        undefined, // caption - could be extracted from title or alt
    )];
}

/**
 * Convert quote node
 */
function convertQuote(
    node: MarkdownNode,
    options: ConversionOptions,
    warnings: string[],
    errors: string[],
    unsupportedBlocks: string[],
): NotionBlockData[] {
    const content = node.children ?? node.content ?? '';

    // Convert nested children
    let childBlocks: NotionBlockData[] = [];
    if (node.children && Array.isArray(node.children)) {
        childBlocks = convertNodeArray(node.children, options, warnings, errors, unsupportedBlocks);
    }

    return [buildQuoteBlock(content, childBlocks)];
}

/**
 * Convert table node
 */
function convertTable(
    node: MarkdownNode,
    options: ConversionOptions,
    warnings: string[],
): NotionBlockData[] {
    if (!node.children) {
        warnings.push('Table node has no children');
        return [];
    }

    const rows: MarkdownNode[][] = [];

    for (const rowNode of node.children) {
        if (rowNode.type === 'table_row' && rowNode.children) {
            const row: MarkdownNode[] = [];

            for (const cellNode of rowNode.children) {
                if (cellNode.type === 'table_cell') {
                    // Use children for rich text content, fallback to content for plain text
                    if (cellNode.children && cellNode.children.length > 0) {
                        row.push({
                            type: 'table_cell',
                            children: cellNode.children,
                            content: cellNode.content ?? '',
                        });
                    } else {
                        row.push({
                            type: 'table_cell',
                            content: cellNode.content ?? '',
                            children: [],
                        });
                    }
                }
            }

            if (row.length > 0) {
                rows.push(row);
            }
        }
    }

    if (rows.length === 0) {
        warnings.push('Table has no valid rows');
        return [];
    }

    return buildTableBlockFromNodes(rows, options.tableAlignment);
}

/**
 * Convert image node
 */
function convertImage(
    node: MarkdownNode,
    options: ConversionOptions,
    warnings: string[],
): NotionBlockData[] {
    if (node.url === null || node.url === undefined || node.url === '') {
        warnings.push('Image node missing URL');
        return [];
    }

    let imageUrl = node.url;

    // Handle relative URLs
    if (!imageUrl.startsWith('http') && options.imageBaseUrl !== null && options.imageBaseUrl !== undefined && options.imageBaseUrl !== '') {
        imageUrl = `${options.imageBaseUrl.replace(/\/$/, '')}/${imageUrl.replace(/^\//, '')}`;
    }

    // Handle image processing based on options
    switch (options.imageHandling) {
        case 'ignore':
            return [];
        case 'upload':
            warnings.push('Image upload not implemented, using link');
            return [buildImageBlock(imageUrl, node.alt)];
        case 'link':
        default:
            return [buildImageBlock(imageUrl, node.alt)];
    }
}

/**
 * Count total nodes in AST (for statistics)
 */
function countBlocks(nodes: MarkdownNode[]): number {
    let count = 0;

    for (const node of nodes) {
        count++;
        if (node.children) {
            count += countBlocks(node.children);
        }
    }

    return count;
}
