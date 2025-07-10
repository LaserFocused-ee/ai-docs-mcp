# Slice 5: User Gets Clean State After Failed Creation Implementation Instructions

## ⚠️ CRITICAL: User-Testable Value in Every Slice

**STOP! Before implementing, verify your slice passes this test:**

1. **Can a user run the app and SEE something?** ✅ Yes - error handling in MCP Inspector
2. **Can a user DO something and get a RESULT?** ✅ Yes - attempt page creation with oversized content
3. **Could you DEMO this in 2 minutes?** ✅ Yes - show failed creation doesn't leave orphan pages
4. **Would a stakeholder say "Great, I can see the progress"?** ✅ Yes - better error handling and cleanup
5. **Does it use 100% REAL DATA from real sources?** ✅ Yes - real Notion database operations

## 🚨 CRITICAL: NO MOCK DATA EVER

This slice will:

- ✅ Create pages in REAL Notion database
- ✅ Handle REAL API errors from Notion
- ✅ Clean up REAL orphaned pages
- ❌ NOT use any mock error scenarios
- ❌ NOT use any fake database operations

## Your Mission

You are implementing a TRUE vertical slice - adding automatic cleanup for failed page creation operations. When page creation fails after the initial page is created but before content blocks are added, the orphan page will be automatically archived/deleted, leaving the user's Notion database clean.

## Step 0: Validate Your Slice Definition & Data Plan

```text
Feature Name: Failed Creation Cleanup
User Story: As a user, when page creation fails, I don't want orphaned pages left in my Notion database
Data Requirements:
  - Database tables: Existing Notion database (no new tables)
  - API endpoints: Existing Notion API (create, archive operations)
  - Test data: Create oversized markdown content to trigger failures
Demo Steps:
  1. Run npm run inspect:cli to start MCP Inspector
  2. Create markdown file with very large code block (>2000 characters)
  3. Call create-page-from-markdown with the file
  4. See error message indicating cleanup was performed
  5. Verify no orphan page exists in Notion database
Feature Flag: None needed (bug fix)
Branch Name: feature/cleanup-failed-creation

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
- [ ] On feature branch (`git checkout -b feature/cleanup-failed-creation`)
- [ ] Clean working directory (`git status`)
- [ ] Dependencies installed (`npm install`)
- [ ] Environment variables set (NOTION_TOKEN, NOTION_MCP_DATABASE_ID)
- [ ] Previous slices complete (Slices 1-4)
- [ ] Have access to real Notion database for testing

## Step 1: Set Up Real Data Infrastructure FIRST

### 1.1 Create and Switch to Feature Branch

```bash
# First, ensure you're on a clean base
git status  # Should show clean
git checkout main
git pull origin main

# Create your feature branch
git checkout -b feature/cleanup-failed-creation
```

### 1.2 Create Test Data for Triggering Failures

Create a test markdown file with oversized content that will trigger Notion API errors:

````bash
# Create test directory
mkdir -p test-data

# Create oversized markdown file
cat > test-data/oversized-code-block.md << 'EOF'
# Test Page with Oversized Code Block

This page will fail to create because the code block exceeds Notion's limits.

```javascript
// This code block is intentionally very large to trigger a Notion API error
// Notion has a limit on block size, and exceeding it will cause page creation to fail
// We'll repeat this content many times to exceed the limit
EOF

# Add 3000+ characters to the code block
for i in {1..100}; do
  echo "console.log('This is line $i of very repetitive code that will exceed Notion block size limits when we try to create a page with this content');" >> test-data/oversized-code-block.md
done

echo '```' >> test-data/oversized-code-block.md
echo '' >> test-data/oversized-code-block.md
echo 'This should trigger a failure during block creation.' >> test-data/oversized-code-block.md

# Verify the file is large enough
wc -c test-data/oversized-code-block.md  # Should be >3000 characters
````

