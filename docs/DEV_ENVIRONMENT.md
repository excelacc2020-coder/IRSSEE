# Dev → Prod Environment Guide

This project runs a **two-environment** setup on Vercel + Supabase.

| Environment | Git branch | Vercel deployment | Supabase project |
|-------------|-----------|-------------------|------------------|
| **Production** | `main` | Production (`irssee.vercel.app`) | Prod Supabase |
| **Dev** | `dev` | Preview (auto-built per push) | **Dev** Supabase (`ogknjlwtlzdqcofnqehy`) |

**Golden rule:** never push experimental work to `main`. Work on `dev`, test on its
Preview URL (which talks to the Dev database), then promote by merging `dev → main`.

## Live URLs

- **Dev Preview (always latest `dev`):**
  `https://irssee-git-dev-hasnains-projects-d9d5d007.vercel.app`
- **Production:** `https://irssee.vercel.app`

> The Dev Preview is gated by **Vercel Deployment Protection** — open it while logged
> into Vercel, or set Project → Settings → Deployment Protection → Vercel Authentication
> to **"Only Production"** to make Previews publicly viewable (needed for phone testing
> without a Vercel login).

---

## How the Dev database is wired (already done)

`VITE_*` env vars are inlined at **build time**, so each environment must build with its
own Supabase values. Both Supabase vars existed as a single record targeting
**all** environments (Production values). To point **only** the `dev` Preview at the Dev
database **without touching Production**, we added **branch-scoped** overrides:

| Variable | Scope | Value |
|----------|-------|-------|
| `VITE_SUPABASE_URL` | Preview · branch `dev` | Dev project URL |
| `VITE_SUPABASE_ANON_KEY` | Preview · branch `dev` | Dev anon key |

Branch-scoped values take precedence over the environment-wide value for that branch,
so `dev` builds use the Dev DB while every other deployment (incl. Production) keeps the
original values.

To reproduce / change these (needs a Vercel token with team scope
`hasnains-projects-d9d5d007`):

```bash
# add a branch-scoped Preview override (value piped from stdin)
vercel env add VITE_SUPABASE_URL preview dev --scope hasnains-projects-d9d5d007
vercel env add VITE_SUPABASE_ANON_KEY preview dev --scope hasnains-projects-d9d5d007
```

After changing env vars, **redeploy `dev`** so the new values bake in:

```bash
git commit --allow-empty -m "chore: rebuild dev" && git push   # easiest, or
vercel redeploy <dev-deployment-url> --scope hasnains-projects-d9d5d007
```

---

## Dev Supabase project (one-time, already done)

1. Created a separate Supabase project (`Dev ea-command-center`,
   `https://ogknjlwtlzdqcofnqehy.supabase.co`).
2. Ran the full [`supabase/schema.sql`](../supabase/schema.sql) in its SQL Editor —
   creates every table (incl. `topic_stories`) with RLS.
3. Copied **Project URL** + **anon public** key into the Vercel branch-scoped vars above.

The Dev database is **empty and isolated**: you sign up with a fresh account there, and
re-enter your Claude API key in the app's Settings (the `user_settings` row is per-DB).
If signup stalls, disable **Authentication → Providers → Email → "Confirm email"** in the
Dev project for fast testing.

---

## Daily workflow

```bash
git checkout dev
# ...edit...
git add -A && git commit -m "feat: <change>"
git push                       # → Vercel auto-builds a fresh Dev Preview
```

Find the build: GitHub commit/PR shows a Vercel check, or Vercel dashboard →
project `irssee` → Deployments → latest from `dev`. Test on the Dev Preview URL above.

---

## Promote to Production

Once verified on the Dev Preview:

**Via PR (recommended):**
```bash
gh pr create --base main --head dev --title "Promote dev → main" --body "..."
# review, then merge on GitHub → Vercel deploys Production
```

**Or fast-forward merge:**
```bash
git checkout main
git merge --ff-only dev
git push origin main           # → Vercel deploys Production
git checkout dev
```

### Run matching DB migrations on Prod

If the change altered the schema, run the matching SQL on the **Prod** Supabase too.
Current additive migration (safe to run anytime):

```sql
alter table sessions add column if not exists topic_stories jsonb not null default '{}'::jsonb;
```

The full migration block is at the bottom of [`supabase/schema.sql`](../supabase/schema.sql).

---

## Connection map (what's linked to what)

- **GitHub `excelacc2020-coder/IRSSEE` ↔ Vercel `irssee`** — connected; pushes to any
  branch build automatically (`main` → Production, others → Preview).
- **Vercel Preview (`dev` branch) ↔ Dev Supabase** — via branch-scoped env vars (above).
- **Vercel Production (`main`) ↔ Prod Supabase** — via the original all-environment vars.
- **GitHub ↔ Supabase** — *not* connected; schema changes are applied manually per the
  promote step above.
