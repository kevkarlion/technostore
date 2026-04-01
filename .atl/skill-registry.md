# Skill Registry

**Delegator use only.** Any agent that launches sub-agents reads this registry to resolve compact rules, then injects them directly into sub-agent prompts. Sub-agents do NOT read this registry or individual SKILL.md files.

See `_shared/skill-resolver.md` for the full resolution protocol.

## User Skills

| Trigger | Skill | Path |
|---------|-------|------|
| When creating a pull request, opening a PR, or preparing changes for review | branch-pr | /home/kriq/.config/opencode/skills/branch-pr/SKILL.md |
| When writing Go tests, using teatest, or adding test coverage | go-testing | /home/kriq/.config/opencode/skills/go-testing/SKILL.md |
| When creating a GitHub issue, reporting a bug, or requesting a feature | issue-creation | /home/kriq/.config/opencode/skills/issue-creation/SKILL.md |
| When user says "judgment day", "judgment-day", "review adversarial", "dual review", "doble review", "juzgar", "que lo juzguen" | judgment-day | /home/kriq/.config/opencode/skills/judgment-day/SKILL.md |
| When user wants to initialize SDD in a project, or says "sdd init", "iniciar sdd", "openspec init" | sdd-init | /home/kriq/.config/opencode/skills/sdd-init/SKILL.md |
| When orchestrator launches you to implement one or more tasks from a change | sdd-apply | /home/kriq/.config/opencode/skills/sdd-apply/SKILL.md |
| When orchestrator launches you to archive a change after implementation and verification | sdd-archive | /home/kriq/.config/opencode/skills/sdd-archive/SKILL.md |
| When orchestrator launches you to write or update the technical design for a change | sdd-design | /home/kriq/.config/opencode/skills/sdd-design/SKILL.md |
| When orchestrator launches you to think through a feature, investigate the codebase, or clarify requirements | sdd-explore | /home/kriq/.config/opencode/skills/sdd-explore/SKILL.md |
| When orchestrator launches you to create or update a proposal for a change | sdd-propose | /home/kriq/.config/opencode/skills/sdd-propose/SKILL.md |
| When orchestrator launches you to write or update specs for a change | sdd-spec | /home/kriq/.config/opencode/skills/sdd-spec/SKILL.md |
| When orchestrator launches you to create or update the task breakdown for a change | sdd-tasks | /home/kriq/.config/opencode/skills/sdd-tasks/SKILL.md |
| When orchestrator launches you to verify a completed (or partially completed) change | sdd-verify | /home/kriq/.config/opencode/skills/sdd-verify/SKILL.md |
| When user asks to create a new skill, add agent instructions, or document patterns for AI | skill-creator | /home/kriq/.config/opencode/skills/skill-creator/SKILL.md |
| When user says "update skills", "skill registry", "actualizar skills", "update registry", or after installing/removing skills | skill-registry | /home/kriq/.config/opencode/skills/skill-registry/SKILL.md |

## Compact Rules

Pre-digested rules per skill. Delegators copy matching blocks into sub-agent prompts as `## Project Standards (auto-resolved)`.

### branch-pr
- Every PR MUST link an approved issue — no exceptions
- Every PR MUST have exactly one `type:*` label
- Automated checks must pass before merge is possible
- Blank PRs without issue linkage will be blocked by GitHub Actions
- Branch names MUST match regex: `^(feat|fix|chore|docs|style|refactor|perf|test|build|ci|revert)\/[a-z0-9._-]+$`

### go-testing
- Use table-driven tests for multiple test cases
- Use `testing.B` for benchmarks
- Use `t.Cleanup()` for resource cleanup
- Use golden file testing for complex outputs
- For Bubbletea TUI: use teatest for programmatic interaction

### issue-creation
- Blank issues are disabled — MUST use a template (bug report or feature request)
- Every issue gets `status:needs-review` automatically on creation
- A maintainer MUST add `status:approved` before any PR can be opened
- Questions go to Discussions, not issues

### judgment-day
- Launch TWO sub-agents via delegate (async, parallel)
- Each agent receives same target but works independently
- Neither agent knows about the other — no cross-contamination
- Use Skill Resolver Protocol before launching judges
- After 2 iterations without both passing, escalate

### sdd-init (skipped - SDD workflow skill)

### sdd-apply (skipped - SDD workflow skill)

### sdd-archive (skipped - SDD workflow skill)

### sdd-design (skipped - SDD workflow skill)

### sdd-explore (skipped - SDD workflow skill)

### sdd-propose (skipped - SDD workflow skill)

### sdd-spec (skipped - SDD workflow skill)

### sdd-tasks (skipped - SDD workflow skill)

### sdd-verify (skipped - SDD workflow skill)

### skill-creator
- Follow Agent Skills specification format
- Include frontmatter with name, description, trigger, version
- Document Critical Patterns and Rules sections
- Write SKILL.md with clear instructions

### skill-registry (skipped - this skill)

## Project Conventions

| File | Path | Notes |
|------|------|-------|
| Architecture doc | /home/kriq/mis-proyectos/TechnoStore/app/src/README_ARCHITECTURE.md | Folder structure and responsibilities |
| README | /home/kriq/mis-proyectos/TechnoStore/app/README.md | Project readme |

No convention index files (AGENTS.md, .cursorrules, CLAUDE.md) found in project root.