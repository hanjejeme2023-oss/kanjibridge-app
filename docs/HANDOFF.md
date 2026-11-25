# HANDOFF

Read `PROMPT.md` first, then this file. Do **one** assignment for your role. Then:

- write the results and the next assignment back into this file;
- add an entry to `docs/CHANGELOG.md`;
- update `docs/DECISIONS.md` only for a new decision or proposal;
- commit with the prefix `[Claude]` or `[Codex]` and the stage, for example `[Codex] Stage 1:`;
- stop, ending this file with one line: `Next: <agent> — <task>`.

**Archive rule:** text removed from this file is moved **verbatim** to `docs/HANDOFF_ARCHIVE.md` **in the same commit**, under a heading with the date, the author and the commit it was taken from. Nothing is reworded on the way. Never drop an open problem, a note for a later stage or a rule that is still valid. Those stay here until they are done.

## Current status (2026-11-25)

- **F1–F5 fixes completed** (Codex, 2026-11-25): tests, npm scripts and CI only. The required `npm ci` and sequential `npm test` passed: 20 unit tests, 2 build checks, 36 browser tests (17.3 min). Full evidence and the intentional F1 failure are below. The last gate result is still attempt 1 FAIL; next is Claude — Stage 1 gate 1A, attempt 2. CI for this fix commit awaits the owner's report on PR #1.
- **Stage 1 implementation** (Codex, 2026-11-25): Vite builds the overview at `/` and the exact app-v2 UI at `/app/`. It includes the pinned data/baseline importer, the module split, the 115-key Japanese i18n layer, unit tests, the P1–P8 browser parity suite and a SHA-pinned GitHub Actions workflow. The optional `windows-latest` CI job was not added; this PC is the Windows check.
- **Original implementation verification (before gate 1A):** `npm run check:data` passed; `npm run test:unit` passed (7 files, 16 tests, 3.56 s in the final run); `npm run build` passed (17 modules, 129 ms); `npm run test:browser` passed (28 tests, 10.3 min, run serially with one worker); therefore `npm test` passed. Afterward, `npm run import:data` imported 17 files from `59156e119bb4ec1652ac573e9cf821c0d064e9dc` and produced no data diff. `npx playwright install chromium` installed Chromium 159.0.8154.6 (Playwright build v1255). All browsers and test servers were closed.
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
