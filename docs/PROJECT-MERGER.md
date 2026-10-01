# Project Merger

## Purpose

Project Merger is the portfolio-wide branch integration and disposition service. Its job is to continuously identify branches that should return to each repository's canonical `main` or `master`, make the merge path explicit, repair bounded blockers when authorized, and preserve branches that should remain outside the canonical branch.

The service does **not** assume that every branch should merge. A correct outcome may be a merge, a repair task, an explicit hold, or a durable decision to preserve a branch without merging it.

Project intake: https://github.com/tsrnc2/project-control-center/issues/50

## Authority boundary

Project Merger coordinates branch discovery, identity resolution, comparison, blocker decomposition, candidate preparation, review routing, and disposition records.

It never overrides repository-specific:

- test and build gates;
- code-review or independent-review requirements;
- security, release, licensing, or legal gates;
- task leases or active branch ownership;
- protected-branch policy;
- evidence binding to an exact commit SHA.

A branch is never considered merge-ready merely because it is old, ahead of main, has an open PR, or contains useful code.

## Branch disposition state machine

Every evaluated branch receives exactly one current disposition.

| State | Meaning | Required next behavior |
| --- | --- | --- |
| `MERGE_READY` | The branch is intended for canonical main/master and the exact head has satisfied all required repository gates. | Merge through the repository's normal mechanism, then verify the resulting canonical head. |
| `REPAIR_TO_MERGE` | The branch is intended for main/master but has bounded blockers. | Record blockers and create dependency-ready repair/review tasks. Re-evaluate after repair. |
| `NEEDS_IDENTITY` | Purpose, project relationship, ownership, or intended destination is unclear. | Resolve identity before modifying or merging the branch. |
| `KEEP_PERSONAL` | The branch is intentionally personal, agent-specific, scratch, or step-scoped. | Preserve it. Do not merge or delete unless its owner/promoter changes intent. |
| `KEEP_FEATURE` | The work is valuable but unsuitable for current main/master. | Preserve the branch/ref plus rationale and a re-evaluation condition. |
| `SUPERSEDED` | The work was replaced, absorbed, independently reimplemented, or already integrated through another path. | Preserve provenance and point to the successor; do not re-merge. |
| `HISTORICAL_UNMERGEABLE` | The branch is too divergent, incomplete, unsafe, obsolete, or otherwise not responsibly mergeable as a branch. | Record why. Preserve useful refs; salvage bounded changes separately if justified. |
| `HOLD` | A specific external, policy, security, legal, release, or authorization condition prevents merge. | Preserve candidate and exact resolution condition; do not bypass the hold. |

Terminal preservation states are not failures. They prevent repeated, unsafe attempts to merge work that should remain separate.

## Required branch identity record

Each evaluated branch should record:

- canonical project ID;
- repository;
- canonical target branch;
- branch name;
- head commit SHA;
- merge base or comparison base;
- ahead/behind/divergence summary;
- last commit timestamp;
- apparent author/agent/owner only when supported by evidence;
- purpose and related task/issue/PR when known;
- open/closed/merged PR relationship;
- validation state and exact tested SHA;
- review state and exact reviewed SHA;
- conflicts or blockers;
- current disposition;
- next action or terminal rationale;
- re-evaluation condition when applicable;
- decision timestamp and provenance.

Unknown identity is represented as `NEEDS_IDENTITY`; it is never guessed.

## Merge-readiness gate

Before `MERGE_READY`, the service must confirm all applicable conditions:

1. **Intent** — the branch is actually meant to integrate into the target branch.
2. **Identity** — branch purpose and project relationship are sufficiently known.
3. **Fresh comparison** — comparison is against the current canonical target.
4. **Conflict status** — conflicts are absent or have been resolved on the exact candidate.
5. **Validation** — repository-required tests/builds/checks pass on the exact candidate.
6. **Review** — required review/independence gates are satisfied on the exact candidate.
7. **Provenance** — task, candidate SHA, evidence, and important source lineage are traceable.
8. **Policy/security/release gates** — no applicable hold remains.
9. **No duplicate integration** — the same work is not already present by another branch, cherry-pick, rewrite, or successor.
10. **Post-merge verification plan** — the canonical result can be checked after integration.

If any required condition fails, the state is not `MERGE_READY`.

## Blocker decomposition

Typical `REPAIR_TO_MERGE` blockers include:

- stale base / large divergence;
- merge conflicts;
- test or build failure;
- missing exact-candidate validation;
- missing review or independent review;
- missing task/branch identity;
- incomplete provenance;
- duplicated or partially duplicated implementation;
- incompatible schema/API changes;
- missing migration path;
- security or release hold;
- abandoned dependency;
- incorrect target branch.

Repairs should be narrow. When a whole-branch merge is unsafe, prefer extracting or reimplementing the bounded valuable change, with fresh validation and provenance.

## Preservation rules

- Never delete or force-update a branch solely because it is old.
- Never equate age with obsolescence.
- Personal branches may remain indefinitely.
- Feature/experiment branches may remain valuable without belonging on main.
- Old branches may be declared `HISTORICAL_UNMERGEABLE` when that is the evidence-supported outcome.
- A branch that was independently reimplemented should be `SUPERSEDED`, not merged again.
- Closed PRs and abandoned branches still require disposition if they contain unique work.
- Terminal decisions must retain enough provenance that a later agent can understand the choice without repeating the full investigation.

## Continuous operating loop

A portfolio sweep is incremental and idempotent:

1. read the current canonical project registry and Master Project Directory;
2. enumerate canonical repositories;
3. enumerate branches and open/closed PR relationships;
4. reuse existing branch records when head SHA and relevant target state are unchanged;
5. evaluate new or changed branches;
6. create blocker/repair/review tasks for branches intended for integration;
7. process eligible candidates through repository-specific gates;
8. record merge or preservation disposition;
9. reconcile the Project Control Center and Master Project Directory;
10. run an adversarial audit for accidental history loss, duplicate integration, stale evidence, or authority bypass.

The next sweep should not re-open a terminal branch decision unless its head changes, canonical target changes materially, or its recorded re-evaluation condition fires.

## Initial backlog

- **PM-001** — define the branch inventory/disposition ledger and run a bounded pilot inventory.
- **PM-002** — enumerate canonical repositories from `projects.json` plus the Master Project Directory.
- **PM-003** — inventory branches and PR relationships repository by repository.
- **PM-004** — resolve `NEEDS_IDENTITY` branches.
- **PM-005** — decompose `REPAIR_TO_MERGE` blockers into dependency-ready tasks.
- **PM-006** — process exact candidates that become `MERGE_READY`.
- **PM-007** — write durable records for intentional non-merge dispositions.
- **PM-008** — reconcile merged and terminal states into portfolio views.
- **PM-009** — adversarial audit of history preservation, evidence freshness, and authority boundaries.
- **PM-010** — repeat sweep using change detection instead of re-triaging unchanged terminal records.
