/**
 * MCP Tools for Markdown-Notion Conversion
 */

import { z } from 'zod';
import { MarkdownNotionConverter, ConverterConfig, ConversionJob } from '../services/MarkdownNotionConverter.js';
import { ConversionOptions } from '../types/markdown.js';

// Reusable Zod schema for conversion options
const conversionOptionsSchema = z.object({
    preserveColors: z.boolean().optional().describe('Preserve text colors'),
    convertCallouts: z.boolean().optional().describe('Convert callouts to blockquotes'),
    convertToggles: z.boolean().optional().describe('Convert toggles to details elements'),
    handleUnsupportedBlocks: z.enum(['ignore', 'convert', 'error']).optional().describe('How to handle unsupported blocks'),
    includeMetadata: z.boolean().optional().describe('Include conversion metadata'),
    normalizeHeadings: z.boolean().optional().describe('Normalize heading levels'),
    maxHeadingLevel: z.number().min(1).max(6).optional().describe('Maximum heading level (1-6)'),
    emphasisMarker: z.enum(['*', '_']).optional().describe('Markdown emphasis marker'),
    listMarker: z.enum(['-', '*', '+']).optional().describe('List marker for unordered lists'),
    codeBlockStyle: z.enum(['fenced', 'indented']).optional().describe('Code block style'),
    lineBreaks: z.enum(['lf', 'crlf']).optional().describe('Line break style')
}).optional().describe('Conversion options');

// Global converter instance
let converter: MarkdownNotionConverter | null = null;

/**
 * Initialize the converter with configuration
 */
export async function initializeMarkdownNotionConverter(config: ConverterConfig): Promise<void> {
    converter = new MarkdownNotionConverter(config);
}

/**
 * Get the converter instance (throws if not initialized)
 */
function getConverter(): MarkdownNotionConverter {
    if (!converter) {
        throw new Error('MarkdownNotionConverter not initialized. Call initializeMarkdownNotionConverter first.');
    }
    return converter;
}

/**
 * MCP Tool: Convert markdown content to Notion blocks
 */
export async function markdownToNotionTool({ markdown, options }: {
    markdown: string;
    options?: Partial<ConversionOptions>;
}) {
    try {
        const result = await getConverter().markdownToNotion(markdown, options);

        const text = result.errors.length === 0
            ? `✅ Conversion successful!\n\n**Statistics:**\n- Blocks created: ${result.statistics?.convertedBlocks || 0}\n- Warnings: ${result.warnings?.length || 0}\n- Errors: ${result.errors?.length || 0}\n\n**Notion Blocks:**\n${JSON.stringify(result.content, null, 2)}`
            : `❌ Conversion failed:\n${result.errors?.join('\n') || 'Unknown error'}`;

        return {
            content: [{
                type: "text" as const,
                text
            }]
        };
    } catch (error) {
        return {
            content: [{
                type: "text" as const,
                text: `❌ Conversion failed:\n${error instanceof Error ? error.message : String(error)}`
            }]
        };
    }
}

/**
 * MCP Tool: Convert Notion blocks to markdown
 */
export async function notionToMarkdownTool({ blocks, options }: {
    blocks: any[];
    options?: Partial<ConversionOptions>;
}) {
    try {
        const result = await getConverter().notionToMarkdown(blocks, options);

        const text = result.errors.length === 0
            ? `✅ Conversion successful!\n\n**Markdown Content:**\n\`\`\`markdown\n${result.content}\n\`\`\`\n\n**Statistics:**\n- Blocks processed: ${result.statistics?.totalBlocks || 0}\n- Warnings: ${result.warnings?.length || 0}`
            : `❌ Conversion failed:\n${result.errors?.join('\n') || 'Unknown error'}`;

        return {
            content: [{
                type: "text" as const,
                text
            }]
        };
    } catch (error) {
        return {
            content: [{
                type: "text" as const,
                text: `❌ Conversion failed:\n${error instanceof Error ? error.message : String(error)}`
            }]
        };
    }
}

