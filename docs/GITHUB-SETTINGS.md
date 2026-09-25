# GitHub repository settings

Apply these settings after creating the public `tsrnc2/project-control-center`
repository.

## General

- Visibility: **Public**
- Issues: enabled
- Discussions: enabled
- Pull requests: enabled
- Prefer squash merge for site/protocol changes.
- Automatically delete merged head branches: enabled.

## GitHub Pages

Select **GitHub Actions** as the Pages source. The checked-in Pages workflow
validates the tracker and deploys the static site.

The workflow uses the standard `github-pages` deployment environment. Limit
deployment to the default branch when configuring environment protection.

## Branches

Create `live` from the initial `main` commit.

Recommended `main` ruleset:
- block force pushes
- block deletion
- require pull request before merge
- require one approving review when practical
- require the tracker validation status check
- require conversation resolution
- require CodeQL only after the CodeQL workflow has produced a stable check name

Recommended `live` ruleset:
- block force pushes
- block deletion
- allow direct authenticated coordination writes
- do **not** require PRs or long-running CI for lock heartbeat/state updates

Do not configure a rule that makes an agent unable to release a live execution
lock.

## Discussions

Create categories whose slugs match the checked-in forms:
- `ideas`
- `coordination`

## Security

Enable available public-repository security features:
- secret scanning / push protection where available
- private vulnerability reporting
- dependency graph

## Projects

A GitHub Project board may be attached as a human planning view for Issues.
Do not make the Project board a second execution-lock authority. The current
connector cannot provision account-scoped Projects, so create/link that view
only when the required GitHub authorization is available.

## Initial setup

After files are on main:
1. create `live`
2. run **Sync repository metadata**
3. verify Issue Forms
4. enable Discussions and categories
5. enable Pages via GitHub Actions
6. apply branch rulesets
7. run validation and CodeQL once
8. create the first public snapshot Release
