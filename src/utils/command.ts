import { tokenizeArgs } from 'args-tokenizer';
import spawn from 'cross-spawn';
import type { CommandResult } from '../types.js';
import { parseCommaSeparatedEnv } from './env.js';
import { getWslCwd, resolveAndValidateCwd } from './paths.js';

export const runCommand = async (
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

export const prepareCommand = async (
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
