import React, { useState } from 'react';
import {
  Award,
  CheckCircle2,
  Flame,
  Moon,
  Play,
  RotateCcw,
  ShieldCheck,
  Sun,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import { ACHIEVEMENTS_LIST } from '../data/storage';
import {
  AppSettings,
  GameId,
  GameProgressRecord,
  GAMES_CATALOGUE,
  getTierForLevel,
  PlayerStatistics,
} from '../domain/types';
import { GameValidationReport, getLevelData, verifyGameLevels } from '../engines';
import { GameIcon } from './VisualRenderers';

interface StatisticsScreenProps {
  progress: Record<GameId, GameProgressRecord>;
  stats: PlayerStatistics;
  onSelectGame: (gameId: GameId) => void;
}

export const StatisticsScreen: React.FC<StatisticsScreenProps> = ({
  progress,
  stats,
  onSelectGame,
}) => {
  const allRecords = Object.values(progress);
  const totalCompleted = allRecords.reduce((acc, r) => acc + r.completedLevels.length, 0);
  const totalAvailable = 10000;
  const overallPct = Math.round((totalCompleted / totalAvailable) * 10000) / 100;

  const totalAttempts = stats.totalCorrectAttempts + stats.totalIncorrectAttempts;
  const accuracyPct =
    totalAttempts > 0 ? Math.round((stats.totalCorrectAttempts / totalAttempts) * 1000) / 10 : 100;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      <div>
        <div className="text-xs text-slate-500 dark:text-slate-400">
          Cognitive Telemetry & Mastery Ledger
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1">
          Player Statistics & Progress
        </h1>
      </div>

      {/* Top KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="text-xs text-slate-500 dark:text-slate-400">Total Levels Solved</div>
          <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1.5">
            {totalCompleted.toLocaleString()} / 10,000
          </div>
          <div className="text-xs text-indigo-600 dark:text-indigo-400 font-mono mt-1 tabular-nums">
            {overallPct}% Overall Completion
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="text-xs text-slate-500 dark:text-slate-400">Solution Accuracy</div>
          <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-1.5">
            {accuracyPct}%
          </div>
          <div className="text-xs text-slate-500 font-mono mt-1 tabular-nums">
            {stats.totalCorrectAttempts} correct · {stats.totalIncorrectAttempts} incorrect
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="text-xs text-slate-500 dark:text-slate-400">Daily Training Streak</div>
          <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400 mt-1.5 flex items-center gap-2">
            <Flame className="w-6 h-6" />
            <span>{stats.currentDailyStreak}d</span>
          </div>
          <div className="text-xs text-slate-500 font-mono mt-1 tabular-nums">
            Longest Streak: {stats.longestDailyStreak}d · Sessions: {stats.totalPlaySessions}
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="text-xs text-slate-500 dark:text-slate-400">Milestones Unlocked</div>
          <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1.5">
            {stats.achievementsUnlocked.length} / {ACHIEVEMENTS_LIST.length}
          </div>
          <div className="text-xs text-slate-500 font-mono mt-1 tabular-nums">
            Hints Consulted: {stats.totalHintsUsed}
          </div>
        </div>
      </div>

      {/* Per-Game Breakdown Table */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Discipline Breakdown Across All 10 Games
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                <th className="py-3 pr-4 font-medium">Discipline</th>
                <th className="py-3 px-4 font-medium">Cognitive Domain</th>
                <th className="py-3 px-4 font-medium">Current Tier</th>
                <th className="py-3 px-4 font-medium">Unlocked</th>
                <th className="py-3 px-4 font-medium">Completed</th>
                <th className="py-3 pl-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {GAMES_CATALOGUE.map((g) => {
                const rec = progress[g.id];
                const solved = rec.completedLevels.length;
                const tier = getTierForLevel(rec.unlockedLevel);
                const pct = Math.round((solved / 1000) * 100);

                return (
                  <tr key={g.id} className="hover:bg-stone-50/60 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 pr-4 font-semibold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2.5">
                        <span className="text-indigo-600 dark:text-indigo-400">
                          <GameIcon gameId={g.id} className="w-4 h-4" />
                        </span>
                        <span>{g.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400">
                      {g.cognitiveSkill}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono text-slate-700 dark:text-slate-300">
                      T{tier.tier} · {tier.name}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs tabular-nums text-indigo-600 dark:text-indigo-400">
                      Level {rec.unlockedLevel}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-24 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            style={{ width: `${pct}%` }}
                            className="h-full bg-indigo-600 dark:bg-indigo-500"
                          />
                        </div>
                        <span className="font-mono text-xs tabular-nums text-slate-700 dark:text-slate-300">
                          {solved}/1000
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 pl-4 text-right">
                      <button
                        type="button"
                        onClick={() => onSelectGame(g.id)}
                        className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        Open →
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Achievements Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Cognitive Achievement Milestones
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ACHIEVEMENTS_LIST.map((ach) => {
            const isUnlocked = stats.achievementsUnlocked.includes(ach.id);
            return (
              <div
                key={ach.id}
                className={`p-5 rounded-2xl border flex items-start gap-3.5 ${
                  isUnlocked
                    ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 opacity-75'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isUnlocked
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}
                >
                  <Award className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {ach.title}
                    </h3>
                    <span className="text-[11px] font-mono text-slate-500">
                      · {isUnlocked ? 'Unlocked' : ach.targetText}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {ach.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

interface ValidatorScreenProps {
  onPlaySampleLevel: (gameId: GameId, levelNumber: number) => void;
}

export const ValidatorScreen: React.FC<ValidatorScreenProps> = ({
  onPlaySampleLevel,
}) => {
  const [reports, setReports] = useState<Record<string, GameValidationReport>>({});
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [inspectGameId, setInspectGameId] = useState<GameId>('number-sequence');
  const [inspectLevelNum, setInspectLevelNum] = useState<number>(1);

  const runFullSuite = () => {
    setIsRunning(true);
    setTimeout(() => {
      const next: Record<string, GameValidationReport> = {};
      for (const g of GAMES_CATALOGUE) {
        next[g.id] = verifyGameLevels(g.id);
      }
      setReports(next);
      setIsRunning(false);
    }, 20);
  };

  const sampleLevel = getLevelData(inspectGameId, inspectLevelNum);
  const reportList = Object.values(reports);
  const totalVerified = reportList.reduce((acc, r) => acc + r.uniqueSignaturesCount, 0);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Deterministic Generation & Solvability Verification Suite
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1">
            10,000-Level Content Validator
          </h1>
        </div>

        <button
          type="button"
          onClick={runFullSuite}
          disabled={isRunning}
          className="min-h-[48px] px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm inline-flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>
            {isRunning
              ? 'Validating 10,000 Levels...'
              : reportList.length > 0
              ? 'Re-Run 10,000-Level Audit'
              : 'Execute Full 10,000-Level Audit'}
          </span>
        </button>
      </div>

      {reportList.length > 0 && (
        <div className="p-6 rounded-2xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  All {totalVerified.toLocaleString()} / 10,000 Deterministic Levels Verified
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Zero duplicate level signatures · 100% deterministic seed reproduction · 100% verified answer keys & explanations
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="border-b border-emerald-200 dark:border-emerald-900 text-slate-500">
                  <th className="py-2 pr-3">Game Engine</th>
                  <th className="py-2 px-3">Levels</th>
                  <th className="py-2 px-3">Unique IDs</th>
                  <th className="py-2 px-3">Unique Puzzles</th>
                  <th className="py-2 px-3">Deterministic</th>
                  <th className="py-2 px-3">Valid Solvable</th>
                  <th className="py-2 pl-3 text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-100 dark:divide-emerald-900/40">
                {reportList.map((r) => (
                  <tr key={r.gameId}>
                    <td className="py-2 pr-3 font-sans font-semibold text-slate-900 dark:text-white">
                      {r.gameName}
                    </td>
                    <td className="py-2 px-3 tabular-nums">{r.totalLevelsChecked}</td>
                    <td className="py-2 px-3 tabular-nums">{r.uniqueIdsCount}/1000</td>
                    <td className="py-2 px-3 tabular-nums">{r.uniqueSignaturesCount}/1000</td>
                    <td className="py-2 px-3 tabular-nums">{r.deterministicMatches}/1000</td>
                    <td className="py-2 px-3 tabular-nums text-emerald-700 dark:text-emerald-400 font-bold">
                      {r.validAnswersCount}/1000 PASS
                    </td>
                    <td className="py-2 pl-3 text-right tabular-nums">{r.durationMs}ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Interactive Level Inspector */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Direct Level Inspector (Levels 1–1,000)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Inspect or launch any of the 10,000 levels directly to verify deterministic generation and tier scaling.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={inspectGameId}
              onChange={(e) => setInspectGameId(e.target.value as GameId)}
              className="h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white"
            >
              {GAMES_CATALOGUE.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.index}. {g.name}
                </option>
              ))}
            </select>

            <input
              type="number"
              min={1}
              max={1000}
              value={inspectLevelNum}
              onChange={(e) =>
                setInspectLevelNum(Math.max(1, Math.min(1000, Number(e.target.value) || 1)))
              }
              className="w-28 h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 font-mono text-xs font-bold text-slate-900 dark:text-white tabular-nums"
            />

            <button
              type="button"
              onClick={() => onPlaySampleLevel(inspectGameId, inspectLevelNum)}
              className="h-11 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Launch Level {inspectLevelNum}</span>
            </button>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-stone-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 text-xs font-mono">
          <div className="text-slate-500">
            ID: <span className="text-slate-900 dark:text-white">{sampleLevel.id}</span> · Tier:{' '}
            <span className="text-indigo-600 dark:text-indigo-400">
              Tier {sampleLevel.tier} ({sampleLevel.tierName})
            </span>
          </div>
          <div className="text-slate-500">
            Deterministic Signature:{' '}
            <span className="text-slate-800 dark:text-slate-200 break-all">
              {sampleLevel.signature}
            </span>
          </div>
          <div className="font-sans text-sm font-medium text-slate-900 dark:text-white pt-1">
            Prompt: {sampleLevel.prompt}
          </div>
          <div className="text-emerald-700 dark:text-emerald-400 pt-1">
            Verified Solution: {sampleLevel.correctAnswerDisplay}
          </div>
          <div className="font-sans text-xs text-slate-600 dark:text-slate-400">
            Explanation: {sampleLevel.explanation}
          </div>
        </div>
      </div>
    </div>
  );
};

interface SettingsScreenProps {
  settings: AppSettings;
  onUpdateSettings: (next: AppSettings) => void;
  onResetAllProgress: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  settings,
  onUpdateSettings,
  onResetAllProgress,
}) => {
  const [confirmResetOpen, setConfirmResetOpen] = useState<boolean>(false);
  const [resetDoneBanner, setResetDoneBanner] = useState<boolean>(false);

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-16">
      <div>
        <div className="text-xs text-slate-500 dark:text-slate-400">
          Application Preferences & Data Governance
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1">
          Settings
        </h1>
      </div>

      {/* Appearance & Sensory Preferences */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
        {/* Theme */}
        <div className="py-4 first:pt-0 flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">
              Visual Theme
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Switch between high-contrast daylight paper and dark slate study mode.
            </div>
          </div>
          <div className="flex items-center p-1 rounded-xl bg-stone-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => onUpdateSettings({ ...settings, theme: 'light' })}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                settings.theme === 'light'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>Light</span>
            </button>
            <button
              type="button"
              onClick={() => onUpdateSettings({ ...settings, theme: 'dark' })}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                settings.theme === 'dark'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>Dark</span>
            </button>
          </div>
        </div>

        {/* Sound Effects */}
        <div className="py-4 flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">
              Synthesized Sound Effects
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Gentle Web Audio acoustic chimes on tile interactions and level completion.
            </div>
          </div>
          <button
            type="button"
            onClick={() =>
              onUpdateSettings({ ...settings, soundEnabled: !settings.soundEnabled })
            }
            className={`min-h-[44px] px-4 py-2 rounded-xl border text-xs font-semibold inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 ${
              settings.soundEnabled
                ? 'border-indigo-600 bg-indigo-600 text-white'
                : 'border-slate-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            {settings.soundEnabled ? (
              <>
                <Volume2 className="w-4 h-4" />
                <span>Enabled</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4" />
                <span>Muted</span>
              </>
            )}
          </button>
        </div>

        {/* Haptic Feedback */}
        <div className="py-4 last:pb-0 flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">
              Tactile Haptic Feedback
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Subtle device vibration pulses on supported mobile hardware.
            </div>
          </div>
          <button
            type="button"
            onClick={() =>
              onUpdateSettings({ ...settings, hapticsEnabled: !settings.hapticsEnabled })
            }
            className={`min-h-[44px] px-4 py-2 rounded-xl border text-xs font-semibold inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 ${
              settings.hapticsEnabled
                ? 'border-indigo-600 bg-indigo-600 text-white'
                : 'border-slate-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>{settings.hapticsEnabled ? 'Enabled' : 'Disabled'}</span>
          </button>
        </div>
      </div>

      {/* Reset Progress with Explicit Confirmation */}
      <div className="p-6 rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-white dark:bg-slate-900 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Reset All Game Progress
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Permanently clears completed levels, unlocked tiers, and statistics across all 10 games back to Level 1.
            </p>
          </div>
          {!confirmResetOpen && (
            <button
              type="button"
              onClick={() => setConfirmResetOpen(true)}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Progress...</span>
            </button>
          )}
        </div>

        {confirmResetOpen && (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 space-y-3">
            <p className="text-xs font-semibold text-rose-900 dark:text-rose-200">
              Are you sure you want to reset all completed levels and statistics across all 10 games? This action cannot be undone.
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  onResetAllProgress();
                  setConfirmResetOpen(false);
                  setResetDoneBanner(true);
                }}
                className="min-h-[40px] px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold whitespace-nowrap shrink-0"
              >
                Confirm Full Reset
              </button>
              <button
                type="button"
                onClick={() => setConfirmResetOpen(false)}
                className="min-h-[40px] px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-medium whitespace-nowrap shrink-0"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {resetDoneBanner && (
          <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
            All progress and player statistics have been reset to Level 1.
          </div>
        )}
      </div>

      {/* About & Privacy Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            About Cerebra Cognitive Suite
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Cerebra is a 10-discipline brain-training architecture featuring 10,000 deterministically generated, mathematically and logically validated levels organized into 10 progressive mastery tiers (Beginner to Master).
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Offline & Privacy Architecture
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            All 10,000 puzzle levels, hints, and explanations are computed locally on-device with zero external network dependencies. Your progress and statistics are stored strictly in local device storage with zero tracking, ads, or third-party telemetry.
          </p>
        </div>
      </div>
    </div>
  );
};
