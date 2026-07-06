# DuckTyped — Free, Privacy-First Developer Tools

**[ducktyped.xyz](https://ducktyped.xyz)** · 50+ web-based utilities for developers and IT pros. No sign-up, no tracking, no ads.

![License: MIT](https://img.shields.io/badge/license-MIT-blue) ![Privacy](https://img.shields.io/badge/tracking-none-brightgreen) ![No sign-up](https://img.shields.io/badge/sign--up-not%20required-brightgreen) ![Static](https://img.shields.io/badge/stack-static%20HTML%2FJS-orange)

DuckTyped is a collection of fast, no-nonsense developer utilities. Most run entirely **client-side in your browser** — your data never leaves your device. There are no analytics scripts, no cookies, and no accounts. This repository is the frontend, published openly so anyone can verify that claim.

> **Why open source?** Our whole pitch is "no tracking." Open source lets you check the code and confirm it — and self-host it if you'd rather.

## Tools

Browse everything at **[ducktyped.xyz/utility](https://ducktyped.xyz/utility/)**. A selection by category:

| Category | Tools |
|---|---|
| **Network** | [DNS Lookup](https://ducktyped.xyz/dns-lookup/) · [DNS Propagation](https://ducktyped.xyz/dns-propagation/) · [WHOIS](https://ducktyped.xyz/whois-lookup/) · [Reverse DNS](https://ducktyped.xyz/reverse-dns/) · [ISP Lookup](https://ducktyped.xyz/isp-lookup/) · [Port Scanner](https://ducktyped.xyz/port-scanner/) · [HTTP Latency](https://ducktyped.xyz/http-latency/) · [Traceroute](https://ducktyped.xyz/traceroute/) · [Subnet Calculator](https://ducktyped.xyz/subnet-calculator/) · [MAC Lookup](https://ducktyped.xyz/mac-lookup/) |
| **Security & Certs** | [SSL Checker](https://ducktyped.xyz/ssl-checker/) · [CSR Decoder](https://ducktyped.xyz/csr-decoder/) · [Public Key Decoder](https://ducktyped.xyz/public-key-decoder/) · [JWT Decoder](https://ducktyped.xyz/jwt-decoder/) · [JWT Generator](https://ducktyped.xyz/jwt-generator/) · [Hash Generator](https://ducktyped.xyz/hash-generator/) · [HMAC Generator](https://ducktyped.xyz/hmac-generator/) · [Password Generator](https://ducktyped.xyz/password-generator/) · [Breach Checker](https://ducktyped.xyz/breach-checker/) · [Security Headers](https://ducktyped.xyz/security-headers/) |
| **Email** | [Email Validator](https://ducktyped.xyz/email-validator/) · [Header Analyzer](https://ducktyped.xyz/email-header-analyzer/) · [SMTP Checker](https://ducktyped.xyz/smtp-checker/) · [Blacklist Checker](https://ducktyped.xyz/blacklist-checker/) |
| **Encoding & Data** | [JSON Formatter](https://ducktyped.xyz/json-formatter/) · [Base64](https://ducktyped.xyz/base64-encoder/) · [Base32](https://ducktyped.xyz/base32-encoder/) · [URL Encoder](https://ducktyped.xyz/url-encoder/) · [URL Parser](https://ducktyped.xyz/url-parser/) · [Query String Parser](https://ducktyped.xyz/query-string-parser/) · [UUID Generator](https://ducktyped.xyz/uuid-generator/) · [ASCII Table](https://ducktyped.xyz/ascii-table/) |
| **Dev Utilities** | [Regex Tester](https://ducktyped.xyz/regex-tester/) · [Cron Parser](https://ducktyped.xyz/cron-parser/) · [Timestamp Converter](https://ducktyped.xyz/timestamp-converter/) · [Timezone Converter](https://ducktyped.xyz/timezone-converter/) · [Color Converter](https://ducktyped.xyz/color-converter/) · [Text Diff](https://ducktyped.xyz/text-diff/) · [.env Parser](https://ducktyped.xyz/env-file-parser/) · [Docker Compose Validator](https://ducktyped.xyz/docker-compose-validator/) · [HTTP Request Builder](https://ducktyped.xyz/http-request-builder/) · [Webhook Tester](https://ducktyped.xyz/webhook-tester/) |
| **Web / URL** | [URL Safety](https://ducktyped.xyz/url-safety/) · [Redirect Checker](https://ducktyped.xyz/redirect-checker/) · [Link Checker](https://ducktyped.xyz/link-checker/) · [Metadata Extractor](https://ducktyped.xyz/metadata-extractor/) · [Tech Detector](https://ducktyped.xyz/tech-detector/) · [robots.txt Analyzer](https://ducktyped.xyz/robots-analyzer/) |
| **QR & Misc** | [QR Generator](https://ducktyped.xyz/qr-generator/) · [QR Scanner](https://ducktyped.xyz/qr-scanner/) · [Device Lookup](https://ducktyped.xyz/device-lookup/) · [Plain Notes](https://ducktyped.xyz/plain-notes/) |

There are also **[Learn](https://ducktyped.xyz/learn/)** guides explaining the concepts behind each tool, and **[Troubleshooting](https://ducktyped.xyz/errors/)** pages with fixes for common errors (DNS_PROBE_FINISHED_NXDOMAIN, 502 Bad Gateway, SMTP 550, and more).

## Tech stack

Deliberately minimal — the whole point is fast, dependency-light pages:

- Static **HTML + vanilla JavaScript**, no build step, no framework
- No analytics, no trackers, no third-party scripts
- One crawlable URL per tool
- Hosted on Cloudflare Pages

## Running it locally

Because it's just static files, any static server works:

```bash
# from this directory
python3 -m http.server 8080
# then open http://localhost:8080
```

Or use `npx serve`, `caddy file-server`, nginx, etc.

**Note on network tools:** The many client-side tools — encoders, formatters, hashing, regex, JWT, QR, diffing, and more — run fully standalone with no backend. The **network/lookup tools** (DNS, SSL, WHOIS, ping, port scan, email diagnostics) call the hosted DuckTyped API for the server-side work, which is not part of this repository. Those tools will show connection errors when self-hosted without your own backend.

## Contributing

Issues and PRs welcome — bug fixes, new client-side tools, and doc improvements especially. Please keep additions consistent with the project's ethos: **client-side where possible, no trackers, no heavy dependencies.**

## License

[MIT](./LICENSE) © duckTyped
