# web deployment

## addresses and hosting

- canonical: `https://nihongo.okiso.net/`
- short link: `https://nihongo.oki.so/`, permanently redirecting to the same path
  and query string on the canonical host. Browser fragments remain intact.
- hosting: GitHub Pages, `okisooo/NihongoRevisionSuite`, `gh-pages` branch `/`.

The main artist site, other service subdomains, email and zone-wide TLS settings
are independent of this app.

## domain configuration

In the `okiso.net` Cloudflare zone, add an explicit DNS-only CNAME `nihongo` →
`okisooo.github.io`, TTL auto. It overrides the existing server wildcard. GitHub
Pages already owns the custom-domain association. After GitHub provisions its
certificate, enable Enforce HTTPS in the repository's Pages settings.

In the `oki.so` zone, add an explicit proxied CNAME `nihongo` → `nihongo.okiso.net`.
Add a Single Redirect with the exact host condition and dynamic target below:

```text
http.host eq "nihongo.oki.so"
concat("https://nihongo.okiso.net", http.request.uri.path)
```

Use status 301 and preserve query strings. Keep it ahead of any matching catchall.
Preserve existing apex/www redirects and zone-wide TLS settings.

## verification

1. Check authoritative DNS for the explicit canonical CNAME.
2. Confirm canonical HTTPS returns the app with a valid certificate and HTTP 200.
3. Confirm short-host HTTP and HTTPS return 301 to the same canonical path with
   query strings preserved and no loop.
4. Check desktop and phone navigation, typed practice, writing, progress after
   reload and a backup round trip.
5. Wait for the service worker to activate; reload and open writing and library
   screens offline. Bundled fonts and stroke data must load from its cache.
6. Verify the existing apex domains still behave as before.

Progress saves locally. Accounts and cross-device synchronization are not yet
implemented. Physical phone installation, store releases and device speech
voices require separate verification.

## deployment and rollback

Push source to `main` to run `.github/workflows/deploy-web.yml`. Tests, lint and
build must pass before publishing. Check the workflow and live site independently.

To roll back code, revert the deployment commit and run the same workflow. Keep
the storage key, user progress and Pages domain association. Offline users see
an update prompt when they reconnect; updates do not force a reload during study.

## launch state - october 23, 2026

The canonical CNAME is DNS-only and Enforce HTTPS is enabled on GitHub Pages.
The short-domain proxied CNAME and exact-host redirect are deployed. Redirect
rule ID: `36b1a29d0ec145bab8ca4331132d3ce9`; DNS record ID:
`aa4af8235379ab4bad2d288a3417761e`. The short-zone redirect ruleset now has eight
rules; the seven existing artist-site rules were preserved.

GitHub initially had no certificate because DNS had fallen through to the server
wildcard. After correcting DNS, resetting and immediately restoring the existing
Pages custom-domain setting restarted certificate provisioning as documented by
GitHub. HTTPS now returns 200, HTTP redirects to HTTPS, and the short host returns
301 with paths and encoded queries preserved. Main-domain checks remain 200 for
`okiso.net` and 301 from `oki.so` to the main canonical site.

The modern study interface is restored from `c43fe80`, with the web/offline
integration retained from Opus's conversion. The existing iOS project, native
storage adapters and compatible backups remain available. React Router is pinned
to a patched 7.18.x version in the lockfile.

Local validation: 68 tests, lint and production build pass. The production npm
dependency audit reports zero known vulnerabilities. Desktop and 390x844 phone
checks cover typing, writing-pad initialization and navigation without overflow.
With this task's preview server stopped, a reload, library navigation, local
fonts and the writing pad all work through the service worker. A generated
update shows the refresh prompt; applying it preserves saved settings.

The app's export handler produced valid backup bytes, and importing that file
through Settings restored the expected state and survived reload. The automation
download command was canceled by the browser, so a physical browser file-download
round trip is not claimed. Physical iOS/Android installation is also unverified.
