/**
 * Notion to Markdown conversion engine
 */

import { NotionBlock, NotionRichText, NotionColor } from '../types/notion.js';
import { ConversionOptions, ConversionResult, ConversionMetadata, ConversionStatistics, DEFAULT_CONVERSION_OPTIONS } from '../types/markdown.js';
import { NotionBlockData } from './notion-block-builder.js';

/**
 * Convert Notion blocks to Markdown
 */
export function notionBlocksToMarkdown(
    blocks: (NotionBlock | NotionBlockData)[],
    options: Partial<ConversionOptions> = {}
): ConversionResult {
    const config = { ...DEFAULT_CONVERSION_OPTIONS, ...options };
    const startTime = Date.now();

    const warnings: string[] = [];
    const errors: string[] = [];
    const unsupportedBlocks: string[] = [];

    let totalBlocks = blocks.length;
    let convertedBlocks = 0;
    let skippedBlocks = 0;
    let errorBlocks = 0;

    try {
        const markdownLines: string[] = [];

        // Add frontmatter if metadata is included
        if (config.includeMetadata) {
            markdownLines.push('---');
            markdownLines.push(`# Generated: ${new Date().toISOString()}`);
            markdownLines.push('---');
            markdownLines.push('');
        }

        // Process blocks with proper list tracking
        let numberedListCounter = 0;
        let lastBlockType = '';

        for (let i = 0; i < blocks.length; i++) {
            const block = blocks[i];
            try {
                // Track numbered list continuity
                if (block.type === 'numbered_list_item') {
                    if (lastBlockType !== 'numbered_list_item') {
                        numberedListCounter = 1; // Start new list
                    } else {
                        numberedListCounter++; // Continue existing list
                    }
                } else {
                    numberedListCounter = 0; // Reset for non-list items
                }

                const markdown = convertNotionBlock(block, config, warnings, errors, unsupportedBlocks, numberedListCounter);
                if (markdown) {
                    markdownLines.push(markdown);

                    // Add spacing based on block type and what follows
                    const nextBlock = blocks[i + 1];
                    if (nextBlock) {
                        // Always add blank line after numbered list items
                        if (block.type === 'numbered_list_item') {
                            markdownLines.push('');
                        }
                        // Add blank line after headings
                        else if (block.type.startsWith('heading_')) {
                            markdownLines.push('');
                        }
                        // Add blank line before headings (except after another heading)
                        else if (nextBlock.type.startsWith('heading_') && !block.type.startsWith('heading_')) {
                            markdownLines.push('');
                        }
                    }

                    convertedBlocks++;
                } else {
                    skippedBlocks++;
                }

                lastBlockType = block.type;
            } catch (error) {
                errors.push(`Error converting block ${block.type}: ${error}`);
                errorBlocks++;

                if (config.handleUnsupportedBlocks === 'convert') {
                    markdownLines.push(`<!-- Error converting ${block.type} block -->`);
                } else if (config.handleUnsupportedBlocks === 'error') {
                    throw new Error(`Failed to convert ${block.type}: ${error}`);
                }
            }
        }

        const markdown = markdownLines.join(config.lineBreaks === 'crlf' ? '\r\n' : '\n');
        const processingTime = Date.now() - startTime;

        const metadata: ConversionMetadata = {
            sourceFormat: 'notion',
            targetFormat: 'markdown',
            conversionDate: new Date(),
            toolVersion: '1.0.0',
            options: config,
            processingTime,
            nodeCount: totalBlocks
        };

        const statistics: ConversionStatistics = {
            totalBlocks,
            convertedBlocks,
            skippedBlocks,
            errorBlocks,
            unsupportedBlocks: [...new Set(unsupportedBlocks)],
            warnings
        };

        return {
            content: markdown,
            warnings,
            errors,
            metadata,
            statistics
        };
    } catch (error) {
        errors.push(`Conversion failed: ${error}`);
        errorBlocks = totalBlocks;

        return {
            content: '',
            warnings,
            errors,
            metadata: {
                sourceFormat: 'notion',
                targetFormat: 'markdown',
                conversionDate: new Date(),
                toolVersion: '1.0.0',
                options: config,
                processingTime: Date.now() - startTime,
                nodeCount: totalBlocks
            },
            statistics: {
                totalBlocks,
                convertedBlocks: 0,
                skippedBlocks: 0,
                errorBlocks,
                unsupportedBlocks: [...new Set(unsupportedBlocks)],
                warnings
            }
        };
    }
}

/**
 * Convert a single Notion block to markdown
 */
