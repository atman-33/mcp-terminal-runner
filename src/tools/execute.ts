import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { dump } from 'js-yaml';
import { z } from 'zod';
import { prepareCommand, runCommand } from '../utils/command.js';

export const registerExecuteTool = (server: McpServer) => {
  server.tool(
    'execute_command',
    'Execute a shell command. Note: This tool is for non-interactive, short-lived commands only. Interactive commands are not supported.',
    {
      command: z.string().describe('The shell command to execute'),
      cwd: z
        .string()
        .describe('The working directory to execute the command within'),
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
        let errorMessage =
          error instanceof Error ? error.message : String(error);

        if (errorMessage.includes('ENOENT')) {
          errorMessage +=
            '\nNote: This tool does not support interactive commands. Ensure the command is non-interactive and the executable exists.';
        }

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
