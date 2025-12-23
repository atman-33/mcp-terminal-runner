#!/usr/bin/env node

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { server } from './server.js';
import { registerTools } from './tools/index.js';

// biome-ignore lint/performance/noBarrelFile: entry point
export { server } from './server.js';

async function main() {
  registerTools(server);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error in main:', error);
    process.exit(1);
  });
}
