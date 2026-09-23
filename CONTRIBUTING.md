# Contributing to DuckTyped

Thanks for your interest! DuckTyped is a collection of fast, privacy-first developer tools. Contributions that fit that ethos are very welcome — especially bug fixes, new **client-side** tools, and documentation improvements.

## Project ethos (please keep to these)

- **Client-side where possible.** If a tool can run entirely in the browser, it should. User data should not leave the device unless the tool fundamentally requires a server (DNS, SSL, WHOIS, ping, email diagnostics).
- **No profiling, advertising, or new analytics integrations.** The hosted site
  already uses cookieless Cloudflare Web Analytics and anonymous usage counters,
  as disclosed in the [privacy policy](https://ducktyped.xyz/privacy/).
- **No heavy dependencies.** Vanilla HTML + JavaScript, no build step, no framework. Keep pages fast.
- **One crawlable URL per tool.**

## Running locally

It's just static files:

```bash
python3 -m http.server 8080   # then open http://localhost:8080
```

**Note:** network/lookup tools (DNS, SSL, WHOIS, ping, port scan, email) call the hosted DuckTyped API, which is not part of this repository — those will show connection errors when self-hosted. All the client-side tools (encoders, formatters, hashing, regex, JWT, QR, diff, etc.) work fully offline.

## Adding a tool

1. Create a directory named for its URL slug, e.g. `my-tool/index.html`.
2. Follow the structure of an existing client-side tool (e.g. `base64-encoder/` or `json-formatter/`): a title, a short explanation, the tool UI, example usage, and links to related tools.
3. Include SEO basics: a `<title>`, `<meta name="description">`, and `<link rel="canonical">`.
4. Add the tool to the dashboard in `utility/index.html` and to `sitemap.xml`.
5. Keep it accessible directly by URL.

## Code style

- Match the surrounding code — vanilla JS, no frameworks or transpilers.
- No new third-party scripts or CDNs. Inline or self-host assets.
- Keep pages lightweight; avoid large libraries.

## Pull requests

- Keep PRs focused and describe what changed and why.
- Confirm the page works locally and doesn't add external network requests.
- By contributing, you agree your work is licensed under the repository's [MIT License](./LICENSE).

## Reporting bugs

Open an issue with the tool name, what you expected, what happened, and your browser. A link or screenshot helps.
