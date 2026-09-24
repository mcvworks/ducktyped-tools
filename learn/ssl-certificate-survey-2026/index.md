# SSL Certificates on the Top 1,000 Websites: 2026 Survey

Canonical source: https://ducktyped.xyz/learn/ssl-certificate-survey-2026/

Data collected: September 18, 2026. Report and share charts reviewed September 24, 2026.

On September 18, 2026 we checked 1,000 domains from Tranco list V3YPN and observed 712 TLS certificates. Of those certificates, 76.5% had lifetimes of 200 days or less. Within this single-date sample, the median lifetime was 395 days for certificates issued before March 15, 2026 and 91 days for those issued on or after that date.

The full per-domain dataset is a [free CSV download](<https://ducktyped.xyz/data/ssl-survey-2026-09.csv>). To check any single domain yourself, use the [SSL Certificate Checker](<https://ducktyped.xyz/ssl-checker/>).

## Key Findings

Sites presenting a certificate

712

of 1,000 domains scanned

Median lifetime, newer issuance cohort

91 days

older issuance cohort in this sample: 395 days

Valid certificate chain

95.9%

29 sites failed validation

Negotiated TLS 1.3

82.2%

the rest negotiated TLS 1.2

Within 30 days of expiry

48

11 of them within 7 days

Wildcard certificates

62.4%

cover \*.domain names

## The 200-Day Limit Is Already Visible

In April 2025 the CA/Browser Forum passed [ballot SC-081v3](<https://cabforum.org/2025/04/11/ballot-sc081v3-introduce-schedule-of-reducing-validity-and-data-reuse-periods/>), which shortens the maximum lifetime of publicly trusted TLS certificates in three steps. The first step took effect on March 15, 2026.

| Issued on or after | Maximum lifetime | Operational note |
| --- | --- | --- |
| (before March 15, 2026) | 398 days | Previously issued certificates keep their original expiry. |
| **March 15, 2026** | **200 days** | Issuers can choose shorter lifetimes. |
| March 15, 2027 | 100 days | Prepare for more frequent renewal and deployment. |
| March 15, 2029 | 47 days | Test automated renewal and monitor the served certificate. |

Of the 167 certificates with a lifetime over 200 days, 166 were issued before the cap and are simply running out their original term. The single exception, `sberbank.ru`, was not trusted by the scanner’s root store; this observation alone is not a finding of a public-CA rule violation.

Certificate lifetime on the top 1,000 sites

Number of certificates by lifetime in days (n = 712)

- Issued before March 15, 2026 (166)
- Issued on or after March 15, 2026 (546)

View this data as a table

| Lifetime | Policy era | Issued before cap | Issued after cap | Total |
| --- | --- | --- | --- | --- |
| ≤ 47 days | 2029 limit | 0 | 8 | 8 |
| 48–100 | 2027 limit | 0 | 289 | 289 |
| 101–200 | current limit | 0 | 248 | 248 |
| 201–398 | pre-2026 limit | 164 | 1 | 165 |
| \> 398 | pre-2020 rules | 2 | 0 | 2 |

Source: duckTyped scan of the Tranco top 1,000 (list V3YPN), 2026-09-18.

Certificates issued since the cap fall into two clean clusters: **289** at roughly 90 days (the automated-issuance default used by Let's Encrypt and Google Trust Services) and **248** at just under 200 days, where the commercial CAs now issue right up to the ceiling. These counts describe this sample, not all new certificate issuance.

### Some operators are already at the 2029 limit

8 sites present certificates of 47 days or less — three years before they have to: `nflximg.com`, `fastly.net`, `kaspersky-labs.com`, `arxiv.org`, `time.com`, `aliyuncs.com`, `digicert.com`, `dnsmadeeasy.com`. Two patterns stand out. `digicert.com` runs a 47-day certificate on its own site, and several Fastly-hosted properties use 30-day certificates from Certainly, the certificate authority Fastly operates. Short lifetimes make reliable automation especially useful, but this scan does not establish how each operator renews certificates.

## Who Issues the Web's Certificates

Six issuers account for 89.9% of the certificates on top sites. This issuer distribution describes the observed sample; it is not an estimate of global certificate-authority market share.

Certificate issuer share

Share of the 712 certificates observed, by issuing organization

View this data as a table

| Issuer | Sites | Share |
| --- | --- | --- |
| DigiCert | 158 | 22.2% |
| Google Trust Services | 134 | 18.8% |
| Let's Encrypt | 121 | 17.0% |
| Amazon Trust Services | 97 | 13.6% |
| GlobalSign | 78 | 11.0% |
| Sectigo | 52 | 7.3% |
| All other issuers | 72 | 10.1% |

Source: duckTyped scan of the Tranco top 1,000 (list V3YPN), 2026-09-18. Issuer is the organization named in the leaf certificate's issuer field.

## Cutting It Close: Expiry Margins

Among sites with a valid chain, the median certificate had 77 days left. But 48 were within 30 days of expiry and 11 within a week — including Meta's main properties (`facebook.com`, `instagram.com`, `whatsapp.com`), which all shared a 91-day certificate with 7 days remaining.

A short remaining lifetime does not by itself indicate a renewal failure. This scan cannot establish the operator’s renewal schedule or whether a later renewal succeeded. Monitor both automation failures and the certificate served to clients to catch [expiry problems](<https://ducktyped.xyz/errors/ssl/ssl-certificate-expired>).

## What Fails Validation

29 of 712 sites (4.1%) presented a certificate that failed the scanner’s hostname or trust-chain validation:

- **23 hostname mismatches.** Almost all are infrastructure domains rather than websites — `googlevideo.com`, `windows.net`, `edgekey.net`, `trbcdn.net` — where the bare domain answers on port 443 with a certificate for a different name. See [SSL certificate invalid](<https://ducktyped.xyz/errors/ssl/ssl-certificate-invalid>).
- **3 expired certificates**, all expired more than a year before the scan: the most recent expired 2,138 days before the scan. 2 of them carry lifetimes of 426 days, issued under rules that predate even the 398-day limit.
- **3 untrusted or incomplete chains**, as judged against the scanner’s bundled root store. See [certificate chain invalid](<https://ducktyped.xyz/errors/ssl/certificate-chain-invalid>) and [NET::ERR\_CERT\_AUTHORITY\_INVALID](<https://ducktyped.xyz/errors/ssl/net-err-cert-authority-invalid>).

## Protocol Versions and Key Types

**82.2%** of sites negotiated TLS 1.3 when offered it; the remaining 17.8% negotiated TLS 1.2. The scanner did not offer TLS 1.0 or 1.1, so a server limited to those would appear among the 7 handshake failures rather than here. For how the two differ, see [How SSL/TLS Handshakes Work](<https://ducktyped.xyz/learn/ssl-tls-handshake/>).

Within this sample, RSA-2048 is still the most common leaf key at 61.9%, with ECDSA P-256 at 35.1%.

View this data as a table

| Leaf key | Sites | Share |
| --- | --- | --- |
| RSA-2048 | 441 | 61.9% |
| ECDSA P-256 | 250 | 35.1% |
| RSA-4096 | 11 | 1.5% |
| ECDSA P-384 | 6 | 0.8% |
| RSA-3072 | 4 | 0.6% |

## What This Means for Your Certificates

1. **Automate renewal now, not in 2029.** The 100-day limit arrives in March 2027. Use an ACME client or managed certificate service where appropriate, and test renewal and deployment. Automation still needs monitoring; the next issuance cap does not shorten a certificate already issued.
2. **Monitor expiry independently of renewal.** Automation fails silently — a changed DNS record or an expired API token stops renewals without telling anyone. Check what your server is actually presenting with the [SSL Certificate Checker](<https://ducktyped.xyz/ssl-checker/>).
3. **Audit the names nobody visits.** Most broken certificates in this scan were on hostnames that are not websites. Apex domains, legacy subdomains and redirect hosts are where expired certificates hide.
4. **Reissuing? Check the request first.** Shorter lifetimes mean more CSRs. Verify the names and key size with the [CSR Decoder](<https://ducktyped.xyz/csr-decoder/>) before submitting.

## Download Charts and Cite the Survey

Use these charts in an article, presentation, or post with a link to this survey. Keep the scan date, denominator, and limitations with the chart: these are observations from one sample, not global market-share estimates.

- Certificate lifetimes: [PNG (1200 × 630)](<https://ducktyped.xyz/data/ssl-survey-2026-09/certificate-lifetimes.png>) · [SVG](<https://ducktyped.xyz/data/ssl-survey-2026-09/certificate-lifetimes.svg>)
- Certificate issuers: [PNG (1200 × 630)](<https://ducktyped.xyz/data/ssl-survey-2026-09/certificate-issuers.png>) · [SVG](<https://ducktyped.xyz/data/ssl-survey-2026-09/certificate-issuers.svg>)

**Suggested citation:** duckTyped, “SSL Certificates on the Top 1,000 Websites — 2026 Survey.” Scan conducted September 18, 2026; Tranco list V3YPN; 712 certificates observed from 1,000 domains checked. [Download the source CSV](<https://ducktyped.xyz/data/ssl-survey-2026-09.csv>).

## Methodology and Limitations

- **Domain list:** the first 1,000 entries of the [Tranco list V3YPN](<https://tranco-list.eu/list/V3YPN>), a research-oriented ranking that aggregates several popularity sources.
- **Measurement:** TLS handshakes on port 443 with SNI. No HTTP request was sent. The scanner tried the bare domain first, then `www.` if no certificate was observed; a timeout could trigger one retry. Browser trust and connection behavior can differ; 53 sites answered only on `www`.
- **Coverage:** 288 domains presented no certificate — 174 could not be resolved by the scanner, 76 refused the connection, 31 timed out and 7 failed the handshake. A popularity ranking counts DNS and CDN infrastructure names (`gstatic.com`, `akamai.net`) that were never websites. All percentages use the 712 sites that presented a certificate as the denominator.
- **Validation:** chain validity is judged against the Mozilla root store bundled with Node.js 20, including hostname matching. Only the leaf certificate was analysed. Lifetime is `notAfter − notBefore`.
- **Cohort comparison:** older and newer issuance groups were observed on the same scan date. Older short-lived certificates may already have been replaced, so this is not a longitudinal before-and-after measurement.
- **Limitations:** one vantage point, one moment, IPv4 first. Large sites serve different certificates by region and by CDN edge, so another scanner may see a different certificate for the same domain. "Negotiated TLS 1.3" means the server chose it when offered; this scan did not test which older versions a server would still accept.

You are welcome to cite or reuse these figures with a link to this page. Download the [per-domain CSV](<https://ducktyped.xyz/data/ssl-survey-2026-09.csv>) (1,000 rows).

## Read and Reproduce the CSV

Start with `status`. The `certificate` rows are the 712 observations used for certificate percentages, including certificates that failed validation. Restrict to `chain_valid=true` only when answering a question about the scanner’s authorized connections. The remaining 288 rows record unsuccessful observations, not confirmed website outages.

The unsuccessful rows contain only the first four fields; CSV readers may represent later fields as missing or empty. Treat both as unavailable, never as `false` or zero. In Python, use the CSV parser rather than splitting on commas: issuer names can contain quoted commas, and the strings `"true"` and `"false"` are not Python booleans.

CSV column definitions

| Column | Format | Meaning |
| --- | --- | --- |
| rank | Integer | Position in the sampled Tranco list; one row per attempted domain. |
| domain | Hostname | The ranked domain from the input list. |
| host | Hostname or missing | The apex or www hostname that returned the observed certificate. Missing when neither yielded a certificate. |
| status | Text | certificate means a certificate was observed, even if validation failed. no\_certificate:\<reason\> means neither attempt yielded one; the reason records the apex attempt. |
| chain\_valid | true / false or missing | Node.js socket authorization result using the scanner’s bundled trust store and hostname check. Not a complete browser or revocation audit. |
| chain\_error | Text or missing | Reported authorization error for an observed certificate, or empty when authorized. Absent on no-certificate rows. |
| protocol | Text or missing | TLS version negotiated on this connection; does not enumerate all versions the server accepts. |
| issuer | Text or missing | Issuer organization, falling back to issuer common name. The report groups some issuer aliases; the CSV retains the scanner’s value. |
| not\_before / not\_after | YYYY-MM-DD or missing | Certificate validity dates in UTC, with time-of-day omitted. These are not the observation date. |
| lifetime\_days | Integer or missing | Full validity duration rounded to the nearest day before date strings were truncated. Subtracting the displayed dates can differ by one day. |
| days\_remaining | Integer or missing | Days until expiry at the time of the handshake, rounded down. Negative means expired then; zero can mean less than one day remained. Not a live countdown. |
| key\_type | EC / RSA or missing | Scanner classification: EC when curve information is present, otherwise RSA. Not a general inventory of every possible key algorithm. |
| key\_bits | Integer or missing | Key size reported by the TLS certificate parser. Missing is not a zero-length key. |
| san\_count | Integer or missing | Number of parsed Subject Alternative Name entries, including non-DNS entries where present. |
| wildcard | true / false or missing | Whether any parsed DNS SAN begins with a wildcard. Does not imply coverage of every subdomain. |

### Reproduce the 200-day Lifetime Count

Download the CSV, save it as `ssl-survey-2026-09.csv`, and run this Python 3 example in the same directory. It reads the saved file and makes no network requests.

```
import csv

with open("ssl-survey-2026-09.csv", newline="", encoding="utf-8") as source:
    rows = list(csv.DictReader(source))

certificates = [row for row in rows if row["status"] == "certificate"]
within_200_days = sum(int(row["lifetime_days"]) <= 200 for row in certificates)
print(f"Domains: {len(rows)}; certificates observed: {len(certificates)}")
print(f"Lifetimes <= 200 days: {within_200_days}/{len(certificates)} "
      f"({within_200_days / len(certificates):.1%})")
```

Expected output for this archived sample:

```
Domains: 1000; certificates observed: 712
Lifetimes <= 200 days: 545/712 (76.5%)
```

Keep the September 18, 2026 observation date with this result. Recomputing a count from the archive does not check any domain’s certificate today.

## Frequently Asked Questions

### What is the maximum SSL certificate validity in 2026?

For publicly trusted certificates issued on or after March 15, 2026, the maximum is 200 days. It falls to 100 days on March 15, 2027 and to 47 days on March 15, 2029, under CA/Browser Forum ballot SC-081v3. Certificates issued before each date keep their original lifetime until they expire.

### Which certificate authority is most common on top websites?

In this September 2026 scan of the Tranco top 1,000, DigiCert issued 22.2% of the 712 certificates observed, followed by Google Trust Services (18.8%) and Let's Encrypt (17.0%).

### How many top websites support TLS 1.3?

82.2% of the 712 sites that presented a certificate negotiated TLS 1.3 with a client offering it. The remaining 17.8% negotiated TLS 1.2. The scan did not offer TLS 1.0 or 1.1, so it cannot say how many servers still accept them.

### Can I reuse this data?

Yes. The full per-domain dataset is a free CSV download, and you are welcome to cite or reuse the figures with a link back to this page.

## Related Tools and Guides

- [SSL Certificate Checker](<https://ducktyped.xyz/ssl-checker/>) — inspect the served certificate and its dates
- [CSR Decoder](<https://ducktyped.xyz/csr-decoder/>) — inspect a certificate signing request before submitting it
- [Security Headers Checker](<https://ducktyped.xyz/security-headers/>) — HSTS and the rest of your HTTPS posture
- [How SSL/TLS Handshakes Work](<https://ducktyped.xyz/learn/ssl-tls-handshake/>) and the [SSL/TLS Cheat Sheet](<https://ducktyped.xyz/learn/ssl-tls-cheat-sheet/>)
- [Fixing an expired SSL certificate](<https://ducktyped.xyz/learn/ssl-certificate-expired/>) and all [SSL error guides](<https://ducktyped.xyz/errors/ssl/>)
