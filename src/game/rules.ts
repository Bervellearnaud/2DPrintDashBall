/* Règles communes : solo, duo local et serveur autoritaire. */

export const TAU = Math.PI * 2;
export const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const WORLD = { w: 1280, h: 720 };

export const COL = {
  player: "#3ee8ff",
  grunt: "#ff2f87",
  rusher: "#ff8a1e",
  sniper: "#a86bff",
  boss: "#ffd84d",
  lime: "#b9ff33",
  chalk: "#e9f5ee",
};

export const PAINTS = [COL.grunt, COL.rusher, COL.player, COL.lime, COL.sniper, COL.boss, "#ff4a3d"];
export const COMBO_STEPS = [2, 4, 7, 11, 16, 22];

export type EType = "grunt" | "rusher" | "sniper" | "boss";

export const ENEMY_DEF: Record<EType, { hp: number; r: number; speed: number; score: number; color: string }> = {
  grunt: { hp: 60, r: 15, speed: 88, score: 120, color: COL.grunt },
  rusher: { hp: 48, r: 14, speed: 176, score: 170, color: COL.rusher },
  sniper: { hp: 52, r: 15, speed: 74, score: 220, color: COL.sniper },
  boss: { hp: 420, r: 30, speed: 62, score: 1600, color: COL.boss },
};

export const PLAYER = {
  r: 15,
  hp: 6,
  mag: 12,
  speed: 252,
  dashSpeed: 640,
  dashTime: 0.17,
  dashCd: 1.05,
  reload: 0.95,
  fire: 0.108,
  rapidFire: 0.062,
  bulletSpeed: 700,
  bulletDmg: 30,
};

/* ---------------- Armes : trois marqueurs de base ---------------- */

export type WeaponId = "marker" | "sprayer" | "cannon" | "sniper" | "shotgun";

export interface Weapon {
  id: WeaponId;
  name: string;
  short: string;
  tagline: string;
  /** cadence en secondes entre deux tirs */
  fire: number;
  dmg: number;
  mag: number;
  reload: number;
  bulletSpeed: number;
  /** multiplicateur de peinture au sol (couverture) */
  paint: number;
  /** taille du projectile */
  r: number;
  /** dispersion en radians */
  spread: number;
  /** recul appliqué au joueur */
  recoil: number;
  color: string;
  /** billes par tir (1 sauf arme à gerbe) */
  pellets: number;
  /** nombre maximum d'ennemis traversés */
  pierce: number;
  sfx: "light" | "mid" | "heavy";
  /** condition de déblocage (absente = disponible d'emblée) */
  unlock?: UnlockRule;
}

export type CareerStat = "best_wave" | "total_score" | "games_played";

export interface UnlockRule {
  stat: CareerStat;
  threshold: number;
  label: string;
}

export interface Career {
  best_wave: number;
  total_score: number;
  games_played: number;
}

