# Deploy to GitHub Pages

Deployment is already fully configured for this repository — nothing to set
up beyond the `FIRMS_MAP_KEY` secret (see
[setup-firms-key.md](./setup-firms-key.md)).

## Automatic deployment

`.github/workflows/deploy.yml` builds the site with Vite and deploys it to
GitHub Pages (Actions-based, no `gh-pages` branch) on every push to `main`.
This includes:

- Direct pushes/merges to `main`
- Commits made by the `refresh-firms.yml` workflow (every 3h), which push
  changed data straight to `main` and naturally re-trigger `deploy.yml` via
  its normal push trigger

## Manual deployment

1. Go to the repository's Actions tab
2. Select "Deploy to GitHub Pages" (`deploy.yml`)
3. Click "Run workflow" on `main`

## Base path

`vite.config.js`'s `getBasePath()` auto-detects the deployment base path:

1. `VITE_BASE_PATH` environment variable, if set (CI override)
2. `GITHUB_REPOSITORY` (GitHub Actions), derives `/repo-name/`
3. Falls back to `package.json`'s `name` field
4. Defaults to `/` for local development

Renaming the GitHub repository needs no config change — the base path
follows the repo name automatically.

## Monitoring deployment

1. Go to the Actions tab
2. Open the latest "Deploy to GitHub Pages" run
3. View real-time logs; the deployment URL appears in the job summary when
   complete
