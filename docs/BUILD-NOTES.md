# revision workspace — september 11, 2026

## kana track and listening — october 5, 2026

the characters tab (`/kana`, `/kanji`, nav "kana·kanji") gains a kana half built like the kanji one. 28 stages (14 hiragana, 14 katakana mirroring them) group sounds by row as in You Can Kana: plain rows, voiced rows, then contracted sounds. each stage runs learn (character, sound, stroke animation; type it once, trace it) → review → timed test (20 prompts, 80% clean). prompt kinds: 読 see kana, type romaji (rush and tests); 書 see romaji and script, write the kana on the graded pad; 聴 hear it, type it. writing and listening are practice-only, one at a time; rush stays reading. kana results live in `progress.rush.kana` and `kanaStages`, never in review cards; older backups without them still import.

listening also works for kanji: 聴 in kanji practice plays curriculum words whose kanji you have learned, then shows the word and meaning. speech uses the device's Japanese voice (installed on this PC: Haruka, Ayumi, Ichiro, Sayaka; built into iOS). the stroke bundle now includes animCJK `graphicsJaKana.txt` (all 177 kana); regenerate with `node scripts/build-strokes.mjs graphicsJa.txt graphicsJaKana.txt`. today shows "new kana" instead of "new kanji" for beginners and while a kana stage is in progress.

## four tabs, writing, kanji rush — september 26, 2026

the four-tab rework below supersedes the september 17 daily-study candidate's practice screens and daily new-character cap (new kanji now arrive in five-kanji stages). its data additions stay supported: `introduced` dates on review records and saved `active.feedback` in older backups still validate.

the app now has four destinations, and each kind of work has one home. this supersedes the seven-mode practice screen, the character-set list, the review tab, the study-range setting, and the legacy quiz, dictionary, grammar-reference, and kanji-detail screens, which were removed (see git history). old links redirect.

- **today**: a three-step plan. *review kanji* (every due kanji card, typed and written), *new kanji* (the next stage), *grammar* (due grammar and sentence cards plus the next pattern). a rush shortcut, streak, and grammar history sit underneath.
- **kanji** (`src/rush/`): 60 stages of five kanji, two ways to play, and a mastery grid.
  - *stage*: learn (card with Japanese stroke animation, parts, everyday words; type the native reading, compound reading and meaning with the answer shown; trace the character) → review (read, mean and **write** each from memory, one at a time, repeating until clean) → test (20 timed typed prompts plus up to 15 weaker earlier kanji; 80% clean clears it, 90% two stars, flawless three). any stage can be tested out.
  - *rush*: the You Can Kana–style arcade. prompts float with ring timers; typing targets whichever matches. three hearts (one back every 25-combo, up to five), combo multiplier up to ×5, fever at 25, a level every 8 clears. typed kinds only.
  - *practice*: calm, 20 prompts, one at a time, typed and written, shaky prompts repeat. results screens offer a one-key practice of everything missed.
  - prompt kinds: 読 any on'yomi/kun'yomi, 意 any English sense, 語 curriculum words, 書 writing. typing accepts every common romaji spelling, IME kana, or a mix; wrong keys are refused.
- **writing** is graded stroke by stroke (shape, direction, order) with hanzi-writer's quiz. a write is clean with at most one slip (two for 10+ strokes); after two misses a stroke hint appears, after three the stroke is filled in. Japanese stroke data for all 300 kanji and most radicals ships in `src/data/strokes.js` (animCJK, Arphic Public License, see `strokes.LICENSE.txt`), so writing and stroke animations work offline. regenerate with `node scripts/build-strokes.mjs path/to/graphicsJa.txt`.
- **reviews**: kanji skills are reading (`character:id:reading`), meaning (`character:id:meaning`, also updating an older `drill:id:meaning`), writing (`drill:id:writing`) and word reading (`drill:id:reading`). each finished run schedules each touched card once with the existing interval ladder. retired drill skills (recognition, word meanings, sentence gaps, components) remain valid in backups but are never due. the card session now covers only grammar and sentences.
- **mastery**: per-kanji ease per kind from rush plus review streaks. mastered needs reading, meaning and writing all solid. weak kanji spawn more often and get more time.
- **grammar**: 30 lessons and sentence reading (the furigana typing game) under one tab.
- **library**: character pages add practise and stage links, skill bars, and a writing pad (from memory or trace).
- **settings**: sound, spoken readings, arena palettes (unlocked by lifetime score), backups. rush records live in `progress.rush` in the same backup and are validated on import.
## accepted latest — september 17, 2026

