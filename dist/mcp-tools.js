import { z } from "zod";
import { listAvailableDocuments, readMarkdownFile } from './docs-utils.js';
// Define server info
export const SERVER_INFO = {
    name: "AI-Docs",
    version: "0.1.0",
    description: "MCP server for AI documentation tools"
};
/**
 * Configure MCP server with tools
 */
export function configureServer(server) {
    // List all available document tools
    server.tool("list-documentation", "Lists all available documentation files", async () => {
        const documents = await listAvailableDocuments();
        // Create a flat list of all documents with full paths for better discoverability
        const formattedDocs = documents.map(doc => {
            const categoryPath = doc.category ? `${doc.category}/` : '';
            return {
                displayName: `${categoryPath}${doc.name}`,
                path: doc.path
            };
        });
        // Sort documents alphabetically
        formattedDocs.sort((a, b) => a.displayName.localeCompare(b.displayName));
        return {
            content: [
                {
                    type: "text",
                    text: formattedDocs.length > 0
                        ? "Available documentation:\n\n" + formattedDocs.map(doc => `- ${doc.displayName}`).join('\n')
                        : "Available documentation:\n\nNo documentation files found. Please check the docs directory path."
                }
            ]
        };
    });
    // Generic documentation tool - get any documentation by category and name
    server.tool("get-documentation", "Retrieves documentation by category and name", {
        category: z.string().optional().describe("Documentation category (e.g., 'flutter/architecture')"),
        name: z.string().describe("Documentation name without extension")
    }, async ({ category, name }) => {
        // List all available documents
        const documents = await listAvailableDocuments();
        // Find the requested document
        const document = documents.find(doc => doc.name === name &&
            (!category || doc.category === category));
        if (!document) {
            // If document not found with exact name, try partial match
            const partialMatch = documents.find(doc => doc.name.includes(name) &&
                (!category || doc.category === category));
            if (partialMatch) {
                const content = await readMarkdownFile(partialMatch.path);
                return {
                    content: [{
                            type: "text",
                            text: `Found similar document: ${partialMatch.name}\n\n${content}`
                        }]
                };
            }
            throw new Error(`Documentation "${name}" ${category ? `in category "${category}" ` : ''}not found.`);
        }
        // Read and return the document content
        const content = await readMarkdownFile(document.path);
        return {
            content: [{
                    type: "text",
                    text: content
                }]
        };
    });
    // Flutter documentation tool
    server.tool("flutter", "Returns all Flutter-related documentation", {
        name: z.string().optional().describe("Specific Flutter document name to retrieve")
    }, async ({ name }) => {
        const documents = await listAvailableDocuments();
        // Filter Flutter-related documents
        const flutterDocs = documents.filter(doc => doc.category.startsWith('code_guidelines/flutter'));
        if (flutterDocs.length === 0) {
            return {
                content: [{
                        type: "text",
                        text: "No Flutter documentation found."
                    }]
            };
        }
        // If name is provided, get that specific document
        if (name) {
            const flutterDoc = flutterDocs.find(doc => doc.name === name || doc.name.includes(name));
            if (!flutterDoc) {
                return {
                    content: [{
                            type: "text",
                            text: `Flutter document "${name}" not found. Available documents:\n\n` +
                                flutterDocs.map(doc => `- ${doc.name}`).join('\n')
                        }]
                };
            }
            // Return the requested document
            const content = await readMarkdownFile(flutterDoc.path);
            return {
                content: [{
                        type: "text",
                        text: content
                    }]
            };
        }
        // Otherwise, list all Flutter documents
        return {
            content: [{
                    type: "text",
                    text: "Available Flutter documentation:\n\n" +
                        flutterDocs.map(doc => `- ${doc.category}/${doc.name}`).join('\n')
                }]
        };
    });
    // Testing documentation tool
    server.tool("testing", "Returns testing documentation across all technologies", {
        technology: z.string().optional().describe("Filter testing docs by technology (e.g., \"flutter\", \"react\")"),
        name: z.string().optional().describe("Specific testing document name to retrieve")
    }, async ({ technology, name }) => {
        const documents = await listAvailableDocuments();
        // Filter testing-related documents
        const testingDocs = documents.filter(doc => doc.name.toLowerCase().includes('test') ||
            doc.category.toLowerCase().includes('test'));
        if (testingDocs.length === 0) {
            return {
                content: [{
                        type: "text",
                        text: "No testing documentation found."
                    }]
            };
        }
        // Filter by technology if provided
        let filteredDocs = testingDocs;
        if (technology) {
            filteredDocs = testingDocs.filter(doc => doc.category.toLowerCase().includes(technology.toLowerCase()));
            if (filteredDocs.length === 0) {
                return {
                    content: [{
                            type: "text",
                            text: `No testing documentation found for technology "${technology}". Available technologies:\n\n` +
                                [...new Set(testingDocs.map(doc => doc.category.split('/')[0]))].join('\n')
                        }]
                };
            }
        }
        // If name is provided, get that specific document
        if (name) {
            const testingDoc = filteredDocs.find(doc => doc.name === name || doc.name.includes(name));
            if (!testingDoc) {
                return {
                    content: [{
                            type: "text",
                            text: `Testing document "${name}" not found. Available documents:\n\n` +
                                filteredDocs.map(doc => `- ${doc.name}`).join('\n')
                        }]
                };
            }
            // Return the requested document
            const content = await readMarkdownFile(testingDoc.path);
            return {
                content: [{
                        type: "text",
                        text: content
                    }]
            };
        }
        // Otherwise, list all testing documents
        return {
            content: [{
                    type: "text",
                    text: "Available testing documentation:\n\n" +
                        filteredDocs.map(doc => `- ${doc.category}/${doc.name}`).join('\n')
                }]
        };
    });
    // Code guidelines documentation tool
    server.tool("code-guidelines", "Returns code guidelines documentation", {
        technology: z.string().optional().describe("Filter guidelines by technology (e.g., \"flutter\", \"react\", \"nestjs\")"),
        name: z.string().optional().describe("Specific guideline document name to retrieve")
    }, async ({ technology, name }) => {
        const documents = await listAvailableDocuments();
        // Filter code guidelines documents
        const guidelinesDocs = documents.filter(doc => doc.category.startsWith('code_guidelines'));
        if (guidelinesDocs.length === 0) {
            return {
                content: [{
                        type: "text",
                        text: "No code guidelines documentation found."
                    }]
            };
        }
        // Filter by technology if provided
        let filteredDocs = guidelinesDocs;
        if (technology) {
            filteredDocs = guidelinesDocs.filter(doc => doc.category.includes(`code_guidelines/${technology}`));
            if (filteredDocs.length === 0) {
                return {
                    content: [{
                            type: "text",
                            text: `No code guidelines found for technology "${technology}". Available technologies:\n\n` +
                                [...new Set(guidelinesDocs.map(doc => {
                                        const parts = doc.category.split('/');
                                        return parts.length > 1 ? parts[1] : 'general';
                                    }))].join('\n')
                        }]
                };
            }
        }
        // If name is provided, get that specific document
        if (name) {
            const guidelineDoc = filteredDocs.find(doc => doc.name === name || doc.name.includes(name));
            if (!guidelineDoc) {
                return {
                    content: [{
                            type: "text",
                            text: `Guideline document "${name}" not found. Available documents:\n\n` +
                                filteredDocs.map(doc => `- ${doc.name}`).join('\n')
                        }]
                };
            }
            // Return the requested document
            const content = await readMarkdownFile(guidelineDoc.path);
            return {
                content: [{
                        type: "text",
                        text: content
                    }]
            };
        }
        // Otherwise, list all code guidelines documents
        return {
            content: [{
                    type: "text",
                    text: "Available code guidelines documentation:\n\n" +
                        filteredDocs.map(doc => `- ${doc.category}/${doc.name}`).join('\n')
                }]
        };
    });
    // Service documentation tool
    server.tool("service-docs", "Returns service documentation", {
        service: z.string().optional().describe("Filter by service name"),
        name: z.string().optional().describe("Specific service document name to retrieve")
    }, async ({ service, name }) => {
        const documents = await listAvailableDocuments();
        // Filter service documentation
        const serviceDocs = documents.filter(doc => doc.category.startsWith('service-docs'));
        if (serviceDocs.length === 0) {
            return {
                content: [{
                        type: "text",
                        text: "No service documentation found."
                    }]
            };
        }
        // Filter by service if provided
        let filteredDocs = serviceDocs;
        if (service) {
            filteredDocs = serviceDocs.filter(doc => doc.name.toLowerCase().includes(service.toLowerCase()));
            if (filteredDocs.length === 0) {
                return {
                    content: [{
                            type: "text",
                            text: `No documentation found for service "${service}". Available service docs:\n\n` +
                                serviceDocs.map(doc => `- ${doc.name}`).join('\n')
                        }]
                };
            }
        }
        // If name is provided, get that specific document
        if (name) {
            const serviceDoc = filteredDocs.find(doc => doc.name === name || doc.name.includes(name));
            if (!serviceDoc) {
                return {
                    content: [{
                            type: "text",
                            text: `Service document "${name}" not found. Available documents:\n\n` +
                                filteredDocs.map(doc => `- ${doc.name}`).join('\n')
                        }]
                };
            }
            // Return the requested document
            const content = await readMarkdownFile(serviceDoc.path);
            return {
                content: [{
                        type: "text",
                        text: content
                    }]
            };
        }
        // Otherwise, list all service documents
        return {
            content: [{
                    type: "text",
                    text: "Available service documentation:\n\n" +
                        filteredDocs.map(doc => `- ${doc.name}`).join('\n')
                }]
        };
    });
}
/**
 * List all available tools for the server
 */
