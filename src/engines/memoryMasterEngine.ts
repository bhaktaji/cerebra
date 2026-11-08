import { SeededRandom } from '../domain/prng';
import { getTierForLevel, LevelData, LevelOption, MemoryMasterPayload } from '../domain/types';

const SYMBOLS = ['◆', '▲', '●', '■', '★', '✦', '❖', '⬢', '⬟', '⊕', '⊗', '∆'];

function indexToCoord(idx: number, gridSize: number): string {
  const row = String.fromCharCode(65 + Math.floor(idx / gridSize));
  const col = (idx % gridSize) + 1;
  return `${row}${col}`;
}

export function generateMemoryMasterLevel(levelNumber: number): LevelData {
  const tierMeta = getTierForLevel(levelNumber);
  const tier = tierMeta.tier;
  const idxInTier = (levelNumber - 1) % 100;
  const rng = new SeededRandom(`memory-master-v1-${levelNumber}`);

  const subModes: MemoryMasterPayload['subMode'][] = [
    'spatial-grid',
    'ordered-sequence',
    'symbol-mutation',
  ];
  const subMode = subModes[(levelNumber - 1) % 3];

  // Grid size scales from 3x3 (Tiers 1-2) -> 4x4 (Tiers 3-5) -> 5x5 (Tiers 6-8) -> 6x6 (Tiers 9-10)
  const gridSize = tier <= 2 ? 3 : tier <= 5 ? 4 : tier <= 8 ? 5 : 6;
  const totalCells = gridSize * gridSize;

  // Target count scales from 3 to 9
  const targetCount = Math.min(totalCells - 2, Math.max(3, 2 + Math.ceil(tier * 0.7) + (idxInTier % 2)));
  const studyDurationMs = Math.max(2200, 4200 - tier * 180);

  const allIndices = Array.from({ length: totalCells }, (_, i) => i);
  const selectedCells = rng.sample(allIndices, targetCount);

  let recallPrompt = '';
  let correctLabel = '';
  let distractors: string[] = [];
  let hint1 = '';
  let hint2 = '';
  let hint3 = '';
  let explanation = '';
  let payload: MemoryMasterPayload;

  if (subMode === 'spatial-grid') {
    const sortedTargets = [...selectedCells].sort((a, b) => a - b);
    const coordList = sortedTargets.map((idx) => indexToCoord(idx, gridSize));
    correctLabel = coordList.join(' · ');

    // Build 3 distinct distractor patterns by swapping 1 or 2 coordinates
    const nonTargetCells = allIndices.filter((i) => !sortedTargets.includes(i));
    for (let d = 0; d < 3; d++) {
      const mutated = [...sortedTargets];
      mutated[d % mutated.length] = nonTargetCells[(d + idxInTier) % nonTargetCells.length];
      mutated.sort((a, b) => a - b);
      const lbl = mutated.map((idx) => indexToCoord(idx, gridSize)).join(' · ');
      if (lbl !== correctLabel && !distractors.includes(lbl)) {
        distractors.push(lbl);
      } else {
        const alt = [...sortedTargets];
        alt[(d + 1) % alt.length] = nonTargetCells[(d + 2) % nonTargetCells.length];
        alt.sort((a, b) => a - b);
        distractors.push(alt.map((idx) => indexToCoord(idx, gridSize)).join(' · '));
      }
    }

    recallPrompt = `Memorize the ${targetCount} illuminated cells on the ${gridSize}×${gridSize} matrix, then reconstruct the exact pattern (or select the matching coordinate set).`;
    hint1 = `Group the ${targetCount} cells by rows (Row A = top row, Row B = second row, etc.) to chunk the visual pattern.`;
    hint2 = `The first two active coordinates in reading order are ${coordList.slice(0, 2).join(' and ')}.`;
    hint3 = `The complete set of illuminated cells is ${correctLabel}.`;
    explanation = `During the encoding phase, the ${targetCount} active matrix coordinates in row-major order were ${correctLabel}.`;

    payload = {
      type: 'memory-master',
      subMode: 'spatial-grid',
      gridSize,
      studyDurationMs,
      targetCells: sortedTargets,
      recallPrompt,
    };
  } else if (subMode === 'ordered-sequence') {
    const seqLen = Math.min(8, Math.max(3, 3 + Math.floor(tier / 2)));
    const seqCells = selectedCells.slice(0, seqLen);
    const orderedSteps = seqCells.map((cellIndex, idx) => ({
      cellIndex,
      stepNumber: idx + 1,
    }));
    const coordChain = seqCells.map((idx) => indexToCoord(idx, gridSize));
    correctLabel = coordChain.join(' → ');

    // Distractors permute adjacent steps in the sequence
    const d1 = [...coordChain];
    [d1[0], d1[1]] = [d1[1], d1[0]];
    const d2 = [...coordChain];
    [d2[d2.length - 2], d2[d2.length - 1]] = [d2[d2.length - 1], d2[d2.length - 2]];
    const d3 = [...coordChain].reverse();
    distractors = [d1.join(' → '), d2.join(' → '), d3.join(' → ')];

    recallPrompt = `Encode the exact sequential order (1 to ${seqLen}) in which the nodes appear on the ${gridSize}×${gridSize} grid, then tap them in order.`;
    hint1 = `Anchor the starting node (#1 at ${coordChain[0]}) and the final node (#${seqLen} at ${coordChain[seqLen - 1]}).`;
    hint2 = `The sequence begins with ${coordChain.slice(0, 2).join(' → ')}.`;
    hint3 = `The complete ordered sequence is ${correctLabel}.`;
    explanation = `The sequential memory trace across the ${gridSize}×${gridSize} board followed the path ${correctLabel}.`;

    payload = {
      type: 'memory-master',
      subMode: 'ordered-sequence',
      gridSize,
      studyDurationMs,
      targetCells: seqCells,
      orderedSteps,
      recallPrompt,
    };
  } else {
    // Symbol Mutation mode: A subset of cells displays geometric symbols; in recall, 1 cell changed its symbol!
    const symbolGridBefore = Array.from({ length: totalCells }, (_, i) =>
      selectedCells.includes(i) ? SYMBOLS[(i + levelNumber) % SYMBOLS.length] : ''
    );
    const mutatedCellIndex = selectedCells[levelNumber % selectedCells.length];
    const oldSym = symbolGridBefore[mutatedCellIndex];
    const newSym = SYMBOLS[(SYMBOLS.indexOf(oldSym) + 3) % SYMBOLS.length];
    const symbolGridAfter = [...symbolGridBefore];
    symbolGridAfter[mutatedCellIndex] = newSym;

    const mutatedCoord = indexToCoord(mutatedCellIndex, gridSize);
    correctLabel = `${mutatedCoord} (${oldSym} → ${newSym})`;

    const otherActive = selectedCells.filter((idx) => idx !== mutatedCellIndex);
    distractors = otherActive.slice(0, 3).map((idx) => {
      const s = symbolGridBefore[idx];
      const altS = SYMBOLS[(SYMBOLS.indexOf(s) + 1) % SYMBOLS.length];
      return `${indexToCoord(idx, gridSize)} (${s} → ${altS})`;
    });
    while (distractors.length < 3) {
      distractors.push(`A1 (◆ → ●)`);
    }

    recallPrompt = `Study the symbols placed on the ${gridSize}×${gridSize} matrix. In the recall view, identify which coordinate had its symbol altered.`;
    hint1 = `Scan the ${selectedCells.length} occupied coordinates row by row and encode each symbol's shape.`;
    hint2 = `Look specifically at row ${mutatedCoord[0]} for a symbol that changed from ${oldSym} to ${newSym}.`;
    hint3 = `Coordinate ${mutatedCoord} mutated from ${oldSym} to ${newSym}.`;
    explanation = `All occupied cells retained their original symbols except coordinate ${mutatedCoord}, which changed from ${oldSym} during study to ${newSym} during recall.`;

    payload = {
      type: 'memory-master',
      subMode: 'symbol-mutation',
      gridSize,
      studyDurationMs,
      targetCells: selectedCells,
      symbolGridBefore,
      symbolGridAfter,
      mutatedCellIndex,
      recallPrompt,
    };
  }

  const allOptions = rng.shuffle([correctLabel, ...distractors.slice(0, 3)]);
  const options: LevelOption[] = allOptions.map((lbl, i) => ({
    id: `mem-opt-${i}`,
    label: lbl,
  }));
  const correctOption = options.find((o) => o.label === correctLabel)!;

  return {
    id: `memory-master-L${String(levelNumber).padStart(4, '0')}`,
    gameId: 'memory-master',
    levelNumber,
    tier,
    tierName: tierMeta.name,
    title: `Memory Matrix #${levelNumber}`,
    prompt: recallPrompt,
    signature: `MEM-L${levelNumber}-${subMode}-${gridSize}x${gridSize}-${correctLabel}`,
    payload,
    options,
    correctOptionId: correctOption.id,
    correctAnswerDisplay: correctLabel,
    hints: [hint1, hint2, hint3],
    explanation,
  };
}
