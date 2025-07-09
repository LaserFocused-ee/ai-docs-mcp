/**
 * Documentation type definitions
 */

export interface DocumentInfo {
    category: string;
    name: string;
    path: string;
}

export interface DocumentResource {
    uri: string;
    name: string;
    description: string;
    mimeType: string;
}
