import { SeededRandom } from '../domain/prng';
import {
  getTierForLevel,
  LevelData,
  LevelOption,
  MindInvestigatorPayload,
  SuspectDossier,
} from '../domain/types';

interface CaseSetting {
  location: string;
  targetEvent: string;
  suspectPool: { name: string; role: string }[];
  contradictionVectors: {
    evidenceFact: (timeStr: string, code: number) => string;
    contradictoryAlibi: (timeStr: string, code: number) => string;
    contradictoryTrace: string;
    validAlibis: ((timeStr: string) => { claim: string; trace: string })[];
    explanationDetail: string;
  }[];
}

const CASE_SETTINGS: CaseSetting[] = [
  {
    location: 'The Geneva Chronometer Vault',
    targetEvent: 'Unauthorized extraction of Prototype Calibration Disc #',
    suspectPool: [
      { name: 'Director Sterling', role: 'Chief Horologist' },
      { name: 'Clara Vance', role: 'Vault Security Lead' },
      { name: 'Henrik Lind', role: 'Cryo-Optics Engineer' },
      { name: 'Sora Takahashi', role: 'Metrology Auditor' },
      { name: 'Marcus Thorne', role: 'Night Courier' },
    ],
    contradictionVectors: [
      {
        evidenceFact: (t, code) =>
          `Biometric Log #${code}: The West Airlock remained hermetically sealed for pressure testing from ${t} for 45 minutes; zero badge swipes were possible through West Airlock during that window.`,
        contradictoryAlibi: (t, code) =>
          `Claims to have exited the Vault Annex via the West Airlock at ${t} carrying Transfer Manifest #${code}.`,
        contradictoryTrace: 'Badge telemetry shows no West Airlock transit record',
        validAlibis: [
          (t) => ({ claim: `Was calibrating quartz resonators in the East Wing Lab at ${t}.`, trace: 'Verified by East Wing terminal login' }),
          (t) => ({ claim: `Monitored the main CCTV console in Control Room B during ${t}.`, trace: 'Confirmed by continuous audio log' }),
          (t) => ({ claim: `Signed in a freight delivery at the North Loading Dock at ${t}.`, trace: 'Co-signed by dock supervisor' }),
          (t) => ({ claim: `Conducted a thermal audit on Level 2 at ${t}.`, trace: 'Infrared camera timestamps match' }),
        ],
        explanationDetail: 'claimed to pass through the West Airlock during the exact window when the airlock was hermetically locked down for pressure testing.',
      },
      {
        evidenceFact: (t, code) =>
          `Acoustic Sensor #${code}: The main vault floor was coated in fresh UV-reactive silica dust at ${t}; only footprints with Size-42 anti-static soles entered the inner chamber.`,
        contradictoryAlibi: (t) =>
          `Insists they never stepped near the inner chamber after ${t} and wore standard street boots all evening.`,
        contradictoryTrace: 'UV spectrometer detected trace silica dust on their custom Size-42 anti-static lab shoes',
        validAlibis: [
          (t) => ({ claim: `Remained in the Glass Atrium reviewing blueprints at ${t}.`, trace: 'Shoes tested negative for UV silica' }),
          (t) => ({ claim: `Operated the service freight lift on the opposite wing at ${t}.`, trace: 'Wears Size-38 footwear; zero UV trace' }),
          (t) => ({ claim: `Cataloged archival ledgers in the Basement Vault at ${t}.`, trace: 'Continuous keystroke log verified' }),
          (t) => ({ claim: `Stationed at the perimeter gatehouse at ${t}.`, trace: 'Exterior gate camera corroborates' }),
        ],
        explanationDetail: 'denied entering the inner chamber, yet forensic UV spectrometry found the vault floor’s unique UV-reactive silica dust on their Size-42 anti-static footwear.',
      },
    ],
  },
  {
    location: 'High-Altitude Observatory Meridian',
    targetEvent: 'Unscheduled realignment of Deep-Space Array #',
    suspectPool: [
      { name: 'Dr. Elena Rostova', role: 'Astrophysicist' },
      { name: 'Julian Mercer', role: 'Telemetry Systems Architect' },
      { name: 'Nadia Okafor', role: 'Laser Guide Operator' },
      { name: 'Victor Kael', role: 'Dome Mechanical Specialist' },
      { name: 'Linus Vance', role: 'Data Archivist' },
    ],
    contradictionVectors: [
      {
        evidenceFact: (t, code) =>
          `Grid Power Log #${code}: A scheduled generator switchover cut all AC power to the Sub-Level Server Room at ${t}, forcing all terminals offline onto read-only battery backup.`,
        contradictoryAlibi: (t, code) =>
          `Claims to have compiled and uploaded a 40-gigabyte star catalog directly from the Sub-Level Server Room terminal at ${t} (Batch #${code}).`,
        contradictoryTrace: 'Sub-Level Server Room network switch recorded 0 bytes transmitted during the AC outage',
        validAlibis: [
          (t) => ({ claim: `Was manually inspecting the primary mirror hydraulics on Deck 4 at ${t}.`, trace: 'Torque wrench log verified' }),
          (t) => ({ claim: `Monitored battery inverter voltage in the Power Annex at ${t}.`, trace: 'Signed physical generator checklist' }),
          (t) => ({ claim: `Observed weather balloon telemetry from the Roof Platform at ${t}.`, trace: 'Anemometer log corroborates' }),
          (t) => ({ claim: `Prepared liquid nitrogen dewars in the Cryo Bay at ${t}.`, trace: 'Mass-flow meter confirms transfer' }),
        ],
        explanationDetail: 'claimed to be uploading data from the Sub-Level Server Room terminal at the exact time the room was offline due to the generator switchover.',
      },
      {
        evidenceFact: (t, code) =>
          `Transit Protocol #${code}: The cable car between the Ridge Lab and the Main Dome takes a minimum of 18 minutes each way; at ${t}, the cable car was parked at the Main Dome.`,
        contradictoryAlibi: (t) =>
          `Claims to have signed the paper logbook at the Ridge Lab 4 minutes before ${t} and answered the Main Dome intercom in person at ${t}.`,
        contradictoryTrace: 'Physical transit between Ridge Lab and Main Dome in 4 minutes is impossible (minimum 18 min)',
        validAlibis: [
          (t) => ({ claim: `Remained inside the Main Dome control booth for the entire hour around ${t}.`, trace: 'Badge stayed within Zone 1' }),
          (t) => ({ claim: `Worked continuously at the Ridge Lab optical bench through ${t}.`, trace: 'Verified by colleague on site' }),
          (t) => ({ claim: `Calibrated the spectrograph cooling loop on Deck 2 at ${t}.`, trace: 'Thermal sensor log matches' }),
          (t) => ({ claim: `Logged radio frequency interference in the Shielded Room at ${t}.`, trace: 'Faraday cage door log verified' }),
        ],
        explanationDetail: 'claimed a 4-minute transit between the Ridge Lab and Main Dome, which is physically impossible given the mandatory 18-minute cable car travel time.',
      },
    ],
  },
];

