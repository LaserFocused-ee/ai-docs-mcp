/**
 * File System Utilities
 * Handles all file operations for markdown documents
 */

import * as fs from 'fs-extra';
import { dirname, resolve, extname } from 'path';
import { MarkdownMetadata } from '../types/index.js';

/**
 * Read a markdown file from the filesystem
 */
export async function readMarkdownFile(filePath: string): Promise<string> {
    try {
        return await fs.readFile(filePath, 'utf-8');
    } catch {
        throw new Error(`Failed to read file: ${filePath}`);
    }
}

/**
 * Write markdown content to a file
 */
export async function writeMarkdownFile(filePath: string, content: string): Promise<void> {
    try {
        // Ensure the directory exists
        await ensureDirectory(dirname(filePath));

        // Write the file with UTF-8 encoding
        await fs.writeFile(filePath, content, 'utf-8');
    } catch {
        throw new Error(`Failed to write file: ${filePath}`);
    }
}

/**
 * Validate if a file path is safe and accessible
 */
export function validateFilePath(filePath: string): boolean {
    try {
        // Check if path is not trying to escape boundaries
        const resolvedPath = resolve(filePath);

        // Basic security check - no parent directory traversal
        if (filePath.includes('..')) {
            return false;
        }

        // Check file extension
        const ext = extname(filePath).toLowerCase();
        if (ext !== '.md' && ext !== '.markdown') {
            return false;
        }

        // Path should be resolvable
        if (!resolvedPath) {
            return false;
        }

        return true;
    } catch {
        return false;
    }
}

/**
 * Ensure a directory exists, creating it if necessary
 */
export async function ensureDirectory(dirPath: string): Promise<void> {
    try {
        await fs.ensureDir(dirPath);
    } catch {
        throw new Error(`Failed to create directory: ${dirPath}`);
    }
}

/**
 * Extract metadata from markdown frontmatter and content
 */
export async function getMarkdownMetadata(filePath: string): Promise<MarkdownMetadata> {
    try {
        const content = await readMarkdownFile(filePath);

        // Basic frontmatter parsing (YAML between --- delimiters)
        const frontMatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
        const frontMatter: Record<string, string | string[]> = {};
        let contentWithoutFrontMatter = content;

        if (frontMatterMatch) {
            contentWithoutFrontMatter = content.slice(frontMatterMatch[0].length);

            // Simple YAML parsing for common cases
            const yamlContent = frontMatterMatch[1];
            if (yamlContent) {
                yamlContent.split('\n').forEach(line => {
                    const match = line.match(/^(\w+):\s*(.+)$/);
                    if (match) {
                        const [, key, value] = match;
                        if (key && value) {
                            // Handle arrays (simple case)
                            if (value.startsWith('[') && value.endsWith(']')) {
                                frontMatter[key] = value.slice(1, -1).split(',').map(s => s.trim().replace(/['"]/g, ''));
                            } else {
                                frontMatter[key] = value.replace(/['"]/g, '');
                            }
                        }
                    }
                });
            }
        }

        // Extract headings
        const headingMatches = contentWithoutFrontMatter.match(/^(#{1,6})\s+(.+)$/gm) ?? [];
        const headings = headingMatches.map(match => {
            const levelMatch = match.match(/^(#{1,6})/);
            const textMatch = match.match(/^#{1,6}\s+(.+)$/);
            return {
                level: levelMatch ? levelMatch[1].length : 1,
                text: textMatch ? textMatch[1] : '',
                anchor: textMatch ? textMatch[1].toLowerCase().replace(/[^a-z0-9]/g, '-') : '',
            };
        });

        // Word count (approximate)
        const wordCount = contentWithoutFrontMatter
            .replace(/[#*`_[\]()]/g, '') // Remove markdown syntax
            .split(/\s+/)
            .filter(word => word.length > 0).length;

        // Get file stats
        const stats = await fs.stat(filePath);

        const title = Array.isArray(frontMatter.title) ? frontMatter.title[0] : frontMatter.title;
        const description = Array.isArray(frontMatter.description) ? frontMatter.description[0] : frontMatter.description;
        const author = Array.isArray(frontMatter.author) ? frontMatter.author[0] : frontMatter.author;
        const date = Array.isArray(frontMatter.date) ? frontMatter.date[0] : frontMatter.date;
        const tags = Array.isArray(frontMatter.tags) ? frontMatter.tags : (frontMatter.tags ? [frontMatter.tags] : []);
        const category = Array.isArray(frontMatter.category) ? frontMatter.category[0] : frontMatter.category;
        const categories = Array.isArray(frontMatter.categories) ? frontMatter.categories : (category ? [category] : []);

        return {
            title: title ?? headings[0]?.text,
            description,
            tags,
            categories,
            author,
            date,
            lastModified: stats.mtime.toISOString(),
            frontMatter,
            wordCount,
            headings,
        };
    } catch {
        throw new Error(`Failed to extract metadata from: ${filePath}`);
    }
}
