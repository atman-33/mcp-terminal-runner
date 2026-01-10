# Change: Add default timeouts and argv-based process execution

## Why
`execute_command` can hang indefinitely when the spawned shell process never exits (e.g., interactive commands, incomplete shell quoting, or programs waiting on input). This blocks the MCP response and makes the tool unreliable for automation.

## What Changes
- Add an optional `timeout_ms` input to `execute_command`.
  - If omitted, a server default is applied.
  - If provided, the provided value is used.
  - On timeout, the server terminates the process and returns an error result.
- Add a new tool `execute_process` for argv-based execution:
  - Inputs: `file` (string), `args` (string[]), `cwd` (string), `input` (optional string), `timeout_ms` (optional number).
  - Returns the same YAML response shape (`exit_code`, `stdout`, `stderr`).
  - Validates `file` against `ALLOWED_COMMANDS` (same allowlist model as `execute_command`).

## Impact
- Affected specs: `execution`
- Affected code:
  - `src/tools/execute.ts` (extend schema + behavior)
  - `src/utils/command.ts` (add timeout support in runner)
  - New tool module (e.g., `src/tools/execute-process.ts`) and tool registration
  - Tests: `src/index.test.ts`

## Compatibility
- Existing clients calling `execute_command` without `timeout_ms` continue to work, but long-running commands may now be terminated after the default timeout.
- Clients that require long-running commands can pass a larger `timeout_ms` value.

## Defaults
- The default timeout is 30,000 ms.
