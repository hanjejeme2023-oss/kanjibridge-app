# Stage 2 specification: Languages and overview page (assignment for Codex)

Claude (architect), 2026-11-26. Read `PROMPT.md` and `docs/HANDOFF.md` first, then this file, `docs/STAGE2_STRINGS.md`, `docs/STAGE1_SPEC.md` (still valid where this file does not change it) and `docs/STAGE1_INVENTORY.md`.

**Start condition.** Codex starts only after the owner has:
- answered proposals **P8–P13** (`docs/DECISIONS.md` §B);
- approved the wording in `docs/STAGE2_STRINGS.md`.

Both answers are recorded in HANDOFF "Owner answers". This file is written for Claude's recommendation on each proposal. Where an answer changes the work, the section says what changes ("If P… = (b)"). If an answer is missing or unclear, stop and write the question into HANDOFF. Do not guess.

**Start condition: met (2026-11-26).** The owner chose **(a) for every proposal P8–P13**, recorded as **D22–D27** in `docs/DECISIONS.md`. So the "If P… = (b)" branches below do not apply. The owner decided every ★ row of `docs/STAGE2_STRINGS.md`. The remaining rows are approved for implementation as written there. The owner reviews them on the en and ko review screenshots at the Stage 2 gate (§8.4, §11 item 14). Codex may start.

**Baseline** (unchanged from Stage 1): kanji-bridge app v2, `tests/baseline/app/index.html` at `59156e1`. In Japanese, the app must still equal it, except for the approved changes in §8.2.

## 1. Goal and scope

**Goal (PROMPT §5 Stage 2, D1, D11, D12).**
- The app's interface is in **English (the default), Japanese or Korean**.
- A language switch in the header changes the language at once, without a reload, and the choice is remembered.
- A real **overview page** replaces the Stage 1 placeholder.
- The app logo links to the overview.
- A one-line notice says that meanings and examples are in Japanese.
- Adding another UI language later (for example Vietnamese, `vi`) takes **one new file**: `src/i18n/vi.json`. Then regenerate the overview screenshots with one command (§6.6).

**In scope:**
1. Open note 10: split `initApp()` into modules, with no visible change (§3). **This comes first.**
2. The run-time language system (§4): locale files, resolution, storage, the static-text mechanism, re-rendering, `<html lang>`, number format, fonts, and failure handling.
3. App changes (§5): the language switch (P9), the logo link (D11, P10), the content notice (P11), and the CSS these need.
4. The overview pages (§6, P10): what the app is; the five views, each with one line and one screenshot; "Start"; sources, licences and privacy. **No "Sign in"** (Stage 3).
5. en and ko text for every key, and ja for the new keys, from the approved `docs/STAGE2_STRINGS.md` (§7).
6. Tests (§8), including the ja parity suite against app v2 with the declared normalisations.
7. The Open note 12 test nit (§8.2, last item), because Stage 2 changes the tests anyway.

