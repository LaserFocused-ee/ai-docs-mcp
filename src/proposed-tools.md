# Proposed Documentation Tools for MCP Server

This document outlines a proposal for new categorized documentation tools to enhance the MCP server's documentation access capabilities. These tools provide a more intuitive and organized way to access documentation by category.

## Current Available Tools

- `mcp__ai-docs__list-documentation`: Lists all available documentation files
- `mcp__ai-docs__flutter-testing`: Returns the Flutter Riverpod testing guide
- `mcp__ai-docs__get-documentation`: Retrieves documentation by category and name

## Proposed New Tools

### 1. `mcp__ai-docs__get-categories`

**Purpose**: Returns all available documentation categories

**Parameters**: None

**Returns**: List of all available documentation categories (e.g., "code_guidelines", "service_docs", "claude")

**Example Usage**:
```javascript
const categories = await mcpAgent.execute("mcp__ai-docs__get-categories");
// Returns: ["code_guidelines", "service_docs", "claude"]
```

### 2. `mcp__ai-docs__list-by-category`

**Purpose**: Lists all documentation within a specific category

**Parameters**:
- `category`: String - The category to list documentation for (e.g., "code_guidelines")

**Returns**: List of documents in the specified category with their paths

**Example Usage**:
```javascript
const codeGuidelines = await mcpAgent.execute("mcp__ai-docs__list-by-category", {
  category: "code_guidelines"
});
// Returns: [
//   "code_guidelines/flutter/architecture/flutter_best_practices",
//   "code_guidelines/flutter/architecture/flutter_riverpod_clean_architecture",
//   ...
// ]
```

### 3. `mcp__ai-docs__code-guidelines`

**Purpose**: Lists or retrieves code guidelines documentation

**Parameters**:
- `technology`: String (optional) - Filter guidelines by technology (e.g., "flutter", "react", "nestjs")
- `name`: String (optional) - Get a specific guideline by name

**Returns**: 
- If only `technology` provided: List of guideline docs for that technology
- If `name` provided: Full content of the specific guideline document
- If no parameters: List of all available guideline technologies

**Example Usage**:
```javascript
// List all code guideline technologies
const technologies = await mcpAgent.execute("mcp__ai-docs__code-guidelines");

// List all flutter guidelines
const flutterGuides = await mcpAgent.execute("mcp__ai-docs__code-guidelines", {
  technology: "flutter"
});

// Get specific guideline
const bestPractices = await mcpAgent.execute("mcp__ai-docs__code-guidelines", {
  technology: "flutter", 
  name: "flutter_best_practices"
});
```

### 4. `mcp__ai-docs__architecture`

**Purpose**: Lists or retrieves architecture documentation

**Parameters**:
- `technology`: String (optional) - Filter architecture docs by technology
- `name`: String (optional) - Get a specific architecture doc by name

**Returns**: Similar structure to `code-guidelines` tool

### 5. `mcp__ai-docs__testing`

**Purpose**: Lists or retrieves testing documentation

**Parameters**:
- `technology`: String (optional) - Filter testing docs by technology (e.g., "flutter", "react")
- `name`: String (optional) - Get a specific testing doc by name

**Returns**: Testing documentation based on parameters

**Example Usage**:
```javascript
// Get flutter testing guide
const flutterTesting = await mcpAgent.execute("mcp__ai-docs__testing", {
  technology: "flutter"
});
```

### 6. `mcp__ai-docs__service-docs`

**Purpose**: Lists or retrieves service documentation

**Parameters**:
- `service`: String (optional) - Filter by service name
- `name`: String (optional) - Get a specific service doc by name

**Returns**: Service documentation based on parameters

## Implementation Approach

1. **Unified Backend**: All tools will use the same underlying documentation repository and access methods

2. **Caching Layer**: Implement caching to improve performance for frequently accessed documentation

3. **Versioning Support**: Add capability to access different versions of documentation (if needed in the future)

4. **Categorization in Filesystem**:
   - Maintain a consistent directory structure that maps to the categorization
   - Example: `/docs/code_guidelines/flutter/architecture/flutter_best_practices.md`
   - This allows both browsing by category and direct access by path

5. **Search Functionality**: Add capability to search across documentation by keywords

## Migration Plan

1. Implement the new tools in the MCP server

2. Maintain backward compatibility with existing tools

3. Update CLAUDE.md to reference the new tools

4. Phase out the flutter-specific tool in favor of the more general categorized tools

## Benefits

- More intuitive and organized access to documentation
- Reduced cognitive load by providing category-specific tools
- Improved discoverability through categorization
- Flexible and extensible approach for adding future document types
- Consistent access patterns across different document categories