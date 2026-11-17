import { useEffect, useMemo, useRef, useState } from "react";
import {
  Settings,
  ChevronRight,
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  Home,
  Trophy,
  Skull,
  Target,
  Keyboard,
  Smartphone,
  VolumeX,
  Volume2,
  Crosshair,
  Sparkles,
  Vibrate,
  Maximize,
  RotateCw,
  Cloud,
  CloudOff,
  Save,
  History,
  Trash2,
  Music,
  SkipBack,
  SkipForward,
  DoorOpen,
  Lock,
  Check,
} from "lucide-react";
import type { RunResult } from "@/game/engine";
import { cleanName, fmtTime, MAX_NAME_LENGTH, type ScoreRow } from "@/lib/scores";
import {
  isWeaponUnlocked,
  WEAPONS,
  WEAPON_ORDER,
  weaponUnlockProgress,
  type Career,
  type WeaponId,
} from "@/game/rules";

/* ---------------- decorative paint splat ---------------- */

export function Splat({ className = "", color = "#ff2f87" }: { className?: string; color?: string }) {
  const nubs = useMemo(
    () =>
      Array.from({ length: 11 }, (_, i) => {
        const a = (i / 11) * Math.PI * 2 + (i % 3) * 0.22;
        const d = 24 + ((i * 37) % 17);
        return { x: 50 + Math.cos(a) * d, y: 50 + Math.sin(a) * d, r: 5 + ((i * 13) % 9) };
      }),
    []
  );
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <g fill={color}>
        <circle cx="50" cy="50" r="30" />
        {nubs.map((n, i) => (
          <circle key={i} cx={n.x} cy={n.y} r={n.r} />
        ))}
        {nubs.slice(0, 5).map((n, i) => (
          <rect key={"d" + i} x={n.x - 1.6} y={n.y} width="3.2" height={10 + (i % 3) * 8} rx="1.6" />
        ))}
      </g>
    </svg>
  );
}

/* ---------------- shared bits ---------------- */

function Btn({
  children,
  onClick,
  tone = "cyan",
  className = "",
  disabled = false,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  tone?: "cyan" | "magenta" | "ghost" | "gold";
  className?: string;
  disabled?: boolean;
  title?: string;
}) {
  const tones: Record<string, string> = {
    cyan: "bg-cyan-hot text-court-900",
    magenta: "bg-magenta-hot text-court-900",
    gold: "bg-gold text-court-900",
    ghost: "bg-court-600 text-chalk border-line!",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`btn px-5 py-3 text-sm ${tones[tone]} ${className} ${disabled ? "cursor-not-allowed opacity-55 hover:translate-y-0 hover:brightness-100" : ""}`}
    >
      {children}
    </button>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="border-l-2 border-line pl-2.5">
      <div className="font-cond text-[10px] font-extrabold tracking-[0.2em] text-moss">{label}</div>
      <div className="font-display text-lg leading-tight text-chalk">{value}</div>
      {sub && <div className="font-cond text-[10px] tracking-wider text-moss">{sub}</div>}
    </div>
  );
}

