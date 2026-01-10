## 1. Specification
- [ ] 1.1 Add/modify requirements in `specs/execution/spec.md` delta
- [ ] 1.2 Confirm default timeout value and timeout error semantics

## 2. Implementation
- [ ] 2.1 Add `timeout_ms` parameter to `execute_command` tool schema
- [ ] 2.2 Implement timeout-aware process runner (kill on timeout)
- [ ] 2.3 Add new `execute_process` tool (argv-based execution)
- [ ] 2.4 Apply allowlist rules to `execute_process` (`file` must be allowed)
- [ ] 2.5 Update tool registration and exports

## 3. Tests
- [ ] 3.1 Add test: `execute_command` times out and returns error
- [ ] 3.2 Add test: `execute_process` runs argv-based command successfully
- [ ] 3.3 Add test: `execute_process` rejects disallowed `file`

## 4. Quality
- [ ] 4.1 Run unit tests (Vitest)
- [ ] 4.2 Run `npx ultracite check`
