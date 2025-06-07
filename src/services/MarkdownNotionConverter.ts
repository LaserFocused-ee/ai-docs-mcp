/**
 * MarkdownNotionConverter Service
 * High-level service for bidirectional conversion between Markdown and Notion
 */

import { NotionService } from './NotionService.js';
import { MarkdownParser } from '../utils/markdown-parser.js';
import { markdownASTToNotionBlocks } from '../utils/markdown-to-notion.js';
import { notionBlocksToMarkdown } from '../utils/notion-to-markdown.js';
import { readMarkdownFile, writeMarkdownFile, validateFilePath, getMarkdownMetadata } from '../utils/docs.js';
import {
    ConversionOptions,
    ConversionResult,
    MarkdownDocument,
    MarkdownMetadata,
    DEFAULT_CONVERSION_OPTIONS
} from '../types/markdown.js';
import { NotionBlock, NotionPage } from '../types/notion.js';
import { NotionBlockData } from '../utils/notion-block-builder.js';
import path from 'path';

export interface ConverterConfig {
    notionToken: string;
    defaultParentId?: string; // Default database or page ID for new pages
    defaultConversionOptions?: Partial<ConversionOptions>;
    maxFileSize?: number; // Maximum file size in bytes
    allowedExtensions?: string[]; // Allowed file extensions
    workspaceRoot?: string; // Base directory for file operations
}

export interface ConversionJob {
    id: string;
    type: 'markdown-to-notion' | 'notion-to-markdown';
    status: 'pending' | 'processing' | 'completed' | 'failed';
    sourceFile?: string;
    targetFile?: string;
    pageId?: string;
    parentId?: string;
    result?: ConversionResult;
    error?: string;
    createdAt: Date;
    completedAt?: Date;
}

/**
 * MarkdownNotionConverter - Main service for handling conversions
 */
export class MarkdownNotionConverter {
    private notionService: NotionService;
    private parser: MarkdownParser;
    private config: ConverterConfig;
    private jobs: Map<string, ConversionJob> = new Map();

    constructor(config: ConverterConfig) {
        this.config = {
            maxFileSize: 10 * 1024 * 1024, // 10MB default
            allowedExtensions: ['.md', '.markdown'],
            workspaceRoot: process.cwd(),
            ...config
        };

        this.notionService = new NotionService({
            token: config.notionToken
        });

        this.parser = new MarkdownParser({
            extractMetadata: true,
            validateSyntax: true
        });
    }

    /**
     * Convert markdown content to Notion blocks
     */
    async markdownToNotion(
        markdown: string,
        options: Partial<ConversionOptions> = {}
    ): Promise<ConversionResult> {
        try {
            const conversionOptions = {
                ...DEFAULT_CONVERSION_OPTIONS,
                ...this.config.defaultConversionOptions,
                ...options
            };

            // Parse markdown to AST
            const ast = this.parser.parseToAST(markdown);

            // Convert AST to Notion blocks
            const result = markdownASTToNotionBlocks(ast, conversionOptions);

            return result;
        } catch (error) {
            throw new Error(`Markdown to Notion conversion failed: ${error}`);
        }
    }

    /**
     * Convert Notion blocks to markdown
     */
    async notionToMarkdown(
        blocks: (NotionBlock | NotionBlockData)[],
        options: Partial<ConversionOptions> = {}
    ): Promise<ConversionResult> {
        try {
            const conversionOptions = {
                ...DEFAULT_CONVERSION_OPTIONS,
                ...this.config.defaultConversionOptions,
                ...options
            };

            const result = notionBlocksToMarkdown(blocks, conversionOptions);

            return result;
        } catch (error) {
            throw new Error(`Notion to Markdown conversion failed: ${error}`);
        }
    }

