import React, { useState } from 'react';
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Lock,
  Play,
  Trophy,
  Unlock,
} from 'lucide-react';
import {
  DIFFICULTY_TIERS,
  GameMetadata,
  GameProgressRecord,
  getTierForLevel,
} from '../domain/types';
import { GameIcon } from './VisualRenderers';

interface GameIntroScreenProps {
  game: GameMetadata;
  progress: GameProgressRecord;
  onBackToDashboard: () => void;
  onStartLevel: (levelNumber: number) => void;
  onOpenLevelMap: () => void;
}

export const GameIntroScreen: React.FC<GameIntroScreenProps> = ({
  game,
  progress,
  onBackToDashboard,
  onStartLevel,
  onOpenLevelMap,
}) => {
  const completedCount = progress.completedLevels.length;
  const currentTier = getTierForLevel(progress.unlockedLevel);
  const completionPct = Math.round((completedCount / game.totalLevels) * 1000) / 10;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      <div>
        <button
          type="button"
          onClick={onBackToDashboard}
          className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center gap-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>
      </div>

      {/* Main Intro Card */}
      <div className="p-6 sm:p-10 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-8">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>Discipline 0{game.index}</span>
              <span aria-hidden="true">·</span>
              <span>{game.cognitiveSkill}</span>
              <span aria-hidden="true">·</span>
              <span>1,000 Deterministic Levels</span>
            </div>
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <GameIcon gameId={game.id} className="w-6 h-6" />
              </div>
              <h1 className="text-2xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
                {game.name}
              </h1>
            </div>
            <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed pt-1">
              {game.fullDescription}
            </p>
          </div>

          {/* Primary Actions */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0 min-w-[230px]">
            <button
              type="button"
              onClick={() => onStartLevel(progress.unlockedLevel)}
              className="min-h-[48px] px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>
                {completedCount > 0
                  ? `Continue Level ${progress.unlockedLevel}`
                  : 'Start Level 1'}
              </span>
            </button>
            <button
              type="button"
              onClick={onOpenLevelMap}
              className="min-h-[48px] px-6 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-stone-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <span>Browse 1,000 Levels</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="p-4 rounded-xl bg-stone-50 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800">
            <div className="text-xs text-slate-500 dark:text-slate-400">Completed Progress</div>
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
              {completedCount} / 1000
            </div>
            <div className="text-xs text-slate-500 mt-0.5 tabular-nums">{completionPct}% mastered</div>
          </div>

          <div className="p-4 rounded-xl bg-stone-50 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800">
            <div className="text-xs text-slate-500 dark:text-slate-400">Current Unlocked Level</div>
            <div className="text-2xl font-bold font-mono tabular-nums text-indigo-600 dark:text-indigo-400 mt-1">
              Level {progress.unlockedLevel}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">Ready to play</div>
          </div>

          <div className="p-4 rounded-xl bg-stone-50 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800">
            <div className="text-xs text-slate-500 dark:text-slate-400">Current Difficulty Tier</div>
            <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">
              Tier {currentTier.tier}: {currentTier.name}
            </div>
            <div className="text-xs text-slate-500 font-mono mt-0.5 tabular-nums">
              Levels {currentTier.minLevel}–{currentTier.maxLevel}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-stone-50 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800">
            <div className="text-xs text-slate-500 dark:text-slate-400">Secondary Faculty</div>
            <div className="text-sm font-semibold text-slate-900 dark:text-white mt-1.5">
              {game.secondarySkill}
            </div>
            <div className="text-xs text-slate-500 mt-1">Offline deterministic engine</div>
          </div>
        </div>

        {/* Mechanics & Cognitive Architecture */}
        <div className="space-y-3 pt-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Gameplay Architecture & Cognitive Rules
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {game.mechanicsSummary.map((mech, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-stone-50/40 dark:bg-slate-950/40 space-y-1.5"
              >
                <div className="text-xs font-mono text-indigo-600 dark:text-indigo-400">
                  0{idx + 1}. Core Principle
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {mech}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 10 Difficulty Tiers Overview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            10-Tier Mastery Roadmap (1,000 Levels)
          </h2>
          <button
            type="button"
            onClick={onOpenLevelMap}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Open Full Level Selector →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {DIFFICULTY_TIERS.map((t) => {
            const completedInTier = progress.completedLevels.filter(
              (lvl) => lvl >= t.minLevel && lvl <= t.maxLevel
            ).length;
            const isUnlocked = progress.unlockedLevel >= t.minLevel;

            return (
              <button
                key={t.tier}
                type="button"
                onClick={onOpenLevelMap}
                className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between gap-3 ${
                  isUnlocked
                    ? 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-500'
                    : 'border-slate-200/60 dark:border-slate-800/60 bg-stone-100/50 dark:bg-slate-900/40 opacity-75'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400">
                    <span>Tier {t.tier}</span>
                    <span className="tabular-nums">
                      {t.minLevel}–{t.maxLevel}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                    {t.name}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      style={{ width: `${completedInTier}%` }}
                      className="h-full bg-indigo-600 dark:bg-indigo-500"
                    />
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 tabular-nums">
                    {completedInTier}/100 solved
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

interface LevelSelectionScreenProps {
  game: GameMetadata;
  progress: GameProgressRecord;
  onBackToIntro: () => void;
  onSelectLevel: (levelNumber: number) => void;
}

export const LevelSelectionScreen: React.FC<LevelSelectionScreenProps> = ({
  game,
  progress,
  onBackToIntro,
  onSelectLevel,
}) => {
  const initialTier = getTierForLevel(progress.unlockedLevel).tier;
  const [selectedTier, setSelectedTier] = useState<number>(initialTier);
  const [qaUnlockOverride, setQaUnlockOverride] = useState<boolean>(false);

  const activeTierMeta = DIFFICULTY_TIERS[selectedTier - 1];
  const completedSet = new Set(progress.completedLevels);

  const tierLevels = Array.from(
    { length: 100 },
    (_, i) => activeTierMeta.minLevel + i
  );
  const completedInActiveTier = tierLevels.filter((l) => completedSet.has(l)).length;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToIntro}
            className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center gap-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Game Overview</span>
          </button>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              <span>{game.name}</span>
              <span className="mx-2" aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                {progress.completedLevels.length} / 1000 Completed
              </span>
              <span className="mx-2" aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                Unlocked: Level {progress.unlockedLevel}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Level Progression Map
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setQaUnlockOverride((v) => !v)}
            className={`min-h-[44px] px-3.5 py-2 rounded-xl border text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
              qaUnlockOverride
                ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
            }`}
          >
            <Unlock className="w-3.5 h-3.5" />
            <span>{qaUnlockOverride ? 'Preview All Tiers: ON' : 'Preview Any Tier'}</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectLevel(progress.unlockedLevel)}
            className="min-h-[44px] px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Resume Level {progress.unlockedLevel}</span>
          </button>
        </div>
      </div>

      {/* 10 Difficulty Tier Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2">
        {DIFFICULTY_TIERS.map((t) => {
          const isSelected = t.tier === selectedTier;
          const isTierReached = progress.unlockedLevel >= t.minLevel || qaUnlockOverride;
          const solvedInTier = progress.completedLevels.filter(
            (l) => l >= t.minLevel && l <= t.maxLevel
          ).length;

          return (
            <button
              key={t.tier}
              type="button"
              onClick={() => setSelectedTier(t.tier)}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                isSelected
                  ? 'border-indigo-600 dark:border-indigo-400 bg-indigo-600 text-white'
                  : isTierReached
                  ? 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:border-slate-300'
                  : 'border-slate-200/70 dark:border-slate-800/70 bg-stone-100/70 dark:bg-slate-900/50 text-slate-400 dark:text-slate-500'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span>T{t.tier}</span>
                <span className="tabular-nums">{solvedInTier}/100</span>
              </div>
              <div className="text-xs font-bold truncate mt-0.5">{t.name}</div>
              <div className="text-[10px] font-mono opacity-75 tabular-nums">
                {t.minLevel}–{t.maxLevel}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Tier Banner */}
      <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-indigo-600 dark:text-indigo-400">
            <span>Tier {activeTierMeta.tier} of 10</span>
            <span aria-hidden="true">·</span>
            <span>
              Levels {activeTierMeta.minLevel}–{activeTierMeta.maxLevel}
            </span>
            <span aria-hidden="true">·</span>
            <span>Milestone: {activeTierMeta.milestoneTitle}</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {activeTierMeta.name} Tier — {activeTierMeta.description}
          </h2>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right">
            <div className="text-xs text-slate-500 dark:text-slate-400">Tier Completion</div>
            <div className="text-base font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              {completedInActiveTier} / 100 Levels
            </div>
          </div>
          {completedInActiveTier === 100 && (
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
              <Trophy className="w-5 h-5" />
            </div>
          )}
        </div>
      </div>

      {/* 100 Levels Grid for Active Tier */}
      <div className="grid grid-cols-5 sm:grid-cols-10 gap-2.5">
        {tierLevels.map((lvl) => {
          const isCompleted = completedSet.has(lvl);
          const isCurrentUnlocked = lvl === progress.unlockedLevel;
          const isPlayable =
            isCompleted || lvl <= progress.unlockedLevel || qaUnlockOverride;

          return (
            <button
              key={lvl}
              type="button"
              disabled={!isPlayable}
              onClick={() => onSelectLevel(lvl)}
              className={`min-h-[60px] p-2 rounded-xl border font-mono flex flex-col items-center justify-center gap-1 transition-all ${
                isCurrentUnlocked
                  ? 'border-2 border-indigo-600 dark:border-indigo-400 bg-indigo-600 text-white shadow-sm scale-[1.03] cursor-pointer'
                  : isCompleted
                  ? 'border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 hover:border-emerald-500 cursor-pointer'
                  : isPlayable
                  ? 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:border-indigo-500 cursor-pointer'
                  : 'border-slate-200/60 dark:border-slate-800/50 bg-stone-100/60 dark:bg-slate-900/30 text-slate-400 dark:text-slate-600 cursor-not-allowed'
              }`}
            >
              <span className="text-xs sm:text-sm font-bold tabular-nums">{lvl}</span>
              {isCompleted ? (
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              ) : isCurrentUnlocked ? (
                <span className="text-[9px] uppercase tracking-wider font-sans font-semibold">
                  Next
                </span>
              ) : isPlayable ? (
                <span className="text-[9px] text-slate-400">Open</span>
              ) : (
                <Lock className="w-3 h-3 opacity-50" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
