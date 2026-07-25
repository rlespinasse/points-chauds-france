# How to Deploy to GitHub Pages

This guide shows how to deploy your atlas to GitHub Pages so it's live on the web.

## Prerequisites

- Your atlas is working locally (`npm run dev`)
- A GitHub account
- Git installed locally

## Step 1: Create GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. Name: `my-atlas` (or your project name)
3. Click **Create repository** (don't initialize with README)

## Step 2: Push Your Code

```bash
git init
git add .
git commit -m "init: my atlas"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/my-atlas.git
git push -u origin main
```

## Step 3: Enable GitHub Pages

1. Go to your repo → **Settings** → **Pages**
2. Source: **Deploy from a branch**
3. Branch: `gh-pages` (will be auto-created by workflow)
4. Click **Save**

## Step 4: Wait for Deploy

GitHub Actions automatically builds and deploys on each push.

Check status:
1. Go to your repo → **Actions**
2. Look for the **"Deploy to GitHub Pages"** workflow
3. Wait for green checkmark ✅ (usually 1-2 minutes)

## Step 5: Visit Your Atlas

Your atlas is live at:
```
https://YOUR-USERNAME.github.io/my-atlas/
```

Replace `YOUR-USERNAME` with your GitHub username.

## Updating Your Atlas

Every time you push to `main`, GitHub Actions auto-deploys:

```bash
# Make changes locally
git add .
git commit -m "add new layer"
git push
# ~2 minutes later, your atlas is updated
```

## Troubleshooting

**Deploy failed?**
- Check Actions tab for error logs
- Common cause: typo in package.json scripts

**Base path wrong?**
- The template auto-detects `/my-atlas/` from repo name
- If wrong, set `VITE_BASE_PATH` in repo secrets

**Custom domain?**
- See GitHub Pages docs: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site

---

**Done!** Your atlas is on the web. 🎉
