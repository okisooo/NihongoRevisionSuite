# Content accuracy and school curriculum

Reviewed 2026-10-24. This is a content review and regression baseline, not a
guarantee that every possible interpretation or device pronunciation is correct.

## School book

The learner supplied the cover of **Learning 300 Kanji through Stories**, basic
level, Kurosio Publishers, English/Korean/Portuguese/Spanish edition,
ISBN **978-4-87424-402-9**. [Publisher](https://www.9640.jp/nihongo/ja/detail/?402),
[official sample](https://www.9640.jp/BOOK_PDF/9784874244029.pdf).

All 300 current characters and their positions match the original school list in
`restore-curriculum.js`, excluding the separately starred components. All 300
also match the independently transcribed printed index in the companion workbook
(ISBN 978-4-87424-666-5), available through Hanoi University of Industry's Library
and Information Center. The publisher describes that workbook as based on the
main book. The exact main-book edition's publisher sample independently confirms
numbers **37–56**, including their order. See `SCHOOL-BOOK-VERIFICATION.md` for
sources, method and scope. No character photographs are needed from the learner.

Keep the character IDs and order: they identify saved study records. Do not run
the older database generators blindly: `fetch-kanji.js` and
`rebuild-database.js` contain different, obsolete lists. Tests now protect the
original list, the complete printed index and the independently checked
publisher sample.

## Dictionary checks

Checked all **300 character records**, **7,500 example records** (6,486 unique
spelling/reading pairs), and **584 generated standalone forms** against files
downloaded directly from EDRDG:

- [KANJIDIC2](https://www.edrdg.org/kanjidic/kanjidic2.xml.gz), SHA-256
  `eb725c13e2d01852b19ea041ee86acf9e10042535ee2238eecc0e04fd46b4f71`
- [JMdict English](https://www.edrdg.org/pub/Nihongo/JMdict_e.gz), SHA-256
  `b45f780bd76b56099fe36f1a6d12c7900db687592f3782280bd924dd7f3b2127`

Spelling, pronunciation and sense restrictions are checked together. A reading
marked as not applying to the written form is excluded. Dictionary frequency
flags, for both the written form and reading, replace the previous guess based
on duplicate examples. The dictionary reference can still contain uncommon
words and historical readings; these are not all required school vocabulary.

Corrections:

- Removed **4 example forms** not confirmed by the current dictionary. This is
  a conservative quarantine, not proof that every historical variant is wrong.
- Refreshed **455 example definitions** to dictionary-supported senses for their
  exact spelling and reading. Many changes are wording updates rather than
  factual errors. There are now **7,496 examples**, 6,482 unique pairs.
- Removed **43 generated standalone forms** not confirmed as dictionary words.
  Some were invented spellings made by combining character readings with kana
  endings. There are now **541 confirmed forms**; only frequency-marked forms
  are used for the native-reading teaching steps.
- Retired one stale affix reading. Two source differences are additional
  dictionary readings omitted from the app, not unsupported app readings.
- Bare-character reading questions no longer accept a whole verb/adjective
  pronunciation when its written kana ending is absent. A native-only character
  without a bare reading uses a confirmed complete word as its cue.
- Parentheses distinguish kana endings in the full reference. Different
  pronunciations of a word retain their corresponding meanings in feedback.
- Listening accepts the pronunciation actually played rather than a different
  valid reading of the same written word. Parenthetical glosses stay complete.
- Simplified misleading primary gloss choices, including “teach”, “body”,
  “cut”, “same”, and “wear”, while retaining fuller dictionary senses.

## Sentences and grammar

Reviewed all **300 sentences and target readings**, and **30 grammar lessons**
(56 patterns, 60 questions). Dictionary lookup alone does not verify an
inflected form or a sentence translation; the 56 current inflected/compositional
targets absent from direct dictionary lookup were reviewed separately.

Sentence repairs include missing written syllables in two pronunciation-guide
segments, a missing syllable and corrupted text in two other guides, incorrect
target forms, an incorrect verb reading for descending, one script inconsistency, and unnatural examples about weather,
discoveries, meeting rooms and spatial restrictions. Irregular whole-word
readings use a whole-word guide where splitting would be misleading. Historical
sentence IDs are retained; contexts still link by actual text.

Grammar repairs include five broken answer keys/constructions (lessons 12, 18,
19, 25 and 26), valid alternatives previously presented as wrong, and missing
context in particle/tense questions. Explanations now distinguish non-past from
present, the giver from the receiver, plants from people/animals in existence
sentences, adjective/noun connections, plain style, explanatory forms, verb
states and actions. One missing syllable in a grammar pronunciation guide is
also corrected. Lesson IDs and pattern positions remain stable.

Grammar review references are the Japan Foundation's original notes:
[Starter](https://www.irodori.jpf.go.jp/en/starter/pdf.html),
[Elementary 1](https://www.irodori.jpf.go.jp/en/elementary01/pdf.html),
[Elementary 2](https://www.irodori.jpf.go.jp/en/elementary02/pdf.html).
Specific checks include Elementary 1 lessons 3 (adjective changes), 4
(non-past/past), 9 (requests), 17 (giving/receiving), and Elementary 2 lessons 3
(potential verbs) and 7 (conditionals). These are accuracy references, not a
claim that the app's grammar sequence is the school's grammar textbook.

## Rechecking changes

Download the two source files into an external scratch directory, then run:

```text
node scripts/audit-lexicon.mjs <dictionary-directory> <report-directory>
npm test
npm run lint
```

The audit script is read-only with respect to curriculum source. Store its
reports outside the repository. Review unmatched inflections manually instead
of replacing them with dictionary forms. Do not automatically approve a changed
reference fixture: its grammar and sentence hashes represent a completed review.

`tests/fixtures/content-reference.json` includes dictionary-supported word pairs,
the preserved school inventory and reviewed grammar/sentence fingerprints.
`tests/content-accuracy.test.js` protects the corrected cases and checks all
sentence target spellings and pronunciation guides. Writing-model safeguards
from `WRITING-AUDIT.md` remain active.

Dictionary-derived content is credited under CC BY-SA 4.0 in
`public/content-sources.txt`. Book illustrations and stories are not copied.
