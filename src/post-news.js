import { getGroups, getCfg } from "./storage.js";
import { getCachedNews, getCachedNewsWithMeta, updateSentFlags, filterNews, getEventTimeInTz } from "./news.js";
import { nowInTz, todayInTz } from "./calendar.js";
import { tgSendHTML } from "./telegram.js";
import { TV_DEFAULT, tvLink } from "./config.js";
import { t } from "./translations.js";

function parseNumeric(val) {
  if (!val || val === "\u{2013}" || val === "") return NaN;
  const cleaned = String(val).replace(/[^0-9.-]/g, "");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? NaN : parsed;
}

export async function sendPostNews(env) {
  const gs = await getGroups(env);
  if (!gs.length) return;

  // Get fresh data from cache (which is updated by incremental fetch every 15 min)
  const news = await getCachedNewsWithMeta(env);
  if (!news.length) return;

  for (const gid of gs) {
    try {
      const cfg = await getCfg(env, gid);
      if (cfg.post === false) continue;
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
        // Parse event time (HH:MM) to minutes since midnight in the group's timezone.
        const [h, m] = evt.t.split(":").map(Number);
        const eventMin = h * 60 + m;
        // Send post‑release as soon as the actual value appears **after** the scheduled event time.
        if (item.a != null && item.a !== "" && currentMin >= eventMin) {
          const dedupKey = `post:${gid}:${evt._date}:${evt.t}:${item.e}`;
          const alreadySent = await env.KV.get(dedupKey);
          if (alreadySent) continue;

          const lang = cfg.lang || "en";
          const tvPair = TV_DEFAULT[item.c.toUpperCase()];
          const tvLinkStr = tvPair ? `\n\u{1F310} <a href="${tvLink(tvPair)}">${t(lang, "trading_view")}</a>` : "";
          const impactEmoji = item.i === "high" ? "\u{1F534}" : item.i === "medium" ? "\u{1F7E1}" : "\u{1F7E2}";

          let msg = `\u{1F4CA} <b>${t(lang, "post_release")}: ${item.c} | ${item.e}</b> ${impactEmoji}\n`;
          msg += `\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\n`;
          msg += `<b>${t(lang, "previous")}:</b> ${item.p || "\u{2013}"}\n`;
          msg += `<b>${t(lang, "forecast")}:</b> ${item.f || "\u{2013}"}\n`;
          msg += `<b>${t(lang, "actual")}:</b> ${item.a}`;

          if (item.f && item.f !== "\u{2013}" && item.a !== "\u{2013}") {
            const f = parseNumeric(item.f);
            const a = parseNumeric(item.a);
            if (!isNaN(f) && !isNaN(a)) {
              if (a > f) msg += ` \u{2705} <i>Beat forecast</i>`;
              else if (a < f) msg += ` \u{274C} <i>Missed forecast</i>`;
              else msg += ` \u{2795} <i>In line</i>`;
            }
          }

          msg += tvLinkStr;
          await tgSendHTML(env, gid, msg);
          // Keep deduplication for 24 hours to avoid re-sending after a restart or delayed data.
          await env.KV.put(dedupKey, "1", { expirationTtl: 86400 });
          
          // Update sentFlags in cache
          await updateSentFlags(env, item.id, { postReleaseCheck: true });
        }
      }
    } catch (e) { console.log(`Post-news err ${gid}:`, e); }
  }
}