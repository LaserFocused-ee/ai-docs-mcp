# Slice 1: Smart Category Detection Implementation

## Overview
Implement smart category type detection to fix the "Category is expected to be multi_select" error by automatically adapting to the actual property type in the Notion database.

**Estimated Time**: 2-3 hours  
**Priority**: CRITICAL - This is blocking page creation  
**Feature Flag**: None needed (backward compatible)

## Pre-Implementation Checklist

```bash
# 1. Ensure clean working directory
git status

# 2. Create feature branch
git checkout -b feature/smart-category-detection

# 3. Verify Node.js version
node --version  # Should be v22+

# 4. Build project to ensure clean start
npm run build
```

## Step-by-Step Implementation

### Step 1: Add Property Type Detection Helper (30 mins)

**File**: `src/services/notion.ts`

1. **Add the detection method to NotionService class**:

```typescript
// Add after line ~50 (after constructor)
private async getPropertyType(databaseId: string, propertyName: string): Promise<string | null> {
    try {
        const database = await this.getDatabase(databaseId);
        return database.properties[propertyName]?.type || null;
    } catch (error) {
        console.error(`Failed to get property type for ${propertyName}:`, error);
        return null;
    }
}
```

2. **Add property type cache to avoid repeated API calls**:

```typescript
// Add as class property (around line 20)
private propertyTypeCache: Map<string, Map<string, string>> = new Map();

// Update getPropertyType to use cache
private async getPropertyType(databaseId: string, propertyName: string): Promise<string | null> {
    // Check cache first
    const dbCache = this.propertyTypeCache.get(databaseId);
    if (dbCache?.has(propertyName)) {
        return dbCache.get(propertyName) || null;
    }

    try {
        const database = await this.getDatabase(databaseId);
        const propertyType = database.properties[propertyName]?.type || null;
        
        // Cache the result
        if (!this.propertyTypeCache.has(databaseId)) {
            this.propertyTypeCache.set(databaseId, new Map());
        }
        this.propertyTypeCache.get(databaseId)!.set(propertyName, propertyType || '');
        
        return propertyType;
    } catch (error) {
        console.error(`Failed to get property type for ${propertyName}:`, error);
        return null;
    }
}
```

**Test Point**: Build project to ensure no TypeScript errors
```bash
npm run build
```

### Step 2: Create Smart Property Setter (45 mins)

**File**: `src/services/notion.ts`

1. **Add smart property value setter**:

```typescript
// Add after getPropertyType method
private async setPropertyValue(
    properties: any, 
    propertyName: string, 
    value: any, 
    databaseId: string
): Promise<void> {
    const propertyType = await this.getPropertyType(databaseId, propertyName);
    
    if (!propertyType) {
        console.warn(`Property ${propertyName} not found in database schema`);
        return;
    }

    switch (propertyType) {
        case 'select':
            properties[propertyName] = { select: { name: String(value) } };
            break;
            
        case 'multi_select':
            properties[propertyName] = { 
                multi_select: Array.isArray(value) 
                    ? value.map(v => ({ name: String(v) }))
                    : [{ name: String(value) }]
            };
            break;
            
        case 'title':
            properties[propertyName] = { 
                title: [{ text: { content: String(value) } }] 
            };
            break;
            
        case 'rich_text':
            properties[propertyName] = { 
                rich_text: [{ text: { content: String(value) } }] 
            };
            break;
            
        case 'checkbox':
            properties[propertyName] = { checkbox: Boolean(value) };
            break;
            
        case 'number':
            properties[propertyName] = { number: Number(value) };
            break;
            
        case 'url':
            properties[propertyName] = { url: String(value) };
            break;
            
        default:
            console.warn(`Unsupported property type ${propertyType} for ${propertyName}`);
    }
}
```

**Test Point**: Build again to check for errors
```bash
npm run build
```

### Step 3: Update createPageFromMarkdown Method (60 mins)

**File**: `src/services/notion.ts`

1. **Find the createPageFromMarkdown method** (around line 200-300)

2. **Update the properties building logic**:

```typescript
// Find where properties are built (look for "properties" object creation)
// Replace the existing Category handling with:

const properties: any = {
    Name: {
        title: [{ text: { content: pageTitle } }]
    }
};

// Smart property setting for all metadata
if (metadata) {
    // Handle description
    if (metadata.description) {
        await this.setPropertyValue(
            properties, 
            'Description', 
            metadata.description, 
            this.databaseId
        );
    }

    // Handle category with smart detection
    if (metadata.category) {
        await this.setPropertyValue(
            properties, 
            'Category', 
            metadata.category, 
            this.databaseId
        );
    }

    // Handle tags
    if (metadata.tags && Array.isArray(metadata.tags)) {
        await this.setPropertyValue(
            properties, 
            'Tags', 
            metadata.tags, 
            this.databaseId
        );
    }

    // Handle status
    if (metadata.status) {
        await this.setPropertyValue(
            properties, 
            'Status', 
            metadata.status, 
            this.databaseId
        );
    }
}
```

3. **Add retry logic for property type mismatches**:

```typescript
// Wrap the page creation in retry logic
let page;
let retryCount = 0;
const maxRetries = 1;

while (retryCount <= maxRetries) {
    try {
        page = await this.createPage({
            parent: { database_id: this.databaseId },
            properties,
            children: blocks.slice(0, 100) // Notion API limit
        });
        break; // Success, exit loop
    } catch (error: any) {
        if (
            retryCount < maxRetries && 
            error.message?.includes('is expected to be')
        ) {
            console.log('Property type mismatch detected, clearing cache and retrying...');
            // Clear cache to force re-detection
            this.propertyTypeCache.delete(this.databaseId);
            retryCount++;
            
            // Rebuild properties with fresh type detection
            // (repeat the properties building logic here)
        } else {
            throw error; // Re-throw if not a type mismatch or max retries reached
        }
    }
}
```

