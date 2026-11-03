# PAINTBALL 2D — Splat Arena

**Un arcade de paintball vue de dessus, nerveux et coloré, jouable au clavier, à la souris, au tactile et à la manette.**  
Tu tiens un marqueur, tu tiens un court, tu tiens une vague. Chaque bille manquée tache le terrain — et le terrain rapporte des points.

[![En ligne](https://img.shields.io/badge/play-painballvoom.netlify.app-3ee8ff)](https://painballvoom.netlify.app)
[![Dépôt](https://img.shields.io/badge/source-GitHub-e9f5ee)](https://github.com/loba225samuel-coder/painballv2)

**En ligne :** <https://painballvoom.netlify.app>  
**Dépôt :** <https://github.com/loba225samuel-coder/painballv2>

### Sommaire

| | |
| --- | --- |
| [1. Le projet](#1-le-projet-en-bref) | [2. Fonctionnalités](#2-fonctionnalités) |
| [3. Conception](#3-conception) | [4. Démarrage](#4-démarrage-rapide) |
| [5. Scripts](#5-scripts-et-commandes) | [6. Variables](#6-variables-denvironnement) |
| [7. Déploiement](#7-déploiement) | [8. Structure](#8-structure-du-dépôt) |
| [9. Contrôles](#9-contrôles) | [10. Vérifications](#10-qualité-et-vérifications) |
| [11. Évolutions](#11-pistes-dévolution) | [12. Historique](#12-historique-récent) |
| [13. Auteur](#13-auteur) | |

---

## 1. Le projet en bref

PAINTBALL 2D est un jeu d’arène complet dans le navigateur :

- **solo** : survivre à des vagues d’adversaires, enchaîner les splats, peindre le court ;
- **duo local** : deux joueurs sur le même écran, en coopération ou en duel ;
- **en ligne** : salons privés, serveur autoritaire, reconnexion ;
- **progression** : profil, grade, statistiques, historique, classement cloud ;
- **sauvegarde en cours de partie** : quitter à la vague 5, reprendre plus tard ;
- **mobile** : plein écran réel, commandes pouce, caméra adaptée, haptique.

L’objectif n’est pas seulement de tirer : c’est de **contrôler l’espace**. Les bunkers bloquent les tirs, les ricochets les contournent, les explosions nettoient les groupes, le rouleau transforme les déplacements en territoire.

### Stack

| Couche | Choix |
| --- | --- |
| Interface | React 19, TypeScript strict, Tailwind CSS 4 (`@theme`) |
| Build | Vite 7 + `vite-plugin-singlefile` |
| Jeu | Canvas 2D, boucle `requestAnimationFrame`, aucune dépendance de moteur de jeu |
| Audio | WebAudio synthétisé, zéro fichier son |
| Icônes | Lucide |
| Typographie | Bungee pour l’affichage, Barlow / Barlow Semi Condensed pour le texte |
| Multijoueur | Node.js + `ws`, simulation partagée, snapshots |
| Données | Supabase Auth + Postgres + RLS |
| Déploiement | Netlify pour le front, Render / Fly / VPS pour le serveur de salons |

---

## 2. Fonctionnalités

### 2.1 Solo : vagues, score et peinture

Le mode solo est une survie en vagues.

- **Vagues progressives** : ennemis plus nombreux, plus rapides, plus résistants.
- **4 arènes** : le terrain change **à chaque portail franchi** (géométrie, palette, motif de sol, bunkers).
- **Boss toutes les 5 vagues**, en quatre variantes visuelles et colorées (Goliath, Inferno, Glacier, Toxic).
- **Passage de niveau par portail** : une vague nettoyée ouvre un portail à franchir.
- **Plusieurs archétypes d’ennemis** :
  - tireurs classiques qui cherchent la ligne de vue ;
  - rushers qui foncent au contact ;
  - snipers qui chargent un tir puissant ;
  - boss qui alternent tirs et rafales.
- **Score** : les éliminations rapportent des points.
- **Combo** : enchaîner les splats augmente le multiplicateur.
- **Couverture de peinture** : chaque impact tache le sol ; la couverture verse un bonus en fin de vague.
- **Bonus ramassables** : 15 capsules — soin, overclock, triple jet, bouclier, ricochet, bille explosive, rouleau, turbo, grappe, encre lente, aimant (les 4 derniers aussi en ligne) + PRIME, dash rechargé, combo gelé et **Marker lourd** (solo).
- **Dash** : esquive rapide avec courte invulnérabilité.
- **Cinq marqueurs** : MARKER, SPRAYER, CANNON, puis SNIPER et SHOTGUN à débloquer.
- **Quatre armes ramassables** : FLAMER, MAGNUM, MINIGUN, LANCEUR (capsules de 18 s).
- **Quatre variantes de boss** : GOLIATH, INFERNO, GLACIER, TOXIC.
- **Déblocages** adossés à `player_stats` (et à la carrière locale) : vague 10, 100 000 points.
- **Chargeur limité** : rechargement manuel ou automatique à zéro.
- **Musique** : intro au choix (3 thèmes) + thème de fond en jeu, synthétisés.
- **États complets** : accueil, partie, pause, game over, redémarrage rapide, classement local.

### 2.2 Les marqueurs, l’équilibrage et les déblocages

Le choix se fait sur l’accueil, **se conserve** (`localStorage` + `profiles.settings.weapon`) et s’applique à la partie
en cours comme à la sauvegarde. Trois marqueurs sont disponibles d’emblée, deux se débloquent via `player_stats`.

#### Marqueurs disponibles

| Marqueur | Cadence | Dégâts | Chargeur | Portée | Peinture | Perce | Déblocage |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **MARKER** | 9,3 tirs/s | 30 | 12 | longue | ×1,00 | – | d’emblée |
| **SPRAYER** | 18 tirs/s | 14 | 30 | courte | ×1,45 | – | d’emblée |
| **CANNON** | 1,6 tir/s | 100 | 5 | moyenne | ×1,35 | 1 | d’emblée |
| **SNIPER** | 1,1 tir/s | 120 | 3 | très longue | ×1,10 | 1 | **vague 10 atteinte** |
| **SHOTGUN** | 1,8 tir/s | 18×6 | 6 | très courte | ×1,40 | – | **100 000 points cumulés** |

#### Équilibrage mesuré

Le tableau est vérifié automatiquement par `npx tsx scripts/weapons-balance.ts
npx tsx scripts/drop-rates.ts` (échec si une arme sort des bornes) :

| Marqueur | Rafale (DPS) | Soutenu (DPS) | Effectif (avec perce) | Peinture/s |
| --- | --- | --- | --- | --- |
| MARKER | 278 | 160 | 160 | 9,3 |
| SPRAYER | 255 | 150 | 150 | 26,4 |
| CANNON | 161 | 115 | 184 | 2,2 |
| SNIPER | 133 | 86 | 137 | 1,2 |
| SHOTGUN | 196 | 138 | 138 | 2,5 |

Règles d’équilibre tenues : le **Sprayer** reste le peintre (≥ 2× le Marker) sans dépasser le Marker en dégâts effectifs ;
le **Cannon** compense sa cadence par le perce et son chargeur de 5 ; le **Sniper** est un outil de précision ;
le **Shotgun** est un burst de proximité. Chaque arme change réellement le tir : dispersion, taille et couleur de la
bille, longueur de canon, son (léger / moyen / lourd), recul, flash de bouche et multiplicateur de peinture.

#### Déblocages via `player_stats`

Les conditions se lisent dans les statistiques Supabase (`player_stats`) **et** dans une carrière locale
(`pb2d.career.v1`), fusionnées par `bestCareer()` — les joueurs hors ligne débloquent donc aussi.

| Marqueur | Statistique | Seuil |
| --- | --- | --- |
| **SNIPER** | `best_wave` | ≥ 10 |
| **SHOTGUN** | `total_score` | ≥ 100 000 |

L’écran d’accueil affiche les cartes verrouillées avec cadenas, condition et **barre de progression**
(`42 000 / 100 000`). Une arme verrouillée n’est jamais équipable : la sélection retombe sur le Marker
(`safeWeaponId`), y compris si une ancienne sauvegarde ou un profil cloud la référence.
Un **toast** annonce chaque nouveau marqueur débloqué.

Les bonus restent cumulables : l’ordre appliqué est **arme → bonus de cadence (`rapid`) → peinture / dégâts**.

### 2.3 Armes ramassables et apparence

**Capsules d’arme (temporaires, 18 s).** Un ennemi éliminé a **8 %** de chance de lâcher une capsule d’arme
(hexagone lumineux avec le nom et le glyphe de l’arme). On l’enfile : le marqueur est remplacé pendant **18 s**,
chargeur plein, puis on revient automatiquement au marqueur de sélection. Le HUD affiche l’arme active, ses munitions
et une barre de compte à rebours dorée.

| Capsule | Profil | Points forts |
| --- | --- | --- |
| **FLAMER** | 22 tirs/s · 7 dgts · 60 billes · peinture **×2,4** | couvre le court, très courte portée |
| **MAGNUM** | 1,8 tirs/s · **130 dgts** · perce 2 · 6 billes | précision chirurgicale, traverse les lignes |
| **MINIGUN** | 26 tirs/s · 11 dgts · **80 billes** | arrose sans discontinuer, dispersion forte |
| **LANCEUR** | 1,8 tirs/s · 70 dgts · **obus explosifs** · 6 billes | dégâts de zone, grosse peinture |

Ces armes sont **exclusives aux capsules** (`pickupOnly`) : elles n’apparaissent pas dans la sélection d’accueil et ne
peuvent pas être débloquées de façon permanente. L’arme ramassée est sauvegardée avec la partie en cours.

**Apparence des armes.** Chaque marqueur a une silhouette propre, dessinée dans le même repère que le joueur et
réutilisée pour l’aperçu de l’accueil : réservoir et buse du **Sprayer**, double canon et frein de bouche du **Cannon**,
long canon + lunette + bipied du **Sniper**, deux tubes du **Shotgun**, réservoir à carburant et tuyau du **Flamer**,
barillet du **Magnum**, trois barillets qui tournent sur le **Minigun**, tube et barillet du **Lanceur**, canon simple du
**Marker**. Les billes reprennent la couleur, la taille, la dispersion et la portée de l’arme.

**Boss à variantes.** Un boss apparaît toutes les 5 vagues, avec une **variante cyclique** :

| Vague | Boss | Couleur | Silhouette | Particularité |
| --- | --- | --- | --- | --- |
| 5 | **GOLIATH** | or | double canon épais | référence |
| 10 | **INFERNO** | orange | pointes de flamme qui pulsent | +10 % PV |
| 15 | **GLACIER** | cyan | cristaux orbitaux, noyau hexagonal | +20 % PV |
| 20 | **TOXIC** | lime | couronne de spores, cuve dorsale | +30 % PV |

Chaque variante a son halo, ses projectiles colorés et sa bannière (`INFERNO · BOSS`). Le HUD affiche le nom du boss
en cours avec une icône de tête de mort.

### 2.4 Arènes tournantes, portails et musique

**Quatre terrains entièrement différents, un nouveau à chaque portail.** Chaque arène combine une géométrie,
une palette, un **motif de sol** et un **matériau de bunkers** distincts :

| # | Arène | Géométrie | Motif de sol | Bunkers | Caractère |
| --- | --- | --- | --- | --- | --- |
| 1 | **LE YARD** | symétrie historique, 15 obstacles | grille | bois/peinture ocre | équilibré |
| 2 | **LES DOCKS** | conteneurs verticaux, couloirs latéraux | diagonales cyan | acier bleu-vert | angles serrés |
| 3 | **LA FOSSE** | bunker central massif, escaliers | anneaux magenta | béton rouge | corps à corps |
| 4 | **LE TOIT** | grande croix, quatre piliers | hexagones lime | métal bleu nuit | vues dégagées |

Le terrain change **à chaque portail franchi** (`ARENA_INTERVAL = 1` ; le passer à `4` rétablit un changement
toutes les 4 vagues). À chaque passage : court reconstruit, peinture et couverture remises à zéro, joueur replacé,
flash coloré, double onde de choc, secousse et bannière au nom de l'arène. Le HUD affiche `ARÈNE n/4 · NOM`.
L'arène courante est enregistrée dans la sauvegarde de partie.

**Progression par portail.** Une vague nettoyée n'enchaîne plus automatiquement : un **portail** s'ouvre à un endroit
dégagé du court, avec anneaux tournants, halo et libellé « ENTRE DANS LE PORTAIL ». Le joueur doit marcher dedans
pour passer au niveau suivant (bonus de franchissement : `150 + 40 × niveau`). Le portail :

- n'apparaît qu'une fois tous les ennemis éliminés ;
- est signalé dans le HUD (`PORTAIL OUVERT`) et par une flèche animée ;
- reste ouvert tant que le joueur n'y entre pas ;
- est sauvegardé / restauré avec la partie.

**Musique synthétisée, sans fichier audio.**

- **Musique d'intro au choix** : trois thèmes — `NEON DRIZZLE` (synthwave 92 BPM), `MIDNIGHT COURT` (chill 78 BPM),
  `SPLAT HYPE` (arcade 112 BPM). Sélecteur sur l'accueil (précédent / suivant + activation) et dans la pause.
- **Musique de fond** pendant le jeu : thème arcade 128 BPM (basse, arpège, nappe, batterie).
- Séquenceur WebAudio : scheduling à horizon 350 ms, coupure propre en pause, en game over et quand l'onglet passe
  en arrière-plan. Choix persistés dans `localStorage` (`pb.music`, `pb.music.intro`).

### 2.5 Bonus ramassables et fréquence des soins

**Pourquoi le soin semblait rare.** Chaque élimination a 30 % de chance de lâcher une capsule, puis un tirage uniforme
dans une table de **21 entrées** : le soin n’y pesait que **2/21 (9,5 %)**, soit **2,7 % par élimination** — environ
**1 soin tous les 38 ennemis**, et **0,3 soin attendu par vague de 10**. À cela s’ajoutaient deux pertes : la capsule
expirait en 13 s, et un soin ramassé à PV pleins ne rendait rien.

**Correction : tirage pondéré selon les PV + anti-malchance.**

| État du joueur | Poids du soin | Fréquence mesurée |
| --- | --- | --- |
| PV pleins (6/6) | ×0,6 | ~1 soin / 57 éliminations (converti en bouclier) |
| Blessé (4/6) | ×2 | ~1 soin / 13 éliminations |
| Critique (≤ 2/6) | ×3,5 + garantie | ~1 soin / 5 éliminations, **écart max 6 kills** |

Règles implémentées (`rollSoloBonus`, `HEAL_PITY_KILLS`) :

- tirage **pondéré** de la table solo, poids du soin multiplié quand les PV baissent ;
- **garantie absolue** : un soin est forcé après 22 éliminations sans soin (6 si le joueur est à 2 PV ou moins), même
  si le tirage de drop ne passe pas ;
- **plus de soin gaspillé** : ramassé à PV pleins, il devient une **charge de bouclier** (max 2) au lieu de disparaître ;
- capsules de soin **visibles plus longtemps** (16 s au lieu de 13) ;
- le **boss** lâche toujours un soin s’il manque des PV ;
- les multiplicateurs de soin sont aussi appliqués en COOP / VERSUS (poids renforcé quand un joueur est sous 1/3 de vie).

Le reste de la table est inchangé : `npx tsx scripts/drop-rates.ts` imprime les fréquences et échoue si le soin devient
trop fréquent à PV pleins, trop rare en critique, ou si le trou de soin dépasse 8 éliminations.

### 2.6 Table des bonus

Les capsules apparaissent après les éliminations. **15 bonus au total.** La table de drop (`DROP_TABLE`, 17 entrées) reste partagée entre solo et multijoueur ; les bonus récents du solo (**PRIME, Dash rechargé, Combo gelé, Marker lourd**) n'y sont ajoutés que par `SOLO_DROP_TABLE`, pour ne pas perturber l'équilibre en ligne (la table solo compte donc 18 entrées). Les plus rares n'y figurent qu'une fois.

| Bonus | Effet | Durée / charges |
| --- | --- | --- |
| **Soin / Peinture** | Rend 2 points de vie. | instantané |
| **Overclock** | Recharge complète + tir rapide. | 5 s |
| **Triple jet** | Trois projectiles par tir. | 9 s |
| **Bouclier de peinture** | Absorbe 2 impacts, bulle visible autour du joueur. | 10 s / 2 charges |
| **Ricochet** | Les projectiles rebondissent une fois sur les bunkers. | 8 s |
| **Bille explosive** | Le prochain tir explose en zone, endommage les groupes et peint largement. | 1 charge, max 2 |
| **Rouleau de peinture** | Le joueur peint le sol en se déplaçant. | 6 s |
| **Turbo** | Vitesse ×1,35, traînée orange derrière le joueur. | 8 s |
| **Grappe** | Tir en éventail : 5 billes serrées, courte portée. | 1 charge, max 2 |
| **Encre lente** | Chaque impact ralentit l'ennemi / l'adversaire de 45 % (anneau violet). | 8 s / effet 2 s |
| **Aimant** | Les capsules situées dans un rayon de 300 px viennent vers le joueur. | 10 s |
| **PRIME** | Verse immédiatement 250 × vague de points. | instantané |
| **Dash rechargé** | Remet le dash à 0 et offre une charge gratuite. | 1 charge |
| **Combo gelé** | Le timer du combo cesse de descendre. | 5 s |
| **Marker lourd** | Marqueur surpuissant : dégâts **×1,5**, cadence **×2**, billes plus grosses et dorées, chargeur rempli. | 12 s |

Les bonus actifs sont lisibles dans le HUD : icône, nom, durée restante, charges.  
En multijoueur, ils apparaissent aussi sur les cartes joueurs.

### 2.7 Mobile

Le jeu détecte les écrans tactiles et bascule dans un schéma pensé pour les pouces.

| Zone | Action |
| --- | --- |
| Moitié gauche | Glisser pour se déplacer ; le pad apparaît sous le doigt. |
| Moitié droite | Glisser pour viser et tirer automatiquement en poussant à fond. |
| **FEU** | Tir maintenu avec auto-visée ; l’anneau montre le chargeur. |
| **DASH** | Esquive + i-frames ; anneau de recharge. |
| **CHG** | Rechargement manuel. |

Conception mobile :

- **Canvas plein écran** : pas de bandes noires, pas de rectangle centré.
- **Caméra dynamique** (prévue pour le multijoueur, code conservé) : suit le joueur en ligne, le milieu des deux joueurs en local.
- **Mini-carte** et **flèches de hors-champ** pour garder la lecture du terrain (multijoueur).
- **HUD en paysage court** (`max-height: 560px`) : score 18 px, pastilles de bonus en icône seule, boutons système compacts, pause scrollable.
- **Zones de sécurité** : encoche, barre d’accueil, coins arrondis.
- **Rotation robuste** : le canvas mesure son conteneur, pas sa propre taille précédente.
- **Plein écran** demandé au lancement quand l’API existe, sinon manifeste d’installation.
- **Haptique** : dash, impact, élimination, boss ; coupable dans le HUD.
- **Musique** : sélecteur d'intro adapté au tactile (précédent / suivant) sur l'accueil.
- **Wake lock** : l’écran ne s’éteint pas pendant une partie.
- **Budget FX mobile** : particules plafonnées, DPR adapté, pas de scanlines.
- **Barre haute compacte** : icônes 16 px, cibles tactiles 40 px, score 22 px, boutons système en **rangée horizontale** dans le coin haut-droit (jamais une colonne sur toute la hauteur, qui coupait le dernier bouton).
- **Contrôles proportionnés à la hauteur d’écran** : rayon des sticks calculé sur le plus petit côté (40–56 px) — sur un écran paysage de 456 px de haut, le stick passe de 148 à 92 px de diamètre.
- **Zones réservées** : bas du HUD (88 px) jamais occupé par un stick, sticks placés entre le HUD et le cluster de boutons, étiquettes **au-dessus** des pastilles et plafonnées à 12 px.

### 2.8 Multijoueur

> **État actuel : temporairement désactivé dans l’interface.**  
> Le bouton est visible mais marqué **« Bientôt disponible »**. Le code du multijoueur est conservé pour une réactivation prochaine.

Depuis l’accueil, **MULTIJOUEUR** ouvrira un écran dédié.

| Mode | Principe |
| --- | --- |
| **COOP local** | Deux joueurs, même écran, vagues partagées, pas de tir allié, réanimation. |
| **COOP en ligne** | Salon privé, code à 6 caractères, lien d’invitation, prêt / pas prêt, reconnexion. |
| **VERSUS** | 90 secondes, réapparition rapide, territoire peint, score final. |

En COOP, un joueur à terre peut être réanimé en restant près de lui.  
En VERSUS, chaque case peinte peut être volée à l’adversaire : le territoire compte dans le score final.

Le serveur en ligne est **autoritaire** : il valide les déplacements, tirs, dégâts, scores et peinture. Le client ne décide pas du résultat.

### 2.9 Progression et sauvegarde

Le jeu propose une carrière persistante :

- pseudo complet (jusqu’à 16 caractères) et couleur de peinture ;
- grade : **RECRUE → SPRAYEUR → VÉTÉRAN → LÉGENDE** ;
- record, score cumulé, meilleure vague ;
- éliminations, tirs, précision, couverture max, temps de jeu ;
- historique des dernières parties ;
- classement cloud par mode ;
- réglages son / vibration synchronisés.

Authentification Supabase :

- **invité** en un clic ;
- **email** par lien magique ;
- repli local si le cloud n’est pas configuré.

#### Sauvegarde en cours de partie

En solo :

- bouton **SAUVER** dans le HUD ;
- raccourci **Ctrl+S** ;
- **SAUVEGARDER ET QUITTER** dans la pause ;
- carte **PARTIE EN COURS** à l’accueil et dans le vestiaire.

La sauvegarde restaure :

- vague, score, combo, temps ;
- vie, munitions, bonus actifs ;
- ennemis, apparitions à venir, bonus au sol ;
- **arène courante** et **portail ouvert** ;
- couverture et calque de peinture ;
- adaptation à un autre écran ou une autre orientation.

---

## 3. Conception

### 3.1 Identité visuelle et sonore

Le jeu cherche une sensation d’arène sportive street :

- quatre identités de court (Yard vert, Docks cyan, Fosse magenta, Toit lime) ;
- lignes chalk, motifs de sol et matériaux de bunkers distincts ;
- accents cyan, magenta, lime, or, orange ;
- typographie display Bungee, texte Barlow ;
- panneaux francs, ombres dures, pas de glassmorphism généralisé ;
- peinture persistante au sol : le terrain garde la mémoire de la partie.

Le feedback est central :

- tremblements d’écran ;
- hitstop bref sur les gros impacts ;
- particules, anneaux, éclats ;
- bannières de vague et de combo ;
- sons synthétisés : tir, impact, splat, recharge, dash, bonus, boss ;
- musique synthétisée : intro mélodique + boucle de jeu (basse, arpège, nappe, batterie) ;
- vibrations mobiles courtes et contextuelles.

### 3.2 Architecture générale

```text
React / Tailwind
├── App.tsx                 orchestration des écrans et moteurs
├── components/             HUD, accueil, pause, game over, vestiaire, multi
├── hooks/useProgression.ts session, stats, historique, sauvegardes
└── lib/                    Supabase, scores locaux

Canvas / jeu
├── game/engine.ts          moteur solo : boucle, IA, FX, sauvegarde
├── game/multiplayer.ts     client multi : rendu, entrées, réseau, caméra
├── game/mpSim.ts           simulation pure partagée local + serveur
├── game/mpProtocol.ts      messages client / serveur
├── game/rules.ts           constantes, bonus, 4 arènes, ennemis
├── game/audio.ts           SFX WebAudio
└── game/music.ts           musiques synthétisées + séquenceur WebAudio

Serveur
└── server/index.ts         salons WebSocket, autorité, heartbeat

Données
└── supabase/migrations/    profils, stats, runs, saved_runs, noms de profil, RLS
```

### 3.3 Pourquoi Canvas plutôt que DOM ?

Le jeu manipule beaucoup d’objets mobiles : projectiles, particules, ennemis, peinture.  
Canvas 2D permet :

- un rendu maîtrisé à 60 fps ;
- des sprites de peinture mis en cache ;
- un court pré-bavé une seule fois ;
- un calque de peinture séparé ;
- des effets de caméra, shake et flash sans reflow DOM.

React reste responsable de ce qu’il fait bien : menus, HUD, formulaires, états, progression.

### 3.4 Simulation partagée

Le multijoueur ne duplique pas les règles.

- `rules.ts` contient les constantes communes.
- `mpSim.ts` est une simulation pure : joueurs, ennemis, tirs, bonus, couverture.
- Le duo local utilise cette simulation directement.
- Le serveur en ligne utilise la même simulation.
- Le client en ligne affiche, prédit et réconcilie.

Cela évite d’avoir un gameplay local qui diverge du gameplay en ligne.

### 3.5 Réseau

Modèle choisi : **serveur autoritaire + snapshots + prédiction locale**.

- Simulation serveur : **60 Hz**.
- Snapshots : **20 Hz** en partie, plus lents en salon.
- Client : prédiction du mouvement local, réconciliation à la réception des snapshots.
- Salons : code court, lien d’invitation, hôte, prêt / pas prêt.
- Reconnexion : jeton par joueur, grâce d’environ 20 secondes.
- Heartbeat : les sockets fantômes sont nettoyés.
- Limites : taille des messages, cadence d’entrées, nombre de salons / clients.

Le serveur ne fait pas confiance au client pour les dégâts, les scores ou la peinture.

### 3.6 Rendu mobile plein écran

Le problème classique des jeux canvas sur mobile est la rotation : le canvas garde une ancienne taille en pixels et laisse une zone noire.

La solution appliquée :

1. mesurer le **conteneur**, pas le canvas ;
2. garder le canvas en `width: 100%; height: 100%` ;
3. recalculer la résolution interne avec le DPR ;
4. écouter `resize`, `orientationchange`, `screen.orientation`, `visualViewport` et `ResizeObserver` ;
5. recalculer plusieurs fois après une rotation, car les navigateurs mobiles publient la taille en plusieurs temps ;
6. en multijoueur, recaler immédiatement la caméra pour couvrir l’écran.

En solo, la rotation préserve aussi la partie : positions reprojetées, couverture ré-échantillonnée, peinture conservée.

### 3.7 Données et sécurité

Supabase est utilisé pour la progression, pas pour le temps réel.

Tables principales :

| Table | Rôle |
| --- | --- |
| `profiles` | identité, couleur, réglages |
| `player_stats` | carrière agrégée |
| `runs` | parties terminées |
| `saved_runs` | partie en cours sauvegardée |

Principes :

- **RLS activée** sur les tables exposées.
- Un joueur ne lit que ses propres lignes.
- L’écriture des parties passe par `record_run()`, fonction `security definer`.
- L’identité vient du JWT, jamais d’un paramètre client.
- Les valeurs sont bornées côté SQL.
- Le classement public ne renvoie que des champs sûrs : pseudo, couleur, score, vague, couverture, grade, date.
- La clé `sb_publishable_…` est publique par design ; elle ne remplace pas les politiques RLS.
- Aucune clé `service_role` ou `sb_secret_…` ne doit être mise dans le front.

### 3.8 Performance

Choix principaux :

- court et bunkers pré-bavés dans un canvas hors écran ;
- sprites d’éclats de peinture générés une fois ;
- calque de peinture séparé ;
- couverture calculée par grille, pas par pixel ;
- particules plafonnées ;
- DPR limité sur grands écrans ;
- effets mobiles allégés ;
- build single-file pour un chargement simple ;
- **musique paresseuse** : aucun nœud audio avant le premier geste, scheduling par horizon de 350 ms,
  arrêt du séquenceur onglet masqué / pause / game over ;
- **arène pré-bavée** une seule fois par changement de terrain (pas de redessin du décor à chaque frame).

---

## 4. Démarrage rapide

### Installer et lancer le front

```bash
npm install
npm run dev
```

Ouvre l’URL affichée par Vite, généralement <http://localhost:5173>.

### Lancer le serveur de salons (multijoueur — UI désactivée pour le moment)

Le code est prêt et testé, mais le bouton **MULTIJOUEUR** est grisé (`MULTIPLAYER_ENABLED = false` dans `src/App.tsx`).

Terminal 1 :

```bash
npx tsx server/index.ts
```

Terminal 2 :

```bash
VITE_MULTIPLAYER_URL=ws://localhost:8787 npm run dev
```

Tu peux aussi créer un fichier `.env` à partir de `.env.example`.

### Build de production

```bash
npm run build
npm run preview
```

Le build produit `dist/index.html` autonome (JS + CSS inlinés) plus `manifest.json` et l’icône.
Taille actuelle : **~614 Ko, ~175 Ko gzip**.

---

## 5. Scripts et commandes

| Commande | Rôle |
| --- | --- |
| `npm run dev` | front en développement avec HMR |
| `npm run build` | build de production dans `dist/` |
| `npm run preview` | sert le build localement |
| `npx tsc --noEmit` | vérification du typage front |
| `npx tsc --noEmit -p server/tsconfig.json` | vérification du typage serveur |
| `npx tsx server/index.ts` | serveur de salons multijoueur |
| `./scripts/deploy.sh` | déploiement Netlify par API, sans Git |
| `npx tsx scripts/bonus4-test.ts` | test de parité des bonus Turbo / Grappe / Encre / Aimant (solo + simulation) |
| `npx tsx scripts/weapons-balance.ts` | équilibrage des 5 marqueurs + déblocages |
| `npx tsx scripts/drop-rates.ts` | fréquence des capsules (soin pondéré, anti-malchance) |

---

## 6. Variables d’environnement

| Variable | Où | Rôle |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | front | URL du projet Supabase |
| `VITE_SUPABASE_ANON_KEY` | front | clé publishable Supabase |
| `VITE_MULTIPLAYER_URL` | front | URL WebSocket du serveur de salons |
| `PORT` | serveur | port HTTP + WebSocket, défaut `8787` |
| `MAX_ROOMS` | serveur | salons simultanés max, défaut `200` |
| `MAX_CLIENTS` | serveur | connexions simultanées max, défaut `400` |
| `ALLOWED_ORIGIN` | serveur | origine WebSocket autorisée, optionnel |

Exemple front :

```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_…
VITE_MULTIPLAYER_URL=wss://votre-serveur.onrender.com
```

---

## 7. Déploiement

### 7.1 Front sur Netlify

Le dépôt contient `netlify.toml`.

1. **Add new site → Import an existing project**.
2. Choisir le dépôt GitHub.
3. Vérifier :
   - Build command : `npm run build`
   - Publish directory : `dist`
4. Ajouter les variables d’environnement.
5. Déployer.

Chaque push sur `main` peut relancer un build.

Déploiement déjà en place :

| | |
| --- | --- |
| Site | `painballvoom` |
| URL | <https://painballvoom.netlify.app> |
| SITE_ID | `efae1df5-9dcc-43e9-8de1-0e626c15e71a` |
| Commandes | `npm run build` → `dist`, Node 22 |

**Déploiement manuel d’une commande :**

```bash
NETLIFY_AUTH_TOKEN=… NETLIFY_SITE_ID=efae1df5-9dcc-43e9-8de1-0e626c15e71a ./scripts/deploy.sh
```

Le script construit, zippe `dist/`, pousse sur l’API Netlify et affiche l’URL + l’ID du déploiement.
Il ne crée un nouveau site que si `NETLIFY_SITE_ID` est absent.

### 7.2 GitHub Actions

Le workflow `.github/workflows/netlify.yml` peut builder, typer et déployer.

Secrets GitHub à ajouter :

```text
NETLIFY_AUTH_TOKEN
NETLIFY_SITE_ID
```

Le workflow peut aussi publier un aperçu par PR et archiver `dist/`.

### 7.3 Serveur multijoueur

Le fichier `render.yaml` décrit un service Node :

- build : `npm ci`
- start : `npx tsx server/index.ts`
- health check : `/health`

Sur Render : **New → Blueprint**, puis choisir le dépôt.  
Ensuite, mettre l’URL publique dans `VITE_MULTIPLAYER_URL` côté Netlify, en `wss://`.

Le serveur peut aussi tourner sur Fly.io, un VPS, ou n’importe quel hébergeur Node capable de garder des WebSockets ouverts.

### 7.4 Supabase

1. Ouvrir **SQL Editor**.
2. Exécuter :
   - `supabase/migrations/202610280001_progression.sql`
   - `supabase/migrations/202610280002_saved_runs.sql`
   - `supabase/migrations/202610280003_profile_names.sql`
3. Activer **Anonymous Sign-Ins** dans Authentication.
4. Configurer `Site URL` et les Redirect URLs.
5. Ajouter les variables Supabase dans Netlify.

Guide détaillé : [`supabase/README.md`](./supabase/README.md).

---

## 8. Structure du dépôt

```text
.github/workflows/        CI / déploiement Netlify
public/                   manifest.json (PWA), icône SVG
scripts/                  deploy.sh, test de parité des bonus
server/                   serveur de salons WebSocket (code prêt, UI désactivée)
supabase/                 3 migrations SQL + guide
src/
├── App.tsx               point d’entrée, écrans, moteurs, musique
├── components/
│   ├── Hud.tsx           HUD en jeu (vies, score, arena, portail, bonus)
│   ├── Screens.tsx       accueil, contrôles, pause, game over
│   ├── Multiplayer.tsx   écran multi (désactivé)
│   └── Progression.tsx   vestiaire, carrière, classement, sauvegarde
├── game/
│   ├── engine.ts         moteur solo : boucle 60 fps, IA, arènes, portails, FX, save
│   ├── multiplayer.ts    client multi : rendu, entrées, réseau, caméra
│   ├── mpSim.ts          simulation pure partagée local + serveur
│   ├── mpProtocol.ts     messages client / serveur
│   ├── rules.ts          4 arènes, bonus, ennemis, constantes communes
│   ├── audio.ts          SFX WebAudio
│   └── music.ts          musiques synthétisées + séquenceur
├── hooks/useProgression.ts session, stats, historique, sauvegardes
├── lib/                  supabase, scores locaux
└── index.css             thème Tailwind, styles arcade
.env.example              variables front
netlify.toml              build, redirects, en-têtes
render.yaml               blueprint serveur
```

**Fichiers de référence**

| Fichier | Rôle |
| --- | --- |
| `src/game/rules.ts` | source de vérité : `WEAPONS`, `WEAPON_DROPS`, `BOSS_VARIANTS`, `ARENAS`, `BONUS` |
| `scripts/weapons-balance.ts` | test d’équilibrage + règles de déblocage (CI-able) |
| `src/game/engine.ts` | `applyArena()`, `portalPoint()`, `saveSnapshot()` / `loadSaved()` |
| `src/game/music.ts` | `INTRO_TRACKS`, `getMusic()`, `playIntro()` / `playGame()` |
| `src/lib/scores.ts` | noms complets (16 caractères), classement local |
| `supabase/migrations/` | progression, sauvegarde en cours, noms de profil |

---

## 9. Contrôles

### Solo / clavier-souris

| Action | Commande |
| --- | --- |
| Se déplacer | WASD ou flèches |
| Viser | souris |
| Tirer | clic gauche ou Espace |
| Dash | Maj |
| Recharger | R |
| Pause | P ou Échap |
| Sauvegarder | bouton SAUVER ou Ctrl+S |
| Musique | sélecteur sur l’accueil et dans la pause |
| Son (SFX) | M |
| Vibration | V |
| Plein écran | F |

### Duo local

| | Joueur 1 | Joueur 2 |
| --- | --- | --- |
| Clavier | WASD + souris · Espace · Maj · R | Flèches · IJKL viser · Entrée tirer · Maj droit dash · Retour charger |
| Manette | 1ʳᵉ manette si deux sont branchées | 2ᵉ manette, ou la seule manette branchée |
| Mobile | tactile | manette conseillée ; sinon mode en ligne |

### Mobile

| Action | Commande |
| --- | --- |
| Déplacement | glisser à gauche |
| Viser / tirer | glisser à droite |
| Tir auto-visé | bouton FEU |
| Dash | bouton DASH |
| Recharger | bouton CHG |
| Pause / son / vibration | boutons du HUD |
| Musique | sélecteur sur l’accueil et dans la pause |

**Objectif de niveau** : vider la vague, puis **entrer dans le portail** qui s’ouvre pour passer au niveau suivant
et découvrir un **nouveau terrain**.

---

## 10. Qualité et vérifications

Le projet a été vérifié sur plusieurs axes :

- typage strict front et serveur ;
- build de production ;
- boucle solo : vagues, score, bonus, game over ;
- sauvegarde / reprise avec peinture et bonus ;
- rotation mobile portrait / paysage ;
- rendu plein écran sans letterbox ;
- bonus : bouclier, ricochet, explosion, rouleau ;
- arènes : rotation à chaque portail (LE YARD → LES DOCKS → LA FOSSE → LE TOIT) avec motif de sol et bunkers reconstruits ;
- portails : ouverture en fin de vague, franchissement, sauvegarde / reprise ;
- musique : 3 thèmes d'intro, thème de jeu, changement, coupure et pause ;
- salons multijoueur : création, jonction, prêt, démarrage, reconnexion ;
- simulation COOP et VERSUS ;
- politiques Supabase RLS et fonctions d’écriture ;
- noms de profil : plus de `JOUEUR-****`, saisie 16 caractères conservée côté cloud ;
- HUD mobile : géométrie mesurée sur 1366×456, 390×844 et 844×390 (aucun chevauchement) ;
- armes : cadence, dégâts, chargeur, portée et peinture mesurés pour les 5 marqueurs, persistance et sauvegarde ;
- capsules d'arme : FLAMER / MAGNUM / MINIGUN / LANCEUR, retour au marqueur après 18 s, obus explosifs vérifiés ;
- boss : variantes 0→3 par vague (5, 10, 15, 20), couleur, silhouette et PV distincts ;
- déblocages : sniper à la vague 10, shotgun à 100 000 points, arme verrouillée refusée, fusion local + cloud ;
- fréquence des soins : pondération par PV, garantie 22 / 6 éliminations, conversion en bouclier à PV pleins ;
- Marker lourd : ×1,5 dégâts, ×2 cadence, billes r+3, chargeur rempli, expiration à 12 s, sauvegarde/reprise.

Les vérifications réseau et moteur ont été faites avec des scénarios headless et des clients WebSocket réels.

**Commandes de contrôle**

```bash
npx tsc --noEmit
npx tsc --noEmit -p server/tsconfig.json
npx tsx scripts/bonus4-test.ts
npx tsx scripts/weapons-balance.ts
npm run build
```

---

## 11. Pistes d’évolution

Quelques suites naturelles :

- classement mondial signé côté serveur ;
- réactivation du multijoueur en ligne ;
- matchmaking simple ;
- replays / killcams ;
- skins de marqueur et traînées ;
- cartes supplémentaires ;
- mode entraînement ;
- tutoriel interactif ;
- statistiques avancées par arme / bonus ;
- support manette dans les menus ;
- export / import de sauvegarde ;
- 5ᵉ arène et boss spécifiques par terrain ;
- musique réactive (intensité selon la vague).

---

## 12. Historique récent

| Version | Apports |
| --- | --- |
| **Arènes & musique** | 4 terrains (géométrie, motif de sol, matériau) changés **à chaque portail**, portails de fin de niveau, 3 musiques d'intro au choix + thème de jeu, HUD « ARÈNE n/4 ». |
| **Bonus** | 4 bonus communs (Turbo, Grappe, Encre lente, Aimant) + 3 bonus solo (PRIME, Dash rechargé, Combo gelé) → **14 au total**. |
| **Mobile** | Canvas plein écran, HUD compact (icônes 16 px, boutons 40 px en rangée), contrôles proportionnés à la hauteur, mode paysage court, rotation sans bande noire. |
| **Multijoueur** | Duo local, salons COOP/VERSUS, serveur autoritaire et reconnexion — **désactivé dans l’UI** en attendant la réactivation. |
| **Progression** | Supabase : carrière, historique, classement, sauvegarde de partie en cours, pseudos complets et fiables. |

### Feuille de route immédiate

1. Réactiver le multijoueur (bouton + `MULTIPLAYER_ENABLED`).
2. Déployer le serveur de salons (`render.yaml`) et renseigner `VITE_MULTIPLAYER_URL`.
3. Ajouter un classement hebdomadaire.
4. Étendre les arènes (5ᵉ terrain, variantes nocturnes).

---

## 13. Auteur

Projet développé par **loba225samuel-coder**.  
Dépôt : <https://github.com/loba225samuel-coder/painballv2>  
Jeu en ligne : <https://painballvoom.netlify.app>
