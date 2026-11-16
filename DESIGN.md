# Kleio : conception

Date : 2026-11-16. Auteure du besoin : Marie. Statut : à valider.

## En une phrase

Chaque matin, l'iPhone de Marie reçoit une notification courte sur un fait historique important de la date du jour. Un clic ouvre le détail. Un calendrier permet de relire n'importe quelle autre date.

## Pourquoi

Marie veut commencer sa journée par une « nouvelle du monde historique » : apprendre ou se rappeler quelque chose, retenir au moins l'idée générale, et ne pas être inculte. Le but est la culture générale sans effort, pas la révision.

## Objectifs

- Une notification par jour, le matin, avec un titre daté et deux phrases au plus, lisibles sans rien ouvrir.
- Un écran de détail : l'essentiel, le contexte, une anecdote, une phrase d'invitation à lire plus, et la source cliquable en bas.
- Un calendrier qui sert d'historique : Marie peut rouvrir n'importe quel jour déjà écoulé depuis le premier jour (le jour de la première notification). Les jours à venir sont grisés et non touchables, pour garder la surprise. Le jour touché dans le calendrier s'affiche dans une carte sous la grille, et une petite flèche dans cette carte ouvre son détail.
- Des faits vraiment importants, d'abord de l'histoire de France, puis du monde (par exemple le premier vol spatial). Ce sont des repères qu'une personne cultivée devrait pouvoir placer.
- Fonctionne sur iPhone 16, sans publication sur l'App Store.

## Non-objectifs

- Pas d'application native, pas de compte ni de mot de passe.
- Pas de quiz, de score, de série de jours consécutifs, de partage social.
- Pas de contenu généré à la volée : les faits sont écrits à l'avance.

## Anti-objectifs (ce qui ferait échouer le projet même si tout marche)

- Un fait faux, ou une source inventée ou inaccessible.
- Un fait anecdotique ou trop pointu (exemple écarté par Marie : Pizarro capture Atahualpa en 1532, jugé trop spécialisé).
- Un ton qui sonne « généré par une IA » : pas de point médian « · », pas de tiret long pour faire une incise, pas de formules du type « non pas X, mais Y » ni de tournures pompeuses.
- Un titre d'anecdote décalé quand le fait est triste. Le titre retenu est « Le saviez-vous », neutre. Le mot « fun fact » est exclu.

## Ce que Marie a décidé

