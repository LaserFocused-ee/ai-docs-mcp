# Guru API Integration Guide

This document provides a comprehensive guide for integrating with the Guru API, focusing on authentication, card listing, and attachment retrieval.

## API Overview

- **Base URL**: `https://api.getguru.com/api/v1/`
- **Protocol**: REST with JSON data format
- **Authentication**: Basic Auth with User or Collection tokens

## Authentication

### Token Types

#### User Token (Read/Write Access)

- **Use Case**: Full API access including create, update, delete operations
- **Format**: `username:user_token`
- **Scope**: All team resources

#### Collection Token (Read-Only Access)

- **Use Case**: Read-only access to specific collections
- **Format**: `collection_id:collection_token`
- **Scope**: Limited to specific collection

### Authentication Testing

```bash
# Test User Token
curl -u USERNAME:USER_TOKEN https://api.getguru.com/api/v1/teams -D -

# Test Collection Token  
curl -u COLLECTION_ID:COLLECTION_TOKEN https://api.getguru.com/api/v1/teams -D -
```

### Expected Response

```json
{
  "status": "ACTIVE",
  "id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "dateCreated": "2016-01-01T00:00:00.000+0000",
  "name": "My Guru Team"
}
```

## Card Listing API

### Endpoint

```
GET https://api.getguru.com/api/v1/search/query
```

### Query Parameters

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `q` | string | Guru Query Language query string (URL encoded) | - |
| `searchTerms` | string | Search terms for card title/content | - |
| `showArchived` | boolean | Include archived cards (`true`/`false`) | `false` |
| `maxResults` | integer | Maximum results (max: 50) | - |
| `sortField` | string | Field to sort by (see sort fields) | `lastModified` |
| `sortOrder` | string | Sort order (`asc`/`desc`) | `desc` |

### Available Sort Fields

| Field | Description |
|-------|-------------|
| `lastModified` | Date card was last modified (default) |
| `lastModifiedBy` | User who last modified the card |
| `boardCount` | Number of folders containing the card |
| `verificationState` | Trust status (Trusted, NeedsVerification) |
| `copyCount` | Number of times card was copied |
| `viewCount` | Number of times card was viewed |
| `favoriteCount` | Number of times card was favorited |
| `dateCreated` | Date card was created |
| `verificationInterval` | Verification frequency in days |
| `verifier` | User/group responsible for verification |
| `owner` | User who created the card |
| `lastVerifiedBy` | User who last verified the card |
| `lastVerified` | Date card was last verified |
| `popularity` | Guru popularity metric |
| `title` | Card title |

### Example Requests

#### Basic Search

```bash
# Get 10 most recently modified cards
curl -u USERNAME:TOKEN "https://api.getguru.com/api/v1/search/query?maxResults=10"
```

#### Filtered Search

```bash
# Get cards modified in last 7 days
curl -u USERNAME:TOKEN "https://api.getguru.com/api/v1/search/query?q=lastModified%20%3C%207_days_ago&maxResults=10"
```

#### Search with Terms

```bash
# Search for cards containing "API documentation"
curl -u USERNAME:TOKEN "https://api.getguru.com/api/v1/search/query?searchTerms=API%20documentation&maxResults=20"
```

### Response Structure

```json
{
  "results": [
    {
      "id": "card-id-uuid",
      "title": "Card Title",
      "content": "HTML content of the card",
      "dateCreated": "2023-01-01T00:00:00.000+0000",
      "lastModified": "2023-01-02T00:00:00.000+0000",
      "verificationState": "TRUSTED",
      "collection": {
        "id": "collection-id-uuid",
        "name": "Collection Name",
        "slug": "collection-slug"
      },
      "owner": {
        "firstName": "John",
        "lastName": "Doe",
        "email": "[email protected]"
      }
    }
  ],
  "totalResults": 150,
  "hasMore": true
}
```

## Card Attachments API

### Overview

Retrieving card attachments is a two-step process:

1. Get the card content to find attachment URLs
2. Download attachments using the file API

### Step 1: Get Card Content

#### Endpoint

```
GET https://api.getguru.com/api/v1/cards/{cardId}
```

