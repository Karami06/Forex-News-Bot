import { getGroups, getCfg } from "./storage.js";
import { fetchNews, refreshNews, filterNews, fmtNews, getEventTimeInTz } from "./news.js";
import { todayInTz, tomorrowInTz, nowInTz, timeToMin } from "./calendar.js";
import { tgSendHTML } from "./telegram.js";

export async function sendScheduled(env) {
  const gs = await getGroups(env);
  console.log(`[SCHEDULED] ${gs.length} registered`);
  let news = await fetchNews(env);
  if (!news.length) news = await refreshNews(env);
  if (!news.length) return;
  for (const gid of gs) {
    try {
      const cfg = await getCfg(env, gid);
      if (cfg.auto === false) continue;
      const userTz = cfg.tz || "Asia/Tehran";
      const tzNow = nowInTz(userTz);
      const currentMin = tzNow.h * 60 + tzNow.m;
      const todayDate = todayInTz(userTz);
      const tomorrowDate = tomorrowInTz(userTz);
      
      const dayNames = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
      
      if (cfg.days && cfg.days.length > 0) {
        const todayName = dayNames[new Date().getUTCDay()];
        if (!cfg.days.includes(todayName)) continue;
      }
      // Weekend Silence: skip if enabled and today is weekend (Sat/Sun) in user's timezone
      if (cfg.weekend !== false) {
        const todayName = dayNames[tzNow.getUTCDay()];
        if (todayName === "sat" || todayName === "sun") continue;
      }
      for (const nt of ["today", "tomorrow"]) {
        const targetMin = timeToMin(nt === "today" ? cfg.tt : cfg.tm);
        const diff = (currentMin - targetMin + 1440) % 1440;
        if (diff > 3 && diff < 1437) continue;
        const targetDate = nt === "today" ? todayDate : tomorrowDate;
        const sendTime = nt === "today" ? cfg.tt : cfg.tm;
        const sentKey = `sent:${gid}:${nt}:${targetDate}:${sendTime}`;
        const alreadySent = await env.KV.get(sentKey);
        if (alreadySent) continue;
        const filtered = filterNews(news, cfg.c, cfg.i, cfg.cc);
        const dayItems = filtered.filter(item => {
          const evt = getEventTimeInTz(item, userTz);
          return evt._date === targetDate;
        });
        if (!dayItems.length) continue;
        console.log(`[SCHEDULED] -> ${gid}: ${nt} ${dayItems.length} items`);
        const msg = fmtNews(dayItems, nt, cfg);
        if (msg.length > 4000) {
          await tgSendHTML(env, gid, msg.slice(0, 4000));
          for (let i = 4000; i < msg.length; i += 4000) await tgSendHTML(env, gid, msg.slice(i, i + 4000));
        } else {
          await tgSendHTML(env, gid, msg);
        }
        await env.KV.put(sentKey, "1", { expirationTtl: 86400 });
        break;
      }
    } catch (e) { console.log(`sendScheduled err ${gid}:`, e); }
  }
}