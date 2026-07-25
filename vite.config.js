import { defineConfig } from 'vite'
import { readFileSync } from 'fs'

// Smart base path detection
function getBasePath() {
  // 1. Check environment variable (for CI/CD overrides)
  if (process.env.VITE_BASE_PATH) {
    return process.env.VITE_BASE_PATH
  }

  // 2. Check GitHub Actions environment
  if (process.env.GITHUB_REPOSITORY) {
    const repoName = process.env.GITHUB_REPOSITORY.split('/')[1]
    return `/${repoName}/`
  }

  // 3. Try to read from package.json name
  try {
    const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))
    const name = pkg.name
    if (name && name !== 'geopages-template') {
      return `/${name}/`
    }
  } catch (e) {
    // Fallback if package.json read fails
  }

  // 4. Development: root path
  return '/'
}

export default defineConfig({
  base: getBasePath(),
  server: {
    port: 5173,
    open: true,
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    sourcemap: false,
    cssMinify: false,
  },
})
