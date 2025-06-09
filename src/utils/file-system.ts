/**
 * File System Utilities
 * Handles all file operations for markdown documents
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { DocumentInfo, MarkdownMetadata } from '../types/index.js';

/**
 * Get the docs directory path
 */
export function getDocsDirectory(): string {
    // Get the directory of the current module
    let baseDir: string;

    if (process.argv[1]) {
        // When run normally, use the script path
        baseDir = path.dirname(process.argv[1]);
    } else if (import.meta.url) {
        // ESM fallback: use import.meta.url
        const currentFile = fileURLToPath(import.meta.url);
        baseDir = path.dirname(currentFile);
    } else {
        // Last resort fallback
        baseDir = process.cwd();
        if (fs.existsSync(path.join(baseDir, 'dist'))) {
            baseDir = path.join(baseDir, 'dist');
        }
    }

    // Check if we're running from dist/ directory (development case)
    // In development, the docs are in the project root, not in dist/
    if (baseDir.endsWith('dist')) {
        const projectRoot = path.dirname(baseDir);
        const projectDocsPath = path.join(projectRoot, 'docs');

        // Only use project root docs if they exist (development case)
        if (fs.existsSync(projectDocsPath)) {
            return projectDocsPath;
        }
    }

    // When packaged, both docs-utils.js and docs/ will be in the dist/ directory
    const docsPath = path.join(baseDir, 'docs');

    return docsPath;
}

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
 * List all available documentation files in the docs directory
 */
export async function listAvailableDocuments(): Promise<DocumentInfo[]> {
    const docsDirectory = getDocsDirectory();
    const documents: DocumentInfo[] = [];

    try {
        // Check if directory exists
        if (!await fs.pathExists(docsDirectory)) {
            console.error("Documentation directory not found:", docsDirectory);
            console.error("Current working directory:", process.cwd());
            console.error("Script path:", process.argv[1]);
            return [];
        }

        // Function to recursively scan directories
        async function scanDirectory(dirPath: string, category: string = ''): Promise<void> {
            try {
                const items = await fs.readdir(dirPath, { withFileTypes: true });

                for (const item of items) {
                    const itemPath = path.join(dirPath, item.name);

                    if (item.isDirectory()) {
                        // Add subdirectory to category path
                        const newCategory = category
                            ? `${category}/${item.name}`
                            : item.name;

                        // Skip hidden directories
                        if (!item.name.startsWith('.')) {
                            await scanDirectory(itemPath, newCategory);
                        }
                    } else if (item.isFile() && item.name.endsWith('.md') && item.name !== 'README.md') {
                        // Process Markdown files, skip README files
                        const name = item.name.replace('.md', '');
                        documents.push({
                            category,
                            name,
                            path: itemPath
                        });
                    }
                }
            } catch (err) {
                console.error(`Error scanning directory ${dirPath}:`, err);
            }
        }

        await scanDirectory(docsDirectory);
        return documents;
    } catch (error) {
        console.error("Error scanning documentation directory:", error);
        return [];
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