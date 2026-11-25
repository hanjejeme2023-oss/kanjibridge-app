# Kanji Bridge (app edition) — project brief (v1.0, 2026-11-24)

Status: approved by the owner on 2026-11-24. This file is `PROMPT.md` of the repository `kanjibridge-app`. Written by Claude (claude.ai) with the owner. Agents read this first, then `docs/HANDOFF.md`.

## 0. Goal and scope (about 3 weeks)

Take the published static app **kanji-bridge** (github.com/hanjejeme2023-oss/kanji-bridge, final commit `59156e1`) and turn it into a hosted web app at its own domain. Users can:

1. read an overview page;
2. use the interface in **English (default), Japanese or Korean**;
3. sign in with **Google** and have their study progress **synced** across browsers and devices (Anki-style).

Signing in stays optional: without an account, the app works as today, with progress kept only in that browser.

**Out of scope (this project):**
- mobile apps;
- social features;
- payments;
- new learning content or any Gemini/Vertex request;
- the Vietnamese-base edition. It comes later, but the data model must allow it (§6).

## 1. People, roles and workflow

| Who | Role |
|---|---|
| **Owner (Hanje Unesaki)** | Decides; holds every admin key ("root"); approves merges to production; reviews Japanese and Korean UI text as a native speaker; tests as a learner. |
| **Claude (Claude Code)** | Architect and reviewer: specs, schema, security design, UI text drafts (en/ja/ko), stage gates. |
| **Codex** | Engineer: code, migrations, tests, CI. |
| **Claude (claude.ai)** | Helps the owner plan, reads reports, writes the next prompt. |

Workflow (same as kanji-bridge):
- Each session reads `PROMPT.md` and `docs/HANDOFF.md`, does **one** assignment, writes results and the next assignment back, commits with a `[Claude]` or `[Codex]` prefix, and stops.
- Every stage ends with a **gate**: Claude checks the evidence, not the author's report. Results go in `docs/GATES.md`; decisions go in `docs/DECISIONS.md`.

Machine safety:
- One agent at a time.
- Never run heavy builds and headless browsers at the same time.
- Browser scripts close what they start.

## 2. Starting point and reuse

