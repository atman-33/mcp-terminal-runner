#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { tokenizeArgs } from 'args-tokenizer';
import { dump } from 'js-yaml';
import { x } from 'tinyexec';
import { z } from 'zod';

// Hardcoded version to avoid import issues with outside rootDir
const version = '0.1.0';

const server = new McpServer(
  {
    name: 'mcp-terminal-runner',
    version,
  },
  {
    capabilities: {
      logging: {},
      tools: {},
    },
  }
);

server.tool(
  'execute_command',
  'Execute a shell command',
  {
    command: z.string().describe('The shell command to execute'),
  },
  async (args) => {
    const [bin, ...commandArgs] = tokenizeArgs(args.command);
    const allowedCommands =
      process.env.ALLOWED_COMMANDS?.split(',').map((cmd) => cmd.trim()) || [];

    try {
      if (!(allowedCommands.includes('*') || allowedCommands.includes(bin))) {
        throw new Error(
          `Command "${bin}" is not allowed, allowed commands: ${
            allowedCommands.length > 0 ? allowedCommands.join(', ') : '(none)'
          }`
        );
      }

      const result = await x(bin, commandArgs);

      return {
        content: [
          {
            type: 'text',
            text: dump({
              exit_code: result.exitCode,
              stdout: result.stdout,
              stderr: result.stderr,
            }),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error executing command: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
        isError: true,
      };
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error in main:', error);
    process.exit(1);
  });
}

export { server };