export function Leaderboard({ rows, highlight }: { rows: ScoreRow[]; highlight?: number }) {
  return (
    <div className="panel">
      <div className="flex items-center gap-2 border-b-2 border-line bg-court-700/70 px-3 py-2">
        <Trophy className="h-4 w-4 text-gold" />
        <h3 className="font-display text-[13px] tracking-wide text-chalk">COURT RECORDS</h3>
        <span className="ml-auto font-cond text-[10px] font-extrabold tracking-[0.2em] text-moss">LOCAL TOP 8</span>
      </div>
      {rows.length === 0 ? (
        <div className="flex items-center gap-2 px-3 py-5 text-moss">
          <Sparkles className="h-4 w-4" />
          <p className="font-cond text-sm font-bold tracking-wide">Aucune partie enregistrée. Le court est propre : peins-le.</p>
        </div>
      ) : (
        <table className="w-full text-left">
          <thead>
            <tr className="font-cond text-[10px] tracking-[0.18em] text-moss">
              <th className="px-3 py-1 font-extrabold">#</th>
              <th className="py-1 font-extrabold">NAME</th>
              <th className="py-1 text-right font-extrabold">SCORE</th>
              <th className="py-1 text-right font-extrabold">WAVE</th>
              <th className="py-1 pr-3 text-right font-extrabold">PAINT</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={r.date + "-" + i}
                className={
                  "font-cond text-[13px] font-bold " +
                  (highlight === i ? "bg-cyan-hot/15 text-cyan-hot" : i === 0 ? "text-gold" : "text-chalk/85")
                }
              >
                <td className="px-3 py-[3px] font-num">{i + 1}</td>
                <td className="py-[3px] tracking-[0.08em]"><span className="block max-w-[9rem] truncate" title={r.name}>{r.name}</span></td>
                <td className="py-[3px] text-right font-num">{r.score.toLocaleString()}</td>
                <td className="py-[3px] text-right font-num text-moss">{r.wave}</td>
                <td className="py-[3px] pr-3 text-right font-num text-moss">{Math.round(r.coverage * 100)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function MuteBtn({ muted, onMute }: { muted: boolean; onMute: () => void }) {
  return (
    <button
      onClick={onMute}
      aria-label={muted ? "Activer le son" : "Couper le son"}
      className="panel pointer-events-auto flex h-11 w-11 items-center justify-center text-chalk/70 transition hover:border-cyan-hot hover:text-cyan-hot active:translate-y-0.5"
    >
      {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
    </button>
  );
}

function Toggle({
  on,
  onClick,
  label,
  icon: Icon,
  tint = "text-lime-hot",
}: {
  on: boolean;
  onClick: () => void;
  label: string;
  icon: typeof VolumeX;
  tint?: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      aria-pressed={on}
      className={`panel pointer-events-auto flex h-11 items-center gap-2 px-3 transition active:translate-y-0.5 ${
        on ? "border-lime-hot/60" : "text-moss"
      }`}
    >
      <Icon className={`h-4 w-4 ${on ? tint : ""}`} />
      <span className={"font-cond text-[11px] font-extrabold tracking-[0.16em] " + (on ? "text-chalk" : "text-moss")}>
        {label}
      </span>
    </button>
  );
}

/** schéma interactif des commandes pouce */
export function ThumbMap({ compact = false }: { compact?: boolean }) {
  return (
    <div className={"panel relative overflow-hidden " + (compact ? "p-2.5" : "p-3.5")}>
      <div className="mb-2 flex items-center gap-2">
        <Smartphone className="h-4 w-4 text-lime-hot" />
        <h3 className="font-display text-[12px] tracking-wide text-chalk">DISPOSITION DES POUCE</h3>
        <span className="ml-auto font-cond text-[10px] font-extrabold tracking-[0.2em] text-moss">POSER · GLISSER</span>
      </div>
      <svg viewBox="0 0 300 130" className="w-full" aria-hidden>
        <defs>
          <linearGradient id="scr" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#16231e" />
            <stop offset="1" stopColor="#0b1210" />
          </linearGradient>
        </defs>
        <rect x="4" y="6" width="292" height="118" rx="14" fill="url(#scr)" stroke="#2c4740" strokeWidth="2.5" />
        <line x1="150" y1="14" x2="150" y2="116" stroke="#2c4740" strokeWidth="1.2" strokeDasharray="4 6" />
        {/* stick gauche */}
        <circle cx="62" cy="88" r="30" fill="none" stroke="#3ee8ff" strokeWidth="2" strokeDasharray="6 6" opacity="0.7" />
        <circle cx="62" cy="88" r="11" fill="#3ee8ff" opacity="0.85">
          <animate attributeName="cx" values="62;80;62;46;62" dur="3.6s" repeatCount="indefinite" />
          <animate attributeName="cy" values="88;74;60;74;88" dur="3.6s" repeatCount="indefinite" />
        </circle>
        <text x="62" y="38" textAnchor="middle" className="font-cond" fill="#8aa99b" fontSize="11" fontWeight="800" letterSpacing="1.6">
          BOUGER
        </text>
        {/* stick droit */}
        <circle cx="206" cy="76" r="26" fill="none" stroke="#ff2f87" strokeWidth="2" strokeDasharray="6 6" opacity="0.7" />
        <circle cx="206" cy="76" r="9.5" fill="#ff2f87" opacity="0.85">
          <animate attributeName="cx" values="206;226;206;190;206" dur="2.8s" repeatCount="indefinite" />
          <animate attributeName="cy" values="76;62;50;66;76" dur="2.8s" repeatCount="indefinite" />
        </circle>
        <text x="206" y="36" textAnchor="middle" fill="#8aa99b" fontSize="11" fontWeight="800" letterSpacing="1.6">
          VISER + TIRER
        </text>
        {/* cluster boutons */}
        <g>
          <circle cx="268" cy="102" r="17" fill="rgba(62,232,255,0.16)" stroke="#3ee8ff" strokeWidth="2" />
          <circle cx="268" cy="102" r="6" fill="none" stroke="#e9f5ee" strokeWidth="2" />
          <circle cx="234" cy="110" r="11.5" fill="rgba(255,216,77,0.14)" stroke="#ffd84d" strokeWidth="2">
            <animate attributeName="r" values="11.5;12.8;11.5" dur="1.8s" repeatCount="indefinite" />
          </circle>
          <circle cx="258" cy="72" r="9.5" fill="rgba(185,255,51,0.12)" stroke="#b9ff33" strokeWidth="2" />
          <text x="268" y="127" textAnchor="middle" fill="#8aa99b" fontSize="8.5" fontWeight="800" letterSpacing="1">
            FEU
          </text>
          <text x="228" y="127" textAnchor="middle" fill="#8aa99b" fontSize="8.5" fontWeight="800" letterSpacing="1">
            DASH
          </text>
          <text x="284" y="62" textAnchor="middle" fill="#8aa99b" fontSize="8.5" fontWeight="800" letterSpacing="1">
            CHG
          </text>
        </g>
      </svg>
      <p className="mt-2 font-cond text-[11px] font-bold leading-tight tracking-wide text-moss">
        Les pads s'activent sous ton doigt n'importe où : à gauche tu te déplaces, à droite tu vises et tu arroses.
        Le bouton FEU vise tout seul la cible la plus proche.
      </p>
    </div>
  );
}

/** encart à cocher une fois pour toutes : plein écran + secousses */
export function MobileToggles({
  vibe,
  onVibe,
  fullscreen,
  onFullscreen,
}: {
  vibe: boolean;
  onVibe: () => void;
  fullscreen: boolean;
  onFullscreen: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Toggle on={fullscreen} onClick={onFullscreen} label="PLEIN ÉCRAN" icon={Maximize} tint="text-gold" />
      <Toggle on={vibe} onClick={onVibe} label="VIBRATION" icon={Vibrate} />
    </div>
  );
}

/* ---------------- start screen ---------------- */

const KEYS: [string, string][] = [
  ["W A S D", "Se déplacer"],
  ["SOURIS", "Viser"],
  ["CLIC G / ESPACE", "Arroser"],
  ["MAJ", "Dash + i-frames"],
  ["R", "Recharger"],
  ["P / ÉCHAP", "Pause"],
];

function ContinueStrip({
  meta,
  onResume,
  onDeleteSave,
  busy,
  compact = false,
}: {
  meta: { wave: number; score: number; savedAt: number; label: string };
  onResume?: () => void;
  onDeleteSave?: () => void;
  busy?: boolean;
  compact?: boolean;
}) {
  const when = new Date(meta.savedAt).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  return (
    <div className={`panel anim-pop relative flex items-center gap-3 overflow-hidden border-lime-hot/60 ${compact ? "p-2.5" : "p-3"}`}>
      <div className="stripes absolute inset-y-0 left-0 w-1.5 opacity-80" />
      <History className="ml-2 h-5 w-5 shrink-0 text-lime-hot" />
      <div className="min-w-0">
        <div className="font-cond text-[10px] font-extrabold tracking-[0.24em] text-moss">PARTIE EN COURS</div>
        <div className={`font-display leading-none text-chalk ${compact ? "text-base" : "text-xl"}`}>VAGUE {meta.wave}</div>
        <div className="truncate font-cond text-[11px] font-bold tracking-wide text-moss">
          {meta.score.toLocaleString("fr-FR")} pts · {when}
        </div>
      </div>
      <button onClick={onResume} disabled={busy} className={`btn ml-auto flex shrink-0 items-center gap-2 bg-lime-hot text-court-900 disabled:opacity-50 ${compact ? "px-3 py-2 text-xs" : "px-4 py-2.5 text-sm"}`}>
        <Play className="h-4 w-4 fill-current" /> {busy ? "…" : "REPRENDRE"}
      </button>
      {onDeleteSave && (
        <button onClick={onDeleteSave} aria-label="Supprimer la sauvegarde" title="Supprimer la sauvegarde" className="panel flex h-9 w-9 shrink-0 items-center justify-center text-moss transition hover:border-magenta-hot hover:text-magenta-hot">
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}



/* ---------------- Armes ---------------- */

export interface WeaponCardData {
  id: WeaponId;
  name: string;
  tagline: string;
  cadence: string;
  dmg: string;
  mag: number;
  paint: string;
  color: string;
}

const cadenceOf = (fire: number) => `${(1 / fire).toFixed(1).replace(".", ",")}/s`;

export const WEAPON_CARDS: WeaponCardData[] = WEAPON_ORDER.map((id) => {
  const w = WEAPONS[id];
  return {
    id,
    name: w.name,
    tagline: w.tagline,
    cadence: cadenceOf(w.fire),
    dmg: w.pellets > 1 ? `${w.dmg}×${w.pellets}` : String(w.dmg),
    mag: w.mag,
    paint: "×" + w.paint.toFixed(2).replace(".", ",").replace(",00", ""),
    color: w.color,
  };
});

function WeaponPicker({
  value,
  onChange,
  onPreview,
  career,
  compact = false,
}: {
  value: WeaponId;
  onChange: (id: WeaponId) => void;
  onPreview: (canvas: HTMLCanvasElement | null) => void;
  career: Career;
  compact?: boolean;
}) {
  const unlockedCount = WEAPON_ORDER.filter((id) => isWeaponUnlocked(id, career)).length;
  const selected = WEAPONS[value];
  return (
    <div className="panel p-3">
      <div className="flex items-center gap-2">
        <Crosshair className="h-4 w-4 text-cyan-hot" />
        <h3 className="font-display text-[12px] tracking-wide text-chalk">CHOIX DU MARQUEUR</h3>
        <span className="ml-auto font-cond text-[10px] font-extrabold tracking-[0.18em] text-moss">
          {unlockedCount}/{WEAPON_ORDER.length} DÉBLOQUÉS
        </span>
      </div>
      <div className={"mt-2 grid gap-2 " + (compact ? "grid-cols-1" : "sm:grid-cols-3")}>
        {WEAPON_CARDS.map((w) => {
          const on = value === w.id;
          const progress = weaponUnlockProgress(w.id, career);
          const locked = progress.locked;
          return (
            <button
              key={w.id}
              onClick={() => !locked && onChange(w.id)}
              disabled={locked}
              aria-pressed={on}
              title={locked ? progress.label : w.tagline}
              className={
                "relative border-2 p-2 text-left transition " +
                (locked
                  ? "cursor-not-allowed border-line/60 bg-court-800/60 opacity-80"
                  : "active:translate-y-0.5 " + (on ? "bg-court-600/70" : "border-line/70 bg-court-700/40 hover:border-moss"))
              }
              style={{ borderColor: !locked && on ? w.color : undefined }}
            >
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 skew-x-[-12deg]" style={{ background: locked ? "#2c4740" : w.color }} />
                <span className={"font-display text-[11px] tracking-wide " + (locked ? "text-moss" : "text-chalk")}>{w.name}</span>
                {locked ? (
                  <Lock className="ml-auto h-3 w-3 text-gold" />
                ) : on ? (
                  <span className="ml-auto font-cond text-[8px] font-extrabold tracking-[0.18em]" style={{ color: w.color }}>ÉQUIPÉ</span>
                ) : null}
              </div>
              {locked ? (
                <div className="mt-1">
                  <div className="font-cond text-[10px] font-extrabold leading-tight tracking-wide text-gold">{progress.label}</div>
                  <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-court-600">
                    <div className="h-full bg-gold" style={{ width: `${progress.pct * 100}%` }} />
                  </div>
                  <div className="mt-0.5 font-num text-[9px] font-extrabold text-moss">
                    {Math.min(progress.current, progress.threshold).toLocaleString("fr-FR")} / {progress.threshold.toLocaleString("fr-FR")}
                  </div>
                </div>
              ) : (
                <>
                  <div className="mt-1 flex gap-2 font-num text-[10px] font-extrabold text-chalk/85">
                    <span>{w.cadence}</span>
                    <span className="text-moss">·</span>
                    <span>{w.dmg} dgts</span>
                  </div>
                  <div className="mt-0.5 font-cond text-[10px] font-bold leading-tight tracking-wide text-moss">
                    {w.mag} billes · peinture {w.paint}
                  </div>
                </>
              )}
            </button>
          );
        })}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <canvas ref={onPreview} className="shrink-0" aria-label="Aperçu du marqueur" />
        <div className="min-w-0">
          <p className="font-cond text-[10px] font-bold leading-tight tracking-wide text-moss">{selected.tagline}</p>
          <p className="mt-0.5 flex items-center gap-1 font-cond text-[10px] font-extrabold tracking-[0.1em] text-lime-hot">
            <Check className="h-3 w-3" /> Le choix est conservé et sauvegardé.
          </p>
        </div>
      </div>
    </div>
  );
}

/** Sélecteur de musique d'intro (3 thèmes synthétisés). */
function MusicPicker({
  on,
  name,
  mood,
  onToggle,
  onCycle,
  compact = false,
}: {
  on: boolean;
  name: string;
  mood: string;
  onToggle: () => void;
  onCycle: (dir: number) => void;
  compact?: boolean;
}) {
  return (
    <div className={"panel flex items-center gap-2 " + (compact ? "px-2 py-1.5" : "px-3 py-2")}>
      <button
        onClick={onToggle}
        aria-label={on ? "Couper la musique" : "Activer la musique"}
        className={"flex h-8 w-8 shrink-0 items-center justify-center border-2 transition active:translate-y-0.5 " + (on ? "border-lime-hot/60 text-lime-hot" : "border-line text-moss")}
      >
        <Music className="h-4 w-4" />
      </button>
      <div className="min-w-0 flex-1 text-left">
        <div className="font-cond text-[9px] font-extrabold tracking-[0.22em] text-moss">MUSIQUE D'INTRO</div>
        <div className="truncate font-display text-[11px] leading-tight text-chalk">{name}</div>
        {!compact && <div className="font-cond text-[10px] font-bold tracking-wide text-moss">{mood}</div>}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button onClick={() => onCycle(-1)} aria-label="Thème précédent" className="flex h-8 w-7 items-center justify-center border-2 border-line text-chalk/80 transition hover:border-cyan-hot active:translate-y-0.5">
          <SkipBack className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => onCycle(1)} aria-label="Thème suivant" className="flex h-8 w-7 items-center justify-center border-2 border-line text-chalk/80 transition hover:border-cyan-hot active:translate-y-0.5">
          <SkipForward className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function Logo({ small = false }: { small?: boolean }) {
  return (
    <h1
      className={
        "relative font-display leading-[0.82] text-chalk " + (small ? "text-[13vw] sm:text-7xl lg:text-8xl" : "text-[15vw] sm:text-7xl lg:text-8xl")
      }
    >
      <span className="block" style={{ textShadow: "0 6px 0 #05100d, 0 0 42px rgba(62,232,255,0.35)" }}>
        PAINT<span className="text-cyan-hot">BALL</span>
      </span>
      <span className="block pl-[0.12em] text-[0.62em]" style={{ textShadow: "0 5px 0 #05100d, 0 0 30px rgba(255,47,135,0.4)" }}>
        <span className="text-magenta-hot">2</span>D
        <span className="ml-3 align-middle font-cond text-[22%] font-extrabold tracking-[0.3em] text-moss">
          SPLAT ARENA
        </span>
      </span>
    </h1>
  );
}

function Tips({ rows }: { rows: { icon: typeof Target; t: string; d: string }[] }) {
  return (
    <div className="flex flex-col">
      {rows.map(({ icon: Icon, t, d }, i) => (
        <div key={t} className="flex items-start gap-2.5 border-l-2 border-cyan-hot/70 py-1.5 pl-2.5" style={{ borderTopWidth: i ? 0 : 0 }}>
          <Icon className="mt-0.5 h-4 w-4 shrink-0 text-cyan-hot" />
          <div>
            <div className="font-display text-[11px] leading-tight text-chalk">{t}</div>
            <div className="mt-0.5 font-cond text-[11px] font-semibold leading-tight tracking-wide text-moss">{d}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

type MenuSection = "play" | "arsenal" | "records" | "settings" | "controls";
const MENU_SECTIONS = {
  play: { title: "JOUER", description: "Une nouvelle vague t’attend.", icon: Play },
  arsenal: { title: "ARSENAL", description: "Ton marqueur, ton style de jeu.", icon: Crosshair },
  records: { title: "RECORDS", description: "Tes meilleures performances sur le court.", icon: Trophy },
  settings: { title: "PARAMÈTRES", description: "Règle ton expérience avant d’entrer dans l’arène.", icon: Settings },
  controls: { title: "COMMANDES", description: "Prends le contrôle du terrain.", icon: Keyboard },
};

function MainMenu(props: StartProps) {
  const [section, setSection] = useState<MenuSection | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const [rotateDismissed, setRotateDismissed] = useState(() => localStorage.getItem("pb.rotate") === "1");
  const selected = WEAPONS[props.weapon];
  const open = (next: MenuSection) => {
    opener.current = document.activeElement as HTMLElement;
    setSection(next);
  };
  useEffect(() => {
    if (!section) return;
    panelRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
    return () => { opener.current?.focus(); };
  }, [section]);

  const navigation = (id: MenuSection) => {
    const { title, description, icon: Icon } = MENU_SECTIONS[id];
    return (
      <button key={id} onClick={() => open(id)} aria-haspopup="dialog"
        className="menu-option panel flex min-h-20 items-center gap-3 p-4 text-left transition hover:border-cyan-hot hover:bg-court-600">
        <Icon className="h-5 w-5 shrink-0 text-cyan-hot" />
        <span className="min-w-0 flex-1"><span className="block font-display text-sm text-chalk">{title}</span>
          <span className="mt-1 block font-cond text-xs text-moss">{description}</span></span>
        <ChevronRight className="h-4 w-4 shrink-0 text-moss" />
      </button>
    );
  };
  return (
    <div className="scroll-thin absolute inset-0 overflow-y-auto bg-gradient-to-br from-court-900/95 via-court-900/80 to-court-900/40">
      <div inert={section !== null}>
        <div className="stripes h-2 opacity-70" />
        <main className="menu-home mx-auto flex min-h-[calc(100dvh-8px)] max-w-6xl flex-col justify-center gap-8 px-5 py-8 sm:px-8 lg:grid lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-12">
          <header className="anim-in min-w-0">
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <span className="slash bg-magenta-hot px-3 py-1 font-display text-[10px] text-court-900">ARCADE ARENA</span>
              <span className="font-cond text-[10px] font-extrabold tracking-[0.22em] text-moss">SURVIE · PEINTURE · COMBOS</span>
            </div>
            <div className="relative isolate">
              <Splat className="pointer-events-none absolute -left-4 -top-8 -z-10 h-32 w-32 opacity-45" color="#3ee8ff" />
              <Logo small={props.isTouch} />
            </div>
            <p className="mt-6 max-w-sm font-body text-base leading-relaxed text-chalk/75">Vise juste. Peins le court. Survis aux vagues.<br />L’arène attend ta prochaine couleur.</p>
            <div className="mt-6 flex flex-wrap gap-5 border-l-2 border-cyan-hot pl-4">
              <div><span className="block font-cond text-[10px] font-bold tracking-widest text-moss">MARQUEUR ÉQUIPÉ</span>
                <button onClick={() => open("arsenal")} className="mt-1 flex min-h-11 items-center gap-2 font-display text-sm text-cyan-hot" aria-label={`Changer de marqueur : ${selected.name}`}>
                  <Crosshair className="h-4 w-4" />{selected.name}<ChevronRight className="h-4 w-4" />
                </button></div>
              {props.best > 0 && <div><span className="block font-cond text-[10px] font-bold tracking-widest text-moss">MEILLEUR SCORE</span><span className="mt-3 block font-display text-sm text-gold">{props.best.toLocaleString("fr-FR")}</span></div>}
            </div>
          </header>
          <nav aria-label="Menu principal" className="anim-in flex min-w-0 flex-col gap-3">
            <button onClick={() => open("play")} aria-haspopup="dialog" className="btn flex min-h-20 items-center gap-4 bg-cyan-hot px-5 py-4 text-left text-court-900">
              <Play className="h-7 w-7 fill-current" /><span className="flex-1"><span className="block text-xl">JOUER</span><span className="mt-1 block font-cond text-xs font-bold tracking-widest">{props.saveMeta ? "NOUVELLE PARTIE OU REPRENDRE" : "SURVIE SOLO"}</span></span><ChevronRight className="h-5 w-5" />
            </button>
            <div className="grid gap-3 sm:grid-cols-2">
              {navigation("arsenal")}
              {props.onProgression && <button onClick={props.onProgression} className="menu-option panel flex min-h-20 items-center gap-3 p-4 text-left transition hover:border-cyan-hot hover:bg-court-600"><Cloud className="h-5 w-5 shrink-0 text-lime-hot" /><span><span className="block font-display text-sm text-chalk">PROGRESSION</span><span className="mt-1 block font-cond text-xs text-moss">Profil, statistiques et déblocages.</span></span></button>}
              {navigation("records")}
              {navigation("settings")}
            </div>
            {navigation("controls")}
            {props.multiplayerEnabled && props.onMultiplayer && <Btn onClick={props.onMultiplayer} tone="magenta">MULTIJOUEUR</Btn>}
            {!props.isTouch && <p className="mt-2 text-center font-cond text-[11px] font-bold tracking-widest text-moss">ESPACE / ENTRÉE : PARTIE RAPIDE · TAB : NAVIGUER</p>}
            {props.isTouch && props.portrait && !rotateDismissed && <button className="panel flex min-h-11 items-center gap-2 p-3 text-left font-cond text-xs text-gold" onClick={() => { localStorage.setItem("pb.rotate", "1"); setRotateDismissed(true); }}><RotateCw className="h-5 w-5 shrink-0" />En paysage, tu vois plus de terrain. Toucher pour masquer.</button>}
          </nav>
        </main>
      </div>
      {section && <div className="fixed inset-0 z-30 flex items-center justify-center bg-court-900/85 p-3 backdrop-blur-sm sm:p-6" onClick={e => { if (e.target === e.currentTarget) setSection(null); }}>
        <div ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="menu-section-title" aria-describedby="menu-section-description"
          className="panel anim-pop flex max-h-[90dvh] w-full max-w-3xl flex-col bg-court-800"
          onKeyDown={e => {
            e.stopPropagation();
            if (e.key === "Escape") { e.preventDefault(); setSection(null); }
            if (e.key === "Tab") {
              const items = panelRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), [href], input, [tabindex="0"]');
              if (!items?.length) return;
              const first = items[0], last = items[items.length - 1];
              if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
              else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
            }
          }}>
          <div className="flex shrink-0 items-center gap-3 border-b-2 border-line p-4 sm:p-5">
            <button onClick={() => setSection(null)} className="panel flex min-h-11 items-center gap-2 px-3 font-cond text-xs font-extrabold text-cyan-hot" aria-label="Retour au menu principal"><ArrowLeft className="h-4 w-4" />RETOUR</button>
            <div className="min-w-0"><h2 id="menu-section-title" className="font-display text-base text-chalk">{MENU_SECTIONS[section].title}</h2><p id="menu-section-description" className="mt-1 font-cond text-xs text-moss">{MENU_SECTIONS[section].description}</p></div>
          </div>
          <div className="scroll-thin min-h-0 overflow-y-auto p-4 sm:p-5">
            {section === "play" && <div className="flex flex-col gap-4">
              {props.saveMeta && props.onResume && <ContinueStrip meta={props.saveMeta} onResume={props.onResume} onDeleteSave={props.onDeleteSave} busy={props.resumeBusy} />}
              <div className="panel p-4"><p className="mb-4 font-cond text-sm text-moss">Marqueur équipé : <strong className="text-cyan-hot">{selected.name}</strong>. Une nouvelle partie démarre à la vague 1.</p><Btn onClick={props.onStart} className="w-full"><span className="flex items-center justify-center gap-2"><Play className="h-5 w-5" />NOUVELLE PARTIE SOLO</span></Btn></div>
            </div>}
            {section === "arsenal" && <WeaponPicker value={props.weapon} onChange={props.onWeapon} onPreview={props.onWeaponPreview} career={props.career} />}
            {section === "records" && <Leaderboard rows={props.rows} />}
            {section === "settings" && <div className="space-y-5">
              <section><h3 className="mb-3 font-display text-sm text-chalk">AUDIO</h3><Toggle on={!props.muted} onClick={props.onMute} label={props.muted ? "SON DÉSACTIVÉ" : "SON ACTIVÉ"} icon={props.muted ? VolumeX : Volume2} /><div className="mt-3"><MusicPicker on={props.musicOn} name={props.musicName} mood={props.musicMood} onToggle={props.onToggleMusic} onCycle={props.onCycleMusic} /></div></section>
              <section><h3 className="mb-3 font-display text-sm text-chalk">AFFICHAGE ET CONFORT</h3><MobileToggles vibe={props.vibe} onVibe={props.onVibe} fullscreen={props.fullscreen} onFullscreen={props.onFullscreen} /><p className="mt-3 font-cond text-xs text-moss">Les vibrations nécessitent un appareil compatible. Le plein écran dépend des autorisations du navigateur.</p></section>
            </div>}
            {section === "controls" && <div className="space-y-5"><div className="panel"><h3 className="border-b-2 border-line p-3 font-display text-sm text-chalk">CLAVIER ET SOURIS</h3><ul className="divide-y divide-line">{KEYS.map(([key, label]) => <li key={key} className="flex items-center justify-between gap-3 p-3 font-cond text-sm"><span className="text-moss">{label}</span><kbd className="text-right font-bold text-cyan-hot">{key}</kbd></li>)}</ul></div><ThumbMap /><Tips rows={[{ icon: Target, t: "PEINS LE COURT", d: "La couverture verse un bonus à la fin de chaque vague." }, { icon: DoorOpen, t: "FRANCHIS LE PORTAIL", d: "Une fois la vague nettoyée, entre dans le portail pour continuer." }]} /></div>}
          </div>
        </div>
      </div>}
    </div>
  );
}

interface StartProps {
  onStart: () => void;
  onMultiplayer?: () => void;
  multiplayerEnabled?: boolean;
  onProgression?: () => void;
  cloudStatus?: string;
  saveMeta?: { wave: number; score: number; savedAt: number; label: string } | null;
  onResume?: () => void;
  onDeleteSave?: () => void;
  resumeBusy?: boolean;
  rows: ScoreRow[];
  best: number;
  muted: boolean;
  onMute: () => void;
  isTouch: boolean;
  vibe: boolean;
  onVibe: () => void;
  fullscreen: boolean;
  onFullscreen: () => void;
  portrait: boolean;
  musicOn: boolean;
  musicName: string;
  musicMood: string;
  onToggleMusic: () => void;
  onCycleMusic: (dir: number) => void;
  weapon: WeaponId;
  onWeapon: (id: WeaponId) => void;
  onWeaponPreview: (canvas: HTMLCanvasElement | null) => void;
  career: Career;
}

export function StartScreen(props: StartProps) {
  return <MainMenu {...props} />;
}

/* ---------------- pause ---------------- */

export function PauseScreen({
  onResume,
  onRestart,
  onMenu,
  wave,
  score,
  isTouch,
  muted,
  vibe,
  onMute,
  onVibe,
  onSaveQuit,
  saveBusy,
  onFullscreen,
  musicOn,
  onToggleMusic,
}: {
  onResume: () => void;
  onRestart: () => void;
  onMenu: () => void;
  wave: number;
  score: number;
  isTouch: boolean;
  muted: boolean;
  vibe: boolean;
  onMute: () => void;
  onVibe: () => void;
  onSaveQuit?: () => void;
  saveBusy?: boolean;
  onFullscreen?: () => void;
  musicOn?: boolean;
  onToggleMusic?: () => void;
}) {
  return (
    <div className="pause-overlay absolute inset-0 flex items-center justify-center bg-court-900/72 px-3 backdrop-blur-[3px]">
      <div className={"pause-panel panel anim-pop w-full " + (isTouch ? "max-w-[430px]" : "max-w-[420px]")}>
        <div className="stripes h-1.5 w-full opacity-80" />
        <div className={isTouch ? "p-4" : "p-5"}>
          <div className="flex items-center gap-2">
            <Pause className="h-5 w-5 text-cyan-hot" />
            <h2 className="font-display text-2xl text-chalk">PAUSE</h2>
            <span className="ml-auto font-cond text-[11px] font-extrabold tracking-[0.2em] text-moss">
              VAGUE {wave}
            </span>
          </div>
          <p className="mt-1 font-cond text-[12px] font-bold tracking-[0.16em] text-moss">
            {score.toLocaleString()} POINTS SUR LE TABLEAU · LES ADVERSAIRES T'ATTENDENT
          </p>
          <div className={"mt-4 flex flex-col gap-2 " + (isTouch ? "gap-2.5" : "")}>
            <button onClick={onResume} className="btn flex w-full items-center justify-center gap-2 bg-cyan-hot py-3.5 text-base text-court-900">
              <Play className="h-5 w-5 fill-current" /> REPRENDRE
            </button>
            {onSaveQuit && (
              <button onClick={onSaveQuit} disabled={saveBusy} className="btn flex w-full items-center justify-center gap-2 bg-gold py-3 text-sm text-court-900 disabled:opacity-50">
                <Save className="h-4 w-4" /> {saveBusy ? "SAUVEGARDE…" : "SAUVEGARDER ET QUITTER"}
              </button>
            )}
            <div className="flex gap-2">
              <button onClick={onRestart} className="btn flex flex-1 items-center justify-center gap-2 bg-magenta-hot py-3 text-sm text-court-900">
                <RotateCcw className="h-4 w-4" /> REPRENDRE À ZÉRO
              </button>
              <button onClick={onMenu} className="btn flex flex-1 items-center justify-center gap-2 bg-court-600 py-3 text-sm text-chalk">
                <Home className="h-4 w-4" /> QUITTER
              </button>
            </div>
          </div>
          {isTouch ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <MuteBtn muted={muted} onMute={onMute} />
              <Toggle on={vibe} onClick={onVibe} label="VIBRATION" icon={Vibrate} />
              {onFullscreen && <Toggle on={false} onClick={onFullscreen} label="PLEIN ÉCRAN" icon={Maximize} tint="text-gold" />}
              {onToggleMusic && <Toggle on={!!musicOn} onClick={onToggleMusic} label="MUSIQUE" icon={Music} />}
            </div>
          ) : (
            <p className="mt-3 text-center font-cond text-[10px] font-bold tracking-[0.2em] text-moss">
              <span className="text-cyan-hot">P</span> OU <span className="text-cyan-hot">ÉCHAP</span> POUR REPRENDRE ·{" "}
              <span className="text-cyan-hot">R</span> POUR REPARTIR DE ZÉRO
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- game over ---------------- */

export function GameOverScreen({
  result,
  rows,
  savedRank,
  onSave,
  onRestart,
  onMenu,
  isTouch,
  muted,
  onMute,
  cloudStatus,
  onProgression,
  playerName,
}: {
  result: RunResult;
  rows: ScoreRow[];
  savedRank: number | null;
  onSave: (name: string) => void;
  onRestart: () => void;
  onMenu: () => void;
  isTouch: boolean;
  muted: boolean;
  onMute: () => void;
  cloudStatus?: string;
  onProgression?: () => void;
  playerName?: string;
}) {
  const [name, setName] = useState(() => cleanName(playerName || localStorage.getItem("pb.name") || "JOUEUR"));
  const inputRef = useRef<HTMLInputElement>(null);
  const acc = result.shots > 0 ? Math.round((result.hits / result.shots) * 100) : 0;
  const isRecord = rows.length === 0 || result.score >= rows[0].score;

  useEffect(() => {
    if (!isTouch) inputRef.current?.focus();
  }, [isTouch]);

  useEffect(() => {
    if (playerName) setName(cleanName(playerName));
  }, [playerName]);

  const submitScore = () => {
    if (savedRank !== null) return;
    const finalName = cleanName(name);
    setName(finalName);
    localStorage.setItem("pb.name", finalName);
    onSave(finalName);
  };

  return (
    <div className="scroll-thin absolute inset-0 overflow-y-auto bg-court-900/78 backdrop-blur-[2px]">
      <div className="pad-menu-t pad-menu-b mx-auto grid min-h-full max-w-5xl items-center gap-5 p-4 sm:p-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="panel anim-pop relative overflow-hidden">
          <div className="stripes h-1.5 w-full" />
          <Splat className="pointer-events-none absolute -right-10 -top-8 h-40 w-40 opacity-25" color="#ff2f87" />
          <div className="relative p-5">
            <div className="flex items-center gap-2">
              <Skull className="h-5 w-5 text-magenta-hot" />
              <h2 className="font-display text-2xl leading-none text-magenta-hot sm:text-3xl">TU ES SPLATTÉ</h2>
              {isRecord && <span className="slash anim-blink bg-gold px-2 py-[2px] font-display text-[10px] text-court-900">NOUVEAU RECORD</span>}
            </div>
            <div className="mt-3 flex items-end gap-3">
              <div>
                <div className="font-cond text-[10px] font-extrabold tracking-[0.28em] text-moss">SCORE FINAL</div>
                <div
                  className="font-display text-5xl leading-none text-chalk sm:text-6xl"
                  style={{ textShadow: "0 4px 0 #05100d, 0 0 34px rgba(62,232,255,0.4)" }}
                >
                  {result.score.toLocaleString()}
                </div>
              </div>
            </div>
            {onProgression && (
              <button onClick={onProgression} className="panel mt-3 flex w-full items-center gap-2 px-3 py-2 text-left transition hover:border-cyan-hot active:translate-y-0.5">
                {cloudStatus === "guest" || cloudStatus === "account" ? (
                  <Cloud className="h-4 w-4 shrink-0 text-lime-hot" />
                ) : (
                  <CloudOff className="h-4 w-4 shrink-0 text-gold" />
                )}
                <span className="font-cond text-[11px] font-extrabold tracking-[0.16em] text-chalk">
                  {cloudStatus === "guest" || cloudStatus === "account"
                    ? "PARTIE ENVOYÉE AU CLOUD · VOIR MA PROGRESSION"
                    : "SAUVEGARDE LOCALE · ACTIVER LE CLOUD"}
                </span>
              </button>
            )}
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Stat label="VAGUE" value={String(result.wave)} />
              <Stat label="SPLATS" value={String(result.kills)} />
              <Stat label="SÉRIE" value={String(result.maxCombo)} sub="meilleure chaîne" />
              <Stat label="PRÉCISION" value={acc + "%"} sub={`${result.hits}/${result.shots}`} />
              <Stat label="PEINTURE" value={Math.round(result.coverage * 100) + "%"} />
              <Stat label="TEMPS" value={fmtTime(result.time)} />
            </div>

            <div className={"mt-5 flex flex-wrap items-center gap-2 " + (isTouch ? "flex-nowrap" : "")}>
              {isTouch ? (
                <>
                  <button
                    onClick={onRestart}
                    className="btn flex flex-1 items-center justify-center gap-2 bg-cyan-hot py-4 text-base text-court-900"
                  >
                    <RotateCcw className="h-5 w-5" /> REJOUER
                  </button>
                  <button
                    onClick={onMenu}
                    aria-label="Menu"
                    className="btn flex items-center justify-center bg-court-600 px-4 py-4 text-sm text-chalk"
                  >
                    <Home className="h-5 w-5" />
                  </button>
                  <MuteBtn muted={muted} onMute={onMute} />
                </>
              ) : (
                <>
                  <Btn onClick={onRestart} tone="cyan">
                    <span className="flex items-center gap-2">
                      <RotateCcw className="h-4 w-4" /> REJOUER (R)
                    </span>
                  </Btn>
                  <Btn onClick={onMenu} tone="ghost">
                    <span className="flex items-center gap-2">
                      <Home className="h-4 w-4" /> MENU
                    </span>
                  </Btn>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="anim-in flex flex-col gap-4" style={{ animationDelay: "0.06s" }}>
          <div className="panel p-4">
            <h3 className="font-display text-[13px] tracking-wide text-chalk">ENREGISTRER TA PARTIE</h3>
            <p className="mt-1 font-cond text-[11px] font-bold leading-snug tracking-wide text-moss">
              TON NOM SERA COLLÉ À TON SCORE, À TON CLASSEMENT ET À TA PROGRESSION.
            </p>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                ref={inputRef}
                value={name}
                onChange={(e) => setName(e.target.value.replace(/[^\p{L}\p{N} ._-]/gu, "").replace(/\s{2,}/g, " ").slice(0, MAX_NAME_LENGTH))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitScore();
                }}
                maxLength={MAX_NAME_LENGTH}
                placeholder="TON NOM"
                spellCheck={false}
                autoComplete="off"
                autoCorrect="off"
                inputMode="text"
                aria-label="Nom du joueur"
                className="w-full flex-1 border-2 border-line bg-court-700 px-3 py-2 font-display text-lg tracking-[0.08em] text-cyan-hot outline-none transition focus:border-cyan-hot focus:shadow-[0_0_0_3px_rgba(62,232,255,0.16)]"
              />
              <Btn onClick={submitScore} disabled={savedRank !== null} tone={savedRank === null ? "gold" : "ghost"} className="w-full sm:w-auto sm:flex-1">
                <span className="flex items-center justify-center gap-2">
                  <Trophy className="h-4 w-4" /> {savedRank === null ? "ENREGISTRER" : "ENREGISTRÉ"}
                </span>
              </Btn>
            </div>
            <div className="mt-1 flex items-center justify-between font-cond text-[10px] font-bold tracking-[0.14em] text-moss">
              <span>Jusqu’à {MAX_NAME_LENGTH} caractères</span>
              <span className="font-num">{name.length}/{MAX_NAME_LENGTH}</span>
            </div>
            {savedRank !== null && (
              <p className="mt-2 font-cond text-[11px] font-extrabold tracking-[0.18em] text-lime-hot">
                {savedRank < 0
                  ? "PARTIE ENREGISTRÉE — HORS DU TOP 8"
                  : savedRank === 0
                    ? "EN TÊTE DU COURT — RANG #1"
                    : `ENREGISTRÉ — RANG #${savedRank + 1}`}
              </p>
            )}
            {savedRank === null && (
              <p className="mt-2 font-cond text-[11px] font-bold tracking-[0.14em] text-moss">
                Le nom est stocké localement sur cet appareil, et peut aussi être envoyé dans la progression cloud.
              </p>
            )}
          </div>
          <Leaderboard rows={rows} highlight={savedRank !== null && savedRank >= 0 ? savedRank : undefined} />
        </div>
      </div>
    </div>
  );
}
