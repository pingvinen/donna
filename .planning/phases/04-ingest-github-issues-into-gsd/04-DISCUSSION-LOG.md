# Phase 4: Ingest GitHub issues into GSD - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-26
**Phase:** 04-ingest-github-issues-into-gsd
**Areas discussed:** Ingestion flow, Labeling & commenting, Release-time closure, Skill design

**Key context:** User clarified this is internal developer tooling for working on Donna itself, NOT a product feature for end users.

---

## Ingestion Flow

### Unclear issue handling

| Option | Description | Selected |
|--------|-------------|----------|
| Ask me inline | Use AskUserQuestion to ask developer what unclear issues mean | ✓ |
| Comment on the issue | Post clarification comment, apply 'needs-clarification' label, skip | |
| Best-effort classify | Claude classifies as best it can, developer reviews later | |

**User's choice:** Ask me inline
**Notes:** Developer is the primary audience, no need for async clarification via issue comments

### Duplicate detection

| Option | Description | Selected |
|--------|-------------|----------|
| Semantic match against pending todos | Read pending TODOs, find overlap, ask whether to skip or merge | ✓ |
| Skip duplicate detection | Always create new TODOs | |
| Auto-close duplicates | Auto-close issue if strong match found | |

**User's choice:** Semantic match against pending todos

### TODO count per issue

| Option | Description | Selected |
|--------|-------------|----------|
| Multiple TODOs allowed | Split multi-part issues into separate TODOs | ✓ |
| One TODO per issue | Keep it simple, one issue = one TODO | |

**User's choice:** Multiple TODOs allowed

### Provenance tracking

| Option | Description | Selected |
|--------|-------------|----------|
| Frontmatter field | `github_issue: 21` in YAML frontmatter | |
| Inline reference | `(ref: #21)` in TODO title/body | |
| Both | Frontmatter for machine use + inline for human readability | ✓ |

**User's choice:** Both

---

## Labeling & Commenting

### Labels to manage

| Option | Description | Selected |
|--------|-------------|----------|
| ingested + not-for-ingestion | Two labels per issue #21 spec | ✓ |
| ingested only | Just one label for processed issues | |
| More granular | Additional labels like needs-clarification, duplicate | |

**User's choice:** ingested + not-for-ingestion

### Comment format on ingested issues

| Option | Description | Selected |
|--------|-------------|----------|
| List created TODOs | Comment lists each TODO created with title | ✓ |
| Simple confirmation | Just "This issue has been ingested into GSD" | |
| You decide | Claude picks format | |

**User's choice:** List created TODOs

### Label auto-creation

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-create if missing | Use `gh label create` to ensure labels exist | ✓ |
| Expect them to exist | Fail/warn if labels missing | |

**User's choice:** Auto-create if missing

---

## Release-time Closure

### Trigger mechanism

| Option | Description | Selected |
|--------|-------------|----------|
| Manual skill invocation | Separate skill run after release | |
| Hook into release.yml | Add step to GitHub Actions release workflow | ✓ |
| Part of ingestion skill | Same skill with --release flag | |

**User's choice:** Hook into release.yml

### Provenance detection

| Option | Description | Selected |
|--------|-------------|----------|
| Scan done/ todos for github_issue frontmatter | Read done/ files, find those with github_issue field | ✓ |
| Git diff between release tags | Diff todo files between tags | |
| You decide | Claude picks approach | |

**User's choice:** Scan done/ todos for github_issue frontmatter

### Close semantics

| Option | Description | Selected |
|--------|-------------|----------|
| Match to reason | completed/not planned/duplicate based on context | ✓ |
| Always 'completed' | Simple, always close as completed | |
| You decide | Claude picks based on context | |

**User's choice:** Match to reason

### Fold todo: Comment on PRs after release

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, fold it in | Release step also comments on merged PRs with version | ✓ |
| No, keep separate | Leave as standalone TODO | |

**User's choice:** Yes, fold it in

---

## Skill Design

### Architecture

| Option | Description | Selected |
|--------|-------------|----------|
| GSD internal skill | Lives in .planning/ or dev-tools, not shipped to users | ✓ |
| Donna skill | Full stub + workflow, registered in installer | |
| Standalone script | Shell/node script, no skill framework | |

**User's choice:** GSD internal skill

### Batch mode

| Option | Description | Selected |
|--------|-------------|----------|
| Batch all | Process every open uninigested issue in one invocation | ✓ |
| One at a time | One issue per invocation | |
| Batch with confirmation | Show all, let user confirm/deselect | |

**User's choice:** Batch all

### Skill name prefix

| Option | Description | Selected |
|--------|-------------|----------|
| donna: prefix | donna:ingest-issues | |
| gsd-custom: prefix | gsd-custom:ingest-issues | ✓ |
| You decide | Claude picks | |

**User's choice:** gsd-custom: prefix

---

## Claude's Discretion

- Comment formatting details (exact markdown structure)
- Bug vs feature vs neither classification heuristics
- GSD TODO file naming convention alignment
- Release workflow step placement within release.yml

## Deferred Ideas

None — discussion stayed within phase scope
