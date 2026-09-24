# Use DuckTyped with AI Assistants

Canonical source: https://ducktyped.xyz/for-agents/

Last reviewed: September 24, 2026

Find technical guides, inspect the evidence behind our research, and link back to the source. Selected pages are available as plain Markdown for readers and assistants that prefer text without navigation or interactive charts.

## Find the Right Resource

| Task | Guide and purpose |
| --- | --- |
| Diagnose a website request | [Website not loading](<https://ducktyped.xyz/learn/website-not-loading/>)<br>Separate DNS, connection, TLS, HTTP, and browser application failures. |
| Understand an expired certificate | [Expiry diagnosis](<https://ducktyped.xyz/errors/ssl/ssl-certificate-expired>) and [renewal guide](<https://ducktyped.xyz/learn/ssl-certificate-expired/>)<br>Check the served certificate, repair renewal/deployment, and verify from the client. |
| Fix Docker engine access | [Docker daemon guide](<https://ducktyped.xyz/errors/devops/docker-daemon-not-running>)<br>Identify the selected engine before changing services, contexts, or permissions. |
| Investigate a database timeout | [Database timeout guide](<https://ducktyped.xyz/errors/database/database-connection-timeout>)<br>Distinguish connection setup, TLS/login, pool acquisition, and query execution. |
| Cite certificate research | [September 2026 SSL survey](<https://ducktyped.xyz/learn/ssl-certificate-survey-2026/>)<br>A dated sample, downloadable CSV, field definitions, and reproducible counts. |

## Choose a Format

- [Document index (llms.txt)](<https://ducktyped.xyz/llms.txt>): a short, curated list of Markdown resources.
- **Markdown:** use “Read as Markdown” on a supported guide. Copies are generated from the published article and identify its canonical HTML source. Charts are represented by the article’s data tables.
- **HTML:** the [Learn directory](<https://ducktyped.xyz/learn/>) and [Troubleshoot directory](<https://ducktyped.xyz/errors/>) contain the full collection. The [sitemap](<https://ducktyped.xyz/sitemap.xml>) lists public indexable pages.
- **Research data:** download the [survey CSV](<https://ducktyped.xyz/data/ssl-survey-2026-09.csv>) and [chart counts and captions](<https://ducktyped.xyz/data/ssl-survey-2026-09/chart-data.json>). Read the [data dictionary](<https://ducktyped.xyz/learn/ssl-certificate-survey-2026/#data-dictionary>) before interpreting missing values or percentages.

## Use the Evidence in Context

Keep the source URL, review or measurement date, and limitations with a result. The SSL survey observed 712 certificates from 1,000 attempted domains on September 18, 2026. It does not describe the certificates served today, global CA market share, or a confirmed outage for each unsuccessful connection.

Troubleshooting commands use example hostnames and paths. Choose the steps that match the reader’s operating system, deployment, and permissions. A guide can explain an error without establishing what caused it on a particular server. Prefer the linked official documentation for product-specific details.

For research citations, use the report’s suggested citation and link to its canonical page. For a troubleshooting answer, link to the relevant guide and distinguish observed output from a possible explanation.

## Interactive Tools and Their Limits

The [tool directory](<https://ducktyped.xyz/utility/>) contains interactive browser utilities. Encoders and formatters generally process input locally; network tools need a server or an external service. Public network checks do not reproduce a private network, VPN, authenticated browser session, or every geographic location. Results may be cached. Read the [privacy and caching details](<https://ducktyped.xyz/privacy/>) before entering sensitive information.

DuckTyped currently provides browser tools and public documents. It does not advertise a supported public agent API or MCP service. The documentation index is for finding and reading resources; it is not an API endpoint.

## For Website Owners Using This Format

The [llms.txt proposal](<https://llmstxt.org/>) provides a way to organize resources for assistants. It does not guarantee that an assistant will discover, cite, or recommend a site. Google’s [AI search guidance](<https://developers.google.com/search/docs/appearance/ai-features>) says no special AI text file is required; accessible, helpful pages remain the foundation.
