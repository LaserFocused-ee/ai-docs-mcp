# AI Documentation & Knowledge Management MCP Server

A **Model Context Protocol (MCP) server** that provides AI assistants with comprehensive access to documentation, knowledge bases, and content management systems. This server bridges the gap between AI tools and your organization's knowledge repositories, enabling intelligent document creation, retrieval, and management across multiple platforms.

## 🚀 What is this?

This is a production-ready MCP server that provides:

- **📚 Local Documentation Access** - Read and serve markdown files from your local docs directory
- **🧠 Guru Knowledge Base Integration** - Search, read, and manage Guru cards and collections  
- **📝 Notion Database Management** - Create, query, update, and manage documentation in Notion databases
- **🔍 Advanced Query & Search** - Powerful filtering, sorting, and search capabilities across all platforms
- **🛠️ Content Creation & Management** - Convert markdown to Notion pages with proper metadata
- **🔄 Bi-directional Sync** - Export Notion pages back to markdown format
- **🏗️ Development & Production Modes** - Flexible deployment options for different environments

## 🏗️ Architecture

Built with modern TypeScript and a **clean, modular architecture**:

- **TypeScript/Node.js** runtime (requires Node.js ≥20.0.0)
- **MCP SDK v1.12.0** for protocol implementation
- **Modular tool-based design** with separated concerns
- **Zod validation** for type safety and parameter validation
- **Environment-based configuration** for development and production

### 📁 Project Structure

```
src/
├── index.ts              # Main MCP server entry point
├── server.ts             # Server configuration and tool registration
├── services/
│   ├── notion.ts         # Notion API service and database operations
│   └── guru.ts           # Guru API service
├── tools/
│   ├── docs.ts           # Local documentation tools
│   ├── guru.ts           # Guru knowledge base tools
│   └── notion.ts         # Notion database management tools
├── types/
│   ├── notion.ts         # Notion API type definitions
│   └── index.ts          # General TypeScript interfaces
└── utils/
    ├── converters.ts     # Markdown ↔ Notion conversion utilities
    ├── markdown-parser.ts # Advanced markdown parsing
    ├── notion-to-markdown.ts # Notion blocks to markdown conversion
    ├── markdown-to-notion.ts # Markdown to Notion blocks conversion
    └── docs.ts           # Documentation file utilities
```

## 🛠️ Available Tools (11 Total)

### 📚 Local Documentation Tools (2 tools)

#### `legacy-list-docs`

Lists all available local documentation files organized by category

- **Returns**: Complete inventory of markdown documentation  
- **Use case**: Discover available local documentation before reading files

#### `legacy-read-doc`

Reads the content of a specific local documentation file

- **Parameters**:
  - `category` (required): Document category path (e.g., 'code_guidelines/flutter', 'service-docs')
  - `name` (required): Document name without .md extension
- **Returns**: Full markdown content with metadata
- **Supports**: Fuzzy matching for file names

### 🧠 Guru Knowledge Base Tools (3 tools)

#### `guru-list-cards`

Search and list Guru knowledge cards with advanced filtering

- **Parameters**:
  - `searchTerms` (optional): Search terms for card title/content
  - `maxResults` (optional): Maximum results (default: 10, max: 50)
  - `showArchived` (optional): Include archived cards
  - `sortField` (optional): Sort by field (lastModified, title, dateCreated, etc.)
  - `sortOrder` (optional): Sort direction (asc/desc)
  - `query` (optional): Advanced Guru Query Language query
- **Returns**: Cards with metadata, preview content, and collection info

#### `guru-read-card`

Read complete content of a specific Guru card

- **Parameters**:
  - `cardId` (required): UUID of the Guru card
- **Returns**: Full card content with HTML formatting and metadata

#### `guru-get-card-attachments`

List and download attachments from Guru cards

- **Parameters**:
  - `cardId` (required): UUID of the Guru card
  - `downloadFirst` (optional): Download first attachment content
- **Returns**: Attachment URLs and optional content preview

### 📝 Notion Database Management Tools (5 tools)

#### `list-database-pages`

**Advanced query and search** documentation pages in Notion database