export const WEAPONS: Record<WeaponId, Weapon> = {
  marker: {
    id: "marker",
    name: "MARKER",
    short: "MARKER",
    tagline: "Polyvalent · la référence du court",
    fire: 0.108,
    dmg: 30,
    mag: 12,
    reload: 0.95,
    bulletSpeed: 700,
    paint: 1,
    r: 5,
    spread: 0.03,
    recoil: 42,
    color: COL.player,
    pellets: 1,
    pierce: 0,
    sfx: "mid",
  },
  sprayer: {
    id: "sprayer",
    name: "SPRAYER",
    short: "SPRAY",
    tagline: "Arrose large · peint le court deux fois plus vite",
    fire: 0.055,
    dmg: 14,
    mag: 30,
    reload: 1.15,
    bulletSpeed: 640,
    paint: 1.45,
    r: 4,
    spread: 0.12,
    recoil: 26,
    color: COL.lime,
    pellets: 1,
    pierce: 0,
    sfx: "light",
  },
  cannon: {
    id: "cannon",
    name: "CANNON",
    short: "CANNON",
    tagline: "Une bille, gros dégâts · parfait contre les boss",
    fire: 0.62,
    dmg: 100,
    mag: 5,
    reload: 1.25,
    bulletSpeed: 560,
    paint: 1.35,
    r: 9,
    spread: 0.05,
    recoil: 130,
    color: COL.rusher,
    pellets: 1,
    pierce: 1,
    sfx: "heavy",
  },
  sniper: {
    id: "sniper",
    name: "SNIPER",
    short: "SNIPER",
    tagline: "Précis, perce un ennemi · récompense la vague 10",
    fire: 0.9,
    dmg: 120,
    mag: 3,
    reload: 1.5,
    bulletSpeed: 1050,
    paint: 1.1,
    r: 6,
    spread: 0.004,
    recoil: 90,
    color: COL.sniper,
    pellets: 1,
    pierce: 1,
    sfx: "heavy",
    unlock: { stat: "best_wave", threshold: 10, label: "Atteindre la vague 10" },
  },
  shotgun: {
    id: "shotgun",
    name: "SHOTGUN",
    short: "SHOTGUN",
    tagline: "Six billes en cône · débloqué à 100 000 points cumulés",
    fire: 0.55,
    dmg: 18,
    mag: 6,
    reload: 1.4,
    bulletSpeed: 620,
    paint: 1.4,
    r: 4,
    spread: 0.26,
    recoil: 95,
    color: COL.grunt,
    pellets: 6,
    pierce: 0,
    sfx: "mid",
    unlock: { stat: "total_score", threshold: 100_000, label: "100 000 points cumulés" },
  },
};

export const WEAPON_ORDER: WeaponId[] = ["marker", "sprayer", "cannon", "sniper", "shotgun"];

export function weaponOf(id: unknown): Weapon {
  return WEAPONS[(typeof id === "string" && id in WEAPONS ? id : DEFAULT_WEAPON) as WeaponId] ?? WEAPONS.marker;
}



export const DEFAULT_WEAPON: WeaponId = "marker";

export function normalizeCareer(raw?: Partial<Career> | null): Career {
  const c = raw ?? {};
  const num = (v: unknown) => (Number.isFinite(Number(v)) ? Math.max(0, Math.floor(Number(v))) : 0);
  return { best_wave: num(c.best_wave), total_score: num(c.total_score), games_played: num(c.games_played) };
}

export function bestCareer(...list: (Partial<Career> | null | undefined)[]): Career {
  const out: Career = { best_wave: 0, total_score: 0, games_played: 0 };
  for (const raw of list) {
    const c = normalizeCareer(raw);
    out.best_wave = Math.max(out.best_wave, c.best_wave);
    out.total_score = Math.max(out.total_score, c.total_score);
    out.games_played = Math.max(out.games_played, c.games_played);
  }
  return out;
}

export function isWeaponUnlocked(id: WeaponId, career: Career): boolean {
  const unlock = WEAPONS[id]?.unlock;
  if (!unlock) return true;
  return (career?.[unlock.stat] ?? 0) >= unlock.threshold;
}

export function weaponUnlockProgress(id: WeaponId, career: Career) {
  const unlock = WEAPONS[id]?.unlock;
  if (!unlock) return { locked: false, current: 1, threshold: 1, pct: 1, label: "" };
  const current = career?.[unlock.stat] ?? 0;
  return {
    locked: current < unlock.threshold,
    current,
    threshold: unlock.threshold,
    pct: Math.max(0, Math.min(1, current / unlock.threshold)),
    label: unlock.label,
  };
}

export function unlockedWeaponIds(career: Career): WeaponId[] {
  return WEAPON_ORDER.filter((id) => isWeaponUnlocked(id, career));
}

/** Une arme verrouillée retombe sur le marker (sélection, sauvegarde, profil). */
export function safeWeaponId(id: unknown, career: Career): WeaponId {
  const w = weaponOf(id);
  return isWeaponUnlocked(w.id, career) ? w.id : DEFAULT_WEAPON;
}

/* ---------------- Arènes : une nouvelle tous les 4 niveaux ---------------- */

export type ArenaPattern = "grid" | "diagonal" | "rings" | "hex";

