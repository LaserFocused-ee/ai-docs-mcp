# Notion API Formatting Reference

Comprehensive reference for blocks and rich text formatting in the Notion API.

## Overview

This document provides detailed information about Notion's block types and rich text formatting options available through the API.

## Block Types Reference

### Text Blocks

#### Paragraph

Basic text content with rich text support.

```javascript
{
  "type": "paragraph",
  "paragraph": {
    "rich_text": [
      {
        "type": "text",
        "text": {
          "content": "This is a paragraph with some text.",
          "link": null
        },
        "annotations": {
          "bold": false,
          "italic": false,
          "strikethrough": false,
          "underline": false,
          "code": false,
          "color": "default"
        }
      }
    ]
  }
}
```

#### Headings

Three levels of headings available.

```javascript
// Heading 1
{
  "type": "heading_1",
  "heading_1": {
    "rich_text": [
      {
        "type": "text",
        "text": {
          "content": "Main Title"
        }
      }
    ]
  }
}

// Heading 2
{
  "type": "heading_2", 
  "heading_2": {
    "rich_text": [
      {
        "type": "text",
        "text": {
          "content": "Subtitle"
        }
      }
    ]
  }
}

// Heading 3
{
  "type": "heading_3",
  "heading_3": {
    "rich_text": [
      {
        "type": "text", 
        "text": {
          "content": "Sub-subtitle"
        }
      }
    ]
  }
}
```

### List Blocks

#### Bulleted List

Unordered list items.

```javascript
{
  "type": "bulleted_list_item",
  "bulleted_list_item": {
    "rich_text": [
      {
        "type": "text",
        "text": {
          "content": "First bullet point"
        }
      }
    ],
    "children": [
      // Optional nested items
      {
        "type": "bulleted_list_item",
        "bulleted_list_item": {
          "rich_text": [
            {
              "type": "text",
              "text": {
                "content": "Nested bullet point"
              }
            }
          ]
        }
      }
    ]
  }
}
```

#### Numbered List

Ordered list items.

```javascript
{
  "type": "numbered_list_item",
  "numbered_list_item": {
    "rich_text": [
      {
        "type": "text",
        "text": {
          "content": "First numbered item"
        }
      }
    ],
    "children": [
      // Optional nested items
    ]
  }
}
```

#### To-Do List

Checkbox list items.

```javascript
{
  "type": "to_do",
  "to_do": {
    "rich_text": [
      {
        "type": "text",
        "text": {
          "content": "Task to complete"
        }
      }
    ],
    "checked": false,
    "children": [
      // Optional nested items
    ]
  }
}
```

### Code Blocks

#### Inline Code

Use rich text annotations for inline code.

```javascript
{
  "type": "paragraph",
  "paragraph": {
    "rich_text": [
      {
        "type": "text",
        "text": {
          "content": "Use the "
        }
      },
      {
        "type": "text",
        "text": {
          "content": "console.log()"
        },
        "annotations": {
          "code": true
        }
      },
      {
        "type": "text", 
        "text": {
          "content": " function for debugging."
        }
      }
    ]
  }
}
```

#### Code Block

Multi-line code with language syntax highlighting.

```javascript
{
  "type": "code",
  "code": {
    "rich_text": [
      {
        "type": "text",
        "text": {
          "content": "function hello() {\n  console.log('Hello, world!');\n}"
        }
      }
    ],
    "language": "javascript"
  }
}
```

**Supported Languages:**

- `javascript`, `typescript`, `python`, `java`, `c`, `cpp`, `csharp`, `php`, `ruby`, `go`, `rust`, `kotlin`, `swift`, `sql`, `html`, `css`, `json`, `xml`, `markdown`, `bash`, `shell`, `powershell`, `yaml`, `toml`, `dockerfile`, `makefile`, `gitignore`

### Quote Block

```javascript
{
  "type": "quote",
  "quote": {
    "rich_text": [
      {
        "type": "text",
        "text": {
          "content": "This is a quote block."
        }
      }
    ],
    "children": [
      // Optional nested content
    ]
  }
}
```

