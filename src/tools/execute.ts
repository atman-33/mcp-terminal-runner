import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { dump } from 'js-yaml';
import { z } from 'zod';
import { prepareCommand, runCommand } from '../utils/command.js';

export const registerExecuteTool = (server: McpServer) => {
  server.tool(
    'execute_command',
    'Execute a shell command. Note: This tool is for non-interactive, short-lived commands. For interactive or long-running processes, use start_command instead.',
    {
      command: z.string().describe('The shell command to execute'),
      cwd: z
        .string()
        .optional()
        .describe('Optional working directory to execute the command within'),
      input: z
        .string()
        .optional()
        .describe(
          'Optional input to write to stdin. Useful for commands that require user interaction.'
        ),
    },
    async (args) => {
      try {
        const { command: finalCommand, cwd: finalCwd } = await prepareCommand(
          args.command,
          args.cwd
        );

        const result = await runCommand(finalCommand, finalCwd, args.input);

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
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        return {
          content: [
            {
              type: 'text',
              text: `Error executing command: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
};
