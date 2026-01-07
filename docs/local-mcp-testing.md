# Local MCP Testing (VS Code)

This repository publishes an MCP server (`mcp-terminal-runner`) that can be started via `npx`. When developing locally, you may want to test changes immediately without publishing to npm.

This document describes how to configure VS Code to run the **local built server** (`dist/index.js`) directly.

## Prerequisites

- Node.js 18+
- Dependencies installed: `npm install`
- Build output available: `npm run build` (produces `dist/index.js`)

## Recommended: Workspace MCP config

Create (or edit) a workspace MCP config at `.vscode/mcp.json` and add a local server entry.

### WSL path (Windows + WSL)

If VS Code runs on Windows but your repository is in WSL, point `args` to the WSL UNC path:

```jsonc
{
  "servers": {
    "terminal-runner-local": {
      "command": "node",
      "args": [
        "\\\\wsl$\\<WSL-DISTRO>\\home\\<WSL-USER>\\repos\\mcp-terminal-runner\\dist\\index.js"
      ],
      "env": {
        "ALLOWED_COMMANDS": "*"
      },
      "type": "stdio"
    }
  }
}
```

Notes:
- The string contains double escaping for JSON.
- `ALLOWED_COMMANDS: "*"` is convenient for local testing but **unsafe** in untrusted environments.
- Replace `<WSL-DISTRO>` (e.g. `Ubuntu`) and `<WSL-USER>` with your environment.
- To discover your WSL path, run `pwd` inside WSL and convert it to a Windows path with `wslpath -w "$(pwd)"`.

### Native Linux/macOS

If VS Code runs on Linux/macOS (and the repo is on the same filesystem), you can usually use a normal path:

```jsonc
{
  "servers": {
    "terminal-runner-local": {
      "command": "node",
      "args": [
        "/home/<user>/repos/mcp-terminal-runner/dist/index.js"
      ],
      "env": {
        "ALLOWED_COMMANDS": "*"
      },
      "type": "stdio"
    }
  }
}
```

## Workflow

1. Build the server:
   - `npm run build`
2. Restart/reload VS Code so the MCP server is restarted with the new config and latest `dist/`:
   - Use “Developer: Reload Window” if you suspect the old process is still running.
3. Run your MCP tool calls (e.g. `execute_command`) against `terminal-runner-local`.

## Troubleshooting

- If changes don’t appear:
  - Ensure you re-ran `npm run build`.
  - Ensure VS Code actually restarted the MCP server (reload window).
- If a command works in a terminal but fails via MCP:
  - Check `ALLOWED_COMMANDS` (and `ALLOWED_CWD_ROOTS` if you use it).
  - Remember `execute_command` is intended for non-interactive, short-lived commands.
