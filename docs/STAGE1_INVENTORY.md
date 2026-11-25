# Stage 1 inventory: kanji-bridge app v2

Claude, Stage 0, 2026-11-24. This is a read-only inventory of `../kanji-bridge/app/index.html` at commit `59156e119bb4ec1652ac573e9cf821c0d064e9dc` (`59156e1`). That file is 65,711 bytes and 860 lines, SHA-256 `904be17b2e4bf1f502cfcacbf1a88d6eda1e214edfbae7cf3ba8e1da710a7cac`. kanji-bridge calls it **app v2**: the Stage 5 baseline plus the R1 chunked renderer, whose final DOM equals app v2's. Line numbers below refer to that file. Nothing in kanji-bridge was changed.

Contents: §1 UI strings → i18n keys · §2 localStorage · §3 views and view states · §4 external requests · §5 how `data.js` is consumed · §6 findings for later stages.

## 1. UI strings and proposed i18n keys

**Count** is the number of places in `index.html` where the string is used as UI text. Each place is a static HTML location, a template literal or a JS constant. **Lines** are the source lines. `{name}` marks a value inserted by code. A key marked *html* contains a `{name}` slot that code fills with escaped markup it builds itself (`tHtml`, STAGE1_SPEC §4). The markup is never stored in the JSON. `　` is the ideographic space U+3000. It is part of the Japanese layout, so it lives inside the template strings.

Key style: flat, dotted, lower-case keys in `src/i18n/ja.json`. One key stands for one meaning. A string used in two roles gets two keys when other languages may need different words (for example `nav.ff` and `glyph.ff_badge`).

### 1.1 Document and header

