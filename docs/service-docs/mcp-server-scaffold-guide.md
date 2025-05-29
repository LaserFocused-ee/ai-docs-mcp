# Building MCP Servers with TypeScript: Modern v1.12.0 Guide

This guide provides a comprehensive approach to creating Model Context Protocol (MCP) servers using the latest TypeScript SDK v1.12.0, based on the [official MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk) and real-world implementations.

## Overview

The Model Context Protocol (MCP) enables AI assistants to access external data and functionality through a standardized interface. With SDK v1.12.0, the focus has shifted to a **resource-first architecture** where:

- **Resources** provide direct access to data via URI patterns
- **Tools** are used for actions and operations
- **Prompts** offer templated interactions

## Quick Start

### 1. Project Setup

```bash
# Create new project
mkdir my-mcp-server
cd my-mcp-server
npm init -y

# Install dependencies
npm install @modelcontextprotocol/sdk@^1.12.0 zod
npm install -D typescript @types/node ts-node

# Setup TypeScript
npx tsc --init
```

### 2. Package.json Configuration

```json
{
  "name": "my-mcp-server",
  "version": "1.0.0",
  "description": "MCP server for ...",
  "main": "dist/index.js",
  "type": "module",
  "bin": {
    "my-mcp-server": "dist/index.js"
  },
  "engines": {
    "node": ">=20.0.0"
  },
  "scripts": {
    "build": "tsc && chmod +x dist/index.js",
    "start": "node dist/index.js",
    "dev": "node --loader ts-node/esm src/index.ts"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.12.0",
    "zod": "^3.24.3"
  },
  "devDependencies": {
    "@types/node": "^22.15.2",
    "ts-node": "^10.9.2",
    "typescript": "^4.9.5"
  }
}
```

### 3. TypeScript Configuration

Update `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "allowJs": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "declaration": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## Core Implementation

### 1. Main Entry Point (`src/index.ts`)

```typescript
#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { configureServer, SERVER_INFO } from './server.js';

async function main() {
  // Create MCP server instance
  const server = new McpServer(SERVER_INFO, {
    capabilities: {
      resources: {},
      tools: {},
      prompts: {}
    }
  });

  // Configure resources, tools, and prompts
  configureServer(server);

  // Create stdio transport
  const transport = new StdioServerTransport();
  
  // Connect and start
  await server.connect(transport);
  
  console.error(`${SERVER_INFO.name} MCP Server running on stdio`);
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
```

### 2. Server Configuration (`src/server.ts`)

```typescript
import { z } from "zod";
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";

export const SERVER_INFO = {
  name: "My MCP Server",
  version: "1.0.0",
  description: "Description of what your server does"
};

export function configureServer(server: McpServer): void {
  
  // 1. RESOURCES (Primary way to access data)
  
  // Example: File system resources
  const filesTemplate = new ResourceTemplate(
    "file://{path}",
    {
      list: async () => {
        // Return list of all available files
        const files = await getAvailableFiles(); // Your implementation
        return {
          resources: files.map(file => ({
            uri: `file://${file.path}`,
            name: file.name,
            description: `File: ${file.name}`,
            mimeType: file.mimeType
          }))
        };
      }
    }
  );

  server.resource(
    "files",
    filesTemplate,
    async (uri: URL, variables) => {
      // Handle resource read requests
      const path = Array.isArray(variables.path) ? variables.path[0] : variables.path;
      const content = await readFile(path); // Your implementation
      
      return {
        contents: [{
          uri: uri.toString(),
          mimeType: "text/plain",
          text: content
        }]
      };
    }
  );

  // 2. TOOLS (For actions and operations)
  
  server.tool(
    "create-file",
    "Create a new file",
    {
      path: z.string().describe("File path"),
      content: z.string().describe("File content")
    },
    async ({ path, content }) => {
      await writeFile(path, content); // Your implementation
      
      return {
        content: [{
          type: "text",
          text: `File created successfully at ${path}`
        }]
      };
    }
  );

  // 3. PROMPTS (For templated interactions)
  
  server.prompt(
    "analyze-file",
    "Analyze a file and provide insights",
    {
      file_path: z.string().describe("Path to the file to analyze")
    },
    async ({ file_path }) => {
      const content = await readFile(file_path); // Your implementation
      
      return {
        description: `Analysis prompt for ${file_path}`,
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Please analyze this file:\n\n${content}`
            }
          }
        ]
      };
    }
  );
}

// Helper functions (implement these based on your needs)
async function getAvailableFiles() {
  // Your file discovery logic
  return [];
}

async function readFile(path: string): Promise<string> {
  // Your file reading logic
  return "";
}

async function writeFile(path: string, content: string): Promise<void> {
  // Your file writing logic
}
```

## Resource-First Architecture

### Why Resources Are Primary

In MCP v1.12.0, **resources are the preferred way to access data**:

- **Direct Access**: `file://path/to/document.md`
- **Auto-Discovery**: Resources are enumerated automatically
- **Efficient**: No tool call overhead for data access
- **Cacheable**: Clients can cache resource content

### Resource Template Patterns

```typescript
// Single resource
server.resource(
  "config",
  "app://config",
  async (uri: URL) => {
    return { contents: [{ uri: uri.toString(), text: "config data" }] };
  }
);

// Template with variables
const docsTemplate = new ResourceTemplate(
  "docs://{category}/{name}",
  {
    list: async () => ({
      resources: [
        { uri: "docs://api/authentication", name: "Authentication" },
        { uri: "docs://guides/quickstart", name: "Quick Start" }
      ]
    })
  }
);

server.resource("docs", docsTemplate, async (uri, variables) => {
  const { category, name } = variables;
  // Handle template variables
});
```

### When to Use Tools vs Resources

| Use Case | Approach | Example |
|----------|----------|---------|
| **Read data** | Resource | `docs://api/users` |
| **List available data** | Resource template with list callback | `files://{path}` |
| **Perform actions** | Tool | `create-file`, `send-email` |
| **Complex operations** | Tool | `analyze-codebase`, `run-tests` |
| **Templated prompts** | Prompt | `code-review`, `explain-concept` |

## Advanced Patterns

### 1. Error Handling

```typescript
server.resource("data", template, async (uri, variables) => {
  try {
    const data = await fetchData(variables.id);
    if (!data) {
      throw new Error(`Data not found: ${variables.id}`);
    }
    return { contents: [{ uri: uri.toString(), text: data }] };
  } catch (error) {
    throw new Error(`Failed to fetch data: ${error.message}`);
  }
});
```

### 2. Fuzzy Matching

```typescript
server.resource("docs", template, async (uri, variables) => {
  const { name } = variables;
  
  // Try exact match first
  let doc = await findExactDocument(name);
  
  // Fall back to fuzzy matching
  if (!doc) {
    doc = await findSimilarDocument(name);
    if (doc) {
      console.warn(`Using fuzzy match: ${doc.name} for ${name}`);
    }
  }
  
  if (!doc) {
    throw new Error(`Document not found: ${name}`);
  }
  
  return { contents: [{ uri: uri.toString(), text: doc.content }] };
});
```

### 3. Dynamic Resource Discovery

```typescript
const apiTemplate = new ResourceTemplate(
  "api://{endpoint}",
  {
    list: async () => {
      // Dynamically discover available endpoints
      const endpoints = await discoverApiEndpoints();
      return {
        resources: endpoints.map(ep => ({
          uri: `api://${ep.path}`,
          name: ep.name,
          description: ep.description
        }))
      };
    }
  }
);
```

## Testing Your Server

### 1. Basic Testing

```typescript
// test.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { configureServer } from "./src/server.js";

