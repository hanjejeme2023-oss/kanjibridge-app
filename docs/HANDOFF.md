# HANDOFF

Read `PROMPT.md` first, then this file. Do **one** assignment for your role. Then:

- write the results and the next assignment back into this file;
- add an entry to `docs/CHANGELOG.md`;
- update `docs/DECISIONS.md` only for a new decision or proposal;
- commit with the prefix `[Claude]` or `[Codex]` and the stage, for example `[Codex] Stage 1:`;
- stop, ending this file with one line: `Next: <agent> — <task>`.

**Archive rule:** text removed from this file is moved **verbatim** to `docs/HANDOFF_ARCHIVE.md` **in the same commit**, under a heading with the date, the author and the commit it was taken from. Nothing is reworded on the way. Never drop an open problem, a note for a later stage or a rule that is still valid. Those stay here until they are done.

## Current status (2026-11-25)

- **Stage 1 gate 1A: FAIL, first attempt** (Claude, 2026-11-25, commit `4d57c88`; details in `docs/GATES.md`). The app itself checks out: parity 28/28 on this PC, pixel-exact screenshots, no console errors, data hashes, i18n, CI config and secrets. The failure is five test-coverage gaps, F1–F5 under "NEXT ASSIGNMENT" below. Codex fixes only those, then Claude re-runs 1A. A second FAIL goes to the owner.
- **Stage 1 implementation** (Codex, 2026-11-25): Vite builds the overview at `/` and the exact app-v2 UI at `/app/`. It includes the pinned data/baseline importer, the module split, the 115-key Japanese i18n layer, unit tests, the P1–P8 browser parity suite and a SHA-pinned GitHub Actions workflow. The optional `windows-latest` CI job was not added; this PC is the Windows check.
- **Verification on this PC:** `npm run check:data` passed; `npm run test:unit` passed (7 files, 16 tests, 3.56 s in the final run); `npm run build` passed (17 modules, 129 ms); `npm run test:browser` passed (28 tests, 10.3 min, run serially with one worker); therefore `npm test` passed. Afterward, `npm run import:data` imported 17 files from `59156e119bb4ec1652ac573e9cf821c0d064e9dc` and produced no data diff. `npx playwright install chromium` installed Chromium 159.0.8154.6 (Playwright build v1255). All browsers and test servers were closed.
- **Pull request / CI:** the owner opened PR #1 (`stage1-foundation` → `main`). GitHub Actions passed on it (1/1 checks, 2026-11-25, owner's report). GitHub CLI is not logged in on this PC, so agents cannot open pull requests or read CI runs. After each push, the owner reports the CI result (and, if possible, the run URL) under "Owner answers".
- **Source:** kanji-bridge, final commit `59156e1` (`59156e119bb4ec1652ac573e9cf821c0d064e9dc`), at `../kanji-bridge`. It is a read-only reference: never modify it. The pinned `app/data.js` hash is SHA-256 `3eb99e245782a1aae7e76144bd656be9648c7b075441b70f2e1a6f7f0eb84af9`. Note: during Stage 0 (2026-11-24, about 22:00–22:16 local time) another session committed `16f68be` ("vi-edition") on top of `59156e1` in `../kanji-bridge` and was still writing untracked files there. The import reads git objects at the pinned commit, not the working tree or `HEAD`, so this does not affect Stage 1. Re-pinning to a later commit needs an owner decision.
- **This PC:** Node v24.19.0 and npm 11.17.0 are installed (checked 2026-11-24). Nothing needs installing before Stage 1. Chrome and Edge are installed. Git has `core.autocrlf=true`, so `.gitattributes` forces LF and keeps the imported files byte-exact.
- **Git:** identity `Hanje Unesaki <311183901+hanjejeme2023-oss@users.noreply.github.com>` (D9); check `git config user.email` before committing. `origin` = github.com/hanjejeme2023-oss/kanjibridge-app. Stage 0 was committed and **not pushed**: the owner pushes `main` (step A0 below).
- **Decisions:** D1–D20 (owner). D14–D20 are the confirmed proposals P1–P7, recorded at gate 1A. D17 (was P4: 0 required approvals) affects the branch protection steps below. No proposal is open.

