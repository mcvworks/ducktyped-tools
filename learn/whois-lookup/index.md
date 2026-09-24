# WHOIS and RDAP Lookup: Read Domain Registration Results

Canonical source: https://ducktyped.xyz/learn/whois-lookup/

Last reviewed: September 24, 2026

Find the registrar, understand renewal dates and domain statuses, and know when a missing result needs another lookup. Registration data is one part of an investigation; it does not establish website ownership, availability, or trust on its own.

## Start with RDAP for Current Registration Data

For generic top-level domains such as .com, .org, and .xyz, use [ICANN Lookup](<https://lookup.icann.org/en>) to check the current RDAP record. ICANN made RDAP the definitive source for gTLD registration information on January 28, 2025. Legacy WHOIS services may still respond, but coverage varies. For a country-code domain, check the relevant registry’s own service.

RDAP returns structured JSON over HTTPS. Traditional WHOIS returns text over port 43, with field names that differ between providers. Neither format guarantees that personal contact details will be public. See [ICANN’s transition notice](<https://www.icann.org/en/announcements/details/icann-update-launching-rdap-sunsetting-whois-27-01-2025-en>).

## Choose the Lookup That Answers Your Question

| Question | Useful next check |
| --- | --- |
| Which company manages my registration? | Find the registrar in RDAP, then use its account or support service. The registrar can differ from the DNS and hosting companies. |
| When do I need to renew? | Compare the published expiration event with your registrar account, renewal settings, and receipts. A public date is not proof that your payment succeeded. |
| Why does the website not load? | Look for hold statuses, then follow the [DNS, TLS, and HTTP diagnostic guide](<https://ducktyped.xyz/learn/website-not-loading/>). |
| Can I register this name? | Confirm availability with the registry or a registrar. A failed WHOIS query or missing DNS record is insufficient. |
| Who hosts the website? | Inspect [DNS records](<https://ducktyped.xyz/dns-lookup/>) and the resulting IP network. A CDN or shared address may hide the origin host. |

## Read the Fields without Overinterpreting Them

- **Registrar:** the registration provider, not necessarily the registrant, reseller, DNS operator, or web host.
- **Registration / creation:** a recorded registration event. It does not prove continuous operation or ownership since that date.
- **Expiration:** a registration lifecycle date. It is separate from TLS certificate expiry and from a promised public release date.
- **Last changed / updated:** a change to the registration object. It does not identify exactly which field changed or when the website content changed.
- **Nameservers:** published delegation information. Use DNS queries to check the records currently returned to your resolver.
- **Contacts:** only what the service publishes. Redacted or proxy contacts are not evidence of wrongdoing.

## Common Domain Statuses and What to Do

WHOIS often uses camelCase EPP names; RDAP can show spaced versions such as `client transfer prohibited`. These are selected examples; read every status returned. [ICANN explains the lifecycle codes](<https://www.icann.org/resources/pages/epp-status-codes-list-2014-06-18-en>), and [IANA lists RDAP values](<https://www.iana.org/assignments/rdap-json-values/>).

### `clientTransferProhibited`

A registrar transfer lock. Usually no action is needed unless you intend to transfer the name; ask your registrar about unlocking.

### `clientHold` / `serverHold`

DNS activation is withheld by the registrar or registry. Contact the registrar to establish the cause and restoration requirements.

### `redemptionPeriod`

The registration is in a restoration period after a deletion request. Contact the registrar promptly if you want to recover it; changing DNS will not restore it.

### `pendingDelete`

Read alongside other statuses. When it appears without redemption or restoration status, deletion is pending; ask the registrar what options remain.

## Example: A Lock Is Not an Outage Diagnosis

This fictional summary illustrates how to read a result:

```
Domain: example.test
Registrar: Example Registrar
Registration: 2024-04-10
Expiration: 2027-04-10
Status: clientTransferProhibited
Nameserver: ns1.dns-provider.test
```

You can infer that the record describes a locked registration with a listed nameserver and expiration date. You cannot infer that the website works, that it is safe, that its TLS certificate is valid, or that its owner has paid the next renewal. For an outage, continue with DNS and a request to the affected URL.

## Using DuckTyped’s WHOIS / IP Lookup

1. Enter the registered domain, such as `example.com`, in the [lookup tool](<https://ducktyped.xyz/whois-lookup/>). A web path or application subdomain may not be a separate registration.
2. The domain tool currently summarizes legacy WHOIS output. Missing fields can reflect provider formatting or an unavailable legacy service. Use the ICANN RDAP link to verify a current gTLD record.
3. Results may be cached. For renewal, transfer, or outage decisions, confirm current data with the authoritative service and your registrar account.
4. An IPv4 address selects the IP information lookup instead. ISP and approximate location describe a network, not the identity or precise location of a person.

Keep the queried name, source, lookup time, returned status, and exact error when asking for help. Avoid assuming that an older domain is trustworthy or that a newer domain is malicious. See the [data-handling and caching details](<https://ducktyped.xyz/privacy/>).

## Frequently Asked Questions

### Is WHOIS still used in 2026?

Some services still offer WHOIS, but RDAP became the definitive source for generic top-level domain registration data on January 28, 2025. Country-code registries have their own lookup services and policies.

### Does an empty lookup mean a domain is available?

No. A missing record can reflect an unsupported service, a failed query, redaction, or parsing limits. DNS NXDOMAIN also does not prove registration availability. Check with the registry or a registrar.

### Does clientTransferProhibited stop a website working?

That status blocks registrar transfers; it does not itself suspend DNS. If the website is unavailable, check for hold statuses and investigate DNS, TLS, and HTTP separately.

### Can I find the person who owns a domain?

Public records may identify the registrar and published contacts, but personal details can be withheld or replaced by a privacy service. An organization name or IP location does not establish the identity of the website operator.
