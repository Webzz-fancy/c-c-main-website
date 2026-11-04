# Security work: handoff

Everything on this branch (`security/for-developer`) is ready but **not live**. `main` is the last known-good version (`a508a48`).

## Background

PR #4 shipped most of this in one go on 2026-11-04. Afterwards the live site returned Hostinger's 503 "The server is temporarily busy" on every URL for over an hour. Restoring `main` brought it back.

- The code installs, builds and runs fine on Node 18 locally, so the cause was most likely on the host. Hostinger's docs say this 503 usually means the plan hit its process (NPROC) or memory limit, and leftover processes from earlier deploys count toward it.
- Contributing: the merge also triggered the screenshot workflow, which pushed to `main` 3 minutes later and caused a second deploy. Commit 3 below stops that.
- PR #4 also made the app exit on any uncaught exception. That is **not** on this branch; crashes are still logged and the app keeps running.
- Nobody has looked at the runtime logs from the outage. If they are still in hPanel (Runtime Logs, or `domains/<domain>/hbuilds/current/nodejs/stderr.log`), they are worth a look first.

## Commits, oldest first

| Commit | What | Runs on |
|---|---|---|
| `d0ca5ea`, `f1ee0c8` | **Security headers.** CSP (inline `cc-js` script by hash, with a built-in fallback; `wasm-unsafe-eval` for drei's meshopt decoder in the 3D robot), `X-Frame-Options: DENY`, COOP, fuller `Permissions-Policy`. | Node 18+ |
| `7514831` | **Server tidy.** Removes unused `/api/contact` and `/api/drop-problem` (with body parser, in-memory limiter and name/email logging). `/api/health` returns `{ok:true}` only. Generic 500 handler with no stack traces. Privacy text and `docs/quiz-backend.md` updated. | Node 18+ |
| `f982e03` | **Repo hygiene.** The screenshot workflow is manual-only and pushes to `shots/run-<id>`, never `main`. Checkout is pinned to a SHA and sharp to a version. `.gitignore` covers `.env.*` and `.claude/`. The Vite dev server listens on localhost only. `DEPLOY.md` no longer recommends `credential.helper store`. | Node 18+ |
| `36060dd` | **Vite 7.3.7.** Brings esbuild 0.28.2, which clears the withdrawn GHSA-gv7w-rqvm-qjhr scanner warning. `engines` is `^20.19.0 \|\| >=22.12.0`. | **Node 20.19+ only.** On Node 18 the build fails and Hostinger keeps the previous version. |

Each step also has its own branch: `deploy/1-security-headers`, `deploy/2-server-tidy`, `deploy/3-repo-hygiene` and `deploy/5-vite7-after-node22`.

## How it was tested

Each step went through a Hostinger-style run on Node 18 (and Node 22 for the last two):

- fresh `npm install` with the postinstall build;
- boot on a Unix socket and on TCP;
- every page returns 200, `/complex` returns 301, and `/server.js`, `/package.json` and `/.git/config` return 404;
- malformed requests, a dropped download and a 200-request burst leave the app up.

In a browser, no page shows CSP violations or console errors, and the 3D robot on `/simple` renders.

## Suggested rollout

1. In hPanel → Resource Usage, stop stuck processes, then restart the app.
2. Merge up to `f982e03` (that is `deploy/3-repo-hygiene`) in **one** deploy. Wait for it to finish, then check the pages, the headers (`curl -I`) and the 3D robot on `/simple`.
3. Switch the app to Node 22 in hPanel (this redeploys). Check again.
4. Merge `36060dd` (Vite 7).

Rollback at any step: put `main`'s files back to `a508a48` as a new commit; no force-push needed.

## Still open, outside this branch

- **Supabase anon key in git history**: `HOSTINGER_ENV_BACKUP.md`, commits `128fe09` and `de1f528`. Pause or delete that project, or rotate the key and confirm RLS on every table. A history scrub needs a force-push and the owner's OK.
- **Quiz email endpoint** (`/api/quiz-plan`) doesn't exist yet. Follow "Abuse and security" in `docs/quiz-backend.md` when building it.
- The CDN adds its own `content-security-policy: upgrade-insecure-requests`. After deploy, confirm the app's CSP still arrives alongside it.