- **Data:** the new repository does **not** rebuild the dictionary data. It imports the released `data.js` from kanji-bridge, pinned to a commit and checked by SHA-256, through `scripts/import_data` that also copies `NOTICE.md`, `LICENSE-DATA` and `licenses/`. Data fixes keep happening in kanji-bridge and are imported again.
- **App:** start from kanji-bridge `app/index.html` (built from its frozen prototype). Its look and behaviour are the baseline. The render-equality idea (final DOM equals the old renderer's DOM) carries over to Stage 1.
- **Licences:**
  - The data stays **CC BY-SA 4.0** with every attribution, including the EDRDG acknowledgement.
  - New code is **MIT**.
  - The overview page and "About" keep the sources, the licences and the AI-content notice.

## 3. Global rules

1. **No secret in any file, log, commit, chat or prompt.**
   - The Supabase `service_role` key and database password exist only in the owner's password manager and the Supabase dashboard.
   - The public `anon` key may be in the frontend, because Row Level Security protects the data (§6).
2. **Least privilege.**
   - Agents work only against the **dev** Supabase project and local or preview deployments.
   - Only the owner touches **prod**: applying migrations, settings, user data.
3. **Privacy by design.**
   - Store only what sync needs: progress, UI language, and the Google account id and e-mail that Supabase Auth keeps.
   - No analytics or tracking scripts.
   - Self-service account deletion, data export and a plain-language privacy policy are required before public launch.
4. **No invented facts.** Readings and meanings come only from the imported data. UI text explains; it never adds dictionary content.
5. **Look and behaviour change only by decision.** The kanji-bridge app v2 behaviour is the baseline. Every visible change is listed in DECISIONS. New screens (overview, sign-in, settings, privacy) follow the existing visual style.
6. **Everything through Git.**
   - Database schema changes are migration files (`supabase/migrations/`), reviewed and tested on dev before the owner applies them to prod.
   - Hosting and CI config live in the repository.
7. **Tests with every change.** CI (GitHub Actions) runs unit tests, the browser tests (headless Chrome) and the RLS tests on every pull request.

## 4. Architecture

| Part | Choice | Why |
|---|---|---|
| Frontend | Static site. Plain JavaScript ES modules, built with **Vite**; no UI framework in this project | Keeps the existing app; a small, standard build step; easy for agents and tests |
| UI text | `src/i18n/{en,ja,ko}.json` + a tiny `t(key)` helper; language from the user's choice, then English | Built-in switch; never browser auto-translate (it corrupts hanzi, pinyin and Vietnamese answers) |
| Hosting | **Cloudflare Pages**: production from `main`; a **preview URL for every branch or pull request** | The owner checks every change before it goes live; one-click rollback; DNS is on Cloudflare too |
| Auth and DB | **Supabase**: Google OAuth; Postgres with Row Level Security; two projects, **dev** and **prod** (the free plan allows two active projects) | Login and database without running a server; security enforced in the database |
| Domain | `kanjibridge.app`, registered through the GitHub Student Developer Pack (Name.com, first year free), DNS on Cloudflare. Fallback: register at Cloudflare | Own address; HTTPS is mandatory on .app |
| Offline | The app keeps working offline. Writes go to localStorage first and sync when online | Same feel as today |

## 5. Stages (each ends with a Claude gate)

**Stage 1 — Foundation (2–3 days).**
- New repository; Vite setup; `scripts/import_data` with checksum; the app split into modules with **no visible change**.
- All UI strings extracted to `src/i18n/ja.json` (today's wording).
- CI; Cloudflare Pages preview deployments.

Done when:
- render-equality tests pass for every view state used in the kanji-bridge gate harness;
- 0 console errors;
- the preview URL works.

**Stage 2 — Languages and overview page (4–5 days).**
- `en` (default) and `ko`, plus a language switch in the header, remembered.
- An **overview page**, opened by the logo:
  - what the app is;
  - the five views, one line and one screenshot each;
  - "Start" and (from Stage 3) "Sign in";
  - sources, licences, privacy.
- UI text: Claude drafts en/ko/ja; **the owner reviews ja and ko**.
- A one-line notice that meanings and examples are in Japanese in this version.
- Connect the domain: the first public release at `kanjibridge.app`, still without accounts.

Done when:
- every string is in all three files (a test fails on a missing key);
- no hard-coded UI text is left;
- the owner has approved the wording.

**Stage 3 — Sign-in and sync (about 5 days).**
- Google sign-in with Supabase (dev first).
- Tables and RLS (§6); the sync engine (§7); first-sign-in migration of the existing localStorage progress; sign-out keeps a local copy.

Done when:
- RLS tests prove that user A cannot read or write user B's rows with the anon key;
- the sync tests cover two browsers, offline edits, the first-sign-in cases and conflicts;
- the owner has signed in on two devices and seen the same progress.

**Stage 4 — Security, privacy, launch (3–4 days).**
- Privacy policy (en/ja/ko); account deletion and data export in settings.
- Security headers (CSP etc.) via Cloudflare `_headers`; dependency and secret scanning; branch protection.
- A threat-model note in `docs/SECURITY.md`; the prod Supabase setup by the owner; the final gate; launch.

Done when:
- the gate passes;
- the owner has done one full sign-up, sync, export and delete on prod.

## 6. Data model (draft; Stage 3 finalises it)

```sql
-- one row per user
profiles(user_id uuid primary key references auth.users on delete cascade,
         ui_lang text check (ui_lang in ('en','ja','ko')),
         known_langs text[] default '{ja,ko}',   -- future: '{vi}' for the Vietnamese-base mode
         target_langs text[] default '{zh,vi}',
         created_at timestamptz default now())

-- one row per studied item
progress(user_id uuid references auth.users on delete cascade,
         kind text,        -- 'card', 'glyph_quiz', 'rule_test', 'ff_card', 'unknown', 'read', 'new_today', 'setting'
         item_id text,     -- word_id / char_id / rule id / passage id / setting name
         value jsonb,      -- the same shape as today's localStorage entry
         updated_at timestamptz not null,
         deleted boolean default false,
         primary key (user_id, kind, item_id))
```

- RLS on both tables: `user_id = auth.uid()` for select, insert and update; no delete from the client (account deletion runs server-side).
- Size estimate: about 100 KB per typical user, up to about 0.5 KB per item; well inside the free 500 MB for the expected users.
- The kinds map one-to-one to today's localStorage keys (`kb_srs`, `kb_glyphquiz`, `kb_ruletest`/`kb_rules`, `kb_ffcard`, `kb_unknown`, `kb_read`, `kb_newtoday`, `kb_mute`).
- **Future mode:** `known_langs` and `target_langs` let the Vietnamese-base edition (vi → ja/ko) be added as a mode of the same app, with the same accounts.

## 7. Sync rules (Anki-style; owner decision)

1. **First sign-in on a browser:**
   - if the server has nothing → upload the local progress;
   - if the browser has nothing → download;
   - if **both** have progress → ask once: "Keep this device" / "Keep the cloud" (like Anki's one-way sync).
2. **After that, merge automatically per item:**
   - the newer `updated_at` wins for the same item;
   - different items from different devices are all kept.
   - Clock skew is guarded by using the server time on write.
3. Every change is written to localStorage at once, then sent in small batches (debounced, and on page hide). Offline changes queue and are sent later.
4. Sign-out: the local copy stays, marked as belonging to no account. Signing in as another user never mixes two users' data.

## 8. The owner's admin keys ("root")

| Key | What it controls | Protection |
|---|---|---|
| GitHub (code) | the repository; merges to `main` | 2FA; branch protection: pull request + passing CI + the owner's approval |
| Cloudflare (hosting + DNS) | the site, previews, rollback, DNS | 2FA |
| Name.com (domain registration, year 1) | `kanjibridge.app` | 2FA, auto-renew reviewed before the first renewal (plan: transfer to Cloudflare) |
| Supabase (users and data) | auth settings, the database, user accounts | 2FA; the `service_role` key never leaves the dashboard or password manager |
| Google Cloud (OAuth client for sign-in) | the Google sign-in screen and its allowed URLs | 2FA; only the OAuth client, no paid APIs |

**Update flow after launch:**
1. issue;
2. branch;
3. CI and a preview URL;
4. the owner checks the preview;
5. the owner merges;
6. Cloudflare deploys;
7. rollback in one click if needed.

Database changes: a migration file → tested on dev → the owner applies it to prod.

## 9. Decisions so far (owner, 2026-11-24)

- D1: UI languages en (default), ja, ko. Content (meanings, examples) stays Japanese in this project.
- D2: Anyone may register; no promotion.
- D3: Sign-in with Google only (e-mail sign-in may come later).
- D4: Sync like Anki (§7).
- D5: Domain `kanjibridge.app` (Student Pack; fallback Cloudflare). DNS on Cloudflare.
- D6: New repository; kanji-bridge stays as the finished, public milestone.
- D7: The Vietnamese-base mode comes after this project; the data model allows it (§6).
- D8: No Gemini/Vertex use in this project.
- D9: Repository `kanjibridge-app` (github.com/hanjejeme2023-oss/kanjibridge-app), public from the start. Git identity: `Hanje Unesaki <311183901+hanjejeme2023-oss@users.noreply.github.com>`.
- D10: Hosting on Cloudflare Pages, with preview deployments. Until the domain exists, the site uses its free `*.pages.dev` address.
- D11: The overview page is at `/`; the app is at `/app/`. The logo in the app links to `/`.
- D12: No other app changes requested for now; the kanji-bridge `UX_BACKLOG.md` stays a candidate list for later decisions.
- D13: Domain timing. The owner applies for the GitHub Student Developer Pack after the Thanksgiving break (on campus; verification needs presence on campus). `kanjibridge.app` must be in place before the Stage 4 public sign-in launch; fallback: register it at Cloudflare. Supabase sign-in redirect URLs list both the `*.pages.dev` address and the domain.
