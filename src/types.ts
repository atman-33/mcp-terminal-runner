export interface CommandResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  timedOut?: boolean;
  timeoutMs?: number;
}
