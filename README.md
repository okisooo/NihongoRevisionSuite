# practice room — language learning in short rounds

short Japanese practice rounds for reading, recall, handwriting, and listening. meet a few items, recall them with the answers hidden, and revisit helped answers as you play.

[open the app](https://nihongo.okiso.net/) · [short link](https://nihongo.oki.so/) · [deployment notes](docs/WEB-DEPLOYMENT.md)

## practice

- work through 28 sets for the two phonetic alphabets and 60 written-character stages, with saved skill progress.
- use guided stroke models, graded handwriting, device speech, and timed practice tools.
- study 30 grammar lessons and sentence reading, or look things up in the library.
- resume an unfinished round and export/import a JSON progress backup in settings.

## phone, desktop & offline use

open the website online and let its offline download finish. on iPhone, use Safari's share menu and add to home screen; on Android or supported desktop browsers, use the install-app option. study content, stroke data, and fonts are bundled for offline use after that first successful download. listening depends on an available Japanese speech voice; offline voice support varies by device.

progress stays in the current browser or native installation. there are no accounts or automatic cross-device sync. use a backup to transfer progress, and export one before clearing browser data. backup files contain your study records. device speech services may have their own network behavior.

the source also includes an Electron desktop wrapper, Windows portable packaging, and a Capacitor iOS target. no public GitHub Releases are currently published. native signing and real-device installation need separate verification; there is no App Store or Play Store release offered here.

## source & development

JavaScript/JSX, React 19, Vite 8, and a progressive web app service worker. use Node.js 22 and the committed npm lockfile:

```sh
npm ci
npm run dev
```

`npm run build` generates `dist`; the web workflow runs tests and lint before publishing it to GitHub Pages. Electron's `npm start` loads that built `dist` directory, so build first when using the desktop wrapper.

the short-round logic is in [src/play](src/play), practice tools in [src/rush](src/rush), and study/progress/backup code in [src/study](src/study). see [web deployment](docs/WEB-DEPLOYMENT.md) and the [content review](docs/CONTENT-AUDIT.md) for scope and known limits.

## credits & licensing

stroke data is credited to [AnimCJK](https://github.com/parsimonhi/animCJK), with the Arphic Public License and upstream attribution in the [bundled notice](src/data/strokes.LICENSE.txt). [Klee One](public/licenses/klee-one.txt) and [Noto Sans JP](public/licenses/noto-sans-jp.txt) have separate SIL Open Font License notices.

no top-level application-code license is declared. bundled content and third-party assets retain their own terms; see the existing [distribution notes](docs/IOS.md#before-any-public-release). this is a practice aid, and the content review records known limits.

## related

[OKISO's music & art site](https://okiso.net/) · [website source](https://github.com/okisooo/site) · [more projects by okisooo](https://github.com/okisooo)

