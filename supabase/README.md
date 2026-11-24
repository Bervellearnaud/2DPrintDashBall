# Créer la base de données — PAINTBALL 2D

Ce guide installe la progression cloud sur **votre propre projet Supabase**. Les migrations sont la source de vérité : ne créez pas les tables manuellement et n’exécutez pas ces fichiers sur un PostgreSQL nu (ils dépendent de Supabase Auth, `auth.users`, `auth.uid()` et des rôles Supabase).

Le jeu dispose aussi de records et d’une sauvegarde locale. La base cloud ne remplace pas le serveur WebSocket multijoueur.

## 1. Créer le projet

1. Connectez-vous au tableau de bord Supabase et choisissez **New project**.
2. Choisissez votre organisation, un nom (par exemple `paintball-2d`), une région adaptée aux joueurs et un mot de passe de base robuste.
3. Conservez ce mot de passe dans un gestionnaire de mots de passe, jamais dans le dépôt ou le navigateur.
4. Attendez que le projet soit prêt. Relevez son **Project URL**, sa **clé publishable** et sa référence de projet depuis les paramètres du projet / API.

Le nom de variable historique `VITE_SUPABASE_ANON_KEY` accepte la clé publique publishable (`sb_publishable_…`) ou une ancienne clé `anon`. **N’utilisez jamais une clé `sb_secret_…`, `service_role` ni un mot de passe SQL dans une variable `VITE_*`.** Ces variables sont incluses dans le JavaScript public.

## 2. Créer les tables et fonctions (SQL Editor)

Dans **SQL Editor → New query**, exécutez les fichiers **dans cet ordre**, en attendant le succès de chaque fichier :

| Ordre | Fichier | Contenu |
| --- | --- | --- |
| 1 | [202610280001_progression.sql](migrations/202610280001_progression.sql) | `profiles`, `player_stats`, `runs`, trigger de création de profil, statistiques, classement et RLS |
| 2 | [202610280002_saved_runs.sql](migrations/202610280002_saved_runs.sql) | `saved_runs`, sauvegarde en cours et politiques d’accès |
| 3 | [202610280003_profile_names.sql](migrations/202610280003_profile_names.sql) | mise à jour du trigger et fonction `set_profile_name` |

Copiez **l’intégralité** de chaque fichier, puis cliquez sur **Run**. Ne modifiez pas les identifiants de joueurs et ne désactivez pas la RLS pour contourner une erreur.

Pour une base existante, faites une sauvegarde avant intervention. Ne supprimez pas les tables pour installer une mise à jour : appliquez uniquement les migrations manquantes, dans l’ordre. Les scripts actuels utilisent notamment `if not exists`, `create or replace` et la recréation de politiques ; cela ne dispense pas de vérifier les données existantes.

### Alternative : déployer les migrations avec la CLI

Utilisez cette méthode à la place de la copie dans SQL Editor, pas en parallèle sans gérer l’historique des migrations.

```bash
# Depuis la racine du dépôt, avec Node.js installé
npx supabase login
npx supabase init
npx supabase link --project-ref VOTRE_REFERENCE_PROJET
npx supabase db push --dry-run
npx supabase db push
npx supabase migration list
```

`init` crée la configuration CLI locale si elle n’existe pas. `link` peut demander le mot de passe SQL : saisissez-le uniquement dans l’invite sécurisée. Vérifiez la référence du projet avant `db push`.

Si les fichiers ont déjà été exécutés manuellement, **ne lancez pas aveuglément `db push`** : réconciliez d’abord l’historique avec la commande CLI `migration repair` après comparaison des schémas. N’utilisez pas `db reset` sur une base contenant des données à conserver.

## 3. Configurer l’authentification

Dans **Authentication** :

- activez **Anonymous Sign-Ins** pour « Continuer en invité » ;
- activez le fournisseur **Email** pour les liens magiques si vous souhaitez des comptes récupérables sur plusieurs appareils ;
- dans **URL Configuration**, définissez la **Site URL** sur l’URL publique de votre jeu ;
- ajoutez les URL de redirection autorisées, par exemple `http://localhost:5173/**` en développement et `https://votre-site.netlify.app/**` en production.

Pour une prévisualisation hébergée, ajoutez son URL exacte si vous y testez les liens magiques. N’autorisez pas toutes les origines en production. Si les emails n’arrivent pas, vérifiez les limites d’envoi Supabase et configurez un SMTP adapté au déploiement.

## 4. Relier le front au projet

À la racine du dépôt :

```bash
cp .env.example .env.local
```

Remplacez **les deux valeurs Supabase** par celles de votre projet :

```dotenv
VITE_SUPABASE_URL=https://VOTRE_REFERENCE_PROJET.supabase.co
VITE_SUPABASE_ANON_KEY=VOTRE_CLE_PUBLIQUE_PUBLISHABLE
```

