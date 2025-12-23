---
name: openspec-skill
description: Provides guidelines for running openspec commands, especially the validate command, in non-interactive mode.
---

# OpenSpec Skill

When executing `openspec` commands via the MCP server, commands that require interactive mode may fail.
In particular, `openspec validate` and `openspec validate --strict` require interactive selection and are not suitable for execution via MCP.

Instead, please use the following non-interactive commands:

- `openspec validate --all`
  - Validates all changes and specs.
- `openspec validate --changes`
  - Validates only change proposals.
- `openspec validate --specs`
  - Validates only specs.
- `openspec validate <item-name>`
  - Validates a specific item (change or spec name).

By using these flags, you can avoid interactive mode and execute validation successfully.