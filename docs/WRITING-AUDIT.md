# writing lesson audit - 2026-10-24

all 442 writing-lesson characters (300 character lessons and 142 single-character
sound lessons) were compared with the independent stroke reference pinned in
`tests/fixtures/writing-reference.json`. all stroke counts agree. comparison
sheets covered every lesson shape; ordered and reversed path comparisons covered
the stroke sequences, with a separate winding check for the ten closed circles.

the audit corrected those ten circle paths to start at the bottom and travel
clockwise. outlines and other paths are unchanged. the writing pad also no
longer auto-completes a stroke after three wrong attempts. unsupported characters
cannot silently load an online model from another language's data.

884 automated pointer replays passed: every lesson in both trace and memory
mode. repeated wrong shapes, a backward stroke, an out-of-order stroke, a partial
loop and the opposite circle direction were rejected. 88 unit tests pass.
these are automated checks, not physical touchscreen tests or a teacher's
assessment of freehand samples.

the three-dot handwritten components in u+7d19 and u+7d42 legitimately differ
from the schoolbook form in shape and order. they are preserved, with reference
notes in the fixture. see [the handwriting-style explanation](https://kakijun.jp/main/itohen.html).
the circle correction follows [the independent diagrams](https://kanjivg.tagaini.net/)
and [a handwriting teacher's instruction](https://ameblo.jp/ikuyokaiyu/entry-12672818453.html).

the bundled table has 491 entries; the verified lesson snapshot covers 442.
reference-only components are not all independently certified. three additional
reference components have no local stroke data and are not writing lessons.
see [the stroke data workflow](STROKE-DATA.md) before regenerating models.