| Key | ja (today's wording) | Count | Lines | Notes |
|---|---|---|---|---|
| `app.title` | 漢字ブリッジ | 1 | 6 | `<title>`; the gate checks it equals 漢字ブリッジ |
| `header.logo_mark` | 漢 | 1 | 201 | inside `<span class="han">` |
| `header.logo_text` | ブリッジ | 1 | 201 | follows the mark after one space (markup) |
| `nav.cards` | カード | 1 | 203 | |
| `nav.rules` | 音のルール | 1 | 204 | |
| `nav.ff` | 偽の友達 | 1 | 205 | |
| `nav.read` | 読解 | 1 | 206 | |
| `nav.glyph` | 字体 | 1 | 207 | |
| `header.mute` | ミュート | 1 | 209 | toggle label |
| `header.topstat` | 今日 {due} 枚　習得 {learned}/{total} | 1 | 563 | numbers are plain (no locale formatting) |

`<html lang="ja">` (line 2) and `toLocaleString('ja-JP')` for the tab counts (line 520) are **locale settings, not strings**. They go into the i18n module's locale metadata (`htmlLang: 'ja'`, `numberLocale: 'ja-JP'`). Stage 1 keeps `lang="ja"` in the HTML.

### 1.2 Language names

| Key | ja | Count | Lines | Notes |
|---|---|---|---|---|
| `lang.ja` | 日本語 | 2 | 656, 769 | rules table header, reading sheet |
| `lang.ko` | 韓国語 | 2 | 656, 769 | |
| `lang.zh` | 中国語 | 10 | 220, 244, 248, 464, 567, 599, 656, 693, 770, 791 | segment buttons, `LNAME` (464, used by `speech.*`), example, answer, table, sheet and usage labels |
| `lang.vi` | ベトナム語 | 11 | 219, 245, 249, 464, 567, 582, 598, 656, 693, 770, 791 | as above, plus the card input label (582) |
| `lang.zh_pinyin` | 中国語（ピンイン） | 1 | 583 | card input label |
| `lang.both` | 両方 | 1 | 221 | target segment |
| `lang.short_ja` | 日 | 1 | 331 | `LANG_LABEL`, false-friend rows |
| `lang.short_ko` | 韓 | 1 | 331 | |
| `lang.short_zh` | 中 | 2 | 331, 347 | also the passage names |
| `lang.short_vi` | 越 | 2 | 331, 347 | |

### 1.3 View explanations (`.tab-explain`)

| Key | ja | Count | Line |
|---|---|---|---|
| `cards.explain` | 2字以上の単語を、日本語と韓国語を手がかりに中国語・ベトナム語で答える | 1 | 216 |
| `rules.explain` | 韓国語のパッチムからベトナム語の語末を推測するルール | 1 | 230 |
| `ff.explain` | 同じ漢字でも言語によって意味が違う、間違えやすい単語 | 1 | 236 |
| `read.explain` | 短い中国語・ベトナム語の文を読み、わからない語をタップして確認する | 1 | 257 |
| `glyph.explain` | 1字の漢字の形（日本・繁体・簡体）と読み、使われ方 | 1 | 269 |

### 1.4 Shared

| Key | ja | Count | Lines | Notes |
|---|---|---|---|---|
| `common.all` | すべて | 2 | 243, 276 | false-friend filter, glyph filter |
| `common.list` | 一覧 | 2 | 239, 272 | false-friend mode, glyph mode |
| `common.correct` | 正解 | 2 | 439, 591 | table-test result, card result (the score uses `glyph.score`) |
| `word.rare_reading` | （{r}） | 2 | 313, 314 | rare `ja`/`ko` reading shown in parentheses (`ja_use`/`ko_use` = `rare`) |

### 1.5 カード (cards)

| Key | ja | Count | Lines | Notes |
|---|---|---|---|---|
| `cards.autoplay` | 答えを自動で再生 | 1 | 223 | toggle |
| `cards.queue` | 残り {n} 枚 | 1 | 571 | empty string when n = 0 |
| `cards.done_title` | 今日はここまで | 1 | 574 | |
| `cards.done_text` | 読解で新しい単語を見つけて、カードに追加できる。 | 1 | 574 | |
| `cards.korean_hanja` | 韓国の漢字 {h} | 1 | 577 | only when the Korean form differs |
| `cards.guess_placeholder` | 読みを予想 | 2 | 582, 583 | `placeholder` attribute |
| `cards.show_answer` | 答えを見る | 1 | 584 | followed by the key cap `Enter` |
| `cards.no_tone_ok` | 声調記号なしで入力してもOK | 1 | 585 | |
| `cards.no_input` | 入力なし | 1 | 591 | |
| `cards.yours` | あなた：{s} | 1 | 592 | |
| `cards.glyph_tag` *html* | 字体　{j}　{h}　{z} | 1 | 594 | `{h}` and `{z}` are wrapped in `span.ko` / `span.zh` |
| `cards.rate_again` | もう一回 | 1 | 604 | |
| `cards.rate_hard` | 難しい | 1 | 605 | |
| `cards.rate_ok` | OK | 1 | 606 | |
| `cards.rate_easy` | 簡単 | 1 | 607 | |
| `cards.interval_now` | すぐ | 2 | 604, 614 | static `<small>`, `ivLabel()` |
| `cards.interval_days` | {n}日後 | 1 | 614 | |
| `cards.play_vi` | ベトナム語を再生 | 1 | 609 | after the key cap `V` |
| `cards.play_zh` | 中国語を再生 | 1 | 609 | after the key cap `C` |
| `cards.play_sep` | 　 | 1 | 609 | joins the two hints |

### 1.6 音のルール (sound rules)

| Key | ja | Count | Lines | Notes |
|---|---|---|---|---|
| `rules.none_label` | パッチムなし → 子音で終わらない | 1 | 329 | `NONE_RULE.label`; the other labels come from data (§5) |
| `rules.tag` *html* | {ko} → {vi}　{label} | 1 | 457 | `ruleTags()` (cards and reading sheet); `{ko}` is a `span.ko` |
| `rules.exception` | 例外 | 1 | 457 | used as `{label}` when the syllable breaks the rule |
| `rules.heading` *html* | パッチム {kr} は {vi} になる | 1 | 646 | `{kr}` is a `span.ko` |
| `rules.compare` | 日本語では{jp}。中国語では{zh}。 | 1 | 647 | `{jp}`, `{zh}` are rule texts from data |
| `rules.answer_line` *html* | ベトナム語 {vi}　　中国語 {zh} | 1 | 652 | `{vi}`, `{zh}` = reading + speaker button |
| `rules.next` | 次へ | 1 | 652 | followed by the key cap `Enter` |
| `rules.question` | ベトナム語の読みはどれ？ | 1 | 652 | |
| `rules.test_start` | テストする | 1 | 654 | |
| `rules.test_stop` | テストをやめる | 1 | 654 | |
| `rules.show_examples` | このルールの例をすべて見る | 1 | 655 | `<summary>` |
| `rules.col_han` | 漢字 | 1 | 656 | the other four headers use `lang.*` |

### 1.7 Tones

| Key | ja | Count | Lines | Notes |
|---|---|---|---|---|
| `tone.zh_1` … `tone.zh_4` | 1声, 2声, 3声, 4声 | 1 each | 402 | `PY_TONE_NAME` |
| `tone.zh_5` | 軽声 | 2 | 402, 407 | |
| `tone.separator` | ・ | 2 | 413, 415 | the gate checks the hints by splitting on it |

The Vietnamese tone names `sắc huyền hỏi ngã nặng ngang` (lines 403, 408) are linguistic terms, not UI text. They stay in code, unchanged in every language.

### 1.8 Speech (Web Speech API)

| Key | ja | Count | Lines |
|---|---|---|---|
| `speech.unsupported` | このブラウザは読み上げに対応していない。EdgeかChromeで開いてみて。 | 1 | 481 |
| `speech.no_voice` | このPCに{lang}の音声が見つからない。Windowsの「設定 → 時刻と言語 → 言語と地域」で{lang}を追加して音声をインストールするか、Microsoft Edgeで開いてみて。 | 1 | 484 |
| `speech.failed` | 読み上げに失敗した。もう一度押してみて。 | 1 | 489 |
| `speech.play_in` | {lang}で再生 | 2 | 492 (`aria-label` and `title`) |

### 1.9 偽の友達 (false friends)

| Key | ja | Count | Lines | Notes |
|---|---|---|---|---|
| `ff.mode_cards` | フラッシュカード | 1 | 240 | (the list mode is `common.list`) |
| `ff.help` | タップすると本当の意味 | 2 | 251, 706 | static, and set again by `syncFFControls()` |
| `ff.hint` | 実は… | 2 | 714, 732 | tile, card front |
| `ff.reading_paren` | （{r}） | 1 | 690 | `ffLine()` reading in parentheses |
| `ff.empty` | 該当する単語はない | 1 | 727 | |
| `ff.rate_miss` | まだ | 1 | 731 | followed by key cap `1` |
| `ff.rate_ok` | わかった | 1 | 731 | followed by key cap `2` |

### 1.10 読解 (reading)

| Key | ja | Count | Lines | Notes |
|---|---|---|---|---|
| `read.show_annotations` | 読みを表示 | 1 | 260 | checkbox label |
| `read.passage_name` | {lang} {n} | 1 | 347 | `{lang}` = `lang.short_vi` / `lang.short_zh` |
| `read.annotation` | {ja}　{ko} | 1 | 758 | annotation under a word of a Chinese passage |
| `read.checked` | ␣✓ (space + U+2713) | 1 | 751 | appended to a finished passage |
| `read.unknown` | わからない | 1 | 764 | |
| `read.tap_hint` | 下線の単語をタップすると、4つの言語の対応が出る | 1 | 766 | |
| `read.add_card` | カードに追加 | 1 | 768 | |
| `read.added` | カードに追加済み | 1 | 768 | |

### 1.11 字体 (glyphs)

| Key | ja | Count | Lines | Notes |
|---|---|---|---|---|
| `glyph.mode_quiz` | クイズ | 1 | 273 | |
| `glyph.filter_diff` | 3つとも違う | 1 | 277 | |
| `glyph.filter_jz` | 日本＝中国 | 1 | 278 | |
| `glyph.filter_jk` | 日本＝韓国 | 1 | 279 | |
| `glyph.filter_level` | レベル{n} | 7 | 280–286 | n = 1…7 |
| `glyph.filter_wrong` | 間違えた字だけ | 1 | 287 | |
| `glyph.score` | {ok} / {answered} 正解 | 1 | 784 | |
| `glyph.ff_badge` | 偽の友達 | 1 | 787 | `.mini-mark` button |
| `glyph.no_examples` | 例なし | 2 | 789, 790 | |
| `glyph.literary` | 文語 | 1 | 790 | tag |
| `glyph.usage` | 使われ方 | 1 | 793 | `<summary>` |
| `glyph.col_jp` | 日本 | 1 | 815 | column header |
| `glyph.col_kr` | 韓国・繁体 | 1 | 815 | |
| `glyph.col_cn` | 中国・簡体 | 1 | 815 | |
| `glyph.col_reading` | 読み | 1 | 815 | |
| `glyph.empty` | 該当する字はない | 1 | 816 | |

### 1.12 Footer and About

| Key | ja | Count | Lines | Notes |
|---|---|---|---|---|
| `footer.storage_note` | 学習記録はこのブラウザにだけ保存されます。 | 1 | 295 | changes meaning with sync (§6) |
| `footer.about` | このアプリについて | 3 | 296, 297, 297 | button, region `aria-label`, panel heading |
| `footer.reset` | 記録をリセット | 3 | 296, 850, 853 | static, restored after 3 s, restored after reset |
| `footer.reset_confirm` | もう一度押すとリセット | 1 | 850 | armed state |
| `about.intro` | 漢字ブリッジは、日本語と韓国語を知っている人が中国語とベトナム語を学ぶための個人の非営利の学習ツール。 | 1 | 297 | |
| `about.data_label` | データ | 1 | 297 | inside `<b>` |
| `about.data_sources` | ：Unihan（Unicode, Inc.）、KANJIDIC2・JMdict（EDRDG、CC BY-SA 4.0）、CC-CEDICT（MDBG、CC BY-SA 4.0）、Wiktionary（Kaikki/Wiktextract 経由、CC BY-SA 4.0）、FrequencyWords（OpenSubtitles 2018、CC BY-SA 4.0）、libhangul hanja.txt（BSD-3-Clause）、ivankra/hsk30（MIT）、OpenCC（Apache 2.0）。 | 1 | 297 | follows the `<b>` label |
| `about.edrdg` | This app uses the JMdict and KANJIDIC2 dictionary files. These files are the property of the Electronic Dictionary Research and Development Group, and are used in conformance with the Group's licence. | 1 | 297 | **licence wording: identical in every language** (a test enforces it in Stage 2) |
| `about.licence_before` | データは CC BY-SA 4.0、プログラムは MIT ライセンスで公開している。詳しくは | 1 | 297 | text before the link |
| `about.licence_after` | 。 | 1 | 297 | text after the link |
| `about.ai_note` | 例文と一部の意味は AI（Google Gemini）が作ったもので、誤りを含むことがある。 | 1 | 297 | required notice (PROMPT §2) |
| `about.privacy` | データは集めていない。学習の記録はこのブラウザの中だけに保存される。 | 1 | 297 | changes meaning with sync (§6) |

The link inside the About panel (`https://github.com/hanjejeme2023-oss/kanji-bridge`, link text `github.com/hanjejeme2023-oss/kanji-bridge`) is a URL. It stays in the markup and is not translated.

### 1.13 New in Stage 1 (overview placeholder)

| Key | ja (draft, for the owner's review) | Notes |
|---|---|---|
| `overview.open_app` | アプリを開く | link to `/app/` on the placeholder page at `/`; the page title reuses `app.title` |

### 1.14 Totals and what is not UI text

- **Totals:** 114 keys from the app (`tone.zh_1`…`tone.zh_4` count as four keys), used in 159 places. One more key is new (`overview.open_app`), so `ja.json` has 115 keys.
- **Stays in code, not translated:**
  - key caps: `Enter`, `1`–`4`, `V`, `C` (inside `span.key`);
  - symbols and joiners between data values: `→`, `-` before a Vietnamese final, ` / ` and `, ` between readings, `/` in progress counts;
  - the Vietnamese tone names;
  - the developer error `KB_DATA failed to load` (line 306);
  - input-parsing patterns that contain CJK punctuation: `/[,/，／、]/` (lines 397, 798), `/[（）()]/g` (453) and `/^（.*）$/` (690). These are parsing, not display. The Stage 1 "no CJK in code" test allowlists exactly these four regex literals.
- **Content from data, not UI text** (D1, PROMPT §3 rule 4; stays Japanese): the rule `label`, `jp` and `zh` texts; `meaning_ja`, `translation_ja`, `gloss_ja`, `note_ja`, the character notes and the example translations.

## 2. localStorage

`S.get(key, default)` reads `JSON.parse(localStorage[key])` and returns the default on a missing key, on a parse error or when storage throws. `S.set` writes `JSON.stringify(value)` and silently ignores errors (line 302). All keys start with `kb_`.

| Key | Value shape | Default | Read | Written | Cleaned on load |
|---|---|---|---|---|---|
| `kb_mute` | `boolean` | `false` | 465 | mute toggle (467) | no |
| `kb_auto` | `boolean`: auto-play the answer | `true` | 494 | autoplay toggle (496) | no |
| `kb_srs` | `{ [word_id]: { box: 0–5, due: epoch ms } }` | `{}` | 545 | `rate()` (624); reset | entries kept only for known `word_id`s with object values |
| `kb_custom` | `word_id[]` added from 読解 | `[]` | 545 | `#addcard` (772); reset | strings only, known ids, de-duplicated |
| `kb_target` | `"vi" \| "zh" \| "both"` | `"vi"` | 548 | target segment (564) | **no**: an unknown value behaves like `both` with no button highlighted |
| `kb_newtoday` | `{ date: "YYYY-MM-DD" (local), ids: word_id[] }` (cards introduced today, max 20) | today, `[]` | 550 | **every page load** (552), `introduce()` (562); reset | replaced if the date is not today or `ids` is not an array; known ids, de-duplicated |
| `kb_rules` | `{ [rule_id]: han[] }`: characters answered right in the rule quiz | `{}` | 632 | `pickRule()` (666); reset | no |
| `kb_ruletest` | `{ ["<rule_id>:<han>"]: { zh?: 0\|1, vi?: 0\|1 } }` | `{}` | 633 | `saveRuleResult()` (634); reset | `cleanTestResults()` |
| `kb_ex_open` | `boolean`: rule examples `<details>` open | `false` | 655 | `ontoggle` when not in test mode (658) | no |
| `kb_ffcard` | `{ ["<word_id>:<zh\|vi>"]: { miss: int ≥ 0, ok: int ≥ 0 } }` | `{}` | 698 | `rateFFCard()` (736); reset | `cleanFFStats()` |
| `kb_read` | `passage_id[]` | `[]` | 744 | `markPassageRead()` (747); reset | arrays only, known ids |
| `kb_unknown` | `word_id[]` marked "わからない" in 読解 | `[]` | 745, 508 | `markUnknown()` (746), `clearUnknown()` (508; after a fully right card or glyph answer); reset | arrays only, known ids |
| `kb_glyphquiz` | `{ [char_id]: { zh?: 0\|1, vi?: 0\|1 } }` | `{}` | 778 | `saveGlyphResult()` (799); reset | `cleanTestResults()` with known `char_id`s |
| `kb_glyph` | `{}` | — | **never read** | reset only (852) | legacy key from the prototype |

Reset (lines 849–854) needs two clicks within 3 s. It writes empty values to 10 keys: `kb_srs`, `kb_custom`, `kb_newtoday` (today, empty), `kb_rules`, `kb_glyph`, `kb_ruletest`, `kb_glyphquiz`, `kb_unknown`, `kb_read`, `kb_ffcard`. It leaves `kb_mute`, `kb_auto`, `kb_target` and `kb_ex_open` unchanged.

## 3. Views and view states

The app has five views. Each is a `<section id="v-…">`, shown by the nav button with `data-v` and hidden with `.hidden`. The state lives in module-level variables. Only the keys in §2 survive a reload. The start view is always カード.

| Area | States (and the variables that hold them) |
|---|---|
| **Global** | `view` (cards, rules, ff, read, glyph); tab counts; mute on/off; top statistic; toast hidden, shown (7 s) or not yet created (`#toast` is added to `<body>` on first use); About panel closed/open (`aria-expanded`; Esc closes it); reset unarmed/armed (3 s) |
| **カード** | target `vi` / `zh` / `both`; autoplay on/off; **front** (one or two inputs with tone hints; focus in the first input); **back** (`flipped`), where each answer shows *入力なし*, *正解* or the correct reading, plus "あなた：…", the rule tags (vi only), the glyph tag when the forms differ, 0–2 examples, four rate buttons with intervals and the play hints; **done** (今日はここまで); the queue line and progress bar (`doneToday`); `cur`, `guess` |
| **音のルール** | selected rule (6: `k p t n m ng`) with progress `d/total`; quiz unanswered, or answered right or wrong (`quiz.ans`; random options); examples `<details>` closed/open (`kb_ex_open`); **test mode** off/on (`ruleTest`), where each input is empty, judged right (`ok`) or judged wrong (`ng`, showing the reading). Reopening the test empties the inputs but keeps the stored colour |
| **偽の友達** | mode `list` / `cards`. **List**: filter `all` / `zh` / `vi`, each tile closed or open (`ffopen`, single-tile toggle, focus moves to the tile), chunked rendering (first 30 tiles, then idle-time steps), help text. **Cards**: language `zh` / `vi`, round of 20 (`ffround`, a miss returns the word to the end), front or back (`ffflipped`), empty state |
| **読解** | selected passage (80; vi first, then zh, by level); annotations on/off (`#showann`, not stored); selected token (`selTok`) or the tap hint; review list of "わからない" words; the word sheet (four languages, note, rule tags) with *カードに追加* / *カードに追加済み*; ✓ on passages that were read and have no unknown words. Leaving a passage (another passage or another tab) marks it read |
| **字体** | mode `list` / `quiz`; filter `all`, `diff`, `jz`, `jk`, `level-1`…`level-7`, `wrong`; chunked rows; usage `<details>` closed/open per row (the body is filled lazily; it opens automatically after a quiz answer); quiz inputs empty/ok/ng with result text; score line; empty state; the 偽の友達 badge jumps to the false-friend view with that tile open |
| **Keyboard** | Cards: Enter/Space flips; 1–4 rate; V and C play. Rules: 1–3 pick; Enter/Space next. FF cards: Enter/Space flip; 1/2 rate. Table tests: Enter judges, then Enter/Space moves on. Keys are ignored while focus is in a text input, and with Ctrl, Meta or Alt |

kanji-bridge's gate harness (`docs/review_scripts/stage5_gate_harness.js`) and render-equality test (`tests/test_app_render_equality.py`) visit these states in a fixed order. STAGE1_SPEC §6 turns that order into the parity checkpoints.

## 4. External requests

| Request | When | Purpose | Notes |
|---|---|---|---|
| `https://fonts.googleapis.com/css2?family=Noto+Sans…&display=swap` | every page load (line 8), with `<link rel="preconnect">` to the same host (line 7) | web fonts (Noto Sans / JP / KR / SC, Noto Serif JP / KR / SC) | the stylesheet then loads font files from **`https://fonts.gstatic.com`** (no preconnect to it). Google receives the visitor's IP address and user agent. Offline, the app falls back to system fonts and works |
| `data.js` (same origin, relative) | every page load (line 300) | the dataset, 6,626,537 bytes | classic `<script>`, not a fetch |
| Speech voices (`speechSynthesis`) | when the learner plays audio, or with auto-play | text to speech | not a request by the page itself, but `pickVoice()` prefers voices whose names contain `Natural`, `Online` or `Google`. Those are cloud voices: the browser sends the spoken word to Microsoft or Google |
| `https://github.com/hanjejeme2023-oss/kanji-bridge` | only when the learner clicks the About link | navigation (`target="_blank" rel="noopener"`) | not a background request |

There are no other requests: no analytics, no fetch or XHR, no service worker, no cookies, no iframes, no favicon link (the browser asks for `/favicon.ico` by itself).

## 5. How `data.js` is consumed

`data.js` is one line: `window.KB_DATA = {…};`. It is 6,626,537 bytes, SHA-256 `3eb99e245782a1aae7e76144bd656be9648c7b075441b70f2e1a6f7f0eb84af9` (built 2026-11-12). A classic `<script src="data.js">` loads it before the app script. The app throws `KB_DATA failed to load` if it is missing (line 306). Everything is built once at start-up (lines 305–356) into derived maps and arrays. Nothing is fetched later.

| Table | Rows | Shape | Fields the app uses | Built into |
|---|---|---|---|---|
| `meta` | — | `{built, counts}` | **none** | — |
| `chars` | 2,164 | object | `char_id`, `key_char`, `simp`, `jp`, `pinyin_all`, `ja_on_all`, `ko_base_all`, `vi_all` (`;`-separated) | `CHAR_BY_ID` → `GLYPHS` |
| `words` | 12,508 | object | `word_id`, `trad`, `jp`, `simp`, `pinyin`, `pt`, `ja`, `ja_use`, `ko`, `ko_use`, `vi`, `vi_alt`, `false_friend` (`;`-separated langs), `lit`, `syl_aligned`, `note_ja`, `card_eligible`, `level`, `freq_vi` | `adaptWord()` → `WORD_BY_ID` (`{id,h,j,z,p,jr,k,v,va,ff,lit,pt,syl,note}`), `RAW_WORD_BY_ID`; `WORDS` = the card deck (`card_eligible` and ≥ 2 characters, sorted by level, then `freq_vi`, then id) |
| `word_chars` | 9,170 | object | `word_id`, `ko_syllable`, `vi_syllable` | `WC_BY_WORD` → the rule tags |
| `ff_meanings` | 4,044 | object | `word_id`, `lang`, `is_trap`, `reading`, `reading_display`, `meaning_ja` | `FF` (1,242 entries, rows ordered ja, ko, zh, vi) |
| `passages` | 80 | object | `passage_id`, `lang`, `level`, `translation_ja`, `tokens[]` (`{t, word_id}` / `{t, gloss_ja}` / `{t, punct}`) | `PASSAGES` (vi first, then zh, by level and id; names 越 n / 中 n) |
| `rules` | 6 | object | `id`, `jong`, `kr`, `vi[]`, `label`, `jp`, `zh`, `ex[[han, ko, ja, vi, zh]]` (8 each) | `RULES` |
| `examples` | 10,367 | array | `[word_id, lang, use, sentence, pinyin, translation, start, len]` | `EXAMPLES` keyed `word_id:lang:use` (`use` = `card` or `ff`) |
| `char_notes` | 581 | array | `[char_id, note]` | `CHAR_NOTES` |
| `glyphs` | 2,164 | array | `[char_id, word_ids[], level, zh_targets[], vi_targets[]]` | `GLYPHS` rows `[jp, trad, simp, pinyin, ja_on, ko, vi, char_id, word_ids, level, zh_targets, vi_targets]` |
| `usage` | 2,164 | array | `[char_id, [[word_id, pos, pinyin]…], [[word_id, pos]…]]` | `USAGE` |

The data is read-only. The app never writes to `KB_DATA`.

## 6. Findings for later stages (not Stage 1 work)

1. **PROMPT §6 kinds vs the real keys.** The kinds list has no clear home for `kb_custom` (the learner's added cards: this is progress, not a setting), `kb_target`, `kb_auto` or `kb_ex_open`. `kb_rules` (quiz progress) and `kb_ruletest` (table test) are two different things. `kb_glyph` is never read. Stage 3 should map every key in §2 explicitly.
2. **No per-item timestamps today.** The values in §2 carry no `updated_at`, so the merge in PROMPT §7 needs a local change record. `kb_newtoday` is rewritten on every page load, and that must not count as a change. `kb_srs.due` is the device's clock time.
3. **Privacy wording.** `footer.storage_note` and `about.privacy` say progress stays only in this browser. That stops being true for signed-in users in Stage 3, so the wording needs an owner decision then.
4. **Third parties for the privacy policy and CSP** (Stage 4): Google Fonts (fonts.googleapis.com, fonts.gstatic.com) and cloud speech voices. Self-hosting the same fonts would remove one third party with no visible change. That is a candidate decision.
5. **CSP**: the markup has `style="…"` attributes (lines 223, 644, 652, 654, 768, 771 and others), and JS sets `.style`. A strict `style-src` needs a decision in Stage 4.
6. **Translation notes for Stage 2.** `speech.no_voice` names Windows menu items. ko and en need the real Windows menu names. `about.licence_before/after` splits a sentence around a link, so check the word order in ko and en. `tone.separator` and the `　` gaps are Japanese typography.
7. **Behaviour quirks to keep in Stage 1** (no visible change without a decision): an unknown `kb_target` acts as `both`; `kb_newtoday` is written on every load; reset leaves the settings keys alone.
