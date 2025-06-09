/**
 * MCP Tools for Notion Operations
 * Simplified to just the 5 essential tools - all operations go through NotionService
 */

import { z } from 'zod';
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { NotionService } from '../services/notion.js';
import { extractPageTitle } from '../utils/converters.js';
import path from 'path';
import fs from 'fs';

// Global service instance
let notionService: NotionService;

/**
 * Initialize the NotionService with configuration
 */
export async function initializeNotionService(): Promise<void> {
    const notionToken = process.env.NOTION_TOKEN;
    if (!notionToken) {
        console.warn('NOTION_TOKEN environment variable not set - Notion tools will not be functional');
        return;
    }
    notionService = new NotionService({ token: notionToken });
}

// ========================================
// THE 5 ESSENTIAL TOOLS
// ========================================

/**
 * Tool 1: List/Query/Search Database
 */
export async function listDatabasePagesTool({
    limit = 10,
    search,
    category,
    tags,
    status,
    sortBy = 'last_edited',
    sortOrder = 'descending',
    startCursor
}: {
    limit?: number;
    search?: string;
    category?: string;
    tags?: string[];
    status?: string;
    sortBy?: 'title' | 'last_edited' | 'created' | 'category' | 'status';
    sortOrder?: 'ascending' | 'descending';
    startCursor?: string;
}) {
    try {
        if (!notionService) {
            return {
                content: [{
                    type: "text" as const,
                    text: `🔐 Notion API not configured: NOTION_TOKEN environment variable is required.\n\nTo use Notion tools, set NOTION_TOKEN and NOTION_MCP_DATABASE_ID in your MCP configuration.`
                }]
            };
        }

        const databaseId = process.env.NOTION_MCP_DATABASE_ID;
        if (!databaseId) {
            return {
                content: [{
                    type: "text" as const,
                    text: `🔐 Notion database not configured: NOTION_MCP_DATABASE_ID environment variable is required.\n\nTo use Notion tools, set NOTION_MCP_DATABASE_ID in your MCP configuration.`
                }]
            };
        }

        const result = await notionService.listDatabasePages(databaseId, {
            limit,
            search,
            category,
            tags,
            status,
            sortBy,
            sortOrder,
            startCursor
        });

        if (result.results.length === 0) {
            let noResultsMsg = "📋 No pages found";

            // Add context about active filters
            const activeFilters: string[] = [];
            if (search) activeFilters.push(`search: "${search}"`);
            if (category) activeFilters.push(`category: "${category}"`);
            if (status) activeFilters.push(`status: "${status}"`);
            if (tags && tags.length > 0) activeFilters.push(`tags: [${tags.join(', ')}]`);

            if (activeFilters.length > 0) {
                noResultsMsg += ` with filters: ${activeFilters.join(', ')}`;
            }

            return {
                content: [{
                    type: "text" as const,
                    text: noResultsMsg
                }]
            };
        }

        const pageList = result.results.map((page: any) => {
            const title = extractPageTitle(page);
            const category = page.properties?.Category?.select?.name || '';
            const status = page.properties?.Status?.select?.name || '';
            const tags = page.properties?.Tags?.multi_select?.map((tag: any) => tag.name) || [];
            const lastEdited = new Date(page.last_edited_time).toLocaleDateString();
            const created = new Date(page.created_time).toLocaleDateString();

            let pageInfo = `• **${title}**\n  ID: ${page.id}`;
            if (category) pageInfo += `\n  Category: ${category}`;
            if (status) pageInfo += `\n  Status: ${status}`;
            if (tags.length > 0) pageInfo += `\n  Tags: ${tags.join(', ')}`;
            pageInfo += `\n  Last edited: ${lastEdited}`;
            if (sortBy === 'created') pageInfo += `\n  Created: ${created}`;

            return pageInfo;
        }).join('\n\n');

        // Build summary header
        let headerText = `📋 Database Pages (${result.results.length}`;
        if (result.has_more) {
            headerText += ', more available';
        }
        headerText += ')';

        // Add active filters info
        const activeFilters: string[] = [];
        if (search) activeFilters.push(`🔍 "${search}"`);
        if (category) activeFilters.push(`📁 ${category}`);
        if (status) activeFilters.push(`📊 ${status}`);
        if (tags && tags.length > 0) activeFilters.push(`🏷️ ${tags.join(', ')}`);
        if (sortBy !== 'last_edited' || sortOrder !== 'descending') {
            activeFilters.push(`🔄 ${sortBy} (${sortOrder})`);
        }

        if (activeFilters.length > 0) {
            headerText += `\n**Active filters:** ${activeFilters.join(' | ')}`;
        }

        // Add pagination info
        if (result.has_more) {
            headerText += `\n**Pagination:** Use startCursor: "${result.next_cursor}" for next page`;
        }

        return {
            content: [{
                type: "text" as const,
                text: `${headerText}\n\n${pageList}`
            }]
        };
    } catch (error) {
        return {
            content: [{
                type: "text" as const,
                text: `❌ Failed to query database pages:\n${error instanceof Error ? error.message : String(error)}`
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
        if (!notionService) {
            return {
                content: [{
                    type: "text" as const,
                    text: `🔐 Notion API not configured: NOTION_TOKEN environment variable is required.\n\nTo use Notion tools, set NOTION_TOKEN and NOTION_MCP_DATABASE_ID in your MCP configuration.`
                }]
            };
        }

        const databaseId = process.env.NOTION_MCP_DATABASE_ID;
        if (!databaseId) {
            return {
                content: [{
                    type: "text" as const,
                    text: `🔐 Notion database not configured: NOTION_MCP_DATABASE_ID environment variable is required.\n\nTo use Notion tools, set NOTION_MCP_DATABASE_ID in your MCP configuration.`
                }]
            };
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
        const errorMessage = error instanceof Error ? error.message : String(error);

        // Check if this is a code block length error from Notion API
        if (errorMessage.includes('should be ≤ `2000`') && errorMessage.includes('text.content.length')) {
            const sourceDescription = filePath || 'the provided markdown content';

            return {
                content: [{
                    type: "text" as const,
                    text: `🚫 **Code Block Too Large for Notion**

**Problem:** The document contains a code block that exceeds Notion's 2000 character limit.

**File:** \`${sourceDescription}\`
**Error:** ${errorMessage}

---

## 📋 **Breaking Up Code Blocks: Guidelines for AI Agent**

**Would you like me to break this code block up for you and retry?**

If yes, please follow these guidelines when splitting the code block:

### **✅ DO:**
- **Preserve logical boundaries** - Don't break in the middle of functions, classes, or methods
- **Split at natural breakpoints** - Between functions, after import statements, between logical sections
- **Maintain context** - Add comments like \`// ... continued from previous block\` or \`// ... continues in next block\`
- **Keep related code together** - Don't separate function signatures from their implementations
- **Use descriptive headers** - Add comments explaining what each part contains
- **Preserve syntax** - Ensure each block is valid code that could compile/run independently when possible

### **❌ DON'T:**
- Break in the middle of function definitions
- Split class declarations from their methods
- Separate variable declarations from their usage in the same logical block
- Break up closely related configuration objects
- Split import statements from the code that uses them

### **🔧 Suggested Approach:**
1. **Identify the oversized code block** in the markdown
2. **Analyze the code structure** - look for natural breaking points
3. **Create multiple smaller code blocks** with clear headers
4. **Add bridging text** between blocks explaining the continuation
5. **Maintain the same language specification** for all blocks
6. **Test that the narrative flow still makes sense**

### **📝 Example Split Pattern:**
\`\`\`typescript
// Part 1: Interface definitions and imports
[first logical section]
\`\`\`

*The implementation continues with the main class definition:*

\`\`\`typescript  
// Part 2: Main class implementation
[second logical section]
\`\`\`

---

**Ready to proceed?** If you'd like me to break up the code block, please:
gin 1. **🚨 CRITICAL: Make a copy of the original file first** - Never modify the user's source document
2. Read the original file to understand the structure
3. Apply the guidelines above to split the problematic code block(s)
4. Create the new version in the COPY with properly sized code blocks
5. Try uploading the COPY to test the fix
6. Only suggest replacing the original if the user explicitly approves

This approach ensures the documentation remains readable and useful while meeting Notion's technical constraints.`
                }]
            };
        }

        // For other errors, return the standard error message
        return {
            content: [{
                type: "text" as const,
                text: `❌ Page creation failed:\n${errorMessage}`
            }]
        };
    }
}

/**
 * Tool 3: Update Page (metadata and/or content)
 */
export async function updatePageTool({ pageId, markdown, filePath, category, tags, description }: {
    pageId: string;
    markdown?: string;
    filePath?: string;
    category?: string;
    tags?: string[];
    description?: string;
}) {
    try {
        if (!notionService) {
            return {
                content: [{
                    type: "text" as const,
                    text: `🔐 Notion API not configured: NOTION_TOKEN environment variable is required.\n\nTo use Notion tools, set NOTION_TOKEN and NOTION_MCP_DATABASE_ID in your MCP configuration.`
                }]
            };
        }

        const updates = [];
        let conversionResult = null;

        // Handle content updates (create new page with updated content, archive old page)
        if (markdown || filePath) {
            const result = await notionService.updatePageContent(pageId, {
                markdown,
                filePath
            });
            conversionResult = result.conversionResult;
            pageId = result.newPageId; // Update to new page ID
            updates.push(`Content replaced (${result.conversionResult.statistics?.convertedBlocks || 0} blocks) - NEW PAGE ID: ${result.newPageId}`);
        }

        // Handle metadata updates
        const metadata: any = {};
        if (category) {
            metadata.category = category;
            updates.push(`Category: ${category}`);
        }
        if (tags) {
            metadata.tags = tags;
            updates.push(`Tags: ${tags.join(', ')}`);
        }
        if (description) {
            metadata.description = description;
            updates.push(`Description: ${description}`);
        }

        if (Object.keys(metadata).length > 0) {
            await notionService.updatePageMetadata(pageId, metadata);
        }

        let responseText = `✅ Page updated successfully!\n\n**Page ID:** ${pageId}\n**Updates Applied:**\n${updates.map(u => `• ${u}`).join('\n')}`;

        if (conversionResult) {
            responseText += `\n\n**Content Conversion:**\n- Blocks created: ${conversionResult.statistics?.convertedBlocks || 0}\n- Warnings: ${conversionResult.warnings?.length || 0}\n- Errors: ${conversionResult.errors?.length || 0}`;
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
        if (!notionService) {
            return {
                content: [{
                    type: "text" as const,
                    text: `🔐 Notion API not configured: NOTION_TOKEN environment variable is required.\n\nTo use Notion tools, set NOTION_TOKEN and NOTION_MCP_DATABASE_ID in your MCP configuration.`
                }]
            };
        }

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
        if (!notionService) {
            return {
                content: [{
                    type: "text" as const,
                    text: `🔐 Notion API not configured: NOTION_TOKEN environment variable is required.\n\nTo use Notion tools, set NOTION_TOKEN and NOTION_MCP_DATABASE_ID in your MCP configuration.`
                }]
            };
        }

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
    // Tool 1: List/Query/Search Database Pages
    server.tool(
        'list-database-pages',
        'Query and search documentation pages in the Notion database. Supports advanced filtering by search terms, categories, tags, status, and flexible sorting. Perfect for AI agents to find relevant documentation based on current context.',
        {
            limit: z.number().optional().describe('Maximum number of pages to return (default: 10, max: 100). Use smaller limits for focused results.'),
            search: z.string().optional().describe('Search text that will be matched against page titles and descriptions. Case-insensitive partial matching. Example: "riverpod testing" finds pages with those terms.'),
            category: z.string().optional().describe('Filter by exact category match. Available categories: "best-practices", "architecture", "api-reference", "testing", "examples", "guides", "reference". Use this to find docs of a specific type.'),
            tags: z.array(z.string()).optional().describe('Filter by tags - returns pages containing ANY of these tags (OR logic). Example: ["flutter", "riverpod"] finds pages tagged with flutter OR riverpod. Common tags: flutter, riverpod, testing, architecture, ui, state-management.'),
            status: z.string().optional().describe('Filter by publication status. Available statuses: "published" (live docs), "draft" (work in progress), "archived" (deprecated), "review" (pending approval). Usually use "published" for production queries.'),
            sortBy: z.enum(['title', 'last_edited', 'created', 'category', 'status']).optional().describe('Sort field (default: last_edited). Use "last_edited" for newest content, "title" for alphabetical, "created" for chronological, "category" to group by type.'),
            sortOrder: z.enum(['ascending', 'descending']).optional().describe('Sort direction (default: descending). Descending shows newest/latest first, ascending shows oldest/earliest first.'),
            startCursor: z.string().optional().describe('Pagination cursor from previous response to get next page of results. Only use if previous response indicated "has_more: true".')
        },
        async (args: {
            limit?: number;
            search?: string;
            category?: string;
            tags?: string[];
            status?: string;
            sortBy?: 'title' | 'last_edited' | 'created' | 'category' | 'status';
            sortOrder?: 'ascending' | 'descending';
            startCursor?: string;
        }) => {
            return listDatabasePagesTool(args);
        }
    );

    // Tool 2: Create Page from Markdown
    server.tool(
        'create-page-from-markdown',
        'Create a new documentation page in Notion from markdown content or a markdown file. Automatically converts markdown syntax to Notion blocks and sets proper metadata. Choose either markdown content OR filePath, not both.',
        {
            markdown: z.string().optional().describe('Raw markdown content to convert and create as a page. Supports standard markdown: headers, lists, code blocks, links, etc. Cannot be used with filePath.'),
            filePath: z.string().optional().describe('Absolute file system path to markdown file (e.g., "/Users/username/code/ai-docs-mcp/mcp_server/docs/code_guidelines/flutter/architecture/providers.md"). File will be read and converted. Cannot be used with markdown.'),
            pageTitle: z.string().optional().describe('Title for the new page. If not provided, will be extracted from the first # heading in markdown or generated from filename.'),
            metadata: z.object({
                category: z.string().optional().describe('Page category for organization. Must be one of: "best-practices", "architecture", "api-reference", "testing", "examples", "guides", "reference". Helps with discovery and filtering.'),
                tags: z.array(z.string()).optional().describe('Array of tags for categorization and discovery. Examples: ["flutter", "riverpod", "testing"], ["architecture", "patterns"], ["ui", "widgets"]. Use relevant technology and topic tags.'),
                description: z.string().optional().describe('Brief description of the page content. Will be searchable and shown in listings. Keep concise but descriptive.'),
                status: z.string().optional().describe('Publication status. Use "published" for live docs, "draft" for work in progress, "review" for pending approval. Default is usually "published".')
            }).optional().describe('Metadata object containing category, tags, description, and status for the page. All fields optional but recommended for discoverability.')
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
        'Update an existing Notion page\'s content and/or metadata. Can replace entire page content with new markdown or just update metadata properties. Content updates create a new page and archive the old one to preserve history.',
        {
            pageId: z.string().describe('Notion page ID to update (from list-database-pages results). Format: "20de87a1-81d0-8197-931a-ece2d3207b4b"'),
            markdown: z.string().optional().describe('New markdown content to completely replace page content. Supports all markdown syntax. Cannot be used with filePath. WARNING: This replaces ALL existing content.'),
            filePath: z.string().optional().describe('Absolute file system path to markdown file to replace page content. Cannot be used with markdown. WARNING: This replaces ALL existing content.'),
            category: z.string().optional().describe('Update page category. Must be one of: "best-practices", "architecture", "api-reference", "testing", "examples", "guides", "reference". Leave blank to keep existing.'),
            tags: z.array(z.string()).optional().describe('Replace page tags completely with this array. Examples: ["flutter", "riverpod", "updated"]. Leave blank to keep existing tags. This REPLACES all tags, not adds to them.'),
            description: z.string().optional().describe('Update page description. Will be searchable. Leave blank to keep existing description.')
        },
        async (args: {
            pageId: string;
            markdown?: string;
            filePath?: string;
            category?: string;
            tags?: string[];
            description?: string;
        }) => {
            return updatePageTool(args);
        }
    );

    // Tool 4: Archive Page
    server.tool(
        'archive-page',
        'Archive (soft delete) a Notion page by moving it to trash. The page will be removed from the database and no longer visible in listings. Use this to remove outdated or incorrect documentation. Cannot be undone via API.',
        {
            pageId: z.string().describe('Notion page ID to archive (from list-database-pages results). Format: "20de87a1-81d0-8197-931a-ece2d3207b4b". Page will be moved to trash.')
        },
        async (args: { pageId: string }) => {
            return archivePageTool(args);
        }
    );

    // Tool 5: Export Page to Markdown
    server.tool(
        'export-page-to-markdown',
        'Export a Notion page to clean markdown format. Converts all Notion blocks back to standard markdown syntax. Useful for extracting content, creating backups, or converting to other formats.',
        {
            pageId: z.string().describe('Notion page ID to export (from list-database-pages results). Format: "20de87a1-81d0-8197-931a-ece2d3207b4b"'),
            saveToFile: z.string().optional().describe('Absolute file system path to save the markdown file (e.g., "/Users/username/docs/export.md"). If provided, file will be created/overwritten. Directory must exist or will be created.')
        },
        async (args: { pageId: string; saveToFile?: string }) => {
            return exportPageToMarkdownTool(args);
        }
    );


} 