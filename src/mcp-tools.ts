import path from 'path';
import fs from 'fs-extra';
import { z } from "zod";
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { listAvailableDocuments, readMarkdownFile, getDocsDirectory } from './docs-utils.js';

// Define server info
export const SERVER_INFO = {
  name: "AI-Docs",
  version: "0.1.0",
  description: "MCP server for AI documentation tools"
};

/**
 * Configure MCP server with modern SDK 1.12.0 resource-only approach
 */
export function configureServer(server: McpServer): void {

  // Register resource template for documentation
  const docsTemplate = new ResourceTemplate(
    "docs://{category}/{name}",
    {
      list: async () => {
        const documents = await listAvailableDocuments();
        return {
          resources: documents.map(doc => ({
            uri: `docs://${doc.category}/${doc.name}`,
            name: doc.name,
            description: `${doc.category} documentation: ${doc.name}`,
            mimeType: "text/markdown"
          }))
        };
      }
    }
  );

  server.resource(
    "docs-template",
    docsTemplate,
    async (uri: URL, variables) => {
      // Extract parameters from the URI variables (provided by the template engine)
      // Variables can be string or string[], so we need to handle both
      const category = Array.isArray(variables.category) ? variables.category[0] : variables.category;
      const name = Array.isArray(variables.name) ? variables.name[0] : variables.name;

      const documents = await listAvailableDocuments();
      const document = documents.find(doc =>
        doc.name === name && doc.category === category
      );

      if (!document) {
        // Try fuzzy matching
        const fuzzyMatch = documents.find(doc =>
          doc.name.includes(name) &&
          doc.category.includes(category)
        );

        if (fuzzyMatch) {
          const content = await readMarkdownFile(fuzzyMatch.path);
          return {
            contents: [{
              uri: `docs://${fuzzyMatch.category}/${fuzzyMatch.name}`,
              mimeType: "text/markdown",
              text: content
            }]
          };
        }

        throw new Error(`Documentation not found: docs://${category}/${name}`);
      }

      const content = await readMarkdownFile(document.path);
      return {
        contents: [{
          uri: `docs://${document.category}/${document.name}`,
          mimeType: "text/markdown",
          text: content
        }]
      };
    }
  );

  // Example tool: Hello World
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
          text: `${greeting}\n\nThis is an example tool in the AI Documentation MCP Server.\n\nFor documentation access, use resources like:\n- docs://code_guidelines/flutter/best-practices\n- docs://service-docs/linear-sdk-documentation`
        }]
      };
    }
  );
}