export interface ArenaTheme {
  floorA: string;
  floorB: string;
  floorC: string;
  line: string;
  cyanArc: string;
  magentaArc: string;
  wordmark: string;
  pattern: ArenaPattern;
  bunkerA: string;
  bunkerB: string;
  bunkerC: string;
  name: string;
  tagline: string;
}

export interface Arena {
  id: string;
  name: string;
  tagline: string;
  theme: ArenaTheme;
  /** [x normalisé, y normalisé, largeur, hauteur] */
  defs: [number, number, number, number][];
}

const BASE: [number, number, number, number][] = [
  [0.2, 0.22, 156, 44],
  [0.8, 0.22, 156, 44],
  [0.2, 0.78, 156, 44],
  [0.8, 0.78, 156, 44],
  [0.5, 0.5, 54, 176],
  [0.5, 0.08, 96, 96],
  [0.5, 0.92, 96, 96],
  [0.06, 0.5, 78, 96],
  [0.94, 0.5, 78, 96],
  [0.33, 0.5, 40, 104],
  [0.67, 0.5, 40, 104],
  [0.07, 0.14, 84, 44],
  [0.93, 0.14, 84, 44],
  [0.07, 0.86, 84, 44],
  [0.93, 0.86, 84, 44],
];

export const ARENAS: Arena[] = [
  {
    id: "yard",
    name: "LE YARD",
    tagline: "court historique · symétrie parfaite",
    theme: {
      floorA: "#1d302a", floorB: "#223930", floorC: "#182723",
      line: "rgba(233,245,238,0.34)", cyanArc: "rgba(62,232,255,0.22)", magentaArc: "rgba(255,47,135,0.22)",
      wordmark: "#e9f5ee", pattern: "grid",
      bunkerA: "#6e6448", bunkerB: "#565038", bunkerC: "#3d3a29",
      name: "LE YARD", tagline: "court historique · symétrie parfaite",
    },
    defs: BASE,
  },
  {
    id: "docks",
    name: "LES DOCKS",
    tagline: "conteneurs serrés · couloirs latéraux",
    theme: {
      floorA: "#142831", floorB: "#1a3844", floorC: "#0e1d24",
      line: "rgba(126,244,255,0.36)", cyanArc: "rgba(62,232,255,0.34)", magentaArc: "rgba(255,216,77,0.26)",
      wordmark: "#7ef4ff", pattern: "diagonal",
      bunkerA: "#2f6f7d", bunkerB: "#245663", bunkerC: "#173a44",
      name: "LES DOCKS", tagline: "conteneurs serrés · couloirs latéraux",
    },
    defs: [
      [0.24, 0.5, 60, 210],
      [0.76, 0.5, 60, 210],
      [0.5, 0.16, 210, 52],
      [0.5, 0.84, 210, 52],
      [0.11, 0.22, 150, 42],
      [0.89, 0.22, 150, 42],
      [0.11, 0.78, 150, 42],
      [0.89, 0.78, 150, 42],
      [0.5, 0.5, 92, 92],
      [0.34, 0.14, 92, 40],
      [0.66, 0.14, 92, 40],
      [0.34, 0.86, 92, 40],
      [0.66, 0.86, 92, 40],
    ],
  },
  {
    id: "pit",
    name: "LA FOSSE",
    tagline: "bunker central · escaliers ouverts",
    theme: {
      floorA: "#2d1c21", floorB: "#3a2329", floorC: "#1d1013",
      line: "rgba(255,47,135,0.34)", cyanArc: "rgba(255,138,30,0.3)", magentaArc: "rgba(255,47,135,0.34)",
      wordmark: "#ff2f87", pattern: "rings",
      bunkerA: "#7a3b34", bunkerB: "#5d2c2a", bunkerC: "#3d1a1b",
      name: "LA FOSSE", tagline: "bunker central · escaliers ouverts",
    },
    defs: [
      [0.5, 0.5, 190, 190],
      [0.5, 0.5, 62, 62],
      [0.16, 0.5, 52, 150],
      [0.84, 0.5, 52, 150],
      [0.5, 0.14, 52, 150],
      [0.5, 0.86, 52, 150],
      [0.2, 0.18, 130, 40],
      [0.8, 0.18, 130, 40],
      [0.2, 0.82, 130, 40],
      [0.8, 0.82, 130, 40],
      [0.09, 0.5, 44, 108],
      [0.91, 0.5, 44, 108],
    ],
  },
  {
    id: "rooftop",
    name: "LE TOIT",
    tagline: "plateforme en croix · vues dégagées",
    theme: {
      floorA: "#1b2130", floorB: "#232c40", floorC: "#121724",
      line: "rgba(185,255,51,0.32)", cyanArc: "rgba(185,255,51,0.26)", magentaArc: "rgba(168,107,255,0.3)",
      wordmark: "#b9ff33", pattern: "hex",
      bunkerA: "#4a5a74", bunkerB: "#39465c", bunkerC: "#242e3e",
      name: "LE TOIT", tagline: "plateforme en croix · vues dégagées",
    },
    defs: [
      [0.5, 0.5, 260, 44],
      [0.5, 0.5, 44, 260],
      [0.22, 0.22, 54, 54],
      [0.78, 0.22, 54, 54],
      [0.22, 0.78, 54, 54],
      [0.78, 0.78, 54, 54],
      [0.5, 0.09, 120, 42],
      [0.5, 0.91, 120, 42],
      [0.09, 0.5, 42, 120],
      [0.91, 0.5, 42, 120],
    ],
  },
];

