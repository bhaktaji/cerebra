/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  BarChart3,
  ChevronRight,
  Code2,
  Compass,
  Maximize2,
  Play,
  Settings,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import {
  AndroidProjectModal,
  AndroidSystemStatusBar,
  OfflineIndicator,
  PWAInstallButton,
} from './components/AndroidAppShell';
import { GameIntroScreen, LevelSelectionScreen } from './components/GameScreens';
import { GameplayScreen } from './components/GameplayScreen';
import {
  SettingsScreen,
  StatisticsScreen,
  ValidatorScreen,
} from './components/StatsAndSettingsScreens';
import { GameIcon } from './components/VisualRenderers';
import {
  applyThemeToDocument,
  createInitialProgress,
  createInitialStatistics,
  evaluateAchievements,
  loadProgress,
  loadSettings,
  loadStatistics,
  saveProgress,
  saveSettings,
  saveStatistics,
} from './data/storage';
import { feedback } from './domain/sound';
import {
  AppSettings,
  GameId,
  GameProgressRecord,
  GAMES_CATALOGUE,
  getTierForLevel,
  PlayerStatistics,
} from './domain/types';
import { getLevelData } from './engines';

type ScreenView =
  | 'dashboard'
  | 'game-intro'
  | 'level-select'
  | 'gameplay'
  | 'statistics'
  | 'validator'
  | 'settings';

type DomainFilter = 'all' | 'quantitative' | 'visual' | 'verbal';

