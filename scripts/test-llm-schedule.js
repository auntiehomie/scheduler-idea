/**
 * Test LLM schedule generation.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-... node scripts/test-llm-schedule.js          # Claude
 *   DEEPSEEK_API_KEY=sk-... node scripts/test-llm-schedule.js           # DeepSeek
 *   node scripts/test-llm-schedule.js --dry                             # No API key — show what would be sent
 */

import { createLLMClient } from '../src/llm.js';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry');

// Sample Oura data for testing
const mockOuraData = {
  readiness: {
    score: 82,
    hrv_balance: 58,
    resting_heart_rate: 54,
  },
  sleep: {
    score: 76,
    total_sleep_duration: 28200000, // ~470 minutes / 7.8 hours
  },
  activity: {
    score: 68,
  },
};

async function main() {
  const llm = createLLMClient({
    anthropicKey: dryRun ? undefined : process.env.ANTHROPIC_API_KEY,
    deepseekKey: dryRun ? undefined : process.env.DEEPSEEK_API_KEY,
  });

  if (dryRun) {
    console.log('🧪 DRY RUN — LLM schedule generation test');
    console.log('────────────────────────────────────────────');
    console.log(`Provider available: ${llm.available}`);
    console.log(`Provider: ${llm.provider}`);
    console.log('\nWould send Oura data:');
    console.log(JSON.stringify(mockOuraData, null, 2));
    console.log('\nSet ANTHROPIC_API_KEY or DEEPSEEK_API_KEY to test live.');
    return;
  }

  if (!llm.available) {
    console.error('❌ No LLM API key found.');
    console.error('   Set ANTHROPIC_API_KEY or DEEPSEEK_API_KEY env var.');
    console.error('   Or run with --dry to see the payload without calling an API.');
    process.exit(1);
  }

  console.log(`🤖 Generating schedule using ${llm.provider}...\n`);

  const result = await llm.generateSchedule({
    ouraData: mockOuraData,
    cyclePhase: 'luteal',
    hobbies: ['yoga', 'reading', 'cooking', 'hiking'],
    blockedSlots: ['09:00'], // blocked at 9am
  });

  console.log('📅 Generated Schedule:');
  console.log('──────────────────────');
  console.log(`Energy Level: ${result.energyLevel?.toUpperCase()}`);
  console.log(`Reasoning:    ${result.reasoning}`);
  console.log('');
  for (const block of result.schedule) {
    console.log(`  ${block.time}  [${block.category}] ${block.label}`);
    console.log(`         ↳ ${block.notes}`);
  }
  console.log('');
  console.log('✅ Done');
}

main().catch(err => {
  console.error('Failed:', err.message);
  process.exit(1);
});