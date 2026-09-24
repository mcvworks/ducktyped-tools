# 301 vs 302 vs 307 vs 308: Choose and Test a Redirect

Canonical source: https://ducktyped.xyz/learn/301-vs-302-vs-307-vs-308/

Last reviewed: September 24, 2026

Choose a redirect by whether the move is permanent and what should happen to the next request. Configure caching separately, then test the actual client behavior.

## Choose a Code for the Job

| Code | Use and request behavior |
| --- | --- |
| [301](<https://ducktyped.xyz/errors/http/301-moved-permanently>) | Permanent page move. A client may turn POST into GET when following it. |
| [302](<https://ducktyped.xyz/errors/http/302-found>) | Temporary page move. A client may turn POST into GET when following it. |
| 303 | Retrieve another resource after processing a request; commonly POST → GET for a result page. |
| [307](<https://ducktyped.xyz/errors/http/307-temporary-redirect>) | Temporary move that preserves the method and body when automatically followed. |
| [308](<https://ducktyped.xyz/errors/http/308-permanent-redirect>) | Permanent move that preserves the method and body when automatically followed. |

These distinctions come from [HTTP Semantics](<https://www.rfc-editor.org/rfc/rfc9110.html#section-15.4>). A client may decline to follow a redirect; preserving a method does not guarantee that every client can replay an uploaded stream.

## Three Practical Decisions

1. **Moving an article to its lasting URL?** Use a permanent redirect, commonly 301 for a page reached with GET. Point directly to the relevant replacement.
2. **Moving an API endpoint that receives a body?** Choose 307 for a temporary move or 308 for a permanent one. Confirm that the destination accepts the same operation and that clients can resend it.
3. **Showing a receipt after a form was processed?** Use 303 to send the client to a separate result page. Replaying the original POST at a receipt endpoint is usually the wrong behavior.

A redirect does not make an operation idempotent. For payments, uploads, and other changes, follow the application’s retry and duplicate-request rules. Test with an inert request on a controlled endpoint.

## Caching Is a Separate Choice

301 and 308 are eligible for heuristic caching when the applicable rules permit it. 302 and 307 can be cached when explicit freshness information permits it. A temporary code is not a cache bypass. See [HTTP Caching](<https://www.rfc-editor.org/rfc/rfc9111.html>).

For a temporary response you do not want stored, send an appropriate response policy such as:

```
HTTP/1.1 307 Temporary Redirect
Location: /temporary-endpoint
Cache-Control: no-store
```

`no-cache` permits storage but requires validation before reuse; it is not a synonym for `no-store`. Changing a response header cannot instantly remove an older redirect already held by a browser or CDN. Inspect the browser network panel and the CDN’s cache controls when testing a rollback.

## What Google Uses the Redirect For

Google documents 301 and 308 as strong signals that the destination should be canonical, and 302 and 307 as weak signals. It does not describe temporary redirects as having “zero SEO equity.” Choose a status that describes the real move, keep internal links and sitemap entries consistent, and check that the replacement page is relevant and reachable. Read [Google’s redirect guidance](<https://developers.google.com/search/docs/crawling-indexing/301-redirects>).

## Verify the First Response and the Destination

Use the [Redirect Checker](<https://ducktyped.xyz/redirect-checker/>) for public HTTP GET chains. For local verification, the following POSIX-shell commands show headers while discarding the response body. On Windows use `curl.exe` and replace `/dev/null` with `NUL`.

```
curl --silent --show-error --dump-header - --output /dev/null --connect-timeout 5 --max-time 20 'https://example.com/old?ref=test'
```

Look for the status, `Location`, and `Cache-Control`. This command does not follow the redirect. Then follow a bounded chain:

```
curl --silent --show-error --location --max-redirs 10 --proto-redir '=http,https' --dump-header - --output /dev/null --connect-timeout 5 --max-time 20 --write-out '\nFinal: %{url_effective}\nHTTP: %{http_code}\nRedirects: %{num_redirects}\n' 'https://example.com/old?ref=test'
```

Each response gets a header block. The final summary identifies the URL and HTTP status actually reached. curl does not treat HTTP 404 or 500 as a command failure by default; read that status. GET and HEAD can follow different server routes, so a HEAD-only test is not sufficient.

## Verify POST Behavior in a Test Environment

Use only a test endpoint you control that records the received method and body without making a real change. Replace this example staging address:

```
curl --silent --show-error --location --max-redirs 5 --proto-redir '=https' --connect-timeout 5 --max-time 20 --data 'probe=example' --dump-header - 'https://staging.example.com/redirect-test'
```

With curl’s normal redirect behavior, a POST followed through 301, 302, or 303 becomes GET; 307 and 308 retain POST and its data. Confirm in the receiving server’s test log. Avoid adding `-X POST` to this check: it overrides normal method selection and can mask the behavior you intended to test. These details are documented in the [curl manual](<https://curl.se/docs/manpage.html#-L>).

For repeated URLs, unexpected host changes, or a trace that stops early, continue with [the redirect-chain troubleshooting guide](<https://ducktyped.xyz/learn/redirect-checker/>). Keep credentials out of public tracing tools and shared output.

## Frequently Asked Questions

### Should I use 301 or 308 for a permanent move?

Both describe a permanent move. Use 308 when an automatically followed redirect must preserve the request method and body. A 301 remains suitable for ordinary page moves, but a client may change POST to GET.

### Does 307 mean a response cannot be cached?

No. A 307 is temporary and preserves the request method, but explicit cache directives can allow caching. Set the intended Cache-Control policy separately from the redirect status.

### Do temporary redirects lose all SEO value?

No. Google describes permanent redirects as strong canonical signals and temporary redirects as weak signals. That is not a promise of a fixed ranking gain or loss; use the status that matches the move.

### Which redirect should follow a successful form submission?

A 303 See Other commonly sends the browser to a result page with GET after a POST has been processed. Use 307 or 308 when the destination should receive the original method and body instead.
