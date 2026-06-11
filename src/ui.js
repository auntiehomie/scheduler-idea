/**
 * ui.js - Express server + HTML UI for scheduler-idea
 *
 * Serves a single-page schedule view. Reads Oura data, cycle context,
 * and hobby suggestions, then renders them as a styled HTML page.
 */

import 'dotenv/config';
import http from 'http';
import { createOuraClient } from './oura.js';
import { getCycleContext, PHASE_METADATA } from './menstrual.js';
import { getSuggestedHobbies } from './hobbies.js';
import { generateSchedule, deriveEnergyLevel } from './scheduler.js';
import { about } from './about.js';
import { schedulerPage } from './scheduler-page.js';
import { generateEnergyCurve, autoSchedulePriorities } from './energy-map.js';

const PORT = process.env.PORT || 3000;
const today = new Date().toISOString().split('T')[0];

async function getScheduleData() {
  const token = process.env.OURA_ACCESS_TOKEN;
  let ouraData = { readiness: null, activity: null, sleep: null };
  let ouraStatus = 'demo';

  if (token && token !== 'your_oura_access_token_here') {
    try {
      const oura = createOuraClient(token);
      ouraData = await oura.getTodayData(today);
      ouraStatus = 'live';
    } catch (err) {
      ouraStatus = `error: ${err.message}`;
    }
  }

  const cycleContext = getCycleContext({
    cycleStartDate: process.env.CYCLE_START_DATE || null,
    today,
    cycleLength: parseInt(process.env.CYCLE_LENGTH ?? '28', 10),
  });

  const energyLevel = deriveEnergyLevel(ouraData);
  const hobbies = getSuggestedHobbies({
    energyLevel,
    cyclePhase: cycleContext?.phase,
    count: 5,
  });

  const result = generateSchedule({ ouraData, cyclePhase: cycleContext?.phase, hobbies });

  return { result, ouraData, ouraStatus, cycleContext, hobbies, energyLevel };
}

function energyColor(level) {
  return { high: '#4ade80', medium: '#facc15', low: '#f87171' }[level] || '#94a3b8';
}

function phaseEmoji(phase) {
  return { menstrual: '🔴', follicular: '🌱', ovulation: '✨', luteal: '🍂' }[phase] || '🌸';
}

