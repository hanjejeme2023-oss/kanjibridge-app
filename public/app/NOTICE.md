# NOTICE: third-party data in Kanji Bridge

Kanji Bridge (漢字ブリッジ) is built from the sources below. Each source's own licence file is in [`licenses/`](licenses/); the licence check and the per-column use are logged in [`docs/SOURCES.md`](docs/SOURCES.md) §1–§2, and the release decision is D78/D79 in [`docs/DECISIONS.md`](docs/DECISIONS.md).

**All of these sources were modified**: the scripts in [`pipeline/`](pipeline/) parse, normalise (Unicode NFC), filter, merge and align them, and select readings by recorded rules. The dataset built from them (`data/final/`, `app/data.js`, `data/staging/ff_candidates.csv`) is licensed under **CC BY-SA 4.0** because several sources are share-alike; see [`LICENSE-DATA`](LICENSE-DATA). The code is MIT ([`LICENSE`](LICENSE)).

| # | Source | Licence | Licence file | What Kanji Bridge uses |
|---|---|---|---|---|
| 1 | **Unihan database**, Unicode, Inc. — https://www.unicode.org/Public/UCD/latest/ucd/Unihan.zip | Unicode License v3 (SPDX `Unicode-3.0`) | `licenses/UNICODE-LICENSE.txt` | character variants, Korean, Mandarin and Vietnamese character readings |
| 2 | **KANJIDIC2**, Electronic Dictionary Research and Development Group (EDRDG) — https://www.edrdg.org/wiki/index.php/KANJIDIC_Project | CC BY-SA 4.0 + EDRDG General Dictionary Licence | `licenses/KANJIDIC2-EDRDG-LICENSE.html` | Japanese character forms and on-readings |
| 5 | **JMdict**, EDRDG — https://www.edrdg.org/wiki/index.php/JMdict-EDICT_Dictionary_Project | CC BY-SA 4.0 + EDRDG General Dictionary Licence | `licenses/JMDICT-EDRDG-LICENSE.html` | Japanese word forms and readings |
| 3 | **ivankra/hsk30** (Ivan Krasilnikov, Shawky, Pleco Inc.) — https://github.com/ivankra/hsk30 | MIT | `licenses/HSK30-MIT-LICENSE.txt` | the HSK 3.0 word and character lists and levels (upstream list: PRC Ministry of Education; see "HSK provenance" below) |
| 4 | **CC-CEDICT**, MDBG — https://www.mdbg.net/chinese/export/cedict/cedict_1_0_ts_utf-8_mdbg.txt.gz | CC BY-SA 4.0 | `licenses/CC-CEDICT-LICENSE.html`, `licenses/CC-BY-SA-4.0.txt` | simplified forms, pinyin word boundaries, English glosses |
| 6 | **libhangul `hanja.txt`**, Copyright (c) 2005,2006 Choe Hwanjin — https://github.com/libhangul/libhangul | BSD 3-Clause (the file's own header) | `licenses/LIBHANGUL-HANJA-BSD-3-CLAUSE.txt` | Korean hanja readings and Sino-Korean words |
| 7A | **Vietnamese Wiktionary** contributors, via **Kaikki / Wiktextract** (Tatu Ylonen) — https://kaikki.org/viwiktionary/rawdata.html | CC BY-SA (and GFDL); used under CC BY-SA 4.0 | `licenses/KAIKKI-VIWIKTIONARY-LICENSE.html` | Hán-Việt readings of words and characters |
| 7B | **FrequencyWords** (Hermit Dave), from **OpenSubtitles 2018** — https://github.com/hermitdave/FrequencyWords | content CC BY-SA 4.0 | `licenses/FREQUENCYWORDS-CONTENT-LICENSE.md` | Vietnamese syllable frequencies (the `freq_vi` proxy) |
| 7C | **English Wiktionary** contributors (Vietnamese entries), via **Kaikki / Wiktextract** (Tatu Ylonen) — https://kaikki.org/dictionary/Vietnamese/ | CC BY-SA (and GFDL); used under CC BY-SA 4.0 | `licenses/KAIKKI-ENWIKTIONARY-LICENSE.html` | Hán-Việt word readings (rule A2) and verified character readings |
| 8 | **OpenCC** — https://github.com/BYVoid/OpenCC | Apache License 2.0 | `licenses/OPENCC-APACHE-2.0-LICENSE.txt` | Japanese shinjitai ↔ traditional mapping tables (inverted and filtered) |

Sources that were checked and **not** used (no licence, non-commercial terms, GPL, AI-generated or no gain) are listed in `docs/SOURCES.md` §1 (rows 7, 7D–7J). Nothing from them is in this repository.

## EDRDG acknowledgement

This app uses the JMdict and KANJIDIC2 dictionary files. These files are the property of the Electronic Dictionary Research and Development Group, and are used in conformance with the Group's licence (https://www.edrdg.org/edrdg/licence.html).

The same acknowledgement is shown in the app (「このアプリについて」 at the foot of the page). The EDRDG licence asks for a procedure for regular updating from the most recent versions: Kanji Bridge refreshes KANJIDIC2 and JMdict every 3 months, or sooner on a learner report (`pipeline/README.md`, "EDRDG update"; RELEASE_PLAN §6.3).

## Unicode notice

Copyright © 1991-2026 Unicode, Inc. Distributed under the Unicode License v3; the full copyright and permission notice is in `licenses/UNICODE-LICENSE.txt` and must accompany copies of the Unihan-derived data.

## libhangul notice

`hanja.txt` is Copyright (c) 2005,2006 Choe Hwanjin, all rights reserved, redistributed under the three conditions and the disclaimer in `licenses/LIBHANGUL-HANJA-BSD-3-CLAUSE.txt`.

## HSK provenance

The HSK 3.0 word and character lists come from `ivankra/hsk30` (MIT). That repository states that the underlying list was published by the PRC Ministry of Education and that its copyright status is unclear. The project owner accepted this risk for a personal, non-commercial release (D35, D78). If a rights holder objects, the HSK list and level data will be removed from the published dataset (RELEASE_PLAN §6.4).

## AI-generated content

Japanese meanings per language, false-friend judgments, reading passages, usage checks, example sentences and character usage notes were generated by **Google Gemini on Vertex AI** (`gemini-4-argon` for the main runs, `gemini-3.8-flash` for pilots and checks) and then reviewed (gates in `docs/GATES.md`). They may contain errors. Under the Google Cloud Service Specific Terms (Generative AI Services, §20(a)), generated output is the customer's data and Google asserts no ownership of it. Where rights exist, it is licensed with the dataset under CC BY-SA 4.0; the selection, review and arrangement are human work. Facts such as readings, characters and levels never come from the AI (PROMPT Global Rule 2).

## Fonts

The app page loads the Noto Sans / Noto Serif families from Google Fonts at run time (SIL Open Font License 1.1). No font file is stored in this repository.
