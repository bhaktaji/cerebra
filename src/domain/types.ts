export type GameId =
  | 'number-sequence'
  | 'pattern-matrix'
  | 'word-connections'
  | 'lateral-thinking'
  | 'logic-detective'
  | 'odd-one-out'
  | 'math-mystery'
  | 'memory-master'
  | 'spatial-intelligence'
  | 'mind-investigator';

export interface TierMetadata {
  tier: number;
  name: string;
  minLevel: number;
  maxLevel: number;
  description: string;
  milestoneTitle: string;
}

export const DIFFICULTY_TIERS: TierMetadata[] = [
  { tier: 1, name: 'Beginner', minLevel: 1, maxLevel: 100, description: 'Foundational single-rule patterns and direct deductions.', milestoneTitle: 'Foundations Initiated' },
  { tier: 2, name: 'Easy', minLevel: 101, maxLevel: 200, description: 'Two-step sequences, basic rotations, and clear semantic links.', milestoneTitle: 'Pattern Apprentice' },
  { tier: 3, name: 'Easy–Intermediate', minLevel: 201, maxLevel: 300, description: 'Alternating progressions, compound analogies, and 3-clue logic.', milestoneTitle: 'Analytical Thinker' },
  { tier: 4, name: 'Intermediate', minLevel: 301, maxLevel: 400, description: 'Second-order differences, 3x3 dual-attribute matrices, and multi-step cases.', milestoneTitle: 'Cognitive Practitioner' },
  { tier: 5, name: 'Intermediate–Advanced', minLevel: 401, maxLevel: 500, description: 'Interleaved rules, non-obvious lateral constraints, and 4x4 spatial grids.', milestoneTitle: 'Halfway Vanguard' },
  { tier: 6, name: 'Advanced', minLevel: 501, maxLevel: 600, description: 'Recurrence relations, three-rule matrices, and subtle semantic invariants.', milestoneTitle: 'Senior Deductive Specialist' },
  { tier: 7, name: 'Hard', minLevel: 601, maxLevel: 700, description: 'Interior missing terms, XOR matrix overlays, and multi-suspect alibi chains.', milestoneTitle: 'High-Order Reasoner' },
  { tier: 8, name: 'Very Hard', minLevel: 701, maxLevel: 800, description: 'Coupled polynomial rules, chiral 3D folds, and high-load sequence recall.', milestoneTitle: 'Grand Logic Architect' },
  { tier: 9, name: 'Expert', minLevel: 801, maxLevel: 900, description: 'Deep abstraction, 4-attribute Latin matrices, and chained transitive deductions.', milestoneTitle: 'Sovereign Intellect' },
  { tier: 10, name: 'Master', minLevel: 901, maxLevel: 1000, description: 'Peak cognitive synthesis across simultaneous interacting rules and subtle distractors.', milestoneTitle: 'Millennium Apex Master' },
];

export function getTierForLevel(levelNumber: number): TierMetadata {
  const clamped = Math.max(1, Math.min(1000, Math.floor(levelNumber)));
  const index = Math.floor((clamped - 1) / 100);
  return DIFFICULTY_TIERS[index] || DIFFICULTY_TIERS[0];
}

export interface GameMetadata {
  id: GameId;
  index: number;
  name: string;
  shortDescription: string;
  fullDescription: string;
  cognitiveSkill: string;
  secondarySkill: string;
  accentColor: string;
  totalLevels: number;
  mechanicsSummary: string[];
}

