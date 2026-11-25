# Stage 1 specification: Foundation (assignment for Codex)

Claude (architect), Stage 0, 2026-11-24. Read `PROMPT.md` and `docs/HANDOFF.md` first, then this file and `docs/STAGE1_INVENTORY.md`.

**Goal (PROMPT §5, Stage 1):** a Vite project in which kanji-bridge app v2 runs at `/app/`, split into ES modules, with every UI string in `src/i18n/ja.json`, and with **no visible or behavioural change**. The data is imported from kanji-bridge by a checked script, and CI runs the tests. The proof is a browser parity suite showing that the new app's DOM equals the original app's DOM in every view state of the kanji-bridge gate harness.

**Not in Stage 1:** the logo link to `/` (Stage 2, D11), en/ko text, a language switch, the overview content, sign-in, sync, `_headers`/CSP, and every other visible change (D12). If something looks like a bug in app v2, **keep it**, write it under "Open notes" in HANDOFF and move on.

**Baseline** ("the original", "app v2"): kanji-bridge `app/index.html` at commit `59156e119bb4ec1652ac573e9cf821c0d064e9dc`, SHA-256 `904be17b2e4bf1f502cfcacbf1a88d6eda1e214edfbae7cf3ba8e1da710a7cac`, served together with `data.js` from the same commit.

Proposals P1–P7 in `docs/DECISIONS.md` apply. In short: http only (P1), data in `public/app/` (P2), Vitest + Playwright (P3), a build-time i18n fill (P6), Node 24.19.0 (P7).

## 1. Environment (checked on this PC, 2026-11-24)

| Tool | Found | Needed |
|---|---|---|
| Node.js | **v24.19.0** (`C:\Program Files\nodejs\node.exe`) | 24.19.0 (`.nvmrc`) |
| npm | **11.17.0** | comes with Node |
| Git | 2.56.0.windows.4, `core.autocrlf=true` (hence `.gitattributes`) | — |
| Chrome / Edge | both installed | not required: Playwright brings its own Chromium |
| Python | 3.12 | not used in this repository |

Nothing has to be installed on this PC before Stage 1. Codex's first network steps are `npm install` of the dev dependencies and `npx playwright install chromium`, which downloads about 150 MB once into `%LOCALAPPDATA%\ms-playwright`.

## 2. Project layout

```
.nvmrc                         24.19.0
package.json, package-lock.json
vite.config.js                 multi-page build; i18n HTML plugin; build.cssMinify=false
vitest.config.js               (or a `test` block in vite.config.js)
playwright.config.js
index.html                     overview placeholder, served at /
app/index.html                 the app page, served at /app/
public/app/                    imported data and notices (scripts/import_data); served at /app/…
  data.js  NOTICE.md  LICENSE-DATA  licenses/*  DATA-MANIFEST.json  DATA-LICENSE.md (Stage 0)
src/i18n/ja.json               every UI string (STAGE1_INVENTORY §1)
src/i18n/index.js              t(), tHtml(), locale metadata
src/app/…                      the app modules (§3)
src/overview/main.js           (optional; the placeholder needs no JS)
vite/i18n-html.js              the build-time HTML plugin (§4.3)
scripts/import_data.mjs        the data import and check (§5)
tests/unit/*.test.js           Vitest
tests/browser/*.spec.js        Playwright (§6)
tests/browser/lib/*.js         shared helpers (servers, snapshot, scenario runner)
tests/baseline/                read-only copy of kanji-bridge files (§5), never edited
.github/workflows/ci.yml
```

### 2.1 Vite

- `vite.config.js`:
  - `appType: 'mpa'`;
  - `build.rollupOptions.input = { overview: 'index.html', app: 'app/index.html' }`;
  - `base: '/'`;
  - `build.outDir: 'dist'`;
  - `build.sourcemap: false`;
  - **`build.cssMinify: false`**, so the CSS stays byte-for-byte the original `<style>` text and the parity check of the CSS rules (§6.4) has nothing to normalise;
  - the plugin from §4.3.
