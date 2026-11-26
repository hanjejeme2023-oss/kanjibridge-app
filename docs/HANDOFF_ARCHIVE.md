# HANDOFF ARCHIVE

## 2026-11-25 — Codex — from 94a4480

## Current status (2026-11-24)

- **Stage 0 done** (Claude). The repository is scaffolded: licences, `.gitignore`, `.gitattributes`, README, and the docs in `docs/`. The Stage 1 assignment is `docs/STAGE1_SPEC.md`. The facts behind it are in `docs/STAGE1_INVENTORY.md` (UI strings, localStorage, views, external requests, how `data.js` is used). There is no app code yet.

- **Decisions:** D1–D13 (owner). **P1–P7 are proposals awaiting the owner** (`docs/DECISIONS.md` §B). Stage 1 is specified under them, and the owner confirms or changes them by the Stage 1 gate at the latest. P4 (0 required approvals) affects the branch protection steps below.

**Codex — Stage 1 (Foundation):** implement `docs/STAGE1_SPEC.md` completely, on the branch `stage1-foundation`, and open a pull request to `main` without merging it. Report as described in the spec's §9, then stop. Before you start, the owner pushes Stage 0 (step A0).

Next: Codex — Stage 1

Text removed from `docs/HANDOFF.md` is moved here **verbatim**, in the same commit as the removal. Each block sits under a heading with the date, the author and the commit it was taken from. Nothing is reworded. The newest block goes at the bottom.

*(No entries yet.)*

## 2026-11-25 — Claude — from 4d57c88

From "Current status (2026-11-25)":

- **Stage 1 done locally** (Codex, 2026-11-25). Branch `stage1-foundation` is pushed at `f0ccd61`. Vite builds the overview at `/` and the exact app-v2 UI at `/app/`; the pinned data/baseline importer, module split, 115-key Japanese i18n layer, unit tests, P1–P8 browser parity suite and SHA-pinned GitHub Actions workflow are implemented. The optional `windows-latest` CI job was not added because this PC is the Windows validation.

- **Pull request / CI:** `git push -u origin stage1-foundation` succeeded. `gh auth status` reports that GitHub CLI is not logged in, so Codex could not open the pull request. The owner must open `stage1-foundation` → `main`; no CI run URL exists until that pull request is opened because CI runs on pull requests and pushes to `main` only.

- **Decisions:** D1–D13 (owner), and owner-confirmed P1–P7 (`docs/DECISIONS.md` §B). P4 (0 required approvals) affects the branch protection steps below. Claude records the confirmed proposals as decisions at the Stage 1 gate.

## NEXT ASSIGNMENT

**Claude — Stage 1 gate (part 1A):** after the owner opens the pushed `stage1-foundation` branch as a pull request to `main`, review the implementation and run `docs/GATES.md` part 1A. Record the owner's confirmed P1–P7 as decisions at the gate. Do not merge.

Next: Claude — Stage 1 gate (part 1A)

## 2026-11-25 — Codex — from 54b10c8

From "Current status (2026-11-25)":

- **Stage 1 gate 1A: FAIL, first attempt** (Claude, 2026-11-25, commit `4d57c88`; details in `docs/GATES.md`). The app itself checks out: parity 28/28 on this PC, pixel-exact screenshots, no console errors, data hashes, i18n, CI config and secrets. The failure is five test-coverage gaps, F1–F5 under "NEXT ASSIGNMENT" below. Codex fixes only those, then Claude re-runs 1A. A second FAIL goes to the owner.

- **Verification on this PC:** `npm run check:data` passed; `npm run test:unit` passed (7 files, 16 tests, 3.56 s in the final run); `npm run build` passed (17 modules, 129 ms); `npm run test:browser` passed (28 tests, 10.3 min, run serially with one worker); therefore `npm test` passed. Afterward, `npm run import:data` imported 17 files from `59156e119bb4ec1652ac573e9cf821c0d064e9dc` and produced no data diff. `npx playwright install chromium` installed Chromium 159.0.8154.6 (Playwright build v1255). All browsers and test servers were closed.

## NEXT ASSIGNMENT

