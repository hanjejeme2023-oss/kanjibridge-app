# GATES

Every stage ends with a gate (PROMPT §1). Claude checks the stage's **Done when** criteria against the **evidence**: re-run tests, files, hashes, screenshots and CI runs. Claude does not rely on the author's report.

- **PASS**: the next assignment is written in HANDOFF.
- **FAIL**: the exact failures and fixes go to the author, who fixes only those items and hands the work back.
- **A second FAIL of the same gate**: Claude stops and asks the owner.

Every entry records: the date, the reviewer, the commit checked, every criterion with its evidence, and the result. Problems that do not block the gate go to "Open notes" in HANDOFF.

Machine safety during gates: one agent at a time; never a build and a headless browser at the same time; browser runs close what they start.

## Stage 0 (Claude, 2026-11-24)

No gate: Stage 0 sets up the repository and writes the Stage 1 assignment. It contains no app code.

## Stage 1 gate (planned; criteria in `docs/STAGE1_SPEC.md` §11)

- **Part 1A (code)**: Claude runs, on this PC, `npm ci`, `npm run check:data`, `npm run test:unit`, `npm run build` and then `npm run test:browser`, one at a time. Claude checks the GitHub Actions run for the same commit, the data hashes, the i18n coverage, and a sample of the parity checkpoints with their screenshots.
- **Part 1B (preview)**: after the owner connects Cloudflare Pages (HANDOFF, owner steps), Claude checks the preview URL of the Stage 1 branch.

| Part | Date | Commit | Result |
|---|---|---|---|
| 1A | — | — | — |
| 1B | — | — | — |
