# Configurer la clé API NASA FIRMS

Pour récupérer vous-même des données fraîches de détection feu/hotspot, vous
avez besoin d'une clé API gratuite (une « map key ») auprès de NASA FIRMS.
Parcourir le site déployé ou lancer `npm run dev` **ne nécessite pas** de
clé — cela ne fait que lire les fichiers GeoJSON déjà commitées sous
`public/data/`.

## Obtenir votre clé API

1. Rendez-vous sur [firms.modaps.eosdis.nasa.gov/api/map_key](https://firms.modaps.eosdis.nasa.gov/api/map_key/)
2. Demandez une map key (gratuite, liée à votre adresse e-mail)
3. Vous recevrez votre map key unique

## Utiliser la clé API

### Développement local

Définissez-la comme variable d'environnement avant de lancer le script de
récupération :

```bash
FIRMS_MAP_KEY=xxxx npm run fetch-firms
```

### GitHub Actions (rafraîchissement automatisé)

Le workflow `refresh-firms.yml` (exécuté toutes les 3 heures) a besoin de la
clé sous forme de secret de dépôt :

1. Allez sur votre dépôt GitHub
2. Settings → Secrets and variables → Actions
3. Cliquez sur « New repository secret »
4. Nom : `FIRMS_MAP_KEY`
5. Valeur : votre clé API

Sans ce secret, le workflow échoue à l'étape de récupération et les données
deviennent obsolètes — le site déployé continue toutefois de fonctionner
avec les dernières données commitées.

## Vérifier que ça fonctionne

```bash
FIRMS_MAP_KEY=xxxx npm run fetch-firms
```

Cela devrait afficher des logs de progression et mettre à jour les fichiers
GeoJSON sous `public/data/`. Lancez ensuite `npm run dev` pour voir les
détections rafraîchies.
