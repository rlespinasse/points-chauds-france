/**
 * Discover datasets from data.gouv.fr
 * Usage: npm run discover-dataset -- "your search query"
 *
 * This is a placeholder script. In practice, you'll use Claude Code
 * to query datagouv MCP directly, which is faster and more interactive.
 */

const query = process.argv.slice(2).join(' ')

if (!query) {
  console.log(`
Usage: npm run discover-dataset -- "search query"

Examples:
  npm run discover-dataset -- "communes France"
  npm run discover-dataset -- "regions administratives"
  npm run discover-dataset -- "cadastre"

For the best experience, use Claude Code to discover datasets:
  1. Open this project in Claude Code
  2. In chat, ask: "Find datasets about [your topic]"
  3. Claude will use datagouv MCP to search and suggest datasets

Once you find a dataset:
  1. Note the dataset ID and resource ID
  2. Create/update your data/sources.json with the metadata
  3. See docs/how-to/discover-datasets.md for details
`)
  process.exit(0)
}

console.log(`
Searching for: "${query}"

Claude Code + datagouv MCP is the recommended way to discover datasets.

To use it:
  1. Ask Claude Code: "Find datasets about ${query}"
  2. Claude will return matching datasets with links
  3. Copy the dataset ID and resource ID into data/sources.json

Manual search:
  Visit: https://www.data.gouv.fr/en/search/?q=${encodeURIComponent(query)}

For a hands-on guide, see: docs/how-to/discover-datasets.md
`)
