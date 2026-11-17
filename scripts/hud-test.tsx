/** HUD interaction smoke test.
 * npm install --no-save --package-lock=false jsdom
 * npx tsx scripts/hud-test.tsx
 */
import assert from 'node:assert/strict';
// @ts-ignore Optional test-only dependency.
import { JSDOM } from 'jsdom';
import * as React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import Hud from '../src/components/Hud';
import type { HudState } from '../src/game/engine';

const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: 'https://example.test' });
Object.assign(globalThis, { React, window: dom.window, document: dom.window.document, Element: dom.window.Element, IS_REACT_ACT_ENVIRONMENT: true });
const root = createRoot(document.getElementById('root')!);
let pauses = 0, saves = 0, mutes = 0;
const hud: HudState = {
  hp: 6, maxHp: 6, wave: 1, enemies: 4, ammo: 11, mag: 12, score: 1234,
  coverage: 0.07, time: 8, arenaIndex: 0, arenaCount: 4, arena: 'LE YARD',
  combo: 1, comboPct: 0, dashPct: 1, weapon: 'marker', weaponName: 'MARKER',
  weaponDrop: '', weaponDropPct: 0, powerName: '', powerPct: 0, powers: [], portal: false, bossName: '',
};
const props = { hud, muted: true, vibe: false, isTouch: false, portrait: false,
  onPause: () => { pauses++; }, onSave: () => { saves++; }, onMute: () => { mutes++; },
  onVibe: () => {}, onFullscreen: () => {},
};
const click = async (label: string) => {
  const el = document.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`);
  assert(el, `Missing button: ${label}`);
  await act(() => { el.click(); });
};
for (const isTouch of [false, true]) {
  await act(() => root.render(<Hud {...props} isTouch={isTouch} />));
  assert.equal(document.querySelectorAll('button').length, 2, 'Only details and pause visible by default');
  assert(!document.getElementById('hud-details'));
  assert(document.querySelector('[aria-label="4 adversaires restants"]'));
  assert(document.querySelector('[aria-label="MARKER, 11 billes sur 12"]'));
  assert.equal(document.querySelector('[aria-label="Vie"]')?.getAttribute('aria-valuenow'), '6');
  await click('Pause');
  await click('Afficher les détails');
  assert(document.getElementById('hud-details')?.textContent?.includes('LE YARD'));
  assert(document.getElementById('hud-details')?.textContent?.includes('7 %'));
  await click('Sauvegarder la partie'); await click('Activer le son');
  if (isTouch) assert(document.querySelector('[aria-label="Vibrations"]'));
  await act(() => document.getElementById('hud-details')!.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
  assert(!document.getElementById('hud-details'));
  await act(() => window.dispatchEvent(new dom.window.KeyboardEvent('keydown', { code: 'KeyH', bubbles: true })));
  assert(document.getElementById('hud-details'));
  await click('Masquer les détails');
}
assert.equal(pauses, 2); assert.equal(saves, 2); assert.equal(mutes, 2);
await act(() => root.render(<Hud {...props} hud={{ ...hud, hp: 1, ammo: 0, portal: true, bossName: 'GOLIATH', combo: 3, weaponDrop: 'FLAMER', weaponName: 'FLAMER', powers: [{ id: 'shield', name: 'Bouclier', pct: 0.5, color: '#3ee8ff' }] }} />));
assert(document.querySelector('[role="status"]')?.textContent?.includes('GOLIATH'));
assert(document.querySelector('[role="status"]')?.textContent?.includes('PORTAIL OUVERT'));
assert(document.querySelector('[aria-label="Bouclier"]'));
assert(!document.getElementById('hud-details'), 'Alerts must not force details open');
await act(() => root.unmount());
console.log('HUD PC/mobile: compact default, details toggle, H/Escape, callbacks and contextual alerts passed.');
