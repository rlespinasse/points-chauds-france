#!/usr/bin/env python3
"""
Generate site/src/generated-config.js from data/sources.json

This script reads layer metadata from sources.json and generates
JavaScript config that can be imported and customized in config.ts.

Usage:
  python scripts/generate-config.py
  npm run generate  (if added to package.json scripts)
"""

import json
import sys
from pathlib import Path
from typing import Dict, List, Any

# Paths
SCRIPT_DIR = Path(__file__).parent
REPO_ROOT = SCRIPT_DIR.parent
SOURCES_FILE = REPO_ROOT / "data" / "sources.json"
OUTPUT_FILE = REPO_ROOT / "src" / "generated-config.js"


def load_sources() -> Dict[str, Any]:
    """Load sources.json"""
    if not SOURCES_FILE.exists():
        print(f"Error: {SOURCES_FILE} not found")
        print(f"Create it from data/sources.json.example")
        sys.exit(1)

    with open(SOURCES_FILE) as f:
        return json.load(f)


def generate_layer_groups(sources: Dict[str, Any]) -> str:
    """Generate layerGroups JavaScript object"""
    categories = {cat["id"]: cat["label"] for cat in sources.get("categories", [])}

    # Group layers by category
    groups: Dict[str, List[str]] = {}
    for layer_id, layer_info in sources.get("layers", {}).items():
        category_id = layer_info.get("category", "other")
        category_name = categories.get(category_id, category_id)

        if category_name not in groups:
            groups[category_name] = []

        groups[category_name].append(f"""    {{
      id: '{layer_id}',
      label: '{layer_info.get("name", layer_id)}',
      file: 'data/{layer_info.get("file", layer_id + ".geojson")}',
      active: {str(layer_info.get("active", False)).lower()},
    }}""")

    # Build layer groups array
    group_strings = []
    for group_name, layer_strs in groups.items():
        group_strings.append(f"""  {{
    group: '{group_name}',
    layers: [
{','.join(layer_strs)}
    ],
  }}""")

    return "[" + ",".join(group_strings) + "]"


def generate_styles(sources: Dict[str, Any]) -> str:
    """Generate styles JavaScript object"""
    styles = {}
    for layer_id, layer_info in sources.get("layers", {}).items():
        if "style" in layer_info:
            styles[layer_id] = layer_info["style"]

    # Convert to JavaScript object notation
    result = "{\n"
    for layer_id, style in styles.items():
        json_style = json.dumps(style, indent=4).replace("\n", "\n    ")
        result += f"  '{layer_id}': {json_style},\n"
    result += "}"

    return result


def generate_tooltips(sources: Dict[str, Any]) -> str:
    """Generate tooltips JavaScript object"""
    tooltips = {}
    for layer_id, layer_info in sources.get("layers", {}).items():
        field = layer_info.get("tooltip_field", "name")
        tooltips[layer_id] = f"(p) => p.{field} || 'Feature'"

    result = "{\n"
    for layer_id, tooltip in tooltips.items():
        result += f"  '{layer_id}': {tooltip},\n"
    result += "}"

    return result


def generate_search_props(sources: Dict[str, Any]) -> str:
    """Generate searchableProps JavaScript object"""
    search_props = {}
    for layer_id, layer_info in sources.get("layers", {}).items():
        if "search_props" in layer_info:
            props = layer_info["search_props"]
            search_props[layer_id] = {
                "title": props.get("title", "properties.name"),
                "text": props.get("text", [])
            }

    # Convert to JavaScript
    result = "{\n"
    for layer_id, props in search_props.items():
        title = props.get("title", "properties.name")
        text_array = ", ".join(f'"{t}"' for t in props.get("text", []))
        # Extract field name from dot notation (e.g., "properties.nom" → "nom")
        field = title.split(".")[-1] if "." in title else "name"
        result += f"""  '{layer_id}': {{
    title: (p) => p.{field} || 'Item',
    text: [{text_array}],
  }},
"""
    result += "}"

    return result


def generate_javascript(sources: Dict[str, Any]) -> str:
    """Generate the complete JavaScript config file"""
    now = __import__("datetime").datetime.now().isoformat()

    js = f"""/**
 * AUTO-GENERATED CONFIG - DO NOT EDIT MANUALLY
 *
 * This file is generated from data/sources.json by scripts/generate-config.py
 * Generated: {now}
 *
 * To customize:
 * 1. Edit data/sources.json
 * 2. Run: npm run generate
 * 3. Import these exports in src/config.ts
 * 4. Override or extend as needed
 */

export const layerGroups = {generate_layer_groups(sources)}

export const styles = {generate_styles(sources)}

export const tooltips = {generate_tooltips(sources)}

export const searchableProps = {generate_search_props(sources)}

/**
 * Example of how to use in src/config.ts:
 *
 * import {{ layerGroups, styles, tooltips }} from './generated-config.js'
 *
 * export const config = {{
 *   map: {{ ... }},
 *   layerGroups,
 *   styles: {{ ...styles, communes: {{ ...styles.communes, fillOpacity: 0.2 }} }},
 *   tooltips,
 *   // ... rest of config
 * }}
 */
"""

    return js


def main():
    """Main entry point"""
    try:
        # Load sources
        sources = load_sources()

        # Generate JavaScript
        js_code = generate_javascript(sources)

        # Ensure output directory exists
        OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)

        # Write output
        with open(OUTPUT_FILE, "w") as f:
            f.write(js_code)

        # Success message
        layer_count = len(sources.get("layers", {}))
        print(f"✓ Generated {OUTPUT_FILE}")
        print(f"  {layer_count} layers configured")
        print(f"\nNext step: Import in src/config.ts")
        print(f"  import {{ layerGroups, styles }} from './generated-config.js'")

    except Exception as e:
        print(f"✗ Error generating config: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
