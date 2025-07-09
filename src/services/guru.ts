import fetch, { RequestInit, Response } from 'node-fetch';
import { GuruAttachment, GuruCard, GuruCredentials, GuruSearchParams, GuruSearchResponse } from '../types/index.js';

/**
 * Guru API Service for interacting with Guru's REST API
 */
export class GuruService {
    private readonly baseUrl = 'https://api.getguru.com/api/v1';
    private readonly fileBaseUrl = 'https://content.api.getguru.com';

    /**
 * Get Guru API credentials from environment variables
 * Expects GURU_TOKEN in format "username:token" or "collection_id:token"
 */
    private getCredentials(): GuruCredentials | null {
        const guruToken = process.env.GURU_TOKEN;

        if (guruToken === null || guruToken === undefined || guruToken.length === 0) {
            return null;
        }

        if (!guruToken.includes(':')) {
            throw new Error('GURU_TOKEN must be in format "username:token" or "collection_id:token"');
        }

        const [username, token] = guruToken.split(':', 2);

        if (!username || !token) {
            throw new Error('Invalid GURU_TOKEN format. Expected "username:token" or "collection_id:token"');
        }

        return { username, token };
    }

    /**
     * Make authenticated request to Guru API
     */
    private async makeRequest<T = unknown>(url: string, options: RequestInit = {}): Promise<T> {
        const credentials = this.getCredentials();
        if (!credentials) {
            throw new Error('GURU_TOKEN environment variable is required');
        }
        const { username, token } = credentials;
        const auth = Buffer.from(`${username}:${token}`).toString('base64');

        const response: Response = await fetch(url, {
            ...options,
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json',
                ...(options.headers ?? {}),
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Guru API error (${response.status}): ${errorText}`);
        }

        const jsonResponse = await response.json() as T;
        return jsonResponse;
    }

    /**
     * Search for cards using Guru's search API
     */
    async searchCards(params: GuruSearchParams = {}): Promise<GuruSearchResponse> {
        const queryParams = new URLSearchParams();

        if (params.q !== null && params.q !== undefined && params.q.length > 0) {
            queryParams.append('q', params.q);
        }
        if (params.searchTerms !== null && params.searchTerms !== undefined && params.searchTerms.length > 0) {
            queryParams.append('searchTerms', params.searchTerms);
        }
        if (params.showArchived !== undefined) {
            queryParams.append('showArchived', params.showArchived.toString());
        }
        if (params.maxResults !== undefined && params.maxResults > 0) {
            queryParams.append('maxResults', params.maxResults.toString());
        }
        if (params.sortField !== null && params.sortField !== undefined && params.sortField.length > 0) {
            queryParams.append('sortField', params.sortField);
        }
        if (params.sortOrder !== null && params.sortOrder !== undefined && params.sortOrder.length > 0) {
            queryParams.append('sortOrder', params.sortOrder);
        }

        const url = `${this.baseUrl}/search/query?${queryParams.toString()}`;
        return this.makeRequest<GuruSearchResponse>(url);
    }

    /**
     * Get a specific card by ID
     */
    async getCard(cardId: string): Promise<GuruCard> {
        const url = `${this.baseUrl}/cards/${cardId}`;
        return this.makeRequest<GuruCard>(url);
    }

    /**
     * Extract attachment URLs from card content
     */
    extractAttachments(htmlContent: string): GuruAttachment[] {
        const attachmentRegex = /https:\/\/content\.api\.getguru\.com\/files\/view\/([a-f0-9-]+)/g;
        const attachments: GuruAttachment[] = [];
        let match;

        while ((match = attachmentRegex.exec(htmlContent)) !== null) {
            attachments.push({
                url: match[0],
                fileId: match[1],
            });
        }

        return attachments;
    }

    /**
     * Download attachment by file ID
     */
    async downloadAttachment(fileId: string): Promise<Buffer> {
        const credentials = this.getCredentials();
        if (!credentials) {
            throw new Error('GURU_TOKEN environment variable is required');
        }
        const { username, token } = credentials;
        const auth = Buffer.from(`${username}:${token}`).toString('base64');

        const url = `${this.fileBaseUrl}/files/view/${fileId}`;
        const response = await fetch(url, {
            headers: {
                'Authorization': `Basic ${auth}`,
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to download attachment (${response.status}): ${errorText}`);
        }

        return Buffer.from(await response.arrayBuffer());
    }

    /**
     * Get attachments for a specific card
     */
    async getCardAttachments(cardId: string): Promise<GuruAttachment[]> {
        const card = await this.getCard(cardId);
        return this.extractAttachments(card.content);
    }
}
