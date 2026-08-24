/**
 * Cache module for Forex News Bot
 * Handles weekly news caching in Cloudflare KV with prefix 'cached_news:'
 */

const CACHE_PREFIX = 'cached_news:';
const CACHE_TTL_WEEKLY = 7 * 24 * 60 * 60; // 7 days in seconds
const CACHE_TTL_META = 7 * 24 * 60 * 60; // 7 days in seconds
const MAX_INCREMENTAL_UPDATES = 50;

// Import timezone conversion from config
import { TIMEZONES, DEFAULT_TZ } from "./config.js";

/**
 * Convert cached event to timezone-specific time
 * @param {Object} item - Cached event
 * @param {string} tzId - Timezone ID
 * @returns {Object} Time in timezone {t, _date}
 */
function getEventTimeInTz(item, tzId) {
  const tz = TIMEZONES.find(t => t.id === tzId) || TIMEZONES.find(t => t.id === DEFAULT_TZ);
  let utcMs = item.timestamp;
  if (utcMs === undefined || isNaN(utcMs)) {
    const d = new Date(item._rawDate || item.date);
    if (isNaN(d.getTime())) return { t: "00:00", _date: "1970-01-01" };
    utcMs = d.getTime();
  }
  const d = new Date(utcMs + Math.round(tz.offset * 60) * 60000);
  return {
    t: `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`,
    _date: d.toISOString().slice(0, 10),
  };
}

/**
 * Get the weekly cache for a specific week (Monday-Sunday)
 * @param {Object} env - Cloudflare Workers environment with KV binding
 * @param {string} mondayStr - Monday date in YYYY-MM-DD format (UTC)
 * @returns {Promise<Object|null>} WeeklyNewsCache object or null if not found
 */
export async function getWeeklyCache(env, mondayStr) {
  try {
    const key = `${CACHE_PREFIX}week:${mondayStr}`;
    const cached = await env.KV.get(key);
    if (!cached) return null;
    return JSON.parse(cached);
  } catch (e) {
    console.log(`[CACHE] Get weekly error for ${mondayStr}:`, e?.message);
    return null;
  }
}

/**
 * Set the weekly cache for a specific week
 * @param {Object} env - Cloudflare Workers environment with KV binding
 * @param {string} mondayStr - Monday date in YYYY-MM-DD format (UTC)
 * @param {Object} data - WeeklyNewsCache object
 * @returns {Promise<void>}
 */
export async function setWeeklyCache(env, mondayStr, data) {
  try {
    const key = `${CACHE_PREFIX}week:${mondayStr}`;
    await env.KV.put(key, JSON.stringify(data), { expirationTtl: CACHE_TTL_WEEKLY });
    console.log(`[CACHE] Stored weekly cache for ${mondayStr}: ${data.events?.length || 0} events`);
  } catch (e) {
    console.log(`[CACHE] Set weekly error for ${mondayStr}:`, e?.message);
    throw e;
  }
}

/**
 * Get the cache metadata
 * @param {Object} env - Cloudflare Workers environment with KV binding
 * @returns {Promise<Object|null>} CacheMeta object or null if not found
 */
export async function getMeta(env) {
  try {
    const key = `${CACHE_PREFIX}meta`;
    const cached = await env.KV.get(key);
    if (!cached) return null;
    return JSON.parse(cached);
  } catch (e) {
    console.log('[CACHE] Get meta error:', e?.message);
    return null;
  }
}

/**
 * Set the cache metadata
 * @param {Object} env - Cloudflare Workers environment with KV binding
 * @param {Object} meta - CacheMeta object
 * @returns {Promise<void>}
 */
export async function setMeta(env, meta) {
  try {
    const key = `${CACHE_PREFIX}meta`;
    await env.KV.put(key, JSON.stringify(meta), { expirationTtl: CACHE_TTL_META });
  } catch (e) {
    console.log('[CACHE] Set meta error:', e?.message);
    throw e;
  }
}

/**
 * Convert raw Fair Economy item to cached event format
 * @param {Object} item - Raw item from Fair Economy API
 * @returns {Object} CachedEvent with computed fields
 */
function toCachedEvent(item) {
  const timestamp = item.timestamp || item._utcMs || new Date(item.date).getTime();
  return {
    id: item.id || `${item.country}-${item.title}-${timestamp}`,
    title: item.title || item.e,
    country: item.country || item.c,
    currency: item.currency || (item.c?.length >= 3 ? item.c.slice(0, 3) : ''),
    impact: (item.impact || item.i || 'low').toLowerCase(),
    forecast: item.forecast || item.f || '',
    previous: item.previous || item.p || '',
    actual: item.actual || item.a || '',
    date: item.date || new Date(timestamp).toISOString().slice(0, 10),
    time: item.time || new Date(timestamp).toISOString().slice(11, 16),
    timestamp,
    preReleaseAt: timestamp - 5 * 60 * 1000, // 5 minutes before
    sentFlags: {
      preRelease: false,
      scheduled: false,
      postReleaseCheck: false
    },
    source: 'incremental'
  };
}

/**
 * Merge incremental fetch results into existing weekly cache
 * @param {Object} env - Cloudflare Workers environment with KV binding
 * @param {string} mondayStr - Monday date in YYYY-MM-DD format (UTC)
 * @param {Array} freshItems - Array of raw items from Fair Economy API
 * @returns {Promise<Object>} Result with added/updated/removed counts
 */
