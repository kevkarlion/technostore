# Skill Registry

**Delegator use only.** Any agent that launches sub-agents reads this registry to resolve compact rules, then injects them directly into sub-agent prompts. Sub-agents do NOT read this registry or individual SKILL.md files.

See `_shared/skill-resolver.md` for the full resolution protocol.

**Updated**: 2026-05-11

## User Skills

| Trigger | Skill | Path |
|---------|-------|------|
| When creating a pull request, opening a PR, or preparing changes for review | branch-pr | /home/kriq/.config/opencode/skills/branch-pr/SKILL.md |
| When writing Go tests, using teatest, or adding test coverage | go-testing | /home/kriq/.config/opencode/skills/go-testing/SKILL.md |
| When creating a GitHub issue, reporting a bug, or requesting a feature | issue-creation | /home/kriq/.config/opencode/skills/issue-creation/SKILL.md |
| When user says "judgment day", "judgment-day", "review adversarial", "dual review", "doble review", "juzgar", "que lo juzguen" | judgment-day | /home/kriq/.config/opencode/skills/judgment-day/SKILL.md |
| When user wants to initialize SDD in a project, or says "sdd init", "iniciar sdd", "openspec init" | sdd-init | /home/kriq/.config/opencode/skills/sdd-init/SKILL.md |
| When writing documentation, guides, READMEs, RFCs, or architecture docs | cognitive-doc-design | /home/kriq/.config/opencode/skills/cognitive-doc-design/SKILL.md |
| When writing collaboration comments, PR feedback, or issue replies | comment-writer | /home/kriq/.config/opencode/skills/comment-writer/SKILL.md |
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
| When PR exceeds 400 lines, is a stacked PR, or needs review slicing | chained-pr | /home/kriq/.config/opencode/skills/chained-pr/SKILL.md |
| When orchestrator walks user through full SDD workflow on real codebase | sdd-onboard | /home/kriq/.config/opencode/skills/sdd-onboard/SKILL.md |
| When planning commits, splitting changes, or organizing work units | work-unit-commits | /home/kriq/.config/opencode/skills/work-unit-commits/SKILL.md |

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

### sdd-init
- Detect stack, test runner, linter, type checker from project files
- Mode `engram`: save to Engram only (no openspec/)
- Mode `openspec`: create openspec/bootstrap files
- Mode `hybrid`: both Engram and openspec
- Strict TDD: enabled if test runner exists, disabled if no runner
- Always build `.atl/skill-registry.md`; persist to Engram when available

### sdd-explore
- Do NOT create files or branches
- Call mem_save with discovered context only
- Use mem_search for prior knowledge on the topic
- Summarize findings; do not prescribe solutions
- Return a compact memo, not a spec

### sdd-propose
- Check mem_search for existing proposal on same change
- If no change name provided, derive from intent
- Propose scope, approach, and success criteria
- Propose a change name that fits `^[a-z0-9-]+$`
- Return: proposal artifact saved to Engram, next `sdd-spec` step

### sdd-spec
- Check mem_search for prior work
- Include: summary, requirements, acceptance criteria, scenarios
- Cover happy path, edge cases, and error cases
- Reference design constraints from sdd-design if available
- Return: spec artifact saved to Engram, next `sdd-tasks` step

### sdd-design
- Check mem_search for prior design work
- Include: architecture diagram, API contracts, data model, component map
- Cover cross-cutting concerns: error handling, observability, perf
- Reference specs, not invent new requirements
- Return: design artifact saved to Engel, next `sdd-tasks` step

### sdd-tasks
- Check mem_search for prior task plans
- Generate implementation tasks as a flat list or grouped list
- Label each task with: type (code, test, docs, config, chore), estimated complexity
- Include rollback tasks for risky changes
- Reference specs and design, do not invent requirements
- Return: tasks artifact saved to Engram, next `sdd-apply` step

### sdd-apply
- Read tasks from Engram via mem_search + mem_get_observation
- Run one task or a batch of independent tasks
- Save apply-progress to Engram after each batch
- Stop after 1-2 hours or 3-5 tasks, whichever comes first
- Never build (npm run build) unless user explicitly asks
- Return: progress artifact saved, pending tasks, optional stop reason

### sdd-verify
- Read tasks from Engram via mem_search + mem_get_observation
- Execute test commands from openspec/config.yaml testing section
- Run linter (npm run lint) and type checker (npx tsc --noEmit)
- For E2E: confirm Playwright tests exist and can be run
- For manual verification: list specific pages to test, expected outcomes
- Return: verify-report artifact saved, pass/fail per task

### sdd-archive
- Check openspec/config.yaml for previous phases
- Generate delta specs by comparing current code with spec artifacts
- Write each change's delta to `openspec/specs/DELTA-{change}.md`
- Sync openspec/config.yaml with any new phases
- Return: archive-report artifact saved, lineage of observation IDs

### skill-creator
- Follow Agent Skills specification format
- Include frontmatter with name, description, trigger, version
- Document Critical Patterns and Rules sections
- Write SKILL.md with clear instructions

### skill-registry
- Scan user skills in known skill directories
- Scan project skills in known project skill directories
- Skip sdd-*, _shared, skill-registry skills
- Read SKILL.md for each skill; focus on frontmatter + rules if >200 lines
- Extract name, trigger, path, compact rules (5-15 actionable lines)
- Build `.atl/skill-registry.md` from collected data

### cognitive-doc-design
- Write docs that reduce cognitive load — clarity over completeness
- Use progressive disclosure: summary first, details second
- Include actionable steps, not just explanations
- Design for the reader's goal, not the writer's convenience

### comment-writer
- Be warm but direct — acknowledge what's good, flag what's wrong
- Explain the WHY behind suggestions, not just the what
- Offer alternatives with tradeoffs when relevant
- Match the reader's language (Spanish/English)

### chained-pr
- Split changes >400 lines into reviewable units
- Each PR in the chain should be independently valid
- Use clear "depends on" relationships in PR description
- Final PR in chain merges last

### sdd-onboard
- Walk user through the full SDD cycle
- Use sdd-propose, sdd-spec, sdd-design, sdd-tasks, sdd-apply, sdd-verify in order
- Verify each phase before moving to the next
- End with sdd-archive after full completion

### work-unit-commits
- One concern per commit — no mixing features with refactors
- Keep commits atomic and reviewable in isolation
- Include tests with code, not separately
- Write imperative commit messages: "Add X" not "Added X"

## Project Conventions

| File | Path | Notes |
|------|------|-------|
| Architecture doc | src/README_ARCHITECTURE.md | Folder structure and responsibilities |
| README | README.md | Project readme |

No convention index files (AGENTS.md, .cursorrules, CLAUDE.md) found in project root.

## Project Stack

- **Framework**: Next.js 16.1.6 + React 19.2.3 (App Router)
- **State**: Zustand 5.0.11
- **Data**: MongoDB (native driver, no Mongoose)
- **Forms**: react-hook-form + zod + @hookform/resolvers
- **Images**: Cloudinary
- **Styling**: Tailwind CSS
- **Scraping**: Cheerio + Playwright (scrape-cat-*.ts scripts)
- **TypeScript**: strict mode enabled

## Testing Capabilities

**Strict TDD Mode**: `false`
**Reason**: No test runner in package.json scripts.

| Layer | Available | Tool |
|-------|-----------|------|
| Unit | ❌ | — |
| Integration | ❌ | — |
| E2E | ✅ | Playwright |
| Coverage | ❌ | — |

Quality tools: ESLint ✅, TypeScript ✅, Formatter ❌