## Rules in force

- PROMPT §1 workflow: one agent at a time; every stage ends with a Claude gate (`docs/GATES.md`).
- Machine safety: never run a build and a headless browser at the same time; browser runs close what they start. `npm test` runs its steps in order, and Playwright uses `workers: 1`.
- PROMPT §3: no secrets anywhere (`docs/SECURITY.md`); least privilege; no visible change without a decision (D12).
- Stage 1 changes nothing that a learner can see or do. A suspected app v2 bug is kept and written under "Open notes".

## Open notes (for later stages)

From `docs/STAGE1_INVENTORY.md` §6. Each line names the stage it belongs to.

1. Stage 3: map **every** localStorage key to a sync kind. The kinds in PROMPT §6 do not cover `kb_custom`, `kb_target`, `kb_auto` or `kb_ex_open`. `kb_rules` and `kb_ruletest` are two different things. `kb_glyph` is never read.
2. Stage 3: the values carry no per-item time, so the merge needs a local change record. `kb_newtoday` is rewritten on every load, and that must not count as a change.
3. Stage 3: the footer line and About's privacy sentence say that progress stays in this browser. The owner decides new wording for signed-in users.
4. Stage 4: the privacy policy and the CSP must cover Google Fonts and the browser's cloud speech voices. Self-hosting the same fonts is a candidate decision with no visible change.
5. Stage 4: the markup has `style="…"` attributes; the CSP `style-src` needs a decision.
6. Stage 2: translation notes in INVENTORY §6 item 6 (the Windows menu names in `speech.no_voice`, the sentence split around the About link, Japanese typography in separators).
7. Stage 1 retained v2 bug: a non-array `kb_custom` value makes the pinned baseline throw at `rawCustom.filter`. P4 therefore omits a wrong-type value for that key after confirming the baseline error; all other storage keys are exercised with corrupt/wrong-type values.
8. Stage 1 test infrastructure: Windows Chromium produced repeatable Skia antialias rounding at rounded borders (19–34 pixels differing by one channel step) although DOM, CSS rules, computed styles, focus, scroll, storage and form state were equal. The parity helper saves baseline/new/diff attachments and permits only `<= 64` pixels with `maxDelta <= 1` on Windows. Linux CI still requires exact decoded-pixel equality.
9. Stage 1 retained v2 bugs (found at gate 1A, Claude): app v2 also throws when `kb_srs` is `null` ("Cannot convert undefined or null to object") or `kb_rules` is `null` ("Cannot read properties of null (reading 'k')"). The new app fails in the same way. For `kb_custom`, a string, number, object or `null` throws; invalid JSON text and arrays do not. Hardening storage parsing is a visible behaviour change, so it needs an owner decision. Natural place: Stage 3, when the sync engine reads and writes these keys anyway.
10. Stage 2 (architecture): `src/app/main.js` keeps all views, nav, the keyboard handler, About and reset in one `initApp()` closure. Before adding the run-time language switch, split the views into modules as in STAGE1_SPEC §3, so that a language change can re-render them. Keep the parity suite green while doing it.
11. Stage 1 gate 1B (Claude): check that the Cloudflare build output directory is `dist` and that no deployed page (`/`, `/app/`) contains `{{`. A raw `{{app.title}}` appears only if the source HTML is served unbuilt (gate 1A, extra check 1).

## Owner steps after Codex Stage 1 passes the gate

**Do these after Codex Stage 1 passes the gate (part 1A in `docs/GATES.md`). Not before.** Only step A0 is needed earlier. Labels in the Cloudflare and GitHub dashboards change from time to time. If a label differs, look for the nearest match, and tell Claude what you saw.

### A0. Push Stage 0 (any time before Codex starts)

1. In a terminal in `kanjibridge-app`: `git push -u origin main`.
2. Open github.com/hanjejeme2023-oss/kanjibridge-app and check that `PROMPT.md`, `docs/` and `public/app/DATA-LICENSE.md` are there.

