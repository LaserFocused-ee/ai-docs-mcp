import {
    NotionConfig,
    NotionPage,
    NotionDatabase,
    NotionBlock,
    NotionUser,
    NotionComment,
    NotionRichText,
    NotionColor,
    NotionDatabaseQueryResults,
    NotionBlockChildren,
    NotionCommentResults,
    CreatePageRequest,
    UpdatePageRequest,
    AppendBlockChildrenRequest,
    CreateCommentRequest,
    DatabaseQueryRequest,
} from '../types/notion.js';

export class NotionService {
    private config: NotionConfig;
    private baseUrl = 'https://api.notion.com/v1';

    constructor(config: NotionConfig) {
        this.config = config;
    }

    private async makeRequest<T>(
        endpoint: string,
        method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET',
        body?: any
    ): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`;

        const headers: Record<string, string> = {
            'Authorization': `Bearer ${this.config.token}`,
            'Notion-Version': this.config.version || '2022-06-28',
            'Content-Type': 'application/json',
        };

        const options: RequestInit = {
            method,
            headers,
        };

        if (body && (method === 'POST' || method === 'PATCH')) {
            options.body = JSON.stringify(body);
        }

        try {
            const response = await fetch(url, options);

            if (!response.ok) {
                const errorText = await response.text();
                let errorData;
                try {
                    errorData = JSON.parse(errorText);
                } catch {
                    errorData = { message: errorText };
                }

                throw new Error(`Notion API Error ${response.status}: ${errorData.message || response.statusText}`);
            }

            const data = await response.json();
            return data as T;
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error(`Request failed: ${String(error)}`);
        }
    }

    // Database operations (only for MCP Access Database)
    async getDatabase(databaseId: string): Promise<NotionDatabase> {
        return this.makeRequest<NotionDatabase>(`/databases/${databaseId}`);
    }

    async queryDatabase(request: DatabaseQueryRequest): Promise<NotionDatabaseQueryResults> {
        const { database_id, ...queryBody } = request;
        return this.makeRequest<NotionDatabaseQueryResults>(
            `/databases/${database_id}/query`,
            'POST',
            queryBody
        );
    }

    // Page operations
    async getPage(pageId: string): Promise<NotionPage> {
        return this.makeRequest<NotionPage>(`/pages/${pageId}`);
    }

    async createPage(request: CreatePageRequest): Promise<NotionPage> {
        return this.makeRequest<NotionPage>('/pages', 'POST', request);
    }

    async updatePage(pageId: string, request: UpdatePageRequest): Promise<NotionPage> {
        return this.makeRequest<NotionPage>(`/pages/${pageId}`, 'PATCH', request);
    }

    // Block operations
    async getBlockChildren(blockId: string): Promise<NotionBlockChildren> {
        return this.makeRequest<NotionBlockChildren>(`/blocks/${blockId}/children`);
    }

    async appendBlockChildren(
        blockId: string,
        request: AppendBlockChildrenRequest
    ): Promise<NotionBlockChildren> {
        return this.makeRequest<NotionBlockChildren>(
            `/blocks/${blockId}/children`,
            'PATCH',
            request
        );
    }

    async updateBlock(blockId: string, updateData: any): Promise<NotionBlock> {
        return this.makeRequest<NotionBlock>(`/blocks/${blockId}`, 'PATCH', updateData);
    }

    async deleteBlock(blockId: string): Promise<NotionBlock> {
        return this.makeRequest<NotionBlock>(`/blocks/${blockId}`, 'DELETE');
    }

    // Comment operations
    async getComments(pageId: string): Promise<NotionCommentResults> {
        return this.makeRequest<NotionCommentResults>(`/comments?block_id=${pageId}`);
    }

    async createComment(request: CreateCommentRequest): Promise<NotionComment> {
        return this.makeRequest<NotionComment>('/comments', 'POST', request);
    }

    // Utility method for recursive block retrieval
    async getAllBlocksRecursively(blockId: string): Promise<NotionBlock[]> {
        const allBlocks: NotionBlock[] = [];
        let hasMore = true;
        let startCursor: string | undefined;

        while (hasMore) {
            const response = await this.getBlockChildren(blockId);

            for (const block of response.results) {
                allBlocks.push(block);

                // Recursively get children if they exist
                if (block.has_children) {
                    const children = await this.getAllBlocksRecursively(block.id);
                    // Add children property to the block
                    (block as any).children = children;
                }
            }

            hasMore = response.has_more;
            startCursor = response.next_cursor || undefined;
        }

        return allBlocks;
    }

    // Helper method to create rich text (needed for comments)
    createRichText(
        content: string,
        annotations?: Partial<{
            bold: boolean;
            italic: boolean;
            strikethrough: boolean;
            underline: boolean;
            code: boolean;
            color: NotionColor;
        }>,
        link?: string
    ): NotionRichText {
        return {
            type: 'text' as const,
            text: {
                content,
                link: link ? { url: link } : null,
            },
            annotations: {
                bold: false,
                italic: false,
                strikethrough: false,
                underline: false,
                code: false,
                color: 'default' as const,
                ...annotations,
            },
            plain_text: content,
        };
    }
} 