Ne commitez pas `.env.local`. Redémarrez `npm run dev` après changement. Sur Netlify, ajoutez les deux variables dans la configuration d’environnement puis **reconstruisez et redéployez** le site : elles sont lues au build, pas à l’ouverture de la page.

**Compatibilité du dépôt :** `src/lib/supabase.ts` contient encore une URL et une clé publique de démonstration en repli. Sans variables personnalisées, le client utilise ce projet partagé, pas votre nouvelle base. Pour une installation indépendante, définissez toujours les deux variables ; les clés publiques ne remplacent jamais les politiques RLS.

## 5. Vérifier l’installation

### Dans SQL Editor

Exécutez [verify.sql](verify.sql). Chaque ligne de la première requête doit avoir `ok = true` (tables, RLS, politiques, fonctions et trigger). Les deux requêtes suivantes doivent s’exécuter sans erreur :

```sql
select public.player_grade(0, 0); -- RECRUE
select * from public.leaderboard('solo', 8); -- peut être vide au départ
```

Ces contrôles vérifient la présence des objets, **pas l’isolation réelle entre deux comptes**. Le SQL Editor fonctionne avec des privilèges élevés ; un test réussi dans cet éditeur ne prouve pas que le client connecté dispose des bons droits.

### Dans le jeu

1. Ouvrez **Progression → Continuer en invité**. Vérifiez qu’un utilisateur apparaît dans Authentication et que ses lignes `profiles` et `player_stats` existent.
2. Choisissez un pseudo et un marqueur disponible ; rechargez et vérifiez leur conservation.
3. Lancez une partie via **Jouer → Nouvelle partie solo** et terminez-la : vérifiez `runs`, les statistiques et l’historique.
4. En partie, ouvrez **… → Sauver** (ou `Ctrl+S` sur PC), puis revenez au menu. Dans **Jouer**, utilisez **Reprendre** : vague, score et état doivent être restaurés.
5. Testez dans un autre navigateur / profil distinct : il ne doit pas voir les sauvegardes privées du premier compte. Le classement public expose volontairement certaines performances.
6. Si Email est activé, testez un lien magique sur votre domaine autorisé.

Un compte invité suit sa session de navigateur ; supprimer les données du navigateur peut en faire perdre l’accès. Utilisez un compte email pour retrouver la progression sur plusieurs appareils.

## Modèle de données et sécurité

| Objet | Rôle |
| --- | --- |
| `profiles` | pseudo, couleur, réglages et progression légère ; lié à `auth.users` |
| `player_stats` | statistiques cumulées et conditions de déblocage |
| `runs` | historique des résultats solo/coop/versus |
| `saved_runs` | une sauvegarde en cours par joueur et mode |
| `record_run(...)` | enregistre le résultat et met à jour les statistiques |
| `set_profile_name(p_name)` | crée/met à jour le pseudo du joueur connecté |
| `leaderboard(mode, limit)` | classement public sans renvoyer les identifiants utilisateur |
| `player_grade(total_score, best_wave)` | grade selon la progression |

- **RLS activée sur les quatre tables** ; les politiques privées reposent sur `auth.uid()`.
- Les écritures des résultats et statistiques passent par `record_run`, qui utilise l’identité du JWT, pas un identifiant envoyé par le client.
- Les fonctions privilégiées, les permissions et les contraintes sont définies dans les migrations ; ne les remplacez pas par un accès public en écriture.
- Les valeurs et tailles JSON sont bornées, mais les résultats proviennent du client : cela **ne constitue pas un système anti-triche serveur**.
- Les lignes liées à un utilisateur sont supprimées en cascade lorsqu’il est supprimé. Réservez cette opération aux comptes de test ou à une procédure de suppression maîtrisée.
- Les sauvegardes locales (`pb2d.save.solo`) restent un secours ; les synchronisations cloud nécessitent une session et une connexion valides.

## Dépannage

| Symptôme | À vérifier |
| --- | --- |
| « relation/function does not exist », erreur de cache du schéma | exécuter les trois migrations dans l’ordre, puis `verify.sql` |
| Connexion invité impossible | Anonymous Sign-Ins activé sur le **même projet** que les variables front |
| Clé invalide / 401 | paire URL + clé publique issue du même projet, nouveau build après modification |
| Permission refusée / RLS | session authentifiée, migrations complètes ; ne pas désactiver la RLS |
| Lien magique redirigé au mauvais endroit | Site URL, Redirect URLs et domaine de déploiement |
| Progression absente sur un autre appareil | même compte email ; un nouvel invité est un autre utilisateur |
| Sauvegarde uniquement locale | état de connexion cloud, réseau et présence de `saved_runs` |

Aucun outil du dépôt ne crée automatiquement un projet Supabase hébergé. Ce guide prépare l’installation ; l’exécution distante et les tests inter-comptes restent à effectuer par l’administrateur.
