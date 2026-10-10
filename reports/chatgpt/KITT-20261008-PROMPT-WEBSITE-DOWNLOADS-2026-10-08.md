# KITT-20261008-PROMPT-WEBSITE-DOWNLOADS

Date: 2026-10-08  
Worker: `chatgpt-sr-coder-20261008-prompt-downloads`  
Provider/model label: OpenAI / GPT-5.6 Sol  
Runtime: ChatGPT hosted agent with GitHub connector  
Project: KITT / Project Control Center  
Target repository: `tsrnc2/project-control-center`

## Scope

Add a public prompt-download surface to the existing Project Control Center website without creating a second editable prompt source.

The implementation is intentionally bounded to the website catalog and presentation. Prompt bodies remain canonical in `tsrnc2/kitt/control-plane/prompts/`.

## Selection and dependency

Direct user request: make the project website prompts available for download.

Prompt source is frozen to KITT revision:

`03bcbae32e4ea28c8fa0a87c072b6cbfefb1bc5b`

That revision is the candidate produced by `KITT-20261008-PROMPT-CANONICALIZATION` / KITT PR #109.

## Registration receipts

Canonical KITT task:

`control-plane/tasks/kitt/KITT-20261008-PROMPT-WEBSITE-DOWNLOADS.json`

Registration commit:

`1ff78a43c6536c8160b99a2d32586be9567cf864`

Claim commit:

`b9b3b26bc3ba86da8745f22ba727e27cc1f8ddf8`

RUNNING transition commit:

`c3c481bc8d99e15cb6d73d3895c19cd8b9df8977`

Canonical KITT exclusive lease:

`control-plane/leases/kitt/KITT-20261008-PROMPT-WEBSITE-DOWNLOADS.json`

Lease acquisition commit:

`1faec2d67ee6cde6ade21bfe2da776b4a2ca4dae`

Project Control Center public task:

https://github.com/tsrnc2/project-control-center/issues/60

Project Control Center live lock:

`locks/KITT-20261008-PROMPT-WEBSITE-DOWNLOADS.json` on branch `live`

Lock acquisition commit:

`f21bfd4458f16db2634730fc5f546141c9afade9`

Both locks were read back and verified to name this exact task and worker before site implementation began.

## Implementation

Candidate branch:

`machine/chatgpt/prompt-downloads-20261008`

Implementation head before this report:

`ff5166fab13ffa1cd45950c500101583f324611b`

Changed implementation files:

- `prompts.json`
- `index.html`
- `assets/app.js`
- `assets/style.css`
- `README.md`

### Website behavior

The website now contains a **Prompts** tab.

The tab renders a public prompt catalog with:

- human-readable prompt name;
- purpose;
- source filename;
- format/status;
- **Download** action;
- **View source** action.

The catalog contains six entries:

1. Master Project Plane — One-Task Senior Coder Worker
2. Google / Gemini Junior Startup
3. Claude Senior Startup
4. Claude Junior Startup
5. Grok Bounded Worker
6. Upstream LLM Reasoning Prompt Index

### Source integrity

The public tracker does not contain duplicate editable prompt bodies.

`prompts.json` points every source/download URL at the immutable KITT revision:

`03bcbae32e4ea28c8fa0a87c072b6cbfefb1bc5b`

This prevents a download URL from silently changing its contents.

## Validation

Remote readback of the website candidate confirmed:

- Prompts navigation tab present.
- Prompts panel present.
- Prompt rendering host present.
- `assets/app.js` fetches `prompts.json`.
- Download actions use catalog `download_url`.
- Prompt card CSS is present.
- README documents the prompt catalog.
- `prompts.json` parses as JSON.
- manifest schema version is `1.0`.
- manifest contains exactly six prompt/reference entries.
- prompt IDs are unique.
- every download URL contains the frozen source revision.
- every source URL contains the frozen source revision.
- every entry supplies file, name, and purpose.
- candidate JavaScript parses successfully in V8 via `new Function(...)`.

The six source files were independently fetched successfully from the exact pinned KITT revision before the site manifest was published.

Observed website candidate blob SHAs before report publication:

- `index.html`: `051ef6d0728beb2f4e0d575d2ccbcc1bc4c814f6`
- `assets/app.js`: `6d7ecb7377a3b52d551ac5d0332db2ee894df286`
- `assets/style.css`: `b428a774f0ccc921e16c078b5c301fef00d6af46`
- `prompts.json`: `c8b9dd7868f79398fef8d4a69540ed962b720d5e`
- `README.md`: `08c49b0be3f6202cac4ecb2ca9f2d3824d51dd42`

## Publication

Draft pull request:

https://github.com/tsrnc2/project-control-center/pull/61

PR #61 was created from `machine/chatgpt/prompt-downloads-20261008` to protected `main`.

At creation it reported five implementation files changed, 126 additions, and one deletion.

## Review and deployment status

Self-validation is complete for this bounded implementation.

No independent review is claimed.

PR #61 is a draft candidate and is not merged.

GitHub Pages publication/deployment was not performed by this task. The website must not be described as live with this feature until normal review, merge, and Pages publication succeed.

## Final bounded disposition

The coding task is eligible for `DONE` once this report is published and the canonical task/issue are updated.

Remaining parent/project work is intentionally unclaimed:

1. review PR #61;
2. merge when repository policy permits;
3. verify Pages publishes the merged site;
4. confirm the live public Prompts tab and all download links.

The execution locks must be released only after completion state/evidence are recorded.
