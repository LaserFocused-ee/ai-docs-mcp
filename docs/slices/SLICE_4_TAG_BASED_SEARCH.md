# Slice 4: User Can Search Primarily by Tags Implementation Instructions

## ⚠️ CRITICAL: User-Testable Value in Every Slice

**STOP! Before implementing, verify your slice passes this test:**

1. **Can a user run the app and SEE something?** ✅ Yes - search results in MCP Inspector
2. **Can a user DO something and get a RESULT?** ✅ Yes - search by tags and get relevant pages
3. **Could you DEMO this in 2 minutes?** ✅ Yes - show tag search working differently from full-text
4. **Would a stakeholder say "Great, I can see the progress"?** ✅ Yes - improved search behavior
5. **Does it use 100% REAL DATA from real sources?** ✅ Yes - real Notion database pages

## 🚨 CRITICAL: NO MOCK DATA EVER

This slice will:

- ✅ Search in REAL Notion database
- ✅ Return REAL pages from actual storage
- ✅ Show REAL tags from page metadata
- ❌ NOT use any hardcoded search results
- ❌ NOT use any fake page data

## Your Mission

You are implementing a TRUE vertical slice - adding tag-focused search capability to the Notion MCP integration. Users will be able to search primarily by tags (the new default behavior) while maintaining backward compatibility for full-text search.

## Step 0: Validate Your Slice Definition & Data Plan

```text
Feature Name: Tag-Based Search Enhancement
User Story: As a user, I can search for Notion pages by tags as the default behavior and get more relevant results
Data Requirements:
  - Database tables: Existing Notion database (no new tables)
  - API endpoints: Existing list-database-pages tool (enhanced)
  - Test data: Existing Notion pages with tags already present
Demo Steps:
  1. Run npm run inspect:cli to start MCP Inspector
  2. Call list-database-pages with search term that exists in tags
  3. See results filtered by tag matches (default behavior)
  4. Call with searchMode="full-text" to see old behavior
  5. Compare results to show improved relevance
Feature Flag: None needed (backward compatible enhancement)
Branch Name: feature/tag-based-search

Project Commands:
- Run Database: Already using real Notion database
- Run API: MCP server (npm run dev)
- Run App: npm run inspect:cli (MCP Inspector is our "app")
- Lint: npm run build (TypeScript strict mode)
- Type Check: npm run build
- Test: npm run test:inspector
- Build: npm run build
```

## Pre-Implementation Checklist

- [ ] Node.js 22+ verified (`node --version`)
- [ ] On feature branch (`git checkout -b feature/tag-based-search`)
- [ ] Clean working directory (`git status`)
- [ ] Dependencies installed (`npm install`)
- [ ] Environment variables set (NOTION_TOKEN, NOTION_MCP_DATABASE_ID)
- [ ] Previous slices complete (Slices 1-3)

## Step 1: Set Up Real Data Infrastructure FIRST

### 1.1 Create and Switch to Feature Branch

```bash
# First, ensure you're on a clean base
git status  # Should show clean
git checkout main
git pull origin main

# Create your feature branch
git checkout -b feature/tag-based-search
```

### 1.2 Verify Existing Notion Data

Since we're enhancing existing functionality, verify your Notion database has real pages with tags:

```bash
# Start MCP Inspector
npm run build && npm run inspect:cli

# List current pages to verify tags exist
--method tools/call --tool-name list-database-pages --tool-arg limit=5

# Should see real pages with tags field populated
# If no tags, add some via Notion UI first
```

### 1.3 Understand Current Search Behavior

Test the current search to understand what we're improving:

```bash
# Search for a term that exists in both tags and content
--method tools/call --tool-name list-database-pages --tool-arg search="testing"

# Note which results come from tag matches vs content matches
# This is what we'll improve
```

### COMMIT CHECKPOINT 1

```bash
git add .
git commit -m "chore: verify Notion data and current search behavior"
```

## Step 2: Create Minimal UI Connected to Real Data

### 2.1 Add searchMode Parameter to Tool Schema

First, update the tool schema to accept the new searchMode parameter:

```typescript
// In src/tools/notion.ts, find listDatabasePagesTool schema
// Add searchMode as an optional parameter:

const ListDatabasePagesSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.string().optional(),
  limit: z.number().optional(),
  startCursor: z.string().optional(),
  sortBy: z.enum(['title', 'last_edited', 'created', 'category', 'status']).optional(),
  sortOrder: z.enum(['ascending', 'descending']).optional(),
  searchMode: z.enum(['tags', 'full-text', 'combined']).default('tags').optional(),
});
```

