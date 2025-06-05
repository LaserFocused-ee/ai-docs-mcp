/**
 * Markdown parser wrapper using remark ecosystem
 */

import { remark } from 'remark';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import remarkFrontmatter from 'remark-frontmatter';
import matter from 'gray-matter';
import type { Root, Content, Text, Heading, Paragraph, List, ListItem, Code, Blockquote, Table, TableRow, TableCell, Image, ThematicBreak } from 'mdast';

import {
    MarkdownNode,
    MarkdownDocument,
    MarkdownMetadata,
    ParserOptions,
    ValidationResult,
    ValidationError,
    ValidationWarning,
    DEFAULT_PARSER_OPTIONS
} from '../types/markdown.js';
import { DocumentInfo } from '../types/docs.js';

/**
 * Markdown parser class using remark
 */
export class MarkdownParser {
    private processor: any;

    constructor(options: Partial<ParserOptions> = {}) {
        const config = { ...DEFAULT_PARSER_OPTIONS, ...options };

        this.processor = remark()
            .use(remarkParse);

        if (config.extractMetadata) {
            this.processor.use(remarkFrontmatter, ['yaml', 'toml']);
        }
    }

    /**
     * Parse markdown content into our custom AST format
     */
    parseToAST(content: string): MarkdownNode[] {
        try {
            const tree = this.processor.parse(content) as Root;
            return this.convertMdastToMarkdownNodes(tree.children);
        } catch (error) {
            console.error('Error parsing markdown:', error);
            throw new Error(`Failed to parse markdown: ${error}`);
        }
    }

    /**
     * Parse markdown file into MarkdownDocument
     */
    parseDocument(content: string, filePath: string): MarkdownDocument {
        try {
            // Extract frontmatter with gray-matter
            const { data: frontMatter, content: bodyContent } = matter(content);

            // Parse the markdown content
            const ast = this.parseToAST(bodyContent);

            // Extract metadata
            const metadata = this.extractMetadata(frontMatter, bodyContent, ast);

            // Create document info
            const documentInfo: DocumentInfo = {
                name: this.getFileNameFromPath(filePath),
                category: this.getCategoryFromPath(filePath),
                path: filePath
            };

            return {
                ...documentInfo,
                content: bodyContent,
                metadata,
                lastModified: new Date(),
                size: content.length
            };
        } catch (error) {
            console.error('Error parsing document:', error);
            throw new Error(`Failed to parse document: ${filePath}`);
        }
    }

    /**
     * Validate markdown content
     */
    validate(content: string): ValidationResult {
        const errors: ValidationError[] = [];
        const warnings: ValidationWarning[] = [];
        let metadata: MarkdownMetadata | undefined;

        try {
            // Parse frontmatter
            const { data: frontMatter, content: bodyContent } = matter(content);

            // Try to parse the markdown
            const ast = this.parseToAST(bodyContent);
            metadata = this.extractMetadata(frontMatter, bodyContent, ast);

            // Validation checks
            this.validateStructure(ast, errors, warnings);
            this.validateContent(content, errors, warnings);

        } catch (error) {
            errors.push({
                type: 'syntax',
                message: `Parse error: ${error}`,
                severity: 'error'
            });
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            metadata
        };
    }

    /**
     * Convert remark MDAST nodes to our MarkdownNode format
     */
    private convertMdastToMarkdownNodes(nodes: Content[]): MarkdownNode[] {
        return nodes.map(node => this.convertMdastNode(node)).filter(Boolean) as MarkdownNode[];
    }

    /**
     * Convert a single MDAST node to MarkdownNode
     */
    private convertMdastNode(node: Content): MarkdownNode | null {
        switch (node.type) {
            case 'heading':
                const heading = node as Heading;
                return {
                    type: 'heading',
                    level: heading.depth,
                    content: this.extractTextContent(heading.children),
                    children: this.convertInlineNodes(heading.children)
                };

            case 'paragraph':
                const paragraph = node as Paragraph;
                return {
                    type: 'paragraph',
                    content: this.extractTextContent(paragraph.children),
                    children: this.convertInlineNodes(paragraph.children)
                };

            case 'list':
                const list = node as List;
                return {
                    type: 'list',
                    ordered: list.ordered || false,
                    children: this.convertMdastToMarkdownNodes(list.children)
                };

            case 'listItem':
                const listItem = node as ListItem;
                return {
                    type: 'list_item',
                    checked: listItem.checked || undefined,
                    children: this.convertMdastToMarkdownNodes(listItem.children)
                };

            case 'code':
                const code = node as Code;
                return {
                    type: 'code',
                    content: code.value,
                    language: code.lang || undefined
                };

            case 'blockquote':
                const blockquote = node as Blockquote;
                return {
                    type: 'quote',
                    children: this.convertMdastToMarkdownNodes(blockquote.children)
                };

            case 'table':
                const table = node as Table;
                return {
                    type: 'table',
                    children: this.convertMdastToMarkdownNodes(table.children)
                };

            case 'tableRow':
                const tableRow = node as TableRow;
                return {
                    type: 'table_row',
                    children: this.convertMdastToMarkdownNodes(tableRow.children)
                };

            case 'tableCell':
                const tableCell = node as TableCell;
                return {
                    type: 'table_cell',
                    content: this.extractTextContent(tableCell.children),
                    children: this.convertInlineNodes(tableCell.children)
                };

            case 'image':
                const image = node as Image;
                return {
                    type: 'image',
                    url: image.url,
                    alt: image.alt || undefined,
                    title: image.title || undefined
                };

            case 'thematicBreak':
                return {
                    type: 'divider'
                };

            case 'text':
                const text = node as Text;
                return {
                    type: 'text',
                    content: text.value
                };

            default:
                console.warn(`Unsupported node type: ${node.type}`);
                return null;
        }
    }

