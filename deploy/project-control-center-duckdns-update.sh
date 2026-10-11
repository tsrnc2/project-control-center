#!/usr/bin/env bash
set -euo pipefail
# Prevent inherited shell tracing/export-all from exposing credential contents.
set +ax

readonly expected_domain="projectcontrolcenter"
readonly domain="${1:-${expected_domain}}"

if [[ "${domain}" != "${expected_domain}" ]]; then
    echo "Refusing unexpected DuckDNS subdomain" >&2
    exit 64
fi

# This template qualifies only an explicit IPv4 A-record update.
# The approved host config is separate from the provider credential.
readonly ipv4="${PCC_DUCKDNS_IPV4:-}"
if [[ ! "${ipv4}" =~ ^([0-9]{1,3}\.){3}[0-9]{1,3}$ ]]; then
    echo "Approved DuckDNS IPv4 address is missing or malformed" >&2
    exit 64
fi
IFS='.' read -r -a octets <<< "${ipv4}"
for octet in "${octets[@]}"; do
    if [[ ${#octet} -gt 1 && "${octet:0:1}" == "0" ]] || (( 10#${octet} > 255 )); then
        echo "Approved DuckDNS IPv4 address is malformed" >&2
        exit 64
    fi
done

: "${CREDENTIALS_DIRECTORY:?systemd credentials directory is required}"
readonly token_file="${CREDENTIALS_DIRECTORY}/duckdns_token"

if [[ ! -r "${token_file}" ]]; then
    echo "DuckDNS credential is missing or unreadable" >&2
    exit 1
fi

# Read in the shell; do not export the credential to child processes.
unset token
token="$(<"${token_file}")"
token="${token%$'\r'}"
if [[ ! "${token}" =~ ^[A-Za-z0-9_-]{1,256}$ ]]; then
    echo "DuckDNS credential is empty or malformed" >&2
    exit 1
fi

# curl reads the token from stdin. Its arguments contain only token@-.
# --disable must be first to prevent user curl configuration from adding tracing.
response="$(printf '%s' "${token}" | curl --disable --fail --silent --show-error \
    --proto '=https' --tlsv1.2 --connect-timeout 10 --max-time 30 --get \
    --data-urlencode "domains=${domain}" \
    --data-urlencode 'token@-' \
    --data-urlencode "ip=${ipv4}" \
    "https://www.duckdns.org/update")"
unset token

if [[ "${response}" != "OK" ]]; then
    echo "DuckDNS update failed for ${domain}.duckdns.org" >&2
    exit 1
fi

echo "DuckDNS update succeeded for ${domain}.duckdns.org"
