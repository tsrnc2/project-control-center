# Websites Portfolio

Canonical project ID: `websites`

Intake: https://github.com/tsrnc2/project-control-center/issues/32

## Purpose

The Websites Portfolio is the cross-project catalog and coordination layer for the user's websites. It does not move implementation roots or replace the owning product project's task, review, release, or deployment authority.

For every website, track at minimum:

- owning product/project
- source repository and source path
- deployment provider and public URL
- domain/DNS state
- lifecycle and release state
- brand/name state
- privacy/public-data boundary
- current production or review blockers
- aliases/superseded locations

Newly created or discovered websites should be added here and to `projects.json`.

## Current website surfaces

| Website surface | Website project ID | Owning project | Source | State | Notes |
| --- | --- | --- | --- | --- | --- |
| KISS / Knighted Intelligence in-dash launch site | `websites-kiss-in-dash` | KITT | `tsrnc2/kitt` — exact Pages path pending integration | ACTIVE-CHILD | Upcoming in-dash self-learning/reasoning product site. KITT → KISS and Knighted Intelligence naming remain provisional pending final naming/legal decisions. |
| Project Control Center Website | `websites-project-control-center` | KITT / Project Control Center | `tsrnc2/project-control-center` | ACTIVE-CHILD | Existing PCC-WEB programme remains authoritative for its production work. Do not duplicate issues 17/19 or KITT blocker 22. |
| CryptoKingpin Website | `websites-cryptokingpin` | CryptoKingpin | `tsrnc2/CryptoKingpin-Website` | ACTIVE-CHILD | Existing dedicated website repository; preserve current root. |
| Religion of Transformation Website | `websites-religion-of-transformation` | Religion of Transformation | NEEDS-MAPPING | NEEDS-MAPPING | Site is known to exist; repository, deployment and canonical root must be recovered rather than guessed or moved. |

## Existing website programme relationship

KITT already contains a bounded `PCC-WEB-001..023` Website & Research Delegation Hub programme for the Project Control Center. That programme is not the same thing as this portfolio catalog.

- KITT programme source: `tsrnc2/kitt/control-plane/assignments/project-control-center.json`
- Human navigation source: `tsrnc2/kitt/control-plane/assignments/WEBSITE.md`
- PCC task: https://github.com/tsrnc2/project-control-center/issues/17
- Independent review: https://github.com/tsrnc2/project-control-center/issues/19
- KITT blocker: https://github.com/tsrnc2/kitt/issues/22

The Websites Portfolio may reference those records but must not create competing execution tasks for them.

## Storage convention

Drive project root: `Websites/`

Reports: `Websites/reports/<agent name>/`

Existing website repositories and Drive roots remain in place. This project is an index/control layer, not a migration.

## Next website actions

1. Integrate the current KISS launch site into `tsrnc2/kitt` and establish the exact GitHub Pages source path without overwriting existing KITT site/control-plane assets.
2. Record the resulting Pages URL and source revision here.
3. Recover the Religion of Transformation website's canonical repository/deployment root and change its status from `NEEDS-MAPPING`.
4. Inventory any additional website surfaces discovered in GitHub or Drive and add them without moving their roots.
5. Keep domain/DNS, deployment, security and release work under each owning project's existing authority and review gates.