function renderHTML({ result, ouraData, ouraStatus, cycleContext, hobbies }) {
  const color = energyColor(result.energyLevel);
  const scheduleRows = result.schedule.map(b => `
    <div class="block">
      <span class="time">${b.time}</span>
      <div class="block-content">
        <strong>${b.label}</strong>
        <span class="notes">${b.notes}</span>
      </div>
    </div>`).join('');

  const hobbyList = hobbies.map(h => `<li>${h}</li>`).join('');

  const cycleSection = cycleContext ? `
    <div class="card cycle">
      <h2>${phaseEmoji(cycleContext.phase)} Cycle Phase</h2>
      <p class="phase-label">${cycleContext.metadata.label} &mdash; Day ${cycleContext.cycleDay}</p>
      <p class="phase-notes">${cycleContext.metadata.schedulingNotes}</p>
      <div class="phase-tags">
        <span class="tag energy-tag">Energy: ${cycleContext.metadata.typicalEnergy}</span>
        <span class="tag mood-tag">Mood: ${cycleContext.metadata.mood}</span>
      </div>
    </div>` : '';

  const ouraSection = ouraData.readiness ? `
    <div class="stats-row">
      <div class="stat"><span class="stat-label">Readiness</span><span class="stat-val">${ouraData.readiness.score ?? '—'}</span></div>
      <div class="stat"><span class="stat-label">Sleep</span><span class="stat-val">${ouraData.sleep?.score ?? '—'}</span></div>
      <div class="stat"><span class="stat-label">Activity</span><span class="stat-val">${ouraData.activity?.score ?? '—'}</span></div>
    </div>` : `<p class="demo-note">⚠️ Running in demo mode — add OURA_ACCESS_TOKEN to .env for live data.</p>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🌿 scheduler-idea</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', system-ui, sans-serif;
      background: #0f172a;
      color: #e2e8f0;
      min-height: 100vh;
      padding: 2rem 1rem;
    }
    .container { max-width: 680px; margin: 0 auto; }
    header {
      display: flex; align-items: center; gap: 1rem;
      margin-bottom: 2rem;
    }
    header h1 { font-size: 1.6rem; font-weight: 700; }
    header .date { color: #94a3b8; font-size: 0.9rem; margin-top: 0.2rem; }
    .energy-badge {
      display: inline-block;
      padding: 0.3rem 0.9rem;
      border-radius: 999px;
      font-weight: 700;
      font-size: 0.85rem;
      color: #0f172a;
      background: ${color};
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .card {
      background: #1e293b;
      border-radius: 1rem;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      border: 1px solid #334155;
    }
    .card h2 { font-size: 1.1rem; margin-bottom: 1rem; color: #94a3b8; }
    .stats-row { display: flex; gap: 1rem; flex-wrap: wrap; }
    .stat {
      flex: 1; min-width: 80px;
      background: #0f172a;
      border-radius: 0.75rem;
      padding: 0.75rem 1rem;
      text-align: center;
    }
    .stat-label { display: block; font-size: 0.7rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.3rem; }
    .stat-val { font-size: 1.8rem; font-weight: 700; color: ${color}; }
    .demo-note { color: #f59e0b; font-size: 0.85rem; }
    .block {
      display: flex; gap: 1rem; align-items: flex-start;
      padding: 0.85rem 0;
      border-bottom: 1px solid #1e293b;
    }
    .block:last-child { border-bottom: none; }
    .time { color: ${color}; font-size: 0.85rem; font-weight: 600; white-space: nowrap; min-width: 50px; padding-top: 0.1rem; }
    .block-content { display: flex; flex-direction: column; gap: 0.2rem; }
    .block-content strong { font-size: 0.95rem; }
    .notes { font-size: 0.8rem; color: #94a3b8; }
    .cycle { }
    .phase-label { font-size: 1rem; font-weight: 600; margin-bottom: 0.5rem; }
    .phase-notes { font-size: 0.85rem; color: #94a3b8; margin-bottom: 0.75rem; }
    .phase-tags { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .tag {
      font-size: 0.75rem;
      padding: 0.25rem 0.7rem;
      border-radius: 999px;
      font-weight: 500;
    }
    .energy-tag { background: #1d4ed8; color: #bfdbfe; }
    .mood-tag { background: #6d28d9; color: #ddd6fe; }
    .hobbies-list { list-style: none; display: flex; flex-direction: column; gap: 0.5rem; }
    .hobbies-list li {
      background: #0f172a;
      border-radius: 0.5rem;
      padding: 0.5rem 0.9rem;
      font-size: 0.85rem;
    }
    .hobbies-list li::before { content: '✦ '; color: ${color}; }
    footer { text-align: center; color: #475569; font-size: 0.75rem; margin-top: 2rem; }
    a.refresh {
      display: inline-block; margin-top: 1rem;
      color: #94a3b8; font-size: 0.8rem; text-decoration: none;
    }
    a.refresh:hover { color: #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div>
        <h1>🌿 scheduler-idea</h1>
        <div class="date">${today}</div>
      </div>
      <span class="energy-badge">${result.energyLevel} energy</span>
    </header>

    <div class="card">
      <h2>📊 Oura Data</h2>
      ${ouraSection}
    </div>

    ${cycleSection}

    <div class="card">
      <h2>📅 Today's Schedule</h2>
      ${scheduleRows}
    </div>

    <div class="card">
      <h2>🎯 Hobby Suggestions</h2>
      <ul class="hobbies-list">
        ${hobbyList}
      </ul>
    </div>

    <footer>
      scheduler-idea · health-aware daily scheduling
      <br>
      <a class="refresh" href="/">↺ refresh</a>
      <span style="margin: 0 0.5rem; color: #334155;">·</span>
      <a class="refresh" href="/energy-map">⚡ Energy Map</a>
      <span style="margin: 0 0.5rem; color: #334155;">·</span>
      <a class="refresh" href="/scheduler">📅 Time Slots</a>
    </footer>
  </div>
</body>
</html>`;
}

/**
 * Render the Energy Map visualization page
 */
