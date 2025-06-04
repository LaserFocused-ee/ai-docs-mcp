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
  // Register the resource template pattern with a read handler
  server.resource(
    "docs",
    new ResourceTemplate("docs://{category}/{name}", {
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
    }),
    async (_uri: URL, variables) => {
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

  // Legacy tool to list all available docs (until resources are supported in Cursor)
  server.tool(
    "legacy-list-docs",
    "List all available documentation files in the system",
    {},
    async () => {
      const documents = await listAvailableDocuments();

      if (documents.length === 0) {
        return {
          content: [{
            type: "text",
            text: "No documentation files found in the system."
          }]
        };
      }

      const docsList = documents.map(doc =>
        `- **${doc.category}/${doc.name}** (URI: docs://${doc.category}/${doc.name})`
      ).join('\n');

      return {
        content: [{
          type: "text",
          text: `Available Documentation Files:\n\n${docsList}\n\nTo read a specific document, use the legacy-read-doc tool with the document name and category.`
        }]
      };
    }
  );

  // Legacy tool to read a specific doc (until resources are supported in Cursor)
  server.tool(
    "legacy-read-doc",
    "Read a specific documentation file by category and name",
    {
      category: z.string().describe("The category/folder of the document (e.g., 'service-docs', 'code_guidelines/flutter')"),
      name: z.string().describe("The name of the document without .md extension")
    },
    async ({ category, name }) => {
      const documents = await listAvailableDocuments();
      const document = documents.find(doc =>
        doc.name === name && doc.category === category
      );

      if (!document) {
        // Try fuzzy matching
        const fuzzyMatch = documents.find(doc =>
          doc.name.includes(name) && doc.category.includes(category)
        );

        if (fuzzyMatch) {
          const content = await readMarkdownFile(fuzzyMatch.path);
          return {
            content: [{
              type: "text",
              text: `# ${fuzzyMatch.name} (${fuzzyMatch.category})\n\n${content}`
            }]
          };
        }

        return {
          content: [{
            type: "text",
            text: `Document not found: ${category}/${name}\n\nUse the legacy-list-docs tool to see available documents.`
          }]
        };
      }

      const content = await readMarkdownFile(document.path);

      return {
        content: [{
          type: "text",
          text: `# ${document.name} (${document.category})\n\n${content}`
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
          text: `${greeting}\n\nThis is an example tool in the AI Documentation MCP Server.\n\nFor documentation access, use resources like:\n- docs://code_guidelines/flutter/best-practices\n- docs://service-docs/linear-sdk-documentation\n\nOr use the legacy tools:\n- legacy-list-docs: List all available docs\n- legacy-read-doc: Read a specific document`
        }]
      };
    }
  );
}