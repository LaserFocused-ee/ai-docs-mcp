# Slice 2: User Can See Available Categories Implementation Instructions

## Your Mission

You are implementing a feature that allows users to list all available categories in their Notion database. This feature will help users understand what categories they can use when creating pages and provide visibility into the current organization structure. This is a TRUE vertical slice that delivers immediate user value by showing real data from their Notion database.

## Pre-Implementation Checklist

- [ ] Pre-commit hooks verified (run `git commit --allow-empty -m "test: verify hooks work"`)
- [ ] On feature branch (create with `git checkout -b feature/list-categories-tool`)
- [ ] Latest code pulled (`git pull origin main`)
- [ ] Previous slice (Slice 1) complete and working
- [ ] Notion environment variables set:
  - `NOTION_TOKEN` with valid integration token
  - `NOTION_MCP_DATABASE_ID` with test database ID

## Implementation Steps

### Step 0: Validate Your Slice Definition & Data Plan

```
Feature Name: List Categories Tool
User Story: As a user, I can list all available categories in my Notion database and see their type (select/multi_select)
Data Requirements:
  - Database tables: Existing Notion database with Category property
  - API endpoints: Notion API (database retrieve endpoint)
  - Test data: Existing categories in test Notion database
Demo Steps: 
  1. Run `npm run build` to build the project
  2. Run `npm run inspect:cli` to start MCP Inspector
  3. Call list-categories tool
  4. See formatted list of real categories from Notion
  5. See category type (select or multi_select)
  6. Verify categories match what's in actual Notion database
Feature Flag: None needed (new tool)
Branch Name: feature/list-categories-tool

Project Commands:
- Run Database: N/A (using Notion API)
- Run API: N/A (MCP server)
- Run App: `npm run inspect:cli` (MCP Inspector for testing)
- Lint: `npm run lint`
- Type Check: `npm run typecheck`  
- Test: `npm test` (when tests exist)
- Build: `npm run build`
```

### Step 1: Set Up Real Data Infrastructure FIRST

#### 1.1 Create and Switch to Feature Branch

```bash
# First, ensure you're on a clean base
git status  # Should show clean
git checkout main
git pull origin main

# Create your feature branch
git checkout -b feature/list-categories-tool
```

#### 1.2 Verify Notion Database Access

```bash
# Test that we can access the Notion database
npm run build && npm run inspect:cli

# Call existing list-database-pages to verify connection
--method tools/call --tool-name list-database-pages --tool-arg limit=1

# Should return at least one page from your Notion database
# If this fails, fix your environment variables first!
```

#### 1.3 Examine Database Properties Structure

```bash
# We need to understand how Notion returns Category properties
# This will inform our implementation

# In NotionService, we'll need to access database.properties
# Category could be either 'select' or 'multi_select' type
```

#### 1.4 Plan the Tool Implementation

```typescript
// The tool will:
// 1. Call NotionService.getDatabase() to get database structure
// 2. Find the Category property (could be named differently)
// 3. Extract available options based on property type
// 4. Format results for user-friendly display
// 5. Handle cases where Category property doesn't exist
```

### Step 2: Create the List Categories Tool

#### 2.1 Create listCategoriesTool Function

Create the tool in `src/tools/notion.ts`:

```typescript
export async function listCategoriesTool(
    notionService: NotionService
): Promise<{ content: Array<{ type: "text"; text: string }> }> {
    try {
        const databaseId = process.env.NOTION_MCP_DATABASE_ID;
        if (!databaseId) {
            throw new Error("NOTION_MCP_DATABASE_ID environment variable is not set");
        }

        // Get database structure to find Category property
        const database = await notionService.getDatabase(databaseId);
        
        // Find the Category property (case-insensitive)
        const categoryPropName = Object.keys(database.properties).find(
            prop => prop.toLowerCase() === 'category'
        );
        
        if (!categoryPropName) {
            return {
                content: [{
                    type: "text" as const,
                    text: "❌ No 'Category' property found in the database. Available properties: " + 
                          Object.keys(database.properties).join(", ")
                }]
            };
        }
        
        const categoryProp = database.properties[categoryPropName];
        const propType = categoryProp.type;
        
        let categories: string[] = [];
        
        if (propType === 'select' && categoryProp.select?.options) {
            categories = categoryProp.select.options.map((opt: any) => opt.name);
        } else if (propType === 'multi_select' && categoryProp.multi_select?.options) {
            categories = categoryProp.multi_select.options.map((opt: any) => opt.name);
        }
        
        if (categories.length === 0) {
            return {
                content: [{
                    type: "text" as const,
                    text: `📋 Category property found (type: ${propType}) but no categories defined yet.\n\n` +
                          "💡 Add categories in Notion by creating pages with new category values."
                }]
            };
        }
        
        const formattedOutput = `📋 Available Categories (${categories.length})\n` +
            `Property Type: ${propType}\n\n` +
            categories.map(cat => `• ${cat}`).join('\n') +
            `\n\n💡 Use these categories when creating or updating pages.`;
        
        return {
            content: [{
                type: "text" as const,
                text: formattedOutput
            }]
        };
    } catch (error) {
        console.error("Error listing categories:", error);
        return {
            content: [{
                type: "text" as const,
                text: `❌ Failed to list categories: ${error instanceof Error ? error.message : String(error)}`
            }]
        };
    }
}
```

#### 2.2 Verify Build and Lint

```bash
# Make sure the code compiles and passes quality checks
npm run build
# Should succeed with no errors

npm run lint
# Should show 0 errors and 0 warnings

npm run typecheck
# Should pass with no errors

# COMMIT CHECKPOINT 1
git add src/tools/notion.ts
git commit -m "feat: implement listCategoriesTool function for listing Notion categories"
```

### Step 3: Register the Tool

#### 3.1 Add Tool Registration in configureNotionTools

In `src/tools/notion.ts`, find the `configureNotionTools` function and add:

```typescript
// Inside configureNotionTools function, add this tool registration:
server.setRequestHandler(
    CallToolRequestSchema,
    async (request) => {
        if (request.params.name === "list-categories") {
            return await listCategoriesTool(notionService);
        }
        // ... rest of the existing tool handlers
    }
);

// Also add to the tools list in the same function:
tools: [
    // ... existing tools ...
    {
        name: "list-categories",
        description: "List all available categories in the Notion database with their type (select/multi_select)",
        inputSchema: {
            type: "object",
            properties: {},
            additionalProperties: false
        }
    },
]
```

#### 3.2 Test Tool Registration

```bash
# Build and verify the tool appears in the tools list
npm run build && npm run inspect:cli

# List all tools
--method tools/list

# Should see "list-categories" in the output
# If not visible, check the registration code

# COMMIT CHECKPOINT 2
git add src/tools/notion.ts
git commit -m "feat: register list-categories tool in MCP server"
```

### Step 4: Test with Real Data

#### 4.1 Test the Tool with MCP Inspector

```bash
# Build and run the inspector
npm run build && npm run inspect:cli

# Call the list-categories tool
--method tools/call --tool-name list-categories

# You should see:
# - A formatted list of categories from your Notion database
# - The property type (select or multi_select)
# - Helpful tips for using the categories
```

#### 4.2 Verify Against Actual Notion Database

```bash
# 1. Open your Notion database in a browser
# 2. Check the Category property and its available options
# 3. Compare with the tool output - they should match exactly
# 4. If they don't match, debug the implementation
```

#### 4.3 Test Error Scenarios

```bash
# Test with invalid database ID
NOTION_MCP_DATABASE_ID="invalid-id" npm run inspect:cli
--method tools/call --tool-name list-categories
# Should show appropriate error message

# Test with database that has no Category property
# (You'll need a different database ID for this test)
```

#### 4.4 Run Quality Checks

```bash
# Ensure all quality gates pass
npm run lint       # 0 errors, 0 warnings
npm run typecheck  # 0 errors
npm run build      # Must succeed

# COMMIT CHECKPOINT 3
git add .
git commit -m "test: verify list-categories tool works with real Notion data"
```