async function test() {
  const server = new McpServer({ name: "test", version: "1.0.0" });
  configureServer(server);
  
  // Test resource listing
  console.log("Testing resource discovery...");
  
  // Test specific resource access
  console.log("Testing resource access...");
}

test().catch(console.error);
```

### 2. Integration with Claude Desktop

Add to Claude Desktop configuration:

```json
{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["/path/to/your/dist/index.js"]
    }
  }
}
```

## Best Practices

### 1. Resource Design

- **Use descriptive URIs**: `docs://api/authentication` not `docs://1`
- **Implement list callbacks**: Enable resource discovery
- **Handle variables properly**: Support both string and array types
- **Provide good descriptions**: Help users understand what each resource contains

### 2. Error Handling

- **Graceful degradation**: Try fuzzy matching before failing
- **Clear error messages**: Include context about what went wrong
- **Proper HTTP-like status**: Use appropriate error types

### 3. Performance

- **Cache when possible**: Avoid re-reading static data
- **Lazy loading**: Only load data when requested
- **Efficient discovery**: Don't scan entire filesystems unnecessarily

### 4. Security

- **Validate inputs**: Use Zod schemas for all parameters
- **Sanitize paths**: Prevent directory traversal attacks
- **Limit access**: Only expose what's necessary

## Common Patterns

### Documentation Server

```typescript
// Perfect for serving markdown docs, API references, etc.
const docsTemplate = new ResourceTemplate("docs://{category}/{name}", {
  list: async () => {
    const docs = await scanDocumentationDirectory();
    return { resources: docs.map(doc => ({ uri: doc.uri, name: doc.name })) };
  }
});
```

### File System Server

```typescript
// Provide access to project files
const filesTemplate = new ResourceTemplate("file://{path}", {
  list: async () => {
    const files = await listProjectFiles();
    return { resources: files.map(f => ({ uri: f.uri, name: f.name })) };
  }
});
```

### API Proxy Server

```typescript
// Proxy external APIs with caching
server.resource("api", apiTemplate, async (uri, variables) => {
  const cached = await getFromCache(uri.toString());
  if (cached) return cached;
  
  const data = await fetchFromExternalAPI(variables);
  await saveToCache(uri.toString(), data);
  return data;
});
```

## Deployment

### 1. Build for Production

```bash
npm run build
```

### 2. Global Installation

```bash
# Make globally available
npm link

# Or publish to npm
npm publish
```

### 3. Claude Desktop Integration

```json
{
  "mcpServers": {
    "my-server": {
      "command": "my-mcp-server"
    }
  }
}
```

## Migration from Older Versions

If upgrading from older MCP SDK versions:

1. **Replace tool-based data access with resources**
2. **Use ResourceTemplate for URI patterns**
3. **Implement list callbacks for discovery**
4. **Update to modern server initialization**
5. **Use Zod for parameter validation**

## Resources

- [Official MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [MCP Specification](https://spec.modelcontextprotocol.io/)
- [Claude Desktop MCP Guide](https://docs.anthropic.com/claude/docs/mcp)
- [Example Servers](https://github.com/modelcontextprotocol/servers)

---

This guide reflects the modern MCP v1.12.0 approach: **resources for data, tools for actions**. Focus on providing clean, discoverable resources as your primary interface, with tools only for operations that modify state or perform complex actions.