    /**
 * Create a Notion page from markdown content
 */
    async createPageFromMarkdown(
        markdown: string,
        parentId: string,
        pageTitle?: string,
        options: Partial<ConversionOptions> = {},
        metadata?: {
            category?: string;
            tags?: string[];
            description?: string;
            status?: string;
        }
    ): Promise<{ page: NotionPage; conversionResult: ConversionResult }> {
        try {
            // Convert markdown to blocks
            const conversionResult = await this.markdownToNotion(markdown, options);

            if (conversionResult.errors.length > 0) {
                console.warn('Conversion warnings:', conversionResult.warnings);
            }

            const blocks = conversionResult.content as NotionBlockData[];

            // Extract title from markdown if not provided
            if (!pageTitle && conversionResult.metadata) {
                const doc = this.parser.parseDocument(markdown, 'temp.md');
                pageTitle = doc.metadata.title || 'Untitled';
            }

            // Create page in database (parentId must be a database ID)
            const parent = { type: 'database_id' as const, database_id: parentId };

            // Build page properties
            const properties: any = {
                title: {
                    title: [
                        {
                            text: {
                                content: pageTitle || 'Untitled'
                            }
                        }
                    ]
                }
            };

            // Ensure database has required properties if metadata is provided
            if (metadata && Object.keys(metadata).length > 0) {
                await this.ensureDatabaseProperties(parentId);
            }

            // Add metadata properties if provided
            if (metadata?.category) {
                properties.Category = {
                    select: { name: metadata.category }
                };
            }

            if (metadata?.tags && metadata.tags.length > 0) {
                properties.Tags = {
                    multi_select: metadata.tags.map(tag => ({ name: tag }))
                };
            }

            if (metadata?.description) {
                properties.Description = {
                    rich_text: [
                        {
                            text: { content: metadata.description }
                        }
                    ]
                };
            }

            if (metadata?.status) {
                properties.Status = {
                    select: { name: metadata.status }
                };
            }

            // Create the page with metadata
            const page = await this.notionService.createPage({
                parent,
                properties
            });

            if (metadata) {
                console.log('✅ Page created with metadata:', {
                    category: metadata.category,
                    tags: metadata.tags,
                    description: metadata.description,
                    status: metadata.status
                });
            }

            // Add blocks to the page if any
            if (blocks.length > 0) {
                await this.notionService.appendBlockChildren(page.id, {
                    children: blocks
                });
            }

            return { page, conversionResult };
        } catch (error) {
            throw new Error(`Failed to create page from markdown: ${error}`);
        }
    }

    /**
 * Export a Notion page to markdown
 */
    async exportPageToMarkdown(
        pageId: string,
        options: Partial<ConversionOptions> = {}
    ): Promise<{ markdown: string; page: NotionPage; conversionResult: ConversionResult }> {
        try {
            // Get the page details
            const page = await this.notionService.getPage(pageId);

            // Get all page blocks recursively to include nested content
            const blocks = await this.notionService.getAllBlocksRecursively(pageId);

            // Convert to markdown
            const conversionResult = await this.notionToMarkdown(blocks, options);
            const markdown = conversionResult.content as string;

            return { markdown, page, conversionResult };
        } catch (error) {
            throw new Error(`Failed to export page to markdown: ${error}`);
        }
    }

    /**
     * Create a Notion page from a markdown file
     */
    async createPageFromFile(
        filePath: string,
        parentId: string,
        options: Partial<ConversionOptions> = {},
        additionalMetadata?: {
            category?: string;
            tags?: string[];
            description?: string;
            status?: string;
        }
    ): Promise<{ page: NotionPage; conversionResult: ConversionResult; document: MarkdownDocument }> {
        try {
            // Validate file path
            if (!validateFilePath(filePath)) {
                throw new Error(`Invalid file path: ${filePath}`);
            }

            // Check file size
            const resolvedPath = path.resolve(this.config.workspaceRoot!, filePath);

            // Read and parse the file
            const content = await readMarkdownFile(resolvedPath);
            const document = this.parser.parseDocument(content, filePath);

            // Validate file size
            if (this.config.maxFileSize && document.size! > this.config.maxFileSize) {
                throw new Error(`File too large: ${document.size} bytes (max: ${this.config.maxFileSize})`);
            }

            // Extract metadata automatically from file path and content
            const autoMetadata = this.extractMetadataFromFile(filePath, document);

            // Merge with any additional metadata provided
            const finalMetadata = {
                ...autoMetadata,
                ...additionalMetadata
            };

            // Create page from content
            const { page, conversionResult } = await this.createPageFromMarkdown(
                content,
                parentId,
                document.metadata.title,
                options,
                finalMetadata
            );

            return { page, conversionResult, document };
        } catch (error) {
            throw new Error(`Failed to create page from file ${filePath}: ${error}`);
        }
    }

