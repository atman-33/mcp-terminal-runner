<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

<!-- SKILLPORT_START -->
## SkillPort Skills

Skills are reusable expert knowledge that help you complete tasks effectively.
Each skill contains step-by-step instructions, templates, and scripts.

### Workflow

1. **Find a skill** - Check the list below for a skill matching your task
2. **Get instructions** - Run `skillport show <skill-id>` to load full instructions
3. **Follow the instructions** - Execute the steps using your available tools

### Tips

- Skills may include scripts - execute them via the skill's path, don't read them into context
- If instructions reference `{path}`, replace it with the skill's directory path
- When uncertain, check the skill's description to confirm it matches your task

<available_skills>
<skill>
  <name>serena</name>
  <description>Provides guidelines for activating Serena projects, with specific instructions for WSL environments.</description>
</skill>
<skill>
  <name>openspec</name>
  <description>Provides guidelines for running openspec commands, especially the validate command, in non-interactive mode.</description>
</skill>
<skill>
  <name>terminal</name>
  <description>Best practices for executing terminal commands, specifically handling output retrieval issues in WSL.</description>
</skill>
<skill>
  <name>.system/skill-creator</name>
  <description>Guide for creating effective skills. This skill should be used when users want to create a new skill (or update an existing skill) that extends Codex's capabilities with specialized knowledge, workflows, or tool integrations.</description>
</skill>
<skill>
  <name>.system/skill-installer</name>
  <description>Install Codex skills into $CODEX_HOME/skills from a curated list or a GitHub repo path. Use when a user asks to list installable skills, install a curated skill, or install a skill from another repo (including private repos).</description>
</skill>
</available_skills>
<!-- SKILLPORT_END -->
