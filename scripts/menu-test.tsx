/** DOM navigation smoke test (no game/audio engine).
 * npm install --no-save --package-lock=false jsdom
 * npx tsx scripts/menu-test.tsx
 */
import assert from 'node:assert/strict';
// @ts-ignore Optional test-only dependency; install with the command above.
import { JSDOM } from 'jsdom';
import * as React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { StartScreen } from '../src/components/Screens';

const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: 'https://example.test' });
Object.assign(globalThis, {
  React, window: dom.window, document: dom.window.document, localStorage: dom.window.localStorage,
  HTMLElement: dom.window.HTMLElement, IS_REACT_ACT_ENVIRONMENT: true,
});
let starts = 0, resumes = 0, progression = 0, mutes = 0;
const weapons: string[] = [];
const props = {
  onStart: () => { starts++; }, onProgression: () => { progression++; },
  onResume: () => { resumes++; }, onDeleteSave: () => {},
  saveMeta: { wave: 5, score: 1234, savedAt: Date.now(), label: 'Test' },
  rows: [], best: 0, muted: false, onMute: () => { mutes++; },
  isTouch: false, vibe: false, onVibe: () => {}, fullscreen: false, onFullscreen: () => {}, portrait: false,
  musicOn: true, musicName: 'Test', musicMood: 'Arcade', onToggleMusic: () => {}, onCycleMusic: () => {},
  weapon: 'marker' as const, onWeapon: (id: string) => weapons.push(id), onWeaponPreview: () => {},
  career: { best_wave: 0, total_score: 0 },
};
const root = createRoot(document.getElementById('root')!);
const buttons = () => Array.from((document.querySelector('[role="dialog"]') ?? document).querySelectorAll<HTMLButtonElement>('button'));
const find = (label: string) => {
  const button = buttons().find(b => b.textContent?.includes(label));
  assert(button, `Missing button: ${label}`); return button;
};
const click = async (label: string) => {
  const button = find(label); button.focus();
  await act(() => { button.click(); });
};
const close = async () => {
  const dialog = document.querySelector('[role="dialog"]'); assert(dialog);
  await act(() => { dialog.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); });
  assert(!document.querySelector('[role="dialog"]'));
};
for (const isTouch of [false, true]) {
  await act(() => { root.render(<StartScreen {...props} isTouch={isTouch} portrait={isTouch} />); });
  assert(!document.querySelector('[role="dialog"]'));
  assert(!buttons().some(b => b.textContent?.includes('BIENTÔT')));
  await click('ARSENAL');
  assert(document.querySelector('[role="dialog"]'));
  assert(document.querySelector('main')?.parentElement?.hasAttribute('inert'));
  const sniper = find('SNIPER'); assert(sniper.disabled);
  await click('SPRAYER'); assert.equal(weapons.at(-1), 'sprayer');
  await close(); assert(find('ARSENAL') === document.activeElement);
  await click('PARAMÈTRES');
  assert(document.body.textContent?.includes('AUDIO'));
  await click('SON ACTIVÉ');
  const dialogButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('[role="dialog"] button:not(:disabled)'));
  dialogButtons.at(-1)!.focus();
  await act(() => { dialogButtons.at(-1)!.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })); });
  assert.equal(document.activeElement, dialogButtons[0]);
  await close();
  await click('COMMANDES'); assert(document.body.textContent?.includes('CLAVIER ET SOURIS')); await close();
  await click('RECORDS'); assert(document.body.textContent?.includes('Aucune partie enregistrée')); await close();
  await click('PROGRESSION');
  await click('JOUER');
  await click('REPRENDRE');
  await click('NOUVELLE PARTIE SOLO');
  await close();
}
assert.equal(starts, 2); assert.equal(resumes, 2); assert.equal(progression, 2); assert.equal(mutes, 2);
await act(() => root.unmount());
console.log('Menu PC/mobile: navigation, locked weapons, callbacks, focus restoration, Tab trap and Escape passed.');
