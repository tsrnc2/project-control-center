# Master Projects Site

## Purpose

The Master Projects Site is the canonical human-and-agent control surface for all substantial projects worked on during the previous twelve months and for all projects created or discovered going forward.

Its purpose is not merely to provide a list of repositories. It should function as the central project registry, status dashboard, task coordination system, evidence index, blocker tracker, and navigation layer connecting work that may physically live across multiple GitHub repositories, Google Drive directories, reports, branches, services, skill packs, websites, and other external systems.

The site should make it possible to answer, quickly and reliably:

- What projects exist?
- Which project is the canonical parent?
- Which repositories belong to each project?
- What is currently being worked on?
- What has been completed?
- What is blocked?
- Why is it blocked?
- Which agent is working on a task?
- Which tasks are available?
- What was the last verified result?
- What should happen next?
- Where are the source code, reports, documentation, and evidence?
- Is an apparent success actually verified?
- Which projects have been renamed, merged, superseded, archived, or split?

The site should work equally well for a person reading it in a browser and for an autonomous or delegated agent consuming its underlying structured data.

---

## Canonical Project Model

The system should maintain **one canonical parent entry for each durable project**.

Related repositories should normally remain grouped under that project rather than appearing as independent top-level projects.

For example, a project might contain:

- core repository;
- Android or desktop client;
- website;
- service implementations;
- skill packs;
- test repositories;
- benchmark tools;
- documentation repositories;
- deployment repositories;
- research reports.

A child repository becomes a separate canonical project only when it has genuinely become independently maintained or has its own long-term lifecycle.

Existing repositories and project roots should **not be moved simply to make the directory look cleaner**. The master registry should describe reality rather than forcing the physical storage layout to match the registry.

Renames and historical identities should be preserved as aliases.

For example:

```text
KITT
Aliases:
  Improved V2
  Improved
  LLM delegator integration
Status:
  Active
```

This prevents old references, reports, commits, and agent notes from becoming disconnected from the current project.

---

## Canonical Master Directory

The broader project ecosystem should continue using a single master directory as the authoritative cross-project index.

The registry should record, where applicable:

```text
Project name
Canonical project ID
Aliases
Description
Lifecycle status
Priority
Owner
GitHub repositories
Google Drive locations
Websites
Subprojects
Services
Skills
Active branches
Reports
Tasks
Dependencies
Blockers
Recent milestones
Verification state
Last meaningful update
Next dependency-ready action
```

The existing Google Drive convention should be retained for project reports:

```text
<project name>/reports/<agent name>
```

Examples:

```text
kitt/reports/claude/
cryptokingpin/reports/gemini/
cryptokingpin/reports/grok/
microkernel/reports/<agent>/
```

The Master Projects Site should link to these locations rather than duplicating report content unnecessarily.

---

## GitHub as the Machine-Readable Source

A dedicated GitHub repository should hold the structured project-tracking data and the website.

GitHub provides several useful characteristics for this role:

- version history;
- attribution;
- branches;
- pull requests;
- issues;
- discussions;
- releases;
- signed commits where required;
- immutable commit identifiers;
- repository permissions;
- GitHub Pages hosting;
- direct integration with agents.

The site should therefore be published through **GitHub Pages** from the dedicated project-tracking repository.

The website itself should be primarily a presentation layer over machine-readable project data.

A useful structure could resemble:

```text
master-projects/
├── README.md
├── projects/
│   ├── kitt/
│   │   ├── project.yaml
│   │   ├── tasks.yaml
│   │   ├── blockers.yaml
│   │   ├── repositories.yaml
│   │   └── history.md
│   ├── cryptokingpin/
│   ├── microkernel/
│   ├── pityplease/
│   └── ...
├── agents/
│   ├── registry.yaml
│   └── activity/
├── tasks/
│   ├── active/
│   ├── completed/
│   └── blocked/
├── reports/
│   └── indexes/
├── schemas/
├── site/
└── archive/
```

