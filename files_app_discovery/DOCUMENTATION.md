# Flows Discovery - Application Documentation

## Vue d'ensemble

**Flows Discovery** est une application Electron autonome qui permet de découvrir, récupérer et analyser les flux réseau (flows) depuis des appliances SD-WAN ExtremeCloud.

L'application automatise complètement le processus :
1. Authentification utilisateur
2. Chargement automatique des appliances disponibles
3. Exécution du script "flows" sur l'appliance sélectionnée
4. Récupération automatique des résultats
5. Parsing et affichage des flows dans une interface interactive
6. Nettoyage automatique des fichiers temporaires sur le serveur

---

## Architecture

```
Utilisateur
    ↓
Electron App (Local Desktop)
    ↓
ExtremeCloud API (https://api.extremecloudiq.com/sdwan/xapi)
    ↓
Appliances SD-WAN
```

### Authentification : Bearer Token (OAuth 2.0)

Tous les appels API utilisent un **Bearer Token** obtenu lors du login :
```
Authorization: Bearer {access_token}
```

---

## Workflow Complet

### 1️⃣ LOGIN
**Endpoint:** `POST /login`
**URL:** `https://api.extremecloudiq.com/sdwan/xapi/login`

**Requête:**
```json
{
  "username": "user@company.com",
  "password": "password123"
}
```

**Réponse:**
```json
{
  "access_token": "ffa463ca-0722-4ec0-957b-d7ff47f95ed5",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

**Authentification:** Aucune (c'est la première étape)
**Token utilisé:** Sauvegardé pour les requêtes suivantes

---

### 2️⃣ LOAD APPLIANCES (Automatique après login)
**Endpoint:** `GET /configuration/v1/appliances`
**URL:** `https://api.extremecloudiq.com/sdwan/xapi/configuration/v1/appliances`

**Authentification:** `Authorization: Bearer {access_token}`

**Réponse:**
```json
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "serial_number": "A1220V0065A0",
      "name": "HQ_Milano",
      "management_ip": null
    }
  ]
}
```

### 2b. CHARGER LA MANAGEMENT IP
**Endpoint:** `GET /configuration/v1/appliances/{appliance_id}/lan-settings`
**URL:** `https://api.extremecloudiq.com/sdwan/xapi/configuration/v1/appliances/{id}/lan-settings`

**Authentification:** `Authorization: Bearer {access_token}`

**Réponse:**
```json
{
  "data": {
    "lan_interfaces": [
      {
        "is_main": true,
        "local_parameters": {
          "management_ip_address": "172.16.247.11"
        }
      }
    ]
  }
}
```

**Affichage:** Les appliances s'affichent dans un dropdown avec recherche case-insensitive

---

### 3️⃣ LAUNCH DISCOVERY (Bouton "Launch Discovery")
**Endpoint:** `POST /tools/v1/scripts/execute/flows`
**URL:** `https://api.extremecloudiq.com/sdwan/xapi/tools/v1/scripts/execute/flows`

**Authentification:** `Authorization: Bearer {access_token}`

**Requête:**
```json
{
  "data": [
    {
      "appliance": {
        "serial_number": "A1220V0065A0",
        "name": "HQ_Milano",
        "management_ip": "172.16.247.11"
      }
    }
  ]
}
```

**Réponse:**
```json
{
  "data": [
    {
      "request_id": "ffa463ca-0722-4ec0-957b-d7ff47f95ed5"
    }
  ]
}
```

**Action:** Lance le script asynchrone sur l'appliance

---

### 4️⃣ POLLING POUR LES RÉSULTATS (Auto - 5 sec, max 10 tentatives)
**Endpoint:** `GET /tools/v1/scripts/result?request_id={request_id}`
**URL:** `https://api.extremecloudiq.com/sdwan/xapi/tools/v1/scripts/result?request_id=...`

**Authentification:** `Authorization: Bearer {access_token}`

**Réponse (quand prêt):**
```json
{
  "data": [
    {
      "request_id": "ffa463ca-0722-4ec0-957b-d7ff47f95ed5",
      "uri": "/app/data/result/351422_0/{uuid}/{filename}.zip",
      "script_state": "DELIVERED"
    }
  ]
}
```

**Affichage:** Barre de progression "Checking results... (attempt X/10)"

---

### 5️⃣ TÉLÉCHARGER LE FICHIER ZIP
**Endpoint:** `GET /tools/v1/scripts/result/download?file_path={uri}`
**URL:** `https://api.extremecloudiq.com/sdwan/xapi/tools/v1/scripts/result/download?file_path=/app/data/result/...`

**Authentification:** `Authorization: Bearer {access_token}`

**Réponse:** Fichier ZIP contenant les résultats

**Format attendu dans le ZIP:**
```
DDDDDD_HHHHHH/appliances/flows.txt
```

---

