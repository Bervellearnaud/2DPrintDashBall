/** Export README thumbnails using the game's own Canvas drawing methods.
 * npm install --no-save --package-lock=false @napi-rs/canvas
 * npx tsx scripts/export-codex.ts
 * No game instance, browser, audio or simulation is started.
 */
import { createCanvas } from '@napi-rs/canvas';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { PaintballGame } from '../src/game/engine';
import { WEAPONS, WEAPON_VISUAL_ORDER, BOSS_VARIANTS } from '../src/game/rules';

const out = fileURLToPath(new URL('../visuals/codex/', import.meta.url));
mkdirSync(out, { recursive: true });
// Access the existing renderer without running the browser-only constructor.
// Private TypeScript methods remain normal prototype methods at runtime.
const renderer = Object.create(PaintballGame.prototype);
renderer.time = 0;
renderer.glows = new Map(); // isolate silhouettes; omit only the animated halo

function exportImage(name: string, draw: (ctx: any) => void) {
  const canvas = createCanvas(360, 240);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#223930';
  ctx.fillRect(0, 0, 360, 240);
  ctx.translate(160, 120);
  ctx.scale(2.2, 2.2);
  draw(ctx);
  writeFileSync(`${out}${name}.png`, canvas.toBuffer('image/png'));
}

for (const [type, r] of [['grunt', 15], ['rusher', 14], ['sniper', 15]] as const) {
  exportImage(type, ctx => renderer.drawEnemy(ctx, {
    type, r, x: 0, y: 0, angle: 0, wobble: 0, born: 0,
    flash: 0, hp: 1, maxHp: 1, charge: 0, slowT: 0,
  }));
}
for (const boss of BOSS_VARIANTS) {
  exportImage(boss.name.toLowerCase(), ctx => renderer.drawEnemy(ctx, {
    type: 'boss', variant: boss.id, r: 32, x: 0, y: 0,
    angle: 0, wobble: 0, born: 0, flash: 0, hp: 1, maxHp: 1,
  }));
}
for (const id of WEAPON_VISUAL_ORDER) {
  exportImage(`weapon-${id}`, ctx => {
    ctx.translate(-18, 0);
    renderer.drawWeaponShape(ctx, WEAPONS[id], false);
  });
}
console.log(`Exported ${3 + BOSS_VARIANTS.length + WEAPON_VISUAL_ORDER.length} game-rendered thumbnails to ${out}`);