/**
 * MCP Tool: Create a Notion page from markdown content
 */
export async function createPageFromMarkdownTool({ markdown, pageTitle, options, metadata }: {
    markdown: string;
    pageTitle?: string;
    options?: Partial<ConversionOptions>;
    metadata?: {
        category?: string;
        tags?: string[];
        description?: string;
        status?: string;
    };
}) {
    try {
        const databaseId = process.env.NOTION_MCP_DATABASE_ID;
        if (!databaseId) {
            throw new Error('NOTION_MCP_DATABASE_ID environment variable is required');
        }

        const result = await getConverter().createPageFromMarkdown(
            markdown,
            databaseId,
            pageTitle,
            options,
            metadata
        );

        return {
            content: [{
                type: "text" as const,
                text: `✅ Page created successfully!\n\n**Page Details:**\n- ID: ${result.page.id}\n- URL: ${result.page.url}\n- Warnings: ${result.conversionResult.warnings?.length || 0}\n\n**Conversion Statistics:**\n- Blocks created: ${result.conversionResult.statistics?.convertedBlocks || 0}\n- Errors: ${result.conversionResult.errors?.length || 0}`
            }]
        };
    } catch (error) {
        return {
            content: [{
                type: "text" as const,
                text: `❌ Page creation failed:\n${error instanceof Error ? error.message : String(error)}`
            }]
        };
    }
}

/**
 * MCP Tool: Export a Notion page to markdown
 */
export async function exportPageToMarkdownTool({ pageId, options, save_dir }: {
    pageId: string;
    options?: Partial<ConversionOptions>;
    save_dir?: string;
}) {
    try {
        // Set clean export defaults (no metadata unless requested)
        const cleanOptions = {
            includeMetadata: false,
            ...options
        };
        const result = await getConverter().exportPageToMarkdown(pageId, cleanOptions);
        // Extract title using the proper method
        const pageTitle = (getConverter() as any).extractPageTitle(result.page);

        let fileInfo = '';

        // Save to file if directory specified
        if (save_dir) {
            const fs = await import('fs');
            const path = await import('path');

            try {
                // Validate that save_dir is an absolute path
                if (!path.isAbsolute(save_dir)) {
                    throw new Error(`save_dir must be an absolute path. Received: ${save_dir}`);
                }

                // Create the directory if it doesn't exist
                await fs.promises.mkdir(save_dir, { recursive: true });

                // Create safe filename from page title
                const safeTitle = pageTitle
                    .replace(/[^\w\s-]/g, '') // Remove special characters
                    .replace(/\s+/g, '_')     // Replace spaces with underscores
                    .toLowerCase();

                const fileName = `${safeTitle}_${pageId.replace(/-/g, '')}.md`;
                const filePath = path.join(save_dir, fileName);

                // Write file
                await fs.promises.writeFile(filePath, result.markdown, 'utf8');
                fileInfo = `\n\n**Saved to:** \`${filePath}\``;
            } catch (fileError) {
                fileInfo = `\n\n**File save failed:** ${fileError instanceof Error ? fileError.message : String(fileError)}\n**Note:** save_dir must be an absolute path (e.g., /Users/username/Documents/notion_exports)`;
            }
        }

        return {
            content: [{
                type: "text" as const,
                text: `✅ Page exported successfully!\n\n**Page Title:** ${pageTitle}${fileInfo}\n\n**Markdown Content:**\n\`\`\`markdown\n${result.markdown}\n\`\`\`\n\n**Statistics:**\n- Blocks processed: ${result.conversionResult.statistics?.totalBlocks || 0}\n- Warnings: ${result.conversionResult.warnings?.length || 0}`
            }]
        };
    } catch (error) {
        return {
            content: [{
                type: "text" as const,
                text: `❌ Page export failed:\n${error instanceof Error ? error.message : String(error)}`
            }]
        };
    }
}

/**
 * MCP Tool: Create a Notion page from a markdown file
 */
