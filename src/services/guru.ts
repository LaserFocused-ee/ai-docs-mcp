import fetch from 'node-fetch';
import { GuruCredentials, GuruSearchParams, GuruSearchResponse, GuruCard, GuruAttachment } from '../types/index.js';

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
    private getCredentials(): GuruCredentials {
        const guruToken = process.env.GURU_TOKEN;

        if (!guruToken) {
            throw new Error('GURU_TOKEN environment variable is required');
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
    private async makeRequest(url: string, options: any = {}): Promise<any> {
        const { username, token } = this.getCredentials();
        const auth = Buffer.from(`${username}:${token}`).toString('base64');

        const response = await fetch(url, {
            ...options,
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json',
                ...options.headers
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Guru API error (${response.status}): ${errorText}`);
        }

        const jsonResponse = await response.json();
        return jsonResponse;
    }

    /**
     * Search for cards using Guru's search API
     */
    async searchCards(params: GuruSearchParams = {}): Promise<GuruSearchResponse> {
        const queryParams = new URLSearchParams();

        if (params.q) queryParams.append('q', params.q);
        if (params.searchTerms) queryParams.append('searchTerms', params.searchTerms);
        if (params.showArchived !== undefined) queryParams.append('showArchived', params.showArchived.toString());
        if (params.maxResults) queryParams.append('maxResults', params.maxResults.toString());
        if (params.sortField) queryParams.append('sortField', params.sortField);
        if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

        const url = `${this.baseUrl}/search/query?${queryParams.toString()}`;
        return this.makeRequest(url);
    }

    /**
     * Get a specific card by ID
     */
    async getCard(cardId: string): Promise<GuruCard> {
        const url = `${this.baseUrl}/cards/${cardId}`;
        return this.makeRequest(url);
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
                fileId: match[1]
            });
        }

        return attachments;
    }

    /**
     * Download attachment by file ID
     */
    async downloadAttachment(fileId: string): Promise<Buffer> {
        const { username, token } = this.getCredentials();
        const auth = Buffer.from(`${username}:${token}`).toString('base64');

        const url = `${this.fileBaseUrl}/files/view/${fileId}`;
        const response = await fetch(url, {
            headers: {
                'Authorization': `Basic ${auth}`
            }
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