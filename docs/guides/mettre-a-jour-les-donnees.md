# Rafraîchir les données manuellement

Par défaut, les données se rafraîchissent automatiquement toutes les
3 heures via le workflow GitHub Actions `refresh-firms.yml`, qui commit
directement sur `main` tout fichier de données modifié. Pour rafraîchir
manuellement :

## Développement local

```bash
FIRMS_MAP_KEY=xxxx npm run fetch-firms
```

Cela exécute `scripts/fetch-firms.mjs`, qui :

1. Récupère la dernière fenêtre de 5 jours de détections VIIRS auprès de
   NASA FIRMS, une fois par satellite (`VIIRS_SNPP_NRT` / `NOAA20` /
   `NOAA21`), sur la France + la Corse
2. Géocode inversement chaque point vers sa commune via `geo.api.gouv.fr`
   (point dans polygone), en mettant les résultats en cache dans
   `data/commune-cache.json`
3. Répartit les points par Fire Radiative Power (FRP) dans
   `public/data/firms-france-{faible,moderee,forte}.geojson`
4. Met à jour `public/data/communes-context.geojson` (limites communales +
   nombre de hotspots)
5. Ajoute chaque point à `public/data/archive/YYYY-MM-DD.geojson`,
   dédupliqué par `satellite + acq_date + acq_time + coordinates`, et
   rafraîchit `public/data/archive/index.json`
6. Purge les jours d'archive plus anciens que 90 jours

## Déclenchement manuel sur GitHub

1. Allez dans l'onglet Actions du dépôt
2. Sélectionnez « Refresh FIRMS data » (`refresh-firms.yml`)
3. Cliquez sur « Run workflow » sur `main`

Le workflow commit directement les fichiers de données modifiés sur `main`,
ce qui redéclenche naturellement le workflow `deploy.yml` déclenché par
push — sans traitement particulier nécessaire.

## Récupérer un historique plus ancien

FIRMS limite une seule requête à 5 jours. Pour récupérer des détections plus
anciennes dans l'archive locale (aussi loin que le permet la propre
rétention quasi temps réel de FIRMS pour ces dates) :

```bash
FIRMS_MAP_KEY=xxxx FIRMS_BACKFILL_DAYS=30 npm run fetch-firms
```

## Valider le résultat

```bash
npm run validate-config
```

Vérifie que chaque fichier `public/data/*.geojson` est un GeoJSON valide.
Cela s'exécute aussi automatiquement à chaque modification de
`src/config.ts` via un hook Claude Code (voir `.claude/settings.json`).
