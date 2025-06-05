import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { NotionService } from '../services/NotionService.js';

// Get Notion service instance
function getNotionService(): NotionService {
    const token = process.env.NOTION_TOKEN;
    if (!token) {
        throw new Error('NOTION_TOKEN environment variable is required');
    }

    return new NotionService({
        token,
        version: '2022-06-28'
    });
}

// MCP Access Database ID (hardcoded as per conversation)
const MCP_ACCESS_DATABASE_ID = '20906f52-e1c0-80b9-9479-fcbe9e201770';

export const notionTools: Tool[] = [
    // MCP Access Database Tools
    {
        name: 'notion-get-mcp-access-database',
        description: 'Get details of the MCP Access Database',
        inputSchema: {
            type: 'object',
            properties: {}
        }
    },

    {
        name: 'notion-query-mcp-access-database',
        description: 'Query the MCP Access Database to retrieve pages',
        inputSchema: {
            type: 'object',
            properties: {
                filter: {
                    type: 'object',
                    description: 'Filter criteria for database query'
                },
                sorts: {
                    type: 'array',
                    description: 'Sort criteria for results',
                    items: {
                        type: 'object',
                        properties: {
                            property: {
                                type: 'string',
                                description: 'Property name to sort by'
                            },
                            direction: {
                                type: 'string',
                                enum: ['ascending', 'descending'],
                                description: 'Sort direction'
                            }
                        }
                    }
                },
                pageSize: {
                    type: 'number',
                    description: 'Maximum number of pages to return (default: 100)',
                    maximum: 100
                },
                startCursor: {
                    type: 'string',
                    description: 'Pagination cursor'
                }
            }
        }
    },

    {
        name: 'notion-create-mcp-access-entry',
        description: 'Create a new entry in the MCP Access Database',
        inputSchema: {
            type: 'object',
            properties: {
                docName: {
                    type: 'string',
                    description: 'The name of the document (title property)'
                },
                categories: {
                    type: 'array',
                    description: 'Categories to assign (multi-select)',
                    items: {
                        type: 'string'
                    }
                },
                children: {
                    type: 'array',
                    description: 'Block content to add to the page',
                    items: {
                        type: 'object'
                    }
                }
            },
            required: ['docName']
        }
    },

    // Page Management Tools
    {
        name: 'notion-get-page',
        description: 'Get details of a specific page',
        inputSchema: {
            type: 'object',
            properties: {
                pageId: {
                    type: 'string',
                    description: 'The ID of the page to retrieve'
                }
            },
            required: ['pageId']
        }
    },

    {
        name: 'notion-update-page',
        description: 'Update properties or metadata of a page',
        inputSchema: {
            type: 'object',
            properties: {
                pageId: {
                    type: 'string',
                    description: 'The ID of the page to update'
                },
                properties: {
                    type: 'object',
                    description: 'Page properties to update'
                },
                archived: {
                    type: 'boolean',
                    description: 'Whether to archive the page'
                }
            },
            required: ['pageId']
        }
    },

    // Block Management Tools
    {
        name: 'notion-get-page-blocks',
        description: 'Get all blocks (content) from a page',
        inputSchema: {
            type: 'object',
            properties: {
                pageId: {
                    type: 'string',
                    description: 'The ID of the page to get blocks from'
                },
                recursive: {
                    type: 'boolean',
                    description: 'Whether to recursively get all nested blocks (default: false)',
                    default: false
                }
            },
            required: ['pageId']
        }
    },

    {
        name: 'notion-append-blocks',
        description: 'Add new blocks to a page',
        inputSchema: {
            type: 'object',
            properties: {
                pageId: {
                    type: 'string',
                    description: 'The ID of the page to add blocks to'
                },
                children: {
                    type: 'array',
                    description: 'Array of block objects to append',
                    items: {
                        type: 'object'
                    }
                }
            },
            required: ['pageId', 'children']
        }
    },

    {
        name: 'notion-update-block',
        description: 'Update an existing block',
        inputSchema: {
            type: 'object',
            properties: {
                blockId: {
                    type: 'string',
                    description: 'The ID of the block to update'
                },
                updateData: {
                    type: 'object',
                    description: 'Data to update the block with'
                }
            },
            required: ['blockId', 'updateData']
        }
    },

    {
        name: 'notion-delete-block',
        description: 'Delete a block',
        inputSchema: {
            type: 'object',
            properties: {
                blockId: {
                    type: 'string',
                    description: 'The ID of the block to delete'
                }
            },
            required: ['blockId']
        }
    },

    // Comment Management Tools
    {
        name: 'notion-get-comments',
        description: 'Get comments for a page',
        inputSchema: {
            type: 'object',
            properties: {
                pageId: {
                    type: 'string',
                    description: 'The ID of the page to get comments for'
                }
            },
            required: ['pageId']
        }
    },

    {
        name: 'notion-create-comment',
        description: 'Create a comment on a page',
        inputSchema: {
            type: 'object',
            properties: {
                pageId: {
                    type: 'string',
                    description: 'The ID of the page to comment on'
                },
                content: {
                    type: 'string',
                    description: 'The text content of the comment'
                }
            },
            required: ['pageId', 'content']
        }
    }
];

