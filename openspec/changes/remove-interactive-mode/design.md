# Design: Remove Interactive Mode

## Problem
The interactive session management (using `spawn` with persistent streams) fails with `ENOENT` in WSL environments. This suggests fundamental compatibility issues with how Node.js `spawn` interacts with WSL's process management or file system for certain interactive workflows.

## Solution
Simplify the architecture by removing the stateful session manager and all associated tools. The server will revert to a stateless request-response model using `execute_command`.

## Error Handling Strategy
When `execute_command` fails with `ENOENT`, it typically means the command executable was not found. However, in the context of this regression, the user has observed this error linked to interactive mode attempts.
Therefore, we will wrap the `ENOENT` error to include a hint:
"Command not found (ENOENT). Note: This tool does not support interactive commands. Ensure the command is non-interactive and the executable exists."

## Impact
- **Capabilities**: Agents will no longer be able to run REPLs or long-running interactive processes.
- **Stability**: Significant improvement in stability for WSL users.