#### Example Request

```bash
curl -u USERNAME:TOKEN https://api.getguru.com/api/v1/cards/4405a9a7-7f79-4283-9253-dba673cd5623
```

#### Response (Relevant Fields)

```json
{
  "id": "4405a9a7-7f79-4283-9253-dba673cd5623",
  "title": "Card Title",
  "content": "<p>Text content</p><img src=\"https://content.api.getguru.com/files/view/dc360897-7e4c-4565-8c98-57bc6876edb9\" alt=\"Image.png\" />",
  "collection": {
    "id": "3c655cc6-e710-4bc6-81f6-e51278299a40",
    "name": "Collection Name"
  }
}
```

### Step 2: Extract and Download Attachments

#### Identifying Guru-Hosted Attachments

Look for URLs in the `content` field that start with:

```
https://content.api.getguru.com/files/view/
```

#### Download Attachment

```
GET https://content.api.getguru.com/files/view/{fileId}
```

#### Example Request

```bash
curl -u USERNAME:TOKEN https://content.api.getguru.com/files/view/dc360897-7e4c-4565-8c98-57bc6876edb9 --output attachment.png
```

## Integration Patterns

### Basic Card Retrieval Workflow

```javascript
// Pseudocode for common integration pattern
async function getCardsWithAttachments(searchQuery) {
  // 1. Search for cards
  const cards = await searchCards({
    q: searchQuery,
    maxResults: 50
  });
  
  // 2. For each card, get full content if needed
  const cardsWithContent = await Promise.all(
    cards.results.map(async (card) => {
      const fullCard = await getCard(card.id);
      return {
        ...card,
        attachments: extractAttachmentUrls(fullCard.content)
      };
    })
  );
  
  return cardsWithContent;
}

function extractAttachmentUrls(htmlContent) {
  // Extract URLs starting with https://content.api.getguru.com/files/view/
  const attachmentRegex = /https:\/\/content\.api\.getguru\.com\/files\/view\/[a-f0-9-]+/g;
  return htmlContent.match(attachmentRegex) || [];
}
```

### Error Handling

#### Common HTTP Status Codes

- **200**: Success
- **400**: Bad Request (invalid parameters)
- **401**: Unauthorized (invalid credentials)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found (card/resource doesn't exist)
- **429**: Rate Limited (too many requests)
- **500**: Internal Server Error

#### Rate Limiting

- Guru API implements rate limiting
- Include retry logic with exponential backoff
- Monitor response headers for rate limit information

### Best Practices

#### Authentication Security

- Store tokens securely (environment variables, key management)
- Use Collection tokens for read-only operations when possible
- Rotate tokens regularly

#### Query Optimization

- Use specific search queries to reduce result sets
- Implement pagination for large result sets
- Cache frequently accessed cards locally

#### Content Processing

- Parse HTML content carefully for attachment extraction
- Handle missing or corrupted attachments gracefully
- Validate attachment URLs before downloading

#### Performance

- Batch requests when possible
- Implement connection pooling for multiple requests
- Use streaming for large attachment downloads

## API Limitations

### Request Limits

- Maximum 50 results per search query
- Rate limiting applies (specific limits not documented)
- Collection tokens have read-only access

### Content Limitations

- Attachments must be Guru-hosted to use attachment API
- External URLs in content require separate handling
- HTML content parsing required for attachment extraction

## Troubleshooting

### Authentication Issues

- Verify token format matches token type (User vs Collection)
- Check token permissions and expiration
- Ensure proper URL encoding for special characters

### Search Issues

- URL encode query parameters properly
- Verify Guru Query Language syntax
- Check maximum result limits

### Attachment Issues

- Confirm attachment URLs start with `https://content.api.getguru.com/files/view/`
- Verify same authentication works for file downloads
- Handle file not found scenarios gracefully

## References

- [Guru API Overview](https://developer.getguru.com/docs/getting-started)
- [Listing Cards Documentation](https://developer.getguru.com/docs/listing-cards)
- [Card Attachments Guide](https://developer.getguru.com/docs/get-card-attachments)
