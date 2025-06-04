/**
 * Guru API type definitions
 */

export interface GuruCredentials {
    username: string;
    token: string;
}

export interface GuruUser {
    firstName: string;
    lastName: string;
    email: string;
}

export interface GuruCollection {
    id: string;
    name: string;
    slug: string;
}

export interface GuruCard {
    id: string;
    title: string;
    content: string;
    dateCreated: string;
    lastModified: string;
    verificationState: 'TRUSTED' | 'NEEDS_VERIFICATION' | 'UNVERIFIED';
    collection: GuruCollection;
    owner: GuruUser;
}

export interface GuruSearchResponse {
    results: GuruCard[];
    totalResults: number;
    hasMore: boolean;
}

export interface GuruSearchParams {
    q?: string;
    searchTerms?: string;
    showArchived?: boolean;
    maxResults?: number;
    sortField?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface GuruAttachment {
    url: string;
    fileId: string;
} 