function convertNotionBlock(
    block: NotionBlock | NotionBlockData,
    options: ConversionOptions,
    warnings: string[],
    errors: string[],
    unsupportedBlocks: string[],
    numberedListCounter: number = 0,
    indentLevel: number = 0
): string | null {
    let result = '';

    switch (block.type) {
        case 'paragraph':
            result = convertParagraph(block, options);
            break;

        case 'heading_1':
        case 'heading_2':
        case 'heading_3':
            result = convertHeading(block, options);
            break;

        case 'bulleted_list_item':
            result = convertBulletedListItem(block, options, indentLevel);
            break;

        case 'numbered_list_item':
            result = convertNumberedListItem(block, options, numberedListCounter, indentLevel);
            break;

        case 'to_do':
            result = convertToDoItem(block, options, indentLevel);
            break;

        case 'code':
            result = convertCodeBlock(block, options);
            break;

        case 'quote':
            result = convertQuote(block, options);
            break;

        case 'divider':
            result = convertDivider(options);
            break;

        case 'callout':
            result = convertCallout(block, options, warnings);
            break;

        case 'toggle':
            result = convertToggle(block, options, warnings);
            break;

        case 'image':
            result = convertImage(block, options, warnings);
            break;

        case 'table':
        case 'table_row':
            // Tables are complex - handle at a higher level
            warnings.push('Table conversion not fully implemented');
            return null;

        case 'embed':
            result = convertEmbed(block, options);
            break;

        case 'bookmark':
            result = convertBookmark(block, options);
            break;

        default:
            unsupportedBlocks.push(block.type);
            warnings.push(`Unsupported block type: ${block.type}`);

            if (options.handleUnsupportedBlocks === 'convert') {
                result = `<!-- Unsupported block type: ${block.type} -->`;
            } else if (options.handleUnsupportedBlocks === 'error') {
                throw new Error(`Unsupported block type: ${block.type}`);
            } else {
                return null; // ignore
            }
    }

    // Handle nested children if they exist
    if (block.children && block.children.length > 0) {
        const childrenMarkdown: string[] = [];
        let childNumberedCounter = 0;
        let lastChildType = '';

        for (const child of block.children) {
            // Track numbered list continuity for children
            if (child.type === 'numbered_list_item') {
                if (lastChildType !== 'numbered_list_item') {
                    childNumberedCounter = 1; // Start new list
                } else {
                    childNumberedCounter++; // Continue existing list
                }
            } else {
                childNumberedCounter = 0; // Reset for non-list items
            }

            const childMarkdown = convertNotionBlock(
                child,
                options,
                warnings,
                errors,
                unsupportedBlocks,
                childNumberedCounter,
                indentLevel + 1
            );
            if (childMarkdown) {
                childrenMarkdown.push(childMarkdown);
            }

            lastChildType = child.type;
        }

        if (childrenMarkdown.length > 0) {
            result += '\n' + childrenMarkdown.join('\n');
        }
    }

    return result || null;
}

/**
 * Convert paragraph block
 */
function convertParagraph(
    block: any,
    options: ConversionOptions
): string {
    const text = convertRichTextToMarkdown(block.paragraph?.rich_text || [], options);
    return text || '';
}

/**
 * Convert heading block
 */
function convertHeading(
    block: any,
    options: ConversionOptions
): string {
    const level = getHeadingLevel(block.type);
    const text = convertRichTextToMarkdown(block[block.type]?.rich_text || [], options);

    const headingPrefix = '#'.repeat(level);

    // Create anchor from heading text (lowercase, spaces to hyphens, remove special chars)
    const anchor = text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '') // Remove special characters except hyphens
        .replace(/\s+/g, '-')     // Replace spaces with hyphens
        .replace(/-+/g, '-')      // Replace multiple hyphens with single
        .replace(/^-|-$/g, '');   // Remove leading/trailing hyphens

    // Add heading with anchor comment for positioning reference
    return `${headingPrefix} ${text} {#${anchor}}`;
}

/**
 * Convert bulleted list item
 */
function convertBulletedListItem(
    block: any,
    options: ConversionOptions,
    indentLevel: number
): string {
    const text = convertRichTextToMarkdown(block.bulleted_list_item?.rich_text || [], options);
    const marker = options.listMarker;

    // Use 3 spaces for proper markdown indentation
    const indent = indentLevel === 0 ? '' : '   '.repeat(indentLevel);
    return `${indent}${marker} ${text}`;
}

/**
 * Convert numbered list item
 */
function convertNumberedListItem(
    block: any,
    options: ConversionOptions,
    numberedListIndex: number,
    indentLevel: number
): string {
    const text = convertRichTextToMarkdown(block.numbered_list_item?.rich_text || [], options);

    // Use 3 spaces for proper markdown indentation  
    const indent = indentLevel === 0 ? '' : '   '.repeat(indentLevel);
    return `${indent}${numberedListIndex}. ${text}`;
}

/**
 * Convert to-do item
 */
function convertToDoItem(
    block: any,
    options: ConversionOptions,
    indentLevel: number
): string {
    const text = convertRichTextToMarkdown(block.to_do?.rich_text || [], options);
    const checked = block.to_do?.checked ? 'x' : ' ';

    // Use 3 spaces for proper markdown indentation
    const indent = indentLevel === 0 ? '' : '   '.repeat(indentLevel);
    return `${indent}- [${checked}] ${text}`;
}

/**
 * Convert code block
 */
