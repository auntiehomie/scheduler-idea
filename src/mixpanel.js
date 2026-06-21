/**
 * mixpanel.js — Server-side analytics instrumentation
 *
 * Tracks user engagement events for retention analysis.
 * Mixpanel recommended over Amplitude for early-stage startups
 * (see research/Scheduler-improvements.md for full comparison).
 *
 * Events tracked:
 *   - app_opened         Daily active users
 *   - schedule_viewed    User saw their personalized schedule
 *   - energy_map_viewed  User checked the energy map visualization
 *   - time_slots_viewed  User viewed the scheduler time slots page
 *   - about_viewed       User visited the about page
 *   - oura_status        Whether Oura data is live or demo
 *   - hobby_suggested    Hobby recommendation shown (batch)
 *
 * Usage:
 *   import { initMixpanel, trackEvent } from './mixpanel.js';
 *   initMixpanel();
 *   trackEvent('schedule_viewed', { energyLevel: 'high' });
 */

import Mixpanel from 'mixpanel';

let mixpanel = null;
let enabled = false;

/**
 * Initialize the Mixpanel client.
 * Safe to call even without MIXPANEL_TOKEN — all methods become no-ops.
 */
export function initMixpanel() {
  const token = process.env.MIXPANEL_TOKEN;
  if (!token || token === 'your_mixpanel_token_here') {
    console.warn('⚠️  No MIXPANEL_TOKEN set — analytics tracking disabled.');
    return;
  }
  try {
    mixpanel = Mixpanel.init(token);
    enabled = true;
    console.log('✅ Mixpanel analytics initialized.');
  } catch (err) {
    console.warn('⚠️  Mixpanel init failed:', err.message);
  }
}

/**
 * Track a named event with optional properties.
 * No-ops when Mixpanel is not configured.
 *
 * @param {string} event - Event name (snake_case recommended)
 * @param {object} [properties={}] - Event properties
 */
export function trackEvent(event, properties = {}) {
  if (!enabled || !mixpanel) return;
  mixpanel.track(event, {
    distinct_id: 'scheduler_instance',  // single-user; add real user ID when auth added
    time: new Date().toISOString(),
    ...properties,
  });
}

/**
 * Track a page view event.
 * @param {string} page - Page name/path
 * @param {object} [extra={}] - Extra properties
 */
export function trackPageView(page, extra = {}) {
  trackEvent('page_viewed', { page, ...extra });
}