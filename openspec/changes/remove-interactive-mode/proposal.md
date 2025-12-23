# Remove Interactive Mode Support

## Summary
Remove interactive session capabilities (`start_command`, `read_output`, `write_input`, `stop_command`) and restrict the server to `execute_command` only. This change is necessary due to `ENOENT` errors and instability when using interactive mode in WSL environments.

## Motivation
The current interactive mode implementation encounters `ENOENT` errors when running in WSL, making it unreliable. To ensure stability and reliability, we will remove the interactive session features and focus solely on non-interactive command execution.

## Proposed Changes
1.  **Remove Session Tools**: Delete `start_command`, `read_output`, `write_input`, and `stop_command` tools.
2.  **Update `execute_command`**:
    - Update the tool description to explicitly state it is for non-interactive use only.
    - Enhance error handling to provide helpful hints if `ENOENT` occurs, suggesting that the error might be due to attempting an interactive command or a missing executable.
3.  **Documentation**: Update `README.md` to reflect the removal of interactive mode and the limitation to non-interactive commands.