- **Nom** : Kleio (écriture grecque de Clio, muse de l'histoire). Clio seul est exclu à cause de la voiture.
- **Logo** : la plume au trait, blanche sur fond rouge brique. Fichier : `assets/logo.svg`. Dessin d'origine fourni par Marie, repris dans le logo.
- **Direction visuelle** : style des apps natives d'Apple, sobre. Une seule couleur clé : `#BA5A53` (rouge brique, choisie par Marie à la place du lavande `#9FA0FF` initial). Elle sert aux aplats (date du jour, bouton « Lire l'article », étiquette Incontournable, icône) avec du texte blanc dessus. En mode clair, le texte et les liens utilisent une version un peu plus foncée (`#A94A43`) pour rester lisibles ; en mode sombre, une version plus claire (`#E08A83`). Mode clair et mode sombre suivent le réglage du téléphone.
- **Maquettes de référence** : `mockup/maquettes.html` (publié aussi : https://claude.ai/artifact/J4xRT1hGUQ95V5DveXDH3m). Trois écrans : notification sur écran verrouillé, détail, calendrier.
- **Un seul fait par jour** dans la notification.
- **Historique, pas d'avance** : le calendrier et le détail ne montrent que les jours déjà passés depuis le lancement, jour même inclus. Exemple donné par Marie : si le premier jour est le 17 novembre, elle ne voit que le 17 novembre ; trois jours plus tard, elle voit les trois jours écoulés. Les faits à venir ne doivent pas être visibles dans l'application.
- **Même date, années suivantes** (choix de Claude) : à partir de la deuxième année, le détail d'un jour affiche en bas, sous le titre « Aussi un 16 novembre » (date adaptée), le fait reçu à cette date les années précédentes. La première année, cette section n'apparaît pas.
- **Les faits s'accumulent d'année en année.** Chaque année, un nouveau fait s'ajoute à chaque date, et l'historique garde ceux des années passées.
- **Les dates incontournables sont figées** : le même fait chaque année (par exemple 14 juillet, 11 novembre). Elles sont marquées d'une petite étoile dans le calendrier.
- **Contenu d'un fait** : titre, année, tags (France ou Monde, plus un thème), l'essentiel (une à deux phrases), le contexte (un paragraphe plus développé), « Le saviez-vous » (une anecdote), une phrase d'invitation courte et un peu punchy qui donne envie de lire la source, le nom de la source, et son lien cliquable en bas de l'écran de détail.
- **Marie fait confiance à Claude pour choisir et rédiger tous les faits.** Elle ne les relira pas : la surprise fait partie du plaisir. Conséquence : la vérification des sources est la seule garantie de qualité (voir plus bas).
- **Plateforme** : application web installable sur l'écran d'accueil de l'iPhone (PWA), avec notifications push web. Marie a choisi cette option plutôt qu'une app de notification existante.

## Contraintes

- iPhone 16, iOS récent. Sur iOS, les notifications push web ne fonctionnent que si la page est ajoutée à l'écran d'accueil et que l'utilisatrice accepte les notifications (iOS 16.4 ou plus). Ces deux gestes sont faits une fois, par Marie.
- Pas de frais récurrents : viser un hébergement et un envoi planifié gratuits.
- Textes et interface en français.
- Une seule utilisatrice : une seule inscription push à stocker.

## Règles de contenu (le plus gros du travail)

- 366 dates à terme (29 février compris), écrites progressivement (voir « Livraison et méthode »). Un fait doit exister et être vérifié avant que sa date arrive. L'ordre de priorité : histoire de France, puis histoire mondiale (sciences, conquête spatiale, arts, institutions, guerres et paix, droits).
- Choisir un fait par son importance : un repère de culture générale que beaucoup de gens cultivés connaissent ou devraient connaître. Si une date n'a rien de marquant, prendre le moins mauvais fait réel et important plutôt qu'une curiosité.
- Chaque fait est vérifié sur au moins une source consultée réellement pendant la rédaction (ouverte et lue, pas retrouvée de mémoire). Aucun lien inventé. Sources à privilégier : Wikipédia en français, Larousse, BnF et Gallica, Persée, sites d'institutions (UNESCO, NASA, Assemblée nationale, Élysée, musées), Encyclopaedia Britannica. Le lien doit rester le plus stable possible.
- Les dates sont vérifiées avec soin (attention aux écarts de calendrier et aux dates contestées). En cas de doute entre deux dates, écarter le fait.
- Pour les sujets tragiques (guerres, massacres, attentats), un ton factuel et respectueux, sans détail gratuit. L'anecdote reste sobre.
- Le choix des dates incontournables est laissé à Claude : un petit nombre de dates dont le fait est un pilier du récit national ou mondial (exemples : 14 juillet 1789, 11 novembre 1918, 8 mai 1945, 6 juin 1944, 21 juillet 1969).
- Texte de la notification : au plus environ 140 caractères pour le corps, un titre daté.
- Le ton est celui d'une personne cultivée qui parle simplement, sans effets de style.

## Données et fonctionnement attendus

- Les faits vivent dans un fichier de données versionné (par exemple JSON), pas dans une base de données. Ajouter un fait pour une année suivante = ajouter une entrée.
- À chaque date, on choisit le fait de l'année en cours : fait figé pour les incontournables, sinon une rotation sur les faits disponibles, sans répéter le même fait deux années de suite quand il y en a plusieurs.
- Un envoi planifié tous les jours à une heure fixe, en fuseau Europe/Paris, déclenche la notification du fait du jour.
- Toucher la notification ouvre directement l'écran de détail de ce jour.
- Le calendrier et les faits déjà reçus fonctionnent hors connexion une fois l'application ouverte une première fois.
- Les faits des jours à venir ne sont pas livrés à l'application (ils ne doivent pas se trouver dans les fichiers qu'elle charge). Le dépôt GitHub est public, choix de Marie : les faits écrits quelques jours à l'avance y sont visibles, ce qu'elle accepte (les utilisateurs sont des proches et le risque est jugé sans importance). Seule l'application ne doit jamais recevoir les faits à venir.

