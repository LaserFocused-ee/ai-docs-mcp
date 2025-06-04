# AI Documentation & Guru Knowledge MCP Server

A **Model Context Protocol (MCP) server** that provides AI assistants like Claude with structured access to both local development documentation and Guru knowledge base content. This server acts as a bridge between AI tools and your organization's knowledge repositories, enabling intelligent retrieval of coding guidelines, architecture patterns, troubleshooting guides, and institutional knowledge.

## What is this?

This is an MCP server implementation that:

- **Serves structured documentation** through the Model Context Protocol standard
- **Integrates with Guru knowledge base** for accessing team knowledge and procedures
- **Provides intelligent document discovery** with category-based organization
- **Enables AI assistants to access** your team's coding standards, runbooks, and troubleshooting guides
- **Supports multiple technology stacks** including Flutter, React, NestJS, and Git workflows
- **Uses modern tool-based architecture** for flexible knowledge access

## Architecture

The server is built with a **clean, modular architecture**:

- **TypeScript/Node.js** runtime (requires Node.js ≥20.0.0)
- **MCP SDK v1.12.0** (`@modelcontextprotocol/sdk`) for protocol implementation
- **Modular design** with separated concerns for maintainability
- **Zod** for parameter validation and type safety
- **Standard I/O transport** for communication with AI clients

### Project Structure

```
src/
├── index.ts              # Main entry point
├── server.ts             # MCP server configuration
├── services/
│   └── guru.ts           # Guru API service
├── tools/
│   ├── docs.ts           # Documentation tools
│   └── guru.ts           # Guru API tools
├── types/
│   └── index.ts          # TypeScript interfaces
└── utils/
    └── docs.ts           # Documentation utilities
```

## Available Tools

The server provides **5 powerful tools** for accessing knowledge:

### Documentation Tools

#### `legacy-list-docs`

Lists all available documentation files with categories

- **Returns**: Complete inventory of documentation organized by category
- **Use case**: Discover available documentation before reading specific files

#### `legacy-read-doc`

Reads the content of a specific documentation file

- **Parameters**:
  - `category` (required): Document category (e.g., 'code_guidelines/flutter', 'service-docs')
  - `name` (required): Document name without .md extension
- **Returns**: Full markdown content of the requested document
- **Example**: `category: "code_guidelines/flutter"`, `name: "best-practices"`

### Guru Knowledge Base Tools

#### `guru-list-cards`

Search and list Guru knowledge cards with advanced filtering

- **Parameters**:
  - `searchTerms` (optional): Search terms for card title/content
  - `maxResults` (optional): Maximum number of results (max: 50)
  - `showArchived` (optional): Include archived cards
  - `sortField` (optional): Field to sort by (lastModified, title, dateCreated, etc.)
  - `sortOrder` (optional): Sort order (asc/desc)
  - `query` (optional): Advanced Guru Query Language query
- **Returns**: List of matching cards with metadata (title, collection, owner, status, preview)
- **Example**: Search for "restarting pods" or "API documentation"

#### `guru-read-card`

Read the full content of a specific Guru card

- **Parameters**:
  - `cardId` (required): The UUID of the Guru card to read
- **Returns**: Complete card content including HTML formatting, metadata, and attachment URLs
- **Use case**: Get detailed procedures, troubleshooting steps, or knowledge articles

#### `guru-get-card-attachments`

List and optionally download attachments from a Guru card

- **Parameters**:
  - `cardId` (required): The UUID of the Guru card
  - `downloadFirst` (optional): Whether to download the first attachment content
- **Returns**: List of attachments with URLs and optional content preview
- **Use case**: Access screenshots, diagrams, or supplementary files

### Example Tool

#### `hello`

A simple hello world example demonstrating MCP tool capabilities

- **Parameters**:
  - `name` (optional): Name to greet
- **Returns**: Greeting message with usage examples

## Environment Configuration

### Guru API Setup

To use Guru tools, configure your environment variables:

```json
{
  "mcpServers": {
    "ai-docs": {
      "command": "node",
      "args": ["dist/index.js"],
      "env": {
        "GURU_TOKEN": "your-username:your-token"
      }
    }
  }
}
```

**Getting your Guru credentials:**

1. Log into your Guru account
2. Go to Settings → API Access
3. Generate an API token
4. Format as `username:token` (e.g., `john.doe@company.com:abc123def456`)

## Documentation Structure

git stdsdThe server includes documentation in this structure:

```
docs/
├── code_guidelines/
│   ├── flutter/
│   │   ├── architecture/
│   │   │   ├── flutter_best_practices.md
│   │   │   ├── flutter_riverpod_clean_architecture.md
│   │   │   └── freezed_guide.md
│   │   └── riverpod_testing_guide.md
│   ├── react/
│   │   └── react_best_practices.md
│   ├── nestjs/
│   │   └── nestjs_best_practices.md
│   └── git/
│       └── graphite_commands_reference.md
└── service-docs/
    ├── claude-code-sdk-documentation.md
    ├── guru-api-integration-guide.md
    ├── linear-sdk-documentation.md
    ├── mcp-inspector-testing-guide.md
    └── mcp-server-scaffold-guide.md
```

## Installation & Usage

### Development Setup

```bash
# Clone and install
git clone <repository-url>
cd mcp_server
npm install

# Development mode
npm run dev

# Build for production
npm run build
npm start
```

### Integration with Claude Desktop

Add to your Claude Desktop MCP configuration (`mcp-config.json`):