- Exact-pinned dev dependencies (`vite`, `vitest`, `@playwright/test`; nothing else without a reason in the pull request). Use the current stable versions at implementation time and commit `package-lock.json`. There are **no runtime dependencies**.
- `/` → `dist/index.html`, the overview placeholder:
  - `<html lang="ja">`, `<meta charset>`, the viewport meta, `<title>` = `app.title`;
  - one `<main>` holding an `<h1>` with `app.title` and one link `<a href="/app/">` with `overview.open_app`;
  - a few lines of inline-free CSS in the same visual style (the app's `--paper`, `--ink`, `--indigo` and `--sans` tokens), no web fonts.
  - Nothing else. Stage 2 builds the real page.
- `/app/` → `dist/app/index.html`. It keeps `<script src="data.js"></script>` as a classic script at the end of `<body>`, exactly where it is today, and adds `<script type="module" src="/src/app/main.js"></script>` (Vite moves the built tag into `<head>`). Module scripts are deferred, so `data.js` has run before `main.js` starts.
- `npm run dev` must also work. `public/app/data.js` is served at `/app/data.js` in dev and in the build.

### 2.2 npm scripts

| Script | Command | Notes |
|---|---|---|
| `dev` | `vite` | |
| `build` | `vite build` | |
| `preview` | `vite preview --host 127.0.0.1 --port 4173 --strictPort` | serves `dist/` |
| `import:data` | `node scripts/import_data.mjs --source ../kanji-bridge` | §5 |
| `check:data` | `node scripts/import_data.mjs --check` | no kanji-bridge needed |
| `test:unit` | `vitest run` | |
| `test:browser` | `playwright test` | expects a finished `dist/`; Playwright starts and stops the servers |
| `test` | `npm run check:data && npm run test:unit && npm run build && npm run test:browser` | runs one step after another: the build never runs while a browser is open (PROMPT §1) |

## 3. Module split

The app code moves from the inline `<script>` (lines 301–857) into `src/app/`. The CSS (lines 9–196) moves **verbatim** into `src/app/styles.css`, imported by `main.js`. The `<body>` markup of `app/index.html` stays byte-identical to the original, except that every UI string is replaced by a `{{key}}` placeholder (§4.3).

```
src/app/main.js            imports styles.css; reads window.KB_DATA; calls the init functions in the original order (§3.2)
src/app/storage.js         S (get/set with try/catch, unchanged)
src/app/dom.js             $, $$, esc
src/app/state.js           export const state = { view, srs, custom, target, newToday, cur, flipped, guess, doneToday,
                           ruleSel, rprog, quiz, ruleTest, ruleResults, ffmode, fff, fflang, ffopen, ffstats, ffround,
                           ffflipped, pid, selTok, readIds, gmode, gfil, gresults, glyphOpened, mute, autoplay, armed }
src/app/data/model.js      export function buildModel(kb): WORD_BY_ID, RAW_WORD_BY_ID, WC_BY_WORD, WORDS, EXAMPLES, RULES,
                           NONE_RULE, FF, FF_BY_ID, PASSAGES, CHAR_BY_ID, CHAR_NOTES, USAGE, GLYPHS, ALL_WORD_IDS, ...
                           (pure: no DOM, no storage; importable in Node for unit tests)
src/app/lib/text.js        splitVals, strip, norm, shuffle
src/app/lib/judge.js       telexSyllable, pyKey, viKey, judge
src/app/lib/tone.js        markedTone, toneHint (tone names via t())
src/app/lib/results.js     resultValue, cleanTestResults, cleanFFStats
src/app/lib/ff.js          orderedFFPool, newFFRoundIds, appendFFMiss, ffExampleRow, passageChecked
src/app/ui/tableTest.js    beginTableTest, tableTestCell, focusNextTest, answerTableCell, bindTableTests
src/app/ui/ruleTags.js     viFinal, ruleTags
src/app/ui/speech.js       TTS, loadVoices, pickVoice, speak, stopSpeech, spk, the capture click listener
src/app/ui/toast.js        toast
src/app/ui/chunks.js       CHUNKS, cancelChunks, appendChunk, chunkStep, renderChunked, flushChunks, ensureChunk
src/app/views/cards.js     due, deck, introduce, renderCards, doFlip, rate, nextBox, ivLabel, cardExamples, ...
src/app/views/rules.js     renderRules, pickRule, newQuiz, saveRuleResult
src/app/views/ff.js        renderFF, renderFFList, renderFFCard, rateFFCard, toggleFFTile, showFFWord, ...
src/app/views/read.js      renderRead, markUnknown, clearUnknown, markPassageRead, unknownIds
src/app/views/glyph.js     renderGlyph, filteredGlyphs, usageBody, saveGlyphResult, ...
src/app/nav.js             nav buttons, render(), updateCounts(), topStat(), switchView()
src/app/keyboard.js        the document keydown handler
src/app/footer.js          About panel (and its Esc handler), reset
```

The names are a guide. Codex may merge small modules, but the rules below are binding.

### 3.1 Rules for the split

1. **Behaviour stays exactly the same.** Code moves mechanically: rename `x` to `state.x` for shared mutable state, change constants to imports, and route strings through `t()`. Logic, conditions, the order of operations, timing values (60000, 3600000, 3 s, 7 s, 30 rows, 50 ms, 20–500 rows), `Math.random` call order, and localStorage reads and writes (keys, values, **and when they happen**, including `kb_newtoday` written on every load) are not changed.
2. **No side effects when a module is evaluated.** Modules define constants and functions only. All DOM lookups, event bindings and storage reads happen inside `init…()` functions that `main.js` calls. The one exception is `buildModel(window.KB_DATA)`, which `main.js` calls first. If `KB_DATA` is missing it throws `KB_DATA failed to load`, as today.
3. Circular imports between `nav.js` and the views are allowed only between function declarations that run after initialisation. Never read an imported binding at module top level.
4. Shared mutable state lives in `state.js`. Views do not keep their own `let` variables for anything another module reads or resets. `reset` in `footer.js` sets the same fields to the same values in the same order as lines 851–853.
5. No globals: nothing is attached to `window`. The production build has **no test hooks** (the tests observe the DOM and localStorage, §6).
6. Strict mode (ES modules) must not change behaviour. Fix any implicit global by declaring it, and report it in HANDOFF.

### 3.2 Initialisation order (must match the original)

1. `S`;
2. `buildModel`;
3. mute: read `kb_mute`, bind, `syncMute()`;
4. `loadVoices` and the `voiceschanged` listener;
5. the **capture** click listener for `.spk` (document, capture phase);
6. autoplay: read `kb_auto`, bind, sync;
7. nav buttons;
8. the cards state: `kb_srs`, `kb_custom`, `kb_target`, then `kb_newtoday` is cleaned and **written**;
9. target buttons;
10. the rules state (`kb_rules`, `kb_ruletest`);
11. the ff state and its button bindings;
12. the reading state (`kb_read`) and `#showann`;
13. the glyph state (`kb_glyphquiz`) and its button bindings;
14. the **keyboard** keydown listener;
15. the About click handler and **then** the Esc keydown listener;
16. reset;
17. `render()`.

The two document `keydown` listeners must be registered in this order, keyboard before Esc.

## 4. i18n

### 4.1 `src/i18n/ja.json`

- A flat object, `"key": "value"`, with **exactly** the keys and Japanese values of STAGE1_INVENTORY §1. That is 115 keys, including `overview.open_app`. Values are copied from `index.html` character for character (`　` U+3000, `…` U+2026, `＝` U+FF1D, `✓` U+2713 and the full-width parentheses are kept).
- Placeholders are `{name}` (ASCII letters and `_`). There is no markup in any value.
- Keys are grouped in the order of the inventory. A unit test keeps the file valid, free of duplicate keys and free of unused keys (§6.6).

### 4.2 `src/i18n/index.js`

```js
import ja from './ja.json';
const MESSAGES = { ja };
const META = { ja: { htmlLang: 'ja', numberLocale: 'ja-JP' } };
let locale = 'ja';                       // Stage 2 adds en (default) and ko, and the user's choice
export const getLocale = () => locale;
export const localeMeta = () => META[locale];
export function t(key, params) { ... }   // value with {name} replaced by String(params[name]); plain text, NOT escaped
export function tHtml(key, slots) { ... } // esc(value), then each {name} replaced by slots[name] (trusted markup built by code)
```

- If a key is missing, `t` returns the key itself and calls `console.error('i18n: missing key', key)` once per key. The parity suite's zero-console-errors rule and the unit test (§6.6) make sure this never happens.
- **Escaping rule:** wherever the original inserted a literal string into HTML, the new code inserts `esc(t(key, …))`. `esc()` leaves the Japanese values unchanged, so the DOM stays the same, and en/ko values are safe in Stage 2. Values inserted with `textContent` (toast, `#topstat`, `#queueinfo`, reset button, `#ffhelp`, test results, glyph score) use `t()` directly.
- `tHtml` is used only for the keys marked *html* in the inventory (`cards.glyph_tag`, `rules.tag`, `rules.heading`, `rules.answer_line`). The slot markup is built in code exactly as today, with `esc()` on the data values.
- Data values that are passed in as parameters (readings, rule texts) are escaped by the caller exactly where the original escaped them, and left unescaped where the original left them unescaped. Byte-identical output wins over tidiness in Stage 1.
- `updateCounts()` uses `localeMeta().numberLocale` in place of the literal `'ja-JP'`.

### 4.3 Static HTML: the build-time fill (P6)

`vite/i18n-html.js` is a plugin with `transformIndexHtml: { order: 'pre', handler }`, used in dev and build, for both HTML pages:

- `{{key}}` → `esc(ja[key])`;
- `{{key|name=value}}` → the same, with the literal parameter (needed only for `glyph.filter_level|n=1` … `n=7`);
- an unknown key, or any `{{` left over, **fails the build** with the key named.

The body of `app/index.html` is the original body (lines 198–299) with the strings replaced by placeholders. For example: `<button data-v="cards" class="on">{{nav.cards}} <span class="tabcount" id="count-cards"></span></button>`, `<span class="han">{{header.logo_mark}}</span> {{header.logo_text}}`, and in the About panel `<p><b>{{about.data_label}}</b>{{about.data_sources}}</p>` and `<p>{{about.licence_before}}<a href="https://github.com/hanjejeme2023-oss/kanji-bridge" target="_blank" rel="noopener">github.com/hanjejeme2023-oss/kanji-bridge</a>{{about.licence_after}}</p>`. Attributes use the same syntax (`aria-label="{{footer.about}}"`). After the build, `dist/app/index.html` must contain the same body text as the original.

## 5. `scripts/import_data.mjs`

Node only (built-in modules: `node:child_process`, `node:crypto`, `node:fs`, `node:path`). It reads git objects, never the working tree of kanji-bridge, and never modifies kanji-bridge.

**Pinned in the script** (a change is a reviewed commit that also updates the manifest):

```js
const SOURCE_REPO = 'https://github.com/hanjejeme2023-oss/kanji-bridge';   // recorded only; never fetched
const SOURCE_COMMIT = '59156e119bb4ec1652ac573e9cf821c0d064e9dc';
const DATA_JS_SHA256 = '3eb99e245782a1aae7e76144bd656be9648c7b075441b70f2e1a6f7f0eb84af9';
```

**Files** (source path at the commit → target in this repository):

| Group | Source | Target |
|---|---|---|
| data | `app/data.js` | `public/app/data.js` |
| data | `NOTICE.md` | `public/app/NOTICE.md` |
| data | `LICENSE-DATA` | `public/app/LICENSE-DATA` |
| data | every file in `licenses/` except `.gitkeep` (11 files) | `public/app/licenses/<same name>` |
| baseline | `app/index.html` | `tests/baseline/app/index.html` |
| baseline | `docs/review_scripts/stage5_gate_harness.js` | `tests/baseline/stage5_gate_harness.js` |
| baseline | `LICENSE` (MIT, applies to the two code files above) | `tests/baseline/LICENSE` |

**Import mode** (`--source <path to a local kanji-bridge clone>`):

1. Check that `git -C <source> cat-file -e <SOURCE_COMMIT>^{commit}` succeeds. Otherwise stop: "commit not found; fetch kanji-bridge first".
2. List `licenses/` with `git -C <source> ls-tree --name-only <SOURCE_COMMIT> licenses/`.
3. Read every file as raw bytes with `git -C <source> cat-file blob <SOURCE_COMMIT>:<path>` (`encoding: 'buffer'`, a large `maxBuffer`). No line-ending conversion.
4. Compute SHA-256 for every file. **If `app/data.js` ≠ `DATA_JS_SHA256`, stop with a non-zero exit and write nothing.**
5. Write all targets byte-exact. Remove files in `public/app/licenses/` that are not in the new list. Never touch `DATA-LICENSE.md`.
6. Write `public/app/DATA-MANIFEST.json`, LF line endings, 2-space indent, stable key order, no timestamp (a re-run must give identical bytes):

```json
{
  "source": { "repository": "https://github.com/hanjejeme2023-oss/kanji-bridge", "commit": "59156e119bb4ec1652ac573e9cf821c0d064e9dc" },
  "files": [
    { "group": "data", "source": "app/data.js", "target": "public/app/data.js", "bytes": 6626537, "sha256": "3eb99e24…" }
  ]
}
```

Files are listed in the table order, with `licenses/` sorted by name.

**Check mode** (`--check`, used by CI; needs no kanji-bridge):

1. Every manifest entry exists with its exact byte count and SHA-256.
2. The `data.js` entry equals `DATA_JS_SHA256`, and the manifest commit equals `SOURCE_COMMIT`.
3. No extra file exists in `public/app/licenses/` or `tests/baseline/` (apart from `tests/baseline/README.md` if Codex adds one).
4. Exit 0 or 1, with one line per problem.

**Expected hashes**, measured by Claude in Stage 0 from the commit. The gate compares the manifest with these:

| Source | SHA-256 |
|---|---|
| `app/data.js` (6,626,537 bytes) | `3eb99e245782a1aae7e76144bd656be9648c7b075441b70f2e1a6f7f0eb84af9` |
| `app/index.html` (65,711 bytes) | `904be17b2e4bf1f502cfcacbf1a88d6eda1e214edfbae7cf3ba8e1da710a7cac` |
| `NOTICE.md` | `1cf48bc2b142405e6866d7d9ee5da89be2682126888ead93094f409fbe314317` |
| `LICENSE-DATA` | `14465010292a460c3f98408137178b642b6a8af609023353484bf5d8b6c8f6b9` |
| `licenses/CC-BY-SA-4.0.txt` | `28a9529c7d0bb4dc51f4bf5c116a3d16ef247a052f7591466768ddf563fd1cf5` |
| `licenses/CC-CEDICT-LICENSE.html` | `b1803a051f89f001999f8b5c66194b0fe41d9c85fdc3f0020fde92d3f6852d87` |
| `licenses/FREQUENCYWORDS-CONTENT-LICENSE.md` | `a92fcc50e27f7b2d5860ec1c1ce794dc4c892d945bfa4c8c3136cdfd213ee710` |
| `licenses/HSK30-MIT-LICENSE.txt` | `9cd70c000ea23c899e71b2cbe7c28e18c60937f6e74d1b344d2923f6bddae44a` |
| `licenses/JMDICT-EDRDG-LICENSE.html` | `52f60ea9ca68170a2f0663d7dba381ebf1bd57c17a3347dfe21153865c156692` |
| `licenses/KAIKKI-ENWIKTIONARY-LICENSE.html` | `cf9de3055d71ac51596e43a998724fc8ee192177fc7720f7227b02205e4b9e67` |
| `licenses/KAIKKI-VIWIKTIONARY-LICENSE.html` | `693a4610c12bba9641e86e0131066433e73e3c2d4e91d79521cab3ef840f2bc7` |
| `licenses/KANJIDIC2-EDRDG-LICENSE.html` | `52f60ea9ca68170a2f0663d7dba381ebf1bd57c17a3347dfe21153865c156692` (same text as JMdict's) |
| `licenses/LIBHANGUL-HANJA-BSD-3-CLAUSE.txt` | `d51680a63b4f9200fae1efd41f7fa3301180a80bcbb19814464c1cc504af6c2b` |
| `licenses/OPENCC-APACHE-2.0-LICENSE.txt` | `b534e465949558eec2597b04f5092b5e161236a68dfbfd04d547592ac3964308` |
| `licenses/UNICODE-LICENSE.txt` | `e7a93b009565cfce55919a381437ac4db883e9da2126fa28b91d12732bc53d96` |

The two baseline harness and licence files are not listed here. The gate recomputes them from the commit.

The imported files are **committed** (`.gitattributes` keeps them byte-exact). Builds, CI and Cloudflare never need kanji-bridge or the network for data.

## 6. Tests

### 6.1 Tool choice: Playwright Test and Vitest (P3)

| | Playwright Test (chosen) | Port of the Python CDP harness |
|---|---|---|
| Toolchain | Node only, the same as the build | adds Python and `websockets` to CI and the PC |
| Windows and GitHub Actions | first-class on both; `npx playwright install --with-deps chromium` in CI | hand-written browser discovery for Chrome/Edge paths; Linux paths are missing |
| Servers | `webServer` starts `vite preview` and the baseline server, and stops both | hand-written `http.server` |
| Determinism | `page.clock.setFixedTime`, `addInitScript` (seeded `Math.random`, speech stub), `timezoneId`, `reducedMotion` | would need re-implementing |
| Offline | `context.route` aborts every non-local host | `--host-resolver-rules` |
| Evidence | screenshots, traces and an HTML report as CI artifacts | screenshots only |
| Process cleanup | the browser and servers are closed by the runner, even on failure | own `taskkill` code |

Unit tests use **Vitest**, which shares Vite's config and module resolution.

### 6.2 How the parity suite works

The suite runs two pages side by side in the **same** Playwright Chromium, each in its own fresh browser context:

- **baseline**: `http://127.0.0.1:4174/` serves `tests/baseline/app/index.html` as `/index.html` and `public/app/data.js` as `/data.js`. A tiny static server, `tests/browser/lib/serve-baseline.mjs` (node:http, about 40 lines), started by Playwright `webServer`.
- **new**: `http://127.0.0.1:4173/app/`, which is `vite preview` of the **production build** in `dist/`.

Both contexts get identical settings:

- viewport 1280×800 (and the mobile scenario 390×844);
- `deviceScaleFactor: 1`, `locale: 'ja-JP'`, `timezoneId: 'Asia/Tokyo'`, `reducedMotion: 'reduce'`;
- `page.clock.setFixedTime('2026-11-24T10:00:00+09:00')`, set before navigation;
- an `addInitScript` that:
  - replaces `Math.random` with a seeded PRNG (mulberry32, seed 20261124);
  - replaces `speechSynthesis` and `SpeechSynthesisUtterance` with a stub that reports two voices, `{name:'Test zh', lang:'zh-CN'}` and `{name:'Test vi', lang:'vi-VN'}`, records every `speak(u)` as `[u.text, u.lang, u.rate]` in `window.__speech`, and fires `onend` synchronously;
- a `context.route('**/*')` that **aborts** every request whose host is not `127.0.0.1`. That covers the Google Fonts hosts, so both apps run offline like the kanji-bridge harness. Every aborted URL is recorded.

A **scenario** is a list of steps. Each step is an action plus, usually, a named **checkpoint**. The runner (`tests/browser/lib/parity.js`) does each action on the baseline page first and then on the new page, and waits until both are **quiet**: no DOM mutation for 300 ms, with a 60 s limit. That lets the chunked lists finish on their own. Then it takes a snapshot of both and compares them.

Actions use real Playwright input (`click`, `fill`, `press`, `focus`, `blur`) on the **same selectors** in both pages. Some values that the kanji-bridge harness read from app internals (the current card's answer, a rule's example, the ids of 包子, 還 and 行, the `GLYPHS[n]` ids) are read from the **baseline page only** with `page.evaluate` (for example `cur.v`, `FF.find(f=>f.w==='包子').id`), because the original app's top-level variables are global. The same value is then typed or clicked in both pages. The new app is never asked for internals.

### 6.3 Snapshot: what must be equal

Taken in each page with `page.evaluate`:

1. **body markup**: `document.body` cloned. Remove every `<script>` element. Then remove the whitespace-only text nodes that are direct children of `<body>` and come after `<footer>`. Take `innerHTML`. **These two removals are the only normalisations allowed.** Any other difference fails.
2. `document.title` and `document.documentElement.lang`.
3. **head metadata**: the `outerHTML` of every `meta`, `title` and `link[rel=preconnect]` element and of the Google Fonts stylesheet `link`, in order. (Vite's own `script`/`link` tags are excluded.)
4. **form state**: for every `input`, `[selector path, value, checked]`, because typed values are properties and do not appear in `innerHTML`.
5. **focus**: a selector path of `document.activeElement`, made of tag, id, classes and child index up from `<body>`.
6. `[scrollX, scrollY]`.
7. **storage**: every localStorage entry as `[key, raw string]`, sorted by key.
8. **speech log**: `window.__speech`.
9. **screenshot**: a viewport PNG (`page.screenshot({ animations: 'disabled', caret: 'hide' })`). Both PNGs must be **byte-identical**. If they are not, save both and a diff image as test attachments.
10. At checkpoints marked **S** in §6.5 only: **computed styles**. Compare `getComputedStyle` (all properties) for every element in `<header>` and `<footer>` and the first 400 elements of `<main>`, matched by position.

Once per page load, the suite also checks the **CSS rules**: the `cssText` of every rule in the same-origin style sheets, in order. The baseline's inline `<style>` must equal the new app's built CSS file.

On a failure, the test names the checkpoint and the first differing field, and shows about 200 characters of context around the first differing character of the markup.

### 6.4 Errors and requests (every scenario, new app)

- `page.on('pageerror')`: must be 0.
- `console` messages of type `error`: must be 0. The one exception is the Chromium "Failed to load resource" message whose URL is an **aborted** request to `fonts.googleapis.com` or `fonts.gstatic.com`. Those are recorded separately, as in kanji-bridge's `network_failures`.
- **Requests**: every request is either to the preview origin, or to one of the two font hosts (aborted). Anything else fails. That proves Stage 1 adds no external request.
- Rendered "bad text": after every checkpoint, the `innerText` of `<main>` + `<header>` must not match `/undefined|NaN|\bnull\b|\[object/` (the harness's `badText`).
- The baseline page gets the same error and request checks. If the baseline itself errors in a scenario, that scenario's setup is wrong. Fix the scenario rather than accept the error.

### 6.5 Scenarios and checkpoints (`tests/browser/parity.spec.js`)

The scenarios port, in order, every state that `stage5_gate_harness.js` and `test_app_render_equality.py` visit, plus a few states the harness reached by writing to internals (here they come from seeded localStorage instead). Codex may add checkpoints but not remove any. **S** = also compare computed styles.

**P1: the gate walk** (fresh storage, 1280×800; follows the harness section by section)

| CP | Action | Harness origin |
|---|---|---|
| P1-01 **S** | load `/app/` (cards view) | counts, explain, `cards-initial` |
| P1-02 | type into `#gvi` the baseline's `cur.v` with the tone marks stripped exactly as the harness does (NFD, remove U+0323 U+0301 U+0300 U+0309 U+0303, NFC), then press Enter | `card tone-stripped right` |
| P1-03 | press `3` | `card rated` |
| P1-04 | type `zzz` into `#gvi`, Enter | `card wrong shows answer` |
| P1-05 | press `1`; blur the active element; press Space | `space flips card` |
| P1-06 | press `2`; click target `both` | `card_both_hints` |
| P1-07 | click target `vi` | |
| P1-08 **S** | nav `rules` | `rules` |
| P1-09 | click `#ruletest` | `rule test inputs` |
| P1-10 | the first test input: fill with the shown rule's `ex[0][3]` (from the baseline), then blur | `rule vi right` |
| P1-11 | the second input: fill `qqq`, Enter | `enter judges`, `rule zh wrong shows answer` |
| P1-12 | the third input: type `ab`, then press Space | `space types in unjudged input` |
| P1-13 | click `#ruletest` twice | `reopen empties but keeps colour` |
| P1-14 | click `#ruletest`; press `1`; press Enter | rule quiz answered, then next (seeded random) |
| P1-15 | click each of the 6 rule buttons in turn (one checkpoint each) | every rule |
| P1-16 | toggle the examples `<details>` open, then closed | `kb_ex_open` |
| P1-17 **S** | nav `ff` (list settles) | `ff`, tile count 1,242 |
| P1-18 | click the 包子 tile | `paozi examples 2` |
| P1-19 | filter `vi` | `ff_vi_tiles` |
| P1-20 | filter `all` | |
| P1-21 **S** | mode `cards` | `ffcards-front`, `20 per round` |
| P1-22 | Enter | `enter flips ff` |
| P1-23 | press `1` | `miss returns to end` |
| P1-24 | Space, then `2` | `queue shrinks on ok` |
| P1-25 | language `vi` | `ffround_vi_len` |
| P1-26 | Enter | `ffcards-vi` |
| P1-27 | mode `list` | |
| P1-28 **S** | nav `read` | `no check on first display` |
| P1-29 | click the first `.tok.sino .s` | `kb_unknown has mark`, `review list` |
| P1-30 | click `#addcard` | (not in the harness: add to cards) |
| P1-31 | click passage 2 | `kb_read has p0`, `marked passage no check` |
| P1-32 | click passage 3 | `left unmarked passage has check` |
| P1-33 | uncheck `#showann`, then check it again (one checkpoint each) | annotations |
| P1-34 | click the first review pill | review selection |
| P1-35 **S** | nav `glyph` (settles) | `tab switch marks read`, `glyph_rows` |
| P1-36 | mode `quiz` (settles) | `glyph_quiz_inputs` |
| P1-37 | 還 zh input: fill `hai, huan`, Enter | `還 both readings right`, usage opens |
| P1-38 | 還 vi input: fill `hoan`, blur | `huan_vi_result` |
| P1-39 | 行 zh input: fill `hang, xuan`, blur | `xing_wrong`, score |
| P1-40 | filter `wrong` | `wrong_rows` |
| P1-41…47 | filter `level-1` … `level-7` (one checkpoint each) | `level1`…`level7` |
| P1-48 | filter `all`; mode `list`; mode `quiz` | `glyph reopen empty+ok`, `no input for empty vi list` |
| P1-49 | mode `list`; open the usage `<details>` of the first glyph whose usage has a false-friend word (id from the baseline) | `usage_ff_char` |
| P1-50 | click its 偽の友達 badge | `ff mark opens entry` (view ff, tile open and focused) |
| P1-51 | click `#mute`; then click again (one checkpoint each) | `mute stored` |
| P1-52 | nav `glyph`; filter `diff`; filter `all`; mode `quiz`; mode `list` | chunks complete |
| P1-53 | nav `ff`; click the first tile | `tile toggle opens in place` |
| P1-54 | press Enter on that tile | `tile Enter closes` |
| P1-55 | click `#about` | `about opens` |
| P1-56 | click `#about` | `about link closes` |
| P1-57 | click `#about`; press Escape | `Esc closes about` |
| P1-58 | click `#reset` (snapshot without the screenshot, so that P1-59 comes within the 3 s window) | armed text |
| P1-59 | click `#reset` | everything reset (storage) |

**P2: render-equality cases** (from `test_app_render_equality.py`; 1280×800)

| CP | Seed / action |
|---|---|
| P2-01…04 | fresh: glyph `list`/`quiz` × `all`/`level-3` (settled) |
| P2-05, 06 | seed `kb_glyphquiz` = `{GLYPHS[3]: {zh:0}, GLYPHS[400]: {vi:0}, GLYPHS[2000]: {zh:0}, GLYPHS[10]: {zh:1,vi:1}}` (char ids from the baseline): `wrong` in `list` and in `quiz` (3 rows) |
| P2-07 | seed `kb_glyphquiz` = `{}`: `wrong` (empty state) |
| P2-08 | `jz`, list |
| P2-09 | ff list, all closed (1,242 tiles) |
| P2-10 | open 包子 and the last tile (2 open; the last is focused) |
| P2-11 | close 包子 (1 open) |
| P2-12 | filter `zh` with one tile open |
| P2-13 | filter `vi`, after a fresh load (all closed) |

Also, as in the original test: right after the click that starts each long list (glyph all/list, and ff list), count the rows **in the same `evaluate` as the click**. That count must be ≤ 30 in both pages.

**P3: returning learner** (seeded storage; one checkpoint per step)
Seed every key in STAGE1_INVENTORY §2 with realistic values built from baseline data, by index (never random):

- `kb_srs`: 10 deck words, some due and some not;
- `kb_custom`: 2 words from passage 1;
- `kb_newtoday`: today with 5 ids;
- `kb_target`: `both`, `kb_mute`: `true`, `kb_auto`: `false`, `kb_ex_open`: `true`;
- `kb_rules`, `kb_ruletest`, `kb_ffcard`: a few entries;
- `kb_read`: the first 3 passages;
- `kb_unknown`: one word in passage 2;
- `kb_glyphquiz`: 5 entries.

Checkpoints: the initial view of all five tabs; three card reviews (flip and rate 2, 3, 0); 読解 passage list (✓ marks); 字体 `wrong`; 偽の友達 cards (order by misses).

**P4: corrupt storage.** Seed each key with a wrong type: a string, a number, `null`, an array where an object is expected, an object where an array is expected, and invalid JSON text. Checkpoints: the initial view of all five tabs. Before adding a value, check that the **baseline** shows 0 errors with it. If the baseline throws, leave that value out and record it in HANDOFF "Open notes" (it is a v2 bug, not a Stage 1 task).

**P5: storage unavailable.** An init script makes `localStorage.getItem`/`setItem` throw. Checkpoints: load; flip and rate one card; nav to every tab.

**P6: mobile, 390×844.** The initial view of all five tabs; the card back; the About panel open. All checkpoints **S**.

**P7: speech.** (a) With the stub: flip a card with autoplay on; press `V`; click a speaker button in 読解. The speech logs must be equal. (b) With `speechSynthesis` deleted: click a speaker button, and the toast must be equal. (c) With the stub returning no voices: click a speaker button, and the toast must be equal.

**P8: done for today.** Seed `kb_newtoday` with 20 deck ids, each with a `kb_srs` entry that is due in 7 days. Checkpoint: cards view showing 今日はここまで; the progress bar at 100 %.

### 6.6 Other test files

- `tests/browser/gate.spec.js`: the harness's `must(...)` checks as readable assertions on the **new app alone**, through the DOM and localStorage only. They are listed in the "Harness origin" column above, plus: title is `漢字ブリッジ`; the About panel contains the EDRDG sentence, the repository link and `AI（Google Gemini）`; `kb_rules` stays untouched by the rule test; the first screen of a long list has ≤ 30 rows; and after settling there are 2,164 glyph rows in list and in quiz, the same number of quiz inputs as the baseline, and 1,242 ff tiles. A parity failure says *that* something differs. These checks say *what* broke.
- `tests/browser/baseline-sanity.spec.js`: serves the baseline with `stage5_gate_harness.js` and the error capture injected, exactly as `stage5_gate_run.py` builds `harness.html` (via a route that fulfils `/harness.html`). It asserts that the harness output has no `errors`, `fail`, `bad` or `exception`. This proves the reference passes in this environment (Windows and Linux CI).
- `tests/browser/site.spec.js`: `/` returns the placeholder (title, one link to `/app/`, 0 console errors). `/app/data.js`, `/app/NOTICE.md`, `/app/LICENSE-DATA` and `/app/licenses/CC-BY-SA-4.0.txt` return 200.
- `tests/unit/model.test.js`: loads `public/app/data.js` in `node:vm` with a `window` object, then calls `buildModel`. It checks the counts (2,164 glyphs, 1,242 FF, 80 passages, 6 rules) and the deck size, and runs the harness's **tone** block over the whole deck and every glyph row: `zhBad`, `viBad`, `glyphBad` = 0, and `ptLenMismatch` recorded in the test output. `baseline-sanity` attaches the harness's `checks.tone` object, so that the gate can compare the two.
- `tests/unit/judge.test.js`, `tone.test.js`, `results.test.js`: the pure functions, with the harness's cases (還 `hai, huan`, 行 `hang, xuan`, a tone-stripped vi answer, Telex input) plus edge cases from the code (empty input, `several` separators, `u:`/`v` → `ü`).
- `tests/unit/i18n.test.js`:
  - `ja.json` parses, has 115 keys, and contains no duplicate keys (check the raw text);
  - every `t('…')`, `tHtml('…')` and `{{…}}` key in `src/` and the HTML pages exists in `ja.json`, and every key in `ja.json` is used (scan the source with a regex; keys must be string literals);
  - **no CJK characters** (`[\u3000-\u303f\u3040-\u30ff\u3400-\u9fff\uff00-\uffef]`) in `src/**/*.js` or the two HTML pages, except the four regex literals listed in STAGE1_INVENTORY §1.14;
  - `t` and `tHtml` substitution and escaping.
- `tests/unit/import_data.test.js`: runs the script against a temporary git repository built in the test (`git init`, commit fake files):
  - a matching hash imports byte-exact files and writes the manifest;
  - a wrong `data.js` hash exits non-zero and writes nothing;
  - a second run gives identical bytes;
  - `--check` detects a changed byte, a missing file and an extra licence file.
  
  The pinned constants are overridable for the test through an exported function, not through CLI flags.
- `tests/unit/build.test.js` (runs after `npm run build`, or skips when `dist/` is missing):
  - `dist/app/index.html` contains no `{{`;
  - `dist/app/data.js` has the pinned hash;
  - `dist/app/licenses/` has 11 files;
  - `dist/index.html` exists;
  - no file in `dist/` contains a string that looks like a secret (`service_role`, `sb_secret_`, `-----BEGIN`).

### 6.7 Running the tests

On this PC (PowerShell, repository root):

```
npm ci
npx playwright install chromium        # once
npm run check:data
npm run test:unit
npm run build
npm run test:browser                   # starts vite preview (4173) and the baseline server (4174), then stops them
npx playwright show-report             # after a failure
```

`npm test` runs the same steps in order. `playwright.config.js`:

- `workers: 1`, `fullyParallel: false` (one browser at a time, PROMPT §1);
- `retries: 0`, `timeout: 180_000` per test, `use.trace: 'retain-on-failure'`;
- `projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]`;
- two `webServer` entries (`npm run preview`, then `node tests/browser/lib/serve-baseline.mjs --port 4174`), with `reuseExistingServer: !process.env.CI`.

## 7. CI: `.github/workflows/ci.yml`

```yaml
name: CI
on:
  pull_request:
  push:
    branches: [main]
permissions:
  contents: read
concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true
jobs:
  test:
    name: build-and-test
    runs-on: ubuntu-24.04
    timeout-minutes: 30
    steps:
      - uses: actions/checkout@<full commit SHA>     # vX.Y.Z
      - uses: actions/setup-node@<full commit SHA>   # vX.Y.Z
        with:
          node-version-file: .nvmrc
          cache: npm
      - run: npm ci
      - run: npm run check:data
      - run: npm run test:unit
      - run: npm run build
      - run: npx playwright install --with-deps chromium
      - run: npm run test:browser
        env:
          CI: 'true'
      - if: failure()
        uses: actions/upload-artifact@<full commit SHA> # vX.Y.Z
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 14
```

- Pin every action to a full commit SHA, with the version in a comment. Look the SHAs up on the actions' release pages when writing the file.
- No secrets and no `pull_request_target`.
- The job name `build-and-test` is the status check that branch protection requires (HANDOFF owner step B).
- Optional (Codex decides; say so in HANDOFF): a second job running the unit tests on `windows-latest`. This PC is the Windows check either way.

## 8. Cloudflare Pages build settings

For the owner's steps in HANDOFF. Nothing is set up by an agent.

| Setting | Value |
|---|---|
| Framework preset | None |
| Build command | `npm run build` (Pages runs `npm ci` itself when it sees `package-lock.json`) |
| Build output directory | `dist` |
| Root directory | *(empty: the repository root)* |
| Production branch | `main` |
| Preview deployments | all non-production branches |
| Node version | from `.nvmrc` (`24.19.0`). Also set the environment variable `NODE_VERSION` = `24.19.0` (Production and Preview) |
| Environment variables | none in Stage 1. **Never** a secret (SECURITY §1) |

The output stays inside the Pages limits: the largest file, `data.js`, is 6.6 MB (the limit is 25 MiB), and there are about 20 files. Cloudflare serves `/app/` from `dist/app/index.html` and redirects `/app` to `/app/`, so the relative `data.js` resolves to `/app/data.js`.

## 9. Commits, branch and reporting

- Work on the branch `stage1-foundation`. Commit with the prefix `[Codex] Stage 1:`, in small steps: scaffold, import, split, i18n, tests, CI. Push the branch and open a pull request to `main` (the repository is public; there is still no branch protection, and the owner merges). Do **not** merge.
- Check `git config user.email` before the first commit (D9).
- Write everything in English. Code comments are short and say where a piece came from (for example `// app v2 index.html:563`).
- Update `docs/HANDOFF.md`:
  - status;
  - what was done;
  - the exact test commands and results on this PC (pass/fail counts, the duration of `test:browser`);
  - the CI run URL;
  - open notes (any v2 quirks found);
  - "Next: Claude — Stage 1 gate (part 1A)".
  
  Also add an entry to `docs/CHANGELOG.md`.
- Stop after that.

## 10. Things to watch

- **Whitespace in `<body>`.** The parity check compares markup byte for byte. Copy the original body and change only the strings. Do not let an editor reformat `app/index.html`. (`.gitattributes` keeps LF.)
- `esc()` must stay exactly `/[&<>"]/g`. It does **not** escape `'`, and the original relies on that.
- Template literals spread across lines keep their newlines and indentation in `innerHTML` (for example `renderCards`, `ffTile`, `glyphListRow`). Keep them byte-identical.
- `toLocaleString('ja-JP')` stays `'ja-JP'` through `localeMeta()`.
- The tile toggle replaces one node, and the gate checks node identity for the next tile. Keep the `replaceWith` path.
- `cssMinify: false`. Do not add PostCSS or autoprefixer.
- Do not add a favicon, meta tags, `defer`/`async` on `data.js`, a service worker, or preload hints. Each would be a visible or behavioural change outside Stage 1.

## 11. Done when (the Stage 1 gate checks each item with evidence)

**Part 1A: code (Claude, on this PC and in CI)**

1. `npm ci && npm run build` succeeds on this PC and in GitHub Actions, with no warnings except Vite's notice that the classic `<script src="data.js">` is not bundled.
2. `dist/` contains:
   - `index.html` (the placeholder);
   - `app/index.html`;
   - `app/data.js` with SHA-256 `3eb99e245782a1aae7e76144bd656be9648c7b075441b70f2e1a6f7f0eb84af9`;
   - `app/NOTICE.md`, `app/LICENSE-DATA`, `app/DATA-LICENSE.md`, `app/DATA-MANIFEST.json`;
   - `app/licenses/` with 11 files.
3. `npm run import:data` re-run on this PC against `../kanji-bridge` leaves `git status` clean. `npm run check:data` passes. The manifest's hashes equal §5. The script refuses a wrong hash (unit test).
4. `ja.json` holds the 115 keys of the inventory with today's wording. `i18n.test.js` passes: all keys are used, all are present, and there is no CJK in the code outside the four allowed regexes.
5. **Render parity:** every checkpoint of P1–P8 (§6.5) is equal on snapshot fields 1–9 (§6.3), and on field 10 at the **S** checkpoints, plus the CSS-rules check, in Chromium against `vite preview` of the production build, on this PC **and** in CI. Allowed normalisations: only the two in §6.3 item 1.
6. **0 console errors** and 0 page errors in the new app in every scenario (font-host aborts excepted, §6.4). No request to any host other than the preview origin and the two font hosts. No rendered `undefined`/`NaN`/`null`/`[object`.
7. `gate.spec.js`, `baseline-sanity.spec.js`, `site.spec.js` and all unit tests pass.
8. The CI workflow is green on the Stage 1 pull request. Its actions are pinned by SHA, with `permissions: contents: read` and no secrets.
9. No secret anywhere in the repository or the build output (`build.test.js`, plus Claude's own search at the gate).
10. HANDOFF records the commands, the results and the `test:browser` duration on this PC.

**Part 1B: preview (after the owner's Cloudflare steps in HANDOFF)**

11. The Cloudflare Pages preview URL of the Stage 1 branch (or its pull request) serves `/` (the placeholder) and `/app/`. `/app` redirects to `/app/`. `/app/data.js` returns 200 with the pinned hash.
12. On the preview URL, with the network on (Google Fonts loading): 0 console errors. The five views look like kanji-bridge's published app side by side: Claude compares screenshots of the five initial views and the owner looks at them.
13. The production deployment from `main` (after the owner merges) shows the same, at `https://<project>.pages.dev/app/`.