function convertCodeBlock(
    block: any,
    options: ConversionOptions
): string {
    const code = convertRichTextToMarkdown(block.code?.rich_text || [], options);
    const language = block.code?.language || '';

    if (options.codeBlockStyle === 'fenced') {
        return `\`\`\`${language}\n${code}\n\`\`\``;
    } else {
        // Indented style
        const indentedCode = code
            .split('\n')
            .map(line => '    ' + line)
            .join('\n');
        return indentedCode;
    }
}

/**
 * Convert quote block
 */
function convertQuote(
    block: any,
    options: ConversionOptions
): string {
    const text = convertRichTextToMarkdown(block.quote?.rich_text || [], options);

    return `> ${text}`;
}

/**
 * Convert divider
 */
function convertDivider(options: ConversionOptions): string {
    return '---';
}

/**
 * Convert callout block
 */
function convertCallout(
    block: any,
    options: ConversionOptions,
    warnings: string[]
): string {
    if (!options.convertCallouts) {
        warnings.push('Callout block skipped (convertCallouts disabled)');
        return '';
    }

    const text = convertRichTextToMarkdown(block.callout?.rich_text || [], options);
    const icon = block.callout?.icon?.emoji || '';

    // Convert to blockquote with icon
    return `> ${icon} ${text}`;
}

/**
 * Convert toggle block
 */
function convertToggle(
    block: any,
    options: ConversionOptions,
    warnings: string[]
): string {
    const text = convertRichTextToMarkdown(block.toggle?.rich_text || [], options);

    if (!options.convertToggles) {
        warnings.push('Toggle block converted to paragraph (convertToggles disabled)');
        return text;
    }

    // Convert to HTML details element
    return `<details>\n<summary>${text}</summary>\n\n<!-- Nested content would go here -->\n</details>`;
}

/**
 * Convert image block
 */
function convertImage(
    block: any,
    options: ConversionOptions,
    warnings: string[]
): string {
    const image = block.image;
    if (!image) {
        warnings.push('Image block missing image data');
        return '';
    }

    const url = image.external?.url || image.file?.url || '';
    const caption = convertRichTextToMarkdown(image.caption || [], options);

    if (!url) {
        warnings.push('Image block missing URL');
        return '';
    }

    return `![${caption}](${url})`;
}

/**
 * Convert embed block
 */
function convertEmbed(
    block: any,
    options: ConversionOptions
): string {
    const url = block.embed?.url || '';
    const caption = convertRichTextToMarkdown(block.embed?.caption || [], options);

    // Convert to link with caption
    return caption ? `[${caption}](${url})` : url;
}

/**
 * Convert bookmark block
 */
function convertBookmark(
    block: any,
    options: ConversionOptions
): string {
    const url = block.bookmark?.url || '';
    const caption = convertRichTextToMarkdown(block.bookmark?.caption || [], options);

    return caption ? `[${caption}](${url})` : url;
}

/**
 * Convert Notion rich text to markdown
 */
function convertRichTextToMarkdown(
    richText: NotionRichText[],
    options: ConversionOptions
): string {
    if (!richText || richText.length === 0) {
        return '';
    }

    return richText
        .map(text => convertSingleRichText(text, options))
        .join('');
}

/**
 * Convert a single rich text element to markdown
 */
function convertSingleRichText(
    text: NotionRichText,
    options: ConversionOptions
): string {
    let content = text.plain_text || '';

    if (!content) {
        return '';
    }

    const annotations = text.annotations;

    // Apply formatting
    if (annotations?.code) {
        content = `\`${content}\``;
    }

    if (annotations?.bold) {
        const marker = options.emphasisMarker === '*' ? '**' : '__';
        content = `${marker}${content}${marker}`;
    }

    if (annotations?.italic) {
        const marker = options.emphasisMarker;
        content = `${marker}${content}${marker}`;
    }

    if (annotations?.strikethrough) {
        content = `~~${content}~~`;
    }

    // Handle links
    if (text.href || text.text?.link?.url) {
        const url = text.href || text.text?.link?.url;
        content = `[${content}](${url})`;
    }

    // Handle colors (if preserving)
    if (options.preserveColors && annotations?.color && annotations.color !== 'default') {
        content = `<span style="color: ${getColorValue(annotations.color)}">${content}</span>`;
    }

    return content;
}

/**
 * Get heading level from block type
 */
function getHeadingLevel(blockType: string): number {
    switch (blockType) {
        case 'heading_1': return 1;
        case 'heading_2': return 2;
        case 'heading_3': return 3;
        default: return 1;
    }
}

/**
 * Convert Notion color to CSS color value
 */
function getColorValue(color: NotionColor): string {
    const colorMap: Record<string, string> = {
        'gray': '#9B9A97',
        'brown': '#64473A',
        'orange': '#D9730D',
        'yellow': '#DFAB01',
        'green': '#0F7B6C',
        'blue': '#0B6E99',
        'purple': '#6940A5',
        'pink': '#AD1A72',
        'red': '#E03E3E',
        'default': 'inherit'
    };

    return colorMap[color] || colorMap['default'];
}
