# DuckDNS hostname for Project Control Center

Proposed hostname: **`projectcontrolcenter.duckdns.org`**.

Status: **NOT YET CONFIRMED REGISTERED OR ROUTED**. Canonical task: `PCC-WEB-023-DUCKDNS` in KITT control-plane. This document contains no token and grants no permission to reuse another project's DuckDNS account or host.

## Provider facts

DuckDNS's current update API accepts the subname plus an account token over HTTPS. The `.duckdns.org` suffix is omitted from the `domains` parameter. When `ip` is omitted/empty, DuckDNS can detect the caller's IPv4 address. See the provider's current specification: https://www.duckdns.org/spec.jsp

Registration/account ownership is distinct from updating an already-owned subdomain. Do not infer registration or availability from a failed DNS/HTTP lookup.

## Activation prerequisites

1. PCC-WEB-004 has selected and approved the production host/IP.
2. The intended DuckDNS account has authenticated access and has registered `projectcontrolcenter`.
3. The host has an approved secret file at `/etc/project-control-center/duckdns-token`, mode 0600/root-owned or stronger platform equivalent. Never put this token in Git, chat, logs, unit files, shell history, screenshots, or reports.
4. The approved root-owned `/etc/project-control-center/duckdns-host.env` contains `PCC_DUCKDNS_IPV4=<approved literal IPv4 address>`. The address must come from the separately approved PCC host decision; do not use caller autodetection. This template supports an A-record update only. IPv6/AAAA configuration and stale-record handling require a separate approved adaptation and external verification before activation.
5. The updater script and systemd unit below have been independently reviewed on the exact candidate.
6. The HTTP service/reverse proxy is configured for `projectcontrolcenter.duckdns.org`.
7. DNS is externally verified before requesting the TLS certificate.
8. TLS issuance/renewal and HTTP->HTTPS redirect are verified before public activation.

## Prepared host templates

- `deploy/project-control-center-duckdns-update.sh`
- `deploy/project-control-center-duckdns.service`
- `deploy/project-control-center-duckdns.timer`

The service uses systemd `LoadCredential=` so the updater reads the token from `$CREDENTIALS_DIRECTORY/duckdns_token`. The script accepts only the expected `projectcontrolcenter` subname and a canonical literal approved IPv4 address. Missing/malformed address or credential fails before curl. Token files contain 1–256 ASCII letters, digits, underscores or hyphens, optionally followed by a line ending; multiline/other content is rejected. Credential bytes pass to curl through stdin, never through argv or an exported environment variable. Inherited shell tracing/export-all is disabled before reading the credential, and curl user configuration is disabled. The request uses an explicit `ip` parameter, a 10-second connection budget and a 30-second total budget; the unit bounds execution at45seconds. Any response other than exactly `OK` fails.

The templates are inert repository files. Do not install/enable them until the approved host and DuckDNS registration exist.

## Verification evidence required

Preserve, without secrets:

- DuckDNS account confirmation of the registered subdomain.
- External DNS A/AAAA answers and the approved target IP.
- HTTPS status and redirect behavior.
- Certificate hostname, issuer, fingerprint, issue/expiry times, and renewal test.
- systemd timer/service status with token values redacted/absent.
- rollback procedure: stop/disable timer, remove/replace DNS target through authenticated provider action, and remove the site route/certificate only under its own change authorization.

A successful DuckDNS update is not proof that the application is production-ready.
