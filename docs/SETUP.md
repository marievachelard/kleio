# Mise en place de Kleio

Ce guide sert une seule fois. Claude fait les commandes depuis ton terminal ; toi, tu fais les gestes qui demandent ton compte.

## 1. Compte Cloudflare (gratuit)

1. Va sur https://dash.cloudflare.com/sign-up et crée un compte avec ton adresse. Aucune carte bancaire n'est demandée pour l'offre gratuite.
2. Confirme ton adresse par le mail reçu.
3. Dans le terminal de Claude, tape : `! npx wrangler login`. Une page s'ouvre dans le navigateur : clique sur « Allow ».

## 2. Jeton pour le déploiement automatique

Il permet à GitHub de mettre en ligne chaque nouveau fait.

1. Cloudflare, menu « My Profile », « API Tokens », « Create Token ».
2. Choisis le modèle « Edit Cloudflare Workers », puis « Continue to summary » et « Create Token ».
3. Copie le jeton. Il ne s'affiche qu'une fois.
4. GitHub, dépôt `kleio`, « Settings », « Secrets and variables », « Actions », « New repository secret ». Nom : `CLOUDFLARE_API_TOKEN`. Valeur : le jeton.

## 3. Ce que Claude configure

- Un espace de stockage KV nommé `KLEIO_KV` (`npx wrangler kv namespace create KLEIO_KV`) dont l'identifiant va dans `wrangler.jsonc`.
- Des clés pour les notifications (`npm run vapid`). La clé publique va dans `wrangler.jsonc`. La clé privée n'est jamais écrite dans un fichier : elle est enregistrée avec `npx wrangler secret put VAPID_PRIVATE_KEY`.
- Une clé d'accès (`npx wrangler secret put KLEIO_KEY`). Claude te la donne dans la conversation. Tu la saisis une fois dans Kleio, sur ton iPhone.

## 4. Premier déploiement

`npm run build:data && npx wrangler deploy`, puis une vérification : `/api/days` répond, et un jour futur répond 404.

## Sécurité

- Le dépôt GitHub est privé.
- Aucun secret n'est écrit dans le dépôt.
- Les faits des jours à venir ne sont jamais envoyés à l'application.
