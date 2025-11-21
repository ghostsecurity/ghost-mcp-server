# Ghost Security MCP Server

A Model Context Protocol (MCP) server for the Ghost Security API, providing secure access to security findings and repository data through standardized tools.

## Features

- **Security Findings Management**: Query, retrieve, and update security findings
- **Repository Analysis**: Access repository data and associated findings
- **Universal MCP Compatibility**: Works with any MCP-compatible client or application
- **Bundled CLI Chatbot**: Includes a simple chatbot for quick interaction
- **Comprehensive API Coverage**: Full support for Ghost Security API (V2) endpoints
- **Type Safety**: Complete TypeScript implementation with proper typing
- **Error Handling**: Robust error handling and validation

## Installation

### Quick Install for Claude Code CLI

**Option 1: Interactive Installer (Easiest)**

```bash
# Clone and build
git clone https://github.com/ghostsecurity/ghost-mcp-server
cd ghost-mcp-server
npm install && npm run build

# Run interactive installer (prompts for API key)
npm run install:interactive
```

**Option 2: Automated Setup Script**

```bash
# Clone and build
git clone https://github.com/ghostsecurity/ghost-mcp-server
cd ghost-mcp-server
npm install && npm run build

# Run setup script with your API key
./setup-claude-code.sh YOUR_API_KEY

# Optional: Scope to a specific repository
./setup-claude-code.sh YOUR_API_KEY YOUR_REPO_ID
```

**Option 3: Manual Setup**

```bash
# Clone and build
git clone https://github.com/ghostsecurity/ghost-mcp-server
cd ghost-mcp-server
npm install && npm run build

# Add to Claude Code
claude mcp add --transport stdio --scope user ghost-security -- node $(pwd)/dist/index.js

# Then edit ~/.claude.json and add under mcpServers.ghost-security.env:
# {
#   "GHOST_SECURITY_API_KEY": "your-api-key",
#   "GHOST_SECURITY_BASE_URL": "https://api.ghostsecurity.ai/v2"
# }
```

**Option 4: From npm (Coming Soon)**

Once published to npm, installation will be even simpler:

```bash
claude mcp add --transport stdio --scope user ghost-security -- npx ghostsecurity-mcp
```

Then add your API key to `~/.claude.json`:
```json
{
  "mcpServers": {
    "ghost-security": {
      "env": {
        "GHOST_SECURITY_API_KEY": "your-api-key-here",
        "GHOST_SECURITY_BASE_URL": "https://api.ghostsecurity.ai/v2"
      }
    }
  }
}
```

### Standard Installation (All MCP Clients)

1. Clone this repository:
```bash
git clone <repository-url>
cd ghost-mcp-server
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

## Usage

### Configuration

The server requires a Ghost Security API key to be provided at startup. You can provide it in two ways:

#### Option 1: Environment Variable (Recommended)
```bash
export GHOST_SECURITY_API_KEY="your-ghost-security-api-key"
export GHOST_SECURITY_BASE_URL="https://api.ghostsecurity.ai/v2"  # optional, defaults to v2
export GHOST_SECURITY_REPO_ID="your-repository-id"  # optional - scope to specific repo
```

#### Option 2: Command Line Argument
```bash
node dist/index.js "your-ghost-security-api-key" "your-repository-id"
```
Note: Repository ID is optional. If provided, all operations will be scoped to that repository.

### Running the Server

For development:
```bash
# Set environment variable first
export GHOST_SECURITY_API_KEY="your-api-key"
npm run dev
```

For production:
```bash
# Either with environment variable
export GHOST_SECURITY_API_KEY="your-api-key"
npm start

