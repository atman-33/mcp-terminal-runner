# execution Specification

## Purpose
TBD - created by archiving change implement-terminal-execution. Update Purpose after archive.
## Requirements
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

### Requirement: Command Allowlist
The server MUST restrict execution to commands specified in the `ALLOWED_COMMANDS` environment variable.

#### Scenario: Allowed Command
Given `ALLOWED_COMMANDS` is set to "ls,cat"
When the client calls `execute_command` with `command: "ls"`
Then the command is executed

#### Scenario: Disallowed Command
Given `ALLOWED_COMMANDS` is set to "ls"
When the client calls `execute_command` with `command: "pwd"`
Then the command is NOT executed
And the server returns an error indicating the command is not allowed

#### Scenario: Wildcard Allowlist
Given `ALLOWED_COMMANDS` is set to "*"
When the client calls `execute_command` with `command: "whoami"`
Then the command is executed

### Requirement: Output Formatting
The execution result MUST be returned as a YAML-formatted string within the tool's text content.

#### Scenario: YAML Output
Given a command executes successfully
When the server constructs the response
Then the content text is a YAML string containing `exit_code`, `stdout`, and `stderr`

### Requirement: Optional Working Directory
The server MUST allow callers of the `execute_command` tool to optionally specify a working directory via a `cwd` string parameter.

- If `cwd` is omitted, the server MUST execute the command using the server process working directory (i.e., the current behavior).
- If `cwd` is provided, the server MUST execute the command with the process working directory set to `cwd`.

#### Scenario: Execute with relative `cwd`
- **GIVEN** the server is running
- **AND** `ALLOWED_COMMANDS` includes `npm`
- **WHEN** the client calls `execute_command` with `command: "npm -v"` and `cwd: "frontend"`
- **THEN** the server executes the command in the `frontend` directory
- **AND** the response contains `exit_code`, `stdout`, and `stderr`

#### Scenario: Execute with absolute `cwd`
- **GIVEN** the server is running
- **AND** `ALLOWED_COMMANDS` includes `npm`
- **WHEN** the client calls `execute_command` with `command: "npm -v"` and `cwd: "/home/user/repos/monorepo/frontend"`
- **THEN** the server executes the command in `/home/user/repos/monorepo/frontend`
- **AND** the response contains `exit_code`, `stdout`, and `stderr`

#### Scenario: Error on non-existent `cwd`
- **GIVEN** the server is running
- **AND** `ALLOWED_COMMANDS` includes `npm`
- **WHEN** the client calls `execute_command` with `command: "npm -v"` and `cwd: "does-not-exist"`
- **THEN** the server returns an error
- **AND** the command is NOT executed

### Requirement: Restrict Working Directory (Optional)
The server MUST support restricting the allowed working directory via an environment variable named `ALLOWED_CWD_ROOTS`.

- `ALLOWED_CWD_ROOTS` is a comma-separated list of paths.
- If `ALLOWED_CWD_ROOTS` is **unset or empty**, the server MUST NOT restrict `cwd` (i.e., any existing directory is permitted).
- If `ALLOWED_CWD_ROOTS` is set, and `cwd` is provided, the server MUST reject requests where the resolved `cwd` is not within at least one allowed root.

**Resolution rules**
- The server MUST resolve `cwd` to a canonical path before validating containment (e.g., by resolving `..` segments and symlinks).
- The server MUST resolve each root in `ALLOWED_CWD_ROOTS` to a canonical path as well.
- Containment MUST be determined on canonical paths to prevent bypass via symlinks.
- If `ALLOWED_CWD_ROOTS` is set and any configured root cannot be resolved to a canonical path, the server MUST treat this as a configuration error and MUST reject requests that provide `cwd`.

#### Scenario: Allowed when within `ALLOWED_CWD_ROOTS`
- **GIVEN** the server is running
- **AND** `ALLOWED_COMMANDS` includes `npm`
- **AND** `ALLOWED_CWD_ROOTS` is set to `/home/user/repos/monorepo`
- **WHEN** the client calls `execute_command` with `command: "npm -v"` and `cwd: "/home/user/repos/monorepo/frontend"`
- **THEN** the server executes the command

#### Scenario: Rejected when outside `ALLOWED_CWD_ROOTS`
- **GIVEN** the server is running
- **AND** `ALLOWED_COMMANDS` includes `npm`
- **AND** `ALLOWED_CWD_ROOTS` is set to `/home/user/repos/monorepo`
- **WHEN** the client calls `execute_command` with `command: "npm -v"` and `cwd: "/tmp"`
- **THEN** the server returns an error indicating `cwd` is not allowed
- **AND** the command is NOT executed

#### Scenario: No restriction when `ALLOWED_CWD_ROOTS` is unset
- **GIVEN** the server is running
- **AND** `ALLOWED_COMMANDS` includes `npm`
- **AND** `ALLOWED_CWD_ROOTS` is unset
- **WHEN** the client calls `execute_command` with `command: "npm -v"` and `cwd: "/tmp"`
- **THEN** the server executes the command

#### Scenario: Reject when `ALLOWED_CWD_ROOTS` contains an invalid root
- **GIVEN** the server is running
- **AND** `ALLOWED_COMMANDS` includes `npm`
- **AND** `ALLOWED_CWD_ROOTS` is set to `/home/user/repos/monorepo,/path/that/does/not/exist`
- **WHEN** the client calls `execute_command` with `command: "npm -v"` and `cwd: "/home/user/repos/monorepo/frontend"`
- **THEN** the server returns an error indicating a configuration problem with `ALLOWED_CWD_ROOTS`
- **AND** the command is NOT executed

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

