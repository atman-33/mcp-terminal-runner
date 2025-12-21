# Design: Terminal Command Execution

## Architecture
The solution follows the standard MCP server architecture using the TypeScript SDK.

### Components
1.  **Server Instance:** An instance of `McpServer` configured with name and version.
2.  **Transport:** `StdioServerTransport` for communication over stdio.
3.  **Tool Definition:** A tool named `execute_command` registered on the server.
4.  **Execution Logic:**
    -   Input: `command` string.
    -   Validation: Check against `ALLOWED_COMMANDS` environment variable.
    -   Parsing: Use `args-tokenizer` to split the command string.
    -   Execution: Use `node:child_process` to run the command.
    -   Output: JSON object containing `exit_code`, `stdout`, and `stderr`.

## Data Flow
1.  Client sends `call_tool` request for `execute_command`.
2.  Server validates the requested command against the allowlist.
3.  If allowed, Server executes the command.
4.  Server captures output and returns it as a text content block in the MCP response.
5.  If execution fails or command is not allowed, an error is returned.

## Security Considerations
-   **Allowlist:** `ALLOWED_COMMANDS` env var controls which binaries can be executed.
-   **Wildcard:** `*` allows all commands (use with caution).
-   **Input Sanitization:** `args-tokenizer` helps in parsing, and execution uses Node's built-in process spawning.

## Dependencies
-   `@modelcontextprotocol/sdk`
-   `args-tokenizer`
-   `zod`
-   `js-yaml` (for formatting output as per reference, though JSON might be sufficient, we'll stick to reference for now or decide in implementation) -> Reference uses `dump` from `js-yaml` to format the result text.
