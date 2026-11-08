import { SeededRandom } from '../domain/prng';
import { getTierForLevel, LevelData, LevelOption, LogicDetectivePayload } from '../domain/types';

interface DeductionTheme {
  entitiesLabel: string;
  attributesLabel: string;
  secondaryLabel: string;
  entities: string[];
  attributes: string[];
  secondary: string[];
}

const THEMES: DeductionTheme[] = [
  {
    entitiesLabel: 'Researchers',
    attributesLabel: 'Laboratories',
    secondaryLabel: 'Clearance Codes',
    entities: ['Dr. Chen', 'Dr. Kovacs', 'Dr. Okafor', 'Dr. Lindqvist', 'Dr. Reyes'],
    attributes: ['Cryogenics', 'Photonics', 'Seismology', 'Acoustics', 'Metallurgy'],
    secondary: ['Sector-01', 'Sector-02', 'Sector-03', 'Sector-04', 'Sector-05'],
  },
  {
    entitiesLabel: 'Curators',
    attributesLabel: 'Exhibits',
    secondaryLabel: 'Gallery Wings',
    entities: ['Alistair', 'Beatrix', 'Caspian', 'Delphine', 'Evander'],
    attributes: ['Astrolabe', 'Jade Seal', 'Bronze Folio', 'Obsidian Prism', 'Tapestry'],
    secondary: ['North Wing', 'East Wing', 'South Wing', 'West Wing', 'Rotunda'],
  },
  {
    entitiesLabel: 'Captains',
    attributesLabel: 'Vessels',
    secondaryLabel: 'Departure Berths',
    entities: ['Capt. Mercer', 'Capt. Solis', 'Capt. Vane', 'Capt. Ito', 'Capt. Holt'],
    attributes: ['Hesperus', 'Vanguard', 'Meridian', 'Aethelgard', 'Solstice'],
    secondary: ['Pier 1', 'Pier 2', 'Pier 3', 'Pier 4', 'Pier 5'],
  },
  {
    entitiesLabel: 'Diplomats',
    attributesLabel: 'Treaty Portfolios',
    secondaryLabel: 'Summit Rooms',
    entities: ['Envoy Sorel', 'Envoy Tarek', 'Envoy Lin', 'Envoy Novak', 'Envoy Volkov'],
    attributes: ['Maritime Law', 'Orbital Transit', 'Clean Energy', 'Trade Tariff', 'Cyber Accord'],
    secondary: ['Chamber A', 'Chamber B', 'Chamber C', 'Chamber D', 'Chamber E'],
  },
  {
    entitiesLabel: 'Master Watchmakers',
    attributesLabel: 'Complications',
    secondaryLabel: 'Workbenches',
    entities: ['Breguet', 'Meylan', 'Piguet', 'Vacheron', 'Jaquet'],
    attributes: ['Tourbillon', 'Minute Repeater', 'Perpetual Calendar', 'Split Chronograph', 'Equation of Time'],
    secondary: ['Bench 10', 'Bench 20', 'Bench 30', 'Bench 40', 'Bench 50'],
  },
];

