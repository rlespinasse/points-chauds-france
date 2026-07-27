# Pourquoi une limite de 5 jours ?

Les données en direct (non archivées) couvrent toujours une fenêtre glissante
de 5 jours. Voici pourquoi.

## C'est une contrainte stricte de l'API NASA FIRMS

L'API de zone (« area ») de FIRMS plafonne une seule requête à une fenêtre de
5 jours (`DAY_RANGE = 5` dans `scripts/fetch-firms.mjs`) — il n'y a aucun
moyen d'en demander davantage en un seul appel. Chaque satellite (Suomi NPP,
NOAA-20, NOAA-21) est interrogé séparément, mais chaque requête reste
plafonnée à 5 jours.

## C'est aussi un choix d'expérience utilisateur raisonnable

- ✅ Assez long pour observer les tendances récentes de l'activité des feux
- ✅ Assez récent pour des données exploitables
- ✅ Rapide à charger et à manipuler dans le navigateur
- ✅ Chronologie simple à appréhender avec le curseur temporel

## Besoin de plus d'historique ?

Le plafond de 5 jours ne s'applique qu'à la fenêtre _en direct_. Le projet
accumule un historique au-delà de cette limite dans une archive locale
(jusqu'à 90 jours), alimentée par le cron toutes les 3 heures et accessible
via le curseur temporel ou un backfill manuel — voir
[Travailler avec les archives](../guides/travailler-avec-les-archives.md).

## Implémentation technique

Voir `scripts/fetch-firms.mjs` :

```javascript
const DAY_RANGE = 5
```

Cette constante est une limite de l'API NASA FIRMS, pas quelque chose que
l'on peut librement augmenter — demander plus de 5 jours par appel est
rejeté par l'API elle-même. `FIRMS_BACKFILL_DAYS=<n> npm run fetch-firms`
contourne cette limite en remontant dans le temps par tranches de la taille
de `DAY_RANGE` pour alimenter l'archive.
