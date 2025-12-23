#!/usr/bin/env node

import { type ChildProcess, execSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
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

interface CommandResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

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
  cwd?: string,
  input?: string
): Promise<CommandResult> =>
  new Promise<CommandResult>((resolvePromise, rejectPromise) => {
    const child = spawn(command, {
      cwd,
      shell: true,
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    if (input) {
      child.stdin?.write(input);
      child.stdin?.end();
    }

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

const getWslCwd = (): string | undefined => {
  if (process.platform !== 'win32') {
    return;
  }
  try {
    // Try to convert current working directory to WSL path
    const wslPath = execSync(`wsl wslpath -u "${process.cwd()}"`)
      .toString()
      .trim();
    if (wslPath.startsWith('/')) {
      return wslPath;
    }
  } catch {
    // Ignore errors if wsl/wslpath is not available or fails
  }
  return;
};

interface Session {
  id: string;
  process: ChildProcess;
  stdoutBuffer: string[];
  stderrBuffer: string[];
  createdAt: number;
  outputListeners: (() => void)[];
}

class SessionManager {
  private readonly sessions = new Map<string, Session>();

  createSession(process: ChildProcess): { sessionId: string; pid: number } {
    const id = randomUUID();
    const session: Session = {
      id,
      process,
      stdoutBuffer: [],
      stderrBuffer: [],
      createdAt: Date.now(),
      outputListeners: [],
    };

    process.stdout?.setEncoding('utf8');
    process.stderr?.setEncoding('utf8');

    const notifyListeners = () => {
      const listeners = session.outputListeners;
      session.outputListeners = [];
      for (const listener of listeners) {
        listener();
      }
    };

    process.stdout?.on('data', (chunk: string) => {
      session.stdoutBuffer.push(chunk);
      notifyListeners();
    });
    process.stderr?.on('data', (chunk: string) => {
      session.stderrBuffer.push(chunk);
      notifyListeners();
    });

    this.sessions.set(id, session);
    return { sessionId: id, pid: process.pid ?? -1 };
  }

  getSession(id: string): Session | undefined {
    return this.sessions.get(id);
  }

  readOutput(
    id: string,
    timeout = 0
  ): Promise<{
    stdout: string;
    stderr: string;
    isActive: boolean;
  }> {
    const session = this.sessions.get(id);
    if (!session) {
      throw new Error(`Session not found: ${id}`);
    }

    const flush = () => {
      const stdout = session.stdoutBuffer.join('');
      const stderr = session.stderrBuffer.join('');

      session.stdoutBuffer = [];
      session.stderrBuffer = [];

      const isActive =
        session.process.exitCode === null &&
        session.process.signalCode === null;

      return { stdout, stderr, isActive };
    };

    // If there is data or no timeout, return immediately
    if (
      session.stdoutBuffer.length > 0 ||
      session.stderrBuffer.length > 0 ||
      timeout <= 0
    ) {
      return Promise.resolve(flush());
    }

    // Wait for data or timeout
    return new Promise((resolvePromise) => {
      let timer: NodeJS.Timeout;

      const onData = () => {
        clearTimeout(timer);
        resolvePromise(flush());
      };

      timer = setTimeout(() => {
        // Remove listener if timed out
        session.outputListeners = session.outputListeners.filter(
          (l) => l !== onData
        );
        resolvePromise(flush());
      }, timeout);

      session.outputListeners.push(onData);
    });
  }

  writeInput(id: string, input: string): void {
    const session = this.sessions.get(id);
    if (!session) {
      throw new Error(`Session not found: ${id}`);
    }

    if (session.process.stdin) {
      session.process.stdin.write(input);
    } else {
      throw new Error('Process stdin is not available');
    }
  }

  stopSession(id: string, signal: NodeJS.Signals = 'SIGTERM'): void {
    const session = this.sessions.get(id);
    if (!session) {
      throw new Error(`Session not found: ${id}`);
    }

    session.process.kill(signal);
  }
}

const sessionManager = new SessionManager();

const prepareCommand = async (
  command: string,
  cwd?: string
): Promise<{ command: string; cwd?: string }> => {
  const [bin] = tokenizeArgs(command);
  const allowedCommands = parseCommaSeparatedEnv(process.env.ALLOWED_COMMANDS);

  if (!(allowedCommands.includes('*') || allowedCommands.includes(bin))) {
    throw new Error(
      `Command "${bin}" is not allowed, allowed commands: ${
        allowedCommands.length > 0 ? allowedCommands.join(', ') : '(none)'
      }`
    );
  }

  const cwdToUse = cwd ?? getWslCwd();

  const cwdResolved = cwdToUse
    ? await resolveAndValidateCwd(cwdToUse)
    : undefined;

  let finalCommand = command;
  let finalCwd = cwdResolved;

  if (process.platform === 'win32' && cwdResolved?.startsWith('/')) {
    finalCommand = `wsl --cd "${cwdResolved}" -- bash -c "${command.replace(
      /"/g,
      '\\"'
    )}"`;
    finalCwd = undefined;
  }

  return { command: finalCommand, cwd: finalCwd };
};

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
        const output = await sessionManager.readOutput(sessionId, args.timeout);
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
