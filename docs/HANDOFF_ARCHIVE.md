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
