# Design: Per-invocation Working Directory (`cwd`) for `execute_command`

## Context
The MCP tool `execute_command` currently executes a parsed command (`bin` + args) in the server process working directory.
The allowlist is controlled by `ALLOWED_COMMANDS` and applies to the first token (`bin`) extracted from the `command` string.

This change introduces an optional `cwd` input parameter to select a working directory per tool call, and an optional restriction mechanism (`ALLOWED_CWD_ROOTS`) to prevent callers from targeting arbitrary paths.

## Goals
- Allow callers to run the same allowlisted command in a different working directory.
- Preserve existing behavior when `cwd` is not provided.
- Provide a simple, opt-in, defense-in-depth restriction (`ALLOWED_CWD_ROOTS`).

## Non-Goals
- Do not introduce shell parsing/operators support (e.g., `&&`, `|`).
- Do not introduce session persistence.
- Do not change the command allowlist model (`ALLOWED_COMMANDS` continues to apply to `bin`).

## Decisions
### 1) `cwd` resolution
- Interpret `cwd` as either absolute or relative.
- Resolve relative `cwd` against the server process working directory.

### 2) Canonical path validation (symlink-safe)
- Canonicalize the resolved `cwd` before validation (e.g., using realpath) so that `..` segments and symlinks cannot bypass containment checks.
- Canonicalize each configured root in `ALLOWED_CWD_ROOTS` similarly.

### 3) Containment check
- If `ALLOWED_CWD_ROOTS` is set and `cwd` is provided, allow execution only when canonical `cwd` is contained within at least one canonical root.
- Containment must be path-segment safe (avoid prefix pitfalls such as `/rootA` vs `/rootAB`).

### 4) Error behavior
- If `cwd` is provided but does not exist or cannot be resolved: return a tool error and do not execute.
- If `cwd` is outside `ALLOWED_CWD_ROOTS`: return a tool error and do not execute.
- If `cwd` is omitted: execute in the server process working directory, with no `ALLOWED_CWD_ROOTS` validation.
- If `ALLOWED_CWD_ROOTS` is set and any configured root cannot be canonicalized: treat as a configuration error and reject requests that provide `cwd`.

## Trade-offs / Risks
- Canonicalization requires filesystem access and can fail (permissions, missing paths). Rejecting execution in those cases is safer than falling back.

## Open Questions
- None.