### Step 5: Add Edge Case Handling

#### 5.1 Handle Different Property Name Cases

Update the tool to handle variations like "Categories", "CATEGORY", etc.:

```typescript
// Update the property finding logic to be more flexible
const categoryPropName = Object.keys(database.properties).find(
    prop => prop.toLowerCase() === 'category' || 
            prop.toLowerCase() === 'categories'
);
```

#### 5.2 Add Support for Color Information

Enhance the output to show category colors if available:

```typescript
// When mapping categories, include color information
if (propType === 'select' && categoryProp.select?.options) {
    categories = categoryProp.select.options.map((opt: any) => ({
        name: opt.name,
        color: opt.color || 'default'
    }));
}

// Update formatting to show colors
categories.map(cat => `• ${cat.name} (${cat.color})`).join('\n')
```

#### 5.3 Test Enhanced Features

```bash
# Build and test the enhanced version
npm run build && npm run inspect:cli
--method tools/call --tool-name list-categories

# Verify:
# - Works with different property name cases
# - Shows color information if available
# - Still handles all error cases gracefully

# COMMIT CHECKPOINT 4
git add src/tools/notion.ts
git commit -m "feat: enhance list-categories with flexible property matching and color info"
```

### Step 6: Final Quality Check & Demo Preparation

#### 6.1 Complete Quality Verification

```bash
# COMPLETE VERIFICATION WITH REAL DATA:

# 1. Run all automated checks
npm run lint && npm run typecheck && npm run build
# All must pass with zero errors

# 2. Test the tool end-to-end
npm run inspect:cli

# 3. Manual verification checklist:
# - Tool lists real categories from Notion
# - Shows correct property type
# - Handles missing Category property gracefully
# - Provides helpful user messages
# - Works with both select and multi_select types

# 4. Cross-reference with Notion
# Open Notion database and verify all categories are shown
```

#### 6.2 Prepare Demo Script with Real Data

```
Demo Script for List Categories Tool:

1. Show Notion database in browser: "Here's our knowledge base with various categories"
2. Start MCP Inspector: npm run inspect:cli
3. Say: "Users can now list all available categories programmatically"
4. Run command: --method tools/call --tool-name list-categories
5. Point out: "Notice it shows the actual categories from our Notion database"
6. Highlight: "It tells us this is a 'multi_select' field"
7. Explain: "Users can use any of these categories when creating pages"
8. Show error handling: Set invalid database ID and run again
9. Say: "The tool handles errors gracefully with helpful messages"
10. Total demo time: Under 2 minutes
```

#### 6.3 Practice Demo

```bash
# ACTUALLY RUN THROUGH THE DEMO
npm run build && npm run inspect:cli

# Follow your script exactly
# Time it - should be under 2 minutes
# Make sure everything works smoothly

# FINAL COMMIT
git add .
git commit -m "feat: complete list-categories tool - users can see all Notion categories

- Lists real categories from Notion database
- Shows property type (select/multi_select) 
- Handles missing Category property gracefully
- Supports color information display
- Flexible property name matching
- Clear, helpful error messages
- Ready for production use
- Tested with npm run inspect:cli"
```

## Success Verification

```bash
# Final test to confirm everything works
npm run build && npm run inspect:cli
--method tools/call --tool-name list-categories

# Should show your Notion categories with proper formatting
```

## Quality Gates

- Linting: 0 errors, 0 warnings
- Type checking: All passing
- Build: Successful with no errors  
- Manual testing: Tool returns real Notion categories
- Error handling: Graceful failures with helpful messages
- User experience: Clear, informative output

## Success Criteria

- ✅ Tool appears in tools/list output
- ✅ Returns formatted list of real categories from Notion
- ✅ Shows category property type (select/multi_select)
- ✅ Handles missing Category property gracefully
- ✅ User-friendly output format with emojis and tips
- ✅ Works with both select and multi_select Category fields
- ✅ Provides helpful error messages for all failure cases
- ✅ Can demo in under 2 minutes using MCP Inspector
- ✅ All code quality checks pass