the owner accepted the daily-study candidate (`e8a49c6`) and requested saving it as latest in the private repository. the next requested phase is nas-hosted access for phone use; deployment is deferred to the next task. choose and verify that delivery route before changing services, exposure, or installation instructions. the current native packaging and progress storage remain available. no nas configuration or signing helper was changed in this save.

## daily-study candidate — september 17, 2026

completed the bounded daily-study milestone on `codex/daily-study-polish`, based on `d594819`, in `S:/tmp/codex/revision-polish/app`. new daily skills use typed meaning and contextual word reading. the intake setting now caps new characters per local day across ranges and practice modes, while bounded catch-up completes missing skills. the overview explains actual progress without treating same-day repeats or handwriting self-checks as mastery.

checked answers and handwriting comparison drawings now survive reload before advancing. failed writes remain retryable, assisted answers stay unearned, and completion links back to tricky material. sentence-gap prompts now blank one intended occurrence instead of every matching substring. fixed the observed 320-pixel navigation overflow and added accessible progress labels and feedback focus.

53 app/configuration tests, seven packaging tests, lint, production web/iOS renderer builds, and native asset sync pass. chrome checks exercised wrong answers, hints, keyboard submission, writing/undo/clear, reload, saved progress, empty practice, and the full daily study flow. backup export/validation/restart round trips pass automatically; the chrome file-picker automation timed out, so its UI replacement round trip remains unverified. no physical iphone test or new native executable build is claimed. see [candidate handoff](DAILY-STUDY-RC.md) and [bounded content review](DAILY-STUDY-CONTENT-REVIEW.md).

the original public remote, native storage key, bundled/offline core content, and nas-only installation route are preserved. no new dependencies, bulk curriculum, public publishing, or signing helpers were added.

## nas-only correction — september 15, 2026

the owner explicitly rejected a signing helper on the windows pc. uninstalled the previously installed AltServer 1.7.4 and verified both its process and executable were gone. removed only this task's AltServer installers and newly downloaded iTunes installer; existing Apple software was unchanged. updated README, the cloud packaging step label, and the iphone guide to require nas-side signing and refresh. four native configuration tests pass; the app itself was not rebuilt or changed.

recovered the existing nas credentials from the owner's earlier NAS EDITS task without saving passwords to source. verified SSH access, Debian 13 x86_64, approximately 7 GiB available RAM and 53 GiB free OS storage. installed the small official Debian iphone USB utilities (13 new packages, zero upgrades/removals), started usbmuxd, and verified a successful empty device scan after initialization. SMB/SSH/avahi stayed active. no signing helper, Docker, public endpoint, or storage reconfiguration was deployed. awaiting an iphone connected directly to the nas and its exact iOS version; old AltServer-Linux binaries have current-iOS compatibility reports. see [iphone setup](IOS.md).

## personal iphone builds — september 12, 2026

the current direction is a private, installed app for daily use before any public release. added a manual `ios-sideload` cloud workflow with unsigned physical-device compilation and validated IPA packaging for personal signing on windows. no Apple membership, signing keys, store upload, or paid billing is configured for this workflow. 36 app/config tests, seven package fixture tests, lint, and resource sync passed locally and on the cloud mac. native build 1 finished successfully in 1 minute 41 seconds and produced a 7.45 MB unsigned IPA. installed official AltServer 1.7.4 on S:; first-run Apple dependency checks and phone pairing remain pending. two on-device installs and progress retention still need verification. created and populated the private `okisooo/revision-app` repository without changing the original public repository. the nas file share is reachable, but shell authentication failed and openmediavault administration needs user login. no nas services have been changed. see [iphone setup](IOS.md) for the build link, checksum, exact current route, and public-release gates.

## iphone preparation — september 12, 2026

added a Capacitor 8 iOS project, native Preferences-backed study progress, native backup sharing, safe-area spacing, a generated app icon, and manual Codemagic check/private-TestFlight workflows. progress saves are serialized and awaited before the guided session advances. new tests cover delayed and failed writes, restart recovery, native configuration, and private-only release settings. the web bundle, native asset/plugin synchronization, XML/project parsing, and 35 tests pass on windows. actual macOS compilation, signing, TestFlight upload, and iphone testing remain pending account access. see [iphone setup](IOS.md).

