# revision

kanji words, writing and grammar revision, on phone and pc.

**[open the app](https://nihongo.okiso.net/)** · [study guide](docs/STUDY-GUIDE.md) · [install on your device](#take-it-offline) · [run from source](#run-from-source)

white and blue, no account, and offline after the first download.

## a small study round

1. **choose a range.** two characters at a time, following the verified 300-character school list and its 16 chapters. unsure where to start? begin small and change the range any time.
2. **learn through words.** meet an anchor word, recall its hidden reading, write the target from a cue, and check meaning.
3. **save and return.** partial rounds and feedback survive reload. due reviews check one skill per character without first showing its answer. assisted practice and paper self-checks are labelled honestly.
4. **revise grammar.** choose one of 30 lessons and produce a sentence before comparing with its model. revision is scoped to that lesson; comparison is self-rated.

play, sound practice, listening, the 60-stage campaign and the reference library stay available. the study guide explains progress, writing checks and moving a backup between devices.

## take it offline

open the app online and let its offline download finish first. then use **add to home screen** in Safari on iPhone, or the **install app** option in a supported Android or desktop browser. study content, stroke data and fonts are bundled for use after that first successful download.

listening needs an available Japanese speech voice; offline voice support varies by device. device speech services may have their own network behavior.

progress stays in this browser or native installation. there are no accounts or automatic cross-device sync. **export a backup in settings before clearing browser data**, or to transfer progress to another device. backup files contain your study records.

<details>
<summary>native wrappers and release status</summary>

the source includes an Electron desktop wrapper, Windows portable packaging and a Capacitor iOS target. no public GitHub Releases are currently published, and no App Store or Play Store release is offered here. native signing and real-device installation need separate verification.

</details>

## run from source

React 19, Vite 8 and JavaScript/JSX, with a progressive web app service worker. use Node.js 22 and the committed npm lockfile:

```sh
git clone https://github.com/okisooo/NihongoRevisionSuite.git
cd NihongoRevisionSuite
npm ci
npm run dev
```

`npm run build` generates `dist`. the web workflow runs tests and lint before publishing to GitHub Pages. Electron's `npm start` loads that built directory, so build first when using the desktop wrapper.

[round logic](src/play) · [practice tools](src/rush) · [study & backups](src/study) · [web deployment](docs/WEB-DEPLOYMENT.md) · [content review & known limits](docs/CONTENT-AUDIT.md)

stroke data comes from [AnimCJK](https://github.com/parsimonhi/animCJK), with the Arphic Public License and attribution in the [bundled notice](src/data/strokes.LICENSE.txt). [Klee One](public/licenses/klee-one.txt) and [Noto Sans JP](public/licenses/noto-sans-jp.txt) have separate SIL Open Font License notices. no top-level application-code license is declared; bundled content and assets retain their own terms. see the [distribution notes](docs/IOS.md#before-any-public-release). this is a practice aid with the limits recorded in the content review.

---

made by [OKISO](https://github.com/okisooo) — no.03 in the little tools. also building no.01 [Backdrop — AI desktop wallpapers](https://github.com/okisooo/backdrop), no.02 [Fleet — Windows AI usage tracking](https://github.com/okisooo/fleet), and a [music & art website](https://github.com/okisooo/site).
