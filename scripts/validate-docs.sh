#!/bin/bash
# Valide que tous les liens markdown relatifs dans docs/**/*.md pointent
# vers un fichier existant.

set -uo pipefail

if [ ! -d "docs" ]; then
  echo "✓ No docs/ directory - skipping validation"
  exit 0
fi

echo "Validating documentation links..."

broken=0

while IFS= read -r -d '' file; do
  dir=$(dirname "$file")
  while IFS= read -r link; do
    # Ignore les liens externes et les ancres pures.
    case "$link" in
      http://*|https://*|mailto:*|\#*) continue ;;
    esac
    path="${link%%#*}"
    [ -z "$path" ] && continue
    fullpath="$dir/$path"
    if [ ! -f "$fullpath" ]; then
      echo "✗ Broken link in $file: $link"
      broken=$((broken + 1))
    fi
  done < <(grep -oE '\]\([^)]+\.md[^)]*\)' "$file" | sed -E 's/^\]\(([^)]+)\)$/\1/')
done < <(find docs -name '*.md' -print0)

echo ""
if [ "$broken" -gt 0 ]; then
  echo "✗ Found $broken broken link(s)!"
  exit 1
fi

echo "✓ All documentation links are valid!"
exit 0
