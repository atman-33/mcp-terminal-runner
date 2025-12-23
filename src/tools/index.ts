import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerExecuteTool } from './execute.js';

export const registerTools = (server: McpServer) => {
  registerExecuteTool(server);
};
