/**
 * Cache module for Forex News Bot
 * Handles daily news caching in Cloudflare KV with prefix 'cached_news:'
 */

const CACHE_PREFIX = 'cached_news:';
const CACHE_TTL_DAILY = 48 * 60 * 60; // 48 hours in seconds
const CACHE_TTL_META = 7 * 24 * 60 * 60; // 7 days in seconds
const MAX_INCREMENTAL_UPDATES = 50;

/**
 * Get the daily cache for a specific date
 * @param {Object} env - Cloudflare Workers environment with KV binding
 * @param {string} dateStr - Date in YYYY-MM-DD format (UTC)
 * @returns {Promise<Object|null>} DailyNewsCache object or null if not found
 */
export async function getDailyCache(env, dateStr) {
  try {
    const key = `${CACHE_PREFIX}${dateStr}`;
    const cached = await env.KV.get(key);
    if (!cached) return null;
    return JSON.parse(cached);
  } catch (e) {
    console.log(`[CACHE] Get error for ${dateStr}:`, e?.message);
    return null;
  }
}

/**
 * Set the daily cache for a specific date
 * @param {Object} env - Cloudflare Workers environment with KV binding
 * @param {string} dateStr - Date in YYYY-MM-DD format (UTC)
 * @param {Object} data - DailyNewsCache object
 * @returns {Promise<void>}
 */
export async function setDailyCache(env, dateStr, data) {
  try {
    const key = `${CACHE_PREFIX}${dateStr}`;
    await env.KV.put(key, JSON.stringify(data), { expirationTtl: CACHE_TTL_DAILY });
    console.log(`[CACHE] Stored ${data.events?.length || 0} events for ${dateStr}`);
  } catch (e) {
    console.log(`[CACHE] Set error for ${dateStr}:`, e?.message);
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
 * Merge incremental fetch results into existing cache
 * @param {Object} env - Cloudflare Workers environment with KV binding
 * @param {string} dateStr - Date in YYYY-MM-DD format (UTC)
 * @param {Array} freshItems - Array of raw items from Fair Economy API
 * @returns {Promise<Object>} Result with added/updated/removed counts
 */
export async function mergeIncremental(env, dateStr, freshItems) {
  const existing = await getDailyCache(env, dateStr) || {
    date: dateStr,
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

  await setDailyCache(env, dateStr, existing);

  return { added, updated, removed };
}

/**
 * Delete cache entries older than 2 days
 * @param {Object} env - Cloudflare Workers environment with KV binding
 * @returns {Promise<void>}
 */
export async function deleteOldCache(env) {
  try {
    const cutoff = new Date();
    cutoff.setUTCDate(cutoff.getUTCDate() - 2);
    const cutoffStr = cutoff.toISOString().slice(0, 10);

    const list = await env.KV.list({ prefix: CACHE_PREFIX });
    for (const key of list.keys) {
      // Skip meta key
      if (key.name === `${CACHE_PREFIX}meta`) continue;
      
      const dateStr = key.name.replace(CACHE_PREFIX, '');
      if (dateStr < cutoffStr) {
        await env.KV.delete(key.name);
        console.log(`[CACHE] Deleted old cache: ${key.name}`);
      }
    }
  } catch (e) {
    console.log('[CACHE] Delete old cache error:', e?.message);
  }
}

/**
 * Build DailyNewsCache object from raw Fair Economy data
 * @param {Array} rawItems - Array of raw items from Fair Economy API
 * @param {string} dateStr - Date in YYYY-MM-DD format (UTC)
 * @returns {Object} DailyNewsCache object
 */
export function buildDailyCache(rawItems, dateStr) {
  const now = Date.now();
  // Filter items for the specific date
  const dayItems = rawItems.filter(item => {
    const itemDate = item.date || new Date(item.timestamp || item._utcMs || new Date(item.date).getTime()).toISOString().slice(0, 10);
    return itemDate === dateStr;
  });

  return {
    date: dateStr,
    fetchedAt: now,
    lastIncrementalAt: now,
    events: dayItems.map(toCachedEvent),
    incrementalUpdates: []
  };
}