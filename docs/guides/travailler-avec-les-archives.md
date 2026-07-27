# Travailler avec les archives historiques

NASA FIRMS limite une seule requête API à une fenêtre de 5 jours. Ce projet
conserve sa propre archive locale pour préserver l'historique au-delà de
cette fenêtre, avec une rétention glissante de 90 jours.

## Structure de l'archive

```
public/data/archive/
├── index.json           (liste des dates archivées disponibles)
├── 2026-07-20.geojson
├── 2026-07-19.geojson
└── ...
```

Chaque fichier `YYYY-MM-DD.geojson` contient toutes les détections pour ce
jour calendaire (heure de Paris), dédupliquées par
`satellite + acq_date + acq_time + coordinates` (FIRMS n'a pas d'identifiant
stable par détection).

## Accéder aux données archivées

### Dans l'application web

Le curseur temporel (en bas à droite de la carte) parcourt la fenêtre de
5 jours en direct puis récupère à la demande, de façon différée, les jours
archivés au-delà, via `config.archive.indexFile` et
`config.archive.dayFile(date)` (voir `src/config.ts`).

### Par programmation

```bash
# Lister les dates archivées disponibles
cat public/data/archive/index.json

# Lire un jour spécifique
cat public/data/archive/2026-07-20.geojson
```

## Politique de rétention

- Les jours d'archive plus anciens que `ARCHIVE_MAX_AGE_DAYS` (90 jours, voir
  `scripts/fetch-firms.mjs`) sont purgés automatiquement à chaque exécution
  de rafraîchissement
- Les archives sont mises à jour toutes les 3 heures par le workflow
  `refresh-firms.yml`
- Le cache de géocodage inverse des communes (`data/commune-cache.json`) a
  sa propre rétention de 30 jours, indépendante de celle de l'archive

## Récupérer un historique plus ancien

Pour récupérer dans l'archive plus d'historique que ce que le cron de
3 heures a accumulé jusqu'à présent :

```bash
FIRMS_MAP_KEY=xxxx FIRMS_BACKFILL_DAYS=30 npm run fetch-firms
```

Cela remonte en arrière par blocs de 5 jours depuis l'API quasi temps réel
(NRT) de FIRMS. La profondeur à laquelle il est possible de remonter dépend
de la propre rétention des données NRT de FIRMS pour ces dates, et non
uniquement du plafond d'archivage de 90 jours de ce projet.
