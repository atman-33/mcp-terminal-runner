import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

// Hardcoded version to avoid import issues with outside rootDir
const version = '0.1.0';

export const server = new McpServer(
  {
    name: 'mcp-terminal-runner',
    version,
  },
  {
    capabilities: {
      tools: {},
    },
  }
);
