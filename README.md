# Application web de gestion des clients et des produits – Banque Alimentaire des Côtes d'Armor : Rayon22

Rayon22 est une application web conçue pour moderniser et simplifier les échanges entre les bénéficiaires et la Banque Alimentaire des Côtes d'Armor.

Elle offre une interface intuitive et ergonomique permettant :

- Aux bénéficiaires : de créer un compte, transmettre les documents nécessaires à l’étude de leur éligibilité, échanger avec les gestionnaires et effectuer des commandes en ligne.

- Aux administrateurs : de gérer les bases de données des utilisateurs et des produits, de traiter les demandes d’éligibilité, et de répondre aux messages des bénéficiaires.

Cette plateforme vise à fluidifier la gestion administrative tout en améliorant l'expérience utilisateur, dans le respect des normes de confidentialité et d’accessibilité.


## 📂 Table des matières
- [Application web de gestion des clients et des produits – Banque Alimentaire des Côtes d'Armor : Rayon22](#application-web-de-gestion-des-clients-et-des-produits--banque-alimentaire-des-côtes-darmor--rayon22)
  - [📂 Table des matières](#-table-des-matières)
  - [📥 Guide d'installation](#-guide-dinstallation)
    - [💻 1. Cloner le projet (mode développeur)](#-1-cloner-le-projet-mode-développeur)
    - [🐋 Docker](#-docker)
    - [~~▶️ 2. Utiliser l’exécutable Electron (mode simplifié)~~ (non maintenu)](#️-2-utiliser-lexécutable-electron-mode-simplifié-non-maintenu)
  - [🧑‍💼 Guide d'utilisation](#-guide-dutilisation)
    - [👥 Gestion des utilisateurs](#-gestion-des-utilisateurs)
    - [🧾 Gestion des produits](#-gestion-des-produits)
  - [🧑‍💻 Guide de programmation](#-guide-de-programmation)
    - [⚙️ Technologies utilisées](#️-technologies-utilisées)
    - [🚀 Installation du projet](#-installation-du-projet)
    - [📂 Structure du projet](#-structure-du-projet)
  - [📌 Informations complémentaires](#-informations-complémentaires)
    - [👥 Équipe](#-équipe)
    - [📝 Licence](#-licence)

## 📥 Guide d'installation

Ce projet étant une application web, aucune installation n'est normalement nécessaire pour l'utilisateur final.
Cependant, en l'absence d’un hébergement en ligne à ce stade du développement, deux solutions sont proposées pour tester l'application en local :

### 💻 1. Cloner le projet (mode développeur)

Vous pouvez :

- Cloner le dépôt GitHub ou utiliser le code source zippé fourni

- Installer les dépendances

- Lancer l'application en local

💡 Pour plus de détails, veuillez vous référer au [Guide de programmation](#guide-de-programmation).

### 🐋 Docker

Pour lancer le build docker du projet, tout se fait avec :
```sh
sudo ./build-docker.sh
```
*Les variables d'environnement ne sont prise qu'au runtime*

Et pour le lancement :
```sh
sudo ./run-docker.sh
```

### ~~▶️ 2. Utiliser l’exécutable Electron (mode simplifié)~~ (non maintenu)

Un exécutable a été compilé pour permettre un lancement rapide et sans configuration :

- Lancer le fichier : `Rayon22 Setup 1.0.0.exe`

- Une fois l’installation terminée, une fenêtre s’ouvrira automatiquement avec l’application web prête à l’emploi

Cette solution est recommandée pour une démonstration rapide ou un test utilisateur sans connaissance technique particulière.

⚠️ **L’exécutable Electron n’est plus maintenu dans ce projet.  
Il avait été mis en place uniquement à des fins de test durant le développement.  
Maintenant que le projet est finalisé, il n’est plus nécessaire et l’installation doit se faire exclusivement en clonant le dépôt et en suivant la procédure prévue.**

## 🧑‍💼 Guide d'utilisation

### 👥 Gestion des utilisateurs

- L’utilisateur remplit le formulaire d’inscription.

<img width="1920" height="1853" alt="image" src="https://github.com/user-attachments/assets/6b2b202b-f60d-496f-9108-6205bd31cd34" />
<img width="1920" height="2010" alt="image" src="https://github.com/user-attachments/assets/0a0544fd-442b-40bb-abad-54f19ad0eebe" />
<img width="1920" height="1759" alt="image" src="https://github.com/user-attachments/assets/9e804515-9b7b-479c-a13a-e69f8abc253f" />  

- Un email de confirmation sera envoyé à l'adresse mail renseignée pour valider la création du compte
  
<img width="1920" height="1560" alt="image" src="https://github.com/user-attachments/assets/b6b6d1b5-6367-4368-9bd4-de076e77d987" />  

- Une fois le compte créé, il a accès à une page pour joindre un justificatif (lettre ou bourse).
  
<img width="1920" height="2019" alt="image" src="https://github.com/user-attachments/assets/9e6f3bf7-2f02-49ee-a0cb-5019afde0749" />  

- La banque alimentaire reçoit la demande, la traite, puis valide ou refuse.
  
<img width="1920" height="933" alt="image" src="https://github.com/user-attachments/assets/70634aff-c24d-4c35-be8c-ff7d2f91f9f5" />  

- Si accepté, l’utilisateur reçoit un email de confirmation et peut se connecter pour accéder au catalogue.

- Les administrateurs peuvent gérer les utilisateurs à tout moment à l'aide du tableau de bord
  
<img width="1920" height="933" alt="image" src="https://github.com/user-attachments/assets/531db659-b1bd-46e0-9e7e-eb04c5ec8527" />  

- Les clients connectés ont la possibilité de contacter les administrateurs directement depuis l'interface de l'application.
  
<img width="1920" height="1705" alt="image" src="https://github.com/user-attachments/assets/3eca590b-015e-4eb4-8962-57d88edba064" />  
  
- Les administrateurs peuvent consulter ces messages depuis leur espace dédié, y répondre, et la réponse sera automatiquement envoyée par e-mail au client concerné.
  
<img width="1920" height="1065" alt="image" src="https://github.com/user-attachments/assets/b53e9d0c-8150-480d-95d5-3eac985d7e57" />


### 🧾 Gestion des produits

- L’utilisateur a accès à un **catalogue** listant les différents produits disponibles (alimentaires, hygiène, etc.) avec leurs caractéristiques (nom, prix, poids…).

<img width="1920" height="931" alt="image" src="https://github.com/user-attachments/assets/bd16a389-75e2-4813-9799-b6f659988539" />

- Une **barre de recherche** permet de filtrer rapidement les produits.

<img width="1920" height="931" alt="image" src="https://github.com/user-attachments/assets/e4b2b9bc-6d42-4fed-8306-ced9c21fb2c3" />

- Lorsque le stock d’un produit passe en dessous du seuil (par défaut 3), une étiquette `Stock incertain` s’affiche.

<img width="318" height="424" alt="image" src="https://github.com/user-attachments/assets/344d3095-5fa2-47c8-8838-dde318c3cdd7" />

- L’utilisateur peut ajouter des produits à son **panier virtuel**.

<img width="1920" height="2293" alt="image" src="https://github.com/user-attachments/assets/578cfe4b-5daf-4f1b-a27b-1497da41204b" />

- Le panier prend en compte les contraintes définies (quantité, poids maximum, rapport prix commande/livraison).  
  Si aucune limite n’est définie, elles sont considérées comme illimitées.

<img width="405" height="149" alt="image" src="https://github.com/user-attachments/assets/693acb4b-4f52-4631-9940-b65ce6eb5102" />
<img width="405" height="149" alt="image" src="https://github.com/user-attachments/assets/51168486-192f-4311-9969-c8600fddf940" />
<img width="405" height="149" alt="image" src="https://github.com/user-attachments/assets/68abe483-4c85-43f4-8292-ea0bd8841e94" />
<img width="405" height="149" alt="image" src="https://github.com/user-attachments/assets/14b1ae0f-06f5-4bf8-bbea-a800db8d6219" />

- Avant la validation du panier, une **notification** avertit si un produit n’est plus disponible.

<img width="404" height="99" alt="image" src="https://github.com/user-attachments/assets/c4b21d8c-d05f-4be8-9a5e-6e3f401e84b1" />

- Le paiement peut ensuite être effectué via **Stripe**, en carte bancaire ou solutions alternatives (cartes prépayées, etc.).

<img width="1920" height="931" alt="image" src="https://github.com/user-attachments/assets/c81031d6-98ef-47eb-b2bc-43a695b7aa1a" />

- Les produits et leur disponibilité sont gérés dans une **base de données SQL** gérable par les administrateurs.

<img width="1920" height="931" alt="image" src="https://github.com/user-attachments/assets/63ec5b74-8896-4a79-acb6-d7576466a52c" />
<img width="1920" height="931" alt="image" src="https://github.com/user-attachments/assets/db6ad22c-03d9-476f-bf17-622e396478de" />


## 🧑‍💻 Guide de programmation

### ⚙️ Technologies utilisées

Le projet est serverless, reposant principalement sur un frontend React connecté à des services distants hébergés dans le cloud. Cela permet une architecture légère, facilement déployable et scalable.  

**Composants principaux :**

- **Frontend :** React.js
    Interface utilisateur dynamique et réactive.

- **Base de données :** Supabase (PostgreSQL)
    Stockage des données clients et produits, avec accès sécurisé.

- **Authentification :** JWT & bcrypt via Supabase Auth
    Gestion des sessions utilisateurs et protection des données personnelles.

- **Envoi d’emails :** EmailJS
    Utilisé pour les notifications (validation de compte, rappels, etc.)

### 🚀 Installation du projet

**1. Prérequis**    

Avant de commencer, assurez-vous d’avoir les outils suivants installés sur votre machine :
- [Node.js 22.12+](https://nodejs.org/en/download)
- [Git](https://git-scm.com/downloads)

**2. Cloner le dépôt**  

Clonez le projet via SSH :
```bash
git clone git@github.com:dallatIkes/rayon22.git
```
💡 Vous pouvez également utiliser l’archive .zip fournie si vous ne souhaitez pas utiliser Git.

**3. Installer les dépendances**  

Installez les modules nécessaires au bon fonctionnement de l’application :
```bash
npm install
```

**4. Configuration des variables d’environnement**
Un fichier `.env` vous sera transmis contenant l’ensemble des clés API et identifiants nécessaires au fonctionnement du projet.

⚠️ **Ce fichier est confidentiel :** Ne le partagez jamais publiquement, ne le versionnez pas avec Git (`.env` est ignoré par défaut via `.gitignore`).

**5. Lancer le projet en local**
Pour démarrer l’application en environnement de développement sur votre machine, exécutez la commande suivante :
```bash
npm run dev
```
Une fois la commande lancée, le serveur de développement sera disponible à l’adresse indiquée dans le terminal (généralement `http://localhost:5173` ou similaire).

**6. (Optionnel) – Générer le binaire**
Pour compiler l’application et générer un exécutable (`.exe` pour Windows ou `.AppImage` pour Linux), exécutez la commande suivante :
```bash
npm run build
```
Les fichiers générés seront disponibles dans le dossier de sortie configuré par le projet (généralement `dist/`).

### 📂 Structure du projet

```bash
📁 rayon22/
├── 📁 electron/                # Fichiers spécifiques à l'intégration Electron (version exécutable)
├── 📁 node_modules/            # Dépendances installées automatiquement (non modifiable manuellement)
├── 📁 src/                     # Dossier principal contenant tout le code source de l'application
│   ├── AdminApp.jsx            # Point d'entrée pour l'application côté administrateur
│   ├── App.jsx                 # Point d'entrée principal de l'application (bénéficiaire)
│   ├── main.jsx                # Script d'initialisation React avec ReactDOM
│   ├── Root.jsx                # Composant racine englobant la structure des routes ou layouts
│   ├── 📁 assets/              # Ressources statiques (images, logos, icônes, etc.)
│   ├── 📁 common/              # Composants réutilisables (boutons, champs de formulaire, alertes, etc.)
│   ├── 📁 context/             # Contextes React (authentification, état global partagé, etc.)
│   ├── 📁 lib/                 # Fonctions utilitaires, services API, helpers divers
│   ├── 📁 pages/               # Pages principales de l'application (Accueil, Connexion, Profil, etc.)
│   └── 📁 styles/              # Fichiers de style globaux ou modules CSS/Tailwind
├── index.html                  # Fichier HTML principal injecté par Vite (root de l'app web)
├── eslint.config.js            # Configuration ESLint pour le linting du code (qualité, conventions)
├── tailwind.config.js          # Configuration de Tailwind CSS (thèmes, couleurs, breakpoints, etc.)
├── postcss.config.cjs          # Configuration PostCSS (utilisé par Tailwind pour générer les styles)
├── vite.config.js              # Configuration Vite (outil de bundling et serveur de dev)
├── package.json                # Déclaration des dépendances, scripts, et métadonnées du projet
├── package-lock.json           # Verrouillage des versions exactes des dépendances (auto-généré)
└── README.md                   # Documentation du projet (présentation, installation, usage, etc.)

```

## 📌 Informations complémentaires

### 👥 Équipe

Ce projet a été réalisé par trois étudiants de l'[ENSSAT Lannion](https://enssat.fr/) intervenants pour [JES](https://junior-enssat-services.fr/) : 
- **BAZILE Gwenaël** - Développeur
- **CHAABI Samy** - Développeur / Chef de projet
- **JOURDIN Clem** - Développeur

### 📝 Licence

L'intégralité des droits patrimoniaux sur l'ensemble du projet est attribuée à la Banque Alimentaire des Côtes d'Armor. Les étudiants conservent leur droit moral sur les travaux réalisés.