    /**
     * Export a Notion page to a markdown file
     */
    async exportPageToFile(
        pageId: string,
        filePath: string,
        options: Partial<ConversionOptions> = {}
    ): Promise<{ document: MarkdownDocument; conversionResult: ConversionResult }> {
        try {
            // Validate file path
            if (!validateFilePath(filePath)) {
                throw new Error(`Invalid file path: ${filePath}`);
            }

            const resolvedPath = path.resolve(this.config.workspaceRoot!, filePath);

            // Export page to markdown
            const { markdown, page, conversionResult } = await this.exportPageToMarkdown(pageId, options);

            // Add frontmatter with page metadata
            const frontmatter = this.createFrontmatterFromPage(page, options);
            const fullMarkdown = frontmatter ? `${frontmatter}\n\n${markdown}` : markdown;

            // Write to file
            await writeMarkdownFile(resolvedPath, fullMarkdown);

            // Create document representation
            const document = this.parser.parseDocument(fullMarkdown, filePath);

            return { document, conversionResult };
        } catch (error) {
            throw new Error(`Failed to export page to file ${filePath}: ${error}`);
        }
    }

    /**
     * Create a conversion job for async processing
     */
    async createConversionJob(
        type: ConversionJob['type'],
        options: {
            sourceFile?: string;
            targetFile?: string;
            pageId?: string;
            parentId?: string;
            conversionOptions?: Partial<ConversionOptions>;
        }
    ): Promise<ConversionJob> {
        const job: ConversionJob = {
            id: this.generateJobId(),
            type,
            status: 'pending',
            sourceFile: options.sourceFile,
            targetFile: options.targetFile,
            pageId: options.pageId,
            parentId: options.parentId,
            createdAt: new Date()
        };

        this.jobs.set(job.id, job);

        // Process job asynchronously
        this.processJob(job, options.conversionOptions).catch(error => {
            job.status = 'failed';
            job.error = error.message;
            job.completedAt = new Date();
        });

        return job;
    }

    /**
     * Get conversion job status
     */
    getJob(jobId: string): ConversionJob | undefined {
        return this.jobs.get(jobId);
    }

    /**
     * Get all jobs
     */
    getAllJobs(): ConversionJob[] {
        return Array.from(this.jobs.values());
    }

    /**
     * Validate markdown content
     */
    validateMarkdown(content: string): { isValid: boolean; errors: string[]; warnings: string[] } {
        try {
            const result = this.parser.validate(content);
            return {
                isValid: result.isValid,
                errors: result.errors.map(e => e.message),
                warnings: result.warnings.map(w => w.message)
            };
        } catch (error) {
            return {
                isValid: false,
                errors: [`Validation failed: ${error}`],
                warnings: []
            };
        }
    }

    /**
     * Parse markdown file and extract metadata
     */
    async parseMarkdownFile(filePath: string): Promise<MarkdownDocument> {
        if (!validateFilePath(filePath)) {
            throw new Error(`Invalid file path: ${filePath}`);
        }

        const resolvedPath = path.resolve(this.config.workspaceRoot!, filePath);
        const content = await readMarkdownFile(resolvedPath);

        return this.parser.parseDocument(content, filePath);
    }

    /**
     * Private method to process conversion jobs
     */
    private async processJob(
        job: ConversionJob,
        options: Partial<ConversionOptions> = {}
    ): Promise<void> {
        try {
            job.status = 'processing';

            switch (job.type) {
                case 'markdown-to-notion':
                    if (job.sourceFile && job.parentId) {
                        const result = await this.createPageFromFile(job.sourceFile, job.parentId, options);
                        job.result = result.conversionResult;
                    } else {
                        throw new Error('Missing sourceFile or parentId for markdown-to-notion job');
                    }
                    break;

                case 'notion-to-markdown':
                    if (job.pageId && job.targetFile) {
                        const result = await this.exportPageToFile(job.pageId, job.targetFile, options);
                        job.result = result.conversionResult;
                    } else {
                        throw new Error('Missing pageId or targetFile for notion-to-markdown job');
                    }
                    break;

                default:
                    throw new Error(`Unknown job type: ${job.type}`);
            }

            job.status = 'completed';
            job.completedAt = new Date();
        } catch (error) {
            job.status = 'failed';
            job.error = error instanceof Error ? error.message : String(error);
            job.completedAt = new Date();
            throw error;
        }
    }

