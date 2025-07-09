# Slice 3: User Can Update Only Metadata Implementation Instructions

## ⚠️ CRITICAL: User-Testable Value in This Slice

**STOP! Before implementing, verify this slice passes the test:**

1. **Can a user run the MCP Inspector and SEE the new tool?** YES
2. **Can a user DO metadata updates and get a RESULT?** YES
3. **Could you DEMO this in 2 minutes?** YES
4. **Would a stakeholder say "Great, I can see users can update metadata without touching content"?** YES
5. **Does it use 100% REAL DATA from Notion?** YES

## Your Mission

You are implementing a vertical slice that allows users to update ONLY the metadata of a Notion page without touching its content. This provides a faster, safer way to update tags, category, status, or description without the risk of accidentally modifying page content. This slice must work with REAL Notion pages using the REAL Notion API.

**User Story**: As a user, I can update just the metadata (tags, category, status, description) of a Notion page without modifying its content, and see the updated metadata reflected immediately in Notion.

## Pre-Implementation Checklist

- [ ] Verify Node.js 22+ is active: `nvm use 22 && node --version`
- [ ] Clean working directory: `git status` (should be clean)
- [ ] On feature branch: Create new branch from main
- [ ] Environment variables set:
  ```bash
  export NOTION_TOKEN="your-notion-integration-token"
  export NOTION_MCP_DATABASE_ID="your-test-database-id"
  ```
- [ ] Previous slices complete: Slices 1 and 2 should be working
- [ ] Can build project: `npm run build`
- [ ] Can run MCP Inspector: `npm run inspect:cli`

## Implementation Steps

### Step 0: Validate Slice Definition & Data Plan

```
Feature Name: Update Page Metadata Only
User Story: As a user, I can update just the metadata of a Notion page without modifying its content
Data Requirements:
  - Notion Database: Existing database with pages containing metadata fields
  - API endpoints: Notion API - Update page properties endpoint
  - Test data: At least one real page in Notion to update
Demo Steps:
  1. Run `npm run inspect:cli` to start MCP Inspector
  2. List pages to find a test page ID
  3. Call update-page-metadata with new tags/category
  4. Verify in Notion that metadata updated but content unchanged
  5. Call list-database-pages to see updated metadata
Feature Flag: None (new tool, no flag needed)
Branch Name: feature/update-page-metadata-tool

Project Commands:
- Build: npm run build
- Run Inspector: npm run inspect:cli
- Validate: npm run validate
- Test specific tool: npm run inspect:cli:update-page-metadata (after creation)
```

### Step 1: Set Up Feature Branch and Verify Infrastructure

#### 1.1 Create and Switch to Feature Branch

```bash
# Ensure clean working directory
git status  # Should show clean

# Create feature branch
git checkout -b feature/update-page-metadata-tool

# Verify you can query existing Notion pages
npm run build && npm run inspect:cli
# Run: method tools/call --tool-name list-database-pages --tool-arg limit=1
# Should return at least one page with metadata
```

#### 1.2 Verify NotionService Has updatePageMetadata Method

Check that `src/services/notion.ts` already has the `updatePageMetadata` method from previous work. This method should:

- Accept pageId and metadata fields
- Use smart property detection for Category
- Update only specified properties
- Return success/failure status

```bash
# Verify the service method exists
grep -n "updatePageMetadata" src/services/notion.ts
# Should show the method definition

# COMMIT CHECKPOINT 1
git add -A
git commit -m "chore: create feature branch for update-page-metadata tool"
```

### Step 2: Create the update-page-metadata Tool

#### 2.1 Create updatePageMetadataTool Function

Add to `src/tools/notion.ts`:

```typescript
export async function updatePageMetadataTool(
  toolName: string,
  args: {
    pageId: string;
    category?: string;
    tags?: string[];
    status?: string;
    description?: string;
  },
): Promise<McpToolResponse> {
  const notion = getNotionService();

  if (!notion) {
    return {
      content: [
        {
          type: 'text' as const,
          text: '❌ Notion service not configured. Please set NOTION_TOKEN and NOTION_MCP_DATABASE_ID environment variables.',
        },
      ],
    };
  }

  try {
    // Validate at least one metadata field is provided
    if (!args.category && !args.tags && !args.status && !args.description) {
      return {
        content: [
          {
            type: 'text' as const,
            text: '❌ At least one metadata field must be provided (category, tags, status, or description)',
          },
        ],
      };
    }

    // Call the service method
    await notion.updatePageMetadata(args.pageId, {
      category: args.category,
      tags: args.tags,
      status: args.status,
      description: args.description,
    });

    // Build success message showing what was updated
    const updates: string[] = [];
    if (args.category !== undefined) updates.push(`category: "${args.category}"`);
    if (args.tags !== undefined) updates.push(`tags: [${args.tags.join(', ')}]`);
    if (args.status !== undefined) updates.push(`status: "${args.status}"`);
    if (args.description !== undefined) updates.push(`description: "${args.description}"`);

    return {
      content: [
        {
          type: 'text' as const,
          text: `✅ Successfully updated page metadata!\n\nUpdated fields:\n${updates.map((u) => `• ${u}`).join('\n')}\n\nPage ID: ${args.pageId}`,
        },
      ],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text' as const,
          text: `❌ Failed to update page metadata: ${errorMessage}`,
        },
      ],
    };
  }
}
```

