<p align="center">
  <img src="assets/logo.svg" alt="Logo Kleio, une plume" width="120" />
</p>

# 🪶 Kleio

<p align="left">

![Cloudflare Workers](https://img.shields.io/badge/Cloudflare%20Workers-F38020?logo=cloudflare&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-5A0FC8?logo=pwa&logoColor=white)
![Web Push](https://img.shields.io/badge/Web%20Push-ba5a53)
![Tests](https://img.shields.io/badge/tests-vitest-6E9F18?logo=vitest&logoColor=white)

</p>

**Kleio** t'envoie chaque matin à **08:30** (heure de Paris) un fait d'histoire important du jour, la France d'abord, puis le monde. Une notification, un écran pour comprendre, et de quoi s'en souvenir.

Kleio est une application web installable sur l'écran d'accueil de l'iPhone, sans passer par l'App Store.

## ✨ Fonctionnalités

- 🔔 Une notification chaque jour à 08:30, avec le fait du jour
- 📖 Un écran de détail : **L'essentiel**, **Le contexte**, **Le saviez-vous**
- 🔗 Une invitation à lire l'article, avec la source citée tout en bas
- ★ Des dates incontournables, repérées par une pastille, qui reviennent chaque année
- 📅 Un calendrier pour revisiter les jours passés. Les jours à venir restent grisés et ne sont jamais envoyés à l'application
- 🌗 Clair et sombre selon le réglage du téléphone
- 🎞️ Des transitions douces entre les écrans (désactivées si l'iPhone réduit les animations)
- 🔓 Ouvert à tous avec le lien : pas de compte, il suffit d'activer les notifications

## 🎨 Palette

Une seule couleur clé, dans un style iOS natif.

- **Couleur clé** : `#ba5a53` <img src="https://www.colorhexa.com/ba5a53.png" width="20" height="20" />
- **Texte clé en clair** : `#a94a43` <img src="https://www.colorhexa.com/a94a43.png" width="20" height="20" />
- **Texte clé en sombre** : `#e08a83` <img src="https://www.colorhexa.com/e08a83.png" width="20" height="20" />
- **Fond clair** : `#f2f2f7` <img src="https://www.colorhexa.com/f2f2f7.png" width="20" height="20" />
- **Carte sombre** : `#1c1c1e` <img src="https://www.colorhexa.com/1c1c1e.png" width="20" height="20" />

## 🖼️ Démo

[kleio.marievachelard.workers.dev](https://kleio.marievachelard.workers.dev)

Sur iPhone : ouvre le lien dans Safari, touche « Partager », puis « Sur l'écran d'accueil ». Ouvre ensuite Kleio depuis son icône et active les notifications dans les réglages de l'application.

## 🧩 Comment ça marche

```
   Cron Cloudflare (08:30 Paris)
              |
              v
   Worker --> choisit le fait du jour --> Web Push (Apple, Google, Mozilla)
     |
     |-- API : /api/days, /api/day/:date  (refuse les jours à venir)
     |-- KV  : les téléphones abonnés (25 au maximum)
     '-- Fichiers statiques : l'application (JavaScript sans framework)
```

- Les faits sont écrits à l'avance dans `data/`, puis intégrés au Worker au moment du déploiement.
- Le serveur ne livre **jamais** un fait avant son jour, même si le dépôt est public.
- Le déclenchement est programmé deux fois (06:30 et 07:30 UTC) pour couvrir l'heure d'été et l'heure d'hiver. Seul l'envoi entre 08:30 et 08:59 heure de Paris part vraiment, une seule fois par jour et par téléphone.

## 🗂 Structure du projet

```
.
├── src/                 # Worker : API, envoi quotidien, Web Push, contenu
├── public/              # Application (HTML, CSS, JavaScript, service worker)
│   └── app/             # Vues, routeur, transitions, notifications
├── data/
│   ├── config.json      # Date de lancement
│   ├── pinned.json      # Dates incontournables (MM-JJ)
│   └── days/            # Un fichier par mois : AAAA-MM.json
├── scripts/             # Génération des données, validation, liens, icônes, clés
├── tests/               # Tests du serveur et de l'application
├── docs/                # Écriture des faits, installation, recette
├── DESIGN.md            # Les choix de conception
└── wrangler.jsonc       # Configuration Cloudflare
```

## 🚀 Démarrer en local

Prérequis : **Node.js 22** ou plus.

```bash
git clone https://github.com/marievachelard/kleio
cd kleio
npm install
npm run dev
```

Commandes utiles :

```bash
npm test             # tests (Vitest)
npm run typecheck    # vérification TypeScript
npm run validate     # contrôle des faits écrits dans data/
npm run check-links  # contrôle des liens des sources
```

## ☁️ Déploiement

Chaque envoi sur la branche `main` lance GitHub Actions : tests, validation des faits, puis déploiement sur Cloudflare Workers.

Il faut un jeton Cloudflare « Edit Cloudflare Workers », enregistré dans les secrets du dépôt sous le nom `CLOUDFLARE_API_TOKEN`. La clé privée des notifications n'est jamais écrite dans le dépôt : elle est enregistrée avec `npx wrangler secret put VAPID_PRIVATE_KEY`. Les étapes complètes sont dans [`docs/SETUP.md`](docs/SETUP.md).

## ✍️ Ajouter des faits

Chaque fait s'appuie sur de vraies sources ouvertes et lues, puis il est vérifié avant publication. Les règles d'écriture sont dans [`docs/AUTHORING.md`](docs/AUTHORING.md).

## 🔗 Ressources

- [Conception de Kleio](DESIGN.md)
- [Installation et déploiement](docs/SETUP.md)
- [Règles d'écriture des faits](docs/AUTHORING.md)
- [Recette sur un vrai téléphone](docs/RECETTE.md)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [Web Push sur iPhone](https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers)
