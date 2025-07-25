import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { GuruService } from '../services/guru.js';

interface GuruCard {
    id: string;
    title?: string;
    preferredPhrase?: string;
    content?: string;
    collection?: { name: string };
    owner?: { firstName?: string; lastName?: string; email?: string };
    lastModified?: string;
    verificationState?: string;
    dateCreated?: string;
}

interface GuruSearchResponse {
    results?: GuruCard[];
    totalResults?: number;
    hasMore?: boolean;
}

/**
 * Configure Guru API tools
 */
export function configureGuruTools(server: McpServer): void {
    const guruService = new GuruService();

    // Check if Guru credentials are available
    const hasGuruCredentials = process.env.GURU_TOKEN;
    if (hasGuruCredentials === undefined || hasGuruCredentials === '') {
        // Note: Guru tools will not be functional without GURU_TOKEN
    }

    // Tool to list/search Guru cards
    server.tool(
        'guru-list-cards',
        'List and search Guru cards with optional filters',
        {
            searchTerms: z.string().optional().describe('Search terms for card title/content'),
            maxResults: z.number().optional().describe('Maximum number of results (max: 50)'),
            showArchived: z.boolean().optional().describe('Include archived cards'),
            sortField: z.string().optional().describe('Field to sort by (lastModified, title, dateCreated, etc.)'),
            sortOrder: z.enum(['asc', 'desc']).optional().describe('Sort order'),
            query: z.string().optional().describe('Advanced Guru Query Language query'),
        },
        async ({ searchTerms, maxResults, showArchived, sortField, sortOrder, query }): Promise<{ content: Array<{ type: 'text'; text: string }> }> => {
            try {
                const searchParams = {
                    ...(searchTerms !== undefined && searchTerms !== '' && { searchTerms }),
                    ...(maxResults !== undefined && maxResults > 0 && { maxResults }),
                    ...(showArchived !== undefined && { showArchived }),
                    ...(sortField !== undefined && sortField !== '' && { sortField }),
                    ...(sortOrder !== undefined && { sortOrder }),
                    ...(query !== undefined && query !== '' && { q: query }),
                };

                const response = await guruService.searchCards(searchParams);

                // Handle different response formats
                let cards: GuruCard[];
                let totalResults: number | undefined;
                let hasMore: boolean | undefined;

                if (Array.isArray(response)) {
                    // Direct array response (what we're actually getting)
                    cards = response as GuruCard[];
                    totalResults = response.length;
                    hasMore = false;
                } else if (response !== null && typeof response === 'object' && 'results' in response) {
                    // Expected object with results array
                    const searchResponse = response as GuruSearchResponse;
                    cards = searchResponse.results ?? [];
                    totalResults = searchResponse.totalResults;
                    hasMore = searchResponse.hasMore;
                } else {
                    throw new Error(`Invalid response structure: ${JSON.stringify(response)}`);
                }

                if (cards.length === 0) {
                    return {
                        content: [{
                            type: 'text',
                            text: 'No cards found matching the search criteria.',
                        }],
                    };
                }

                const cardsList = cards.map(card => {
                    const title = card.preferredPhrase ?? card.title ?? 'Untitled';
                    const preview = (card.content !== undefined && card.content !== '') ? card.content.replace(/<[^>]*>/g, '').substring(0, 200) : 'No content';
                    const collection = card.collection?.name ?? 'Unknown Collection';
                    const owner = card.owner ? `${card.owner.firstName ?? ''} ${card.owner.lastName ?? ''}`.trim() : 'Unknown Owner';

                    return `## ${title}\n` +
                        `**ID:** ${card.id}\n` +
                        `**Collection:** ${collection}\n` +
                        `**Last Modified:** ${card.lastModified ?? 'Unknown'}\n` +
                        `**Owner:** ${owner}\n` +
                        `**Status:** ${card.verificationState ?? 'Unknown'}\n` +
                        `**Preview:** ${preview}${preview.length >= 200 ? '...' : ''}\n`;
                }).join('\n---\n');

                const summaryText = totalResults !== undefined && hasMore !== undefined
                    ? `Found ${cards.length} cards (Total: ${totalResults}, Has More: ${hasMore})`
                    : `Found ${cards.length} cards`;

                return {
                    content: [{
                        type: 'text',
                        text: `${summaryText}:\n\n${cardsList}`,
                    }],
                };
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                if (errorMessage.includes('GURU_TOKEN environment variable')) {
                    return {
                        content: [{
                            type: 'text',
                            text: '🔐 Guru API not configured: GURU_TOKEN environment variable is required.\n\nTo use Guru tools, set GURU_TOKEN in format "username:token" in your MCP configuration.',
                        }],
                    };
                }

                return {
                    content: [{
                        type: 'text',
                        text: `Error searching Guru cards: ${errorMessage}`,
                    }],
                };
            }
        },
    );

    // Tool to read a specific Guru card
    server.tool(
        'guru-read-card',
        'Read the full content of a specific Guru card by ID',
        {
            cardId: z.string().describe('The UUID of the Guru card to read'),
        },
        async ({ cardId }): Promise<{ content: Array<{ type: 'text'; text: string }> }> => {
            try {
                const card = await guruService.getCard(cardId) as GuruCard;

                // Extract attachments from content
                const attachments = guruService.extractAttachments(card.content ?? '');
                const attachmentsList = attachments.length > 0
                    ? `\n\n**Attachments (${attachments.length}):**\n${attachments.map(att => `- ${att.url}`).join('\n')}`
                    : '';

                return {
                    content: [{
                        type: 'text',
                        text: `# ${card.title ?? 'Untitled'}\n\n` +
                            `**ID:** ${card.id}\n` +
                            `**Collection:** ${card.collection?.name ?? 'Unknown Collection'}\n` +
                            `**Created:** ${card.dateCreated ?? 'Unknown'}\n` +
                            `**Last Modified:** ${card.lastModified ?? 'Unknown'}\n` +
                            `**Owner:** ${card.owner?.firstName ?? ''} ${card.owner?.lastName ?? ''} (${card.owner?.email ?? ''})\n` +
                            `**Verification Status:** ${card.verificationState ?? 'Unknown'}\n` +
                            `${attachmentsList}\n\n` +
                            `---\n\n${card.content ?? 'No content'}`,
                    }],
                };
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                if (errorMessage.includes('GURU_TOKEN environment variable')) {
                    return {
                        content: [{
                            type: 'text',
                            text: '🔐 Guru API not configured: GURU_TOKEN environment variable is required.\n\nTo use Guru tools, set GURU_TOKEN in format "username:token" in your MCP configuration.',
                        }],
                    };
                }

                return {
                    content: [{
                        type: 'text',
                        text: `Error reading Guru card: ${errorMessage}`,
                    }],
                };
            }
        },
    );

    // Tool to get attachments for a Guru card
    server.tool(
        'guru-get-card-attachments',
        'List and optionally download attachments from a Guru card',
        {
            cardId: z.string().describe('The UUID of the Guru card'),
            downloadFirst: z.boolean().optional().describe('Whether to download the first attachment and return its content'),
        },
        async ({ cardId, downloadFirst = false }): Promise<{ content: Array<{ type: 'text'; text: string }> }> => {
            try {
                const attachments = await guruService.getCardAttachments(cardId);

                if (attachments.length === 0) {
                    return {
                        content: [{
                            type: 'text',
                            text: 'No attachments found for this card.',
                        }],
                    };
                }

                let result = `Found ${attachments.length} attachment(s):\n\n`;

                attachments.forEach((attachment, index) => {
                    result += `${index + 1}. **File ID:** ${attachment.fileId}\n   **URL:** ${attachment.url}\n\n`;
                });

                // Optionally download the first attachment
                if (downloadFirst && attachments.length > 0) {
                    try {
                        const fileData = await guruService.downloadAttachment(attachments[0].fileId);
                        result += '\n---\n\n**First Attachment Downloaded:**\n';
                        result += `**Size:** ${fileData.length} bytes\n`;
                        result += `**File ID:** ${attachments[0].fileId}\n`;

                        // Try to detect if it's text content
                        const isText = fileData.every(byte => byte < 128);
                        if (isText && fileData.length < 10000) {
                            result += `**Content:**\n\`\`\`\n${fileData.toString('utf-8')}\n\`\`\``;
                        } else {
                            result += `**Content:** Binary file (${fileData.length} bytes) - use the file ID to download separately`;
                        }
                    } catch (downloadError) {
                        result += `\n---\n\n**Download Error:** ${downloadError instanceof Error ? downloadError.message : 'Unknown error'}`;
                    }
                }

                return {
                    content: [{
                        type: 'text',
                        text: result,
                    }],
                };
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                if (errorMessage.includes('GURU_TOKEN environment variable')) {
                    return {
                        content: [{
                            type: 'text',
                            text: '🔐 Guru API not configured: GURU_TOKEN environment variable is required.\n\nTo use Guru tools, set GURU_TOKEN in format "username:token" in your MCP configuration.',
                        }],
                    };
                }

                return {
                    content: [{
                        type: 'text',
                        text: `Error getting card attachments: ${errorMessage}`,
                    }],
                };
            }
        },
    );
}