the inherited Electron packaging dependency audit is still unresolved; these desktop dependencies are not embedded in the iOS web bundle. no cloud account, apple credentials, public release, repository push, or billing setup was performed.

## shipped

latest design revision: white surfaces, blue accents, concise screen titles and controls, compact home screen, and collapsed practice filters. all existing learning content remains available; the library now also searches all 300 sentences, their translations, and target readings.

character-learning upgrade: 30 sets of 10 characters, seven targeted practice modes (recognition, typed meaning, word reading, word meaning, sentence gaps, visual components, and writing from memory), mixed and weak-only sessions, per-skill strength, and saved personal memory notes. hints/reveals cannot earn strength, including after reloading. missed exercises retry with the same example; variant choice persists with the session. handwriting is self-checked against the reference, using the drawing pad or paper.

the content audit repaired 15 placeholder meanings using live dictionary responses recorded in `meaning-repairs.json`. learner-facing core glosses are selected separately from the full reference senses. character/sentence links now require the actual character to occur in an annotated target present in the sentence: 278 characters have matching contextual exercises, and unsupported modes are disabled for the remaining entries. visual component coverage varies by character. no new sentences were fabricated to fill gaps.

- calm workbook interface with today, learn, review, and library navigation.
- guided sessions combine up to 20 due prompts, 3/5/10 new characters in a configurable curriculum range, two contextual sentences, and one new grammar pattern.
- independent schedules for meaning, reading, sentence understanding, grammar, and all seven practice skills. successful recall uses 1, 3, 7, 14, 30, then 60 day intervals. consecutive strength only grows on successful recalls at least 24 hours apart. same-day repetitions do not postpone an existing future due date. a miss resets the interval to one minute and adds one immediate retry at the end of the current session.
- sessions persist after every answer and can resume after restarting. completed session summaries retain the latest 365 sessions. three consecutive recalls in both meaning and reading mark a character comfortable; this does not certify writing ability.
- 30 lesson pages with knowledge checks and saved completion. newly completed patterns enter review. all 300 characters, 58 radicals, 300 existing sentences, and the original example-word references remain available.
- searchable character, word, grammar, and radical library. character pages reveal essential information first, followed by context, structure, and expandable full reference.
- backup export and validated import with a replacement confirmation. export before switching devices or reinstalling. browser preview and electron desktop progress are separate.
- local fonts, keyboard focus, reduced-motion support, and narrow-window layouts.
- original quizzes and writing tools remain accessible. custom quiz answers feed the new review history. the old weak list is imported on first use of the new store.
- fixed the quiz reading helper, a contracted-vowel input mapping, incorrect back navigation from writing, and all pre-existing lint findings.

## scope and limits

the implementation uses the existing curriculum. the proposed 50 lessons, 600 characters, curated 1,500 core words, 1,000 sentences, listening, and dialogues are expansion targets, not shipped content. the raw 7,500 word-example records are not 7,500 distinct curated words. reference order does not imply frequency.

review ratings are self-assessed. lesson quizzes are checked automatically. handwriting remains free practice, not automatically graded. the older sentence typing studio retains its existing input and scoring behavior; it does not measure comprehension in the new progress model.

the app and its fonts are local. stroke animations still request data from the existing external stroke-data service, with a static fallback when unavailable. no cloud account or sync was added. electron and the inherited packaging dependencies still need a separate compatibility and security upgrade before public distribution.

## development

- `npm run dev -- --host 127.0.0.1`: browser development.
- `npm test`: scheduler, queue, backup validation, content, and reading conversion regressions.
- `npm run lint`: repository-wide checks.
- `npm run build`: production renderer, including bundled font assets.
- `npm start`: electron desktop using the most recent production build.

new code lives in `src/study/`. the versioned storage key is `study_suite_v1`; original storage keys are preserved. backups include preferences, per-skill records, lesson completion, saved sessions, and any active queue. writes persist before advancing the guided-session interface.

## next content pass

audit the source curriculum before expanding it: choose useful vocabulary, verify reading relevance and natural sentence usage, tag lesson difficulty, and add missing explanations. use the existing reference lists as leads rather than treating their order as a frequency ranking. then extend the same lesson and review structures with reviewed content.
