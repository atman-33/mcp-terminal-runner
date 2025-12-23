# Spec: Interactive Session Management

## ADDED Requirements

### Requirement: Start Command Session
The server MUST provide a tool named `start_command` to initiate a background command execution session.

- **Arguments**:
  - `command` (string): The command to execute.
  - `cwd` (string, optional): The working directory.
  - `timeout` (number, optional): Maximum time (in milliseconds) to wait for initial output. Default is 0 (no wait).
- **Returns**:
  - `sessionId` (string): Unique identifier for the session.
  - `pid` (number): Process ID.
  - `stdout` (string, optional): Initial standard output if `timeout` is used.
  - `stderr` (string, optional): Initial standard error if `timeout` is used.

#### Scenario: Start a long-running process
- **GIVEN** the server is running
- **AND** `ALLOWED_COMMANDS` includes `sleep`
- **WHEN** the client calls `start_command` with `command: "sleep 10"`
- **THEN** the server starts the process in the background
- **AND** returns a valid `sessionId` and `pid`

#### Scenario: Start and wait for initial output
- **GIVEN** the server is running
- **AND** `ALLOWED_COMMANDS` includes `echo`
- **WHEN** the client calls `start_command` with `command: "echo hello"`, `timeout: 1000`
- **THEN** the server starts the process
- **AND** waits for output (up to 1000ms)
- **AND** returns `sessionId`, `pid`, and `stdout: "hello\n"`

### Requirement: Read Session Output
The server MUST provide a tool named `read_output` to retrieve buffered output from a session.

- **Arguments**:
  - `sessionId` (string): The ID of the session.
  - `timeout` (number, optional): Maximum time (in milliseconds) to wait for new output if the buffer is empty. Default is 0 (no wait).
- **Returns**:
  - `stdout` (string): Standard output accumulated since the last read.
  - `stderr` (string): Standard error accumulated since the last read.
  - `isActive` (boolean): True if the process is still running.

#### Scenario: Read output from running process
- **GIVEN** a session is running for `echo "hello"`
- **WHEN** the client calls `read_output` with the `sessionId`
- **THEN** the server returns `stdout` containing "hello\n"
- **AND** `isActive` reflects the process state (likely false if it finished quickly, or true if long running)

#### Scenario: Wait for output (Long Polling)
- **GIVEN** a session is running for a command that outputs after a delay (e.g., `sleep 1 && echo "done"`)
- **AND** the output buffer is currently empty
- **WHEN** the client calls `read_output` with `sessionId` and `timeout: 2000`
- **THEN** the server waits until "done" is output (approx 1s)
- **AND** returns `stdout: "done\n"` immediately upon reception

### Requirement: Write Session Input
The server MUST provide a tool named `write_input` to send data to a session's standard input.

- **Arguments**:
  - `sessionId` (string): The ID of the session.
  - `input` (string): The data to write.
- **Returns**:
  - `success` (boolean): True if written successfully.

#### Scenario: Write to interactive process
- **GIVEN** a session is running for a command that reads stdin (e.g., `cat`)
- **WHEN** the client calls `write_input` with `input: "data\n"`
- **THEN** the server writes "data\n" to the process stdin
- **AND** returns `success: true`

### Requirement: Stop Command Session
The server MUST provide a tool named `stop_command` to terminate a session.

- **Arguments**:
  - `sessionId` (string): The ID of the session.
  - `signal` (string, optional): Signal to send (default: "SIGTERM").
- **Returns**:
  - `success` (boolean): True if termination signal was sent.

#### Scenario: Stop a running process
- **GIVEN** a session is running for `sleep 100`
- **WHEN** the client calls `stop_command` with the `sessionId`
- **THEN** the server terminates the process
- **AND** returns `success: true`
