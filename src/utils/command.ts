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

export const runCommand = async (
  file: string,
  args: string[],
  cwd?: string,
  input?: string
): Promise<CommandResult> =>
  new Promise<CommandResult>((resolvePromise, rejectPromise) => {
    const child = spawn(file, args, {
      cwd,
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

export const prepareCommand = async (
  command: string,
  cwd: string
): Promise<PreparedExecution> => {
  const [bin] = tokenizeArgs(command);
  const allowedCommands = parseCommaSeparatedEnv(process.env.ALLOWED_COMMANDS);

  if (!(allowedCommands.includes('*') || allowedCommands.includes(bin))) {
    throw new Error(
      `Command "${bin}" is not allowed, allowed commands: ${
        allowedCommands.length > 0 ? allowedCommands.join(', ') : '(none)'
      }`
    );
  }

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
