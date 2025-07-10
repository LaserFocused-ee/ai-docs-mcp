#!/bin/bash
echo "Testing current search behavior..."
npx @modelcontextprotocol/inspector --cli node -r dotenv/config dist/index.js dotenv_config_path=.env.inspector --method tools/call --tool-name list-database-pages --tool-arg search="api"