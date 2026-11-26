# GATES

Every stage ends with a gate (PROMPT §1). Claude checks the stage's **Done when** criteria against the **evidence**: re-run tests, files, hashes, screenshots and CI runs. Claude does not rely on the author's report.

- **PASS**: the next assignment is written in HANDOFF.
- **FAIL**: the exact failures and fixes go to the author, who fixes only those items and hands the work back.
- **A second FAIL of the same gate**: Claude stops and asks the owner.

Every entry records: the date, the reviewer, the commit checked, every criterion with its evidence, and the result. Problems that do not block the gate go to "Open notes" in HANDOFF.

Machine safety during gates: one agent at a time; never a build and a headless browser at the same time; browser runs close what they start.

## Stage 0 (Claude, 2026-11-24)

No gate: Stage 0 sets up the repository and writes the Stage 1 assignment. It contains no app code.

## Stage 1 gate (planned; criteria in `docs/STAGE1_SPEC.md` §11)

- **Part 1A (code)**: Claude runs, on this PC, `npm ci`, `npm run check:data`, `npm run test:unit`, `npm run build` and then `npm run test:browser`, one at a time. Claude checks the GitHub Actions run for the same commit, the data hashes, the i18n coverage, and a sample of the parity checkpoints with their screenshots.
- **Part 1B (preview)**: after the owner connects Cloudflare Pages (HANDOFF, owner steps), Claude checks the preview URL of the Stage 1 branch.

