# Prise en main

Bienvenue sur Points Chauds France ! Ce tutoriel vous guide pour faire tourner
le projet en local en quelques minutes.

## Prérequis

- Node.js 22+ et npm
- Git
- (Optionnel, uniquement pour rafraîchir les données vous-même) une clé API
  NASA FIRMS gratuite

## Installation

1. **Cloner le dépôt**

   ```bash
   git clone https://github.com/rlespinasse/points-chauds-france
   cd points-chauds-france
   ```

2. **Installer les dépendances**

   ```bash
   npm install
   ```

3. **Démarrer le serveur de développement**

   ```bash
   npm run dev
   ```

4. **Ouvrir dans le navigateur**

   Vite ouvre automatiquement `http://localhost:5173`. La carte se charge à
   partir des données de hotspots déjà commitées sous `public/data/` — vous
   n'avez pas besoin d'une clé API FIRMS juste pour parcourir l'application.

## Ce que vous allez voir

Une carte de France affichant les hotspots de chaleur/feu récemment détectés
par satellite (« points chauds »), avec :

- Une fenêtre glissante de 5 jours en direct des détections VIIRS (Suomi NPP,
  NOAA-20, NOAA-21), colorées selon l'intensité de Fire Radiative Power (FRP)
- Un curseur temporel (en bas à droite) pour rejouer les 5 derniers jours
  jour par jour, et remonter plus loin dans l'archive
- Une légende FRP (en bas à gauche)
- Un contexte par commune (communes ayant au moins une détection)
- Des contrôles de couches, de recherche et de pages légales fournis par
  [`leaflet-atlas`](https://github.com/rlespinasse/leaflet-atlas)

## Rafraîchir les données vous-même (optionnel)

Pour récupérer des détections fraîches plutôt que de vous appuyer sur les
données commitées, consultez [Configurer la clé API FIRMS](../guides/configurer-la-cle-firms.md)
et [Rafraîchir les données](../guides/mettre-a-jour-les-donnees.md).

## Étapes suivantes

- [Rafraîchir les données manuellement](../guides/mettre-a-jour-les-donnees.md)
- [Déployer votre propre instance](../guides/deployer-le-site.md)
- Lire l'explication sur l'[architecture](../explications/architecture.md)

## Besoin d'aide ?

Consultez la section [référence](../reference/) ou le
[README](../../README.md) principal, ou ouvrez une issue sur
[GitHub](https://github.com/rlespinasse/points-chauds-france/issues).
