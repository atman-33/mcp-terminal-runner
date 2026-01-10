import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerExecuteTool } from './execute.js';
import { registerExecuteProcessTool } from './execute-process.js';

export const registerTools = (server: McpServer) => {
  registerExecuteTool(server);
  registerExecuteProcessTool(server);
};
