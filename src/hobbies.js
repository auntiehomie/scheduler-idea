/**
 * hobbies.js - Hobby suggestion engine
 *
 * Recommends activities and hobbies based on current health state,
 * energy level, cycle phase, and season.
 */

import { EnergyLevel } from './scheduler.js';
import { CyclePhase } from './menstrual.js';

// ── Seasonal helpers ───────────────────────────────────────────────────────────

const SEASONS = {
  SPRING: 'spring',
  SUMMER: 'summer',
  AUTUMN: 'autumn',
  WINTER: 'winter',
};

/**
 * Determine the current season based on the month.
 */
function getCurrentSeason() {
  const month = new Date().getMonth(); // 0 = January
  if (month >= 2 && month <= 4) return SEASONS.SPRING;
  if (month >= 5 && month <= 7) return SEASONS.SUMMER;
  if (month >= 8 && month <= 10) return SEASONS.AUTUMN;
  return SEASONS.WINTER;
}

/**
 * Activities that are especially nice during specific seasons.
 */
const SEASONAL_ACTIVITIES = {
  spring: [
    'planting spring flowers', 'birdwatching', 'spring cleaning refresh',
    'outdoor sketching', 'nature photography (blooming season)',
    'starting a vegetable garden', 'park picnics',
    'early morning walks (cherry blossoms)', 'kite flying',
  ],
  summer: [
    'beach day / lake swimming', 'sunset hiking', 'fruit picking',
    'outdoor yoga in the park', 'ice cream making at home',
    'stargazing / night photography', 'paddleboarding',
    'outdoor concert / music festival', 'camping trip',
    'BBQ with friends', 'cycling along a waterfront',
  ],
  autumn: [
    'leaf-peeping hike', 'pumpkin carving', 'apple picking',
    'cozy indoor reading nook', 'baking seasonal treats (pie, cider)',
    'knitting a scarf or sweater', 'photography (fall colors)',
    'board game marathons', 'writing by a fireplace',
    'fermented foods making (kimchi, sauerkraut)',
  ],
  winter: [
    'building a snowman (if snow)', 'ice skating', 'snowshoeing',
    'hot chocolate by the window', 'candle-making',
    'indoor rock climbing', 'winter photography',
    'learning a new board game', 'baking holiday treats',
    'planning next year\'s goals', 'watching a movie marathon',
  ],
};

/**
 * Hobby catalog grouped by intensity.
 * Each entry is now tagged as indoor/outdoor.
 *
 * @typedef {{ name: string, environment: 'indoor'|'outdoor'|'either' }} HobbyEntry
 */

