# Project Context

## Purpose
This project aims to build a Model Context Protocol (MCP) server that allows AI agents to execute terminal commands and retrieve their output. It serves as a bridge between AI agents and the local shell environment, enabling agents to perform system operations via a controlled interface.

## Tech Stack
- **Language:** TypeScript
- **Runtime:** Node.js
- **Core Library:** @modelcontextprotocol/sdk
- **Validation:** Zod
- **Testing:** Vitest
- **Linting & Formatting:** Biome, Ultracite

## Project Conventions

### Code Style
- Follows TypeScript best practices.
- Code formatting and linting are enforced by Biome and Ultracite.
- Run `npm run check` and `npm run fix` to maintain code quality.

### Architecture Patterns
- **MCP Server:** Implements the Model Context Protocol server specification.
- **Transport:** Uses StdioServerTransport for communication.
- **Tools:** Exposes capabilities as MCP Tools (e.g., command execution).

### Testing Strategy
- Unit tests using Vitest.
- Run tests with `npm test`.

### Git Workflow
- Main branch: `main`
- Feature branches for new development.

## Domain Context
- **MCP (Model Context Protocol):** A standard for connecting AI models to external tools and context.
- **Terminal Execution:** The core domain is safely executing shell commands and capturing stdout/stderr/exit codes.

## Important Constraints
- Security: Arbitrary command execution poses risks. Implementation should consider security implications.
- Platform: Initially targeting Linux/Unix-like environments.

## External Dependencies
- Node.js runtime environment.
