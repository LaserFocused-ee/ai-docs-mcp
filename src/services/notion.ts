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
import { ConversionOptions, ConversionResult, DEFAULT_CONVERSION_OPTIONS } from '../types/markdown.js';
import { markdownToNotion, notionToMarkdown, extractTitleFromMarkdown, extractPageTitle } from '../utils/converters.js';
import { NotionBlockData } from '../utils/notion-blocks.js';
import { readMarkdownFile, validateFilePath } from '../utils/file-system.js';
import path from 'path';

export class NotionService {
    private config: NotionConfig;
    private baseUrl = 'https://api.notion.com/v1';
    private propertyTypeCache: Map<string, Map<string, string>> = new Map();

    constructor(config: NotionConfig) {
        this.config = config;
    }

    private async getPropertyType(databaseId: string, propertyName: string): Promise<string | null> {
        // Check cache first
        const dbCache = this.propertyTypeCache.get(databaseId);
        if (dbCache?.has(propertyName)) {
            return dbCache.get(propertyName) || null;
        }

        try {
            const database = await this.getDatabase(databaseId);
            const propertyType = database.properties[propertyName]?.type || null;
            
            // Cache the result
            if (!this.propertyTypeCache.has(databaseId)) {
                this.propertyTypeCache.set(databaseId, new Map());
            }
            this.propertyTypeCache.get(databaseId)!.set(propertyName, propertyType || '');
            
            return propertyType;
        } catch (error) {
            console.error(`Failed to get property type for ${propertyName}:`, error);
            return null;
        }
    }