export const GAMES_CATALOGUE: GameMetadata[] = [
  {
    id: 'number-sequence',
    index: 1,
    name: 'Number Sequence',
    shortDescription: 'Deduce missing values across arithmetic, geometric, recursive, and interleaved progressions.',
    fullDescription: 'Analyze numerical series governed by single and multi-layered mathematical laws. Progress from constant step differences to second-order polynomials, Fibonacci recurrences, prime-indexed offsets, and dual interleaved streams.',
    cognitiveSkill: 'Quantitative & Inductive Reasoning',
    secondarySkill: 'Algebraic Pattern Recognition',
    accentColor: 'indigo',
    totalLevels: 1000,
    mechanicsSummary: [
      'Interactive difference-ribbon calculator between adjacent terms',
      'Supports both multiple-choice selection and direct numeric keypad entry',
      'Covers 10 mathematical families scaling from linear steps to coupled recurrences',
    ],
  },
  {
    id: 'pattern-matrix',
    index: 2,
    name: 'Pattern Matrix',
    shortDescription: 'Complete visual 2x2 and 3x3 Raven matrices governed by rotation, symmetry, and boolean logic.',
    fullDescription: 'Decode non-verbal geometric systems across rows and columns. Identify transformations involving polygon vertex counts, angular rotations, inner dot arithmetic, fill inversions, and bitwise XOR line superpositions.',
    cognitiveSkill: 'Fluid Non-Verbal Intelligence',
    secondarySkill: 'Visual-Spatial Transformation',
    accentSkillColor: 'violet',
    accentColor: 'violet',
    totalLevels: 1000,
    mechanicsSummary: [
      'Vector SVG matrix cells with live candidate preview in the target slot',
      'Row and column rule inspection guides',
      'Progresses from 1-attribute cycles to 4-attribute Latin square & XOR matrices',
    ],
  } as GameMetadata,
  {
    id: 'word-connections',
    index: 3,
    name: 'Word Connections',
    shortDescription: 'Bridge semantic analogies, triad associations, and abstract conceptual relationships.',
    fullDescription: 'Navigate precision verbal reasoning across 4 distinct linguistic formats: proportional analogies, triad concept bridges, structural pair alignments, and semantic cluster extraction.',
    cognitiveSkill: 'Verbal & Semantic Abstraction',
    secondarySkill: 'Relational Mapping',
    accentColor: 'emerald',
    totalLevels: 1000,
    mechanicsSummary: [
      'Four distinct verbal reasoning modes across 1,000 curated semantic structures',
      'Spans taxonomic, functional, causal, intensity, and structural word relationships',
      'Distractors engineered from adjacent semantic fields to test precision',
    ],
  },
  {
    id: 'lateral-thinking',
    index: 4,
    name: 'Lateral Thinking',
    shortDescription: 'Resolve paradoxical situations by questioning hidden assumptions and reframing context.',
    fullDescription: 'Confront situational mysteries and apparent contradictions where conventional linear assumptions fail. Inspect progressive observational clues and test hypotheses through either structured selection or synonym-aware free-text deduction.',
    cognitiveSkill: 'Divergent & Creative Reasoning',
    secondarySkill: 'Assumption Deconstruction',
    accentColor: 'amber',
    totalLevels: 1000,
    mechanicsSummary: [
      'Interactive clue-card inspection board revealing contextual constraints',
      'Dual input support: hypothesis selection or keyword-validated free-text entry',
      'Detailed post-solve frame-shift analysis explaining the hidden assumption',
    ],
  },
  {
    id: 'logic-detective',
    index: 5,
    name: 'Logic Detective',
    shortDescription: 'Cross-reference deductive clues on an interactive elimination matrix to isolate unique truths.',
    fullDescription: 'Synthesize affirmative, negative, relational, and conditional statements to map suspects, locations, artifacts, and timestamps. Every puzzle is verified by a constraint solver to guarantee a single unique deduction.',
    cognitiveSkill: 'Formal Deductive Reasoning',
    secondarySkill: 'Constraint Satisfaction',
    accentColor: 'sky',
    totalLevels: 1000,
    mechanicsSummary: [
      'Interactive elimination grid (tap to mark X or check) synchronized with clues',
      'Guaranteed unique solution via deterministic constraint propagation',
      'Scales from 3x3 basic elimination to multi-attribute transitive chains',
    ],
  },
  {
    id: 'odd-one-out',
    index: 6,
    name: 'Odd One Out',
    shortDescription: 'Isolate the single anomaly that violates a shared mathematical, structural, or conceptual law.',
    fullDescription: 'Examine collections of numbers, geometric vector figures, symbolic codes, and conceptual terms. Identify the exact invariant uniting all members except one—while resisting superficial decoy similarities.',
    cognitiveSkill: 'Invariant Detection & Categorization',
    secondarySkill: 'Analytical Discrimination',
    accentColor: 'rose',
    totalLevels: 1000,
    mechanicsSummary: [
      'Multi-modal tiles: number theory, SVG geometry, orthographic structure, and taxonomy',
      'Higher tiers introduce decoy surface traits that mask deeper structural rules',
      'Unambiguous invariant verification for every single level',
    ],
  },
  {
    id: 'math-mystery',
    index: 7,
    name: 'Math Mystery',
    shortDescription: 'Crack missing-operator equations, symbolic balance systems, and arithmetic logic grids.',
    fullDescription: 'Engage in mathematical problem-solving focused on structural insight rather than rote arithmetic. Reconstruct missing operators, solve simultaneous symbolic equations, complete Latin arithmetic grids, and satisfy modular constraints.',
    cognitiveSkill: 'Algebraic & Operational Logic',
    secondarySkill: 'Quantitative Constraint Solving',
    accentColor: 'teal',
    totalLevels: 1000,
    mechanicsSummary: [
      'Four sub-modes: Operator Forge, Symbolic Balance, Arithmetic Grid, and Number Riddles',
      'Interactive equation builder and live expression evaluator',
      'Scales operator count, parenthetical precedence, and constraint depth across 10 tiers',
    ],
  },
  {
    id: 'memory-master',
    index: 8,
    name: 'Memory Master',
    shortDescription: 'Encode and reconstruct spatial matrices, ordered sequences, and symbol transformations.',
    fullDescription: 'Train visual-spatial and sequential working memory. Observe high-contrast matrices and ordered node flashes during a calibrated encoding window, then reconstruct the exact pattern, sequence order, or mutated coordinate from memory.',
    cognitiveSkill: 'Visual & Sequential Working Memory',
    secondarySkill: 'Attentional Encoding Under Load',
    accentColor: 'cyan',
    totalLevels: 1000,
    mechanicsSummary: [
      'Two-phase Study & Recall state machine with live interactive grid reconstruction',
      'Includes Spatial Pattern Recall, Ordered Sequence Tap, and Symbol Matrix Delta modes',
      'Scales grid dimensions (3x3 to 6x6), target count, and decoy interference',
    ],
  },
  {
    id: 'spatial-intelligence',
    index: 9,
    name: 'Spatial Intelligence',
    shortDescription: 'Mentally rotate polyominoes, unfold punched paper creases, and project 3D cube nets.',
    fullDescription: 'Manipulate two- and three-dimensional objects in mental space. Distinguish true planar rotations from chiral mirror reflections, predict symmetric hole-punch coordinates after multi-axis paper folds, and fold 2D nets into 3D forms.',
    cognitiveSkill: 'Mental Rotation & Spatial Visualization',
    secondarySkill: 'Geometric Symmetry & Projection',
    accentColor: 'orange',
    totalLevels: 1000,
    mechanicsSummary: [
      'Crisp SVG geometric rendering for polyominoes, paper-fold grids, and isometric cubes',
      'Interactive angle reference compass and fold-axis diagram',
      'Tests chirality discrimination, multi-crease reflection symmetry, and composite shapes',
    ],
  },
  {
    id: 'mind-investigator',
    index: 10,
    name: 'The Mind Investigator',
    shortDescription: 'Cross-examine suspect alibis against forensic logs to expose contradictions and reconstruct cases.',
    fullDescription: 'Step into an investigative dossier containing incident timelines, suspect statements, keycard logs, and physical evidence. Cross-examine claims to identify the single suspect whose alibi conflicts with verified forensic facts or reconstruct the sequence of events.',
    cognitiveSkill: 'Evidentiary Synthesis & Critical Inquiry',
    secondarySkill: 'Temporal & Contradiction Analysis',
    accentColor: 'slate',
    totalLevels: 1000,
    mechanicsSummary: [
      'Structured Case File UI with interactive suspect clearance/flagging tags',
      'Cross-references timestamps, transit durations, access logs, and witness statements',
      'Scales from direct alibi contradictions to multi-clue timeline reconstructions',
    ],
  },
];

