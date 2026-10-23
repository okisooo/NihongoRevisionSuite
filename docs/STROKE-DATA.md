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

The correction added on 2026-10-24 preserves the existing 491-character
curriculum. Only 21 looping characters change; other character data stays
identical. SVG grouping was checked against upstream revision
`3e1253b341cc7be14c3540bb3c045e6163557777`. The existing outlines were retained
to avoid unrelated glyph changes. Attribution is in `src/data/strokes.LICENSE.txt`.

Regression tests cover all 21 corrected stroke counts, animation detours,
compound outlines, three-part loops and malformed inputs. Browser checks use
the actual `WritePad` and its mouse handlers to draw continuous strokes and
check the resulting stroke count and mistakes. These are automated pointer
checks, not a physical touchscreen handwriting test.

Upstream documents the split-animation format in its
[animation notes](https://github.com/parsimonhi/animCJK#animation).
