# HANDOFF

Read `PROMPT.md` first, then this file. Do **one** assignment for your role. Then:

- write the results and the next assignment back into this file;
- add an entry to `docs/CHANGELOG.md`;
- update `docs/DECISIONS.md` only for a new decision or proposal;
- commit with the prefix `[Claude]` or `[Codex]` and the stage, for example `[Codex] Stage 1:`;
- stop, ending this file with one line: `Next: <agent> — <task>`.

**Archive rule:** text removed from this file is moved **verbatim** to `docs/HANDOFF_ARCHIVE.md` **in the same commit**, under a heading with the date, the author and the commit it was taken from. Nothing is reworded on the way. Never drop an open problem, a note for a later stage or a rule that is still valid. Those stay here until they are done.

## Current status (2026-11-26)

- **Stage 1 gate: PASS. Stage 1 is complete** (Claude, 2026-11-26; details in `docs/GATES.md`).
  - **Item 13 (production):** PR #1 was merged as `fa4bc35`. On that commit, `build-and-test` and the "Cloudflare Pages" check run are both green (public GitHub API). Production deployment `https://745d72e9.kanjibridge-app.pages.dev`. `https://kanjibridge-app.pages.dev` serves `/` and `/app/` byte-identical to a local build of `fa4bc35`; `/app` → 308 `/app/`; `data.js` has the pinned hash; the four attribution files equal `public/app/`; no `{{`. In Chromium with the network on: 0 console errors and 0 page errors on `/` and in all five views.
- **Stage 1 gate 1B: items 11–12 PASS on the preview** (Claude, 2026-11-25, commit `b54d8f0`).
  - Preview: `https://stage1-foundation.kanjibridge-app.pages.dev` (deployment `https://6c84e7d7.kanjibridge-app.pages.dev`), built by Cloudflare from `b54d8f0`. Its `/` and `/app/` are byte-identical to a local build of the same commit. `/app` → 308 `/app/`. `data.js` has the pinned hash. The four attribution files are equal to `public/app/`. No `{{`.
  - Network on: 0 console errors and 0 page errors on `/` and in all five views. Only the preview origin and the two Google Fonts hosts were requested. With the same seeded `Math.random`, all five views are byte-identical PNGs to the published kanji-bridge app (`59156e1`). Screenshots: `C:\Users\Anna Tran\kb-gate1b-shots\` (not committed).
- **Stage 1 gate 1A: PASS** (attempt 2, commit `f58879b`). CI was green on `f58879b` and `a39dcfd` (owner's report) and on `b54d8f0` (read by Claude).
- **F1–F5 fixes** (Codex, 2026-11-25): tests, npm scripts and CI only. Codex's evidence was moved to `docs/HANDOFF_ARCHIVE.md` (from `f58879b`); the gate's own evidence is in `docs/GATES.md`.
- **Stage 1 implementation** (Codex, 2026-11-25): Vite builds the overview at `/` and the exact app-v2 UI at `/app/`. It includes the pinned data/baseline importer, the module split, the 115-key Japanese i18n layer, unit tests, the P1–P8 browser parity suite and a SHA-pinned GitHub Actions workflow. The optional `windows-latest` CI job was not added; this PC is the Windows check.
- **Original implementation verification (before gate 1A):** `npm run check:data` passed; `npm run test:unit` passed (7 files, 16 tests, 3.56 s in the final run); `npm run build` passed (17 modules, 129 ms); `npm run test:browser` passed (28 tests, 10.3 min, run serially with one worker); therefore `npm test` passed. Afterward, `npm run import:data` imported 17 files from `59156e119bb4ec1652ac573e9cf821c0d064e9dc` and produced no data diff. `npx playwright install chromium` installed Chromium 159.0.8154.6 (Playwright build v1255). All browsers and test servers were closed.
- **Pull request / CI:** the owner opened PR #1 (`stage1-foundation` → `main`). GitHub CLI is not logged in on this PC, so agents cannot open pull requests. The repository is public, so an agent **can** read the check results of a pushed commit without login: `https://api.github.com/repos/hanjejeme2023-oss/kanjibridge-app/commits/<sha>/check-runs` lists `build-and-test` and "Cloudflare Pages" (with the preview URLs). The run logs still need the owner.
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
11. *(Done at gate 1B, 2026-11-25: the deployed pages are built from `dist` and contain no `{{`. Moved to the archive.)*
12. Test nit (gate 1A attempt 2, Claude; for the next Codex test change, no separate session): in `P1-reset-filled`, the 読解 step asserts that `#unknownreview` contains わからない. That is already true before the click, because the P3 seed marks a word in passage 1. The click does add a mark (probe: `kb_unknown` grows from 1 to 2 ids). A meaningful assertion would compare the `kb_unknown` length before and after, as the other three steps do. It does not block anything.

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

