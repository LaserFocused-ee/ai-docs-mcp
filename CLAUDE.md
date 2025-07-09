# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

### Development
```bash
# Use Node.js 22+ (required)
nvm use 22

# Install dependencies
npm install

# Run in development mode (with hot reload)
npm run dev

# Build the project
npm run build

# Start production server
npm start
```

### Testing & Validation
```bash
# Quick validation with MCP Inspector
npm run validate

# Interactive UI testing
npm run inspect

# CLI testing
npm run inspect:cli

# Comprehensive test suite
npm run test:inspector

# Test specific tool
npm run inspect:cli:hello
```

### Release Process
```bash
# Releases are done via GitHub Actions
# Go to Actions tab → Release workflow → Run workflow
# Choose version bump type: patch/minor/major
# See RELEASE_SETUP.md for details
```

## Architecture Overview

### MCP Server Structure
This is a Model Context Protocol (MCP) server that provides unified access to documentation across multiple platforms:

1. **Entry Point** (`src/index.ts`): Creates MCP server instance with stdio transport
2. **Server Configuration** (`src/server.ts`): Registers all tools and resources
3. **Service Layer** (`src/services/`):
   - `NotionService`: Handles all Notion API operations with smart property detection
   - `GuruService`: Manages Guru knowledge base integration
4. **Tools Layer** (`src/tools/`): MCP tool implementations that use services
5. **Utils** (`src/utils/`): Converters for markdown↔Notion, file operations

### Key Architectural Patterns

#### Smart Property Type Detection
The Notion integration intelligently handles property type variations across databases:
- Category can be either `select` or `multi_select` 
- Pre-flight checks detect actual property types
- Automatic retry with correct format on type mismatch
- See `docs/notion-enhancements.md` for implementation details

#### Service Pattern
All external API interactions go through service classes:
```typescript
// Services handle API calls
NotionService → Notion API
GuruService → Guru API

// Tools use services
Tool → Service → External API
```

#### Error Handling Strategy
- Services throw specific errors with context
- Tools catch and format user-friendly messages
- Failed operations are cleaned up (e.g., archive partial pages)

## Current Development Focus

### Active Enhancement Plan
See `docs/notion-enhancements.md` for the current feature plan:
1. Fix Category field type auto-detection
2. Improve search functionality (tag-based default)
3. Add cleanup for failed page creation
4. New tools: list-categories, update-page-metadata

### Environment Variables
```bash
# Required for Notion tools
NOTION_TOKEN=your-notion-integration-token
NOTION_MCP_DATABASE_ID=your-database-id

# Required for Guru tools  
GURU_TOKEN=username:token

# Development only
NODE_ENV=development
DEV_HOME=/path/to/project  # No longer needed after docs removal
```

## Code Conventions

### TypeScript/Node.js
- Target: ESNext, Module: NodeNext
- Strict TypeScript enabled
- All async operations properly handled
- Zod validation for all tool inputs

### Tool Development Pattern
```typescript
// 1. Define Zod schema
// 2. Create tool function
// 3. Register in configureNotionTools/configureGuruTools
// 4. Return MCP-formatted response:
return {
    content: [{
        type: "text" as const,
        text: "Response message"
    }]
};
```

### Testing New Features
1. Build: `npm run build`
2. Test with inspector: `npm run inspect:cli`
3. Call your tool with proper args
4. Verify response format

## Important Context

### Recent Changes
- Legacy local docs functionality removed (commit 5eec873)
- All documentation now cloud-based (Notion/Guru)
- File system utils preserved for Notion import/export

### Known Issues
- Category field type varies by database (being fixed)
- Search defaults to title/description (improving to tag-based)
- Failed page creation leaves orphans (cleanup being added)

### Security Considerations
- Never commit tokens or credentials
- All sensitive data via environment variables
- File access restricted to validated paths
- Input validation via Zod schemas