import { useEffect, useRef, useState } from "react";
import type { HudState } from "@/game/engine";
import {
  Rocket,
  CircleDotDashed,
  Snowflake,
  Magnet,
  FastForward,
  DollarSign,
  Timer,
  Users,
  VolumeX,
  Volume2,
  Pause,
  PaintBucket,
  Vibrate,
  Maximize,
  MoreHorizontal,
  X,
  Save,
  Check,
  DoorOpen,
  Loader2,
  Shield,
  CornerUpRight,
  Bomb,
  PaintRoller,
  Zap,
  Crosshair,
  Target,
  Dumbbell,
  Skull,
} from "lucide-react";

const POWER_ICONS: Record<string, typeof Shield> = {
  rapid: Zap,
  triple: Crosshair,
  shield: Shield,
  ricochet: CornerUpRight,
  explosive: Bomb,
  roller: PaintRoller,
  turbo: Rocket,
  cluster: CircleDotDashed,
  ink: Snowflake,
  magnet: Magnet,
  slow: Snowflake,
  prime: DollarSign,
  dash: FastForward,
  comboFreeze: Snowflake,
  heavy: Dumbbell,
};

interface Props {
  hud: HudState;
  muted: boolean;
  vibe: boolean;
  isTouch: boolean;
  portrait: boolean;
  onPause: () => void;
  onMute: () => void;
  onVibe: () => void;
  onFullscreen: () => void;
  onSave: () => void;
  saveBusy?: boolean;
  justSaved?: boolean;
}

const tap =
  "panel flex items-center justify-center transition active:translate-y-0.5 hover:border-cyan-hot/70";

