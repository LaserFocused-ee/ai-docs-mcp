/**
 * High-Level Conversion Utilities
 * Main entry points for markdown <-> notion conversions plus helper utilities
 */

import { MarkdownParser } from './markdown-parser.js';
import { markdownASTToNotionBlocks } from './markdown-to-notion.js';
import { notionBlocksToMarkdown } from './notion-to-markdown.js';
import {
    ConversionOptions,
    ConversionResult,
    DEFAULT_CONVERSION_OPTIONS,
} from '../types/markdown.js';
import { NotionBlock } from '../types/notion.js';
import { NotionBlockData } from './notion-blocks.js';

/**
 * Convert markdown content to Notion blocks
 */
export function markdownToNotion(
    markdown: string,
    options: Partial<ConversionOptions> = {},
): ConversionResult {
    try {
        const conversionOptions = {
            ...DEFAULT_CONVERSION_OPTIONS,
            ...options,
        };

        const parser = new MarkdownParser({
            extractMetadata: true,
            validateSyntax: true,
        });

        // Parse markdown to AST
        const ast = parser.parseToAST(markdown);

        // Convert AST to Notion blocks
        const result = markdownASTToNotionBlocks(ast, conversionOptions);

        return result;
    } catch (error) {
        throw new Error(`Markdown to Notion conversion failed: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Convert Notion blocks to markdown
 */
export function notionToMarkdown(
    blocks: (NotionBlock | NotionBlockData)[],
    options: Partial<ConversionOptions> = {},
): ConversionResult {
    try {
        const conversionOptions = {
            ...DEFAULT_CONVERSION_OPTIONS,
            ...options,
        };

        const result = notionBlocksToMarkdown(blocks, conversionOptions);

        return result;
    } catch (error) {
        throw new Error(`Notion to Markdown conversion failed: ${error instanceof Error ? error.message : String(error)}`);
    }
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Parse markdown and extract title
 */
export function extractTitleFromMarkdown(markdown: string): string | null {
    const parser = new MarkdownParser({
        extractMetadata: true,
        validateSyntax: true,
    });

    const doc = parser.parseDocument(markdown, 'temp.md');
    return doc.metadata.title ?? null;
}

/**
 * Extract page title from Notion page properties
 */
export function extractPageTitle(page: { properties?: Record<string, unknown> }): string {
    const properties = page.properties ?? {};

    // Find the property with type "title"
    for (const [_propertyName, property] of Object.entries(properties)) {
        const typedProperty = property as { type?: string; title?: Array<{ text?: { content?: string } }> };
        if (typedProperty?.type === 'title') {
            const titleContent = typedProperty.title?.[0]?.text?.content;
            if (titleContent !== null && titleContent !== undefined && titleContent.length > 0) {
                return titleContent;
            }
        }
    }

    // Fallback to common property names
    const titleProperty = (properties.title ?? properties.Title ?? properties.Name) as { title?: Array<{ text?: { content?: string } }> } | undefined;
    return titleProperty?.title?.[0]?.text?.content ?? 'Untitled';
}

/**
 * Validate markdown content
 */
export function validateMarkdown(content: string): { isValid: boolean; errors: string[]; warnings: string[] } {
    try {
        const parser = new MarkdownParser({
            extractMetadata: true,
            validateSyntax: true,
        });

        const _document = parser.parseDocument(content, 'temp.md');

        const errors: string[] = [];
        const warnings: string[] = [];

        // Basic validation
        if (!content || content.trim().length === 0) {
            errors.push('Content is empty');
        }

        if (content.length > 100000) { // 100KB limit
            warnings.push('Content is very large and may cause performance issues');
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
        };
    } catch (error) {
        return {
            isValid: false,
            errors: [`Parsing failed: ${error instanceof Error ? error.message : String(error)}`],
            warnings: [],
        };
    }
}

/**
 * Extract headings from markdown content
 */
export function extractHeadings(markdown: string): Array<{ level: number; text: string; anchor: string }> {
    const parser = new MarkdownParser({
        extractMetadata: true,
        validateSyntax: true,
    });

    const doc = parser.parseDocument(markdown, 'temp.md');
    return (doc.metadata.headings ?? []).map(h => ({ ...h, anchor: h.anchor ?? '' }));
}

/**
 * Calculate word count from markdown content
 */
export function getWordCount(markdown: string): number {
    return markdown
        .replace(/[#*`_[\]()]/g, '') // Remove markdown syntax
        .split(/\s+/)
        .filter(word => word.length > 0).length;
}

/**
 * Check if content contains frontmatter
 */
export function hasFrontmatter(markdown: string): boolean {
    return /^---\s*\n[\s\S]*?\n---\s*\n/.test(markdown);
}

/**
 * Remove frontmatter from markdown content
 */
export function removeFrontmatter(markdown: string): string {
    return markdown.replace(/^---\s*\n[\s\S]*?\n---\s*\n/, '').trim();
}

/**
 * Extract frontmatter as object
 */
export function extractFrontmatter(markdown: string): Record<string, string | string[]> {
    const frontMatterMatch = markdown.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);

    if (!frontMatterMatch) {
        return {};
    }

    const frontMatter: Record<string, string | string[]> = {};
    const yamlContent = frontMatterMatch[1];

    if (yamlContent) {
        yamlContent.split('\n').forEach(line => {
            const match = line.match(/^(\w+):\s*(.+)$/);
            if (match) {
                const [, key, value] = match;
                if (key && value) {
                    // Handle arrays (simple case)
                    if (value.startsWith('[') && value.endsWith(']')) {
                        frontMatter[key] = value.slice(1, -1).split(',').map(s => s.trim().replace(/['"]/g, ''));
                    } else {
                        frontMatter[key] = value.replace(/['"]/g, '');
                    }
                }
            }
        });
    }

    return frontMatter;
}
