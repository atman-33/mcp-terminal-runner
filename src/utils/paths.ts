import { execSync } from 'node:child_process';
import { realpath, stat } from 'node:fs/promises';
import { isAbsolute, posix, relative, resolve } from 'node:path';
import { parseCommaSeparatedEnv } from './env.js';

export const isWithinRoot = (root: string, target: string): boolean => {
  const rel = relative(root, target);
  if (rel === '') {
    return true;
  }

  const isOutsideRoot = rel.startsWith('..') || isAbsolute(rel);
  return !isOutsideRoot;
};

export const resolveAndValidateCwd = async (
  cwdInput: string
): Promise<string> => {
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

export const getWslCwd = (): string | undefined => {
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