/** 1 = nouveau terrain à chaque portail. Passer à 4 pour un changement toutes les 4 vagues. */
export const ARENA_INTERVAL = 1;
export const arenaForWave = (wave: number) =>
  ARENAS[Math.max(0, Math.floor((Math.max(1, wave) - 1) / ARENA_INTERVAL)) % ARENAS.length];

/** Compatibilité : pistes de l'arène historique. */
export const ARENA_DEFS = BASE;

export interface Bunker {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function makeBunkers(w = WORLD.w, h = WORLD.h, arena = 0): Bunker[] {
  const u = clamp(Math.min(w, h) / 700, 0.72, 1.25);
  const defs = (ARENAS[arena % ARENAS.length] ?? ARENAS[0]).defs;
  return defs.map(([nx, ny, bw, bh]) => ({
    x: nx * w,
    y: ny * h,
    w: Math.max(46, bw * u),
    h: Math.max(46, bh * u),
  }));
}

export function comboMult(streak: number) {
  let m = 1;
  for (let i = 0; i < COMBO_STEPS.length; i++) if (streak >= COMBO_STEPS[i]) m = 2 + i;
  return m;
}

/* ---------------- Bonus ramassables ---------------- */

export type BonusKind = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;

export const BONUS: Record<BonusKind, { id: string; name: string; short: string; color: string; duration: number }> = {
  0: { id: "rapid", name: "OVERCLOCK", short: "OVERCLOCK", color: COL.player, duration: 5 },
  1: { id: "med", name: "PEINTURE", short: "SOIN", color: COL.lime, duration: 0 },
  2: { id: "triple", name: "TRIPLE JET", short: "TRIPLE", color: COL.boss, duration: 9 },
  3: { id: "shield", name: "BOUCLIER DE PEINTURE", short: "BOUCLIER", color: "#7ef4ff", duration: 10 },
  4: { id: "ricochet", name: "RICOCHET", short: "RICOCHET", color: COL.sniper, duration: 8 },
  5: { id: "explosive", name: "BILLE EXPLOSIVE", short: "EXPLOSIF", color: COL.rusher, duration: 0 },
  6: { id: "roller", name: "ROULEAU DE PEINTURE", short: "ROULEAU", color: COL.lime, duration: 6 },
  7: { id: "turbo", name: "TURBO", short: "TURBO", color: "#ff4a3d", duration: 8 },
  8: { id: "cluster", name: "GRAPPE", short: "GRAPPE", color: "#e9f5ee", duration: 0 },
  9: { id: "ink", name: "ENCRE LENTE", short: "ENCRE", color: COL.sniper, duration: 8 },
  10: { id: "magnet", name: "AIMANT", short: "AIMANT", color: COL.lime, duration: 10 },
  11: { id: "prime", name: "PRIME", short: "PRIME", color: COL.boss, duration: 0 },
  12: { id: "dash", name: "DASH RECHARGÉ", short: "DASH +", color: "#55ddff", duration: 0 },
  13: { id: "comboFreeze", name: "COMBO GELÉ", short: "GEL COMBO", color: "#b8e6ff", duration: 5 },
  14: { id: "heavy", name: "MARKER LOURD", short: "MARKER +", color: "#ffd84d", duration: 12 },
};

/** Paramètres des bonus « PRIME / DASH+ / GEL » (solo uniquement). */
export const PRIME_PER_WAVE = 250;
export const HEAVY_MARKER_DURATION = 12;
export const HEAVY_MARKER_FIRE = 0.5;
export const HEAVY_MARKER_DMG = 1.5;
export const HEAVY_MARKER_R = 3;
export const COMBO_FREEZE_DURATION = 5;

/** Table de drop. Les bonus rares n'y figurent qu'une fois. */
export const DROP_TABLE: BonusKind[] = [
  0, 1, 2, 3, 4, 5, 6, 7, // fréquents
  0, 1, 4, 6, 3, 7, // courants
  8, 9, 10, // rares
];

/** Anti-malchance : un soin est garanti après ce nombre d'éliminations sans soin. */
export const HEAL_PITY_KILLS = 22;
/** Biais de soin selon les PV restants (index = ratio). */
export const HEAL_WEIGHT_BY_HP = { critical: 3.5, wounded: 2, full: 0.6 };

/** Tirage pondéré d'un bonus solo, biaisé par les PV du joueur. */
export function rollSoloBonus(
  hp: number,
  maxHp: number,
  killsSinceHeal: number,
  rand: () => number = Math.random
): BonusKind {
  const hurt = hp < maxHp;
  if (hurt && killsSinceHeal >= HEAL_PITY_KILLS) return 1;
  if (hurt && hp <= 2 && killsSinceHeal >= 6) return 1;
  const ratio = maxHp > 0 ? hp / maxHp : 1;
  const weights = new Map<BonusKind, number>();
  for (const k of SOLO_DROP_TABLE) weights.set(k, (weights.get(k) ?? 0) + 1);
  const base = weights.get(1) ?? 1;
  weights.set(
    1,
    ratio <= 0.34 ? base * HEAL_WEIGHT_BY_HP.critical : ratio <= 0.67 ? base * HEAL_WEIGHT_BY_HP.wounded : ratio >= 0.999 ? base * HEAL_WEIGHT_BY_HP.full : base
  );
  let total = 0;
  for (const w of weights.values()) total += w;
  let roll = rand() * total;
  for (const [k, w] of weights) {
    roll -= w;
    if (roll <= 0) return k;
  }
  return 0;
}

/** Table solo : y ajoute les bonus réservés au solo (PRIME, DASH+, COMBO GELÉ, MARKER LOURD). */
export const SOLO_DROP_TABLE: BonusKind[] = [...DROP_TABLE, 11, 12, 13, 14];

/** Paramètres des nouveaux bonus (partagés solo / multi). */
export const TURBO_SPEED = 1.35;
export const TURBO_DURATION = 8;
export const GRAPPE_SHOTS = 5;
export const GRAPPE_SPREAD = 0.24;
export const GRAPPE_DMG = 15;
export const GRAPPE_LIFE = 0.72;
export const INK_DURATION = 8;
export const INK_SLOW_DURATION = 2;
export const INK_SLOW_FACTOR = 0.55;
export const MAGNET_DURATION = 10;
export const MAGNET_RADIUS = 300;
export const MAGNET_SPEED = 320; // px/s, vitesse max d’attraction

export function sanitizeName(name: unknown, fallback = "JOUEUR") {
  const s = String(name ?? "")
    .replace(/[^\p{L}\p{N} _-]/gu, "")
    .trim()
    .slice(0, 12);
  return s || fallback;
}
