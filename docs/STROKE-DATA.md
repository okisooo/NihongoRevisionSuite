# stroke data

The importer reads AnimCJK's `graphicsJa.txt`, `graphicsJaKana.txt` and
`svgsJaKana/` from the same source revision:

```text
node scripts/build-strokes.mjs path/graphicsJa.txt path/graphicsJaKana.txt path/svgsJaKana
```

Some looping characters have multiple animation outlines for one pen stroke.
For example, SVG IDs `d2a` and `d2b` are both stroke 2. The graphics export lists
them separately. Importing them directly incorrectly asks the learner to lift
their pen midway through a stroke.

`mergeStrokeParts` groups these outlines by the logical stroke ID in the SVG.
It retains all outline pieces as one compound path and uses the first piece's
median, which follows the complete pen motion. Later animation medians include
reflected detours for timing and must not be used for grading.
Source/outline count or stroke-order mismatches fail the build.

The same importer normalizes the ten circle diacritics to start at the bottom
and travel clockwise. Their source animation medians ran counterclockwise.
Winding is checked before changing direction, so an already-corrected upstream
source is not flipped again. Outlines and base-character strokes stay unchanged.
This follows the independent stroke reference and
[instruction from a handwriting teacher](https://ameblo.jp/ikuyokaiyu/entry-12672818453.html).

The looping-stroke correction added on 2026-10-24 preserved the existing
491-character data set and changed 21 looping characters. The later full
writing audit corrected the ten circle paths described above. SVG grouping was
checked against upstream revision
`3e1253b341cc7be14c3540bb3c045e6163557777`. The existing outlines were retained
to avoid unrelated glyph changes. Attribution is in `src/data/strokes.LICENSE.txt`.

Regression tests cover all 21 corrected stroke counts, animation detours,
compound outlines, three-part loops and malformed inputs. Browser checks use
the actual `WritePad` and its mouse handlers to draw continuous strokes and
check the resulting stroke count and mistakes. These are automated pointer
checks, not a physical touchscreen handwriting test.

`tests/fixtures/writing-reference.json` records the independently checked stroke
counts and fingerprints of all 442 writing-lesson models. A new model or a
changed shape, direction or order fails the tests until it has been re-audited.
Valid handwritten variants are documented separately from source errors.

Upstream documents the split-animation format in its
[animation notes](https://github.com/parsimonhi/animCJK#animation).
