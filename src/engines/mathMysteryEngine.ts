import { SeededRandom } from '../domain/prng';
import { getTierForLevel, LevelData, LevelOption, MathMysteryPayload } from '../domain/types';

export function generateMathMysteryLevel(levelNumber: number): LevelData {
  const tierMeta = getTierForLevel(levelNumber);
  const tier = tierMeta.tier;
  const idxInTier = (levelNumber - 1) % 100;
  const rng = new SeededRandom(`math-mystery-v1-${levelNumber}`);

  const subModes: MathMysteryPayload['subMode'][] = [
    'operator-forge',
    'symbol-balance',
    'magic-grid',
    'constraint-riddle',
  ];
  const subMode = subModes[(levelNumber - 1) % 4];

  let prompt = '';
  let correctDisplay = '';
  let distractors: string[] = [];
  let hint1 = '';
  let hint2 = '';
  let hint3 = '';
  let explanation = '';
  let payload: MathMysteryPayload = {
    type: 'math-mystery',
    subMode,
    allowDirectInput: subMode !== 'operator-forge',
  };

  if (subMode === 'operator-forge') {
    // Reconstruct missing operators between 3 or 4 operands to reach targetValue
    const a = (Math.floor(levelNumber / 4) % 14) + 3;
    const b = (idxInTier % 8) + 2;
    const c = (Math.floor(idxInTier / 8) % 9) + 2;
    const d = (tier + (idxInTier % 5)) + 1;

    const patternIdx = Math.floor((levelNumber - 1) / 4) % 4;
    if (tier <= 4) {
      // 3 operands: a ? b ? c = target
      let target = 0;
      if (patternIdx === 0) {
        target = a * b + c;
        correctDisplay = '× then +';
        distractors = ['+ then ×', '× then -', '+ then -'];
        explanation = `Evaluating with standard operator precedence: (${a} × ${b}) + ${c} = ${a * b} + ${c} = ${target}.`;
      } else if (patternIdx === 1) {
        target = a * b - c;
        correctDisplay = '× then -';
        distractors = ['× then +', '- then ×', '+ then -'];
        explanation = `Multiplying first gives ${a} × ${b} = ${a * b}, and subtracting ${c} yields ${target}.`;
      } else if (patternIdx === 2) {
        target = a + b * c;
        correctDisplay = '+ then ×';
        distractors = ['× then +', '- then ×', '+ then +'];
        explanation = `With multiplication taking precedence over addition: ${a} + (${b} × ${c}) = ${a} + ${b * c} = ${target}.`;
      } else {
        target = (a + b) * c;
        correctDisplay = '( + ) then ×';
        distractors = ['+ then ×', '× then +', '( - ) then ×'];
        explanation = `Grouping the sum first gives (${a} + ${b}) × ${c} = ${a + b} × ${c} = ${target}.`;
      }
      prompt = `Insert the correct operator sequence between [${a}, ${b}, ${c}] so the expression evaluates to exactly ${target}.`;
      hint1 = `Compare the magnitude of the target (${target}) to ${a * b} and ${b * c}.`;
      hint2 = `Test how multiplication vs. addition placement changes the intermediate result.`;
      hint3 = `Applying "${correctDisplay}" produces ${target}.`;
      payload = {
        type: 'math-mystery',
        subMode: 'operator-forge',
        operands: [a, b, c],
        targetValue: target,
        allowDirectInput: false,
      };
    } else {
      // 4 operands for Tiers 5-10: a ? b ? c ? d = target
      let target = 0;
      if (patternIdx === 0) {
        target = a * b + c - d;
        correctDisplay = '× , + , -';
        distractors = ['+ , × , -', '× , - , +', '+ , - , ×'];
        explanation = `Evaluating (${a} × ${b}) + ${c} - ${d} = ${a * b} + ${c} - ${d} = ${target}.`;
      } else if (patternIdx === 1) {
        target = a * b - c * d;
        correctDisplay = '× , - , ×';
        distractors = ['× , + , ×', '+ , × , -', '- , × , +'];
        explanation = `Evaluating (${a} × ${b}) - (${c} × ${d}) = ${a * b} - ${c * d} = ${target}.`;
      } else if (patternIdx === 2) {
        target = (a + b) * c - d;
        correctDisplay = '(+) , × , -';
        distractors = ['+ , × , -', '× , + , -', '(+) , - , ×'];
        explanation = `Grouping the first sum gives (${a} + ${b}) × ${c} - ${d} = ${(a + b) * c} - ${d} = ${target}.`;
      } else {
        target = a + b * c + d;
        correctDisplay = '+ , × , +';
        distractors = ['× , + , +', '+ , + , ×', '× , - , +'];
        explanation = `Multiplying the middle terms gives ${a} + (${b} × ${c}) + ${d} = ${a} + ${b * c} + ${d} = ${target}.`;
      }
      prompt = `Select the three-operator sequence that transforms [${a}, ${b}, ${c}, ${d}] into the target value ${target}.`;
      hint1 = `Estimate which pair of operands must be multiplied to get close to ${target}.`;
      hint2 = `Check the parity and remainder after testing the primary multiplication product.`;
      hint3 = `The operator sequence "${correctDisplay}" yields ${target}.`;
      payload = {
        type: 'math-mystery',
        subMode: 'operator-forge',
        operands: [a, b, c, d],
        targetValue: target,
        allowDirectInput: false,
      };
    }
  } else if (subMode === 'symbol-balance') {
    // Simultaneous symbolic linear system: Δ, Ω, Σ
    const valA = (Math.floor(levelNumber / 4) % 15) + 4; // Δ
    const valB = (idxInTier % 12) + 3; // Ω
    const valC = (tier * 2) + (idxInTier % 7) + 2; // Σ
    const coeff = (tier % 3) + 2;

    const eq1 = `Δ + Δ = ${2 * valA}`;
    const eq2 = `${coeff} × Δ + Ω = ${coeff * valA + valB}`;
    const eq3 = `Ω × Σ - Δ = ${valB * valC - valA}`;
    const targetVal = valA + valB + valC * (tier >= 6 ? 2 : 1);
    const targetExpr = tier >= 6 ? 'Δ + Ω + (2 × Σ)' : 'Δ + Ω + Σ';

    correctDisplay = String(targetVal);
    distractors = [
      String(targetVal + valC),
      String(targetVal - 2),
      String(targetVal + 3),
    ];
    prompt = `Solve the symbolic system to find the exact numerical value of ${targetExpr}.`;
    hint1 = `From the first balance equation (${eq1}), deduce that Δ = ${valA}.`;
    hint2 = `Substitute Δ = ${valA} into the second equation (${eq2}) to find Ω = ${valB}.`;
    hint3 = `From the third equation (${eq3}), Ω × Σ = ${valB * valC}, so Σ = ${valC}. Now evaluate ${targetExpr}.`;
    explanation = `Solving sequentially: (1) Δ = ${2 * valA} / 2 = ${valA}; (2) Ω = ${coeff * valA + valB} - ${coeff}×${valA} = ${valB}; (3) Σ = (${valB * valC - valA} + ${valA}) / ${valB} = ${valC}. Therefore, ${targetExpr} = ${targetVal}.`;
    payload = {
      type: 'math-mystery',
      subMode: 'symbol-balance',
      equations: [eq1, eq2, eq3, `${targetExpr} = ?`],
      targetValue: targetVal,
      allowDirectInput: true,
    };
  } else if (subMode === 'magic-grid') {
    // 3x3 Arithmetic Constraint Grid where each row & column obeys C3 = k*C1 + C2 + offset
    const r0c0 = (idxInTier % 9) + 2;
    const r0c1 = (Math.floor(idxInTier / 9) % 8) + 3;
    const r1c0 = (idxInTier % 7) + 4;
    const r1c1 = (tier + (idxInTier % 6)) + 2;
    const r2c0 = (Math.floor(levelNumber / 12) % 10) + 3;
    const r2c1 = (idxInTier % 5) + 5;

    const mult = (tier % 3) + 1; // 1, 2, or 3
    const offset = Math.floor(levelNumber / 40) % 7;

    const computeCol3 = (x: number, y: number) => mult * x + y + offset;
    const ans = computeCol3(r2c0, r2c1);

    const grid: (number | string)[][] = [
      [r0c0, r0c1, computeCol3(r0c0, r0c1)],
      [r1c0, r1c1, computeCol3(r1c0, r1c1)],
      [r2c0, r2c1, '?'],
    ];

    correctDisplay = String(ans);
    distractors = [String(ans + mult), String(ans - 2), String(ans + 4)];
    prompt = `Deduce the row operator law linking Column 1 and Column 2 to Column 3, then compute the missing value '?' in Row 3.`;
    hint1 = `Compare (Col 1, Col 2) to Col 3 in Row 1: (${r0c0}, ${r0c1}) → ${grid[0][2]}.`;
    hint2 = `In every row, Column 3 equals (${mult} × Column 1) + Column 2${offset > 0 ? ' + ' + offset : ''}.`;
    hint3 = `For Row 3, compute (${mult} × ${r2c0}) + ${r2c1}${offset > 0 ? ' + ' + offset : ''} = ${ans}.`;
    explanation = `Both Row 1 and Row 2 obey the linear grid invariant: Col₃ = ${mult}·Col₁ + Col₂${offset > 0 ? ' + ' + offset : ''}. Applying this rule to Row 3 gives ${mult}(${r2c0}) + ${r2c1}${offset > 0 ? ' + ' + offset : ''} = ${ans}.`;
    payload = {
      type: 'math-mystery',
      subMode: 'magic-grid',
      grid,
      targetValue: ans,
      allowDirectInput: true,
    };
  } else {
    // Mode D: Quantitative Constraint Riddle
    const x = 12 + Math.floor((levelNumber - 1) / 4); // guaranteed unique target integer per level!
    const divisor = (tier % 5) + 3; // 3..7
    const rem = x % divisor;
    const partner = (idxInTier % 9) + 4;
    const sumVal = x + partner;
    const prodVal = x * partner;

    const clues = [
      `Clue 1: Looking for a positive integer N such that N + ${partner} = ${sumVal} and N × ${partner} = ${prodVal}.`,
      `Clue 2: When N is divided by ${divisor}, it leaves a remainder of ${rem}.`,
      `Clue 3: The square of N plus ${partner} equals ${x * x + partner}.`,
    ];

    correctDisplay = String(x);
    distractors = [String(x + divisor), String(x - 2), String(x + 3)];
    prompt = `Determine the unique integer N that satisfies all three quantitative constraints simultaneously.`;
    hint1 = `Use Clue 1 or Clue 3 to narrow down N's exact magnitude.`;
    hint2 = `Check divisibility by ${divisor} (N ≡ ${rem} mod ${divisor}).`;
    hint3 = `From N × ${partner} = ${prodVal}, divide ${prodVal} by ${partner} to confirm N = ${x}.`;
    explanation = `All three algebraic constraints converge on N = ${x}: ${x} + ${partner} = ${sumVal}, ${x} × ${partner} = ${prodVal}, and ${x} ≡ ${rem} (mod ${divisor}).`;
    payload = {
      type: 'math-mystery',
      subMode: 'constraint-riddle',
      riddleClues: clues,
      targetValue: x,
      allowDirectInput: true,
    };
  }

  const allLabels = rng.shuffle([correctDisplay, ...distractors]);
  const options: LevelOption[] = allLabels.map((lbl, i) => ({
    id: `mm-opt-${i}`,
    label: lbl,
  }));
  const correctOption = options.find((o) => o.label === correctDisplay)!;

  return {
    id: `math-mystery-L${String(levelNumber).padStart(4, '0')}`,
    gameId: 'math-mystery',
    levelNumber,
    tier,
    tierName: tierMeta.name,
    title: `Quantitative Mystery #${levelNumber}`,
    prompt,
    signature: `MM-L${levelNumber}-${subMode}-${correctDisplay}-${prompt.slice(0, 40)}`,
    payload,
    options,
    correctOptionId: correctOption.id,
    correctAnswerDisplay: correctDisplay,
    acceptedTextAnswers: [correctDisplay],
    hints: [hint1, hint2, hint3],
    explanation,
  };
}
