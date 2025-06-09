import { z } from "zod";
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { listAvailableDocuments, readMarkdownFile } from '../utils/file-system.js';

/**
 * Configure documentation-related tools and resources
 */
export function configureDocsTools(server: McpServer): void {

    // Register the documentation resource template
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
            // Extract parameters from the URI variables
            const category = Array.isArray(variables.category) ? variables.category[0] : variables.category;
            const name = Array.isArray(variables.name) ? variables.name[0] : variables.name;

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
            try {
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
            } catch (error) {
                return {
                    content: [{
                        type: "text",
                        text: `Error listing documents: ${error instanceof Error ? error.message : String(error)}`
                    }]
                };
            }
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
            try {
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
            } catch (error) {
                return {
                    content: [{
                        type: "text",
                        text: `Error reading document: ${error instanceof Error ? error.message : String(error)}`
                    }]
                };
            }
        }
    );
} 