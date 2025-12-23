---
name: terminal-skill
description: Best practices for executing terminal commands, specifically handling output retrieval issues in WSL.
---

# Terminal Skill

When executing the `runInTerminal` command, there are times when output cannot be obtained in WSL. In that case, please handle it as follows:

- If terminal output cannot be obtained directly, write the output to files under `.tmp/copilot` and inspect those files.
