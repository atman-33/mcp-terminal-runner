import type { ChildProcess } from 'node:child_process';
import { randomUUID } from 'node:crypto';

export interface Session {
  id: string;
  process: ChildProcess;
  stdoutBuffer: string[];
  stderrBuffer: string[];
  createdAt: number;
  outputListeners: (() => void)[];
}

export class SessionManager {
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
      let timeoutTimer: NodeJS.Timeout;
      let debounceTimer: NodeJS.Timeout;

      const finish = () => {
        clearTimeout(timeoutTimer);
        clearTimeout(debounceTimer);
        // Remove listener
        session.outputListeners = session.outputListeners.filter(
          (l) => l !== onData
        );
        resolvePromise(flush());
      };

      const onData = () => {
        // When data arrives, wait a bit (debounce) to collect subsequent chunks
        if (debounceTimer) {
          clearTimeout(debounceTimer);
        }
        debounceTimer = setTimeout(finish, 50); // 50ms debounce
      };

      // Global timeout
      timeoutTimer = setTimeout(finish, timeout);

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

export const sessionManager = new SessionManager();
