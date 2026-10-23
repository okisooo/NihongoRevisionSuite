# daily study content review

**review date:** 2026-09-17
**reviewed revision:** `d594819` (`private/main`, `codex/iphone-personal`), checked against the assigned `S:\tmp\codex\revision-polish\app` checkout
**scope:** bounded read-only audit of the bundled 300-character curriculum and daily meaning, reading, and contextual prompts. this does not claim that the entire dictionary or sentence set is accurate.

## measured coverage

the bundle contains 300 characters, 300 sentence records, and 300 character records with example words. `contextsFor` finds a sentence target containing the character in **278/300 (92.7%)** entries. 22 characters therefore have no contextual exercise and should remain unavailable for context-dependent modes until reviewed content exists. the matcher requires the target word and sentence text to agree, which is safer than trusting historical `kanjiId` links alone.

all first 10 characters have typed-meaning, typed-reading, and context-backed reading prompts. their matched-context counts are 3, 2, 2, 1, 1, 1, 2, 4, 1, and 2. learner-facing meaning answers are `one`, `two`, `three`, `mountain`, `river, stream`, `eye`, `mouth`, `person`, `tree, wood`, and `rest`.

## first-10 prompt sample

| id | character | typed meaning | reading prompt → answer | context | result |
| ---: | :---: | --- | --- | --- | --- |
| 1 | 一 | one | 一つ → ひとつ | 私はりんごを一つ買いました。 | usable |
| 2 | 二 | two | 二人 → ふたり | 二人はとても仲が良いです。 | usable |
| 3 | 三 | three | 三つ → みっつ | 三つのリンゴがあります。 | usable |
| 4 | 山 | mountain | 山 → やま | 富士山は日本で一番高い山です。 | fixed in polish checkout |
| 5 | 川 | river, stream | 川 → かわ | この川はとても長いです。 | usable |
| 6 | 目 | eye | 目 → め | テレビの見すぎで目が痛いです。 | usable |
| 7 | 口 | mouth | 口 → くち | 大きな口を開けてください。 | usable |
| 8 | 人 | person | 二人 → ふたり | 二人はとても仲が良いです。 | usable, shared word context |
| 9 | 木 | tree, wood | 木 → き | 公園に大きな木があります。 | usable |
| 10 | 休 | rest | 休みます → やすみます | 日曜日は仕事を休みます。 | usable |

in the d594819 baseline, `makeExercise(4, "cloze")` produced `富士［　］は日本で一番高い［　］です。` with answer and accepted value `山`. `checkExercise` returned true for that answer, so the defect was not a false-negative checker: the prompt presented two identical blanks, including one inside the larger word `富士山`, while requesting one answer. this created ambiguous and misleading practice. the same repeated-target pattern occurred in 10 target records: ids 4 `山`, 11 `本`, 121 `車`, 175 and 225 `都`, 232 `家`, 244 `歌`, 252 `物`, 262 `私`, and 267 `研究`.

the polish checkout now applies a deterministic display heuristic: enumerate exact target spans, prefer an occurrence whose Han-character boundary is not adjacent to another Han character, and replace only that span. for id 4 this yields `富士山は日本で一番高い［　］です。`; the original scorer still accepts `山`. this is a boundary heuristic, not a tokenizer or a reading validator. the change was regression-tested, including repeated context variants, and keeps the current scoring contract.

the 22 no-context ids are `23, 124, 125, 128, 133, 142, 144, 145, 146, 153, 159, 160, 161, 162, 163, 169, 170, 171, 174, 204, 206, 300`. this is a coverage limitation, not evidence that their meanings or readings are wrong. current mode gating suppresses cloze for them. every character has 25 reference examples, but that is not a verified frequency-ranked or unique core-word count.

## content and learning decisions

the sequence is directionally sound: recall, reveal a reference answer and context, then schedule later review. retrieval practice benefits later recall across materials and learner groups ([McDermott, 2021](https://pubmed.ncbi.nlm.nih.gov/33006925/)). distributed practice improves delayed retention, while the best interval depends on the retention horizon and task ([Cepeda et al., 2006](https://pubmed.ncbi.nlm.nih.gov/16719566/); [Karpicke and Bauernschmidt, 2011](https://pubmed.ncbi.nlm.nih.gov/21574747/)). describe the app's interval choices as a product heuristic rather than a proven optimum for this curriculum.

for the next content pass, preserve progressive reveal: typed meaning first, one relevant word reading second, then sentence meaning or cloze with immediate correction. review the 22 uncovered characters and manually inspect the 10 repeated-target cases after the heuristic, before adding more characters. record a named source for each newly curated word, reading, translation, and lesson link; reference-list order is not a frequency claim.

## source, attribution, and licensing risks

the kanji fields resemble KANJIDIC2 conventions, including `.` for okurigana and `-` for prefixes or suffixes. KANJIDIC2 documents its reading/meaning fields and points users to EDRDG licensing; that does not automatically clear bundled data for commercial redistribution ([KANJIDIC2 DTD](https://www.edrdg.org/kanjidic/kanjidic2_dtdh.html), [KANJIDIC2 project](https://www.edrdg.org/kanjidic/kanjd2index_legacy.html), [EDRDG licenses](https://www.edrdg.org/edrdg/licence.html)). preserve upstream version, notices, transformations, and redistribution terms.

the project documentation links the curriculum to *Minna no Nihongo*. textbook-linked lesson structure, explanations, example words, and translations need separate permission and attribution review before public or paid distribution. this note does not legal-certify the bundle. record provenance and translation authorship for the 300 short sentences rather than inferring clearance from source control.

## release conclusion

there is no broad first-10 meaning or reading coverage failure. the serious repeated-target prompt issue affecting the first new-character batch and 9 further records is fixed in the polish checkout and covered by regression tests; the boundary heuristic still merits content review. context coverage is 92.7%, with the remaining 22 characters gated. licensing and source attribution remain public-release gates.