export function getToolsList() {
    return [
        {
            name: "list-documentation",
            description: "Lists all available documentation files",
            parameters: {}
        },
        {
            name: "get-documentation",
            description: "Retrieves documentation by category and name",
            parameters: {
                type: "object",
                properties: {
                    category: {
                        type: "string",
                        description: "Documentation category (e.g., 'flutter/architecture')",
                        optional: true
                    },
                    name: {
                        type: "string",
                        description: "Documentation name without extension"
                    }
                },
                required: ["name"]
            }
        },
        {
            name: "flutter",
            description: "Returns all Flutter-related documentation",
            parameters: {
                type: "object",
                properties: {
                    name: {
                        type: "string",
                        description: "Specific Flutter document name to retrieve",
                        optional: true
                    }
                }
            }
        },
        {
            name: "testing",
            description: "Returns testing documentation across all technologies",
            parameters: {
                type: "object",
                properties: {
                    technology: {
                        type: "string",
                        description: "Filter testing docs by technology (e.g., \"flutter\", \"react\")",
                        optional: true
                    },
                    name: {
                        type: "string",
                        description: "Specific testing document name to retrieve",
                        optional: true
                    }
                }
            }
        },
        {
            name: "code-guidelines",
            description: "Returns code guidelines documentation",
            parameters: {
                type: "object",
                properties: {
                    technology: {
                        type: "string",
                        description: "Filter guidelines by technology (e.g., \"flutter\", \"react\", \"nestjs\")",
                        optional: true
                    },
                    name: {
                        type: "string",
                        description: "Specific guideline document name to retrieve",
                        optional: true
                    }
                }
            }
        },
        {
            name: "service-docs",
            description: "Returns service documentation",
            parameters: {
                type: "object",
                properties: {
                    service: {
                        type: "string",
                        description: "Filter by service name",
                        optional: true
                    },
                    name: {
                        type: "string",
                        description: "Specific service document name to retrieve",
                        optional: true
                    }
                }
            }
        }
    ];
}
/**
 * Execute a tool by name with the given parameters
 */
