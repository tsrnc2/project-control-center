# Governance

The tracker coordinates work; it does not own project implementation truth.

- Portfolio identity: `projects.json` plus the human master directory.
- Human task/blocker threads: GitHub Issues.
- Exclusive execution authority: unexpired lock files on `live`.
- Fast machine snapshot: `live/state.json`.
- Site/protocol/schema changes: pull requests to `main`.
- Design proposals: GitHub Discussions.
- Immutable public snapshots: GitHub Releases.
- Detailed project implementation evidence: each project's own repository.

A status change must never be used to bypass a project's technical, security,
review, publication, or safety gates.
