# AI Documentation MCP Server

A **Model Context Protocol (MCP) server** that provides AI assistants like Claude with structured access to development documentation. This server acts as a bridge between AI tools and your documentation repository, enabling intelligent retrieval of coding guidelines, architecture patterns, testing strategies, and service documentation.

## What is this?

This is an MCP server implementation that:

- **Serves structured documentation** through the Model Context Protocol standard
- **Provides intelligent document discovery** with category-based organization
- **Enables AI assistants to access** your team's coding standards, architecture guides, and service documentation
- **Supports multiple technology stacks** including Flutter, React, NestJS, and Git workflows
- **Uses modern resource-based architecture** for direct document access via URIs

## Architecture

The server is built with:

- **TypeScript/Node.js** runtime (requires Node.js ≥20.0.0)
- **MCP SDK v1.12.0** (`@modelcontextprotocol/sdk`) for protocol implementation
- **Resource Templates** for URI-based document access
- **Zod** for parameter validation and type safety
- **fs-extra** for robust file system operations
- **Standard I/O transport** for communication with AI clients

### Core Components

1. **`src/index.ts`** - Main entry point that creates and starts the MCP server
2. **`src/mcp-tools.ts`** - Resource templates and tool definitions using modern SDK patterns
3. **`src/docs-utils.ts`** - File system utilities for document discovery and reading

## Available Resources

### Documentation Resources

- **URI Pattern**: `docs://{category}/{name}`
- **Examples**:
  - `docs://code_guidelines/flutter/best-practices`
  - `docs://service-docs/linear-sdk-documentation`
- **Auto-discovery**: Resources are automatically discovered from the docs directory

## Available Tools

The server exposes 1 example tool:

### `hello`

A simple hello world example tool

- **Parameters**:
  - `name` (optional): Name to greet
- **Returns**: Greeting message with usage examples

**Note**: The primary way to access documentation is through **resources**, not tools. Tools are only provided as examples of the MCP tool capability.

## Documentation Structure

The server expects documentation in this structure:

```
docs/
├── code_guidelines/
│   ├── flutter/
│   │   ├── architecture/
│   │   │   ├── flutter_riverpod_clean_architecture.md
│   │   │   ├── flutter_best_practices.md
│   │   │   └── freezed_guide.md
│   │   └── riverpod_testing_guide.md
│   ├── react/
│   ├── nestjs/
│   └── git/
└── service-docs/
    ├── claude-code-sdk-documentation.md
    ├── linear-sdk-documentation.md
    └── mcp-server-scaffold-guide.md
```

## Installation & Usage

### Global Installation

```bash
npm install -g ai-docs-mcp-server
```

### Running the Server

```bash
# Direct execution
ai-docs-mcp

# Or with npx
npx ai-docs-mcp-server
```

### Integration with Claude Desktop

Add to your Claude Desktop MCP configuration:

```json
{
  "mcpServers": {
    "ai-docs": {
      "command": "ai-docs-mcp"
    }
  }
}
```

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

## Testing & Development

### MCP Inspector

This project includes comprehensive testing support using the [MCP Inspector](https://github.com/modelcontextprotocol/inspector), the official visual testing tool for MCP servers.

#### Quick Testing

```bash
# Build and launch inspector UI
npm run inspect

# CLI mode testing
npm run inspect:cli

# Test all resources and tools
npm run test:inspector
```

#### Available Inspector Commands

| Command | Description |
|---------|-------------|
| `npm run inspect` | Launch MCP Inspector UI for interactive testing |
| `npm run inspect:ui` | Same as above (explicit UI mode) |
| `npm run inspect:cli` | CLI mode for programmatic testing |
| `npm run inspect:cli:resources` | List all available documentation resources |
| `npm run inspect:cli:tools` | List all available tools |
| `npm run inspect:cli:test` | Run basic validation tests |
| `npm run inspect:cli:hello` | Test the hello tool with sample parameters |
| `npm run test:inspector` | Comprehensive test suite |
| `npm run validate` | Basic server validation |

#### Testing Resources

Test documentation access:

```bash
# List all available documentation
npm run inspect:cli:resources

# Test specific resource access via CLI
npx @modelcontextprotocol/inspector --cli node dist/index.js \
  --method resources/read \
  --uri "docs://service-docs/mcp-inspector-testing-guide"
```

#### Testing Tools

```bash
# List available tools
npm run inspect:cli:tools

# Test the hello tool
npm run inspect:cli:hello

# Test with custom parameters
npx @modelcontextprotocol/inspector --cli node dist/index.js \
  --method tools/call \
  --tool-name hello \
  --tool-arg name="Your Name"
```

#### Configuration Export

The MCP Inspector can generate Claude Desktop configuration files:

1. Run `npm run inspect` to open the UI
2. Click **"Server Entry"** to copy configuration for existing `mcp.json`
3. Click **"Servers File"** to generate complete configuration file

See `docs/service-docs/mcp-inspector-testing-guide.md` for comprehensive testing documentation.

### Configuration Files

The project includes `mcp-config.json` with sample configurations for both production and development environments that can be used with Claude Desktop or the MCP Inspector.

## How It Works

1. **Server Initialization**: Creates an MCP server with stdio transport using SDK v1.12.0
2. **Resource Template Registration**: Registers URI template `docs://{category}/{name}` for direct access
3. **Document Discovery**: Recursively scans the `docs/` directory for `.md` files
4. **Request Handling**: Processes resource requests via JSON-RPC over stdio
5. **Content Delivery**: Returns formatted markdown content with proper error handling

### Key Features

- **Resource-First Architecture**: Direct access to documents via URIs (preferred method)
- **Intelligent Fuzzy Matching**: Falls back to partial name matches when exact matches fail
- **Category-based Organization**: Supports nested directory structures
- **Auto-discovery**: Automatic resource enumeration from file system
- **Error Handling**: Graceful degradation with helpful error messages
- **Modern SDK**: Uses latest MCP SDK v1.12.0 patterns and features

## Usage Patterns

### Resource Access (Primary Method)

```
# Direct access via URI
docs://code_guidelines/flutter/architecture/best-practices
docs://service-docs/linear-sdk-documentation
```

### Tool Access (Example Only)

```
# Example tool
hello(name="Developer")
```

## Build Process

The build process:

1. Compiles TypeScript to JavaScript (ES modules)
2. Copies documentation files to `dist/docs/`
3. Makes the output executable with proper shebang
4. Generates type declarations for library usage

## Requirements

- **Node.js**: ≥20.0.0
- **MCP SDK**: v1.12.0 (latest)
- **Operating System**: Cross-platform (macOS, Linux, Windows)
- **Documentation**: Markdown files in the expected directory structure

## What's New in v1.12.0

- **Resource Templates**: URI-based direct access to documentation
- **Auto-discovery**: Automatic resource enumeration
- **Modern API**: Updated to use latest MCP SDK patterns
- **Simplified Architecture**: Resource-first approach with minimal tools
- **Improved Error Handling**: Better error messages and fallback mechanisms

## License

MIT License - See package.json for details.

---

This MCP server transforms static documentation into an intelligent, queryable resource for AI assistants, enabling context-aware development guidance and architectural decision support through direct resource access.
