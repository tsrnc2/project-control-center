# Website programme and first presentation candidate

[Website lineup](../website.html) · [Dashboard](../index.html) · [Tracking issue](https://github.com/tsrnc2/project-control-center/issues/17)

## Canonical scope

The user requested a dedicated website task section and a commercially ready production project/research task-delegation hub. This change establishes the programme and prepares its first bounded presentation. It does NOT claim that the commercial application, authenticated backend or production qualification is complete.

Project Control Center is an ACTIVE-CHILD of KITT, with its own repository and roadmap. Existing project roots and history are preserved. The canonical private planning board is [KITT website assignments](https://github.com/tsrnc2/kitt/blob/5faf7d241aee37e2365a2764812170ad7ce26b2b/control-plane/assignments/project-control-center.json), PCC-WEB-001 through PCC-WEB-023. The human lineup is `tsrnc2/kitt/control-plane/assignments/WEBSITE.md`; an additive index references it without copying the existing portfolio board. Legacy schedulers reading only portfolio.json need separately reviewed index-reader integration.

`website.html` is a deliberately public, pinned navigation summary, not an editable source of task authority or a live snapshot. Its dates and unknown owner/ETA are labelled. On updates, reconcile with the canonical board and review the public-field selection; never export private task content or credentials to refresh this page. Do not use its static status to claim, take over or execute a task.

## Existing work retained

Dashboard timing/freshness/mobile PR14, KITT-A009/KITT-P006 publication work, LRP PR111/KITT PR10 tier admission, the existing cross-agent review workflow, and the prior bootstrap retain their scopes and owners. The keyword-search effort must be resolved to a concrete existing task before implementation; a descriptive reference is not permission to create a duplicate engine.

This candidate modifies only one existing dashboard navigation line and adds an isolated HTML/CSS planning view plus tests and this report. It does not modify app.js, existing task parsing, credentials, live snapshots, deployment configuration or the other PR's implementation. Website programme acceptance and PCC-WEB-001 baseline precede productive assignment promotion. The page is an unactivated presentation draft, not a declaration that PCC-WEB-003 passed all integration gates.

## Production target

The six stages cover baseline/UI, trust, delegation, research, operations and release. Bounded work includes authenticated/revocable sessions; workspace/project isolation; sanitized control-plane projections; tier-qualified exact-model routing; idempotent authorized commands; source/claim ledgers; permission-aware relevance search; private report references; role/tier-qualified independent review requests; end-to-end failure tests; actionable notifications; accessible mobile/desktop journeys; measured load/degradation; restore/migration/rollback; reproducible artifacts and dependency/license audits; commercial operating documents; independent release acceptance and an approved canary.

Implementation services should follow KITT's versioned C++ service model; reuse useful existing frontend code rather than rewrite solely for language preference. Generic skills, roles and tier semantics remain owned by LRP. An ALLOW rating or a review PASS never substitutes for action permission, cost/privacy policy, lease ownership or human deployment approval.

Each executable task must carry scope, capabilities, minimum worker/reviewer tier, dependencies, evidence and completion criteria. Unknown or unqualified models cannot self-promote. No fabricated owner/ETA, model benchmark, independent specialist execution or release evidence is included here.

## Commercial deployment boundary and references

- [GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits) prohibit using Pages as free commercial SaaS hosting. Keep a permitted static preview/documentation surface separate from an approved authenticated production application/API host. No host, billing or paid service was changed in the initial work. PCC-WEB-023 now proposes `projectcontrolcenter.duckdns.org`; registration/routing remain blocked on DuckDNS authentication and the approved production host.
- [OWASP ASVS](https://owasp.org/projects/asvs) supplies versioned requirements; the programme targets a 5.0.0 applicability/control/test matrix, not claimed certification.
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/) informs an AA target requiring automated and manual complete-journey evidence.

Before a commercial release, accountable owners must also decide licensing, brand/trademark use, terms/privacy, retention/export/deletion, support/incident responsibilities and any pricing/payment processing. This programme is not legal approval. SLO/RPO/RTO and workload targets must be explicitly approved and measured; do not advertise an untested SLA.

## DuckDNS hostname boundary

The proposed public hostname is `projectcontrolcenter.duckdns.org`. It is **not claimed registered or routed**. DuckDNS registration/account ownership is an authenticated provider action, and current DuckDNS update API calls require the account token. The target A/AAAA record also depends on the production host selected under PCC-WEB-004.

This repository may contain only secret-free updater/unit templates. The token must not be copied from CryptoKingpin, committed to Git, pasted into chat, printed to logs, or embedded in a service file. On an approved host, systemd credentials should inject a root-owned token file into the oneshot updater. See `docs/DUCKDNS.md` and `deploy/project-control-center-duckdns.*`. TLS/certificate provisioning happens only after the DNS record points at the approved host.

## Actual validation of this bounded candidate

- Original index.html bytes were verified against Git blob `ddd0d0b34802329be436bc4f499506f649aa6c83`. The candidate adds exactly one Website tasks navigation line; original panels and app.js are preserved.
- Eight offline standard-library tests passed: unique IDs, all 23 task IDs and minimum tiers, explicit non-live status, absence of scripts/forms/embedded credentials in the new page, allowed link schemes and anchors, immutable source/reuse references, navigation/panel preservation, and semantic accessibility primitives.
- Local system Chromium rendered the actual HTML in memory with the exact stylesheet injected. At 320, 390, 768 and 1280 pixels, all 23 entries were present; skip-link focus and keyboard expansion worked; collapsed and expanded layouts had no horizontal page overflow. A 390-pixel viewport with 200% text size also had no horizontal page overflow. No page runtime errors were observed.
- Desktop and mobile screenshots were visually inspected. These observations are layout checks, not a complete accessibility audit.
- The default Playwright browser executable was missing. The installed system Chromium was used instead. A synthetic-origin navigation attempt returned ERR_BLOCKED_BY_ADMINISTRATOR; no policy was disabled. The successful checks were in-memory local-content checks, NOT live navigation, HTTPS, link reachability or deployment verification.
- KITT registry replacement was checked locally to preserve all 24 prior entries and add exactly one child. The published registry blob matched the checked bytes. Drive insertion used a required revision guard and its exact inserted text was read back.

Run the bounded page tests from this repository:

```sh
python tests/test_website_lineup.py
```

No complete repository suite, PR14 regression suite, authenticated backend, real model dispatch, load/recovery drill, manual screen-reader test, independent review, public launch or production qualification is claimed. The programme deliberately records those as future acceptance gates.

## Review and next action

A separate authorized T7-capable engineering/security reviewer should inspect the exact candidate's public/private boundary, truthful snapshot labeling, task/role/tier consistency, duplication risks, source pinning and mobile/keyboard behavior. Review the canonical programme's dependency and release gates with source-bound findings. Then accept the bounded baseline task, reconcile existing owners and promote one eligible assignment. Do not merge or deploy merely because this author's local checks pass.