#### 2.2 Test the Function Compiles

```bash
# Build to ensure TypeScript is happy
npm run build
# Should compile without errors

# COMMIT CHECKPOINT 2
git add src/tools/notion.ts
git commit -m "feat: implement updatePageMetadataTool function"
```

### Step 3: Register the Tool in MCP Server

#### 3.1 Add Tool Registration

In `src/tools/notion.ts`, update the `configureNotionTools` function to include the new tool:

```typescript
// In configureNotionTools function, add this tool definition:
{
    name: "update-page-metadata",
    description: "Update only the metadata (category, tags, status, description) of a Notion page without modifying its content. Faster and safer than full page updates.",
    inputSchema: z.object({
        pageId: z.string().describe("The ID of the Notion page to update"),
        category: z.string().optional().describe("New category for the page"),
        tags: z.array(z.string()).optional().describe("New tags for the page (replaces existing tags)"),
        status: z.string().optional().describe("New status for the page"),
        description: z.string().optional().describe("New description for the page")
    }).strict() as z.ZodType<{
        pageId: string;
        category?: string;
        tags?: string[];
        status?: string;
        description?: string;
    }>,
    handler: updatePageMetadataTool
}
```

#### 3.2 Verify Tool Registration

```bash
# Build the project
npm run build

# Test that the tool appears in the tool list
npm run inspect:cli
# Run: method tools/list
# Should see "update-page-metadata" in the list

# COMMIT CHECKPOINT 3
git add src/tools/notion.ts
git commit -m "feat: register update-page-metadata tool in MCP server"
```

### Step 4: Test with Real Notion Data

#### 4.1 Get a Test Page ID

```bash
# Start MCP Inspector
npm run inspect:cli

# Get a page to test with
# Run: method tools/call --tool-name list-database-pages --tool-arg limit=1
# Copy the page ID from the response
```

#### 4.2 Test Metadata Updates

```bash
# Test updating just tags
# Run: method tools/call --tool-name update-page-metadata --tool-arg pageId="[YOUR-PAGE-ID]" --tool-arg tags='["updated", "metadata-test"]'
# Should see success message

# Verify the update worked by listing the page again
# Run: method tools/call --tool-name list-database-pages --tool-arg search="[YOUR-PAGE-ID]"
# Should see the new tags

# Test updating multiple fields
# Run: method tools/call --tool-name update-page-metadata --tool-arg pageId="[YOUR-PAGE-ID]" --tool-arg category="testing" --tool-arg status="published" --tool-arg description="Updated via metadata tool"
# Should see success with all updated fields listed
```

#### 4.3 Verify in Notion UI

Open Notion and navigate to the page you updated. Verify:

- Tags have been updated
- Category has been updated
- Status has been updated
- Description has been updated
- **CRITICAL**: Page content has NOT been modified

```bash
# COMMIT CHECKPOINT 4
git add -A
git commit -m "test: verify update-page-metadata works with real Notion data"
```

### Step 5: Add Error Handling and Edge Cases

#### 5.1 Test Error Scenarios

```bash
# Test with invalid page ID
# Run: method tools/call --tool-name update-page-metadata --tool-arg pageId="invalid-id" --tool-arg tags='["test"]'
# Should see helpful error message

# Test with no fields provided
# Run: method tools/call --tool-name update-page-metadata --tool-arg pageId="[YOUR-PAGE-ID]"
# Should see error asking for at least one field

# Test with empty arrays/strings
# Run: method tools/call --tool-name update-page-metadata --tool-arg pageId="[YOUR-PAGE-ID]" --tool-arg tags='[]' --tool-arg description=""
# Should handle gracefully
```

#### 5.2 Add Loading States (Already in Service)

The NotionService already handles async operations properly. Verify the tool responds quickly for metadata-only updates compared to full page updates.

