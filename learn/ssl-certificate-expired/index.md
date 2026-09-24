# Renew an Expired SSL Certificate and Verify the Fix

Canonical source: https://ducktyped.xyz/learn/ssl-certificate-expired/

Last reviewed: September 24, 2026

A renewal is complete when the affected hostname serves a trusted replacement certificate. Work through diagnosis, issuance, deployment, and an external check to avoid renewing the wrong certificate or leaving an old one in service.

## 1. Confirm Which Certificate Failed

Use the [SSL Checker](<https://ducktyped.xyz/ssl-checker/>) for the hostname from the warning. Compare its dates, issuer, and names with your deployment. If the warning appears only on one device, check its clock first. The [expired-certificate diagnostic guide](<https://ducktyped.xyz/errors/ssl/ssl-certificate-expired>) includes an OpenSSL inspection command and sample output.

Map where TLS terminates before editing files. With a CDN, the browser sees the edge certificate; the CDN may use a different certificate to reach your origin. Multiple load-balancer listeners, ingress secrets, or server nodes can also require separate deployment checks.

## 2. Renew Through the Certificate’s Existing Manager

### Certbot-managed web servers

List the managed certificates and use the exact certificate name reported by Certbot; it is not always the bare domain. The example tests an existing renewal configuration, then requests production renewal if due. Do not repeatedly force issuance to work around a failed challenge.

```
sudo certbot certificates
# Replace example.com with the Certificate Name from the listing:
sudo certbot renew --cert-name example.com --dry-run
# After resolving any test failure:
sudo certbot renew --cert-name example.com
```

The dry run uses a staging CA and does not save a replacement live certificate, but configured plugins and hooks can affect the server. Check `/var/log/letsencrypt/letsencrypt.log` for the specific failure. Certbot installation methods and scheduling differ; inspect the setup already installed rather than adding a second renewal job.

### Managed hosting, CDN, or Caddy

Use that service’s certificate dashboard or logs. Confirm domain validation, DNS, and any origin-certificate requirement. Caddy normally manages certificate issuance and renewal itself; inspect its logs and persistent storage. Installing a separate Certbot job will not automatically update a certificate managed by another service.

### Manually managed certificates

Request a replacement from the issuer, complete its validation, and install the returned certificate plus intermediates at the TLS terminator. Check the hostname list before issuance; the [CSR Decoder](<https://ducktyped.xyz/csr-decoder/>) can inspect a certificate request. Keep the private key on the system that needs it.

## 3. Diagnose a Failed Renewal

- **HTTP-01:** the CA must reach the challenge on port 80 for the requested hostname. Check its public DNS, routing, firewall, and challenge handling; a working HTTPS page alone is insufficient.
- **DNS-01:** check the required TXT record at the authoritative DNS provider, the API credential’s permissions, and propagation. A TXT record added to an unused DNS zone cannot validate the name.
- **CAA or authorization error:** follow the CA’s precise response. Confirm the issuer is authorized and that the requested names match the deployment.
- **No renewal attempt:** inspect the configured timer, cron job, or hosting automation and its last run. On a systemd installation, `systemctl list-timers --all` helps locate timers; the unit name depends on the package.

## 4. Deploy and Reload the Component That Serves TLS

Renewing files does not guarantee that the running process loaded them. Confirm the configured certificate path or secret points to the renewed material. For NGINX managed by systemd, validate configuration before reloading:

```
sudo nginx -t && sudo systemctl reload nginx
```

Use the equivalent validation and reload procedure for your server. Some ACME installers already reload it; others need a deployment hook. With Certbot, a deploy hook is intended for actions after successful renewal. For a load balancer or ingress, update the appropriate listener or secret instead of reloading an unrelated web server.

## 5. Verify from the Client Side

Repeat the SSL Checker lookup, then use a client that performs certificate verification:

```
curl --head --connect-timeout 5 --max-time 15 https://example.com/
```

Do not add `--insecure`. A successful TLS connection followed by an HTTP error such as 405 is a separate application response; an expiry or trust error still needs repair. An internal CA requires the organization’s approved trust bundle, not disabled verification.

If the site still serves the old certificate, compare each affected hostname and traffic path: apex versus `www`, IPv4 versus IPv6, CDN edge versus origin, and individual nodes. Inspect what clients receive rather than only checking the new file on disk. HSTS does not retain an expired certificate, so clearing it is not a renewal step.

## 6. Monitor Renewal and Deployment

Track the last successful renewal, deployment failures, and the expiry of the certificate served externally. Select alert thresholds that fit the actual issuance lifetime. Let’s Encrypt’s [published lifetime transition](<https://letsencrypt.org/2025/12/02/from-90-to-45/>) includes shorter certificate profiles; a universal “renew every 60 days” rule is unsuitable for every certificate.

The current public-certificate cap is 200 days for issuance from March 15, 2026 through March 14, 2027, with shorter limits scheduled later. An issuer may choose a shorter lifetime. Our [September 2026 survey](<https://ducktyped.xyz/learn/ssl-certificate-survey-2026/>) shows why automation and checks of the served certificate matter.

## Frequently Asked Questions

### Why did auto-renewal fail?

Check the client’s logs and scheduler. Common causes include failed HTTP or DNS validation, expired DNS API credentials, changed DNS or CAA records, and a stopped scheduler. Successful renewal can still be followed by a deployment or reload failure.

### Does certbot renew --dry-run replace my live certificate?

It tests renewal against a staging service without saving a replacement production certificate. Plugins and configured hooks can still run; review them before testing on a production server.

### Should I clear HSTS after renewing a certificate?

No. HSTS requires valid HTTPS; it does not cache an expired certificate. If the warning remains, check the certificate being served, its chain, hostname, and the client clock.

### How early should I receive an expiry alert?

Choose thresholds that fit the actual certificate lifetime and normal renewal window. A 30-day threshold is unsuitable for a certificate issued for 30 days or less. Monitor failed renewal/deployment attempts as well as the served expiry date.

## Sources and Review

Reviewed September 24, 2026. Replace example hostnames and paths with your deployment values. Sample output is illustrative.

- [Certbot renewal, dry runs, and hooks](<https://eff-certbot.readthedocs.io/en/stable/using.html#renewing-certificates>)
- [ACME challenge requirements](<https://letsencrypt.org/docs/challenge-types/>)
- [NGINX configuration and reload](<https://nginx.org/en/docs/beginners_guide.html#control>)
- [Caddy automatic HTTPS](<https://caddyserver.com/docs/automatic-https>)
- [curl trust verification](<https://curl.se/docs/sslcerts.html>)
- [Let’s Encrypt lifetime transition](<https://letsencrypt.org/2025/12/02/from-90-to-45/>)
- [CA/Browser Forum lifetime schedule](<https://cabforum.org/2025/04/11/ballot-sc081v3-introduce-schedule-of-reducing-validity-and-data-reuse-periods/>)
