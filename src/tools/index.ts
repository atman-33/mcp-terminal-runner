import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerExecuteTool } from './execute.js';
import { registerSessionTools } from './session.js';

export const registerTools = (server: McpServer) => {
  registerExecuteTool(server);
  registerSessionTools(server);
};
