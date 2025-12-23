import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import spawn from 'cross-spawn';
import { dump } from 'js-yaml';
import { z } from 'zod';
import { sessionManager } from '../services/session-manager.js';
import { prepareCommand } from '../utils/command.js';

export const registerSessionTools = (server: McpServer) => {
  server.tool(
    'start_command',
    'Start a background command session. Use this for interactive commands or long-running processes.',
    {
      command: z.string().describe('The shell command to execute'),
      cwd: z
        .string()
        .optional()
        .describe('Optional working directory to execute the command within'),
      timeout: z
        .number()
        .optional()
        .describe(
          'Maximum time (in milliseconds) to wait for initial output. Default is 0 (no wait).'
        ),
    },
    async (args) => {
      try {
        const { command: finalCommand, cwd: finalCwd } = await prepareCommand(
          args.command,
          args.cwd
        );

        const child = spawn(finalCommand, {
          cwd: finalCwd,
          shell: true,
          windowsHide: true,
          stdio: ['pipe', 'pipe', 'pipe'],
        });

        const { sessionId, pid } = sessionManager.createSession(child);

        const result: {
          sessionId: string;
          pid: number;
          stdout?: string;
          stderr?: string;
        } = { sessionId, pid };

        if (args.timeout && args.timeout > 0) {
          const output = await sessionManager.readOutput(
            sessionId,
            args.timeout
          );
          result.stdout = output.stdout;
          result.stderr = output.stderr;
        }

        return {
          content: [
            {
              type: 'text',
              text: dump(result),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error starting command: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    'read_output',
    'Read buffered output from a command session',
    {
      sessionId: z.string().describe('The ID of the session'),
      timeout: z
        .number()
        .optional()
        .describe(
          'Maximum time (in milliseconds) to wait for new output if the buffer is empty. Default is 0 (no wait).'
        ),
    },
    async (args) => {
      try {
        const result = await sessionManager.readOutput(
          args.sessionId,
          args.timeout
        );
        return {
          content: [
            {
              type: 'text',
              text: dump(result),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error reading output: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    'write_input',
    'Write input to a command session',
    {
      sessionId: z.string().describe('The ID of the session'),
      input: z.string().describe('The input to write'),
    },
    async (args) => {
      try {
        await Promise.resolve();
        sessionManager.writeInput(args.sessionId, args.input);
        return {
          content: [
            {
              type: 'text',
              text: dump({ success: true }),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error writing input: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    'stop_command',
    'Stop a command session',
    {
      sessionId: z.string().describe('The ID of the session'),
      signal: z
        .string()
        .optional()
        .describe('The signal to send (default: SIGTERM)'),
    },
    async (args) => {
      try {
        await Promise.resolve();
        sessionManager.stopSession(
          args.sessionId,
          (args.signal as NodeJS.Signals) ?? 'SIGTERM'
        );
        return {
          content: [
            {
              type: 'text',
              text: dump({ success: true }),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error stopping session: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );
};
