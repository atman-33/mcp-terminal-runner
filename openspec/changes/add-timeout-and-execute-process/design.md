## Context
The server currently executes commands by spawning a shell (`bash -lc <command>` on POSIX). If the shell or a child process waits for additional input or never exits, the MCP call does not complete because the server waits for the child process `close` event.

## Goals
- Ensure `execute_command` does not hang indefinitely.
- Provide a safe way to pass large/multiline arguments without relying on shell quoting.
- Keep security controls (allowlist + allowed cwd roots) consistent across tools.

## Non-Goals
- Supporting fully interactive terminal sessions.
- Providing streaming output.

## Decisions
### Decision: Add `timeout_ms` with a default
- Add `timeout_ms` to `execute_command` and `execute_process`.
- If omitted, a server default is applied.
- If provided, the provided value is used.

**Default value**
- Default: 30,000 ms.

**Validation**
- Proposed range: 1..600,000 ms.

### Decision: Add `execute_process` (argv-based)
Introduce an additional tool that accepts `file` + `args[]` to avoid shell parsing issues and to support passing arbitrary text safely.

### Decision: Timeout semantics
- On timeout, the server terminates the process.
- The tool returns `isError: true` and includes a clear timeout message.
- `stdout`/`stderr` collected so far are returned.

## Risks / Trade-offs
- Breaking behavior change: long-running commands may now be terminated by default.
- Killing process trees can be platform-dependent.

## Alternatives considered
- Only document “avoid interactive commands” (does not prevent hangs).
- Add a global hard timeout with no override (too restrictive).
- Avoid `bash -lc` for `execute_command` (would remove piping/&& support).