export default function Hud({
  hud, muted, vibe, isTouch, portrait, onPause, onMute, onVibe,
  onFullscreen, onSave, saveBusy, justSaved,
}: Props) {
  const [details, setDetails] = useState(false);
  const detailsButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.repeat || event.ctrlKey || event.metaKey || event.altKey ||
        (event.target instanceof Element && event.target.closest('input, textarea, button, a, [contenteditable]'))) return;
      if (event.code === 'KeyH') { event.preventDefault(); setDetails(value => !value); }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, []);
  const lowHealth = hud.hp <= 2;
  const lowAmmo = hud.ammo <= Math.max(1, Math.floor(hud.mag * 0.25));
  const powerPct = (pct: number) => `${Math.max(0, Math.min(1, pct)) * 100}%`;
  return (
    <div className="pointer-events-none absolute inset-0 select-none">
      <div className="pad-hud-t pad-hud-l pad-hud-r flex items-start justify-between gap-2">
        {/* One quiet status capsule, not a full-width wall of panels. */}
        <div className="flex min-w-0 flex-col items-start gap-1.5">
          <div className="hud-essential flex max-w-full flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-line/60 bg-court-900/75 px-2.5 py-2 text-chalk backdrop-blur-sm">
            <div className="flex items-center gap-1.5" role="meter" aria-label="Vie" aria-valuenow={hud.hp} aria-valuemin={0} aria-valuemax={hud.maxHp}>
              <PaintBucket className={'h-3.5 w-3.5 ' + (lowHealth ? 'text-magenta-hot' : 'text-cyan-hot')} />
              <span className="flex gap-0.5" aria-hidden="true">{Array.from({ length: hud.maxHp }, (_, i) => <span key={i} className={'h-2.5 w-1.5 rounded-sm ' + (i < hud.hp ? lowHealth ? 'bg-magenta-hot' : 'bg-cyan-hot' : 'bg-line')} />)}</span>
              <span className="sr-only">{hud.hp}/{hud.maxHp}</span>
            </div>
            <span className="font-cond text-xs font-extrabold text-lime-hot" aria-label={`Vague ${hud.wave || 1}`}>V{hud.wave || 1}</span>
            <span className="flex items-center gap-1 font-num text-xs font-bold" title="Adversaires restants" aria-label={`${hud.enemies} adversaires restants`}><Users className="h-3.5 w-3.5 text-magenta-hot" />{hud.enemies}</span>
            <span className={'flex items-center gap-1 font-num text-xs font-bold ' + (lowAmmo ? 'text-gold' : 'text-chalk')} title={`${hud.weaponName} : munitions`} aria-label={`${hud.weaponName}, ${hud.ammo} billes sur ${hud.mag}`}><Target className="h-3.5 w-3.5" />{hud.ammo}/{hud.mag}</span>
          </div>
          {hud.combo > 1 && <div className="flex items-center gap-2 rounded bg-court-900/70 px-2 py-1"><span className="font-display text-[10px] text-magenta-hot">×{hud.combo}</span><span className="h-1 w-12 overflow-hidden rounded bg-court-700"><span className="block h-full bg-magenta-hot" style={{ width: powerPct(hud.comboPct) }} /></span></div>}
          {(hud.bossName || hud.portal) && <div className="flex flex-wrap gap-1" role="status">
            {hud.bossName && <span className="flex items-center gap-1 rounded bg-court-900/80 px-2 py-1 font-cond text-[11px] font-extrabold text-magenta-hot"><Skull className="h-3.5 w-3.5" />{hud.bossName}</span>}
            {hud.portal && <span className="flex items-center gap-1 rounded bg-court-900/80 px-2 py-1 font-cond text-[11px] font-extrabold text-lime-hot"><DoorOpen className="h-3.5 w-3.5" />PORTAIL OUVERT</span>}
          </div>}
          <div className="flex max-w-[55vw] flex-wrap gap-1">
            {hud.weaponDrop && <div title="Arme temporaire" className="rounded bg-court-900/80 px-2 py-1"><span className="font-cond text-[10px] font-extrabold text-gold">{hud.weaponName}</span><span className="mt-1 block h-0.5 w-full bg-line"><span className="block h-full bg-gold" style={{ width: powerPct(hud.weaponDropPct) }} /></span></div>}
            {hud.powers.slice(0, 6).map(power => {
              const Icon = POWER_ICONS[power.id] ?? Zap;
              return <div key={power.id} title={power.name} aria-label={`${power.name}${power.charges ? ` ×${power.charges}` : ''}`} className="rounded bg-court-900/80 px-1.5 py-1" style={{ color: power.color }}><span className="flex items-center gap-1"><Icon className="h-3.5 w-3.5" />{power.charges ? <span className="font-num text-[10px]">×{power.charges}</span> : null}</span><span className="mt-1 block h-0.5 w-5 bg-line"><span className="block h-full" style={{ width: powerPct(power.pct), background: power.color }} /></span></div>;
            })}
          </div>
        </div>
        <div className="pointer-events-auto flex shrink-0 gap-1.5">
          <button ref={detailsButton} onClick={() => setDetails(value => !value)} aria-label={details ? 'Masquer les détails' : 'Afficher les détails'} aria-expanded={details} aria-controls="hud-details" title="Détails de la partie (H)" className={tap + ' hud-action h-11 w-11 rounded-lg bg-court-900/75'}>{details ? <X className="h-4 w-4 text-cyan-hot" /> : <MoreHorizontal className="h-5 w-5 text-chalk" />}</button>
          <button onClick={onPause} aria-label="Pause" title="Pause (P / Échap)" className={tap + ' hud-action h-11 w-11 rounded-lg bg-court-900/75'}><Pause className="h-4 w-4 text-chalk" /></button>
        </div>
      </div>
      {details && <section id="hud-details" aria-label="Détails de la partie" className={'hud-details pointer-events-auto absolute right-[max(0.75rem,env(safe-area-inset-right))] top-[calc(4rem+env(safe-area-inset-top))] z-10 max-h-[min(60dvh,26rem)] w-[min(20rem,calc(100%-1.5rem))] overflow-y-auto rounded-xl border border-line bg-court-900/95 p-4 shadow-xl ' + (isTouch && !portrait ? 'text-xs' : '')}
        onKeyDown={event => { event.stopPropagation(); if (event.key === 'Escape') { event.preventDefault(); setDetails(false); detailsButton.current?.focus(); } }}>
        <h2 className="mb-3 font-display text-xs text-chalk">DÉTAILS DE LA PARTIE</h2>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 font-cond text-sm text-moss">
          <dt>Score</dt><dd className="text-right font-num font-bold text-chalk">{hud.score.toLocaleString('fr-FR')}</dd>
          <dt>Terrain peint</dt><dd className="text-right text-cyan-hot">{Math.round(hud.coverage * 100)} %</dd>
          <dt>Marqueur</dt><dd className="text-right text-chalk">{hud.weaponName}</dd>
          <dt>Arène {hud.arenaIndex + 1}/{hud.arenaCount}</dt><dd className="text-right text-chalk">{hud.arena}</dd>
          <dt className="flex items-center gap-1"><Timer className="h-3 w-3" />Temps</dt><dd className="text-right font-num text-chalk">{Math.floor(hud.time / 60)}:{String(Math.floor(hud.time % 60)).padStart(2, '0')}</dd>
        </dl>
        <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-3">
          <button onClick={onSave} disabled={saveBusy} aria-label="Sauvegarder la partie" className={tap + ' hud-action min-h-11 gap-2 px-3 text-xs text-chalk'}>{saveBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : justSaved ? <Check className="h-4 w-4 text-lime-hot" /> : <Save className="h-4 w-4 text-gold" />}{saveBusy ? 'Sauvegarde…' : justSaved ? 'Sauvegardé' : 'Sauver'}</button>
          <button onClick={onMute} aria-label={muted ? 'Activer le son' : 'Couper le son'} className={tap + ' hud-action h-11 w-11'}>{muted ? <VolumeX className="h-4 w-4 text-moss" /> : <Volume2 className="h-4 w-4 text-cyan-hot" />}</button>
          {isTouch && <><button onClick={onVibe} aria-label="Vibrations" aria-pressed={vibe} className={tap + ' hud-action h-11 w-11'}><Vibrate className={'h-4 w-4 ' + (vibe ? 'text-lime-hot' : 'text-moss')} /></button><button onClick={onFullscreen} aria-label="Plein écran" className={tap + ' hud-action h-11 w-11'}><Maximize className="h-4 w-4 text-gold" /></button></>}
        </div>
        <p className="mt-3 font-cond text-xs text-moss">La partie continue. Mets en pause pour consulter tranquillement les options.</p>
      </section>}
    </div>
  );
}