```bash
# Time a metadata update vs full update to show performance benefit
# This demonstrates why metadata-only updates are valuable

# COMMIT CHECKPOINT 5
git commit --allow-empty -m "test: verify error handling for update-page-metadata tool"
```

### Step 6: Final Quality Check & Demo Preparation

#### 6.1 Complete Quality Verification

```bash
# Run all quality checks
npm run build        # Must succeed with 0 errors
npm run validate     # Must pass MCP validation

# Manual verification checklist:
# 1. Tool appears in tools/list
# 2. Tool has clear description
# 3. Input schema is well-documented
# 4. Success messages are informative
# 5. Error messages are helpful
# 6. Works with real Notion pages
# 7. Preserves page content
# 8. Faster than full page updates
```

#### 6.2 Prepare Demo Script

```markdown
## Demo Script for Update Page Metadata Tool

1. **Show current page state**
```

npm run inspect:cli
method tools/call --tool-name list-database-pages --tool-arg limit=1

```
Note the current tags, category, and status

2. **Update just the tags**
```

method tools/call --tool-name update-page-metadata \
 --tool-arg pageId="[PAGE-ID]" \
 --tool-arg tags='["demo", "metadata-only", "fast-update"]'

```
Point out: "Notice how we can update just the tags without touching content"

3. **Show the updated page**
```

method tools/call --tool-name list-database-pages \
 --tool-arg search="[PAGE-ID]"

```
Highlight: "Tags are updated, but we didn't risk modifying content"

4. **Update multiple metadata fields**
```

method tools/call --tool-name update-page-metadata \
 --tool-arg pageId="[PAGE-ID]" \
 --tool-arg category="guides" \
 --tool-arg status="published" \
 --tool-arg description="Demonstrated metadata-only updates"

```
Emphasize: "Multiple fields updated in one call, still no content risk"

5. **Open Notion to verify**
- Show the page in Notion
- Point out updated metadata
- Show content is unchanged
- Mention performance benefit

Total demo time: ~2 minutes
```

#### 6.3 Final Commit

```bash
# Create demo script file
cat > docs/slices/SLICE_3_DEMO.md << 'EOF'
[Demo script content from above]
EOF

git add docs/slices/SLICE_3_DEMO.md
git commit -m "feat: complete update-page-metadata tool implementation

- New tool for updating only page metadata
- Preserves page content while updating properties
- Supports category, tags, status, and description
- Uses smart property detection for compatibility
- Faster than full page updates
- Clear success/error messages
- Tested with real Notion pages
- Ready for production use"
```

## Success Verification

Run through this checklist to confirm the slice is complete:

- [ ] Tool builds without errors: `npm run build`
- [ ] Tool passes validation: `npm run validate`
- [ ] Tool appears in tools list: `npm run inspect:cli` → `method tools/list`
- [ ] Can update tags only and see changes in Notion
- [ ] Can update category with smart detection (works with select or multi_select)
- [ ] Can update multiple fields in one call
- [ ] Original page content is never modified
- [ ] Error messages are helpful for invalid inputs
- [ ] Success messages clearly show what was updated
- [ ] Performance is noticeably faster than full page updates
- [ ] Demo can be completed in under 2 minutes
- [ ] All changes are committed to feature branch

## Quality Gates

### Build and Validation

```bash
npm run build      # 0 errors
npm run validate   # Passes MCP validation
```

### Testing Commands

```bash
# Test the tool exists
npm run inspect:cli
method tools/list | grep update-page-metadata

# Test with real page
method tools/call --tool-name list-database-pages --tool-arg limit=1
# Copy a page ID
method tools/call --tool-name update-page-metadata \
  --tool-arg pageId="[PAGE-ID]" \
  --tool-arg tags='["test1", "test2"]'
```

### Integration Verification

- Open Notion and verify the page metadata is updated
- Verify page content/blocks are unchanged
- Test with both select and multi_select category fields
- Measure performance improvement vs full update

## Common Issues and Solutions

### Issue: "Category is expected to be multi_select"

**Solution**: The smart property detection in NotionService handles this automatically. If you see this error, ensure you're using the latest version of the service code from Slice 1.

### Issue: "Page not found"

**Solution**: Verify the page ID is correct and your NOTION_TOKEN has access to the page. Use list-database-pages to find valid page IDs.

### Issue: Tool doesn't appear in list

**Solution**: Ensure you've run `npm run build` after adding the tool registration. Check for TypeScript errors.

## Next Steps

With this slice complete, users can now:

1. Update page metadata without risk to content
2. Perform faster updates for metadata-only changes
3. Batch update multiple metadata fields efficiently

This prepares the foundation for Slice 4 (tag-based search improvements) by ensuring users can easily manage their tags.