export function generateMindInvestigatorLevel(levelNumber: number): LevelData {
  const tierMeta = getTierForLevel(levelNumber);
  const tier = tierMeta.tier;
  const idxInTier = (levelNumber - 1) % 100;
  const rng = new SeededRandom(`mind-investigator-v1-${levelNumber}`);

  const setting = CASE_SETTINGS[(levelNumber - 1) % CASE_SETTINGS.length];
  const vector =
    setting.contradictionVectors[
      Math.floor((levelNumber - 1) / CASE_SETTINGS.length) % setting.contradictionVectors.length
    ];

  // Suspect count scales from 3 (Tiers 1-3) -> 4 (Tiers 4-7) -> 5 (Tiers 8-10)
  const suspectCount = tier <= 3 ? 3 : tier <= 7 ? 4 : 5;
  const chosenPool = setting.suspectPool.slice(0, suspectCount);

  const hour = 18 + (levelNumber % 5);
  const minute = (levelNumber * 7) % 50 + 10;
  const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  const code = 4000 + levelNumber;

  const culpritIdx = (levelNumber + idxInTier) % suspectCount;
  const culpritPerson = chosenPool[culpritIdx];

  const suspects: SuspectDossier[] = chosenPool.map((p, idx) => {
    if (idx === culpritIdx) {
      return {
        id: `susp-${idx}`,
        name: p.name,
        role: p.role,
        alibiClaim: vector.contradictoryAlibi(timeStr, code),
        timelineWindow: `${timeStr} – ${String(hour).padStart(2, '0')}:55`,
        physicalNote: vector.contradictoryTrace,
      };
    } else {
      const validGen = vector.validAlibis[idx % vector.validAlibis.length](timeStr);
      return {
        id: `susp-${idx}`,
        name: p.name,
        role: p.role,
        alibiClaim: validGen.claim,
        timelineWindow: `${timeStr} – ${String(hour).padStart(2, '0')}:55`,
        physicalNote: validGen.trace,
      };
    }
  });

  const shuffledSuspects = rng.shuffle(suspects);

  const verifiedEvidence: string[] = [
    `Incident Timestamp: ${setting.targetEvent}${code} occurred at ${timeStr} inside ${setting.location}.`,
    vector.evidenceFact(timeStr, code),
    `Access Control Rule: Every staff member outside the incident zone has an independent digital or physical corroboration log for ${timeStr}.`,
  ];

  const options: LevelOption[] = shuffledSuspects.map((s) => ({
    id: s.id,
    label: `${s.name} (${s.role})`,
    sublabel: s.timelineWindow,
  }));

  const correctOption = options.find((o) => o.id === `susp-${culpritIdx}`)!;

  const payload: MindInvestigatorPayload = {
    type: 'mind-investigator',
    caseNumber: `CASE-${String(levelNumber).padStart(4, '0')}`,
    caseTitle: `${setting.location} — Dossier #${levelNumber}`,
    incidentSummary: `${setting.targetEvent}${code} was recorded at ${timeStr}. Cross-examine the ${suspectCount} suspect dossiers against the verified forensic logs.`,
    verifiedEvidence,
    suspects: shuffledSuspects,
    questionPrompt: `Which suspect's stated alibi directly contradicts the verified forensic evidence for ${timeStr}?`,
  };

  return {
    id: `mind-investigator-L${String(levelNumber).padStart(4, '0')}`,
    gameId: 'mind-investigator',
    levelNumber,
    tier,
    tierName: tierMeta.name,
    title: `Case File #${String(levelNumber).padStart(4, '0')}`,
    prompt: payload.questionPrompt,
    signature: `MI-L${levelNumber}-code${code}-${timeStr}-culprit:${culpritPerson.name}`,
    payload,
    options,
    correctOptionId: correctOption.id,
    correctAnswerDisplay: `${culpritPerson.name} (${culpritPerson.role})`,
    hints: [
      `Compare the timestamp (${timeStr}) in Verified Evidence Item #2 against each suspect's claimed location and action.`,
      `Look closely at the physical and telemetry notes attached to each dossier: ${vector.contradictoryTrace}.`,
      `${culpritPerson.name} is the only suspect whose alibi conflicts with the verified forensic record.`,
    ],
    explanation: `Cross-referencing the forensic log at ${timeStr} exposes ${culpritPerson.name} (${culpritPerson.role}), who ${vector.explanationDetail} All other suspects have independently corroborated logs.`,
  };
}
