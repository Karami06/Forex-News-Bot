import { getGroups, getCfg, setCfg, addGroup, rmGroup } from "./storage.js";
import { t } from "./translations.js";
import { tgSend, tgSendHTML, isAdmin } from "./telegram.js";
import { mainMenuKb, settingsKb, sessionsKb } from "./keyboards.js";
import { todayInTz, tomorrowInTz, nowInTz, DEFAULT_TZ, minsSinceMidnight, TIMEZONES, getSessionsStatus } from "./calendar.js";
import { fetchNews, filterNews, fmtNews, refreshNews, getEventTimeInTz } from "./news.js";
import { DEFAULT_CURRENCIES, DEFAULT_IMPACT } from "./config.js";

export async function handleCmd(env, cid, ct, text, msg) {
  const parts = text.trim().split(/\s+/);
  const cmd = parts[0].toLowerCase().split("@")[0];
  const args = parts.slice(1);
  const uid = msg.from?.id || 0;
  const nm = msg.from?.first_name || "User";
  console.log(`CMD:${cmd} u:${nm}(${uid}) c:${cid}`);

  // Auto-register ALL DM users who send any command (positive chat ID = DM)
  if (ct === "private" || cid > 0) {
    const gs = await getGroups(env);
    if (!gs.includes(cid)) {
      await addGroup(env, cid);
      console.log(`Auto-registered DM user: ${cid}`);
    }
  }

  if (cmd === "/start") {
    const cfg = await getCfg(env, cid);
    await tgSend(env, cid, `\u{1F30A} *Forex News Bot*\n\n${t(cfg.lang, "welcome", { name: nm })}\n\n${t(cfg.lang, "desc")}`, mainMenuKb(cfg.lang));
  } else if (cmd === "/help" || cmd === "/settings") {
    const cfg = await getCfg(env, cid);
    await tgSend(env, cid, `\u{2699}\u{FE0F} *${t(cfg.lang, "settings")}*`, settingsKb(cfg.lang));
  } else if (cmd === "/sessions") {
    const cfg = await getCfg(env, cid);
    const tz = TIMEZONES.find(t => t.id === cfg.tz) || TIMEZONES.find(t => t.id === DEFAULT_TZ);
    const sessions = getSessionsStatus(tz.offset);
    let msgText = `\u{1F30D} *${t(cfg.lang, "sessions_title")}*\n\n`;
    for (const s of sessions) {
      const status = s.isOpen ? `\u{1F7E2} ${t(cfg.lang, "open")}` : `\u{1F534} ${t(cfg.lang, "closed")}`;
      msgText += `${s.icon} *${s.name}*  ${status}\n    \u{23F0} ${s.localOpen} - ${s.localClose}\n    \u{1F4B1} ${s.currencies.join(", ")}\n\n`;
    }
    await tgSend(env, cid, msgText, sessionsKb(cfg.lang));
  } else if (cmd === "/addgroup") {
    const adminIds = getAdminIds(env);
    if (adminIds.length && !adminIds.includes(uid)) {
      return tgSend(env, cid, "⛔ Admin only.");
    }
    const gs = await getGroups(env);
    if (gs.includes(cid)) return tgSend(env, cid, "\u{2139}\u{FE0F} Already registered.");
    if (await addGroup(env, cid)) await tgSend(env, cid, `\u{2705} Added!`, settingsKb("en"));
  } else if (cmd === "/removegroup") {
    const adminIds = getAdminIds(env);
    if (adminIds.length && !adminIds.includes(uid)) {
      return tgSend(env, cid, "⛔ Admin only.");
    }
    if (await rmGroup(env, cid)) await tgSend(env, cid, "\u{2705} Removed.");
  } else if (cmd === "/news") {
    const cfg = ct !== "private" ? await getCfg(env, cid) : { c: DEFAULT_CURRENCIES, i: DEFAULT_IMPACT, cc: [], tz: DEFAULT_TZ, lang: "en" };
    const nt = args[0]?.toLowerCase() || "today";
    if (!["today", "tomorrow"].includes(nt)) return tgSend(env, cid, "Usage: /news today");
    const userTz = cfg.tz || DEFAULT_TZ;
    const todayDate = todayInTz(userTz);
    const tomorrowDate = tomorrowInTz(userTz);
    const news = await fetchNews(env);
    const filtered = filterNews(news, cfg.c, cfg.i, cfg.cc);
    const targetDate = nt === "today" ? todayDate : tomorrowDate;
    const dayItems = filtered.filter(item => {
      const evt = getEventTimeInTz(item, userTz);
      return evt._date === targetDate;
    });
    const msgText = fmtNews(dayItems, nt, cfg);
    if (msgText.length > 4000) {
      for (let i = 0; i < msgText.length; i += 4000) await tgSendHTML(env, cid, msgText.slice(i, i + 4000));
    } else {
      await tgSendHTML(env, cid, msgText);
    }
  } else if (cmd === "/setpairs") {
    if (!args.length) return tgSend(env, cid, "Usage: /setpairs EURUSD,GBPUSD");
    await setCfg(env, cid, "c", args[0].split(",").map(p => p.trim().toUpperCase()));
    await tgSend(env, cid, "\u{2705} Updated!");
  } else if (cmd === "/setimpact") {
    if (!args.length) return tgSend(env, cid, "Usage: /setimpact high,medium");
    await setCfg(env, cid, "i", args[0].split(",").map(l => l.trim().toLowerCase()).filter(l => ["high", "medium", "low"].includes(l)));
    await tgSend(env, cid, "\u{2705} Updated!");
  } else if (cmd === "/settime") {
    if (args.length < 2) return tgSend(env, cid, "Usage: /settime today 12:00");
    const nt = args[0].toLowerCase();
    if (!["today", "tomorrow"].includes(nt)) return tgSend(env, cid, "Use today/tomorrow.");
    const tp = args[1].split(":");
    const h = parseInt(tp[0]), mi = parseInt(tp[1]);
    if (isNaN(h) || isNaN(mi) || h < 0 || h > 23 || mi < 0 || mi > 59) return tgSend(env, cid, "Invalid time.");
    await setCfg(env, cid, nt === "today" ? "tt" : "tm", `${String(h).padStart(2, "0")}:${String(mi).padStart(2, "0")}`);
    await tgSend(env, cid, `\u{2705} ${nt}: ${String(h).padStart(2, "0")}:${String(mi).padStart(2, "0")}`);
  } else if (cmd === "/diag") {
    const gs = await getGroups(env);
    let diag = `\u{1F50D} *Diagnostics*\n\nGroups: ${gs.length}\n`;
    for (const gid of gs) {
      const cfg = await getCfg(env, gid);
      const userTz = cfg.tz || DEFAULT_TZ;
      const tzNow = nowInTz(userTz);
      const curH = String(tzNow.h).padStart(2, "0");
      const curM = String(tzNow.m).padStart(2, "0");
      diag += `\n*${gid}*\n  tz: ${cfg.tz}\n  now: ${curH}:${curM}\n  today_send: ${cfg.tt}\n  tomorrow_send: ${cfg.tm}\n  currencies: ${cfg.c.join(", ")}\n  impact: ${cfg.i.join(", ")}\n  lang: ${cfg.lang}\n  auto: ${cfg.auto}\n  post: ${cfg.post}\n  days: ${(cfg.days||[]).join(",") || "all"}\n`;
    }
    const news = await fetchNews(env);
    diag += `\n\u{1F4F0} News API: ${news.length} items`;
    const irstNow = nowInTz(DEFAULT_TZ);
    diag += `\n\u{1F552} IRST now: ${String(irstNow.h).padStart(2, "0")}:${String(irstNow.m).padStart(2, "0")}`;
    await tgSend(env, cid, diag);
    return;
  } else if (cmd === "/forcesend") {
    const adminIds = getAdminIds(env);
    if (adminIds.length && !adminIds.includes(uid)) {
      return tgSend(env, cid, "⛔ Admin only.");
    }
    const news = await refreshNews(env);
    await tgSend(env, cid, `\u{1F504} Cache refreshed. ${news.length} items available.`);
    return;
  } else if (cmd === "/export") {
    const adminIds = getAdminIds(env);
    if (adminIds.length && !adminIds.includes(uid)) {
      return tgSend(env, cid, "⛔ Admin only.");
    }
    const cfg = await getCfg(env, cid);
    const exportData = {
      c: cfg.c,
      cc: cfg.cc,
      i: cfg.i,
      tt: cfg.tt,
      tm: cfg.tm,
      tz: cfg.tz,
      lang: cfg.lang,
      subs: cfg.subs,
      pre: cfg.pre,
      post: cfg.post,
      auto: cfg.auto,
      days: cfg.days,
      weekend: cfg.weekend,
      compact: cfg.compact,
      sessionAlerts: cfg.sessionAlerts,
      dailyRecap: cfg.dailyRecap,
    };
    const encoded = btoa(JSON.stringify(exportData));
    await tgSend(env, cid, `\u{1F3AB} *Export Config*\n\nCopy this code to backup or share your settings:\n\n\`${encoded}\``);
    return;
  } else if (cmd === "/import") {
    const adminIds = getAdminIds(env);
    if (adminIds.length && !adminIds.includes(uid)) {
      return tgSend(env, cid, "⛔ Admin only.");
    }
    if (!args.length) return tgSend(env, cid, "Usage: /import <code>");
    try {
      const decoded = JSON.parse(atob(args[0]));
      for (const [k, v] of Object.entries(decoded)) {
        await setCfg(env, cid, k, v);
      }
      await tgSend(env, cid, "\u{2705} Settings imported successfully!");
    } catch (e) {
      await tgSend(env, cid, "\u{274C} Invalid code. Make sure you copied the full export code.");
    }
    return;
  }
}