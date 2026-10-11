# Finding-linked DNS template repair

**Prepared and offline validated. Independent acceptance remains required.**

Original review: [KITT PR130](https://github.com/tsrnc2/kitt/pull/130), frozen PCC PR18 candidate `b156efe6d2a700feb76c495c0a136026a3f008c8`. Repair code revision: `30ebb49be83dda5d9481fa0e31265db40ff2541a`. Five source/test files read back exactly.

PCC-DNS-001: credential bytes now pass through stdin to curl's `token@-` input instead of process arguments. Before reading the credential, the script disables inherited tracing/export-all and clears an inherited exported token. Curl user config is disabled to prevent configuration-added tracing. Tests check argv, exported environment, trace output and the actual installed curl's stdin transport.

PCC-DNS-002: require `PCC_DUCKDNS_IPV4` from a separately approved root-owned host configuration. Validate canonical literal IPv4 octets and reject absent/malformed input before curl. The request carries the explicit target rather than caller autodetection. This inert template supports **IPv4 A-record updates only**; IPv6/AAAA and stale-record policy require separately approved adaptation and external verification. It does not qualify that any configured address is actually approved or reachable.

PCC-SOURCE-003: programme documentation now pins the same23-assignment48e868… revision as the reviewed page. A regression binds both references.

Network operations are bounded to10seconds connection/30seconds total; systemd unit execution to45seconds. The unit requires the separate host EnvironmentFile and retains LoadCredential and its existing sandbox settings.

## Actual validation

26 unittest methods pass:9 existing page methods plus17 boundary methods, zero failures/skips. Invalid-input subcases remain inside their methods and are not extra independent trials. Initial25-method run passed, then the added real-curl transport check produced the final26-method pass. The real transport test uses a local HTTP server only, while the production template continues to require HTTPS to DuckDNS. No provider/account/token/DNS/host mutation occurred.

Shell syntax passes. systemd-analyze verify passes on a temporary copy whose only substitution points ExecStart to the locally existing Bash/script; this checks directives, not installed-path correctness or actual systemd service/credential behavior. No full PCC regression, host qualification or TLS/DNS evidence is claimed.

Primary API/transport reference: [DuckDNS specification](https://www.duckdns.org/spec.jsp) and [curl manual](https://curl.se/docs/manpage.html). Actual code/test outputs are in EXECUTIONS.json.

## Acceptance and integration

This branch is a bounded repair **against PR18's source branch**, preserving the frozen reviewed candidate. It is not a current-main programme merge. Review the new exact digest independently before integrating it. Parent's different-family acceptance, full current-main/conflict reconciliation, approved account/host and external DNS/TLS/rollback evidence remain required. The owner-authorized interim T7 repair author cannot independently accept its own patch. No deployment or activation is performed.