export function generateLogicDetectiveLevel(levelNumber: number): LevelData {
  const tierMeta = getTierForLevel(levelNumber);
  const tier = tierMeta.tier;
  const idxInTier = (levelNumber - 1) % 100;
  const rng = new SeededRandom(`logic-detective-v1-${levelNumber}`);

  const theme = THEMES[(levelNumber - 1) % THEMES.length];
  // Grid size: 3x3 for Tiers 1-2, 4x4 for Tiers 3-6, 5x5 for Tiers 7-10
  const n = tier <= 2 ? 3 : tier <= 6 ? 4 : 5;

  // Select n entities and n attributes using deterministic cyclic shifts
  const entStart = Math.floor((levelNumber - 1) / 5) % theme.entities.length;
  const entities: string[] = [];
  const attributes: string[] = [];
  const secondary: string[] = [];
  for (let i = 0; i < n; i++) {
    entities.push(theme.entities[(entStart + i) % theme.entities.length]);
    attributes.push(theme.attributes[(entStart + i + (idxInTier % 3)) % theme.attributes.length]);
    secondary.push(theme.secondary[i]);
  }

  // Ground-truth bijection: permute attributes deterministically
  const assignedAttributes = rng.shuffle(attributes);
  const solutionMap: Record<string, string> = {};
  entities.forEach((ent, i) => {
    solutionMap[ent] = assignedAttributes[i];
  });

  const targetIdx = levelNumber % n;
  const targetEntity = entities[targetIdx];
  const correctAttribute = solutionMap[targetEntity];

  // Build deductive clues that uniquely determine the full bijection!
  const clues: string[] = [];

  if (n === 3) {
    // 3 entities: E0->A0, E1->A1, E2->A2
    const i0 = (targetIdx + 1) % 3;
    const i1 = (targetIdx + 2) % 3;
    clues.push(
      `1. ${entities[i0]} is assigned directly to ${assignedAttributes[i0]} (${secondary[i0]}).`,
      `2. ${entities[i1]} is NOT assigned to ${assignedAttributes[targetIdx]}.`,
      `3. Each of the ${n} ${theme.entitiesLabel.toLowerCase()} holds a unique assignment among ${attributes.join(', ')}.`
    );
  } else if (n === 4) {
    // 4 entities: Use a mix of direct, negative elimination, and chained deduction
    const p0 = (targetIdx + 1) % 4;
    const p1 = (targetIdx + 2) % 4;
    const p2 = (targetIdx + 3) % 4;

    clues.push(
      `1. ${entities[p0]} is assigned to ${assignedAttributes[p0]}.`,
      `2. Neither ${entities[p1]} nor ${entities[targetIdx]} is assigned to ${assignedAttributes[p2]}.`,
      `3. ${entities[p1]} is NOT assigned to ${assignedAttributes[targetIdx]}.`,
      `4. Every ${theme.entitiesLabel.slice(0, -1).toLowerCase()} is paired with exactly one distinct ${theme.attributesLabel.slice(0, -1).toLowerCase()}.`
    );
  } else {
    // 5 entities (Hard / Expert / Master): Multi-step elimination chain
    const p0 = (targetIdx + 1) % 5;
    const p1 = (targetIdx + 2) % 5;
    const p2 = (targetIdx + 3) % 5;
    const p3 = (targetIdx + 4) % 5;

    clues.push(
      `1. ${entities[p0]} holds the ${assignedAttributes[p0]} assignment.`,
      `2. ${entities[p1]} is assigned to either ${assignedAttributes[p0]} or ${assignedAttributes[p1]}.`,
      `3. None of ${entities[p2]}, ${entities[p3]}, or ${entities[targetIdx]} is assigned to ${assignedAttributes[p1]}.`,
      `4. Neither ${entities[p2]} nor ${entities[targetIdx]} is assigned to ${assignedAttributes[p3]}.`,
      `5. ${entities[p2]} is definitively NOT assigned to ${assignedAttributes[targetIdx]}.`
    );
  }

  const hint1 = `Start with Clue 1 on the elimination grid: mark a checkmark (✓) for the known pair and cross out (✕) all other cells in that row and column.`;
  const hint2 =
    n === 3
      ? `Since ${entities[(targetIdx + 1) % 3]} takes ${assignedAttributes[(targetIdx + 1) % 3]} and ${entities[(targetIdx + 2) % 3]} cannot take ${correctAttribute}, ${entities[(targetIdx + 2) % 3]} must take ${assignedAttributes[(targetIdx + 2) % 3]}.`
      : `Follow the elimination chain step by step: each resolved row eliminates that ${theme.attributesLabel.slice(0, -1).toLowerCase()} for all remaining ${theme.entitiesLabel.toLowerCase()}.`;
  const hint3 = `By eliminating all other columns for ${targetEntity}, the only remaining valid assignment is ${correctAttribute}.`;

  const explanation = `Using constraint propagation across the ${n}×${n} grid: ${entities
    .map((e, i) => `${e} → ${assignedAttributes[i]}`)
    .join('; ')}. Therefore, ${targetEntity} is uniquely assigned to ${correctAttribute}.`;

  const optionLabels = rng.shuffle(attributes);
  const options: LevelOption[] = optionLabels.map((lbl, idx) => ({
    id: `ld-opt-${idx}`,
    label: lbl,
  }));
  const correctOption = options.find((o) => o.label === correctAttribute)!;

  const payload: LogicDetectivePayload = {
    type: 'logic-detective',
    entitiesLabel: theme.entitiesLabel,
    attributesLabel: theme.attributesLabel,
    secondaryLabel: theme.secondaryLabel,
    entities,
    attributes,
    secondaryAttributes: secondary,
    clues,
    targetEntity,
    targetQuestionCategory: 'primary',
    solutionMap,
  };

  return {
    id: `logic-detective-L${String(levelNumber).padStart(4, '0')}`,
    gameId: 'logic-detective',
    levelNumber,
    tier,
    tierName: tierMeta.name,
    title: `Deduction Matrix #${levelNumber}`,
    prompt: `Using the ${clues.length} deductive clues and the interactive elimination grid, determine which ${theme.attributesLabel.slice(0, -1).toLowerCase()} belongs to ${targetEntity}.`,
    signature: `LD-L${levelNumber}-${entities.map((e) => `${e}:${solutionMap[e]}`).join('|')}?${targetEntity}`,
    payload,
    options,
    correctOptionId: correctOption.id,
    correctAnswerDisplay: correctAttribute,
    hints: [hint1, hint2, hint3],
    explanation,
  };
}
