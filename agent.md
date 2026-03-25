# AGENT.MD — Câu Hỏi Cho Em Mỗi Ngày
> Read this BEFORE doing anything. Never ask about
> what is already documented here.

## 1. PROJECT SNAPSHOT

One-line: Romantic daily-question web app for a partner, using NFC + TapLove intro + Supabase-backed streak/tokens.

| Key   | Value                                                                 |
|-------|------------------------------------------------------------------------|
| Type  | Static web app + admin dashboard                                      |
| Stack | HTML, CSS, vanilla JS, Node http server, Supabase, Vercel             |
| Repo  | Local folder: `Daily-Question-For-You` (Git remote unspecified)       |
| Deploy| Main: `https://cau-hoi-cho-em.vercel.app/` • TapLove: `https://riceeeeee.github.io/tap-for-love/` |
| Status| Live/production; used with physical NFC card                          |

## 2. FILE STRUCTURE

Only important files.

```text
Daily-Question-For-You/
  index.html        # Main user page: greeting, daily question, answer form, NFC intro container
  admin.html        # Admin-only page: passcode gate + answer history viewer
  style.css         # All styling: cards, hearts animation, admin layout, NFC intro overlay
  app.js            # Main client logic: questions, Supabase answers, love_state, NFC/TapLove flow
  admin.js          # Admin logic: passcode lock and fetching answers list from Supabase
  questions.json    # Array of Vietnamese romantic questions used for daily rotation
  supabase.js       # Supabase client init (URL + anon key, then attaches `window.supabase`)
  server.js         # Minimal Node static server for local dev (`npm run dev`)
  vercel.json       # Vercel rewrites: `/nfc` → `/` to reuse index.html with different pathname
  README.md         # Human-readable overview and setup (partially outdated vs current code)
```

## 3. DESIGN SYSTEM

Only non-default conventions.

- Colors (hex)
  - Background gradient: `#ffe4ec` → `#ffeaf1`
  - Main text: `#3d1f33`
  - Primary pinks: `#d6336c`, `#c2255c`, `#f06595`, `#ff8787`
  - Borders/surfaces: `#f3b1c8`, `#fff7fb`, `#fff0f6`, `#fff0f5`
- Fonts
  - `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
- Layout & spacing
  - App max-width: 480px mobile, 600px on ≥768px
  - Common paddings/margins: 8, 12, 16, 24 px
  - Cards: `.card` with border-radius `16px`, shadow, blurred white background
- Component patterns
  - Primary button: `.submit-button` full-width pill, gradient background
  - Textarea: `.answer-input` rounded, soft border, pink focus shadow
  - Feedback: `.feedback-message`, `.streak-message`, `.surprise`
  - Hearts background: `.hearts-container` + `.heart` with `float-heart` animation
  - NFC intro: `.nfc-intro` fullscreen overlay with hearts animation and centered copy
  - Admin overlay: `.admin-lock-overlay` modal, `.admin-app` content behind

## 4. DATA / CONTENT THAT MUST STAY CONSISTENT

Cross-file or cross-system identifiers and semantics.

- URLs & routes
  - Main app: `https://cau-hoi-cho-em.vercel.app/`
  - TapLove story: `https://riceeeeee.github.io/tap-for-love/`
  - NFC virtual route: `/nfc` (rewritten to `/` by `vercel.json`, but `window.location.pathname` stays `/nfc`)
- NFC + TapLove flow (as implemented in `app.js`)
  - First time hitting `/` with no `visited`/`taplove_flow_state`:
    - Set `localStorage.visited = "true"`
    - Set `localStorage.taplove_flow_state = "redirectedToTapLove"`
    - Redirect to TapLove URL
  - Returning from TapLove to `/` with `taplove_flow_state = "redirectedToTapLove"`:
    - Set `taplove_flow_state = "completedFirstRound"`
    - Stay on `/` (show Q&A app)
  - Subsequent visits with `taplove_flow_state = "completedFirstRound"`:
    - If no NFC return flag → `/` redirects to `/nfc`
    - On `/nfc`, intro shows, sets `sessionStorage.nfc_return_in_progress = "1"`, then redirects back to `/`
    - On `/` with `nfc_return_in_progress = "1"`, flag is cleared and user stays on `/`
- Storage keys
  - `localStorage`:
    - `visited` — marker that TapLove first-visit redirect has run once
    - `taplove_flow_state` — `"redirectedToTapLove"` or `"completedFirstRound"`
  - `sessionStorage`:
    - `nfc_return_in_progress` — `"1"` during `/nfc` → `/` intro return
