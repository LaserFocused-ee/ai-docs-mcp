# Claude Code SDK Documentation

## Overview

The Claude Code SDK allows developers to programmatically integrate Claude Code into their applications. It enables running Claude Code as a subprocess, providing a way to build AI-powered coding assistants and tools that leverage Claude's capabilities.

The SDK currently supports command line usage. TypeScript and Python SDKs are coming soon.

## Model Selection

### Recommended Models

For most use cases, we recommend using the latest models:

- **Claude 3.5 Haiku** (`claude-3-5-haiku-20241022`) - Our fastest model, ideal for:
  - Real-time applications
  - Code completions
  - Interactive chatbots
  - Cost-effective operations
  - Pricing: $0.80/MTok input, $4/MTok output

- **Claude 3.5 Sonnet** (`claude-3-5-sonnet-20241022`) - High-performance model for:
  - Complex coding tasks
  - Advanced reasoning
  - Production applications
  - Pricing: $3/MTok input, $15/MTok output

### Model Aliases vs Specific Versions

While aliases like `claude-3-5-haiku-latest` are convenient for development, **always use specific model versions in production** to ensure consistent behavior:

```bash
# Development (using alias)
claude -p "Generate code" --model claude-3-5-haiku-latest

# Production (using specific version)
claude -p "Generate code" --model claude-3-5-haiku-20241022
```

## Basic SDK Usage

The Claude Code SDK allows you to use Claude Code in non-interactive mode from your applications.

### Simple Commands

```bash
# Run a single prompt and exit (print mode)
claude -p "Write a function to calculate Fibonacci numbers"

# Using a pipe to provide stdin
echo "Explain this code" | claude -p

# Output in JSON format with metadata
claude -p "Generate a hello world function" --output-format json

# Stream JSON output as it arrives
claude -p "Build a React component" --output-format stream-json
```

### Specifying Models

```bash
# Use specific Haiku model for fast responses
claude -p "Quick code review" --model claude-3-5-haiku-20241022

# Use Sonnet for complex tasks
claude -p "Design system architecture" --model claude-3-5-sonnet-20241022
```

## Advanced Usage

### Multi-turn Conversations

For multi-turn conversations, you can resume conversations or continue from the most recent session:

```bash
# Continue the most recent conversation
claude --continue

# Continue and provide a new prompt
claude --continue "Now refactor this for better performance"

# Resume a specific conversation by session ID
claude --resume 550e8400-e29b-41d4-a716-446655440000

# Resume in print mode (non-interactive)
claude -p --resume 550e8400-e29b-41d4-a716-446655440000 "Update the tests"

# Continue in print mode (non-interactive)
claude -p --continue "Add error handling"
```

### Custom System Prompts

You can provide custom system prompts to guide Claude's behavior:

```bash
# Override system prompt (only works with --print)
claude -p "Build a REST API" --system-prompt "You are a senior backend engineer. Focus on security, performance, and maintainability."

# System prompt with specific requirements
claude -p "Create a database schema" --system-prompt "You are a database architect. Use PostgreSQL best practices and include proper indexing."
```

You can also append instructions to the default system prompt:

```bash
# Append system prompt (only works with --print)
claude -p "Build a REST API" --append-system-prompt "After writing code, be sure to code review yourself."
```

### MCP Configuration

The Model Context Protocol (MCP) allows you to extend Claude Code with additional tools and resources from external servers.

Create a JSON configuration file with your MCP servers:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/path/to/allowed/files"
      ]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "your-github-token"
      }
    }
  }
}
```

Then use it with Claude Code:

```bash
# Load MCP servers from configuration
claude -p "List all files in the project" --mcp-config mcp-servers.json

# Important: MCP tools must be explicitly allowed using --allowedTools
# MCP tools follow the format: mcp__$serverName__$toolName
claude -p "Search for TODO comments" \
  --mcp-config mcp-servers.json \
  --allowedTools "mcp__filesystem__read_file,mcp__filesystem__list_directory"

# Use an MCP tool for handling permission prompts in non-interactive mode
claude -p "Deploy the application" \
  --mcp-config mcp-servers.json \
  --allowedTools "mcp__permissions__approve" \
  --permission-prompt-tool mcp__permissions__approve
