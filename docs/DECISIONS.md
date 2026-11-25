# DECISIONS

Every key decision: what, when and who made it. New decisions are added at the bottom of the table. Nothing is deleted. A decision that is replaced is marked *superseded by Dn* in italics at the start of its text, and the later one wins.

Only the owner makes decisions. Claude and Codex may **propose** one (section B). A proposal becomes a D-number when the owner confirms it.

## A. Decisions

| # | Decision | Date | By |
|---|---|---|---|
| D1 | UI languages: en (default), ja, ko. Content (meanings, examples) stays Japanese in this project. | 2026-11-24 | owner |
| D2 | Anyone may register; no promotion. | 2026-11-24 | owner |
| D3 | Sign-in with Google only (e-mail sign-in may come later). | 2026-11-24 | owner |
| D4 | Sync like Anki (PROMPT §7). | 2026-11-24 | owner |
| D5 | Domain `kanjibridge.app` (Student Pack; fallback Cloudflare). DNS on Cloudflare. | 2026-11-24 | owner |
| D6 | New repository; kanji-bridge stays as the finished, public milestone. | 2026-11-24 | owner |
| D7 | The Vietnamese-base mode comes after this project; the data model allows it (PROMPT §6). | 2026-11-24 | owner |
| D8 | No Gemini/Vertex use in this project. | 2026-11-24 | owner |
| D9 | Repository `kanjibridge-app` (github.com/hanjejeme2023-oss/kanjibridge-app), public from the start. Git identity: `Hanje Unesaki <311183901+hanjejeme2023-oss@users.noreply.github.com>`. | 2026-11-24 | owner |
| D10 | Hosting on Cloudflare Pages, with preview deployments. Until the domain exists, the site uses its free `*.pages.dev` address. | 2026-11-24 | owner |
| D11 | The overview page is at `/`; the app is at `/app/`. The logo in the app links to `/`. | 2026-11-24 | owner |
| D12 | No other app changes requested for now; the kanji-bridge `UX_BACKLOG.md` stays a candidate list for later decisions. | 2026-11-24 | owner |
| D13 | Domain timing. The owner applies for the GitHub Student Developer Pack after the Thanksgiving break (on campus; verification needs presence on campus). `kanjibridge.app` must be in place before the Stage 4 public sign-in launch; fallback: register it at Cloudflare. Supabase sign-in redirect URLs list both the `*.pages.dev` address and the domain. | 2026-11-24 | owner |
| D14 | (was P1) The hosted app runs over http(s) only. kanji-bridge's "double-click `index.html` from disk" (`file://`) mode is not kept. | 2026-11-24 | owner (proposed by Claude) |
| D15 | (was P2) The imported data lives in `public/app/` (`data.js`, `NOTICE.md`, `LICENSE-DATA`, `licenses/`, `DATA-MANIFEST.json`, `DATA-LICENSE.md`). It is served at `/app/data.js`, so the page keeps `<script src="data.js">` unchanged. kanji-bridge's `app/index.html` and gate harness are imported as a read-only test baseline into `tests/baseline/`. | 2026-11-24 | owner (proposed by Claude) |
| D16 | (was P3) Test tools: **Vitest** for unit tests and **Playwright Test** (Chromium) for browser tests. kanji-bridge's Python/CDP harness is not ported. Its scenarios are rewritten as Playwright specs (STAGE1_SPEC §6). | 2026-11-24 | owner (proposed by Claude) |
| D17 | (was P4) Branch protection on `main` requires a pull request and passing CI, with **0 required approving reviews**. The owner gives approval by merging: only the owner has write access. | 2026-11-24 | owner (proposed by Claude) |
| D18 | (was P5) The Stage 1 gate has two parts. **1A**: Claude checks the code evidence. **1B**: after the owner connects Cloudflare Pages (HANDOFF), Claude checks the preview URL. Stage 1 is done after 1B. | 2026-11-24 | owner (proposed by Claude) |
| D19 | (was P6) In Stage 1, the UI text in `app/index.html` is filled in from `src/i18n/ja.json` at build time, by a small Vite plugin. Stage 2 decides how the language switches at run time. | 2026-11-24 | owner (proposed by Claude) |
| D20 | (was P7) Node.js **24.19.0** (the version on this PC) is pinned in `.nvmrc` for local work, GitHub Actions and Cloudflare Pages. | 2026-11-24 | owner (proposed by Claude) |

## B. Proposals awaiting the owner

Claude proposed these in Stage 0 (2026-11-24). `docs/STAGE1_SPEC.md` is written so that Stage 1 can go ahead under them. The owner confirms or changes each one, at the latest at the Stage 1 gate.

**Status:** the owner confirmed P1–P7 as written on 2026-11-24 (HANDOFF "Owner answers"). Claude recorded them as **D14–D20** at Stage 1 gate 1A (2026-11-25). The table below stays as the record of the proposals and their reasons. No proposal is open.

| # | Proposal | Why | Proposed by |
|---|---|---|---|
| P1 | The hosted app runs over http(s) only. kanji-bridge's "double-click `index.html` from disk" (`file://`) mode is not kept. | Vite builds ES modules, and browsers block those over `file://`. A visitor of the website sees no difference. kanji-bridge itself still offers the offline download. | Claude |
| P2 | The imported data lives in `public/app/` (`data.js`, `NOTICE.md`, `LICENSE-DATA`, `licenses/`, `DATA-MANIFEST.json`, `DATA-LICENSE.md`). It is served at `/app/data.js`, so the page keeps `<script src="data.js">` unchanged. kanji-bridge's `app/index.html` and gate harness are imported as a read-only test baseline into `tests/baseline/`. | The notices are deployed next to the data. The `<script>` tag stays the same. Builds and CI need no access to kanji-bridge. | Claude |
| P3 | Test tools: **Vitest** for unit tests and **Playwright Test** (Chromium) for browser tests. kanji-bridge's Python/CDP harness is not ported. Its scenarios are rewritten as Playwright specs (STAGE1_SPEC §6). | One toolchain (Node) in CI and on this PC. Playwright has built-in servers, a fixed clock, network blocking, screenshots and traces. | Claude |
| P4 | Branch protection on `main` requires a pull request and passing CI, with **0 required approving reviews**. The owner gives approval by merging: only the owner has write access. | GitHub does not let the author of a pull request approve it. The owner, and the agents working under the owner's account, all open pull requests as the same user, so a "1 approval" rule would block every merge. | Claude |
| P5 | The Stage 1 gate has two parts. **1A**: Claude checks the code evidence. **1B**: after the owner connects Cloudflare Pages (HANDOFF), Claude checks the preview URL. Stage 1 is done after 1B. | PROMPT §5 lists "the preview URL works" as a Done-when criterion, but the Cloudflare connection needs the owner's account and comes after the code passes. | Claude |
| P6 | In Stage 1, the UI text in `app/index.html` is filled in from `src/i18n/ja.json` at build time, by a small Vite plugin. Stage 2 decides how the language switches at run time. | The DOM stays byte-identical to app v2, without extra `data-i18n` attributes. Stage 2 keeps every option open. | Claude |
| P7 | Node.js **24.19.0** (the version on this PC) is pinned in `.nvmrc` for local work, GitHub Actions and Cloudflare Pages. | The same runtime is used everywhere. | Claude |