The exact format can evolve, but the critical principle is that project state must exist in structured files that agents can read without scraping the rendered website.

---

## Human Website

The web interface should remain deliberately simple.

The main page should provide a high-level portfolio view.

A useful project card might show:

```text
KITT
ACTIVE

Priority: Critical
Repositories: 4
Open tasks: 18
Blocked tasks: 3
Active agents: 2

Last verified progress:
Plugin framework architecture added.

Next action:
Complete plugin API contract.

[Open Project]
```

The portfolio view should make lifecycle state visually obvious.

Recommended lifecycle states include:

```text
PLANNED
ACTIVE
BLOCKED
MAINTENANCE
PAUSED
SUPERSEDED
ARCHIVED
COMPLETE
```

These states should describe project lifecycle rather than subjective quality.

---

## Project Detail Pages

Each project should have a dedicated page containing the information necessary to understand and resume work.

### Overview

Briefly explain:

- what the project does;
- its current objective;
- current lifecycle state;
- major architecture;
- important constraints.

### Repositories

List every known repository and its relationship to the project.

Example:

```text
Repository                 Role
------------------------------------------------
tsrnc2/kitt                Canonical implementation
tsrnc2/llm_reasoning...    Imported reasoning framework
tsrnc2/improved            Historical predecessor
```

Historical repositories should remain visible but clearly marked.

### Current Work

Show:

- tasks being executed;
- assigned agent;
- task start time;
- latest heartbeat;
- branch;
- candidate commit;
- state.

### Next Tasks

Display work that is dependency-ready.

This is particularly important for automated agents.

Instead of an agent independently deciding what to work on, it should preferably select from tasks marked:

```text
READY
```

### Blockers

Every blocker should have its own record.

Example:

```text
BLOCKER-0042

Project:
Microkernel

Component:
K00

State:
OPEN

Reason:
Required QEMU execution surface unavailable.

Blocked task:
K00 real boot qualification

Last checked:
2026-09-25

Next resolution attempt:
Obtain authorized QEMU-capable execution environment.
```

Repeated failed attempts should not erase the original blocker history.

---

## Task Coordination

One of the most important functions of the Master Projects Site is preventing multiple agents from duplicating work.

Tasks should therefore support a lightweight **claim/lock system**.

A task could move through:

```text
AVAILABLE
    ↓
CLAIMED
    ↓
IN_PROGRESS
    ↓
VALIDATING
    ↓
COMPLETE
```

Alternative terminal states include:

```text
BLOCKED
FAILED
SUPERSEDED
CANCELLED
```

When an agent begins work, it should create or update a task claim containing:

```text
task_id
agent_id
claim_time
expiration
branch
repository
candidate_commit
status
```

Other agents should treat an active claim as ownership unless the lease expires or the task is explicitly released.

This should be implemented as a lease rather than a permanent lock.

If an agent crashes, disappears, loses network access, or fails to update its heartbeat, another agent must eventually be able to recover the task.

---

## Agent Heartbeats

Long-running agents should periodically update a small heartbeat record.

For example:

```yaml
agent: kitt-builder-02
task: KITT-PLUGIN-017
state: validating
last_heartbeat: 2026-09-25T18:10:00-07:00
```

The web interface could then display:

```text
Agent             Task                 State
-------------------------------------------------
builder-01        KITT-PLUGIN-016       working
builder-02        KITT-PLUGIN-017       validating
reviewer-01       KITT-PLUGIN-015       reviewing
```

This allows humans and other agents to determine whether work is actively progressing.

---

## Evidence-Based Completion

The tracker must distinguish between apparent progress and verified completion.

The following should **not automatically mean complete**:

- code exists;
- a branch exists;
- a pull request exists;
- a local test passed;
- a generated report exists;
- a workflow started;
- a deployment command was issued;
- a dashboard claims success.

Where relevant, a completed task should contain evidence such as:

```text
candidate commit
compiler versions
test command
test results
artifact hashes
deployment receipt
runtime verification
publication location
review result
```

For critical workflows, completion should reference the exact candidate that was tested.

If a different commit is later published, the previous qualification should not silently transfer to the new candidate.

---

## Build and Validation History

Each project should have a chronological execution history.

Example:

```text
2026-09-25
KITT plugin architecture
IMPLEMENTED

2026-09-25
Plugin schema validation
PASSED

2026-09-25
Whole-project Clang qualification
BLOCKED
Reason: dependency unavailable
```

This is significantly more useful than simply displaying the latest status because it preserves how that status was reached.

Failures should remain visible.

Negative evidence is part of the engineering record.

---

## Next Dependency-Ready Work

Every active project should ideally expose a single field:

```text
NEXT ACTION
```

This should describe the next executable task rather than a vague project objective.

Poor:

```text
Continue working on plugins.
```

Better:

```text
Implement and validate plugin manifest schema v1 against Gmail,
Google Drive, GitHub, and Notion adapters.
```

This makes agent delegation substantially easier.

---

## Blocker Management

A blocker should never become merely a sentence buried inside a report.

Blockers should be first-class objects.

Useful blocker fields include:

```text
blocker ID
project
task
severity
description
first observed
last verified
attempts
evidence
owner
workaround
resolution condition
```

The system should distinguish between:

```text
CODE BLOCKER
DEPENDENCY BLOCKER
INFRASTRUCTURE BLOCKER
AUTHORIZATION BLOCKER
EXTERNAL SERVICE BLOCKER
MISSING EVIDENCE
DESIGN DECISION
HARDWARE REQUIREMENT
```

Agents should check known blockers before repeating expensive work.

---

## Reports

Reports remain important, but they should supplement rather than replace structured project state.

Reports should continue following:

```text
<project>/reports/<agent>/
```

The Master Projects Site should maintain report indexes linking:

```text
report title
agent
date
project
task
report type
location
related commit
```

This makes reports searchable without flattening all reports into one central directory.

---

## Agent API

KITT and other automated systems should eventually access the tracker through a small stable API.

Possible endpoints include:

```text
GET /projects
GET /projects/{id}
GET /projects/{id}/tasks
GET /tasks/ready
POST /tasks/{id}/claim
POST /tasks/{id}/heartbeat
POST /tasks/{id}/release
POST /tasks/{id}/complete
POST /tasks/{id}/block
GET /blockers
GET /agents
```

Agents should not need to understand the website implementation.

The API contract should be versioned.

For example:

```text
/api/v1/
```

Future versions can then evolve without breaking older agents.

---

## Human/Robot Collaboration

The key design objective is that humans and machines operate on the same underlying state.

Humans interact through:

- project pages;
- dashboards;
- task lists;
- blocker pages;
- reports;
- repository links.

Agents interact through:

- structured files;
- Git;
- API endpoints;
- machine-readable schemas.

Neither should maintain a separate authoritative project database.

Otherwise state will eventually diverge.

---

## GitHub Features

The tracker should use GitHub capabilities where they provide real benefit.

Useful integrations include:

- Issues for externally discussable work;
- pull requests for state and schema changes;
- branch protection where appropriate;
- releases for stable tracker versions;
- Discussions for architectural decisions;
- Pages for the public/private-compatible web interface;
- repository history for auditability.

GitHub Actions should not become a mandatory dependency for the tracker if Actions repeatedly interfere with existing engineering workflows.

Static Pages generation or another simple publishing path should remain possible without turning CI availability into a blocker.

---

## Security and Integrity

Tracking information influences autonomous agent behavior, so tracker integrity matters.

Agents should not blindly trust arbitrary modifications.

Important structured state can eventually support:

- schema validation;
- signed commits;
- hash verification;
- provenance records;
- permission boundaries;
- agent identities;
- protected task transitions.

A malicious or accidental change such as:

```text
task.status = complete
```

must not be sufficient to falsely establish qualification.

Completion evidence should remain independently inspectable.

---

## Historical Continuity

The Master Projects Site should preserve project evolution.

For example:

```text
Improved
    ↓
Improved V2
    ↓
KITT
```

Rather than deleting the previous identities, they should remain recorded as historical relationships.

Likewise:

```text
ACTIVE
SUPERSEDED_BY
MERGED_INTO
RENAMED_TO
FORKED_FROM
EXPERIMENTAL_BRANCH_OF
```

should be explicit relationships.

This allows reports, old repositories, and earlier conversations to remain understandable years later.

---

## Project Discovery

When a new repository, Drive directory, report collection, service, or substantial workstream is discovered, agents should check whether it belongs to an existing parent before creating a new canonical project.

The sequence should be:

```text
Discover work
      ↓
Search master registry
      ↓
Existing project?
   /             \
 yes              no
  ↓                ↓
attach         create project
```

This prevents the registry from slowly accumulating duplicate representations of the same work.

---

## Master Projects Site as KITT Infrastructure

For KITT specifically, the Master Projects system should eventually become part of the orchestration infrastructure.

KITT should be able to ask:

```text
What work is available?
```

The tracker returns dependency-ready tasks.

KITT then claims one.

It performs the work.

During execution it sends heartbeats.

When validation succeeds it records evidence.

When validation fails it records the failure.

When something external prevents progress it creates or updates a blocker.

It releases the task when appropriate.

The next agent can resume from the exact recorded state.

This turns project execution into a persistent, distributed workflow rather than a collection of disconnected agent conversations.

---

## Desired Operating Loop

The intended long-term loop is:

```text
Discover
   ↓
Register
   ↓
Prioritize
   ↓
Check dependencies
   ↓
Claim task
   ↓
Execute
   ↓
Validate
   ↓
Record evidence
   ↓
Publish
   ↓
Update tracker
   ↓
Release task
   ↓
Select next dependency-ready task
```

A failure follows a similarly explicit path:

```text
Execute
   ↓
Failure
   ↓
Preserve evidence
   ↓
Determine blocker
   ↓
Record blocker
   ↓
Release or suspend task
   ↓
Select other dependency-ready work
```

Agents should not endlessly repeat a known blocked operation.

---

## Guiding Principles

The Master Projects Site should follow a few durable rules.

**One project identity.** Maintain one canonical record for each durable project.

**Reality over organization.** Describe existing repositories and directories rather than moving them purely to make the index prettier.

**Structured data first.** Anything agents need to reason about should exist in machine-readable form.

**Human readability.** The same information must remain understandable through a simple website.

**Evidence over claims.** Completed work should link to validation evidence.

**Failures remain visible.** Do not erase unsuccessful work.

**Explicit ownership.** Agents should claim tasks before modifying shared work.

**Recoverable locks.** Agent ownership must expire safely after inactivity.

**Dependency-aware execution.** Prefer the next genuinely executable task.

**No duplicate effort.** Agents should inspect existing work, task claims, and blockers first.

**Historical continuity.** Renames, migrations, merges, and superseded projects should remain traceable.

**Cross-system linking.** GitHub code, Google Drive reports, websites, artifacts, and related resources should all be discoverable from the project record.

---

## Long-Term Goal

The Master Projects Site should eventually become the authoritative operational map of the entire project ecosystem.

A person should be able to open one website and understand what exists, what changed, what is being built, what failed, and what should happen next.

An agent should be able to query the same system and determine:

```text
what work exists
what work is available
what work is already owned
what dependencies exist
what evidence is required
what blockers are known
what exact state the previous agent left behind
```

The result is more than a portfolio website.

It is a **shared project coordination and provenance system for humans and autonomous agents**, backed by Git, linked to the actual engineering repositories and reports, and designed so that project status remains reproducible rather than dependent on conversation history.
