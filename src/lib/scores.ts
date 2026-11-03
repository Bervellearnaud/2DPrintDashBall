export interface ScoreRow {
  name: string;
  score: number;
  wave: number;
  kills: number;
  coverage: number;
  date: number;
}

const KEY = "pb2d.scores.v1";

/** Même longueur que le pseudo cloud Supabase (profiles.display_name). */
export const MAX_NAME_LENGTH = 16;

export function cleanName(raw: unknown, fallback = "JOUEUR"): string {
  const s = String(raw ?? "")
    .replace(/[^\p{L}\p{N} ._-]/gu, "")
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, MAX_NAME_LENGTH);
  return s || fallback;
}

const clamp01 = (v: unknown) => Math.max(0, Math.min(1, Number(v) || 0));

export function loadScores(): ScoreRow[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((r) => r && typeof r.score === "number")
      .map((r) => ({
        name: cleanName(r.name, "JOUEUR"),
        score: Math.floor(r.score),
        wave: Math.floor(r.wave ?? 0),
        kills: Math.floor(r.kills ?? 0),
        coverage: clamp01(r.coverage),
        date: Number(r.date ?? 0),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
  } catch {
    return [];
  }
}

export function saveScore(row: ScoreRow): { rows: ScoreRow[]; rank: number } {
  const entry: ScoreRow = {
    ...row,
    name: cleanName(row.name),
    score: Math.max(0, Math.floor(row.score)),
    wave: Math.max(0, Math.floor(row.wave)),
    kills: Math.max(0, Math.floor(row.kills)),
    coverage: clamp01(row.coverage),
    date: row.date || Date.now(),
  };
  const rows = [...loadScores(), entry].sort((a, b) => b.score - a.score).slice(0, 8);
  try {
    localStorage.setItem(KEY, JSON.stringify(rows));
  } catch {
    /* storage may be unavailable */
  }
  const rank = rows.findIndex((r) => r.date === entry.date && r.score === entry.score && r.name === entry.name) + 1;
  return { rows, rank };
}

export function bestScore(rows: ScoreRow[]) {
  return rows.length ? rows[0].score : 0;
}

export const fmtTime = (t: number) => {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
};

/* ---------------- Carrière locale (déblocages hors ligne) ---------------- */

export interface LocalCareer {
  best_wave: number;
  total_score: number;
  games_played: number;
}

const CAREER_KEY = "pb2d.career.v1";

export function loadLocalCareer(): LocalCareer {
  try {
    const raw = localStorage.getItem(CAREER_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<LocalCareer>) : null;
    const num = (v: unknown) => (Number.isFinite(Number(v)) ? Math.max(0, Math.floor(Number(v))) : 0);
    return {
      best_wave: num(parsed?.best_wave),
      total_score: num(parsed?.total_score),
      games_played: num(parsed?.games_played),
    };
  } catch {
    return { best_wave: 0, total_score: 0, games_played: 0 };
  }
}

export function recordLocalCareer(score: number, wave: number): LocalCareer {
  const prev = loadLocalCareer();
  const next: LocalCareer = {
    best_wave: Math.max(prev.best_wave, Math.max(0, Math.floor(wave))),
    total_score: prev.total_score + Math.max(0, Math.floor(score)),
    games_played: prev.games_played + 1,
  };
  try {
    localStorage.setItem(CAREER_KEY, JSON.stringify(next));
  } catch {
    /* stockage indisponible */
  }
  return next;
}
