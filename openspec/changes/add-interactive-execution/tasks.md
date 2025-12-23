# Tasks: Interactive Execution

## Phase 1: Immediate Input
- [ ] Fix OS detection to avoid using `wsl` wrapper when running natively on Linux/WSL <!-- id: 9 -->
- [ ] Update `execute_command` schema to include optional `input` field <!-- id: 0 -->
- [ ] Implement stdin writing in `execute_command` implementation <!-- id: 1 -->
- [ ] Add tests for `execute_command` with input (e.g., piping text to `cat` or `grep`) <!-- id: 2 -->

## Phase 2: Session Infrastructure
- [ ] Create `SessionManager` class to hold active processes <!-- id: 3 -->
- [ ] Implement `start_command` tool <!-- id: 4 -->
- [ ] Implement `read_output` tool with buffering logic <!-- id: 5 -->
- [ ] Implement `write_input` tool <!-- id: 6 -->
- [ ] Implement `stop_command` tool <!-- id: 7 -->
- [ ] Add integration tests for full interactive flow (start -> read -> write -> read -> stop) <!-- id: 8 -->
