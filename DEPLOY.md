# Pushing to GitHub

Repo: `https://github.com/navara-y/clauseandcode`

> These commands **force overwrite** whatever is currently on `main`. That is
> intentional here — the old version is being replaced completely.

## 1. One-time setup (run inside this folder)

```bash
cd clause-code

git init
git branch -M main
git add .
git commit -m "Rebuild homepage: hero, approach, projects, ways to work, quiz, footer"
git remote add origin https://github.com/navara-y/clauseandcode.git
```

If a remote called `origin` already exists, replace the last line with:

```bash
git remote set-url origin https://github.com/navara-y/clauseandcode.git
```

## 2. Force push (replaces everything on the remote)

```bash
git push --force origin main
```

If the remote's default branch is `master` rather than `main`:

```bash
git push --force origin main:master
```

## 3. Later, normal pushes

```bash
git add .
git commit -m "Describe the change"
git push
```

---

## What gets committed

42 files. `node_modules/`, `dist/`, and `.env` are excluded by `.gitignore` —
never commit those. `.env.example` **is** committed as documentation.

## Authentication

GitHub no longer accepts account passwords over HTTPS. When prompted for a
password, paste a **Personal Access Token**:

1. GitHub → Settings → Developer settings → Personal access tokens →
   Tokens (classic) → *Generate new token*
2. Tick the **`repo`** scope, generate, and copy it
3. Username: `navara-y`, Password: *the token*

To avoid re-entering it every time:

```bash
git config --global credential.helper store
```

## Hostinger (Git-connected Node.js app)

Nothing to configure. Hostinger clones the repo and runs `npm install`, then
boots the app. Both entry paths are wired:

- `postinstall` runs `vite build`, so `dist/` is produced during install
- **`server.js`** in the project root is the entry point — the filename
  Hostinger's panel looks for. `package.json` sets `"main": "server.js"` and
  `"start": "node server.js"`.
- `server.js` is **CommonJS**, and `package.json` has **no `"type": "module"`**.
  Passenger `require()`s the entry file and Node 18 cannot `require()` ESM;
  getting this wrong produces a **503 Service Unavailable** with a clean build
  log. Config files that must stay ESM use `.mjs`.

**Why build tools sit in `dependencies`, not `devDependencies`**

Hosts commonly install with `NODE_ENV=production`, which skips
`devDependencies`. Vite lives in `dependencies` so the build can still run.
Only type definitions and the linter — things the build does not need — remain
in `devDependencies`.

**Node version:** 18.18+ (Hostinger's default 18.x is fine).

The server exposes:

- `GET  /api/health`
- `POST /api/contact`
- `POST /api/drop-problem`

## Deploying the built site

```bash
npm install
npm run build     # outputs dist/
```

| Host | Build command | Publish directory |
| --- | --- | --- |
| Vercel / Netlify / Cloudflare Pages | `npm run build` | `dist` |
| Hostinger / cPanel | run locally | upload **contents** of `dist/` to `public_html` |

Node 18 or newer is required.
