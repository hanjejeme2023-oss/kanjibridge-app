# CHANGELOG

One entry per session, newest first. Each entry gives the date, the author and what changed. User-visible changes refer to their decision in `docs/DECISIONS.md`.

## 2026-11-24 — Claude — Stage 0: repository setup and Stage 1 specification

- Scaffolding: `LICENSE` (MIT), `public/app/DATA-LICENSE.md` (the imported data stays CC BY-SA 4.0), `.gitignore`, `.gitattributes` (LF everywhere; no line-ending changes to the hash-checked imported files), `README.md`.
- Docs: `docs/HANDOFF.md`, `docs/HANDOFF_ARCHIVE.md`, `docs/DECISIONS.md` (D1–D13 from PROMPT §9, and proposals P1–P7 awaiting the owner), `docs/GATES.md`, `docs/SECURITY.md`.
- `docs/STAGE1_INVENTORY.md`: a read-only inventory of kanji-bridge `app/index.html` at `59156e1`, covering the UI strings with counts and proposed i18n keys, the localStorage keys, the views and view states, the external requests and the way `data.js` is used.
- `docs/STAGE1_SPEC.md`: the Stage 1 assignment for Codex.
- No app code. No network requests. kanji-bridge was not modified.
