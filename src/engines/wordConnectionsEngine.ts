import { SeededRandom } from '../domain/prng';
import { getTierForLevel, LevelData, LevelOption, WordConnectionsPayload } from '../domain/types';

interface RelationalPair {
  a: string;
  b: string;
}

interface RelationFamily {
  category: string;
  ruleDescription: string;
  bridgeConcept: string;
  pairs: RelationalPair[];
}

const RELATION_FAMILIES: RelationFamily[] = [
  {
    category: 'Instrument to Measured Quantity',
    ruleDescription: 'the precision instrument used to measure a specific physical quantity',
    bridgeConcept: 'Metrology & Calibration',
    pairs: [
      { a: 'Barometer', b: 'Atmospheric Pressure' },
      { a: 'Anemometer', b: 'Wind Velocity' },
      { a: 'Hygrometer', b: 'Relative Humidity' },
      { a: 'Seismograph', b: 'Tectonic Tremor' },
      { a: 'Altimeter', b: 'Elevation' },
      { a: 'Ammeter', b: 'Electric Current' },
      { a: 'Bolometer', b: 'Radiant Heat' },
      { a: 'Pyrometer', b: 'Furnace Temperature' },
      { a: 'Luxmeter', b: 'Illuminance' },
      { a: 'Tachometer', b: 'Rotational Speed' },
    ],
  },
  {
    category: 'Artisan to Primary Workshop Tool',
    ruleDescription: 'the specialist practitioner paired with their signature shaping instrument',
    bridgeConcept: 'Craftsmanship & Implements',
    pairs: [
      { a: 'Sculptor', b: 'Chisel' },
      { a: 'Luthier', b: 'Bending Iron' },
      { a: 'Cartographer', b: 'Theodolite' },
      { a: 'Watchmaker', b: 'Loupe' },
      { a: 'Blacksmith', b: 'Anvil' },
      { a: 'Engraver', b: 'Burin' },
      { a: 'Weaver', b: 'Shuttle' },
      { a: 'Glassblower', b: 'Blowpipe' },
      { a: 'Bookbinder', b: 'Bone Folder' },
      { a: 'Mason', b: 'Trowel' },
    ],
  },
  {
    category: 'Component to Encompassing Architecture',
    ruleDescription: 'an essential structural part belonging to a larger architectural whole',
    bridgeConcept: 'Part-to-Whole Meronymy',
    pairs: [
      { a: 'Keystone', b: 'Masonry Arch' },
      { a: 'Rafter', b: 'Pitched Roof' },
      { a: 'Tread', b: 'Staircase' },
      { a: 'Flying Buttress', b: 'Cathedral Nave' },
      { a: 'Prow', b: 'Caravel Hull' },
      { a: 'Aperture', b: 'Camera Lens' },
      { a: 'Filament', b: 'Incandescent Bulb' },
      { a: 'Escapement', b: 'Mechanical Clock' },
      { a: 'Transistor', b: 'Microprocessor' },
      { a: 'Aileron', b: 'Aircraft Wing' },
    ],
  },
  {
    category: 'Mild State to Extreme Intensity',
    ruleDescription: 'escalation along the same emotional or physical spectrum from mild to extreme',
    bridgeConcept: 'Gradable Intensity Spectrum',
    pairs: [
      { a: 'Drizzle', b: 'Deluge' },
      { a: 'Tremor', b: 'Cataclysm' },
      { a: 'Breeze', b: 'Gale' },
      { a: 'Thrifty', b: 'Parsimonious' },
      { a: 'Pleased', b: 'Ecstatic' },
      { a: 'Misgiving', b: 'Trepidation' },
      { a: 'Warm', b: 'Incandescent' },
      { a: 'Whisper', b: 'Clamor' },
      { a: 'Scratch', b: 'Laceration' },
      { a: 'Spark', b: 'Conflagration' },
    ],
  },
  {
    category: 'Precursor Material to Refined Output',
    ruleDescription: 'the raw geological or biological source transformed into a finished material',
    bridgeConcept: 'Material Refinement',
    pairs: [
      { a: 'Bauxite', b: 'Aluminum' },
      { a: 'Cinnabar', b: 'Mercury' },
      { a: 'Silica Sand', b: 'Borosilicate Glass' },
      { a: 'Latex Sap', b: 'Vulcanized Rubber' },
      { a: 'Flax Stalk', b: 'Linen Fabric' },
      { a: 'Galena', b: 'Refined Lead' },
      { a: 'Kaolin Clay', b: 'Porcelain' },
      { a: 'Wood Pulp', b: 'Parchment Vellums' },
      { a: 'Pitchblende', b: 'Uranium' },
      { a: 'Malachite', b: 'Smelted Copper' },
    ],
  },
  {
    category: 'Scientific Discipline to Core Subject',
    ruleDescription: 'the specialized branch of inquiry and the phenomenon it investigates',
    bridgeConcept: 'Epistemological Domain',
    pairs: [
      { a: 'Mycology', b: 'Fungal Networks' },
      { a: 'Ornithology', b: 'Avian Migration' },
      { a: 'Petrology', b: 'Igneous Strata' },
      { a: 'Etymology', b: 'Word Origins' },
      { a: 'Paleography', b: 'Ancient Scripts' },
      { a: 'Dendrology', b: 'Woody Plants' },
      { a: 'Numismatics', b: 'Minted Currency' },
      { a: 'Limnology', b: 'Inland Lakes' },
      { a: 'Acoustics', b: 'Sound Propagation' },
      { a: 'Tribology', b: 'Surface Friction' },
    ],
  },
  {
    category: 'Action to Preventative Effect',
    ruleDescription: 'a deliberate protective measure and the undesirable process it prevents',
    bridgeConcept: 'Preventative Causality',
    pairs: [
      { a: 'Galvanize', b: 'Corrosion' },
      { a: 'Inoculate', b: 'Contagion' },
      { a: 'Pasteurize', b: 'Spoilage' },
      { a: 'Caulk', b: 'Seepage' },
      { a: 'Quarantine', b: 'Outbreak' },
      { a: 'Lubricate', b: 'Abrasion' },
      { a: 'Ballast', b: 'Capsizing' },
      { a: 'Insulate', b: 'Thermal Loss' },
      { a: 'Cauterize', b: 'Hemorrhage' },
      { a: 'Laminate', b: 'Delamination' },
    ],
  },
  {
    category: 'Polar Antonyms of Intellectual Stance',
    ruleDescription: 'direct conceptual opposites describing precision, candor, or methodology',
    bridgeConcept: 'Semantic Polarity',
    pairs: [
      { a: 'Verbose', b: 'Laconic' },
      { a: 'Ephemeral', b: 'Perennial' },
      { a: 'Dogmatic', b: 'Empiricist' },
      { a: 'Ostentatious', b: 'Austere' },
      { a: 'Meticulous', b: 'Cursory' },
      { a: 'transparent', b: 'Opaque' },
      { a: 'Gregarious', b: 'Reclusive' },
      { a: 'Mutable', b: 'Invariable' },
      { a: 'Audacious', b: 'Circumspect' },
      { a: 'Lucid', b: 'Abstruse' },
    ],
  },
  {
    category: 'Biological Structure to Analogous Engineering System',
    ruleDescription: 'biomimetic correspondence between an anatomical organ and an engineered mechanism',
    bridgeConcept: 'Biomimetic Structural Analogy',
    pairs: [
      { a: 'Retina', b: 'CMOS Image Sensor' },
      { a: 'Heart Valve', b: 'One-Way Check Valve' },
      { a: 'Tendon', b: 'Tension Cable' },
      { a: 'Alveoli', b: 'Gas Exchange Membrane' },
      { a: 'Cochlea', b: 'Frequency Analyzer' },
      { a: 'Myelin Sheath', b: 'Dielectric Insulation' },
      { a: 'Xylem Vessel', b: 'Capillary Conduit' },
      { a: 'Ball-and-Socket Joint', b: 'Universal Gimbal' },
      { a: 'Iris Diaphragm', b: 'Mechanical Shutter' },
      { a: 'Exoskeleton', b: 'Monocoque Chassis' },
    ],
  },
  {
    category: 'Temporal Predecessor to Modern Successor',
    ruleDescription: 'a historical forerunner instrument superseded by a modern technological equivalent',
    bridgeConcept: 'Technological Lineage',
    pairs: [
      { a: 'Astrolabe', b: 'Sextant & GPS' },
      { a: 'Abacus', b: 'Arithmetic Logic Unit' },
      { a: 'Semaphore Tower', b: 'Fiber-Optic Relay' },
      { a: 'Sundial', b: 'Atomic Chronometer' },
      { a: 'Daguerreotype', b: 'Digital Photodiode' },
      { a: 'Parchment Scroll', b: 'Codex Volume' },
      { a: 'Telegraph Key', b: 'Packet Router' },
      { a: 'Slide Rule', b: 'Scientific Calculator' },
      { a: 'Clepsydra', b: 'Quartz Oscillator' },
      { a: 'Phonograph Cylinder', b: 'Lossless Audio Stream' },
    ],
  },
];

