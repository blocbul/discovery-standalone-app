# Flows Discovery - Electron App

Application autonome pour découvrir et analyser les flux SD-WAN d'ExtremeCloud.

## Installation

### Prérequis
- Node.js (v14+) : https://nodejs.org/

### Étapes

1. **Télécharger/dézipper les fichiers**
   ```
   flows-discovery/
   ├── package.json
   ├── main.js
   ├── preload.js
   └── index.html
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Lancer l'app en mode développement**
   ```bash
   npm start
   ```

## Créer un exécutable

### Windows
```bash
npm run build-win
```
Crée un `.exe` dans le dossier `dist/`

### macOS
```bash
npm run build-mac
```

### Linux
```bash
npm run build-linux
```

## Utilisation

1. Lancer l'app
2. **Se connecter** avec vos identifiants ExtremeCloud
3. **Charger les appliances**
4. **Sélectionner une appliance**
5. **Lancer Discovery** - le script s'exécute automatiquement et affiche les résultats

## Architecture

- **main.js** : Processus principal Electron
- **preload.js** : Script de sécurité (context isolation)
- **index.html** : Interface utilisateur (HTML + CSS + JavaScript)

## Notes

- **Pas besoin de proxy** : Electron gère les requêtes directement
- **URL API** : Entrez `https://api.extremecloudiq.com/sdwan/xapi` (par défaut)
- **CORS** : Aucun problème, Electron n'a pas les restrictions CORS du navigateur

## Dépannage

### "electron command not found"
```bash
npm install -g electron
```

### Port déjà utilisé
L'app n'utilise pas de port local, elle appelle l'API directement.

### Erreur SSL/TLS
Si vous avez une erreur certificat, vérifiez :
- Votre connexion réseau
- Le certificat SSL de l'API

## Support

Pour les problèmes :
1. Vérifiez les identifiants ExtremeCloud
2. Vérifiez la connectivité réseau
3. Consultez les logs console (Ctrl+Maj+I en développement)

---

**Version 1.0.0**
