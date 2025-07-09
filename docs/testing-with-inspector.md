# Testing with MCP Inspector

## Environment Setup

The MCP Inspector npm scripts are configured to automatically load environment variables from a `.env.inspector` file. This allows you to test the MCP server without exposing sensitive tokens or modifying production code.

### Setup Steps

1. **Create your environment file**:
   ```bash
   cp .env.inspector.example .env.inspector
   ```

2. **Edit `.env.inspector`** and add your tokens:
   ```bash
   # Notion Configuration
   NOTION_TOKEN=your-notion-integration-token-here
   NOTION_MCP_DATABASE_ID=your-notion-database-id-here
   
   # Guru Configuration (optional)
   GURU_TOKEN=your-guru-username:your-guru-token
   ```

3. **Run MCP Inspector**:
   ```bash
   npm run inspect:cli
   ```

The npm scripts use Node's `-r dotenv/config` flag with `dotenv_config_path=.env.inspector` to load the environment variables only during testing.

## Testing Notion Tools

Once you have your `.env.inspector` configured, you can test the Notion tools:

### Test Page Creation with Smart Category Detection
```bash
# Simple test with category
npm run inspect:cli -- --method tools/call --tool-name create-page-from-markdown \
  --tool-arg markdown="# Test Page\n\nTesting smart category detection" \
  --tool-arg metadata='{"category": "testing", "tags": ["test"]}'

# Test with all metadata fields
npm run inspect:cli -- --method tools/call --tool-name create-page-from-markdown \
  --tool-arg markdown="# Full Test\n\nTesting all fields" \
  --tool-arg metadata='{"category": "development", "tags": ["test", "demo"], "description": "Test page", "status": "draft"}'
```

### List Database Pages
```bash
npm run inspect:cli -- --method tools/call --tool-name list-database-pages \
  --tool-arg limit=5
```

## Security Notes

- The `.env.inspector` file is gitignored and will not be committed
- These environment variables are only loaded during MCP Inspector sessions
- Production usage should use proper environment variable management