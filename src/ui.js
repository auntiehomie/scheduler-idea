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
    </footer>
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
