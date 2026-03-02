# NeuralTwin Vercel Deployment Guide

> Last updated: 2026-03-02 | Sprint 4.12

This guide covers deploying the two NeuralTwin frontend applications to Vercel:

- **Website** (`apps/website/`) -- Marketing site + AI chatbot
- **OS Dashboard** (`apps/os-dashboard/`) -- Store management dashboard + 3D Digital Twin

---

## Prerequisites

- A [Vercel](https://vercel.com) account (Team: `neuraltwin`, ID: `team_99OKm0dmGJPwBcFLcIPkI0GG`)
- GitHub repository connected to Vercel
- Supabase project URL and anon key (project ref: `bdrvowacecxnraaivlhr`)

---

## 1. Create Vercel Projects

You need to create **two separate Vercel projects** -- one for each app.

### 1.1 Website Project

1. Go to [Vercel Dashboard](https://vercel.com/neuraltwin) and click **Add New Project**
2. Import your GitHub repository (`NEURALTWIN_INTEGRATED`)
3. Configure the project:

| Setting | Value |
|---------|-------|
| **Project Name** | `neuraltwin-website` |
| **Framework Preset** | Vite |
| **Root Directory** | `apps/website` |
| **Build Command** | _(leave empty -- uses vercel.json)_ |
| **Output Directory** | _(leave empty -- uses vercel.json)_ |
| **Install Command** | _(leave empty -- uses vercel.json)_ |
| **Node.js Version** | 20.x |

4. Add environment variables (see Section 2 below)
5. Click **Deploy**

### 1.2 OS Dashboard Project

1. Click **Add New Project** again
2. Import the **same** GitHub repository
3. Configure the project:

| Setting | Value |
|---------|-------|
| **Project Name** | `neuraltwin-os` |
| **Framework Preset** | Vite |
| **Root Directory** | `apps/os-dashboard` |
| **Build Command** | _(leave empty -- uses vercel.json)_ |
| **Output Directory** | _(leave empty -- uses vercel.json)_ |
| **Install Command** | _(leave empty -- uses vercel.json)_ |
| **Node.js Version** | 20.x |

4. Add environment variables (see Section 2 below)
5. Click **Deploy**

> **Important**: The `vercel.json` in each app directory already defines `buildCommand`, `installCommand`, and `outputDirectory`. Vercel will automatically pick these up. Do NOT override them in the project settings UI.

---

## 2. Environment Variables

Both apps require the same environment variables. Set these in each Vercel project under **Settings > Environment Variables**.

### Required Variables

| Variable | Value | Environments |
|----------|-------|-------------|
| `VITE_SUPABASE_URL` | `https://bdrvowacecxnraaivlhr.supabase.co` | Production, Preview, Development |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Your Supabase anon/public key | Production, Preview, Development |

### Optional Variables

| Variable | Description | Environments |
|----------|-------------|-------------|
| `VITE_OPENWEATHERMAP_API_KEY` | Weather data API | Production |
| `VITE_DATA_GO_KR_API_KEY` | Korean public data API | Production |
| `VITE_CALENDARIFIC_API_KEY` | Calendar/holiday API | Production |

> **Security Note**: `VITE_` prefixed variables are embedded at build time and visible in client-side JavaScript. Never put secret keys (service role keys, API secrets) in `VITE_` variables.

### How to find the Supabase anon key

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/bdrvowacecxnraaivlhr/settings/api)
2. Under **Project API keys**, copy the `anon` / `public` key
3. This is safe to use in the frontend (protected by RLS policies)

---

## 3. Custom Domain Setup

### Website (recommended: `neuraltwin.com` or `www.neuraltwin.com`)

1. Go to Vercel project `neuraltwin-website` > **Settings > Domains**
2. Add your domain (e.g., `neuraltwin.com`)
3. Configure DNS at your domain registrar:
   - **A Record**: `76.76.21.21` (for apex domain)
   - **CNAME**: `cname.vercel-dns.com` (for `www` subdomain)
4. Vercel will automatically provision an SSL certificate

### OS Dashboard (recommended: `os.neuraltwin.com` or `app.neuraltwin.com`)

1. Go to Vercel project `neuraltwin-os` > **Settings > Domains**
2. Add subdomain (e.g., `os.neuraltwin.com`)
3. Configure DNS:
   - **CNAME**: `cname.vercel-dns.com`
4. SSL is automatic

---

## 4. Build Configuration Details

Both apps use a monorepo build strategy. The `vercel.json` in each app directory instructs Vercel to:

1. **Navigate to monorepo root**: `cd ../..`
2. **Install all workspace dependencies**: `pnpm install --frozen-lockfile`
3. **Build via Turborepo**: `pnpm turbo run build --filter=@neuraltwin/<app>`
4. **Serve the output**: from the `dist/` directory in the app folder

### vercel.json features

| Feature | Website | OS Dashboard |
|---------|---------|-------------|
| Framework | Vite | Vite |
| SPA Rewrite | `/* -> /index.html` | `/* -> /index.html` |
| Clean URLs | Yes | Yes |
| Security Headers | X-Content-Type-Options, X-Frame-Options, XSS-Protection, Referrer-Policy, Permissions-Policy | Same |
| Hashed Asset Caching | 1 year, immutable | 1 year, immutable |
| Font Caching (CORS) | 1 year, immutable, `Access-Control-Allow-Origin: *` | Same |
| Image Caching | 1 day + stale-while-revalidate 7 days | Same |
| 3D Asset Caching | `/models/*.glb` -- 30 days | `/assets/*.glb` -- 1 year, immutable |
| Preset Caching | `/presets/*` -- 1 day | `/lighting-presets/*` -- 1 day |

---

## 5. CI/CD with GitHub Actions

An optional GitHub Actions workflow is available at `.github/workflows/deploy-vercel.yml` for automated deployments.

### Setup

1. Install the [Vercel CLI](https://vercel.com/docs/cli) and link your projects:
   ```bash
   npx vercel link --project neuraltwin-website --scope neuraltwin
   npx vercel link --project neuraltwin-os --scope neuraltwin
   ```

2. Get your Vercel token from [Vercel Tokens](https://vercel.com/account/tokens)

3. Add the following secrets to your GitHub repository (**Settings > Secrets and variables > Actions**):

| Secret | Description |
|--------|-------------|
| `VERCEL_TOKEN` | Your Vercel personal access token |
| `VERCEL_ORG_ID` | Team ID: `team_99OKm0dmGJPwBcFLcIPkI0GG` |
| `VERCEL_WEBSITE_PROJECT_ID` | Project ID for `neuraltwin-website` (find in `.vercel/project.json` after linking) |
| `VERCEL_OS_PROJECT_ID` | Project ID for `neuraltwin-os` (find in `.vercel/project.json` after linking) |

4. The workflow triggers automatically on push to `main` when files in `apps/website/` or `apps/os-dashboard/` change.

### Manual Deployment

To deploy manually without CI/CD:

```bash
# Website
cd apps/website
npx vercel --prod --token=$VERCEL_TOKEN

# OS Dashboard
cd apps/os-dashboard
npx vercel --prod --token=$VERCEL_TOKEN
```

---

## 6. Deployment Checklist

### Pre-deployment

- [ ] All environment variables set in Vercel project settings
- [ ] `pnpm install && pnpm build` succeeds locally
- [ ] `pnpm type-check` passes with no errors
- [ ] `pnpm lint` passes with no errors
- [ ] E2E tests pass (`pnpm --filter @neuraltwin/website test:e2e`)
- [ ] E2E tests pass (`pnpm --filter @neuraltwin/os-dashboard test:e2e`)
- [ ] Supabase Edge Functions are deployed and accessible

### Post-deployment

- [ ] Website loads at production URL
- [ ] OS Dashboard loads at production URL
- [ ] Supabase connection works (check login, data loading)
- [ ] AI chatbot responds (requires Edge Functions + AI API keys)
- [ ] 3D Digital Twin scene renders (OS Dashboard)
- [ ] i18n language switching works (ko/en/ja)
- [ ] SPA routing works (navigate, refresh, direct URL access)
- [ ] Static assets are cached (check `Cache-Control` headers in DevTools)
- [ ] Security headers present (check in DevTools Network tab)
- [ ] No console errors in browser DevTools

### Performance Checks

- [ ] Lighthouse score > 80 (Performance)
- [ ] First Contentful Paint < 2s
- [ ] Largest Contentful Paint < 4s
- [ ] 3D assets load progressively (not blocking initial render)

---

## 7. Troubleshooting

### Build fails with "command not found: pnpm"

Vercel may not have pnpm pre-installed. The `installCommand` in vercel.json uses `pnpm install --frozen-lockfile`, which requires pnpm. Vercel auto-detects pnpm from `pnpm-lock.yaml` in the repo root. If it fails:

- Ensure `pnpm-lock.yaml` exists in the repository root
- Set `ENABLE_EXPERIMENTAL_COREPACK=1` in Vercel environment variables
- Or add `packageManager` field to root `package.json`:
  ```json
  "packageManager": "pnpm@9.15.9"
  ```

### Build fails with "Cannot find module '@neuraltwin/types'"

The monorepo workspace packages must build first. The `buildCommand` uses Turborepo which handles dependency ordering automatically via `dependsOn: ["^build"]` in `turbo.json`. If this still fails:

- Check that `packages/types/`, `packages/shared/`, and `packages/ui/` have `build` scripts
- Ensure `pnpm-workspace.yaml` includes `packages/*`

### 404 on page refresh (SPA routing)

Both vercel.json files include `"rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]`. If you still get 404s:

- Verify the rewrite rule exists in your vercel.json
- Check that `index.html` exists in the `dist/` output
- Clear Vercel's build cache: Project Settings > General > Build Cache > Purge

### Environment variables not working

- `VITE_` variables are embedded at **build time**, not runtime
- After changing env vars, you must **redeploy** (not just restart)
- Check the build logs to confirm variables are being injected
- In browser console: `import.meta.env.VITE_SUPABASE_URL` should return the URL

### 3D models not loading (OS Dashboard)

- Check that `.glb` files are in `public/` directory (not in `src/`)
- Verify CORS headers allow your domain
- Check browser Network tab for 404 on model files
- Large `.glb` files (>50MB) may hit Vercel's file size limit (consider CDN for large assets)

### Monorepo detection issues

If Vercel does not correctly detect the monorepo structure:

1. Go to Project Settings > General > Root Directory
2. Set it to `apps/website` or `apps/os-dashboard`
3. Ensure "Include files outside the root directory" is **enabled**

---

## 8. Architecture Overview

```
GitHub Repository (NEURALTWIN_INTEGRATED)
  |
  |-- push to main
  |
  +-- Vercel Project: neuraltwin-website
  |     Root: apps/website/
  |     Build: cd ../.. && pnpm turbo run build --filter=@neuraltwin/website
  |     Output: apps/website/dist/
  |     Domain: neuraltwin.com
  |
  +-- Vercel Project: neuraltwin-os
  |     Root: apps/os-dashboard/
  |     Build: cd ../.. && pnpm turbo run build --filter=@neuraltwin/os-dashboard
  |     Output: apps/os-dashboard/dist/
  |     Domain: os.neuraltwin.com
  |
  +-- Supabase (Backend)
        Edge Functions: deploy-functions.yml
        Database: PostgreSQL 17
        Auth: Supabase Auth
```
