/** Run with npx tsx scripts/test-boss-visuals.ts after installing @napi-rs/canvas. */
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { drawBossVisual } from '../src/game/bossVisuals';
import { BOSS_VARIANTS } from '../src/game/rules';

const normal = new Set<string>();
for (const variant of BOSS_VARIANTS) {
  for (const radius of [24, 32, 40]) {
    const render = (hit: boolean, time = 0) => {
      const canvas = createCanvas(240, 240);
      const ctx = canvas.getContext('2d');
      ctx.translate(120, 120);
      const before = ctx.getTransform();
      drawBossVisual(ctx as unknown as CanvasRenderingContext2D, variant, radius, time, hit);
      assert.deepEqual(ctx.getTransform(), before, 'Renderer must restore the transform');
      const pixels = ctx.getImageData(0, 0, 240, 240).data;
      assert(pixels.some((value, i) => i % 4 === 3 && value > 0), 'Must draw visible pixels');
      // Decorative shapes must remain within the normalized export bounds.
      for (let i = 0; i < 240; i++) {
        for (const [x, y] of [[i,0], [i,239], [0,i], [239,i]]) {
          assert.equal(pixels[(y * 240 + x) * 4 + 3], 0, 'No clipped silhouette');
        }
      }
      return canvas.toBuffer('image/png').toString('base64');
    };
    const base = render(false);
    assert.notEqual(base, render(true), `${variant.name} needs visible hit feedback`);
    if (variant.shape === 'inferno') assert.notEqual(base, render(false, 0.2), 'Flame fins must animate');
    if (radius === 32) normal.add(base);
  }
}
assert.equal(normal.size, 4, 'Each boss must have a distinct appearance');
console.log('Boss visuals: distinct silhouettes, hit feedback, animation, scaling and context restoration passed.');
