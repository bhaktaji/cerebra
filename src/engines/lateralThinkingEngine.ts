import { SeededRandom } from '../domain/prng';
import { getTierForLevel, LateralThinkingPayload, LevelData, LevelOption } from '../domain/types';

interface LateralArchetype {
  category: string;
  assumptionTrap: string;
  buildScenario: (v: {
    subject: string;
    setting: string;
    detailA: string;
    detailB: string;
    metric: number;
    tier: number;
  }) => {
    title: string;
    scenarioText: string;
    paradoxQuestion: string;
    clues: string[];
    correctHypothesis: string;
    distractors: [string, string, string];
    acceptedKeywords: string[];
    explanation: string;
  };
  variants: {
    subject: string;
    setting: string;
    detailA: string;
    detailB: string;
  }[];
}

const ARCHETYPES: LateralArchetype[] = [
  {
    category: 'Reference Frame & Motion Paradox',
    assumptionTrap: 'Assuming two entities moving in opposite directions or stationary relative to ground share the same vehicle frame.',
    variants: [
      { subject: 'Inspector Vance', setting: 'the Trans-Alpine Express', detailA: 'walked briskly toward the locomotive', detailB: 'ended up 4 kilometers further south than where he started' },
      { subject: 'Captain Lin', setting: 'the Arctic research vessel Borealis', detailA: 'climbed 12 meters up the starboard mast ladder', detailB: 'was found closer to the ocean floor than 10 minutes earlier' },
      { subject: 'Courier Mireille', setting: 'a freight elevator shaft in Zurich', detailA: 'stepped onto a platform moving upward', detailB: 'arrived two sub-basements below street level' },
      { subject: 'Pilot Kael', setting: 'a high-altitude glider over the Andes', detailA: 'pitched the nose downward to increase airspeed', detailB: 'gained 400 meters of net altitude above sea level' },
      { subject: 'Archivist Oren', setting: 'a rotating observatory dome', detailA: 'walked clockwise along the perimeter catwalk for 15 minutes', detailB: 'remained facing the exact same constellation in the western sky' },
      { subject: 'Diver Solis', setting: 'a pressurized diving bell', detailA: 'released ballast weights while inside the chamber', detailB: 'felt the water level inside the bell drop rather than rise' },
      { subject: 'Surveyor Tarek', setting: 'the geographic North Pole station', detailA: 'walked 5 kilometers due south, 5 kilometers due east, and 5 kilometers due north', detailB: 'arrived back at the exact tripod he departed from' },
      { subject: 'Navigator Mara', setting: 'Crossing the International Date Line westward', detailA: 'departed on Tuesday at 23:00 for a 3-hour flight', detailB: 'landed at 02:00 on Thursday, skipping Wednesday entirely' },
      { subject: 'Engineer Boko', setting: 'a river barge inside a canal lock', detailA: 'never started the barge engine or touched the oars', detailB: 'rose 9 meters vertically in 8 minutes while floating level' },
      { subject: 'Astronomer Rhea', setting: 'a geostationary satellite tracking array', detailA: 'kept the dish bolted at a fixed azimuth and elevation', detailB: 'tracked a spacecraft travelling at 11,000 km/h continuously' },
    ],
    buildScenario: ({ subject, setting, detailA, detailB, metric, tier }) => ({
      title: `Frame Shift at ${setting}`,
      scenarioText: `During Log Entry #${metric} at ${setting}, ${subject} ${detailA}. Yet telemetry confirmed that ${subject} ${detailB}. No equipment malfunctioned and all measurements were accurate.`,
      paradoxQuestion: `What non-obvious physical context explains how both observations occurred simultaneously?`,
      clues: [
        `Clue 1: Distinguish motion relative to the local structure from motion relative to Earth's coordinates.`,
        `Clue 2: The environment (${setting}) itself was undergoing a larger displacement, rotation, or coordinate transition.`,
        tier >= 5
          ? `Clue 3: The external frame rate of change exceeded ${subject}'s local action across the ${metric}-minute window.`
          : `Clue 3: Once you account for the movement or geometry of ${setting}, there is no contradiction.`,
      ],
      correctHypothesis: `The enclosing frame (${setting}) moved, rotated, or shifted coordinates faster than ${subject}'s local motion.`,
      distractors: [
        `The measuring instruments were calibrated in imperial units instead of metric units.`,
        `An optical mirage caused observers to misread the starting position.`,
        `${subject} retraced their steps backward after the log entry concluded.`,
      ],
      acceptedKeywords: ['frame', 'moving', 'relative', 'opposite', 'coordinate', 'train', 'earth', 'pole', 'date line', 'updraft', 'lock'],
      explanation: `The apparent paradox arises from conflating local motion inside ${setting} with absolute displacement relative to the ground or coordinate grid. Because ${setting} itself was moving, rotating, or situated at a coordinate singularity, both statements are simultaneously true.`,
    }),
  },
  {
    category: 'State of Matter & Phase Transition',
    assumptionTrap: 'Assuming a solid support, barrier, or evidence object remains in the same physical phase over time.',
    variants: [
      { subject: 'a locked cedar chest', setting: 'an unheated stone warehouse in January', detailA: 'was suspended 2 meters above the floor with no rope, stool, or ladder nearby', detailB: 'only a puddle of clean water lay beneath it' },
      { subject: 'a rare sapphire', setting: 'a customs inspection table', detailA: 'passed through an X-ray liquid flask appearing completely invisible', detailB: 'was retrieved dry and intact when the flask was emptied' },
      { subject: 'two identical iron spheres', setting: 'a precision metrology lab', detailA: 'weighed the exact same 1,000 grams on a vacuum balance', detailB: 'one sphere floated in a dense brine tank while the other sank immediately' },
      { subject: 'a sealed glass ampoule', setting: 'an alpine meteorological hut', detailA: 'shattered outward at midnight even though nobody entered the room', detailB: 'the room temperature had dropped steadily from +6°C to -8°C' },
      { subject: 'a silver key', setting: 'the bottom of a narrow 1-meter stone cylinder', detailA: 'could not be reached by hand, magnet, or tongs', detailB: 'was brought to the rim in two minutes using only a pitcher of salt water and a wooden float' },
      { subject: 'a heavy granite block', setting: 'an Egyptian quarry trench', detailA: 'was split cleanly in half overnight without hammers or explosives', detailB: 'workers had only wedged dry sycamore timber into notches and poured water over them' },
      { subject: 'a pot of mountain stew', setting: 'a base camp at 5,400 meters elevation', detailA: 'boiled vigorously over a roaring stove for 45 minutes', detailB: 'left the root vegetables inside still firm and undercooked' },
      { subject: 'a bridge cable', setting: 'a river gorge crossing', detailA: 'hung 18 centimeters lower at 15:00 than at 05:00 on the same calm day', detailB: 'no vehicles crossed the bridge at any point that day' },
      { subject: 'a cast-iron bell', setting: 'a foundry mold', detailA: 'fit through a steel gauge ring when inspected at 20°C', detailB: 'refused to pass through the exact same gauge ring an hour earlier' },
      { subject: 'a wax-sealed flask of air', setting: 'a cabin flight from Lima to sea level', detailA: 'had a concave inward-bowed rubber membrane upon landing', detailB: 'had never been opened or punctured during transit' },
    ],
    buildScenario: ({ subject, setting, detailA, detailB, metric }) => ({
      title: `Phase & Property Anomaly #${metric}`,
      scenarioText: `In Case Study #${metric} at ${setting}, ${subject} ${detailA}. Investigators noted that ${detailB}.`,
      paradoxQuestion: `Which physical or thermodynamic mechanism resolves the mystery without any outside tampering?`,
      clues: [
        `Clue 1: Question whether the materials involved maintained constant density, phase, temperature, or refractive index.`,
        `Clue 2: Notice the environmental clue: "${detailB}".`,
        `Clue 3: Phase change (ice melting/freezing), thermal expansion, buoyancy hollow volume, boiling point depression, or index-of-refraction matching directly explains the observation.`,
      ],
      correctHypothesis: `A thermodynamic or physical state property (phase transition, thermal expansion, hollow volume, or pressure/refractive equilibrium) caused the change naturally.`,
      distractors: [
        `A hidden electromagnetic coil beneath the floor manipulated the object remotely.`,
        `The object was swapped with a counterfeit replica by a technician during shift change.`,
        `Gravitational anomalies at the location altered the weight of the materials.`,
      ],
      acceptedKeywords: ['ice', 'melted', 'freeze', 'expansion', 'hollow', 'density', 'pressure', 'boiling', 'altitude', 'refractive', 'buoyancy', 'swelling'],
      explanation: `Conventional thinking assumes static material properties. Here, "${detailB}" reveals a natural physical mechanism—such as ice melting, water expanding upon freezing, lower atmospheric pressure lowering boiling temperature, hollow cavity buoyancy, or thermal expansion—that resolves the scenario completely.`,
    }),
  },
  {
    category: 'Semantic Role & Identity Reframing',
    assumptionTrap: 'Assigning default occupational, familial, or institutional roles that are not stated in the premises.',
    variants: [
      { subject: 'Dr. Aris and young Leo', setting: 'an emergency surgical suite', detailA: 'shared the exact same biological parents', detailB: 'Dr. Aris truthfully stated that Leo had no brothers' },
      { subject: 'Judge Corinne', setting: 'a maritime tribunal', detailA: 'ruled that the defendant before the bench was guilty of all charges', detailB: 'declared that the Law prohibited sentencing the person standing at the podium' },
      { subject: 'Master Chess Arbiter Sol', setting: 'the Geneva Open Championship', detailA: 'watched two grandmasters play 14 decisive games in one afternoon', detailB: 'recorded that both grandmasters won all 14 of their games with zero draws' },
      { subject: 'Architect Elena', setting: 'a heritage townhouse renovation', detailA: 'purchased a rare 1790 coin stamped "1790 BC" from a dealer', detailB: 'had the dealer arrested for fraud within thirty seconds of seeing the date stamp' },
      { subject: 'Customs Officer Malik', setting: 'the border bridge checkpoint', detailA: 'inspected a truck driver hauling 40 নতুন bicycles across the border every week for a year', detailB: 'realized the driver was smuggling trucks, not bicycles' },
      { subject: 'Notary Public Hélène', setting: 'an estate reading in Lyon', detailA: 'verified that twin brothers born from the same mother on the same hour had birthdays in different calendar years and different decades', detailB: 'confirmed no clerical error existed on their birth certificates' },
      { subject: 'Curator Sato', setting: 'the Kyoto Textile Museum', detailA: 'authenticated a kimono worn by an Emperor who lived from 1612 to 1665', detailB: 'rejected a diary entry claiming the Emperor wore it on the 31st of June, 1640' },
      { subject: 'Warden Kestrel', setting: 'a nature reserve watchtower', detailA: 'saw a cabin in the valley where every single passenger inside perished on impact', detailB: 'confirmed that not a single person walking in the valley had been aboard a building' },
      { subject: 'Postmaster Lin', setting: 'an island post office', detailA: 'delivered a sealed crate containing a 2-meter fishing rod despite a strict rule banning any parcel over 1.25 meters in length', detailB: 'did not bend, cut, or disassemble the rod' },
      { subject: 'Historian Davi', setting: 'a monastery archive', detailA: 'read a manuscript stating a king survived 20 days without sleep', detailB: 'found nothing medically unusual about the king’s schedule' },
    ],
    buildScenario: ({ subject, setting, detailA, detailB, metric }) => ({
      title: `Implicit Assumption Case #${metric}`,
      scenarioText: `In Record #${metric} at ${setting}, ${subject} encountered a situation where ${detailA}, and simultaneously ${detailB}.`,
      paradoxQuestion: `Which unstated assumption must be discarded to see why this is completely logical?`,
      clues: [
        `Clue 1: Re-read every noun and title carefully—what assumption did your mind automatically fill in?`,
        `Clue 2: Check gender/relationship assumptions, opponent pairings, calendar rules, geometric diagonals, or multi-meaning words ("cabin" of an aircraft, sleeping at night vs day).`,
        `Clue 3: Once the unstated assumption is dropped, the two facts ("${detailA}" and "${detailB}") do not conflict at all.`,
      ],
      correctHypothesis: `A default linguistic or situational assumption (such as gender, playing against each other, box diagonal geometry, or calendar/dating conventions) is false.`,
      distractors: [
        `The official records were altered retroactively due to a translation error.`,
        `One of the individuals was using a legal alias to conceal their identity.`,
        `A rare medical condition caused the participants to misremember the event.`,
      ],
      acceptedKeywords: ['sister', 'twin', 'different opponents', 'bc', 'diagonal', 'night', 'june', 'aircraft', 'cabin', 'new year', 'december'],
      explanation: `The puzzle exploits an unstated cognitive default: e.g., Dr. Aris is Leo's sister; the two grandmasters played against other opponents; no authentic ancient coin could be stamped "BC" before the calendar era existed; June only has 30 days; a 2m rod fits diagonally inside a 1.25m×1.25m×1.25m box; or twins were born on Dec 31, 1999 at 23:58 and Jan 1, 2000 at 00:03.`,
    }),
  },
  {
    category: 'Resource & Operational Constraint Inversion',
    assumptionTrap: 'Assuming optimization requires adding resources rather than removing, pairing, or inverting the operation.',
    variants: [
      { subject: 'Foreman Kade', setting: 'a low-clearance stone tunnel', detailA: 'had a heavy freight truck wedged 2 centimeters too tall for the roof arch', detailB: 'freed the truck in 3 minutes without touching the roof, cargo, or winch' },
      { subject: 'Apothecary Noor', setting: 'a field clinic with two unmarked 5-liter and 3-liter flasks', detailA: 'needed exactly 4 liters of distilled water from a running spring', detailB: 'measured 4.00 liters accurately without any ruler or scale' },
      { subject: 'Quartermaster Jin', setting: 'a dark supply vault containing 20 navy socks and 20 charcoal socks mixed together', detailA: 'needed one matching pair of socks of either color', detailB: 'guaranteed a matching pair by drawing only 3 socks total' },
      { subject: 'Signalman Vane', setting: 'a basement with 3 light switches wired to 1 attic bulb', detailA: 'was allowed only a single trip up the stairs to the attic', detailB: 'identified the exact active switch with 100% certainty' },
      { subject: 'Bridge Warden Sol', setting: 'a narrow plank crossing at night with one lantern', detailA: 'guided four hikers (taking 1, 2, 5, and 10 minutes) across in 17 minutes total', detailB: 'paired the two slowest hikers together on the second crossing rather than sending the fastest hiker with each one' },
      { subject: 'Assayer Petra', setting: 'a mint vault with 9 gold coins where 1 coin is slightly lighter', detailA: 'had an equal-arm balance scale and permission for only 2 weighings', detailB: 'isolated the counterfeit coin on the second weighing by dividing the coins into groups of 3, 3, and 3' },
      { subject: 'Botanist Ren', setting: 'a greenhouse pond where a water lily doubles in area every 24 hours', detailA: 'observed that the pond was completely covered on Day 30', detailB: 'determined that the pond was exactly half-covered on Day 29, not Day 15' },
      { subject: 'Locksmith Tova', setting: 'sending a locked strongbox to a colleague across the sea without sharing keys', detailA: 'had the recipient attach a second padlock and return the box so Tova could remove the first padlock', detailB: 'delivered the contents securely without any key ever travelling in the mail' },
      { subject: 'Metallurgist Ivo', setting: 'joining 5 segments of 3-link iron chain into one 15-link loop', detailA: 'was charged 10 silver to cut a link and 10 silver to weld a link', detailB: 'paid 60 silver instead of 80 silver by cutting all 3 links of a single segment and using them as connectors' },
      { subject: 'Chronometer Maker Luz', setting: 'timing a 9-minute temper cycle using only a 7-minute and a 4-minute hourglass', detailA: 'started both hourglasses together and flipped them strategically', detailB: 'measured an exact 9-minute interval without any clock' },
    ],
    buildScenario: ({ subject, setting, detailA, detailB, metric }) => ({
      title: `Operational Inversion #${metric}`,
      scenarioText: `In Field Problem #${metric} at ${setting}, ${subject} faced a strict constraint: ${detailA}. By reframing the procedure, ${subject} ${detailB}.`,
      paradoxQuestion: `What lateral operational principle enabled this solution where linear trial-and-error fails?`,
      clues: [
        `Clue 1: Instead of adding force or taking linear steps, consider subtracting, pairing extremes, or using a secondary physical property (like heat, tire pressure, or pigeonhole parity).`,
        `Clue 2: Notice how the solution ("${detailB}") exploits information contained in the *untested* state or a complementary action.`,
        `Clue 3: Whether deflating tires slightly, using bulb warmth as a third state, working backward from exponential doubling, or partitioning into 3 groups, inverting the constraint solves it immediately.`,
      ],
      correctHypothesis: `Inverting the constraint—using complementary states (e.g., tire deflation, thermal memory, ternary partitioning, or backward exponential reasoning)—solves the problem directly.`,
      distractors: [
        `Using statistical approximation over dozens of repeated trials.`,
        `Disassembling the entire structure and rebuilding it from scratch.`,
        `Waiting for seasonal weather changes to alter the dimensions.`,
      ],
      acceptedKeywords: ['tires', 'deflate', 'air', 'heat', 'warm', 'pigeonhole', 'three', 'double', 'day 29', 'padlock', 'flask', 'invert'],
      explanation: `Linear problem-solving tries to push harder in the obvious direction (e.g., chipping the tunnel roof, weighing 4 vs 4 coins, or dividing Day 30 by 2). Lateral problem-solving inverts the operation: letting 2 cm of air out of the tires, using heat from the bulb as a third state, grouping into thirds (3-3-3), or working one step backward from Day 30 to Day 29.`,
    }),
  },
];