/** @type {Record<string, Array<{name: string, environment: string}>>} */
const HOBBIES = {
  restorative: [
    { name: 'journaling', environment: 'indoor' },
    { name: 'reading', environment: 'indoor' },
    { name: 'gentle stretching', environment: 'indoor' },
    { name: 'meditation', environment: 'indoor' },
    { name: 'listening to music', environment: 'indoor' },
    { name: 'light drawing or doodling', environment: 'indoor' },
    { name: 'bath ritual', environment: 'indoor' },
    { name: 'gentle cooking or baking', environment: 'indoor' },
    { name: 'watching a comforting show', environment: 'indoor' },
    { name: 'indoor plants care', environment: 'indoor' },
    { name: 'puzzles (jigsaw, crossword, sudoku)', environment: 'indoor' },
    { name: 'coloring books for adults', environment: 'indoor' },
    { name: 'calm breathing exercises', environment: 'indoor' },
    { name: 'sitting on a park bench', environment: 'outdoor' },
    { name: 'gentle foam rolling', environment: 'indoor' },
    { name: 'lying in a hammock', environment: 'outdoor' },
    { name: 'listening to a podcast', environment: 'either' },
    { name: 'tea tasting ritual', environment: 'indoor' },
    { name: 'watching clouds', environment: 'outdoor' },
    { name: 'simple origami', environment: 'indoor' },
  ],
  moderate: [
    { name: 'yoga flow', environment: 'indoor' },
    { name: 'walking in nature', environment: 'outdoor' },
    { name: 'light cycling', environment: 'outdoor' },
    { name: 'photography', environment: 'either' },
    { name: 'crafting (knitting, crocheting, embroidery)', environment: 'indoor' },
    { name: 'cooking a new recipe', environment: 'indoor' },
    { name: 'casual swimming', environment: 'indoor' },
    { name: 'painting or watercolors', environment: 'indoor' },
    { name: 'gardening', environment: 'outdoor' },
    { name: 'learning an instrument (casual practice)', environment: 'indoor' },
    { name: 'board games', environment: 'indoor' },
    { name: 'nature journaling / botany sketching', environment: 'outdoor' },
    { name: 'bouldering (indoor gym)', environment: 'indoor' },
    { name: 'bowling', environment: 'indoor' },
    { name: 'visiting a museum or gallery', environment: 'indoor' },
    { name: 'foraging for mushrooms or berries', environment: 'outdoor' },
    { name: 'volunteering at an animal shelter', environment: 'indoor' },
    { name: 'kayaking on calm water', environment: 'outdoor' },
    { name: 'taking a dance class (salsa, swing)', environment: 'indoor' },
    { name: 'geocaching', environment: 'outdoor' },
  ],
  active: [
    { name: 'hiking', environment: 'outdoor' },
    { name: 'running', environment: 'either' },
    { name: 'strength training', environment: 'indoor' },
    { name: 'dancing', environment: 'indoor' },
    { name: 'rock climbing', environment: 'indoor' },
    { name: 'team sports (basketball, soccer, volleyball)', environment: 'outdoor' },
    { name: 'cycling (intense)', environment: 'outdoor' },
    { name: 'swimming laps', environment: 'indoor' },
    { name: 'martial arts', environment: 'indoor' },
    { name: 'high-intensity interval training (HIIT)', environment: 'indoor' },
    { name: 'trail running', environment: 'outdoor' },
    { name: 'cross-country skiing', environment: 'outdoor' },
    { name: 'surfing or paddleboarding', environment: 'outdoor' },
    { name: 'kickboxing', environment: 'indoor' },
    { name: 'tennis or pickleball', environment: 'outdoor' },
    { name: 'jump rope training', environment: 'either' },
    { name: 'obstacle course racing', environment: 'outdoor' },
    { name: 'bouldering (outdoor)', environment: 'outdoor' },
  ],
  creative: [
    { name: 'writing (stories, poetry)', environment: 'indoor' },
    { name: 'digital art', environment: 'indoor' },
    { name: 'music production', environment: 'indoor' },
    { name: 'learning a new skill (online course)', environment: 'indoor' },
    { name: 'coding side project', environment: 'indoor' },
    { name: 'collage making', environment: 'indoor' },
    { name: 'film photography development', environment: 'indoor' },
    { name: 'sewing / embroidery / quilting', environment: 'indoor' },
    { name: 'pottery or ceramics', environment: 'indoor' },
    { name: 'calligraphy', environment: 'indoor' },
    { name: 'songwriting', environment: 'indoor' },
    { name: 'creating a zine', environment: 'indoor' },
    { name: 'photography (street, portrait)', environment: 'outdoor' },
    { name: 'making a vision board', environment: 'indoor' },
    { name: 'learning a new language', environment: 'indoor' },
    { name: 'candle or soap making', environment: 'indoor' },
  ],
  social: [
    { name: 'coffee with a friend', environment: 'outdoor' },
    { name: 'group fitness class', environment: 'indoor' },
    { name: 'game night', environment: 'indoor' },
    { name: 'community volunteering', environment: 'either' },
    { name: 'attend a local event', environment: 'outdoor' },
    { name: 'book club', environment: 'indoor' },
    { name: 'cooking for friends', environment: 'indoor' },
    { name: 'hiking group meetup', environment: 'outdoor' },
    { name: 'trivia night at a pub', environment: 'indoor' },
    { name: 'host a potluck dinner', environment: 'indoor' },
    { name: 'join a running club', environment: 'outdoor' },
    { name: 'board game cafe', environment: 'indoor' },
    { name: 'karaoke night', environment: 'indoor' },
    { name: 'farmers market visit with a friend', environment: 'outdoor' },
    { name: 'crafting circle / stitch-and-bitch', environment: 'indoor' },
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
 * Get seasonal activities for the current time of year, filtered by categories.
 * Ensures variety by mixing seasonal suggestions with regular favorites.
 */
function getSeasonalSuggestions(categories, season, count) {
  const seasonalPool = SEASONAL_ACTIVITIES[season] || [];
  const shuffled = [...seasonalPool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

/**
 * Get hobby suggestions for today.
 *
 * @param {object} options
 * @param {string} options.energyLevel   - From deriveEnergyLevel()
 * @param {string} [options.cyclePhase]  - From getCycleContext()
 * @param {number} [options.count]       - How many suggestions (default 5)
 * @param {boolean} [options.seasonal]   - Include seasonal activities (default true)
 * @returns {string[]} Suggested hobbies — each entry now includes its environment tag
 */
export function getSuggestedHobbies({ energyLevel, cyclePhase, count = 5, seasonal = true }) {
  const categories = getRecommendedCategories(energyLevel, cyclePhase);

  // Pool all hobby *names* from recommended categories (we still return strings for compat)
  const pool = categories.flatMap((cat) => {
    const entries = HOBBIES[cat] ?? [];
    return entries.map((e) => e.name);
  });

  const unique = [...new Set(pool)];
  let suggestions = pickRandom(unique, Math.min(count, unique.length));

  // Mix in seasonal suggestions (replace ~40% of suggestions with seasonal picks)
  if (seasonal) {
    const season = getCurrentSeason();
    const seasonalCount = Math.max(1, Math.floor(count * 0.4));
    const seasonalPicks = getSeasonalSuggestions(categories, season, seasonalCount);

    // Blend: keep existing, add seasonal, deduplicate, trim to count
    suggestions = [...suggestions, ...seasonalPicks];
    suggestions = [...new Set(suggestions)];
    // If we got extra due to dedup, trim
    if (suggestions.length > count) {
      suggestions = suggestions.slice(0, count);
    }
  }

  return suggestions;
}