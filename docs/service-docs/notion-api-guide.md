# Notion API Guide

Comprehensive guide for working with the Notion API, covering pages, databases, and content management.

## Overview

The Notion API allows you to build integrations that interact with Notion workspaces. This guide covers the essential concepts and practical examples for working with pages, databases, and content.

## Core Concepts

### Page Content vs Properties

- **Page Properties**: Structured information like due dates, categories, or relationships. Best for capturing data and building systems.
- **Page Content**: Free-form content where users compose thoughts or tell stories. Represented as blocks.

### Authentication

All API requests require authentication using a Bearer token:

```bash
curl -H 'Authorization: Bearer YOUR_NOTION_API_KEY' \
     -H "Notion-Version: 2022-06-28"
```

## Working with Pages

### Creating a Page

Pages can be created within another page or within a database:

```javascript
const { Client } = require('@notionhq/client');
const notion = new Client({ auth: process.env.NOTION_API_KEY });

const response = await notion.pages.create({
  parent: {
    type: "page_id",
    page_id: "494c87d0-72c4-4cf6-960f-55f8427f7692"
  },
  properties: {
    title: {
      type: "title",
      title: [{ 
        type: "text", 
        text: { content: "A note from your pals at Notion" } 
      }]
    }
  },
  children: [
    {
      object: "block",
      type: "paragraph",
      paragraph: {
        text: [
          {
            type: "text",
            text: {
              content: "You made this page using the Notion API. Pretty cool, huh?"
            }
          }
        ]
      }
    }
  ]
});
```

### Reading Page Content

Retrieve blocks from a page using the block children endpoint:

```javascript
const response = await notion.blocks.children.list({
  block_id: "16d8004e-5f6a-42a6-9811-51c22ddada12",
  page_size: 100
});

console.log(response.results); // Array of block objects
```

### Appending Content to Pages

Add new blocks to existing pages:

```javascript
const response = await notion.blocks.children.append({
  block_id: "16d8004e-5f6a-42a6-9811-51c22ddada12",
  children: [
    {
      object: "block",
      type: "paragraph",
      paragraph: {
        text: [
          {
            type: "text",
            text: {
              content: "– Notion API Team",
              link: {
                type: "url",
                url: "https://twitter.com/NotionAPI"
              }
            }
          }
        ]
      }
    }
  ],
  after: "optional-block-id-to-append-after" // Optional positioning
});
```

## Working with Databases

### Database Structure

Databases contain pages with structured properties. Each database has a schema defining the available properties.

### Creating Database Pages

When creating pages in a database, properties must conform to the database schema:

```javascript
const response = await notion.pages.create({
  parent: {
    type: "database_id", 
    database_id: "your-database-id"
  },
  properties: {
    "Task Name": {
      type: "title",
      title: [{ type: "text", text: { content: "New Task" } }]
    },
    "Status": {
      type: "select", 
      select: { name: "In Progress" }
    },
    "Due Date": {
      type: "date",
      date: { start: "2023-12-25" }
    },
    "Priority": {
      type: "number",
      number: 5
    }
  }
});
```

### Querying Databases

Retrieve and filter database entries:

```javascript
const response = await notion.databases.query({
  database_id: "your-database-id",
  filter: {
    and: [
      {
        property: "Status",
        select: {
          equals: "In Progress"
        }
      },
      {
        property: "Due Date", 
        date: {
          before: "2023-12-31"
        }
      }
    ]
  },
  sorts: [
    {
      property: "Due Date",
      direction: "ascending"
    }
  ]
});
```

### Database Property Types

Common database property types and their usage:

```javascript
// Title Property
"Title": {
  type: "title",
  title: [{ type: "text", text: { content: "Page Title" } }]
}

// Rich Text Property  
"Description": {
  type: "rich_text",
  rich_text: [{ type: "text", text: { content: "Description text" } }]
}

// Number Property
"Price": {
  type: "number", 
  number: 29.99
}

// Select Property
"Status": {
  type: "select",
  select: { name: "Active" }
}

// Multi-select Property
"Tags": {
  type: "multi_select",
  multi_select: [
    { name: "urgent" },
    { name: "bug" }
  ]
}

// Date Property
"Due Date": {
  type: "date",
  date: { 
    start: "2023-12-25",
    end: "2023-12-26"  // Optional for date ranges
  }
}

// Checkbox Property
"Completed": {
  type: "checkbox",
  checkbox: true
}

// URL Property
"Website": {
  type: "url",
  url: "https://example.com"
}

// Email Property
"Contact": {
  type: "email", 
  email: "contact@example.com"
}

// Phone Property
"Phone": {
  type: "phone_number",
  phone_number: "+1-555-123-4567"
}

// Relation Property (links to other database pages)
"Related Tasks": {
  type: "relation",
  relation: [
    { id: "related-page-id-1" },
    { id: "related-page-id-2" }
  ]
}
```

## Block Structure

All page content is represented as blocks. Common block patterns:

### Basic Blocks

