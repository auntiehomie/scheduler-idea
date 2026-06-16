/**
 * scheduler-page.js - Time slot grid UI page
 *
 * Renders a 6am–10pm scheduler in 30-minute slots.
 * Slots can be marked available (default) or blocked via the BLOCKED_SLOTS env var
 * (comma-separated "HH:MM" strings, e.g. "09:00,13:30,17:00").
 *
 * Also surfaces seasonal hobby suggestions alongside the time grid.
 * Exports a `schedulerPage` function that returns an HTML string.
 */

/** @typedef {{ hour: number; minute: number; label: string; blocked: boolean }} Slot */

// ── Season helpers ───────────────────────────────────────────────────────────

const SEASONS = {
  SPRING: 'spring',
  SUMMER: 'summer',
  AUTUMN: 'autumn',
  WINTER: 'winter',
};

/**
 * Determine the current season based on the month.
 * @returns {string}
 */
function getCurrentSeason() {
  const month = new Date().getMonth(); // 0 = January
  if (month >= 2 && month <= 4) return SEASONS.SPRING;
  if (month >= 5 && month <= 7) return SEASONS.SUMMER;
  if (month >= 8 && month <= 10) return SEASONS.AUTUMN;
  return SEASONS.WINTER;
}

const SEASON_EMOJIS = {
  spring: '🌸',
  summer: '☀️',
  autumn: '🍂',
  winter: '❄️',
};

const SEASON_LABELS = {
  spring: 'Spring — fresh starts & blooming energy',
  summer: 'Summer — long days & outdoor adventures',
  autumn: 'Autumn — cozy reflection & golden hues',
  winter: 'Winter — rest, warmth & indoor creativity',
};

const SEASONAL_EXAMPLES = {
  spring: ['planting spring flowers', 'birdwatching', 'outdoor sketching', 'park picnics'],
  summer: ['beach day / lake swimming', 'fruit picking', 'stargazing', 'camping trip'],
  autumn: ['leaf-peeping hike', 'apple picking', 'cozy reading nook', 'baking treats'],
  winter: ['ice skating', 'hot chocolate by the window', 'candle-making', 'winter photography'],
};

// ── Slot grid ────────────────────────────────────────────────────────────────

/**
 * Generate a list of 30-min slots from 6:00 to 22:00 (10pm inclusive).
 * @param {Set<string>} blocked - Set of "HH:MM" strings to mark as blocked
 * @returns {Slot[]}
 */
function buildSlots(blocked) {
  const slots = [];
  for (let h = 6; h <= 22; h++) {
    for (const m of [0, 30]) {
      if (h === 22 && m === 30) break; // stop at 22:30
      const label = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      slots.push({ hour: h, minute: m, label, blocked: blocked.has(label) });
    }
  }
  return slots;
}

/**
 * Render the Scheduler page as an HTML string, with seasonal hobby awareness.
 * @param {{ blockedSlots?: string[], hobbies?: string[], energyLevel?: string }} [options]
 * @returns {string}
 */
