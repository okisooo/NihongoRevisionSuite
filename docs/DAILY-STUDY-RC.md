# daily-study release candidate — september 17, 2026

## handoff

the candidate lives in `S:/tmp/codex/revision-polish/app`, on `codex/daily-study-polish`, based on `d594819`. the assigned default checkout was older (`93e86b7`), so this separate s: worktree carries the existing installed-app implementation forward without replacing either checkout. the public `origin` remote is unchanged. the owner subsequently accepted this candidate and authorized saving it to `private/main`. no public tag, signing, nas work, paid service, or native cloud build was performed.

## delivered

- daily study uses typed character meaning and contextual word-reading prompts for new skills. existing self-rated review cards and their schedules remain valid.
- the new-character setting now means per local calendar day, across ranges and all character practice modes. the first recorded introduction is retained. a character's second skill does not count as another new character. catch-up work prioritizes today's unfinished characters and keeps the number selected for new-skill work within the configured 3/5/10 character session budget. overdue reviews remain first, capped at 20 before new skills.
- the overview shows today's actual introduction count. extra manual practice remains available and may exceed the daily-study allowance. the progress label is now “comfortable,” with a collapsed explanation of spaced meaning/reading recall and separate writing self-checks.
- checked exercise feedback is saved before showing the answer. reload retains the submitted answer, correctness, assistance, component choices, and the drawing at handwriting comparison. advancing clears feedback and retains the stable retry variant. failed writes keep the exercise retryable. unsubmitted text and drawings before comparison are still temporary.
- sentence-gap exercises blank one occurrence. a boundary heuristic prefers the standalone target over a substring inside a larger compound. this repairs the ambiguous first-set mountain prompt; it is not a tokenizer or a reading validator.
- session results distinguish attempts and prompts requiring retries, with links back to tricky character or grammar references.
- feedback receives keyboard focus after checking. progress bars have accessible names. navigation fits at 320 pixels with 44-pixel-high targets; the smallest overview uses a readable two-column stats layout.

## storage and content decisions

the storage key `study_suite_v1`, version 1, native Preferences adapter, and serialized save mechanism are preserved. `introduced` and active-session `feedback` are optional additions; old backups remain accepted. records without an introduction date use their earliest available review date, a conservative approximation that can temporarily reduce new intake on the first day after upgrading. this is not reconstructed historical activity.

no curriculum expansion or dependencies were added. the audit measures 300 characters, 278 with matching contextual targets, 22 correctly gated entries, and 10 repeated-target records. all reference examples remain references, not a claimed unique curated vocabulary count. handwriting stays self-assessed. see [content review](DAILY-STUDY-CONTENT-REVIEW.md) for the first-ten sample, sources, and licensing limits.

retrieval and spacing research supports asking for recall and revisiting material; it does not establish this app's exact interval sequence or 3/5/10 daily intake as an optimum. the intake cap is a bounded-workload product decision, and the existing review intervals are unchanged.

## verification

baseline: 36 app/configuration tests, lint, and production build passed before implementation.

candidate automated checks:

- 53 app/configuration tests pass, including new daily-cap, range-switch, next-day, partial-skill, legacy-backup, saved-feedback, failed/delayed-write, drawing round-trip, clock-correction, and cloze regressions.
- browser export is tested through the actual `exportBackup` function with a captured download blob; the emitted JSON restores active feedback without changes. backup validation tests cover malformed data and compatible old records.
- seven python IPA packaging fixture tests pass.
- repository lint and `git diff --check` pass.
- web production build and iOS renderer build pass. `ios:sync` copies bundled content, regenerates plugin references, and prepares the icon successfully on windows. the generated Swift package has no intended source change.

observed chrome checks on a dedicated localhost test origin:

- incorrect lesson answers reveal correction; corrected answers save lesson completion.
- weak-only practice with no weak records displays its empty state and disables start.
- a wrong typed answer remains locked with its original text after reload; advancing adds its retry. a hinted correct retry remains assisted after reload and earns zero recall.
- the repaired mountain sentence shows a single intended blank and accepts the target through keyboard submission.
- drawing, undo, clear, comparison, and reload recovery work. clear disables comparison. a guide-assisted writing attempt offers no “matches” credit. the paper self-check alternative remains usable.
- a full ten-prompt daily session traverses due meaning, self-rated writing, typed readings/meanings, context, and grammar, then saves completion. after reload the overview shows `3 / 3` new characters and schedules no further new-character batch that day.
- the overview and practice screens were inspected at 390×844 and 320×740; the overview also at 844×390. an observed header overflow at 320 was fixed: final document width is 312 within the 320 viewport (scrollbar accounted for), and 836 within 844 landscape. no console errors were returned in the final check.

## limits before installation or wider release

these are desktop chrome observations, not physical iphone results. mobile keyboard composition, touch/pencil feel, screen-reader behavior, native sharing/import, offline launch, and update retention still need the existing phone checklist in [IOS.md](IOS.md). no new signed or unsigned native executable was compiled here.

the chrome automation file-chooser event timed out twice; its native picker was not exposed as a targetable window. therefore the actual choose-file → replace-confirmation browser UI round trip remains unverified. automated export/validation/restart round trips pass. no browser security setting was changed to work around this tooling limit.

the initial bundle remains about 1.25 MB before compression; the existing build-size warning remains. inherited Electron packaging dependencies still report deprecation warnings. these were not expanded into a dependency migration.

public distribution still requires a broader content/provenance and licensing review, especially textbook-linked material, plus accessibility and real-device verification. the contextual boundary heuristic does not certify every sentence's naturalness or every annotated reading.

## next owner action

the owner accepted this as latest and selected nas-hosted access for phone use as the next phase. hosting has not been configured; inspect the nas and confirm the chosen phone delivery route before deployment. retain the native build route in `IOS.md` as a separate available option. preserve progress and verify backup transfer before changing origins or installation methods. source, dependencies, previews, builds, and verification scratch for this candidate are physically on s:.