### 1.3 Test Current Behavior (No Cleanup)

First, let's verify the problem exists:

```bash
# Build and start MCP Inspector
npm run build && npm run inspect:cli

# Try to create a page with oversized content
--method tools/call --tool-name create-page-from-markdown --tool-arg filePath="$(pwd)/test-data/oversized-code-block.md" --tool-arg pageTitle="Test Orphan Page" --tool-arg metadata='{"status": "draft"}'

# You should see an error about block size
# Now check your Notion database - there's likely an empty page titled "Test Orphan Page"
# This is the problem we're fixing!
```

### COMMIT CHECKPOINT 1

```bash
git add test-data/
git commit -m "test: add oversized markdown file for testing failed creation cleanup"
```

## Step 2: Create Minimal UI Connected to Real Data

### 2.1 Update NotionService to Track Created Page ID

First, modify the createPageFromMarkdown method to track the created page ID:

```typescript
// In src/services/notion.ts, find createPageFromMarkdown method
// Update the method to wrap page creation in try-catch with cleanup

async createPageFromMarkdown(
    databaseId: string,
    markdown: string,
    options: {
        title?: string;
        category?: string;
        tags?: string[];
        description?: string;
        status?: string;
    } = {},
): Promise<{ page: NotionPage; conversionResult: ConversionResult }> {
    let createdPageId: string | null = null;

    try {
        // ... existing validation code ...

        // Create the page (track the ID for potential cleanup)
        const page = await this.createPage({
            parent: { database_id: databaseId },
            properties,
        });

        // IMPORTANT: Store the page ID immediately after creation
        createdPageId = page.id;

        // ... rest of the method (adding blocks) ...

    } catch (error) {
        // If we created a page but failed during block addition, clean it up
        if (createdPageId) {
            try {
                await this.archivePage(createdPageId);
                console.log(`Cleaned up orphaned page ${createdPageId} after creation failure`);
            } catch (cleanupError) {
                console.error(`Failed to cleanup orphaned page ${createdPageId}:`, cleanupError);
                // Don't throw cleanup error, preserve original error
            }
        }

        // Enhance error message to indicate cleanup was attempted
        if (error instanceof Error && createdPageId) {
            error.message = `${error.message}\n\n✅ Cleanup: The partially created page has been archived to keep your database clean.`;
        }

        throw error;
    }
}
```

### 2.2 Verify TypeScript Compilation

```bash
# Build to check TypeScript
npm run build  # Must succeed with 0 errors
```

### 2.3 Test the Cleanup Behavior

```bash
# Test with MCP Inspector
npm run inspect:cli

# Try to create a page with oversized content again
--method tools/call --tool-name create-page-from-markdown --tool-arg filePath="$(pwd)/test-data/oversized-code-block.md" --tool-arg pageTitle="Test Cleanup Working" --tool-arg metadata='{"status": "draft"}'

# You should see:
# 1. An error about block size
# 2. A message indicating cleanup was performed
# 3. Check Notion - no orphan page should exist!
```

### COMMIT CHECKPOINT 2

```bash
git add src/services/notion.ts
git commit -m "feat: add automatic cleanup for failed page creation

- Track created page ID immediately after creation
- Archive orphaned pages when block addition fails
- Add cleanup confirmation to error messages
- Preserve original error for debugging"
```

## Step 3: Make It Interactive with Real Persistence

### 3.1 Enhance Error Messages for Different Failure Types

Update the error handling to provide specific messages based on failure type:

