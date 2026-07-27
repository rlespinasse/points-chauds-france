# Politique de rétention des données

Ce document explique comment les données de détection de feux/points chauds
sont stockées et gérées dans le temps.

## Niveaux de rétention

### Données en direct (5 derniers jours)

- `public/data/firms-france-{faible,moderee,forte}.geojson` — fenêtre
  actuelle de 5 jours, répartie par puissance radiative du feu (FRP)
- `public/data/communes-context.geojson` — communes ayant au moins une
  détection en cours
- Rafraîchi toutes les 3 heures par `refresh-firms.yml` ; entièrement
  remplacé à chaque exécution

### Archive locale (fenêtre glissante de 90 jours)

- `public/data/archive/YYYY-MM-DD.geojson` — un fichier par jour calendaire
  local à Paris
- `public/data/archive/index.json` — liste des dates archivées disponibles
- Les jours plus anciens que `ARCHIVE_MAX_AGE_DAYS` (90, voir
  `scripts/fetch-firms.mjs`) sont purgés automatiquement à chaque
  rafraîchissement
- Peut être étendue vers le passé via `FIRMS_BACKFILL_DAYS` (voir
  [travailler-avec-les-archives.md](../guides/travailler-avec-les-archives.md)), dans la limite
  de la rétention quasi temps réel encore disponible chez FIRMS pour une
  date donnée

### Cache de géocodage inverse

- `data/commune-cache.json`, indexé par coordonnées arrondies
- Rétention de 30 jours, rafraîchi de façon opportuniste à mesure que de
  nouveaux points sont recherchés
- Purement une optimisation de performance : les fenêtres de 5 jours de deux
  exécutions consécutives (toutes les 3 heures) se chevauchent à ~5/6, donc
  sans ce cache presque chaque point serait re-géocodé à chaque exécution

## Pourquoi ces durées ?

**5 jours (direct) :**

- Le maximum autorisé par NASA FIRMS par requête API — voir
  [limite-5-jours.md](./limite-5-jours.md)

**90 jours (archive) :**

- Assez long pour une analyse de tendance significative
- Maintient une taille raisonnable du dépôt git, puisque chaque jour archivé
  est commité sur `main`

**30 jours (cache de géocodage) :**

- Réduit la charge sur `geo.api.gouv.fr`
- Les limites communales ne changent pas assez souvent pour nécessiter des
  entrées de cache à durée de vie plus courte

## Processus de nettoyage

Chaque exécution de `refresh-firms.yml` (toutes les 3 heures) :

1. Récupère la dernière fenêtre en direct de 5 jours par satellite
2. Géocode inversement les nouveaux points (en utilisant/rafraîchissant le
   cache)
3. Réécrit les répartitions GeoJSON en direct et le fichier de contexte
   communal
4. Ajoute les nouveaux points au fichier d'archive du jour, déduplique, et
   réécrit `archive/index.json`
5. Supprime les jours d'archive plus anciens que 90 jours
6. Commite les fichiers modifiés sur `main` uniquement si quelque chose a
   réellement changé

## Accéder à des données plus anciennes que l'archive

Pour des détections plus anciennes que la fenêtre d'archive actuelle de
90 jours, les seules options sont :

1. Parcourir l'historique git du dépôt (les anciens commits d'archive
   existent toujours même après que le fichier lui-même a été retiré de
   `main`)
2. Lancer un backfill manuel (`FIRMS_BACKFILL_DAYS=<n> npm run fetch-firms`),
   limité par la rétention quasi temps réel propre à FIRMS pour ces dates