export async function createPageFromFileTool({ filePath, options, metadata }: {
    filePath: string;
    options?: Partial<ConversionOptions>;
    metadata?: {
        category?: string;
        tags?: string[];
        description?: string;
        status?: string;
    };
}) {
    try {
        const databaseId = process.env.NOTION_MCP_DATABASE_ID;
        if (!databaseId) {
            throw new Error('NOTION_MCP_DATABASE_ID environment variable is required');
        }

        const result = await getConverter().createPageFromFile(
            filePath,
            databaseId,
            options,
            metadata
        );

        return {
            content: [{
                type: "text" as const,
                text: `✅ Page created from file successfully!\n\n**File:** ${filePath}\n**Page Details:**\n- Title: ${result.document.metadata.title || 'Untitled'}\n- ID: ${result.page.id}\n- URL: ${result.page.url}\n\n**Conversion Statistics:**\n- Blocks created: ${result.conversionResult.statistics?.convertedBlocks || 0}\n- Warnings: ${result.conversionResult.warnings?.length || 0}\n- Errors: ${result.conversionResult.errors?.length || 0}`
            }]
        };
    } catch (error) {
        return {
            content: [{
                type: "text" as const,
                text: `❌ Page creation from file failed:\n${error instanceof Error ? error.message : String(error)}`
            }]
        };
    }
}

/**
 * MCP Tool: Export a Notion page to a markdown file
 */
export async function exportPageToFileTool({ pageId, filePath, options }: {
    pageId: string;
    filePath: string;
    options?: Partial<ConversionOptions>;
}) {
    try {
        const result = await getConverter().exportPageToFile(
            pageId,
            filePath,
            options
        );

        return {
            content: [{
                type: "text" as const,
                text: `✅ Page exported to file successfully!\n\n**File:** ${filePath}\n**Page Title:** ${result.document.metadata.title || 'Untitled'}\n\n**Conversion Statistics:**\n- Blocks processed: ${result.conversionResult.statistics?.totalBlocks || 0}\n- Warnings: ${result.conversionResult.warnings?.length || 0}\n- Errors: ${result.conversionResult.errors?.length || 0}`
            }]
        };
    } catch (error) {
        return {
            content: [{
                type: "text" as const,
                text: `❌ Page export to file failed:\n${error instanceof Error ? error.message : String(error)}`
            }]
        };
    }
}

/**
 * MCP Tool: Create a conversion job for async processing
 */
export async function createConversionJobTool({ type, sourceFile, targetFile, pageId, parentId, options }: {
    type: 'markdown-to-notion' | 'notion-to-markdown';
    sourceFile?: string;
    targetFile?: string;
    pageId?: string;
    parentId?: string;
    options?: Partial<ConversionOptions>;
}) {
    try {
        const job = await getConverter().createConversionJob(type, {
            sourceFile,
            targetFile,
            pageId,
            parentId,
            conversionOptions: options
        });

        return {
            content: [{
                type: "text" as const,
                text: `✅ Conversion job created successfully!\n\n**Job ID:** ${job.id}\n**Type:** ${type}\n**Status:** ${job.status}\n\nUse the "get-conversion-job" tool to check the status.`
            }]
        };
    } catch (error) {
        return {
            content: [{
                type: "text" as const,
                text: `❌ Job creation failed:\n${error instanceof Error ? error.message : String(error)}`
            }]
        };
    }
}

/**
 * MCP Tool: Get conversion job status
 */
export async function getConversionJobTool({ jobId }: {
    jobId: string;
}) {
    try {
        const job = getConverter().getJob(jobId);

        if (!job) {
            return {
                content: [{
                    type: "text" as const,
                    text: `❌ Job not found: ${jobId}`
                }]
            };
        }

        return {
            content: [{
                type: "text" as const,
                text: `📋 Job Status for ${jobId}\n\n**Type:** ${job.type}\n**Status:** ${job.status}\n**Created:** ${new Date(job.createdAt).toLocaleString()}\n${job.completedAt ? `**Completed:** ${new Date(job.completedAt).toLocaleString()}` : ''}\n\n${job.error ? `**Error:** ${job.error}` : ''}\n${job.result ? `**Result:** Job completed successfully` : ''}`
            }]
        };
    } catch (error) {
        return {
            content: [{
                type: "text" as const,
                text: `❌ Failed to get job status:\n${error instanceof Error ? error.message : String(error)}`
            }]
        };
    }
}