export function schedulerPage({ blockedSlots = [], hobbies = [], energyLevel = '' } = {}) {
  const blockedSet = new Set(blockedSlots);
  const slots = buildSlots(blockedSet);
  const season = getCurrentSeason();
  const seasonEmoji = SEASON_EMOJIS[season];
  const seasonLabel = SEASON_LABELS[season];
  const seasonExamples = SEASONAL_EXAMPLES[season] || [];

  const slotRows = slots
    .map(s => {
      const cls = s.blocked ? 'slot blocked' : 'slot available';
      const label = s.blocked ? '🚫 Blocked' : '✅ Available';
      return `<div class="${cls}" data-time="${s.label}">
        <span class="time">${s.label}</span>
        <span class="status">${label}</span>
      </div>`;
    })
    .join('\n');

  // Hobby suggestions section
  const hobbyList =
    hobbies.length > 0
      ? `<li>${hobbies.map(h => `<span class="hobby-item">${h}</span>`).join('</li><li>')}</li>`
      : '<li class="hobby-empty">No suggestions yet — sync Oura data for personalised picks.</li>';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Scheduler — Howdy Morning</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #0f172a;
      color: #e2e8f0;
      padding: 2rem;
    }
    h1 { font-size: 1.75rem; font-weight: 700; margin-bottom: 0.25rem; color: #f8fafc; }
    .subtitle { color: #94a3b8; margin-bottom: 1.5rem; font-size: 0.95rem; }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 0.5rem;
      max-width: 900px;
    }
    .slot {
      border-radius: 0.5rem;
      padding: 0.65rem 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
      border: 1px solid #334155;
      cursor: default;
    }
    .slot.available { background: #1e293b; }
    .slot.blocked   { background: #1c1c2e; opacity: 0.6; }
    .time  { font-weight: 600; font-size: 1rem; }
    .status { font-size: 0.78rem; color: #94a3b8; }
    .slot.available .status { color: #4ade80; }
    .slot.blocked   .status { color: #f87171; }
    .nav { margin-top: 2rem; display: flex; gap: 1rem; flex-wrap: wrap; }
    .nav a {
      color: #7dd3fc; text-decoration: none; font-size: 0.95rem;
      border: 1px solid #334155; padding: 0.4rem 1rem;
      border-radius: 0.5rem;
    }
    .nav a:hover { background: #334155; }
    .note { margin-top: 1.5rem; color: #64748b; font-size: 0.85rem; }

    /* ── Seasonal banner ── */
    .season-banner {
      display: flex; align-items: center; gap: 0.75rem;
      background: #1e293b; border: 1px solid #334155;
      border-radius: 0.75rem; padding: 0.75rem 1rem;
      margin-bottom: 1.5rem; max-width: 900px;
    }
    .season-emoji { font-size: 1.5rem; }
    .season-text { font-size: 0.9rem; }
    .season-text .label { font-weight: 600; }
    .season-text .desc { color: #94a3b8; font-size: 0.82rem; }
    .season-tags { display: flex; gap: 0.4rem; flex-wrap: wrap; margin-left: auto; }
    .season-tag {
      font-size: 0.72rem; padding: 0.2rem 0.6rem;
      background: #0f172a; border-radius: 999px;
      color: #7dd3fc; white-space: nowrap;
    }

    /* ── Hobbies card ── */
    .hobbies-card {
      background: #1e293b; border: 1px solid #334155;
      border-radius: 0.75rem; padding: 1.25rem;
      margin-bottom: 1.5rem; max-width: 900px;
    }
    .hobbies-card h2 {
      font-size: 1rem; font-weight: 600; margin-bottom: 0.75rem;
      color: #94a3b8;
    }
    .hobbies-list {
      list-style: none; display: flex; flex-direction: column; gap: 0.4rem;
    }
    .hobby-item {
      display: inline-block; font-size: 0.85rem;
      background: #0f172a; border-radius: 0.5rem;
      padding: 0.45rem 0.85rem;
    }
    .hobby-item::before { content: '✦ '; color: #7dd3fc; }
    .hobby-empty { font-size: 0.82rem; color: #64748b; font-style: italic; }
  </style>
</head>
<body>
  <!-- Seasonal awareness banner -->
  <div class="season-banner">
    <span class="season-emoji">${seasonEmoji}</span>
    <div class="season-text">
      <div class="label">${seasonLabel}</div>
      <div class="desc">Seasonal activity suggestions available</div>
    </div>
    <div class="season-tags">
      ${seasonExamples.slice(0, 3).map(a => `<span class="season-tag">${seasonEmoji} ${a}</span>`).join('')}
    </div>
  </div>

  <h1>📅 Daily Scheduler</h1>
  <p class="subtitle">6:00 AM – 10:00 PM · 30-minute slots</p>

  <!-- Hobby suggestions card (appears only when hobbies are available) -->
  ${hobbies.length > 0 ? `
  <div class="hobbies-card">
    <h2>🎯 ${energyLevel ? energyLevel.charAt(0).toUpperCase() + energyLevel.slice(1) : 'Today'}'s Hobby Suggestions ${seasonEmoji}</h2>
    <ul class="hobbies-list">
${hobbyList}
    </ul>
  </div>` : ''}

  <div class="grid">
${slotRows}
  </div>
  <p class="note">Booking logic coming soon. Blocked slots are configured via BLOCKED_SLOTS env var.</p>
  <div class="nav">
    <a href="/">← Schedule</a>
    <a href="/energy-map">⚡ Energy Map</a>
    <a href="/about">ℹ️ About</a>
  </div>
</body>
</html>`;
}
