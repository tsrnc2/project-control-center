# KITT Prompt Website Downloads — Public Distribution and Pages Trigger Repair

Date: 2026-10-13  
Parent task: `KITT-20261008-PROMPT-WEBSITE-DOWNLOADS`  
Bounded follow-up: `KITT-20261013-PROMPT-PAGES-TRIGGER`  
Project: KITT / Project Control Center  
Worker: `chatgpt-sr-coder-20261013-prompt-pages-trigger`  
Provider/model label: OpenAI / GPT-5.6 Sol Pro  
Immutable model/runtime revision: unknown  
Canonical role: coder; senior responsibility assigned by the user, not independently certified

## Objective

Make the public Project Control Center website provide usable anonymous downloads for the six approved canonical prompt artifacts while keeping the editable KITT repository private.

The public-distribution candidate already copied the approved six-file subset into `tsrnc2/project-control-center/downloads/prompts/`, bound each copy to immutable KITT provenance and integrity metadata, and changed `prompts.json` to same-origin public URLs.

During the release-gate pass, a second defect was found: `.github/workflows/pages.yml` deploys only when selected paths change, but its `on.push.paths` filter omitted both `prompts.json` and `downloads/prompts/**`. Merging the candidate without repairing that filter would not trigger a Pages deployment, so the live site could remain on the pre-repair artifact.

## Public/private boundary

- Canonical editable source: private `tsrnc2/kitt@03bcbae32e4ea28c8fa0a87c072b6cbfefb1bc5b`, path `control-plane/prompts/`.
- Public read-only distribution: `tsrnc2/project-control-center`, path `downloads/prompts/`.
- Public catalog: `prompts.json` with same-origin download and source-view paths.
- KITT visibility remains private.
- Project Control Center visibility remains public.
- No credentials, authentication policy, private logs, or unrelated KITT files are included.

## Original public-distribution implementation

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

- `prompts.json` with six same-origin public download URLs, public source-view URLs, source revision/path, Git blob identities, SHA-256 digests, and byte sizes;
- `README.md` with the private-canonical/public-distribution contract.

The exact pre-trigger-repair candidate was PR #75 head `ba4ba1c0022a9dc977c756cdf90efc5f27fdcd75`.

## Source-to-public integrity

Remote source and candidate readback established that every public file had the same Git blob SHA as its pinned KITT source file.

| File | Canonical/public Git blob SHA | SHA-256 | Bytes |
|---|---|---|---:|
| `MASTER_PROJECT_PLANE_ONE_TASK_SR_CODER_WORKER.md` | `bd13928f23961ddb4ac893cfa93c8d92f3ef5240` | `af4e296679844830875bdc9784afd544a173162eeb6aad3164affd42f7c5b006` | 7313 |
| `GOOGLE_JUNIOR_STARTUP_PROMPT.txt` | `bf77c5bd81ecff2d0b7e7a13b6312b8bdbbdbc0d` | `97d481ce18787e233e473209000fbad88e829724a4092008531ac0766eefaa0f` | 3066 |
| `CLAUDE_SR_STARTUP_PROMPT.txt` | `eb6642f80b43e83033c11fd7bb29f809438b4727` | `87a1a5d54920d88f1c031234e1ecb053983811ddbb0ebcb4e0e950bc3a27362b` | 2979 |
| `CLAUDE_JR_STARTUP_PROMPT.txt` | `dc54d64b7f5454f33e55509fb378f007982a7fc4` | `7c728a264774998513dabe8f819b1fa708dbef858f9ecda15fa5bec151bbe202` | 2860 |
| `GROK_BOUNDED_WORKER_PROMPT.md` | `c97a8d6fdb60df7698bd29db2e5f5446c89c8a7c` | `01a443d683d155199701e7fc0a572240e8ac6100f6c1b465c3a7174d47b40f28` | 2939 |
| `UPSTREAM_LRP_PROMPTS.md` | `2daf29eb823b40cda7ea769d1210e0d5b4b54a3c` | `d1ce78ebe59c826afeefe15d0941687c85d1207c392acef24ee976a53c56f70e` | 1170 |

Result: **6/6 public artifacts were byte-identical to the approved canonical source blobs.**

## Initial validation

On exact head `ba4ba1c0022a9dc977c756cdf90efc5f27fdcd75`:

- `Validate tracker` run `38442635686`: completed / success;
- CodeQL run `38442635813`: completed / success;
- six unique catalog entries used `./downloads/prompts/...` download paths;
- no private KITT raw download path remained in the catalog;
- the prompt UI files `index.html`, `assets/app.js`, and `assets/style.css` were unchanged;
- all six public prompt blobs matched their canonical KITT source blobs.

These successes validated the distribution candidate but did not establish that a merge would trigger Pages publication.

## Pages trigger defect and bounded repair

Pre-repair workflow blob: `d85790c39f3a0d9850bc2b0d95416f8feaffaf82`.

The workflow path filter included site assets and tracker files but omitted the new prompt catalog and distribution directory. The bounded repair adds only:

```yaml
      - 'prompts.json'
      - 'downloads/prompts/**'
```

Workflow-repair commit before this report: `35393818d27cffe60b4c3c2fd4f267444e85c6a9`.

No workflow permissions, jobs, actions, deployment environment, concurrency settings, branch target, repository visibility, or authentication settings were changed.

## Follow-up task registration

The defect was handled as one separate bounded child task rather than silently broadening or reopening ownership of the parent implementation.

- READY registration commit: `43f46ff1bcd3a53cb822081f3c400d1dcb64bae6`.
- CLAIMED transition commit: `dd13ad0f03c55c155b46558adf170ec85fcf630b`.
- KITT lease creation commit: `16082abd7a0235ceadc45ab073eca9a929e2293a`.
- KITT lease blob: `e0395f033e8510cb218325c2546dfaaf3fe0d573`.
- KITT lease token: `kitt-pages-trigger-20261013T2020Z-91c6b2f4`.
- Public live-lock creation commit: `9c3cc63e2d41b319329fd13eb191318e3dd66a30`.
- Public lock blob: `d063ab2d3a51de90f2a76b75ea8eb6b3cc38f49e`.
- Public lock token: `pcc-pages-trigger-20261013T2021Z-47d8a3c1`.
- RUNNING transition commit: `efb5de179f2f1606d511c6da01c97fdd012221fb`.

Both locks were created after 404 absence checks and remotely read back with the expected task, owner, token, and expiry.

## Review and release status

- Pull request: `tsrnc2/project-control-center#75`.
- Review request: `tsrnc2/project-control-center#76`.
- Parent public task: `tsrnc2/project-control-center#60`.
- KITT coordination/blocker thread: `tsrnc2/kitt#118`.
- Implementer self-review: advisory only.
- Independent protocol-security/release review: still required.
- Merge: not performed.
- Pages publication: not performed.
- Anonymous download verification: not yet possible against the unreleased candidate.

The review request must be rebound to the final resealed PR head and expanded to include `.github/workflows/pages.yml`. A review of the superseded pre-trigger-repair head cannot accept the new candidate.

## Validation required on the resealed head

Before the child task can close:

1. read back the final workflow and verify both exact path entries;
2. verify the PR changed-file set contains no unrelated additions;
3. obtain successful hosted `Validate tracker` and CodeQL results on the final exact head;
4. update review issue #76 to that exact head and include the deployment-trigger change;
5. record the final head and validation receipts in the child task;
6. release only the child task's KITT lease and public live lock.

The parent task remains **BLOCKED** after the child repair until an independent review passes, the PR is merged normally, Pages publishes the merged revision, and all six downloads are verified anonymously.
