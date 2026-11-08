import { SeededRandom } from '../domain/prng';
import {
  getTierForLevel,
  LevelData,
  LevelOption,
  PaperFoldSpec,
  SpatialIntelligencePayload,
  SpatialPolyominoSpec,
} from '../domain/types';

// Asymmetric chiral polyomino shapes in a 4x4 grid (0..3, 0..3) so rotations and reflections are always distinct
const BASE_POLYOMINOES: [number, number][][] = [
  [[0, 0], [0, 1], [0, 2], [1, 2], [2, 1]], // F-pentomino
  [[0, 0], [0, 1], [0, 2], [0, 3], [1, 3]], // L-pentomino
  [[0, 0], [0, 1], [1, 1], [1, 2], [2, 2], [2, 3]], // Stair-hexomino
  [[0, 1], [1, 0], [1, 1], [1, 2], [2, 2]], // P-variant
  [[0, 0], [1, 0], [1, 1], [1, 2], [2, 2]], // Z-pentomino
  [[0, 0], [0, 1], [0, 2], [1, 1], [2, 1], [2, 2]], // Hooked T-hexomino
  [[0, 0], [0, 1], [1, 1], [2, 1], [2, 2], [3, 2]], // Extended S
  [[0, 0], [0, 1], [0, 2], [1, 0], [2, 1]], // Asymmetric cluster
  [[1, 0], [0, 1], [1, 1], [2, 1], [2, 2], [2, 3]], // Offset cross-arm
  [[0, 0], [1, 0], [2, 0], [2, 1], [1, 2], [1, 3]], // Bent J-hexomino
];

function transformPoint(
  [x, y]: [number, number],
  rotation: number,
  mirrored: boolean
): [number, number] {
  let px = mirrored ? 3 - x : x;
  let py = y;
  const steps = ((rotation / 90) % 4 + 4) % 4;
  for (let s = 0; s < steps; s++) {
    const nx = 3 - py;
    const ny = px;
    px = nx;
    py = ny;
  }
  return [px, py];
}

function buildTransformedPolyomino(
  baseCells: [number, number][],
  rotation: number,
  mirrored: boolean,
  accentIdx: number
): SpatialPolyominoSpec {
  const transformed = baseCells.map((pt) => transformPoint(pt, rotation, mirrored));
  const accentCell = transformPoint(baseCells[accentIdx % baseCells.length], rotation, mirrored);
  return {
    cells: transformed,
    rotation,
    mirrored,
    accentCell,
  };
}

function unfoldPunches(
  initialPunches: [number, number][],
  folds: PaperFoldSpec['folds']
): [number, number][] {
  let points = [...initialPunches];
  // Unfold in reverse order of folds
  for (let i = folds.length - 1; i >= 0; i--) {
    const fold = folds[i];
    const nextMap = new Map<string, [number, number]>();
    for (const [x, y] of points) {
      nextMap.set(`${x},${y}`, [x, y]);
      let rx = x;
      let ry = y;
      if (fold === 'left-to-right' || fold === 'right-to-left') {
        rx = 3 - x;
      } else if (fold === 'top-to-bottom' || fold === 'bottom-to-top') {
        ry = 3 - y;
      } else if (fold === 'diag-main') {
        rx = y;
        ry = x;
      }
      nextMap.set(`${rx},${ry}`, [rx, ry]);
    }
    points = Array.from(nextMap.values());
  }
  return points.sort((a, b) => (a[1] !== b[1] ? a[1] - b[1] : a[0] - b[0]));
}

