## 🛠️ Installation & Démarrage (Local)
### 1. Prérequis
```md
- Docker et Docker Compose installés
- Docker Desktop (doit être démarré)
- Git
```

### 2. Récupération du projet
```md
Ouvrez un terminal et clonez le dépôt :


git clone https://iut-git.unice.fr/bm301023/sae-terra-numerica.git
cd sae-terra-numerica
```

### 3. Configuration Initiale (Indispensable)
```md
Pour que le frontend fonctionne correctement, vous devez ajouter les Assets (images/sons) qui ne sont pas sur le dépôt Git.

Téléchargez le dossier assets via ce lien Drive : https://unice-my.sharepoint.com/:f:/r/personal/loris_galland_etu_unice_fr/Documents/assets?csf=1&web=1&e=0dHBQ6

Copiez ce dossier et collez-le dans : frontend/public/.

Vous devez obtenir : frontend/public/assets/.

Bash
docker compose up --build
L'application est ensuite accessible sur : http://localhost:8080

💡 Conseil important : Une fois le jeu lancé dans votre navigateur, appuyez sur la touche F11 pour passer en plein écran. Cela garantit que l'interface et les énigmes s'affichent correctement sans être coupées.
```
---

## 🌐 Mode Multijoueur (LAN / Réseau Local)
```md
Le jeu permet à plusieurs joueurs de se connecter à la même session pour voir la progression des autres en temps réel (Feed d'actualité).
```

### 1. Se mettre sur le même réseau
```md
Tous les ordinateurs (l'Hôte qui héberge et les Joueurs clients) doivent être connectés au même réseau Wi-Fi ou Ethernet.
```

### 2. Récupérer l'adresse IP de l'Hôte
```md
La personne qui lance le serveur (Docker) doit trouver son adresse IPv4 locale.

Sur Windows :

Ouvrez l'invite de commande (cmd).

Tapez ipconfig et faites Entrée.

Cherchez la ligne "Adresse IPv4" (ex: 192.168.1.15).

Sur Mac / Linux :

Ouvrez un terminal.

Tapez ifconfig ou ip a.

Cherchez l'adresse locale (ex: 192.168.x.x).
```

### 3. Connexion des joueurs
```md
Pour l'Hôte (celui qui a lancé Docker) :

Accédez au jeu via : http://localhost:8080

Cliquez sur "MULTIJOUEUR" puis "OUVRIR NOUVELLE ENQUÊTE".

Pour les autres Joueurs (Clients) :

Ne lancez pas Docker chez vous.

Ouvrez votre navigateur et tapez l'adresse IP de l'hôte suivie du port 8080.

Exemple : http://192.168.1.15:8080

Entrez votre pseudo, le code de la salle donné par l'hôte, et rejoignez !

Note technique : Le jeu détecte automatiquement l'IP utilisée dans la barre d'adresse pour connecter le Socket.io au bon endroit. Si vous n'arrivez pas à rejoindre, vérifiez vos pare-feux (ports 3000 et 8080).
```