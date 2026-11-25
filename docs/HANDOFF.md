# HANDOFF

Read `PROMPT.md` first, then this file. Do **one** assignment for your role. Then:

- write the results and the next assignment back into this file;
- add an entry to `docs/CHANGELOG.md`;
- update `docs/DECISIONS.md` only for a new decision or proposal;
- commit with the prefix `[Claude]` or `[Codex]` and the stage, for example `[Codex] Stage 1:`;
- stop, ending this file with one line: `Next: <agent> — <task>`.

**Archive rule:** text removed from this file is moved **verbatim** to `docs/HANDOFF_ARCHIVE.md` **in the same commit**, under a heading with the date, the author and the commit it was taken from. Nothing is reworded on the way. Never drop an open problem, a note for a later stage or a rule that is still valid. Those stay here until they are done.

## Current status (2026-11-25)

- **Stage 1 done locally** (Codex, 2026-11-25). Branch `stage1-foundation` is pushed at `f0ccd61`. Vite builds the overview at `/` and the exact app-v2 UI at `/app/`; the pinned data/baseline importer, module split, 115-key Japanese i18n layer, unit tests, P1–P8 browser parity suite and SHA-pinned GitHub Actions workflow are implemented. The optional `windows-latest` CI job was not added because this PC is the Windows validation.
- **Verification on this PC:** `npm run check:data` passed; `npm run test:unit` passed (7 files, 16 tests, 3.56 s in the final run); `npm run build` passed (17 modules, 129 ms); `npm run test:browser` passed (28 tests, 10.3 min, run serially with one worker); therefore `npm test` passed. Afterward, `npm run import:data` imported 17 files from `59156e119bb4ec1652ac573e9cf821c0d064e9dc` and produced no data diff. `npx playwright install chromium` installed Chromium 159.0.8154.6 (Playwright build v1255). All browsers and test servers were closed.
- **Pull request / CI:** `git push -u origin stage1-foundation` succeeded. `gh auth status` reports that GitHub CLI is not logged in, so Codex could not open the pull request. The owner must open `stage1-foundation` → `main`; no CI run URL exists until that pull request is opened because CI runs on pull requests and pushes to `main` only.
- **Source:** kanji-bridge, final commit `59156e1` (`59156e119bb4ec1652ac573e9cf821c0d064e9dc`), at `../kanji-bridge`. It is a read-only reference: never modify it. The pinned `app/data.js` hash is SHA-256 `3eb99e245782a1aae7e76144bd656be9648c7b075441b70f2e1a6f7f0eb84af9`. Note: during Stage 0 (2026-11-24, about 22:00–22:16 local time) another session committed `16f68be` ("vi-edition") on top of `59156e1` in `../kanji-bridge` and was still writing untracked files there. The import reads git objects at the pinned commit, not the working tree or `HEAD`, so this does not affect Stage 1. Re-pinning to a later commit needs an owner decision.
- **This PC:** Node v24.19.0 and npm 11.17.0 are installed (checked 2026-11-24). Nothing needs installing before Stage 1. Chrome and Edge are installed. Git has `core.autocrlf=true`, so `.gitattributes` forces LF and keeps the imported files byte-exact.
- **Git:** identity `Hanje Unesaki <311183901+hanjejeme2023-oss@users.noreply.github.com>` (D9); check `git config user.email` before committing. `origin` = github.com/hanjejeme2023-oss/kanjibridge-app. Stage 0 was committed and **not pushed**: the owner pushes `main` (step A0 below).
- **Decisions:** D1–D13 (owner), and owner-confirmed P1–P7 (`docs/DECISIONS.md` §B). P4 (0 required approvals) affects the branch protection steps below. Claude records the confirmed proposals as decisions at the Stage 1 gate.

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

*(The pages.dev URLs and any notes from steps A and B go here.)*

## NEXT ASSIGNMENT

**Claude — Stage 1 gate (part 1A):** after the owner opens the pushed `stage1-foundation` branch as a pull request to `main`, review the implementation and run `docs/GATES.md` part 1A. Record the owner's confirmed P1–P7 as decisions at the gate. Do not merge.

Next: Claude — Stage 1 gate (part 1A)
