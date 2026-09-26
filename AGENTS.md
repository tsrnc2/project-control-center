# Project Control Center agent protocol

This repository is the PUBLIC collaboration/control surface for the portfolio.
Never publish secrets, credentials, private logs, unredacted evidence, private
prompts, sensitive account data, or implementation details that are not
intentionally public.

## GitHub-native source-of-truth split

- `main`: protected website, schemas, project registry, automation, policies.
- GitHub Issues: canonical HUMAN task/blocker/review-request threads and notifications.
- `live`: fast machine coordination state, execution locks, and sanitized events.
- GitHub Discussions: non-task design/coordination proposals.
- GitHub Releases: immutable snapshots of public coordination state.
- Individual project repositories: implementation contracts, code, tests, and
  detailed evidence. This tracker never overrides those sources.

## Before work

1. Read `projects.json`, `live/state.json`, and relevant GitHub Issues.
2. Resolve one canonical project ID and one task ID.
3. Ensure the task has a GitHub Issue when human collaboration is useful.
4. Respect any current owner/claim recorded in live state.
5. Acquire the exclusive execution lock on the `live` branch at
   `locks/<task-id>.json`.

## Lock protocol

Acquire by creating `locks/<task-id>.json`. A create conflict means another
agent won the lock. The lock may contain only task/project IDs, agent ID, an
opaque lock token, timestamps, and a non-sensitive run reference.

Heartbeat with a SHA-checked update. A stale takeover requires verified expiry,
SHA-checked replacement, and an append-only event under `events/`. Never force
a live lock takeover. Release only after task/blocker state is updated.

## Human task/blocker/review threads

GitHub Issues are the human collaboration threads.

- Task: `type:task` plus one `state:*`, `priority:*`, and `project:*` label.
- Blocker: `type:blocker`, `state:blocked`, `severity:*`, and `project:*`.
- Review request: `type:review-request` when labels are available, or a `[REVIEW]` title prefix as the no-Actions fallback.
- Keep comments concise and sanitized. Link private evidence by safe immutable
  identifier/path; do not copy sensitive content into the public repo.
- Close the issue only when the public task/blocker is terminal.

Issue Forms are preferred for humans. Triage automation normalizes labels and
milestones, but agents must not depend on Actions being available.

## Cross-agent review protocol

Use a review request when another agent should inspect a frozen artifact, claim, design, test result, or release candidate without taking over the parent implementation task.

1. Create one `[REVIEW]` Issue using the Agent review request form or an equivalent machine-generated body.
2. Name the parent project/task and requesting agent.
3. Select one primary reviewer role from `reviewer-roles.json`. Supporting roles are optional.
4. Freeze the target with a repository plus immutable commit/tag/digest when practical.
5. Name exact files/artifacts and specific areas, symbols, line ranges, interfaces, claims, or tests needing attention.
6. State concrete review questions/checks, evidence references, exclusions, required output, independence requirement, and completion criteria.
7. The reviewer resolves the selected role from the LLM Reasoning Project source path/revision recorded in `reviewer-roles.json`.
8. Reviews are read-only by default. A reviewer may recommend or prepare remediation but must not mutate the parent task unless separately authorized.
9. When independence is required, the implementing/proposing agent must not self-review and call the result independent.
10. Close the review Issue only after the result is linked or summarized with reviewed ref, findings/evidence, unresolved items, verdict, and independence status.

Review verdicts do not grant merge/release/deployment authority and never authorize lease takeover. See `docs/REVIEW-REQUESTS.md` and `schema/review-request.schema.json`.

## live/state.json

`live/state.json` is a compact machine snapshot, not a replacement for Issues.

Writers must fetch the current blob SHA, modify only owned records, update the
snapshot timestamp, and use SHA-checked replacement. On conflict, refetch and
merge boundedly; never overwrite unrelated newer state.

The website merges live state with GitHub Issues, so Issue updates remain visible
even if the snapshot is briefly stale.

## Pull requests and main

Changes to site code, schemas, protocol, workflows, or project-registry structure
belong on a branch and should go through a pull request. Do not use the live
coordination branch as a backdoor around review.

## Blocked work

Set the public task state to BLOCKED/NO_PROGRESS as appropriate, update or create
the blocker Issue, state the exact next condition/action, then release the lock
unless a bounded retry is actively executing.

## Actions are support, not authority

Actions validate, deploy Pages, triage Issues, synchronize labels/milestones,
audit stale locks, run CodeQL, and create release snapshots. A failed or delayed
Action must never be treated as permission to steal a lock or as proof that a
project task passed or failed.

## Project intake

New durable projects are proposed with the Project Intake Issue Form. After
review, update `projects.json` on main by PR and mirror the human master
directory. Preserve aliases/history and do not move existing project roots just
to conform.

## Reports

Keep detailed project reports in the established project location:
`<project name>/reports/<agent name>`. Public tracker entries carry only the
sanitized status and safe references needed for coordination.
