# Écrire les faits de Kleio

Ce guide est pour quiconque rédige ou vérifie des faits (Claude, un sous-agent, une personne). Il traduit les règles de contenu de `DESIGN.md`.

## Ce qu'on choisit

- Un fait par jour de l'année. Il doit être **important** : un repère de culture générale qu'une personne cultivée devrait pouvoir placer.
- **Priorité à l'histoire de France**, puis à l'histoire mondiale (sciences, conquête spatiale, arts, institutions, guerres et paix, droits).
- Si une date n'a rien de marquant, prendre le moins mauvais fait réel et important. Jamais une simple curiosité, jamais un fait trop pointu.
- Un événement par date, qui s'est réellement produit **ce jour-là** (même jour et même mois, quelle que soit l'année).
- En cas de doute sur la date (sources qui divergent, calendrier julien ou grégorien, fuseau horaire), **écarter le fait** et en choisir un autre.

## Vérification (obligatoire)

- Chaque fait s'appuie sur **au moins une source réellement ouverte et lue** pendant la rédaction. Pas de souvenir, pas de lien deviné.
- Sources à privilégier : Wikipédia en français, Larousse, Encyclopaedia Britannica, BnF et Gallica, Persée, sites d'institutions (UNESCO, NASA, Assemblée nationale, Élysée, musées, archives).
- Le lien (`source.url`) doit ouvrir une page qui parle bien de ce fait, en `https://`, le plus stable possible. `source.name` est le nom du site (par exemple `wikipedia.org`, `larousse.fr`).
- Les chiffres, noms et dates cités dans le texte doivent tous se retrouver dans une source lue.
- Une seconde personne ou un sous-agent indépendant rouvre chaque source et confirme la date et les faits cités. Ce qui échoue est écarté ou corrigé.

## Ton et style

- Une personne cultivée qui parle simplement, sans effets de style, sans emphase.
- **Interdits** (le validateur les refuse) : le point médian « · », le tiret long « — », l'expression « fun fact ».
- À éviter aussi : les incises entre tirets, les tournures « non pas X, mais Y », les formules grandiloquentes, les phrases qui sonnent générées.
- Sujets tragiques (guerres, massacres, attentats) : ton factuel et respectueux, sans détail gratuit. L'anecdote reste sobre.
- Français soigné, accents et majuscules corrects. « 1er » pour le premier du mois et des siècles en chiffres romains avec « e » : XVIIIe siècle.

## Champs d'un fait

| Champ | Contenu |
|---|---|
| `date` | Jour d'envoi, `YYYY-MM-DD`. Pour un fait figé (voir plus bas), ce champ n'existe pas. |
| `eventYear` | Année où l'événement s'est produit (entier, jamais postérieur à l'année de `date`). |
| `title` | Titre court de l'événement (par exemple « Création de l'UNESCO »). |
| `short` | Corps de la notification : **140 caractères au plus**. Une ou deux phrases qui disent l'essentiel. |
| `essential` | L'essentiel en une ou deux phrases. |
| `context` | Un paragraphe plus développé (plusieurs phrases). Séparer deux paragraphes par une ligne vide (`\n\n`). |
| `didYouKnow` | Une anecdote sobre, vraie et vérifiée. Titre affiché : « Le saviez-vous ». |
| `invitation` | Une phrase courte et un peu punchy qui donne envie de lire la source. |
| `source` | `{ "name": "wikipedia.org", "url": "https://fr.wikipedia.org/wiki/..." }` |
| `scope` | `"France"` ou `"Monde"`. |
| `theme` | Un mot : `Politique`, `Guerre`, `Sciences`, `Arts`, `Institutions`, `Droits`, `Exploration`, `Société`. |

## Où écrire

- Un jour précis : `data/days/YYYY-MM.json`, clé `YYYY-MM-DD`, dans l'objet du mois.
- Une date incontournable (même fait chaque année) : `data/pinned.json`, clé `MM-JJ`, sans champ `date`.
- Les années suivantes, on ajoute une entrée pour la nouvelle année. On ne réécrit pas les anciennes.

## Dates incontournables

Un petit nombre de dates dont le fait est un pilier du récit national ou mondial. Liste de départ : 12 avril, 8 mai, 6 juin, 18 juin, 4 juillet, 14 juillet, 20 juillet, 26 août, 9 novembre, 11 novembre, 2 décembre, 10 décembre.

## Exemple

```json
{
  "2026-11-16": {
    "date": "2026-11-16",
    "eventYear": 1945,
    "title": "Création de l'UNESCO",
    "short": "37 pays signent à Londres l'acte fondateur d'une organisation pour l'éducation, la science et la culture.",
    "essential": "À Londres, 37 pays adoptent l'acte constitutif de l'UNESCO, l'agence de l'ONU pour l'éducation, la science et la culture.",
    "context": "La conférence est organisée par le Royaume-Uni et la France, quelques mois après la fin de la guerre en Europe. L'idée : empêcher un nouveau conflit en travaillant sur les esprits, par l'école, la science et la culture.\n\nL'organisation entre en action en 1946, avec son siège à Paris.",
    "didYouKnow": "Son texte fondateur affirme que « les guerres prenant naissance dans l'esprit des hommes, c'est dans l'esprit des hommes que doivent être élevées les défenses de la paix ».",
    "invitation": "Une organisation née pour qu'on n'ait plus à refaire la guerre. L'histoire complète se lit en quelques minutes.",
    "source": { "name": "unesco.org", "url": "https://www.unesco.org/fr/history" },
    "scope": "Monde",
    "theme": "Institutions"
  }
}
```

(Cet exemple n'est pas encore dans les données : le 16 novembre 2026 précède le lancement.)

## Contrôles automatiques

`npm run validate` vérifie la forme, la longueur de `short`, les https, les interdits de style et les doublons. `npm run check-links` vérifie que chaque lien répond.
