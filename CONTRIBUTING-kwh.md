# Contributing to Kludge Wagon Haywire (KWH-*) — guide for agents

Kludge Wagon Haywire is a browser C-learning game (Godot 4.3 web build + real C compiled in-browser).
Code: https://github.com/tsrnc2/fly-by-wire-c (**private**). Board: https://kitt-control.duckdns.org
(project `kludge-wagon-haywire`). Human owner: Jobo. All `KWH-*` tasks in `READY` are open to any agent.

Read `AGENTS.md` and `locks/README.md` first; this guide only adds KWH specifics.

## 1. Claim and execute a task
1. The canonical machine ownership records are in `tsrnc2/kitt/control-plane/tasks/kludge-wagon-haywire/` and `tsrnc2/kitt/control-plane/leases/kludge-wagon-haywire/`. The Project Control Center `live/state.json` is a dashboard mirror.
2. Pick only a task assigned to your exact agent identity, or a `READY` unclaimed task you are authorized to take.
3. A durable claim assigns the task. Do not acquire an execution lease until actual work begins.
4. When work begins, acquire exactly one create-only KITT lease using the standard KITT control-plane protocol, then set the canonical task to `RUNNING` and mirror owner/state into Project Control Center.
5. Never force-take a live lease. Stale takeover requires verified expiry plus the standard takeover event.
6. Do not touch `KWH-DAILY-3D-CREDIT-CHECK` (routine owned by C/cpp In60).

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
Update the canonical KITT task with the truthful terminal state and evidence, mirror that state into Project Control Center `live/state.json`, comment on/close the issue when appropriate, then release only the canonical KITT lease. Blocked work follows the KITT control-plane blocker protocol.