| Part | Date | Commit | Result |
|---|---|---|---|
| 1A | 2026-11-25 | `4d57c88` | **FAIL** (first attempt): 5 test-coverage fixes for Codex (F1–F5 in HANDOFF). No app defect found. |
| 1A | 2026-11-25 | `f58879b` | **PASS (CI green on f58879b and a39dcfd, owner's report)** (attempt 2): F1–F5 verified; all local runs green. |
| 1B | 2026-11-25 | `b54d8f0` | **11–12 PASS, 13 after the merge.** Preview `https://stage1-foundation.kanjibridge-app.pages.dev` serves both pages, the redirect and the pinned data; 0 console and page errors; all five views are pixel-identical to the published kanji-bridge app. |

Note on 1A (2026-11-25, Claude, at the start of gate 1B): the owner reported that `build-and-test` on PR #1 passed on `f58879b` and on `a39dcfd` (a docs-only commit). The "pending CI" condition of attempt 2 is met, so gate 1A is **PASS**. Claude did not open the runs (no GitHub CLI login on this PC).

## Stage 1 gate, part 1A, attempt 1 (Claude, 2026-11-25): FAIL

- **Reviewer:** Claude (Claude Code), fresh session, on the owner's PC.
- **Commit checked:** `stage1-foundation` at `4d57c88` (local = `origin/stage1-foundation` after `git fetch`). Pull request #1.
- **CI:** GitHub Actions on PR #1 passed (1/1 checks, 2026-11-25). **This is the owner's report.** Claude did not open the run: this session's network was limited to npm/Playwright installs and git fetch/push.
- **Order of runs (one heavy job at a time):** `npm ci` → `check:data` → `test:unit` (without `dist/`) → `build` → `build.test.js` → `import:data` + `git status` → `test:browser` → two read-only probes in Chromium. Every server and browser was closed afterward (checked: no `chrome-headless-shell` processes, nothing listening on ports 4173, 4174 or 5173).
- **Environment:** Node v24.19.0, npm 11.17.0, Playwright 1.65.1 (Chromium build 1255), Windows 11.

### Done-when criteria (`docs/STAGE1_SPEC.md` §11, part 1A)

| # | Criterion | Evidence (Claude's own runs unless marked) | Result |
|---|---|---|---|
| 1 | `npm ci && npm run build` on this PC and in CI, no warnings except the `data.js` notice | `npm ci`: 38 packages, 0 vulnerabilities. `npm run build`: 17 modules, ~0.1 s. The only notice was `<script src="data.js"> … can't be bundled without type="module"`. CI: green per the owner. | PASS |
| 2 | `dist/` contents | Fresh build (Codex's earlier `dist/` was moved aside first). It has `index.html`, `app/index.html`, `app/data.js` with SHA-256 `3eb99e24…4af9`, `NOTICE.md`, `LICENSE-DATA`, `DATA-LICENSE.md`, `DATA-MANIFEST.json`, and 11 files in `app/licenses/`. | PASS on this PC. In CI it is not checked (`build.test.js` is skipped there; see F1). |
| 3 | Import is reproducible; `check:data`; hashes = §5; a wrong hash is refused | `npm run import:data` imported 17 files from `59156e1`. Afterward `git status --porcelain` was empty, and `check:data` passed. All 15 manifest hashes equal the §5 table. `tests/baseline/stage5_gate_harness.js` (`361e267c…`) and `tests/baseline/LICENSE` (`cf01390e…`) equal the `59156e1` blobs. The wrong-hash refusal is covered by `import_data.test.js` (passes). `../kanji-bridge` was read through git objects only: 0 working-tree changes, HEAD `59156e1` before and after. | PASS |
| 4 | `ja.json` has 115 keys; `i18n.test.js` | 115 unique keys. `i18n.test.js` passes. The only CJK in `src/**/*.js` and the two HTML pages is in the allowed parsing regexes (`src/app/lib/judge.js:41`, `src/app/main.js:47`, `src/app/main.js:272`). | PASS |
| 5 | Render parity P1–P8 on fields 1–9 (and 10 at **S**), plus CSS rules, on this PC and in CI | `npm run test:browser`: **28 passed in 11.3 min** (1 worker). The HTML report has **no** screenshot-diff attachments, so every checkpoint screenshot was pixel-exact on this PC in this run, and the Windows tolerance (HANDOFF note 8) was never used. CI: green per the owner. All listed checkpoint IDs exist. Coverage gaps: P4 seeds no `null` value (F3), and reset is only tested from near-empty storage (F4). | PASS on the runs. Coverage gaps F3 and F4. |
| 6 | 0 console and page errors; only allowed hosts; no rendered `undefined`/`NaN`/`null`/`[object` | The suite's checks pass. **But** the runner exempts *every* console error that contains "Failed to load resource", not only aborted font-host requests (§6.4), so a same-origin 404 would go unnoticed (F2). Independent probe (fresh load of both pages, all five tabs, every console error logged with its URL): the only console errors were the aborted `fonts.googleapis.com` stylesheet; 0 page errors; no other host. | PASS on evidence. The test is too lenient (F2). |
| 7 | `gate.spec.js`, `baseline-sanity.spec.js`, `site.spec.js` and all unit tests pass | All pass, but: (a) `build.test.js` **skips** when `dist/` is missing. `test:unit` runs before `build` in both `npm test` and `ci.yml`, so it is always skipped in CI, and locally it reads whatever older `dist/` exists (measured: "6 passed, 1 skipped" without `dist/`) (F1). (b) `gate.spec.js` covers only the counts, the 1,242/2,164 totals and the About text. The other §6.6 items are missing (F5). The baseline harness passes (tone: deck 6983, zhBad 0, viBad 0, glyphBad 0, ptLenMismatch 0). | **FAIL** (F1, F5) |
| 8 | CI green; actions pinned by SHA; `contents: read`; no secrets | `ci.yml`: `actions/checkout@11bd7190…` (v4.2.2), `actions/setup-node@49933ea5…` (v4.4.0), `actions/upload-artifact@ea165f8d…` (v4.6.2), all full 40-character SHAs. `permissions: contents: read` at the top level, no job-level override, no `secrets.*`, no `pull_request_target`. Job name `build-and-test`; Node from `.nvmrc`. Green per the owner. The SHA-to-tag mapping was not checked online (network rule). | PASS |
| 9 | No secret in the repository or the build output | A grep of all tracked files and of every added line in the full git history (`service_role`, `sb_secret_`, private-key headers, JWT, AWS, GitHub, Slack and Google key patterns) finds only the test's own pattern list. `data.js`: 0 hits. No env, key or credential file was ever committed. `.gitignore` ignores `.env`, `.env.local`, `.env.production`, `.dev.vars`, `.dev.vars.prod`, `*.pem`, `*-key.json` and `*credentials*.json` (checked with `git check-ignore`). The `dist/` secret scan in `build.test.js` passes locally, but does not run in CI (F1). | PASS (CI part via F1) |
| 10 | HANDOFF records commands, results and the `test:browser` duration | Recorded (10.3 min on Codex's run). No CI run URL: the pull request was opened by the owner after Codex's session. | PASS |
| — | `.nvmrc` | `24.19.0` plus a newline; matches D20 and the PC. | PASS |

### Extra checks

1. **Raw `{{app.title}}` in Codex's preview.** Claude's probe loaded every page path in Chromium (`/`, `/index.html`, `/app/`, `/app/index.html`, `/app`, two 404 paths) from the **vite dev server** and from **vite preview** of the build, and searched every `.html`/`.js`/`.css` file in `dist/`.
   - Every served page has `<title>漢字ブリッジ</title>`, and there is no `{{` in the raw HTML or the DOM. `dist/` has no `{{` anywhere.
   - The raw placeholder appears **only** when a source file (`index.html` or `app/index.html`) is opened directly (`file://`) or served as-is by a static server pointed at the repository root. Most likely Codex's preview did that.
   - The plugin (`vite/i18n-html.js`) also throws on an unknown key or any leftover `{{`, so such a build fails.
   - **Conclusion:** no raw placeholder can reach a user from the production build, provided Cloudflare serves `dist/` (owner step A8). This is not a FAIL item.
   - **The test is still missing where it matters:** `build.test.js` checks only `dist/app/index.html` (not `dist/index.html`) and never runs in CI. That is fix **F1**. Gate 1B re-checks the deployed pages for `{{`.
2. **Codex's HANDOFF notes:**
   - **Note 7 (retained `kb_custom` bug): acceptable for 1A**, kept under Open notes. STAGE1_SPEC says to keep v2 bugs and record them. Claude confirmed it on the baseline: a string, number, object or `null` in `kb_custom` makes app v2 throw at `rawCustom.filter`, and the new app throws the same way. Claude found two more retained v2 bugs of the same kind: `null` in `kb_srs` ("Cannot convert undefined or null to object") and `null` in `kb_rules` ("reading 'k'"). Both apps fail identically. Added as Open note 9.
   - **Note 8 (Windows raster tolerance): acceptable for 1A**, kept under Open notes. The tolerance is limited to `process.platform === 'win32'`, at most 64 pixels with a delta of at most 1, and only after five re-shots. DOM, CSS rules, computed styles, focus, scroll, storage and form state are still compared exactly. Linux CI still requires exact pixels. In Claude's run it was not needed at all (0 diff attachments).
3. **P1–P7** were confirmed by the owner on 2026-11-24 and are now **D14–D20** in `docs/DECISIONS.md`.

### Other observations (not blocking; written to HANDOFF Open notes where they matter later)

- **Module split.** The pure logic was split out: `data/model.js`, `lib/*`, `storage.js`, `dom.js` and `i18n/`. The UI (views, nav, keyboard, About, reset) stays as one `initApp()` closure in `src/app/main.js`, a near line-for-line port of the original script. STAGE1_SPEC §3 calls its module list "a guide", and the binding rules hold: no module-level side effects except `buildModel`, no globals, and reset identical to v2 lines 849–854 (Claude compared them). This is not a Done-when item, but Stage 2's run-time language switch will want the views split out first (Open note 10).
- **P1 walk.** The single continuous walk was split into nine tests, each starting from fresh storage. Every checkpoint ID is present, and the cross-view steps (glyph → ff badge; quiz answers before the glyph filters) are re-created inside the tests. The one loss is that P1-59 resets almost-empty storage (F4).
- P1-16 and P1-49 open the `<details>` by setting `open` and dispatching a synthetic `toggle` event, not by clicking the `<summary>`. It is the same on both pages. A nit, not a fix item.

### Result

**FAIL.** The app code itself shows no defect: parity, errors, requests, data, i18n, CI configuration and secrets all check out. Fix items F1–F5 in `docs/HANDOFF.md` are test-coverage gaps against STAGE1_SPEC §6 and the gate's own requirement for a `{{` test. Codex fixes only those items. Then Claude re-runs 1A. A second FAIL of this gate goes to the owner (rule above).

## Stage 1 gate, part 1A, attempt 2 (Claude, 2026-11-25): PASS pending CI

- **Reviewer:** Claude (Claude Code), fresh session, on the owner's PC.
- **Commit checked:** `stage1-foundation` at `f58879b` (local = `origin/stage1-foundation` after `git fetch`). Pull request #1.
- **CI:** the owner reported a GitHub Actions run on `f58879b` as **running** (started 2026-11-25 12:48). **No final result reached this session.** Claude did not open the run (network rule: npm/Playwright installs and git fetch/push only).
- **Order of runs (one heavy job at a time):** `npm run test:build` with `dist/` moved out of the repository → `npm ci` → `npm test` (check:data → test:unit → build → test:build → test:browser) → F1 `{{x}}` proof and rebuild → one read-only Chromium probe (F2, F4). Every server and browser was closed afterward. Checked: no Playwright browser, vite or baseline-server process, and nothing listening on ports 4173, 4174 or 5173. The `chrome.exe` processes still running were the owner's own Google Chrome, and two idle Codex-app helper daemons were present from the start. The probe script and the moved `dist/` were deleted.
- **Environment:** Node v24.19.0, npm 11.17.0, Playwright 1.65.1, Windows 11.

### 1. App code unchanged

`git diff --stat 4d57c88..f58879b -- src app/index.html index.html vite` is **empty**. Codex's own commit (`54b10c8..f58879b`) touches only `.github/workflows/ci.yml` (one line), `package.json` (scripts), `tests/` and the docs. `public/`, `scripts/`, `tests/baseline/`, the lockfile and the Vite/Vitest/Playwright configs are unchanged. All 45 non-empty lines Codex removed from HANDOFF appear verbatim in HANDOFF_ARCHIVE.

### 2. Fix items

| Fix | What was checked | Result |
|---|---|---|
| **F1** | `test:unit` = `vitest run --exclude tests/unit/build.test.js`; new `test:build` = `vitest run tests/unit/build.test.js`; `npm test` and `ci.yml` both run `test:build` right after `build`. `skipIf` is gone: both tests assert `existsSync('dist')`. Every file under `dist/` is walked; every `.html` is checked for `{{` with the file name in the message, and the two entry pages must be among them. Hash, 11 licence files and secret scan are kept. **Claude's own proofs:** (a) `dist/` moved away → `test:build` exit 1, **2 failed, 0 skipped**, `dist/ is missing; run npm run build first`. (b) `{{x}}` appended to the built `dist/index.html` → exit 1, 1 failed / 1 passed: `AssertionError: dist\index.html: unfilled {{ placeholder: expected true to be false // Object.is equality` (the same line Codex recorded in HANDOFF). `npm run build` → no `{{` left; `test:build` 2/2. (c) An extra `dist/app/licenses/probe.html` containing `{{y}}` → it is named in the failure (and the licence count catches the extra file). After it was removed: 2/2. | **PASS** |
| **F2** | `tests/browser/lib/console-errors.js`: a console error is exempt only if its text has "Failed to load resource", **and** its `location().url` is in that page's list of URLs that the route aborted, **and** that URL's host is exactly `fonts.googleapis.com` or `fonts.gstatic.com`. The route records the URL before `route.abort()`. Only non-`127.0.0.1` requests are aborted, so a same-origin URL can never be exempt. Exempt errors go to `fontErrors` with their URLs; all others fail `close()`. `gate.spec.js` uses the same `createParity`, so it applies the same rule. 5 unit cases. **Probe (real Chromium, vite preview of the build, the same route and the repository's classifier):** after load, 0 counted errors. One injected `<img src="/no-such-file-probe.png">` → **counted**: `Failed to load resource: … 404 (Not Found)` at `http://127.0.0.1:4173/no-such-file-probe.png`. The only exempt entry was the aborted `fonts.googleapis.com/css2?…` stylesheet. | **PASS** |
| **F3** | `P4-null` seeds JSON `null` in exactly the 11 listed keys plus raw `not-json` in `kb_custom`, and checkpoints all five views. `kb_srs`/`kb_rules` `null` and non-array `kb_custom` are left out (Open notes 7 and 9). Passed (31.2 s). | **PASS** |
| **F4** | `P1-reset-filled` uses the P3 seed (`returningStorage`, now shared with P3), then one card review, one glyph quiz answer, one false-friend rating and one 読解 mark (each asserted except as noted below), then `#reset` twice, then cards + four tabs through `checkpointViews` (snapshot includes all localStorage). P1-58/59 are kept. Passed (1.3 min). **Nit:** the 読解 step's assertion (`#unknownreview` contains わからない) is already true before the click, because the seeded unknown word is in passage 1. The probe shows that the click does add a real mark (`kb_unknown` `["w00301"]` → `["w00301","w00339"]`). Not blocking: the action happens on both pages, and the scenario's purpose is reset from a filled store. HANDOFF Open note 12. | **PASS** |
| **F5** | Seven gate tests on the new app's DOM/localStorage only (the baseline supplies answers, IDs and the quiz-input count). (a) `kb_rules` read before P1-09 and compared after P1-13. (b) The quiz-input count is read from the baseline page after its quiz settles to 2,164 rows. (c) `openLongList` clicks the nav button and counts the rows in the same `evaluate`: ≤ 30 and > 0, for both `ff` and `glyph`. (d) Claude matched every distinct "Harness origin" label of §6.5 P1 (`counts`, `explain`, `cards-initial` … `armed text`, `everything reset (storage)`) to a named assertion; none is missing. The §6.6 extras are also present: the title, the EDRDG sentence, the repository link, `AI（Google Gemini）`, 2,164 rows in list and quiz, and 1,242 tiles. | **PASS** |

### 3. Re-run on this PC

- `npm ci`: 38 packages added, 39 audited, **0 vulnerabilities**.
- `npm test`: **exit 0**, 840 s wall clock.
  - `check:data`: "Imported data and baseline files match DATA-MANIFEST.json."
  - `test:unit`: **7 files, 20 passed**.
  - `build`: 17 modules. The only notice was the classic `<script src="data.js">` one, and the log has 0 lines containing "warn".
  - `test:build`: **2 passed**.
  - `test:browser`: **36 passed in 13.8 min** (1 worker; 0 failed, 0 skipped, 0 flaky).
- The HTML report holds only `index.html`: **no** screenshot-diff attachments. Every checkpoint screenshot was pixel-exact, and the Windows tolerance (Open note 8) was not used.

### 4. Done-when criteria that attempt 1 marked FAIL or "via F1"

| # | Attempt 1 | Now | Result |
|---|---|---|---|
| 2 | PASS locally; CI part via F1 | `test:build` (pinned `data.js` hash, 11 licences, `dist/index.html`, every built HTML) runs after `build` in `ci.yml` and cannot skip. Locally 2/2 on a fresh build. | PASS (CI part: pending the CI result) |
| 5 | PASS; coverage gaps F3, F4 | P4-null and P1-reset-filled were added, and all parity checkpoints pass pixel-exact on this PC. | PASS (CI part: pending the CI result) |
| 6 | PASS on evidence; test too lenient (F2) | Exemption narrowed and proven by the probe. All scenarios: 0 counted console errors, 0 page errors, no other host. | PASS |
| 7 | **FAIL** (F1, F5) | `build.test.js` now runs (2/2, cannot skip); `gate.spec.js` is complete (7/7); `baseline-sanity` and `site` pass; unit tests 20/20. | PASS |
| 8 | PASS (green per owner, on `4d57c88`) | `ci.yml` change: one added `npm run test:build` line. Pins, `contents: read`, and no secrets are unchanged. Green CI on `f58879b`: **not yet reported**. | **Pending CI** |
| 9 | PASS; CI part via F1 | The `dist/` secret scan runs after the build in CI. Lines added since `4d57c88` contain no secret pattern; the only hits are this file's own text and the test's pattern list. | PASS (CI part: pending the CI result) |

### Result

**PASS pending CI.** Every fix item is done and was proven by Claude's own runs, and no app code changed. Only the green CI run on `f58879b` is missing.
- **CI green:** the gate is **PASS** without another review. The owner records the run under "Owner answers" in HANDOFF, then does steps A and B.
- **CI red:** the gate is **FAIL**, the second one, and goes to the owner (rule above). No new fix list goes to Codex.

## Stage 1 gate, part 1B (Claude, 2026-11-25): items 11–12 PASS, item 13 after the merge

- **Reviewer:** Claude (Claude Code), on the owner's PC. The session was interrupted once by a PC restart during item 12. After the restart, Claude re-checked the git state (clean, `b54d8f0` = `origin/stage1-foundation`) and the screenshots (all 11 from the finished last run were present), then continued.
- **Commit checked:** `stage1-foundation` at `b54d8f0` (Claude's docs commit that records owner steps A and B; its push created the first preview). `git diff f58879b..b54d8f0` touches only `docs/`, so the app is the one gate 1A checked.
- **Preview deployment:** the GitHub check run "Cloudflare Pages" (app "Cloudflare Workers and Pages") on `b54d8f0`: **completed, success** ("Deploy successful!", 2026-11-26 01:06:50 UTC). Deployment URL `https://6c84e7d7.kanjibridge-app.pages.dev`, branch URL `https://stage1-foundation.kanjibridge-app.pages.dev`. Read without login from the public GitHub API (`/commits/<sha>/check-runs`). The plain `/status` endpoint lists nothing, because Cloudflare reports through a check run.
- **CI:** the same API shows `build-and-test` on `b54d8f0`: **completed, success** (2026-11-26 01:14:27 UTC). This is the first CI result that Claude read directly rather than from the owner's report.
- **Build settings (Open note 11):** the owner reported output directory `dist`. The served pages prove it: `/` and `/app/` are byte-identical to a local `npm run build` of the same commit (SHA-256 `ed699160…f054` and `d819e4b9…2d33`), with the same hashed asset names (`app-kjB9kN6M.js`, `app-HrzICvdG.css`, `overview-C4jC_1Dd.css`).
- **Environment:** Node v24.19.0; Playwright 1.65.1 with its Chromium (build 1255); Windows 11; network on.

### Item 11: pages, redirect and data (both URLs above gave identical results)

| Path | Status | Evidence | Result |
|---|---|---|---|
| `/` | 200 `text/html` | The placeholder: `<title>漢字ブリッジ</title>`, `<h1>漢字ブリッジ</h1>` and a link "アプリを開く" to `/app/`. 0 occurrences of `{{`. | PASS |
| `/app/` | 200 `text/html` | The app (6,458 bytes; loads `/assets/app-kjB9kN6M.js`, `/assets/app-HrzICvdG.css`, the Google Fonts stylesheet and `data.js`). 0 occurrences of `{{`. | PASS |
| `/app` | **308** | `Location: /app/` | PASS |
| `/app/data.js` | 200 `application/javascript` | 6,626,537 bytes, SHA-256 `3eb99e245782a1aae7e76144bd656be9648c7b075441b70f2e1a6f7f0eb84af9` (the pinned hash) | PASS |
| `/app/NOTICE.md`, `/app/LICENSE-DATA`, `/app/DATA-LICENSE.md`, `/app/DATA-MANIFEST.json` | 200 each | Each is byte-identical to the file in `public/app/` (SHA-256 compared) | PASS |

**Open note 11 (`{{` on deployed pages): done.** The raw HTML of `/` and `/app/` has no `{{`, and the rendered `/app/` text in all five views has none either (item 12 probe).

### Item 12: console errors and side-by-side comparison

Method: a temporary script in the git-ignored `test-results/gate1b/` (deleted afterward) used the repository's `@playwright/test` Chromium. It ran a fresh context per site, viewport 1280×720, network on, so Google Fonts loaded. It opened `/app/`, clicked the five `#nav` buttons in order, waited until the page height stopped changing, and took a screenshot of each view. It also took one of `/`. The reference is the published kanji-bridge app at `https://hanjejeme2023-oss.github.io/kanji-bridge/`. That page is the app itself, and its HTML is byte-identical to `59156e1:app/index.html` (SHA-256 `904be17b…7cac`); its `data.js` has the pinned hash. Screenshots were capped at the top 6,000 px of each view: a full-page shot of the glyph list (about 390,000 px) timed out. The heights below are the full page heights.

| Check | Preview | Published | Result |
|---|---|---|---|
| Console errors (`/app/`, all five views) | **0** | 0 | PASS |
| Page errors | **0** | 0 | PASS |
| `/` console / page errors | 0 / 0 | — | PASS |
| Hosts requested | the preview origin, `fonts.googleapis.com`, `fonts.gstatic.com` | `hanjejeme2023-oss.github.io` plus the same two font hosts | PASS |
| Failed requests, responses ≥ 400 | none | none | PASS |
| `undefined`, `NaN`, `[object`, `{{` in the page text | none | none | PASS |
| Header (counts) | カード 4,051 / 音のルール 8 / 偽の友達 1,242 / 読解 80 / 字体 2,164 / 今日 20 枚 習得 0/6983 | the same | PASS |

**Screenshots, run 1 (as a learner would see it):** cards, ff, read and glyph were **byte-identical PNGs**. Rules showed a different example kanji (作 vs 識) with different answer choices. That is not a difference: the rules view picks its example with `Math.random()` (`src/app/main.js:265`, the same as v2 at `59156e1`). The glyph page height also differed (154,573 vs 221,830 px), because the chunked list rendering (`src/app/main.js:116–131`) was still adding rows when the height was read.

**Screenshots, run 2 (the same seeded `Math.random` injected into both sites; waited until the height was stable for 2 s):** all five pairs are **byte-identical PNGs**. The full page heights are equal: cards 862, rules 982, ff 108,156, read 831, glyph 389,271 px.

| View | SHA-256 of both PNGs (first 16) |
|---|---|
| cards | `d6ded5b554945c0a` |
| rules | `a91915a65079bff3` |
| ff | `d16ce50cf85b1370` |
| read | `26cbcd478b0f1c11` |
| glyph | `1f2034c67f3b45d0` |

**Visible differences from the published app: none.** The screenshots (`preview-<view>.png`, `published-<view>.png`, `preview-overview.png`; run 2) are on the owner's PC at `C:\Users\Anna Tran\kb-gate1b-shots\`. They are not committed. The owner looks at them, as §11 item 12 asks. The script closed every context and the browser; afterward no headless Chromium process was running.

### Item 13: production from `main` (after the merge)

This can only be checked after the owner merges PR #1. The first production build on `main` (`94a4480`) failed because `main` has no `package.json` yet (owner's report). Procedure:

1. The owner merges PR #1, then opens `https://kanjibridge-app.pages.dev/app/` and reports what they see (and the production deployment status) under "Owner answers" in HANDOFF.
2. The next Claude session (the start of Stage 2) runs the item 11 checks on `https://kanjibridge-app.pages.dev`: `/`, `/app/`, the `/app` redirect, the `data.js` hash, the four attribution files, and no `{{`. It records them here as "Stage 1 gate, part 1B, item 13".

### Result

**Items 11–12 PASS; item 13 after the merge.** The preview serves the production build of the gated app, with the pinned data, 0 console errors and pixel-identical views. Nothing blocks the merge. Owner steps A11 (build comments) and A13 (preview access policy) are still unchecked. Neither one blocks the merge.
