import { getGroups, getCfg } from "./storage.js";
import { fetchNews, refreshNews, filterNews, getEventTimeInTz } from "./news.js";
import { todayInTz, nowInTz } from "./calendar.js";
import { tgSendHTML } from "./telegram.js";
import { TV_DEFAULT, tvLink } from "./config.js";
import { t } from "./translations.js";
import { kvGet, kvPut } from "./kv-utils.js";

function parseNumeric(val) {
  if (!val || val === "-" || val === "") return NaN;
  const cleaned = String(val).replace(/[^0-9.-]/g, "");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? NaN : parsed;
}

export async function sendDailyRecap(env) {
  const gs = await getGroups(env);
  if (!gs.length) return;

  // Always refresh to get updated actual values from API
  const news = await refreshNews(env);
  if (!news.length) return;

  for (const gid of gs) {
    try {
      const cfg = await getCfg(env, gid);
      if (!cfg.dailyRecap) continue;
      const userTz = cfg.tz || "Asia/Tehran";
      const tzNow = nowInTz(userTz);
      const currentMin = tzNow.h * 60 + tzNow.m;
      const todayDate = todayInTz(userTz);
      const filtered = filterNews(news, cfg.c, cfg.i, cfg.cc);
      const todayItems = filtered.filter(item => {
        const evt = getEventTimeInTz(item, userTz);
        return evt._date === todayDate;
      });

      if (!todayItems.length) continue;

      // TIME CHECK: Only send at configured time (default 23:00-23:59)
      const [recapHour, recapMin] = (cfg.dailyRecapTime || "23:00").split(":").map(Number);
      const recapStartMin = recapHour * 60 + recapMin;
      const recapEndMin = recapStartMin + 60; // 1 hour window
      if (currentMin < recapStartMin || currentMin >= recapEndMin) continue;

      // Deduplication
      const dedupKey = `recap:${gid}:${todayDate}`;
      const alreadySent = await kvGet(env, dedupKey);
      if (alreadySent) continue;

      const lang = cfg.lang || "en";
      
      let msg = `🌙 <b>${t(lang, "daily_recap")}</b>\n`;
      msg += `═════════════════════════\n`;
      msg += `📅 ${todayDate}  |  🕒 ${cfg.tz}\n\n`;

      // Count by impact
      const high = todayItems.filter(i => i.i === "high");
      const med = todayItems.filter(i => i.i === "medium");
      const low = todayItems.filter(i => i.i === "low");
      
      msg += `<b>${t(lang, "summary")}</b>\n`;
      msg += `🔴 ${t(lang, "high")}: ${high.length}  |  🟠 ${t(lang, "medium")}: ${med.length}  |  🟢 ${t(lang, "low")}: ${low.length}\n\n`;

      // Beat/Miss/In-line stats
      let beat = 0, miss = 0, inline = 0;
      for (const item of todayItems) {
        if (item.a && item.a !== "-" && item.f && item.f !== "-") {
          const f = parseNumeric(item.f);
          const a = parseNumeric(item.a);
          if (!isNaN(f) && !isNaN(a)) {
            if (a > f) beat++;
            else if (a < f) miss++;
            else inline++;
          }
        }
      }
      
      if (beat > 0 || miss > 0 || inline > 0) {
        msg += `<b>${t(lang, "beat_miss_stats")}</b>\n`;
        msg += `✅ ${t(lang, "beat")}: ${beat}  |  ❌ ${t(lang, "miss")}: ${miss}  |  ➖ ${t(lang, "inline")}: ${inline}\n\n`;
      }

      // Top movers - items with biggest deviation from forecast
      const withDeviation = todayItems
        .filter(i => i.a && i.a !== "-" && i.f && i.f !== "-")
        .map(i => {
          const f = parseNumeric(i.f);
          const a = parseNumeric(i.a);
          if (!isNaN(f) && !isNaN(a) && f !== 0) {
            const pct = ((a - f) / Math.abs(f)) * 100;
            return { ...i, deviation: pct };
          }
          return null;
        })
        .filter(x => x !== null)
        .sort((a, b) => Math.abs(b.deviation) - Math.abs(a.deviation))
        .slice(0, 5);

      if (withDeviation.length > 0) {
        msg += `<b>${t(lang, "top_movers")}</b>\n`;
        for (const item of withDeviation) {
          const dir = item.deviation > 0 ? "📈" : "📉";
          msg += `${dir} ${item.c} ${item.e}: ${item.deviation > 0 ? "+" : ""}${item.deviation.toFixed(1)}% (F: ${item.f} → A: ${item.a})\n`;
        }
        msg += "\n";
      }

      // Completed events today
      const completed = todayItems.filter(i => i.a && i.a !== "-");
      if (completed.length > 0) {
        msg += `<b>${t(lang, "completed_today")}</b>\n`;
        for (const item of completed) {
          const evt = getEventTimeInTz(item, cfg.tz || "Asia/Tehran");
          msg += `🕐 ${evt.t}  ${item.c}  ${item.e}\n`;
          msg += `   ✅ A: ${item.a}  |  F: ${item.f || "-"}  |  P: ${item.p || "-"}\n`;
        }
        msg += "\n";
      }

      msg += `═════════════════════════\n`;
      msg += `ℹ️ ${t(lang, "source")}  |  ${cfg.tz}`;

      await tgSendHTML(env, gid, msg);
      // Keep deduplication for 24 hours
      await kvPut(env, dedupKey, "1", { expirationTtl: 86400 });
    } catch (e) { console.log(`Daily recap err ${gid}:`, e); }
  }
}

