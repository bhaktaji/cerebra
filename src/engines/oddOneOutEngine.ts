import { SeededRandom } from '../domain/prng';
import { getTierForLevel, LevelData, LevelOption, OddItemSpec, OddOneOutPayload } from '../domain/types';

const PRIMES = [
  2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71,
  73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 151,
  157, 163, 167, 173, 179, 181, 191, 193, 197, 199,
];

const COMPOSITES_ODD = [
  9, 15, 21, 25, 27, 33, 35, 39, 45, 49, 51, 55, 57, 63, 65, 69, 75, 77, 81,
  85, 87, 91, 93, 95, 99, 105, 111, 115, 117, 119, 121, 123, 125, 129, 133,
];

interface LexicalRuleSet {
  sharedInvariant: string;
  validMembers: { label: string; sublabel: string }[];
  outliers: { label: string; sublabel: string; reason: string }[];
}

const LEXICAL_RULES: LexicalRuleSet[] = [
  {
    sharedInvariant: 'Strict Palindromic Orthography (reads identically forward and backward)',
    validMembers: [
      { label: 'KAYAK', sublabel: '5-letter noun' },
      { label: 'ROTATOR', sublabel: '7-letter noun' },
      { label: 'DEIFIED', sublabel: '7-letter participle' },
      { label: 'REVIVER', sublabel: '7-letter agent noun' },
      { label: 'CIVIC', sublabel: '5-letter adjective' },
      { label: 'LEVEL', sublabel: '5-letter noun' },
      { label: 'RADAR', sublabel: '5-letter acronym' },
      { label: 'TENET', sublabel: '5-letter principle' },
      { label: 'REFER', sublabel: '5-letter verb' },
      { label: 'MINIM', sublabel: '5-letter measure' },
    ],
    outliers: [
      { label: 'MIRROR', sublabel: '6-letter noun', reason: 'MIRROR reversed is RORRIM, violating the palindrome invariant.' },
      { label: 'RETREAT', sublabel: '7-letter noun', reason: 'RETREAT begins and ends with R/T patterns but is not a palindrome.' },
      { label: 'SYMMETRY', sublabel: '8-letter noun', reason: 'SYMMETRY describes balance semantically but is not spelled palindromically.' },
    ],
  },
  {
    sharedInvariant: 'Noble Gases (Group 18 monatomic chemical elements with filled valence shells)',
    validMembers: [
      { label: 'Helium (He)', sublabel: 'Atomic #2' },
      { label: 'Neon (Ne)', sublabel: 'Atomic #10' },
      { label: 'Argon (Ar)', sublabel: 'Atomic #18' },
      { label: 'Krypton (Kr)', sublabel: 'Atomic #36' },
      { label: 'Xenon (Xe)', sublabel: 'Atomic #54' },
      { label: 'Radon (Rn)', sublabel: 'Atomic #86' },
    ],
    outliers: [
      { label: 'Nitrogen (N)', sublabel: 'Atomic #7', reason: 'Nitrogen is a reactive diatomic pnictogen (Group 15), not a Group 18 noble gas.' },
      { label: 'Chlorine (Cl)', sublabel: 'Atomic #17', reason: 'Chlorine is a Group 17 halogen rather than an inert Group 18 noble gas.' },
      { label: 'Hydrogen (H)', sublabel: 'Atomic #1', reason: 'Hydrogen is a reactive diatomic nonmetal in Group 1, not a noble gas.' },
    ],
  },
  {
    sharedInvariant: 'SI Base Units (the 7 fundamental dimensions of the International System of Units)',
    validMembers: [
      { label: 'Meter (m)', sublabel: 'Length' },
      { label: 'Kilogram (kg)', sublabel: 'Mass' },
      { label: 'Second (s)', sublabel: 'Time' },
      { label: 'Ampere (A)', sublabel: 'Electric Current' },
      { label: 'Kelvin (K)', sublabel: 'Thermodynamic Temp.' },
      { label: 'Mole (mol)', sublabel: 'Amount of Substance' },
      { label: 'Candela (cd)', sublabel: 'Luminous Intensity' },
    ],
    outliers: [
      { label: 'Newton (N)', sublabel: 'Force (kg·m/s²)', reason: 'The Newton is a derived SI unit (kg·m/s²), whereas all other options are fundamental SI Base Units.' },
      { label: 'Joule (J)', sublabel: 'Energy (N·m)', reason: 'The Joule is a derived SI unit, unlike the 7 fundamental SI Base Units.' },
      { label: 'Pascal (Pa)', sublabel: 'Pressure (N/m²)', reason: 'The Pascal is a derived SI unit rather than an SI Base Unit.' },
    ],
  },
  {
    sharedInvariant: 'Platonic Solids (convex regular polyhedra with congruent regular polygonal faces)',
    validMembers: [
      { label: 'Tetrahedron', sublabel: '4 triangular faces' },
      { label: 'Hexahedron (Cube)', sublabel: '6 square faces' },
      { label: 'Octahedron', sublabel: '8 triangular faces' },
      { label: 'Dodecahedron', sublabel: '12 pentagonal faces' },
      { label: 'Icosahedron', sublabel: '20 triangular faces' },
    ],
    outliers: [
      { label: 'Rhombicuboctahedron', sublabel: 'Archimedean solid', reason: 'It uses two different face types (squares and triangles), making it Archimedean rather than Platonic.' },
      { label: 'Square Pyramid', sublabel: '5 mixed faces', reason: 'A square pyramid combines a square base with triangular sides, so it is not a regular Platonic solid.' },
      { label: 'Hexagonal Prism', sublabel: '8 mixed faces', reason: 'A prism is semi-regular and not one of the five Platonic solids.' },
    ],
  },
  {
    sharedInvariant: 'Strict Alphabetical Letter Order (isogrammatic words whose letters appear in A→Z order)',
    validMembers: [
      { label: 'ABHOR', sublabel: 'A-B-H-O-R' },
      { label: 'BIJOU', sublabel: 'B-I-J-O-U' },
      { label: 'CHIMP', sublabel: 'C-H-I-M-P' },
      { label: 'FLORS', sublabel: 'F-L-O-R-S' },
      { label: 'GHOST', sublabel: 'G-H-O-S-T' },
      { label: 'KNOTY', sublabel: 'K-N-O-T-Y' },
    ],
    outliers: [
      { label: 'SMART', sublabel: 'S-M-A-R-T', reason: 'In SMART, M and A come earlier in the alphabet than S, breaking strict A→Z letter progression.' },
      { label: 'CLOUD', sublabel: 'C-L-O-U-D', reason: 'The final letter D breaks the ascending alphabetical sequence C-L-O-U.' },
      { label: 'BRAIN', sublabel: 'B-R-A-I-N', reason: 'A appears after R, violating ascending alphabetical order.' },
    ],
  },
];