export function generateSpatialIntelligenceLevel(levelNumber: number): LevelData {
  const tierMeta = getTierForLevel(levelNumber);
  const tier = tierMeta.tier;
  const idxInTier = (levelNumber - 1) % 100;
  const rng = new SeededRandom(`spatial-intelligence-v1-${levelNumber}`);

  const subModes: SpatialIntelligencePayload['subMode'][] = [
    'mental-rotation',
    'paper-folding',
    'chiral-discrimination',
  ];
  const subMode = subModes[(levelNumber - 1) % 3];

  const basePolyIdx = Math.floor((levelNumber - 1) / 3) % BASE_POLYOMINOES.length;
  const baseCells = BASE_POLYOMINOES[basePolyIdx];
  const accentIdx = Math.floor((levelNumber - 1) / 30) % baseCells.length;

  if (subMode === 'mental-rotation' || subMode === 'chiral-discrimination') {
    const refRot = ((levelNumber * 90) % 360);
    const targetRotDelta = ([90, 180, 270] as const)[Math.floor(levelNumber / 3) % 3];
    const targetRot = (refRot + targetRotDelta) % 360;

    const referenceShape = buildTransformedPolyomino(baseCells, refRot, false, accentIdx);
    const correctShape = buildTransformedPolyomino(baseCells, targetRot, false, accentIdx);

    // Build 3 chiral-reflected or mis-rotated distractors
    const d1 = buildTransformedPolyomino(baseCells, targetRot, true, accentIdx); // mirrored at target angle
    const d2 = buildTransformedPolyomino(baseCells, (targetRot + 90) % 360, true, accentIdx); // mirrored + 90
    const d3 = buildTransformedPolyomino(
      baseCells,
      (targetRot + 180) % 360,
      subMode === 'chiral-discrimination',
      (accentIdx + 1) % baseCells.length // displaced anchor marker
    );

    const candidates = rng.shuffle([
      { id: 'sp-correct', label: `Rotated ${targetRotDelta}° clockwise (True Rigid Rotation)`, shape: correctShape, isCorrect: true },
      { id: 'sp-d1', label: `Mirrored Reflection at ${targetRot}° (Chiral Flip)`, shape: d1, isCorrect: false },
      { id: 'sp-d2', label: `Mirrored Reflection at ${(targetRot + 90) % 360}°`, shape: d2, isCorrect: false },
      { id: 'sp-d3', label: `Shifted Anchor Node at ${(targetRot + 180) % 360}°`, shape: d3, isCorrect: false },
    ]);

    const options: LevelOption[] = candidates.map((c, idx) => ({
      id: `sp-opt-${idx}`,
      label: `Candidate Figure ${String.fromCharCode(65 + idx)}`,
      sublabel: c.label,
      spatialShape: c.shape,
    }));
    const correctOption = options[candidates.findIndex((c) => c.isCorrect)];

    const prompt =
      subMode === 'mental-rotation'
        ? `Rotate the reference polyomino ${targetRotDelta}° clockwise in the 2D plane without flipping it. Which candidate figure matches the exact rotated shape and anchor marker?`
        : `Identify the only candidate figure that can be obtained by a pure 2D planar rotation (${targetRotDelta}° CW) of the reference figure—rejecting all mirror reflections.`;

    return {
      id: `spatial-intelligence-L${String(levelNumber).padStart(4, '0')}`,
      gameId: 'spatial-intelligence',
      levelNumber,
      tier,
      tierName: tierMeta.name,
      title: `Spatial Projection #${levelNumber}`,
      prompt,
      signature: `SI-L${levelNumber}-${subMode}-poly${basePolyIdx}-rot${refRot}->${targetRot}-acc${accentIdx}`,
      payload: {
        type: 'spatial-intelligence',
        subMode,
        referenceShape,
        targetTransformation: `${targetRotDelta}° Clockwise Planar Rotation (No Mirror Flip)`,
      },
      options,
      correctOptionId: correctOption.id,
      correctAnswerDisplay: `${correctOption.label} (${targetRotDelta}° CW Rigid Rotation)`,
      hints: [
        `Track the highlighted anchor square inside the polyomino first as it rotates ${targetRotDelta}° clockwise around the center of the 4×4 grid.`,
        `Check the handedness (chirality) of the L-bend relative to the anchor square—mirror flips reverse left/right turns.`,
        `${correctOption.label} preserves both the ${targetRotDelta}° clockwise orientation and true chiral handedness.`,
      ],
      explanation: `Rotating the reference polyomino by ${targetRotDelta}° clockwise maps the anchor node to (${correctShape.accentCell[0] + 1}, ${correctShape.accentCell[1] + 1}) while preserving right-handed chirality. All other candidates either invert the shape across a mirror axis or displace the anchor.`,
    };
  } else {
    // Paper Folding & Symmetric Hole Punch Deduction
    const allFoldChoices: PaperFoldSpec['folds'][number][] = [
      'left-to-right',
      'top-to-bottom',
      'diag-main',
    ];
    const foldCount = tier <= 3 ? 1 : tier <= 7 ? 2 : 3;
    const folds: PaperFoldSpec['folds'] = [];
    for (let f = 0; f < foldCount; f++) {
      folds.push(allFoldChoices[(Math.floor(levelNumber / 3) + f) % allFoldChoices.length]);
    }

    const p1: [number, number] = [idxInTier % 2, Math.floor(idxInTier / 2) % 2];
    const p2: [number, number] = [(idxInTier + 1) % 2 + 2, (Math.floor(idxInTier / 4) % 2) + 2];
    const initialPunches: [number, number][] = tier >= 5 ? [p1, p2] : [p1];
    const unfoldedPunches = unfoldPunches(initialPunches, folds);

    // Distractor punch grids
    const dGrid1 = unfoldedPunches.slice(0, Math.max(1, unfoldedPunches.length - 1));
    const dGrid2: [number, number][] = unfoldedPunches.map(([x, y]) => [(x + 1) % 4, y]);
    const dGrid3: [number, number][] = unfoldedPunches.map(([x, y]) => [x, (y + 1) % 4]);

    const fmtGrid = (pts: [number, number][]) =>
      pts.map(([x, y]) => `${String.fromCharCode(65 + y)}${x + 1}`).join(', ');

    const correctCoordsText = fmtGrid(unfoldedPunches);

    const candidates = rng.shuffle([
      { label: `Pattern (${unfoldedPunches.length} holes): ${correctCoordsText}`, grid: unfoldedPunches, isCorrect: true },
      { label: `Pattern (${dGrid1.length} holes): ${fmtGrid(dGrid1)}`, grid: dGrid1, isCorrect: false },
      { label: `Pattern (${dGrid2.length} holes): ${fmtGrid(dGrid2)}`, grid: dGrid2, isCorrect: false },
      { label: `Pattern (${dGrid3.length} holes): ${fmtGrid(dGrid3)}`, grid: dGrid3, isCorrect: false },
    ]);

    const options: LevelOption[] = candidates.map((c, idx) => ({
      id: `pf-opt-${idx}`,
      label: c.label,
      punchGrid: c.grid,
    }));
    const correctOption = options[candidates.findIndex((c) => c.isCorrect)];

    return {
      id: `spatial-intelligence-L${String(levelNumber).padStart(4, '0')}`,
      gameId: 'spatial-intelligence',
      levelNumber,
      tier,
      tierName: tierMeta.name,
      title: `Symmetric Crease Unfold #${levelNumber}`,
      prompt: `A 4×4 sheet is folded along [${folds.join(' → ')}] and punched at ${fmtGrid(initialPunches)}. Determine the complete set of hole coordinates when the sheet is fully unfolded.`,
      signature: `SI-L${levelNumber}-fold-${folds.join(',')}-init:${fmtGrid(initialPunches)}=>${correctCoordsText}`,
      payload: {
        type: 'spatial-intelligence',
        subMode: 'paper-folding',
        paperFold: {
          folds,
          initialPunches,
          unfoldedPunches,
        },
        targetTransformation: `Unfold reverse sequence: ${[...folds].reverse().join(' → ')}`,
      },
      options,
      correctOptionId: correctOption.id,
      correctAnswerDisplay: correctOption.label,
      hints: [
        `Always unfold in the exact REVERSE order of the folds: start with the last fold (${folds[folds.length - 1]}).`,
        `Each vertical fold reflects column x to (4 - x); each horizontal fold reflects row y to (4 - y); a diagonal fold swaps (row, col).`,
        `Unfolding all ${folds.length} creases produces ${unfoldedPunches.length} symmetric holes at ${correctCoordsText}.`,
      ],
      explanation: `Unfolding the creases in reverse order ([${[...folds].reverse().join(' → ')}]) reflects the initial punch at ${fmtGrid(initialPunches)} across each crease axis, producing the symmetric pattern: ${correctCoordsText}.`,
    };
  }
}