function renderEnergyMapPage(energyCurve, scheduled, ouraStatus) {
  const energyBar = (block) => {
    const barWidth = block.energyPercent;
    const color = block.level === 'high' ? '#4ade80' :
                  block.level === 'medium' ? '#facc15' : '#f87171';
    return `
    <div class="em-block" data-level="${block.level}">
      <div class="em-block-header">
        <span class="em-icon">${block.icon}</span>
        <span class="em-label">${block.label}</span>
        <span class="em-range">${block.range}</span>
      </div>
      <div class="em-bar-track">
        <div class="em-bar-fill" style="width: ${barWidth}%; background: ${color};"></div>
      </div>
      <div class="em-value">${block.energyPercent}%</div>
    </div>`;
  };

  const scheduledList = scheduled.map((item, i) => `
    <div class="em-priority" data-level="${item.energyLevel}">
      <span class="em-priority-num">${i + 1}</span>
      <div class="em-priority-content">
        <strong>${item.priority}</strong>
        <div class="em-priority-meta">
          <span>${item.icon} ${item.scheduledTime}</span>
          <span>·</span>
          <span>${item.context}</span>
        </div>
      </div>
      <span class="em-priority-energy">${item.energyPercent}%</span>
    </div>`).join('\n');

  const ouraNote = ouraStatus === 'demo'
    ? '<p class="demo-note">⚠️ Running in demo mode — add OURA_ACCESS_TOKEN to .env for live data.</p>'
    : '<p class="demo-note" style="color:#4ade80">✅ Live Oura data</p>';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Energy Map — Howdy Morning</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #0f172a;
      color: #e2e8f0;
      padding: 2rem 1rem;
      min-height: 100vh;
    }
    .em-container { max-width: 680px; margin: 0 auto; }
    .em-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      margin-bottom: 2rem;
    }
    .em-header h1 { font-size: 1.6rem; font-weight: 700; color: #f8fafc; }
    .em-header .subtitle { color: #94a3b8; font-size: 0.9rem; margin-top: 0.25rem; }
    .em-score-badge {
      display: inline-flex; align-items: center; gap: 0.4rem;
      padding: 0.4rem 0.9rem;
      border-radius: 999px;
      font-weight: 700; font-size: 0.9rem;
      background: #1e293b; border: 1px solid #334155;
    }
    .em-section-title {
      font-size: 0.85rem; font-weight: 600; color: #64748b;
      text-transform: uppercase; letter-spacing: 0.05em;
      margin-bottom: 1rem;
    }
    /* Energy blocks */
    .em-blocks { display: flex; flex-direction: column; gap: 0.4rem; margin-bottom: 2rem; }
    .em-block {
      display: grid;
      grid-template-columns: 140px 1fr 50px;
      gap: 0.75rem;
      align-items: center;
      padding: 0.65rem 1rem;
      background: #1e293b;
      border-radius: 0.5rem;
      border: 1px solid #334155;
    }
    .em-block-header { display: flex; align-items: center; gap: 0.4rem; }
    .em-icon { font-size: 1rem; }
    .em-label { font-size: 0.82rem; font-weight: 600; }
    .em-range { font-size: 0.72rem; color: #64748b; display: none; }
    .em-bar-track {
      height: 10px;
      background: #0f172a;
      border-radius: 999px;
      overflow: hidden;
    }
    .em-bar-fill {
      height: 100%;
      border-radius: 999px;
      transition: width 0.3s ease;
    }
    .em-value {
      font-size: 0.85rem;
      font-weight: 700;
      text-align: right;
      color: #94a3b8;
    }
    .em-block[data-level="high"] { border-left: 3px solid #4ade80; }
    .em-block[data-level="medium"] { border-left: 3px solid #facc15; }
    .em-block[data-level="low"] { border-left: 3px solid #f87171; }

    /* Scheduled priorities */
    .em-priorities { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 2rem; }
    .em-priority {
      display: grid;
      grid-template-columns: 32px 1fr 50px;
      gap: 0.75rem;
      align-items: center;
      padding: 0.75rem 1rem;
      background: #1e293b;
      border-radius: 0.5rem;
      border: 1px solid #334155;
    }
    .em-priority[data-level="high"] { border-left: 3px solid #4ade80; }
    .em-priority[data-level="medium"] { border-left: 3px solid #facc15; }
    .em-priority[data-level="low"] { border-left: 3px solid #f87171; }
    .em-priority-num {
      display: inline-flex; align-items: center; justify-content: center;
      width: 28px; height: 28px;
      background: #3b82f6; color: white;
      border-radius: 50%; font-size: 0.75rem; font-weight: 700;
    }
    .em-priority-content strong { display: block; font-size: 0.9rem; margin-bottom: 0.15rem; }
    .em-priority-meta {
      display: flex; align-items: center; gap: 0.3rem;
      font-size: 0.75rem; color: #94a3b8;
    }
    .em-priority-energy {
      font-size: 0.85rem; font-weight: 700; color: #94a3b8;
      text-align: right;
    }

    .demo-note { font-size: 0.85rem; color: #f59e0b; margin-bottom: 1rem; }
    .em-footer { text-align: center; color: #475569; font-size: 0.75rem; margin-top: 2rem; }
    .em-nav {
      display: flex; justify-content: center; gap: 1rem;
      margin-top: 1.5rem;
    }
    .em-nav a {
      color: #7dd3fc; text-decoration: none; font-size: 0.9rem;
      border: 1px solid #334155; padding: 0.4rem 1rem;
      border-radius: 0.5rem;
    }
    .em-nav a:hover { background: #334155; }

    @media (max-width: 500px) {
      .em-block { grid-template-columns: 120px 1fr 40px; }
      .em-label { font-size: 0.75rem; }
    }
  </style>
</head>
<body>
  <div class="em-container">
    <div class="em-header">
      <div>
        <h1>⚡ Energy Map</h1>
        <p class="subtitle">${new Date().toISOString().split('T')[0]} · ${energyCurve.cycleInfluence}</p>
      </div>
      <div class="em-score-badge">
        🔋 ${energyCurve.curve}/100
      </div>
    </div>

    ${ouraNote}

    <div class="em-section-title">📈 Energy Throughout the Day</div>
    <div class="em-blocks">
      ${energyCurve.blocks.map(energyBar).join('\n')}
    </div>

    <div class="em-section-title">🎯 Your Top Priorities — Auto-Scheduled</div>
    <div class="em-priorities">
      ${scheduledList}
    </div>
    <p style="font-size: 0.78rem; color: #64748b; margin-top: -1rem; margin-bottom: 2rem;">
      Priorities placed in highest-energy windows. Adjust based on your actual energy throughout the day.
    </p>

    <div class="em-nav">
      <a href="/">← Full Schedule</a>
      <a href="/scheduler">📅 Time Slots</a>
      <a href="/about">ℹ️ About</a>
    </div>

    <div class="em-footer">
      Howdy Morning — schedule with your biology
    </div>
  </div>
</body>
</html>`;
}

const server = http.createServer(async (req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('ok');
    return;
  }

  if (req.url === '/energy-map') {
    try {
      const data = await getScheduleData();
      const energyCurve = generateEnergyCurve(data.ouraData, data.cycleContext);
      // Top 3 priorities (hardcoded for now — will come from user input later)
      const priorities = [
        'Complete project proposal',
        'Review team deliverables',
        'Plan tomorrow\'s tasks',
      ];
      const scheduled = autoSchedulePriorities(priorities, energyCurve.blocks);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(renderEnergyMapPage(energyCurve, scheduled, data.ouraStatus));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end(`Error: ${err.message}`);
    }
    return;
  }

  if (req.url === '/about') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(about());
    return;
  }

  if (req.url === '/scheduler') {
    const blocked = (process.env.BLOCKED_SLOTS || '').split(',').map(s => s.trim()).filter(Boolean);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(schedulerPage({ blockedSlots: blocked }));
    return;
  }

  if (req.url !== '/' && req.url !== '/index.html') {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  try {
    const data = await getScheduleData();
    const html = renderHTML(data);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end(`Error: ${err.message}`);
  }
});

server.listen(PORT, () => {
  console.log(`\n🌿 scheduler-idea UI running at http://localhost:${PORT}\n`);
});
