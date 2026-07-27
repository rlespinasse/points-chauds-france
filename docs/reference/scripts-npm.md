# Scripts npm

Commandes disponibles, telles que définies dans `package.json`.

## Développement

### `npm run dev`

Démarre le serveur de développement Vite avec rechargement à chaud sur
`http://localhost:5173`, en utilisant les données GeoJSON déjà commitées
sous `public/data/`.

### `npm run build`

Build de production via Vite, sortie dans `dist/`.

### `npm run preview`

Sert le build de production depuis `dist/` en local, pour une dernière
vérification avant le déploiement.

## Pipeline de données

### `npm run fetch-firms`

Exécute `scripts/fetch-firms.mjs` : récupère les dernières détections
FIRMS, les géocode inversement, réécrit les répartitions GeoJSON en direct
et `communes-context.geojson`, met à jour l'archive, et purge les jours
d'archive plus anciens que 90 jours. Nécessite `FIRMS_MAP_KEY` — voir
[configurer-la-cle-firms.md](../guides/configurer-la-cle-firms.md). Accepte aussi
`FIRMS_BACKFILL_DAYS=<n>` pour un backfill historique ponctuel.

### `npm run validate-config`

Exécute `scripts/validate-geojson.mjs` : vérifie que chaque fichier dans
`public/data/*.geojson` est un GeoJSON syntaxiquement valide (une
`FeatureCollection` ou une `Feature`). S'exécute aussi automatiquement à
chaque modification de `src/config.ts` via un hook Claude Code (voir
`.claude/settings.json`).

### `npm run validate-docs`

Exécute `scripts/validate-docs.sh` : vérifie que chaque lien Markdown
relatif dans `docs/README.md` pointe vers un fichier réel sous `docs/`.

## Qualité du code

### `npm run lint`

Exécute ESLint sur le projet (`eslint.config.ts`).

### `npm run lint:fix`

Exécute ESLint avec `--fix` pour corriger automatiquement les problèmes
corrigibles.

### `npm run format`

Formate le codebase avec Prettier (`.prettierrc.json`).

### `npm run format:check`

Vérifie le formatage sans écrire de changements — utilisé en CI.

## Restes inutilisés

`package.json` liste aussi deux scripts qui ne font **pas** partie du
pipeline actuel — des restes du squelette `geopages-template` dont ce
projet est parti (un patron générique de mise à l'échelle multi-couches
dont cette application n'a jamais eu besoin, puisqu'elle a exactement
4 couches fixes écrites à la main) :

- `npm run discover-dataset` — placeholder pointant vers la découverte de
  jeux de données data.gouv.fr, inutilisé
- `npm run generate` — génère la configuration depuis
  `data/sources.json.example`, inutilisé ; le `src/config.ts` de ce projet
  est écrit à la main à la place

## Variables d'environnement

Requises pour le rafraîchissement des données :

- `FIRMS_MAP_KEY` — clé API NASA FIRMS

Optionnelles :

- `FIRMS_BACKFILL_DAYS` — backfill ponctuel d'historique d'archive
  supplémentaire (en jours)
- `VITE_BASE_PATH` — surcharge le chemin de base de déploiement détecté
  automatiquement (voir `vite.config.js`)

Exemple :

```bash
FIRMS_MAP_KEY=abc123 FIRMS_BACKFILL_DAYS=30 npm run fetch-firms
```
