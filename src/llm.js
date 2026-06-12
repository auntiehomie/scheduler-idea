/**
 * llm.js — Budget LLM client for dynamic schedule generation.
 *
 * Supports Claude Haiku (Anthropic) and DeepSeek V4 Flash (DeepSeek).
 * Uses whichever API key is available.
 *
 * Requirements:
 *   ANTHROPIC_API_KEY (for Claude) or DEEPSEEK_API_KEY (for DeepSeek)
 *
 * Pricing (per million tokens):
 *   Claude Haiku 4.5:  $1  input / $5  output
 *   DeepSeek V4 Flash: $0.14 input / $0.28 output
 */

import fetch from 'node-fetch';

// ─── Providers ────────────────────────────────────────────────────────────────

const PROVIDERS = {
  anthropic: {
    baseUrl: 'https://api.anthropic.com/v1',
    model: 'claude-3-5-haiku-20241022',
    headers: (key) => ({
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    }),
    /** Convert our messages to Anthropic format, parse response */
    async request(messages, opts = {}) {
      const systemMsg = messages.find(m => m.role === 'system');
      const userMsgs = messages.filter(m => m.role !== 'system');
      const body = {
        model: opts.model || this.model,
        max_tokens: opts.maxTokens || 1024,
        system: systemMsg?.content || '',
        messages: userMsgs.map(m => ({ role: m.role, content: m.content })),
      };
      if (opts.temperature !== undefined) body.temperature = opts.temperature;
      const res = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: this.headers(opts.apiKey),
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Anthropic API error ${res.status}: ${text}`);
      }
      const data = await res.json();
      return { content: data.content?.[0]?.text || '', model: data.model };
    },
  },
  deepseek: {
    baseUrl: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
    headers: (key) => ({
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    }),
    /** Convert to OpenAI-compatible format for DeepSeek */
    async request(messages, opts = {}) {
      const body = {
        model: opts.model || this.model,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        max_tokens: opts.maxTokens || 1024,
      };
      if (opts.temperature !== undefined) body.temperature = opts.temperature;
      const res = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: this.headers(opts.apiKey),
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`DeepSeek API error ${res.status}: ${text}`);
      }
      const data = await res.json();
      return { content: data.choices?.[0]?.message?.content || '', model: data.model };
    },
  },
};

// ─── Client ────────────────────────────────────────────────────────────────────

/**
 * Create an LLM client using the best available provider.
 *
 * Precedence:
 *   1. ANTHROPIC_API_KEY → Claude Haiku
 *   2. DEEPSEEK_API_KEY  → DeepSeek V4 Flash
 *
 * @param {{ anthropicKey?: string, deepseekKey?: string }} opts
 * @returns {{ generateSchedule, available: boolean, provider: string }}
 */
export function createLLMClient(opts = {}) {
  const anthropicKey = opts.anthropicKey || process.env.ANTHROPIC_API_KEY || '';
  const deepseekKey = opts.deepseekKey || process.env.DEEPSEEK_API_KEY || '';

  /** Pick the best available provider */
  function pickProvider() {
    if (anthropicKey) return { ...PROVIDERS.anthropic, apiKey: anthropicKey };
    if (deepseekKey) return { ...PROVIDERS.deepseek, apiKey: deepseekKey };
    return null;
  }

  const provider = pickProvider();
  const available = !!provider;
  const providerName = anthropicKey ? 'Claude Haiku' : deepseekKey ? 'DeepSeek V4 Flash' : 'none';

  /**
   * Generate a personalized daily schedule from Oura health data.
   *
   * @param {object} ouraData - { readiness, activity, sleep } from oura.js
   * @param {string} cyclePhase - Cycle phase from menstrual.js
   * @param {string[]} hobbies - Hobby suggestions
   * @param {string[]} blockedSlots - Blocked time slots (e.g. ['09:00', '13:30'])
   * @returns {Promise<object>} LLM-generated schedule
   */
  async function generateSchedule({ ouraData, cyclePhase, hobbies = [], blockedSlots = [] }) {
    if (!provider) {
      throw new Error('No LLM API key configured. Set ANTHROPIC_API_KEY or DEEPSEEK_API_KEY.');
    }

    const readinessScore = ouraData?.readiness?.score ?? 50;
    const sleepScore = ouraData?.sleep?.score ?? 50;
    const activityScore = ouraData?.activity?.score ?? 50;
    const sleepMinutes = ouraData?.sleep?.total_sleep_duration
      ? Math.round(ouraData.sleep.total_sleep_duration / 60)
      : 'unknown';
    const hrv = ouraData?.readiness?.hrv_balance ?? 'unknown';
    const restingHr = ouraData?.readiness?.resting_heart_rate ?? 'unknown';

    const systemPrompt = `You are an intelligent daily scheduler that generates personalized schedules based on health data.

Given health metrics (readiness, sleep, activity, cycle phase), generate a tailored schedule for the day.

Rules:
1. Output ONLY valid JSON — no markdown, no explanation.
2. The JSON must match this exact schema:
{
  "energyLevel": "high" | "medium" | "low",
  "reasoning": "Brief 1-2 sentence explanation of why this schedule fits",
  "schedule": [
    {
      "time": "HH:MM",
      "label": "Activity name",
      "notes": "Why this activity suits the user's current state",
      "category": "work" | "movement" | "rest" | "hobby" | "admin" | "social" | "meals"
    }
  ]
}
3. Include 6-8 schedule entries spanning 07:00–22:00.
4. Blocked slots (if any) should be avoided for scheduling.
5. On high-readiness days (>=85), prioritize deep work and exercise.
6. On medium days (60-84), balance focused work with lighter tasks.
7. On low days (<60), prioritize rest, light movement, and essential tasks only.
8. Incorporate cycle phase adjustments: follicular = higher energy, luteal = more rest.
9. If hobbies are provided, include one in an appropriate slot.`;

    const userPrompt = `Generate a schedule for today based on:
- Readiness score: ${readinessScore}
- Sleep score: ${sleepScore}
- Activity score: ${activityScore}
- Total sleep: ${sleepMinutes} minutes
- HRV: ${hrv}
- Resting HR: ${restingHr}
- Cycle phase: ${cyclePhase || 'unknown'}
- Hobbies available: ${hobbies.length > 0 ? hobbies.join(', ') : 'none'}
- Blocked slots: ${blockedSlots.length > 0 ? blockedSlots.join(', ') : 'none'}`;

    const result = await provider.request([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], {
      maxTokens: 1500,
      temperature: 0.5,
    });

    // Parse the JSON from the response
    try {
      // Strip any markdown code fences
      const cleaned = result.content.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();
      return JSON.parse(cleaned);
    } catch {
      // If parsing fails, return raw content as a fallback schedule
      return {
        energyLevel: 'medium',
        reasoning: 'Generated schedule (raw — parsing failed, showing LLM output instead)',
        schedule: [
          { time: '09:00', label: 'Focused work', notes: result.content.slice(0, 200), category: 'work' },
        ],
      };
    }
  }

  return { generateSchedule, available, provider: providerName };
}