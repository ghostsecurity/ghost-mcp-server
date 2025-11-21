#!/usr/bin/env node

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import Anthropic from '@anthropic-ai/sdk';
import readline from 'readline';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  // 1. Check API Keys
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
  const ghostApiKey = process.env.GHOST_SECURITY_API_KEY;

  if (!anthropicApiKey) {
    console.error('Error: ANTHROPIC_API_KEY environment variable is required.');
    process.exit(1);
  }

  if (!ghostApiKey) {
    console.error('Error: GHOST_SECURITY_API_KEY environment variable is required.');
    process.exit(1);
  }

  // 2. Start MCP Server
  console.log('Starting Ghost Security MCP Server...');
  
  // Determine path to server script
  // If running tsx src/chatbot.ts, we want src/index.ts
  // If running node dist/chatbot.js, we want dist/index.js
  const isTs = __filename.endsWith('.ts');
  const serverScript = isTs 
    ? path.join(__dirname, 'index.ts')
    : path.join(__dirname, 'index.js');
  
  const command = isTs ? 'npx' : 'node';
  const args = isTs ? ['tsx', serverScript] : [serverScript];

  // Pass the Ghost API key to the server process env
  const transport = new StdioClientTransport({
    command: command,
    args: args,
    env: {
      ...process.env,
      GHOST_SECURITY_API_KEY: ghostApiKey,
    }
  });

  const client = new Client(
    {
      name: 'ghost-chatbot',
      version: '1.0.0',
    },
    {
      capabilities: {},
    }
  );

  await client.connect(transport);
  console.log('Connected to MCP Server.');

  // 3. List Tools
  const { tools } = await client.listTools();
  console.log(`Found ${tools.length} tools.`);

  // 4. Initialize Anthropic
  const anthropic = new Anthropic({
    apiKey: anthropicApiKey,
  });

  // 5. Chat Loop
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const messages: Anthropic.Beta.Messages.BetaMessageParam[] = [];

  console.log('\n--- Ghost Security Chatbot ---');
  console.log('Ask questions about your security findings or repositories.');
  console.log('Type "exit" or "quit" to stop.\n');

  const askQuestion = () => {
    rl.question('> ', async (userInput) => {
      if (userInput.toLowerCase() === 'exit' || userInput.toLowerCase() === 'quit') {
        rl.close();
        await client.close();
        process.exit(0);
      }

      messages.push({ role: 'user', content: userInput });

      try {
        // Call Claude with tools
        let response = await anthropic.beta.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 4096,
          messages: messages,
          tools: tools.map(tool => ({
            name: tool.name,
            description: tool.description,
            input_schema: tool.inputSchema as Anthropic.Beta.Messages.BetaTool.InputSchema,
          })),
        });

        // Handle tool calls loop
        while (response.stop_reason === 'tool_use') {
          const toolCalls = response.content.filter(block => block.type === 'tool_use');
          
          // Append assistant response with tool calls to history
          messages.push({ role: 'assistant', content: response.content });

          // Execute tools
          const toolResults = await Promise.all(toolCalls.map(async (toolCall) => {
            console.log(`Executing tool: ${toolCall.name}...`);
            try {
              const result = await client.callTool({
                name: toolCall.name,
                arguments: toolCall.input as any,
              });
              
              return {
                type: 'tool_result',
                tool_use_id: toolCall.id,
                content: JSON.stringify(result.content),
              } as Anthropic.Beta.Messages.BetaToolResultBlockParam;
            } catch (error) {
              console.error(`Error executing tool ${toolCall.name}:`, error);
              return {
                type: 'tool_result',
                tool_use_id: toolCall.id,
                content: `Error: ${error instanceof Error ? error.message : String(error)}`,
                is_error: true,
              } as Anthropic.Beta.Messages.BetaToolResultBlockParam;
            }
          }));

          // Add tool results to messages
          messages.push({ role: 'user', content: toolResults });

          // Get follow-up response from Claude
          response = await anthropic.beta.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 4096,
            messages: messages,
            tools: tools.map(tool => ({
              name: tool.name,
              description: tool.description,
              input_schema: tool.inputSchema as Anthropic.Beta.Messages.BetaTool.InputSchema,
            })),
          });
        }

        // Final response
        const textContent = response.content.find(block => block.type === 'text');
        if (textContent && textContent.type === 'text') {
          console.log('\nClaude:', textContent.text, '\n');
          messages.push({ role: 'assistant', content: response.content });
        }

      } catch (error) {
        console.error('Error calling Claude:', error);
      }

      askQuestion();
    });
  };

  askQuestion();
}

main().catch(console.error);
