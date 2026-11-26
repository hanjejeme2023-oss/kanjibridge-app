# HANDOFF

Read `PROMPT.md` first, then this file. Do **one** assignment for your role. Then:

- write the results and the next assignment back into this file;
- add an entry to `docs/CHANGELOG.md`;
- update `docs/DECISIONS.md` only for a new decision or proposal;
- commit with the prefix `[Claude]` or `[Codex]` and the stage, for example `[Codex] Stage 1:`;
- stop, ending this file with one line: `Next: <agent> — <task>`.

**Archive rule:** text removed from this file is moved **verbatim** to `docs/HANDOFF_ARCHIVE.md` **in the same commit**, under a heading with the date, the author and the commit it was taken from. Nothing is reworded on the way. Never drop an open problem, a note for a later stage or a rule that is still valid. Those stay here until they are done.

## Current status (2026-11-26)

- **Codex stopped before implementation (2026-11-26): specification clarification required.** The owner's instruction says to stop, record the question and push if the spec conflicts; Open notes 14–15 below record two conflicts. This status supersedes the implementation assignment below until clarified. No implementation step has started.
  - Setup in `kanjibridge-app`: `git fetch origin`, `git switch stage2-languages`, `git pull --ff-only` succeeded; HEAD was `6aa2a2d`, the working tree was clean, and `git config user.email` was `311183901+hanjejeme2023-oss@users.noreply.github.com`.
  - The configured workspace was the sibling read-only source repository, so all project operations used the explicit `kanjibridge-app` working directory. No source-repository file was changed.
  - Read the seven requested documents in order in the intended repository. `tests/unit/model.test.js` does not read the `jr`/`k` fields, so the conditional stop in §3.2 does not apply.
  - Steps 1–5: not started; no step commits. `npm test` and `test:browser`: not run (documentation-only stop before any implementation); browser duration: not applicable. No screenshots generated, no new dependencies, no settings changes.

- **Owner's Stage 2 answers recorded** (Claude, 2026-11-26, branch `stage2-languages`). **Codex can start Stage 2.**
  - P8–P13: all (a), recorded as **D22–D27** (`docs/DECISIONS.md`).
  - Every ★ row of `docs/STAGE2_STRINGS.md` is decided. 10 keys (12 cells) changed from the draft, listed in its §5:
    - the app name is "Kanji Bridge" in en and ko;
    - ko 거짓 짝 (false friends);
    - en Glyphs / ko 글자형 (字体);
    - ko 힌트 표시 (`read.show_annotations`).
  - The other rows are approved for implementation. The owner reviews them on the en/ko review screenshots at the Stage 2 gate (`docs/STAGE2_SPEC.md` §11 item 14).
  - `docs/STAGE2_SPEC.md`: start condition marked as met; §7, §8.3 item 7(b), §8.4, §11 item 14 and §12 updated to match.
