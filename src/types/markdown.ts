/**
 * Markdown processing and conversion type definitions
 */

import { DocumentInfo } from './docs.js';
import { NotionBlock, NotionRichText } from './notion.js';

// Core AST representation
export interface MarkdownNode {
    type: 'heading' | 'paragraph' | 'list' | 'list_item' | 'code' | 'quote' | 'table' | 'table_row' | 'table_cell' | 'image' | 'divider' | 'text';
    content?: string;
    level?: number; // For headings (1-6)
    ordered?: boolean; // For lists
    checked?: boolean; // For task list items
    language?: string; // For code blocks
    url?: string; // For images and links
    alt?: string; // For images
    title?: string; // For images and links
    align?: 'left' | 'center' | 'right'; // For table cells
    children?: MarkdownNode[];
    attributes?: Record<string, any>;
    // Rich text formatting
    bold?: boolean;
    italic?: boolean;
    strikethrough?: boolean;
    code?: boolean; // For inline code
    link?: { url: string; title?: string };
}

// Document metadata extracted from frontmatter
export interface MarkdownMetadata {
    title?: string;
    description?: string;
    tags?: string[];
    categories?: string[];
    author?: string;
    date?: string;
    lastModified?: string;
    frontMatter?: Record<string, any>;
    wordCount?: number;
    headings?: Array<{ level: number; text: string; anchor?: string }>;
}

// Extended document info with content and metadata
export interface MarkdownDocument extends DocumentInfo {
    content: string;
    metadata: MarkdownMetadata;
    lastModified?: Date;
    size?: number;
}

// Conversion configuration options
export interface ConversionOptions {
    // Formatting options
    preserveColors: boolean;
    preserveFormatting: boolean;
    maxHeadingLevel: number; // 1-6, levels above this become text annotations

    // Block handling
    handleUnsupportedBlocks: 'ignore' | 'convert' | 'error';
    convertCallouts: boolean; // Convert Notion callouts to blockquotes
    convertToggles: boolean; // Convert Notion toggles to HTML details

    // Content options
    includeMetadata: boolean;
    extractFrontMatter: boolean;
    preserveImageCaptions: boolean;
    tableAlignment: boolean;

    // Image handling
    imageHandling: 'link' | 'upload' | 'ignore';
    imageBaseUrl?: string;

    // Links and references
    preserveNotionLinks: boolean;
    convertInternalLinks: boolean;
    linkBaseUrl?: string;

    // Output formatting
    lineBreaks: 'lf' | 'crlf' | 'auto';
    indentSize: number;
    codeBlockStyle: 'fenced' | 'indented';
    listMarker: '-' | '*' | '+';
    emphasisMarker: '*' | '_';
}

// Result of a conversion operation
export interface ConversionResult {
    content: any[] | string; // Can be NotionBlock[], NotionBlockData[], or string
    warnings: string[];
    errors: string[];
    metadata: ConversionMetadata;
    sourceDocument?: MarkdownDocument;
    statistics?: ConversionStatistics;
}

// Metadata about the conversion process
export interface ConversionMetadata {
    sourceFormat: 'markdown' | 'notion';
    targetFormat: 'notion' | 'markdown';
    conversionDate: Date;
    toolVersion: string;
    options: ConversionOptions;
    processingTime?: number; // milliseconds
    nodeCount?: number; // Number of nodes processed
}

// Statistics about the conversion
export interface ConversionStatistics {
    totalBlocks: number;
    convertedBlocks: number;
    skippedBlocks: number;
    errorBlocks: number;
    unsupportedBlocks: string[]; // List of unsupported block types encountered
    warnings: string[];
}

// Validation result for markdown content
export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
    metadata?: MarkdownMetadata;
}

export interface ValidationError {
    type: 'syntax' | 'structure' | 'content';
    message: string;
    line?: number;
    column?: number;
    severity: 'error' | 'warning';
}

export interface ValidationWarning {
    type: 'formatting' | 'compatibility' | 'performance' | 'structure' | 'content';
    message: string;
    line?: number;
    suggestion?: string;
}

// Parser configuration
export interface ParserOptions {
    extractMetadata: boolean;
    validateSyntax: boolean;
    includeSourceMap: boolean;
    preserveWhitespace: boolean;
    allowHtml: boolean;
    allowUnsafeHtml: boolean;
}

// Default conversion options
export const DEFAULT_CONVERSION_OPTIONS: ConversionOptions = {
    // Formatting
    preserveColors: false,
    preserveFormatting: true,
    maxHeadingLevel: 3,

    // Block handling
    handleUnsupportedBlocks: 'convert',
    convertCallouts: true,
    convertToggles: true,

    // Content
    includeMetadata: true,
    extractFrontMatter: true,
    preserveImageCaptions: true,
    tableAlignment: true,

    // Images
    imageHandling: 'link',

    // Links
    preserveNotionLinks: true,
    convertInternalLinks: true,

    // Output
    lineBreaks: 'lf',
    indentSize: 2,
    codeBlockStyle: 'fenced',
    listMarker: '-',
    emphasisMarker: '*'
};

// Default parser options
export const DEFAULT_PARSER_OPTIONS: ParserOptions = {
    extractMetadata: true,
    validateSyntax: true,
    includeSourceMap: false,
    preserveWhitespace: false,
    allowHtml: true,
    allowUnsafeHtml: false
}; 