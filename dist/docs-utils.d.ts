/**
 * Get the docs directory path
 */
export declare function getDocsDirectory(): string;
/**
 * Read a markdown file from the filesystem
 */
export declare function readMarkdownFile(filePath: string): Promise<string>;
/**
 * List all available documentation files in the docs directory
 */
export declare function listAvailableDocuments(): Promise<Array<{
    category: string;
    name: string;
    path: string;
}>>;