# Or with command line argument
npm run build
node dist/index.js "your-api-key"
```

### CLI Chatbot

This project includes a simple CLI chatbot powered by Anthropic's Claude API that can interact with the MCP server.

```bash
export ANTHROPIC_API_KEY="your-anthropic-api-key"
export GHOST_SECURITY_API_KEY="your-ghost-api-key"
npm run chat
```

### Adding to Any MCP Client

This server follows the standard MCP configuration format. Here are examples for different clients:

#### Standard MCP Configuration (Claude Desktop, ChatGPT, etc.)

```json
{
  "mcpServers": {
    "ghostsecurity": {
      "command": "node",
      "args": ["/path/to/ghost-mcp-server/dist/index.js"],
      "env": {
        "GHOST_SECURITY_API_KEY": "your-ghost-security-api-key",
        "GHOST_SECURITY_REPO_ID": "your-repository-id"
      }
    }
  }
}
```

#### Environment Variable Setup (Universal)
For any MCP client that supports environment variables:
```bash
export GHOST_SECURITY_API_KEY="your-ghost-security-api-key"
export GHOST_SECURITY_BASE_URL="https://api.ghostsecurity.ai/v2"
export GHOST_SECURITY_REPO_ID="your-repository-id"
```

### Repository Scoping

When a repository ID is configured via `GHOST_SECURITY_REPO_ID` environment variable or CLI argument:

- `ghostsecurity_get_findings` returns findings only for that repository
- `ghostsecurity_get_repositories` returns only the configured repository
- `ghostsecurity_get_repository_findings` uses the configured repository as default (repoId parameter becomes optional)

## Available Tools

### Security Findings

#### `ghostsecurity_get_findings`
Get security findings with optional filtering and pagination.

**Parameters:**
- `cursor` (string, optional): Pagination cursor
- `sort` (string, optional): Sort field (`created_at`, `updated_at`)
- `order` (string, optional): Sort order (`asc`, `desc`)
- `size` (number, optional): Page size (1-1000)
- `status` (string, optional): Filter by status
- `repo_id` (string, optional): Filter by repository ID
- `project_id` (string, optional): Filter by project ID

#### `ghostsecurity_get_finding`
Get a specific security finding by ID.

**Parameters:**
- `id` (string, required): Finding ID
- `repoId` (string, required): Repository ID associated with the finding
- `projectId` (string, required): Project ID associated with the finding

#### `ghostsecurity_update_finding_status`
Update the status of a security finding.

**Parameters:**
- `id` (string, required): Finding ID
- `repoId` (string, required): Repository ID associated with the finding
- `projectId` (string, required): Project ID associated with the finding
- `status` (string, required): New status for the finding

### Repositories

#### `ghostsecurity_get_repositories`
Get repositories with optional filtering and pagination.

**Parameters:**
- `cursor` (string, optional): Pagination cursor
- `sort` (string, optional): Sort field (`created_at`, `updated_at`, `last_committed_at`)
- `order` (string, optional): Sort order (`asc`, `desc`)
- `size` (number, optional): Page size (1-1000)

#### `ghostsecurity_get_repository`
Get a specific repository by ID.

**Parameters:**
- `id` (string, required): Repository ID

#### `ghostsecurity_get_repository_findings`
Get security findings for a specific repository.

**Parameters:**
- `repoId` (string, optional*): Repository ID (*required unless `GHOST_SECURITY_REPO_ID` is configured)
- `cursor` (string, optional): Pagination cursor
- `sort` (string, optional): Sort field (`created_at`, `updated_at`)
- `order` (string, optional): Sort order (`asc`, `desc`)
- `size` (number, optional): Page size (1-1000)

## Publishing to MCP Registry

This server is configured for publishing to the [MCP Registry](https://modelcontextprotocol.info/tools/registry/).

1.  **Install Publisher CLI**:
    ```bash
    brew install mcp-publisher
    ```

2.  **Login**:
    ```bash
    mcp-publisher login github
    ```

3.  **Publish**:
    ```bash
    mcp-publisher publish
    ```

The `server.json` file contains the necessary metadata. Ensure you have published the package to NPM before publishing to the registry.

## Development

### Scripts

- `npm run dev`: Run in development mode with hot reload
- `npm run build`: Build TypeScript to JavaScript
- `npm start`: Run the built server
- `npm run chat`: Run the CLI chatbot

### Project Structure

```
src/
├── index.ts          # Main MCP server implementation
├── ghost-client.ts   # Ghost Security API client (V2)
├── types.ts          # TypeScript type definitions
└── chatbot.ts        # CLI Chatbot implementation
```

## API Reference

This MCP server provides a complete interface to the Ghost Security API V2. For detailed API documentation, visit:
https://docs.ghostsecurity.ai/api-reference/introduction

## License

MIT
