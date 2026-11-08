import { SeededRandom } from '../domain/prng';
import { getTierForLevel, LevelData, LevelOption, MatrixCellSpec, PatternMatrixPayload } from '../domain/types';

const OUTER_SHAPES: MatrixCellSpec['outerShape'][] = [
  'circle',
  'triangle',
  'square',
  'diamond',
  'pentagon',
  'hexagon',
  'cross',
  'star',
];

const INNER_SHAPES: MatrixCellSpec['innerShape'][] = [
  'dot',
  'circle',
  'triangle',
  'square',
  'cross',
  'ring',
  'none',
];

const FILLS: MatrixCellSpec['fill'][] = ['outline', 'tinted', 'solid', 'striped', 'duotone'];

function cellKey(c: MatrixCellSpec): string {
  return `${c.outerShape}|${c.innerShape}|${c.rotation}|${c.fill}|${c.dots}|${c.scale}|${c.linesMask}`;
}

export function generatePatternMatrixLevel(levelNumber: number): LevelData {
  const tierMeta = getTierForLevel(levelNumber);
  const tier = tierMeta.tier;
  const idxInTier = (levelNumber - 1) % 100;
  const rng = new SeededRandom(`pattern-matrix-v1-${levelNumber}`);

  const gridSize: 2 | 3 = tier === 1 && idxInTier < 50 ? 2 : 3;
  const totalCells = gridSize * gridSize;

  // Deterministic parameters derived from levelNumber so every level has a unique visual matrix
  const shapeOffset = levelNumber % OUTER_SHAPES.length;
  const shapeStride = (Math.floor(levelNumber / OUTER_SHAPES.length) % (OUTER_SHAPES.length - 1)) + 1;
  const rowShapes: MatrixCellSpec['outerShape'][] = [
    OUTER_SHAPES[shapeOffset],
    OUTER_SHAPES[(shapeOffset + shapeStride) % OUTER_SHAPES.length],
    OUTER_SHAPES[(shapeOffset + 2 * shapeStride) % OUTER_SHAPES.length],
  ];

  const innerOffset = (levelNumber * 3) % INNER_SHAPES.length;
  const colInnerShapes: MatrixCellSpec['innerShape'][] = [
    INNER_SHAPES[innerOffset],
    INNER_SHAPES[(innerOffset + 1) % INNER_SHAPES.length],
    INNER_SHAPES[(innerOffset + 2) % INNER_SHAPES.length],
  ];

  const fillOffset = (levelNumber * 5) % FILLS.length;
  const fillCycle: MatrixCellSpec['fill'][] = [
    FILLS[fillOffset],
    FILLS[(fillOffset + 1) % FILLS.length],
    FILLS[(fillOffset + 2) % FILLS.length],
  ];

  const baseAngle = ((levelNumber * 15) % 360);
  const rotStepRow = ((idxInTier % 3) + 1) * 45;
  const rotStepCol = ((Math.floor(idxInTier / 3) % 3) + 1) * 45;

  const baseDots = (idxInTier % 2) + 1;
  const dotStep = (Math.floor(idxInTier / 20) % 2) + 1;

  // For XOR / Boolean line masks in higher tiers
  const rowMasks: [number, number][] = [
    [(idxInTier % 14) + 1, ((idxInTier * 3 + 2) % 14) + 1],
    [((idxInTier * 5 + 1) % 14) + 1, ((idxInTier * 7 + 3) % 14) + 1],
    [((idxInTier * 11 + 4) % 14) + 1, ((idxInTier * 13 + 6) % 14) + 1],
  ];

  const fullGrid: MatrixCellSpec[] = [];
  let ruleSummary = '';
  let hint1 = '';
  let hint2 = '';
  let hint3 = '';
  let explanation = '';

  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      let outerShape: MatrixCellSpec['outerShape'] = rowShapes[0];
      let innerShape: MatrixCellSpec['innerShape'] = colInnerShapes[0];
      let rotation = baseAngle;
      let fill: MatrixCellSpec['fill'] = fillCycle[0];
      let dots = baseDots;
      let scale = 0.85;
      let linesMask = 0;

      if (tier === 1) {
        // Single rule: outer shape progresses across columns, rotation progresses down rows
        outerShape = rowShapes[c % gridSize];
        rotation = (baseAngle + r * rotStepRow) % 360;
        dots = (r + c + (idxInTier % 3)) % 4 + 1;
        ruleSummary = 'Column Outer Shape Cycle + Row Angular Step';
        hint1 = 'Look across each row from left to right and observe how the outer geometric shape changes.';
        hint2 = `Column ${gridSize} always uses the ${rowShapes[gridSize - 1]} outer contour, rotated by +${rotStepRow}° per row.`;
        hint3 = `Target cell requires a ${rowShapes[gridSize - 1]} at ${(baseAngle + (gridSize - 1) * rotStepRow) % 360}° with ${(gridSize - 1 + gridSize - 1 + (idxInTier % 3)) % 4 + 1} inner dots.`;
        explanation = `Across each row, the outer shape cycles (${rowShapes.slice(0, gridSize).join(' → ')}). Down each column, rotation increments by +${rotStepRow}° and inner dots follow (row + col) progression.`;
      } else if (tier <= 3) {
        // Dual rule: Latin square shape permutation + fill progression
        outerShape = rowShapes[(r + c) % 3];
        fill = fillCycle[c];
        rotation = (baseAngle + r * rotStepRow) % 360;
        dots = ((r + baseDots - 1) % 5) + 1;
        ruleSummary = 'Diagonal Latin Shape Shift + Column Fill Style';
        hint1 = 'Every row contains the exact same three outer shapes, shifted one position to the left each row.';
        hint2 = `Check the fill style in the third column—every cell in column 3 uses the "${fillCycle[2]}" fill.`;
        hint3 = `Combine the missing shape (${rowShapes[(2 + 2) % 3]}), third-column fill (${fillCycle[2]}), and third-row rotation (${(baseAngle + 2 * rotStepRow) % 360}°).`;
        explanation = `Outer shapes form a Latin square where each row contains ${rowShapes.join(', ')}. Fill style is locked per column (${fillCycle.join(', ')}), leaving ${rowShapes[1]} with ${fillCycle[2]} fill for the bottom-right cell.`;
      } else if (tier <= 5) {
        // Three rules: Outer Latin square + Inner shape column cycle + Additive dot arithmetic across rows
        outerShape = rowShapes[(r + c) % 3];
        innerShape = colInnerShapes[(r * 2 + c) % 3];
        fill = fillCycle[(r + c) % 3];
        const rowDot1 = (r + (idxInTier % 2)) + 1;
        const rowDot2 = (idxInTier % 2) + 1;
        dots = c === 0 ? rowDot1 : c === 1 ? rowDot2 : rowDot1 + rowDot2;
        rotation = (baseAngle + c * rotStepCol) % 360;
        ruleSummary = 'Row Dot Addition (Col 1 + Col 2 = Col 3) + Latin Shape & Fill Permutations';
        hint1 = 'Count the dots in Column 1 and Column 2 of each row and compare their sum to Column 3.';
        hint2 = 'In every row, the number of dots in the 3rd cell equals the sum of dots in the 1st and 2nd cells.';
        hint3 = `In Row 3, dots = ${3 + (idxInTier % 2)} + ${(idxInTier % 2) + 1} = ${dots}, inside a ${fill} ${outerShape}.`;
        explanation = `Three simultaneous matrix laws operate: (1) Outer shapes and fills permute diagonally in a Latin square; (2) Inner motifs shift by (2·row + col) mod 3; (3) Column 3's dot count equals Column 1 + Column 2 (${dots} dots).`;
      } else if (tier <= 8) {
        // Tier 6-8: Bitwise XOR Spokes Overlay + Shape Rotation + Scale Progression
        outerShape = rowShapes[(r + c * 2) % 3];
        innerShape = colInnerShapes[(r + c) % 3];
        fill = fillCycle[r];
        scale = c === 0 ? 0.72 : c === 1 ? 0.86 : 1.0;
        rotation = (baseAngle + r * rotStepRow + c * rotStepCol) % 360;
        const m0 = rowMasks[r][0];
        const m1 = rowMasks[r][1];
        linesMask = c === 0 ? m0 : c === 1 ? m1 : (m0 ^ m1) || 15;
        dots = ((r + c + idxInTier) % 5) + 1;
        ruleSummary = 'Row Bitwise XOR Axis Spokes + Dual-Axis Rotation & Scale';
        hint1 = 'Inspect the axial spoke lines radiating from the center of each cell across Row 1 and Row 2.';
        hint2 = 'Column 3 retains only the spoke lines that appear in Column 1 OR Column 2, but NOT both (XOR rule).';
        hint3 = `Combine the XOR spoke pattern with Row 3's "${fillCycle[2]}" fill and outer ${outerShape} rotated to ${rotation}°.`;
        explanation = `Axis spokes across each row obey symmetric difference (XOR): lines present in both Col 1 and Col 2 cancel out in Col 3. Combined with the 2D rotation lattice (+${rotStepRow}° row, +${rotStepCol}° col) and outer ${outerShape}, the target cell is uniquely determined.`;
      } else {
        // Tier 9-10 (Expert / Master): 4-Attribute Coupled Raven Matrix (Outer + Inner + XOR Lines + Modular Dot & Rotation)
        outerShape = rowShapes[(r * 2 + c) % 3];
        innerShape = colInnerShapes[(r + c * 2) % 3];
        fill = fillCycle[(r + c) % 3];
        rotation = (baseAngle + r * rotStepRow + c * rotStepCol) % 360;
        dots = ((r * 2 + c + idxInTier) % 5) + 1;
        const m0 = rowMasks[r][0];
        const m1 = rowMasks[r][1];
        linesMask = c === 0 ? m0 : c === 1 ? m1 : (m0 ^ m1) || 7;
        scale = ((r + c) % 3) === 0 ? 0.75 : ((r + c) % 3) === 1 ? 0.88 : 1.0;
        ruleSummary = 'Master 4-Rule Raven Synthesis (Orthogonal Latin Squares + XOR Spokes + Vector Rotation)';
        hint1 = 'Note that Outer Shape and Inner Shape follow orthogonal Latin-square shifts (one shifts left per row, the other shifts right).';
        hint2 = 'Verify the radial spoke lines across each row using the XOR cancellation rule (shared spokes disappear in Column 3).';
        hint3 = `Target cell (3,3) requires outer ${outerShape}, inner ${innerShape}, ${fill} fill, ${dots} dots, and ${rotation}° orientation.`;
        explanation = `This Master matrix couples two orthogonal Latin squares (outer shape = (2r+c) mod 3; inner shape = (r+2c) mod 3) with diagonal fill permutation, row-wise XOR radial spokes, and a 2D angular step (+${rotStepRow}°/row, +${rotStepCol}°/col).`;
      }

      fullGrid.push({
        outerShape,
        innerShape,
        rotation,
        fill,
        dots,
        scale,
        linesMask,
      });
    }
  }

  const targetCell = fullGrid[totalCells - 1];
  const displayCells: (MatrixCellSpec | null)[] = fullGrid.map((c, idx) =>
    idx === totalCells - 1 ? null : c
  );

  // Build near-miss visual distractors that mutate 1 or 2 attributes of targetCell
  const distractors: MatrixCellSpec[] = [];
  const seenKeys = new Set<string>([cellKey(targetCell)]);

  const candidateMutations: Partial<MatrixCellSpec>[] = [
    { outerShape: rowShapes[0] !== targetCell.outerShape ? rowShapes[0] : rowShapes[2] },
    { outerShape: OUTER_SHAPES[(OUTER_SHAPES.indexOf(targetCell.outerShape) + 1) % OUTER_SHAPES.length] },
    { rotation: (targetCell.rotation + 90) % 360 },
    { fill: FILLS[(FILLS.indexOf(targetCell.fill) + 1) % FILLS.length], dots: (targetCell.dots % 5) + 1 },
    { innerShape: INNER_SHAPES[(INNER_SHAPES.indexOf(targetCell.innerShape) + 1) % INNER_SHAPES.length], rotation: (targetCell.rotation + 45) % 360 },
    { dots: ((targetCell.dots + 1) % 5) + 1, linesMask: (targetCell.linesMask ^ 0b0101) },
    { outerShape: OUTER_SHAPES[(OUTER_SHAPES.indexOf(targetCell.outerShape) + 2) % OUTER_SHAPES.length], fill: FILLS[(FILLS.indexOf(targetCell.fill) + 2) % FILLS.length] },
  ];

  for (const mut of rng.shuffle(candidateMutations)) {
    const d: MatrixCellSpec = { ...targetCell, ...mut };
    const k = cellKey(d);
    if (!seenKeys.has(k)) {
      seenKeys.add(k);
      distractors.push(d);
      if (distractors.length === (tier >= 7 ? 5 : 3)) break;
    }
  }

  const allCellSpecs = rng.shuffle([targetCell, ...distractors]);
  const options: LevelOption[] = allCellSpecs.map((spec, i) => ({
    id: `mat-opt-${i}`,
    label: `${spec.outerShape} (${spec.fill}, ${spec.rotation}°, ${spec.dots}d)`,
    matrixCell: spec,
  }));

  const correctOption = options.find((o) => cellKey(o.matrixCell!) === cellKey(targetCell))!;

  const payload: PatternMatrixPayload = {
    type: 'pattern-matrix',
    gridSize,
    cells: displayCells,
    ruleSummary,
  };

  return {
    id: `pattern-matrix-L${String(levelNumber).padStart(4, '0')}`,
    gameId: 'pattern-matrix',
    levelNumber,
    tier,
    tierName: tierMeta.name,
    title: `Visual Matrix #${levelNumber}`,
    prompt: `Analyze the ${gridSize}×${gridSize} geometric matrix across rows and columns to identify the missing tile in the bottom-right corner.`,
    signature: `PM-L${levelNumber}-${gridSize}x${gridSize}-${fullGrid.map(cellKey).join(';')}`,
    payload,
    options,
    correctOptionId: correctOption.id,
    correctAnswerDisplay: `${targetCell.fill} ${targetCell.outerShape} (${targetCell.rotation}°, ${targetCell.dots} dots)`,
    hints: [hint1, hint2, hint3],
    explanation,
  };
}
