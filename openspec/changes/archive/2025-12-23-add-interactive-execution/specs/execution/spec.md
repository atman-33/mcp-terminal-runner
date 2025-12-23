# Spec Delta: Execute Command with Input

## MODIFIED Requirements

### Requirement: Execute Shell Commands
The server MUST provide a tool named `execute_command` that executes a given shell command and returns the result.

**Modification**: The tool input schema is extended to accept an optional `input` parameter.

- `input` (string, optional): Content to write to the process standard input.

**Modification**: The tool description MUST be updated to guide agents.
- It MUST explicitly state that this tool is for non-interactive, short-lived commands.
- It MUST recommend using `start_command` for interactive or long-running processes.

**Modification**: The timeout error message MUST be enhanced.
- If the command execution times out, the error message returned to the client MUST include a hint suggesting that the command might be waiting for input and that `start_command` should be used instead.

#### Scenario: Execute with Input
- **GIVEN** the server is running
- **AND** `ALLOWED_COMMANDS` includes `cat`
- **WHEN** the client calls `execute_command` with `command: "cat"`, `input: "hello world"`
- **THEN** the server executes the command
- **AND** writes "hello world" to stdin
- **AND** closes stdin
- **AND** the response stdout contains "hello world"

#### Scenario: Execute without Input (Backward Compatibility)
- **GIVEN** the server is running
- **AND** `ALLOWED_COMMANDS` includes `echo`
- **WHEN** the client calls `execute_command` with `command: "echo no input"` (input is undefined)
- **THEN** the server executes the command normally
- **AND** stdin is closed immediately (or left empty)
