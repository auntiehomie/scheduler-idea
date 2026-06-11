/**
 * energy-map.js - Energy curve visualization generator
 *
 * Creates a visual energy profile for the day based on Oura data
 * (readiness + sleep scores) and menstrual cycle phase.
 *
 * The energy curve predicts how energy varies throughout the day:
 *   - Morning peak (cortisol awakening response)
 *   - Mid-day dip (post-prandial)
 *   - Afternoon recovery
 *   - Evening wind-down
 *
 * These natural rhythms are modulated by Oura readiness/sleep data.
 */

// ── Energy curve generation ──────────────────────────────────────────────────

/**
 * Time blocks for the energy curve
 */
export const TIME_BLOCKS = [
  { id: 'early_morning', label: 'Early Morning', hour: 6, range: '6-8 AM', icon: '🌅' },
  { id: 'morning',       label: 'Morning',       hour: 9, range: '9-11 AM', icon: '☀️' },
  { id: 'midday',        label: 'Midday',        hour: 12, range: '12-1 PM', icon: '⛅' },
  { id: 'afternoon',     label: 'Afternoon',     hour: 14, range: '2-4 PM', icon: '🌤️' },
  { id: 'late_afternoon', label: 'Late Afternoon', hour: 16, range: '4-5 PM', icon: '🌇' },
  { id: 'evening',       label: 'Evening',       hour: 18, range: '6-8 PM', icon: '🌆' },
  { id: 'night',         label: 'Night',         hour: 21, range: '9-10 PM', icon: '🌙' },
];

/**
 * Cycle phase energy modifiers (typical ranges)
 */
const CYCLE_MODIFIERS = {
  menstrual:  { energyMult: 0.7, focusType: 'low',   bestFor: 'rest, light tasks' },
  follicular: { energyMult: 1.1, focusType: 'rising', bestFor: 'creative work, new ideas' },
  ovulation:  { energyMult: 1.2, focusType: 'peak',   bestFor: 'meetings, high-stakes tasks' },
  luteal:     { energyMult: 0.85, focusType: 'steady', bestFor: 'routine tasks, detail work' },
};

const DEFAULT_CYCLE = { energyMult: 1.0, focusType: 'neutral', bestFor: 'balanced tasks' };

/**
 * Generate an energy curve for today.
 *
 * @param {object} ouraData - { readiness, activity, sleep } from oura.js
 * @param {object} cycleContext - from menstrual.js { phase, cycleDay }
 * @returns {{ blocks: EnergyBlock[], curve: number, cycleInfluence: string }}
 */
export function generateEnergyCurve(ouraData, cycleContext) {
  // Base energy from Oura readiness (weighted 60%) + sleep (40%)
  const readinessScore = ouraData?.readiness?.score ?? 50;
  const sleepScore = ouraData?.sleep?.score ?? 50;
  const baseEnergy = (readinessScore * 0.6 + sleepScore * 0.4) / 100; // 0-1 scale

  // Cycle phase modulation
  const phase = cycleContext?.phase || 'neutral';
  const cycleMod = CYCLE_MODIFIERS[phase] || DEFAULT_CYCLE;

  // Build time-of-day multipliers (natural energy rhythm)
  // Most people peak mid-morning, dip after lunch, recover by late afternoon
  const timeMultipliers = {
    early_morning:   0.75 + (baseEnergy * 0.15),  // Waking up
    morning:         0.85 + (baseEnergy * 0.15),  // Peak window
    midday:          0.60 + (baseEnergy * 0.10),  // Post-lunch dip
    afternoon:       0.70 + (baseEnergy * 0.15),  // Recovery
    late_afternoon:  0.65 + (baseEnergy * 0.10),  // Second wind
    evening:         0.50 + (baseEnergy * 0.10),  // Winding down
    night:           0.35 + (baseEnergy * 0.05),  // Sleep prep
  };

  const blocks = TIME_BLOCKS.map(block => {
    const timeMul = timeMultipliers[block.id] || 0.5;
    const rawEnergy = baseEnergy * cycleMod.energyMult * timeMul;
    const clamped = Math.max(0.05, Math.min(1.0, rawEnergy));

    let level;
    if (clamped >= 0.75) level = 'high';
    else if (clamped >= 0.45) level = 'medium';
    else level = 'low';

    return {
      ...block,
      energy: clamped,
      energyPercent: Math.round(clamped * 100),
      level,
      focusType: cycleMod.focusType,
    };
  });

  const curve = Math.round(baseEnergy * 100);

  return {
    blocks,
    curve,
    cycleInfluence: `${phase} phase (${cycleMod.focusType} energy)`,
  };
}

/**
 * Auto-schedule priorities into optimal energy windows.
 *
 * @param {string[]} priorities - User's top priorities for the day (max 3)
 * @param {EnergyBlock[]} energyBlocks - From generateEnergyCurve()
 * @returns {Array} - Scheduled items with time slots and energy context
 */
export function autoSchedulePriorities(priorities, energyBlocks) {
  if (!priorities || priorities.length === 0) return [];

  // Rank energy blocks by energy level (descending)
  const ranked = [...energyBlocks].sort((a, b) => b.energy - a.energy);

  // Assign highest priority to highest energy window, etc.
  const scheduled = priorities.map((priority, i) => {
    const block = ranked[i] || ranked[ranked.length - 1];
    const energyLabel = block.level === 'high' ? '⚡ Peak focus window' :
                        block.level === 'medium' ? '👍 Good focus window' :
                        '🛋️ Low energy — best for easy tasks';

    return {
      priority,
      scheduledTime: block.range,
      energyLevel: block.level,
      energyPercent: block.energyPercent,
      context: energyLabel,
      icon: block.icon,
    };
  });

  return scheduled;
}