export function generateOddOneOutLevel(levelNumber: number): LevelData {
  const tierMeta = getTierForLevel(levelNumber);
  const tier = tierMeta.tier;
  const idxInTier = (levelNumber - 1) % 100;
  const rng = new SeededRandom(`odd-one-out-v1-${levelNumber}`);

  const modalities: OddOneOutPayload['modality'][] = [
    'numerical',
    'geometric',
    'lexical',
    'alphanumeric',
  ];
  const modality = modalities[(levelNumber - 1) % 4];
  const itemCount = tier <= 3 ? 4 : tier <= 7 ? 5 : 6;

  let items: OddItemSpec[] = [];
  let outlierId = '';
  let outlierLabel = '';
  let sharedInvariant = '';
  let hint1 = '';
  let hint2 = '';
  let hint3 = '';
  let explanation = '';

  if (modality === 'numerical') {
    const numSubType = Math.floor((levelNumber - 1) / 4) % 4;
    if (numSubType === 0) {
      // Prime numbers vs 1 odd composite decoy
      const startPrimeIdx = Math.floor(levelNumber / 16) % (PRIMES.length - itemCount - 2);
      const chosenPrimes = PRIMES.slice(startPrimeIdx + 1, startPrimeIdx + itemCount);
      const outlierVal = COMPOSITES_ODD[Math.floor(levelNumber / 4) % COMPOSITES_ODD.length];
      sharedInvariant = 'Prime numbers (divisible only by 1 and themselves)';
      const rawNums = rng.shuffle([...chosenPrimes, outlierVal]);
      items = rawNums.map((n, i) => ({
        id: `ooo-${i}`,
        label: String(n),
        sublabel: `Integer #${i + 1}`,
        visualType: 'number',
      }));
      const outlierItem = items.find((it) => it.label === String(outlierVal))!;
      outlierId = outlierItem.id;
      outlierLabel = outlierItem.label;
      hint1 = 'Do not rely on odd vs. even parity—all candidates are odd integers.';
      hint2 = 'Test each integer for primality (whether it can be factored into smaller integers > 1).';
      hint3 = `${outlierVal} is a composite number, whereas every other option is prime.`;
      explanation = `All numbers in the group except ${outlierVal} are prime numbers (${chosenPrimes.join(', ')}). ${outlierVal} is composite and can be factored, making it the unambiguous odd one out.`;
    } else if (numSubType === 1) {
      // Perfect Squares / Cubes + constant offset k
      const offset = (Math.floor(levelNumber / 16) % 9) + 1;
      const baseStart = (idxInTier % 8) + 2;
      const validVals: number[] = [];
      for (let i = 0; i < itemCount - 1; i++) {
        const n = baseStart + i;
        validVals.push(n * n + offset);
      }
      const outlierN = baseStart + itemCount - 1;
      const outlierVal = outlierN * outlierN + offset + 2;
      sharedInvariant = `Integers of the form n² + ${offset}`;
      const rawNums = rng.shuffle([...validVals, outlierVal]);
      items = rawNums.map((n, i) => ({
        id: `ooo-${i}`,
        label: String(n),
        sublabel: 'Quadratic residue class',
        visualType: 'number',
      }));
      const outlierItem = items.find((it) => it.label === String(outlierVal))!;
      outlierId = outlierItem.id;
      outlierLabel = outlierItem.label;
      hint1 = 'Compare each number to nearby perfect squares (4, 9, 16, 25, 36, 49, 64, 81, 100...).';
      hint2 = `Subtract ${offset} from each number and check whether the result is a perfect square.`;
      hint3 = `Every number minus ${offset} yields a perfect square except ${outlierVal} (${outlierVal} - ${offset} = ${outlierVal - offset}).`;
      explanation = `Every valid member satisfies the quadratic invariant n² + ${offset} (${validVals.join(', ')}). ${outlierVal} equals ${outlierN}² + ${offset + 2}, violating the invariant.`;
    } else if (numSubType === 2) {
      // Constant Digital Sum invariant constructed directly in O(1)
      const targetSum = (Math.floor(levelNumber / 16) % 8) + 12; // 12..19
      const validVals: number[] = [];
      for (let i = 0; i < itemCount - 1; i++) {
        const d1 = ((idxInTier + i) % 5) + 2; // 2..6
        const remAfterD1 = targetSum - d1;
        const d2 = Math.min(9, Math.max(1, (i * 2 + (levelNumber % 4)) % (remAfterD1 - 1) + 1));
        const d3 = remAfterD1 - d2;
        validVals.push(d1 * 100 + d2 * 10 + d3);
      }
      const outlierVal = validVals[0] + 12; // changes digit sum by +3 or -6
      sharedInvariant = `Three-digit integers whose digits sum to exactly ${targetSum}`;
      const rawNums = rng.shuffle([...validVals, outlierVal]);
      items = rawNums.map((n, i) => ({
        id: `ooo-${i}`,
        label: String(n),
        sublabel: '3-digit code',
        visualType: 'number',
      }));
      const outlierItem = items.find((it) => it.label === String(outlierVal))!;
      outlierId = outlierItem.id;
      outlierLabel = outlierItem.label;
      hint1 = 'Instead of looking at magnitude or divisibility, examine the individual digits of each 3-digit number.';
      hint2 = `Add the three digits of each number together (hundreds + tens + ones).`;
      hint3 = `All numbers have a digit sum of ${targetSum} except ${outlierVal}.`;
      explanation = `Adding the digits of each number reveals a constant digit sum of ${targetSum} across ${validVals.join(', ')}. The digits of ${outlierVal} do not sum to ${targetSum}.`;
    } else {
      // Modular Arithmetic Equivalence (all congruent to r mod m)
      const mod = (Math.floor(levelNumber / 16) % 6) + 7; // 7..12
      const rem = (levelNumber % (mod - 1)) + 1;
      const startK = (idxInTier % 6) + 3;
      const validVals = Array.from({ length: itemCount - 1 }, (_, i) => (startK + i * 2) * mod + rem);
      const outlierVal = (startK + (itemCount - 1) * 2) * mod + ((rem + 2) % mod);
      sharedInvariant = `Integers leaving a remainder of ${rem} when divided by ${mod} (n ≡ ${rem} mod ${mod})`;
      const rawNums = rng.shuffle([...validVals, outlierVal]);
      items = rawNums.map((n, i) => ({
        id: `ooo-${i}`,
        label: String(n),
        sublabel: `Mod-${mod} test`,
        visualType: 'number',
      }));
      const outlierItem = items.find((it) => it.label === String(outlierVal))!;
      outlierId = outlierItem.id;
      outlierLabel = outlierItem.label;
      hint1 = `Examine the differences between the numbers—notice they are all multiples of ${mod} apart except one.`;
      hint2 = `Divide each number by ${mod} and record the remainder.`;
      hint3 = `Every number leaves remainder ${rem} when divided by ${mod} except ${outlierVal}.`;
      explanation = `All valid numbers satisfy n ≡ ${rem} (mod ${mod}): ${validVals.join(', ')}. Dividing ${outlierVal} by ${mod} leaves a different remainder, isolating it as the anomaly.`;
    }
  } else if (modality === 'geometric') {
    // Geometric SVG figure invariant: Sides count parity / Sides == Dots + k
    const offset = (Math.floor(levelNumber / 4) % 3); // 0, 1, 2
    const validSides = [3, 4, 5, 6, 7, 8].slice(0, itemCount - 1);
    const baseRot = (levelNumber * 15) % 360;
    const specs: OddItemSpec[] = validSides.map((sides, idx) => ({
      id: `geo-v-${idx}`,
      label: `${sides}-gon · ${sides - offset} inner dots`,
      sublabel: `Rotated ${(baseRot + idx * 30) % 360}°`,
      visualType: 'shape',
      shapeSpec: {
        sides,
        rotation: (baseRot + idx * 30) % 360,
        filled: idx % 2 === 0,
        innerDots: sides - offset,
        symmetric: true,
      },
    }));

    const outlierSides = validSides[validSides.length - 1];
    const outlierDots = Math.max(1, outlierSides - offset - 2);
    const outlierSpec: OddItemSpec = {
      id: `geo-outlier`,
      label: `${outlierSides}-gon · ${outlierDots} inner dots`,
      sublabel: `Rotated ${(baseRot + 135) % 360}°`,
      visualType: 'shape',
      shapeSpec: {
        sides: outlierSides,
        rotation: (baseRot + 135) % 360,
        filled: true,
        innerDots: outlierDots,
        symmetric: false,
      },
    };

    items = rng.shuffle([...specs, outlierSpec]);
    outlierId = outlierSpec.id;
    outlierLabel = outlierSpec.label;
    sharedInvariant =
      offset === 0
        ? 'Polygon vertex count equals exact inner dot count (Vertices = Dots)'
        : `Polygon vertex count minus inner dot count equals ${offset} (Vertices - Dots = ${offset})`;
    hint1 = 'Ignore rotation angle and shading—count the outer polygon vertices and compare them to the inner dots.';
    hint2 = `In the valid figures, (Polygon Sides - Inner Dots) is always equal to ${offset}.`;
    hint3 = `Find the single polygon where the inner dot count is ${outlierDots} instead of ${outlierSides - offset}.`;
    explanation = `Across all valid geometric figures, the invariant (Vertices - Inner Dots = ${offset}) holds strictly. The ${outlierSpec.label} breaks this topological coupling.`;
  } else if (modality === 'lexical') {
    const rule = LEXICAL_RULES[Math.floor((levelNumber - 1) / 4) % LEXICAL_RULES.length];
    const chosenValid = rng.sample(rule.validMembers, itemCount - 1);
    const chosenOutlier = rule.outliers[Math.floor((levelNumber - 1) / 20) % rule.outliers.length];

    const rawItems: OddItemSpec[] = [
      ...chosenValid.map((v, i) => ({
        id: `lex-v-${i}`,
        label: v.label,
        sublabel: v.sublabel,
        visualType: 'word' as const,
      })),
      {
        id: 'lex-outlier',
        label: chosenOutlier.label,
        sublabel: chosenOutlier.sublabel,
        visualType: 'word' as const,
      },
    ];
    items = rng.shuffle(rawItems);
    outlierId = 'lex-outlier';
    outlierLabel = chosenOutlier.label;
    sharedInvariant = rule.sharedInvariant;
    hint1 = 'Look beyond surface word length and analyze the structural or taxonomic classification shared by the majority.';
    hint2 = `The unifying rule is: ${rule.sharedInvariant}.`;
    hint3 = chosenOutlier.reason;
    explanation = `All other items satisfy the invariant "${rule.sharedInvariant}". ${chosenOutlier.reason}`;
  } else {
    // Alphanumeric Code Invariant: Letter position in alphabet (A=1..Z=26) + right number == constant checksum
    const targetChecksum = 25 + ((levelNumber * 3) % 20);
    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const validItems: OddItemSpec[] = [];
    for (let i = 0; i < itemCount - 1; i++) {
      const charIdx = (levelNumber + i * 3) % letters.length;
      const ch = letters[charIdx];
      const alphaPos = ch.charCodeAt(0) - 64;
      const numPart = targetChecksum - alphaPos;
      validItems.push({
        id: `code-v-${i}`,
        label: `${ch}-${numPart}`,
        sublabel: `Alpha(${ch})=${alphaPos}`,
        visualType: 'code',
      });
    }
    const outCharIdx = (levelNumber + 17) % letters.length;
    const outCh = letters[outCharIdx];
    const outAlphaPos = outCh.charCodeAt(0) - 64;
    const wrongNum = targetChecksum - outAlphaPos + 4;
    const outlierSpec: OddItemSpec = {
      id: 'code-outlier',
      label: `${outCh}-${wrongNum}`,
      sublabel: `Alpha(${outCh})=${outAlphaPos}`,
      visualType: 'code',
    };

    items = rng.shuffle([...validItems, outlierSpec]);
    outlierId = outlierSpec.id;
    outlierLabel = outlierSpec.label;
    sharedInvariant = `Alphanumeric checksum (Alphabet Position + Numeric Suffix = ${targetChecksum})`;
    hint1 = 'Convert each letter to its standard alphabetical position (A=1, B=2, C=3 ... Z=26).';
    hint2 = `Add the letter's alphabetical index to the number after the hyphen.`;
    hint3 = `Every code sums to ${targetChecksum} except ${outlierSpec.label} (${outAlphaPos} + ${wrongNum} = ${outAlphaPos + wrongNum}).`;
    explanation = `Each valid alphanumeric token obeys the checksum invariant: AlphabetIndex(Letter) + Number = ${targetChecksum}. Token ${outlierSpec.label} sums to ${outAlphaPos + wrongNum}, violating the checksum.`;
  }

  const options: LevelOption[] = items.map((it) => ({
    id: it.id,
    label: it.label,
    sublabel: it.sublabel,
  }));

  const payload: OddOneOutPayload = {
    type: 'odd-one-out',
    modality,
    items,
    sharedInvariant,
  };

  return {
    id: `odd-one-out-L${String(levelNumber).padStart(4, '0')}`,
    gameId: 'odd-one-out',
    levelNumber,
    tier,
    tierName: tierMeta.name,
    title: `Anomaly Isolation #${levelNumber}`,
    prompt: `Identify the single item among the ${items.length} candidates that violates the shared structural invariant.`,
    signature: `OOO-L${levelNumber}-${modality}-${items.map((x) => x.label).join('|')}=>${outlierLabel}`,
    payload,
    options,
    correctOptionId: outlierId,
    correctAnswerDisplay: outlierLabel,
    hints: [hint1, hint2, hint3],
    explanation,
  };
}
