# Spec Delta: Add `cwd` Support to `execute_command`

## ADDED Requirements

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

## MODIFIED Requirements

### Requirement: Execute Shell Commands
The server MUST provide a tool named `execute_command` that executes a given shell command and returns the result.

**Modification:** The tool input schema is extended to accept an optional `cwd` parameter as described above. Existing behavior MUST remain unchanged when `cwd` is not provided.

#### Scenario: Backward compatibility (no `cwd`)
- **GIVEN** the server is running
- **AND** `ALLOWED_COMMANDS` includes `echo`
- **WHEN** the client calls `execute_command` with `command: "echo hello"` (no `cwd`)
- **THEN** the server executes the command
- **AND** the response contains the exit code `0`
- **AND** the response contains stdout "hello\n"

## Notes / Non-Goals

- This change does NOT add support for shell operators (e.g., `&&`, `|`) or `cd` as a builtin; callers should express directory selection via `cwd`.
- This change does NOT introduce session persistence; `cwd` applies per tool invocation.
- Command allowlisting continues to apply to the first token (`bin`) extracted from `command`.
