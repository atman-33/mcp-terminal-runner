# Design: Interactive Execution Architecture

## Overview
To support interactive commands, we need to move beyond simple `exec` style calls to managing `spawn`ed child processes that persist across tool calls.

## Phase 1: One-shot with Input
For `execute_command` with `input`:
1.  Spawn the process.
2.  Write `input` to `stdin`.
3.  Close `stdin`.
4.  Buffer `stdout` and `stderr` until exit.
5.  Return result.

This is stateless and fits the current architecture.

## Phase 2: Session Management
For true interactivity, we introduce a **Session Manager**.

### Session Store
- **In-Memory Map**: `Map<string, Session>` where key is `sessionId`.
- **Session Object**:
  ```typescript
  interface Session {
    id: string;
    process: ChildProcess;
    stdoutBuffer: string[];
    stderrBuffer: string[];
    createdAt: number;
  }
  ```

### Buffering Strategy
- Since MCP is request/response based, we cannot stream output directly to the client in real-time (unless using MCP notifications, but polling is simpler for now as per requirements).
- Output from the child process will be appended to in-memory buffers.
- `read_output` clears the read portion of the buffer or tracks a cursor.
  - *Decision*: To keep it simple, `read_output` will return *all unread* content and clear the internal buffer (destructive read) or move a cursor.
  - *Refinement*: The requirement says "return output added since last read". Destructive read (consume) is the simplest implementation for this.

### Concurrency & Cleanup
- **Zombie Processes**: If a client starts a session and disappears, the process might hang.
- **Cleanup Policy**: We should implement a timeout or a limit on max sessions, but for this initial version, explicit `stop_command` is required. (Future work: auto-cleanup).

### Security
- `cwd` restrictions defined in `execute_command` spec should also apply to `start_command`.

### Platform Compatibility
- The implementation MUST correctly detect the running OS.
- When running on Linux (including inside WSL), it MUST NOT prepend `wsl` to commands. The `wsl` wrapper should only be used when running on Windows to execute commands in WSL.

## Agent Guidance Strategy
To help AI agents choose the correct tool:
1.  **Tool Description**: Explicitly mention in `execute_command` description that it is NOT for interactive or long-running commands, and point to `start_command`.
2.  **Error Hints**: If `execute_command` times out (likely due to waiting for input), append a hint to the error message suggesting `start_command`.