```

**Note:** When using MCP tools, you must explicitly allow them using the `--allowedTools` flag. MCP tool names follow the pattern `mcp__<serverName>__<toolName>`.

## Available CLI Options

| Flag | Description | Example |
|------|-------------|---------|
| `--print`, `-p` | Run in non-interactive mode | `claude -p "query"` |
| `--model` | Specify which Claude model to use | `claude -p "query" --model claude-3-5-haiku-20241022` |
| `--output-format` | Specify output format (text, json, stream-json) | `claude -p --output-format json` |
| `--resume`, `-r` | Resume a conversation by session ID | `claude --resume abc123` |
| `--continue`, `-c` | Continue the most recent conversation | `claude --continue` |
| `--verbose` | Enable verbose logging | `claude --verbose` |
| `--max-turns` | Limit agentic turns in non-interactive mode | `claude --max-turns 3` |
| `--system-prompt` | Override system prompt (only with --print) | `claude --system-prompt "Custom instruction"` |
| `--append-system-prompt` | Append to system prompt (only with --print) | `claude --append-system-prompt "Custom instruction"` |
| `--allowedTools` | Comma/space-separated list of allowed tools | `claude --allowedTools "Bash(npm install),mcp__filesystem__*"` |
| `--disallowedTools` | Comma/space-separated list of denied tools | `claude --disallowedTools "Bash(git commit),mcp__github__*"` |
| `--mcp-config` | Load MCP servers from a JSON file | `claude --mcp-config servers.json` |
| `--permission-prompt-tool` | MCP tool for handling permission prompts | `claude --permission-prompt-tool mcp__auth__prompt` |

## Output Formats

### Text Output (default)

Returns just the response text:

```bash
claude -p "Explain file src/components/Header.tsx"
# Output: This is a React component showing...
```

### JSON Output

Returns structured data including metadata:

```bash
claude -p "How does the data layer work?" --output-format json
```

Response format:

```json
{
  "type": "result",
  "subtype": "success",
  "cost_usd": 0.003,
  "is_error": false,
  "duration_ms": 1234,
  "duration_api_ms": 800,
  "num_turns": 6,
  "result": "The response text here...",
  "session_id": "abc123"
}
```

### Streaming JSON Output

Streams each message as it is received:

```bash
claude -p "Build an application" --output-format stream-json
```

Each conversation begins with an initial init system message, followed by a list of user and assistant messages, followed by a final result system message with stats.

## Message Schema

Messages returned from the JSON API are strictly typed according to the following schema:

```typescript
type Message =
  // An assistant message
  | {
      type: "assistant";
      message: APIAssistantMessage; // from Anthropic SDK
      session_id: string;
    }

  // A user message
  | {
      type: "user";
      message: APIUserMessage; // from Anthropic SDK
      session_id: string;
    }

  // Emitted as the last message
  | {
      type: "result";
      subtype: "success";
      cost_usd: float;
      duration_ms: float;
      duration_api_ms: float;
      is_error: boolean;
      num_turns: int;
      result: string;
      session_id: string;
    }

  // Emitted as the last message, when we've reached the maximum number of turns
  | {
      type: "result";
      subtype: "error_max_turns";
      cost_usd: float;
      duration_ms: float;
      duration_api_ms: float;
      is_error: boolean;
      num_turns: int;
      session_id: string;
    }

  // Emitted as the first message at the start of a conversation
  | {
      type: "system";
      subtype: "init";
      session_id: string;
      tools: string[];
      mcp_servers: {
        name: string;
        status: string;
      }[];
    };
```

## Examples

### Simple Script Integration

```bash
#!/bin/bash

# Simple function to run Claude and check exit code
run_claude() {
    local prompt="$1"
    local output_format="${2:-text}"
    local model="${3:-claude-3-5-haiku-20241022}"

    if claude -p "$prompt" --output-format "$output_format" --model "$model"; then
        echo "Success!"
    else
        echo "Error: Claude failed with exit code $?" >&2
        return 1
    fi
}

# Usage examples
run_claude "Write a Python function to read CSV files"
run_claude "Optimize this database query" "json" "claude-3-5-sonnet-20241022"
```

### Processing Files with Claude

```bash
# Process a file through Claude
cat mycode.py | claude -p "Review this code for bugs" --model claude-3-5-haiku-20241022

