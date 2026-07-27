# Déployer sur GitHub Pages

Le déploiement est déjà entièrement configuré pour ce dépôt — rien à
paramétrer en dehors du secret `FIRMS_MAP_KEY` (voir
[configurer-la-cle-firms.md](./configurer-la-cle-firms.md)).

## Déploiement automatique

`.github/workflows/deploy.yml` construit le site avec Vite et le déploie sur
GitHub Pages (via Actions, sans branche `gh-pages`) à chaque push sur
`main`. Cela inclut :

- Les pushs/merges directs sur `main`
- Les commits effectués par le workflow `refresh-firms.yml` (toutes les
  3 h), qui poussent les données modifiées directement sur `main` et
  redéclenchent naturellement `deploy.yml` via son déclencheur push habituel

## Déploiement manuel

1. Allez dans l'onglet Actions du dépôt
2. Sélectionnez « Deploy to GitHub Pages » (`deploy.yml`)
3. Cliquez sur « Run workflow » sur `main`

## Chemin de base

La fonction `getBasePath()` de `vite.config.js` détecte automatiquement le
chemin de base du déploiement :

1. La variable d'environnement `VITE_BASE_PATH`, si définie (surcharge CI)
2. `GITHUB_REPOSITORY` (GitHub Actions), qui dérive `/repo-name/`
3. À défaut, le champ `name` de `package.json`
4. `/` par défaut pour le développement local

Renommer le dépôt GitHub ne nécessite aucun changement de configuration —
le chemin de base suit automatiquement le nom du dépôt.

## Suivre le déploiement

1. Allez dans l'onglet Actions
2. Ouvrez la dernière exécution de « Deploy to GitHub Pages »
3. Consultez les logs en temps réel ; l'URL de déploiement apparaît dans le
   résumé du job une fois terminé
