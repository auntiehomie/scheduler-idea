/**
 * scheduler.js - Energy/health-based schedule suggestion engine
 *
 * Generates a daily schedule tailored to the user's current health state
 * as reported by Oura Ring data and menstrual cycle phase.
 */

/**
 * Energy levels derived from Oura readiness + sleep scores.
 */
export const EnergyLevel = {
  HIGH: 'high',       // Readiness >= 85
  MEDIUM: 'medium',   // Readiness 60–84
  LOW: 'low',         // Readiness < 60
};

/**
 * Derive an energy level from Oura data.
 * @param {{ readiness, sleep }} ouraData
 * @returns {string} EnergyLevel
 */
export function deriveEnergyLevel(ouraData) {
  const readinessScore = ouraData?.readiness?.score ?? 50;
  const sleepScore = ouraData?.sleep?.score ?? 50;

  // Weighted average: readiness counts more
  const combined = readinessScore * 0.6 + sleepScore * 0.4;

  if (combined >= 85) return EnergyLevel.HIGH;
  if (combined >= 60) return EnergyLevel.MEDIUM;
  return EnergyLevel.LOW;
}

/**
 * Schedule blocks for each energy level.
 * Each block has a time range, label, and notes.
 */
const SCHEDULE_TEMPLATES = {
  [EnergyLevel.HIGH]: [
    { time: '07:00', label: 'Morning workout or run', notes: 'Great day for intense exercise — your body is ready.' },
    { time: '09:00', label: 'Deep work / creative work', notes: 'Tackle your hardest problem of the day now.' },
    { time: '12:00', label: 'Lunch + short walk', notes: 'Fuel up and reset.' },
    { time: '13:00', label: 'Meetings / collaborative work', notes: 'High energy = great for social/collaborative tasks.' },
    { time: '17:00', label: 'Hobby time', notes: 'See hobby suggestions for today.' },
    { time: '21:00', label: 'Wind down', notes: 'Light stretching, reading, or journaling.' },
  ],
  [EnergyLevel.MEDIUM]: [
    { time: '08:00', label: 'Light movement (yoga, walk)', notes: 'Moderate activity — no need to push hard.' },
    { time: '09:30', label: 'Focused work (2 h blocks)', notes: 'Prioritize important but not exhausting tasks.' },
    { time: '12:00', label: 'Nourishing lunch', notes: 'Eat well — energy may dip after.' },
    { time: '13:30', label: 'Admin / lighter tasks', notes: 'Use the post-lunch window for lower-cognitive work.' },
    { time: '16:00', label: 'Gentle hobby or social time', notes: 'See hobby suggestions for today.' },
    { time: '21:00', label: 'Early wind down', notes: 'Prioritize 8h sleep tonight.' },
  ],
  [EnergyLevel.LOW]: [
    { time: '09:00', label: 'Slow start — no alarm rush', notes: 'Your body needs rest. Be gentle.' },
    { time: '10:00', label: 'Very light movement', notes: 'Short walk or stretching only.' },
    { time: '11:00', label: 'Essential tasks only', notes: 'Tackle only must-dos. Defer the rest.' },
    { time: '13:00', label: 'Rest / nap if possible', notes: '20-minute nap can help recovery.' },
    { time: '15:00', label: 'Restorative hobby', notes: 'See hobby suggestions — low-effort options today.' },
    { time: '20:00', label: 'Very early wind down', notes: 'Sleep is medicine. Aim for 9h tonight.' },
  ],
};

/**
 * Generate a suggested schedule for the day.
 *
 * @param {object} options
 * @param {object} options.ouraData     - { readiness, activity, sleep } from oura.js
 * @param {string} options.cyclePhase   - Phase from menstrual.js (e.g. 'follicular')
 * @param {string[]} options.hobbies    - Hobby suggestions from hobbies.js
 * @returns {{ energyLevel, schedule: Array }}
 */
export function generateSchedule({ ouraData, cyclePhase, hobbies = [] }) {
  const energyLevel = deriveEnergyLevel(ouraData);
  const baseSchedule = SCHEDULE_TEMPLATES[energyLevel];

  // Inject hobby suggestions into the hobby block
  const schedule = baseSchedule.map((block) => {
    if (block.label.toLowerCase().includes('hobby') && hobbies.length > 0) {
      return {
        ...block,
        notes: `Suggested: ${hobbies.slice(0, 3).join(', ')}`,
      };
    }
    return block;
  });

  // Add cycle phase context note if available
  const cycleNote = cyclePhase
    ? `\n🌸 Cycle phase today: ${cyclePhase} — schedule adjusted for your energy patterns.`
    : '';

  return {
    energyLevel,
    cyclePhase,
    schedule,
    summary: `Energy level: ${energyLevel.toUpperCase()}${cycleNote}`,
  };
}

/**
 * Pretty-print a schedule to the console.
 * @param {object} result - Return value of generateSchedule()
 */
export function printSchedule(result) {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  📅  YOUR SCHEDULE FOR TODAY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(result.summary);
  console.log('');
  for (const block of result.schedule) {
    console.log(`  ${block.time}  ${block.label}`);
    console.log(`         ↳ ${block.notes}`);
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}
