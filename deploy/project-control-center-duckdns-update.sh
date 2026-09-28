#!/usr/bin/env bash
set -euo pipefail

readonly expected_domain="projectcontrolcenter"
readonly domain="${1:-${expected_domain}}"

if [[ "${domain}" != "${expected_domain}" ]]; then
    echo "Refusing unexpected DuckDNS subdomain" >&2
    exit 64
fi

: "${CREDENTIALS_DIRECTORY:?systemd credentials directory is required}"
readonly token_file="${CREDENTIALS_DIRECTORY}/duckdns_token"

if [[ ! -r "${token_file}" ]]; then
    echo "DuckDNS credential is missing or unreadable" >&2
    exit 1
fi

token="$(tr -d '\r\n' < "${token_file}")"
if [[ -z "${token}" ]]; then
    echo "DuckDNS credential is empty" >&2
    exit 1
fi

response="$(curl --fail --silent --show-error --proto '=https' --tlsv1.2 --get \
    --data-urlencode "domains=${domain}" \
    --data-urlencode "token=${token}" \
    --data-urlencode "ip=" \
    "https://www.duckdns.org/update")"
unset token

if [[ "${response}" != "OK" ]]; then
    echo "DuckDNS update failed for ${domain}.duckdns.org" >&2
    exit 1
fi

echo "DuckDNS update succeeded for ${domain}.duckdns.org"
