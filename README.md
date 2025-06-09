# Knowledge Hub

A **Model Context Protocol (MCP) server** that provides AI assistants with unified access to organizational knowledge across multiple platforms. This server bridges the gap between AI tools and your organization's knowledge repositories, enabling intelligent document creation, retrieval, and management across local docs, Guru, and Notion.

## 🚀 What is this?

Knowledge Hub is a production-ready MCP server that provides:

- **📚 Local Documentation Access** - Read and serve markdown files from your local docs directory
- **🧠 Guru Knowledge Base Integration** - Search, read, and manage Guru cards and collections  
- **📝 Notion Database Management** - Create, query, update, and manage documentation in Notion databases
- **🔍 Advanced Query & Search** - Powerful filtering, sorting, and search capabilities across all platforms
- **🛠️ Content Creation & Management** - Convert markdown to Notion pages with proper metadata and code block validation
- **🔄 Bi-directional Sync** - Export Notion pages back to markdown format
- **🏗️ Development & Production Modes** - Flexible deployment options for different environments

## 🏗️ Architecture

Built with **TypeScript/Node.js** (≥20.0.0), **MCP SDK v1.12.0**, and **Zod validation** for type safety. Features a clean, modular architecture with separated concerns:

```
src/
├── index.ts              # Main MCP server entry point
├── server.ts             # Server configuration and tool registration
├── services/             # API services (Notion, Guru)
├── tools/                # MCP tool implementations
├── types/                # TypeScript type definitions
└── utils/                # Conversion utilities and helpers
```

## 🛠️ Available Tools (11 Total)

### 📚 Local Documentation (2 tools)

- **`legacy-list-docs`** - Lists all available local documentation files by category
- **`legacy-read-doc`** - Reads specific documentation files with fuzzy matching

### 🧠 Guru Knowledge Base (3 tools)

- **`guru-list-cards`** - Search and filter Guru cards with advanced queries
- **`guru-read-card`** - Read complete card content with formatting
- **`guru-get-card-attachments`** - List and download card attachments

### 📝 Notion Database Management (5 tools)

- **`list-database-pages`** - Advanced query and search with filtering by category, tags, status
- **`create-page-from-markdown`** - Create pages from markdown with metadata and code block validation
- **`update-page`** - Update existing pages (content and/or metadata)
- **`archive-page`** - Archive pages by moving to trash
- **`export-page-to-markdown`** - Export pages to clean markdown format

### 🔧 Utility (1 tool)

- **`hello`** - Example tool demonstrating MCP capabilities

## ⚙️ Configuration & Setup

### 🚀 Installation

```bash
# Clone and install
git clone https://github.com/LaserFocused-ee/ai-docs-mcp.git
cd ai-docs-mcp/mcp_server
npm install

# Development
npm run dev

# Production build
npm run build && npm start
```

### 🔗 Claude Desktop Integration

#### Development Configuration

```json
{
  "mcpServers": {
    "ai-knowledge-hub-dev": {
      "command": "node",
      "args": ["dist/index.js"],
      "env": {
        "NODE_ENV": "development",
        "DEV_HOME": "/path/to/your/mcp_server",
        "GURU_TOKEN": "username:token",
        "NOTION_TOKEN": "your-notion-token",
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
    "ai-knowledge-hub": {
      "command": "npx",
      "args": ["ai-knowledge-hub"],
      "env": {
        "GURU_TOKEN": "username:token",
        "NOTION_TOKEN": "your-notion-token",
        "NOTION_MCP_DATABASE_ID": "your-database-id"
      }
    }
  }
}
```

### 🔑 API Credentials

**Guru**: Log into Guru → Settings → API Access → Generate token → Format as `username:token`

**Notion**: Go to [Notion Integrations](https://www.notion.so/my-integrations) → Create integration → Get API key → Share database with integration → Copy database ID from URL

## 📁 Documentation Structure

Local documentation organized in `docs/` directory:

```
docs/
├── code_guidelines/
│   ├── flutter/architecture/    # Flutter architecture patterns
│   ├── react/                   # React best practices
│   ├── nestjs/                  # NestJS guidelines
│   └── git/                     # Git workflows
└── service-docs/                # API guides and references
```

## 🌟 Key Features

### 📄 Markdown ↔ Notion Conversion

- **Code Block Validation**: Automatically validates code blocks against Notion's 2000 character limit
- **Intelligent Error Handling**: Provides specific guidance for splitting large code blocks while preserving logical boundaries
- **Rich Formatting Support**: Tables, lists, headers, links, code blocks, and more
- **Metadata Preservation**: Categories, tags, descriptions, and status values

### 🔍 Advanced Query System

- **Multi-Platform Search**: Unified search across local docs, Guru, and Notion
- **Smart Filtering**: Filter by category, tags, status, dates with flexible sorting
- **Pagination Support**: Handle large datasets efficiently

### 🛠️ Development Support

- **Environment Detection**: Automatic dev/production mode switching
- **Hot Reload**: Development mode with file watching
- **MCP Inspector Integration**: Comprehensive testing tools
- **Type Safety**: Full TypeScript with Zod validation

## 🧪 Testing & Validation

### Quick Testing

```bash
# Interactive UI testing
npm run inspect

# Basic validation
npm run validate

# Comprehensive test suite
npm run test:inspector
```

### Example Tool Calls

```bash
# List available documentation
npx @modelcontextprotocol/inspector --cli node dist/index.js \
  --method tools/call --tool-name legacy-list-docs

# Search Notion pages
npx @modelcontextprotocol/inspector --cli node dist/index.js \
  --method tools/call --tool-name list-database-pages \
  --tool-arg search="testing" --tool-arg limit=5

# Search Guru knowledge
npx @modelcontextprotocol/inspector --cli node dist/index.js \
  --method tools/call --tool-name guru-list-cards \
  --tool-arg searchTerms="API documentation" --tool-arg maxResults=5
```

## 💡 Usage Patterns

### Local Documentation

```bash
legacy-list-docs()  # Discover available docs
legacy-read-doc(category="code_guidelines/flutter", name="best-practices")
```

### Notion Management

```bash
# Context-aware search
list-database-pages(search="testing", tags=["react"], status="published")

# Create with metadata
create-page-from-markdown(
  markdown="# API Guide\n\nDocumentation...",
  metadata={category: "api-reference", tags: ["api", "rest"]}
)
```

### Guru Knowledge Access

```bash
guru-list-cards(searchTerms="troubleshooting", maxResults=10)
guru-read-card(cardId="card-uuid")
```

## 🔒 Security & Requirements

- **Node.js**: ≥20.0.0 required
- **Secure Credentials**: Environment variable handling only
- **File Access**: Restricted to docs directory
- **Input Validation**: Zod schema validation for all parameters
- **API Rate Limiting**: Automatic handling

## 📄 License

MIT License - See package.json for details.

---

Knowledge Hub transforms static documentation, institutional knowledge, and content management into an intelligent, queryable ecosystem for AI assistants. It enables context-aware development guidance, comprehensive documentation management, and seamless access to your organization's collective knowledge across multiple platforms through a unified, powerful API.
