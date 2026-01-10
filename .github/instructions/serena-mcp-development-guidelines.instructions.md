---
name: Serena MCP Development Guidelines
description: Guidelines for using Serena MCP tools in code investigation and implementation, including WSL environment handling for project activation
applyTo: '**'
---

# Development Guidelines

## Serena MCP Integration

### Code Investigation and Implementation
When investigating or implementing code, always use Serena MCP tools for efficient semantic code navigation and manipulation.

### Project Activation
When Serena MCP is available, you must activate the project before performing any code operations.

### WSL Environment Handling
When activating Serena MCP, check the environment to determine if you are in WSL, and pay special attention to path handling:

#### WSL Environment Strategy
If you are operating in a WSL environment (paths starting with `/home/...`):
1. **Primary Method**: Attempt activation using the UNC path format:
   `\\wsl$\Ubuntu<absolute_path>`
   (e.g., `\\wsl$\Ubuntu\home\user\repo`)
2. **Fallback**: Use the standard Linux path only if the UNC path activation fails.