# Tasks: Interactive Execution

## Phase 1: Immediate Input
- [x] Fix OS detection to avoid using `wsl` wrapper when running natively on Linux/WSL <!-- id: 9 -->
- [x] Update `execute_command` schema to include optional `input` field <!-- id: 0 -->
- [x] Implement stdin writing in `execute_command` implementation <!-- id: 1 -->
- [x] Add tests for `execute_command` with input (e.g., piping text to `cat` or `grep`) <!-- id: 2 -->

## Phase 2: Session Infrastructure
- [x] Create `SessionManager` class to hold active processes <!-- id: 3 -->
- [x] Implement `start_command` tool <!-- id: 4 -->
- [x] Implement `read_output` tool with buffering logic <!-- id: 5 -->
- [x] Implement `write_input` tool <!-- id: 6 -->
- [x] Implement `stop_command` tool <!-- id: 7 -->
- [x] Add integration tests for full interactive flow (start -> read -> write -> read -> stop) <!-- id: 8 -->