### 6️⃣ PARSER ET AFFICHER LES RÉSULTATS
**Local (pas d'appel API)**

Le fichier ZIP est parsé côté client avec JSZip :
1. Recherche le fichier `DDDDDD_HHHHHH/appliances/*.txt`
2. Parse les lignes au format `flows -d`
3. Affiche dans un tableau avec filtres et tri

**Format des lignes parsées:**
```
> OSPF, 172.16.247.1:0 - 224.0.0.5:0, appli 0(other): EngineUp/Down: HQ_Milano/Out of domain:0
< UDP, 172.16.0.12:58246 - 172.16.0.36:4789, appli 53(UDP): 11660 packets
```

**Colonnes affichées:**
- Direction (>, <) = LAN>WAN, WAN>LAN
- Protocol
- Source IP
- Source Port
- Destination IP
- Destination Port
- Application
- Packets
- Age

**Filtres disponibles:**
- Source IP (case-insensitive)
- Destination IP (case-insensitive)
- Application (case-insensitive)

**Tris disponibles:** Clic sur chaque en-tête de colonne

---

### 7️⃣ EXPORTER EN CSV
**Local (pas d'appel API)**

Exporte toutes les lignes en CSV formaté

**Nom du fichier:** `flows_{timestamp}.csv`

---

### 8️⃣ NETTOYER LES RÉSULTATS (Auto - silencieux)
**Endpoint:** `POST /tools/v1/scripts/result/delete`
**URL:** `https://api.extremecloudiq.com/sdwan/xapi/tools/v1/scripts/result/delete`

**Authentification:** `Authorization: Bearer {access_token}`

**Requête:**
```json
{
  "data": [
    {
      "request_id": "ffa463ca-0722-4ec0-957b-d7ff47f95ed5"
    }
  ]
}
```

**Action:** Supprime le fichier ZIP du serveur après téléchargement (aucune notification)

---

## Endpoints Résumé

| Opération | Méthode | Endpoint | Authentification |
|-----------|---------|----------|------------------|
| Login | POST | `/login` | Aucune |
| Load Appliances | GET | `/configuration/v1/appliances` | Bearer |
| Load LAN Settings | GET | `/configuration/v1/appliances/{id}/lan-settings` | Bearer |
| Execute Flows | POST | `/tools/v1/scripts/execute/flows` | Bearer |
| Check Results | GET | `/tools/v1/scripts/result?request_id=...` | Bearer |
| Download Results | GET | `/tools/v1/scripts/result/download?file_path=...` | Bearer |
| Delete Results | POST | `/tools/v1/scripts/result/delete` | Bearer |

---

## Flux d'Authentification

```
1. Utilisateur entre email + password
   ↓
2. POST /login → Récupère access_token
   ↓
3. access_token sauvegardé en mémoire
   ↓
4. Toutes les requêtes suivantes utilisent:
   Header: Authorization: Bearer {access_token}
   ↓
5. Si 401 (Unauthorized) → Demander au user de se reconnecter
```

### Points importants :
- **Pas de stockage persistant** du token (sécurité)
- **Token stateless** : pas de session serveur
- **Expiration** : Généralement 1 heure (configurable par le serveur)
- **Renouvellement** : Reconnecter si expiration

---

## Flux Utilisateur

```
┌─────────────────────────────────────┐
│     1. LANCER L'APP                 │
│  (login + appliances auto-load)     │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  2. SÉLECTIONNER APPLIANCE           │
│     (avec recherche)                │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  3. CLIQUER "LAUNCH DISCOVERY"       │
│     (auto-execution + polling)       │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  4. RÉSULTATS AFFICHÉS              │
│     (flows + filtres + tri)         │
└──────────────┬──────────────────────┘
               │
       ┌───────┴────────┐
       │                │
    ┌──▼──┐        ┌────▼─┐
    │FILTRE│        │EXPORTER│
    └──────┘        └────────┘
```

---

## Technologies

- **Electron** : Framework pour app desktop
- **JavaScript vanilla** : Pas de framework (léger)
- **JSZip** : Parser ZIP
- **Fetch API** : Requêtes HTTP
- **CSS Grid** : Responsive UI

---

## Configuration

### URL de base
- Valeur par défaut : `https://api.extremecloudiq.com/sdwan/xapi`
- Modifiable dans l'interface

### Limite de polling
- **Délai** : 5 secondes
- **Max tentatives** : 10 (50 secondes total)
- **Timeout** : Message d'erreur si pas de résultat

### Limit des flows
- **API Extreme** : 53 000 flows max par exécution
- **Parser** : Pas de limite

---

## Gestion des Erreurs

| Erreur | Cause | Solution |
|--------|-------|----------|
| 401 Unauthorized | Token invalide/expiré | Reconnecter |
| 400 Bad Request | Données manquantes | Sélectionner appliance |
| 500 Server Error | Erreur serveur | Réessayer |
| Invalid JSON | Réponse HTML au lieu JSON | Vérifier URL API |
| No flows found | Script retourne données vides | Vérifier appliance |

---

## Performance

- **Login** : < 1s
- **Load Appliances** : ~1-2s (dépend du nombre)
- **Execute Flows** : Immédiat (async)
- **Polling** : 5s × 10 = 50s max
- **Download** : Dépend de la taille du ZIP
- **Parse** : ~100ms pour 1000 flows

---

## Sécurité

✅ **Protections implémentées:**
- Token Bearer (OAuth 2.0)
- Pas de stockage persistant du token
- Context isolation Electron
- HTTPS obligatoire (API)
- Pas de stockage local sensible

⚠️ **À faire par l'utilisateur:**
- Utiliser des mots de passe forts
- Ne pas partager l'app avec d'autres utilisateurs
- Reconnecter après chaque session

---

## Fichiers de l'Application

```
flows-discovery/
├── package.json          # Config NPM
├── main.js              # Entrée Electron
├── preload.js           # Sécurité
├── index.html           # Interface + Logique
├── README_ELECTRON.md   # Doc installation
└── QUICKSTART.md        # Guide rapide
```

---

**Version:** 1.0.0  
**Date:** 2026-07-07  
**Author:** Flows Discovery Team
