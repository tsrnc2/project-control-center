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
4. The updater script and systemd unit below have been independently reviewed on the exact candidate.
5. The HTTP service/reverse proxy is configured for `projectcontrolcenter.duckdns.org`.
6. DNS is externally verified before requesting the TLS certificate.
7. TLS issuance/renewal and HTTP->HTTPS redirect are verified before public activation.

## Prepared host templates

- `deploy/project-control-center-duckdns-update.sh`
- `deploy/project-control-center-duckdns.service`
- `deploy/project-control-center-duckdns.timer`

The service uses systemd `LoadCredential=` so the updater reads the token from `$CREDENTIALS_DIRECTORY/duckdns_token`. The script accepts only the expected `projectcontrolcenter` subname and treats any response other than exactly `OK` as failure.

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
