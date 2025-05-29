# Testing MCP Servers with MCP Inspector

This guide covers how to use the [MCP Inspector](https://github.com/modelcontextprotocol/inspector) to test, debug, and develop MCP servers effectively. The MCP Inspector is the official visual testing tool for MCP servers, providing both UI and CLI modes for comprehensive server testing.

## Overview

The MCP Inspector is a developer tool that provides:

- **Visual Interface**: Interactive testing with real-time response visualization
- **CLI Mode**: Programmatic testing for automation and scripting
- **Resource Explorer**: Browse and test resource templates and URIs
- **Tool Testing**: Form-based parameter input with JSON output
- **Debugging**: Request history, error visualization, and notifications
- **Configuration Export**: Generate Claude Desktop configuration files

## Installation

The MCP Inspector can be used directly via npx without installation:

```bash
# Run inspector with npx (recommended)
npx @modelcontextprotocol/inspector

# Or install globally
npm install -g @modelcontextprotocol/inspector
mcp-inspector
```

## Testing Our AI Documentation Server

### 1. Basic Server Testing

First, ensure your server is built:

```bash
# Build the TypeScript server
npm run build

# Test with MCP Inspector
npm run inspect
```

This will:

1. Build your TypeScript server to JavaScript
2. Launch the MCP Inspector
3. Automatically configure it to test your server

### 2. Manual Inspector Setup

If running the inspector manually:

```bash
# Start the inspector
npx @modelcontextprotocol/inspector

# In the UI, configure:
# Transport: stdio
# Command: node
# Args: dist/index.js
```

### 3. Testing Resources

Our server provides documentation resources via the pattern `docs://{category}/{name}`:

#### Resource Discovery

1. Click **"List Resources"** in the inspector
2. You should see all available documentation files
3. Each resource will have a URI like `docs://code_guidelines/flutter/best-practices`

#### Resource Access

1. Click on any resource URI from the list
2. Or manually enter a URI like `docs://service-docs/mcp-inspector-testing-guide`
3. View the markdown content in the response

#### Testing Resource Templates

```
# Test various documentation URIs:
docs://code_guidelines/flutter/architecture/best-practices
docs://service-docs/linear-sdk-documentation
docs://code_guidelines/git/workflow-guide
```

### 4. Testing Tools

Our server includes an example "hello" tool:

#### Using the Tool

1. Go to the **Tools** tab in the inspector
2. Select the `hello` tool
3. Optionally provide a `name` parameter
4. Click **"Call Tool"**
5. View the response with greeting and usage examples

### 5. CLI Mode Testing

The CLI mode is perfect for automated testing and integration with development workflows:

```bash
# List all available resources
npx @modelcontextprotocol/inspector --cli node dist/index.js --method resources/list

# Read a specific documentation resource
npx @modelcontextprotocol/inspector --cli node dist/index.js --method resources/read --uri "docs://service-docs/mcp-inspector-testing-guide"

# List available tools
npx @modelcontextprotocol/inspector --cli node dist/index.js --method tools/list

# Call the hello tool
npx @modelcontextprotocol/inspector --cli node dist/index.js --method tools/call --tool-name hello --tool-arg name="Developer"

# Test with configuration file
npx @modelcontextprotocol/inspector --cli --config mcp-config.json --server ai-docs
```

## Configuration Export

The MCP Inspector can generate configuration files for Claude Desktop:

### Server Entry Export

1. Configure your server in the inspector
2. Click **"Server Entry"** button
3. Paste the output into your existing `mcp.json` file:

```json
{
  "mcpServers": {
    "ai-docs": {
      "command": "node",
      "args": ["dist/index.js"],
      "env": {}
    }
  }
}
```

### Complete Configuration Export

1. Click **"Servers File"** button
2. Save the output as `mcp.json`:

```json
{
  "mcpServers": {
    "default-server": {
      "command": "node",
      "args": ["dist/index.js"],
      "env": {}
    }
  }
}
```

## Advanced Testing Scenarios

### 1. Error Testing

Test how your server handles invalid requests:

```bash
# Test invalid resource URI
npx @modelcontextprotocol/inspector --cli node dist/index.js --method resources/read --uri "docs://invalid/nonexistent"

# Test invalid tool parameters
npx @modelcontextprotocol/inspector --cli node dist/index.js --method tools/call --tool-name hello --tool-arg invalid="value"
```

### 2. Fuzzy Matching Testing

Our server includes fuzzy matching for resources:

```bash
# Test partial matches (should work with fuzzy matching)
npx @modelcontextprotocol/inspector --cli node dist/index.js --method resources/read --uri "docs://service/inspector"

# Test close matches
npx @modelcontextprotocol/inspector --cli node dist/index.js --method resources/read --uri "docs://code_guidelines/flutter/best"
```

### 3. Performance Testing

Test server performance with multiple requests:

```bash
# Script to test multiple resource requests
for uri in "docs://service-docs/mcp-inspector-testing-guide" "docs://code_guidelines/flutter/best-practices" "docs://service-docs/linear-sdk-documentation"; do
  echo "Testing: $uri"
  time npx @modelcontextprotocol/inspector --cli node dist/index.js --method resources/read --uri "$uri"
done
```

## Development Workflow Integration

### 1. Continuous Testing

Add inspector testing to your development workflow:

```bash
# Watch mode with automatic testing
npm run dev:watch &
npm run inspect:cli:test
```

### 2. Pre-commit Testing

Test your server before committing changes:

```bash
# Run comprehensive tests
npm run test:inspector
```

### 3. CI/CD Integration

Include inspector testing in your CI pipeline:

```bash
# In your CI script
npm run build
npm run inspect:cli:validate
```

## Debugging Common Issues

### 1. Server Won't Start

```bash
# Check if server starts correctly
node dist/index.js

# Should output: "AI-Docs MCP Server running on stdio"
# If not, check build output and dependencies
```

### 2. Resources Not Found

```bash
# Verify resource discovery
npx @modelcontextprotocol/inspector --cli node dist/index.js --method resources/list

# Check if docs directory exists and has markdown files
ls -la docs/
```

### 3. Tool Errors

```bash
# Test tool availability
npx @modelcontextprotocol/inspector --cli node dist/index.js --method tools/list

# Test tool with minimal parameters
npx @modelcontextprotocol/inspector --cli node dist/index.js --method tools/call --tool-name hello
```

## Inspector Configuration

### Custom Settings

The inspector supports various configuration options:

```bash
# Set custom timeouts
npx @modelcontextprotocol/inspector --cli node dist/index.js \
  --config-MCP_SERVER_REQUEST_TIMEOUT=15000 \
  --config-MCP_REQUEST_MAX_TOTAL_TIMEOUT=90000
```

### Configuration File

Create `mcp-inspector-config.json`:

```json
{
  "mcpServers": {
    "ai-docs": {
      "command": "node",
      "args": ["dist/index.js"],
      "env": {
        "DEBUG": "true"
      }
    },
    "ai-docs-dev": {
      "command": "npm",
      "args": ["run", "dev"],
      "env": {
        "NODE_ENV": "development"
      }
    }
  }
}
```

Use with:

```bash
npx @modelcontextprotocol/inspector --config mcp-inspector-config.json --server ai-docs
```

## Best Practices

### 1. Regular Testing

- Test after every significant change
- Use both UI and CLI modes
- Verify resource discovery and access
- Test error scenarios

### 2. Documentation Testing

- Ensure all documentation files are discoverable
- Test various URI patterns
- Verify fuzzy matching works correctly
- Check resource metadata accuracy

### 3. Performance Monitoring

- Monitor response times for resource access
- Test with large documentation sets
- Verify memory usage during discovery
- Check for resource leaks

### 4. Integration Testing

- Test with actual Claude Desktop configuration
- Verify exported configurations work
- Test in different environments
- Validate with multiple clients

## Troubleshooting

### Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "Server not found" | Build not completed | Run `npm run build` |
| "Resource not found" | Invalid URI or missing file | Check URI format and file existence |
| "Tool not available" | Tool not registered | Verify tool registration in server code |
| "Connection timeout" | Server startup issues | Check server logs and dependencies |

### Debug Mode

Enable debug output:

```bash
# Run server with debug output
DEBUG=* node dist/index.js

# Run inspector with verbose output
npx @modelcontextprotocol/inspector --cli node dist/index.js --verbose
```

## Resources

- [MCP Inspector Repository](https://github.com/modelcontextprotocol/inspector)
- [MCP Inspector Documentation](https://github.com/modelcontextprotocol/inspector#readme)
- [MCP Specification](https://spec.modelcontextprotocol.io/)
- [Claude Desktop MCP Configuration](https://docs.anthropic.com/claude/docs/mcp)

---

The MCP Inspector is an essential tool for MCP server development, providing both visual and programmatic interfaces for comprehensive testing. Use it regularly during development to ensure your server works correctly and provides a good experience for AI assistants.