## Laissé au constructeur

- Choix de la pile technique, de l'hébergement et du mécanisme d'envoi planifié, tant que c'est gratuit pour un usage personnel, que cela fonctionne avec l'iPhone de Marie, et que la source de vérité des faits reste un fichier simple. Point de départ suggéré, sans obligation : page statique sur Cloudflare Pages, envoi push par un Worker avec déclencheur planifié (Cron Trigger) et KV pour l'inscription.
- Nom de domaine ou adresse : l'adresse gratuite de l'hébergeur suffit.
- Heure exacte de la notification : **08:30, choisi par Marie, modifiable.**
- Format exact du fichier de données et règle de rotation précise.
- Découpage de la rédaction des faits : par mois, dans l'ordre qu'il juge utile.
- Mécanique d'installation et de réinscription aux notifications si Safari invalide l'inscription.

## Livraison et méthode (choix de Claude, à vérifier par Marie)

- **Qui rédige et vérifie** : Claude, avec accès à la recherche web et à la lecture de pages pendant la rédaction. Rédaction par lots d'un mois à la fois, puis une passe de vérification séparée (source ouverte, date confirmée, lien qui répond) avant l'ajout au fichier de données. Possibilité de confier des mois à des sous-agents en parallèle.
- **Écriture au fil de l'eau** (choisi par Marie : pas de gros travail de départ, la surprise reste entière) : avant le lancement, Claude prépare et vérifie environ les 30 premiers jours, plus les dates incontournables des mois suivants. Ensuite, une tâche automatique planifiée écrit et vérifie chaque semaine les sept jours suivants et les ajoute au fichier de données, ce qui laisse une marge si une semaine échoue. Une date sans fait prêt n'envoie jamais de notification vide : dans ce cas, aucune notification ce jour-là. Le coût et les limites d'une tâche planifiée sur l'abonnement Claude de Marie sont à vérifier avant de l'activer ; sinon, Claude rédige à la main par lots, chaque semaine ou chaque mois, à la demande de Marie.
- **Date de lancement** : le jour où l'envoi planifié est activé et validé sur l'iPhone de Marie. C'est le premier jour de l'historique.
- **Recette sur l'iPhone** : Marie est la seule à pouvoir tester les notifications sur son téléphone. Prévoir un pas-à-pas court (ajouter à l'écran d'accueil, accepter les notifications, recevoir un envoi de test, ouvrir le détail depuis la notification, se réinscrire).
- **Vérification du bon fonctionnement** : un bouton « Envoyer une notification de test » dans l'application et un petit écran de statut (dernière inscription valide, dernier envoi). Pas d'alerte automatique au-delà, pour garder le système simple.
- **Conception** : figée pour l'essentiel. Les maquettes peuvent encore recevoir de petits ajustements après la première utilisation réelle.

## Comptes, dépôt et déploiement

