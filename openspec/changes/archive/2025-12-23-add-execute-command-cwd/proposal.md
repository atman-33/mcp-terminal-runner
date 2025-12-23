# Proposal: Add `cwd` Support to `execute_command`

## Goal
Allow callers of the `execute_command` MCP tool to specify a working directory per invocation via an optional `cwd` input parameter.

## Why
- Agents often need to run the same allowlisted binary (e.g., `npm`, `pnpm`, `git`) in different project subdirectories.
- Requiring callers to express directory changes via shell builtins (e.g., `cd`) is brittle and can conflict with security constraints.
- An explicit `cwd` parameter is clearer, more composable, and easier to validate.

## What Changes
- Extend the `execute_command` tool input schema to accept an optional `cwd: string`.
- When `cwd` is provided, execute the command with the process working directory set to that resolved directory.
- Return an error (and do not execute the command) when `cwd` does not exist.
- Add an optional security control `ALLOWED_CWD_ROOTS` to restrict which directories may be used as `cwd`.
  - If unset/empty: no `cwd` restriction (existing security behavior remains driven by `ALLOWED_COMMANDS`).
  - If set: reject any `cwd` outside the configured roots after canonical path resolution.
  - If set and any configured root cannot be canonicalized (e.g., does not exist): treat as a configuration error and reject requests that provide `cwd`.

## Compatibility
- Backward compatible: behavior is unchanged when `cwd` is omitted.
- `ALLOWED_CWD_ROOTS` is opt-in and does not affect existing users unless configured.

## Impact
- Specs: add delta in `execution`.
- Code (apply stage): `src/index.ts` tool schema + execution logic; `src/index.test.ts` new tests.
- Docs (apply stage): README update to document `cwd` and `ALLOWED_CWD_ROOTS`.

## Risks
- **Security:** Incorrect path resolution/containment checks could allow bypass (e.g., via symlinks). The design requires canonical path checks.
- **Portability:** Path behavior varies across OSs. Initial focus remains Linux/Unix-like environments (consistent with project context).
