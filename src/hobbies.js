/**
 * hobbies.js - Hobby suggestion engine
 *
 * Recommends activities and hobbies based on current health state,
 * energy level, and cycle phase.
 */

import { EnergyLevel } from './scheduler.js';
import { CyclePhase } from './menstrual.js';

/**
 * Hobby catalog grouped by intensity.
 */
const HOBBIES = {
  restorative: [
    'journaling', 'reading', 'gentle stretching', 'meditation',
    'listening to music', 'light drawing or doodling', 'bath ritual',
    'gentle cooking or baking', 'watching a comforting show',
    'indoor plants care', 'puzzles',
  ],
  moderate: [
    'yoga flow', 'walking in nature', 'light cycling', 'photography',
    'crafting (knitting, crocheting)', 'cooking a new recipe',
    'casual swimming', 'painting or watercolors', 'gardening',
    'learning an instrument (casual practice)', 'board games',
  ],
  active: [
    'hiking', 'running', 'strength training', 'dancing',
    'rock climbing', 'team sports', 'cycling (intense)', 'swimming laps',
    'martial arts', 'high-intensity workout class', 'kayaking',
  ],
  creative: [
    'writing (stories, poetry)', 'digital art', 'music production',
    'learning a new skill (online course)', 'coding side project',
    'collage making', 'film photography development', 'sewing/embroidery',
  ],
  social: [
    'coffee with a friend', 'group fitness class', 'game night',
    'community volunteering', 'attend a local event', 'book club',
    'cooking for friends',
  ],
};

/**
 * Determine which hobby categories to suggest based on energy + phase.
 *
 * @param {string} energyLevel   - EnergyLevel constant
 * @param {string} [cyclePhase]  - CyclePhase constant (optional)
 * @returns {string[]} List of hobby categories to draw from
 */
function getRecommendedCategories(energyLevel, cyclePhase) {
  const categories = [];

  switch (energyLevel) {
    case EnergyLevel.HIGH:
      categories.push('active', 'social', 'creative');
      break;
    case EnergyLevel.MEDIUM:
      categories.push('moderate', 'creative', 'social');
      break;
    case EnergyLevel.LOW:
      categories.push('restorative', 'creative');
      break;
  }

  // Cycle phase overrides / additions
  if (cyclePhase === CyclePhase.MENSTRUAL) {
    // Override to restorative regardless of Oura score
    return ['restorative'];
  }
  if (cyclePhase === CyclePhase.FOLLICULAR) {
    // Add creative to encourage new ventures
    if (!categories.includes('creative')) categories.push('creative');
  }
  if (cyclePhase === CyclePhase.OVULATION) {
    // Peak social time
    if (!categories.includes('social')) categories.push('social');
  }

  return categories;
}

/**
 * Pick N random items from an array.
 */
function pickRandom(arr, n) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

/**
 * Get hobby suggestions for today.
 *
 * @param {object} options
 * @param {string} options.energyLevel   - From deriveEnergyLevel()
 * @param {string} [options.cyclePhase]  - From getCycleContext()
 * @param {number} [options.count]       - How many suggestions (default 5)
 * @returns {string[]} Suggested hobbies
 */
export function getSuggestedHobbies({ energyLevel, cyclePhase, count = 5 }) {
  const categories = getRecommendedCategories(energyLevel, cyclePhase);

  // Pool all hobbies from recommended categories
  const pool = categories.flatMap((cat) => HOBBIES[cat] ?? []);

  // Deduplicate
  const unique = [...new Set(pool)];

  return pickRandom(unique, Math.min(count, unique.length));
}