/**
 * MCP Tool: List all conversion jobs
 */
export async function listConversionJobsTool() {
    try {
        const jobs = getConverter().getAllJobs();

        if (jobs.length === 0) {
            return {
                content: [{
                    type: "text" as const,
                    text: `📋 No conversion jobs found.`
                }]
            };
        }

        const jobList = jobs.map(job =>
            `• **${job.id}** (${job.type}) - Status: ${job.status}\n  Created: ${new Date(job.createdAt).toLocaleString()}`
        ).join('\n\n');

        return {
            content: [{
                type: "text" as const,
                text: `📋 Conversion Jobs (${jobs.length})\n\n${jobList}`
            }]
        };
    } catch (error) {
        return {
            content: [{
                type: "text" as const,
                text: `❌ Failed to list jobs:\n${error instanceof Error ? error.message : String(error)}`
            }]
        };
    }
}

/**
 * MCP Tool: Validate markdown content
 */
export async function validateMarkdownTool({ content }: {
    content: string;
}) {
    try {
        const result = getConverter().validateMarkdown(content);

        const text = result.isValid
            ? `✅ Markdown content is valid!\n\n**Warnings:** ${result.warnings.length}\n${result.warnings.length > 0 ? result.warnings.map(w => `• ${w}`).join('\n') : ''}`
            : `❌ Markdown content is invalid!\n\n**Errors:** ${result.errors.length}\n${result.errors.map(e => `• ${e}`).join('\n')}\n\n**Warnings:** ${result.warnings.length}\n${result.warnings.length > 0 ? result.warnings.map(w => `• ${w}`).join('\n') : ''}`;

        return {
            content: [{
                type: "text" as const,
                text
            }]
        };
    } catch (error) {
        return {
            content: [{
                type: "text" as const,
                text: `❌ Validation failed:\n${error instanceof Error ? error.message : String(error)}`
            }]
        };
    }
}

/**
 * MCP Tool: Parse a markdown file and extract metadata
 */
export async function parseMarkdownFileTool({ filePath }: {
    filePath: string;
}) {
    try {
        const document = await getConverter().parseMarkdownFile(filePath);

        const metadata = document.metadata ?
            Object.entries(document.metadata)
                .map(([key, value]) => `• **${key}:** ${value}`)
                .join('\n') :
            'No metadata found';

        return {
            content: [{
                type: "text" as const,
                text: `📄 Markdown File Parsed Successfully\n\n**File Details:**\n• Name: ${document.name}\n• Path: ${document.path}\n• Size: ${document.size} bytes\n• Last Modified: ${new Date(document.lastModified!).toLocaleString()}\n\n**Metadata:**\n${metadata}`
            }]
        };
    } catch (error) {
        return {
            content: [{
                type: "text" as const,
                text: `❌ Failed to parse markdown file:\n${error instanceof Error ? error.message : String(error)}`
            }]
        };
    }
}

/**
 * MCP Tool: Update a Notion page
 */
export async function updatePageTool({ pageId, category, tags, description, status }: {
    pageId: string;
    category?: string;
    tags?: string[];
    description?: string;
    status?: string;
}) {
    try {
        const notionService = (getConverter() as any).notionService;

        // Build update properties
        const properties: any = {};

        if (category) {
            properties.Category = {
                select: { name: category }
            };
        }

        if (tags) {
            properties.Tags = {
                multi_select: tags.map(tag => ({ name: tag }))
            };
        }

        if (description) {
            properties.Description = {
                rich_text: [
                    {
                        text: { content: description }
                    }
                ]
            };
        }

        if (status) {
            properties.Status = {
                select: { name: status }
            };
        }

        const updatedPage = await notionService.updatePage(pageId, { properties });

        return {
            content: [{
                type: "text" as const,
                text: `✅ Page updated successfully!\n\n**Page ID:** ${pageId}\n**Updated Properties:**\n${Object.keys(properties).map(key => `• ${key}`).join('\n')}`
            }]
        };
    } catch (error) {
        return {
            content: [{
                type: "text" as const,
                text: `❌ Failed to update page:\n${error instanceof Error ? error.message : String(error)}`
            }]
        };
    }
}