# Process multiple files
for file in *.js; do
    echo "Processing $file..."
    claude -p "Add JSDoc comments to this file:" --model claude-3-5-haiku-20241022 < "$file" > "${file}.documented"
done

# Use Claude in a pipeline
grep -l "TODO" *.py | while read file; do
    claude -p "Fix all TODO items in this file" --model claude-3-5-sonnet-20241022 < "$file"
done
```

### Session Management

```bash
# Start a session and capture the session ID
claude -p "Initialize a new project" --output-format json --model claude-3-5-sonnet-20241022 | jq -r '.session_id' > session.txt

# Continue with the same session
claude -p --resume "$(cat session.txt)" "Add unit tests" --model claude-3-5-sonnet-20241022
```

### Model Selection Examples

```bash
# Use Haiku for quick tasks
claude -p "Generate a simple utility function" --model claude-3-5-haiku-20241022

# Use Sonnet for complex architecture decisions
claude -p "Design a microservices architecture for e-commerce" --model claude-3-5-sonnet-20241022

# Cost optimization: Use Haiku for initial draft, Sonnet for refinement
claude -p "Create a basic API endpoint" --model claude-3-5-haiku-20241022 > draft.py
claude -p "Optimize and add error handling to this code:" --model claude-3-5-sonnet-20241022 < draft.py
```

## Best Practices

### Model Selection Strategy

1. **Use Claude 3.5 Haiku** for:
   - Quick code reviews
   - Simple code generation
   - Real-time interactions
   - Cost-sensitive operations
   - High-volume requests

2. **Use Claude 3.5 Sonnet** for:
   - Complex system design
   - Advanced debugging
   - Production-critical code
   - Detailed analysis
   - Multi-step reasoning

### Development Best Practices

1. **Use JSON output format for programmatic parsing:**

   ```bash
   # Parse JSON response with jq
   result=$(claude -p "Generate code" --output-format json --model claude-3-5-haiku-20241022)
   code=$(echo "$result" | jq -r '.result')
   cost=$(echo "$result" | jq -r '.cost_usd')
   ```

2. **Handle errors gracefully - check exit codes and stderr:**

   ```bash
   if ! claude -p "$prompt" --model claude-3-5-haiku-20241022 2>error.log; then
       echo "Error occurred:" >&2
       cat error.log >&2
       exit 1
   fi
   ```

3. **Use session management for maintaining context in multi-turn conversations**

4. **Consider timeouts for long-running operations:**

   ```bash
   timeout 300 claude -p "$complex_prompt" --model claude-3-5-sonnet-20241022 || echo "Timed out after 5 minutes"
   ```

5. **Respect rate limits when making multiple requests by adding delays between calls**

6. **Always specify model versions in production environments**

### Cost Optimization

1. **Start with Haiku for initial iterations, upgrade to Sonnet when needed**
2. **Use prompt caching for repeated contexts**
3. **Monitor costs using JSON output format**
4. **Batch similar requests when possible**

## Real-world Applications

The Claude Code SDK enables powerful integrations with your development workflow. Notable examples include:

- **Automated code review systems**
- **AI-powered development assistants**
- **Documentation generation**
- **Code refactoring tools**
- **GitHub Actions integration** for automated PR reviews and issue triage

## Related Resources

- [CLI usage and controls](https://docs.anthropic.com/claude/docs/claude-code-cli-usage) - Complete CLI documentation
- [GitHub Actions integration](https://docs.anthropic.com/claude/docs/claude-code-github-actions) - Automate your GitHub workflow with Claude
- [Model Context Protocol (MCP)](https://docs.anthropic.com/claude/docs/mcp) - Extend Claude with custom tools
- [Anthropic API Documentation](https://docs.anthropic.com/) - Full API reference

## Troubleshooting

### Common Issues

1. **Model not found errors**: Ensure you're using the correct model name and version
2. **Rate limiting**: Implement exponential backoff for retries
3. **Timeout issues**: Use streaming for long responses or increase timeout values
4. **MCP tool permissions**: Always explicitly allow MCP tools with `--allowedTools`

### Getting Help

- Check the [Claude Code documentation](https://docs.anthropic.com/claude/docs/claude-code)
- Join the [Anthropic Discord community](https://discord.gg/anthropic)
- Contact support through the [Anthropic Console](https://console.anthropic.com/)