Owner answers (2026-11-25, relayed to Claude through the claude.ai chat at gate 1B):

- **CI:** `build-and-test` on PR #1 passed on both `f58879b` and `a39dcfd`. Gate 1A is therefore **PASS** (`docs/GATES.md`).
- **Step A (Cloudflare Pages):**
  - The GitHub app "Cloudflare Workers and Pages" is installed on **kanjibridge-app only**.
  - Project name `kanjibridge-app`. Production branch `main`. Framework preset None. Build command `npm run build`. Build output directory `dist`. Root directory empty. Environment variables: only `NODE_VERSION=24.19.0`.
  - Branch control: production branch `main`; Preview branches = All non-production branches.
  - The first production build (`main`, `94a4480`) **failed**, because `main` has no `package.json` yet (the app is still in PR #1). Node 24.19.0 was installed. This was expected; the build should pass after the merge.
  - No `stage1-foundation` preview existed yet, because nothing was pushed after the connection.
  - Not checked yet: Build comments (step A11) and Access policy (step A13).
- **Step B (GitHub):**
  - Ruleset `protect-main`: Active; Bypass list empty; target = default branch. Rules: Restrict deletions; Block force pushes; Require a pull request before merging (approvals 0, conversation resolution on); Require status checks to pass (`build-and-test`, "up to date" on).
  - "Require an additional approval for unattributed Copilot pull requests" was on by default and was left on. No effect: Copilot is not used.
  - Actions: Fork pull request workflows = Require approval for all external contributors (changed). Workflow permissions were already read-only. "Allow GitHub Actions to create and approve pull requests" was already off.
  - Collaborators: 0.

Owner answers (2026-11-25 21:19, relayed to Claude through the claude.ai chat): PR #1 was merged at about 21:00 (merge commit `fa4bc35`). `https://kanjibridge-app.pages.dev/app/` opens and shows the app.

## NEXT ASSIGNMENT

**Owner — merge PR #1 and look at production. Then: Claude — Stage 1 gate 1B item 13 and the Stage 2 specification.**

Gate 1B items 11–12 passed on the preview (`docs/GATES.md`). Nothing blocks the merge.

1. **Optional, before merging:** open `C:\Users\Anna Tran\kb-gate1b-shots\` and look at the screenshots side by side (`preview-<view>.png` and `published-<view>.png`; STAGE1_SPEC §11 item 12 asks the owner to look). Also, if you like, check steps A11 (Build comments) and A13 (preview Access policy) in Cloudflare. Neither one blocks the merge.
2. On PR #1, wait until `build-and-test` is **green on the last commit** (this gate's docs commit). The ruleset blocks the merge until then.
3. Check that every conversation on PR #1 is **resolved** (the ruleset requires it).
4. Click **Merge pull request** (a normal merge commit is fine; Squash is not needed). Do not delete anything else.
5. Wait for the production deployment in Cloudflare (project `kanjibridge-app` → Deployments, branch `main`). Then open `https://kanjibridge-app.pages.dev/app/` and check that the app looks the same as the preview. Write the result (and the deployment status) under "Owner answers".
6. **Claude — next session (start of Stage 2):** run the gate 1B item 11 checks on `https://kanjibridge-app.pages.dev` (`/`, `/app/`, the `/app` redirect, the `data.js` hash, the four attribution files, no `{{`) and record them in `docs/GATES.md` as item 13. Then write the Stage 2 specification (`docs/STAGE2_SPEC.md`) from PROMPT §5 and the Open notes for Stage 2 (6 and 10).

If the production build fails, do not change any setting: copy the build log from Cloudflare → Deployments and bring it to the Claude session.

Next: Owner — wait for green CI, merge PR #1, check https://kanjibridge-app.pages.dev/app/; then Claude — gate 1B item 13 and the Stage 2 spec
