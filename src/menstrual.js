/**
 * menstrual.js - Menstrual cycle awareness module
 *
 * Determines current cycle phase based on cycle start date and length,
 * and provides energy/mood context for each phase to inform scheduling.
 */

/**
 * The four main cycle phases with typical day ranges.
 * Note: these are approximations — individual cycles vary widely.
 */
export const CyclePhase = {
  MENSTRUAL:  'menstrual',    // Days 1–5   (bleeding)
  FOLLICULAR: 'follicular',   // Days 6–13  (rising energy)
  OVULATION:  'ovulation',    // Days 14–16 (peak energy)
  LUTEAL:     'luteal',       // Days 17–28 (winding down)
};

/**
 * Phase metadata: typical energy, mood, and scheduling notes.
 */
export const PHASE_METADATA = {
  [CyclePhase.MENSTRUAL]: {
    label: 'Menstrual (Days 1–5)',
    typicalEnergy: 'low',
    mood: 'introspective',
    schedulingNotes: 'Rest is productive. Avoid high-intensity workouts. Good for reflection, journaling, gentle creative work.',
    recommendLowIntensity: true,
  },
  [CyclePhase.FOLLICULAR]: {
    label: 'Follicular (Days 6–13)',
    typicalEnergy: 'rising',
    mood: 'curious and motivated',
    schedulingNotes: 'Great time to start new projects, learn new things, exercise more. Social energy building.',
    recommendLowIntensity: false,
  },
  [CyclePhase.OVULATION]: {
    label: 'Ovulation (Days 14–16)',
    typicalEnergy: 'peak',
    mood: 'confident and social',
    schedulingNotes: 'Peak energy and communication skills. Best for important meetings, workouts, high-stakes tasks.',
    recommendLowIntensity: false,
  },
  [CyclePhase.LUTEAL]: {
    label: 'Luteal (Days 17–28)',
    typicalEnergy: 'declining',
    mood: 'detail-oriented then fatigue',
    schedulingNotes: 'Early luteal: great for detail work and finishing projects. Late luteal: rest more, reduce commitments.',
    recommendLowIntensity: true, // especially late luteal
  },
};

/**
 * Calculate the current cycle day from a start date.
 * @param {string} cycleStartDate - YYYY-MM-DD of last period start
 * @param {string} [today]        - YYYY-MM-DD (defaults to today)
 * @param {number} [cycleLength]  - Average cycle length (default 28)
 * @returns {number} Current day in cycle (1-based, wraps at cycleLength)
 */
export function getCycleDay(cycleStartDate, today, cycleLength = 28) {
  const start = new Date(cycleStartDate);
  const current = today ? new Date(today) : new Date();

  // Strip time component
  start.setHours(0, 0, 0, 0);
  current.setHours(0, 0, 0, 0);

  const diffMs = current - start;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Wrap into cycle (1-based)
  return (diffDays % cycleLength) + 1;
}

/**
 * Determine the cycle phase from cycle day.
 * @param {number} cycleDay     - 1-based day in cycle
 * @param {number} cycleLength  - Total cycle length (default 28)
 * @returns {string} CyclePhase
 */
export function getPhaseFromDay(cycleDay, cycleLength = 28) {
  // Ovulation occurs ~14 days before next period
  const ovulationDay = cycleLength - 14;

  if (cycleDay <= 5) return CyclePhase.MENSTRUAL;
  if (cycleDay < ovulationDay - 1) return CyclePhase.FOLLICULAR;
  if (cycleDay <= ovulationDay + 1) return CyclePhase.OVULATION;
  return CyclePhase.LUTEAL;
}

/**
 * Get full cycle context for today.
 *
 * @param {object} options
 * @param {string} options.cycleStartDate  - YYYY-MM-DD of last period start
 * @param {string} [options.today]         - YYYY-MM-DD (defaults to today)
 * @param {number} [options.cycleLength]   - Default 28
 * @returns {{ cycleDay, phase, metadata } | null}
 */
export function getCycleContext({ cycleStartDate, today, cycleLength = 28 }) {
  if (!cycleStartDate) return null;

  const cycleDay = getCycleDay(cycleStartDate, today, cycleLength);
  const phase = getPhaseFromDay(cycleDay, cycleLength);
  const metadata = PHASE_METADATA[phase];

  return {
    cycleDay,
    phase,
    metadata,
  };
}