**Out of scope** (each needs its own decision or stage):
- Sign-in, sync, accounts, Supabase (Stage 3).
- CSP, `_headers` and security headers (Stage 4).
- **Connecting the domain** `kanjibridge.app` (D13, D21). Stage 2 does not wait for it. On the day the domain is registered, it is a separate short task: connect it in Cloudflare (owner), change `SITE_ORIGIN` (§6.3) in one commit, and check it.
- Any other change to the look or behaviour of the app (D12). The complete list of allowed visible changes is **P13** (§5.5). Anything not on it is a defect.
- New learning content; translating data (meanings, examples, notes, the rules' `jp`/`zh` texts). D1: content stays Japanese.
- Self-hosting the fonts (Open note 4, Stage 4) and changing the Google Fonts URL. This also means no Korean weight 600 (§4.7).
- Hardening storage parsing (Open notes 7 and 9; Stage 3).
- Changing the About panel's repository link (it still points to `kanji-bridge`, as in v2). The overview links to `kanjibridge-app` (§6.4).
- Marking Japanese content with `lang="ja"` inside an en/ko page, for screen readers. Recorded as a later candidate (§10).

## 2. Order of work and commits

Work on the branch **`stage2-languages`**. It already exists: Claude created it from `main` (`fa4bc35`) for this spec. Pull it before starting. Commit with the prefix `[Codex] Stage 2:`. Push the branch after each step. Codex cannot open pull requests (no GitHub CLI login), so the owner opens the PR when Codex hands over. Never merge, force-push or delete a branch.

| Step | What | Proof before the next step |
|---|---|---|
| **1** | Module split, no visible change (§3). One or more commits titled `[Codex] Stage 2: step 1 …`. | `npm test` passes on the last step-1 commit. **The step-1 commits change no file under `tests/` and nothing in `app/index.html`, `index.html`, `public/` or `vite/`.** The unchanged Stage 1 parity suite is the proof that nothing visible changed. |
| **2** | The i18n core (§4): locale files (en, ja, ko from the approved table), `src/i18n/index.js`, `data-i18n` markers, the build plugin, the start-up order with the `data.js` loader, switching and re-rendering. Plus the parity-helper normalisations (§8.2) and the i18n unit tests. | `npm test` passes. The ja parity suite is green with **only** the normalisations of §8.2. |
| **3** | App changes (§5): switch, logo link, notice, CSS. Plus the i18n browser tests (§8.3). | `npm test` passes. |
| **4** | Overview pages (§6) and their tests; the screenshot script; the committed screenshots. | `npm test` passes. `npm run shots:overview` was run and its images were committed. |
| **5** | Review screenshots (§8.4), HANDOFF and CHANGELOG. | §11 checklist filled in by Codex in HANDOFF. |

Keep each commit buildable. If a step-1 refactor makes a parity checkpoint fail, the refactor is wrong. Fix the code, not the test.

## 3. Step 1: module split (Open note 10)

Today `src/app/main.js` keeps every view, the nav, the keyboard handler, About and reset in one `initApp()` closure (439 lines). A language change must be able to re-render the current view and every piece of text that JavaScript sets. Step 1 makes that possible without changing anything visible.

### 3.1 Target modules

Follow STAGE1_SPEC §3 (the module list) and its binding rules §3.1 (no module-level side effects; shared state in `state.js`; no globals; behaviour, timing, `Math.random` call order and storage reads and writes unchanged). The names below are binding where another section of this spec refers to them.

```
src/app/main.js          bootstrap only (§4.5): no view code
src/app/state.js         export const state = {...}: every `let` that today lives in initApp() and is read or reset
                         by more than one function (view, srs, custom, target, newToday, cur, flipped, guess,
                         doneToday, ruleSel, rprog, quiz, ruleTest, ruleResults, ffmode, fff, fflang, ffopen,
                         ffstats, ffround, ffflipped, pid, selTok, readIds, gmode, gfil, gresults, glyphOpened,
                         mute, autoplay, armed)
src/app/data/instance.js export let model; export function setModel(m): the buildModel() result, set once by main.js
src/app/ui/speech.js     TTS, voices, speak, stopSpeech, spk(); language names looked up at call time (§3.2)
src/app/ui/toast.js      toast
src/app/ui/chunks.js     CHUNKS, renderChunked, cancelChunks, flushChunks, ensureChunk, appendChunk
src/app/ui/tableTest.js  beginTableTest, tableTestCell, bindTableTests, answerTableCell, focusNextTest
src/app/ui/ruleTags.js   viFinal, ruleTags
src/app/views/cards.js   initCards(), renderCards(), doFlip(), rate(), due(), deck(), topStat() …
src/app/views/rules.js   initRules(), renderRules(), pickRule(), newQuiz()
src/app/views/ff.js      initFF(), renderFF(), syncFFControls(), toggleFFTile(), showFFWord() …
src/app/views/read.js    initRead(), renderRead(), markPassageRead() …
src/app/views/glyph.js   initGlyph(), renderGlyph(), filteredGlyphs() …
src/app/nav.js           initNav(), render(), updateCounts(), switchView()
src/app/keyboard.js      initKeyboard()
src/app/footer.js        initAbout(), initReset(), syncResetLabel()
```

`main.js` calls the `init…()` functions in exactly the order of STAGE1_SPEC §3.2. The two document `keydown` listeners stay in their order: keyboard before Esc.

### 3.2 Make every translated value late-bound

A value that is translated must be looked up **when it is rendered**, never once at start-up. Today the following values are fixed at start-up. Step 1 changes each one so that it is formatted at render time, with the same output in ja:

| Where today | Value | Change |
|---|---|---|
| `data/model.js:20–21` | `word.jr`, `word.k` contain `t('word.rare_reading')` | Keep the raw reading and a `rare` flag in the model (for example `ja`, `jaRare`, `ko`, `koRare`). Add pure helpers `jr(w)` and `kr(w)` in `src/app/lib/word.js` that format with `t()` at call time. Replace every use of `w.jr` / `w.k` with them. |
| `data/model.js:47` | `NONE_RULE.label` = `t('rules.none_label')` | No `label` on `NONE_RULE`. `ruleTags` uses `t('rules.none_label')` when `jong === 0`. |
| `data/model.js:49–51, 66` | FF row `label` = `LANG_LABEL[lang]` | Store `lang` only. `ffLine` formats the short language label at render time (see the note below). |
| `data/model.js:86–89` | passage `name` | Store `lang` and `n`. `renderRead` formats `t('read.passage_name', { lang: t(…short…), n })`. |
| `main.js:58` | `LNAME = { zh: t('lang.zh'), vi: t('lang.vi') }` | A function `langName(lang)` in `speech.js`, looked up at call time. |
| `main.js:114` | `toLocaleString('ja-JP')` | `toLocaleString(localeMeta().numberLocale)` (STAGE1_SPEC §4.2 already asked for this). |

Note on keys built at run time: the "every key is used" test (§8.1) finds keys only as string literals. So write each lookup as a literal (`{ ja: () => t('lang.short_ja'), ko: () => t('lang.short_ko'), … }[lang]()`), not as `t('lang.short_' + lang)`.

After step 1, `buildModel()` imports nothing from `src/i18n/`. `tests/unit/model.test.js` must still pass without change. If it reads `jr`/`k`, stop and report this in HANDOFF instead of changing the test in step 1.

### 3.3 The re-render entry point

Step 1 also adds, unused for now, `export function rerenderAll()` in `nav.js`. It must:
1. call `syncFFControls()` and `syncResetLabel()` (these set text even when their view is hidden: `#ffhelp`, `#reset`);
2. call `render()` (the current view, `topStat()`, `updateCounts()`);
3. call `flushChunks()` and then restore the window scroll position that `rerenderAll()` saved when it started. This keeps the learner's place in the long lists (glyph, ff), which otherwise re-render from 30 rows.

It must not:
- call `Math.random`;
- create a new rule quiz (`newQuiz` runs only when `state.quiz` is `null`, as today);
- start a new false-friend round;
- change the current card;
- change the view;
- write any storage key.

## 4. The language system

### 4.1 Locale files

- `src/i18n/<code>.json`, one per UI language: `en.json`, `ja.json`, `ko.json`. `<code>` is a lower-case BCP 47 primary language subtag (`en`, `ja`, `ko`, later `vi`).
- A flat object of `"key": "value"` strings, as in Stage 1 (STAGE1_SPEC §4.1): `{name}` placeholders, no markup.
- **Every file has exactly the same keys** (130 after Stage 2; the list is in `docs/STAGE2_STRINGS.md`).
- Three keys are locale settings, not text: `meta.native_name` (the language's own name, for the switch), `meta.html_lang` (the value of `<html lang>`, equal to the file's `<code>`), and `meta.number_locale` (for `Intl.NumberFormat`).
- `ja.json` keeps the 114 app keys and their values byte-identical to Stage 1, drops `overview.open_app`, and adds the 16 new keys.
- **Discovery:** both the app and the build find the locale files by listing the directory, so a new file is picked up without a code change:
  - app: `import.meta.glob('./*.json', { eager: true, import: 'default' })` in `src/i18n/index.js`;
  - build: `fs.readdirSync('src/i18n')` in `vite/i18n-html.js`;
  - order (the switch, the overview language links, the hreflang list): sorted by code (`en`, `ja`, `ko`, later `vi`).
- **The default locale is `en`** (D1). It is also the fallback for a missing key (§4.8) and the build-time fill language (§4.4).
- **All locale files are bundled into the app's JavaScript.** There is no separate download. Each file is about 7 KB (about 3 KB with gzip). So switching language never needs the network, and works offline once the page has loaded (PROMPT §4). For a few more languages this stays small. The size is checked in §8.6.

### 4.2 `src/i18n/index.js` API

```js
export const DEFAULT_LOCALE = 'en';
export const PREFILL_LOCALE = 'en';          // the language the build writes into the HTML (§4.4)
export const LOCALES = [...];                // ['en', 'ja', 'ko'] from the glob, sorted
export const isLocale = (code) => ...;       // true only for a string in LOCALES
export const getLocale = () => locale;
export function setLocale(code) { ... }      // throws on an unknown code; does not touch storage or the DOM
export const localeMeta = (code = locale) => ({ nativeName, htmlLang, numberLocale });
export function t(key, params) { ... }       // as Stage 1, with the fallback of §4.8
export function tHtml(key, slots) { ... }    // as Stage 1
export function resolveLocale({ query, stored, languages }) { ... }   // pure; §4.3
```

`t` and `tHtml` keep their Stage 1 escaping rules (STAGE1_SPEC §4.2): `t` returns plain text, and the caller escapes it wherever the original inserted a literal into HTML.

### 4.3 Which language is used, and where it is remembered

`resolveLocale({ query, stored, languages })` returns the first of:

1. `query`: the value of the URL parameter `?lang=` on `/app/`, if `isLocale(query)`.
2. `stored`: the value of the localStorage key **`kb_lang`**, if `isLocale(stored)`.
3. **(P8 = (a), recommended)** the first entry of `navigator.languages` (or `[navigator.language]`) whose primary subtag, in lower case, `isLocale`. Examples: `ja-JP` → `ja`, `ko` → `ko`, `en-GB` → `en`, `zh-TW` → no match, try the next entry.
   **If P8 = (b):** skip this step.
4. `DEFAULT_LOCALE` (`en`).

**Storage key `kb_lang`.**
- The value is a JSON string, written through `S.set('kb_lang', code)` and read through `S.get('kb_lang', null)`, like every other key.
- It is written **only** when the learner makes an explicit choice:
  - a change of the switch;
  - a valid `?lang=` on arrival (the overview's Start button sets it, §6.4).
- A language found from the browser (step 3) is **not** stored. So a learner who never chose keeps following the browser.
- Reset (footer) does not touch `kb_lang`. It is a setting, like `kb_mute`, `kb_auto`, `kb_target` and `kb_ex_open`.
- An invalid stored value is ignored and left in place: a number, an unknown code, or JSON that is not a string. It is overwritten on the next explicit choice. Reading never throws. If storage is unavailable, steps 3–4 decide and nothing is written.
- **After reading `?lang=`**, remove the parameter from the address bar with `history.replaceState(history.state, '', location.pathname + location.hash)`, whether the value was valid or not. Otherwise a later reload would override a newer choice. The value is used only as a code to compare with `LOCALES`. It is never inserted into the page.
- **Stage 3 note:** `kb_lang` is the local copy of `profiles.ui_lang` (PROMPT §6). Stage 3 syncs it under the same rules as the other settings. The `ui_lang` check constraint (`in ('en','ja','ko')`) must then accept every locale file. HANDOFF Open note 13 records this.

**The overview pages** (§6) do not resolve anything. Each page has a fixed language, given by its URL.

### 4.4 Static text in `app/index.html`

The app page keeps the Stage 1 `{{key}}` placeholders. Each element that holds static UI text also gets a marker that names the key, so that the text can be replaced at run time:

| Marker | Meaning | Example |
|---|---|---|
| `data-i18n="key"` | The element's **whole content** is this text (`el.textContent = value`). | `<p class="tab-explain" data-i18n="cards.explain">{{cards.explain}}</p>` |
| `data-i18n-text="key1 key2"` | The element has **mixed content**. The n-th key replaces the n-th direct child text node that is not whitespace-only. | `<button data-v="cards" class="on" data-i18n-text="nav.cards">{{nav.cards}} <span class="tabcount" id="count-cards"></span></button>` · `<div class="logo" data-i18n-text="header.logo_text"><span class="han" data-i18n="header.logo_mark">{{header.logo_mark}}</span> {{header.logo_text}}</div>` · `<p data-i18n-text="about.licence_before about.licence_after">{{about.licence_before}}<a …>…</a>{{about.licence_after}}</p>` |
| `data-i18n-attr="attr=key;attr2=key2"` | Attributes. | `<div class="about hidden" id="aboutpanel" role="region" aria-label="{{footer.about}}" data-i18n-attr="aria-label=footer.about">` |
| `data-i18n-params="name=value"` | Literal parameters for `data-i18n`. | `<button data-p="level-3" data-i18n="glyph.filter_level" data-i18n-params="n=3">{{glyph.filter_level\|n=3}}</button>` |

Rules:

- **Every** `{{key}}` in the body of `app/index.html` is covered by exactly one marker, and every marker key has its placeholder. The build plugin checks this (§4.4.1).
- `#ffhelp` and `#reset` carry `data-i18n` like the others. JavaScript also sets their text: `syncFFControls()` and `syncResetLabel()` run after every static apply (§3.3).
- `<title>` and `<html lang>` get **no marker**. They are set from JavaScript (`document.title = t('app.title')`, `document.documentElement.lang = localeMeta().htmlLang`), so the head stays as it is (§8.2 N7).
- **Mixed-content text nodes keep the template's own whitespace.**
  - At start-up, `applyStatic()` remembers each target text node's leading and trailing **template** text in a `WeakMap`. It gets them by removing the known prefill value (`PREFILL_LOCALE`) from the node's text, so it never trims.
  - Then it sets `node.data = lead + value + trail`.
  - This keeps `カード ` (with its space before the `<span>`) and ` ブリッジ` (with its space after the mark), and lets `about.licence_before` end in a space in en and ko but not in ja.
  - If a prefill value is not found in its node, call `console.error('i18n: static text mismatch', key)`. The zero-console-error tests then fail.
- Values used by `data-i18n-text` must be non-empty and not whitespace-only in every locale (unit test, §8.1). Otherwise the text node would not exist.

#### 4.4.1 The build plugin (`vite/i18n-html.js`)

- `{{key}}` and `{{key|name=value}}` are filled as in Stage 1 (`esc(value)`), but from **`en.json`** (`PREFILL_LOCALE`). `app/index.html` starts with `<html lang="en">`.
- An unknown key, a leftover `{{`, or a placeholder in the app body without its marker (or a marker without its placeholder) **fails the build** and names the key. A regular-expression check over the source is enough, because the markup is simple and hand-written. Keep it simple and make it strict.
- For the overview template (§6.2), the plugin generates one page per locale.
- `{{key|name=@other.key}}` (a parameter that is another key's value) is allowed in the overview template only. It is needed for `overview.shot_alt`.

### 4.5 Start-up order (P12)

Today `data.js` (6.6 MB) is a parser-blocking classic script at the end of `<body>`. `main.js` runs only after it. With the HTML prefilled in English, a ja or ko learner would see English labels for as long as `data.js` takes to download. To avoid that, `main.js` takes over loading `data.js`:

1. `app/index.html`:
   - **remove** `<script src="data.js"></script>` from the body;
   - **add** `<link rel="preload" href="/app/data.js" as="script">` in `<head>`, after the Google Fonts `<link>`, so the download starts as early as before.
   - If Vite rewrites or warns about this tag, report it in HANDOFF and use the form that Vite leaves untouched. No other head change.
2. `main.js`, in this order:
   1. `const code = resolveLocale(...)`; `setLocale(code)`; if the code came from `?lang=`, store it and clean the URL (§4.3).
   2. `applyLanguage(code, { initial: true })` (§4.6): the static text, `<html lang>`, `document.title`, the switch's options and value, the logo `href`, and the notice. No view exists yet.
   3. `await loadData()`:
      - insert `<script src="/app/data.js">` at the end of `<body>`;
      - resolve on `load`;
      - on `error`, or if `window.KB_DATA` is missing after `load`, throw `new Error('KB_DATA failed to load')`, the same message as v2.
   4. `setModel(buildModel(window.KB_DATA))`, then the `init…()` sequence of STAGE1_SPEC §3.2, then `render()`.
3. Nothing else changes in the order or timing of the app's own storage reads and writes.

The parity snapshot removes every `<script>` element and the whitespace text nodes after `<footer>` (STAGE1_SPEC §6.3). So the moved script does not change the compared markup.

### 4.6 Switching language

`applyLanguage(code, { initial = false, fromUser = false })` in `src/app/language.js`:

1. `setLocale(code)`. If `fromUser`, `S.set('kb_lang', code)`.
2. `document.documentElement.lang = localeMeta().htmlLang`; `document.title = t('app.title')`.
3. `applyStatic(document.body)`: every `data-i18n`, `data-i18n-text`, `data-i18n-attr`.
4. The switch shows `code`. The logo `href` is the overview of `code` (§5.2). The notice is created or removed (§5.3).
5. If not `initial`: `rerenderAll()` (§3.3). Then, if `fromUser`, move the focus back to the switch.

What a switch keeps, and what it may lose:

| Kept (tested, §8.3) | May be lost (accepted) |
|---|---|
| the current view; the current card and whether it is flipped; `guess` after a flip; the target; the rule, its quiz (same example, same options, same answer state) and test mode; the ff mode, filter, language, open tiles, round and flip state; the passage, the selected word and the annotation checkbox; the glyph mode and filter, and the stored quiz results (their colours); the About panel's open state; the armed reset (its label changes language); the scroll position; **every localStorage value except `kb_lang`** | text typed but not yet submitted in an input (`#gvi`, `#gzh`, a table-test input), and the result text of an answered table-test cell. Re-rendering a test empties its inputs and keeps the stored colour, as reopening a test does in v2. A visible toast keeps its old text until it hides. |

The keyboard handler (`keyboard.js`) must also ignore keys whose target is the switch (a `SELECT`), as it does for text inputs. Otherwise Space or Enter on the switch would also flip a card.

### 4.7 `<html lang>`, numbers, fonts

- `<html lang>`: `meta.html_lang` of the current language (`en`, `ja`, `ko`), set on every switch. Static `app/index.html` says `lang="en"`. Each overview page has its own language.
- **Numbers:** the tab counts use `toLocaleString(meta.number_locale)` (`4,051` in all three). The header statistic and the progress counts stay plain, as in v2. Nothing else formats numbers or dates.
- **Fonts:**
  - **en:** the existing stack, unchanged: `"Noto Sans"` for Latin, then `"Noto Sans JP"` for the Japanese content.
  - **ja:** unchanged.
  - **ko:** one new rule, `html:lang(ko){--sans:"Noto Sans","Noto Sans JP","Noto Sans KR",system-ui,sans-serif}`.
    - Hangul is not in Noto Sans or Noto Sans JP, so Korean UI text falls through to Noto Sans KR (already loaded for the `.ko` readings).
    - Kanji and kana in the Japanese content still use Noto Sans JP, so they keep their Japanese forms.
    - The Google Fonts URL is **not** changed (it is compared by the parity suite, and changing it is outside Stage 2). Noto Sans KR is loaded at weights 400 and 500 only. Korean text in bolder UI elements uses the nearest weight or synthetic bold. Record what the screenshots show. Self-hosting (Stage 4) can add weights later.
  - **A future vi:** Noto Sans covers Vietnamese, so no font rule is needed.

### 4.8 When something is missing or fails

| Case | Behaviour |
|---|---|
| A key is missing in the current locale | `t` uses `en`; if `en` lacks it too, the key itself. `console.error('i18n: missing key', key, locale)` once per key and locale. The completeness test (§8.1) makes this impossible in a release. |
| A stored or requested language is unknown | Ignored (§4.3). No error, no console message. |
| localStorage is unavailable | Language from the browser or `en`; switching still works for the page's lifetime. No error. |
| `data.js` fails to load | `Error('KB_DATA failed to load')`, as v2. The static text is already in the right language. |
| JavaScript is off | The prefilled English HTML shows; nothing works. This is as in v2, but in English. |

There is no separate locale download (§4.1), so "a locale file fails to load" cannot happen at run time. A broken locale file (invalid JSON) fails the build.

### 4.9 Adding a language later (the check Claude runs at the gate)

1. Add `src/i18n/vi.json` with every key (`meta.html_lang` = `vi`).
2. `npm run build`. The switch lists "Tiếng Việt", `/app/?lang=vi` works, `/vi/` exists, and the key-completeness test passes.
3. `npm run shots:overview` (after a build) adds `public/overview/vi/*.png`.

No other file changes. Not part of Stage 2: whether a vi UI also needs vi content (the Vietnamese-base mode, D7) is a later decision.

## 5. App changes (step 3)

### 5.1 The language switch (P9 = (a), recommended)

- A native `<select id="lang">` with one `<option value="<code>">` per locale. Each option's text is that locale's `meta.native_name` (English, 日本語, 한국어), and the option has `lang="<code>"`.
- Options are created by `applyLanguage(…, { initial: true })` from `LOCALES`. The static HTML has an empty `<select>`.
- Its accessible name comes from `data-i18n-attr="aria-label=header.lang_label"`.
- `change` → `applyLanguage(value, { fromUser: true })`.
- **Placement:** the last child of `.bar`, right after `#topstat`, on the **same line with no whitespace between them**: `<div class="today" id="topstat"></div><select id="lang" data-i18n-attr="aria-label=header.lang_label"></select>`. Then removing it in the parity snapshot leaves the original whitespace (§8.2 N3).
- **Style:** the header's quiet style:
  - `font: inherit; font-size: 13px; color: var(--sub)`;
  - `background: var(--paper); border: 1px solid var(--line); border-radius: 999px; padding: 4px 10px`;
  - `cursor: pointer; flex: none`.
  - It stays visible on narrow screens. Below 760 px, `.today` hides as today, and the nav keeps scrolling sideways inside its own box.
  - All its rules use the selector `#lang`.
- **If P9 = (b):** a `.seg` group `<div class="seg" id="lang">` of buttons with the native names, `data-l="<code>"`, in the same place, with the same normalisation. Its CSS reuses `.seg`, so only position rules are new.

### 5.2 The logo link (D11; target from P10)

- `<div class="logo">` becomes `<a class="logo" href="/">`, with the same children and text markers.
- **P10 = (a), recommended:** `href` is the overview page of the current UI language: `/` for en, `/ja/` for ja, `/ko/` for ko (`/<code>/` in general, `/` for `DEFAULT_LOCALE`). It is set by `applyLanguage`. This refines D11.
- **If P10 = (b):** always `/`.
- **Style:** `a.logo{color:inherit;text-decoration:none}`, so it looks exactly like today's logo. The cursor becomes a pointer, and the browser shows its usual focus ring on keyboard focus. Nothing else.

### 5.3 The content notice (P11 = (a), recommended)

- `<p class="content-note" role="note">` with `t('notice.content_ja')`, inserted by `applyLanguage` as the **first child of `<main>`** when the language is not `ja`, and removed when it is `ja`. There is no static markup for it.
- **Style:** `.content-note{margin:-20px 0 24px;font-size:12px;color:var(--sub)}` (Codex may adjust the spacing so that the `.tab-explain` line below keeps its look; report the final values). It is not dismissible and stores nothing.
- **If P11 = (b)** (every language): static markup `<p class="content-note" role="note" data-i18n="notice.content_ja">` as the first child of `<main>`. The parity suite then also removes it in ja (N3).

### 5.4 CSS

- All new app CSS goes into **`src/app/i18n.css`**, imported by `main.js` **after** `styles.css`. `styles.css` stays byte-identical to Stage 1.
- Every rule in `i18n.css` must start with one of these selectors: `a.logo`, `#lang`, `.content-note`, `html:lang(`. `@media` blocks may contain only such rules. The parity suite enforces the list (§8.2 N6).
- **Layout fixes for longer en/ko text.** If the screenshots (§8.4) show that an en or ko string breaks the layout, the fix goes into `i18n.css` under `html:lang(en)` or `html:lang(ko)`. Each such rule is listed in HANDOFF with the screenshot that needed it. ja never changes. Examples of a break: text overlaps, a button wraps into two lines where ja does not, or the page scrolls sideways at 390 px.

### 5.5 The complete list of visible changes (P13)

1. The overview pages at `/` (and `/ja/`, `/ko/` under P10 (a)).
2. The logo is a link (pointer cursor, focus ring).
3. The language switch in the header. The header's nav is narrower by the switch's width, most visibly on phones.
4. The content notice (en/ko only under P11 (a)).
5. The en and ko interface text (approved table), and any listed `html:lang(en|ko)` layout rules.
6. The Korean UI font fallback (§4.7).
7. `?lang=` disappears from the address bar after the app reads it.
8. With JavaScript off, the app shell is in English.

In ja, the app is otherwise pixel-identical to app v2. The ja parity suite proves it.

## 6. Overview pages (step 4)

### 6.1 URLs (P10 = (a), recommended)

| URL | Language | Notes |
|---|---|---|
| `/` | en (`DEFAULT_LOCALE`) | also `x-default` |
| `/ja/` | ja | `/ja` → 308 `/ja/` (Cloudflare does this for a directory index) |
| `/ko/` | ko | same |
| `/<code>/` | every further locale file | generated, no extra file |

- **No automatic redirect** between them: no browser-language detection on the overview. Each page shows language links at the top.
- **Start** opens `/app/?lang=<code>`, so the app starts in the page's language and remembers it (§4.3).

**If P10 = (b)** (one page): only `/`, built from the same template but prefilled in en with `data-i18n` markers. It loads a small module (`src/overview/main.js`) that runs `resolveLocale` and `applyStatic`, swaps the image paths per language, and has a language `<select>` like the app's. There are no hreflang links. Start is plain `/app/`.

### 6.2 How the pages are generated

- The template is the root `index.html` (the Stage 1 placeholder is replaced). It uses `{{key}}` placeholders (§4.4.1) and plugin markers for generated parts:
  - `<!--@alternates-->`, `<!--@langlinks-->` and `<!--@notice-->`;
  - `{{@lang}}` (the page's code), `{{@home}}` (the page's own path), `{{@start}}` (`/app/?lang=<code>`) and `{{@canonical}}` (`SITE_ORIGIN` + the page's path).
- **Build:**
  - Vite processes `index.html` once (asset hashing of the stylesheet), with the placeholders left in.
  - In `generateBundle`, the plugin takes that processed HTML and emits one filled page per locale: `index.html` for `DEFAULT_LOCALE`, and `<code>/index.html` for the others.
  - A leftover `{{` or `<!--@` fails the build.
- **Dev:** in `configureServer`, the plugin serves `/<code>/` by running `server.transformIndexHtml` on the template and filling it for that code. So `npm run dev` shows every page.
- The overview pages contain **no JavaScript** under P10 (a).

### 6.3 Head

```html
<html lang="{{meta.html_lang}}">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{{overview.page_title}}</title>
<meta name="description" content="{{overview.meta_description}}">
<link rel="canonical" href="{{@canonical}}">
<!--@alternates-->   → one <link rel="alternate" hreflang="<code>" href="SITE_ORIGIN/<path>"> per locale,
                       plus hreflang="x-default" → SITE_ORIGIN/
<link rel="stylesheet" href="/src/overview/styles.css">
```

- **`SITE_ORIGIN`** is one constant in `vite.config.js`, currently `https://kanjibridge-app.pages.dev`. Hreflang and canonical URLs must be absolute. The domain task (D21) changes this one value.
- **No web fonts** on the overview (as in the Stage 1 placeholder). The system fonts are behind the app's `--sans` stack, so the page makes **no third-party request**. Under `html:lang(ko)`, the overview uses the same stack as the app's ko rule.

### 6.4 Body

All text comes from keys (`docs/STAGE2_STRINGS.md` §3.14 lists the new ones and the reused ones). The structure:

```
<header class="o-bar">
  <a class="logo" href="{{@home}}"><span class="han">{{header.logo_mark}}</span> {{header.logo_text}}</a>
  <nav class="o-langs" aria-label="{{header.lang_label}}"><!--@langlinks--></nav>
      → per locale: <a href="/…" hreflang="<code>" lang="<code>">native name</a>;
        the current one has aria-current="page"
</header>
<main>
  <section class="o-hero">
    <h1>{{app.title}}</h1>
    <p class="o-lead">{{overview.lead}}</p>
    <p>{{overview.free}}</p>
    <a class="o-start" href="{{@start}}">{{overview.start}}</a>
    <!--@notice-->  → en/ko (every locale except ja): <p class="content-note">{{notice.content_ja}}</p>
  </section>
  <section class="o-views">
    <h2>{{overview.views_heading}}</h2>
    five times, in nav order (cards, rules, ff, read, glyph):
    <figure>
      <img src="/overview/{{@lang}}/cards.png" width="1280" height="800" loading="lazy"
           alt="{{overview.shot_alt|view=@nav.cards}}">
      <figcaption><b>{{nav.cards}}</b> {{cards.explain}}</figcaption>
    </figure>
  </section>
  <section class="o-data">
    <h2>{{overview.sources_heading}}</h2>
    <p><b>{{about.data_label}}</b>{{about.data_sources}}</p>
    <p lang="en">{{about.edrdg}}</p>
    <p>{{about.ai_note}}</p>
    <p>{{overview.notices}} <a href="/app/NOTICE.md">NOTICE.md</a> · <a href="/app/LICENSE-DATA">LICENSE-DATA</a>
       · <a href="/app/DATA-LICENSE.md">DATA-LICENSE.md</a></p>
    <p>{{about.licence_before}}<a href="https://github.com/hanjejeme2023-oss/kanjibridge-app">github.com/hanjejeme2023-oss/kanjibridge-app</a>{{about.licence_after}}</p>
  </section>
  <section class="o-privacy">
    <h2>{{overview.privacy_heading}}</h2>
    <p>{{overview.privacy_text}}</p>
  </section>
</main>
```

- **No "Sign in"** anywhere (Stage 3).
- The first image is not lazy (`loading="eager"`). The other four are lazy.

### 6.5 Style

`src/overview/styles.css`, in the app's visual style (PROMPT §3 rule 5). Copy the tokens it needs from `src/app/styles.css` (`--paper`, `--ink`, `--sub`, `--line`, `--mist`, `--indigo`, `--sans`, `--radius` if present) rather than importing the app CSS.
- A centred column (max width about 980 px, like `.bar`).
- The header bar looks like the app's (logo left, language links right).
- `h1` in the app's heading weight.
- The Start button in the app's dark `.pill` style.
- The figures in a two-column grid on wide screens and one column below 700 px. The images have the app's `.tile` border and radius, and `max-width: 100%; height: auto`.
- Small grey (`--sub`) text for the data section, as in the app's About panel.
- **No horizontal scroll at 390 px** (tested).

### 6.6 The screenshots

- **Script:** `npm run shots:overview` = `playwright test -c playwright.shots.config.js` with its own `testDir` (`scripts/shots/`). It expects a finished `dist/`, starts `vite preview` with Playwright's `webServer`, and stops it. It is **not** part of `npm test` or CI.
- **Output:** `public/overview/<code>/{cards,rules,ff,read,glyph}.png` for every locale. These files are **committed**.
- **Settings:**
  - viewport 1280×800, `deviceScaleFactor: 1`;
  - the seeded `Math.random` and fixed clock of the parity suite;
  - fresh storage plus `kb_lang`;
  - the network **on**, so Google Fonts load. Wait for `document.fonts.ready` and for the page to be quiet (the parity helper's `quiet`).
- **Scenes**, all at the top of the page unless noted:
  - **cards:** target `both`, the first card flipped after typing the correct Vietnamese answer, so the back shows answers, tags and examples;
  - **rules:** rule `k`, quiz answered correctly;
  - **ff:** list, the first tile open;
  - **read:** passage 1, the first underlined word selected, scrolled so that the passage and the word sheet are both visible;
  - **glyph:** list, filter `all`.
- **Size budget:** each PNG ≤ 400 KB. If an image is larger, report it in HANDOFF; the owner decides about another format. Record every file size in HANDOFF.
- Re-run the script whenever the UI text or look changes, and after a new locale is added.

## 7. Strings

- The values come from `docs/STAGE2_STRINGS.md` **after the owner's approval** (★ rows decided 2026-11-26; the other rows are approved for implementation and reviewed on the screenshots at the gate, §11 item 14). Copy them exactly, including the notation (`⎵` = space, `〔U+3000〕` = U+3000). If the owner wrote a change in a memo cell starting with "Owner:", that change wins. If anything in the table is unclear, stop and ask in HANDOFF.
- Key order in each JSON file: the order of the table (§3.0 → §3.14).
- `about.edrdg` is identical in all files (test).
- Never put markup in a value. Never build a sentence by joining two values in code (the existing `{name}` templates already avoid that). Never add a value that is not in the table. If the code needs a new string, stop and ask Claude for a key and its three values.

## 8. Tests

`npm test` keeps its order (check:data → unit → build → build checks → browser), one step at a time, one worker (PROMPT §1).

### 8.1 Unit tests (`tests/unit/i18n.test.js`, rewritten)

1. The locale files are found by listing `src/i18n/*.json`. `en`, `ja` and `ko` must exist.
2. **Completeness:** every file has exactly the key set of `en.json`. The failure message names each missing or extra key and the file. **A missing key fails the test.**
3. No duplicate keys in any file (raw-text check, as Stage 1). Every value is a string. `meta.html_lang` equals the file's code. `new Intl.NumberFormat(meta.number_locale)` does not throw.
4. **The same placeholders:** for each key, the set of `{name}` placeholders is the same in every file.
5. No `<` or `>` in any value. `about.edrdg` is identical in every file.
6. `ja.json`: the 114 Stage 1 app keys have their Stage 1 values (compare with a fixture copied once from the Stage 1 `ja.json` into `tests/unit/fixtures/ja-stage1.json`).
7. **Used and existing keys:** every `t('…')`, `tHtml('…')`, `data-i18n…` key and `{{…}}` placeholder in `src/`, `app/index.html` and `index.html` exists in `en.json`. Every key in `en.json` is used. Exempt: the `meta.*` keys, which `index.js` reads generically.
8. Every key used in `data-i18n-text` is non-empty and not whitespace-only in every file.
9. **No hard-coded UI text:**
   - (a) no CJK or Hangul characters (`[ᄀ-ᇿ　-〿぀-ヿ㄰-㆏㐀-鿿가-힯＀-￯]`) in `src/**/*.js`, `app/index.html` or `index.html`, except the four allowlisted parsing regexes of Stage 1;
   - (b) in `app/index.html`, `index.html` and every template literal in `src/**/*.js` (with every `${…}` removed first), every text segment between `>` and `<`, and every value of `aria-label`, `title`, `placeholder` and `alt`, is whitespace, a `{{…}}` placeholder, a URL or file name used as link text, a symbol or digit, or one of the key caps `Enter`, `V`, `C`. Anything containing a letter fails, with file and line.
10. `t`: substitution and escaping as in Stage 1; the en fallback; one `console.error` per missing key and locale. `resolveLocale`: the cases of §4.3, including `zh-TW` then `ko-KR` → `ko`, an unknown query, a non-string stored value, and an empty `languages`.
11. The step-1 helpers `jr(w)` and `kr(w)` (rare readings in brackets, per locale).

### 8.2 The ja parity suite against app v2 (updated helper)

`tests/browser/lib/parity.js` changes only as listed here. The scenarios P1–P8 and every checkpoint stay. Codex may add checkpoints, but not remove any.

- The new page is loaded at `http://127.0.0.1:4173/app/?lang=ja`. In every scenario with storage, **both** contexts get `kb_lang: '"ja"'` added to their seeded storage. The baseline ignores the key, so the storage snapshots stay equal. In P5 (no storage), `?lang=ja` alone selects ja.
- After load, the helper also waits for `document.documentElement.lang === 'ja'` on the new page.
- **Normalisations, applied to the new page only and nowhere else:**

| # | What | Why |
|---|---|---|
| N1 | Remove the attributes `data-i18n`, `data-i18n-text`, `data-i18n-attr` and `data-i18n-params` from every element of the cloned body. | §4.4 markers; invisible |
| N2 | In the clone, replace the one `a.logo` (a child of `.bar`) by a `<div class="logo">` with the same child nodes and no other attribute. | §5.2 |
| N3 | Remove `#lang` from the clone. In the live page, set `display:none` on `#lang` for the computed-style and screenshot parts of the checkpoint, and restore it afterwards. (Under P11 (b), the same for `.content-note`.) | §5.1; with it hidden, the header lays out exactly as v2 |
| N4 | Assert that `.content-note` does **not** exist in ja (P11 (a)). | §5.3 |
| N5 | Computed styles (the **S** checkpoints): skip `#lang` and its descendants. For `.logo` and its descendants, record the tag as `DIV` and ignore `cursor` (inherited from the link). Any other property found to differ only because of the link's browser default must be added by name, with a comment, and reported in HANDOFF. Claude reviews that list at the gate, and no listed property may change layout or colour. | §5.2 |
| N6 | CSS rules: the baseline's rules must equal the **first** rules of the new page's same-origin style sheets, in order. Every further rule must be an allowed `i18n.css` rule (§5.4: selector starting with `a.logo`, `#lang`, `.content-note` or `html:lang(`; an `@media` containing only such rules). | §5.4 |
| N7 | None for the head: `title`, `<html lang>` and the compared head elements (meta, title, preconnect, the fonts link) must be equal as before. The new `preload` link is not among the compared elements. | §4.4, §4.5 |

Nothing else is normalised. The body markup must then be byte-identical. Every other snapshot field (forms, focus, scroll, storage, speech, screenshot pixels) must be equal as in Stage 1.

- `gate.spec.js` uses the same helper, so it runs in ja and its assertions stay.
- `baseline-sanity.spec.js` is unchanged.
- **Open note 12:** in `P1-reset-filled`, replace the 読解 assertion with a check that the length of `kb_unknown` grows by one, like the other three steps.

### 8.3 i18n browser tests (`tests/browser/i18n.spec.js`, new)

Use the same context settings as the parity suite (seeded random, fixed clock, speech stub, offline route), with `locale` set per test. Every test checks 0 page errors, 0 console errors (font aborts excepted, as in Stage 1) and no other host.

1. **Resolution:**
   - fresh storage with browser `ja-JP` → ja, `ko-KR` → ko, `en-US` → en, `fr-FR` → en (under P8 (a); under P8 (b), all → en);
   - stored `kb_lang` `ko` beats a `ja-JP` browser;
   - stored `"xx"`, `123` or `not-json` → ignored, and the stored value is left unchanged;
   - `?lang=ko` → ko, `kb_lang` becomes `"ko"`, and the URL loses `?lang`;
   - `?lang=xx` → ignored and removed from the URL;
   - storage unavailable → the browser language, no error.
2. **Switch in each view state.** States: cards front; cards back; rules quiz answered; rules test mode; ff list with one tile open; ff cards back; read with a word selected; glyph quiz with one answered cell; glyph list scrolled down 3,000 px; About open; reset armed.
   - For each state, switch ja → en → ko. After each switch, check:
     - the nav button texts, `<html lang>` and `document.title` equal the locale's values;
     - the same view is visible;
     - the state listed in §4.6 as "kept" is unchanged (read it from the DOM and `localStorage`);
     - `localStorage` is equal to before, except `kb_lang`;
     - `Math.random` was not called (count the calls in the init script);
     - the focus is on `#lang`.
   - The scroll position is kept (±1 px) in the glyph list state.
3. **Round trip.** In each state above except "glyph quiz with one answered cell" (whose result text is cleared by design, §4.6): ja → en → ja gives a body markup that is byte-identical to before (after N1–N3), and equal storage.
4. **Remembered:** after a switch to ko, a reload opens in ko; after a switch back to ja, a reload opens in ja.
5. **Logo:** its `href` is `/` in en, `/ja/` in ja and `/ko/` in ko (P10 (a)), and it follows a switch.
6. **Notice:** present as the first child of `<main>` in en and ko; absent in ja (P11 (a)); it follows a switch.
7. **No leftover language** in en and in ko, in all five initial views and the states of item 2:
   - (a) no hiragana or katakana (`[぀-ヿ]`) in the text of `header`, every `.toolbar`, `.tab-explain`, `.rate`, `.opts` labels, `#unknownreview` label, `.ghead`, `footer` and `#aboutpanel`, nor in any `aria-label`, `title`, `placeholder` or `alt` anywhere. Data shown inside these areas (for example a Japanese reading) is not in them by design; if Codex finds one, list it and exempt that element by selector, with a comment;
   - (b) in ko: no text node inside an element with a `data-i18n` marker equals the **en** value of its key, unless en and ko are equal (`header.logo_mark`, `header.logo_text`, `about.edrdg`; the app name is "Kanji Bridge" in both, `docs/STAGE2_STRINGS.md` §1.1);
   - (c) in en: the same check against the ko value.
8. **Tab counts:** formatted with the locale (`4,051`).
9. **Layout guards** in en and ko, at 1280×800 and 390×844, for the five initial views and the card back:
   - `document.documentElement.scrollWidth <= innerWidth`;
   - the header `.bar` is 60 px high;
   - at 1280 px, `nav.scrollWidth <= nav.clientWidth` (no nav item hidden on a desktop);
   - no `nav button`, `.seg button` or `.pill` is taller than the same element in ja. A taller one means its text wrapped onto a second line.
10. **Keyboard:** with focus on `#lang`, Space and Enter do not flip the card.

### 8.4 Review screenshots (`tests/browser/i18n-shots.spec.js`, new)

- **What:** ja, en and ko; 1280×800 and 390×844; the five initial views, the card back, and the About panel open: 42 PNGs.
- **Where:** `test-results/stage2-shots/<lang>-<width>-<state>.png` (git-ignored), also attached to the report.
- There are **no pixel assertions**: these are for Codex's own check (step 5) and for the gate, where the owner also reviews the en and ko wording on them (§11 item 14). Only the error and request checks apply.
- Codex looks at every en and ko shot. Codex fixes layout breaks (§5.4), or lists them in HANDOFF if a fix would change ja.

### 8.5 Overview tests (`tests/browser/site.spec.js`, rewritten)

For each locale page (`/`, `/ja/`, `/ko/`):
- status 200;
- `<html lang>`; `<title>` = `overview.page_title`; the `meta description`;
- one `h1` = `app.title`;
- the Start link = `/app/?lang=<code>`;
- five figures, each with a non-empty `alt`, whose image returns 200 with `image/png`;
- the language links: one per locale, the current one with `aria-current="page"`, `hreflang` and `lang` set;
- `canonical`, plus one alternate per locale and `x-default`, all starting with `SITE_ORIGIN`;
- the notice on every page except ja;
- **no "Sign in"** (no element or text with the en, ja or ko word for it);
- the exact `about.edrdg` sentence, `AI (Google Gemini)` / `AI（Google Gemini）`, and the three notice links, which return 200;
- 0 console errors;
- **no request to any other host** (the overview has no web fonts);
- no horizontal scroll at 390×844.

Also: `/app/data.js`, `/app/NOTICE.md`, `/app/LICENSE-DATA` and `/app/licenses/CC-BY-SA-4.0.txt` return 200, as in Stage 1.

### 8.6 Build checks (`tests/unit/build.test.js`, extended)

Keep all Stage 1 checks: no `{{` in any HTML, the `data.js` hash, 11 licences, and the secret scan. Add:
- one overview page per locale file (`dist/index.html` for en, `dist/<code>/index.html` for the others), with no `<!--@` left;
- `dist/overview/<code>/` holds the five PNGs for every locale, each ≤ 400 KB and 1280×800 (read the PNG header);
- `dist/app/index.html` has `lang="en"`, the `data-i18n` markers and the `preload` link, and no `<script src="data.js">` in the body;
- the built app JavaScript contains every locale's `meta.native_name`, which shows that every locale is bundled;
- the total size of the app's built JavaScript is reported in the test output (no limit; the gate notes it).

### 8.7 Running

As in STAGE1_SPEC §6.7. CI on GitHub Actions has `timeout-minutes: 30`. The Stage 1 run on `fa4bc35` took about 9 minutes. If Stage 2 needs more time, Codex may raise the limit in `ci.yml` (that one line, with the reason in the commit message). Codex changes nothing else in CI. Report the local `test:browser` duration in HANDOFF.

## 9. CI, hosting and security

- **Cloudflare Pages:** no setting changes. The build command is `npm run build`, and the output is `dist` (now also `dist/ja/`, `dist/ko/` and `dist/overview/`). Every push to `stage2-languages` gives a preview at `https://stage2-languages.kanjibridge-app.pages.dev`.
- **No new dependency.** If one seems necessary, stop and ask, with the reason.
- **No new external request:**
  - the app keeps exactly the preview origin plus the two Google Fonts hosts;
  - the overview requests only its own origin.
- **No analytics, no cookies.** Only one new storage key: `kb_lang`.
- **Inputs from the URL:** `?lang=` is compared with `LOCALES` and never inserted into the page.
- **Locale values are trusted build-time text.** They are inserted with `textContent` or `esc()` as in Stage 1, never as raw HTML.
- **No secrets** (SECURITY.md). The `dist/` secret scan stays.

## 10. Things to watch

- **Whitespace in `<body>`.** Insert `#lang` on the same line as `#topstat` (§5.1). Add the markers as attributes only: never move, wrap or re-indent existing markup in `app/index.html`. N1 removes the attributes, so everything else must stay byte-identical.
- **`esc()` stays `/[&<>"]/g`.** Static text set through `textContent` or `node.data` needs no escaping.
- **`applyStatic` on hidden sections.** The parity snapshot compares hidden views too, so every marked element must be filled at start-up, not only the visible ones.
- **The tile toggle's `replaceWith` path, chunked rendering, `kb_newtoday` written on every load:** unchanged (STAGE1_SPEC §10).
- **One `console.error` from i18n fails every browser test.** That is intended.
- **Later candidates, not Stage 2:**
  - `lang="ja"` on Japanese content inside an en/ko page;
  - self-hosted fonts with a Korean 600 weight;
  - a vi UI;
  - pointing About's repository link to `kanjibridge-app`.

## 11. Done when (the Stage 2 gate checks each item with evidence)

**Part 2A: code (Claude, on this PC and in CI)**

1. **Order:** the step-1 commits come before every i18n commit. They change nothing under `tests/`, `app/index.html`, `index.html`, `public/` or `vite/`. Claude runs `npm test` at the last step-1 commit, and it passes.
2. `npm ci && npm test` passes on this PC on the last commit, with no new build warning. CI `build-and-test` is green on the last commit of the pull request.
3. **Locale files:** `en.json`, `ja.json` and `ko.json` each have the same 130 keys. **Proof that a missing key fails:** Claude deletes one key in a scratch copy, sees the test fail and name it, and restores it.
4. **The values equal the approved `docs/STAGE2_STRINGS.md`** (Claude compares them programmatically, row by row). The 114 Stage 1 ja values are unchanged.
5. **No hard-coded UI text:** unit test §8.1 item 9 and browser test §8.3 item 7 pass. Claude also runs its own search over `src/` and the HTML templates.
6. **ja parity:** P1–P8 are all green, with exactly the normalisations N1–N7. Claude reads the helper diff: nothing else is normalised. The N5 property list is reviewed.
7. **i18n behaviour:** §8.3 items 1–10 pass. Claude also probes in a real browser:
   - a switch in three states;
   - a reload;
   - `?lang=`;
   - storage unavailable.
8. **Overview:** §8.5 and §8.6 pass. Claude reads the three pages. The images are present, within budget and showing the right language.
9. **One file per language:** Claude does §4.9 with a temporary `vi.json` (a copy of `en.json` with `meta.*` changed) in a temporary worktree, builds, and checks the switch, `?lang=vi`, `/vi/` and the tests. Then Claude deletes the worktree. Nothing is committed.
10. **Errors and requests:** 0 console and page errors in every test. The app requests only its origin and the two font hosts. The overview requests only its origin.
11. **Screenshots:** Claude looks at all 42 review shots (§8.4) and the 15 overview images. Every layout rule in `i18n.css` is listed in HANDOFF with its reason. In ja nothing changed except P13 items 2–3.
12. **Security:** no new dependency, host, cookie or analytics. `?lang=` is never inserted into the page. No secret in the repository or `dist/`.

**Part 2B: preview and owner**

13. On the preview `https://stage2-languages.kanjibridge-app.pages.dev`, with the network on:
    - `/`, `/ja/`, `/ko/` and `/app/` return 200;
    - `/ja` → `/ja/` and `/app` → `/app/`;
    - `data.js` has the pinned hash;
    - every overview image returns 200;
    - 0 console errors in each language and on each page;
    - the switch works and is remembered.
14. **The owner has approved the wording** (PROMPT §5 Stage 2) after using the preview in ja and ko (and looking at en). This is recorded in HANDOFF "Owner answers". Any wording change found here goes into `docs/STAGE2_STRINGS.md` and the JSON files in the same commit, and Claude re-checks items 3–4.
    - **How this is met (owner, 2026-11-26):** the ★ rows were decided on 2026-11-26 (`docs/STAGE2_STRINGS.md` §5). The owner checks the remaining rows on the en and ko review screenshots (§8.4) at this gate. "The owner has approved the wording" is met when the owner has looked at those screenshots (and the preview) and approved, and that is recorded in HANDOFF "Owner answers".
15. After the owner merges: production `https://kanjibridge-app.pages.dev` shows the same as the preview (as Stage 1 item 13).

**How the gate runs:**
- as in Stage 1: one heavy job at a time, browsers closed after use, temporary scripts in `test-results/` and deleted afterwards;
- 2A first;
- then the owner opens the pull request (if not yet open), checks the preview and approves the wording;
- then 2B;
- a second FAIL of the same part goes to the owner.

## 12. Questions for the owner

**Answered on 2026-11-26:** (a) for each of P8–P13, recorded as **D22–D27**. The ★ rows are decided (`docs/STAGE2_STRINGS.md` §5). The table stays as the record.

Codex cannot start until these are answered. They are proposals **P8–P13** in `docs/DECISIONS.md` §B, each with Claude's recommendation:

| # | Decides | Recommendation | Sections it changes |
|---|---|---|---|
| P8 | The language on a first visit: the browser's language, or always English | (a) browser language, else English | §4.3 step 3, §8.3 item 1 |
| P9 | The form of the switch | (a) a compact `<select>` with native names | §5.1 |
| P10 | The overview URLs, and the logo link target | (a) `/`, `/ja/`, `/ko/`; the logo goes to the overview in the current language | §5.2, §6 |
| P11 | Whether the content notice also shows in ja | (a) en/ko only | §5.3, §8.2 N3–N4 |
| P12 | The run-time mechanism (technical, no visible effect) | (a) as in §4 | §4 |
| P13 | The complete list of visible changes | (a) the list in §5.5 | §5.5 |

Also in `docs/STAGE2_STRINGS.md`: the rows marked ★ (app name, view names, short labels, rating words, the Korean Windows menu names, and the new privacy sentence). *(Decided on 2026-11-26; see its §5.)*

## 13. Reporting

Update `docs/HANDOFF.md`:
- status;
- what was done, per step, with commit hashes;
- the exact commands and results on this PC (pass/fail counts, the `test:browser` duration);
- the overview image sizes;
- the N5 property list;
- every `i18n.css` layout rule with its reason;
- open notes;
- `Next: Claude — Stage 2 gate (part 2A)`.

Add a CHANGELOG entry. Follow the archive rule. Then stop.
