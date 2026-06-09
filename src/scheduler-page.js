/**
 * scheduler-page.js - Time slot grid UI page
 *
 * Renders a 6am–10pm scheduler in 30-minute slots.
 * Slots can be marked available (default) or blocked via the BLOCKED_SLOTS env var
 * (comma-separated "HH:MM" strings, e.g. "09:00,13:30,17:00").
 *
 * No booking logic — this is the UI shell only.
 * Exports a `schedulerPage` function that returns an HTML string.
 */

/** @typedef {{ hour: number; minute: number; label: string; blocked: boolean }} Slot */

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
 * Render the Scheduler page as an HTML string.
 * @param {{ blockedSlots?: string[] }} [options]
 * @returns {string}
 */
export function schedulerPage({ blockedSlots = [] } = {}) {
  const blockedSet = new Set(blockedSlots);
  const slots = buildSlots(blockedSet);

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
    .subtitle { color: #94a3b8; margin-bottom: 2rem; font-size: 0.95rem; }
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
    .nav { margin-top: 2rem; display: flex; gap: 1rem; }
    .nav a {
      color: #7dd3fc; text-decoration: none; font-size: 0.95rem;
      border: 1px solid #334155; padding: 0.4rem 1rem;
      border-radius: 0.5rem;
    }
    .nav a:hover { background: #334155; }
    .note { margin-top: 1.5rem; color: #64748b; font-size: 0.85rem; }
  </style>
</head>
<body>
  <h1>📅 Daily Scheduler</h1>
  <p class="subtitle">6:00 AM – 10:00 PM · 30-minute slots</p>
  <div class="grid">
${slotRows}
  </div>
  <p class="note">Booking logic coming soon. Blocked slots are configured via BLOCKED_SLOTS env var.</p>
  <div class="nav">
    <a href="/">← Schedule</a>
    <a href="/about">ℹ️ About</a>
  </div>
</body>
</html>`;
}
