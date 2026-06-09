/**
 * about.js - About page for scheduler-idea
 *
 * Exports an `about` function that returns static HTML describing the app.
 * Pattern mirrors ui.js renderHTML() approach.
 */

/**
 * Render the About page as an HTML string.
 * @returns {string} Full HTML page
 */
export function about() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>About — Howdy Morning</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #0f172a;
      color: #e2e8f0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }
    .card {
      background: #1e293b;
      border-radius: 1rem;
      padding: 2.5rem;
      max-width: 640px;
      width: 100%;
      border: 1px solid #334155;
    }
    h1 { font-size: 2rem; font-weight: 700; margin-bottom: 0.5rem; color: #f8fafc; }
    .tagline { color: #94a3b8; font-size: 1rem; margin-bottom: 2rem; }
    h2 { font-size: 1.1rem; font-weight: 600; color: #7dd3fc; margin: 1.5rem 0 0.75rem; }
    p { line-height: 1.7; color: #cbd5e1; margin-bottom: 0.75rem; }
    ul { list-style: none; padding: 0; }
    ul li { padding: 0.3rem 0; color: #cbd5e1; }
    ul li::before { content: '🌿 '; }
    .nav { margin-top: 2rem; display: flex; gap: 1rem; }
    .nav a {
      color: #7dd3fc;
      text-decoration: none;
      font-size: 0.95rem;
      border: 1px solid #334155;
      padding: 0.4rem 1rem;
      border-radius: 0.5rem;
      transition: background 0.15s;
    }
    .nav a:hover { background: #334155; }
  </style>
</head>
<body>
  <div class="card">
    <h1>🌿 Howdy Morning</h1>
    <p class="tagline">Your personal daily schedule, tuned to your body and energy.</p>

    <h2>What is this?</h2>
    <p>
      Howdy Morning is a lightweight scheduling app that reads your <strong>Oura Ring</strong>
      health data, considers your <strong>menstrual cycle phase</strong>, and suggests a
      personalised daily schedule — including work blocks, rest, movement, and hobbies that
      match your current energy level.
    </p>

    <h2>Features</h2>
    <ul>
      <li>Reads real-time readiness, sleep, and activity from Oura v2 API</li>
      <li>Adapts schedule to menstrual cycle phase (follicular, ovulation, luteal, menstrual)</li>
      <li>Suggests hobbies matched to your energy level</li>
      <li>Works in demo mode if no Oura token is set</li>
    </ul>

    <h2>Privacy</h2>
    <p>
      All data stays local. Your Oura access token and cycle data are read from environment
      variables only — nothing is stored or transmitted to third-party services.
    </p>

    <div class="nav">
      <a href="/">← Schedule</a>
      <a href="/scheduler">📅 Scheduler</a>
    </div>
  </div>
</body>
</html>`;
}
