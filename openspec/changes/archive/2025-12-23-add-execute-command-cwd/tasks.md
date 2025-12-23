# Tasks: Add `cwd` Support to `execute_command`

- [ ] Add `cwd?: string` to the tool input schema in `src/index.ts` <!-- id: 0 -->
- [ ] Implement `cwd` resolution and existence validation; reject non-existent directories <!-- id: 1 -->
- [ ] Implement optional `ALLOWED_CWD_ROOTS` restriction with canonical path containment checks <!-- id: 2 -->
- [ ] Add unit tests for relative/absolute `cwd`, non-existent `cwd`, and root restriction behavior <!-- id: 3 -->
- [ ] Update documentation (README) to describe `cwd` and `ALLOWED_CWD_ROOTS` <!-- id: 4 -->
- [ ] Run `npm test` and `npm run check` <!-- id: 5 -->
