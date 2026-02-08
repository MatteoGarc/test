# Guide de Contribution - Projet Terra Numerica

Merci de contribuer au projet !
Merci de lire attentivement ce document avant de commencer à coder.

## Stratégie de branches (Git Workflow)

Nous utilisons une structure rigoureuse pour séparer le développement en cours de la version stable.

### 1. Branches principales
* **`main` (Production)** :
    * C'est la version finale, stable et livrable du projet.
    * **Intouchable directement** : Aucun commit ni push direct n'est autorisé sur cette branche.
    * Elle n'est mise à jour que via des Merge Requests validées depuis `develop` ou une branche de release.

* **`develop` (Pré-production / Intégration)** :
    * C'est la branche centrale de développement. Elle contient l'ensemble de l'application.
    * C'est à partir d'elle que sont créées les branches de fonctionnalités (`feature`).
    * C'est vers elle que sont dirigées les Merge Requests.

### 2. Branches de travail (Temporaires)
Ces branches sont créées localement par les développeurs et supprimées après la fusion.

* **`feature/nom-de-la-feature`** :
    * Utilisée pour développer une nouvelle fonctionnalité ou une tâche spécifique.
    * *Exemples :* `feature/enigme-67`, `feature/interface-accueil`.

* **`hotfix/nom-du-bug`** :
    * Utilisée pour la correction rapide de bugs critiques ou mineurs.
    * *Exemples :* `hotfix/carte-retournee`, `hotfix/correction-score`.

---

## Procédure de contribution

Voici les étapes à suivre pour chaque modification :

### 1. Récupération du projet
Assurez-vous d'avoir la dernière version de la branche `develop` avant de commencer.

```bash
git checkout develop
git pull origin develop
```

### 2. Création de la branche
Créez une branche explicite correspondant à votre tâche.

# Pour une fonctionnalité

```bash
git checkout -b feature/ma-nouvelle-feature
```

# Pour une correction de bug

```bash
git checkout -b hotfix/mon-correctif
```

# 3. Développement et tests

Important : Vous devez tester intégralement votre code en local avant de commiter. Le code envoyé ne doit pas casser l'application.

# 4. Commits (Convention de nommage)

Nous utilisons des messages de commit clairs et standardisés.

Format : type: description courte

feat: Ajout d'une nouvelle fonctionnalité.

fix: Correction d'un bug.

style: Changements de style (CSS, formatage) sans impact sur la logique.

refactor: Modification du code sans ajout de fonctionnalité ni correction de bug (nettoyage).

docs: Modification de la documentation.

Exemples :

```bash
git commit -m "feat: ajout de la logique de l'énigme 67"
git commit -m "fix: correction du bug d'affichage de la carte retournée"
git commit -m "style: ajustement des marges du menu principal"
```

# 5. Envoi des modifications (Push)
Envoyez votre branche sur le dépôt distant.

```bash
git push origin feature/ma-nouvelle-feature
```

# 6. Merge Request
Rendez-vous sur GitLab.

Ouvrez une Merge Request (MR).

Sélectionnez votre branche source (feature/...) et la branche cible (develop).

Décrivez brièvement vos changements.

Attendez la validation (si revue de code nécessaire) ou fusionnez si vous avez l'autorisation.