- **Stage 2 specification written** (Claude, 2026-11-26, branch `stage2-languages`):
  - `docs/STAGE2_SPEC.md` (the assignment for Codex);
  - `docs/STAGE2_STRINGS.md` (130 keys, ja/en/ko draft for the owner's review);
  - proposals **P8–P13** in `docs/DECISIONS.md` §B;
  - D21 records that the domain is not part of Stage 2.
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
- **Git:** identity `Hanje Unesaki <311183901+hanjejeme2023-oss@users.noreply.github.com>` (D9); check `git config user.email` before committing. `origin` = github.com/hanjejeme2023-oss/kanjibridge-app. `main` is protected by the ruleset `protect-main` (owner step B, recorded under "Owner answers"): changes reach `main` only through a pull request with a green `build-and-test`. Agents never commit to `main`.
- **Decisions:** D1–D27 (owner).
  - D14–D20 are the confirmed proposals P1–P7, recorded at gate 1A. D17 (was P4: 0 required approvals) is what the ruleset uses.
  - D21 (2026-11-26) takes the domain out of Stage 2.
  - D22–D27 (2026-11-26) are the confirmed Stage 2 proposals P8–P13. D26 supersedes D19 from Stage 2 on and partly D15. D24 refines D11.
  - No proposal is open.

## Rules in force

- PROMPT §1 workflow: one agent at a time; every stage ends with a Claude gate (`docs/GATES.md`).
- Machine safety: never run a build and a headless browser at the same time; browser runs close what they start. `npm test` runs its steps in order, and Playwright uses `workers: 1`.
- PROMPT §3: no secrets anywhere (`docs/SECURITY.md`); least privilege; no visible change without a decision (D12).
- Stage 2: the only visible changes allowed are the list in D27 (was P13; `docs/STAGE2_SPEC.md` §5.5). In Japanese, the app stays pixel-identical to app v2 apart from those items (the parity suite). A suspected app v2 bug is still kept and written under "Open notes".

## Open notes (for later stages)

From `docs/STAGE1_INVENTORY.md` §6. Each line names the stage it belongs to.

1. Stage 3: map **every** localStorage key to a sync kind. The kinds in PROMPT §6 do not cover `kb_custom`, `kb_target`, `kb_auto` or `kb_ex_open`. `kb_rules` and `kb_ruletest` are two different things. `kb_glyph` is never read.
2. Stage 3: the values carry no per-item time, so the merge needs a local change record. `kb_newtoday` is rewritten on every load, and that must not count as a change.
3. Stage 3: the footer line and About's privacy sentence say that progress stays in this browser. The owner decides new wording for signed-in users.
4. Stage 4: the privacy policy and the CSP must cover Google Fonts and the browser's cloud speech voices. Self-hosting the same fonts is a candidate decision with no visible change.
5. Stage 4: the markup has `style="…"` attributes; the CSP `style-src` needs a decision.
6. Stage 2: translation notes in INVENTORY §6 item 6 (the Windows menu names in `speech.no_voice`, the sentence split around the About link, Japanese typography in separators). *(2026-11-26: applied in `docs/STAGE2_STRINGS.md` §1.3. Keep this note until the Stage 2 gate passes.)*
7. Stage 1 retained v2 bug: a non-array `kb_custom` value makes the pinned baseline throw at `rawCustom.filter`. P4 therefore omits a wrong-type value for that key after confirming the baseline error; all other storage keys are exercised with corrupt/wrong-type values.
8. Stage 1 test infrastructure: Windows Chromium produced repeatable Skia antialias rounding at rounded borders (19–34 pixels differing by one channel step) although DOM, CSS rules, computed styles, focus, scroll, storage and form state were equal. The parity helper saves baseline/new/diff attachments and permits only `<= 64` pixels with `maxDelta <= 1` on Windows. Linux CI still requires exact decoded-pixel equality.
9. Stage 1 retained v2 bugs (found at gate 1A, Claude): app v2 also throws when `kb_srs` is `null` ("Cannot convert undefined or null to object") or `kb_rules` is `null` ("Cannot read properties of null (reading 'k')"). The new app fails in the same way. For `kb_custom`, a string, number, object or `null` throws; invalid JSON text and arrays do not. Hardening storage parsing is a visible behaviour change, so it needs an owner decision. Natural place: Stage 3, when the sync engine reads and writes these keys anyway.
10. Stage 2 (architecture): `src/app/main.js` keeps all views, nav, the keyboard handler, About and reset in one `initApp()` closure. Before adding the run-time language switch, split the views into modules as in STAGE1_SPEC §3, so that a language change can re-render them. Keep the parity suite green while doing it. *(2026-11-26: specified as step 1 of `docs/STAGE2_SPEC.md` §3. Keep this note until the Stage 2 gate passes.)*
11. *(Done at gate 1B, 2026-11-25: the deployed pages are built from `dist` and contain no `{{`. Moved to the archive.)*
12. Test nit (gate 1A attempt 2, Claude; for the next Codex test change, no separate session): in `P1-reset-filled`, the 読解 step asserts that `#unknownreview` contains わからない. That is already true before the click, because the P3 seed marks a word in passage 1. The click does add a mark (probe: `kb_unknown` grows from 1 to 2 ids). A meaningful assertion would compare the `kb_unknown` length before and after, as the other three steps do. It does not block anything. *(2026-11-26: included in `docs/STAGE2_SPEC.md` §8.2.)*
13. Stage 3 (sync): the new setting `kb_lang` (`docs/STAGE2_SPEC.md` §4.3) is the local copy of `profiles.ui_lang`. It is stored only on an explicit choice, and reset does not clear it. The `ui_lang` check constraint (`in ('en','ja','ko')`, PROMPT §6) must accept every locale file, so that a future `vi.json` needs no schema change, or the constraint is extended by a migration in the same change.

14. **Stage 2 blocking question — intermediate key-use checks (Codex, 2026-11-26).** STAGE2_SPEC §2 places all locale files and the §8.1 unit tests in step 2, requires `npm test` to pass before step 3, and puts overview implementation in step 4. §4.1 removes `overview.open_app` and adds all 11 new `overview.*` keys in step 2; §8.1 item 7 requires every non-meta key to be used and every referenced key to exist. The current root `index.html` still references `overview.open_app`; most new overview keys have no use until step 4. **Question:** may step 2 update the placeholder link to `overview.start` and temporarily exempt the not-yet-implemented overview keys from the unused-key check (with the exemption removed in step 4), or should the spec prescribe another intermediate arrangement? No exemption or early overview implementation has been made.
15. **Stage 2 blocking question — language-switch marker contract (Codex, 2026-11-26).** §4.4 says every marker key has its placeholder, and §4.4.1 requires a marker without its placeholder to fail the build. However, §5.1 prescribes `<select id="lang" data-i18n-attr="aria-label=header.lang_label"></select>` with no `aria-label="{{header.lang_label}}"` placeholder. **Question:** should the select include `aria-label="{{header.lang_label}}"`, preserving its specified position and whitespace, or is this marker an explicit exception to the strict build check? Neither choice has been implemented.

## Owner steps (Stage 1): done

Steps A0, A (Cloudflare Pages) and B (`protect-main`) are done. The results are under "Owner answers", and the full step text is in `docs/HANDOFF_ARCHIVE.md` (2026-11-26, from `a696df0`). Two optional checks from step A were never reported. They block nothing:

- Step A11: Open the project → **Settings → Builds** (older label: Builds & deployments) → **Branch control**. Check that the production branch is `main` and that **Preview branches = All non-production branches**. Also check that **Build comments** on pull requests are on (they are by default).
- Step A13: Optional: in the project → **Settings → General**, check that **Access policy** for previews is off. The repository is public, so public previews reveal nothing new.

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

Owner answers (2026-11-26 10:31, relayed to Claude through the claude.ai chat):

- **Proposals P8–P13: all (a).** Recorded as D22–D27 (P8 → D22 … P13 → D27).
- **Content** (meanings and example sentences) stays Japanese, as D1 says. The owner confirmed that it does not need translating now.
- **★ rows in `docs/STAGE2_STRINGS.md`:**
  - App name: ja stays 漢字ブリッジ. **en and ko: "Kanji Bridge"** (not written in Hangul in ko). Every ko key that names the app uses it (title, header, About, overview).
  - Sound rules: en "Sound rules", ko "발음 규칙" (as drafted).
  - False friends: en "False friends", **ko "거짓 짝"**. Every ko key that used 가짜 친구 follows.
  - 字体: **en "Glyphs", ko "글자형"**. Every en key that used "Characters" as this view's name, and every ko key that used 자형, follows.
  - All other ★ rows are **approved as drafted**: the short labels JP/KR/CN/VN and 일/한/중/베; the rating buttons Again/Hard/Good/Easy and 다시/어려움/좋음/쉬움; the Windows menu names; the overview privacy sentence (it may be published). The Korean Windows menu names stay as drafted, because the owner cannot check them on a Korean Windows.
  - The glossary (§1.1) uses the same words. The changed keys are listed in `docs/STAGE2_STRINGS.md` §5.
- **`read.show_annotations` (★, not in the list above):** Claude asked in this session. The owner answered **ko "힌트 표시"** (the draft was 주석 표시).
- **The other (non-★) rows:** the owner checks them at the Stage 2 gate on the en and ko review screenshots (`docs/STAGE2_SPEC.md` §8.4). That is how §11 item 14 ("the owner has approved the wording") is met.

## NEXT ASSIGNMENT

**Codex — Stage 2** on the branch `stage2-languages`, following `docs/STAGE2_SPEC.md`. **Step 1 first: the module split of Open note 10, with no visible change.**

The start condition is met. P8–P13 are D22–D27 (all option (a), so no "If P… = (b)" branch applies). The strings in `docs/STAGE2_STRINGS.md` are the values to copy, with the ★ rows decided by the owner.

1. `git fetch origin`, `git switch stage2-languages`, `git pull --ff-only`.
2. Step 1 (`docs/STAGE2_SPEC.md` §3): the module split, no visible change, no change under `tests/`, `app/index.html`, `index.html`, `public/` or `vite/`. `npm test` passes.
3. Steps 2–5 in order (§2). Push after each step (`git push origin stage2-languages`).
4. Report in this file (§13): status, commits per step, commands and results, the `test:browser` duration, image sizes, the N5 list, every `i18n.css` layout rule with its reason, open notes. Add a CHANGELOG entry. Follow the archive rule.
5. Stop with `Next: Claude — Stage 2 gate (part 2A)`.

Codex cannot open pull requests. The owner opens the pull request `stage2-languages` → `main` when Codex hands over, so that CI runs. Every push already gives a Cloudflare preview at `https://stage2-languages.kanjibridge-app.pages.dev`. Never merge, force-push or delete a branch.

Next: Claude — clarify Stage 2 Open notes 14–15 before Codex implementation