    private async setPropertyValue(
        properties: any, 
        propertyName: string, 
        value: any, 
        databaseId: string
    ): Promise<void> {
        const propertyType = await this.getPropertyType(databaseId, propertyName);
        
        if (!propertyType) {
            console.warn(`Property ${propertyName} not found in database schema`);
            return;
        }

        console.log(`Setting ${propertyName} as ${propertyType} with value:`, value);

        switch (propertyType) {
            case 'select':
                properties[propertyName] = { select: { name: String(value) } };
                break;
                
            case 'multi_select':
                properties[propertyName] = { 
                    multi_select: Array.isArray(value) 
                        ? value.map(v => ({ name: String(v) }))
                        : [{ name: String(value) }]
                };
                break;
                
            case 'title':
                properties[propertyName] = { 
                    title: [{ text: { content: String(value) } }] 
                };
                break;
                
            case 'rich_text':
                properties[propertyName] = { 
                    rich_text: [{ text: { content: String(value) } }] 
                };
                break;
                
            case 'checkbox':
                properties[propertyName] = { checkbox: Boolean(value) };
                break;
                
            case 'number':
                properties[propertyName] = { number: Number(value) };
                break;
                
            case 'url':
                properties[propertyName] = { url: String(value) };
                break;
                
            default:
                console.warn(`Unsupported property type ${propertyType} for ${propertyName}`);
        }
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

    async updateDatabase(databaseId: string, updateData: any): Promise<NotionDatabase> {
        return this.makeRequest<NotionDatabase>(`/databases/${databaseId}`, 'PATCH', updateData);
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

    async archivePage(pageId: string): Promise<NotionPage> {
        return this.makeRequest<NotionPage>(`/pages/${pageId}`, 'PATCH', {
            archived: true
        });
    }

    // Block operations
    async getBlockChildren(blockId: string, startCursor?: string): Promise<NotionBlockChildren> {
        const params = new URLSearchParams();
        if (startCursor) {
            params.append('start_cursor', startCursor);
        }
        const queryString = params.toString();
        const url = `/blocks/${blockId}/children${queryString ? `?${queryString}` : ''}`;
        return this.makeRequest<NotionBlockChildren>(url);
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

    /**
     * Append blocks to a page/block with automatic chunking for 100-block limit
     */
    async appendBlockChildrenChunked(
        blockId: string,
        blocks: any[],
        maxBlocksPerRequest: number = 100
    ): Promise<NotionBlockChildren[]> {
        const results: NotionBlockChildren[] = [];

        // Split blocks into chunks of maxBlocksPerRequest
        for (let i = 0; i < blocks.length; i += maxBlocksPerRequest) {
            const chunk = blocks.slice(i, i + maxBlocksPerRequest);

            const result = await this.appendBlockChildren(blockId, {
                children: chunk
            });

            results.push(result);
        }

        return results;
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

    // Legacy sequential method - kept for internal use in parallel implementation
    private async getAllBlocksRecursively(blockId: string): Promise<NotionBlock[]> {
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

    // Optimized breadth-first parallel version for fetching Notion blocks
    async getAllBlocksRecursivelyParallel(blockId: string, maxConcurrency: number = 5): Promise<NotionBlock[]> {
        // Create a semaphore to limit concurrent API calls
        const { Sema } = await import('async-sema');
        const semaphore = new Sema(maxConcurrency, {
            capacity: maxConcurrency
        });

        // Helper to fetch all pages for a single block (handles pagination)
        const fetchAllPagesForBlock = async (parentBlockId: string): Promise<NotionBlock[]> => {
            const allBlocks: NotionBlock[] = [];
            let hasMore = true;
            let startCursor: string | undefined;

            while (hasMore) {
                await semaphore.acquire();
                try {
                    const response = await this.getBlockChildren(parentBlockId, startCursor);
                    allBlocks.push(...response.results);
                    hasMore = response.has_more;
                    startCursor = response.next_cursor || undefined;
                } finally {
                    semaphore.release();
                }
            }

            return allBlocks;
        };

        // Breadth-first traversal - fetch level by level
        const allBlocks: NotionBlock[] = [];
        let currentLevelBlocks = [{ id: blockId, has_children: true } as NotionBlock];
        let level = 0;

        while (currentLevelBlocks.length > 0) {
            level++;

            // Fetch children for all blocks at current level in parallel
            const fetchPromises = currentLevelBlocks
                .filter(block => block.has_children)
                .map(async (block) => {
                    const children = await fetchAllPagesForBlock(block.id);
                    return { parentId: block.id, children };
                });

            const levelResults = await Promise.all(fetchPromises);

            // Collect all children for the next level
            const nextLevelBlocks: NotionBlock[] = [];

            for (const { parentId, children } of levelResults) {
                // Don't add to allBlocks if this is the root page call
                if (level > 1 || parentId !== blockId) {
                    allBlocks.push(...children);
                } else {
                    // For root level, just add to allBlocks without the page itself
                    allBlocks.push(...children);
                }

                // Add children with children to next level
                nextLevelBlocks.push(...children.filter(child => child.has_children));

                // Attach children to their parent blocks (for structure preservation)
                if (level > 1) {
                    const parentBlock = allBlocks.find(b => b.id === parentId);
                    if (parentBlock) {
                        (parentBlock as any).children = children;
                    }
                } else {
                    // For level 1, attach children to blocks in allBlocks
                    for (const block of allBlocks) {
                        if (block.id === parentId) {
                            (block as any).children = children;
                        }
                    }
                }
            }

            currentLevelBlocks = nextLevelBlocks;
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

    // ========================================
    // HIGH-LEVEL METHODS FOR MCP TOOLS
    // ========================================

    /**
     * Create a Notion page from markdown content
     */
    async createPageFromMarkdown(
        databaseId: string,
        options: {
            markdown?: string;
            filePath?: string;
            pageTitle?: string;
            conversionOptions?: Partial<ConversionOptions>;
            metadata?: {
                category?: string;
                tags?: string[];
                description?: string;
                status?: string;
            };
        }
    ): Promise<{ page: NotionPage; conversionResult: ConversionResult }> {
        try {
            let markdown: string;
            let { pageTitle } = options;

            // Determine which input to use
            if (options.markdown && options.filePath) {
                throw new Error('Cannot provide both markdown content and filePath. Please provide only one.');
            }

            if (options.markdown) {
                markdown = options.markdown;
            } else if (options.filePath) {
                // Read file and extract title if not provided
                markdown = await readMarkdownFile(options.filePath);

                if (!pageTitle) {
                    const filename = path.basename(options.filePath, '.md');
                    pageTitle = filename.replace(/[-_]/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
                }
            } else {
                throw new Error('Either markdown content or filePath must be provided.');
            }

            // Convert markdown to blocks using utility function
            const conversionResult = await markdownToNotion(markdown, options.conversionOptions || {});

            if (conversionResult.errors.length > 0) {
                console.warn('Conversion warnings:', conversionResult.warnings);
            }

            const blocks = conversionResult.content as NotionBlockData[];

            // Extract title from markdown if not provided
            if (!pageTitle) {
                const extractedTitle = extractTitleFromMarkdown(markdown);
                pageTitle = extractedTitle || 'Untitled';
            }

            // Get the correct title property name for this database
            const titlePropertyName = await this.getTitlePropertyName(databaseId);

            // Build page properties
            let properties: any = {
                [titlePropertyName]: {
                    type: "title",
                    title: [
                        {
                            type: "text",
                            text: {
                                content: pageTitle || 'Untitled'
                            }
                        }
                    ]
                }
            };

            // Ensure database has required properties if metadata is provided
            if (options.metadata && Object.keys(options.metadata).length > 0) {
                await this.ensureDatabaseProperties(databaseId);
            }

            // Smart property setting for all metadata
            if (options.metadata) {
                // Handle description
                if (options.metadata.description) {
                    await this.setPropertyValue(
                        properties, 
                        'Description', 
                        options.metadata.description, 
                        databaseId
                    );
                }

                // Handle category with smart detection
                if (options.metadata.category) {
                    await this.setPropertyValue(
                        properties, 
                        'Category', 
                        options.metadata.category, 
                        databaseId
                    );
                }

                // Handle tags
                if (options.metadata.tags && Array.isArray(options.metadata.tags)) {
                    await this.setPropertyValue(
                        properties, 
                        'Tags', 
                        options.metadata.tags, 
                        databaseId
                    );
                }

                // Handle status
                if (options.metadata.status) {
                    await this.setPropertyValue(
                        properties, 
                        'Status', 
                        options.metadata.status, 
                        databaseId
                    );
                }
            }

            // Create the page with retry logic for property type mismatches
            let page: NotionPage;
            let createdPageId: string | null = null;
            let retryCount = 0;
            const maxRetries = 1;

            while (retryCount <= maxRetries) {
                try {
                    page = await this.createPage({
                        parent: { type: 'database_id' as const, database_id: databaseId },
                        properties
                    });
                    createdPageId = page.id;
                    break; // Success, exit loop
                } catch (error: any) {
                    if (
                        retryCount < maxRetries && 
                        error.message?.includes('is expected to be')
                    ) {
                        console.log('Property type mismatch detected, clearing cache and retrying...');
                        // Clear cache to force re-detection
                        this.propertyTypeCache.delete(databaseId);
                        retryCount++;
                        
                        // Rebuild properties with fresh type detection
                        properties = {
                            [titlePropertyName]: {
                                type: "title",
                                title: [
                                    {
                                        type: "text",
                                        text: {
                                            content: pageTitle || 'Untitled'
                                        }
                                    }
                                ]
                            }
                        };

                        // Re-apply metadata with fresh detection
                        if (options.metadata) {
                            if (options.metadata.description) {
                                await this.setPropertyValue(properties, 'Description', options.metadata.description, databaseId);
                            }
                            if (options.metadata.category) {
                                await this.setPropertyValue(properties, 'Category', options.metadata.category, databaseId);
                            }
                            if (options.metadata.tags && Array.isArray(options.metadata.tags)) {
                                await this.setPropertyValue(properties, 'Tags', options.metadata.tags, databaseId);
                            }
                            if (options.metadata.status) {
                                await this.setPropertyValue(properties, 'Status', options.metadata.status, databaseId);
                            }
                        }
                    } else {
                        // If we created a page but failed, clean it up
                        if (createdPageId) {
                            try {
                                await this.archivePage(createdPageId);
                                console.log('Cleaned up failed page creation:', createdPageId);
                            } catch (cleanupError) {
                                console.error('Failed to cleanup page:', cleanupError);
                            }
                        }
                        throw error; // Re-throw if not a type mismatch or max retries reached
                    }
                }
            }

            // Add blocks to the page if any, using chunked method for large documents
            try {
                if (blocks.length > 0) {
                    await this.appendBlockChildrenChunked(page!.id, blocks);
                }
            } catch (error) {
                // If block addition fails, clean up the page
                if (page!) {
                    try {
                        await this.archivePage(page!.id);
                        console.log('Cleaned up page after block addition failed:', page!.id);
                    } catch (cleanupError) {
                        console.error('Failed to cleanup page:', cleanupError);
                    }
                }
                throw error;
            }

            console.log(`✅ Page created successfully with smart property detection`);
            console.log(`   Property types detected:`, Array.from(this.propertyTypeCache.get(databaseId)?.entries() || []));

            return { page: page!, conversionResult };
        } catch (error) {
            throw new Error(`Failed to create page from markdown: ${error}`);
        }
    }

    /**
 * Export a Notion page to markdown
 */
    async exportPageToMarkdown(
        pageId: string,
        options: Partial<ConversionOptions> = {}
    ): Promise<{ markdown: string; page: NotionPage; conversionResult: ConversionResult }> {
        try {
            // Get the page details
            const page = await this.getPage(pageId);

            // Get all page blocks using optimized breadth-first parallel fetching
            const blocks = await this.getAllBlocksRecursivelyParallel(pageId, 8);

            // Convert to markdown using utility function
            const conversionResult = await notionToMarkdown(blocks, options);
            const markdown = conversionResult.content as string;

            return { markdown, page, conversionResult };
        } catch (error) {
            throw new Error(`Failed to export page to markdown: ${error}`);
        }
    }

    /**
     * Update page metadata (properties only)
     */
    async updatePageMetadata(
        pageId: string,
        metadata: {
            category?: string;
            tags?: string[];
            description?: string;
            status?: string;
        }
    ): Promise<NotionPage> {
        try {
            // Build update properties
            const properties: any = {};

            if (metadata.category) {
                properties.Category = {
                    select: { name: metadata.category }
                };
            }

            if (metadata.tags) {
                properties.Tags = {
                    multi_select: metadata.tags.map(tag => ({ name: tag }))
                };
            }

            if (metadata.description) {
                properties.Description = {
                    rich_text: [
                        {
                            text: { content: metadata.description }
                        }
                    ]
                };
            }

            if (metadata.status) {
                properties.Status = {
                    select: { name: metadata.status }
                };
            }

            return await this.updatePage(pageId, { properties });
        } catch (error) {
            throw new Error(`Failed to update page metadata: ${error}`);
        }
    }

    /**
 * Update page content (create new page, keep old page)
 */
    async updatePageContent(
        pageId: string,
        options: {
            markdown?: string;
            filePath?: string;
            conversionOptions?: Partial<ConversionOptions>;
        }
    ): Promise<{ conversionResult: ConversionResult; newPageId: string }> {
        try {
            // Get markdown content
            let markdown: string;

            if (!options.markdown && !options.filePath) {
                throw new Error('Either markdown content or filePath must be provided');
            }

            if (options.markdown && options.filePath) {
                throw new Error('Provide either markdown content or filePath, not both');
            }

            if (options.filePath) {
                if (!validateFilePath(options.filePath) || !options.filePath.endsWith('.md')) {
                    throw new Error(`Invalid file path: ${options.filePath}. Must be a .md file with valid path.`);
                }
                markdown = await readMarkdownFile(options.filePath);
            } else {
                markdown = options.markdown!;
            }

            // Get current page to preserve metadata
            const currentPage = await this.getPage(pageId);

            // Extract current metadata
            const properties = currentPage.properties;
            const pageTitle = extractPageTitle(currentPage);

            // Get parent database
            const parent = currentPage.parent;
            if (parent.type !== 'database_id') {
                throw new Error('Can only update pages that are in a database');
            }

            // Convert markdown to blocks
            const conversionResult = await markdownToNotion(markdown, options.conversionOptions);
            const blocks = conversionResult.content as NotionBlockData[];

            // Create new page with same properties
            const newPage = await this.createPage({
                parent: { type: 'database_id' as const, database_id: parent.database_id },
                properties: properties
            });

            // Add blocks to new page using chunked method for large documents
            if (blocks.length > 0) {
                await this.appendBlockChildrenChunked(newPage.id, blocks);
            }

            // Archive the old page to complete the replacement
            await this.archivePage(pageId);

            return { conversionResult, newPageId: newPage.id };
        } catch (error) {
            throw new Error(`Failed to update page content: ${error}`);
        }
    }

    /**
     * List/query database pages with advanced filtering and sorting
     */
    async listDatabasePages(
        databaseId: string,
        options: {
            limit?: number;
            search?: string;
            category?: string;
            tags?: string[];
            status?: string;
            sortBy?: 'title' | 'last_edited' | 'created' | 'category' | 'status';
            sortOrder?: 'ascending' | 'descending';
            startCursor?: string;
        } = {}
    ): Promise<NotionDatabaseQueryResults> {
        try {
            const {
                limit = 10,
                search,
                category,
                tags,
                status,
                sortBy = 'last_edited',
                sortOrder = 'descending',
                startCursor
            } = options;

            // Get the title property name for this database
            const titlePropertyName = await this.getTitlePropertyName(databaseId);

            // Build filter conditions
            const filters: any[] = [];

            // Text search across title and description
            if (search) {
                filters.push({
                    or: [
                        {
                            property: titlePropertyName,
                            title: {
                                contains: search
                            }
                        },
                        {
                            property: 'Description',
                            rich_text: {
                                contains: search
                            }
                        }
                    ]
                });
            }

            // Category filter
            if (category) {
                filters.push({
                    property: 'Category',
                    select: {
                        equals: category
                    }
                });
            }

            // Status filter
            if (status) {
                filters.push({
                    property: 'Status',
                    select: {
                        equals: status
                    }
                });
            }

            // Tags filter (any of the specified tags)
            if (tags && tags.length > 0) {
                if (tags.length === 1) {
                    filters.push({
                        property: 'Tags',
                        multi_select: {
                            contains: tags[0]
                        }
                    });
                } else {
                    // Multiple tags - find pages that contain any of these tags
                    filters.push({
                        or: tags.map(tag => ({
                            property: 'Tags',
                            multi_select: {
                                contains: tag
                            }
                        }))
                    });
                }
            }

            // Build final filter
            let filter: any = undefined;
            if (filters.length === 1) {
                filter = filters[0];
            } else if (filters.length > 1) {
                filter = { and: filters };
            }

            // Build sort configuration
            const sorts: any[] = [];

            switch (sortBy) {
                case 'title':
                    sorts.push({
                        property: titlePropertyName,
                        direction: sortOrder
                    });
                    break;
                case 'category':
                    sorts.push({
                        property: 'Category',
                        direction: sortOrder
                    });
                    break;
                case 'status':
                    sorts.push({
                        property: 'Status',
                        direction: sortOrder
                    });
                    break;
                case 'created':
                    sorts.push({
                        timestamp: 'created_time',
                        direction: sortOrder
                    });
                    break;
                case 'last_edited':
                default:
                    sorts.push({
                        timestamp: 'last_edited_time',
                        direction: sortOrder
                    });
                    break;
            }

            // Execute query
            const queryRequest: any = {
                database_id: databaseId,
                page_size: Math.min(limit, 100), // Notion API max is 100
            };

            if (filter) {
                queryRequest.filter = filter;
            }

            if (sorts.length > 0) {
                queryRequest.sorts = sorts;
            }

            if (startCursor) {
                queryRequest.start_cursor = startCursor;
            }

            return await this.queryDatabase(queryRequest);
        } catch (error) {
            throw new Error(`Failed to query database pages: ${error}`);
        }
    }

    /**
     * Find the title property name in a database
     */
    private async getTitlePropertyName(databaseId: string): Promise<string> {
        try {
            const database = await this.getDatabase(databaseId);
            const properties = database.properties;

            // Find the property with type "title"
            for (const [propertyName, property] of Object.entries(properties)) {
                if ((property as any).type === 'title') {
                    return propertyName;
                }
            }

            // Fallback to common names if no title property found
            return 'title';
        } catch (error) {
            console.warn('Warning: Could not determine title property name:', error);
            return 'title';
        }
    }

    /**
     * Ensure database has required properties for metadata
     */
    private async ensureDatabaseProperties(databaseId: string): Promise<void> {
        try {
            const database = await this.getDatabase(databaseId);
            const existingProperties = database.properties;
            const propertiesToCreate: any = {};

            // Helper to check if property exists with correct type
            const needsProperty = (name: string, expectedType: string): boolean => {
                return !existingProperties[name] || existingProperties[name].type !== expectedType;
            };

            // Only add properties that don't exist or have wrong type
            if (needsProperty('Description', 'rich_text')) {
                propertiesToCreate['Description'] = { rich_text: {} };
            }

            if (needsProperty('Tags', 'multi_select')) {
                propertiesToCreate['Tags'] = { multi_select: {} };
            }

            if (needsProperty('Status', 'select')) {
                propertiesToCreate['Status'] = {
                    select: {
                        options: [
                            { name: 'published', color: 'green' },
                            { name: 'draft', color: 'yellow' },
                            { name: 'archived', color: 'gray' },
                            { name: 'review', color: 'blue' }
                        ]
                    }
                };
            }

            // Don't create Category - respect existing configuration
            if (!existingProperties['Category']) {
                console.log('Note: Category property not found in database. Consider adding it manually as select or multi_select.');
            } else {
                console.log(`Category property exists as type: ${existingProperties['Category'].type}`);
            }

            // Only update if there are properties to add
            if (Object.keys(propertiesToCreate).length > 0) {
                await this.updateDatabase(databaseId, {
                    properties: propertiesToCreate
                });
                console.log('Updated database properties:', Object.keys(propertiesToCreate));
            }
        } catch (error) {
            console.error('Failed to ensure database properties:', error);
            // Don't throw - continue with existing schema
        }
    }


} 