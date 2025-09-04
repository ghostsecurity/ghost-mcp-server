# Ghost Security MCP Server

A Model Context Protocol (MCP) server for the Ghost Security API, providing secure access to security findings and repository data through standardized tools.

## Features

- **Security Findings Management**: Query, retrieve, and update security findings
- **Repository Analysis**: Access repository data, endpoints, and associated findings
- **Universal MCP Compatibility**: Works with any MCP-compatible client or application
- **Comprehensive API Coverage**: Full support for Ghost Security API endpoints
- **Type Safety**: Complete TypeScript implementation with proper typing
- **Error Handling**: Robust error handling and validation

## Installation

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
export GHOST_SECURITY_BASE_URL="https://api.ghostsecurity.ai/v1"  # optional
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
export GHOST_SECURITY_BASE_URL="https://api.ghostsecurity.ai/v1"  # optional
export GHOST_SECURITY_REPO_ID="your-repository-id"  # optional
```

#### Command Line Usage (Direct)
```bash
# With environment variables set
node dist/index.js

# Or with command line arguments
node dist/index.js "your-api-key" "optional-repo-id"
```

### Repository Scoping

When a repository ID is configured via `GHOST_SECURITY_REPO_ID` environment variable or CLI argument:

- `ghostsecurity_get_findings` returns findings only for that repository
- `ghostsecurity_get_repositories` returns only the configured repository
- `ghostsecurity_get_repository_endpoints` and `ghostsecurity_get_repository_findings` use the configured repository as default (repoId parameter becomes optional)

This is useful when you want to focus on a specific repository and avoid accidentally accessing data from other repositories.

## Available Tools

### Security Findings

#### `ghostsecurity_get_findings`
Get security findings with optional filtering and pagination.

**Parameters:**
- `cursor` (string, optional): Pagination cursor
- `sort` (string, optional): Sort field (`created_at`, `updated_at`)
- `order` (string, optional): Sort order (`asc`, `desc`)
- `size` (number, optional): Page size (1-1000)

#### `ghostsecurity_get_finding`
Get a specific security finding by ID.

**Parameters:**
- `id` (string, required): Finding ID

#### `ghostsecurity_update_finding_status`
Update the status of a security finding.

**Parameters:**
- `id` (string, required): Finding ID
- `status` (string, required): New status for the finding

### Repositories

#### `ghostsecurity_get_repositories`
Get repositories with optional filtering and pagination.

**Parameters:**
- `cast` (string, optional): Filter by scanning support (`supported`, `unsupported`, `all`)
- `cursor` (string, optional): Pagination cursor
- `sort` (string, optional): Sort field (`created_at`, `updated_at`, `last_committed_at`)
- `order` (string, optional): Sort order (`asc`, `desc`)
- `size` (number, optional): Page size (1-1000)

#### `ghostsecurity_get_repository`
Get a specific repository by ID.

**Parameters:**
- `id` (string, required): Repository ID

#### `ghostsecurity_get_repository_endpoints`
Get endpoints for a specific repository.

**Parameters:**
- `repoId` (string, optional*): Repository ID (*required unless `GHOST_SECURITY_REPO_ID` is configured)
- `cursor` (string, optional): Pagination cursor
- `size` (number, optional): Page size (1-1000)

#### `ghostsecurity_get_repository_findings`
Get security findings for a specific repository.

**Parameters:**
- `repoId` (string, optional*): Repository ID (*required unless `GHOST_SECURITY_REPO_ID` is configured)
- `cursor` (string, optional): Pagination cursor
- `sort` (string, optional): Sort field (`created_at`, `updated_at`)
- `order` (string, optional): Sort order (`asc`, `desc`)
- `size` (number, optional): Page size (1-1000)

## Development

### Scripts

- `npm run dev`: Run in development mode with hot reload
- `npm run build`: Build TypeScript to JavaScript
- `npm start`: Run the built server

### Project Structure

```
src/
├── index.ts          # Main MCP server implementation
├── ghost-client.ts   # Ghost Security API client
└── types.ts          # TypeScript type definitions
```

## API Reference

This MCP server provides a complete interface to the Ghost Security API. For detailed API documentation, visit:
https://docs.ghostsecurity.ai/api-reference/introduction

## Authentication

You'll need a Ghost Security API key to use this server. API keys can be created in your Ghost Security platform settings and are scoped to your organization.

**Security Note**: Keep your API keys secure and never share them publicly. The server handles authentication via Bearer tokens automatically once configured.

## Error Handling

The server includes comprehensive error handling:

- **Configuration Errors**: Clear messages when API credentials are missing or invalid
- **API Errors**: Proper propagation of Ghost Security API error responses
- **Validation Errors**: Input validation for all tool parameters
- **Network Errors**: Graceful handling of network and connectivity issues

## License

MIT
