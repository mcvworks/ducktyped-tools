# Redirect Chains: Find Loops and Check the Final Response

Canonical source: https://ducktyped.xyz/learn/redirect-checker/

Last reviewed: September 24, 2026

A redirect trace shows the path a request took. Read the last status as carefully as the destination URL, and distinguish an HTTP redirect from navigation performed by the browser.

## Run a Useful Check

1. Open the [Redirect Checker](<https://ducktyped.xyz/redirect-checker/>) and enter the full public URL, including `http://` or `https://` and any relevant non-sensitive query string.
2. Select **Trace Redirects**. Each step shows a requested URL and the returned HTTP status.
3. Read the final recorded response. A 200, a 404, and another 301 require different conclusions.
4. Compare the result with the browser network panel if only certain visitors encounter the problem. Preserve the request log while navigating.

The tool sends server-side GET requests and follows HTTP 301, 302, 303, 307, and 308 responses with a Location header. It records at most 15 responses. It does not execute JavaScript, follow HTML meta refresh, reproduce a signed-in session, or report per-hop timing. Results may be cached. See [data handling and caching](<https://ducktyped.xyz/privacy/>).

## Interpret the Result

| Observed result | What to check next |
| --- | --- |
| 301 → 200 at the intended page | The tested GET reached a successful HTTP response. Confirm the page content and query parameters are correct. |
| 301 → 404 | The redirect leads to a missing resource. Repair the destination or redirect rule; the successful trace is not a successful page load. |
| 302 → login → 200 | The public request may have reached a login page. A 200 status alone does not establish access to the original content. |
| The same URL repeats | Inspect conflicting host, scheme, slash, application, or authentication rules. This is evidence of a cycle. |
| The last recorded response is still 3xx | The destination is unconfirmed. A limit, missing Location, or unsupported response may have stopped the trace. |
| No recorded response or lookup error | No conclusion about the destination is available. Use the [website diagnostic guide](<https://ducktyped.xyz/learn/website-not-loading/>) to investigate DNS, connection, and TLS failures. |

## Find the Rule That Creates a Loop

Write the repeating sequence down, including scheme, host, port, path, and query. For example:

```
https://example.test/account  →  https://www.example.test/account
https://www.example.test/account  →  https://example.test/account
```

This example points to conflicting host rules. If only the scheme changes, check how the application learns the original scheme behind a trusted reverse proxy. If a slash is repeatedly added and removed, compare the application router with the web-server rule. An authentication loop needs session and cookie inspection in the affected browser.

Change the responsible rule, then recheck the original URL and a representative nested path with a query string. Avoid changing unrelated rules simultaneously; you need to know which change resolved the loop. See [ERR\_TOO\_MANY\_REDIRECTS](<https://ducktyped.xyz/errors/browser/err_too_many_redirects>) and the [Cloudflare redirect-loop guide](<https://ducktyped.xyz/errors/cloudflare/redirect-loop>) for their specific cases.

## Verify a Migration with Real Paths

- Test an old article, a nested path, and a URL containing meaningful query parameters; a working homepage redirect does not prove the other mappings.
- Check that the destination contains the intended content. Sending every old URL to the homepage can hide broken mappings.
- Update internal links to the final URLs and avoid unnecessary intermediate hops.
- Test APIs with their actual methods and test bodies. This GET checker cannot establish POST preservation.
- Allow for existing browser/CDN cache entries when testing a changed rule. A fresh command-line request and the browser network panel answer different questions.

The [redirect comparison](<https://ducktyped.xyz/learn/301-vs-302-vs-307-vs-308/>) includes copyable curl checks, caching guidance, and the choice between 301, 302, 303, 307, and 308. [Google’s documentation](<https://developers.google.com/search/docs/crawling-indexing/301-redirects>) explains its canonical signals; a short chain by itself does not guarantee indexing or rankings.

## Browser Navigation Is a Different Layer

An HTML meta refresh or a JavaScript location change can navigate after an HTTP 200. A browser may also show an internal HTTPS upgrade before making a network request. These are not necessarily HTTP redirects returned to the server-side checker. Use browser developer tools to inspect initiators and the response headers. [MDN’s redirection guide](<https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Redirections>) explains these mechanisms.

A redirect trace is not a malware verdict. Check the destination’s hostname and context before opening it; the [URL pattern checker](<https://ducktyped.xyz/url-safety/>) offers limited syntax warnings, not comprehensive phishing detection.

## Frequently Asked Questions

### Why does the checker show a different result from my browser?

The checker makes server-side GET requests without your browser session, JavaScript, or meta-refresh processing. Cookies, location, cached results, and browser-only redirects can produce a different path.

### Does a redirect chain ending in 404 count as working?

The trace can complete while its destination returns an error. A final 404 or 5xx means the HTTP destination was reached but did not return a successful response; inspect the final status as well as the URL.

### Does a long chain prove there is a loop?

No. Repeated URLs are evidence of a cycle, but a long chain can contain distinct URLs. A trace that stops at a redirect needs further investigation and does not establish a final destination.

### Can this tool verify a POST redirect?

No. This checker uses GET. Test POST method and body handling with the real client or a controlled curl request, using the redirect comparison guide.
