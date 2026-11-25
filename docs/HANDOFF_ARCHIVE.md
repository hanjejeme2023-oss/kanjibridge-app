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
