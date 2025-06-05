/**
 * Notion block builder utilities
 * Creates properly formatted Notion blocks from content
 */

import { NotionBlock, NotionRichText, NotionColor } from '../types/notion.js';
import { MarkdownNode } from '../types/markdown.js';

// Type for building blocks (without server-generated metadata)
export interface NotionBlockData {
    object: 'block';
    type: string;
    [key: string]: any; // Type-specific properties
}

/**
 * Create rich text array from plain text with optional formatting
 */
export function createRichText(
    content: string,
    formatting?: {
        bold?: boolean;
        italic?: boolean;
        strikethrough?: boolean;
        code?: boolean;
        color?: NotionColor;
        link?: { url: string };
    }
): NotionRichText[] {
    if (!content) return [];

    const richText: NotionRichText = {
        type: 'text',
        text: {
            content,
            link: formatting?.link || null
        },
        annotations: {
            bold: formatting?.bold || false,
            italic: formatting?.italic || false,
            strikethrough: formatting?.strikethrough || false,
            underline: false,
            code: formatting?.code || false,
            color: formatting?.color || 'default'
        },
        plain_text: content,
        href: formatting?.link?.url || null
    };

    return [richText];
}

/**
 * Create rich text from markdown nodes with formatting
 */
export function createRichTextFromNodes(nodes: MarkdownNode[]): NotionRichText[] {
    const richTextArray: NotionRichText[] = [];

    for (const node of nodes) {
        if (node.type === 'text' && node.content) {
            const formatting = {
                bold: node.bold,
                italic: node.italic,
                strikethrough: node.strikethrough,
                code: node.code,
                link: node.link
            };

            richTextArray.push(...createRichText(node.content, formatting));
        }
    }

    return richTextArray.length > 0 ? richTextArray : createRichText('');
}

/**
 * Build a paragraph block
 */
export function buildParagraphBlock(
    content: string | MarkdownNode[],
    formatting?: { color?: NotionColor }
): NotionBlockData {
    const richText = typeof content === 'string'
        ? createRichText(content, formatting)
        : createRichTextFromNodes(content);

    return {
        object: 'block',
        type: 'paragraph',
        paragraph: {
            rich_text: richText,
            color: formatting?.color || 'default'
        }
    };
}

/**
 * Build a heading block (H1, H2, or H3)
 */
export function buildHeadingBlock(
    content: string | MarkdownNode[],
    level: 1 | 2 | 3,
    formatting?: { color?: NotionColor }
): NotionBlockData {
    const richText = typeof content === 'string'
        ? createRichText(content, formatting)
        : createRichTextFromNodes(content);

    const headingType = `heading_${level}` as 'heading_1' | 'heading_2' | 'heading_3';

    return {
        object: 'block',
        type: headingType,
        [headingType]: {
            rich_text: richText,
            color: formatting?.color || 'default',
            is_toggleable: false
        }
    };
}

/**
 * Build a bulleted list item block
 */
export function buildBulletedListItemBlock(
    content: string | MarkdownNode[],
    children?: NotionBlockData[],
    formatting?: { color?: NotionColor }
): NotionBlockData {
    const richText = typeof content === 'string'
        ? createRichText(content, formatting)
        : createRichTextFromNodes(content);

    return {
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
            rich_text: richText,
            color: formatting?.color || 'default',
            children: children || []
        }
    };
}

/**
 * Build a numbered list item block
 */
export function buildNumberedListItemBlock(
    content: string | MarkdownNode[],
    children?: NotionBlockData[],
    formatting?: { color?: NotionColor }
): NotionBlockData {
    const richText = typeof content === 'string'
        ? createRichText(content, formatting)
        : createRichTextFromNodes(content);

    return {
        object: 'block',
        type: 'numbered_list_item',
        numbered_list_item: {
            rich_text: richText,
            color: formatting?.color || 'default',
            children: children || []
        }
    };
}

/**
 * Build a to-do list item block (for task lists)
 */
export function buildToDoBlock(
    content: string | MarkdownNode[],
    checked: boolean = false,
    children?: NotionBlockData[],
    formatting?: { color?: NotionColor }
): NotionBlockData {
    const richText = typeof content === 'string'
        ? createRichText(content, formatting)
        : createRichTextFromNodes(content);

    return {
        object: 'block',
        type: 'to_do',
        to_do: {
            rich_text: richText,
            checked,
            color: formatting?.color || 'default',
            children: children || []
        }
    };
}

/**
 * Build a code block
 */
export function buildCodeBlock(
    code: string,
    language?: string,
    caption?: string
): NotionBlockData {
    return {
        object: 'block',
        type: 'code',
        code: {
            caption: caption ? createRichText(caption) : [],
            rich_text: createRichText(code),
            language: language || 'plain text'
        }
    };
}

/**
 * Build a quote block
 */
