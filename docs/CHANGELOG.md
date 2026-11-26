# CHANGELOG

One entry per session, newest first. Each entry gives the date, the author and what changed. User-visible changes refer to their decision in `docs/DECISIONS.md`.

## 2026-11-25 — Claude — Stage 1 gate 1B: owner steps A and B recorded

- Recorded the owner's report in HANDOFF "Owner answers": CI green on `f58879b` and `a39dcfd` (gate 1A is now PASS in `docs/GATES.md`), Cloudflare Pages connected (step A), and `main` protected by the ruleset `protect-main` (step B). The placeholder line was moved verbatim to `docs/HANDOFF_ARCHIVE.md`. Docs only; this push also triggers the first `stage1-foundation` preview.

## 2026-11-25 — Claude — Stage 1 gate 1A, attempt 2: PASS pending CI

- Reviewed `stage1-foundation` at `f58879b` (PR #1). `git diff 4d57c88..f58879b` over `src`, `app/index.html`, `index.html` and `vite` is empty, so no app code changed.
- Verified F1–F5 one by one with Claude's own proofs:
  - the build checks fail (and do not skip) without `dist/`;
  - a hand-inserted `{{x}}` in `dist/index.html` and an extra nested HTML file are named in the failure;
  - a real-Chromium probe shows that a same-origin 404 is counted, while only the aborted Google Fonts request is exempt;
  - the P4-null, P1-reset-filled and gate assertions are present as specified.
- Re-ran on this PC, one job at a time: `npm ci` (0 vulnerabilities), then `npm test`, exit 0. Unit 20/20, build checks 2/2, browser 36/36 in 13.8 min, every screenshot pixel-exact. All servers and browsers were closed, and the temporary probe was deleted.
- Result: **PASS pending CI**. The CI run on `f58879b` was still running and no result reached the session. Green → PASS, then the owner does steps A and B, then Claude gate 1B. Red → a second FAIL, which the owner decides (options in HANDOFF).
- HANDOFF: new status and next assignment. Open note 12 records a non-blocking test nit (the 読解 assertion in P1-reset-filled is true before the click). Replaced text was moved verbatim to `docs/HANDOFF_ARCHIVE.md`.
- Docs only. No app code or tests changed.

## 2026-11-25 — Codex — Stage 1 gate 1A fixes F1–F5

- Moved mandatory production-build checks after the build in npm scripts and CI, scan all built HTML for unfilled placeholders, and fail when `dist/` is absent. Proved the check rejects a hand-inserted `{{x}}` in `dist/index.html`, recorded the exact failure in HANDOFF, and rebuilt cleanly.
- Restricted console-error exemptions to font-host URLs actually aborted by the test route, with regression cases for same-origin 404s and the other boundaries. Baseline fixture requests are blocked offline, and context cleanup runs even on assertion failure.
- Added the specified safe-null storage scenario and a filled-state reset scenario using the P3 seed and all four study actions; retained every existing checkpoint.
- Completed the named gate assertions through DOM/localStorage, including baseline-derived glyph quiz counts, immediate chunk limits, saved progress, false-friend round order, filters, usage links, focus, About and reset.
- Tests/scripts/CI and documentation only; app code, pages, imported data and dependencies are unchanged. `npm ci` passed (0 vulnerabilities), followed by the full sequential `npm test`: data check PASS, 20 unit tests PASS, build PASS, 2 build checks PASS, 36 browser tests PASS (17.3 min). All test servers and browsers were closed.
- HANDOFF records the proof and results, assigns Claude — Stage 1 gate 1A, attempt 2, and preserves replaced text verbatim in HANDOFF_ARCHIVE. CI on PR #1 awaits the owner's report.

## 2026-11-25 — Claude — Stage 1 gate 1A: FAIL (first attempt)

- Reviewed `stage1-foundation` at `4d57c88` (PR #1) and re-ran on this PC, one job at a time: `npm ci`, `check:data`, unit tests, build, import reproducibility, and the full Playwright suite (28 passed, 11.3 min, pixel-exact screenshots). Two read-only Chromium probes covered storage edge cases and raw placeholders. CI passed on PR #1 (owner's report).
- Result: **FAIL** on test coverage only (`docs/GATES.md`):
  - the build checks, including the `{{` check, never run in CI;
  - the console-error exemption is too broad;
  - P4 has no `null` values;
  - reset is not tested from a filled state;
  - `gate.spec.js` is incomplete.
  No app defect was found. Fix list F1–F5 in `docs/HANDOFF.md`; next: Codex.
- The raw `{{app.title}}` seen in Codex's preview comes only from opening a source HTML file unbuilt. Dev server, preview and `dist/` are clean.
- Recorded the owner-confirmed P1–P7 as D14–D20 in `docs/DECISIONS.md`.
- HANDOFF: two more retained v2 bugs (`null` in `kb_srs` and in `kb_rules`), a Stage 2 note on splitting the views, and a 1B check for `{{` on the deployed pages. Replaced text moved verbatim to `docs/HANDOFF_ARCHIVE.md`.
- Docs only. No app code or tests changed.

## 2026-11-25 — Codex — Stage 1: foundation

- Added the Vite multi-page foundation for `/` and `/app/`, pinned Node 24.19.0 and exact npm dependencies, and kept the app-v2 learner experience unchanged under owner-confirmed P1–P7.
- Added a byte-exact importer for the pinned `59156e1` git objects, stable data manifest, 11 upstream licence files, attribution files and imported reference baseline.
- Split the app into ES modules, added explicit initialization and a 115-key Japanese i18n layer, with pure logic modules for model adaptation, storage, DOM, judging, tones, results and false-friend scheduling.
- Added Vitest coverage and a serial Playwright gate/parity suite covering P1–P8, the imported v2 harness, production assets, offline requests, mobile styles, storage failures and speech behavior.
- Added SHA-pinned, least-privilege GitHub Actions CI. The branch was pushed as `stage1-foundation`; GitHub CLI was not authenticated, so the owner must open the pull request.

## 2026-11-24 — Claude — Stage 0: repository setup and Stage 1 specification

- Scaffolding: `LICENSE` (MIT), `public/app/DATA-LICENSE.md` (the imported data stays CC BY-SA 4.0), `.gitignore`, `.gitattributes` (LF everywhere; no line-ending changes to the hash-checked imported files), `README.md`.
- Docs: `docs/HANDOFF.md`, `docs/HANDOFF_ARCHIVE.md`, `docs/DECISIONS.md` (D1–D13 from PROMPT §9, and proposals P1–P7 awaiting the owner), `docs/GATES.md`, `docs/SECURITY.md`.
- `docs/STAGE1_INVENTORY.md`: a read-only inventory of kanji-bridge `app/index.html` at `59156e1`, covering the UI strings with counts and proposed i18n keys, the localStorage keys, the views and view states, the external requests and the way `data.js` is used.
- `docs/STAGE1_SPEC.md`: the Stage 1 assignment for Codex.
- No app code. No network requests. kanji-bridge was not modified.
