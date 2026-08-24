import { getGroups, getCfg } from "./storage.js";
import { getCachedNews, filterNews, getEventTimeInTz } from "./news.js";
import { nowInTz, todayInTz } from "./calendar.js";
import { tgSendPlain } from "./telegram.js";
import { TV_DEFAULT, tvLink } from "./config.js";

export async function sendAlerts(env) {
  const gs = await getGroups(env);
  if (!gs.length) return;
  const news = await getCachedNews(env);
  if (!news.length) return;

  for (const gid of gs) {
    try {
      const cfg = await getCfg(env, gid);
      if (!cfg.pre) continue;
      const userTz = cfg.tz || "Asia/Tehran";
      const tzNow = nowInTz(userTz);
      // Weekend Silence
      if (cfg.weekend !== false) {
        const dayNames = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
        const todayName = dayNames[tzNow.getUTCDay()];
        if (todayName === "sat" || todayName === "sun") continue;
      }
      const currentMin = tzNow.h * 60 + tzNow.m;
      const todayDate = todayInTz(userTz);
      const filtered = filterNews(news, cfg.c, cfg.i, cfg.cc);
      const todayItems = filtered.filter(item => {
        const evt = getEventTimeInTz(item, userTz);
        return evt._date === todayDate;
      });

      for (const item of todayItems) {
        const evt = getEventTimeInTz(item, userTz);
        const [h, m] = evt.t.split(":").map(Number);
        const eventMin = h * 60 + m;
        const diff = eventMin - currentMin;

        if (diff > 0 && diff <= 5) {
          const cooldownKey = `pre:${gid}:${evt.t}:${item.e}`;
          const lastSent = await env.KV.get(cooldownKey);
          if (!lastSent) {
            const tvPair = TV_DEFAULT[item.c.toUpperCase()];
            const tvLinkStr = tvPair ? `\nTradingView: ${tvLink(tvPair)}` : "";
            const impactEmoji = item.i === "high" ? "\u{1F534}" : item.i === "medium" ? "\u{1F7E1}" : "\u{1F7E2}";
            await tgSendPlain(env, gid, `${impactEmoji} PRE-RELEASE: ${item.c} | ${item.e}\nIn ${diff} min\nForecast: ${item.f || "\u{2013}"}  |  Previous: ${item.p || "\u{2013}"}${tvLinkStr}`);
            await env.KV.put(cooldownKey, "1", { expirationTtl: 600 });
          }
        }
      }
    } catch (e) { console.log(`Alert err ${gid}:`, e); }
  }
}