import fs from 'fs-extra';
import path from 'path';
/**
 * Get the docs directory path
 */
export function getDocsDirectory() {
    // Just use the docs directory directly inside dist
    return path.join(path.dirname(process.argv[1]), 'docs');
}
/**
 * Read a markdown file from the filesystem
 */
export async function readMarkdownFile(filePath) {
    try {
        return await fs.readFile(filePath, 'utf-8');
    }
    catch (error) {
        console.error(`Error reading file ${filePath}:`, error);
        throw new Error(`Failed to read file: ${filePath}`);
    }
}
/**
 * List all available documentation files in the docs directory
 */
export async function listAvailableDocuments() {
    const docsDirectory = getDocsDirectory();
    console.error(`Looking for docs in: ${docsDirectory}`);
    const documents = [];
    try {
        // Check if directory exists
        if (!await fs.pathExists(docsDirectory)) {
            console.error("Documentation directory not found:", docsDirectory);
            console.error("Current working directory:", process.cwd());
            console.error("Script path:", process.argv[1]);
            return [];
        }
        // Function to recursively scan directories
        async function scanDirectory(dirPath, category = '') {
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
                    }
                    else if (item.isFile() && item.name.endsWith('.md') && item.name !== 'README.md') {
                        // Process Markdown files, skip README files
                        const name = item.name.replace('.md', '');
                        documents.push({
                            category,
                            name,
                            path: itemPath
                        });
                    }
                }
            }
            catch (err) {
                console.error(`Error scanning directory ${dirPath}:`, err);
            }
        }
        await scanDirectory(docsDirectory);
        return documents;
    }
    catch (error) {
        console.error("Error scanning documentation directory:", error);
        return [];
    }
}
//# sourceMappingURL=docs-utils.js.map