import { handleCb } from "./callbacks.js";
import { handleCmd } from "./commands.js";
import { sendScheduled } from "./auto-send.js";
import { sendAlerts } from "./alerts.js";
import { sendPostNews } from "./post-news.js";
import { sendSessionAlerts } from "./session-alerts.js";
import { sendDailyRecap } from "./daily-recap.js";
import { getGroups, getCfg } from "./storage.js";
import { fetchNews, filterNews, fmtNews, getEventTimeInTz } from "./news.js";
import { todayInTz, tomorrowInTz, DEFAULT_TZ, minsSinceMidnight, timeToMin, nowInTz } from "./calendar.js";
import { getAdminIds, tgSend, tgSendHTML } from "./telegram.js";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "POST" && url.pathname === "/webhook") {
      try {
        const body = await request.json();
        if (body.callback_query) await handleCb(env, body.callback_query);
        else if (body.message) {
          const m = body.message;
          if ((m.text || "").startsWith("/")) await handleCmd(env, m.chat.id, m.chat.type, m.text, m);
        }
        return new Response("OK");
      } catch (e) { console.log("WEBHOOK_ERR:", e?.message || e, e?.stack || ""); return new Response("OK"); }
    }
    if (url.pathname === "/status") {
      const gs = await getGroups(env);
      const news = await fetchNews(env);
      let info = `Groups: ${gs.length}\nNews: ${news.length}\n`;
      for (const gid of gs) {
        const cfg = await getCfg(env, gid);
        const userTz = cfg.tz || DEFAULT_TZ;
        const tzNow = nowInTz(userTz);
        const curH = String(tzNow.h).padStart(2, "0");
        const curM = String(tzNow.m).padStart(2, "0");
        const diff = tzNow.h * 60 + tzNow.m - timeToMin(cfg.tt);
        info += `\n${gid}: tz=${cfg.tz} now=${curH}:${curM} diff=${diff} auto=${cfg.auto} post=${cfg.post}`;
        info += `\n  c=${JSON.stringify(cfg.c)} i=${JSON.stringify(cfg.i)} cc=${JSON.stringify(cfg.cc)}`;
        const filtered = filterNews(news, cfg.c, cfg.i, cfg.cc);
        info += `\n  filtered=${filtered.length}`;
        const todayDate = todayInTz(userTz);
        const tomorrowDate = tomorrowInTz(userTz);
        const todayItems = filtered.filter(item => {
          const evt = getEventTimeInTz(item, userTz);
          return evt._date === todayDate;
        });
        const tomorrowItems = filtered.filter(item => {
          const evt = getEventTimeInTz(item, userTz);
          return evt._date === tomorrowDate;
        });
        info += ` today=${todayDate}(${todayItems.length}) tomorrow=${tomorrowDate}(${tomorrowItems.length})`;
      }
      if (news.length > 0) {
        const dates = [...new Set(news.map(n => {
          const evt = getEventTimeInTz(n, DEFAULT_TZ);
          return evt._date;
        }))].sort();
        info += `\nNews dates (IRST): ${dates.join(", ")}`;
      }
      return new Response(info);
    }




    if (url.pathname === "/tick") {
      await sendScheduled(env);
      return new Response("OK");
    }
    return new Response("Forex News Bot running");
  },
  async scheduled(event, env) {
    console.log(`[CRON] Fired at ${new Date().toISOString()}`);
    await sendScheduled(env);
    await sendAlerts(env);
    await sendPostNews(env);
    await sendSessionAlerts(env);
    await sendDailyRecap(env);
    console.log(`[CRON] Complete`);
  },
};