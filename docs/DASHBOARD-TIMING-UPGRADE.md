# Dashboard timing and freshness upgrade

Task: [PCC-20260927-TIMING-FRESHNESS](https://github.com/tsrnc2/project-control-center/issues/13)  
Baseline commit: `0974752b243491cf45f4db5068da2003a4d0e06d`  
Status at authoring: **candidate; not independently accepted, merged, or deployed**.  
Author: `chatgpt-dashboard-upgrade`  
Validation: [machine-readable receipt](validation/dashboard-20260927.json).

## Scope and ownership

Extend the existing public renderer rather than replace it. The [agent protocol](../AGENTS.md), [review protocol](REVIEW-REQUESTS.md), and public-data boundary remain unchanged. This does not reconcile or integrate private KITT coordination authority, publish private records, modify schedules, or grant browser write access. No service, registry, state schema, workflow, Pages setting, DNS record, or authentication setting is changed.

The existing JavaScript renderer is retained; the new pure presentation helper is UI-specific, not a new KITT service or generic LLM role. Python is used only for the offline browser test harness. No production dependencies, bundler, analytics, credentials, or storage are added.

## Visible changes and rationale

Task cards now distinguish recorded state, owner, actual start, last recorded progress, elapsed wall-clock time, record update, deadline, and completion forecast. Expandable details retain claim expiry, lock expiry, heartbeat, planned/scheduled times, and forecast evidence. Missing fields remain unknown. A task marked DONE still does not prove merge or deployment.

Separate successful-read timestamps from refresh attempts. Keep old data and its timestamps after failures, explicitly identify fallback snapshots, and display stale/missing/invalid/future-dated snapshot warnings. Initial total failure leaves unknown counts rather than a healthy-looking zero. Refreshes are single-flight, requests time out after 12 seconds, and the existing two-minute polling interval is retained. No runtime freshness gate depends on GitHub Actions.

The summary shows **current lock evidence**, not verified work. An active recorded state needs a fresh live-branch snapshot/read, an unexpired active lock, and nonconflicting ownership before it counts. An expired or invalid claim invalidates that evidence. A lock never proves actual progress. Absence of current evidence is not permission to take over a task.

Project/search/lifecycle filters scope the data views; task-state and attention filters are explicitly task-view-only. Project cards drill into their task list. Summary counts remain labelled as loaded records before filters. Task IDs are keyed with project IDs; older Issue updates cannot regress newer machine metadata. Machine ownership fields are never overwritten by Issue metadata during an existing-record merge.

Default task ordering is attention, active recorded states, READY, other queued states, then terminal states; priority and recorded activity break ties. Closed Issues become DONE only with GitHub's completed reason; otherwise they display CLOSED, not inferred successful work.

The existing project, blocker, review, activity, GitHub, and robot views remain. Mobile controls collapse secondary options, keep horizontally scrollable native action buttons, and avoid whole-page overflow. Times default to America/Los_Angeles with a UTC option. Unsafe data-supplied URL schemes and embedded URL credentials are rejected; source text is escaped.

## Additive display contract

No source field is manufactured or required by a schema migration. Existing records remain usable. Optional task fields displayed are `started_at`, `last_progress_at`, `completed_at`, `planned_start_at`, `scheduled_next_run_at`, `deadline_at`, and `estimate`. Existing owner/claim/lease/update fields retain their meanings.

Accepted times must be calendar-valid offset-qualified timestamps including seconds. Date-only/local-zone strings and invalid dates are not converted into apparently valid dates. Wall-clock elapsed time ends at actual completion for terminal tasks, or the snapshot timestamp otherwise. It is **not active effort**. Inconsistent/missing endpoints remain unknown.

A displayed estimate requires `earliest_finish_at`, `latest_finish_at`, `estimated_at`, a nonempty `estimated_by`, and a nonempty `basis`. The bounds must be ordered, with the estimate authored no later than its earliest finish or the display clock. Optional `assumptions`, `depends_on`, `valid_until`, and `invalidated_reason` retain their recorded meanings.

Supported optional status labels are `estimated`, `estimated_window`, `conditional`, `conditional_on_dependency`, `invalidated`, `awaiting_reassessment`, and `stale` (case-insensitive). Missing status permits evidence-based interpretation; unsupported or explicitly unknown statuses do not assert an estimate. A new/undated BLOCKED update after the forecast requires reassessment. A documented dependency keeps the forecast conditional. Past/expired forecasts remain stale; no automatic forward adjustment occurs. Completed times with impossible chronology are flagged.

The freshness threshold is 15 minutes for both source read age and snapshot age. The Issues reader requests up to three pages of 100 entries, follows only its own repository/page construction, and explicitly reports truncated coverage when a next-page relation remains. A failed page preserves the previous successful complete read, not a half-replaced set. Counts never claim complete portfolio coverage.

## Validation and adversarial self-check

The three edited baseline files were reconstructed from connected GitHub reads and their Git blob hashes matched exactly before editing:

- `index.html`: `ddd0d0b34802329be436bc4f499506f649aa6c83`
- `assets/app.js`: `ccfcde06e2329dacdb062dd2d36df5bbd74a8a97`
- `assets/style.css`: `da45959b0932dbd4862e19d874ea3f48e4b44327`

Commands run on the candidate:

```sh
node --check assets/app.js
node --check assets/dashboard-model.js
node --test tests/dashboard-model.test.cjs
python tests/browser_smoke.py test-output
```

Results: **48/48 model tests and 50/50 offline browser checks passed**, with zero browser runtime errors. Browser checks cover source errors/fallbacks, retained successful timestamps, initial total outage, malformed data, bounded pagination, composite identities, stale Issues, filters, unknown ETA, unsafe markup/links, preserved expanded task details, read-only requests, and all seven panels at 320px/390px without whole-page horizontal overflow. Desktop and mobile fixture screenshots are explicitly marked **TEST FIXTURE — NOT LIVE DATA**.

The local environment blocked HTTP navigation to the loopback test server. The committed harness therefore renders the actual candidate HTML/CSS/scripts into an in-memory browser document and intercepts synthetic GET responses. This validates the renderer and mocked data flow, **not live navigation, HTTPS, CORS against GitHub, or deployment**. The browser test requires Playwright and Chromium but introduces no production dependency.

These are author-run checks, including adversarial cases; they are not an independent review. No claim is made that the broader dashboard proposal's complete acceptance suite passed. Repository-wide validation/CI, real-device testing, and live HTTP smoke tests remain unverified.

Source bundle SHA-256: `010440a4f6322c41315104823c36f9470682380f88ee7ae13cdc404c5c2ad106`. The receipt specifies the deterministic bundle algorithm and per-file SHA-256 values.

## Required next step and deployment boundary

Request a distinct eligible `adversarial-reasoning-reviewer`, with `protocol-security-reviewer` and `verification-test-designer` support as needed, from the pinned [reviewer catalog](../reviewer-roles.json). Freeze the review to the published candidate commit, inspect all changed files, rerun the commands, and report findings/independence explicitly. The implementing agent must not call its own tests independent acceptance.

After acceptance, merge through the normal PR path and verify the actual Pages publishing source serves the candidate assets over HTTPS. Preserve private-data authentication boundaries. Do not change DNS/HTTPS policy or bypass admission/review gates merely to deploy this renderer. Rollback is a reviewed revert of the renderer commit; it must not rewrite tracker state or release another agent's lease.

Remaining broader work is separate: authenticated private KITT adapter, revision-pinned snapshots and source reconciliation, complete blocked/effort histories, dependency-backed project milestone forecasting, and verified live deployment. No private task was copied into this public candidate.
