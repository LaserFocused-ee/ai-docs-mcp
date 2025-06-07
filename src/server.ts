import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { configureDocsTools } from './tools/docs.js';
import { configureGuruTools } from './tools/guru.js';
import { configureNotionTools } from './tools/notion.js';

// Define server info
export const SERVER_INFO = {
    name: "AI-Docs",
    version: "0.1.0",
    description: "MCP server for AI documentation and Guru API integration"
};

/**
 * Configure MCP server with all tools and resources
 */
export function configureServer(server: McpServer): void {

    // Configure documentation tools and resources
    configureDocsTools(server);

    // Configure Guru API tools
    configureGuruTools(server);

    // Configure Notion tools
    configureNotionTools(server);

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