```javascript
// Paragraph
{
  type: "paragraph",
  paragraph: {
    text: [{ type: "text", text: { content: "Paragraph text" } }]
  }
}

// Heading 1
{
  type: "heading_1", 
  heading_1: {
    text: [{ type: "text", text: { content: "Main Heading" } }]
  }
}

// Heading 2
{
  type: "heading_2",
  heading_2: {
    text: [{ type: "text", text: { content: "Subheading" } }]
  }
}

// Bulleted List Item
{
  type: "bulleted_list_item",
  bulleted_list_item: {
    text: [{ type: "text", text: { content: "List item" } }]
  }
}

// To-do Item
{
  type: "to_do",
  to_do: {
    text: [{ type: "text", text: { content: "Task to complete" } }],
    checked: false
  }
}

// Code Block
{
  type: "code",
  code: {
    text: [{ type: "text", text: { content: "console.log('Hello');" } }],
    language: "javascript"
  }
}
```

### Nested Blocks

Some blocks can contain children:

```javascript
{
  type: "toggle",
  toggle: {
    text: [{ type: "text", text: { content: "Click to expand" } }],
    children: [
      {
        type: "paragraph", 
        paragraph: {
          text: [{ type: "text", text: { content: "Hidden content" } }]
        }
      }
    ]
  }
}
```

## Error Handling

Always include proper error handling:

```javascript
try {
  const response = await notion.pages.create({...});
  console.log('Success:', response);
} catch (error) {
  console.error('Error:', error.body);
  
  // Common error types:
  // - 401: Invalid authentication
  // - 403: Insufficient permissions  
  // - 404: Page/database not found
  // - 400: Invalid request format
}
```

## Best Practices

### Permissions

- Always ensure your integration has proper access to pages/databases
- Users must explicitly share pages with your integration
- Test permissions thoroughly in development

### Rate Limiting

- Respect rate limits (current limit: 3 requests per second)
- Implement exponential backoff for retries
- Use bulk operations when possible

### Pagination

- API responses are paginated (max 100 items per request)
- Use `start_cursor` for subsequent requests
- Handle pagination for complete data retrieval:

```javascript
let hasMore = true;
let startCursor = undefined;
const allResults = [];

while (hasMore) {
  const response = await notion.databases.query({
    database_id: "your-database-id",
    start_cursor: startCursor,
    page_size: 100
  });
  
  allResults.push(...response.results);
  hasMore = response.has_more;
  startCursor = response.next_cursor;
}
```

### Recursive Block Reading

For complete page content with nested blocks:

```javascript
async function getAllBlocks(blockId) {
  const blocks = [];
  let hasMore = true;
  let startCursor = undefined;

  while (hasMore) {
    const response = await notion.blocks.children.list({
      block_id: blockId,
      start_cursor: startCursor
    });

    for (const block of response.results) {
      blocks.push(block);
      
      // Recursively get children if they exist
      if (block.has_children) {
        const children = await getAllBlocks(block.id);
        block.children = children;
      }
    }

    hasMore = response.has_more;
    startCursor = response.next_cursor;
  }

  return blocks;
}
```

## Useful Utilities

### Finding Page IDs

Page IDs can be extracted from Notion URLs:

- URL: `https://notion.so/Page-Title-1429989fe8ac4effbc8f57f56486db54`
- Page ID: `1429989f-e8ac-4eff-bc8f-57f56486db54` (format with hyphens)

### Search API

Find pages and databases across the workspace:

```javascript
const response = await notion.search({
  query: "search term",
  filter: {
    value: "page", // or "database"
    property: "object"
  },
  sort: {
    direction: "descending",
    timestamp: "last_edited_time"
  }
});
```

## Common Use Cases

### Syncing External Data

```javascript
// Create database entries from external API
const externalData = await fetchFromExternalAPI();

for (const item of externalData) {
  await notion.pages.create({
    parent: { database_id: "your-database-id" },
    properties: {
      "Name": {
        type: "title",
        title: [{ type: "text", text: { content: item.name } }]
      },
      "Status": {
        type: "select", 
        select: { name: item.status }
      }
    }
  });
}
```

### Content Migration

```javascript
// Read content from one page and copy to another
const sourceBlocks = await notion.blocks.children.list({
  block_id: "source-page-id"
});

await notion.blocks.children.append({
  block_id: "target-page-id",
  children: sourceBlocks.results
});
```

### Dynamic Page Generation

```javascript
// Generate pages with dynamic content
const template = {
  parent: { page_id: "parent-page-id" },
  properties: {
    title: {
      type: "title", 
      title: [{ type: "text", text: { content: `Report - ${new Date().toISOString().split('T')[0]}` } }]
    }
  },
  children: [
    {
      type: "heading_1",
      heading_1: {
        text: [{ type: "text", text: { content: "Daily Report" } }]
      }
    },
    {
      type: "paragraph",
      paragraph: {
        text: [{ type: "text", text: { content: `Generated on ${new Date().toDateString()}` } }]
      }
    }
  ]
};

const newPage = await notion.pages.create(template);
```

## Resources

- [Official Notion API Documentation](https://developers.notion.com/)
- [Notion SDK for JavaScript](https://github.com/makenotion/notion-sdk-js)
- [API Reference](https://developers.notion.com/reference/intro)
- [Community Examples](https://developers.notion.com/docs/examples)