/**
 * Morning Preview - sends at configured time (default 6:00-7:00 AM) with upcoming events for the day
 */
export async function sendMorningPreview(env) {
  const gs = await getGroups(env);
  if (!gs.length) return;

  // Always refresh to get fresh data for morning preview
  const news = await refreshNews(env);
  if (!news.length) return;

  for (const gid of gs) {
    try {
      const cfg = await getCfg(env, gid);
      if (!cfg.morningPreview) continue; // New setting
      const userTz = cfg.tz || "Asia/Tehran";
      const tzNow = nowInTz(userTz);
      const currentMin = tzNow.h * 60 + tzNow.m;
      const todayDate = todayInTz(userTz);
      const filtered = filterNews(news, cfg.c, cfg.i, cfg.cc);
      const todayItems = filtered.filter(item => {
        const evt = getEventTimeInTz(item, userTz);
        return evt._date === todayDate;
      });

      if (!todayItems.length) continue;

      // TIME CHECK: Only send at configured time (default 6:00-7:00)
      const [morningHour, morningMin] = (cfg.morningPreviewTime || "06:00").split(":").map(Number);
      const morningStartMin = morningHour * 60 + morningMin;
      const morningEndMin = morningStartMin + 60; // 1 hour window
      if (currentMin < morningStartMin || currentMin >= morningEndMin) continue;

      // Deduplication
      const dedupKey = `morning:${gid}:${todayDate}`;
      const alreadySent = await kvGet(env, dedupKey);
      if (alreadySent) continue;

      const lang = cfg.lang || "en";
      
      let msg = `🌅 <b>${t(lang, "morning_preview")}</b>\n`;
      msg += `═════════════════════════\n`;
      msg += `📅 ${todayDate}  |  🕒 ${cfg.tz}\n\n`;

      // Count by impact
      const high = todayItems.filter(i => i.i === "high");
      const med = todayItems.filter(i => i.i === "medium");
      const low = todayItems.filter(i => i.i === "low");
      
      msg += `<b>${t(lang, "today_outlook")}</b>\n`;
      msg += `🔴 ${t(lang, "high")}: ${high.length}  |  🟠 ${t(lang, "medium")}: ${med.length}  |  🟢 ${t(lang, "low")}: ${low.length}\n\n`;

      // Upcoming high impact events
      const upcomingHigh = todayItems
        .filter(i => i.i === "high")
        .sort((a, b) => a._utcMs - b._utcMs)
        .slice(0, 5);

      if (upcomingHigh.length > 0) {
        msg += `<b>🔴 ${t(lang, "key_events_today")}</b>\n`;
        for (const item of upcomingHigh) {
          const evt = getEventTimeInTz(item, userTz);
          msg += `🕐 ${evt.t}  🔴 ${item.c} ${item.e}\n`;
          if (item.f || item.p) msg += `   F: ${item.f || "-"} | P: ${item.p || "-"}\n`;
        }
        msg += "\n";
      }

      // All events timeline
      const allToday = todayItems.sort((a, b) => a._utcMs - b._utcMs);
      msg += `<b>${t(lang, "full_schedule")}</b>\n`;
      for (const item of allToday) {
        const evt = getEventTimeInTz(item, userTz);
        const impactEmoji = item.i === "high" ? "🔴" : item.i === "medium" ? "🟠" : "🟢";
        msg += `${impactEmoji} ${evt.t}  ${item.c} ${item.e}\n`;
      }

      msg += `\n═════════════════════════\n`;
      msg += `ℹ️ ${t(lang, "source")}  |  ${cfg.tz}`;

      await tgSendHTML(env, gid, msg);
      await kvPut(env, `morning:${gid}:${todayDate}`, "1", { expirationTtl: 86400 });
    } catch (e) { console.log(`Morning preview err ${gid}:`, e); }
  }
}