// Specific Payloads per Game
export interface NumberSequencePayload {
  type: 'number-sequence';
  sequence: (number | null)[];
  missingIndex: number;
  ruleCategory: string;
  allowDirectInput: boolean;
}

export interface MatrixCellSpec {
  outerShape: 'circle' | 'square' | 'triangle' | 'diamond' | 'hexagon' | 'pentagon' | 'cross' | 'star';
  innerShape: 'none' | 'dot' | 'circle' | 'square' | 'triangle' | 'cross' | 'ring';
  rotation: number; // degrees
  fill: 'outline' | 'solid' | 'striped' | 'tinted' | 'duotone';
  dots: number; // 0..5
  scale: number; // 0.7 | 0.85 | 1.0
  linesMask: number; // 4-bit mask (top, right, bottom, left spokes) for boolean XOR/OR rules
}

export interface PatternMatrixPayload {
  type: 'pattern-matrix';
  gridSize: 2 | 3;
  cells: (MatrixCellSpec | null)[]; // length 4 or 9, last cell is null
  ruleSummary: string;
}

export interface WordConnectionsPayload {
  type: 'word-connections';
  subMode: 'analogy' | 'triad-bridge' | 'pair-match' | 'cluster';
  stemWords: string[];
  relationCategory: string;
}

export interface LateralThinkingPayload {
  type: 'lateral-thinking';
  scenarioTitle: string;
  scenarioText: string;
  evidenceClues: string[];
  paradoxQuestion: string;
  acceptedKeywords: string[];
}

