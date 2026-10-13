# Upstream LLM Reasoning prompt-bearing sources

The generic reusable delegation semantics do not move into KITT. This file makes the KITT prompt folder a complete discovery point while preserving upstream ownership.

Repository: `tsrnc2/llm_reasoning_project`

Known canonical prompt-bearing sources:

- `knowledge/planning/delegation/JR_DELEGATION_PLAN.md`
- `knowledge/planning/delegation/SR_DELEGATION_PLAN.md`
- `knowledge/planning/delegation/CLAUDE_JR_DELEGATION_PLAN.md`
- `knowledge/planning/delegation/CLAUDE_SR_DELEGATION_PLAN.md`
- `knowledge/planning/delegation/CLAUDE_MODEL_ROUTING_POLICY.md`
- `knowledge/planning/delegation/MULTI_MODEL_DELEGATION_REPORT.md`

Historical evidence also identifies a canonical `WORKER_PROMPT.md` at Git blob:

`3491c4850778c992dd626249c4ededf076b379d4`

Its exact current repository path was not established during this consolidation pass, so this KITT folder does **not** fabricate a path or copy an unverified body. The governing rule remains fail-closed: fetch the current upstream source before using it.

The provider startup copies in this folder must continue to defer to the current upstream LRP documents they cite.
