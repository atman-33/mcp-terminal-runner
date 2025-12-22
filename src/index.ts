#!/usr/bin/env node

import { realpath, stat } from 'node:fs/promises';
import { isAbsolute, posix, relative, resolve } from 'node:path';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { tokenizeArgs } from 'args-tokenizer';
import spawn from 'cross-spawn';
import { dump } from 'js-yaml';
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
      tools: {},
    },
  }
);

type CommandResult = {
  exitCode: number;
  stdout: string;
  stderr: string;
};

const parseCommaSeparatedEnv = (value: string | undefined): string[] => {
  if (!value) {
    return [];
  }
  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
};

const isWithinRoot = (root: string, target: string): boolean => {
  const rel = relative(root, target);
  if (rel === '') {
    return true;
  }

  const isOutsideRoot = rel.startsWith('..') || isAbsolute(rel);
  return !isOutsideRoot;
};

const resolveAndValidateCwd = async (cwdInput: string): Promise<string> => {
  if (process.platform === 'win32' && cwdInput.startsWith('/')) {
    const allowedRoots = parseCommaSeparatedEnv(process.env.ALLOWED_CWD_ROOTS);
    if (allowedRoots.length === 0) {
      return cwdInput;
    }

    const cwdNormalized = posix.normalize(cwdInput);
    const allowed = allowedRoots.some((root) => {
      const rel = posix.relative(root, cwdNormalized);
      return rel === '' || !(rel.startsWith('..') || posix.isAbsolute(rel));
    });

    if (!allowed) {
      throw new Error('cwd is not allowed by ALLOWED_CWD_ROOTS');
    }

    return cwdInput;
  }

  const cwdResolved = resolve(process.cwd(), cwdInput);

  try {
    const cwdStat = await stat(cwdResolved);
    if (!cwdStat.isDirectory()) {
      throw new Error(`cwd is not a directory: ${cwdInput}`);
    }
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('cwd is not a directory')
    ) {
      throw error;
    }
    throw new Error(`cwd does not exist: ${cwdInput}`);
  }

  const cwdCanonical = await realpath(cwdResolved);

  const allowedRoots = parseCommaSeparatedEnv(process.env.ALLOWED_CWD_ROOTS);
  if (allowedRoots.length === 0) {
    return cwdResolved;
  }

  const canonicalRoots = await Promise.all(
    allowedRoots.map(async (root) => {
      const rootResolved = resolve(process.cwd(), root);
      try {
        return await realpath(rootResolved);
      } catch {
        throw new Error(
          `Invalid configuration: ALLOWED_CWD_ROOTS contains an invalid root: ${root}`
        );
      }
    })
  );

  const allowed = canonicalRoots.some((root) =>
    isWithinRoot(root, cwdCanonical)
  );
  if (!allowed) {
    throw new Error('cwd is not allowed by ALLOWED_CWD_ROOTS');
  }

  return cwdResolved;
};

const runCommand = async (
  command: string,
  cwd?: string
): Promise<CommandResult> =>
  new Promise<CommandResult>((resolvePromise, rejectPromise) => {
    const child = spawn(command, {
      cwd,
      shell: true,
      windowsHide: true,
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.setEncoding('utf8');
    child.stderr?.setEncoding('utf8');

    child.stdout?.on('data', (chunk: string) => {
      stdout += chunk;
    });
    child.stderr?.on('data', (chunk: string) => {
      stderr += chunk;
    });

    child.on('error', (error) => {
      rejectPromise(error);
    });

    child.on('close', (code) => {
      resolvePromise({
        exitCode: typeof code === 'number' ? code : 1,
        stdout,
        stderr,
      });
    });
  });

server.tool(
  'execute_command',
  'Execute a shell command',
  {
    command: z.string().describe('The shell command to execute'),
    cwd: z
      .string()
      .optional()
      .describe('Optional working directory to execute the command within'),
  },
  async (args) => {
    const [bin] = tokenizeArgs(args.command);
    const allowedCommands = parseCommaSeparatedEnv(
      process.env.ALLOWED_COMMANDS
    );

    try {
      if (!(allowedCommands.includes('*') || allowedCommands.includes(bin))) {
        throw new Error(
          `Command "${bin}" is not allowed, allowed commands: ${
            allowedCommands.length > 0 ? allowedCommands.join(', ') : '(none)'
          }`
        );
      }

      const cwdResolved = args.cwd
        ? await resolveAndValidateCwd(args.cwd)
        : undefined;

      let finalCommand = args.command;
      let finalCwd = cwdResolved;

      if (process.platform === 'win32' && cwdResolved?.startsWith('/')) {
        finalCommand = `wsl --cd "${cwdResolved}" -- bash -c "${args.command.replace(
          /"/g,
          '\\"'
        )}"`;
        finalCwd = undefined;
      }

      const result = await runCommand(finalCommand, finalCwd);

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