export interface LogicDetectivePayload {
  type: 'logic-detective';
  entitiesLabel: string;
  attributesLabel: string;
  secondaryLabel?: string;
  entities: string[];
  attributes: string[];
  secondaryAttributes?: string[];
  clues: string[];
  targetEntity: string;
  targetQuestionCategory: 'primary' | 'secondary';
  solutionMap: Record<string, string>;
}

export interface OddItemSpec {
  id: string;
  label: string;
  sublabel?: string;
  visualType: 'number' | 'word' | 'shape' | 'code';
  shapeSpec?: {
    sides: number;
    rotation: number;
    filled: boolean;
    innerDots: number;
    symmetric: boolean;
  };
}

export interface OddOneOutPayload {
  type: 'odd-one-out';
  modality: 'numerical' | 'geometric' | 'lexical' | 'alphanumeric';
  items: OddItemSpec[];
  sharedInvariant: string;
}

export interface MathMysteryPayload {
  type: 'math-mystery';
  subMode: 'operator-forge' | 'symbol-balance' | 'magic-grid' | 'constraint-riddle';
  operands?: number[];
  targetValue?: number;
  equations?: string[];
  grid?: (number | string)[][];
  riddleClues?: string[];
  allowDirectInput: boolean;
}

export interface MemoryMasterPayload {
  type: 'memory-master';
  subMode: 'spatial-grid' | 'ordered-sequence' | 'symbol-mutation';
  gridSize: number; // 3, 4, 5, 6
  studyDurationMs: number;
  targetCells: number[]; // indices in grid
  orderedSteps?: { cellIndex: number; stepNumber: number }[];
  symbolGridBefore?: string[];
  symbolGridAfter?: string[];
  mutatedCellIndex?: number;
  recallPrompt: string;
}

export interface SpatialPolyominoSpec {
  cells: [number, number][]; // (x, y) coordinates in a 4x4 or 5x5 local frame
  rotation: number;
  mirrored: boolean;
  accentCell: [number, number];
}

export interface PaperFoldSpec {
  folds: ('left-to-right' | 'right-to-left' | 'top-to-bottom' | 'bottom-to-top' | 'diag-main')[];
  initialPunches: [number, number][]; // in 4x4 grid
  unfoldedPunches: [number, number][]; // resulting holes in 4x4 grid
}

export interface SpatialIntelligencePayload {
  type: 'spatial-intelligence';
  subMode: 'mental-rotation' | 'paper-folding' | 'chiral-discrimination';
  referenceShape?: SpatialPolyominoSpec;
  paperFold?: PaperFoldSpec;
  targetTransformation: string;
}

export interface SuspectDossier {
  id: string;
  name: string;
  role: string;
  alibiClaim: string;
  timelineWindow: string;
  physicalNote: string;
}

export interface MindInvestigatorPayload {
  type: 'mind-investigator';
  caseNumber: string;
  caseTitle: string;
  incidentSummary: string;
  verifiedEvidence: string[];
  suspects: SuspectDossier[];
  questionPrompt: string;
}

export type GamePayload =
  | NumberSequencePayload
  | PatternMatrixPayload
  | WordConnectionsPayload
  | LateralThinkingPayload
  | LogicDetectivePayload
  | OddOneOutPayload
  | MathMysteryPayload
  | MemoryMasterPayload
  | SpatialIntelligencePayload
  | MindInvestigatorPayload;

export interface LevelOption {
  id: string;
  label: string;
  sublabel?: string;
  matrixCell?: MatrixCellSpec;
  spatialShape?: SpatialPolyominoSpec;
  punchGrid?: [number, number][];
}

export interface LevelData {
  id: string;
  gameId: GameId;
  levelNumber: number;
  tier: number;
  tierName: string;
  title: string;
  prompt: string;
  signature: string;
  payload: GamePayload;
  options: LevelOption[];
  correctOptionId: string;
  correctAnswerDisplay: string;
  acceptedTextAnswers?: string[];
  hints: [string, string, string];
  explanation: string;
}

export interface GameProgressRecord {
  gameId: GameId;
  unlockedLevel: number; // 1..1000
  completedLevels: number[]; // sorted list of completed level numbers
  bestScoresByLevel: Record<number, { attempts: number; hintsUsed: number; timestamp: number }>;
  lastPlayedLevel: number;
  lastPlayedAt: number;
}

export interface PlayerStatistics {
  totalPlaySessions: number;
  totalCorrectAttempts: number;
  totalIncorrectAttempts: number;
  totalHintsUsed: number;
  currentDailyStreak: number;
  longestDailyStreak: number;
  lastPlayedDateIso: string | null;
  achievementsUnlocked: string[];
}

export interface AppSettings {
  theme: 'light' | 'dark';
  soundEnabled: boolean;
  hapticsEnabled: boolean;
}
