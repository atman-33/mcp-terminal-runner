#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

// Input schema for the echo tool
const EchoToolInputSchema = z.object({
  message: z.string(),
});

// Create the MCP server
const server = new Server(
  {
    name: 'mcp-minimal',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'hello':
      return {
        content: [{ type: 'text', text: 'Hello from MCP server' }],
      };

    case 'echo': {
      const parsed = EchoToolInputSchema.safeParse(args);
      if (!parsed.success) {
        return {
          content: [
            { type: 'text', text: `Invalid arguments: ${parsed.error}` },
          ],
          isError: true,
        };
      }

      return {
        content: [{ type: 'text', text: `Echo: ${parsed.data.message}` }],
      };
    }

    default:
      return {
        content: [{ type: 'text', text: `Unknown tool: ${name}` }],
        isError: true,
      };
  }
});

// Handle list tools requests
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'hello',
        description: 'Responds with a greeting message',
        inputSchema: { type: 'object', properties: {} },
      },
      {
        name: 'echo',
        description: 'Echoes the provided message',
        inputSchema: zodToJsonSchema(EchoToolInputSchema),
      },
    ],
  };
});

// Start the server
async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Use stderr to avoid being treated as server response
  console.error('MCP Minimal Server running on stdio');
}

// Run the server and handle fatal errors
runServer().catch((error) => {
  console.error('Fatal error running server:', error);
  process.exit(1);
});
