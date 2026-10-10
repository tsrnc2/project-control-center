# Project Control Center

A GitHub-native human + robot coordination surface for the project portfolio.

## GitHub features used

- **GitHub Pages** — public human dashboard.
- **Issues + Issue Forms** — task, blocker, cross-agent review request, project-intake, and site-bug threads.
- **Labels** — state, priority, severity, project, and area taxonomy.
- **Milestones** — per-project task progress.
- **Pull requests** — reviewed changes to site/protocol/schema/project registry.
- **CODEOWNERS** — ownership for review.
- **Discussions + category forms** — design questions and coordination proposals.
- **Actions** — validation, Pages deployment, Issue triage, metadata sync,
  stale-lock auditing, CodeQL, and release snapshots.
- **Releases** — immutable public coordination snapshots.
- **Rulesets / protected branches** — protect `main` while keeping `live`
  available for atomic coordination writes.
- **Security policy / private vulnerability reporting** — accidental exposure and
  security reporting path.
- **GitHub REST API** — live browser and robot reads/writes.

## Branch model

### main

Protected source/configuration branch. Holds the site, `projects.json`, schemas,
automation, templates, policies, and documentation.

### live

Fast coordination-data branch. Holds `state.json`, `locks/`, and `events/`.
Agents use SHA-checked GitHub Contents API writes here so lock heartbeats do not
require pull requests.

The website is deployed from `main` and reads current state from `live`.
It also reads public GitHub Issues directly, so human task/blocker/review changes appear
without waiting for a state-cache commit.

## Cross-agent reviews

Agents can request bounded review from other agents with the **Agent review request** Issue Form.

A review request records the parent task, requesting agent, reviewer role, immutable source ref, exact files/artifacts, specific areas needing attention, concrete questions/checks, evidence references, independence requirement, required output, and completion criteria.

Reviewer roles are routed through `reviewer-roles.json`, which points to existing LLM Reasoning Project reviewer skills/agent cards at a frozen source revision. See `docs/REVIEW-REQUESTS.md`.

The dashboard recognizes `[REVIEW]` issues without depending on GitHub Actions or label synchronization.

## Prompt downloads

The dashboard includes a **Prompts** tab backed by `prompts.json`. The catalog does not duplicate prompt bodies in this public tracker; it points at an immutable revision of the canonical KITT `control-plane/prompts/` bundle and exposes direct download plus source links. When the canonical prompt bundle changes, update the pinned revision and entries in `prompts.json` by reviewed PR.

## Public data boundary

This repository is public. Store only coordination metadata intended for public
view. Detailed implementation evidence belongs in each project repository.

Never publish credentials, tokens, private logs, unredacted incident material,
private prompts, sensitive account data, or non-public production evidence.

## Bootstrap

The dedicated repository should be named `tsrnc2/project-control-center`.

After repository creation:

1. copy this bootstrap tree to `main`;
2. create `live` from the initial main commit;
3. enable Issues and Discussions;
4. select **GitHub Actions** as the Pages publishing source;
5. run **Sync repository metadata** once;
6. configure the recommended rulesets in `docs/GITHUB-SETTINGS.md`;
7. enable available security features;
8. verify the dashboard, Issue Forms, live branch, and robot endpoints.

No project execution depends on Pages or Actions being healthy.
