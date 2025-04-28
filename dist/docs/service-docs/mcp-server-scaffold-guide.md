# Building MCP Servers with TypeScript: A Comprehensive Guide

This guide provides a structured approach to creating Model Context Protocol (MCP) servers in TypeScript, based on learnings from successful implementations like Context7 and AI-Docs.

## Table of Contents

1. [Project Setup](#project-setup)
2. [Core Implementation Pattern](#core-implementation-pattern)
3. [Key Concepts](#key-concepts)
4. [Tools Implementation](#tools-implementation)
5. [Resources Implementation](#resources-implementation)
6. [Production Deployment](#production-deployment)
7. [Troubleshooting](#troubleshooting)
8. [Advanced Features](#advanced-features)

## Project Setup

### Directory Structure

```
/project-root
  ├── src/
  │   ├── index.ts           # Main entry point
  │   ├── tools/             # Tool implementations
  │   │   └── index.ts       # Tool exports
  │   ├── resources/         # Resource implementations (if needed)
  │   │   └── index.ts       # Resource exports
  │   └── utils/             # Helper functions
  ├── dist/                  # Compiled JavaScript (generated)
  ├── tsconfig.json          # TypeScript configuration
  ├── package.json           # Project metadata and dependencies
  └── README.md              # Documentation
```

### Dependencies

```bash
# Core dependencies
npm install @modelcontextprotocol/sdk zod

# Development dependencies
npm install -D typescript @types/node
```

### package.json

```json
{
  "name": "your-mcp-server",
  "version": "0.1.0",
  "description": "MCP server for ...",
  "main": "dist/index.js",
  "type": "module",
  "bin": {
    "your-mcp-server": "dist/index.js"
  },
  "scripts": {
    "build": "tsc && chmod +x dist/index.js",
    "start": "node dist/index.js",
    "dev": "node --loader ts-node/esm src/index.ts",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.8.0",
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "ts-node": "^10.9.0",
    "typescript": "^5.0.0"
  }
}
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "esModuleInterop": true,
    "strict": true,
    "outDir": "dist",
    "sourceMap": true,
    "declaration": true,
    "resolveJsonModule": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

## Core Implementation Pattern

### Main Entry Point (src/index.ts)

This is the standard pattern to follow for all MCP servers:

```typescript
#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerTools } from "./tools/index.js";
// Import other components as needed

// Define server metadata
const SERVER_INFO = {
  name: "Your MCP Server",
  version: "0.1.0",
  description: "Describe your server's purpose here"
};

// Create the MCP server with capabilities in constructor
const server = new McpServer({
  name: SERVER_INFO.name,
  version: SERVER_INFO.version,
  description: SERVER_INFO.description,
  capabilities: {
    tools: {}  // Add other capabilities like resources or prompts as needed
  }
});

// Register tools, resources, and other components
registerTools(server);

// Main function to connect and start the server
async function main() {
  // Create and connect to the stdio transport
  const transport = new StdioServerTransport();
  
  // Connect the server to the transport
  await server.connect(transport);
  
  // Log minimal info to stderr
  console.error(`${SERVER_INFO.name} MCP Server running on stdio`);
}

// Start the server and handle errors
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
```

### Tools Implementation (src/tools/index.ts)

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

// Register all tools with the server
export function registerTools(server: McpServer): void {
  // Example tool implementation
  server.tool(
    "example-tool",
    "Description of what this tool does",
    {
      // Define input parameters with Zod for validation
      parameter1: z.string().describe("Description of parameter1"),
      parameter2: z.number().optional().describe("Optional numeric parameter")
    },
    async ({ parameter1, parameter2 }) => {
      // Tool implementation goes here
      const result = `Processed: ${parameter1}, ${parameter2 || 'no value'}`;
      
      return {
        content: [
          {
            type: "text",
            text: result
          }
        ]
      };
    }
  );

  // Add more tools as needed
}
```

## Key Concepts

### MCP Server Class

The `McpServer` class is the core of your implementation:

- Handles protocol details, serialization, and transports
- Manages tools, resources, and prompts registration
- Handles request/response lifecycle

### Transport Layer

The `StdioServerTransport` class:

- Manages communication over stdin/stdout
- Handles JSON-RPC message formatting
- Maintains the connection state

### Tool Structure

Each tool has:

- **Name**: Unique identifier used by Claude to call the tool
- **Description**: Explains to Claude what the tool does
- **Parameters Schema**: Defines and validates input parameters using Zod
- **Handler Function**: Processes inputs and returns results

### Response Format

Tool responses must follow this structure:

```typescript
{
  content: [
    {
      type: "text", // or "image" or other supported types
      text: "The result text goes here"
    }
    // Can include multiple content items
  ]
}
```

## Tools Implementation

### Basic Tool

```typescript
server.tool(
  "simple-tool",
  "A basic tool with no parameters",
  async () => {
    return {
      content: [{ type: "text", text: "This is a simple response" }]
    };
  }
);
```

### Tool with Parameters

```typescript
server.tool(
  "advanced-tool",
  "A tool with validated parameters",
  {
    query: z.string().min(1).describe("The search query"),
    limit: z.number().int().min(1).max(100).default(10).describe("Maximum results to return")
  },
  async ({ query, limit }) => {
    // Implementation goes here
    const results = await someSearchFunction(query, limit);
    
    return {
      content: [{ type: "text", text: formatResults(results) }]
    };
  }
);
```

### Error Handling in Tools

```typescript
server.tool(
  "fallible-tool",
  "A tool that might fail",
  {
    riskyParam: z.string()
  },
  async ({ riskyParam }) => {
    try {
      const result = await someRiskyOperation(riskyParam);
      return {
        content: [{ type: "text", text: result }]
      };
    } catch (error) {
      // Return error response that Claude can understand
      return {
        content: [{ 
          type: "text", 
          text: `Error: ${error instanceof Error ? error.message : String(error)}` 
        }],
        isError: true // Indicates this is an error response
      };
    }
  }
);
```

## Resources Implementation

If your server needs to provide resources (data Claude can read):

```typescript
import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";

// Static resource
server.resource(
  "static-resource",
  "resource://example/static",
  async (uri) => ({
    contents: [{
      uri: uri.href,
      text: "This is static content"
    }]
  })
);

// Dynamic resource with template
server.resource(
  "dynamic-resource",
  new ResourceTemplate("resource://example/{id}", { 
    list: async () => ({
      resources: [
        { uri: "resource://example/1", name: "Resource 1" },
        { uri: "resource://example/2", name: "Resource 2" }
      ]
    })
  }),
  async (uri, { id }) => ({
    contents: [{
      uri: uri.href,
      text: `Content for resource ${id}`
    }]
  })
);
```

## Production Deployment

### Building for Production

```bash
# Build TypeScript to JavaScript
npm run build

# This will:
# 1. Compile TS to JS in dist/
# 2. Make the main file executable
```

### Adding to Claude CLI

```bash
# Add your MCP server to Claude
claude mcp add your-server-name -- node /path/to/your/dist/index.js

# Test the connection
claude /mcp
```

### Docker Deployment

Create a `Dockerfile`:

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled JavaScript
COPY dist/ ./dist/

# Set executable permissions
RUN chmod +x dist/index.js

# Run the server
CMD ["node", "dist/index.js"]
```

## Troubleshooting

### Common Issues and Solutions

1. **Connection Failures**
   - Ensure you're using SDK version 1.8.0
   - Let the SDK handle protocol versioning
   - Use `StdioServerTransport` without modification

2. **TypeScript Errors**
   - Always use ESM modules (`"type": "module"` in package.json)
   - Make sure your tsconfig.json targets modern Node.js
   - Use the loader flag for running TS directly: `--loader ts-node/esm`

3. **Runtime Errors**
   - Check for proper error handling in all async functions
   - Ensure all promises are properly awaited
   - Validate environment variables and external dependencies

## Advanced Features

### Streaming Responses

For tools that may take time to complete:

```typescript
server.tool(
  "streaming-tool",
  "A tool that streams results",
  async (_, { sendNotification }) => {
    // Send progress notifications
    await sendNotification({
      method: "notifications/message",
      params: { 
        level: "info", 
        data: "Processing started" 
      }
    });
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Send another notification
    await sendNotification({
      method: "notifications/message",
      params: { 
        level: "info", 
        data: "Processing 50% complete" 
      }
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Return final result
    return {
      content: [{ type: "text", text: "Final result" }]
    };
  }
);
```

### Dynamic Tool Registration

For servers that need to add or modify tools at runtime:

```typescript
// Store reference to registered tool
const dynamicTool = server.tool(
  "dynamic-tool",
  "A tool that can be updated",
  {
    input: z.string()
  },
  async ({ input }) => {
    return {
      content: [{ type: "text", text: `Processed: ${input}` }]
    };
  }
);

// Later, you can update the tool
dynamicTool.update({
  description: "Updated description",
  paramsSchema: {
    input: z.string(),
    newParam: z.boolean().optional()
  },
  callback: async ({ input, newParam }) => {
    return {
      content: [{ 
        type: "text", 
        text: `Processed with new logic: ${input}, newParam: ${newParam}` 
      }]
    };
  }
});

// Or disable/enable the tool
dynamicTool.disable();
// Later:
dynamicTool.enable();
```

## Final Tips

1. **Keep it Simple**
   - Start with the basic pattern and add complexity only as needed
   - Let the SDK handle the complex protocol details

2. **Testing**
   - Test your server with the Claude CLI using `/mcp` command
   - Test each tool individually with focused prompts

3. **Error Handling**
   - Always provide graceful error responses
   - Log errors but don't expose sensitive information

4. **Documentation**
   - Write clear tool descriptions for Claude
   - Provide good parameter descriptions
   - Keep your README updated with usage examples
