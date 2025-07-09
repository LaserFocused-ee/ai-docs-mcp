/**
 * File System Utilities
 * Handles all file operations for markdown documents
 */

import fs from 'fs-extra';
import path from 'path';
import { MarkdownMetadata } from '../types/index.js';


/**
 * Read a markdown file from the filesystem
 */
export async function readMarkdownFile(filePath: string): Promise<string> {
    try {
        return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
        console.error(`Error reading file ${filePath}:`, error);
        throw new Error(`Failed to read file: ${filePath}`);
    }
}

/**
 * Write markdown content to a file
 */
export async function writeMarkdownFile(filePath: string, content: string): Promise<void> {
    try {
        // Ensure the directory exists
        await ensureDirectory(path.dirname(filePath));

        // Write the file with UTF-8 encoding
        await fs.writeFile(filePath, content, 'utf-8');
    } catch (error) {
        console.error(`Error writing file ${filePath}:`, error);
        throw new Error(`Failed to write file: ${filePath}`);
    }
}


/**
 * Validate if a file path is safe and accessible
 */
export function validateFilePath(filePath: string): boolean {
    try {
        // Check if path is not trying to escape boundaries
        const resolvedPath = path.resolve(filePath);

        // Basic security check - no parent directory traversal
        if (filePath.includes('..')) {
            return false;
        }

        // Check file extension
        const ext = path.extname(filePath).toLowerCase();
        if (ext !== '.md' && ext !== '.markdown') {
            return false;
        }

        // Path should be resolvable
        if (!resolvedPath) {
            return false;
        }

        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Ensure a directory exists, creating it if necessary
 */
export async function ensureDirectory(dirPath: string): Promise<void> {
    try {
        await fs.ensureDir(dirPath);
    } catch (error) {
        console.error(`Error ensuring directory ${dirPath}:`, error);
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
        let frontMatter: Record<string, any> = {};
        let contentWithoutFrontMatter = content;

        if (frontMatterMatch) {
            contentWithoutFrontMatter = content.slice(frontMatterMatch[0].length);

            // Simple YAML parsing for common cases
            const yamlContent = frontMatterMatch[1];
            yamlContent.split('\n').forEach(line => {
                const match = line.match(/^(\w+):\s*(.+)$/);
                if (match) {
                    const [, key, value] = match;
                    // Handle arrays (simple case)
                    if (value.startsWith('[') && value.endsWith(']')) {
                        frontMatter[key] = value.slice(1, -1).split(',').map(s => s.trim().replace(/['"]/g, ''));
                    } else {
                        frontMatter[key] = value.replace(/['"]/g, '');
                    }
                }
            });
        }

        // Extract headings
        const headingMatches = contentWithoutFrontMatter.match(/^(#{1,6})\s+(.+)$/gm) || [];
        const headings = headingMatches.map(match => {
            const levelMatch = match.match(/^(#{1,6})/);
            const textMatch = match.match(/^#{1,6}\s+(.+)$/);
            return {
                level: levelMatch ? levelMatch[1].length : 1,
                text: textMatch ? textMatch[1] : '',
                anchor: textMatch ? textMatch[1].toLowerCase().replace(/[^a-z0-9]/g, '-') : ''
            };
        });

        // Word count (approximate)
        const wordCount = contentWithoutFrontMatter
            .replace(/[#*`_\[\]()]/g, '') // Remove markdown syntax
            .split(/\s+/)
            .filter(word => word.length > 0).length;

        // Get file stats
        const stats = await fs.stat(filePath);

        return {
            title: frontMatter.title || headings[0]?.text,
            description: frontMatter.description,
            tags: frontMatter.tags || [],
            categories: frontMatter.categories || frontMatter.category ? [frontMatter.category] : [],
            author: frontMatter.author,
            date: frontMatter.date,
            lastModified: stats.mtime.toISOString(),
            frontMatter,
            wordCount,
            headings
        };
    } catch (error) {
        console.error(`Error extracting metadata from ${filePath}:`, error);
        throw new Error(`Failed to extract metadata from: ${filePath}`);
    }
} 