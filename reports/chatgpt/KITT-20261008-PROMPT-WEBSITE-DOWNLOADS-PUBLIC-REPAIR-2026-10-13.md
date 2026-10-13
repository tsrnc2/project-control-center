# KITT-20261008-PROMPT-WEBSITE-DOWNLOADS — Public Download Repair

Date: 2026-10-13  
Project: KITT / Project Control Center  
Worker: `chatgpt-sr-coder-20261013-public-prompt-repair`  
Provider/model label: OpenAI / GPT-5.6 Sol Pro  
Immutable model/runtime revision: unknown  
Canonical role: coder; senior responsibility assigned by the user, not independently certified

## Bounded objective

Repair the public Project Control Center prompt library so an unauthenticated website visitor can retrieve the six approved prompt artifacts without making the private KITT repository public.

Canonical editable ownership remains in `tsrnc2/kitt`. The bounded repair publishes byte-identical, read-only public distribution copies in `tsrnc2/project-control-center/downloads/prompts/`, records exact provenance and integrity metadata, and changes the website catalog to same-origin public URLs.

## Defect reproduced

The merged site already contained a Prompts tab and a six-entry `prompts.json`, but every `download_url` targeted `raw.githubusercontent.com/tsrnc2/kitt/...`. Live GitHub repository metadata showed:

- `tsrnc2/project-control-center`: public;
- `tsrnc2/kitt`: private.

An authenticated connector read of a private source does not establish anonymous browser access. The existing catalog therefore could not satisfy the public-download acceptance criterion.

## Selection and authority

The existing P1 task `KITT-20261008-PROMPT-WEBSITE-DOWNLOADS` was selected because it was the direct user-requested website task, its prior execution ownership had expired, and its only material blocker was the unresolved distribution route.

The owner reaffirmed that the website should provide downloads. The selected public-safe route was recorded on KITT issue #118: keep KITT private and authoritative, publish only a vetted immutable distribution subset in the public site repository, bind each copy to its source blob, and require normal review before merge.

## Control-plane registration

### KITT canonical control plane

- Blocker route resolved: commit `8bb40be9ca7fffcb91c6aff5fa583f885ef41e82`.
- Task reclaimed: commit `a0094b1d3a9a98f170ff52615342487ba956f257`.
- Exclusive lease created: commit `5571d238a03df24ee25e3f7abe99273783489a35`.
- Lease blob: `e7baaa39915e0e9b58d237bc07eb7857b6c3e5ae`.
- Lock token: `kitt-prompt-public-repair-20261013T1748Z-5f4c2a91`.
- Task transitioned to RUNNING: commit `c24e2a0b8181aff7ac83d22f67c4848e857c079b`.

### Project Control Center live coordination

A repository-local lock from the original October 8 run was discovered after the repair branch had begun. It had no heartbeat after `2026-10-08T12:15:00Z` and expired at `2026-10-08T14:15:00Z`.

This was a process-order defect: the KITT task and lease were valid, but the public tracker lock should also have been reconciled before branch mutation. Before PR publication, the stale tracker lock was replaced by SHA-checked takeover and an append-only event was recorded:

- prior lock blob: `54c8b9134833f3c13eb196c067e5f4f11b049f60`;
- takeover commit: `da07e3d9b3bc515e0c2abb41c6c25824f996a733`;
- current lock blob: `89d63d271e2d4554bf9d75b788c9b0f3a289cb50`;
- current token: `pcc-public-prompt-repair-20261013T175430Z-a13d7c42`;
- event commit: `44a3ec689d9dec807aebd8910cbec7b455ac16a4`;
- event path: `events/20261013T175430Z-prompt-download-repair-lock-takeover.json`.

No unexpired competing owner or later heartbeat was present.

## Frozen inputs

- Public site base: `tsrnc2/project-control-center@a0279d565d48254f3f33af98fdb5bfc2a781d6e8`.
- Canonical prompt source: `tsrnc2/kitt@03bcbae32e4ea28c8fa0a87c072b6cbfefb1bc5b`.
- Canonical source path: `control-plane/prompts/`.
- Repair branch: `machine/chatgpt/public-prompt-download-repair-20261013`.
- Implementation head before this report: `7e938a3134ce696df2f3e42c79cab3609a9b04c3`.

## Implementation

Created:

- `downloads/prompts/README.md`;
- `downloads/prompts/manifest.json`;
- `downloads/prompts/MASTER_PROJECT_PLANE_ONE_TASK_SR_CODER_WORKER.md`;
- `downloads/prompts/GOOGLE_JUNIOR_STARTUP_PROMPT.txt`;
- `downloads/prompts/CLAUDE_SR_STARTUP_PROMPT.txt`;
- `downloads/prompts/CLAUDE_JR_STARTUP_PROMPT.txt`;
- `downloads/prompts/GROK_BOUNDED_WORKER_PROMPT.md`;
- `downloads/prompts/UPSTREAM_LRP_PROMPTS.md`.

Updated:

- `prompts.json` to schema 1.1 with same-origin public download URLs, public source-view URLs, canonical source provenance, Git blob identities, and SHA-256 digests;
- `README.md` to document canonical-private versus public-distribution ownership and synchronization rules.

Unchanged:

- `index.html`;
- `assets/app.js`;
- `assets/style.css`;
- repository visibility;
- Pages/deployment configuration;
- credentials and authentication policy;
- all unrelated tracker data and project records.

## Source-to-public integrity

Each public distribution file was remotely read back from the repair branch. Its public Git blob SHA exactly matched the Git blob SHA fetched from the pinned private KITT source revision.

| File | Canonical/public Git blob SHA | SHA-256 | Bytes |
|---|---|---|---:|
| `MASTER_PROJECT_PLANE_ONE_TASK_SR_CODER_WORKER.md` | `bd13928f23961ddb4ac893cfa93c8d92f3ef5240` | `af4e296679844830875bdc9784afd544a173162eeb6aad3164affd42f7c5b006` | 7313 |
| `GOOGLE_JUNIOR_STARTUP_PROMPT.txt` | `bf77c5bd81ecff2d0b7e7a13b6312b8bdbbdbc0d` | `97d481ce18787e233e473209000fbad88e829724a4092008531ac0766eefaa0f` | 3066 |
| `CLAUDE_SR_STARTUP_PROMPT.txt` | `eb6642f80b43e83033c11fd7bb29f809438b4727` | `87a1a5d54920d88f1c031234e1ecb053983811ddbb0ebcb4e0e950bc3a27362b` | 2979 |
| `CLAUDE_JR_STARTUP_PROMPT.txt` | `dc54d64b7f5454f33e55509fb378f007982a7fc4` | `7c728a264774998513dabe8f819b1fa708dbef858f9ecda15fa5bec151bbe202` | 2860 |
| `GROK_BOUNDED_WORKER_PROMPT.md` | `c97a8d6fdb60df7698bd29db2e5f5446c89c8a7c` | `01a443d683d155199701e7fc0a572240e8ac6100f6c1b465c3a7174d47b40f28` | 2939 |
| `UPSTREAM_LRP_PROMPTS.md` | `2daf29eb823b40cda7ea769d1210e0d5b4b54a3c` | `d1ce78ebe59c826afeefe15d0941687c85d1207c392acef24ee976a53c56f70e` | 1170 |

Result: **6/6 public artifacts are byte-identical to their approved canonical source blobs.**

## Validation actually performed

Passed:

1. Recomputed each source Git blob identity from its UTF-8 byte stream and matched all six private source blob SHAs.
2. Remotely fetched all six public branch files and matched their Git blob SHAs to the canonical source blobs.
3. Remotely parsed/read back `prompts.json`; it contains six unique entries, six same-origin `./downloads/prompts/...` download URLs, and no private KITT raw download URL.
4. Remotely parsed/read back `downloads/prompts/manifest.json`; it records all six source paths, source revisions, Git blob SHAs, SHA-256 digests, byte sizes, and public paths.
5. Confirmed the existing UI implementation already renders the catalog and uses the HTML `download` attribute.
6. Confirmed site implementation files `index.html`, `assets/app.js`, and `assets/style.css` were not changed by this repair.
7. Reviewed the approved public subset for obvious credential/private-key patterns represented by the repository validator. No token, access key, private key, credential, or private log was introduced.

Unavailable in the local container:

- A repository clone and direct execution of `scripts/validate_tracker.py` could not run because the isolated container could not resolve `github.com`. This is recorded as an environment limitation, not a passing test.
- Hosted CI and GitHub Pages verification require the pull-request workflow/merge and are not claimed here.

## Publication state

- Candidate repository: `tsrnc2/project-control-center`.
- Candidate branch: `machine/chatgpt/public-prompt-download-repair-20261013`.
- Implementation head before report: `7e938a3134ce696df2f3e42c79cab3609a9b04c3`.
- Pull request: pending creation at report authoring time; the branch is frozen for review except for this report and review metadata.
- Merge: not performed.
- Deployment: not claimed.

## Review status

- Implementer self-review: completed, advisory only.
- Mechanical source/public identity verification: completed.
- Independent reviewer: required and not yet completed.
- Acceptance: pending independent review, required status checks, merge authorization, and post-merge public download verification.

The independent review should specifically check:

1. public-safety of the six-file subset;
2. source/public blob identity and manifest integrity;
3. absence of private-only URLs in the catalog;
4. same-origin website download behavior;
5. unchanged site behavior outside the prompt catalog;
6. the late tracker-lock reconciliation and whether any additional process remediation is required.

## Current disposition

**CANDIDATE COMPLETE; FINAL ACCEPTANCE PENDING.**

The bounded implementation is published and mechanically verified. The task must not be marked fully accepted, merged, deployed, or live until the independent review and repository gates pass. The canonical KITT lease and Project Control Center live lock remain held only through publication of the PR/review handoff, after which they must be safely released with readback.
