# Complete school-book inventory verification

Verified 2026-10-24: **300 of 300 characters match**, including every numbered
position. **0 missing, 0 extra, 0 reordered, 0 duplicates.** No character IDs or
student progress needed changing.

## Sources and edition identity

The learner's cover identifies **Learning 300 Kanji through Stories**, basic
level, English/Korean/Portuguese/Spanish edition, Kurosio Publishers,
**ISBN 978-4-87424-402-9**.

1. [Exact main-book publisher sample](https://www.9640.jp/BOOK_PDF/9784874244029.pdf):
   chapter 3 directly confirms positions 37–56. The sample itself does not show
   the full index.
2. [Publisher's companion-workbook description](https://www.9640.jp/nihongo/ja/detail/?666):
   identifies **Learning 300 Kanji through Stories Workbook**,
   **ISBN 978-4-87424-666-5**, first published June 2015, and explicitly describes
   it as based on the main book. Its translation languages differ, but it follows
   the same numbered 300-character curriculum.
3. [University-hosted workbook preview](https://lic.haui.edu.vn/media/Book_NN/L%C4%A9nh%20v%E1%BB%B1c%20ng%C3%B4n%20ng%E1%BB%AF/300%20S%C3%A1ch%20b%C3%A0i%20t%E1%BA%ADp%20Kanji%20%C4%91%E1%BB%83%20h%E1%BB%8Dc.pdf):
   PDF pages **2–3**, headed “Kanji 1–300 in This Book”, contain the complete
   printed numbered grid and its 16 chapter boundaries. Page 1 identifies the
   workbook; PDF page 4 confirms its publisher, date and ISBN.

The university PDF has 10 pages and SHA-256:

```text
c9b4ab3cafa5ba18f2848a76c609d23522477caf548b7d1cc2690ebe808956d0
```

The complete comparison uses the companion book's printed index, supported by
the publisher's compatibility description and the exact-edition main-book
sample. It is not a claim to have accessed all pages of the learner's physical
edition.

## Method

The university PDF is scanned, with no extractable text. Rendered both index
pages at 170 dpi, read every numbered cell, and transcribed the rows into
`tests/fixtures/school-book-reference.json` independently of the app's existing
data. Skipped chapter-heading cells. Compared the resulting 300 codepoints and
positions with `src/data/kanji.js`; checked uniqueness and contiguous chapter
coverage. Also compared the exact main-book sample's 37–56 range.

The reference fixture records source identity, retrieval date, SHA-256, page
numbers, transcribed rows and chapter boundaries. `tests/school-book.test.js`
fails if any app character, position or identifier differs from that reference.
The test does not regenerate its reference from app data.

## Chapter results

| Chapter | Book numbers | Checked | Differences |
| --- | --- | ---: | ---: |
| 1 | 1–17 | 17 | 0 |
| 2 | 18–36 | 19 | 0 |
| 3 | 37–56 | 20 | 0 |
| 4 | 57–74 | 18 | 0 |
| 5 | 75–92 | 18 | 0 |
| 6 | 93–111 | 19 | 0 |
| 7 | 112–130 | 19 | 0 |
| 8 | 131–150 | 20 | 0 |
| 9 | 151–169 | 19 | 0 |
| 10 | 170–187 | 18 | 0 |
| 11 | 188–206 | 19 | 0 |
| 12 | 207–226 | 20 | 0 |
| 13 | 227–243 | 17 | 0 |
| 14 | 244–262 | 19 | 0 |
| 15 | 263–280 | 18 | 0 |
| 16 | 281–300 | 20 | 0 |
| **Total** | **1–300** | **300** | **0** |

This check covers character identity, numbered order and chapter membership.
It does not assert that the app reproduces the book's vocabulary selections,
mnemonics, translations, illustrations or specific handwriting variants. Those
are separate from inventory verification; the earlier content and writing
audits remain documented separately.

Only the factual character sequence and chapter boundaries are stored in the
repository. The PDF and rendered scans remain in local scratch storage and are
not added to the app or redistributed with it.
