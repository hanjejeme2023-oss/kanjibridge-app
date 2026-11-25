# SECURITY

The starting point is PROMPT §3 (global rules) and §8 (the owner's admin keys). Stage 4 adds the threat-model note, the security headers and the scanning setup. Every agent follows this file in every session.

## 1. Secrets

1. **No secret in any file, log, commit, chat or prompt.** This covers `.env` files, test fixtures, screenshots, CI logs, HANDOFF and gate notes.
2. The Supabase **`service_role` key** and the **database password** exist only in the owner's password manager and the Supabase dashboard. No agent ever sees them, asks for them or stores them. Server-side work that needs them, such as account deletion, runs in Supabase (for example an Edge Function whose secret is set in the dashboard). They are never placed in this repository or in Cloudflare build variables.
3. The Supabase **`anon` key** and the project URL are public by design and may be in the frontend, because Row Level Security protects the data (PROMPT §6). They go in as build-time variables (`VITE_…`) set in Cloudflare Pages and GitHub Actions, never hard-coded. They are not needed before Stage 3.
4. `.gitignore` excludes `.env`, `.env.*`, `.dev.vars*`, key and credential files. A file that may hold a secret is never staged with `git add -A` or `git add .` without a review of `git status` first.
5. If a secret is ever committed or pasted anywhere, **rotate it first**, then clean up. A secret that has been pushed to a public repository counts as leaked, even after a force-push.

## 2. Least privilege

| Who | May use | Never |
|---|---|---|
| Owner | everything ("root", PROMPT §8): GitHub, Cloudflare, Name.com, Supabase, Google Cloud | — |
| Claude, Codex | this repository (branches, pull requests), the **dev** Supabase project (from Stage 3) and local or preview deployments | the **prod** Supabase project, prod settings or prod user data, merging to `main`, DNS, the registrar, the Google OAuth client, any admin console |

- Only the owner applies migrations to prod, changes settings and touches user data.
- GitHub Actions run with `permissions: contents: read` unless a job needs more, and the extra permission is named in the workflow. Third-party actions are pinned to a full commit SHA.
- CI never needs secrets before Stage 3. From Stage 3 on, pull requests from forks never receive secrets (GitHub's default; keep it).

## 3. Privacy by design

- Store only what sync needs: progress, the UI language, and the Google account id and e-mail that Supabase Auth keeps.
- No analytics, tracking scripts, ad tags, error-reporting services or third-party embeds.
- Known third-party contacts today (`docs/STAGE1_INVENTORY.md` §4): **Google Fonts** on every page view, and **the browser's speech voices** (some "online" voices send the spoken text to Microsoft or Google). Both must be named in the privacy policy (Stage 4), or removed by decision.
- Self-service account deletion, data export and a plain-language privacy policy (en/ja/ko) are required **before the public launch** (Stage 4).
- Signing out keeps the local copy, marked as belonging to no account. Signing in as another user never mixes two users' data (PROMPT §7).

## 4. Code and content

- **No invented facts.** Readings and meanings come only from the imported data. UI text explains; it never adds dictionary content (PROMPT §3 rule 4).
- Everything from data or user input that is inserted as HTML goes through `esc()`. Translated UI strings are escaped as well. Markup that wraps them, such as a link inside a sentence, is built in code and never stored in a translation file.
- No `eval`, `new Function` or inline event-handler attributes. Inline `<script>` is avoided, so that Stage 4 can ship a strict CSP. (Today the app's markup has `style="…"` attributes; Stage 4 decides how the CSP handles them.)
- Dependencies: exact versions plus `package-lock.json`, and `npm ci` in CI. A new dependency needs a reason in the pull request. Dependency and secret scanning are switched on in Stage 4.

## 5. Changes and deployment

- Everything goes through Git: schema changes are migration files (`supabase/migrations/`), tested on dev, then applied to prod by the owner. Hosting and CI config live in this repository.
- `main` is protected (after Stage 1; HANDOFF has the owner's steps): pull request plus passing CI, merged by the owner. No force-push and no deletion. Approving reviews: see proposal P4 in DECISIONS.
- Every branch and pull request gets a Cloudflare Pages preview URL. The owner checks the preview before merging. Rollback is one click in Cloudflare.
- Update flow after launch (PROMPT §8): issue → branch → CI and preview → owner checks → owner merges → Cloudflare deploys → one-click rollback if needed.

## 6. Admin accounts (owner only, PROMPT §8)

| Key | Controls | Protection |
|---|---|---|
| GitHub | the repository and merges to `main` | 2FA; branch protection |
| Cloudflare | the site, previews, rollback, DNS | 2FA |
| Name.com (year 1) | `kanjibridge.app` | 2FA; check auto-renew before the first renewal (plan: transfer to Cloudflare) |
| Supabase | auth settings, the database, user accounts | 2FA; `service_role` never leaves the dashboard or the password manager |
| Google Cloud | the OAuth client for sign-in and its allowed URLs | 2FA; only the OAuth client, no paid APIs |

## 7. Reporting a problem

Until Stage 4 adds a security contact, report a suspected vulnerability privately to the owner through GitHub's private vulnerability reporting on this repository (the owner switches it on in Stage 4). Do not open a public issue for it.

## 8. To do in Stage 4

Threat-model note; CSP and the other security headers in Cloudflare `_headers`; Dependabot or an equivalent, and secret scanning; review of the RLS tests; prod Supabase setup by the owner; the privacy policy; account deletion and data export.