export function generateWordConnectionsLevel(levelNumber: number): LevelData {
  const tierMeta = getTierForLevel(levelNumber);
  const tier = tierMeta.tier;
  const rng = new SeededRandom(`word-connections-v1-${levelNumber}`);

  // Deterministically map levelNumber (1..1000) to unique (familyIdx, pairAIdx, pairBIdx, subMode)
  const subModes: WordConnectionsPayload['subMode'][] = [
    'analogy',
    'triad-bridge',
    'pair-match',
    'cluster',
  ];
  const subMode = subModes[(levelNumber - 1) % 4];
  const familyIdx = Math.floor((levelNumber - 1) / 4) % RELATION_FAMILIES.length;
  const family = RELATION_FAMILIES[familyIdx];
  const decoyFamily1 = RELATION_FAMILIES[(familyIdx + 3) % RELATION_FAMILIES.length];
  const decoyFamily2 = RELATION_FAMILIES[(familyIdx + 7) % RELATION_FAMILIES.length];

  const pairIdx1 = Math.floor((levelNumber - 1) / 40) % family.pairs.length;
  const pairStride = ((Math.floor((levelNumber - 1) / 100) % (family.pairs.length - 1)) + 1);
  const pairIdx2 = (pairIdx1 + pairStride) % family.pairs.length;
  const pairIdx3 = (pairIdx1 + 2 * pairStride) % family.pairs.length;

  const p1 = family.pairs[pairIdx1];
  const p2 = family.pairs[pairIdx2];
  const p3 = family.pairs[pairIdx3];

  let prompt = '';
  let stemWords: string[] = [];
  let correctLabel = '';
  let distractors: string[] = [];
  let hint1 = '';
  let hint2 = '';
  let hint3 = '';
  let explanation = '';

  if (subMode === 'analogy') {
    // Mode A: Proportional Analogy (p1.a : p1.b :: p2.a : ?)
    const reverseDirection = tier >= 6 && levelNumber % 8 === 0;
    const leftA = reverseDirection ? p1.b : p1.a;
    const leftB = reverseDirection ? p1.a : p1.b;
    const rightA = reverseDirection ? p2.b : p2.a;
    correctLabel = reverseDirection ? p2.a : p2.b;

    stemWords = [leftA, leftB, rightA];
    prompt = `Complete the proportional analogy: "${leftA}" is to "${leftB}" as "${rightA}" is to which concept?`;

    distractors = [
      reverseDirection ? p3.a : p3.b,
      reverseDirection ? decoyFamily1.pairs[pairIdx1].a : decoyFamily1.pairs[pairIdx1].b,
      reverseDirection ? decoyFamily2.pairs[pairIdx2].a : decoyFamily2.pairs[pairIdx2].b,
    ];
    hint1 = `First define the exact directional relationship between "${leftA}" and "${leftB}".`;
    hint2 = `The governing relationship is: ${family.ruleDescription} (${family.category}).`;
    hint3 = `Apply that exact relationship to "${rightA}" to obtain "${correctLabel}".`;
    explanation = `"${leftA}" and "${leftB}" exemplify ${family.ruleDescription}. Applying the identical directional mapping to "${rightA}" uniquely identifies "${correctLabel}".`;
  } else if (subMode === 'triad-bridge') {
    // Mode B: Triad Bridge — 3 expressions from the same relational structure, identify the 4th parallel pair or unifying principle
    stemWords = [`${p1.a} → ${p1.b}`, `${p2.a} → ${p2.b}`, `${p3.a} → ?`];
    correctLabel = p3.b;
    prompt = `Three pairs share an identical semantic bridge (${family.category}). Which concept completes the third triad node for "${p3.a}"?`;
    distractors = [
      decoyFamily1.pairs[pairIdx1].b,
      decoyFamily2.pairs[pairIdx2].b,
      family.pairs[(pairIdx3 + 1) % family.pairs.length].b,
    ];
    hint1 = `Examine what transformation turns "${p1.a}" into "${p1.b}" and "${p2.a}" into "${p2.b}".`;
    hint2 = `All three links represent ${family.ruleDescription}.`;
    hint3 = `For "${p3.a}", the corresponding target in this domain is "${correctLabel}".`;
    explanation = `The triad demonstrates ${family.ruleDescription}: ${p1.a} → ${p1.b} and ${p2.a} → ${p2.b}. Completing the third node "${p3.a}" requires "${correctLabel}".`;
  } else if (subMode === 'pair-match') {
    // Mode C: Structural Pair Alignment
    stemWords = [`${p1.a} : ${p1.b}`];
    correctLabel = `${p2.a} : ${p2.b}`;
    prompt = `Select the word pair that exhibits the exact same structural relationship as "${p1.a} : ${p1.b}".`;
    distractors = [
      `${decoyFamily1.pairs[pairIdx1].a} : ${decoyFamily1.pairs[pairIdx1].b}`,
      `${decoyFamily2.pairs[pairIdx2].a} : ${decoyFamily2.pairs[pairIdx2].b}`,
      `${p3.b} : ${p3.a}`, // inverted order decoy!
    ];
    hint1 = `Pay careful attention to both the semantic category AND the left-to-right order of "${p1.a} : ${p1.b}".`;
    hint2 = `Watch out for inverted-order traps! The relationship must be ${family.ruleDescription} in the same direction.`;
    hint3 = `"${correctLabel}" preserves both the domain relationship and the exact argument order.`;
    explanation = `"${p1.a} : ${p1.b}" encodes ${family.ruleDescription}. Note that "${p3.b} : ${p3.a}" reverses the order, making "${correctLabel}" the only structurally isomorphic pair.`;
  } else {
    // Mode D: Semantic Cluster Synthesis
    stemWords = [p1.a, p2.a, p3.a];
    const p4 = family.pairs[(pairIdx3 + 1) % family.pairs.length];
    correctLabel = `${p4.a} (${p4.b})`;
    prompt = `The terms "${p1.a}", "${p2.a}", and "${p3.a}" belong to a specific functional class. Which fourth entry belongs to the exact same relational group?`;
    distractors = [
      `${decoyFamily1.pairs[pairIdx1].a} (${decoyFamily1.pairs[pairIdx1].b})`,
      `${decoyFamily2.pairs[pairIdx2].a} (${decoyFamily2.pairs[pairIdx2].b})`,
      `${RELATION_FAMILIES[(familyIdx + 5) % RELATION_FAMILIES.length].pairs[pairIdx1].a} (${RELATION_FAMILIES[(familyIdx + 5) % RELATION_FAMILIES.length].pairs[pairIdx1].b})`,
    ];
    hint1 = `Determine what role "${p1.a}", "${p2.a}", and "${p3.a}" each play in their respective domains.`;
    hint2 = `Each stem word is the first element in ${family.ruleDescription}.`;
    hint3 = `"${correctLabel}" shares the exact "${family.category}" classification.`;
    explanation = `"${p1.a}", "${p2.a}", and "${p3.a}" are all examples of ${family.ruleDescription}. "${correctLabel}" is the only option sharing this exact semantic invariant.`;
  }

  const allLabels = rng.shuffle([correctLabel, ...distractors]);
  const options: LevelOption[] = allLabels.map((lbl, idx) => ({
    id: `wc-opt-${idx}`,
    label: lbl,
  }));
  const correctOption = options.find((o) => o.label === correctLabel)!;

  const payload: WordConnectionsPayload = {
    type: 'word-connections',
    subMode,
    stemWords,
    relationCategory: family.category,
  };

  return {
    id: `word-connections-L${String(levelNumber).padStart(4, '0')}`,
    gameId: 'word-connections',
    levelNumber,
    tier,
    tierName: tierMeta.name,
    title: `Semantic Link #${levelNumber}`,
    prompt,
    signature: `WC-L${levelNumber}-${subMode}-${stemWords.join('|')}=>${correctLabel}`,
    payload,
    options,
    correctOptionId: correctOption.id,
    correctAnswerDisplay: correctLabel,
    hints: [hint1, hint2, hint3],
    explanation,
  };
}