export async function mergeIncrementalWeekly(env, mondayStr, freshItems) {
  const existing = await getWeeklyCache(env, mondayStr) || {
    weekStart: mondayStr,
    fetchedAt: Date.now(),
    lastIncrementalAt: Date.now(),
    events: [],
    incrementalUpdates: []
  };

  const now = Date.now();
  const freshMap = new Map();
  let added = 0;
  let updated = 0;
  let removed = 0;

  // Convert fresh items to cached format and build map
  for (const item of freshItems) {
    const cachedEvent = toCachedEvent(item);
    freshMap.set(cachedEvent.id, cachedEvent);
  }

  // Track existing IDs for removal detection
  const existingIds = new Set(existing.events.map(e => e.id));

  // Merge: update existing or add new
  const mergedEvents = [];
  for (const freshEvent of freshMap.values()) {
    const existingIndex = existing.events.findIndex(e => e.id === freshEvent.id);
    if (existingIndex >= 0) {
      // Update existing event - preserve sentFlags, update data fields
      const existingEvent = existing.events[existingIndex];
      mergedEvents.push({
        ...existingEvent,
        ...freshEvent,
        sentFlags: existingEvent.sentFlags, // Preserve sent flags
        source: 'incremental'
      });
      updated++;
      existingIds.delete(freshEvent.id);
    } else {
      // New event
      mergedEvents.push(freshEvent);
      added++;
    }
  }

  // Remaining existingIds are events that were removed from source
  removed = existingIds.size;

  // Update cache object
  existing.events = mergedEvents;
  existing.lastIncrementalAt = now;
  existing.incrementalUpdates = [
    { fetchedAt: now, added, updated, removed },
    ...existing.incrementalUpdates.slice(0, MAX_INCREMENTAL_UPDATES - 1)
  ];

  await setWeeklyCache(env, mondayStr, existing);

  return { added, updated, removed };
}

/**
 * Delete cache entries older than 2 weeks
 * @param {Object} env - Cloudflare Workers environment with KV binding
 * @returns {Promise<void>}
 */
export async function deleteOldCache(env) {
  try {
    const cutoff = new Date();
    cutoff.setUTCDate(cutoff.getUTCDate() - 14);
    const cutoffStr = cutoff.toISOString().slice(0, 10);

    const list = await env.KV.list({ prefix: CACHE_PREFIX });
    for (const key of list.keys) {
      // Skip meta key
      if (key.name === `${CACHE_PREFIX}meta`) continue;
      
      // Extract date from key (cached_news:week:YYYY-MM-DD)
      const match = key.name.match(/cached_news:week:(\d{4}-\d{2}-\d{2})/);
      if (match) {
        const weekStart = match[1];
        if (weekStart < cutoffStr) {
          await env.KV.delete(key.name);
          console.log(`[CACHE] Deleted old weekly cache: ${key.name}`);
        }
      }
    }
  } catch (e) {
    console.log('[CACHE] Delete old cache error:', e?.message);
  }
}

/**
 * Build WeeklyNewsCache object from raw Fair Economy data
 * @param {Array} rawItems - Array of raw items from Fair Economy API
 * @param {string} mondayStr - Monday date in YYYY-MM-DD format (UTC)
 * @returns {Object} WeeklyNewsCache object
 */
export function buildWeeklyCache(rawItems, mondayStr) {
  const now = Date.now();
  const monday = new Date(mondayStr + 'T00:00:00Z');
  const sunday = new Date(monday);
  sunday.setUTCDate(sunday.getUTCDate() + 6);
  const sundayStr = sunday.toISOString().slice(0, 10);

  // Filter items for the week (Monday to Sunday)
  const weekItems = rawItems.filter(item => {
    const itemDate = new Date(item._rawDate || item._utcMs || new Date(item.date).getTime()).toISOString().slice(0, 10);
    return itemDate >= mondayStr && itemDate <= sundayStr;
  });

  return {
    weekStart: mondayStr,
    weekEnd: sundayStr,
    fetchedAt: now,
    lastIncrementalAt: now,
    events: weekItems.map(toCachedEvent),
    incrementalUpdates: []
  };
}

/**
 * Get events for a specific date from weekly cache with timezone awareness
 * @param {Object} weeklyCache - WeeklyNewsCache object
 * @param {string} dateStr - Date in YYYY-MM-DD format (in user's timezone)
 * @param {string} userTz - User's timezone ID
 * @returns {Array} Events for that date in legacy format
 */
export function getEventsForDateTz(weeklyCache, dateStr, userTz) {
  if (!weeklyCache?.events?.length) return [];
  
  return weeklyCache.events
    .filter(e => {
      const evt = getEventTimeInTz(e, userTz);
      return evt._date === dateStr;
    })
    .map(e => ({
      _rawDate: e.date,
      _utcMs: e.timestamp,
      c: e.country,
      e: e.title,
      i: e.impact,
      a: e.actual,
      f: e.forecast,
      p: e.previous,
    }));
}

/**
 * Get events for a date range from weekly cache
 * @param {Object} weeklyCache - WeeklyNewsCache object
 * @param {string} startStr - Start date in YYYY-MM-DD format
 * @param {string} endStr - End date in YYYY-MM-DD format
 * @returns {Array} Events in that range in legacy format
 */
export function getEventsForRange(weeklyCache, startStr, endStr) {
  if (!weeklyCache?.events?.length) return [];
  
  return weeklyCache.events
    .filter(e => e.date >= startStr && e.date <= endStr)
    .map(e => ({
      _rawDate: e.date,
      _utcMs: e.timestamp,
      c: e.country,
      e: e.title,
      i: e.impact,
      a: e.actual,
      f: e.forecast,
      p: e.previous,
    }));
}