    /**
     * Generate unique job ID
     */
    private generateJobId(): string {
        return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Create frontmatter from Notion page
     */
    private createFrontmatterFromPage(
        page: NotionPage,
        options: Partial<ConversionOptions>
    ): string | null {
        if (!options.includeMetadata) {
            return null;
        }

        const frontmatter = [
            '---',
            `title: "${this.extractPageTitle(page)}"`,
            `notion_id: "${page.id}"`,
            `created_time: "${page.created_time}"`,
            `last_edited_time: "${page.last_edited_time}"`,
            `url: "${page.url}"`,
            '---'
        ];

        return frontmatter.join('\n');
    }

    /**
     * Extract title from page properties
     */
    private extractPageTitle(page: NotionPage): string {
        // Try to extract title from properties
        for (const [key, property] of Object.entries(page.properties)) {
            if (property.type === 'title' && property.title) {
                return property.title.map((t: any) => t.plain_text).join('');
            }
        }
        return 'Untitled';
    }

    /**
     * Extract metadata from file path and markdown content
     */
    private extractMetadataFromFile(filePath: string, document: MarkdownDocument): {
        category?: string;
        tags?: string[];
        description?: string;
        status?: string;
    } {
        const metadata: any = {};

        // Extract category from file path
        if (filePath.includes('code_guidelines')) {
            metadata.category = 'best-practices';
        } else if (filePath.includes('architecture')) {
            metadata.category = 'architecture';
        } else if (filePath.includes('api')) {
            metadata.category = 'api-reference';
        } else if (filePath.includes('testing')) {
            metadata.category = 'testing';
        } else if (filePath.includes('example')) {
            metadata.category = 'examples';
        } else if (filePath.includes('guide')) {
            metadata.category = 'guides';
        } else {
            metadata.category = 'reference';
        }

        // Extract tags from file path and content
        const tags: string[] = [];

        // Technology tags
        if (filePath.includes('flutter') || document.metadata.title?.toLowerCase().includes('flutter')) {
            tags.push('flutter');
        }
        if (filePath.includes('dart')) tags.push('dart');
        if (filePath.includes('riverpod') || document.metadata.title?.toLowerCase().includes('riverpod')) {
            tags.push('riverpod');
        }
        if (filePath.includes('react')) tags.push('react');
        if (filePath.includes('nestjs')) tags.push('nestjs');
        if (filePath.includes('typescript')) tags.push('typescript');
        if (filePath.includes('testing') || document.metadata.title?.toLowerCase().includes('testing')) {
            tags.push('testing');
        }

        // Content type tags
        if (document.metadata.title?.toLowerCase().includes('rulebook')) {
            tags.push('rulebook');
        }
        if (document.metadata.title?.toLowerCase().includes('guide')) {
            tags.push('guide');
        }
        if (document.metadata.title?.toLowerCase().includes('best practices')) {
            tags.push('best-practices');
        }

        // Framework/library specific
        if (document.metadata.title?.toLowerCase().includes('state') ||
            filePath.includes('state')) {
            tags.push('state-management');
        }

        metadata.tags = tags;

        // Use existing frontmatter metadata if available
        if (document.metadata.description) {
            metadata.description = document.metadata.description;
        }

        // Check frontMatter for status or set default
        metadata.status = document.metadata.frontMatter?.status || 'published';

        return metadata;
    }

    /**
     * Ensure database has required metadata properties
     */
    private async ensureDatabaseProperties(databaseId: string): Promise<void> {
        try {
            // Get current database properties
            const database = await this.notionService.getDatabase(databaseId);
            const existingProperties = database.properties;

            const requiredProperties: any = {};

            // Add Category property if it doesn't exist
            if (!existingProperties.Category) {
                requiredProperties.Category = {
                    select: {
                        options: [
                            { name: 'best-practices', color: 'blue' },
                            { name: 'architecture', color: 'purple' },
                            { name: 'api-reference', color: 'green' },
                            { name: 'testing', color: 'yellow' },
                            { name: 'examples', color: 'orange' },
                            { name: 'guides', color: 'red' },
                            { name: 'reference', color: 'gray' }
                        ]
                    }
                };
            }

            // Add Tags property if it doesn't exist
            if (!existingProperties.Tags) {
                requiredProperties.Tags = {
                    multi_select: {
                        options: []
                    }
                };
            }

            // Add Description property if it doesn't exist
            if (!existingProperties.Description) {
                requiredProperties.Description = {
                    rich_text: {}
                };
            }

            // Add Status property if it doesn't exist
            if (!existingProperties.Status) {
                requiredProperties.Status = {
                    select: {
                        options: [
                            { name: 'published', color: 'green' },
                            { name: 'draft', color: 'yellow' },
                            { name: 'archived', color: 'gray' }
                        ]
                    }
                };
            }

            // Update database if any properties need to be added
            if (Object.keys(requiredProperties).length > 0) {
                console.log('🔧 Adding missing database properties:', Object.keys(requiredProperties));
                await this.notionService.updateDatabase(databaseId, {
                    properties: requiredProperties
                });
                console.log('✅ Database properties updated successfully');
            }

        } catch (error) {
            console.warn('⚠️ Failed to ensure database properties:', error);
            // Don't throw error - we'll still try to create the page
        }
    }
} 