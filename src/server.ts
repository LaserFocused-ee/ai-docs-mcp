import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { configureDocsTools } from './tools/docs.js';
import { configureGuruTools } from './tools/guru.js';
import {
    initializeMarkdownNotionConverter,
    markdownNotionTools
} from './tools/markdown-notion-tools.js';

// Define server info
export const SERVER_INFO = {
    name: "AI-Docs",
    version: "0.1.0",
    description: "MCP server for AI documentation and Guru API integration"
};

/**
 * Configure Markdown-Notion conversion tools
 */
async function configureMarkdownNotionTools(server: McpServer): Promise<void> {
    // Initialize converter if NOTION_TOKEN is available
    const notionToken = process.env.NOTION_TOKEN;

    if (notionToken) {
        try {
            await initializeMarkdownNotionConverter({
                notionToken,
                defaultParentId: process.env.NOTION_DEFAULT_PARENT_ID,
                maxFileSize: parseInt(process.env.MARKDOWN_MAX_FILE_SIZE || '10485760'), // 10MB
                workspaceRoot: process.cwd(),
                defaultConversionOptions: {
                    preserveColors: process.env.MARKDOWN_PRESERVE_COLORS === 'true',
                    includeMetadata: process.env.MARKDOWN_INCLUDE_METADATA !== 'false',
                    maxHeadingLevel: parseInt(process.env.MARKDOWN_MAX_HEADING_LEVEL || '3'),
                    convertCallouts: process.env.MARKDOWN_CONVERT_CALLOUTS !== 'false',
                    convertToggles: process.env.MARKDOWN_CONVERT_TOGGLES !== 'false'
                }
            });

            // Register all markdown-notion tools
            Object.entries(markdownNotionTools).forEach(([name, tool]) => {
                server.tool(name, tool.description, tool.inputSchema, tool.handler);
            });

        } catch (error) {
            console.error('Failed to initialize markdown-notion tools:', error);
        }
    }
}

/**
 * Configure MCP server with all tools and resources
 */
export function configureServer(server: McpServer): void {

    // Configure documentation tools and resources
    configureDocsTools(server);

    // Configure Guru API tools
    configureGuruTools(server);

    // Configure Markdown-Notion conversion tools
    configureMarkdownNotionTools(server);

    // Example hello tool
    server.tool(
        "hello",
        "A simple hello world example tool",
        {
            name: z.string().optional().describe("Name to greet (optional)")
        },
        async ({ name }) => {
            const greeting = name ? `Hello, ${name}!` : "Hello, World!";
            return {
                content: [{
                    type: "text",
                    text: `${greeting}\n\nThis is the AI Documentation MCP Server.\n\n` +
                        `**Available Documentation:**\n` +
                        `- Use resources like: docs://code_guidelines/flutter/best-practices\n` +
                        `- Or legacy tools: legacy-list-docs, legacy-read-doc\n\n` +
                        `**Guru API Integration:**\n` +
                        `- guru-list-cards: Search and list Guru cards\n` +
                        `- guru-read-card: Read full card content\n` +
                        `- guru-get-card-attachments: Get card attachments\n\n` +
                        `**Environment Variable for Guru API:**\n` +
                        `- GURU_TOKEN="username:user_token" (for User Token), or\n` +
                        `- GURU_TOKEN="collection_id:collection_token" (for Collection Token)`
                }]
            };
        }
    );
} 