export function generateLateralThinkingLevel(levelNumber: number): LevelData {
  const tierMeta = getTierForLevel(levelNumber);
  const tier = tierMeta.tier;
  const rng = new SeededRandom(`lateral-thinking-v1-${levelNumber}`);

  const archetypeIdx = (levelNumber - 1) % ARCHETYPES.length;
  const archetype = ARCHETYPES[archetypeIdx];
  const variantIdx = Math.floor((levelNumber - 1) / ARCHETYPES.length) % archetype.variants.length;
  const variant = archetype.variants[variantIdx];

  // Combine with deterministic case modifier so all 1,000 levels have unique parameters & signatures
  const metric = 100 + levelNumber * 3;
  const built = archetype.buildScenario({
    ...variant,
    metric,
    tier,
  });

  const allHypotheses = rng.shuffle([built.correctHypothesis, ...built.distractors]);
  const options: LevelOption[] = allHypotheses.map((lbl, i) => ({
    id: `lat-opt-${i}`,
    label: lbl,
  }));
  const correctOption = options.find((o) => o.label === built.correctHypothesis)!;

  const payload: LateralThinkingPayload = {
    type: 'lateral-thinking',
    scenarioTitle: `${built.title} (Dossier ${levelNumber})`,
    scenarioText: built.scenarioText,
    evidenceClues: built.clues,
    paradoxQuestion: built.paradoxQuestion,
    acceptedKeywords: built.acceptedKeywords,
  };

  return {
    id: `lateral-thinking-L${String(levelNumber).padStart(4, '0')}`,
    gameId: 'lateral-thinking',
    levelNumber,
    tier,
    tierName: tierMeta.name,
    title: built.title,
    prompt: built.paradoxQuestion,
    signature: `LT-L${levelNumber}-${archetypeIdx}-${variantIdx}-${metric}`,
    payload,
    options,
    correctOptionId: correctOption.id,
    correctAnswerDisplay: built.correctHypothesis,
    acceptedTextAnswers: built.acceptedKeywords,
    hints: [built.clues[0], built.clues[1], built.clues[2]],
    explanation: built.explanation,
  };
}