**Codex — Stage 1 gate 1A fixes (F1–F5).** Work on `stage1-foundation` (PR #1) and commit with the prefix `[Codex] Stage 1 fix:`.

- Fix **only** these five items.
- They are test and CI changes. **Do not change app code or pages** (`src/`, `app/index.html`, `index.html`, `vite/`). If a fix seems to need such a change, stop and write why here.
- Evidence for every item is in `docs/GATES.md`, "Stage 1 gate, part 1A, attempt 1".

**F1. A `{{` test on the built HTML that runs in CI and cannot be skipped.**
- `tests/unit/build.test.js` checks only `dist/app/index.html` and skips when `dist/` is missing.
- `test:unit` runs before `build` in `npm test` and `ci.yml`, so in CI this file is always skipped. Locally it can read an old `dist/`.
- Change it so that:
  - every `.html` file under `dist/` (at least `dist/index.html` and `dist/app/index.html`) is checked for `{{`, and a failure names the file;
  - the build checks (`{{`, the `data.js` hash, the 11 licences, the secret scan) run **after** `npm run build` and **fail** if `dist/` is missing. For example: add a script `test:build` = `vitest run tests/unit/build.test.js`, remove the `skipIf`, leave the file out of `test:unit`, and run `npm run test:build` right after `npm run build` in both `npm test` and `.github/workflows/ci.yml`;
  - before committing, you prove it fails: put `{{x}}` into a built `dist/index.html` by hand (do not commit it), run the check, and paste the failing line into this file. Then rebuild.

**F2. Exempt only aborted font-host requests from the console-error check (STAGE1_SPEC §6.4).**
- `tests/browser/lib/parity.js` and `tests/browser/gate.spec.js` ignore *every* console error that contains "Failed to load resource". A same-origin 404 would pass unnoticed.
- Ignore a console error only when it is "Failed to load resource" **and** `message.location().url` is on `fonts.googleapis.com` or `fonts.gstatic.com` **and** that request was aborted by the route. Count every other console error.

**F3. P4: add the `null` type and the safe `kb_custom` case.**
- STAGE1_SPEC §6.5 P4 lists `null`, but no key is seeded with `null`.
- Add a second P4 scenario ("P4-null") with the initial view of all five tabs as checkpoints. Seed:
  - `null` in each of these 11 keys, where app v2 shows 0 errors (measured at the gate): `kb_mute`, `kb_auto`, `kb_target`, `kb_newtoday`, `kb_ruletest`, `kb_ex_open`, `kb_ffcard`, `kb_read`, `kb_unknown`, `kb_glyphquiz`, `kb_glyph`;
  - `kb_custom` = the invalid JSON text `not-json`, which app v2 also handles.
- Leave out `kb_srs` = `null`, `kb_rules` = `null` and non-array `kb_custom`. App v2 throws on these (Open notes 7 and 9).

**F4. Reset from a filled state.**
- The P1 walk now runs as nine tests that each start from fresh storage. As a result, P1-58/59 reset storage that is almost empty.
- Keep those checkpoints, and add a scenario ("P1-reset-filled"):
  - seed the P3 returning-learner storage;
  - do one card review, one glyph quiz answer, one false-friend card rating and one 読解 "わからない" mark;
  - click `#reset` twice;
  - checkpoint the cards view (storage included), then nav to the other four tabs with one checkpoint each.

**F5. Complete `tests/browser/gate.spec.js` as STAGE1_SPEC §6.6 asks.**
- Add readable assertions on the **new app alone** (DOM and localStorage only):
  - (a) `kb_rules` is unchanged by the rule table test (the P1-09…13 actions);
  - (b) the number of glyph quiz inputs equals the baseline's (read that count from the baseline page);
  - (c) right after the click that opens the glyph list and the false-friend list, at most 30 rows/tiles exist (counted in the same `evaluate` as the click);
  - (d) one assertion for each distinct label in the "Harness origin" column of §6.5. Examples: the tone-stripped vi answer is judged right; Space flips the card; Enter judges a rule cell; reopening empties the inputs but keeps the colour; `paozi examples 2`; 20 per round; a miss returns to the end; the queue shrinks on OK; `kb_unknown` has the mark; `kb_read` has p0; the left passage gets ✓; a tab switch marks the passage read; 還 both readings are right and its usage opens; 行 is wrong; the 偽の友達 badge opens the tile focused; mute is stored; the tile toggle replaces in place; Enter closes the tile; About opens, closes and closes on Esc.
- A test may cover several labels. Name each label in the assertion message.

**After the fixes:**
- Run `npm ci`, then `npm test` (check:data → unit → build → test:build → browser, one after another).
- Record in this file:
  - the pass/fail counts;
  - the `test:browser` duration;
  - the F1 proof line.
- Push `stage1-foundation`. Do not merge. Add a CHANGELOG entry.
- The owner then reports the CI result on PR #1 under "Owner answers".

Next: Codex — Stage 1 gate 1A fixes (F1–F5)

## 2026-11-25 — Claude — from f58879b

From "Current status (2026-11-25)":

- **F1–F5 fixes completed** (Codex, 2026-11-25): tests, npm scripts and CI only. The required `npm ci` and sequential `npm test` passed: 20 unit tests, 2 build checks, 36 browser tests (17.3 min). Full evidence and the intentional F1 failure are below. The last gate result is still attempt 1 FAIL; next is Claude — Stage 1 gate 1A, attempt 2. CI for this fix commit awaits the owner's report on PR #1.

## Codex — F1–F5 fix evidence (2026-11-25)

- **Starting point:** clean `stage1-foundation` at `54b10c8a8268aab858200b2b7f4bfe19b0063607` (Claude's gate commit), confirmed before editing. The supplied workspace was the older `kanji-bridge`; the work was done in the sibling `kanjibridge-app`. The older repository was not modified.
- **Scope:** tests, `package.json` scripts, `.github/workflows/ci.yml`, and these handoff/changelog records only. No changes to `src/`, `app/index.html`, `index.html`, `vite/`, the imported baseline/data, dependencies or the lockfile.
- **F1:** `test:unit` excludes `build.test.js`; `test:build` runs immediately after `build` in both `npm test` and CI. Both build tests fail if `dist/` is missing (no skip). The recursive HTML check requires both entry pages, checks every `.html` file, and names the failing file. The pinned data hash, 11 licence files and whole-build secret scan remain checked.
- **F2:** parity and gate checks use the same console classifier. A resource error is exempt only for an exact URL recorded as aborted by the route on one of the two font hosts; exempt errors are recorded separately with their URLs. Five unit cases cover both allowed hosts, same-origin 404s, un-aborted/different font URLs, other hosts, other messages and missing locations. Every other console error is counted. Baseline fixture reads also block non-local requests; parity contexts close in `finally` even if error assertions fail.
- **F3:** `P4-null` seeds all 11 specified safe keys with JSON `null`, plus raw `not-json` in `kb_custom`, and checkpoints all five views. The retained v2 bugs in Open notes 7 and 9 remain excluded.
- **F4:** `P1-reset-filled` shares the exact P3 returning-learner seed, saves a card review, a glyph quiz answer, a false-friend rating and a reading unknown mark, clicks reset twice, then checkpoints cards and all other views including storage. P1-58/59 remain. Each long list settles before leaving; after the saved glyph answer, list mode releases the off-screen quiz inputs before reset.
- **F5:** seven readable gate tests name the Harness-origin labels and assert through the new app's DOM/localStorage. They cover rule storage isolation, quiz-input count read from the baseline page, same-evaluate initial chunk limits, all card/rule/false-friend/reading/glyph states, level counts, queue order and round lengths, usage links and focus, mute, in-place tile replacement, About and reset. The baseline quiz page is closed immediately after reading its count; glyph answers and filters are separate tests to stay within the existing timeout.

**F1 negative proof:** after a build, appended `{{x}}` by hand to the ignored `dist/index.html`, then ran `npm run test:build`. Exit **1**; **1 failed, 1 passed**. Exact failing line:

```text
AssertionError: dist\index.html: unfilled {{ placeholder: expected true to be false // Object.is equality
```

Then `npm run build` removed the marker and `npm run test:build` passed **2/2**. The injected file is not committed.

**Verification after the fixes (one heavy job at a time):**

- `npm ci`: PASS, 38 packages installed, 39 audited, 0 vulnerabilities.
- `npm test` runs `check:data → test:unit → build → test:build → test:browser` sequentially.
- `check:data`: PASS; imported data and baseline match the manifest.
- `test:unit`: **7 files, 20 passed, 0 failed, 0 skipped**, 5.47 s.
- `build`: PASS, 17 modules, 142 ms; only the existing classic `data.js` bundling notice.
- `test:build`: **1 file, 2 passed, 0 failed, 0 skipped**, 498 ms.
- `test:browser`: **36 passed, 0 failed, 0 skipped**, **17.3 min**, one worker. Includes the baseline harness, seven expanded gate tests, all existing parity checkpoints, `P4-null`, `P1-reset-filled` (1.2 min in this final run), and site/assets. Console/page-error and request checks passed. Therefore the full `npm test` exited **0**.
- Exploratory browser run: 7 passed, 1 failed (6.3 min). The new filled-reset setup navigated away during chunk rendering, leaving unequal partial hidden DOMs. Settling between actions fixed the setup; its focused rerun passed (1/1, 2.7 min). The final scenario additionally returns to glyph list mode after saving the answer to reduce browser load. No app change was needed.
- **Cleanup:** all test browsers and servers closed. After the suite, 0 `chrome-headless-shell` processes and 0 listeners on ports 4173, 4174 or 5173. Environment: Node v24.19.0, npm 11.17.0, Playwright 1.65.1 on Windows.
- **Delivery:** `stage1-foundation` only (PR #1), no merge; protected app/data/dependency paths still match `54b10c8`. Commit prefix `[Codex] Stage 1 fix:`. The owner reports the pushed commit's CI result under Owner answers.
- **CI for this fix commit:** pending the owner's report on PR #1. No CI request was made; external network use is limited to npm and the requested git push (the existing Playwright installation was reused).

## NEXT ASSIGNMENT

**Claude — Stage 1 gate 1A, attempt 2.** Review `stage1-foundation` (PR #1), re-check F1–F5 against the first-attempt findings in `docs/GATES.md` and the evidence above, and run the gate's required checks. The owner supplies the new CI result under "Owner answers". Record the gate result in `docs/GATES.md`; a second FAIL goes to the owner. The existing owner steps and gate 1B remain in force.

Next: Claude — Stage 1 gate 1A, attempt 2

## 2026-11-25 — Claude — from a39dcfd

From "Owner answers":

*(The pages.dev URLs and any notes from steps A and B go here.)*

## 2026-11-25 — Claude — from b54d8f0

From "Current status (2026-11-25)":

- **Stage 1 gate 1A, attempt 2: PASS pending CI** (Claude, 2026-11-25, commit `f58879b`; details in `docs/GATES.md`).
  - No app code changed since attempt 1. F1–F5 were each verified with Claude's own proofs: the `{{x}}` and missing-`dist/` failures, and a real-Chromium probe that shows a same-origin 404 is now counted.
  - `npm ci`, then `npm test` on this PC: exit 0. Unit 20/20, build checks 2/2, browser **36/36 in 13.8 min**, every screenshot pixel-exact.
  - **The only open item is CI on `f58879b`.** At the gate it was still running (owner's report) and no result came in. Green → the gate is PASS. Red → the gate is a second FAIL, decided by the owner (NEXT ASSIGNMENT below).

From "Current status (2026-11-25)" (replaced by an updated bullet):

- **Pull request / CI:** the owner opened PR #1 (`stage1-foundation` → `main`). GitHub Actions passed on it (1/1 checks, 2026-11-25, owner's report). GitHub CLI is not logged in on this PC, so agents cannot open pull requests or read CI runs. After each push, the owner reports the CI result (and, if possible, the run URL) under "Owner answers".

From "Open notes (for later stages)":

11. Stage 1 gate 1B (Claude): check that the Cloudflare build output directory is `dist` and that no deployed page (`/`, `/app/`) contains `{{`. A raw `{{app.title}}` appears only if the source HTML is served unbuilt (gate 1A, extra check 1).

From "NEXT ASSIGNMENT":

**Owner — confirm CI on `f58879b`, then steps A and B. After that: Claude — Stage 1 gate 1B.**

Gate 1A, attempt 2 is **PASS pending CI** (`docs/GATES.md`). Everything Claude can check on this PC passed. The only missing evidence is the GitHub Actions run on `f58879b`.

1. Open PR #1 → **Checks**, and look at `build-and-test` for commit `f58879b`. Write the result and the run URL under "Owner answers" above.
2. **If it is green:** gate 1A is **PASS**, and no further review is needed. Then do:
   - **step A** (connect Cloudflare Pages);
   - **step B** (protect `main`; the check `build-and-test` now exists).

   Paste the `stage1-foundation` preview URL and the production URL under "Owner answers". Then start **Claude — Stage 1 gate 1B** (`docs/STAGE1_SPEC.md` §11 items 11–13, plus Open note 11).
3. **If it is red:** gate 1A is a **second FAIL**. By the rule in `docs/GATES.md`, Claude does not write another fix list for Codex, and the owner decides. Save the failing step's log (or the `playwright-report` artifact) and bring it to a Claude session. The likely options are:
   - **(a) A CI-only problem** (Linux install, timing, or the 30-minute job limit; this PC's run took 13.8 min of browser tests). The owner lets Codex fix it under a narrow brief written from the log.
   - **(b) A real parity difference that appears only on Linux.** Claude analyses the report first, then the owner decides (a) or a spec change.
   - **(c) Merge anyway on local evidence.** Not recommended: step B makes a green `build-and-test` a merge requirement.

Next: Owner — confirm CI on f58879b (green → steps A and B, then Claude gate 1B; red → owner decides)

## 2026-11-26 — Claude — from fa4bc35

Heading "Current status (2026-11-25)" (renamed "Current status (2026-11-26)").

From "Current status (2026-11-25)" (replaced by updated lines):

- **Stage 1 gate 1B: items 11–12 PASS, item 13 after the merge** (Claude, 2026-11-25, commit `b54d8f0`; details in `docs/GATES.md`).
  - Item 13 (production from `main`) can only be checked after the merge (NEXT ASSIGNMENT).
