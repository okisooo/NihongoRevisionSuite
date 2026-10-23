# play room - first playable direction

The owner rejected the daily-plan structure and the cluttered, open layout.
This pass replaces the home dashboard with an enclosed play room and makes
short, self-paced play the primary interaction.

## interaction

- One primary action opens or resumes a round. Sounds and characters are the two
  entry tracks; all sets can be selected without daily limits.
- A round chooses five skills, favoring ones with fewer clean recalls. New items
  show their answer for a single typed introduction. Guided copies earn no points
  and never count as successful recall.
- The answer then disappears. Each skill needs two unassisted recalls. Correct
  input advances with feedback, sound and combo points. Helped answers return
  after other prompts rather than finishing the round early.
- A result screen offers another round, replay, or leaving. No streak loss,
  daily checklist, calendar or quota appears on the play-room home screen.
- Handwriting, listening, timed rush, grammar and reference tools stay available.

## data and learning claims

The optional `progress.flow` record stores the active queue, feedback and results.
It is validated during backup import. Every accepted answer commits before the
interface advances. Reloading scored feedback cannot award it twice. Starting
another set commits the real recall earned in an unfinished round.

Finished rounds fold into the existing skill records, score and kanji review
schedule. They do not award writing mastery, spaced-retention certification or
timed stage clears. A suggested next set means its typed skills have been
recalled twice; it is not a claim of long-term mastery.

The storage key and old backup format remain supported. Existing native
preferences and sharing adapters are preserved. Accounts and cross-device sync
are unchanged and remain future work.

## design

A dark green surround frames warm paper and physical character tiles. Navigation
is reduced to play, practice and library. During play, one prompt and one answer
field occupy the center; set selection and broader progress stay outside the
round. Motion supports answer feedback and respects reduced-motion settings.

This is a playable direction, not evidence that the experience is addictive or
that the owner has approved the design. The next useful feedback is how a full
round feels: where it drags, what makes another round appealing, and whether
the teaching-to-recall transition is clear.

## verification

80 unit tests and lint pass. New tests cover guided-answer scoring, delayed
helped-answer retries, duplicate-save protection, interrupted rounds, old backup
compatibility, malformed imports, and both character tracks.

Browser checks cover a complete sound round, a wrong answer and repair, reload
mid-round, the next-set action, character reading and meaning introductions,
and a simulated storage failure followed by a successful retry. No points or
answers advance when the write fails. Automated accessibility checks found zero
violations or incomplete checks in the home, round and result sections. Layouts
were checked at 1360 and 390 pixels, plus a same-origin 320-pixel viewport. This
does not constitute a physical phone or app-store installation test.