```typescript
// In the catch block of createPageFromMarkdown
catch (error) {
    // If we created a page but failed during block addition, clean it up
    if (createdPageId) {
        try {
            await this.archivePage(createdPageId);
            console.log(`Cleaned up orphaned page ${createdPageId} after creation failure`);
        } catch (cleanupError) {
            console.error(`Failed to cleanup orphaned page ${createdPageId}:`, cleanupError);
        }
    }

    // Provide specific error messages based on failure type
    if (error instanceof Error) {
        let enhancedMessage = error.message;

        if (error.message.includes('block_validation_error')) {
            enhancedMessage = `❌ Block validation failed: ${error.message}`;
            if (createdPageId) {
                enhancedMessage += '\n\n✅ Cleanup: The partially created page has been archived.';
            }
        } else if (error.message.includes('rate_limited')) {
            enhancedMessage = `⏱️ Rate limit exceeded: ${error.message}`;
            if (createdPageId) {
                enhancedMessage += '\n\n✅ Cleanup: The partially created page has been archived.';
            }
        } else if (createdPageId) {
            enhancedMessage += '\n\n✅ Cleanup: The partially created page has been archived to keep your database clean.';
        }

        error.message = enhancedMessage;
    }

    throw error;
}
```

### 3.2 Add Debug Logging for Development

Add optional debug logging to help diagnose issues:

```typescript
// At the top of createPageFromMarkdown
const debug = process.env.NODE_ENV === 'development';

// After page creation
if (debug) {
  console.log(`[DEBUG] Created page with ID: ${page.id}`);
}

// In cleanup section
if (debug && createdPageId) {
  console.log(`[DEBUG] Attempting cleanup of page: ${createdPageId}`);
}
```

### 3.3 Test Multiple Failure Scenarios

Create additional test files for different failure types:

````bash
# Create a file with invalid block structure
cat > test-data/invalid-blocks.md << 'EOF'
# Test Invalid Blocks

This page has blocks that Notion won't accept.

```unsupported-language
This language isn't supported by Notion
````

EOF

# Test with invalid blocks

npm run build && npm run inspect:cli
--method tools/call --tool-name create-page-from-markdown --tool-arg filePath="$(pwd)/test-data/invalid-blocks.md" --tool-arg pageTitle="Test Invalid Blocks"

````

### COMMIT CHECKPOINT 3

```bash
git add src/services/notion.ts test-data/
git commit -m "feat: enhance error messages and add debug logging for cleanup

- Add specific error messages for different failure types
- Include cleanup confirmation in all error scenarios
- Add optional debug logging in development mode
- Test with multiple failure scenarios"
````

## Step 4: Add Error Handling for Real Failure Scenarios

### 4.1 Handle Archive Failures Gracefully

Sometimes the archive operation itself might fail. Update the cleanup logic:

```typescript
// In the cleanup section
if (createdPageId) {
  let cleanupSuccessful = false;
  try {
    await this.archivePage(createdPageId);
    cleanupSuccessful = true;
    console.log(`Cleaned up orphaned page ${createdPageId} after creation failure`);
  } catch (cleanupError) {
    console.error(`Failed to cleanup orphaned page ${createdPageId}:`, cleanupError);
    // Continue with original error flow
  }

  // Update error message based on cleanup result
  if (error instanceof Error) {
    if (cleanupSuccessful) {
      error.message += '\n\n✅ Cleanup: The partially created page has been archived.';
    } else {
      error.message +=
        '\n\n⚠️ Note: A partially created page may remain in your database. Page ID: ' +
        createdPageId;
    }
  }
}
```

### 4.2 Test Cleanup Resilience

```bash
# Build and test
npm run build && npm run inspect:cli

# Test with our oversized content
--method tools/call --tool-name create-page-from-markdown --tool-arg filePath="$(pwd)/test-data/oversized-code-block.md" --tool-arg pageTitle="Final Cleanup Test"

# The error should clearly indicate whether cleanup succeeded or failed
```

### 4.3 Document the Cleanup Behavior

Update the tool description to mention automatic cleanup:

```typescript
// In src/tools/notion.ts, find the create-page-from-markdown tool registration
// Update the description
'Create a new documentation page in Notion from markdown content or a markdown file. Automatically converts markdown syntax to Notion blocks and sets proper metadata. Choose either markdown content OR filePath, not both. If page creation fails after the page is created, it will be automatically archived to prevent orphaned pages.',
```