// Tool handlers
export async function handleNotionTool(name: string, args: any): Promise<any> {
    const notion = getNotionService();

    try {
        switch (name) {
            // MCP Access Database
            case 'notion-get-mcp-access-database':
                return await notion.getDatabase(MCP_ACCESS_DATABASE_ID);

            case 'notion-query-mcp-access-database':
                return await notion.queryDatabase({
                    database_id: MCP_ACCESS_DATABASE_ID,
                    filter: args.filter,
                    sorts: args.sorts,
                    page_size: args.pageSize,
                    start_cursor: args.startCursor
                });

            case 'notion-create-mcp-access-entry':
                const mcpEntryData = {
                    parent: {
                        type: 'database_id' as const,
                        database_id: MCP_ACCESS_DATABASE_ID
                    },
                    properties: {
                        'Doc name': {
                            type: 'title',
                            title: [{ type: 'text', text: { content: args.docName } }]
                        }
                    }
                };

                if (args.categories?.length) {
                    (mcpEntryData.properties as any)['Category'] = {
                        type: 'multi_select',
                        multi_select: args.categories.map((cat: string) => ({ name: cat }))
                    };
                }

                if (args.children?.length) {
                    (mcpEntryData as any).children = args.children;
                }

                return await notion.createPage(mcpEntryData);

            // Page Management
            case 'notion-get-page':
                return await notion.getPage(args.pageId);

            case 'notion-update-page':
                return await notion.updatePage(args.pageId, {
                    properties: args.properties,
                    archived: args.archived
                });

            // Block Management
            case 'notion-get-page-blocks':
                if (args.recursive) {
                    return await notion.getAllBlocksRecursively(args.pageId);
                } else {
                    return await notion.getBlockChildren(args.pageId);
                }

            case 'notion-append-blocks':
                return await notion.appendBlockChildren(args.pageId, {
                    children: args.children
                });

            case 'notion-update-block':
                return await notion.updateBlock(args.blockId, args.updateData);

            case 'notion-delete-block':
                return await notion.deleteBlock(args.blockId);

            // Comment Management
            case 'notion-get-comments':
                return await notion.getComments(args.pageId);

            case 'notion-create-comment':
                return await notion.createComment({
                    parent: { type: 'page_id', page_id: args.pageId },
                    rich_text: [notion.createRichText(args.content)]
                });

            default:
                throw new Error(`Unknown Notion tool: ${name}`);
        }
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Notion API error: ${error.message}`);
        }
        throw new Error(`Notion API error: ${String(error)}`);
    }
} 