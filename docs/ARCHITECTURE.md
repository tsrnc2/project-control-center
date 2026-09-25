# Architecture

## Human surface

GitHub Pages renders project status and merges:

1. `live/state.json` for agent ownership, locks, and sanitized machine events.
2. GitHub Issues for live human task/blocker threads.
3. `projects.json` / the project list embedded in state for portfolio identity.

## Write surfaces

- Humans: Issue Forms, Issue comments, Discussions, pull requests.
- Agents: GitHub Issues plus SHA-checked Contents API writes to the `live` branch.
- Maintainers: pull requests to main for registry/protocol/site changes.

## Concurrency

Execution ownership is never inferred from Issue labels alone. The unexpired
`live/locks/<task-id>.json` file is the mutex. GitHub create conflicts provide
atomic first-writer-wins acquisition; SHA-checked updates protect renewal and
takeover.

## Failure isolation

Pages, Actions, Issues, and the live branch are deliberately separable. A Pages
deployment failure does not invalidate a task lock. An Action failure does not
grant a task lock. A stale site snapshot can be cross-checked against Issues and
raw live state.