### COMMIT CHECKPOINT 4

```bash
git add src/services/notion.ts src/tools/notion.ts
git commit -m "feat: handle cleanup failures gracefully and update documentation

- Gracefully handle archive operation failures
- Provide clear feedback on cleanup success/failure
- Update tool description to mention automatic cleanup
- Ensure original errors are preserved"
```

## Step 5: Final Quality Check & Demo Preparation

### 5.1 Complete Quality Verification

```bash
# Run all quality checks
npm run build  # Must pass with 0 errors
npm run validate  # MCP validation

# Manual testing of cleanup behavior
npm run inspect:cli

# Test 1: Oversized content (should clean up)
--method tools/call --tool-name create-page-from-markdown --tool-arg filePath="$(pwd)/test-data/oversized-code-block.md" --tool-arg pageTitle="Quality Check 1"

# Test 2: Normal content (should succeed without cleanup)
--method tools/call --tool-name create-page-from-markdown --tool-arg markdown="# Normal Page\n\nThis should work fine." --tool-arg pageTitle="Quality Check 2"

# Verify:
# - Failed creation shows cleanup message
# - Successful creation works normally
# - No orphan pages in Notion database
```

### 5.2 Create Demo Script

```text
DEMO SCRIPT: Failed Creation Cleanup (2 minutes)

1. Show the problem without cleanup:
   "Previously, if page creation failed, orphan pages were left in Notion"

2. Create oversized content file:
   cat test-data/oversized-code-block.md
   "This markdown has a code block that exceeds Notion's limits"

3. Attempt to create page:
   --method tools/call --tool-name create-page-from-markdown --tool-arg filePath="$(pwd)/test-data/oversized-code-block.md" --tool-arg pageTitle="Demo Cleanup"

4. Show the improved error message:
   "Notice the error now includes a cleanup confirmation"

5. Check Notion database:
   "No orphan page exists - the database stays clean!"

6. Show successful creation still works:
   --method tools/call --tool-name create-page-from-markdown --tool-arg markdown="# Success\n\nNormal content works fine"
   "Regular page creation is unaffected"
```

### 5.3 Clean Up Test Data

```bash
# Remove test files after demo
rm -rf test-data/

# Or keep them for future testing
git add test-data/
git commit -m "test: add test data files for failed creation scenarios"
```

### FINAL COMMIT

```bash
git add .
git commit -m "feat: complete failed creation cleanup implementation

- Automatically archive orphaned pages when creation fails
- Clear error messages indicate cleanup was performed
- Handle various failure scenarios gracefully
- Preserve original error information
- No orphan pages left in Notion database
- Real-world error handling with real API
- Ready for production use"
```

## Your Success Checklist

Before marking complete, verify:

- [x] Real Notion database operations (no mock data)
- [x] Cleanup logic added to createPageFromMarkdown
- [x] Created page ID tracked for potential cleanup
- [x] Archive operation called on failure
- [x] Error messages enhanced with cleanup status
- [x] Multiple failure scenarios tested
- [x] Cleanup failures handled gracefully
- [x] Tool description updated
- [x] Can demo in under 2 minutes
- [x] No orphan pages left after failures
- [x] All quality gates passing:
  - [x] Build: 0 errors
  - [x] TypeScript: strict mode passing
  - [x] MCP validation: passing
- [x] Git log shows proper commits
- [x] Demo script tested and working

## Summary

You've successfully implemented Slice 5: Failed Creation Cleanup! Users can now:

- Attempt page creation without worrying about orphan pages
- See clear error messages that confirm cleanup occurred
- Trust that their Notion database stays clean
- Handle various failure scenarios gracefully
- Continue using the tool with confidence

The enhancement is production-ready and can be demonstrated in under 2 minutes using the MCP Inspector.
