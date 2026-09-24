# SSL Certificate Expired: Diagnose the Warning

Canonical source: https://ducktyped.xyz/errors/ssl/ssl-certificate-expired

Last reviewed: September 24, 2026

Check the certificate served for the failing hostname and your device clock. If the server certificate is expired, the site operator must renew and deploy it before HTTPS verification can succeed.

**You might see this error as:**

- `SSL certificate expired`
- `Certificate has expired`
- `SEC_ERROR_EXPIRED_CERTIFICATE`
- `Your connection is not private`
- `NET::ERR_CERT_DATE_INVALID`

## What the Error Means

A TLS certificate has a `notBefore` and `notAfter` date. A client checks that the current time falls within the allowed period, along with trust and hostname checks. A certificate-date warning does not establish that the site was compromised.

## Choose the Check That Matches Your Situation

- **Only your device fails:** check its date, time, and automatic time synchronization. Compare the same hostname from another device.
- **Several clients report expiry:** inspect the certificate actually served by that hostname. A renewed file on disk may not be deployed yet.
- **The leaf certificate dates look valid:** inspect the chain, hostname, and client trust store. Use the [certificate-chain guide](<https://ducktyped.xyz/errors/ssl/certificate-chain-invalid>) for a chain problem.
- **A CDN is in front:** distinguish browser-to-CDN TLS from CDN-to-origin TLS. Updating one certificate does not update the other.

## Inspect the Certificate Being Served

Use the [SSL Certificate Checker](<https://ducktyped.xyz/ssl-checker/>) for the public hostname, or run this OpenSSL inspection. Replace `example.com` in both places; `-servername` supplies SNI so a shared server can select the correct certificate.

```
openssl s_client -connect example.com:443 -servername example.com </dev/null 2>/dev/null |
  openssl x509 -noout -subject -issuer -dates
```

Illustrative output:

```
notBefore=Jun 22 00:00:00 2026 GMT
notAfter=Sep 20 23:59:59 2026 GMT
```

For a client whose correct date is September 24, 2026, that example has expired. This pipeline displays the leaf certificate; it is not a complete trust or hostname verification. If no certificate is returned, rerun the first command without hiding its diagnostic output.

## If You Own the Site

Find the component terminating TLS: a web server, ingress, load balancer, CDN, or managed host. Renew through the service that owns that certificate, deploy the new certificate and required chain, then verify from a client. Follow the [renewal and deployment walkthrough](<https://ducktyped.xyz/learn/ssl-certificate-expired/>) for Certbot, managed hosting, and checks when a renewed certificate still appears expired.

## If You Are Visiting the Site

After checking your clock, tell the operator the exact hostname and error. Avoid bypassing certificate verification or switching to plain HTTP to enter credentials. A browser warning cannot be repaired by clearing the site’s cookies.

## Current Certificate Lifetime Limits

Publicly trusted TLS certificates issued from March 15, 2026 through March 14, 2027 have a maximum validity of 200 days. The planned caps are 100 days from March 15, 2027 and 47 days from March 15, 2029. Previously issued certificates retain their original validity period. Individual issuers can use shorter lifetimes; use the certificate’s own dates. See the [CA/Browser Forum schedule](<https://cabforum.org/2025/04/11/ballot-sc081v3-introduce-schedule-of-reducing-validity-and-data-reuse-periods/>).

## Frequently Asked Questions

### Does NET::ERR\_CERT\_DATE\_INVALID always mean the certificate expired?

No. The client clock can be wrong, a certificate may not yet be valid, or a chain certificate may have a date problem. Compare the exact hostname’s certificate dates with a correctly synchronized clock.

### Can a visitor fix an expired certificate?

A visitor can correct their own device clock, but only the site operator can replace an expired server certificate. Report the hostname and error to the operator; do not bypass verification to sign in or send sensitive data.

### Why does my site still serve the old certificate after renewal?

Issuance and deployment are separate. The TLS terminator may still use an old file or secret, need a reload, or be a CDN or load balancer separate from the server you updated. Check what the affected hostname actually serves.

### Does an expired certificate mean my domain registration expired?

No. TLS certificates and domain registrations have separate expiration dates. Check certificate validity for an HTTPS warning and registration/DNS separately if the hostname stops resolving.

## Related Checks

- [NET::ERR\_CERT\_DATE\_INVALID](<https://ducktyped.xyz/errors/ssl/net-err-cert-date-invalid>): other causes of date-validation failures.
- [Renew, deploy, and verify an expired certificate](<https://ducktyped.xyz/learn/ssl-certificate-expired/>).
- [Our September 2026 certificate survey](<https://ducktyped.xyz/learn/ssl-certificate-survey-2026/>): measured lifetimes, methods, and downloadable data.

## Sources and Review

Reviewed September 24, 2026. Replace example hostnames and paths with your deployment values. Sample output is illustrative.

- [OpenSSL certificate inspection](<https://docs.openssl.org/3.5/man1/openssl-s_client/>)
- [curl certificate verification](<https://curl.se/docs/sslcerts.html>)
- [Public certificate validity schedule](<https://cabforum.org/2025/04/11/ballot-sc081v3-introduce-schedule-of-reducing-validity-and-data-reuse-periods/>)
