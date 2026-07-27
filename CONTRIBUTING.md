# Contribuer

Les rapports de bugs et les pull requests sont les bienvenus.

## Signaler un bug

Ouvrez une [issue](https://github.com/rlespinasse/points-chauds-france/issues/new)
en indiquant ce que vous attendiez, ce qui s'est passé, et comment le reproduire
(navigateur, étapes, captures d'écran si pertinent).

## Proposer un changement

1. Forkez le dépôt et créez une branche depuis `main`.
2. `npm install`, puis `npm run dev` pour travailler en local.
3. Lancez `npm run build` avant d'ouvrir une PR — il n'y a pas encore de suite
   de tests automatisés, donc un build réussi sert de vérification de bon sens.
4. Si vous touchez à `public/data/*.geojson` ou `src/config.ts`, `npm run
   validate-config` s'exécute aussi automatiquement via un hook Claude Code
   (voir `.claude/settings.json`).
5. Ouvrez une pull request décrivant le changement et sa raison d'être.

En contribuant, vous acceptez que vos contributions soient placées sous la
[licence MIT](LICENSE) du projet.

## Code de conduite

Ce projet respecte le [code de conduite](CODE_OF_CONDUCT.md).
