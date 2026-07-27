# Architecture

Points Chauds France est un site statique sans backend ni base de données :
un pipeline de données écrit des fichiers GeoJSON, et un frontend construit
avec Vite les lit.

## 1. Pipeline de données

S'exécute toutes les 3 heures via GitHub Actions (`refresh-firms.yml`) :

```
NASA FIRMS API (par satellite : VIIRS_SNPP_NRT / NOAA20 / NOAA21)
    ↓
scripts/fetch-firms.mjs
    ↓
Géocodage inverse de chaque point (geo.api.gouv.fr, point-in-polygon)
    ↓  (mis en cache dans data/commune-cache.json, rétention de 30 jours)
Répartition par FRP → public/data/firms-france-{faible,moderee,forte}.geojson
    ↓
Archivage → public/data/archive/YYYY-MM-DD.geojson (rétention de 90 jours)
    ↓
Commit des fichiers modifiés sur main (le cas échéant)
```

Caractéristiques clés :

- Le géocodage inverse est mis en cache (indexé par coordonnées arrondies) —
  le cron s'exécute toutes les 3 h et la fenêtre de 5 jours de chaque requête
  chevauche celle de l'exécution précédente à ~5/6, donc sans ce cache
  presque chaque point serait re-géocodé à chaque exécution
- L'archive est dédupliquée par `satellite + acq_date + acq_time + coordinates`
  (FIRMS n'a pas d'identifiant stable par détection)
- Les commits n'ont lieu que si les données ont réellement changé

## 2. Site statique

Construit avec [Vite](https://vitejs.dev/) + [Leaflet](https://leafletjs.com/) +
[leaflet-atlas](https://github.com/rlespinasse/leaflet-atlas) :

```
src/
├── main.ts        (initialise la carte, le curseur temporel, la légende FRP)
├── config.ts       (config leaflet-atlas : couches, styles, infobulles, pages légales)
├── analytics.ts    (config GoatCounter partagée, consommée par leaflet-atlas)
└── css/
```

Caractéristiques clés :

- Aucun backend requis — lit les fichiers GeoJSON de façon statique depuis
  `public/data/`
- Curseur temporel (en bas à droite) : rejoue les 5 derniers jours en direct,
  un jour calendaire local à Paris à la fois, et récupère à la demande (de
  façon paresseuse) les jours archivés au-delà de cette fenêtre
- Légende FRP (en bas à gauche) : pilotée par le même tableau `frpScale` que
  celui utilisé pour les styles de couches, afin qu'elle ne puisse pas se
  désynchroniser
- Recherche par lieu, bascule des couches et pages légales fournies par
  `leaflet-atlas` lui-même, entièrement pilotées par `src/config.ts`

## 3. Déploiement

Via GitHub Pages (`deploy.yml`) :

```
Push sur main (direct, ou via le commit de données de refresh-firms.yml)
    ↓
Workflow GitHub Actions
    ↓
npm run build (Vite)
    ↓
dist/ envoyé sur GitHub Pages
    ↓
En ligne sur https://rlespinasse.github.io/points-chauds-france/
```

Le chemin de base est détecté automatiquement à partir du nom du dépôt (voir
[deployer-le-site.md](../guides/deployer-le-site.md)), donc renommer le dépôt ne nécessite aucun
changement de configuration.

## Pourquoi cette architecture ?

- **Rapide** — site statique, aucune latence serveur
- **Économique** — hébergement gratuit sur GitHub Pages
- **Transparent** — données, code et documentation vivent tous dans le même
  dépôt GitHub
- **Fiable** — l'absence de backend réduit le nombre de points de défaillance ;
  un rafraîchissement de données obsolète ne fait pas tomber le site, il ne
  fait que servir le dernier commit valide
