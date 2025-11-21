#!/bin/bash

# Setup script for Ghost Security MCP Server in Claude Code
# Usage: ./setup-claude-code.sh YOUR_API_KEY [REPO_ID]

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if API key is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: API key is required${NC}"
    echo "Usage: ./setup-claude-code.sh YOUR_API_KEY [REPO_ID]"
    echo ""
    echo "Example:"
    echo "  ./setup-claude-code.sh gk-xxxxxxxx"
    echo "  ./setup-claude-code.sh gk-xxxxxxxx GIPL0nL0i_g"
    exit 1
fi

API_KEY=$1
REPO_ID=$2
CONFIG_FILE="$HOME/.claude.json"
SERVER_PATH="$(pwd)/dist/index.js"

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}Warning: jq is not installed. Installing via Homebrew...${NC}"
    if command -v brew &> /dev/null; then
        brew install jq
    else
        echo -e "${RED}Error: Homebrew not found. Please install jq manually: brew install jq${NC}"
        exit 1
    fi
fi

# Check if dist/index.js exists
if [ ! -f "$SERVER_PATH" ]; then
    echo -e "${YELLOW}Building project first...${NC}"
    npm run build
fi

echo -e "${GREEN}Setting up Ghost Security MCP Server for Claude Code...${NC}"

# Add to Claude Code using CLI
echo "Adding MCP server to Claude Code..."
claude mcp add --transport stdio --scope user ghost-security -- node "$SERVER_PATH"

# Update the config with environment variables
echo "Configuring environment variables..."

# Build the env object
if [ -z "$REPO_ID" ]; then
    ENV_JSON='{
      "GHOST_SECURITY_API_KEY": "'$API_KEY'",
      "GHOST_SECURITY_BASE_URL": "https://api.ghostsecurity.ai/v2"
    }'
else
    ENV_JSON='{
      "GHOST_SECURITY_API_KEY": "'$API_KEY'",
      "GHOST_SECURITY_BASE_URL": "https://api.ghostsecurity.ai/v2",
      "GHOST_SECURITY_REPO_ID": "'$REPO_ID'"
    }'
fi

# Update using jq
jq '.mcpServers["ghost-security"].env = '"$ENV_JSON" "$CONFIG_FILE" > "$CONFIG_FILE.tmp" && mv "$CONFIG_FILE.tmp" "$CONFIG_FILE"

echo ""
echo -e "${GREEN}✓ Ghost Security MCP server configured successfully!${NC}"
echo ""
echo "Configuration saved to: $CONFIG_FILE"
echo "Server path: $SERVER_PATH"
echo ""
echo "Verify installation with:"
echo "  claude mcp list"
echo ""
echo "The server will be available in your next Claude Code session."
