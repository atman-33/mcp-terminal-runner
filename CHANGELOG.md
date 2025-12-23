# 📦 Changelog

---

## v0.4.0 2025-12-23

### Added

- remove interactive mode support and related tests
- make cwd parameter mandatory for command execution tools

### Changed

- feature/remove-interactive-mode
- remove interactive mode support and update documentation
- remove interactive command session support from documentation
- Merge remote-tracking branch 'origin/main' into feature/remove-interactive-mode
- remove interactive mode support due to WSL compatibility issues
- implement interactive command execution with session management
- Add comprehensive skill creation guide and initialization scripts
- feature/cwd-not-optional
- add inspector script for enhanced command execution
- add interactive command execution support with session management
- Merge pull request #13 from atman-33/version-bump/v0.3.0

## v0.3.0 2025-12-23

### Added

- enhance README with details on interactive command tools and usage
- implement session management and command execution tools
- implement interactive command session management with start_command and read_output tools

### Changed

- feature/session-commands
- add interactive command execution support with session management
- add support for optional working directory (`cwd`) in `execute_command`
- add .serena to .gitignore
- Merge pull request #11 from atman-33/version-bump/v0.2.2

## v0.2.2 2025-12-22

### Changed

- fix/auto-detect-wsl-cwd
- Merge pull request #9 from atman-33/version-bump/v0.2.1

### Fixed

- add newline at end of package.json
- auto-detect WSL cwd when not provided

## v0.2.1 2025-12-22

### Changed

- Merge pull request #8 from atman-33/fix/execution-enoent
- Merge pull request #7 from atman-33/version-bump/v0.2.0

### Fixed

- execute commands correctly with shell: true

## v0.2.0 2025-12-22

### Changed

- fix/enable-shell-execution
- update README to reflect shell execution support
- Merge pull request #5 from atman-33/version-bump/v0.1.2

### Fixed

- enable shell execution for commands

## v0.1.2 2025-12-21

### Added

- auto-detect and use WSL for Linux paths on Windows

### Changed

- feature/wsl-support
- Merge pull request #3 from atman-33/version-bump/v0.1.1

### Fixed

- add newline at end of package.json

## v0.1.1 2025-12-21

### Changed

- bug-fix/enoent-error

### Fixed

- use cross-spawn to handle command execution

## v0.1.0

- Initial implementation.