export async function executeToolByName(name, params = {}) {
    // Directly execute the tool functions
    if (name === "list-documentation") {
        const documents = await listAvailableDocuments();
        // Create a flat list of all documents with full paths for better discoverability
        const formattedDocs = documents.map(doc => {
            const categoryPath = doc.category ? `${doc.category}/` : '';
            return {
                displayName: `${categoryPath}${doc.name}`,
                path: doc.path
            };
        });
        // Sort documents alphabetically
        formattedDocs.sort((a, b) => a.displayName.localeCompare(b.displayName));
        return [{
                content: [{
                        type: "text",
                        text: formattedDocs.length > 0
                            ? "Available documentation:\n\n" + formattedDocs.map(doc => `- ${doc.displayName}`).join('\n')
                            : "Available documentation:\n\nNo documentation files found. Please check the docs directory path."
                    }]
            }];
    }
    else if (name === "get-documentation") {
        const category = params.category;
        const name = params.name;
        if (!name) {
            throw new Error("Missing required parameter: name");
        }
        // List all available documents
        const documents = await listAvailableDocuments();
        // Find the requested document
        const document = documents.find(doc => doc.name === name &&
            (!category || doc.category === category));
        if (!document) {
            // If document not found with exact name, try partial match
            const partialMatch = documents.find(doc => doc.name.includes(name) &&
                (!category || doc.category === category));
            if (partialMatch) {
                const content = await readMarkdownFile(partialMatch.path);
                return [{
                        content: [{
                                type: "text",
                                text: `Found similar document: ${partialMatch.name}\n\n${content}`
                            }]
                    }];
            }
            throw new Error(`Documentation "${name}" ${category ? `in category "${category}" ` : ''}not found.`);
        }
        // Read and return the document content
        const content = await readMarkdownFile(document.path);
        return [{
                content: [{
                        type: "text",
                        text: content
                    }]
            }];
    }
    else if (name === "flutter") {
        const name = params.name;
        const documents = await listAvailableDocuments();
        // Filter Flutter-related documents
        const flutterDocs = documents.filter(doc => doc.category.startsWith('code_guidelines/flutter'));
        if (flutterDocs.length === 0) {
            return [{
                    content: [{
                            type: "text",
                            text: "No Flutter documentation found."
                        }]
                }];
        }
        // If name is provided, get that specific document
        if (name) {
            const flutterDoc = flutterDocs.find(doc => doc.name === name || doc.name.includes(name));
            if (!flutterDoc) {
                return [{
                        content: [{
                                type: "text",
                                text: `Flutter document "${name}" not found. Available documents:\n\n` +
                                    flutterDocs.map(doc => `- ${doc.name}`).join('\n')
                            }]
                    }];
            }
            // Return the requested document
            const content = await readMarkdownFile(flutterDoc.path);
            return [{
                    content: [{
                            type: "text",
                            text: content
                        }]
                }];
        }
        // Otherwise, list all Flutter documents
        return [{
                content: [{
                        type: "text",
                        text: "Available Flutter documentation:\n\n" +
                            flutterDocs.map(doc => `- ${doc.category}/${doc.name}`).join('\n')
                    }]
            }];
    }
    else if (name === "testing") {
        const technology = params.technology;
        const name = params.name;
        const documents = await listAvailableDocuments();
        // Filter testing-related documents
        const testingDocs = documents.filter(doc => doc.name.toLowerCase().includes('test') ||
            doc.category.toLowerCase().includes('test'));
        if (testingDocs.length === 0) {
            return [{
                    content: [{
                            type: "text",
                            text: "No testing documentation found."
                        }]
                }];
        }
        // Filter by technology if provided
        let filteredDocs = testingDocs;
        if (technology) {
            filteredDocs = testingDocs.filter(doc => doc.category.toLowerCase().includes(technology.toLowerCase()));
            if (filteredDocs.length === 0) {
                return [{
                        content: [{
                                type: "text",
                                text: `No testing documentation found for technology "${technology}". Available technologies:\n\n` +
                                    [...new Set(testingDocs.map(doc => doc.category.split('/')[0]))].join('\n')
                            }]
                    }];
            }
        }
        // If name is provided, get that specific document
        if (name) {
            const testingDoc = filteredDocs.find(doc => doc.name === name || doc.name.includes(name));
            if (!testingDoc) {
                return [{
                        content: [{
                                type: "text",
                                text: `Testing document "${name}" not found. Available documents:\n\n` +
                                    filteredDocs.map(doc => `- ${doc.name}`).join('\n')
                            }]
                    }];
            }
            // Return the requested document
            const content = await readMarkdownFile(testingDoc.path);
            return [{
                    content: [{
                            type: "text",
                            text: content
                        }]
                }];
        }
        // Otherwise, list all testing documents
        return [{
                content: [{
                        type: "text",
                        text: "Available testing documentation:\n\n" +
                            filteredDocs.map(doc => `- ${doc.category}/${doc.name}`).join('\n')
                    }]
            }];
    }
    else if (name === "code-guidelines") {
        const technology = params.technology;
        const name = params.name;
        const documents = await listAvailableDocuments();
        // Filter code guidelines documents
        const guidelinesDocs = documents.filter(doc => doc.category.startsWith('code_guidelines'));
        if (guidelinesDocs.length === 0) {
            return [{
                    content: [{
                            type: "text",
                            text: "No code guidelines documentation found."
                        }]
                }];
        }
        // Filter by technology if provided
        let filteredDocs = guidelinesDocs;
        if (technology) {
            filteredDocs = guidelinesDocs.filter(doc => doc.category.includes(`code_guidelines/${technology}`));
            if (filteredDocs.length === 0) {
                return [{
                        content: [{
                                type: "text",
                                text: `No code guidelines found for technology "${technology}". Available technologies:\n\n` +
                                    [...new Set(guidelinesDocs.map(doc => {
                                            const parts = doc.category.split('/');
                                            return parts.length > 1 ? parts[1] : 'general';
                                        }))].join('\n')
                            }]
                    }];
            }
        }
        // If name is provided, get that specific document
        if (name) {
            const guidelineDoc = filteredDocs.find(doc => doc.name === name || doc.name.includes(name));
            if (!guidelineDoc) {
                return [{
                        content: [{
                                type: "text",
                                text: `Guideline document "${name}" not found. Available documents:\n\n` +
                                    filteredDocs.map(doc => `- ${doc.name}`).join('\n')
                            }]
                    }];
            }
            // Return the requested document
            const content = await readMarkdownFile(guidelineDoc.path);
            return [{
                    content: [{
                            type: "text",
                            text: content
                        }]
                }];
        }
        // Otherwise, list all code guidelines documents
        return [{
                content: [{
                        type: "text",
                        text: "Available code guidelines documentation:\n\n" +
                            filteredDocs.map(doc => `- ${doc.category}/${doc.name}`).join('\n')
                    }]
            }];
    }
    else if (name === "service-docs") {
        const service = params.service;
        const name = params.name;
        const documents = await listAvailableDocuments();
        // Filter service documentation
        const serviceDocs = documents.filter(doc => doc.category.startsWith('service-docs'));
        if (serviceDocs.length === 0) {
            return [{
                    content: [{
                            type: "text",
                            text: "No service documentation found."
                        }]
                }];
        }
        // Filter by service if provided
        let filteredDocs = serviceDocs;
        if (service) {
            filteredDocs = serviceDocs.filter(doc => doc.name.toLowerCase().includes(service.toLowerCase()));
            if (filteredDocs.length === 0) {
                return [{
                        content: [{
                                type: "text",
                                text: `No documentation found for service "${service}". Available service docs:\n\n` +
                                    serviceDocs.map(doc => `- ${doc.name}`).join('\n')
                            }]
                    }];
            }
        }
        // If name is provided, get that specific document
        if (name) {
            const serviceDoc = filteredDocs.find(doc => doc.name === name || doc.name.includes(name));
            if (!serviceDoc) {
                return [{
                        content: [{
                                type: "text",
                                text: `Service document "${name}" not found. Available documents:\n\n` +
                                    filteredDocs.map(doc => `- ${doc.name}`).join('\n')
                            }]
                    }];
            }
            // Return the requested document
            const content = await readMarkdownFile(serviceDoc.path);
            return [{
                    content: [{
                            type: "text",
                            text: content
                        }]
                }];
        }
        // Otherwise, list all service documents
        return [{
                content: [{
                        type: "text",
                        text: "Available service documentation:\n\n" +
                            filteredDocs.map(doc => `- ${doc.name}`).join('\n')
                    }]
            }];
    }
    else {
        throw new Error(`Unknown tool: ${name}`);
    }
}
//# sourceMappingURL=mcp-tools.js.map