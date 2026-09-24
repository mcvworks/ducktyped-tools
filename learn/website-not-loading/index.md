# Website Not Loading? A Step-by-Step Diagnostic Guide

Canonical source: https://ducktyped.xyz/learn/website-not-loading/

Last reviewed: September 24, 2026

Start with the exact error and the connection that fails. A public checker, your browser, and an application server can see different DNS answers, network paths, certificates, and HTTP responses. Use the steps below to find the first failing stage before changing settings.

## Start with the Symptom

| What you see | What it establishes | Next check |
| --- | --- | --- |
| Name not resolved, NXDOMAIN, or curl error 6 | The requested name could not be resolved in that environment. | Compare the hostname, resolver, and DNS answers. |
| Connection refused or curl error 7 | A connection could not be established; a refusal is one possible cause. | Check the destination address, port, listener, and network policy. |
| Timeout or curl error 28 | A time limit was reached. DNS, connection setup, or the response may be involved. | Identify the stage that stalled; compare from another permitted network. |
| Certificate warning or curl error 60 | The client could not validate the server certificate. | Check hostname, clock, expiry, chain, and trust store. |
| HTTP 4xx or 5xx response | An HTTP server or intermediary answered. | Inspect the status, headers, request ID, and relevant logs. |
| HTTP 200 but a blank or broken page | The initial response arrived; the application may still be failing. | Inspect browser Console and Network for failed scripts or API requests. |

Replace `example.com` with the exact hostname you are troubleshooting. Run commands from the affected machine or application environment. The examples use curl on a POSIX shell; on Windows, use `curl.exe` to avoid a PowerShell alias.

## 1. Compare DNS Answers

Start with a lookup through the resolver available to the failing machine:

```
nslookup example.com
```

A successful lookup returns an address or a record chain ending in one. A negative answer and a DNS server timeout are different results. On Windows, `nslookup` queries the configured server without using the Windows client DNS cache; a browser can also use its own secure-DNS settings. A successful lookup therefore does not prove every application uses the same answer.

