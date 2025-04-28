# AI Docs MCP Server

MCP server for providing documentation to Claude and other AI assistants through the Model Context Protocol (MCP).

## Features

- Serves documentation through a standardized MCP interface
- Provides categorized documentation tools:
  - `list-documentation`: Lists all available documentation files
  - `get-documentation`: Retrieves documentation by category and name
  - `flutter`: Returns Flutter-related documentation 
  - `testing`: Returns testing documentation across technologies
  - `code-guidelines`: Returns code guidelines documentation
  - `service-docs`: Returns service documentation

## Installation

### Global Installation

```bash
npm install -g ai-docs-mcp-server
```

### Local Installation

```bash
npm install ai-docs-mcp-server
```

## Usage

### As a Command Line Tool

When installed globally:

```bash
ai-docs-mcp
```

### With Claude CLI

```bash
# Add the MCP server
claude mcp add ai-docs -- ai-docs-mcp
```

### Programmatic Usage

```javascript
import { configureServer } from 'ai-docs-mcp-server';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

// Create server
const server = new McpServer({
  name: "AI-Docs",
  version: "0.1.0",
  description: "MCP server for AI documentation tools",
  capabilities: { tools: {} }
});

// Configure the server with tools
configureServer(server);

// Connect to transport
const transport = new StdioServerTransport();
server.connect(transport);
```

## Documentation Structure

Place your documentation in the `docs` directory with the following structure:

```
/docs
  ├── code_guidelines/       # Code guidelines documentation
  │   ├── flutter/           # Flutter guidelines
  │   ├── git/               # Git guidelines
  │   ├── nestjs/            # NestJS guidelines
  │   └── react/             # React guidelines
  └── service-docs/          # Service documentation
```

## Requirements

- Node.js >= 20.0.0

## License

MIT