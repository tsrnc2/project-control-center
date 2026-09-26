# Agent review requests

Review requests are first-class coordination records for asking another agent to inspect a frozen artifact without silently taking over the parent implementation task.

## Core rule

A review request identifies **what to review, exactly where to look, why the review is needed, which reviewer role to use, and what evidence/output closes the review**.

The request must not rely on "review this" alone.

## Minimum request

Every review request must include:

- canonical project ID;
- parent task ID;
- requesting agent;
- primary reviewer role from `reviewer-roles.json`;
- source repository;
- immutable source ref when practical;
- exact files/artifacts;
- specific areas, symbols, line ranges, interfaces, claims, or tests needing attention;
- concrete review objective/questions;
- independence requirement;
- evidence/context references when available;
- required review output;
- observable completion criteria.

## Reviewer roles

`reviewer-roles.json` is the Project Control Center routing catalog. Each role points to an existing role or skill in `tsrnc2/llm_reasoning_project` at a frozen source revision.

The reviewer must resolve the role's `source_path` at the recorded `source.revision` before executing the review. Do not substitute a similarly named skill without recording the substitution.

A request may name supporting roles, but one primary role owns the final review result.

## Independence

Use **Independent reviewer required** for adversarial, security, release-gate, evidence-integrity, concurrency, or other reviews where self-review would weaken assurance.

The reviewer should be a different agent from the implementer/proposer when independence is required. If no independent agent is available, leave the request open or explicitly record an independence exception; do not silently self-review and call it independent.

## Scope discipline

Reviewers should stay within the named artifacts and attention areas unless they discover a material cross-boundary defect. If they expand scope, they must identify why the expansion was necessary.

Review requests are read-only by default. A reviewer may propose patches, tests, or remediation, but must not mutate the parent task's implementation unless separately authorized.

## Review result

A completed review should report:

1. reviewer agent ID and reviewer role ID;
2. source repository and exact reviewed ref;
3. artifacts and areas actually inspected;
4. assumptions and unavailable evidence;
5. findings with severity/materiality;
6. exact file/symbol/evidence references;
7. required fixes or follow-up evidence;
8. verification commands/tests when applicable;
9. unresolved questions;
10. verdict: `PASS`, `PASS-WITH-FIXES`, `FAIL`, or `UNRESOLVED`;
11. whether independence requirements were satisfied.

A review verdict does not by itself authorize merge, release, deployment, task completion, or lease takeover. The parent task's normal authority and acceptance gates still apply.

## GitHub workflow without Actions

Humans use the **Agent review request** Issue Form. Agents may create equivalent issues directly.

The dashboard recognizes either the `type:review-request` label **or** the `[REVIEW]` title prefix, so review requests remain discoverable even when label synchronization or GitHub Actions is unavailable.

Closing the review issue means the requested review is complete or intentionally cancelled. The result should be linked or summarized before closure.

## Robot contract

Machine-generated review records should follow `schema/review-request.schema.json`. The Issue Form is the human-readable equivalent.

The public tracker contains coordination metadata only. Private evidence stays in the project repository or approved report store and is referenced by safe identifiers.
