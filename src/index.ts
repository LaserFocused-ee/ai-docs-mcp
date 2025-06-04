#!/usr/bin/env node

/**
 * AI-Docs MCP Server - Main Entry Point
 * 
 * This file creates and runs an MCP server for accessing documentation
 * and integrating with Guru API. It supports standard JSON-RPC MCP 
 * protocol over stdio.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SERVER_INFO, configureServer } from './server.js';

// Create the MCP server
const server = new McpServer({
  name: SERVER_INFO.name,
  version: SERVER_INFO.version,
  description: SERVER_INFO.description,
  capabilities: {
    tools: {},
    resources: {
      subscribe: true,
      listChanged: true
    }
  }
});

// Configure the server with tools and resources
configureServer(server);

// Main function to connect and start the server
async function main() {
  // Create and connect to the stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Only log minimal info to stderr to avoid cluttering logs
  console.error(`${SERVER_INFO.name} MCP Server v${SERVER_INFO.version} running on stdio`);
}

// Start the server and handle errors
main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});