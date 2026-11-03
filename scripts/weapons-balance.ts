/* Vérifie l'équilibre des marqueurs et les règles de déblocage.
 *   npx tsx scripts/weapons-balance.ts
 * Échoue (code 1) si une arme sort des bornes définies. */

import {
  bestCareer,
  isWeaponUnlocked,
  safeWeaponId,
  unlockedWeaponIds,
  WEAPONS,
  WEAPON_ORDER,
  weaponUnlockProgress,
  type Career,
} from "../src/game/rules";

const round = (n: number) => Math.round(n);

function metrics(id: (typeof WEAPON_ORDER)[number]) {
  const w = WEAPONS[id];
  const perShot = w.dmg * w.pellets;
  const burst = perShot / w.fire;
  const sustain = (perShot * w.mag) / (w.mag * w.fire + w.reload);
  const paintPerSecond = (1 / w.fire) * w.paint;
  const effective = sustain * (1 + (w.pierce ?? 0) * 0.6);
  return { id, name: w.name, burst, sustain, effective, paintPerSecond, pierce: w.pierce, mag: w.mag };
}

const rows = WEAPON_ORDER.map(metrics);
console.table(
  rows.map((r) => ({
    marqueur: r.name,
    "rafale (DPS)": round(r.burst),
    "soutenu (DPS)": round(r.sustain),
    "effectif (DPS)": round(r.effective),
    "peinture/s": +r.paintPerSecond.toFixed(1),
    perce: r.pierce,
    chargeur: r.mag,
  }))
);

const errors: string[] = [];
for (const r of rows) {
  if (r.effective < 110 || r.effective > 200) errors.push(`${r.name}: DPS effectif hors bornes (${round(r.effective)})`);
  if (r.name !== "SPRAYER" && r.paintPerSecond > 12) errors.push(`${r.name}: peinture/s trop élevée (${r.paintPerSecond.toFixed(1)})`);
}

// Le Sprayer doit rester le peintre, mais pas au point d'écraser le Marker sur les dégâts.
const sprayer = rows.find((r) => r.id === "sprayer")!;
const marker = rows.find((r) => r.id === "marker")!;
if (sprayer.paintPerSecond < marker.paintPerSecond * 2) errors.push("Le Sprayer doit peindre au moins 2× plus que le Marker.");
if (sprayer.effective >= marker.effective) errors.push("Le Sprayer ne doit pas dépasser le Marker en dégâts effectifs.");

// Déblocages
const newbie: Career = { best_wave: 0, total_score: 0, games_played: 0 };
const wave10: Career = { best_wave: 10, total_score: 0, games_played: 0 };
const rich: Career = { best_wave: 0, total_score: 100_000, games_played: 0 };

if (isWeaponUnlocked("sniper", { ...wave10, best_wave: 9 })) errors.push("Le Sniper ne doit pas être débloqué avant la vague 10.");
if (!isWeaponUnlocked("sniper", wave10)) errors.push("Le Sniper doit être débloqué à la vague 10.");
if (isWeaponUnlocked("shotgun", { ...rich, total_score: 99_999 })) errors.push("Le Shotgun ne doit pas être débloqué avant 100 000 points.");
if (!isWeaponUnlocked("shotgun", rich)) errors.push("Le Shotgun doit être débloqué à 100 000 points.");
if (safeWeaponId("sniper", newbie) !== "marker") errors.push("Une arme verrouillée doit retomber sur le Marker.");
if (safeWeaponId("sniper", wave10) !== "sniper") errors.push("Une arme débloquée doit rester sélectionnable.");

console.log("\nDéblocages");
for (const [label, c] of [
  ["débutant", newbie],
  ["vague 10", wave10],
  ["100k points", rich],
  ["vétéran", wave10 && { best_wave: 14, total_score: 250_000, games_played: 40 }],
] as [string, Career][]) {
  console.log(`  ${label.padEnd(12)} → ${unlockedWeaponIds(c).join(", ")}`);
}
const progress = weaponUnlockProgress("shotgun", { best_wave: 0, total_score: 42_000, games_played: 0 });
console.log(`  progression Shotgun : ${Math.round(progress.pct * 100)} % (${progress.current}/${progress.threshold})`);
console.log(`  fusion local + cloud : ${JSON.stringify(bestCareer({ best_wave: 9, total_score: 20_000, games_played: 4 }, { best_wave: 11, total_score: 90_000, games_played: 2 }))}`);

if (errors.length) {
  console.error("\n✗ ÉQUILIBRAGE / DÉBLOCAGE :");
  for (const e of errors) console.error("  -", e);
  process.exit(1);
}
console.log("\n✓ Armes équilibrées et déblocages conformes.");