export function buildQuoteBlock(
    content: string | MarkdownNode[],
    children?: NotionBlockData[],
    formatting?: { color?: NotionColor }
): NotionBlockData {
    const richText = typeof content === 'string'
        ? createRichText(content, formatting)
        : createRichTextFromNodes(content);

    return {
        object: 'block',
        type: 'quote',
        quote: {
            rich_text: richText,
            color: formatting?.color || 'default',
            children: children || []
        }
    };
}

/**
 * Build a divider block (horizontal rule)
 */
export function buildDividerBlock(): NotionBlockData {
    return {
        object: 'block',
        type: 'divider',
        divider: {}
    };
}

/**
 * Build a callout block (used for special formatting)
 */
export function buildCalloutBlock(
    content: string | MarkdownNode[],
    icon?: string,
    color?: NotionColor,
    children?: NotionBlockData[]
): NotionBlockData {
    const richText = typeof content === 'string'
        ? createRichText(content)
        : createRichTextFromNodes(content);

    return {
        object: 'block',
        type: 'callout',
        callout: {
            rich_text: richText,
            icon: icon ? {
                type: 'emoji',
                emoji: icon
            } : {
                type: 'emoji',
                emoji: '💡'
            },
            color: color || 'default',
            children: children || []
        }
    };
}

/**
 * Build a toggle block (collapsible content)
 */
export function buildToggleBlock(
    content: string | MarkdownNode[],
    children?: NotionBlockData[],
    formatting?: { color?: NotionColor }
): NotionBlockData {
    const richText = typeof content === 'string'
        ? createRichText(content)
        : createRichTextFromNodes(content);

    return {
        object: 'block',
        type: 'toggle',
        toggle: {
            rich_text: richText,
            color: formatting?.color || 'default',
            children: children || []
        }
    };
}

/**
 * Build a table block
 * Note: Notion tables require separate table and table_row blocks
 */
export function buildTableBlock(
    rows: string[][],
    hasColumnHeader: boolean = true,
    hasRowHeader: boolean = false
): NotionBlockData[] {
    if (rows.length === 0) return [];

    const tableWidth = rows[0].length;

    // Create the table block
    const tableBlock: NotionBlockData = {
        object: 'block',
        type: 'table',
        table: {
            table_width: tableWidth,
            has_column_header: hasColumnHeader,
            has_row_header: hasRowHeader,
            children: []
        }
    };

    // Create table row blocks
    const tableRows: NotionBlockData[] = rows.map(row => {
        const cells = row.map(cellContent => createRichText(cellContent));

        return {
            object: 'block',
            type: 'table_row',
            table_row: {
                cells
            }
        };
    });

    return [tableBlock, ...tableRows];
}

/**
 * Build an image block
 */
export function buildImageBlock(
    url: string,
    caption?: string
): NotionBlockData {
    const isExternal = url.startsWith('http://') || url.startsWith('https://');

    return {
        object: 'block',
        type: 'image',
        image: {
            type: isExternal ? 'external' : 'file',
            [isExternal ? 'external' : 'file']: {
                url: url
            },
            caption: caption ? createRichText(caption) : []
        }
    };
}

/**
 * Build an embed block
 */
export function buildEmbedBlock(url: string, caption?: string): NotionBlockData {
    return {
        object: 'block',
        type: 'embed',
        embed: {
            url,
            caption: caption ? createRichText(caption) : []
        }
    };
}

/**
 * Build a bookmark block
 */
export function buildBookmarkBlock(url: string, caption?: string): NotionBlockData {
    return {
        object: 'block',
        type: 'bookmark',
        bookmark: {
            url,
            caption: caption ? createRichText(caption) : []
        }
    };
}

/**
 * Utility function to determine appropriate list block type
 */
export function buildListItemBlock(
    content: string | MarkdownNode[],
    listType: 'bulleted' | 'numbered' | 'todo',
    checked?: boolean,
    children?: NotionBlockData[],
    formatting?: { color?: NotionColor }
): NotionBlockData {
    switch (listType) {
        case 'bulleted':
            return buildBulletedListItemBlock(content, children, formatting);
        case 'numbered':
            return buildNumberedListItemBlock(content, children, formatting);
        case 'todo':
            return buildToDoBlock(content, checked || false, children, formatting);
        default:
            return buildBulletedListItemBlock(content, children, formatting);
    }
}

/**
 * Utility function to normalize heading levels for Notion (max H3)
 */
export function normalizeHeadingLevel(level: number): 1 | 2 | 3 {
    if (level <= 1) return 1;
    if (level === 2) return 2;
    return 3; // H4, H5, H6 all become H3 in Notion
}

/**
 * Create a fallback block for unsupported content
 */
export function buildFallbackBlock(
    content: string,
    originalType?: string
): NotionBlockData {
    const fallbackContent = originalType
        ? `[Unsupported ${originalType}]: ${content}`
        : content;

    return buildParagraphBlock(fallbackContent, { color: 'gray' });
} 