import { CURRENCY_MAP } from "./config.js";
import { TIMEZONES, DEFAULT_TZ, TV_DEFAULT, tvLink, KEY_EVENTS } from "./config.js";
import { nowInTz, todayInTz, tomorrowInTz, weekInTz, formatDayHeader } from "./calendar.js";
import { t } from "./translations.js";
import { 
  getWeeklyCache, 
  setWeeklyCache, 
  getMeta, 
  setMeta, 
  mergeIncrementalWeekly, 
  deleteOldCache, 
  buildWeeklyCache,
  getEventsForDateTz
} from "./cache.js";

export const NEWS_URLS = [
  "https://nfs.faireconomy.media/ff_calendar_thisweek.json",
  "https://cdn-nfs.faireconomy.media/ff_calendar_thisweek.json",
];

export function parseNewsItems(data) {
  if (!data || !data.length) return [];
  return data.map(item => {
    const d = new Date(item.date);
    return {
      _rawDate: item.date,
      _utcMs: d.getTime(),
      c: item.country,
      e: item.title,
      i: (item.impact || "low").toLowerCase(),
      a: item.actual || "",
      f: item.forecast || "",
      p: item.previous || "",
    };
  });
}

export function getEventTimeInTz(item, tzId) {
  const tz = TIMEZONES.find(t => t.id === tzId) || TIMEZONES.find(t => t.id === DEFAULT_TZ);
  let utcMs = item._utcMs;
  if (utcMs === undefined || isNaN(utcMs)) {
    const d = new Date(item._rawDate);
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
 * Fetch from external API (Fair Economy) - internal function
 */
async function fetchFromSource() {
  for (const url of NEWS_URLS) {
    try {
      const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
      if (!r.ok) { console.log(`[NEWS] API ${url} returned ${r.status}`); continue; }
      const data = await r.json();
      const items = parseNewsItems(data);
      console.log(`[NEWS] API ${url} returned ${items.length} items`);
      if (items.length > 0) {
        return items;
      }
    } catch (e) { console.log(`[NEWS] API ${url} error:`, e?.message); }
  }
  console.log("[NEWS] All sources failed, returning empty");
  return [];
}

/**
 * Get Monday of current week (UTC)
 */
function getCurrentWeekMonday() {
  const now = new Date();
  const dow = now.getUTCDay(); // 0 = Sunday
  const offsetToMon = (dow + 6) % 7; // days to subtract to get Monday
  const monday = new Date(now);
  monday.setUTCDate(monday.getUTCDate() - offsetToMon);
  monday.setUTCHours(0, 0, 0, 0);
  return monday.toISOString().slice(0, 10);
}

/**
 * Get Monday of next week (UTC)
 */
function getNextWeekMonday() {
  const monday = getCurrentWeekMonday();
  const d = new Date(monday + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + 7);
  return d.toISOString().slice(0, 10);
}

/**
 * Full weekly fetch - runs at 00:00 UTC
 * Fetches from source and populates cache for current week + next week
 */
export async function fetchFullNews(env) {
  console.log("[NEWS] Starting weekly full fetch");
  const rawItems = await fetchFromSource();
  if (!rawItems.length) {
    throw new Error("Full fetch returned no items");
  }

  const thisWeekMonday = getCurrentWeekMonday();
  const nextWeekMonday = getNextWeekMonday();

  // Build cache for this week
  const thisWeekCache = buildWeeklyCache(rawItems, thisWeekMonday);
  thisWeekCache.events.forEach(e => e.source = 'full');
  await setWeeklyCache(env, thisWeekMonday, thisWeekCache);

  // Build cache for next week
  const nextWeekCache = buildWeeklyCache(rawItems, nextWeekMonday);
  nextWeekCache.events.forEach(e => e.source = 'full');
  await setWeeklyCache(env, nextWeekMonday, nextWeekCache);

  // Update meta
  await setMeta(env, {
    lastFullFetch: Date.now(),
    lastIncrementalFetch: null,
    consecutiveFailures: 0
  });

  // Clean old cache
  await deleteOldCache(env);

  console.log(`[NEWS] Full fetch complete: thisWeek=${thisWeekCache.events.length}, nextWeek=${nextWeekCache.events.length}`);
  return { thisWeek: thisWeekCache.events, nextWeek: nextWeekCache.events };
}

/**
 * Incremental fetch - runs every 15 minutes
 * Fetches from source and merges into current week + next week cache
 */
export async function fetchIncrementalNews(env) {
  console.log("[NEWS] Starting incremental fetch");
  const rawItems = await fetchFromSource();
  if (!rawItems.length) {
    throw new Error("Incremental fetch returned no items");
  }

  const thisWeekMonday = getCurrentWeekMonday();
  const nextWeekMonday = getNextWeekMonday();

  const thisWeekResult = await mergeIncrementalWeekly(env, thisWeekMonday, rawItems);
  const nextWeekResult = await mergeIncrementalWeekly(env, nextWeekMonday, rawItems);

  // Update meta
  const meta = await getMeta(env) || { lastFullFetch: null, lastIncrementalFetch: null, consecutiveFailures: 0 };
  meta.lastIncrementalFetch = Date.now();
  await setMeta(env, meta);

  console.log(`[NEWS] Incremental fetch complete: thisWeek +${thisWeekResult.added}/~${thisWeekResult.updated}/-${thisWeekResult.removed}, nextWeek +${nextWeekResult.added}/~${nextWeekResult.updated}/-${nextWeekResult.removed}`);
  return { thisWeek: thisWeekResult, nextWeek: nextWeekResult };
}

/**
 * Get news from cache - primary function for user-facing operations
 * Falls back to full fetch if cache is empty (first run / after failure)
 */
export async function fetchNews(env) {
  const today = new Date().toISOString().slice(0, 10);
  const monday = getCurrentWeekMonday();
  
  // Try cache first
  const cached = await getWeeklyCache(env, monday);
  if (cached?.events?.length) {
    console.log(`[NEWS] Cache hit: ${cached.events.length} items for week ${monday}`);
    // Return today's events in legacy format
    return getEventsForDateTz(cached, today, "Asia/Tehran");
  }

  console.log(`[NEWS] Cache miss for week ${monday}, attempting full fetch`);
  // Fallback: try full fetch
  try {
    const result = await fetchFullNews(env);
    return getEventsForDateTz({ events: result.thisWeek }, today, "Asia/Tehran");
  } catch (e) {
    console.log("[NEWS] Full fetch fallback failed:", e?.message);
    return [];
  }
}

/**
 * Get cached news for a specific date (used by scheduled jobs)
 * Returns cached events in the new format with all metadata
 */
export async function getCachedNews(env, dateStr, userTz) {
  const monday = getCurrentWeekMonday();
  const cached = await getWeeklyCache(env, monday);
  if (!cached?.events?.length) return [];
  
  // Convert to legacy format for compatibility with existing code
  // Filter by user's timezone date
  const targetTz = userTz || "Asia/Tehran";
  return cached.events
    .filter(e => {
      const evt = getEventTimeInTz(e, targetTz);
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
 * Get cached news for today and tomorrow (for status endpoint)
 */
export async function getCachedNewsTodayTomorrow(env, userTz) {
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const monday = getCurrentWeekMonday();
  const cached = await getWeeklyCache(env, monday);
  if (!cached?.events?.length) return { today: [], tomorrow: [] };
  
  const targetTz = userTz || "Asia/Tehran";
  return {
    today: getEventsForDateTz(cached, today, targetTz),
    tomorrow: getEventsForDateTz(cached, tomorrow, targetTz)
  };
}

/**
 * Get cached news for the whole week (for /news weekly)
 */
export async function getCachedNewsWeek(env, userTz) {
  const monday = getCurrentWeekMonday();
  const cached = await getWeeklyCache(env, monday);
  if (!cached?.events?.length) return [];
  
  const targetTz = userTz || "Asia/Tehran";
  // Return all events in legacy format
  return cached.events
    .filter(e => {
      const evt = getEventTimeInTz(e, targetTz);
      return evt._date >= cached.weekStart && evt._date <= cached.weekEnd;
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
 * Get cached news with all metadata (for scheduled jobs that need sentFlags)
 */
export async function getCachedNewsWithMeta(env, dateStr) {
  const monday = getCurrentWeekMonday();
  const cached = await getWeeklyCache(env, monday);
  if (!cached?.events?.length) return [];
  
  // Return events with full metadata (including sentFlags)
  return cached.events.filter(e => e.date === dateStr);
}

/**
 * Update sentFlags in cache for a specific event
 */
export async function updateSentFlags(env, eventId, flags) {
  const monday = getCurrentWeekMonday();
  const cached = await getWeeklyCache(env, monday);
  if (!cached?.events?.length) return false;
  
  const eventIndex = cached.events.findIndex(e => e.id === eventId);
  if (eventIndex === -1) return false;
  
  cached.events[eventIndex].sentFlags = { ...cached.events[eventIndex].sentFlags, ...flags };
  await setWeeklyCache(env, monday, cached);
  return true;
}

/**
 * Check if cache module is ready (has data for current week)
 */
export async function cacheModuleReady(env) {
  const monday = getCurrentWeekMonday();
  const cached = await getWeeklyCache(env, monday);
  return !!(cached?.events?.length);
}

export async function refreshNews(env) {
  // For backward compatibility: force refresh from source
  console.log("[NEWS] Manual refresh triggered");
  try {
    const result = await fetchFullNews(env);
    const today = new Date().toISOString().slice(0, 10);
    return getEventsForDateTz({ events: result.thisWeek }, today, "Asia/Tehran");
  } catch (e) {
    console.log("[NEWS] Refresh failed:", e?.message);
    return fetchNews(env); // Return cached as fallback
  }
}

export function filterNews(items, currencies, impacts, currencyCodes) {
  const codes = new Set();
  if (currencyCodes && currencyCodes.length > 0) {
    for (const cc of currencyCodes) codes.add(cc.toUpperCase());
  } else if (currencyCodes && currencyCodes.length === 0) {
    // Empty array explicitly means no currencies selected
  } else {
    for (const p of currencies) {
      const pu = p.toUpperCase();
      if (CURRENCY_MAP[pu]) codes.add(CURRENCY_MAP[pu]);
      else if (pu.length >= 6) { codes.add(pu.slice(0, 3)); codes.add(pu.slice(3, 6)); }
    }
  }
  const imps = impacts.map(x => x.toLowerCase());
  return items.filter(i => (codes.size === 0 || codes.has(i.c.toUpperCase())) && imps.includes(i.i));
}

export function fmtNews(items, nt, cfg) {
  const lang = cfg.lang || "en";
  const tz = (TIMEZONES.find(t => t.id === cfg.tz) || { label: "IRST" }).label;
  const userTz = cfg.tz || DEFAULT_TZ;
  const tzNow = nowInTz(userTz);
  const currentMin = tzNow.h * 60 + tzNow.m;
  const todayDate = todayInTz(userTz);
  const tomorrowDate = tomorrowInTz(userTz);
  const displayDate = nt === "tomorrow" ? tomorrowDate : todayDate;
  const isCompact = cfg.compact === true;

  if (!items.length) return `\u{1F4E2} *${nt === "today" ? t(lang, "news_today") : t(lang, "news_tomorrow")}*\n\`\`\`\n${displayDate}\n\`\`\`\n${t(lang, "no_news")}`;

  const hi = items.filter(i => i.i === "high");
  const md = items.filter(i => i.i === "medium");
  const lo = items.filter(i => i.i === "low");

  let msg = `\u{1F4E2} <b>${nt === "today" ? t(lang, "news_today") : t(lang, "news_tomorrow")}</b>\n`;
  msg += `\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\n`;
  msg += `\u{1F4C5} ${displayDate}  |  \u{1F552} ${tz}\n\n`;

  const sections = [
    { label: "\u{1F534} High Impact", items: hi },
    { label: "\u{1F7E1} Medium Impact", items: md },
    { label: "\u{1F7E2} Low Impact", items: lo },
  ];

  for (const sec of sections) {
    if (!sec.items.length) continue;
    msg += `<b>${sec.label}</b>\n`;
    for (const item of sec.items) {
      const evt = getEventTimeInTz(item, userTz);
      const itemMin = parseInt(evt.t.split(":")[0]) * 60 + parseInt(evt.t.split(":")[1]);
      const released = nt === "today" && itemMin <= currentMin;
      const timeStr = released ? `${evt.t}   \u{1F534}` : evt.t;

      let highlight = "";
      const titleUpper = item.e.toUpperCase();
      for (const [keyword, info] of Object.entries(KEY_EVENTS)) {
        if (titleUpper.includes(keyword.toUpperCase())) {
          highlight = ` \u{26A1}\u{26A1} <i>${t(lang, info.reason)}</i>`;
          break;
        }
      }

      msg += `\n\u{25B6} ${timeStr}  <b>${item.c}</b> | ${item.e}${highlight}\n`;
      if (!isCompact) {
        if (item.a && released) {
          msg += `    \u{2705} <b>A: ${item.a}</b>  |  F: ${item.f || "\u{2013}"}  |  P: ${item.p || "\u{2013}"}\n`;
        } else if (item.f || item.p) {
          msg += `    \u{1F4CA} F: ${item.f || "\u{2013}"}  |  P: ${item.p || "\u{2013}"}\n`;
        }
        const tvPair = TV_DEFAULT[item.c.toUpperCase()];
        if (tvPair) msg += `    \u{1F310} <a href="${tvLink(tvPair)}">${t(lang, "trading_view")}</a>\n`;
      }
    }
    msg += "\n";
  }

  msg += `\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\n`;
  msg += `\u{2139}\u{FE0F} ${t(lang, "source")}  |  ${tz}`;
  return msg;
}

export function fmtWeeklyCalendar(news, cfg) {
  const lang = cfg.lang || "en";
  const tz = (TIMEZONES.find(z => z.id === cfg.tz) || { label: "IRST" }).label;
  const userTz = cfg.tz || DEFAULT_TZ;
  const tzNow = nowInTz(userTz);
  const currentMin = tzNow.h * 60 + tzNow.m;
  const todayDate = todayInTz(userTz);
  const { monday, sunday } = weekInTz(userTz);
  const filtered = filterNews(news, cfg.c, cfg.i, cfg.cc);
  const weekItems = filtered.filter(item => {
    const evt = getEventTimeInTz(item, userTz);
    return evt._date >= monday && evt._date <= sunday;
  });

  let msg = `\u{1F4C5} *${t(lang, "weekly_calendar")}*\n`;
  msg += `\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\n`;
  msg += `${monday} \u{2014} ${sunday}  |  \u{1F552} ${tz}\n`;

  if (!weekItems.length) {
    msg += `\n${t(lang, "no_news")}`;
    return msg;
  }

  const byDay = {};
  for (const item of weekItems) {
    const evt = getEventTimeInTz(item, userTz);
    if (!byDay[evt._date]) byDay[evt._date] = [];
    byDay[evt._date].push({ ...item, _evtTime: evt.t });
  }

  const sortedDays = Object.keys(byDay).sort();
  for (const day of sortedDays) {
    const dayItems = byDay[day].sort((a, b) => a._evtTime.localeCompare(b._evtTime));
    msg += `\n*${formatDayHeader(day)}*\n`;
    for (const item of dayItems) {
      const impactIcon = item.i === "high" ? "\u{1F534}" : item.i === "medium" ? "\u{1F7E1}" : "\u{1F7E2}";
      const isReleased = day <= todayDate;
      const hasActual = item.a && item.a !== "";
      let line = `${impactIcon} ${item._evtTime} \u{25AA} ${item.c} ${item.e}`;
      if (hasActual) {
        line += ` \u{2714} ${item.a}`;
      }
      // Strikethrough for released events
      if (isReleased) {
        line = `<s>${line}</s>`;
      }
      msg += `${line}\n`;
    }
  }

  return msg;
}