# CHANGELOG

One entry per session, newest first. Each entry gives the date, the author and what changed. User-visible changes refer to their decision in `docs/DECISIONS.md`.

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