- **Dépôt local** : `/Users/marie/Documents/GitHub_perso/kleio` (ce dossier). Le dépôt GitHub sera créé sur le compte de Marie : https://github.com/marievachelard. Nom de dépôt proposé : `kleio` (choix de Claude). Il n'est pas encore créé.
- **Compte Cloudflare** : Marie n'en a pas encore, elle le créera (gratuit) au moment du déploiement.
- **Déploiement** : fait par Claude depuis le terminal de Marie. Marie se connecte à Cloudflare une fois (commande `wrangler login`, qui s'ouvre dans le navigateur) et à GitHub si besoin. Les clés secrètes (clé privée des notifications) ne sont jamais écrites dans le dépôt.
- **Solution de repli** si Cloudflare pose problème : page hébergée par GitHub Pages et envoi planifié par GitHub Actions. Moins fiable côté horaire (un retard de plusieurs minutes est courant), donc seulement en dernier recours.

## Risques connus

- Les notifications push web sur iOS sont moins fiables que celles d'une app native : un envoi peut être retardé ou perdu, et une inscription peut expirer. Prévoir un moyen simple de se réinscrire et de vérifier que ça marche.
- Un fait faux ou une source cassée passerait sans relecture humaine : d'où la règle de vérification systématique, et un contrôle automatique que les liens répondent avant mise en ligne.

## Réussite

Marie installe Kleio sur son iPhone 16 en moins de cinq minutes, accepte les notifications, et reçoit le lendemain matin à 08:30 un fait juste et marquant. Un toucher ouvre le détail avec une source qui s'ouvre. Elle peut feuilleter le calendrier et relire chaque jour déjà passé, sans voir les jours à venir.

## Navigation (ajustement du 2026-11-16)

- Sur l'écran de détail, le bouton de retour s'appelle « ‹ Calendrier » et ramène au calendrier.
- Le calendrier n'a pas de bouton « ‹ Aujourd'hui » : le jour d'aujourd'hui est sélectionné à l'ouverture.
- **Changer de mois** : deux flèches à droite du titre du mois, et un glissement horizontal du doigt. L'année s'affiche à côté du nom du mois. La navigation va du mois du lancement au mois en cours : la flèche précédente est grisée dans le mois du lancement, la flèche suivante dans le mois en cours.
- Dans la carte du jour sélectionné, le bouton qui ouvre le détail est le même que le bouton « Lire l'article » de l'écran de détail : un petit carré arrondi couleur clé avec une flèche ↗ foncée, aligné sur la ligne du titre de la carte.
- **En-tête commun** aux écrans Détail et Calendrier : le nom « Kleio », centré, en texte couleur clé (sans logo), seul sur sa ligne. Sur le Détail, le bouton de retour « ‹ Calendrier » est sur la ligne du dessous, à gauche, au-dessus du titre.
- **Étiquette « ★ Incontournable »** : dans le détail d'une date incontournable, elle s'ajoute aux étiquettes (France ou Monde, thème), en couleur clé pleine avec texte blanc. Les dates non incontournables n'ont pas cette étiquette.

## Plusieurs téléphones, sans compte (changement du 2026-11-16)

Marie veut que n'importe qui avec le lien puisse utiliser Kleio (pour l'instant environ trois proches). Conséquences :

- **Pas de clé d'accès.** Consulter le calendrier et les faits ne demande rien. Pour recevoir la notification, chaque téléphone touche une fois « Activer les notifications » : c'est une inscription technique auprès du service de notification de l'appareil, sans compte ni identité.
- **Plusieurs inscriptions** (une par téléphone). L'envoi de 08:30 part vers toutes. Chaque inscription garde son propre « dernier envoi », pour ne jamais envoyer deux fois le même jour même si l'envoi est relancé.
- **Inscription refusée si l'adresse n'est pas celle d'un vrai service de notification** (Apple, Google, Mozilla, Microsoft), pour que personne ne puisse faire envoyer des requêtes ailleurs depuis le serveur.
- **Limite de 25 inscriptions** (choix de Claude : l'offre gratuite de Cloudflare limite le temps de calcul d'un envoi planifié ; la valeur est à vérifier en conditions réelles). Au-delà, l'inscription est refusée avec un message clair.
- Une inscription que le service de notification déclare disparue (404 ou 410) est supprimée ; le téléphone concerné propose alors de se réinscrire.
- Le bouton de test et l'écran de statut ne concernent que le téléphone qui les utilise.

Dans l'interface, on parle toujours d'« activer les notifications » : jamais d'« inscription », de compte ou de connexion, pour ne pas laisser croire qu'il faut un compte.
- **Phrase d'accueil** sur l'écran du calendrier, sous le nom « Kleio » : « Chaque matin, un fait d'histoire. » (en gris, centrée). Elle explique ce que fait l'app.
- **Réglages** : une petite icône d'engrenage, en haut à droite de l'écran du calendrier, sur la même ligne que « Kleio ». Il n'y a plus de lien « Réglages » en bas de page, ni d'icône sur les écrans de détail.
- **Ouverture de l'app** (changement du 2026-11-16, demande de Marie) : ouvrir Kleio depuis l'icône arrive toujours sur l'écran Calendrier. Seul un toucher sur une notification ouvre directement l'écran de détail du jour.
- **Carte du jour sélectionné** (changement du 2026-11-16) : toute la carte sous le calendrier est cliquable et ouvre le détail, pas seulement la flèche, qui reste un repère décoratif.
