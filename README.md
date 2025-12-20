# MCP Terminal Runner

An MCP server that allows AI agents to execute terminal commands on the host system.

## Features

- **Execute Command**: Run shell commands and retrieve stdout, stderr, and exit code.
- **Security**: Strict allowlist system via `ALLOWED_COMMANDS` environment variable.
- **Cross-Platform**: Works on Linux, macOS, and Windows (via `tinyexec`).

## Installation

### Prerequisites

- Node.js (version 18 or higher)
- npm or yarn

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd mcp-terminal-runner
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

## Configuration

### Security: Allowed Commands

For security reasons, this server requires an explicit list of allowed commands. This is configured via the `ALLOWED_COMMANDS` environment variable.

- **Format**: Comma-separated list of command binaries (e.g., `ls,cat,echo`).
- **Wildcard**: Set to `*` to allow ALL commands (⚠️ **DANGEROUS**: Only use in trusted environments).

## Usage

### MCP Client Configuration

Add the following to your MCP client configuration (e.g., VS Code `settings.json`):

```json
{
  "mcpServers": {
    "terminal-runner": {
      "command": "node",
      "args": ["/path/to/mcp-terminal-runner/dist/index.js"],
      "env": {
        "ALLOWED_COMMANDS": "ls,cat,grep,echo"
      }
    }
  }
}
```

### Available Tools

#### `execute_command`
Executes a shell command.

- **Input**:
  - `command` (string): The full command string to execute (e.g., `ls -la src`).
- **Output**:
  - Returns a YAML-formatted string containing:
    - `exit_code`: The command's exit code.
    - `stdout`: Standard output.
    - `stderr`: Standard error.

## Development

### Available Scripts

- `npm run build` - Build the TypeScript project
- `npm run dev` - Run in development mode
- `npm start` - Run the built JavaScript version
- `npm run check` - Check code with Ultracite
- `npm test` - Run tests with Vitest

### Project Structure

```
mcp-terminal-runner/
├── src/
│   └── index.ts          # Main server implementation
├── dist/                 # Built JavaScript files
├── .husky/              # Git hooks
├── biome.json           # Biome configuration
├── tsconfig.json        # TypeScript configuration
├── package.json         # Project dependencies and scripts
└── README.md           # This file
```

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `npm run quality` to ensure code quality
5. Commit your changes (Husky will run pre-commit hooks)
6. Push to your branch
7. Create a Pull Request

## Troubleshooting

### Common Issues

1. **Server not starting**: Ensure all dependencies are installed and the project is built
2. **Tools not appearing**: Check that the MCP client configuration points to the correct path
3. **Permission errors**: Make sure the built JavaScript file has execute permissions

### Debug Mode

To enable debug logging, set the environment variable:
```bash
DEBUG=mcp* npm start
```