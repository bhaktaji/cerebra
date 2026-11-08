import {
  AppSettings,
  GameId,
  GameProgressRecord,
  GAMES_CATALOGUE,
  PlayerStatistics,
} from '../domain/types';

const PROGRESS_STORAGE_KEY = 'cerebra_game_progress_v1';
const STATS_STORAGE_KEY = 'cerebra_player_stats_v1';
const SETTINGS_STORAGE_KEY = 'cerebra_app_settings_v1';

export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  targetText: string;
}

export const ACHIEVEMENTS_LIST: AchievementDefinition[] = [
  {
    id: 'first-synapse',
    title: 'First Synapse',
    description: 'Complete your very first cognitive puzzle level across any game.',
    targetText: '1 level completed',
  },
  {
    id: 'polymath-initiate',
    title: 'Polymath Explorer',
    description: 'Complete at least 1 level in all 10 distinct cognitive disciplines.',
    targetText: '10/10 games sampled',
  },
  {
    id: 'centurion-mind',
    title: 'Tier 1 Centurion',
    description: 'Complete 100 total levels across the cognitive suite.',
    targetText: '100 levels completed',
  },
  {
    id: 'flawless-deduction',
    title: 'Flawless Deduction',
    description: 'Solve 10 levels on the first attempt without using hints.',
    targetText: '10 first-try solves',
  },
  {
    id: 'tier-climber',
    title: 'Tier Escalation',
    description: 'Unlock Tier 2 (Level 101+) in any brain game.',
    targetText: 'Reach Level 101',
  },
  {
    id: 'millennium-architect',
    title: 'Millennium Master',
    description: 'Complete 500 total levels across the 10-game catalogue.',
    targetText: '500 levels completed',
  },
];

export function createInitialProgress(): Record<GameId, GameProgressRecord> {
  const map = {} as Record<GameId, GameProgressRecord>;
  for (const game of GAMES_CATALOGUE) {
    map[game.id] = {
      gameId: game.id,
      unlockedLevel: 1,
      completedLevels: [],
      bestScoresByLevel: {},
      lastPlayedLevel: 1,
      lastPlayedAt: 0,
    };
  }
  return map;
}

export function createInitialStatistics(): PlayerStatistics {
  const today = new Date().toISOString().slice(0, 10);
  return {
    totalPlaySessions: 1,
    totalCorrectAttempts: 0,
    totalIncorrectAttempts: 0,
    totalHintsUsed: 0,
    currentDailyStreak: 1,
    longestDailyStreak: 1,
    lastPlayedDateIso: today,
    achievementsUnlocked: [],
  };
}

export function createInitialSettings(): AppSettings {
  return {
    theme: 'light',
    soundEnabled: true,
    hapticsEnabled: true,
  };
}

function clampInt(val: unknown, min: number, max: number, fallback: number): number {
  const num = Number(val);
  if (!Number.isFinite(num)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(num)));
}

export function loadProgress(): Record<GameId, GameProgressRecord> {
  if (typeof window === 'undefined') return createInitialProgress();
  try {
    const raw = window.localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (!raw) return createInitialProgress();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return createInitialProgress();

    const base = createInitialProgress();
    for (const game of GAMES_CATALOGUE) {
      if (Object.prototype.hasOwnProperty.call(parsed, game.id) && parsed[game.id]) {
        const rec = parsed[game.id];
        const validCompleted: number[] = Array.isArray(rec.completedLevels)
          ? Array.from(
              new Set<number>(
                rec.completedLevels
                  .map((n: unknown) => clampInt(n, 1, 1000, -1))
                  .filter((n: number) => n >= 1 && n <= 1000)
              )
            ).sort((a: number, b: number) => a - b)
          : [];

        base[game.id] = {
          gameId: game.id,
          unlockedLevel: clampInt(rec.unlockedLevel, 1, 1000, 1),
          completedLevels: validCompleted,
          bestScoresByLevel:
            rec.bestScoresByLevel && typeof rec.bestScoresByLevel === 'object'
              ? rec.bestScoresByLevel
              : {},
          lastPlayedLevel: clampInt(rec.lastPlayedLevel, 1, 1000, 1),
          lastPlayedAt: clampInt(rec.lastPlayedAt, 0, Number.MAX_SAFE_INTEGER, 0),
        };
      }
    }
    return base;
  } catch {
    return createInitialProgress();
  }
}

