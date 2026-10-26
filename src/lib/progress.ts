import { concepts } from '../data/curriculum';
import type { AgeBand } from '../data/curriculum';

export const STORAGE_KEY = 'little-world-progress-v1';
export type DayProgress = { words: string[]; sessions: number };
export type Progress = {
  version: 1;
  ageBand: AgeBand;
  sound: boolean;
  dailyGoal: number;
  discovered: string[];
  attempts: Record<string, { correct: number; total: number }>;
  days: Record<string, DayProgress>;
};

export function freshProgress(): Progress {
  return {
    version: 1,
    ageBand: '5-6',
    sound: true,
    dailyGoal: 6,
    discovered: [],
    attempts: {},
    days: {},
  };
}

export function localDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

const validIds = new Set(concepts.map((item) => item.id));
const cleanIds = (value: unknown): string[] =>
  Array.isArray(value)
    ? [...new Set(value.filter((id): id is string => typeof id === 'string' && validIds.has(id)))]
    : [];
const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value && typeof value === 'object' && !Array.isArray(value));
const count = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
const isCalendarDate = (value: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

export function parseProgress(raw: string | null): Progress {
  const base = freshProgress();
  if (!raw) return base;
  try {
    const data: unknown = JSON.parse(raw);
    if (!isRecord(data) || data.version !== 1) return base;
    if (data.ageBand === '3-4' || data.ageBand === '5-6' || data.ageBand === '7-8')
      base.ageBand = data.ageBand;
    if (typeof data.sound === 'boolean') base.sound = data.sound;
    if (data.dailyGoal === 6 || data.dailyGoal === 12 || data.dailyGoal === 18)
      base.dailyGoal = data.dailyGoal;
    base.discovered = cleanIds(data.discovered);
    if (isRecord(data.attempts))
      for (const [id, attempt] of Object.entries(data.attempts)) {
        if (validIds.has(id) && isRecord(attempt)) {
          const total = count(attempt.total);
          base.attempts[id] = { total, correct: Math.min(total, count(attempt.correct)) };
        }
      }
    if (isRecord(data.days))
      for (const [day, value] of Object.entries(data.days)) {
        if (isCalendarDate(day) && isRecord(value)) {
          base.days[day] = { words: cleanIds(value.words), sessions: count(value.sessions) };
        }
      }
    return base;
  } catch {
    return base;
  }
}

export function recordDiscovery(progress: Progress, id: string): Progress {
  if (!validIds.has(id) || progress.discovered.includes(id)) return progress;
  return { ...progress, discovered: [...progress.discovered, id] };
}

export function recordAnswer(
  progress: Progress,
  id: string,
  correct: boolean,
  date = new Date(),
): Progress {
  if (!validIds.has(id)) return progress;
  const day = localDate(date);
  const previous = progress.attempts[id] ?? { total: 0, correct: 0 };
  const today = progress.days[day] ?? { words: [], sessions: 0 };
  const words = correct ? [...new Set([...today.words, id])] : today.words;
  return {
    ...progress,
    discovered: [...new Set([...progress.discovered, id])],
    attempts: {
      ...progress.attempts,
      [id]: { total: previous.total + 1, correct: previous.correct + Number(correct) },
    },
    days: { ...progress.days, [day]: { ...today, words } },
  };
}

export function recordSession(progress: Progress, date = new Date()): Progress {
  const day = localDate(date);
  const today = progress.days[day] ?? { words: [], sessions: 0 };
  return {
    ...progress,
    days: { ...progress.days, [day]: { ...today, sessions: today.sessions + 1 } },
  };
}

export function dayStreak(progress: Progress, date = new Date()): number {
  const cursor = new Date(date);
  if (!(progress.days[localDate(cursor)]?.sessions > 0)) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (progress.days[localDate(cursor)]?.sessions > 0) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
