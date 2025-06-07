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

        for (const block of blocks) {
            try {
                const markdown = convertNotionBlock(block, config, warnings, errors, unsupportedBlocks);
                if (markdown) {
                    markdownLines.push(markdown);
                    convertedBlocks++;
                } else {
                    skippedBlocks++;
                }
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
    unsupportedBlocks: string[]
): string | null {
    switch (block.type) {
        case 'paragraph':
            return convertParagraph(block, options);

        case 'heading_1':
        case 'heading_2':
        case 'heading_3':
            return convertHeading(block, options);

        case 'bulleted_list_item':
            return convertBulletedListItem(block, options);

        case 'numbered_list_item':
            return convertNumberedListItem(block, options);

        case 'to_do':
            return convertToDoItem(block, options);

        case 'code':
            return convertCodeBlock(block, options);

        case 'quote':
            return convertQuote(block, options);

        case 'divider':
            return convertDivider(options);

        case 'callout':
            return convertCallout(block, options, warnings);

        case 'toggle':
            return convertToggle(block, options, warnings);

        case 'image':
            return convertImage(block, options, warnings);

        case 'table':
        case 'table_row':
            // Tables are complex - handle at a higher level
            warnings.push('Table conversion not fully implemented');
            return null;

        case 'embed':
            return convertEmbed(block, options);

        case 'bookmark':
            return convertBookmark(block, options);

        default:
            unsupportedBlocks.push(block.type);
            warnings.push(`Unsupported block type: ${block.type}`);

            if (options.handleUnsupportedBlocks === 'convert') {
                return `<!-- Unsupported block type: ${block.type} -->`;
            } else if (options.handleUnsupportedBlocks === 'error') {
                throw new Error(`Unsupported block type: ${block.type}`);
            }

            return null; // ignore
    }
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
    return `${headingPrefix} ${text}`;
}

/**
 * Convert bulleted list item
 */
function convertBulletedListItem(
    block: any,
    options: ConversionOptions
): string {
    const text = convertRichTextToMarkdown(block.bulleted_list_item?.rich_text || [], options);
    const marker = options.listMarker;

    // TODO: Handle nested children
    return `${marker} ${text}`;
}

/**
 * Convert numbered list item
 */
function convertNumberedListItem(
    block: any,
    options: ConversionOptions
): string {
    const text = convertRichTextToMarkdown(block.numbered_list_item?.rich_text || [], options);

    // TODO: Handle proper numbering and nested children
    return `1. ${text}`;
}

/**
 * Convert to-do item
 */
function convertToDoItem(
    block: any,
    options: ConversionOptions
): string {
    const text = convertRichTextToMarkdown(block.to_do?.rich_text || [], options);
    const checked = block.to_do?.checked ? 'x' : ' ';

    return `- [${checked}] ${text}`;
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
