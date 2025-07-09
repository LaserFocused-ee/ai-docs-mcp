# Demo Script for Update Page Metadata Tool

## Duration: ~2 minutes

### 1. Show current page state (20 seconds)

```bash
npm run inspect:cli
method tools/call --tool-name list-database-pages --tool-arg limit=1
```

Note the current tags, category, and status of the test page.

### 2. Update just the tags (30 seconds)

```bash
method tools/call --tool-name update-page-metadata \
  --tool-arg pageId="22b06f52-e1c0-81ab-ac8d-d30cdc3f7795" \
  --tool-arg tags='["demo", "metadata-only", "fast-update"]'
```

**Point out**: "Notice how we can update just the tags without touching content. This is safer than full page updates."

### 3. Show the updated page (20 seconds)

```bash
method tools/call --tool-name list-database-pages \
  --tool-arg tags='["demo"]'
```

**Highlight**: "Tags are updated instantly, but we didn't risk modifying any page content."

### 4. Update multiple metadata fields (30 seconds)

```bash
method tools/call --tool-name update-page-metadata \
  --tool-arg pageId="22b06f52-e1c0-81ab-ac8d-d30cdc3f7795" \
  --tool-arg status="published" \
  --tool-arg description="Demonstrated metadata-only updates"
```

**Emphasize**: "Multiple fields updated in one call, still no content risk. This is much faster than the full update-page tool."

### 5. Verify in Notion (20 seconds)

- Open Notion and navigate to the test page
- Show that metadata is updated but content blocks are untouched
- Mention the performance benefit for bulk metadata operations

## Key Benefits to Highlight:

- **Safety**: No risk of accidentally modifying page content
- **Speed**: Faster than full page updates
- **Precision**: Update only what you need
- **Bulk Operations**: Perfect for updating tags/status across many pages

## Note about Category field:

Currently, the Category field update may fail if the database uses multi_select instead of select. This is a known issue that will be fixed in the next iteration with smart property detection.