/**
 * MCP Tool: Archive (delete) a Notion page
 */
export async function archivePageTool({ pageId }: {
    pageId: string;
}) {
    try {
        const notionService = (getConverter() as any).notionService;
        const archivedPage = await notionService.archivePage(pageId);

        return {
            content: [{
                type: "text" as const,
                text: `✅ Page archived successfully!\n\n**Page ID:** ${pageId}\n**Status:** Archived\n\n*Note: In Notion, pages are archived rather than deleted. You can restore them from the trash.*`
            }]
        };
    } catch (error) {
        return {
            content: [{
                type: "text" as const,
                text: `❌ Failed to archive page:\n${error instanceof Error ? error.message : String(error)}`
            }]
        };
    }
}

/**
 * MCP Tool: List pages in a database
 */
export async function listDatabasePagesTool({ limit = 10 }: {
    limit?: number;
}) {
    try {
        const databaseId = process.env.NOTION_MCP_DATABASE_ID;
        if (!databaseId) {
            throw new Error('NOTION_MCP_DATABASE_ID environment variable is required');
        }

        const notionService = (getConverter() as any).notionService;
        const result = await notionService.queryDatabase({
            database_id: databaseId,
            page_size: limit
        });

        if (result.results.length === 0) {
            return {
                content: [{
                    type: "text" as const,
                    text: `📋 No pages found in database.`
                }]
            };
        }

        const pageList = result.results.map((page: any) => {
            const title = page.properties?.title?.title?.[0]?.text?.content ||
                page.properties?.Title?.title?.[0]?.text?.content ||
                'Untitled';
            const category = page.properties?.Category?.select?.name || '';
            const status = page.properties?.Status?.select?.name || '';
            const lastEdited = new Date(page.last_edited_time).toLocaleDateString();

            return `• **${title}**\n  ID: ${page.id}\n  Category: ${category}\n  Status: ${status}\n  Last edited: ${lastEdited}`;
        }).join('\n\n');

        return {
            content: [{
                type: "text" as const,
                text: `📋 Database Pages (${result.results.length})\n\n${pageList}`
            }]
        };
    } catch (error) {
        return {
            content: [{
                type: "text" as const,
                text: `❌ Failed to list database pages:\n${error instanceof Error ? error.message : String(error)}`
            }]
        };
    }
}

/**
 * Tool definitions for MCP server registration
 */