```json
{
  "mcpServers": {
    "ai-docs": {
      "command": "node",
      "args": ["dist/index.js"],
      "env": {
        "GURU_TOKEN": "your-username:your-api-token"
      }
    }
  }
}
```

**Note**: Place `mcp-config.json` in your Claude Desktop settings directory and configure Claude to use this file.

## Testing & Development

### MCP Inspector

This project includes comprehensive testing support using the [MCP Inspector](https://github.com/modelcontextprotocol/inspector).

#### Quick Testing

```bash
# Build and launch inspector UI
npm run inspect

# CLI mode testing
npm run inspect:cli

# Test all tools
npm run test:inspector
```

#### Available Inspector Commands

| Command | Description |
|---------|-------------|
| `npm run inspect` | Launch MCP Inspector UI for interactive testing |
| `npm run inspect:ui` | Same as above (explicit UI mode) |
| `npm run inspect:cli` | CLI mode for programmatic testing |
| `npm run inspect:cli:tools` | List all available tools |
| `npm run inspect:cli:test` | Run basic validation tests |
| `npm run inspect:cli:hello` | Test the hello tool with sample parameters |
| `npm run test:inspector` | Comprehensive test suite |
| `npm run validate` | Basic server validation |

#### Testing Documentation Tools

```bash
# Test listing documentation
npx @modelcontextprotocol/inspector --cli node dist/index.js \
  --method tools/call \
  --tool-name legacy-list-docs

# Test reading a document
npx @modelcontextprotocol/inspector --cli node dist/index.js \
  --method tools/call \
  --tool-name legacy-read-doc \
  --tool-arg category="service-docs" \
  --tool-arg name="mcp-inspector-testing-guide"
```

#### Testing Guru Tools

```bash
# Test Guru card search
npx @modelcontextprotocol/inspector --cli node dist/index.js \
  --method tools/call \
  --tool-name guru-list-cards \
  --tool-arg searchTerms="API documentation" \
  --tool-arg maxResults=5

# Test reading a specific card (replace with actual card ID)
npx @modelcontextprotocol/inspector --cli node dist/index.js \
  --method tools/call \
  --tool-name guru-read-card \
  --tool-arg cardId="your-card-uuid-here"
```

## How It Works

1. **Server Initialization**: Creates an MCP server with stdio transport using SDK v1.12.0
2. **Service Registration**: Initializes GuruService for API interactions
3. **Tool Registration**: Registers all documentation and Guru tools with proper validation
4. **Request Handling**: Processes tool calls via JSON-RPC over stdio
5. **Content Delivery**: Returns formatted content with proper error handling

### Key Features

- **Tool-First Architecture**: All functionality accessed through well-defined tools
- **Dual Knowledge Sources**: Access both local docs and Guru knowledge base
- **Intelligent Search**: Powerful search capabilities across both documentation and Guru
- **Rich Metadata**: Detailed information about documents and knowledge cards
- **Modular Design**: Clean separation of concerns for maintainability
- **Environment Configuration**: Secure credential handling through environment variables
- **Error Handling**: Graceful degradation with helpful error messages

## Usage Patterns

### Documentation Access

```bash
# Discover available documentation
legacy-list-docs()

# Read specific documentation
legacy-read-doc(category="code_guidelines/flutter", name="best-practices")
```

### Guru Knowledge Access

```bash
# Search for knowledge cards
guru-list-cards(searchTerms="kubernetes restart pods", maxResults=10)

# Read detailed procedures
guru-read-card(cardId="05f199c3-0096-458d-a4df-464d55192690")

# Get attachments for visual guides
guru-get-card-attachments(cardId="card-uuid", downloadFirst=false)
```

## Build Process

The build process:

1. Compiles TypeScript to JavaScript (ES modules with .js extensions)
2. Copies documentation files to `dist/docs/`
3. Generates type declarations for library usage
4. Validates all imports and dependencies

## Requirements

- **Node.js**: ≥20.0.0
- **MCP SDK**: v1.12.0 (latest)
- **Operating System**: Cross-platform (macOS, Linux, Windows)
- **Documentation**: Markdown files in the expected directory structure
- **Guru Access**: Valid Guru API credentials (for Guru functionality)

## Security Notes

- **Environment Variables**: Guru credentials are handled securely through environment variables
- **API Rate Limits**: Guru API calls are subject to rate limiting
- **Token Format**: Use `username:token` format for Guru authentication
- **Local Files**: Documentation access is restricted to the docs directory

## What's New

### v2.0.0 - Major Architecture Overhaul

- **Complete refactor**: Moved from monolithic to clean modular architecture
- **Guru API Integration**: Full integration with Guru knowledge base
- **5 Production Tools**: Comprehensive toolset for both documentation and knowledge access
- **Environment Configuration**: Secure credential handling
- **TypeScript Interfaces**: Comprehensive type definitions for all data structures
- **Service Layer**: Dedicated GuruService for API interactions
- **Improved Error Handling**: Better error messages and API response handling
- **Debug Cleanup**: Removed all temporary debug code for production readiness

### Removed

- Debug tools and console logging
- Resource-based architecture (replaced with tool-based)
- Old monolithic server structure

## License

MIT License - See package.json for details.

---

This MCP server transforms static documentation and institutional knowledge into an intelligent, queryable resource for AI assistants, enabling context-aware development guidance, troubleshooting support, and access to your organization's collective knowledge through both local documentation and Guru knowledge base integration.
