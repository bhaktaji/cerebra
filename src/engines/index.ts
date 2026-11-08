import { GameId, GAMES_CATALOGUE, LevelData } from '../domain/types';
import { generateLateralThinkingLevel } from './lateralThinkingEngine';
import { generateLogicDetectiveLevel } from './logicDetectiveEngine';
import { generateMathMysteryLevel } from './mathMysteryEngine';
import { generateMemoryMasterLevel } from './memoryMasterEngine';
import { generateMindInvestigatorLevel } from './mindInvestigatorEngine';
import { generateNumberSequenceLevel } from './numberSequenceEngine';
import { generateOddOneOutLevel } from './oddOneOutEngine';
import { generatePatternMatrixLevel } from './patternMatrixEngine';
import { generateSpatialIntelligenceLevel } from './spatialIntelligenceEngine';
import { generateWordConnectionsLevel } from './wordConnectionsEngine';

const GENERATORS: Record<GameId, (levelNumber: number) => LevelData> = {
  'number-sequence': generateNumberSequenceLevel,
  'pattern-matrix': generatePatternMatrixLevel,
  'word-connections': generateWordConnectionsLevel,
  'lateral-thinking': generateLateralThinkingLevel,
  'logic-detective': generateLogicDetectiveLevel,
  'odd-one-out': generateOddOneOutLevel,
  'math-mystery': generateMathMysteryLevel,
  'memory-master': generateMemoryMasterLevel,
  'spatial-intelligence': generateSpatialIntelligenceLevel,
  'mind-investigator': generateMindInvestigatorLevel,
};

/**
 * Generates or retrieves the deterministic LevelData for any (gameId, levelNumber) in 1..1000.
 */
export function getLevelData(gameId: GameId, levelNumber: number): LevelData {
  const clamped = Math.max(1, Math.min(1000, Math.floor(levelNumber)));
  const generator = GENERATORS[gameId];
  if (!generator) {
    throw new Error(`Unknown gameId: ${gameId}`);
  }
  return generator(clamped);
}

/**
 * Validates a user's submitted option ID or free-text answer against a LevelData definition.
 */
export function validateLevelAnswer(
  level: LevelData,
  submission: { optionId?: string; textAnswer?: string }
): boolean {
  if (submission.optionId) {
    return submission.optionId === level.correctOptionId;
  }
  if (submission.textAnswer !== undefined) {
    const cleaned = submission.textAnswer.trim().toLowerCase();
    if (!cleaned) return false;
    if (cleaned === level.correctAnswerDisplay.trim().toLowerCase()) {
      return true;
    }
    if (level.acceptedTextAnswers && level.acceptedTextAnswers.length > 0) {
      return level.acceptedTextAnswers.some((kw) => {
        const normKw = kw.trim().toLowerCase();
        return cleaned === normKw || (normKw.length >= 3 && cleaned.includes(normKw));
      });
    }
  }
  return false;
}

export interface GameValidationReport {
  gameId: GameId;
  gameName: string;
  totalLevelsChecked: number;
  uniqueIdsCount: number;
  uniqueSignaturesCount: number;
  deterministicMatches: number;
  validAnswersCount: number;
  tierDistributionValid: boolean;
  passed: boolean;
  durationMs: number;
}

/**
 * Runs a live verification pass across all 1,000 levels of a specific game (or all 10,000 levels).
 */
export function verifyGameLevels(gameId: GameId): GameValidationReport {
  const start = performance.now();
  const meta = GAMES_CATALOGUE.find((g) => g.id === gameId)!;
  const ids = new Set<string>();
  const signatures = new Set<string>();
  let deterministicMatches = 0;
  let validAnswersCount = 0;
  let tierDistributionValid = true;

  for (let lvl = 1; lvl <= 1000; lvl++) {
    const a = getLevelData(gameId, lvl);
    const b = getLevelData(gameId, lvl);
    ids.add(a.id);
    signatures.add(a.signature);

    if (
      a.id === b.id &&
      a.signature === b.signature &&
      a.correctOptionId === b.correctOptionId &&
      a.correctAnswerDisplay === b.correctAnswerDisplay
    ) {
      deterministicMatches++;
    }

    const expectedTier = Math.floor((lvl - 1) / 100) + 1;
    if (a.tier !== expectedTier) {
      tierDistributionValid = false;
    }

    const hasCorrectOption = a.options.some((o) => o.id === a.correctOptionId);
    const matchesValidator = validateLevelAnswer(a, { optionId: a.correctOptionId });
    if (
      hasCorrectOption &&
      matchesValidator &&
      a.options.length >= 3 &&
      a.hints.length === 3 &&
      a.explanation.length > 20
    ) {
      validAnswersCount++;
    }
  }

  const durationMs = Math.round((performance.now() - start) * 100) / 100;
  const passed =
    ids.size === 1000 &&
    signatures.size === 1000 &&
    deterministicMatches === 1000 &&
    validAnswersCount === 1000 &&
    tierDistributionValid;

  return {
    gameId,
    gameName: meta.name,
    totalLevelsChecked: 1000,
    uniqueIdsCount: ids.size,
    uniqueSignaturesCount: signatures.size,
    deterministicMatches,
    validAnswersCount,
    tierDistributionValid,
    passed,
    durationMs,
  };
}