### Callout Block

```javascript
{
  "type": "callout",
  "callout": {
    "rich_text": [
      {
        "type": "text",
        "text": {
          "content": "This is a callout with an icon."
        }
      }
    ],
    "icon": {
      "type": "emoji",
      "emoji": "💡"
    },
    "children": [
      // Optional nested content  
    ]
  }
}
```

### Toggle Block

```javascript
{
  "type": "toggle",
  "toggle": {
    "rich_text": [
      {
        "type": "text",
        "text": {
          "content": "Click to toggle"
        }
      }
    ],
    "children": [
      {
        "type": "paragraph",
        "paragraph": {
          "rich_text": [
            {
              "type": "text",
              "text": {
                "content": "Hidden content inside toggle"
              }
            }
          ]
        }
      }
    ]
  }
}
```

### Divider

```javascript
{
  "type": "divider",
  "divider": {}
}
```

### Table Blocks

#### Table

```javascript
{
  "type": "table",
  "table": {
    "table_width": 3,
    "has_column_header": true,
    "has_row_header": false,
    "children": [
      {
        "type": "table_row",
        "table_row": {
          "cells": [
            [
              {
                "type": "text",
                "text": {
                  "content": "Header 1"
                }
              }
            ],
            [
              {
                "type": "text", 
                "text": {
                  "content": "Header 2"
                }
              }
            ],
            [
              {
                "type": "text",
                "text": {
                  "content": "Header 3"
                }
              }
            ]
          ]
        }
      },
      {
        "type": "table_row",
        "table_row": {
          "cells": [
            [
              {
                "type": "text",
                "text": {
                  "content": "Cell 1"
                }
              }
            ],
            [
              {
                "type": "text",
                "text": {
                  "content": "Cell 2"
                }
              }
            ],
            [
              {
                "type": "text",
                "text": {
                  "content": "Cell 3"
                }
              }
            ]
          ]
        }
      }
    ]
  }
}
```

### Media Blocks

#### Image

```javascript
{
  "type": "image",
  "image": {
    "type": "external",
    "external": {
      "url": "https://example.com/image.jpg"
    },
    "caption": [
      {
        "type": "text",
        "text": {
          "content": "Image caption"
        }
      }
    ]
  }
}
```

#### Video

```javascript
{
  "type": "video",
  "video": {
    "type": "external",
    "external": {
      "url": "https://www.youtube.com/watch?v=VIDEO_ID"
    },
    "caption": [
      {
        "type": "text",
        "text": {
          "content": "Video caption"
        }
      }
    ]
  }
}
```

#### File

```javascript
{
  "type": "file",
  "file": {
    "type": "external",
    "external": {
      "url": "https://example.com/document.pdf"
    },
    "caption": [
      {
        "type": "text",
        "text": {
          "content": "File description"
        }
      }
    ]
  }
}
```

### Embed Block

```javascript
{
  "type": "embed",
  "embed": {
    "url": "https://www.figma.com/embed?embed_host=notion&url=FIGMA_URL",
    "caption": [
      {
        "type": "text",
        "text": {
          "content": "Embedded content"
        }
      }
    ]
  }
}
```

### Bookmark Block

```javascript
{
  "type": "bookmark",
  "bookmark": {
    "url": "https://www.notion.so",
    "caption": [
      {
        "type": "text",
        "text": {
          "content": "Bookmark description"
        }
      }
    ]
  }
}
```

## Rich Text Reference

Rich text objects contain content with styling and formatting. Every rich text object has a `type` and type-specific properties.

### Text Rich Text

```javascript
{
  "type": "text",
  "text": {
    "content": "Sample text content",
    "link": {
      "url": "https://example.com"
    }
  },
  "annotations": {
    "bold": true,
    "italic": false,
    "strikethrough": false,
    "underline": false,
    "code": false,
    "color": "red"
  },
  "plain_text": "Sample text content",
  "href": "https://example.com"
}
```

