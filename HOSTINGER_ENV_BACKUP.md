# Hostinger Environment Variables — BACKUP (Old site: salmon-donkey-222180.hostingersite.com)

> Saved on 2026-09-05 — copy these exactly when you create the NEW Hostinger site connected to GitHub.

## Old site env vars (from your screenshot) — 5 vars

| Key | Value |
|-----|-------|
| `SUPABASE_URL` | `https://cuxcggdyumngomcogmow.supabase.co` |
| `SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNleGNnZ2R5dW1uZ29tY29nbW93Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNDI5NzIsImV4cCI6MjA5Njk0ODk3NX0.tK39hcDecQ4-RxKtTtr5IGXiYsQ7eMOyhh9alIOAZ8I` |
| `NODE_ENV` | `production` |
| `BOOKING_URL` | `https://calendly.com/clauseandcode/consultation` |
| `DB_TYPE` | `supabase` |

> Note: `SUPABASE_ANON_KEY` is a long JWT — make sure you copy it as ONE line with no spaces or line breaks. Best to use Hostinger's `Import .env` or copy-paste directly from old panel before you delete.

---

## What to add on the NEW Hostinger site (connected to Webzz-fancy repo)

Your code is a **Node app** (`server.js` + `dist`), not a static site. Hostinger builds with `npm install` → `vite build` (via `postinstall`).

Add these 5 again **PLUS** the `VITE_` versions so the frontend can read them at build time:

### 1. Required (same as old site)
```
SUPABASE_URL=https://cuxcggdyumngomcogmow.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNleGNnZ2R5dW1uZ29tY29nbW93Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNDI5NzIsImV4cCI6MjA5Njk0ODk3NX0.tK39hcDecQ4-RxKtTtr5IGXiYsQ7eMOyhh9alIOAZ8I
NODE_ENV=production
BOOKING_URL=https://calendly.com/clauseandcode/consultation
DB_TYPE=supabase
```

### 2. Frontend build vars (ADD these — same values, with VITE_ prefix)
```
VITE_BOOKING_URL=https://calendly.com/clauseandcode/consultation
VITE_SUPABASE_URL=https://cuxcggdyumngomcogmow.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNleGNnZ2R5dW1uZ29tY29nbW93Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNDI5NzIsImV4cCI6MjA5Njk0ODk3NX0.tK39hcDecQ4-RxKtTtr5IGXiYsQ7eMOyhh9alIOAZ8I
VITE_API_BASE_URL=
VITE_SITE_URL=https://clauseandcode.com
```

> Why both? `SUPABASE_*` / `BOOKING_URL` are for the backend (`server.js` uses `process.env`). `VITE_*` are for the frontend (`import.meta.env` — Vite only exposes `VITE_` vars to the browser at build time). Your current `src/config/site.ts` reads `VITE_BOOKING_URL`, so without `VITE_BOOKING_URL` the button falls back to `#book-consultation`.

---

## Quick Import file (.env) for Hostinger

If Hostinger has `Import .env` button, paste this:

```
SUPABASE_URL=https://cuxcggdyumngomcogmow.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNleGNnZ2R5dW1uZ29tY29nbW93Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNDI5NzIsImV4cCI6MjA5Njk0ODk3NX0.tK39hcDecQ4-RxKtTtr5IGXiYsQ7eMOyhh9alIOAZ8I
NODE_ENV=production
BOOKING_URL=https://calendly.com/clauseandcode/consultation
DB_TYPE=supabase
VITE_SUPABASE_URL=https://cuxcggdyumngomcogmow.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNleGNnZ2R5dW1uZ29tY29nbW93Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNDI5NzIsImV4cCI6MjA5Njk0ODk3NX0.tK39hcDecQ4-RxKtTtr5IGXiYsQ7eMOyhh9alIOAZ8I
VITE_BOOKING_URL=https://calendly.com/clauseandcode/consultation
VITE_API_BASE_URL=
VITE_SITE_URL=https://clauseandcode.com
```
