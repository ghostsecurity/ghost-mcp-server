#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ErrorCode,
} from '@modelcontextprotocol/sdk/types.js';
import { GhostSecurityClient } from './ghost-client.js';
import { GhostSecurityConfig } from './types.js';

class GhostSecurityMCPServer {
  private server: Server;
  private client: GhostSecurityClient;
  private repositoryId?: string;

  constructor() {
    // Get API key from environment variable or command line argument
    const apiKey = process.env.GHOST_SECURITY_API_KEY || process.argv[2];
    const baseUrl = process.env.GHOST_SECURITY_BASE_URL;
    
    // Get repository ID from environment variable or second CLI argument
    this.repositoryId = process.env.GHOST_SECURITY_REPO_ID || process.argv[3];

    if (!apiKey) {
      console.error('Error: Ghost Security API key is required.');
      console.error('Provide it via:');
      console.error('  Environment variable: GHOST_SECURITY_API_KEY=your-key');
      console.error('  Command line argument: node dist/index.js your-key [repo-id]');
      process.exit(1);
    }

    // Initialize the Ghost Security client
    const config: GhostSecurityConfig = {
      apiKey,
      baseUrl,
    };
    this.client = new GhostSecurityClient(config);


    this.server = new Server(
      {
        name: 'ghostsecurity-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private formatResponse(data: any): string {
    // For count responses, always format nicely (they're small)
    if (data && typeof data === 'object' && 'total_count' in data) {
      return JSON.stringify(data, null, 2);
    }
    
    // For paginated responses with items array
    if (data && typeof data === 'object' && 'items' in data && Array.isArray(data.items)) {
      const itemCount = data.items.length;
      
      // If we have a reasonable number of items, format nicely
      if (itemCount <= 20) {
        return JSON.stringify(data, null, 2);
      }
      
      // For larger responses, truncate and provide summary
      const truncatedItems = data.items.slice(0, 15);
      const truncatedResponse = {
        ...data,
        items: truncatedItems,
        _truncated: true,
        _original_count: itemCount,
        _message: `Response truncated to show ${truncatedItems.length} of ${itemCount} items to prevent token limit issues. Use pagination parameters (size, cursor) or 'count' mode for full statistics.`
      };
      
      return JSON.stringify(truncatedResponse, null, 2);
    }
    
    // For other responses, format nicely 
    return JSON.stringify(data, null, 2);
  }

  private setupToolHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'ghostsecurity_get_findings',
            description: 'Get security findings with optional filtering and pagination',
            inputSchema: {
              type: 'object',
              properties: {
                cursor: {
                  type: 'string',
                  description: 'Pagination cursor',
                },
                sort: {
                  type: 'string',
                  enum: ['created_at', 'updated_at'],
                  description: 'Sort field',
                },
                order: {
                  type: 'string',
                  enum: ['asc', 'desc'],
                  description: 'Sort order',
                },
                size: {
                  type: 'number',
                  minimum: 1,
                  maximum: 1000,
                  description: 'Page size (1-1000)',
                },
                mode: {
                  type: 'string',
                  enum: ['summary', 'detailed', 'count'],
                  description: 'Response mode: summary (lightweight), detailed (full), or count (statistics only)',
                },
                fields: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Specific fields to include in response (works with summary mode)',
                },
              },
            },
          },
          {
            name: 'ghostsecurity_count_findings',
            description: 'Get count and statistics of security findings',
            inputSchema: {
              type: 'object',
              properties: {
                sort: {
                  type: 'string',
                  enum: ['created_at', 'updated_at'],
                  description: 'Sort field',
                },
                order: {
                  type: 'string',
                  enum: ['asc', 'desc'],
                  description: 'Sort order',
                },
              },
            },
          },
          {
            name: 'ghostsecurity_get_finding',
            description: 'Get a specific security finding by ID',
            inputSchema: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  description: 'Finding ID',
                },
              },
              required: ['id'],
            },
          },
          {
            name: 'ghostsecurity_update_finding_status',
            description: 'Update the status of a security finding',
            inputSchema: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  description: 'Finding ID',
                },
                status: {
                  type: 'string',
                  description: 'New status for the finding',
                },
              },
              required: ['id', 'status'],
            },
          },
          {
            name: 'ghostsecurity_get_repositories',
            description: 'Get repositories with optional filtering and pagination',
            inputSchema: {
              type: 'object',
              properties: {
                cast: {
                  type: 'string',
                  enum: ['supported', 'unsupported', 'all'],
                  description: 'Filter by scanning support',
                },
                cursor: {
                  type: 'string',
                  description: 'Pagination cursor',
                },
                sort: {
                  type: 'string',
                  enum: ['created_at', 'updated_at', 'last_committed_at'],
                  description: 'Sort field',
                },
                order: {
                  type: 'string',
                  enum: ['asc', 'desc'],
                  description: 'Sort order',
                },
                size: {
                  type: 'number',
                  minimum: 1,
                  maximum: 1000,
                  description: 'Page size (1-1000)',
                },
              },
            },
          },
          {
            name: 'ghostsecurity_get_repository',
            description: 'Get a specific repository by ID',
            inputSchema: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  description: 'Repository ID',
                },
              },
              required: ['id'],
            },
          },
          {
            name: 'ghostsecurity_get_repository_endpoints',
            description: 'Get endpoints for a specific repository',
            inputSchema: {
              type: 'object',
              properties: {
                repoId: {
                  type: 'string',
                  description: this.repositoryId ? 'Repository ID (optional, uses configured repo if not provided)' : 'Repository ID',
                },
                cursor: {
                  type: 'string',
                  description: 'Pagination cursor',
                },
                size: {
                  type: 'number',
                  minimum: 1,
                  maximum: 1000,
                  description: 'Page size (1-1000)',
                },
              },
              required: this.repositoryId ? [] : ['repoId'],
            },
          },
          {
            name: 'ghostsecurity_get_repository_findings',
            description: 'Get security findings for a specific repository',
            inputSchema: {
              type: 'object',
              properties: {
                repoId: {
                  type: 'string',
                  description: this.repositoryId ? 'Repository ID (optional, uses configured repo if not provided)' : 'Repository ID',
                },
                cursor: {
                  type: 'string',
                  description: 'Pagination cursor',
                },
                sort: {
                  type: 'string',
                  enum: ['created_at', 'updated_at'],
                  description: 'Sort field',
                },
                order: {
                  type: 'string',
                  enum: ['asc', 'desc'],
                  description: 'Sort order',
                },
                size: {
                  type: 'number',
                  minimum: 1,
                  maximum: 1000,
                  description: 'Page size (1-1000)',
                },
                mode: {
                  type: 'string',
                  enum: ['summary', 'detailed', 'count'],
                  description: 'Response mode: summary (lightweight), detailed (full), or count (statistics only)',
                },
                fields: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Specific fields to include in response (works with summary mode)',
                },
              },
              required: this.repositoryId ? [] : ['repoId'],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'ghostsecurity_get_findings':
            return await this.handleGetFindings(args as any);

          case 'ghostsecurity_count_findings':
            return await this.handleCountFindings(args as any);

          case 'ghostsecurity_get_finding':
            return await this.handleGetFinding(args as { id: string });

          case 'ghostsecurity_update_finding_status':
            return await this.handleUpdateFindingStatus(args as { id: string; status: string });

          case 'ghostsecurity_get_repositories':
            return await this.handleGetRepositories(args as any);

          case 'ghostsecurity_get_repository':
            return await this.handleGetRepository(args as { id: string });

          case 'ghostsecurity_get_repository_endpoints':
            return await this.handleGetRepositoryEndpoints(args as any);

          case 'ghostsecurity_get_repository_findings':
            return await this.handleGetRepositoryFindings(args as any);


          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    });
  }

  private async handleGetFindings(args: any) {
    // If repository ID is configured, get findings for that repository
    if (this.repositoryId) {
      const result = await this.client.getRepositoryFindings(this.repositoryId, args);
      return {
        content: [
          {
            type: 'text',
            text: this.formatResponse(result),
          },
        ],
      };
    }
    
    // Otherwise get all findings
    const result = await this.client.getFindings(args);

    return {
      content: [
        {
          type: 'text',
          text: this.formatResponse(result),
        },
      ],
    };
  }

  private async handleCountFindings(args: any) {
    // If repository ID is configured, get count for that repository
    if (this.repositoryId) {
      const result = await this.client.getRepositoryFindings(this.repositoryId, { ...args, mode: 'count' });
      return {
        content: [
          {
            type: 'text',
            text: this.formatResponse(result),
          },
        ],
      };
    }
    
    // Otherwise get count for all findings
    const result = await this.client.getCountFindings(args);

    return {
      content: [
        {
          type: 'text',
          text: this.formatResponse(result),
        },
      ],
    };
  }

  private async handleGetFinding(args: { id: string }) {
    const result = await this.client.getFinding(args.id);

    return {
      content: [
        {
          type: 'text',
          text: this.formatResponse(result),
        },
      ],
    };
  }

  private async handleUpdateFindingStatus(args: { id: string; status: string }) {
    const result = await this.client.updateFindingStatus(args.id, { user_status: args.status });

    return {
      content: [
        {
          type: 'text',
          text: this.formatResponse(result),
        },
      ],
    };
  }

  private async handleGetRepositories(args: any) {
    // If repository ID is configured, return just that repository
    if (this.repositoryId) {
      const result = await this.client.getRepository(this.repositoryId);
      return {
        content: [
          {
            type: 'text',
            text: this.formatResponse({ items: [result], has_more: false }),
          },
        ],
      };
    }
    
    // Otherwise get all repositories
    const result = await this.client.getRepositories(args);

    return {
      content: [
        {
          type: 'text',
          text: this.formatResponse(result),
        },
      ],
    };
  }

  private async handleGetRepository(args: { id: string }) {
    const result = await this.client.getRepository(args.id);

    return {
      content: [
        {
          type: 'text',
          text: this.formatResponse(result),
        },
      ],
    };
  }

  private async handleGetRepositoryEndpoints(args: any) {
    // Use configured repository ID if available, otherwise use provided repoId
    const repoId = this.repositoryId || args.repoId;
    
    if (!repoId) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        'Repository ID is required. Provide repoId parameter or configure GHOST_SECURITY_REPO_ID.'
      );
    }
    
    const { repoId: _, ...params } = args;
    const result = await this.client.getRepositoryEndpoints(repoId, params);

    return {
      content: [
        {
          type: 'text',
          text: this.formatResponse(result),
        },
      ],
    };
  }

  private async handleGetRepositoryFindings(args: any) {
    // Use configured repository ID if available, otherwise use provided repoId
    const repoId = this.repositoryId || args.repoId;
    
    if (!repoId) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        'Repository ID is required. Provide repoId parameter or configure GHOST_SECURITY_REPO_ID.'
      );
    }
    
    const { repoId: _, ...params } = args;
    const result = await this.client.getRepositoryFindings(repoId, params);

    return {
      content: [
        {
          type: 'text',
          text: this.formatResponse(result),
        },
      ],
    };
  }


  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Ghost Security MCP server running on stdio');
  }
}

const server = new GhostSecurityMCPServer();
server.run().catch(console.error);