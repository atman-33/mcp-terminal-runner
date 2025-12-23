# execution Specification Deltas

## MODIFIED Requirements

### Requirement: Execute Shell Commands

**Modification**: The tool description MUST be updated.
- It MUST explicitly state that this tool is **ONLY** for non-interactive commands.
- It MUST warn that interactive commands are not supported.

**Modification**: Error handling for `ENOENT` MUST be enhanced.
- If the command execution fails with `ENOENT`, the error message returned to the client MUST include a hint: "Note: This tool does not support interactive commands. Ensure the command is non-interactive and the executable exists."

#### Scenario: ENOENT Error Hint
- **GIVEN** the server is running
- **WHEN** the client calls `execute_command` with a command that triggers `ENOENT` (e.g., a non-existent command or problematic interactive invocation)
- **THEN** the server returns an error
- **AND** the error message contains "Note: This tool does not support interactive commands"
