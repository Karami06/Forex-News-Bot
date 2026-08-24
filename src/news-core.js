import { CURRENCY_MAP } from "./config.js";
import { TIMEZONES, DEFAULT_TZ, TV_DEFAULT, tvLink, KEY_EVENTS } from "./config.js";
import { nowInTz, todayInTz, tomorrowInTz, weekInTz, formatDayHeader } from "./calendar.js";
import { t } from "./translations.js";
import { getDailyCache, setDailyCache, getMeta, setMeta, mergeIncremental, deleteOldCache, buildDailyCache } from "./cache.js";

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
 * Full daily fetch - runs at 00:00 UTC
 * Fetches from source and populates cache for today and tomorrow
 */
export async function fetchFullNews(env) {
  console.log("[NEWS] Starting daily full fetch");
  const rawItems = await fetchFromSource();
  if (!rawItems.length) {
    throw new Error("Full fetch returned no items");
  }

  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  // Build cache for today
  const todayCache = buildDailyCache(rawItems, today);
  todayCache.events.forEach(e => e.source = 'full');
  await setDailyCache(env, today, todayCache);

  // Build cache for tomorrow
  const tomorrowCache = buildDailyCache(rawItems, tomorrow);
  tomorrowCache.events.forEach(e => e.source = 'full');
  await setDailyCache(env, tomorrow, tomorrowCache);

  // Update meta
  await setMeta(env, {
    lastFullFetch: Date.now(),
    lastIncrementalFetch: null,
    consecutiveFailures: 0
  });

  // Clean old cache
  await deleteOldCache(env);

  console.log(`[NEWS] Full fetch complete: today=${todayCache.events.length}, tomorrow=${tomorrowCache.events.length}`);
  return { today: todayCache.events, tomorrow: tomorrowCache.events };
}

/**
 * Incremental fetch - runs every 15 minutes
 * Fetches from source and merges into today/tomorrow cache
 */
export async function fetchIncrementalNews(env) {
  console.log("[NEWS] Starting incremental fetch");
  const rawItems = await fetchFromSource();
  if (!rawItems.length) {
    throw new Error("Incremental fetch returned no items");
  }

  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  // Filter raw items for today and tomorrow
  const todayItems = rawItems.filter(item => {
    const itemDate = new Date(item._rawDate || item._utcMs).toISOString().slice(0, 10);
    return itemDate === today;
  });
  const tomorrowItems = rawItems.filter(item => {
    const itemDate = new Date(item._rawDate || item._utcMs).toISOString().slice(0, 10);
    return itemDate === tomorrow;
  });

  const todayResult = await mergeIncremental(env, today, todayItems);
  const tomorrowResult = await mergeIncremental(env, tomorrow, tomorrowItems);

  // Update meta
  const meta = await getMeta(env) || { lastFullFetch: null, lastIncrementalFetch: null, consecutiveFailures: 0 };
  meta.lastIncrementalFetch = Date.now();
  await setMeta(env, meta);

  console.log(`[NEWS] Incremental fetch complete: today +${todayResult.added}/~${todayResult.updated}/-${todayResult.removed}, tomorrow +${tomorrowResult.added}/~${tomorrowResult.updated}/-${tomorrowResult.removed}`);
  return { today: todayResult, tomorrow: tomorrowResult };
}

/**
 * Get news from cache - primary function for user-facing operations
 * Falls back to full fetch if cache is empty (first run / after failure)
 */
export async function fetchNews(env) {
  const today = new Date().toISOString().slice(0, 10);
  
  // Try cache first
  const cached = await getDailyCache(env, today);
  if (cached?.events?.length) {
    console.log(`[NEWS] Cache hit: ${cached.events.length} items for ${today}`);
    // Convert cached format back to legacy format for compatibility
    return cached.events.map(e => ({
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

  console.log(`[NEWS] Cache miss for ${today}, attempting full fetch`);
  // Fallback: try full fetch
  try {
    const result = await fetchFullNews(env);
    return result.today.map(e => ({
      _rawDate: e.date,
      _utcMs: e.timestamp,
      c: e.country,
      e: e.title,
      i: e.impact,
      a: e.actual,
      f: e.forecast,
      p: e.previous,
    }));
  } catch (e) {
    console.log("[NEWS] Full fetch fallback failed:", e?.message);
    return [];
  }
}

/**
 * Get cached news for a specific date (used by scheduled jobs)
 * Returns cached events in the new format with all metadata
 */
export async function getCachedNews(env, dateStr) {
  const cached = await getDailyCache(env, dateStr);
  if (!cached?.events?.length) return [];
  
  // Convert to legacy format for compatibility with existing code
  return cached.events.map(e => ({
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
 * Check if cache module is ready (has data for today)
 */
export async function cacheModuleReady(env) {
  const today = new Date().toISOString().slice(0, 10);
  const cached = await getDailyCache(env, today);
  return !!(cached?.events?.length);
}

export async function refreshNews(env) {
  // For backward compatibility: force refresh from source
  console.log("[NEWS] Manual refresh triggered");
  try {
    const result = await fetchFullNews(env);
    return result.today.map(e => ({
      _rawDate: e.date,
      _utcMs: e.timestamp,
      c: e.country,
      e: e.title,
      i: e.impact,
      a: e.actual,
      f: e.forecast,
      p: e.previous,
    }));
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
      msg += `${line}\n`;
    }
  }

  return msg;
}