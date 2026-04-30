/**
 * oura.js - Oura Ring API client
 *
 * Fetches daily readiness, activity, and sleep data from the Oura v2 API.
 * Docs: https://cloud.ouraring.com/v2/docs
 */

import fetch from 'node-fetch';

const OURA_BASE_URL = 'https://api.ouraring.com/v2';

/**
 * Create an Oura API client with the given access token.
 * @param {string} accessToken - Personal access token from Oura cloud
 */
export function createOuraClient(accessToken) {
  if (!accessToken) throw new Error('OURA_ACCESS_TOKEN is required');

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };

  /**
   * Generic GET helper
   * @param {string} endpoint - e.g. '/usercollection/daily_readiness'
   * @param {object} params - query params (start_date, end_date, etc.)
   */
  async function get(endpoint, params = {}) {
    const url = new URL(`${OURA_BASE_URL}${endpoint}`);
    for (const [key, val] of Object.entries(params)) {
      if (val !== undefined && val !== null) url.searchParams.set(key, val);
    }

    const res = await fetch(url.toString(), { headers });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Oura API error ${res.status}: ${body}`);
    }
    return res.json();
  }

  /**
   * Get daily readiness data.
   * Readiness score reflects how recovered and ready you are.
   * @param {string} startDate - YYYY-MM-DD
   * @param {string} [endDate]  - YYYY-MM-DD (defaults to today)
   */
  async function getDailyReadiness(startDate, endDate) {
    return get('/usercollection/daily_readiness', {
      start_date: startDate,
      end_date: endDate,
    });
  }

  /**
   * Get daily activity data.
   * Includes activity score, steps, calories, met levels.
   * @param {string} startDate - YYYY-MM-DD
   * @param {string} [endDate]  - YYYY-MM-DD
   */
  async function getDailyActivity(startDate, endDate) {
    return get('/usercollection/daily_activity', {
      start_date: startDate,
      end_date: endDate,
    });
  }

  /**
   * Get daily sleep data.
   * Includes sleep score, total sleep, efficiency, REM, deep sleep.
   * @param {string} startDate - YYYY-MM-DD
   * @param {string} [endDate]  - YYYY-MM-DD
   */
  async function getDailySleep(startDate, endDate) {
    return get('/usercollection/daily_sleep', {
      start_date: startDate,
      end_date: endDate,
    });
  }

  /**
   * Convenience: fetch all three data types for a single date.
   * @param {string} date - YYYY-MM-DD
   * @returns {{ readiness, activity, sleep }}
   */
  async function getTodayData(date) {
    const [readiness, activity, sleep] = await Promise.all([
      getDailyReadiness(date, date),
      getDailyActivity(date, date),
      getDailySleep(date, date),
    ]);

    // Each returns { data: [...] } — grab the first item
    return {
      readiness: readiness.data?.[0] ?? null,
      activity: activity.data?.[0] ?? null,
      sleep: sleep.data?.[0] ?? null,
    };
  }

  return {
    getDailyReadiness,
    getDailyActivity,
    getDailySleep,
    getTodayData,
  };
}