- Supabase schema (as used in code)
  - Global client: `window.supabase` (attached in `supabase.js`)
  - Table `answers`:
    - Columns: `id` (uuid), `question` (text), `answer` (text), `created_at` (timestamptz), optionally `day_number`
  - Table `love_state`:
    - Single-row table tracking:
      - `id` (pk)
      - `current_streak` (int)
      - `last_answer_date` (date `YYYY-MM-DD`)
      - `tokens` (int)
      - `time_capsule_active` (bool)
- Admin passcode
  - `const ADMIN_PASSCODE = "loveadmin";` in `admin.js`
  - Client-side gate only (no backend auth)
- Question rotation
  - Source: `questions.json` ordered array
  - Daily index: `getDayOfYear(now) % questions.length`
  - Editing order/content changes day→question mapping

## 5. ARCHITECTURE DECISIONS

Each is “WHY X instead of Y”.

- Use Supabase for streak & answers instead of only `localStorage`
  - Centralizes history and love_state across devices; client is thin.
- Use static `questions.json` instead of DB-backed questions
  - Deploy-time control of content; no admin UI needed for editing questions.
- Single `love_state` row instead of per-day streak history
  - Simplifies logic to “current streak + last date + tokens + capsule flag”.
- Vercel `rewrites` for `/nfc` instead of separate NFC HTML
  - `/` and `/nfc` share `index.html` but differ by `window.location.pathname`.
- Client-side NFC/TapLove flow using `localStorage` + `sessionStorage`
  - No server state; NFC first-use and intro tracked entirely in browser.
- Simple Node `server.js` for dev instead of bundler
  - Static assets only; custom server mirrors production-like routing.

## 6. EXTERNAL SERVICES & KEYS

- Supabase
  - Purpose:
    - Store answers in `answers`
    - Store streak/tokens/time capsule in `love_state`
  - Client lib:
    - CDN: `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@1.35.6/dist/umd/supabase.min.js`
  - Project URL:
    - `SUPABASE_URL` constant in `supabase.js` (Supabase project URL)
  - Public key:
    - `SUPABASE_ANON_KEY` constant in `supabase.js` (publishable anon key; do not re-copy value elsewhere)
  - Secret storage:
    - Currently hard-coded in `supabase.js`; consider moving to env for future changes.

## 7. RULES — ALWAYS / NEVER

### ALWAYS

- Validate NFC/TapLove flow before changing `app.js`:
  - Preserve 3-phase state machine: first TapLove redirect → completion → NFC intro loop.
- Preserve Supabase table names and columns:
  - `answers` and `love_state` schemas must match client expectations unless you migrate both.
- Keep `vercel.json` `/nfc` → `/` rewrite consistent with NFC logic in `app.js`.
- Maintain mobile-first design:
  - Test at narrow widths; keep `.app` widths and spacing patterns.
- Treat Supabase URL/key as sensitive:
  - Never log full values or copy them into new files.
- Reuse existing DOM structure:
  - Prefer extending `index.html` / `admin.html` rather than creating new entrypoints.

### NEVER

- Never rename or remove `visited`, `taplove_flow_state`, or `nfc_return_in_progress` without updating NFC/TapLove logic and this doc.
- Never expose Supabase anon key or user answers in new logs or docs.
- Never break the first-visit experience:
  - First visit to `/` must route through TapLove before staying on Q&A app.
- Never bypass the admin passcode gate in `admin.html`.
- Never introduce heavy frameworks (React/Vue/etc.) without an explicit migration plan.

## 8. TODO

- BLOCKING
  - [ ] Move `SUPABASE_URL` and `SUPABASE_ANON_KEY` from hard-coded `supabase.js` into environment-based config or Vercel project settings.
  - [ ] Review Supabase RLS policies so public anon key cannot leak or corrupt unrelated data if multi-user in future.

- HIGH
  - [ ] Align README streak description with current `love_state`-based implementation (README still mentions localStorage-based streak).
  - [ ] Document Supabase `answers` and `love_state` schema in a dev-facing place (migration notes or schema file).

- LOW
  - [ ] Curate/deduplicate `questions.json` (many near-identical questions).
  - [ ] Make `ADMIN_PASSCODE` configurable instead of hard-coded `"loveadmin"`.
  - [ ] Add a simple debug/reset path for clearing NFC/TapLove storage keys in-browser.

## 9. CHANGELOG

| Version | Date       | What changed             |
|---------|------------|--------------------------|
| v1.0    | 2026-03-25 | Initial agent.md created |

---

*Last updated: 2026-03-25 — v1.0*