**Test Point**: Full build and type check
```bash
npm run build
```

### Step 4: Update ensureDatabaseProperties Method (30 mins)

**File**: `src/services/notion.ts`

1. **Find ensureDatabaseProperties method**

2. **Update to check existing property types before creating**:

```typescript
private async ensureDatabaseProperties() {
    try {
        const database = await this.getDatabase(this.databaseId);
        const existingProperties = database.properties;
        const propertiesToCreate: any = {};

        // Helper to check if property exists with correct type
        const needsProperty = (name: string, expectedType: string): boolean => {
            return !existingProperties[name] || existingProperties[name].type !== expectedType;
        };

        // Only add properties that don't exist or have wrong type
        if (needsProperty('Description', 'rich_text')) {
            propertiesToCreate['Description'] = { rich_text: {} };
        }

        if (needsProperty('Tags', 'multi_select')) {
            propertiesToCreate['Tags'] = { multi_select: {} };
        }

        if (needsProperty('Status', 'select')) {
            propertiesToCreate['Status'] = {
                select: {
                    options: [
                        { name: 'published', color: 'green' },
                        { name: 'draft', color: 'yellow' },
                        { name: 'archived', color: 'gray' },
                        { name: 'review', color: 'blue' }
                    ]
                }
            };
        }

        // Don't create Category - respect existing configuration
        if (!existingProperties['Category']) {
            console.log('Note: Category property not found in database. Consider adding it manually as select or multi_select.');
        }

        // Only update if there are properties to add
        if (Object.keys(propertiesToCreate).length > 0) {
            await this.notion.databases.update({
                database_id: this.databaseId,
                properties: propertiesToCreate
            });
            console.log('Updated database properties:', Object.keys(propertiesToCreate));
        }
    } catch (error) {
        console.error('Failed to ensure database properties:', error);
        // Don't throw - continue with existing schema
    }
}
```

### Step 5: Testing with MCP Inspector (45 mins)

1. **Build the project**:
```bash
npm run build
```

2. **Start MCP Inspector**:
```bash
npm run inspect:cli
```

3. **Test the create-page-from-markdown tool**:

```bash
# Test 1: Simple page with category
--method tools/call --tool-name create-page-from-markdown \
  --tool-arg markdown="# Test Smart Category\n\nThis is a test page to verify smart category detection works." \
  --tool-arg metadata='{"category": "testing", "tags": ["smart-detection", "test"], "description": "Testing smart category detection"}'

# Test 2: Page with all metadata fields
--method tools/call --tool-name create-page-from-markdown \
  --tool-arg markdown="# Full Metadata Test\n\nTesting all metadata fields with smart detection." \
  --tool-arg metadata='{"category": "development", "tags": ["test", "metadata"], "description": "Full metadata test", "status": "draft"}'
```

4. **Verify in Notion**:
   - Check that pages were created successfully
   - Verify category was set correctly
   - Confirm no "multi_select" errors occurred

### Step 6: Add Debug Logging (15 mins)

**File**: `src/services/notion.ts`

Add helpful debug logging:

```typescript
// In setPropertyValue method
console.log(`Setting ${propertyName} as ${propertyType} with value:`, value);

// In createPageFromMarkdown after successful creation
console.log(`✅ Page created successfully with smart property detection`);
console.log(`   Property types detected:`, Array.from(this.propertyTypeCache.get(this.databaseId)?.entries() || []));
```

## Quality Gate Checklist

Before committing:

- [ ] `npm run build` passes with zero errors
- [ ] Tested with select Category database
- [ ] Tested with multi_select Category database  
- [ ] Tested with missing Category property
- [ ] No TypeScript errors
- [ ] Property type cache working correctly
- [ ] Retry logic functioning properly
- [ ] All existing tests still pass

## Commit Strategy

```bash
# Commit 1: Add property type detection
git add src/services/notion.ts
git commit -m "feat(notion): add property type detection helper with caching

- Add getPropertyType method to detect Notion property types
- Implement property type caching to reduce API calls
- Prepare for smart category handling"

# Commit 2: Add smart property setter
git add src/services/notion.ts
git commit -m "feat(notion): add smart property value setter

- Add setPropertyValue method for type-aware property setting
- Support select, multi_select, title, rich_text, and other types
- Handle both single values and arrays appropriately"

# Commit 3: Update page creation with smart detection
git add src/services/notion.ts
git commit -m "fix(notion): implement smart category detection in page creation

- Update createPageFromMarkdown to use smart property detection
- Add retry logic for property type mismatches
- Fix 'Category is expected to be multi_select' error
- Preserve backward compatibility"

# Commit 4: Update property creation logic
git add src/services/notion.ts
git commit -m "feat(notion): respect existing property types in database

- Update ensureDatabaseProperties to check existing types
- Don't override existing Category configuration
- Add helpful logging for missing properties"
```

## Troubleshooting

### Build Errors
- Check TypeScript version: `npx tsc --version`
- Ensure all imports are correct
- Verify method signatures match

### Runtime Errors
- Check environment variables are set
- Verify Notion API token has correct permissions
- Check database ID is correct

### Category Still Failing
- Clear the property type cache
- Check Notion database directly for property configuration
- Enable debug logging to see detected types

## Success Metrics

- ✅ No more "Category is expected to be multi_select" errors
- ✅ Pages create successfully with any Category type
- ✅ Backward compatibility maintained
- ✅ Performance impact minimal (< 100ms added)
- ✅ Clear logging for debugging

## Next Steps

After successful implementation:
1. Document the smart detection feature in CLAUDE.md
2. Proceed to Slice 2: List Categories Tool
3. Consider adding property type detection to other tools