# Points chauds France

**Points chauds France** est une carte interactive des points chauds (incendies/foyers thermiques) détectés par satellite sur le territoire français, construite à partir des données FIRMS VIIRS de la NASA. Elle affiche chaque détection thermique captée par les satellites Suomi NPP, NOAA-20 et NOAA-21 sur les 5 derniers jours — sites industriels, torchères, brûlages agricoles et véritables feux de végétation confondus. L'application ne distingue pas les feux de forêt des autres sources de chaleur : elle visualise des détections satellite brutes, pas des rapports d'incidents confirmés.

Chaque point chaud est géocodé inversement vers sa commune française, coloré selon l'intensité de sa puissance radiative des feux (FRP), et peut être rejoué jour par jour grâce à un curseur temporel sur la carte.

## Exécution en local

```bash
git clone https://github.com/rlespinasse/points-chauds-france
cd points-chauds-france
npm install
npm run dev
```

Ouvre http://localhost:5173 en utilisant les données de points chauds déjà commitées dans `public/data/`. Pour les rafraîchir vous-même, récupérez une clé gratuite sur https://firms.modaps.eosdis.nasa.gov/api/map_key/ et lancez :

```bash
FIRMS_MAP_KEY=xxxx npm run fetch-firms
```

Autres scripts : `npm run build` (build de production), `npm run preview` (aperçu de ce build), `npm run validate-config` (vérifie que chaque `public/data/*.geojson` est valide — s'exécute aussi automatiquement à chaque édition de `src/config.ts` via un hook Claude Code, voir `.claude/settings.json`).

`package.json` liste aussi encore `discover-dataset` et `generate` — des restes inutilisés du gabarit `geopages-template` dont ce projet est issu à l'origine (un pattern générique de mise à l'échelle multi-couches dont cette application n'a jamais eu besoin, puisqu'elle compte exactement 4 couches fixes écrites à la main).

## Architecture

```
NASA FIRMS API ──▶ scripts/fetch-firms.mjs ──▶ public/data/*.geojson ──▶ src/config.ts + src/main.ts ──▶ static site
                         │
                         ├─▶ data/commune-cache.json   (geocoding cache, 30-day retention)
                         └─▶ data/archive/YYYY-MM-DD.geojson  (own history, 90-day retention)
```

