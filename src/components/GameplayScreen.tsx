import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Eye,
  HelpCircle,
  Lightbulb,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { feedback } from '../domain/sound';
import {
  AppSettings,
  GameMetadata,
  GameProgressRecord,
  LevelData,
} from '../domain/types';
import { validateLevelAnswer } from '../engines';
import {
  GameIcon,
  MatrixCellRenderer,
  OddShapeRenderer,
  PaperFoldGridRenderer,
  PolyominoGridRenderer,
} from './VisualRenderers';

interface GameplayScreenProps {
  game: GameMetadata;
  level: LevelData;
  progress: GameProgressRecord;
  settings: AppSettings;
  onBackToLevels: () => void;
  onBackToGameIntro: () => void;
  onSelectLevel: (levelNumber: number) => void;
  onRecordAttempt: (params: {
    gameId: GameMetadata['id'];
    levelNumber: number;
    isCorrect: boolean;
    attemptsOnThisLevel: number;
    hintsUsedOnThisLevel: number;
  }) => void;
}

export const GameplayScreen: React.FC<GameplayScreenProps> = ({
  game,
  level,
  progress,
  settings,
  onBackToLevels,
  onBackToGameIntro,
  onSelectLevel,
  onRecordAttempt,
}) => {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [textInput, setTextInput] = useState<string>('');
  const [inputMode, setInputMode] = useState<'options' | 'direct'>('options');
  const [hintsRevealed, setHintsRevealed] = useState<number>(0);
  const [attemptsCount, setAttemptsCount] = useState<number>(0);
  const [status, setStatus] = useState<'playing' | 'incorrect' | 'completed'>('playing');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Game-specific interactive helper states
  const [showStepDiffs, setShowStepDiffs] = useState<boolean>(false);
  const [logicGridMarks, setLogicGridMarks] = useState<Record<string, 'none' | 'cross' | 'check'>>({});
  const [suspectFlags, setSuspectFlags] = useState<Record<string, 'neutral' | 'cleared' | 'flagged'>>({});
  const [memoryPhase, setMemoryPhase] = useState<'study' | 'recall'>('study');
  const [memoryTimeLeftMs, setMemoryTimeLeftMs] = useState<number>(3500);
  const [memoryTappedCells, setMemoryTappedCells] = useState<number[]>([]);

  // Reset local state whenever level changes
  useEffect(() => {
    setSelectedOptionId(null);
    setTextInput('');
    setInputMode('options');
    setHintsRevealed(0);
    setAttemptsCount(0);
    setStatus('playing');
    setErrorMessage(null);
    setShowStepDiffs(false);
    setLogicGridMarks({});
    setSuspectFlags({});
    setMemoryTappedCells([]);

    if (level.payload.type === 'memory-master') {
      setMemoryPhase('study');
      setMemoryTimeLeftMs(level.payload.studyDurationMs);
    }
  }, [level.id, level.payload]);

  // Timer for Memory Master study phase
  useEffect(() => {
    if (level.payload.type !== 'memory-master' || memoryPhase !== 'study' || status === 'completed') {
      return;
    }
    const interval = window.setInterval(() => {
      setMemoryTimeLeftMs((prev) => {
        if (prev <= 100) {
          window.clearInterval(interval);
          setMemoryPhase('recall');
          return 0;
        }
        return prev - 100;
      });
    }, 100);
    return () => window.clearInterval(interval);
  }, [level.id, level.payload.type, memoryPhase, status]);

  const handleRevealHint = () => {
    if (hintsRevealed < 3) {
      feedback.playTap(settings.soundEnabled, settings.hapticsEnabled);
      setHintsRevealed((h) => h + 1);
    }
  };

  const handleResetWorkspace = () => {
    feedback.playTap(settings.soundEnabled, settings.hapticsEnabled);
    setSelectedOptionId(null);
    setTextInput('');
    setStatus('playing');
    setErrorMessage(null);
    setLogicGridMarks({});
    setSuspectFlags({});
    setMemoryTappedCells([]);
    if (level.payload.type === 'memory-master') {
      setMemoryPhase('study');
      setMemoryTimeLeftMs(level.payload.studyDurationMs);
    }
  };

  const handleSubmit = () => {
    if (status === 'completed') return;

    const submission =
      inputMode === 'direct' && textInput.trim().length > 0
        ? { textAnswer: textInput }
        : selectedOptionId
        ? { optionId: selectedOptionId }
        : null;

    if (!submission) {
      setErrorMessage('Select an answer or enter a response before checking.');
      return;
    }

    const nextAttempts = attemptsCount + 1;
    setAttemptsCount(nextAttempts);

    const isCorrect = validateLevelAnswer(level, submission);
    onRecordAttempt({
      gameId: game.id,
      levelNumber: level.levelNumber,
      isCorrect,
      attemptsOnThisLevel: nextAttempts,
      hintsUsedOnThisLevel: hintsRevealed,
    });

    if (isCorrect) {
      feedback.playSuccess(settings.soundEnabled, settings.hapticsEnabled);
      setStatus('completed');
      setErrorMessage(null);
    } else {
      feedback.playError(settings.soundEnabled, settings.hapticsEnabled);
      setStatus('incorrect');
      setErrorMessage(
        nextAttempts === 1
          ? 'Not quite right. Re-examine the pattern constraints or reveal a progressive hint.'
          : 'That candidate violates one of the level rules. Check the revealed hints or adjust your deduction.'
      );
    }
  };

  const toggleLogicCell = (entity: string, attr: string) => {
    feedback.playTap(settings.soundEnabled, settings.hapticsEnabled);
    const key = `${entity}__${attr}`;
    setLogicGridMarks((prev) => {
      const curr = prev[key] || 'none';
      const next = curr === 'none' ? 'cross' : curr === 'cross' ? 'check' : 'none';
      return { ...prev, [key]: next };
    });
  };

  const toggleSuspectFlag = (suspectId: string) => {
    feedback.playTap(settings.soundEnabled, settings.hapticsEnabled);
    setSuspectFlags((prev) => {
      const curr = prev[suspectId] || 'neutral';
      const next = curr === 'neutral' ? 'cleared' : curr === 'cleared' ? 'flagged' : 'neutral';
      return { ...prev, [suspectId]: next };
    });
  };

  const handleMemoryCellTap = (cellIdx: number) => {
    if (level.payload.type !== 'memory-master' || memoryPhase !== 'recall') return;
    feedback.playTap(settings.soundEnabled, settings.hapticsEnabled);
    const payload = level.payload;

    setMemoryTappedCells((prev) => {
      let next: number[];
      if (payload.subMode === 'ordered-sequence') {
        if (prev.includes(cellIdx)) {
          next = prev.filter((i) => i !== cellIdx);
        } else {
          next = [...prev, cellIdx];
        }
        // Check if tapped sequence matches target ordered steps
        const coordChain = next
          .map((idx) => `${String.fromCharCode(65 + Math.floor(idx / payload.gridSize))}${(idx % payload.gridSize) + 1}`)
          .join(' → ');
        const matchingOpt = level.options.find((o) => o.label === coordChain);
        if (matchingOpt) {
          setSelectedOptionId(matchingOpt.id);
        }
      } else if (payload.subMode === 'spatial-grid') {
        if (prev.includes(cellIdx)) {
          next = prev.filter((i) => i !== cellIdx);
        } else {
          next = [...prev, cellIdx];
        }
        const sorted = [...next].sort((a, b) => a - b);
        const coordSet = sorted
          .map((idx) => `${String.fromCharCode(65 + Math.floor(idx / payload.gridSize))}${(idx % payload.gridSize) + 1}`)
          .join(' · ');
        const matchingOpt = level.options.find((o) => o.label === coordSet);
        if (matchingOpt) {
          setSelectedOptionId(matchingOpt.id);
        }
      } else {
        next = [cellIdx];
        const coord = `${String.fromCharCode(65 + Math.floor(cellIdx / payload.gridSize))}${(cellIdx % payload.gridSize) + 1}`;
        const matchingOpt = level.options.find((o) => o.label.startsWith(coord));
        if (matchingOpt) {
          setSelectedOptionId(matchingOpt.id);
        }
      }
      return next;
    });
  };

  const isCompletedPreviously = progress.completedLevels.includes(level.levelNumber);

  // Render Game-Specific Interactive Stage
  const renderGameStage = () => {
    const p = level.payload;

    switch (p.type) {
      case 'number-sequence': {
        return (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                <span>Family: {p.ruleCategory}</span>
                <span className="mx-2" aria-hidden="true">·</span>
                <span>Terms: {p.sequence.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowStepDiffs((s) => !s)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-indigo-500 transition-colors whitespace-nowrap shrink-0"
                >
                  {showStepDiffs ? 'Hide Step Differences' : 'Show Step Differences'}
                </button>
                <div className="flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setInputMode('options')}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                      inputMode === 'options'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Choices
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputMode('direct')}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                      inputMode === 'direct'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Direct Keypad
                  </button>
                </div>
              </div>
            </div>

            {/* Sequence Ribbon */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-stone-50/70 dark:bg-slate-950/60 overflow-x-auto">
              <div className="flex items-center justify-center gap-3 min-w-max">
                {p.sequence.map((val, idx) => {
                  const isMissing = val === null;
                  const nextVal = idx < p.sequence.length - 1 ? p.sequence[idx + 1] : null;
                  const canDiff = val !== null && nextVal !== null;
                  const diffVal = canDiff ? nextVal - val : null;

                  return (
                    <React.Fragment key={idx}>
                      <div className="flex flex-col items-center">
                        <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 mb-1.5">
                          T{idx + 1}
                        </span>
                        <div
                          className={`min-w-[68px] h-16 px-3 rounded-xl flex items-center justify-center font-mono text-xl font-bold tabular-nums border transition-all ${
                            isMissing
                              ? 'border-2 border-dashed border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300'
                              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100'
                          }`}
                        >
                          {isMissing
                            ? inputMode === 'direct' && textInput
                              ? textInput
                              : selectedOptionId
                              ? level.options.find((o) => o.id === selectedOptionId)?.label
                              : '?'
                            : val}
                        </div>
                      </div>
                      {idx < p.sequence.length - 1 && (
                        <div className="flex flex-col items-center pt-5">
                          <span className="text-slate-300 dark:text-slate-700 font-mono">→</span>
                          {showStepDiffs && (
                            <span className="mt-1 text-[11px] font-mono text-indigo-600 dark:text-indigo-400 tabular-nums">
                              {diffVal !== null ? (diffVal >= 0 ? `+${diffVal}` : diffVal) : 'Δ?'}
                            </span>
                          )}
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </div>
        );
      }

      case 'pattern-matrix': {
        const previewOption = level.options.find((o) => o.id === selectedOptionId);
        return (
          <div className="space-y-4">
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>Matrix Dimension: {p.gridSize}×{p.gridSize}</span>
              <span>Tap any option below to preview it inside the target cell</span>
            </div>
            <div className="flex justify-center py-4 px-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-stone-50/60 dark:bg-slate-950/50">
              <div
                className={`grid gap-3 ${
                  p.gridSize === 2 ? 'grid-cols-2' : 'grid-cols-3'
                }`}
              >
                {p.cells.map((cell, idx) => {
                  const isTarget = cell === null;
                  return (
                    <div key={idx} className="flex flex-col items-center">
                      <MatrixCellRenderer
                        cell={isTarget && previewOption?.matrixCell ? previewOption.matrixCell : cell}
                        size={p.gridSize === 2 ? 116 : 98}
                        isPreview={isTarget && Boolean(previewOption?.matrixCell)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      }

      case 'word-connections': {
        return (
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-stone-50/70 dark:bg-slate-950/50 space-y-4">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              <span>Domain: {p.relationCategory}</span>
              <span className="mx-2" aria-hidden="true">·</span>
              <span>Mode: {p.subMode.replace('-', ' ')}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {p.stemWords.map((w, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between"
                >
                  <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                    Node 0{idx + 1}
                  </span>
                  <span className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-100">
                    {w}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      }

      case 'lateral-thinking': {
        return (
          <div className="space-y-4">
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-stone-50/80 dark:bg-slate-950/60 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-mono text-amber-700 dark:text-amber-400">
                  {p.scenarioTitle}
                </span>
                <div className="flex items-center p-0.5 rounded-lg bg-slate-200/70 dark:bg-slate-800">
                  <button
                    type="button"
                    onClick={() => setInputMode('options')}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                      inputMode === 'options'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Hypotheses
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputMode('direct')}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                      inputMode === 'direct'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Keyword Deduction
                  </button>
                </div>
              </div>
              <p className="text-base leading-relaxed text-slate-800 dark:text-slate-200">
                {p.scenarioText}
              </p>
            </div>
          </div>
        );
      }

      case 'logic-detective': {
        return (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Clues list */}
            <div className="lg:col-span-6 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-stone-50/70 dark:bg-slate-950/50 space-y-3">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Verified Deductive Clues
              </div>
              <ul className="space-y-2.5 text-sm text-slate-800 dark:text-slate-200">
                {p.clues.map((c, i) => (
                  <li
                    key={i}
                    className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 leading-relaxed"
                  >
                    {c}
                  </li>
                ))}
              </ul>
            </div>

            {/* Interactive Elimination Matrix */}
            <div className="lg:col-span-6 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Interactive Elimination Matrix (Tap: ✕ / ✓)
                </span>
                <button
                  type="button"
                  onClick={() => setLogicGridMarks({})}
                  className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white"
                >
                  Clear Grid
                </button>
              </div>
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr>
                    <th className="p-2 text-left border border-slate-200 dark:border-slate-800 bg-stone-50 dark:bg-slate-950 font-medium text-slate-500">
                      {p.entitiesLabel} \ {p.attributesLabel}
                    </th>
                    {p.attributes.map((attr) => (
                      <th
                        key={attr}
                        className="p-2 text-center border border-slate-200 dark:border-slate-800 bg-stone-50 dark:bg-slate-950 font-medium text-slate-700 dark:text-slate-300"
                      >
                        {attr}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {p.entities.map((ent) => {
                    const isTargetRow = ent === p.targetEntity;
                    return (
                      <tr
                        key={ent}
                        className={
                          isTargetRow ? 'bg-indigo-50/40 dark:bg-indigo-950/20 font-semibold' : ''
                        }
                      >
                        <td className="p-2 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 whitespace-nowrap">
                          {ent} {isTargetRow ? '(Target)' : ''}
                        </td>
                        {p.attributes.map((attr) => {
                          const mark = logicGridMarks[`${ent}__${attr}`] || 'none';
                          return (
                            <td
                              key={attr}
                              className="p-0 border border-slate-200 dark:border-slate-800 text-center"
                            >
                              <button
                                type="button"
                                onClick={() => toggleLogicCell(ent, attr)}
                                className={`w-full h-10 flex items-center justify-center font-mono text-sm transition-colors ${
                                  mark === 'cross'
                                    ? 'text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/30'
                                    : mark === 'check'
                                    ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/40 font-bold'
                                    : 'text-slate-300 dark:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                }`}
                              >
                                {mark === 'cross' ? '✕' : mark === 'check' ? '✓' : '·'}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      }

      case 'odd-one-out': {
        return (
          <div className="space-y-4">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              <span>Modality: {p.modality}</span>
              <span className="mx-2" aria-hidden="true">·</span>
              <span>Candidates: {p.items.length}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {p.items.map((item) => {
                const isSelected = selectedOptionId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      feedback.playTap(settings.soundEnabled, settings.hapticsEnabled);
                      setSelectedOptionId(item.id);
                    }}
                    className={`p-4 rounded-xl border text-left transition-all flex flex-col items-center justify-center gap-2 min-h-[112px] ${
                      isSelected
                        ? 'border-indigo-600 dark:border-indigo-400 bg-indigo-50/60 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {item.visualType === 'shape' && item.shapeSpec && (
                      <OddShapeRenderer {...item.shapeSpec} />
                    )}
                    <span className="font-mono text-base font-bold text-slate-900 dark:text-slate-100 text-center">
                      {item.label}
                    </span>
                    {item.sublabel && (
                      <span className="text-xs text-slate-500 dark:text-slate-400 text-center">
                        {item.sublabel}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      }

      case 'math-mystery': {
        return (
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-stone-50/70 dark:bg-slate-950/50 space-y-4">
            {p.subMode === 'operator-forge' && p.operands && (
              <div className="flex flex-wrap items-center justify-center gap-3 py-4">
                {p.operands.map((op, i) => (
                  <React.Fragment key={i}>
                    <div className="w-16 h-16 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center font-mono text-xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                      {op}
                    </div>
                    {i < p.operands!.length - 1 && (
                      <div className="w-11 h-11 rounded-lg border-2 border-dashed border-indigo-400 dark:border-indigo-500 flex items-center justify-center font-mono text-base font-bold text-indigo-600 dark:text-indigo-400">
                        ?
                      </div>
                    )}
                  </React.Fragment>
                ))}
                <span className="font-mono text-2xl font-bold text-slate-500 px-2">=</span>
                <div className="px-5 h-16 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-mono text-xl font-bold tabular-nums">
                  {p.targetValue}
                </div>
              </div>
            )}

            {p.subMode === 'symbol-balance' && p.equations && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {p.equations.map((eq, i) => (
                  <div
                    key={i}
                    className={`p-4 rounded-xl border font-mono text-lg font-bold text-center ${
                      i === p.equations!.length - 1
                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100'
                    }`}
                  >
                    {eq}
                  </div>
                ))}
              </div>
            )}

            {p.subMode === 'magic-grid' && p.grid && (
              <div className="flex justify-center">
                <div className="grid grid-cols-3 gap-2.5">
                  {p.grid.flat().map((cell, idx) => (
                    <div
                      key={idx}
                      className={`w-20 h-16 rounded-xl flex items-center justify-center font-mono text-lg font-bold tabular-nums border ${
                        cell === '?'
                          ? 'border-2 border-dashed border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100'
                      }`}
                    >
                      {cell}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {p.subMode === 'constraint-riddle' && p.riddleClues && (
              <div className="space-y-2.5">
                {p.riddleClues.map((rc, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium text-slate-800 dark:text-slate-200"
                  >
                    {rc}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      }

      case 'memory-master': {
        const totalCells = p.gridSize * p.gridSize;
        const stepMap = new Map<number, number>();
        if (p.orderedSteps) {
          p.orderedSteps.forEach((s) => stepMap.set(s.cellIndex, s.stepNumber));
        }

        return (
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-stone-50/70 dark:bg-slate-950/50 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs font-medium text-slate-600 dark:text-slate-300">
                {memoryPhase === 'study' ? (
                  <span>
                    Encoding Phase — Memorize the active coordinates ({Math.ceil(memoryTimeLeftMs / 100) / 10}s remaining)
                  </span>
                ) : (
                  <span>
                    Recall Phase — Tap cells on the board or choose the matching coordinate sequence below
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {memoryPhase === 'study' ? (
                  <button
                    type="button"
                    onClick={() => setMemoryPhase('recall')}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors whitespace-nowrap shrink-0"
                  >
                    Ready Now — Start Recall
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setMemoryPhase('study');
                      setMemoryTimeLeftMs(2000);
                    }}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-indigo-500 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Flash Pattern Again (2s)
                  </button>
                )}
              </div>
            </div>

            <div className="flex justify-center py-2">
              <div
                style={{
                  gridTemplateColumns: `repeat(${p.gridSize}, minmax(0, 1fr))`,
                }}
                className="grid gap-2"
              >
                {Array.from({ length: totalCells }).map((_, idx) => {
                  const coord = `${String.fromCharCode(65 + Math.floor(idx / p.gridSize))}${(idx % p.gridSize) + 1}`;
                  const isTarget = p.targetCells.includes(idx);
                  const stepNum = stepMap.get(idx);
                  const userTapIdx = memoryTappedCells.indexOf(idx);
                  const isUserTapped = userTapIdx !== -1;

                  let cellContent: React.ReactNode = coord;
                  if (memoryPhase === 'study') {
                    if (p.subMode === 'ordered-sequence' && stepNum !== undefined) {
                      cellContent = `#${stepNum}`;
                    } else if (p.subMode === 'symbol-mutation' && p.symbolGridBefore) {
                      cellContent = p.symbolGridBefore[idx] || coord;
                    }
                  } else {
                    if (p.subMode === 'symbol-mutation' && p.symbolGridAfter) {
                      cellContent = p.symbolGridAfter[idx] || coord;
                    } else if (isUserTapped && p.subMode === 'ordered-sequence') {
                      cellContent = `#${userTapIdx + 1}`;
                    }
                  }

                  const highlightedInStudy = memoryPhase === 'study' && isTarget;

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleMemoryCellTap(idx)}
                      className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl font-mono text-xs sm:text-sm font-bold flex flex-col items-center justify-center border transition-all ${
                        highlightedInStudy
                          ? 'bg-indigo-600 text-white border-indigo-500 scale-[1.03]'
                          : isUserTapped
                          ? 'bg-emerald-600 text-white border-emerald-500'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-indigo-400'
                      }`}
                    >
                      <span>{cellContent}</span>
                      <span className="text-[9px] opacity-65 font-normal">{coord}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        );
      }

      case 'spatial-intelligence': {
        return (
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-stone-50/70 dark:bg-slate-950/50 space-y-5">
            <div className="flex flex-col sm:flex-row items-center justify-around gap-6">
              <div className="flex flex-col items-center gap-2">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {p.subMode === 'paper-folding' ? 'Folded & Punched Sheet' : 'Reference Figure'}
                </span>
                {p.referenceShape && <PolyominoGridRenderer spec={p.referenceShape} size={132} />}
                {p.paperFold && (
                  <PaperFoldGridRenderer
                    punches={p.paperFold.initialPunches}
                    folds={p.paperFold.folds}
                    size={132}
                  />
                )}
              </div>

              <div className="flex flex-col items-center text-center max-w-xs space-y-1.5">
                <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400">
                  Required Spatial Operation
                </span>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {p.targetTransformation}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {p.subMode === 'paper-folding'
                    ? 'Dashed lines indicate crease axes. Holes reflect symmetrically across each crease when unfolded.'
                    : 'Amber dot marks the topological anchor square. Reject any chiral mirror-flipped decoys.'}
                </p>
              </div>
            </div>
          </div>
        );
      }

      case 'mind-investigator': {
        return (
          <div className="space-y-5">
            {/* Verified Forensic Evidence Log */}
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-stone-50/80 dark:bg-slate-950/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                  {p.caseNumber} · {p.caseTitle}
                </span>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300">{p.incidentSummary}</p>
              <div className="space-y-2 pt-1">
                {p.verifiedEvidence.map((ev, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-800 dark:text-slate-200"
                  >
                    {ev}
                  </div>
                ))}
              </div>
            </div>

            {/* Suspect Dossiers with Interactive Clear/Flag Note Toggles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {p.suspects.map((susp) => {
                const flagState = suspectFlags[susp.id] || 'neutral';
                const isSelected = selectedOptionId === susp.id;
                return (
                  <div
                    key={susp.id}
                    className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                      isSelected
                        ? 'border-indigo-600 dark:border-indigo-400 bg-indigo-50/40 dark:bg-indigo-950/30'
                        : flagState === 'cleared'
                        ? 'border-slate-200 dark:border-slate-800 bg-stone-100/60 dark:bg-slate-900/40 opacity-65'
                        : flagState === 'flagged'
                        ? 'border-amber-500/70 bg-amber-50/30 dark:bg-amber-950/20'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            {susp.name}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {susp.role} · {susp.timelineWindow}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleSuspectFlag(susp.id)}
                          className="px-2.5 py-1 text-[11px] font-medium rounded-md border border-slate-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 whitespace-nowrap shrink-0"
                        >
                          {flagState === 'neutral'
                            ? 'Mark Note'
                            : flagState === 'cleared'
                            ? '✓ Alibi Cleared'
                            : '! Suspect Flagged'}
                        </button>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                        "{susp.alibiClaim}"
                      </p>
                    </div>
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                      <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                        Forensic Note: {susp.physicalNote}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          feedback.playTap(settings.soundEnabled, settings.hapticsEnabled);
                          setSelectedOptionId(susp.id);
                        }}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                          isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        {isSelected ? 'Selected' : 'Select Dossier'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Top Sub-Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToLevels}
            className="min-h-[44px] min-w-[44px] px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center gap-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Level Map</span>
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <button
                type="button"
                onClick={onBackToGameIntro}
                className="hover:underline font-medium text-slate-700 dark:text-slate-300"
              >
                {game.name}
              </button>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                Level {level.levelNumber} / 1000
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Tier {level.tier}: {level.tierName}
              </span>
              {isCompletedPreviously && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                    Solved
                  </span>
                </>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              {level.title}
            </h1>
          </div>
        </div>

        {/* Action controls: Hint & Reset */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleRevealHint}
            disabled={hintsRevealed >= 3}
            className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-amber-500/60 disabled:opacity-50 inline-flex items-center gap-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0"
          >
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <span>Hint ({hintsRevealed}/3)</span>
          </button>
          <button
            type="button"
            onClick={handleResetWorkspace}
            className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center gap-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Main Question & Interactive Game Stage */}
      <div className="p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-6">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
            <GameIcon gameId={game.id} className="w-5 h-5" />
          </div>
          <p className="text-base sm:text-lg font-medium text-slate-900 dark:text-slate-100 leading-relaxed">
            {level.prompt}
          </p>
        </div>

        {/* Game-Specific Interactive Canvas */}
        {renderGameStage()}

        {/* Progressive Hints Drawer */}
        {hintsRevealed > 0 && (
          <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 space-y-2">
            <div className="text-xs font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4" />
              <span>Progressive Reasoning Hints</span>
            </div>
            <ul className="space-y-1.5 text-xs sm:text-sm text-amber-950 dark:text-amber-100">
              {level.hints.slice(0, hintsRevealed).map((h, i) => (
                <li key={i} className="leading-relaxed">
                  <strong className="font-mono mr-1.5">Hint {i + 1}:</strong>
                  {h}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Answer Controls (if not already handled inline by Odd One Out) */}
        {inputMode === 'direct' ? (
          <div className="space-y-3 pt-2">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
              Direct Answer Input
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSubmit();
                }}
                placeholder={
                  level.payload.type === 'lateral-thinking'
                    ? 'Enter key insight (e.g., sister, melted ice, deflation)...'
                    : 'Enter exact numerical value...'
                }
                className="flex-1 min-h-[48px] px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-stone-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono text-base focus:outline-none focus:border-indigo-600"
              />
            </div>
          </div>
        ) : (
          level.payload.type !== 'odd-one-out' && (
            <div className="space-y-3 pt-2">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Select Candidate Solution
              </div>
              <div
                className={`grid gap-3 ${
                  level.payload.type === 'pattern-matrix' ||
                  level.payload.type === 'spatial-intelligence'
                    ? 'grid-cols-2 sm:grid-cols-4'
                    : 'grid-cols-1 sm:grid-cols-2'
                }`}
              >
                {level.options.map((opt, idx) => {
                  const isSelected = selectedOptionId === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        feedback.playTap(settings.soundEnabled, settings.hapticsEnabled);
                        setSelectedOptionId(opt.id);
                      }}
                      className={`min-h-[52px] p-3.5 rounded-xl border text-left transition-all flex items-center gap-3 ${
                        opt.matrixCell || opt.spatialShape || opt.punchGrid
                          ? 'flex-col justify-center text-center'
                          : 'justify-between'
                      } ${
                        isSelected
                          ? 'border-indigo-600 dark:border-indigo-400 bg-indigo-50/70 dark:bg-indigo-950/50 text-slate-900 dark:text-white ring-2 ring-indigo-500/20'
                          : 'border-slate-200 dark:border-slate-800 bg-stone-50/50 dark:bg-slate-950/40 text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      {opt.matrixCell && <MatrixCellRenderer cell={opt.matrixCell} size={84} />}
                      {opt.spatialShape && <PolyominoGridRenderer spec={opt.spatialShape} size={88} />}
                      {opt.punchGrid && <PaperFoldGridRenderer punches={opt.punchGrid} size={88} />}

                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`w-6 h-6 rounded-md font-mono text-xs font-bold flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="text-sm font-medium break-words">{opt.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )
        )}

        {/* Incorrect Feedback Banner */}
        {status === 'incorrect' && errorMessage && (
          <div
            role="alert"
            className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/80 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200 flex items-center justify-between gap-4 text-sm"
          >
            <span>{errorMessage}</span>
            {hintsRevealed < 3 && (
              <button
                type="button"
                onClick={handleRevealHint}
                className="px-3 py-1.5 rounded-lg bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-100 text-xs font-semibold whitespace-nowrap shrink-0"
              >
                Reveal Hint {hintsRevealed + 1}
              </button>
            )}
          </div>
        )}

        {/* Submit / Check Answer Action Bar */}
        {status !== 'completed' && (
          <div className="pt-2 flex items-center justify-end">
            <button
              type="button"
              onClick={handleSubmit}
              className="w-full sm:w-auto min-h-[48px] px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer whitespace-nowrap shrink-0"
            >
              <Check className="w-4 h-4" />
              <span>Check Answer</span>
            </button>
          </div>
        )}
      </div>

      {/* Level Completion Celebration Card */}
      {status === 'completed' && (
        <div className="p-6 sm:p-8 rounded-2xl border-2 border-emerald-500/80 bg-emerald-50/40 dark:bg-emerald-950/25 space-y-5 animate-in fade-in duration-200">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-mono text-emerald-700 dark:text-emerald-300">
                  Level {level.levelNumber} Complete · Tier {level.tier} ({level.tierName})
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Verified Answer: {level.correctAnswerDisplay}
                </h2>
              </div>
            </div>

            <div className="text-xs font-mono text-slate-600 dark:text-slate-300 tabular-nums">
              <span>Attempts: {attemptsCount}</span>
              <span className="mx-2" aria-hidden="true">·</span>
              <span>Hints Used: {hintsRevealed}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200/80 dark:border-emerald-900/50 space-y-1.5">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Logical Proof & Solution Explanation
            </div>
            <p className="text-sm sm:text-base text-slate-800 dark:text-slate-200 leading-relaxed">
              {level.explanation}
            </p>
          </div>

          {level.levelNumber % 100 === 0 && (
            <div className="p-4 rounded-xl bg-indigo-600 text-white flex items-center justify-between">
              <div>
                <div className="text-xs font-mono opacity-80">Tier Milestone Reached</div>
                <div className="text-base font-bold">
                  Congratulations! You have mastered all 100 levels of Tier {level.tier} ({level.tierName})!
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={onBackToLevels}
              className="min-h-[48px] px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
            >
              Return to Level Map
            </button>
            {level.levelNumber < 1000 && (
              <button
                type="button"
                onClick={() => onSelectLevel(level.levelNumber + 1)}
                className="min-h-[48px] px-7 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
              >
                <span>Next Level (Level {level.levelNumber + 1})</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
