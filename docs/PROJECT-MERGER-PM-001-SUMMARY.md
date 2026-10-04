# Project Merger PM-001 — Sanitized Pilot Summary

Status: COMPLETE for the bounded five-project pilot.

## Scope

PM-001 inventoried the first five accessible canonical project repositories, deduplicating child projects that share a canonical repository. Exact branch names, private repository refs, commit SHAs, and branch comparisons are intentionally kept out of this public repository.

The detailed private ledger is stored under the established Drive path:

`Project Merger/reports/chatgpt/`

## Results

- 545 branches were present in the initial five-repository enumeration, including five canonical target branches.
- 540 initial candidate branches were conservatively classified:
  - 39 `REPAIR_TO_MERGE`
  - 93 `SUPERSEDED`
  - 398 `NEEDS_IDENTITY`
  - 10 `KEEP_FEATURE`
- One additional candidate appeared during the live run, so 541 candidate branches / 546 total branches were observed across the execution window.
- 40 active canonical-target integration paths were observed after that delta.
- Frozen-baseline comparison of those active paths found:
  - 10 strictly ahead of their canonical target with no behind commits;
  - 30 diverged from their frozen canonical target.
- No branch was assigned `MERGE_READY` from inventory evidence alone.
- No branch was declared `HISTORICAL_UNMERGEABLE` based only on age or naming.
- `KEEP_PERSONAL` was not inferred solely from agent/machine naming; ambiguous identity remains `NEEDS_IDENTITY`.

## Concurrency finding

At least one canonical target advanced during the pilot. The pilot therefore corrected its actionable comparisons by freezing an exact target revision and comparing exact PR-head revisions against that frozen target.

Future sweeps must use the same frozen-target / exact-head rule. A comparison against a moving branch name is not durable evidence.

## Downstream gates

Six private-repository follow-up gates were created:

- one bounded stale-main repair/revalidation task for the freshest active integration path;
- four exact-head acceptance/review gates for structurally clean non-draft candidates;
- one expert disposition review for a highly divergent archived branch, with whole-branch automatic merge explicitly prohibited pending a KEEP / HISTORICAL_UNMERGEABLE / bounded-salvage decision.

Draft branches were not promoted merely because they were ahead of the target.

## Safety findings

Repository branch-protection/ruleset state could not be read through the current GitHub integration. Therefore GitHub's `mergeable` signal is treated only as a structural mergeability observation, never as approval or evidence that repository-specific review/release gates are satisfied.

The public control plane must remain sanitized because the implementation repositories in this pilot are private. Exact branch identity, SHAs, and internal comparisons remain in the private Project Merger ledger.

## Schema clarification

The canonical `main` / `master` branch is a `CANONICAL_TARGET`, not a merge candidate. Every noncanonical branch receives one Project Merger disposition.

The bounded pilot permits `last_commit_time` and full ahead/behind enrichment to remain unresolved for non-actionable branches; active canonical-target paths receive frozen-baseline divergence checks first. This preserves bounded execution without inventing evidence.

## Next action

PM-002: enumerate the complete canonical repository set across the portfolio, deduplicate child projects and repository families, and establish persistent private ledger partitions so future sweeps can operate incrementally rather than rediscovering the portfolio.
