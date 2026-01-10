import { tokenizeArgs } from 'args-tokenizer';
import spawn from 'cross-spawn';
import type { CommandResult } from '../types.js';
import { parseCommaSeparatedEnv } from './env.js';
import { resolveAndValidateCwd } from './paths.js';

interface PreparedExecution {
  file: string;
  args: string[];
  cwd?: string;
}

export const DEFAULT_TIMEOUT_MS = 30_000;

interface RunCommandRequest {
  file: string;
  args: string[];
  cwd?: string;
  input?: string;
  timeoutMs?: number;
}

const isPositiveInteger = (value: number): boolean =>
  Number.isInteger(value) && value > 0;

const killChildProcess = (child: ReturnType<typeof spawn>) => {
  if (!child.pid) {
    return;
  }

  // On POSIX, try to kill the whole process group first.
  if (process.platform !== 'win32') {
    try {
      process.kill(-child.pid, 'SIGTERM');
      return;
    } catch {
      // Fall back to killing just the spawned process.
    }
  }

  try {
    child.kill('SIGTERM');
  } catch {
    // Ignore
  }
};

const scheduleKillEscalation = (
  child: ReturnType<typeof spawn>,
  delayMs: number
) => {
  if (process.platform === 'win32' || !child.pid) {
    return;
  }

  setTimeout(() => {
    if (!child.pid) {
      return;
    }

    // Try killing the process group first.
    try {
      process.kill(-child.pid, 'SIGKILL');
    } catch {
      try {
        child.kill('SIGKILL');
      } catch {
        // Ignore
      }
    }
  }, delayMs);
};

export const runCommand = async (
  request: RunCommandRequest
): Promise<CommandResult> =>
  new Promise<CommandResult>((resolvePromise, rejectPromise) => {
    const timeoutMs =
      request.timeoutMs === undefined ? DEFAULT_TIMEOUT_MS : request.timeoutMs;

    if (!isPositiveInteger(timeoutMs)) {
      rejectPromise(new Error('timeout_ms must be a positive integer'));
      return;
    }

    const child = spawn(request.file, request.args, {
      cwd: request.cwd,
      windowsHide: true,
      detached: process.platform !== 'win32',
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    if (request.input) {
      child.stdin?.write(request.input);
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

    let settled = false;
    let timedOut = false;

    const timeoutHandle = setTimeout(() => {
      if (settled) {
        return;
      }
      timedOut = true;
      killChildProcess(child);

      // Escalate to SIGKILL if needed (POSIX only).
      scheduleKillEscalation(child, 1000);
    }, timeoutMs);

    child.on('error', (error) => {
      settled = true;
      clearTimeout(timeoutHandle);
      rejectPromise(error);
    });

    child.on('close', (code) => {
      settled = true;
      clearTimeout(timeoutHandle);

      let exitCode = 1;
      if (typeof code === 'number') {
        exitCode = code;
      }
      if (timedOut) {
        exitCode = 124;
      }

      resolvePromise({
        exitCode,
        stdout,
        stderr,
        timedOut,
        timeoutMs: timedOut ? timeoutMs : undefined,
      });
    });
  });

const assertAllowedCommand = (bin: string) => {
  const allowedCommands = parseCommaSeparatedEnv(process.env.ALLOWED_COMMANDS);

  if (!(allowedCommands.includes('*') || allowedCommands.includes(bin))) {
    throw new Error(
      `Command "${bin}" is not allowed, allowed commands: ${
        allowedCommands.length > 0 ? allowedCommands.join(', ') : '(none)'
      }`
    );
  }
};

export const prepareCommand = async (
  command: string,
  cwd: string
): Promise<PreparedExecution> => {
  const [bin] = tokenizeArgs(command);
  assertAllowedCommand(bin);

  const cwdResolved = await resolveAndValidateCwd(cwd);

  // On Windows, treat a POSIX-style cwd as a request to execute inside WSL.
  // We execute via: wsl --cd <cwd> -- bash -lc <command>
  if (process.platform === 'win32' && cwdResolved.startsWith('/')) {
    return {
      file: 'wsl',
      args: ['--cd', cwdResolved, '--', 'bash', '-lc', command],
    };
  }

  if (process.platform === 'win32') {
    return {
      file: 'cmd.exe',
      args: ['/d', '/s', '/c', command],
      cwd: cwdResolved,
    };
  }

  // POSIX (Linux/macOS)
  return {
    file: 'bash',
    args: ['-lc', command],
    cwd: cwdResolved,
  };
};

export const prepareProcess = async (
  file: string,
  args: string[],
  cwd: string
): Promise<PreparedExecution> => {
  assertAllowedCommand(file);
  const cwdResolved = await resolveAndValidateCwd(cwd);

  // On Windows, treat a POSIX-style cwd as a request to execute inside WSL.
  // We execute via: wsl --cd <cwd> -- <file> <args...>
  if (process.platform === 'win32' && cwdResolved.startsWith('/')) {
    return {
      file: 'wsl',
      args: ['--cd', cwdResolved, '--', file, ...args],
    };
  }

  return {
    file,
    args,
    cwd: cwdResolved,
  };
};
