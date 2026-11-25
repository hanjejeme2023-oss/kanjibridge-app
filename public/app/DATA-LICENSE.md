# Licence of the imported data

This folder holds the dictionary data of **Kanji Bridge** (漢字ブリッジ), imported unchanged from
the repository [hanjejeme2023-oss/kanji-bridge](https://github.com/hanjejeme2023-oss/kanji-bridge)
by `scripts/import_data` (see `DATA-MANIFEST.json` for the source commit and the SHA-256 of every
file). The files are deployed together, so the notices always travel with the data.

| File | What it is | Licence |
|---|---|---|
| `data.js` | the dataset (`window.KB_DATA`) | **CC BY-SA 4.0** ([`LICENSE-DATA`](LICENSE-DATA), [`licenses/CC-BY-SA-4.0.txt`](licenses/CC-BY-SA-4.0.txt)) |
| `NOTICE.md` | third-party sources, attributions, EDRDG acknowledgement, AI-content notice | part of the dataset's notices |
| `LICENSE-DATA` | the dataset licence and attribution list | — |
| `licenses/` | each upstream source's own licence text | each file's own terms |
| `DATA-MANIFEST.json` | provenance: source commit, file list, hashes | — |
| `DATA-LICENSE.md` | this note | — |

Rules for this repository:

1. **The data stays CC BY-SA 4.0**, with every attribution, including the EDRDG acknowledgement:
   *This app uses the JMdict and KANJIDIC2 dictionary files. These files are the property of the
   Electronic Dictionary Research and Development Group, and are used in conformance with the
   Group's licence.*
2. **The imported files are never edited here.** Data fixes are made in kanji-bridge and imported
   again with `scripts/import_data` at a new pinned commit; the manifest and the SHA-256 change in
   the same reviewed commit.
3. **The code of this repository is MIT** (`LICENSE` at the repository root). The MIT licence does
   not cover these data files.
4. The app's "About" panel and the overview page keep the sources, the licences and the
   AI-content notice (PROMPT §2).

`NOTICE.md` and `LICENSE-DATA` are copied verbatim from kanji-bridge. Their relative links and
paths (`docs/SOURCES.md`, `pipeline/`, `data/final/`, `content/`, `LICENSE`) refer to the
kanji-bridge repository at the commit named in `DATA-MANIFEST.json`, not to this repository.