Pas de backend, pas de base de données : `scripts/fetch-firms.mjs` écrit des fichiers GeoJSON dans `public/data/`, et le frontend est un build Vite statique qui les lit via [`leaflet-atlas`](https://www.npmjs.com/package/leaflet-atlas), un wrapper Leaflet piloté par configuration.

**Le pipeline**, dans l'ordre :

1. **Récupération** — l'API CSV de zone FIRMS, une fois par satellite (`VIIRS_SNPP_NRT`/`NOAA20`/`NOAA21`), sur la France et la Corse, en demandant la fenêtre maximale de 5 jours que FIRMS autorise par requête (`DAY_RANGE = 5`).
2. **Géocodage inverse** de chaque point vers sa commune via `geo.api.gouv.fr` (point dans un polygone, contrairement au géocodage d'adresses BAN qui échoue sur les points isolés sans bâtiment à proximité). Mis en cache dans `data/commune-cache.json` (indexé par coordonnées arrondies) — le cron tourne toutes les 3 h et la fenêtre de 5 jours de chaque requête chevauche à ~5/6 celle de l'exécution précédente, donc sans ce cache, presque chaque point serait re-géocodé à chaque exécution.
3. **Archivage** — chaque point est ajouté à `data/archive/YYYY-MM-DD.geojson`, dédoublonné par `satellite + acq_date + acq_time + coordinates` (FIRMS n'a pas d'identifiant stable par détection). Cela existe parce que FIRMS plafonne une requête unique à 5 jours — cette archive locale est le seul endroit où l'historique au-delà de cette limite survit. Le curseur temporel du frontend récupère ces jours archivés à la demande, au-delà de la fenêtre live de 5 jours. `FIRMS_BACKFILL_DAYS=<n> npm run fetch-firms` effectue un rattrapage ponctuel de jours plus anciens dans l'archive, limité par la rétention NRT que FIRMS conserve encore pour ces dates.
4. **Répartition par FRP** dans `public/data/firms-france-{faible,moderee,forte}.geojson` (<5 MW / 5-20 MW / ≥20 MW) — `leaflet-atlas` stylise une couche entière d'un coup, donc la coloration par intensité correspond à une couche/un fichier par tranche.
5. **Contexte communal** — `public/data/communes-context.geojson`, limites administratives et nombre de points chauds par commune ayant au moins une détection.

**Frontend** : `src/config.ts` est la configuration `leaflet-atlas` (couches, styles, infobulles, panneaux de détail). `src/main.ts` initialise la carte et ajoute deux contrôles construits à la main (ne faisant pas partie de `leaflet-atlas` lui-même) : un **curseur temporel** (en bas à droite, qui parcourt les 5 derniers jours un jour calendaire parisien à la fois — comme `leaflet-atlas` n'a pas d'API de filtrage par entité, il accède directement au `FeatureGroup` `L.geoJSON` de chaque couche via `getAllLayerDefs()`), et une **légende FRP** (en bas à gauche, pilotée par le même tableau `frpScale` que celui utilisé pour les styles des couches, afin d'éviter tout désynchronisme).

## Déploiement

Déjà entièrement configuré — rien à mettre en place hormis le secret ci-dessous.

- **`.github/workflows/deploy.yml`** construit avec Vite et déploie sur GitHub Pages (via Actions, sans branche `gh-pages`) à chaque push sur `main`. Le chemin de base se détecte automatiquement à partir du nom du dépôt (`getBasePath()` dans `vite.config.js`), donc renommer le dépôt ne nécessite aucun changement de configuration.
- **`.github/workflows/refresh-firms.yml`** exécute le pipeline de récupération toutes les 3 heures et commit les fichiers de données modifiés sur `main` — ce qui redéclenche naturellement `deploy.yml` via son déclencheur push habituel, sans traitement particulier. Nécessite un **secret de dépôt `FIRMS_MAP_KEY`** (Settings → Secrets and variables → Actions → New repository secret) — sans lui, le workflow échoue à l'étape de récupération et les données deviennent obsolètes, bien que le site déployé continue de fonctionner avec les dernières données commitées.

## FAQ

**Pourquoi seulement 5 jours d'historique ?** L'API de FIRMS plafonne une requête unique à 5 jours ; impossible d'en demander davantage en un seul appel. L'archive locale (voir ci-dessus) en accumule davantage au fil du temps via l'exécution cron, jusqu'à 90 jours, et le curseur temporel y accède au-delà de la fenêtre live de 5 jours. Pour rattraper des jours plus anciens que ce que le cron a accumulé jusqu'ici, lancez `FIRMS_BACKFILL_DAYS=<n> npm run fetch-firms` — jusqu'où cela remonte réellement dépend de la propre rétention des données NRT de FIRMS, pas seulement de notre plafond de 90 jours.

**Cela n'affiche-t-il que les feux de forêt ?** Non — chaque détection thermique VIIRS dans la zone géographique concernée, pas seulement les feux de forêt. Une version antérieure filtrait avec BD Forêt (couverture forestière française) pour isoler les feux de forêt probables ; ce filtre a été délibérément retiré.

## Sources de données

- Détections de points chauds : [NASA FIRMS](https://firms.modaps.eosdis.nasa.gov/) (LANCE, NASA GSFC) — VIIRS Suomi NPP, NOAA-20, NOAA-21.
- Recherche commune/département/région : [geo.api.gouv.fr](https://geo.api.gouv.fr/) (Etalab).

## Documentation

La documentation complète structurée selon Diataxis (tutoriels, guides pratiques,
explications, référence) se trouve dans [`docs/`](./docs/README.md).

## Contribuer

Rapports de bugs et PR bienvenus sur [github.com/rlespinasse/points-chauds-france](https://github.com/rlespinasse/points-chauds-france/issues). Pas encore de suite de tests automatisés — `npm run build` sert de vérification de bon sens. Les contributions sont sous licence MIT.

## Licence

MIT