Compare with the [DNS Record Checker](<https://ducktyped.xyz/dns-lookup/>). For a public site, inspect the intended A/AAAA records and authoritative nameservers. A CDN or load balancer may correctly return its own addresses instead of your origin. An IPv6-only service does not need an A record, but its clients need working IPv6. For a private hostname, use its VPN or internal resolver; public tools cannot reproduce that environment.

After a DNS change, existing positive or negative answers can remain cached until their TTL expires. Check the actual answer and authoritative configuration before repeatedly editing records. See [Could not resolve host](<https://ducktyped.xyz/errors/dns/could-not-resolve-host>) and [Temporary failure in name resolution](<https://ducktyped.xyz/errors/dns/temporary-failure-in-name-resolution>).

## 2. Test the HTTPS Request from the Failing Environment

```
curl --head --connect-timeout 5 --max-time 15 https://example.com/
```

This requests headers with a five-second connection budget and a fifteen-second overall limit. The connection budget includes name resolution and protocol handshakes. curl verifies the certificate by default. An HTTP status line means an HTTP response arrived; without `--fail`, curl can exit successfully even for HTTP 404 or 500.

A server may reject HEAD with 405 while accepting GET. In a POSIX shell, retry a GET while discarding its body:

```
curl --silent --show-error --dump-header - --output /dev/null --connect-timeout 5 --max-time 15 https://example.com/
```

On Windows, use `curl.exe` and replace `/dev/null` with `NUL`. These requests do not sign in or reproduce a browser session. A corporate proxy, VPN, authentication requirement, or bot policy can produce a different response. Record that difference rather than treating one result as proof that the other client is wrong.

If both A and AAAA records are intended to work, compare address families from a machine with the relevant connectivity:

```
curl -4 --head --connect-timeout 5 --max-time 15 https://example.com/
curl -6 --head --connect-timeout 5 --max-time 15 https://example.com/
```

An IPv6 failure on a client without IPv6 connectivity is not evidence of a broken website. Compare both the local network capability and the published destination.

## 3. Interpret Reachability and Certificate Results Carefully

The [Port Scanner](<https://ducktyped.xyz/port-scanner/>) checks from DuckTyped’s server. An open TCP port shows that a connection was accepted from that location; it does not establish that TLS or the application works. A closed or filtered result narrows the investigation, but cannot identify a specific firewall or process on its own. HTTP port 80 need not be open for HTTPS on 443 to work.

The [Traceroute tool](<https://ducktyped.xyz/traceroute/>) can add context. Missing replies such as `* * *` can mean routers do not answer those probes. They do not by themselves prove that forwarded website traffic is blocked. Compare the destination’s actual HTTPS response.

Use the [SSL Certificate Checker](<https://ducktyped.xyz/ssl-checker/>) to inspect the served certificate and its dates. It is not a complete browser trust, hostname, revocation, or protocol audit. Confirm the actual client error with curl or the browser’s certificate details. A valid-looking expiry date alone does not establish trust. Do not disable verification to declare a repair successful.

For an expiry problem, follow [SSL certificate expired diagnosis](<https://ducktyped.xyz/errors/ssl/ssl-certificate-expired>), then the [renewal and deployment guide](<https://ducktyped.xyz/learn/ssl-certificate-expired/>). For an internal CA, use the organization’s approved trust setup. For a CDN, distinguish the certificate served to visitors from the separate origin connection.

## 4. Follow the HTTP Response to the Next Component

- **301, 302, 307, or 308:** inspect the `Location` header and the [redirect chain](<https://ducktyped.xyz/redirect-checker/>). A redirect can lead to a different failing hostname or a loop.
- **401 or 403:** check authentication, permissions, and proxy/CDN policy. A denied request is different from a server that cannot be reached.
- **404:** confirm the path, routing, and deployment. The response can come from a proxy or application.
- **429:** inspect rate limits and any `Retry-After` header; repeated retries can prolong the problem.
- **500:** inspect the responding component’s logs for an unexpected condition. The status alone does not prove a process crashed.
- **502 or 504:** a gateway reports an invalid upstream response or an upstream timeout. The response does not establish that the origin’s DNS, TLS, or application is healthy.
- **503:** the responding service is temporarily unable to handle the request; inspect availability, capacity, and maintenance state.

The [HTTP Latency tool](<https://ducktyped.xyz/http-latency/>) provides an external server-side request for comparison; it is not a global availability test. The [HTTP Request Builder](<https://ducktyped.xyz/http-request-builder/>) runs in the browser and is subject to browser rules such as CORS. A CORS error in that tool does not establish an outage.

## 5. If the Page Loads but the App Fails

Open the browser’s Network and Console panels. Look for failed JavaScript files, API requests, redirect loops, mixed content, or a Content Security Policy blocking a required resource. The top-level HTML can return 200 while a separate API host fails DNS or returns 500. Follow that specific failing request through the earlier steps.

Compare another browser profile or a second network where permitted, and note VPN, proxy, or extension differences. A public checker’s success cannot rule out an issue limited to your device, network, account, or region. Third-party dependency incidents may also be listed on [DTMonitor](<https://monitor.ducktyped.xyz/>); an incident listing is context, not proof of the cause.

## Collect Evidence for Support

A useful report lets someone repeat the failing request. Record:

- The affected hostname/path, time and time zone, and when it last worked.
- The exact error or HTTP status, the test method (HEAD or GET), and any request ID.
- Whether it fails in the browser, command line, or application, and on which network.
- The relevant DNS answer, certificate dates, and differences between working and failing clients.
- Recent DNS, certificate, proxy, deployment, or authentication changes.

Remove passwords, cookies, authorization headers, private query parameters, and personal data before sharing output. A complete browser network export can contain these values. The [privacy page](<https://ducktyped.xyz/privacy/>) explains which DuckTyped tools use a server and how results are cached.

## Sources and Review

Reviewed September 24, 2026. These checks help isolate a failure; a result describes its test environment and time.

- [curl options, timeouts, and exit codes](<https://curl.se/docs/manpage.html>)
- [curl certificate verification](<https://curl.se/docs/sslcerts.html>)
- [Microsoft DNS client troubleshooting](<https://learn.microsoft.com/windows-server/networking/dns/troubleshoot/troubleshoot-dns-client>)
- [Microsoft tracert and nonresponding routers](<https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/tracert>)
- [HTTP semantics and status codes (RFC 9110)](<https://www.rfc-editor.org/rfc/rfc9110.html>)

## Frequently Asked Questions

### Why does a public checker say the site works while my browser fails?

The checker and browser can use different DNS resolvers, networks, address families, trust stores, proxies, and authentication. Compare the exact failing request from the affected environment; one successful external check does not establish availability for every client.

### Do asterisks in traceroute prove the network is broken?

No. Routers may forward traffic without replying to traceroute probes. Missing intermediate replies alone do not prove that the destination’s HTTPS traffic is blocked.

### Does HTTP 200 mean the whole website works?

No. It describes one response. JavaScript, images, login, or requests to a separate API can still fail. Inspect the browser’s Network and Console panels for the specific failing request.

### Why does curl return 405 when the page opens in a browser?

The --head option sends HEAD. Some servers reject HEAD but accept the GET request normally used for a page. Compare a GET request before treating the 405 response as an outage.
