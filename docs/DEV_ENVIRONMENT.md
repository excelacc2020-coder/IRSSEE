# Dev → Prod Environment Guide

This project uses a **two-environment** flow on Vercel + Supabase.

| Environment | Git branch | Vercel deployment | Supabase project |
|-------------|-----------|-------------------|------------------|
| **Production** | `main` | Production (live domain) | Prod Supabase |
| **Dev** | `dev` | Preview (auto URL per push) | **Separate** Dev Supabase |

Rule: never push experimental work to `main`. Work on `dev`, test on its Preview
URL against the Dev database, and only then promote to Prod by merging `dev → main`.

---

## One-time setup

### 1. Create a separate Dev Supabase project

1. Go to https://supabase.com/dashboard → **New project** (e.g. `irssee-dev`).
2. Open the new project's **SQL Editor** and run the full contents of
   [`supabase/schema.sql`](../supabase/schema.sql). This creates all tables
   (including the `topic_stories` column) with RLS policies.
3. From **Project Settings → API**, copy:
   - **Project URL** → this is the Dev `VITE_SUPABASE_URL`
   - **anon public** key → this is the Dev `VITE_SUPABASE_ANON_KEY`

### 2. Point Vercel Preview builds at the Dev Supabase

Vercel lets you scope environment variables per environment. We set the
**Preview** scope to the Dev database and leave **Production** on the Prod database.
Because `VITE_*` vars are inlined at build time and Vercel builds Preview and
Production separately, each deployment automatically gets the right database.

**Via the dashboard** (Project `irssee` → Settings → Environment Variables):

| Variable | Production value | Preview value |
|----------|------------------|---------------|
| `VITE_SUPABASE_URL` | (existing Prod URL) | **Dev** project URL |
| `VITE_SUPABASE_ANON_KEY` | (existing Prod anon key) | **Dev** anon key |

For each variable, add a Preview-scoped entry with the Dev value. Keep the
existing Production-scoped entries untouched.

**Or via CLI** (after `vercel login`):

```bash
vercel env add VITE_SUPABASE_URL preview        # paste Dev URL
vercel env add VITE_SUPABASE_ANON_KEY preview    # paste Dev anon key
```

After changing env vars, redeploy the `dev` branch (push any commit, or use
"Redeploy" in Vercel) so the new values are baked in.

---

## Daily workflow

```bash
# start work
git checkout dev

# ...make changes, then:
git add -A
git commit -m "feat: <change>"
git push                      # → Vercel builds a fresh Preview automatically
```

Find the Preview URL:
- **GitHub**: open the repo → the `dev` branch / its PR shows the Vercel
  deployment with an "View deployment" / preview link, **or**
- **Vercel dashboard**: project `irssee` → Deployments → the latest from `dev`.

Test the change on that Preview URL (it reads/writes the **Dev** Supabase, so
Prod data is never touched).

---

## Promote to Production

Once the change is verified on the Preview URL:

```bash
git checkout main
git merge --ff-only dev        # fast-forward; falls back to a merge commit if needed
git push origin main           # → Vercel deploys Production
git checkout dev               # go back to working branch
```

(Or open a PR `dev → main` on GitHub and merge it there.)

### Don't forget DB migrations on Prod

If the change added or altered tables/columns, run the matching SQL on the
**Prod** Supabase before or right after promoting. The current additive
migration (safe to run anytime) is:

```sql
alter table sessions add column if not exists topic_stories jsonb not null default '{}'::jsonb;
```

The full migration block lives at the bottom of [`supabase/schema.sql`](../supabase/schema.sql).