- **Parameters**:
  - `limit` (optional): Max pages to return (default: 10, max: 100)
  - `search` (optional): Search page titles and descriptions
  - `category` (optional): Filter by exact category match
  - `tags` (optional): Filter by tags (OR logic) - `["flutter", "testing"]`
  - `status` (optional): Filter by status (published, draft, archived, review)
  - `sortBy` (optional): Sort by field (title, last_edited, created, category, status)
  - `sortOrder` (optional): Sort direction (ascending, descending)
  - `startCursor` (optional): Pagination cursor for next page
- **Returns**: Filtered pages with rich metadata, active filter indicators, and pagination info
- **Use case**: AI agents finding relevant docs based on current context

#### `create-page-from-markdown`

Create new Notion documentation pages from markdown content or files

- **Parameters**:
  - `markdown` (optional): Raw markdown content to convert
  - `filePath` (optional): Path to local markdown file (relative to docs/)
  - `pageTitle` (optional): Page title (auto-extracted from markdown if not provided)
  - `metadata` (optional): Page metadata object:
    - `category` (optional): Page category for organization
    - `tags` (optional): Array of tags for discovery - `["react", "hooks", "performance"]`
    - `description` (optional): Searchable page description
    - `status` (optional): Publication status (published, draft, review)
- **Returns**: Created page details with statistics
- **Features**: Converts markdown to Notion blocks, sets proper metadata, unlimited category/tag creation

#### `update-page`

Update existing Notion page content and/or metadata

- **Parameters**:
  - `pageId` (required): Notion page ID to update
  - `markdown` (optional): New markdown content (replaces all content)
  - `filePath` (optional): Path to markdown file for content replacement
  - `category` (optional): Update page category
  - `tags` (optional): Replace all page tags
  - `description` (optional): Update page description
- **Returns**: Update confirmation with statistics
- **Note**: Content updates create new page and archive old one for history preservation

#### `archive-page`

Archive (soft delete) Notion pages by moving to trash

- **Parameters**:
  - `pageId` (required): Notion page ID to archive
- **Returns**: Archive confirmation
- **Note**: Cannot be undone via API

#### `export-page-to-markdown`

Export Notion pages to clean markdown format

- **Parameters**:
  - `pageId` (required): Notion page ID to export
  - `saveToFile` (optional): Absolute file path to save markdown
- **Returns**: Markdown content with conversion statistics
- **Features**: Converts all Notion blocks back to standard markdown

### 🔧 Utility Tool (1 tool)

#### `hello`

Example tool demonstrating MCP capabilities with usage guide

## ⚙️ Environment Configuration

### 🔧 Development vs Production Mode

The server automatically detects the environment:

- **Development Mode**: `NODE_ENV=development` + `DEV_HOME` set
- **Production Mode**: Default when environment variables not set

#### Development Setup

```bash
# Set environment variables for development
export NODE_ENV=development
export DEV_HOME="/path/to/your/mcp_server"

# Or use .env file in project root:
echo "NODE_ENV=development" > .env
echo "DEV_HOME=$(pwd)" >> .env
```

### 🧠 Guru API Configuration

```json
{
  "mcpServers": {
    "ai-docs-dev": {
      "command": "node",
      "args": ["dist/index.js"],
      "env": {
        "NODE_ENV": "development",
        "DEV_HOME": "/Users/yourusername/path/to/mcp_server",
        "GURU_TOKEN": "your-username:your-token"
      }
    }
  }
}
```

**Getting Guru credentials:**

1. Log into Guru → Settings → API Access
2. Generate API token
3. Format as `username:token` (e.g., `john.doe@company.com:abc123def456`)

### 📝 Notion Integration Configuration

```json
{
  "mcpServers": {
    "ai-docs-dev": {
      "command": "node", 
      "args": ["dist/index.js"],
      "env": {
        "NODE_ENV": "development",
                 "DEV_HOME": "/Users/yourusername/path/to/mcp_server",
         "NOTION_TOKEN": "your-notion-integration-token",
         "NOTION_MCP_DATABASE_ID": "your-database-id"
      }
    }
  }
}
```

**Setting up Notion integration:**

