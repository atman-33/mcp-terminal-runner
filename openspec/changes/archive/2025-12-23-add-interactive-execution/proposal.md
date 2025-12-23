# Proposal: Add Interactive Command Execution

## Why
Current `execute_command` tool only supports "one-shot" execution, waiting for the process to exit before returning output. This prevents executing commands that require user input (stdin), such as `read` commands or confirmation prompts (e.g., `[y/N]`).

## What Changes
This proposal introduces two phases of improvements:

1.  **Phase 1: Immediate Input Support**
    - Extends `execute_command` to accept an optional `input` string, which is written to stdin immediately upon execution.

2.  **Phase 2: Interactive Session Support**
    - Introduces a new set of tools for managing long-running command sessions.
    - `start_command`: Starts a process in the background.
    - `read_output`: Reads buffered stdout/stderr from a session.
    - `write_input`: Writes to stdin of a session.
    - `stop_command`: Terminates a session.

## Impact
- **New Tools**: `start_command`, `read_output`, `write_input`, `stop_command`.
- **Modified Tools**: `execute_command` (schema update).
- **Internal State**: The server will need to manage active sessions in memory.
