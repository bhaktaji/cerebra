import {
  createInitialProgress,
  createInitialStatistics,
  evaluateAchievements,
} from '../data/storage';
import { GAMES_CATALOGUE, getTierForLevel } from '../domain/types';
import { getLevelData, validateLevelAnswer, verifyGameLevels } from '../engines';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`ASSERTION FAILED: ${message}`);
  }
}

export function runFullVerificationSuite(): void {
  console.log('=== CEREBRA 10-GAME / 10,000-LEVEL AUTOMATED TEST SUITE ===');
  const suiteStart = performance.now();

  // 1. Catalogue verification
  assert(GAMES_CATALOGUE.length === 10, `Expected 10 games, got ${GAMES_CATALOGUE.length}`);

  let grandTotalLevels = 0;
  let grandTotalUniqueSignatures = 0;

  // 2. Content & Determinism Validation across all 10,000 levels
  for (const game of GAMES_CATALOGUE) {
    const report = verifyGameLevels(game.id);
    console.log(
      `[PASS] ${game.index}. ${game.name.padEnd(22)} | Levels: ${report.totalLevelsChecked} | Unique IDs: ${report.uniqueIdsCount} | Unique Puzzles: ${report.uniqueSignaturesCount} | Deterministic: ${report.deterministicMatches}/1000 | Valid Answers: ${report.validAnswersCount}/1000 (${report.durationMs}ms)`
    );

    assert(report.passed, `Game ${game.id} failed level validation report`);
    assert(report.uniqueIdsCount === 1000, `Game ${game.id} did not produce 1000 unique IDs`);
    assert(
      report.uniqueSignaturesCount === 1000,
      `Game ${game.id} had duplicate puzzle signatures (${report.uniqueSignaturesCount}/1000)`
    );
    assert(
      report.deterministicMatches === 1000,
      `Game ${game.id} failed determinism check`
    );
    assert(
      report.validAnswersCount === 1000,
      `Game ${game.id} failed valid answer check`
    );
    assert(report.tierDistributionValid, `Game ${game.id} failed tier distribution check`);

    // Test incorrect option rejection & direct text input validation on sample levels across tiers
    for (const sampleLvlNum of [1, 50, 150, 275, 420, 680, 890, 1000]) {
      const lvl = getLevelData(game.id, sampleLvlNum);
      const wrongOpt = lvl.options.find((o) => o.id !== lvl.correctOptionId);
      assert(Boolean(wrongOpt), `No distractor found for ${lvl.id}`);
      assert(
        validateLevelAnswer(lvl, { optionId: lvl.correctOptionId }) === true,
        `Correct option rejected for ${lvl.id}`
      );
      assert(
        validateLevelAnswer(lvl, { optionId: wrongOpt!.id }) === false,
        `Wrong option accepted for ${lvl.id}`
      );
      assert(
        validateLevelAnswer(lvl, { textAnswer: lvl.correctAnswerDisplay }) === true,
        `Direct text answer rejected for ${lvl.id}`
      );
      assert(
        validateLevelAnswer(lvl, { textAnswer: '__INVALID_ANSWER__' }) === false,
        `Invalid text answer accepted for ${lvl.id}`
      );
    }

    grandTotalLevels += report.totalLevelsChecked;
    grandTotalUniqueSignatures += report.uniqueSignaturesCount;
  }

  assert(grandTotalLevels === 10000, `Expected 10,000 total levels, checked ${grandTotalLevels}`);
  assert(
    grandTotalUniqueSignatures === 10000,
    `Expected 10,000 unique signatures, got ${grandTotalUniqueSignatures}`
  );

  // 3. Tier boundary verification
  assert(getTierForLevel(1).tier === 1 && getTierForLevel(100).tier === 1, 'Tier 1 boundary error');
  assert(getTierForLevel(101).tier === 2 && getTierForLevel(200).tier === 2, 'Tier 2 boundary error');
  assert(getTierForLevel(500).tier === 5 && getTierForLevel(501).tier === 6, 'Tier 5/6 boundary error');
  assert(getTierForLevel(901).tier === 10 && getTierForLevel(1000).tier === 10, 'Tier 10 boundary error');

  // 4. Progression & Achievement evaluation tests
  const progress = createInitialProgress();
  const stats = createInitialStatistics();
  assert(progress['number-sequence'].unlockedLevel === 1, 'Initial unlocked level must be 1');

  // Simulate completing Level 1 across all 10 games
  for (const g of GAMES_CATALOGUE) {
    progress[g.id].completedLevels = [1];
    progress[g.id].unlockedLevel = 2;
    progress[g.id].bestScoresByLevel[1] = { attempts: 1, hintsUsed: 0, timestamp: Date.now() };
  }
  const unlockedAch = evaluateAchievements(progress, stats);
  assert(unlockedAch.includes('first-synapse'), 'Expected first-synapse achievement');
  assert(unlockedAch.includes('polymath-initiate'), 'Expected polymath-initiate achievement');
  assert(unlockedAch.includes('flawless-deduction'), 'Expected flawless-deduction achievement');

  const totalElapsed = Math.round((performance.now() - suiteStart) * 100) / 100;
  console.log('-----------------------------------------------------------');
  console.log(
    `ALL 10 GAMES & 10,000 PLAYABLE LEVELS VERIFIED SUCCESSFULLY IN ${totalElapsed}ms`
  );
}

runFullVerificationSuite();
