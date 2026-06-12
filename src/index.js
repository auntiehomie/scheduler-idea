/**
 * index.js - App entry point
 *
 * Fetches today's Oura data, determines cycle phase,
 * generates hobby suggestions, and prints a daily schedule.
 */

import 'dotenv/config';
import { createOuraClient } from './oura.js';
import { getCycleContext } from './menstrual.js';
import { getSuggestedHobbies, } from './hobbies.js';
import { generateSchedule, printSchedule, deriveEnergyLevel } from './scheduler.js';
import { createLLMClient } from './llm.js';

const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

async function main() {
  console.log(`\n🌿 scheduler-idea — ${today}\n`);

  // 1. Fetch Oura data
  const token = process.env.OURA_ACCESS_TOKEN;
  let ouraData = { readiness: null, activity: null, sleep: null };

  if (!token || token === 'your_oura_access_token_here') {
    console.warn('⚠️  No OURA_ACCESS_TOKEN set — using default/demo data.\n');
  } else {
    try {
      const oura = createOuraClient(token);
      ouraData = await oura.getTodayData(today);
      console.log('✅ Oura data loaded.');
    } catch (err) {
      console.error('❌ Failed to load Oura data:', err.message);
    }
  }

  // 2. Get cycle context
  const cycleContext = getCycleContext({
    cycleStartDate: process.env.CYCLE_START_DATE || null,
    today,
    cycleLength: parseInt(process.env.CYCLE_LENGTH ?? '28', 10),
  });

  if (cycleContext) {
    console.log(`🌸 Cycle day ${cycleContext.cycleDay} — ${cycleContext.metadata.label}`);
    console.log(`   ${cycleContext.metadata.schedulingNotes}\n`);
  }

  // 3. Derive energy level
  const energyLevel = deriveEnergyLevel(ouraData);

  // 4. Get hobby suggestions
  const hobbies = getSuggestedHobbies({
    energyLevel,
    cyclePhase: cycleContext?.phase,
    count: 5,
  });

  // 5. Generate schedule — use LLM if available, else static templates
  const llm = createLLMClient();
  let result;

  if (llm.available) {
    try {
      console.log(`🤖 Using ${llm.provider} for AI-powered schedule...`);
      const blockedSlots = (process.env.BLOCKED_SLOTS || '').split(',').map(s => s.trim()).filter(Boolean);
      result = await llm.generateSchedule({
        ouraData,
        cyclePhase: cycleContext?.phase,
        hobbies,
        blockedSlots,
      });
      console.log('✅ LLM schedule generated.');
    } catch (err) {
      console.warn(`⚠️  LLM schedule failed (${err.message}), falling back to static templates.`);
      result = generateSchedule({ ouraData, cyclePhase: cycleContext?.phase, hobbies });
    }
  } else {
    result = generateSchedule({ ouraData, cyclePhase: cycleContext?.phase, hobbies });
  }

  printSchedule(result);

  console.log('🎯 Hobby suggestions for today:');
  hobbies.forEach((h, i) => console.log(`   ${i + 1}. ${h}`));
  console.log('');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
