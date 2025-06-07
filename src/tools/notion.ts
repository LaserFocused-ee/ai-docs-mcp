/**
 * MCP Tools for Notion Operations
 * Simplified to just the 5 essential tools - all operations go through NotionService
 */

import { z } from 'zod';
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { NotionService } from '../services/NotionService.js';
import { ConversionOptions } from '../types/markdown.js';
import { extractPageTitle } from '../utils/converters.js';
import { readMarkdownFile, getDocsDirectory } from '../utils/file-system.js';
import path from 'path';

// Global service instance
let notionService: NotionService;

/**
 * Initialize the NotionService with configuration
 */
export async function initializeNotionService(): Promise<void> {
    const notionToken = process.env.NOTION_TOKEN;
    if (!notionToken) {
        throw new Error('NOTION_TOKEN environment variable is required');
    }
    notionService = new NotionService({ token: notionToken });
}

// ========================================
// THE 5 ESSENTIAL TOOLS
// ========================================

/**
 * Tool 1: List/Query/Search Database
 */
export async function listDatabasePagesTool({ limit = 10 }: {
    limit?: number;
}) {
    try {
        const databaseId = process.env.NOTION_MCP_DATABASE_ID;
        if (!databaseId) {
            throw new Error('NOTION_MCP_DATABASE_ID environment variable is required');
        }

        const result = await notionService.listDatabasePages(databaseId, limit);

        if (result.results.length === 0) {
            return {
                content: [{
                    type: "text" as const,
                    text: "📋 No pages found in database"
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
 * Tool 2: Create Page (from markdown content or file)
 */
export async function createPageFromMarkdownTool({ markdown, filePath, pageTitle, metadata }: {
    markdown?: string;
    filePath?: string;
    pageTitle?: string;
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

        const result = await notionService.createPageFromMarkdown(databaseId, {
            markdown,
            filePath,
            pageTitle,
            metadata
        });

        return {
            content: [{
                type: "text" as const,
                text: `✅ Page created successfully!\n\n**Page Details:**\n- Title: ${pageTitle || 'Untitled'}\n- ID: ${result.page.id}\n- URL: ${result.page.url}\n\n**Conversion Statistics:**\n- Blocks created: ${result.conversionResult.statistics?.convertedBlocks || 0}\n- Warnings: ${result.conversionResult.warnings?.length || 0}\n- Errors: ${result.conversionResult.errors?.length || 0}`
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
 * Tool 3: Update Page (properties/metadata only for now)
 */
export async function updatePageTool({ pageId, category, tags, description, status }: {
    pageId: string;
    category?: string;
    tags?: string[];
    description?: string;
    status?: string;
}) {
    try {


        const metadata: any = {};
        if (category) metadata.category = category;
        if (tags) metadata.tags = tags;
        if (description) metadata.description = description;
        if (status) metadata.status = status;

        const updatedPage = await notionService.updatePageMetadata(pageId, metadata);

        const updates = [];
        if (category) updates.push(`Category: ${category}`);
        if (tags && tags.length > 0) updates.push(`Tags: ${tags.join(', ')}`);
        if (description) updates.push(`Description: ${description}`);
        if (status) updates.push(`Status: ${status}`);

        return {
            content: [{
                type: "text" as const,
                text: `✅ Page updated successfully!\n\n**Page ID:** ${pageId}\n**Updates Applied:**\n${updates.map(u => `• ${u}`).join('\n')}`
            }]
        };
    } catch (error) {
        return {
            content: [{
                type: "text" as const,
                text: `❌ Page update failed:\n${error instanceof Error ? error.message : String(error)}`
            }]
        };
    }
}

/**
 * Tool 4: Archive Page
 */
export async function archivePageTool({ pageId }: {
    pageId: string;
}) {
    try {
        await notionService.archivePage(pageId);

        return {
            content: [{
                type: "text" as const,
                text: `✅ Page archived successfully!\n\n**Page ID:** ${pageId}\n**Status:** The page has been moved to trash and is no longer visible in the database.`
            }]
        };
    } catch (error) {
        return {
            content: [{
                type: "text" as const,
                text: `❌ Page archival failed:\n${error instanceof Error ? error.message : String(error)}`
            }]
        };
    }
}

/**
 * Tool 5: Export Page (to markdown)
 */
export async function exportPageToMarkdownTool({ pageId, saveToFile }: {
    pageId: string;
    saveToFile?: string; // absolute file path
}) {
    try {
        const result = await notionService.exportPageToMarkdown(pageId);
        const pageTitle = extractPageTitle(result.page);

        let responseText = `✅ Page exported successfully!\n\n**Page Title:** ${pageTitle}\n\n**Markdown Content:**\n\`\`\`markdown\n${result.markdown}\n\`\`\`\n\n**Statistics:**\n- Blocks processed: ${result.conversionResult.statistics?.totalBlocks || 0}\n- Warnings: ${result.conversionResult.warnings?.length || 0}`;

        // Save to file if path specified
        if (saveToFile) {
            const fs = await import('fs');
            const path = await import('path');

            try {
                // Validate absolute path
                if (!path.isAbsolute(saveToFile)) {
                    throw new Error(`saveToFile must be an absolute path. Received: ${saveToFile}`);
                }

                // Create directory if needed
                await fs.promises.mkdir(path.dirname(saveToFile), { recursive: true });

                // Write file
                await fs.promises.writeFile(saveToFile, result.markdown, 'utf8');
                responseText += `\n\n**Saved to:** \`${saveToFile}\``;
            } catch (fileError) {
                responseText += `\n\n**File save failed:** ${fileError instanceof Error ? fileError.message : String(fileError)}`;
            }
        }

        return {
            content: [{
                type: "text" as const,
                text: responseText
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

// ========================================
// MCP TOOL CONFIGURATION
// ========================================

/**
 * Configure Notion tools for MCP server
 */
export function configureNotionTools(server: McpServer): void {
    // Initialize the notion service (it will handle token checking internally)
    try {
        initializeNotionService();
    } catch (error) {
        console.error('Failed to initialize Notion service:', error);
        return;
    }
    // Tool 1: List Database Pages
    server.tool(
        'list-database-pages',
        'Query/search/list pages in the Notion database',
        {
            limit: z.number().optional().describe('Maximum number of pages to return (default: 10)')
        },
        async (args: { limit?: number }) => {
            return listDatabasePagesTool(args);
        }
    );

    // Tool 2: Create Page from Markdown
    server.tool(
        'create-page-from-markdown',
        'Create a new Notion page from markdown content or file',
        {
            markdown: z.string().optional().describe('Markdown content to convert and create as a page'),
            filePath: z.string().optional().describe('Path to markdown file (relative to docs/ directory)'),
            pageTitle: z.string().optional().describe('Title for the new page (optional)'),
            metadata: z.object({
                category: z.string().optional().describe('Category (e.g., best-practices, architecture, api-reference, testing, examples, guides, reference)'),
                tags: z.array(z.string()).optional().describe('Tags array (e.g., ["flutter", "riverpod", "testing"])'),
                description: z.string().optional().describe('Page description'),
                status: z.string().optional().describe('Status (e.g., published, draft, archived)')
            }).optional().describe('Metadata for the page')
        },
        async (args: {
            markdown?: string;
            filePath?: string;
            pageTitle?: string;
            metadata?: {
                category?: string;
                tags?: string[];
                description?: string;
                status?: string;
            };
        }) => {
            return createPageFromMarkdownTool(args);
        }
    );

    // Tool 3: Update Page
    server.tool(
        'update-page',
        'Update page properties/metadata',
        {
            pageId: z.string().describe('Notion page ID to update'),
            category: z.string().optional().describe('Category (e.g., best-practices, architecture, api-reference, testing, examples, guides, reference)'),
            tags: z.array(z.string()).optional().describe('Tags array (e.g., ["flutter", "riverpod", "testing"])'),
            description: z.string().optional().describe('Page description'),
            status: z.string().optional().describe('Status (e.g., published, draft, archived)')
        },
        async (args: {
            pageId: string;
            category?: string;
            tags?: string[];
            description?: string;
            status?: string;
        }) => {
            return updatePageTool(args);
        }
    );

    // Tool 4: Archive Page
    server.tool(
        'archive-page',
        'Archive (delete) a Notion page',
        {
            pageId: z.string().describe('Notion page ID to archive')
        },
        async (args: { pageId: string }) => {
            return archivePageTool(args);
        }
    );

    // Tool 5: Export Page to Markdown
    server.tool(
        'export-page-to-markdown',
        'Export a Notion page to markdown format',
        {
            pageId: z.string().describe('Notion page ID to export'),
            saveToFile: z.string().optional().describe('Absolute file path to save the markdown file (optional)')
        },
        async (args: { pageId: string; saveToFile?: string }) => {
            return exportPageToMarkdownTool(args);
        }
    );
} 