    /**
     * Convert inline nodes (for rich text)
     */
    private convertInlineNodes(nodes: any[]): MarkdownNode[] {
        return nodes.map(node => {
            if (node.type === 'text') {
                return { type: 'text' as const, content: node.value };
            } else if (node.type === 'strong') {
                return {
                    type: 'text' as const,
                    content: this.extractTextContent(node.children),
                    bold: true
                };
            } else if (node.type === 'emphasis') {
                return {
                    type: 'text' as const,
                    content: this.extractTextContent(node.children),
                    italic: true
                };
            } else if (node.type === 'delete') {
                return {
                    type: 'text' as const,
                    content: this.extractTextContent(node.children),
                    strikethrough: true
                };
            } else if (node.type === 'inlineCode') {
                return {
                    type: 'text' as const,
                    content: node.value,
                    code: true
                };
            } else if (node.type === 'link') {
                return {
                    type: 'text' as const,
                    content: this.extractTextContent(node.children),
                    link: {
                        url: node.url,
                        title: node.title
                    }
                };
            }

            return { type: 'text' as const, content: node.value || '' };
        });
    }

    /**
     * Extract plain text content from node children
     */
    private extractTextContent(children: any[]): string {
        return children
            .map(child => {
                if (child.type === 'text') return child.value;
                if (child.children) return this.extractTextContent(child.children);
                return '';
            })
            .join('');
    }

    /**
     * Extract metadata from frontmatter and content
     */
    private extractMetadata(frontMatter: any, content: string, ast: MarkdownNode[]): MarkdownMetadata {
        // Extract headings from AST
        const headings = ast
            .filter(node => node.type === 'heading')
            .map(node => ({
                level: node.level || 1,
                text: node.content || '',
                anchor: (node.content || '').toLowerCase().replace(/[^a-z0-9]/g, '-')
            }));

        // Calculate word count
        const wordCount = content
            .replace(/[#*`_\[\]()]/g, '')
            .split(/\s+/)
            .filter(word => word.length > 0).length;

        return {
            title: frontMatter.title || headings[0]?.text,
            description: frontMatter.description,
            tags: Array.isArray(frontMatter.tags) ? frontMatter.tags : (frontMatter.tags ? [frontMatter.tags] : []),
            categories: Array.isArray(frontMatter.categories) ? frontMatter.categories : (frontMatter.category ? [frontMatter.category] : []),
            author: frontMatter.author,
            date: frontMatter.date,
            lastModified: new Date().toISOString(),
            frontMatter,
            wordCount,
            headings
        };
    }

    /**
     * Validate document structure
     */
    private validateStructure(ast: MarkdownNode[], errors: ValidationError[], warnings: ValidationWarning[]): void {
        let hasH1 = false;
        let lastHeadingLevel = 0;

        for (const node of ast) {
            if (node.type === 'heading') {
                if (node.level === 1) {
                    if (hasH1) {
                        warnings.push({
                            type: 'structure',
                            message: 'Multiple H1 headings found. Consider using only one H1 per document.',
                            suggestion: 'Use H2-H6 for subsequent sections'
                        });
                    }
                    hasH1 = true;
                }

                // Check heading hierarchy
                if (lastHeadingLevel > 0 && node.level && node.level > lastHeadingLevel + 1) {
                    warnings.push({
                        type: 'structure',
                        message: `Heading level skipped: H${lastHeadingLevel} followed by H${node.level}`,
                        suggestion: 'Use sequential heading levels for better document structure'
                    });
                }

                lastHeadingLevel = node.level || 1;
            }
        }

        if (!hasH1) {
            warnings.push({
                type: 'structure',
                message: 'No H1 heading found',
                suggestion: 'Consider adding a main title with # at the beginning'
            });
        }
    }

    /**
     * Validate content quality
     */
    private validateContent(content: string, errors: ValidationError[], warnings: ValidationWarning[]): void {
        // Check for very short content
        if (content.trim().length < 50) {
            warnings.push({
                type: 'content',
                message: 'Document appears to be very short',
                suggestion: 'Consider adding more detailed content'
            });
        }

        // Check for broken links (basic patterns)
        const brokenLinkPattern = /\[([^\]]*)\]\(\s*\)/g;
        if (brokenLinkPattern.test(content)) {
            errors.push({
                type: 'content',
                message: 'Empty link URLs detected',
                severity: 'warning'
            });
        }
    }

    /**
     * Get filename from path
     */
    private getFileNameFromPath(filePath: string): string {
        return filePath.split('/').pop()?.replace(/\.md$/, '') || 'untitled';
    }

    /**
     * Get category from path
     */
    private getCategoryFromPath(filePath: string): string {
        const parts = filePath.split('/');
        return parts.length > 1 ? parts[parts.length - 2] : 'general';
    }
} 