export function saveProgress(progress: Record<GameId, GameProgressRecord>): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
  } catch {}
}

export function loadStatistics(): PlayerStatistics {
  if (typeof window === 'undefined') return createInitialStatistics();
  try {
    const raw = window.localStorage.getItem(STATS_STORAGE_KEY);
    if (!raw) return createInitialStatistics();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return createInitialStatistics();

    const today = new Date().toISOString().slice(0, 10);
    let currentStreak = clampInt(parsed.currentDailyStreak, 1, 100000, 1);
    let longestStreak = clampInt(parsed.longestDailyStreak, 1, 100000, 1);

    if (
      typeof parsed.lastPlayedDateIso === 'string' &&
      /^\d{4}-\d{2}-\d{2}$/.test(parsed.lastPlayedDateIso) &&
      parsed.lastPlayedDateIso !== today
    ) {
      const prev = new Date(parsed.lastPlayedDateIso);
      const curr = new Date(today);
      const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        currentStreak += 1;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else if (diffDays > 1) {
        currentStreak = 1;
      }
    }

    const validAchievementIds = new Set(ACHIEVEMENTS_LIST.map((a) => a.id));
    const sanitizedAchievements = Array.isArray(parsed.achievementsUnlocked)
      ? parsed.achievementsUnlocked.filter(
          (id: unknown) => typeof id === 'string' && validAchievementIds.has(id)
        )
      : [];

    return {
      totalPlaySessions: clampInt(parsed.totalPlaySessions, 1, 1000000, 1),
      totalCorrectAttempts: clampInt(parsed.totalCorrectAttempts, 0, 10000000, 0),
      totalIncorrectAttempts: clampInt(parsed.totalIncorrectAttempts, 0, 10000000, 0),
      totalHintsUsed: clampInt(parsed.totalHintsUsed, 0, 10000000, 0),
      currentDailyStreak: currentStreak,
      longestDailyStreak: longestStreak,
      lastPlayedDateIso: today,
      achievementsUnlocked: sanitizedAchievements,
    };
  } catch {
    return createInitialStatistics();
  }
}

export function saveStatistics(stats: PlayerStatistics): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
  } catch {}
}

export function loadSettings(): AppSettings {
  if (typeof window === 'undefined') return createInitialSettings();
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return createInitialSettings();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return createInitialSettings();
    return {
      theme: parsed.theme === 'dark' ? 'dark' : 'light',
      soundEnabled: parsed.soundEnabled !== false,
      hapticsEnabled: parsed.hapticsEnabled !== false,
    };
  } catch {
    return createInitialSettings();
  }
}

export function saveSettings(settings: AppSettings): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {}
}

export function applyThemeToDocument(theme: 'light' | 'dark'): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

export function evaluateAchievements(
  progress: Record<GameId, GameProgressRecord>,
  stats: PlayerStatistics
): string[] {
  const unlocked = new Set<string>(stats.achievementsUnlocked);
  const allRecords = Object.values(progress);

  const totalCompleted = allRecords.reduce((acc, r) => acc + r.completedLevels.length, 0);
  const gamesStarted = allRecords.filter((r) => r.completedLevels.length > 0).length;
  const maxUnlocked = Math.max(...allRecords.map((r) => r.unlockedLevel));

  let flawlessCount = 0;
  for (const r of allRecords) {
    for (const score of Object.values(r.bestScoresByLevel)) {
      if (score.attempts === 1 && score.hintsUsed === 0) {
        flawlessCount++;
      }
    }
  }

  if (totalCompleted >= 1) unlocked.add('first-synapse');
  if (gamesStarted >= 10) unlocked.add('polymath-initiate');
  if (totalCompleted >= 100) unlocked.add('centurion-mind');
  if (flawlessCount >= 10) unlocked.add('flawless-deduction');
  if (maxUnlocked >= 101) unlocked.add('tier-climber');
  if (totalCompleted >= 500) unlocked.add('millennium-architect');

  return Array.from(unlocked);
}
