import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { dump } from 'js-yaml';
import { z } from 'zod';
import {
  DEFAULT_TIMEOUT_MS,
  prepareProcess,
  runCommand,
} from '../utils/command.js';

export const registerExecuteProcessTool = (server: McpServer) => {
  server.tool(
    'execute_process',
    'Execute a program using argv-style inputs (non-shell). Note: This tool is for non-interactive, short-lived commands only. Interactive commands are not supported.',
    {
      file: z.string().describe('The program to execute (e.g., python3)'),
      args: z
        .array(z.string())
        .default([])
        .describe('The argv arguments to pass to the program'),
      cwd: z
        .string()
        .describe('The working directory to execute the command within'),
      input: z
        .string()
        .optional()
        .describe(
          'Optional input to write to stdin. Useful for commands that require user interaction.'
        ),
      timeout_ms: z
        .number()
        .int()
        .positive()
        .max(600_000)
        .optional()
        .describe(
          `Optional timeout in milliseconds. If omitted, defaults to ${DEFAULT_TIMEOUT_MS}ms.`
        ),
    },
    async (toolArgs) => {
      try {
        const exec = await prepareProcess(
          toolArgs.file,
          toolArgs.args,
          toolArgs.cwd
        );

        const result = await runCommand({
          file: exec.file,
          args: exec.args,
          cwd: exec.cwd,
          input: toolArgs.input,
          timeoutMs: toolArgs.timeout_ms,
        });

        if (result.timedOut) {
          return {
            content: [
              {
                type: 'text',
                text: dump({
                  exit_code: result.exitCode,
                  stdout: result.stdout,
                  stderr: `${result.stderr}\nTimed out after ${result.timeoutMs}ms.`,
                }),
              },
            ],
            isError: true,
          };
        }

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
