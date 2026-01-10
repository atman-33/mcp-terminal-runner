## MODIFIED Requirements

### Requirement: Execute Shell Commands

**Modification**: The tool MUST support a default timeout.
- The `execute_command` tool MUST accept an optional `timeout_ms` parameter.
- If `timeout_ms` is omitted, the server MUST apply a default timeout.
- If `timeout_ms` is provided, the server MUST use the provided value.

**Modification**: On timeout, the server MUST terminate the process and return an error.
- The server MUST terminate the process when the timeout expires.
- The server MUST return `isError: true`.
- The response MUST include a clear timeout error message.
- The response MUST include any captured `stdout` and `stderr` up to the timeout.

#### Scenario: Default timeout prevents hangs
- **GIVEN** the server is running
- **AND** `ALLOWED_COMMANDS` includes `bash`
- **WHEN** the client calls `execute_command` with a command that would exceed the default timeout
- **THEN** the server terminates the process
- **AND** the server returns an error indicating a timeout

#### Scenario: Caller-provided timeout overrides default
- **GIVEN** the server is running
- **AND** `ALLOWED_COMMANDS` includes `bash`
- **WHEN** the client calls `execute_command` with `timeout_ms` set to a custom value
- **THEN** the server uses the provided timeout

## ADDED Requirements

### Requirement: Execute a Process with argv (Non-Shell)
The server MUST provide an `execute_process` tool that executes a program using argv-style inputs.

- Inputs MUST include `file` (string), `args` (string array), and optional `input` (string).
- The tool MUST accept `cwd` and apply the same `ALLOWED_CWD_ROOTS` restrictions as `execute_command`.
- The tool MUST accept an optional `timeout_ms` and apply the same default/override behavior as `execute_command`.
- The tool MUST validate `file` against `ALLOWED_COMMANDS` using the same allowlist model as `execute_command`.

#### Scenario: Execute_process runs argv-based command
- **GIVEN** the server is running
- **AND** `ALLOWED_COMMANDS` includes `python3`
- **WHEN** the client calls `execute_process` with `file: "python3"` and args that print to stdout
- **THEN** the server returns YAML output with `exit_code: 0`

#### Scenario: Execute_process rejects disallowed file
- **GIVEN** the server is running
- **AND** `ALLOWED_COMMANDS` is set to `echo`
- **WHEN** the client calls `execute_process` with `file: "python3"`
- **THEN** the server returns an error indicating the command is not allowed