export default function App() {
  const [progress, setProgress] = useState<Record<GameId, GameProgressRecord>>(() =>
    loadProgress()
  );
  const [stats, setStats] = useState<PlayerStatistics>(() => loadStatistics());
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());

  const [currentView, setCurrentView] = useState<ScreenView>('dashboard');
  const [activeGameId, setActiveGameId] = useState<GameId>('number-sequence');
  const [activeLevelNumber, setActiveLevelNumber] = useState<number>(1);
  const [domainFilter, setDomainFilter] = useState<DomainFilter>('all');

  // Android Viewport Shell Mode: 'adaptive' (full desktop/mobile responsive) or 'phone-frame' (Material 3 Android device frame preview)
  const [androidShellMode, setAndroidShellMode] = useState<'adaptive' | 'phone-frame'>('adaptive');
  const [androidModalOpen, setAndroidModalOpen] = useState<boolean>(false);

  useEffect(() => {
    applyThemeToDocument(settings.theme);
  }, [settings.theme]);

  const handleUpdateSettings = useCallback((next: AppSettings) => {
    setSettings(next);
    saveSettings(next);
    applyThemeToDocument(next.theme);
  }, []);

  const handleResetAllProgress = useCallback(() => {
    const freshProgress = createInitialProgress();
    const freshStats = createInitialStatistics();
    setProgress(freshProgress);
    setStats(freshStats);
    saveProgress(freshProgress);
    saveStatistics(freshStats);
  }, []);

  // Android Hardware / Gesture Back Navigation handler
  const handleAndroidBack = useCallback(() => {
    feedback.playTap(settings.soundEnabled, settings.hapticsEnabled);
    if (currentView === 'gameplay') {
      setCurrentView('level-select');
    } else if (currentView === 'level-select') {
      setCurrentView('game-intro');
    } else if (currentView !== 'dashboard') {
      setCurrentView('dashboard');
    }
  }, [currentView, settings.soundEnabled, settings.hapticsEnabled]);

  const continueTarget = useMemo(() => {
    const records = Object.values(progress);
    const sorted = [...records].sort((a, b) => b.lastPlayedAt - a.lastPlayedAt);
    const best = sorted[0];
    const gameMeta =
      GAMES_CATALOGUE.find((g) => g.id === best.gameId) || GAMES_CATALOGUE[0];
    const targetLevel =
      best.lastPlayedAt > 0
        ? best.unlockedLevel
        : progress['number-sequence'].unlockedLevel;
    return {
      game: gameMeta,
      levelNumber: targetLevel,
    };
  }, [progress]);

  const totalCompleted = useMemo(
    () =>
      Object.values(progress).reduce(
        (acc, r) => acc + r.completedLevels.length,
        0
      ),
    [progress]
  );

  const filteredGames = useMemo(() => {
    if (domainFilter === 'all') return GAMES_CATALOGUE;
    if (domainFilter === 'quantitative') {
      return GAMES_CATALOGUE.filter((g) =>
        ['number-sequence', 'math-mystery', 'logic-detective', 'odd-one-out'].includes(g.id)
      );
    }
    if (domainFilter === 'visual') {
      return GAMES_CATALOGUE.filter((g) =>
        ['pattern-matrix', 'memory-master', 'spatial-intelligence'].includes(g.id)
      );
    }
    return GAMES_CATALOGUE.filter((g) =>
      ['word-connections', 'lateral-thinking', 'mind-investigator'].includes(g.id)
    );
  }, [domainFilter]);

  const handleOpenGameIntro = useCallback(
    (gameId: GameId) => {
      feedback.playTap(settings.soundEnabled, settings.hapticsEnabled);
      setActiveGameId(gameId);
      setCurrentView('game-intro');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [settings.soundEnabled, settings.hapticsEnabled]
  );

  const handleOpenLevelSelect = useCallback(
    (gameId: GameId) => {
      feedback.playTap(settings.soundEnabled, settings.hapticsEnabled);
      setActiveGameId(gameId);
      setCurrentView('level-select');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [settings.soundEnabled, settings.hapticsEnabled]
  );

  const handleStartLevel = useCallback(
    (gameId: GameId, levelNumber: number) => {
      feedback.playTap(settings.soundEnabled, settings.hapticsEnabled);
      setActiveGameId(gameId);
      setActiveLevelNumber(Math.max(1, Math.min(1000, levelNumber)));
      setCurrentView('gameplay');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [settings.soundEnabled, settings.hapticsEnabled]
  );

  const handleRecordAttempt = useCallback(
    ({
      gameId,
      levelNumber,
      isCorrect,
      attemptsOnThisLevel,
      hintsUsedOnThisLevel,
    }: {
      gameId: GameId;
      levelNumber: number;
      isCorrect: boolean;
      attemptsOnThisLevel: number;
      hintsUsedOnThisLevel: number;
    }) => {
      setProgress((prevProgress) => {
        const nextProgress = { ...prevProgress };
        const rec = { ...nextProgress[gameId] };
        rec.lastPlayedLevel = levelNumber;
        rec.lastPlayedAt = Date.now();

        if (isCorrect) {
          if (!rec.completedLevels.includes(levelNumber)) {
            rec.completedLevels = [...rec.completedLevels, levelNumber].sort(
              (a, b) => a - b
            );
          }
          if (levelNumber >= rec.unlockedLevel && levelNumber < 1000) {
            rec.unlockedLevel = levelNumber + 1;
          }
          const existingBest = rec.bestScoresByLevel[levelNumber];
          if (
            !existingBest ||
            attemptsOnThisLevel < existingBest.attempts ||
            hintsUsedOnThisLevel < existingBest.hintsUsed
          ) {
            rec.bestScoresByLevel = {
              ...rec.bestScoresByLevel,
              [levelNumber]: {
                attempts: attemptsOnThisLevel,
                hintsUsed: hintsUsedOnThisLevel,
                timestamp: Date.now(),
              },
            };
          }
        }

        nextProgress[gameId] = rec;
        saveProgress(nextProgress);

        setStats((prevStats) => {
          const nextStats: PlayerStatistics = {
            ...prevStats,
            totalCorrectAttempts:
              prevStats.totalCorrectAttempts + (isCorrect ? 1 : 0),
            totalIncorrectAttempts:
              prevStats.totalIncorrectAttempts + (isCorrect ? 0 : 1),
            totalHintsUsed:
              prevStats.totalHintsUsed + (isCorrect ? hintsUsedOnThisLevel : 0),
          };
          nextStats.achievementsUnlocked = evaluateAchievements(
            nextProgress,
            nextStats
          );
          saveStatistics(nextStats);
          return nextStats;
        });

        return nextProgress;
      });
    },
    []
  );

  const activeGameMeta = useMemo(
    () => GAMES_CATALOGUE.find((g) => g.id === activeGameId) || GAMES_CATALOGUE[0],
    [activeGameId]
  );

  const activeLevelData = useMemo(
    () => getLevelData(activeGameId, activeLevelNumber),
    [activeGameId, activeLevelNumber]
  );

  const isPhoneFrame = androidShellMode === 'phone-frame';

  return (
    <div className="min-h-screen flex flex-col bg-stone-100/80 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <OfflineIndicator />
      <AndroidProjectModal
        isOpen={androidModalOpen}
        onClose={() => setAndroidModalOpen(false)}
      />

      {/* Top Bar Contract: 3 Zones separated by gap-8 */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-8 px-4 sm:px-8 h-14 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
        {/* Zone 1: Single text element wordmark */}
        <button
          type="button"
          onClick={() => setCurrentView('dashboard')}
          className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white font-display whitespace-nowrap shrink-0 cursor-pointer"
        >
          Cerebra
        </button>

        {/* Zone 2: 4–5 concise single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
          <button
            type="button"
            onClick={() => setCurrentView('dashboard')}
            className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              currentView === 'dashboard'
                ? 'text-indigo-600 dark:text-indigo-400 underline underline-offset-4'
                : ''
            }`}
          >
            Dashboard
          </button>
          <button
            type="button"
            onClick={() => setCurrentView('statistics')}
            className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              currentView === 'statistics'
                ? 'text-indigo-600 dark:text-indigo-400 underline underline-offset-4'
                : ''
            }`}
          >
            Statistics
          </button>
          <button
            type="button"
            onClick={() => setCurrentView('validator')}
            className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              currentView === 'validator'
                ? 'text-indigo-600 dark:text-indigo-400 underline underline-offset-4'
                : ''
            }`}
          >
            Validator
          </button>
          <button
            type="button"
            onClick={() => setCurrentView('settings')}
            className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              currentView === 'settings'
                ? 'text-indigo-600 dark:text-indigo-400 underline underline-offset-4'
                : ''
            }`}
          >
            Settings
          </button>
          <button
            type="button"
            onClick={() => setAndroidModalOpen(true)}
            className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Android Studio
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() =>
              handleStartLevel(
                continueTarget.game.id,
                continueTarget.levelNumber
              )
            }
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-500 active:scale-[0.98] transition-all whitespace-nowrap shrink-0 cursor-pointer"
          >
            Continue Level {continueTarget.levelNumber}
          </button>
        </div>
      </header>

      {/* Secondary Android Workspace Bar (Desktop Viewport Mode Switcher & Install Action) */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 pt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {currentView !== 'dashboard' && (
            <button
              type="button"
              onClick={handleAndroidBack}
              className="min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5 hover:border-indigo-500 active:scale-[0.98] transition-all whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Android Back</span>
            </button>
          )}
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Material 3 Android Edition · Offline-First Engine
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <PWAInstallButton onOpenAndroidModal={() => setAndroidModalOpen(true)} />

          {/* Desktop Android Device Frame Toggle */}
          <div className="hidden lg:flex items-center p-0.5 rounded-xl bg-slate-200/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setAndroidShellMode('adaptive')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                androidShellMode === 'adaptive'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Adaptive Tablet / Wide</span>
            </button>
            <button
              type="button"
              onClick={() => setAndroidShellMode('phone-frame')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                androidShellMode === 'phone-frame'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Android Phone View</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Container (Supports both Full Adaptive Width and Android Phone Shell) */}
      <div
        className={`flex-1 w-full mx-auto transition-all ${
          isPhoneFrame
            ? 'max-w-[432px] my-4 rounded-[40px] border-[6px] border-slate-900 dark:border-slate-800 bg-stone-50 dark:bg-slate-950 shadow-2xl overflow-hidden flex flex-col'
            : 'max-w-7xl px-4 sm:px-8 pt-4 pb-20'
        }`}
      >
        {isPhoneFrame && <AndroidSystemStatusBar />}

        <main className={isPhoneFrame ? 'flex-1 overflow-y-auto px-4 pt-3 pb-20' : ''}>
          {currentView === 'dashboard' && (
            <div className="space-y-8">
              {/* Material 3 Expressive Hero Card */}
              <section className="p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div
                  className={`grid grid-cols-1 ${
                    isPhoneFrame ? '' : 'lg:grid-cols-12'
                  } gap-6 items-center`}
                >
                  <div className={isPhoneFrame ? 'space-y-4' : 'lg:col-span-7 space-y-4'}>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span>Android Cognitive Suite</span>
                      <span aria-hidden="true">·</span>
                      <span>10 Games</span>
                      <span aria-hidden="true">·</span>
                      <span>10,000 Playable Levels</span>
                    </div>
                    <h1
                      className={`${
                        isPhoneFrame ? 'text-2xl' : 'text-2xl sm:text-4xl'
                      } font-extrabold text-slate-900 dark:text-white tracking-tight`}
                    >
                      Train deductive logic, working memory, and spatial reasoning.
                    </h1>
                    <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                      Select any of the 10 cognitive games below. Each game features 1,000 deterministic levels across 10 mastery tiers with offline persistence.
                    </p>

                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() =>
                          handleStartLevel(
                            continueTarget.game.id,
                            continueTarget.levelNumber
                          )
                        }
                        className="min-h-[48px] px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white font-semibold text-sm inline-flex items-center gap-2.5 transition-all cursor-pointer whitespace-nowrap shrink-0"
                      >
                        <Play className="w-4 h-4 fill-current" />
                        <span>
                          Continue: {continueTarget.game.name} (L
                          {continueTarget.levelNumber})
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setAndroidModalOpen(true)}
                        className="min-h-[48px] px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-stone-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-[0.98] text-slate-800 dark:text-slate-200 font-medium text-xs sm:text-sm inline-flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0"
                      >
                        <Code2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        <span>Native Kotlin & APK</span>
                      </button>
                    </div>
                  </div>

                  {/* Material 3 Surface Containers for Telemetry */}
                  <div
                    className={`${
                      isPhoneFrame ? '' : 'lg:col-span-5'
                    } grid grid-cols-2 gap-3`}
                  >
                    <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800">
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Levels Solved
                      </div>
                      <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
                        {totalCompleted.toLocaleString()}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5 tabular-nums">
                        / 10,000 total
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800">
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Games Ready
                      </div>
                      <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-indigo-600 dark:text-indigo-400 mt-1">
                        10 / 10
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        1,000 levels each
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800">
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Difficulty Curve
                      </div>
                      <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
                        10 Tiers
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        100 levels / tier
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800">
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Daily Streak
                      </div>
                      <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-1">
                        {stats.currentDailyStreak}d
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 tabular-nums">
                        {stats.achievementsUnlocked.length} milestones
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* 10 Games Catalogue Section */}
              <section className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                      10 Brain Games Catalogue
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Tap any game card to play or browse its 1,000 progressive levels.
                    </p>
                  </div>

                  {/* Interactive Material 3 Segmented Filter Bar */}
                  <div className="flex items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
                    {(
                      [
                        ['all', 'All 10'],
                        ['quantitative', 'Logic & Math'],
                        ['visual', 'Visual & Spatial'],
                        ['verbal', 'Verbal & Case'],
                      ] as const
                    ).map(([key, label]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setDomainFilter(key)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          domainFilter === key
                            ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 10 Game Cards Grid */}
                <div
                  className={`grid grid-cols-1 ${
                    isPhoneFrame ? '' : 'md:grid-cols-2'
                  } gap-4`}
                >
                  {filteredGames.map((game) => {
                    const rec = progress[game.id];
                    const solvedCount = rec.completedLevels.length;
                    const currentTier = getTierForLevel(rec.unlockedLevel);
                    const pct = Math.min(100, Math.round((solvedCount / 1000) * 100));

                    return (
                      <div
                        key={game.id}
                        className="p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between gap-4 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                      >
                        <div className="space-y-3">
                          {/* Clean Unboxed Metadata */}
                          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                            <div>
                              <span className="font-mono">0{game.index}</span>
                              <span className="mx-1.5" aria-hidden="true">·</span>
                              <span>{game.cognitiveSkill}</span>
                            </div>
                            <span className="font-mono tabular-nums text-slate-700 dark:text-slate-300">
                              T{currentTier.tier} · {currentTier.name}
                            </span>
                          </div>

                          {/* Icon + Title + Description */}
                          <div className="flex items-start gap-3.5">
                            <button
                              type="button"
                              onClick={() => handleOpenGameIntro(game.id)}
                              className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 hover:bg-indigo-600 hover:text-white active:scale-[0.96] transition-all cursor-pointer"
                              aria-label={`Open ${game.name} overview`}
                            >
                              <GameIcon gameId={game.id} className="w-6 h-6" />
                            </button>
                            <div className="space-y-1 min-w-0">
                              <button
                                type="button"
                                onClick={() => handleOpenGameIntro(game.id)}
                                className="text-base sm:text-lg font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 text-left transition-colors cursor-pointer"
                              >
                                {game.name}
                              </button>
                              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                {game.shortDescription}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Progress Bar & Thumb-Friendly Actions */}
                        <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs font-mono">
                              <span className="text-slate-500 dark:text-slate-400 tabular-nums">
                                {solvedCount} / 1000 solved
                              </span>
                              <span className="text-indigo-600 dark:text-indigo-400 font-semibold tabular-nums">
                                Level {rec.unlockedLevel}
                              </span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-stone-100 dark:bg-slate-800 overflow-hidden">
                              <div
                                style={{ width: `${Math.max(solvedCount > 0 ? 2 : 0, pct)}%` }}
                                className="h-full bg-indigo-600 dark:bg-indigo-500 transition-all"
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleOpenGameIntro(game.id)}
                                className="min-h-[44px] px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-stone-50 dark:hover:bg-slate-800 active:scale-[0.98] transition-all whitespace-nowrap shrink-0 cursor-pointer"
                              >
                                Details
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenLevelSelect(game.id)}
                                className="min-h-[44px] px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-stone-50 dark:hover:bg-slate-800 active:scale-[0.98] transition-all whitespace-nowrap shrink-0 cursor-pointer"
                              >
                                1,000 Levels
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                handleStartLevel(game.id, rec.unlockedLevel)
                              }
                              className="min-h-[44px] px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0 cursor-pointer"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span>
                                {solvedCount > 0
                                  ? `Play L${rec.unlockedLevel}`
                                  : 'Start L1'}
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          )}

          {currentView === 'game-intro' && (
            <GameIntroScreen
              game={activeGameMeta}
              progress={progress[activeGameId]}
              onBackToDashboard={() => setCurrentView('dashboard')}
              onStartLevel={(lvl) => handleStartLevel(activeGameId, lvl)}
              onOpenLevelMap={() => setCurrentView('level-select')}
            />
          )}

          {currentView === 'level-select' && (
            <LevelSelectionScreen
              game={activeGameMeta}
              progress={progress[activeGameId]}
              onBackToIntro={() => setCurrentView('game-intro')}
              onSelectLevel={(lvl) => handleStartLevel(activeGameId, lvl)}
            />
          )}

          {currentView === 'gameplay' && (
            <GameplayScreen
              game={activeGameMeta}
              level={activeLevelData}
              progress={progress[activeGameId]}
              settings={settings}
              onBackToLevels={() => setCurrentView('level-select')}
              onBackToGameIntro={() => setCurrentView('game-intro')}
              onSelectLevel={(lvl) => handleStartLevel(activeGameId, lvl)}
              onRecordAttempt={handleRecordAttempt}
            />
          )}

          {currentView === 'statistics' && (
            <StatisticsScreen
              progress={progress}
              stats={stats}
              onSelectGame={(gid) => handleOpenGameIntro(gid)}
            />
          )}

          {currentView === 'validator' && (
            <ValidatorScreen
              onPlaySampleLevel={(gid, lvl) => handleStartLevel(gid, lvl)}
            />
          )}

          {currentView === 'settings' && (
            <SettingsScreen
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              onResetAllProgress={handleResetAllProgress}
            />
          )}
        </main>

        {/* Material 3 NavigationBar inside Android Phone Frame */}
        {isPhoneFrame && (
          <div className="bg-white/95 dark:bg-slate-900/95 border-t border-slate-200 dark:border-slate-800 pt-1.5 pb-2 px-2 shrink-0">
            <div className="grid grid-cols-4 items-center">
              {(
                [
                  ['dashboard', 'Games', Compass],
                  ['statistics', 'Stats', BarChart3],
                  ['validator', 'Audit', ShieldCheck],
                  ['settings', 'Settings', Settings],
                ] as const
              ).map(([viewKey, label, IconComp]) => {
                const isActive = currentView === viewKey;
                return (
                  <button
                    key={viewKey}
                    type="button"
                    onClick={() => setCurrentView(viewKey)}
                    className="flex flex-col items-center justify-center py-1 text-[11px] font-semibold cursor-pointer"
                  >
                    <div
                      className={`px-4 py-1 rounded-full transition-colors ${
                        isActive
                          ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      <IconComp className="w-4 h-4" />
                    </div>
                    <span
                      className={`mt-0.5 ${
                        isActive
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
            {/* Android Gesture Navigation Pill */}
            <div className="mt-2 flex justify-center">
              <button
                type="button"
                onClick={() => setCurrentView('dashboard')}
                title="Android Home Gesture"
                className="w-28 h-1 rounded-full bg-slate-400/70 dark:bg-slate-600 cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation Bar (Material 3 NavigationBar for real mobile viewports) */}
      {!isPhoneFrame && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 grid grid-cols-4 items-center px-2">
          {(
            [
              ['dashboard', 'Games', Compass],
              ['statistics', 'Statistics', BarChart3],
              ['validator', 'Validator', ShieldCheck],
              ['settings', 'Settings', Settings],
            ] as const
          ).map(([viewKey, label, IconComp]) => {
            const isActive = currentView === viewKey;
            return (
              <button
                key={viewKey}
                type="button"
                onClick={() => setCurrentView(viewKey)}
                className="flex flex-col items-center justify-center h-full text-[11px] font-semibold"
              >
                <div
                  className={`px-4 py-1 rounded-full transition-colors ${
                    isActive
                      ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <IconComp className="w-4 h-4" />
                </div>
                <span
                  className={`mt-0.5 ${
                    isActive
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}
