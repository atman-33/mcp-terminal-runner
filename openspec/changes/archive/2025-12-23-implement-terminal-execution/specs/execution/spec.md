# Spec: Terminal Command Execution

## ADDED Requirements

### Requirement: Execute Shell Commands
The server MUST provide a tool named `execute_command` that executes a given shell command and returns the result.

#### Scenario: Successful Execution
Given the server is running
And `ALLOWED_COMMANDS` includes "echo"
When the client calls `execute_command` with `command: "echo hello"`
Then the server executes the command
And the response contains the exit code `0`
And the response contains stdout "hello\n"

#### Scenario: Execution Error
Given the server is running
And `ALLOWED_COMMANDS` includes "ls"
When the client calls `execute_command` with `command: "ls /nonexistent"`
Then the server executes the command
And the response contains a non-zero exit code
And the response contains stderr details

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
