import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { DocumentInfo } from '../types/index.js';

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

  // The docs should be in the same directory as this compiled file
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