### Mention Rich Text

#### User Mention

```javascript
{
  "type": "mention",
  "mention": {
    "type": "user",
    "user": {
      "id": "user-id-here"
    }
  },
  "annotations": {
    "bold": false,
    "italic": false,
    "strikethrough": false,
    "underline": false,
    "code": false,
    "color": "default"
  },
  "plain_text": "@Username",
  "href": null
}
```

#### Page Mention

```javascript
{
  "type": "mention",
  "mention": {
    "type": "page",
    "page": {
      "id": "page-id-here"
    }
  },
  "annotations": {
    "bold": false,
    "italic": false,
    "strikethrough": false,
    "underline": false,
    "code": false,
    "color": "default"
  },
  "plain_text": "Page Title",
  "href": "https://notion.so/page-url"
}
```

#### Database Mention

```javascript
{
  "type": "mention",
  "mention": {
    "type": "database",
    "database": {
      "id": "database-id-here"
    }
  },
  "annotations": {
    "bold": false,
    "italic": false,
    "strikethrough": false,
    "underline": false,
    "code": false,
    "color": "default"
  },
  "plain_text": "Database Name",
  "href": "https://notion.so/database-url"
}
```

#### Date Mention

```javascript
{
  "type": "mention",
  "mention": {
    "type": "date",
    "date": {
      "start": "2023-12-25",
      "end": null
    }
  },
  "annotations": {
    "bold": false,
    "italic": false,
    "strikethrough": false,
    "underline": false,
    "code": false,
    "color": "default"
  },
  "plain_text": "December 25, 2023",
  "href": null
}
```

### Equation Rich Text

```javascript
{
  "type": "equation",
  "equation": {
    "expression": "E = mc^2"
  },
  "annotations": {
    "bold": false,
    "italic": false,
    "strikethrough": false,
    "underline": false,
    "code": false,
    "color": "default"
  },
  "plain_text": "E = mc^2",
  "href": null
}
```

## Annotations Reference

Rich text can be styled using annotations:

### Text Formatting

```javascript
"annotations": {
  "bold": true,          // Bold text
  "italic": true,        // Italic text
  "strikethrough": true, // Strikethrough text
  "underline": true,     // Underlined text
  "code": true           // Monospace code font
}
```

### Colors

Available color options:

```javascript
"annotations": {
  "color": "default"     // Default text color
}

// Text colors:
"color": "gray"
"color": "brown" 
"color": "orange"
"color": "yellow"
"color": "green"
"color": "blue"
"color": "purple"
"color": "pink"
"color": "red"

// Background colors:
"color": "gray_background"
"color": "brown_background"
"color": "orange_background"
"color": "yellow_background"
"color": "green_background"
"color": "blue_background"
"color": "purple_background"
"color": "pink_background"
"color": "red_background"
```

## Advanced Formatting Examples

### Mixed Rich Text

Combining multiple formatting styles in one block:

```javascript
{
  "type": "paragraph",
  "paragraph": {
    "rich_text": [
      {
        "type": "text",
        "text": { "content": "This text has " },
        "annotations": { "bold": false, "color": "default" }
      },
      {
        "type": "text", 
        "text": { "content": "bold" },
        "annotations": { "bold": true, "color": "default" }
      },
      {
        "type": "text",
        "text": { "content": " and " },
        "annotations": { "bold": false, "color": "default" }
      },
      {
        "type": "text",
        "text": { "content": "italic" },
        "annotations": { "italic": true, "color": "default" }
      },
      {
        "type": "text",
        "text": { "content": " formatting, plus a " },
        "annotations": { "bold": false, "color": "default" }
      },
      {
        "type": "text",
        "text": { 
          "content": "link",
          "link": { "url": "https://notion.so" }
        },
        "annotations": { "color": "blue" }
      },
      {
        "type": "text",
        "text": { "content": "." },
        "annotations": { "color": "default" }
      }
    ]
  }
}
```

### Nested Content Structure

Example of deeply nested content:

```javascript
{
  "type": "toggle",
  "toggle": {
    "rich_text": [
      {
        "type": "text",
        "text": { "content": "Project Details" },
        "annotations": { "bold": true, "color": "blue" }
      }
    ],
    "children": [
      {
        "type": "paragraph",
        "paragraph": {
          "rich_text": [
            {
              "type": "text",
              "text": { "content": "This project includes:" }
            }
          ]
        }
      },
      {
        "type": "bulleted_list_item",
        "bulleted_list_item": {
          "rich_text": [
            { "type": "text", "text": { "content": "Frontend (React)" } }
          ],
          "children": [
            {
              "type": "bulleted_list_item",
              "bulleted_list_item": {
                "rich_text": [
                  { "type": "text", "text": { "content": "Component library" } }
                ]
              }
            }
          ]
        }
      },
      {
        "type": "code",
        "code": {
          "rich_text": [
            {
              "type": "text",
              "text": { "content": "const server = express();\nserver.listen(3000);" }
            }
          ],
          "language": "javascript"
        }
      }
    ]
  }
}
```

## Helper Functions

### Building Rich Text Arrays

Utility function for creating rich text:

```javascript
function createRichText(content, annotations = {}, link = null) {
  return {
    type: "text",
    text: {
      content: content,
      link: link
    },
    annotations: {
      bold: false,
      italic: false,
      strikethrough: false,
      underline: false,
      code: false,
      color: "default",
      ...annotations
    },
    plain_text: content,
    href: link?.url || null
  };
}

// Usage examples:
const boldText = createRichText("Bold text", { bold: true });
const linkText = createRichText("Click here", { color: "blue" }, { url: "https://example.com" });
const codeText = createRichText("console.log()", { code: true });
```

### Building Block Arrays

Utility function for creating common blocks:

```javascript
function createParagraph(richTextArray) {
  return {
    type: "paragraph",
    paragraph: {
      rich_text: richTextArray
    }
  };
}

function createHeading(content, level = 1) {
  const headingType = `heading_${level}`;
  return {
    type: headingType,
    [headingType]: {
      rich_text: [createRichText(content)]
    }
  };
}

function createCodeBlock(code, language = "javascript") {
  return {
    type: "code",
    code: {
      rich_text: [createRichText(code)],
      language: language
    }
  };
}

// Usage:
const blocks = [
  createHeading("Getting Started", 1),
  createParagraph([
    createRichText("Welcome to our "),
    createRichText("API documentation", { bold: true }),
    createRichText("!")
  ]),
  createCodeBlock("npm install @notionhq/client", "bash")
];
```

## Validation & Best Practices

### Content Limits

- **Rich text content**: Maximum 2000 characters per rich text object
- **Rich text arrays**: Maximum 100 rich text objects per array
- **Block children**: Maximum 100 blocks per request
- **Nested depth**: Maximum 2 levels of nesting for list items

### Performance Tips

- **Batch operations**: Create multiple blocks in a single request when possible
- **Minimize nesting**: Deep nesting can impact performance
- **Optimize rich text**: Combine adjacent text with same formatting
- **Cache mentions**: Store user/page IDs to avoid repeated lookups

### Error Handling

Common formatting errors to watch for:

```javascript
// Invalid: Empty rich text array
{
  "type": "paragraph",
  "paragraph": {
    "rich_text": [] // ❌ Must have at least one element
  }
}

// Invalid: Missing required fields
{
  "type": "text",
  "text": {
    // ❌ Missing "content" field
  }
}

// Invalid: Unsupported color
{
  "annotations": {
    "color": "custom_color" // ❌ Must use predefined colors
  }
}
```

## Resources

- [Notion API Block Reference](https://developers.notion.com/reference/block)
- [Rich Text Object Reference](https://developers.notion.com/reference/rich-text)
- [Working with Page Content Guide](https://developers.notion.com/docs/working-with-page-content)
- [Notion Limits & Guidelines](https://developers.notion.com/reference/request-limits)