### A. Connect the repository to Cloudflare Pages (after Codex Stage 1 passes the gate)

1. Sign in at **dash.cloudflare.com** (2FA on).
2. Left menu: **Compute (Workers) → Workers & Pages** (older dashboards: **Workers & Pages**). Click **Create application**.
3. Choose the **Pages** tab (or the link "Looking to deploy Pages? Get started"). Then click **Import an existing Git repository** (older label: "Connect to Git").
4. Click **Connect GitHub**. In the GitHub window: install "Cloudflare Workers and Pages" on the account **hanjejeme2023-oss**, choose **Only select repositories → kanjibridge-app**, then click **Install & Authorize**.
5. Back in Cloudflare, select **kanjibridge-app** and click **Begin setup**.
6. **Project name:** `kanjibridge-app`, which gives `kanjibridge-app.pages.dev`. If the name is taken, choose a similar one and tell Claude.
7. **Production branch:** `main`.
8. **Build settings** (`docs/STAGE1_SPEC.md` §8):
   - Framework preset **None**;
   - Build command **`npm run build`**;
   - Build output directory **`dist`**;
   - Root directory left empty.
9. **Environment variables (advanced):** add `NODE_VERSION` = `24.19.0`. Add nothing else. Never add a key or password here.
10. Click **Save and Deploy**. Wait for the first build to finish. Its log should end with a success message.
11. Open the project → **Settings → Builds** (older label: Builds & deployments) → **Branch control**. Check that the production branch is `main` and that **Preview branches = All non-production branches**. Also check that **Build comments** on pull requests are on (they are by default).
12. Open the project → **Deployments**. Copy the preview URL of the `stage1-foundation` branch (or the pull request's comment link) and the production URL `https://kanjibridge-app.pages.dev`. Paste both into this file under "Owner answers", or give them to Claude.
13. Optional: in the project → **Settings → General**, check that **Access policy** for previews is off. The repository is public, so public previews reveal nothing new.

### B. Protect `main` on GitHub (after Codex Stage 1 passes the gate, and after CI has run at least once)

1. Open github.com/hanjejeme2023-oss/kanjibridge-app → **Settings** (2FA on).
2. Left menu: **Rules → Rulesets** → **New ruleset → New branch ruleset**.
3. **Ruleset name:** `protect-main`. **Enforcement status:** **Active**.
4. **Bypass list:** leave it **empty**. Even the owner goes through a pull request.
5. **Target branches:** **Add target → Include default branch** (`main`).
6. Tick these **Branch rules**:
   - **Restrict deletions**;
   - **Block force pushes**;
   - **Require a pull request before merging**, with **Required approvals = 0** (proposal P4: GitHub does not let the author of a pull request approve it, and every pull request here comes from the owner's account. The owner's approval is the merge itself). Also tick **Require conversation resolution before merging**;
   - **Require status checks to pass**, with **Require branches to be up to date before merging** ticked. Then **Add checks**, type `build-and-test` and pick the GitHub Actions check. It appears only after the workflow has run once on a pull request.
7. Click **Create**.
8. **Settings → Actions → General:**
   - **Fork pull request workflows from outside collaborators** = **Require approval for all external contributors**;
   - **Workflow permissions** = **Read repository contents and packages permissions**;
   - leave **Allow GitHub Actions to create and approve pull requests** unticked.
   
   Click **Save** for each section.
9. **Settings → Collaborators:** check that nobody else has write access. Only the owner merges.
10. Test it: on the Stage 1 pull request, the **Merge** button should stay blocked until `build-and-test` is green.

After A and B: Claude runs gate part 1B (`docs/STAGE1_SPEC.md` §11, items 11–13) on the preview URL. Then the owner merges the Stage 1 pull request.

## Owner answers

Owner answers (2026-11-24): proposals P1–P7 in docs/DECISIONS.md §B are confirmed as written.

Owner answers (2026-11-25, relayed to Claude at gate 1A): pull request #1 (`stage1-foundation` → `main`) is open. GitHub Actions CI on it passed (1/1 checks OK).

*(The pages.dev URLs and any notes from steps A and B go here.)*

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
