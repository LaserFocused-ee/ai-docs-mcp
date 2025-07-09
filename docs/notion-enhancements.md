# Notion MCP Server Enhancement Plan

## Overview
This plan addresses the identified issues and adds requested functionality to the Notion MCP server integration, with smart handling of property type variations across different Notion databases.

## Issues to Fix

### 1. Category Field Type Auto-Detection ⚠️ CRITICAL
**Problem**: Category field can be either `select` or `multi_select` depending on the database configuration.
**Current Error**: `Category is expected to be multi_select` (but could also be the reverse)
**Solution**:
- Keep simple string input for category (user-friendly)
- Add pre-flight check to detect actual property type
- Automatically adapt to use correct format (select vs multi_select)
- If initial attempt fails due to type mismatch, retry with alternate format
- Handle this transparently within tool logic - user never sees the error

**Implementation approach**:
```javascript
// Pre-flight check
const dbSchema = await notionService.getDatabase(databaseId);
const categoryType = dbSchema.properties.Category?.type; // 'select' or 'multi_select'

// Adapt format based on actual type
if (categoryType === 'multi_select') {
    properties.Category = { multi_select: [{ name: category }] };
} else if (categoryType === 'select') {
    properties.Category = { select: { name: category } };
}

// Fallback: If error occurs, try alternate format
try {
    // attempt creation
} catch (error) {
    if (error.message.includes('is expected to be')) {
        // Retry with alternate format
    }
}
```

### 2. Search Functionality 
**Problem**: Full-text search is ineffective; should default to tag-based search.
**Solution**:
- Modify `listDatabasePages` to prioritize tag-based filtering
- Add search modes: 'tags' (default), 'full-text', 'combined'
- Handle both select and multi_select Category fields in search

### 3. Failed Page Cleanup
**Problem**: When page creation fails, empty page remains in Notion.
**Solution**:
- Wrap page creation in try-catch with cleanup
- Archive created page if block addition fails
- Provide clear error messages

## New Features to Add

### 1. List Categories Tool
**Purpose**: Show all available categories in the database.
**Implementation**:
- Query database schema
- Detect if Category is select or multi_select
- Return sorted list of available options
- Show category type in output

### 2. Metadata-Only Update Tool  
**Purpose**: Update just metadata without touching content.
**Implementation**:
- Create `update-page-metadata` tool
- Use same smart category type detection
- More efficient than full update

## Implementation Details

### Phase 1: Smart Property Type Handling
1. **Create Property Type Detection Helper**:
   ```javascript
   async function getPropertyType(databaseId: string, propertyName: string): Promise<string | null> {
       try {
           const database = await this.getDatabase(databaseId);
           return database.properties[propertyName]?.type || null;
       } catch {
           return null;
       }
   }
   ```

2. **Create Smart Property Setter**:
   ```javascript
   async function setPropertyValue(properties: any, propertyName: string, value: any, propertyType: string) {
       switch (propertyType) {
           case 'select':
               properties[propertyName] = { select: { name: value } };
               break;
           case 'multi_select':
               properties[propertyName] = { 
                   multi_select: Array.isArray(value) 
                       ? value.map(v => ({ name: v }))
                       : [{ name: value }]
               };
               break;
           // ... other types
       }
   }
   ```

3. **Update createPageFromMarkdown**:
   - Pre-flight check for all metadata properties
   - Build properties object based on actual schema
   - Retry logic for type mismatches

4. **Update ensureDatabaseProperties**:
   - Check existing property types before trying to create
   - Only create missing properties
   - Respect existing property configurations

### Phase 2: Improve Search
1. **Update listDatabasePages**:
   - Detect Category property type
   - Build appropriate filter based on type
   - Handle gracefully if Category doesn't exist
   - Add searchMode parameter with options:
     - 'tags' (default) - search primarily in tags
     - 'full-text' - search in title and description
     - 'combined' - search everywhere

### Phase 3: Add Cleanup & New Tools
1. **Add cleanup logic to createPageFromMarkdown**:
   ```javascript
   let createdPageId: string | null = null;
   try {
       // Create the page
       const page = await this.createPage({...});
       createdPageId = page.id;
       
       // Add blocks
       if (blocks.length > 0) {
           await this.appendBlockChildrenChunked(page.id, blocks);
       }
       
       return { page, conversionResult };
   } catch (error) {
       // If we created a page but failed later, clean it up
       if (createdPageId) {
           try {
               await this.archivePage(createdPageId);
               console.log('Cleaned up failed page creation:', createdPageId);
           } catch (cleanupError) {
               console.error('Failed to cleanup page:', cleanupError);
           }
       }
       throw error;
   }
   ```

2. **List Categories Tool Implementation**:
   ```javascript
   async function listCategoriesTool() {
       const database = await notionService.getDatabase(databaseId);
       const categoryProperty = database.properties.Category;
       
       if (!categoryProperty) {
           return { content: [{ type: "text", text: "No Category property found in database" }] };
       }
       
       const propertyType = categoryProperty.type;
       const options = propertyType === 'select' 
           ? categoryProperty.select.options
           : categoryProperty.multi_select.options;
       
       const categoriesList = options
           .sort((a, b) => a.name.localeCompare(b.name))
           .map(opt => `• ${opt.name} (${opt.color})`)
           .join('\n');
       
       return {
           content: [{
               type: "text",
               text: `📁 Available Categories (${propertyType}):\n\n${categoriesList}`
           }]
       };
   }
   ```

3. **Metadata Update Tool**:
   - Reuse smart property handling from createPageFromMarkdown
   - Only update specified properties
   - Skip content updates entirely

## Benefits of This Approach
- ✅ Works with ANY Notion database configuration
- ✅ No breaking changes for users
- ✅ Transparent error handling
- ✅ Simple string input maintained
- ✅ Future-proof for other property variations

## File Changes Summary
- `src/services/notion.ts`: 
  - Add `getPropertyType()` method
  - Add `setPropertyValue()` method
  - Update `createPageFromMarkdown()` with smart property handling and cleanup
  - Update `updatePageMetadata()` with smart property handling
  - Update `listDatabasePages()` to handle different Category types
  - Update `ensureDatabaseProperties()` to check existing types

- `src/tools/notion.ts`: 
  - Add `listCategoriesTool()` function
  - Add `updatePageMetadataTool()` function
  - Update `configureNotionTools()` to register new tools
  - Keep existing tool interfaces unchanged

- `README.md`:
  - Document new tools
  - Update tool count (11 total → 13 total)

## Testing Strategy
- Test with select Category database
- Test with multi_select Category database  
- Test with missing Category property
- Test property type changes mid-operation
- Test cleanup on various failure scenarios
- Test search with different modes

## Error Handling Patterns
1. **Property Type Mismatch**: Retry with correct format
2. **Missing Property**: Log warning but continue
3. **API Failures**: Clean up any partial operations
4. **Network Issues**: Provide clear error messages

## Timeline
- Phase 1: Smart property handling (2-3 hours)
- Phase 2: Search improvements (1-2 hours)
- Phase 3: Cleanup & new tools (2-3 hours)
- Testing & documentation (1-2 hours)

Total estimated time: 6-10 hours of development