---
name: serena-skill
description: Provides guidelines for activating Serena projects, with specific instructions for WSL environments.
---

# Serena Skill

- Upon project initialization, activate the current directory as a Serena project before performing any operations.
    - **WSL Environment**: When working in WSL (paths starting with `/home/...`), ALWAYS attempt to activate the project using the UNC path format first: `\\wsl$\Ubuntu<absolute_path>` (e.g., `\\wsl$\Ubuntu\home\user\repo`). Only use the standard Linux path if the UNC path fails.
