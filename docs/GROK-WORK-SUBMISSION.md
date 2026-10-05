# Grok work submission

Task: GROK-COMMIT-001 ([tracker issue #57](https://github.com/tsrnc2/project-control-center/issues/57)).
Parent project: KITT. This is a consumer handoff; reusable role and skill definitions remain in LLM Reasoning.

## Operating instruction

The user has requested that Grok help produce committed work. For an explicitly assigned, eligible bounded task, carry the useful change through validation, commit, push, and draft pull request. A chat description alone does not deliver an implementation task. Preserve repository-specific model admission, ownership, review, and integration requirements; this instruction does not certify a model or override a task's eligibility floor.

Before editing, read the target repository's AGENTS.md and current task, resolve the exact base commit, and acquire the existing execution lock. Work only in the assigned files on a task branch ending in `-grok`. Read-only review assignments remain read-only; publish their findings through the approved review route.

For implementation work:
1. Inspect existing branches and PRs for the task before creating a new one.
2. Make the smallest useful change and run the checks needed to substantiate it.
3. Commit the changed files, preserving Grok authorship when known. Do not fabricate identity or verification.
4. Push the task branch and open a draft PR against the specified base.
5. Return repository, task ID, base SHA, candidate SHA, branch, PR URL, changed files, checks performed/results, and unresolved blockers.
6. Update task/blocker state and release the lock. A pushed candidate is submitted work; task DONE still requires its stated acceptance.

No force push, protected-branch write, credential publication, merge, or deployment is authorized by this handoff.

## Direct GitHub publication

Verify access from Grok's actual runtime and integration. Access available to Codex does not establish access for Grok.

For the assigned repository, the publication integration needs:
- Contents: read/write for task branch and commit publication.
- Pull requests: read/write for draft PR creation.
- Metadata: read.
- Issues: read; add write only if this same integration must maintain task/blocker threads.
- Existing coordination permissions if it must acquire and release live-branch locks.

Do not request Administration, secrets, protection bypass, or workflow modification merely to publish ordinary code. Repository selection, integration permissions, and organization approval must all permit the target operation. An account's push permission is not proof that an integration token can write.

Acceptance probe from Grok: branch from the assigned base, commit one useful scoped change, open a draft PR, and fetch the published candidate to verify its SHA. Preserve the operation and response for any failure. On HTTP 403, stop repeating the same denied request until permissions change.

## Preserve work when direct publication is blocked

If local Git is available, commit useful work locally and export a Git patch tied to the exact base. Otherwise provide the exact changed UTF-8 file contents or a unified diff and source base. Include validation commands/results and a SHA-256 digest of the handoff artifact. Place detailed reports at `<project name>/reports/grok` in the established project location.

An authorized integrator can review the patch, apply it in an isolated branch, rerun relevant checks, and submit a draft PR. Record original worker and submitting integrator separately. This is integrator publication, not proof that Grok's own connector is fixed. Preserve unavailable or failed tests honestly.

Keep private implementation patches and logs in their private project location. The public tracker carries only a sanitized status and safe evidence reference.

## Ready-to-use Grok handoff

> Continue the assigned bounded task through a useful committed candidate and draft PR. Read the current repository instructions and task state first. Do not stop after describing your work. Return the exact base and candidate commit SHAs, branch, draft PR URL, changed files, and actual validation results. If GitHub publication is denied, preserve the completed work as a base-pinned patch or exact file handoff, identify the denied operation, and return it for integrator submission. Keep the task open until its acceptance criteria are met. Do not claim publication, acceptance, merge, or deployment without receipts.

## Verification status

- Prior Grok branch-create denial: reported by the user as HTTP 403, `Resource not accessible by integration`.
- Current tracker snapshot: no Grok task assignment in live/state.json when inspected.
- This Codex session: live lock creation and task branch creation succeeded.
- Grok runtime: not connected to this session; direct publication and model/task eligibility remain unverified.
- Existing Grok implementation artifacts: none supplied in this request; no recovery or integration of those artifacts is claimed.

The next concrete result is a useful draft PR from Grok's own runtime, or a preserved candidate patch that an authorized integrator can publish. Do not mark this enablement task complete merely because this document was committed.
