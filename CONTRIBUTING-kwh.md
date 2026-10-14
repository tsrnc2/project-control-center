# Contributing to Kludge Wagon Haywire (KWH-*) — guide for agents

Kludge Wagon Haywire is a browser C-learning game (Godot 4.3 web build + real C compiled in-browser).
Code: https://github.com/tsrnc2/fly-by-wire-c (**private**). Board: https://kitt-control.duckdns.org
(project `kludge-wagon-haywire`). Human owner: Jobo. All `KWH-*` tasks in `READY` are open to any agent.

Read `AGENTS.md` and `locks/README.md` first; this guide only adds KWH specifics.

## 1. Claim a task (branch `live` of this repo)
1. `git pull --rebase origin live`; pick a `READY` task in `state.json` with `project_id: kludge-wagon-haywire`.
2. Create `locks/<task-id>.json` (create-only; a conflict means someone else won — pick another):
   ```json
   {"task_id":"KWH-…","project_id":"kludge-wagon-haywire","agent_id":"<you>",
    "lock_token":"<random>","created_at":"<UTC now>","expires_at":"<now + 30–60 min>","run_ref":"<non-sensitive>"}
   ```
   Keep locks **short** (≤ 60 min) and **heartbeat** by bumping `expires_at` (SHA-checked update) while working.
3. In the same commit set the task `state: CLAIMED` (or `RUNNING`), `claimed_by`, `claim_expires_at`, `updated_at`.
4. Never force-take a live lock. Stale takeover only after verified expiry + an event under `events/`.
5. Do not touch `KWH-DAILY-3D-CREDIT-CHECK` (routine owned by C/cpp In60).

## 2. Repo access
`fly-by-wire-c` is private. Agents on the shared box can use the already-authenticated `gh` (account `tsrnc2`):
`gh repo clone tsrnc2/fly-by-wire-c`. Don't copy tokens anywhere; don't make the repo public.
Each task links its GitHub issue in `source_ref`.

## 3. Build / test
- Re-export web build: `xvfb-run -a godot --headless --path godot_src --export-release Web ../web/godot/index.html`
- Run locally: `cd web && python3 -m http.server 8799`
- Tests: `node test.js` (ECU tests + headless Chrome e2e); fast: `ECU_ONLY=1 node test.js`
- Architecture: `README.md`, `systems_map.md` (lesson ↔ car-system map, ECU architecture).

## 4. Git hygiene
- `git pull --rebase` before every push; small focused commits referencing the issue (`#NN`).
- **Don't break `main`.** Risky/large work (Godot scene changes, ECU API, workbench/emulator) goes on a branch + PR.
- Don't commit `.godot/` caches, secrets, or large unlicensed assets; keep the README license table updated.
- Salvaged work from the paused build may exist in `salvage/*` branches (from the salvage worker) — check before redoing cast, buildings, tunnels, wildlife or GPS work.

## 5. Finish
Update the task (`DONE`/`BLOCKED` + `next_action`) in `state.json`, comment on/close the issue,
then release the lock (delete it or mark `status: released`). Blocked → follow `AGENTS.md` "Blocked work".
