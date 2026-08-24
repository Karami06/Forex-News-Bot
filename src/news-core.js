import { CURRENCY_MAP } from "./config.js";
import { TIMEZONES, DEFAULT_TZ, TV_DEFAULT, tvLink } from "./config.js";
import { nowInTz, todayInTz, weekInTz, formatDayHeader } from "./calendar.js";
import { t } from "./translations.js";

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

export async function fetchNews(env) {
  if (env) {
    const cached = await env.KV.get("news:cache");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.items && parsed.items.length > 0 && (Date.now() - parsed.ts) < 86400000) {
          if (parsed.items[0]._utcMs !== undefined) {
            console.log(`[NEWS] Cache hit: ${parsed.items.length} items`);
            return parsed.items;
          }
          console.log("[NEWS] Old cache format, deleting stale cache");
          await env.KV.delete("news:cache");
        }
      } catch (e) { console.log("[NEWS] Cache parse error:", e?.message); }
    } else {
      console.log("[NEWS] No cache, fetching from API");
    }
  }
  for (const url of NEWS_URLS) {
    try {
      const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
      if (!r.ok) { console.log(`[NEWS] API ${url} returned ${r.status}`); continue; }
      const data = await r.json();
      const items = parseNewsItems(data);
      console.log(`[NEWS] API ${url} returned ${items.length} items`);
      if (items.length > 0) {
        if (env) await env.KV.put("news:cache", JSON.stringify({ ts: Date.now(), items }), { expirationTtl: 86400 });
        return items;
      }
    } catch (e) { console.log(`[NEWS] API ${url} error:`, e?.message); }
  }
  console.log("[NEWS] All sources failed, returning empty");
  return [];
}

export async function refreshNews(env) {
  // Fetch fresh data first, only overwrite cache on success
  for (const url of NEWS_URLS) {
    try {
      const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
      if (!r.ok) continue;
      const data = await r.json();
      const items = parseNewsItems(data);
      if (items.length > 0) {
        if (env) await env.KV.put("news:cache", JSON.stringify({ ts: Date.now(), items }), { expirationTtl: 86400 });
        return items;
      }
    } catch (e) { console.log(`[NEWS] Refresh API error:`, e?.message); }
  }
  // If all sources failed, return existing cached data
  return fetchNews(env);
}

export function filterNews(items, currencies, impacts, currencyCodes) {
  const codes = new Set();
  // If user selected specific indexes (currencyCodes), use ONLY those
  if (currencyCodes && currencyCodes.length > 0) {
    for (const cc of currencyCodes) codes.add(cc.toUpperCase());
  } else {
    // Otherwise, derive codes from currency pairs
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

  if (!items.length) return `\u{1F4E2} *${nt === "today" ? t(lang, "news_today") : t(lang, "news_tomorrow")}*\n\`\`\`\n${todayDate}\n\`\`\`\n${t(lang, "no_news")}`;

  const hi = items.filter(i => i.i === "high");
  const md = items.filter(i => i.i === "medium");
  const lo = items.filter(i => i.i === "low");

  let msg = `\u{1F4E2} <b>${nt === "today" ? t(lang, "news_today") : t(lang, "news_tomorrow")}</b>\n`;
  msg += `\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\n`;
  msg += `\u{1F4C5} ${todayDate}  |  \u{1F552} ${tz}\n\n`;

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
        const timeStr = released ? `<s>${evt.t} </s>` : evt.t;
        msg += `\n\u{25B6} ${timeStr}  <b>${item.c}</b> | ${item.e}\n`;
        if (item.a && released) {
          msg += `    \u{2705} <b>A: ${item.a}</b>  |  F: ${item.f || "-" }  |  P: ${item.p || "-"}\n`;
        } else if (item.f || item.p) {
          msg += `    \u{1F4CA} F: ${item.f || "-"}  |  P: ${item.p || "-"}\n`;
        }
        const tvPair = TV_DEFAULT[item.c.toUpperCase()];
        if (tvPair) msg += `    \u{1F310} <a href="${tvLink(tvPair)}">${t(lang, "trading_view")}</a>\n`;
      }
      msg += "\n";
    }

  msg += `\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\n`;
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
  msg += `\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\n`;
  msg += `${monday} \u{2014} ${sunday}  |  \u{1F552} ${tz}\n`;

  if (!weekItems.length) {
    msg += `\n${t(lang, "no_news")}`;
    return msg;
  }

  // Group by day
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