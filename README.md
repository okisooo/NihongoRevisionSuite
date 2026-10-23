# Nihongo Revision Suite

A self-paced language practice game at **https://nihongo.okiso.net**. The short address,
**https://nihongo.oki.so**, permanently redirects to the same page on the canonical
host, preserving the path, query string and browser fragment.

The app opens in a compact play room. Choose sounds or characters, meet a few new
items, then recall them with the answers hidden. Clean answers build a combo;
helped answers return after other prompts. Each short round finishes after two
unassisted recalls of five skills, with an immediate replay or next-round action.
There are no daily quotas or streaks on the home screen.

Practice tools and the library retain 28 kana sets, 60 kanji stages, graded
handwriting, listening, timed rush, 30 grammar lessons and sentence reading.
Japanese stroke data and fonts remain bundled locally. Quick rounds update the
existing per-skill records and review schedules without claiming writing mastery
or clearing the separate timed stage tests.

## use on a phone or computer

Open the website once while online and let its offline download finish. On iPhone,
use Safari's Share → Add to Home Screen; on Android or desktop Chrome, use Install
app. After the first successful offline download, the study content, writing and
fonts work without a connection. Listening depends on the device's installed
speech voices.

Progress saves on the current browser/device, after each answer in a play round.
An unfinished round resumes after reload, including already-scored feedback.
It does not yet sync between devices. Settings can export and validate a JSON
backup to move progress between browser, desktop and native installations.
Existing `study_suite_v1` backups remain supported. When an update is ready, the
app offers a refresh after your session; it does not force a reload during study.

## develop and check

Use Node.js 22 and the committed npm lockfile:

```sh
npm ci
npm run dev
```

```sh
npm test
npm run lint
npm run build
npm run preview
```

Generated outputs and local dependency/build caches on this machine belong on S:.
Use an S: checkout, or junction `dist` and `node_modules` to S: before building.

## hosting

Every push to `main` checks tests and lint, builds the app and publishes `dist` to
the `gh-pages` branch. GitHub Pages is configured for `nihongo.okiso.net`; its
`CNAME` must remain in place. Routing uses URL fragments so bookmarked study
screens work on static hosting and offline.

See [web deployment](docs/WEB-DEPLOYMENT.md) for DNS, HTTPS, the short-domain
redirect, verification and rollback.

## native apps

The React study core also runs in Electron and the existing Capacitor iOS target.
Native preferences and backup sharing remain supported. See [iOS setup](docs/IOS.md)
for the existing personal-build workflow and its unverified installation steps.
Android packaging and app-store release are future work. The installable website
works on both phone platforms now; it is not an App Store or Play Store release.

For desktop packaging, `npm start` opens Electron and `npm run dist` builds the
portable Windows app. Native signing, store publishing and paid memberships are
separate release steps.
