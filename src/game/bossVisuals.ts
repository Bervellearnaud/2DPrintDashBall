import type { BossVariant } from './rules';

/** Overhead boss silhouettes. All geometry is normalized to a radius of 32.
 * Decorative armor extends beyond the unchanged gameplay collision radius.
 */
export function drawBossVisual(
  ctx: CanvasRenderingContext2D, variant: BossVariant, radius: number,
  time: number, hit: boolean,
) {
  const dark = '#0b1210';
  const armor = '#132019';
  const color = hit ? '#ffffff' : variant.color;
  ctx.save();
  ctx.scale(radius / 32, radius / 32);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  const polygon = (points: number[][], fill: string, stroke = dark, width = 3) => {
    ctx.beginPath();
    points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
    ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke();
  };
  const box = (x: number, y: number, w: number, h: number, r: number, fill: string) => {
    ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
    ctx.fillStyle = fill; ctx.fill();
    ctx.strokeStyle = dark; ctx.lineWidth = 3; ctx.stroke();
  };
  const circle = (x: number, y: number, r: number, fill: string, outline = true) => {
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = fill; ctx.fill();
    if (outline) { ctx.strokeStyle = dark; ctx.lineWidth = 3; ctx.stroke(); }
  };
  const barrels = (length: number, gap: number, height: number) => {
    for (const y of [-gap, gap]) {
      box(15, y - height / 2, length, height, 3, armor);
      box(15 + length - 7, y - height / 2, 7, height, 2, color);
    }
  };
  if (variant.shape === 'goliath') {
    // Rear paint tanks, broad side plates and heavy twin barrels.
    box(-39, -22, 16, 17, 5, color);
    box(-39, 5, 16, 17, 5, color);
    box(-25, -35, 46, 13, 4, armor);
    box(-25, 22, 46, 13, 4, armor);
    barrels(32, 12, 13);
    polygon([[-32,-18],[-17,-29],[18,-29],[31,-16],[31,16],[18,29],[-17,29],[-32,18]], color);
    polygon([[-26,-16],[-15,-23],[-15,23],[-26,16]], armor);
    box(-6, -8, 32, 16, 5, armor);
    box(4, -3, 18, 6, 2, '#e9f5ee');
    for (const y of [-21, 21]) {
      box(-8, y - 2, 22, 4, 1, armor);
    }
  } else if (variant.shape === 'inferno') {
    // Swept flame fins remain readable even without particles.
    for (let i = 0; i < 6; i++) {
      ctx.save(); ctx.rotate(i * Math.PI / 3);
      const pulse = Math.sin(time * 8 + i) * 2;
      polygon([[22,-12],[46 + pulse,-8],[33,6],[23,12]], color);
      ctx.restore();
    }
    barrels(27, 9, 9);
    polygon([[-31,0],[-15,-27],[17,-24],[31,0],[17,24],[-15,27]], color);
    polygon([[-23,0],[-12,-18],[-8,0],[-12,18]], armor);
    for (const y of [-15, 15]) {
      box(-2, y - 3, 17, 6, 2, armor);
      box(2, y - 1, 10, 2, 1, '#ffd84d');
    }
    box(0, -5, 24, 10, 4, armor);
    box(6, -2, 14, 4, 1, '#ffffff');
  } else if (variant.shape === 'glacier') {
    // Six detached crystal plates around a genuinely hexagonal shell.
    for (let i = 0; i < 6; i++) {
      ctx.save(); ctx.rotate(i * Math.PI / 3);
      polygon([[31,-10],[47,0],[31,10],[35,0]], color);
      ctx.restore();
    }
    barrels(29, 10, 6);
    polygon([[30,0],[15,26],[-15,26],[-30,0],[-15,-26],[15,-26]], color);
    polygon([[-27,0],[-13,-23],[-9,-12],[-17,0],[-9,12],[-13,23]], '#3d9eae');
    circle(0, 0, 13, '#ffffff');
    circle(0, 0, 8, '#16383e', false);
    circle(-2, -2, 3, '#7ef4ff', false);
  } else {
    // Paint vat, paired side reservoirs, hoses and asymmetric spray nozzles.
    for (const y of [-30, 30]) {
      ctx.beginPath(); ctx.moveTo(-20, y); ctx.quadraticCurveTo(-39, y, -28, 0);
      ctx.strokeStyle = dark; ctx.lineWidth = 7; ctx.stroke();
      box(-22, y - 9, 42, 18, 8, armor);
      box(-17, y - 6, 29, 12, 5, color);
    }
    for (const [x,y,r] of [[-36,-17,5],[-42,0,6],[-36,17,5]]) circle(x,y,r,color);
    box(17, -15, 28, 11, 4, armor);
    box(38, -15, 7, 11, 2, color);
    box(19, 6, 21, 12, 4, armor);
    box(34, 6, 7, 12, 2, color);
    circle(0, 0, 29, armor);
    circle(0, 0, 24, color);
    box(-17, -5, 35, 10, 4, armor);
    box(1, -2, 13, 4, 1, '#ffffff');
    for (const [x,y] of [[-10,-13],[0,15],[9,-14]]) circle(x,y,2,'#e9f5ee',false);
  }
  ctx.restore();
}