1. Go to [Notion Integrations](https://www.notion.so/my-integrations)
2. Create new integration → Get API key
3. Create or share a database with your integration
4. Copy database ID from URL: `https://notion.so/{database_id}?v=...`

## 📁 Documentation Structure

Local documentation is organized in this structure:

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
    ├── notion-api-guide.md
    ├── notion-formatting-reference.md
    ├── guru-api-integration-guide.md
    └── mcp-inspector-testing-guide.md
```

## 🚀 Installation & Usage

### 💻 Development Setup

```bash
# Clone and install dependencies
git clone <repository-url>
cd mcp_server
npm install

# Development mode (with hot reload)
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### 🔗 Integration with Claude Desktop

#### Development Configuration

```json
{
  "mcpServers": {
    "ai-docs-dev": {
      "command": "node",
      "args": ["dist/index.js"],
      "env": {
        "NODE_ENV": "development",
                 "DEV_HOME": "/Users/yourusername/code/personal/ai-docs/mcp_server",
         "GURU_TOKEN": "your-username:your-api-token",
         "NOTION_TOKEN": "your-notion-integration-token",
         "NOTION_MCP_DATABASE_ID": "your-database-id"
      }
    }
  }
}
```

#### Production Configuration

```json
{
  "mcpServers": {
    "ai-docs": {
      "command": "npx",
      "args": ["ai-docs-mcp-server"],
             "env": {
         "GURU_TOKEN": "your-username:your-api-token",
         "NOTION_TOKEN": "your-notion-integration-token", 
         "NOTION_MCP_DATABASE_ID": "your-database-id"
      }
    }
  }
}
```

**Note**: Place `mcp-config.json` in your Claude Desktop settings directory.

## 🧪 Testing & Development

### 🔍 MCP Inspector Testing

Comprehensive testing support using [MCP Inspector](https://github.com/modelcontextprotocol/inspector):

```bash
# Interactive UI testing
npm run inspect

# CLI mode testing  
npm run inspect:cli

# List all available tools
npm run inspect:cli:tools

# Run comprehensive test suite
npm run test:inspector

# Basic server validation
npm run validate
```

### 📝 Testing Documentation Tools

```bash
# Test local documentation listing
npx @modelcontextprotocol/inspector --cli node dist/index.js \
  --method tools/call \
  --tool-name legacy-list-docs

# Test reading local documentation
npx @modelcontextprotocol/inspector --cli node dist/index.js \
  --method tools/call \
  --tool-name legacy-read-doc \
  --tool-arg category="service-docs" \
  --tool-arg name="notion-api-guide"
```

### 📝 Testing Notion Tools

```bash
# Test database page querying
npx @modelcontextprotocol/inspector --cli node dist/index.js \
  --method tools/call \
  --tool-name list-database-pages \
  --tool-arg search="testing" \
  --tool-arg limit=5

# Test page creation
npx @modelcontextprotocol/inspector --cli node dist/index.js \
  --method tools/call \
  --tool-name create-page-from-markdown \
  --tool-arg markdown="# Test Page\n\nThis is a test." \
  --tool-arg pageTitle="Test Page"
```

### 🧠 Testing Guru Tools

```bash
# Test Guru card search
npx @modelcontextprotocol/inspector --cli node dist/index.js \
  --method tools/call \
  --tool-name guru-list-cards \
  --tool-arg searchTerms="API documentation" \
  --tool-arg maxResults=5

# Test reading specific card
npx @modelcontextprotocol/inspector --cli node dist/index.js \
  --method tools/call \
  --tool-name guru-read-card \
  --tool-arg cardId="your-card-uuid-here"
```

## 🔧 How It Works

### Architecture Flow

1. **Server Initialization**: Creates MCP server with stdio transport
2. **Service Registration**: Initializes Notion and Guru services
3. **Tool Registration**: Registers all 11 tools with proper validation schemas
4. **Request Handling**: Processes tool calls via JSON-RPC over stdio
5. **Content Processing**: Handles markdown ↔ Notion conversion, API calls, and file operations
6. **Response Delivery**: Returns formatted content with comprehensive error handling

### 🌟 Key Features

- **🛠️ Tool-First Architecture**: All functionality through well-defined, documented tools
- **🔗 Multi-Platform Integration**: Local docs + Guru + Notion in one server
- **🔍 Advanced Query System**: Powerful filtering, sorting, and search across all platforms
- **📄 Markdown ↔ Notion Conversion**: Seamless content transformation with proper formatting
- **🏷️ Unlimited Categorization**: Create any categories, tags, and status values dynamically
- **📊 Rich Metadata Support**: Comprehensive metadata handling across all platforms
- **🔒 Secure Configuration**: Environment-based credential handling
- **🚨 Robust Error Handling**: Graceful degradation with helpful error messages
- **📄 Development Support**: Hot reload, inspection tools, and comprehensive testing
- **🔄 Bi-directional Sync**: Import and export content between platforms

## 💡 Usage Patterns

### 📚 Local Documentation Access

```bash
# Discover available documentation
legacy-list-docs()

# Read specific documentation with fuzzy matching
legacy-read-doc(category="code_guidelines/flutter", name="best-practices")
```

### 📝 Notion Database Management

```bash
# Find documentation by context
list-database-pages(search="testing", tags=["react", "automation"], status="published")

# Create documentation from markdown
create-page-from-markdown(
  markdown="# API Guide\n\nComplete API documentation...",
  metadata={
    category: "api-reference",
    tags: ["api", "rest", "authentication"],
    description: "Complete REST API documentation",
    status: "published"
  }
)

# Export for backup or migration
export-page-to-markdown(pageId="page-uuid", saveToFile="/path/to/backup.md")
```

### 🧠 Guru Knowledge Access

```bash
# Search institutional knowledge
guru-list-cards(searchTerms="kubernetes troubleshooting", maxResults=10)

# Read detailed procedures
guru-read-card(cardId="05f199c3-0096-458d-a4df-464d55192690")

# Access visual guides and attachments
guru-get-card-attachments(cardId="card-uuid", downloadFirst=true)
```

## 🏗️ Build Process

The automated build process:

1. **TypeScript Compilation**: Compiles all source files to JavaScript
2. **Documentation Copying**: Copies `docs/` directory to `dist/docs/`
3. **Executable Setup**: Makes the main script executable
4. **Type Generation**: Generates TypeScript declarations
5. **Validation**: Ensures all imports and dependencies are correct

Build outputs:

- `dist/index.js` - Main executable
- `dist/docs/` - Local documentation files
- `dist/**/*.js` - Compiled modules
- `dist/**/*.d.ts` - TypeScript declarations

## 📋 Requirements

- **Node.js**: ≥20.0.0 (for latest async/await and ESM support)
- **MCP SDK**: v1.12.0 (automatically installed)
- **Operating System**: Cross-platform (macOS, Linux, Windows)

### Optional Requirements

- **Local Documentation**: Markdown files in `docs/` directory structure
- **Guru Access**: Valid Guru API credentials for knowledge base functionality
- **Notion Access**: Notion integration token and database ID for Notion functionality

## 🔒 Security Notes

- **🔐 Environment Variables**: All credentials handled securely through environment variables
- **🚫 No Token Storage**: No credentials stored in code or logs
- **⚡ API Rate Limits**: Automatic handling of API rate limiting
- **📁 File Access**: Local file access restricted to docs directory only
- **🔍 Input Validation**: All parameters validated with Zod schemas

## 🆕 What's New

### v0.1.4 - Comprehensive Notion Integration

- **📝 Complete Notion Database Management**: 5 new powerful Notion tools
- **🔍 Advanced Query System**: Search, filter, sort by category, tags, status, dates
- **📄 Markdown ↔ Notion Conversion**: Seamless bi-directional content transformation
- **🏷️ Unlimited Categorization**: Dynamic creation of categories, tags, and status values
- **📊 Rich Metadata Support**: Categories, tags, descriptions, status tracking
- **🔄 Pagination Support**: Handle large datasets with cursor-based pagination
- **⚡ Performance Optimizations**: Efficient database queries and content processing
- **🛠️ Development Mode**: Enhanced development experience with proper environment handling

### v0.1.3 - Enhanced Local Documentation

- **📁 Improved File Discovery**: Better path resolution for development and production
- **🔍 Fuzzy Matching**: Find files even with approximate names
- **🏗️ Development Support**: Proper development mode with `DEV_HOME` environment variable

### v0.1.2 - Guru Integration

- **🧠 Full Guru API Integration**: Complete knowledge base access
- **🔍 Advanced Search**: Powerful search and filtering across Guru cards
- **📎 Attachment Support**: Access and download card attachments
- **🏷️ Metadata Rich**: Complete card metadata and collection information

## 📄 License

MIT License - See package.json for details.

---

This MCP server transforms static documentation, institutional knowledge, and content management into an intelligent, queryable ecosystem for AI assistants. It enables context-aware development guidance, comprehensive documentation management, and seamless access to your organization's collective knowledge across multiple platforms through a unified, powerful API.