export const markdownNotionTools = {
    // Core conversion tools
    'markdown-to-notion': {
        description: 'Convert markdown content to Notion blocks',
        inputSchema: {
            markdown: z.string().describe('Markdown content to convert'),
            options: conversionOptionsSchema
        },
        handler: markdownToNotionTool
    },

    'notion-to-markdown': {
        description: 'Convert Notion blocks to markdown',
        inputSchema: {
            blocks: z.array(z.any()).describe('Array of Notion blocks to convert'),
            options: conversionOptionsSchema
        },
        handler: notionToMarkdownTool
    },

    // Page creation and export tools
    'create-page-from-markdown': {
        description: 'Create a Notion page from markdown content',
        inputSchema: {
            markdown: z.string().describe('Markdown content'),
            pageTitle: z.string().optional().describe('Page title (optional)'),
            options: conversionOptionsSchema,
            metadata: z.object({
                category: z.string().optional().describe('Category (e.g., best-practices, architecture, api-reference, testing, examples, guides, reference)'),
                tags: z.array(z.string()).optional().describe('Tags array (e.g., ["flutter", "riverpod", "testing"])'),
                description: z.string().optional().describe('Page description'),
                status: z.string().optional().describe('Status (e.g., published, draft, archived)')
            }).optional().describe('Metadata for the page')
        },
        handler: createPageFromMarkdownTool
    },

    'export-page-to-markdown': {
        description: 'Export a Notion page to markdown',
        inputSchema: {
            pageId: z.string().describe('Notion page ID'),
            options: conversionOptionsSchema,
            save_dir: z.string().optional().describe('Absolute path to directory where the markdown file should be saved (e.g., /Users/username/Documents/notion_exports)')
        },
        handler: exportPageToMarkdownTool
    },

    // File-based tools
    'create-page-from-file': {
        description: 'Create a Notion page from a markdown file',
        inputSchema: {
            filePath: z.string().describe('Path to markdown file'),
            options: conversionOptionsSchema,
            metadata: z.object({
                category: z.string().optional().describe('Category (e.g., best-practices, architecture, api-reference, testing, examples, guides, reference)'),
                tags: z.array(z.string()).optional().describe('Tags array (e.g., ["flutter", "riverpod", "testing"])'),
                description: z.string().optional().describe('Page description'),
                status: z.string().optional().describe('Status (e.g., published, draft, archived)')
            }).optional().describe('Metadata for the page (will be merged with auto-extracted metadata)')
        },
        handler: createPageFromFileTool
    },

    'export-page-to-file': {
        description: 'Export a Notion page to a markdown file',
        inputSchema: {
            pageId: z.string().describe('Notion page ID'),
            filePath: z.string().describe('Output file path'),
            options: conversionOptionsSchema
        },
        handler: exportPageToFileTool
    },

    // Job management tools
    'create-conversion-job': {
        description: 'Create an async conversion job',
        inputSchema: {
            type: z.enum(['markdown-to-notion', 'notion-to-markdown']).describe('Conversion type'),
            sourceFile: z.string().optional().describe('Source file path (for file conversions)'),
            targetFile: z.string().optional().describe('Target file path (for file conversions)'),
            pageId: z.string().optional().describe('Notion page ID (for page conversions)'),
            parentId: z.string().optional().describe('Parent ID (for page creation)'),
            options: conversionOptionsSchema
        },
        handler: createConversionJobTool
    },

    'get-conversion-job': {
        description: 'Get conversion job status and results',
        inputSchema: {
            jobId: z.string().describe('Job ID')
        },
        handler: getConversionJobTool
    },

    'list-conversion-jobs': {
        description: 'List all conversion jobs',
        inputSchema: {},
        handler: listConversionJobsTool
    },

    // Utility tools
    'validate-markdown': {
        description: 'Validate markdown content',
        inputSchema: {
            content: z.string().describe('Markdown content to validate')
        },
        handler: validateMarkdownTool
    },

    'parse-markdown-file': {
        description: 'Parse a markdown file and extract metadata',
        inputSchema: {
            filePath: z.string().describe('Path to markdown file')
        },
        handler: parseMarkdownFileTool
    },

    // Page management tools
    'update-page': {
        description: 'Update a Notion page properties (tags, category, description, status)',
        inputSchema: {
            pageId: z.string().describe('Notion page ID'),
            category: z.string().optional().describe('Category (e.g., best-practices, architecture, api-reference, testing, examples, guides, reference)'),
            tags: z.array(z.string()).optional().describe('Tags array (e.g., ["flutter", "riverpod", "testing"])'),
            description: z.string().optional().describe('Page description'),
            status: z.string().optional().describe('Status (e.g., published, draft, archived)')
        },
        handler: updatePageTool
    },

    'archive-page': {
        description: 'Archive (delete) a Notion page',
        inputSchema: {
            pageId: z.string().describe('Notion page ID to archive')
        },
        handler: archivePageTool
    },

    'list-database-pages': {
        description: 'List pages in a Notion database',
        inputSchema: {
            limit: z.number().optional().default(10).describe('Maximum number of pages to return (default: 10)')
        },
        handler: listDatabasePagesTool
    }
}; 