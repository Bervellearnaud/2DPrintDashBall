/* Mesure la fréquence réelle des capsules, en particulier le soin.
 *   npx tsx scripts/drop-rates.ts
 * Vérifie que le soin reste rare à PV pleins, fréquent quand on est blessé,
 * et qu'il ne peut pas manquer plus de HEAL_PITY_KILLS éliminations. */

import { BONUS, HEAL_PITY_KILLS, SOLO_DROP_TABLE, rollSoloBonus } from "../src/game/rules";

const DROP_CHANCE = 0.3;
const N = 400_000;
const rand = Math.random;

function simulate(hp: number, maxHp = 6) {
  const counts = new Map<number, number>();
  let pity = 0;
  let kills = 0;
  let maxGap = 0;
  let gap = 0;
  for (let i = 0; i < N; i++) {
    kills++;
    gap++;
    pity++;
    const hurt = hp < maxHp;
    const emergency = hurt && hp <= 2 && pity >= 6;
    const guaranteed = hurt && pity >= HEAL_PITY_KILLS;
    if (emergency || guaranteed || rand() < DROP_CHANCE) {
      const kind = emergency || guaranteed ? 1 : rollSoloBonus(hp, maxHp, pity, rand);
      counts.set(kind, (counts.get(kind) ?? 0) + 1);
      if (kind === 1) {
        pity = 0;
        maxGap = Math.max(maxGap, gap);
        gap = 0;
      }
    }
  }
  const drops = [...counts.values()].reduce((a, b) => a + b, 0);
  const heal = counts.get(1) ?? 0;
  return { drops, heal, healShare: heal / Math.max(1, drops), perKill: heal / kills, maxGap, kills };
}

const rows = [
  ["PV pleins 6/6", simulate(6)],
  ["Blessé 4/6", simulate(4)],
  ["Critique 2/6", simulate(2)],
  ["Mourant 1/6", simulate(1)],
] as const;

console.log(`Table solo : ${SOLO_DROP_TABLE.length} entrées · chance de drop 30 % · ${N.toLocaleString("fr-FR")} éliminations simulées\n`);
console.table(
  rows.map(([label, r]) => ({
    état: label,
    "soin / drops": (r.healShare * 100).toFixed(1) + " %",
    "soin / élim.": (r.perKill * 100).toFixed(1) + " %",
    "1 soin tous les": Math.round(1 / Math.max(r.perKill, 1e-6)) + " kills",
    "écart max": r.maxGap + " kills",
  }))
);

console.log("\nDétail de la table solo :");
const table = new Map<number, number>();
for (const k of SOLO_DROP_TABLE) table.set(k, (table.get(k) ?? 0) + 1);
for (const [k, n] of [...table.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${BONUS[k as 0].short.padEnd(11)} ${String(n).padStart(2)}/${SOLO_DROP_TABLE.length}  ${((n / SOLO_DROP_TABLE.length) * 100).toFixed(1)} %`);
}

const errors: string[] = [];
const full = rows[0][1];
const critical = rows[2][1];
const wounded = rows[1][1];
if (full.perKill > 0.025) errors.push("Le soin est trop fréquent à PV pleins.");
if (critical.perKill < 0.1) errors.push("Le soin n'est pas assez fréquent en état critique.");
if (wounded.perKill <= full.perKill * 2) errors.push("Le biais de soin quand on est blessé est insuffisant.");
if (critical.maxGap > 8) errors.push(`Trou de soin trop long en critique (${critical.maxGap} kills).`);

if (errors.length) {
  console.error("\n✗ FRÉQUENCE DE DROP :");
  errors.forEach((e) => console.error("  -", e));
  process.exit(1);
}
console.log(`\n✓ Soin rare à PV pleins, prioritaire quand blessé, écart critique ≤ ${critical.maxGap} kills (plafond ${HEAL_PITY_KILLS}).`);