### 2.2 Verify Schema Update Works

```bash
# Build to check TypeScript
npm run build  # Must succeed with 0 errors

# Test with MCP Inspector
npm run inspect:cli

# The tool should still work with existing calls
--method tools/call --tool-name list-database-pages --tool-arg search="api"
```

### COMMIT CHECKPOINT 2

```bash
git add src/tools/notion.ts
git commit -m "feat: add searchMode parameter to list-database-pages schema"
```

## Step 3: Make It Interactive with Real Persistence

### 3.1 Implement Tag-Focused Search Logic

Update the NotionService to handle different search modes:

```typescript
// In src/services/notion.ts, update queryDatabasePages method
// Add logic to handle searchMode parameter

// When searchMode === 'tags' (default):
// - Only search in tags property
// When searchMode === 'full-text':
// - Use current behavior (search everywhere)
// When searchMode === 'combined':
// - Search in both but prioritize tag matches
```

### 3.2 Update Tool Implementation

In the listDatabasePagesTool function, pass the searchMode to the service:

```typescript
// Extract searchMode from args
const searchMode = args.searchMode || 'tags';

// Pass to service method
const results = await notionService.queryDatabasePages({
  ...existingParams,
  searchMode,
});
```

### 3.3 Test the Complete Data Flow

```bash
# Build the project
npm run build  # Must succeed with 0 errors

# Test tag-based search (new default)
npm run inspect:cli
--method tools/call --tool-name list-database-pages --tool-arg search="testing"
# Should primarily show pages with "testing" in tags

# Test full-text search (backward compatibility)
--method tools/call --tool-name list-database-pages --tool-arg search="testing" --tool-arg searchMode="full-text"
# Should show current behavior (search everywhere)

# Test combined mode
--method tools/call --tool-name list-database-pages --tool-arg search="testing" --tool-arg searchMode="combined"
# Should show both but indicate which matches are from tags
```

### COMMIT CHECKPOINT 3

```bash
git add src/services/notion.ts src/tools/notion.ts
git commit -m "feat: implement tag-focused search logic with searchMode support"
```

## Step 4: Add Error Handling for Real Failure Scenarios

### 4.1 Handle Invalid Search Modes

Add validation and helpful error messages:

```typescript
// In the tool implementation
if (searchMode && !['tags', 'full-text', 'combined'].includes(searchMode)) {
  return {
    content: [
      {
        type: 'text',
        text: `❌ Invalid searchMode: ${searchMode}. Use 'tags', 'full-text', or 'combined'.`,
      },
    ],
  };
}
```

### 4.2 Handle Empty Search Results Differently

Provide mode-specific messages when no results found:

```typescript
// When no results with tag search
if (searchMode === 'tags' && results.length === 0) {
  return {
    content: [
      {
        type: 'text',
        text: `📋 No pages found with "${search}" in tags. Try searchMode="full-text" to search in all content.`,
      },
    ],
  };
}
```

### 4.3 Test All Error Scenarios

```bash
# Build and test
npm run build && npm run inspect:cli

# Test invalid search mode
--method tools/call --tool-name list-database-pages --tool-arg search="test" --tool-arg searchMode="invalid"
# Should show helpful error

# Test no results in tag mode
--method tools/call --tool-name list-database-pages --tool-arg search="nonexistenttag"
# Should suggest trying full-text mode

# Quality checks
npm run build  # 0 errors
```

### COMMIT CHECKPOINT 4

```bash
git add .
git commit -m "feat: add error handling and helpful messages for search modes"
```

## Step 5: Enhance Search Results Display

### 5.1 Update Result Formatting

Show which search mode was used and why results matched:

```typescript
// In the tool's result formatting
let header = `📋 Database Pages (${pages.results.length}`;
if (hasMore) header += '+';
header += ')';

// Add search mode indicator
if (args.search) {
  header += `\n**Search mode:** ${searchMode}`;
  if (searchMode === 'tags') {
    header += ' (searching in tags only)';
  } else if (searchMode === 'full-text') {
    header += ' (searching in all content)';
  }
}
```

### 5.2 Indicate Match Type in Results

For combined mode, show where matches came from:

```typescript
// When formatting each page result
if (searchMode === 'combined' && args.search) {
  // Check if match is from tags
  const matchedInTags = page.properties.Tags?.multi_select?.some((tag) =>
    tag.name.toLowerCase().includes(args.search.toLowerCase()),
  );

  if (matchedInTags) {
    description += ' [Matched in tags]';
  }
}
```

### 5.3 Test Enhanced Display

```bash
# Build and test
npm run build && npm run inspect:cli

# Test different modes to see enhanced display
--method tools/call --tool-name list-database-pages --tool-arg search="api" --tool-arg searchMode="tags"
# Should show "Search mode: tags (searching in tags only)"

--method tools/call --tool-name list-database-pages --tool-arg search="api" --tool-arg searchMode="combined"
# Should show which results matched in tags vs content
```

### COMMIT CHECKPOINT 5

```bash
git add .
git commit -m "feat: enhance search results display with mode indicators"
```

## Step 6: Final Quality Check & Demo Preparation

### 6.1 Complete Quality Verification

```bash
# Run all quality checks
npm run build  # Must pass with 0 errors
npm run validate  # MCP validation

# Manual testing of all modes
npm run inspect:cli

# Test 1: Default tag search
--method tools/call --tool-name list-database-pages --tool-arg search="testing"

# Test 2: Explicit full-text (backward compatibility)
--method tools/call --tool-name list-database-pages --tool-arg search="testing" --tool-arg searchMode="full-text"

# Test 3: Combined mode
--method tools/call --tool-name list-database-pages --tool-arg search="testing" --tool-arg searchMode="combined"

# Test 4: No searchMode with other filters (backward compatibility)
--method tools/call --tool-name list-database-pages --tool-arg category="guides"
```

### 6.2 Update Tool Documentation

Update the tool description to document the new parameter:

```typescript
// In tool configuration
description: `Query and search documentation pages in the Notion database. 
Supports advanced filtering by search terms, categories, tags, status, and flexible sorting.
NEW: Use searchMode parameter to control search behavior:
- 'tags' (default): Search only in page tags for better relevance
- 'full-text': Search in all content (previous behavior)  
- 'combined': Search everywhere but indicate tag matches`;
```

### 6.3 Prepare Demo Script

```text
DEMO SCRIPT: Tag-Based Search Enhancement (2 minutes)

1. Show current pages in database:
   --method tools/call --tool-name list-database-pages --tool-arg limit=3
   "Here are our documentation pages with various tags"

2. Demo old behavior (full-text search):
   --method tools/call --tool-name list-database-pages --tool-arg search="testing" --tool-arg searchMode="full-text"
   "Previously, searching for 'testing' would find it anywhere in the content"

3. Demo new default behavior (tag search):
   --method tools/call --tool-name list-database-pages --tool-arg search="testing"
   "Now by default, we search only in tags for more relevant results"

4. Show the improvement:
   "Notice how tag-based search returns more focused results"

5. Demo combined mode:
   --method tools/call --tool-name list-database-pages --tool-arg search="testing" --tool-arg searchMode="combined"
   "We can also search everywhere but see which matches are from tags"

6. Verify backward compatibility:
   --method tools/call --tool-name list-database-pages --tool-arg category="guides"
   "Existing functionality still works exactly as before"
```

### FINAL COMMIT

```bash
git add .
git commit -m "feat: complete tag-based search enhancement

- Users can now search primarily by tags (new default)
- searchMode parameter controls search behavior
- Backward compatible with existing calls
- Enhanced result display shows search mode
- Better search relevance for tag-based queries
- Real data from Notion database
- Ready for production use"
```

## Your Success Checklist

Before marking complete, verify:

- [x] Real Notion database being searched
- [x] New searchMode parameter added to schema
- [x] Tag-based search is new default behavior
- [x] Full-text search still available for compatibility
- [x] Combined mode shows match sources
- [x] Error handling for invalid modes
- [x] Helpful messages when no results
- [x] Search mode shown in results
- [x] Can demo in under 2 minutes
- [x] Backward compatible (old calls work)
- [x] All quality gates passing:
  - [x] Build: 0 errors
  - [x] TypeScript: strict mode passing
  - [x] MCP validation: passing
- [x] No mock data anywhere
- [x] Git log shows proper commits
- [x] Demo script tested and working

## Summary

You've successfully implemented Slice 4: Tag-Based Search Enhancement! Users can now:

- Search pages primarily by tags for better relevance
- Choose between tag-only, full-text, or combined search
- See which search mode was used in results
- Get helpful suggestions when searches fail
- Continue using existing functionality without changes

The enhancement is backward compatible, uses real Notion data, and can be demonstrated in under 2 minutes using the MCP Inspector.
