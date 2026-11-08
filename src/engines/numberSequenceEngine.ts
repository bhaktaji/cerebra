import { SeededRandom } from '../domain/prng';
import { getTierForLevel, LevelData, LevelOption, NumberSequencePayload } from '../domain/types';

const PRIMES = [
  2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71,
  73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 151,
  157, 163, 167, 173, 179, 181, 191, 193, 197, 199, 211, 223, 227, 229,
];

export function generateNumberSequenceLevel(levelNumber: number): LevelData {
  const tierMeta = getTierForLevel(levelNumber);
  const tier = tierMeta.tier;
  const idxInTier = (levelNumber - 1) % 100; // 0..99
  const rng = new SeededRandom(`number-sequence-v1-${levelNumber}`);

  let terms: number[] = [];
  let ruleCategory = '';
  let hint1 = '';
  let hint2 = '';
  let hint3 = '';
  let explanation = '';
  let length = tier <= 3 ? 6 : tier <= 7 ? 7 : 8;

  // Missing index: Tiers 1-4 ask for the final term; Tiers 5-10 also test interior missing terms
  let missingIndex = length - 1;
  if (tier >= 5 && idxInTier % 3 !== 0) {
    missingIndex = length - 2 - (idxInTier % 3); // interior position
  }

  if (tier === 1) {
    // Tier 1: Constant arithmetic progressions & simple step additions
    const subType = idxInTier % 2;
    if (subType === 0) {
      const start = Math.floor(idxInTier / 2) * 3 + (idxInTier % 5) + 2;
      const step = (idxInTier % 14) + 2;
      terms = Array.from({ length }, (_, i) => start + i * step);
      ruleCategory = 'Constant Arithmetic Progression';
      hint1 = 'Compare each adjacent pair of numbers by subtracting the left term from the right term.';
      hint2 = `The difference between consecutive numbers is constant at +${step}.`;
      hint3 = `Add ${step} to ${terms[missingIndex - 1]} to find the missing term.`;
      explanation = `Each term increases by a constant difference of +${step} starting from ${start}. Therefore, ${terms[missingIndex - 1]} + ${step} = ${terms[missingIndex]}.`;
    } else {
      const start = 120 + idxInTier * 4;
      const step = (idxInTier % 11) + 3;
      terms = Array.from({ length }, (_, i) => start - i * step);
      ruleCategory = 'Decreasing Arithmetic Sequence';
      hint1 = 'Notice the values are decreasing steadily from left to right.';
      hint2 = `Each step subtracts exactly ${step} from the previous number.`;
      hint3 = `Compute ${terms[missingIndex - 1]} - ${step}.`;
      explanation = `This is a decreasing linear progression with a constant step of -${step}. Starting at ${start}, the missing value at position ${missingIndex + 1} is ${terms[missingIndex]}.`;
    }
  } else if (tier === 2) {
    // Tier 2: Arithmetic sequences with linearly increasing steps (+d, +2d, +3d...)
    const start = (idxInTier % 25) + 3 + Math.floor(idxInTier / 25) * 7;
    const baseStep = (idxInTier % 6) + 1;
    const increment = Math.floor(idxInTier / 10) + 1;
    terms = [start];
    const diffs: number[] = [];
    for (let i = 1; i < length; i++) {
      const diff = baseStep + (i - 1) * increment;
      diffs.push(diff);
      terms.push(terms[i - 1] + diff);
    }
    ruleCategory = 'Second-Order Step Progression';
    hint1 = 'The difference between adjacent terms is not constant—write down the step differences first.';
    hint2 = `The first-order differences are ${diffs.slice(0, 4).join(', ')}..., which grow by +${increment} each step.`;
    hint3 = `The step leading to position ${missingIndex + 1} is +${diffs[missingIndex - 1]}.`;
    explanation = `The differences between consecutive terms form an arithmetic progression (${diffs.map((d) => `+${d}`).join(', ')}), increasing by +${increment} at every step. Applying this rule yields ${terms[missingIndex]}.`;
  } else if (tier === 3) {
    // Tier 3: Alternating dual-operation steps (+A, -B, +A, -B or *2, +B)
    if (idxInTier % 2 === 0) {
      const start = Math.floor(idxInTier / 2) + 10;
      const stepA = (idxInTier % 9) + 6;
      const stepB = (Math.floor(idxInTier / 7) % 5) + 2;
      terms = [start];
      for (let i = 1; i < length; i++) {
        terms.push(i % 2 === 1 ? terms[i - 1] + stepA : terms[i - 1] - stepB);
      }
      ruleCategory = 'Alternating Add-Subtract Cycle';
      hint1 = 'The sequence rises and falls—check odd steps and even steps separately.';
      hint2 = `The operation alternates between adding ${stepA} and subtracting ${stepB}.`;
      hint3 = `Apply ${missingIndex % 2 === 1 ? `+${stepA}` : `-${stepB}`} to ${terms[missingIndex - 1]}.`;
      explanation = `The progression alternates strictly between +${stepA} and -${stepB}. Following the cycle at index ${missingIndex + 1} produces ${terms[missingIndex]}.`;
    } else {
      const start = (idxInTier % 12) + 2;
      const mult = (idxInTier % 3) + 2;
      const offset = Math.floor(idxInTier / 6) + 1;
      terms = [start];
      for (let i = 1; i < length; i++) {
        terms.push(i % 2 === 1 ? terms[i - 1] * mult : terms[i - 1] + offset);
      }
      ruleCategory = 'Alternating Multiplicative-Additive Cycle';
      hint1 = 'Two different mathematical operations alternate from term to term.';
      hint2 = `Odd steps multiply by ${mult}; even steps add ${offset}.`;
      hint3 = `From ${terms[missingIndex - 1]}, apply ${missingIndex % 2 === 1 ? `×${mult}` : `+${offset}`}.`;
      explanation = `Consecutive transitions alternate between multiplying by ${mult} and adding ${offset}. Thus the missing term is ${terms[missingIndex]}.`;
    }
  } else if (tier === 4) {
    // Tier 4: Polynomial sequences (Squares/Cubes with linear offsets: a*n^2 + b*n + c)
    const a = (idxInTier % 4) + 1;
    const b = Math.floor(idxInTier / 4) % 7;
    const c = Math.floor(idxInTier / 28) * 5 + (idxInTier % 11) + 1;
    terms = Array.from({ length }, (_, i) => {
      const n = i + 1;
      return a * n * n + b * n + c;
    });
    ruleCategory = 'Quadratic Polynomial Sequence';
    hint1 = 'Compute the first differences, then compute the second differences (differences of differences).';
    hint2 = `The second difference is constant at +${2 * a}, indicating a quadratic rule Based on n².`;
    hint3 = `Each term follows T(n) = ${a}n² + ${b}n + ${c} for n = 1, 2, 3...`;
    explanation = `The sequence is generated by the quadratic formula T(n) = ${a}n² + ${b}n + ${c} (with constant second difference ${2 * a}). Evaluating at n = ${missingIndex + 1} gives ${terms[missingIndex]}.`;
  } else if (tier === 5) {
    // Tier 5: Interleaved Dual Sequences (odd positions follow rule 1, even positions follow rule 2)
    const startOdd = (idxInTier % 15) + 4;
    const stepOdd = Math.floor(idxInTier / 15) + 3;
    const startEven = (idxInTier % 11) * 3 + 10;
    const stepEven = (idxInTier % 7) + 2;
    terms = Array.from({ length }, (_, i) => {
      const half = Math.floor(i / 2);
      return i % 2 === 0 ? startOdd + half * stepOdd : startEven - half * stepEven;
    });
    ruleCategory = 'Interleaved Dual Streams';
    hint1 = 'Read every second number! Split the sequence into odd-positioned terms (1st, 3rd, 5th...) and even-positioned terms (2nd, 4th, 6th...).';
    hint2 = `Positions 1, 3, 5... change by +${stepOdd}, while positions 2, 4, 6... change by -${stepEven}.`;
    hint3 = `The missing slot is at position ${missingIndex + 1}, which belongs to the ${missingIndex % 2 === 0 ? 'first (+' + stepOdd + ')' : 'second (-' + stepEven + ')'} stream.`;
    explanation = `Two independent arithmetic sequences are braided together: odd positions start at ${startOdd} and add ${stepOdd} each jump, while even positions start at ${startEven} and subtract ${stepEven} each jump. Position ${missingIndex + 1} equals ${terms[missingIndex]}.`;
  } else if (tier === 6) {
    // Tier 6: Generalized Fibonacci & Linear Recurrences (T_n = T_{n-1} + T_{n-2} + k)
    const t0 = (idxInTier % 9) + 1;
    const t1 = (Math.floor(idxInTier / 9) % 9) + 2;
    const offset = Math.floor(idxInTier / 20) - 1; // -1, 0, 1, 2, 3
    terms = [t0, t1];
    for (let i = 2; i < length; i++) {
      terms.push(terms[i - 1] + terms[i - 2] + offset);
    }
    const offsetText = offset === 0 ? '' : offset > 0 ? ` + ${offset}` : ` - ${Math.abs(offset)}`;
    ruleCategory = 'Shifted Fibonacci Recurrence';
    hint1 = 'Look at how each term relates to the sum of the two terms immediately preceding it.';
    hint2 = `Every term from the 3rd onward equals the sum of the previous two terms${offsetText}.`;
    hint3 = `Use the recurrence T(n) = T(n-1) + T(n-2)${offsetText} to solve for index ${missingIndex + 1}.`;
    explanation = `Each term satisfies the recurrence relation T(n) = T(n-1) + T(n-2)${offsetText}, seeded with T(1)=${t0} and T(2)=${t1}. Therefore, position ${missingIndex + 1} is ${terms[missingIndex]}.`;
  } else if (tier === 7) {
    // Tier 7: Affine First-Order Recurrence (T_n = m * T_{n-1} + k)
    const t0 = (idxInTier % 10) + 1;
    const mult = (idxInTier % 2) + 2; // 2 or 3
    const k = Math.floor(idxInTier / 5) - 6; // -6..13
    length = 6;
    missingIndex = idxInTier % 2 === 0 ? 4 : 3;
    terms = [t0];
    for (let i = 1; i < length; i++) {
      terms.push(terms[i - 1] * mult + k);
    }
    const kText = k >= 0 ? `+ ${k}` : `- ${Math.abs(k)}`;
    ruleCategory = 'Affine Multiplicative Recurrence';
    hint1 = 'Check the ratio between consecutive terms—each term is roughly a multiple of the previous one plus a constant adjustment.';
    hint2 = `Multiply each term by ${mult} and then apply ${kText} to get the next term.`;
    hint3 = `Compute (${terms[missingIndex - 1]} × ${mult}) ${kText}.`;
    explanation = `Every term follows the affine recurrence T(n) = ${mult}·T(n-1) ${kText}. Applying this to T(${missingIndex}) = ${terms[missingIndex - 1]} gives ${terms[missingIndex]}.`;
  } else if (tier === 8) {
    // Tier 8: Prime-Step Progression (Differences are consecutive prime numbers scaled/shifted)
    const start = (idxInTier % 20) + 5;
    const primeStartIdx = Math.floor(idxInTier / 5); // 0..19
    const multiplier = (idxInTier % 3) + 1;
    terms = [start];
    const stepPrimes: number[] = [];
    for (let i = 1; i < length; i++) {
      const p = PRIMES[primeStartIdx + i - 1] * multiplier;
      stepPrimes.push(p);
      terms.push(terms[i - 1] + p);
    }
    ruleCategory = 'Prime-Indexed Difference Series';
    hint1 = 'Calculate the differences between consecutive terms and inspect their divisibility properties.';
    hint2 = multiplier === 1
      ? `The step differences are consecutive prime numbers starting at ${PRIMES[primeStartIdx]}.`
      : `The step differences are ${multiplier}× consecutive prime numbers starting at ${multiplier}×${PRIMES[primeStartIdx]} = ${stepPrimes[0]}.`;
    hint3 = `The step from index ${missingIndex} to ${missingIndex + 1} is +${stepPrimes[missingIndex - 1]}.`;
    explanation = `Consecutive differences follow the prime progression (${stepPrimes.map((s) => `+${s}`).join(', ')}). Adding ${stepPrimes[missingIndex - 1]} to ${terms[missingIndex - 1]} yields ${terms[missingIndex]}.`;
  } else if (tier === 9) {
    // Tier 9: Cubic & Geometric-Difference Hybrid (T_n = n^3 + a*n + b or Step = 2^n + k)
    if (idxInTier % 2 === 0) {
      const a = Math.floor(idxInTier / 10) + 1;
      const b = (idxInTier % 10) * 3 + 2;
      terms = Array.from({ length: 6 }, (_, i) => {
        const n = i + 1;
        return n * n * n + a * n + b;
      });
      length = 6;
      missingIndex = (idxInTier % 3) + 3; // index 3, 4, or 5
      ruleCategory = 'Cubic Polynomial Progression';
      hint1 = 'Take third-order differences or compare each term against the perfect cubes 1, 8, 27, 64, 125, 216.';
      hint2 = `Subtracting n³ from the nth term leaves a linear remainder of ${a}n + ${b}.`;
      hint3 = `For n = ${missingIndex + 1}, compute ${missingIndex + 1}³ + ${a}(${missingIndex + 1}) + ${b}.`;
      explanation = `Each term is defined by the cubic law T(n) = n³ + ${a}n + ${b}. At n = ${missingIndex + 1}, ${missingIndex + 1}³ + ${a * (missingIndex + 1)} + ${b} = ${terms[missingIndex]}.`;
    } else {
      const start = Math.floor(idxInTier / 2) + 3;
      const k = (idxInTier % 7) - 3;
      length = 6;
      missingIndex = (idxInTier % 3) + 3;
      terms = [start];
      const diffs: number[] = [];
      for (let i = 1; i < length; i++) {
        const d = (1 << i) + k;
        diffs.push(d);
        terms.push(terms[i - 1] + d);
      }
      ruleCategory = 'Exponential-Step Progression';
      hint1 = 'Examine the first differences and compare them to powers of 2 (2, 4, 8, 16, 32...).';
      hint2 = `Each step difference equals 2^k ${k >= 0 ? '+ ' + k : '- ' + Math.abs(k)} (${diffs.join(', ')}).`;
      hint3 = `Add ${diffs[missingIndex - 1]} to ${terms[missingIndex - 1]}.`;
      explanation = `The step differences follow 2^n ${k >= 0 ? '+ ' + k : '- ' + Math.abs(k)}: ${diffs.map((d) => `+${d}`).join(', ')}. Thus position ${missingIndex + 1} is ${terms[missingIndex]}.`;
    }
  } else {
    // Tier 10 (Master): Coupled Two-Term Alternating Sign Recurrence or Second-Order Weighted Recurrence
    // T_n = 2*T_{n-1} - T_{n-2} + (-1)^n * c  OR  T_n = T_{n-1} + 2*T_{n-2} + d
    const t0 = (idxInTier % 10) + 2;
    const t1 = Math.floor(idxInTier / 10) + 5;
    const c = (idxInTier % 5) + 2;
    length = 7;
    missingIndex = (idxInTier % 3) + 4; // 4, 5, or 6
    terms = [t0, t1];
    for (let i = 2; i < length; i++) {
      const parityTerm = i % 2 === 0 ? c : -c;
      terms.push(terms[i - 1] + terms[i - 2] + parityTerm);
    }
    ruleCategory = 'Master Parity-Modulated Recurrence';
    hint1 = 'Compare each term to the sum of the two preceding terms: T(n) - [T(n-1) + T(n-2)].';
    hint2 = `The residual T(n) - (T(n-1) + T(n-2)) alternates sign at every step: +${c}, -${c}, +${c}, -${c}...`;
    hint3 = `For index ${missingIndex + 1}, compute ${terms[missingIndex - 1]} + ${terms[missingIndex - 2]} ${missingIndex % 2 === 0 ? '+ ' + c : '- ' + c}.`;
    explanation = `This Master-tier sequence follows the parity-modulated recurrence T(n) = T(n-1) + T(n-2) ${missingIndex % 2 === 0 ? '+' : '-'} ${c} (alternating +${c} and -${c} on successive indices). Evaluating at position ${missingIndex + 1} gives ${terms[missingIndex]}.`;
  }

  const correctValue = terms[missingIndex];
  const displaySequence: (number | null)[] = terms.map((v, idx) => (idx === missingIndex ? null : v));

  // Generate 3 plausible, unique numeric distractors
  const distractorSet = new Set<number>();
  const stepEst = Math.max(2, Math.abs(terms[1] - terms[0]));
  const candidateOffsets = [
    stepEst,
    -stepEst,
    2,
    -2,
    stepEst + 1,
    -stepEst - 1,
    4,
    -4,
    10,
    -10,
    3,
    -3,
  ];
  for (const off of rng.shuffle(candidateOffsets)) {
    const cand = correctValue + off;
    if (cand !== correctValue && !distractorSet.has(cand)) {
      distractorSet.add(cand);
      if (distractorSet.size === 3) break;
    }
  }

  const allValues = rng.shuffle([correctValue, ...Array.from(distractorSet)]);
  const options: LevelOption[] = allValues.map((val, i) => ({
    id: `opt-${i}`,
    label: String(val),
  }));
  const correctOption = options.find((o) => o.label === String(correctValue))!;

  const payload: NumberSequencePayload = {
    type: 'number-sequence',
    sequence: displaySequence,
    missingIndex,
    ruleCategory,
    allowDirectInput: true,
  };

  return {
    id: `number-sequence-L${String(levelNumber).padStart(4, '0')}`,
    gameId: 'number-sequence',
    levelNumber,
    tier,
    tierName: tierMeta.name,
    title: `Sequence Analysis #${levelNumber}`,
    prompt: `Determine the missing value at position ${missingIndex + 1} in the numerical progression.`,
    signature: `NS-L${levelNumber}-${displaySequence.map((x) => (x === null ? '?' : x)).join(',')}=>${correctValue}`,
    payload,
    options,
    correctOptionId: correctOption.id,
    correctAnswerDisplay: String(correctValue),
    acceptedTextAnswers: [String(correctValue)],
    hints: [hint1, hint2, hint3],
    explanation,
  };
}
