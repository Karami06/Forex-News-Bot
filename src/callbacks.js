import { getGroups, getCfg, setCfg, addGroup, rmGroup } from "./storage.js";
import { t } from "./translations.js";
import { tgAnswer, tgEdit, tgSend, tgSendHTML, isAdmin } from "./telegram.js";
import { mainMenuKb, settingsKb, currencyKb, impactKb, langKb, scheduleKb, timePickerKb, tzKb, sessionsKb, toggleKb, autoSendKb, daysKb, currencyCodeKb, kb, btn, weekendKb, compactKb, sessionAlertsKb } from "./keyboards.js";
import { handleNews, handleWeeklyCalendar } from "./news.js";
import { todayInTz, tomorrowInTz, DEFAULT_TZ, nowInTz, getSessionsStatus, TIMEZONES } from "./calendar.js";
import { DEFAULT_CURRENCIES } from "./config.js";

export async function handleCb(env, cb) {
  const data = cb.data || "";
  const cid = cb.message?.chat?.id;
  const mid = cb.message?.message_id;
  const uid = cb.from?.id || 0;
  const cbid = cb.id;
  if (!cid || !mid) return;

  // Auto-register DM users who click any button (positive chat ID = DM)
  if (cid > 0) {
    const gs = await getGroups(env);
    if (!gs.includes(cid)) {
      await addGroup(env, cid);
      console.log(`Auto-registered DM user via callback: ${cid}`);
    }
  }

  const cfg = await getCfg(env, cid);
  const lang = cfg.lang;

  if (data === "noop") return tgAnswer(env, cbid, "");

  // Menu navigation
  if (data === "menu:main") {
    await tgAnswer(env, cbid, "");
    return tgEdit(env, cid, mid, `\u{1F30A} *Forex News Bot*\n\n${t(lang, "desc")}`, mainMenuKb(lang));
  }
  if (data === "menu:settings") {
    await tgAnswer(env, cbid, "");
    return tgEdit(env, cid, mid, `\u{2699}\u{FE0F} *${t(lang, "settings")}*`, settingsKb(lang));
  }
  if (data === "menu:help") {
    await tgAnswer(env, cbid, "");
    return tgEdit(env, cid, mid, `\u{1F4CB} *${t(lang, "help")}*\n\n\u{1F4E2} /news - ${t(lang, "news_today")}/${t(lang, "news_tomorrow")}\n\u{1F30D} /sessions - ${t(lang, "sessions")}\n\u{2795} /addgroup - Register group\n\u{2796} /removegroup - Unregister\n\u{2139}\u{FE0F} /settings - ${t(lang, "settings")}`, kb([[btn(`\u{2190} ${t(lang, "back")}`, "menu:main")]]));
  }

  // Weekly Calendar
  if (data === "calendar") {
    await tgAnswer(env, cbid, "");
    try {
      return await handleWeeklyCalendar(env, cid, mid, cfg, lang);
    } catch (e) {
      console.log(`Calendar err:`, e?.message || e);
      return tgSendHTML(env, cid, `\u{274C} Calendar error: ${e?.message || "unknown"}`);
    }
  }

  // Sessions
  if (data === "sessions") {
    await tgAnswer(env, cbid, "");
    const tz = TIMEZONES.find(t => t.id === cfg.tz) || TIMEZONES.find(t => t.id === DEFAULT_TZ);
    const sessions = getSessionsStatus(tz.offset);
    let msg = `\u{1F30D} *${t(lang, "sessions_title")}*\n\n`;
    for (const s of sessions) {
      const status = s.isOpen ? `\u{1F7E2} ${t(lang, "open")}` : `\u{1F534} ${t(lang, "closed")}`;
      msg += `${s.icon} *${s.name}*  ${status}\n`;
      msg += `    \u{23F0} ${s.localOpen} - ${s.localClose}\n`;
      msg += `    \u{1F4B1} ${s.currencies.join(", ")}\n\n`;
    }
    return tgEdit(env, cid, mid, msg, sessionsKb(lang));
  }

  // Currency toggle
  if (data === "menu:currencies") {
    await tgAnswer(env, cbid, "");
    return tgEdit(env, cid, mid, `\u{1F4B1} *${t(lang, "currencies")}*\n\n${t(lang, "toggle_hint")}`, currencyKb(cfg.c, lang));
  }
  if (data.startsWith("cur:")) {
    const code = data.slice(4);
    await tgAnswer(env, cbid, "");
    let cur = code === "reset" ? [...DEFAULT_CURRENCIES] : (cfg.c.includes(code) ? cfg.c.filter(x => x !== code) : [...cfg.c, code]);
    if (code === "reset") cur = [...DEFAULT_CURRENCIES];
    await setCfg(env, cid, "c", cur);
    return tgEdit(env, cid, mid, `\u{1F4B1} *${t(lang, "currencies")}*\n\n${t(lang, "toggle_hint")}`, currencyKb(cur, lang));
  }

  // Impact toggle
  if (data === "menu:impact") {
    await tgAnswer(env, cbid, "");
    return tgEdit(env, cid, mid, `\u{1F534} *${t(lang, "impact")}*`, impactKb(cfg.i, lang));
  }
  if (data.startsWith("imp:")) {
    const level = data.slice(4);
    await tgAnswer(env, cbid, "");
    let imp = cfg.i.includes(level) ? cfg.i.filter(x => x !== level) : [...cfg.i, level];
    await setCfg(env, cid, "i", imp);
    return tgEdit(env, cid, mid, `\u{1F534} *${t(lang, "impact")}*`, impactKb(imp, lang));
  }

  // Language
  if (data === "menu:lang") {
    await tgAnswer(env, cbid, "");
    return tgEdit(env, cid, mid, `\u{1F310} *${t(lang, "lang")}*`, langKb(cfg.lang));
  }
  if (data.startsWith("lang:")) {
    const newLang = data.slice(5);
    await tgAnswer(env, cbid, "");
    await setCfg(env, cid, "lang", newLang);
    return tgEdit(env, cid, mid, `\u{1F310} *${t(newLang, "lang")}*`, langKb(newLang));
  }

  // Schedule
  if (data === "menu:schedule") {
    await tgAnswer(env, cbid, "");
    return tgEdit(env, cid, mid, `\u{23F0} *${t(lang, "schedule")}*`, scheduleKb(cfg, lang));
  }
  if (data.startsWith("sch:")) {
    const type = data.slice(4);
    await tgAnswer(env, cbid, "");
    const current = type === "today" ? cfg.tt : cfg.tm;
    return tgEdit(env, cid, mid, `\u{23F0} *${t(lang, "set_time")}*\n\n\`${current}\``, timePickerKb(type, current, lang));
  }
  if (data.startsWith("time:")) {
    const parts = data.split(":");
    const type = parts[1], unit = parts[2], val = parseInt(parts[3]);
    await tgAnswer(env, cbid, "");
    let [h, m] = (type === "today" ? cfg.tt : cfg.tm).split(":").map(Number);
    if (unit === "h") h = val; else m = val;
    const newTime = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    await setCfg(env, cid, type === "today" ? "tt" : "tm", newTime);
    return tgEdit(env, cid, mid, `\u{23F0} *${t(lang, "set_time")}*\n\n\`${newTime}\``, timePickerKb(type, newTime, lang));
  }

  // Timezone
  if (data === "menu:tz") {
    await tgAnswer(env, cbid, "");
    return tgEdit(env, cid, mid, `\u{1F310} *${t(lang, "timezone")}*\n\n\`${cfg.tz}\``, tzKb(cfg.tz));
  }
  if (data.startsWith("tz:")) {
    const tzId = data.slice(3);
    await tgAnswer(env, cbid, "");
    await setCfg(env, cid, "tz", tzId);
    return tgEdit(env, cid, mid, `\u{1F310} *${t(lang, "timezone")}*\n\n\`${tzId}\``, tzKb(tzId));
  }

  // Indicators (currency code filter)
  if (data === "menu:index") {
    await tgAnswer(env, cbid, "");
    return tgEdit(env, cid, mid, `\u{1F4CC} *${t(lang, "indexes")}*\n\nFilter by individual currencies (e.g., only USD news)`, currencyCodeKb(cfg.cc || [], lang));
  }
  if (data.startsWith("cc:")) {
    const code = data.slice(3);
    await tgAnswer(env, cbid, "");
    const current = cfg.cc || [];
    let newCodes = code === "reset" ? [] : (current.includes(code) ? current.filter(x => x !== code) : [...current, code]);
    await setCfg(env, cid, "cc", newCodes);
    return tgEdit(env, cid, mid, `\u{1F4CC} *${t(lang, "indexes")}*\n\nFilter by individual currencies (e.g., only USD news)`, currencyCodeKb(newCodes, lang));
  }

  // Pre-release alerts toggle
  if (data === "menu:pre") {
    await tgAnswer(env, cbid, "");
    return tgEdit(env, cid, mid, `\u{23F0} *${t(lang, "pre_alerts")}*`, toggleKb("pre", cfg.pre, lang));
  }
  if (data === "toggle:pre") {
    await tgAnswer(env, cbid, "");
    await setCfg(env, cid, "pre", (!cfg.pre).toString());
    return tgEdit(env, cid, mid, `\u{23F0} *${t(lang, "pre_alerts")}*`, toggleKb("pre", !cfg.pre, lang));
  }

  // Post-release analysis toggle
  if (data === "menu:post") {
    await tgAnswer(env, cbid, "");
    return tgEdit(env, cid, mid, `\u{1F4CA} *${t(lang, "post_release")}*`, toggleKb("post", cfg.post, lang));
  }
  if (data === "toggle:post") {
    await tgAnswer(env, cbid, "");
    await setCfg(env, cid, "post", (!cfg.post).toString());
    return tgEdit(env, cid, mid, `\u{1F4CA} *${t(lang, "post_release")}*`, toggleKb("post", !cfg.post, lang));
  }

  // Auto-send toggle (NEW)
  if (data === "menu:auto") {
    await tgAnswer(env, cbid, "");
    return tgEdit(env, cid, mid, `\u{1F504} *${t(lang, "auto_send")}*`, autoSendKb(cfg.auto, lang));
  }
  if (data === "toggle:auto") {
    await tgAnswer(env, cbid, "");
    await setCfg(env, cid, "auto", (!cfg.auto).toString());
    return tgEdit(env, cid, mid, `\u{1F504} *${t(lang, "auto_send")}*`, autoSendKb(!cfg.auto, lang));
  }

  // Active days toggle (NEW)
  if (data === "menu:days") {
    await tgAnswer(env, cbid, "");
    return tgEdit(env, cid, mid, `\u{1F4C5} *${t(lang, "active_days")}*\n\n${t(lang, "active_days")}: ${(cfg.days || []).join(", ") || "All days"}`, daysKb(cfg.days || [], lang));
  }
  if (data.startsWith("day:")) {
    const code = data.slice(4);
    await tgAnswer(env, cbid, "");
    const current = cfg.days || [];
    let newDays = code === "reset" ? [] : (current.includes(code) ? current.filter(x => x !== code) : [...current, code]);
    await setCfg(env, cid, "days", newDays);
    return tgEdit(env, cid, mid, `\u{1F4C5} *${t(lang, "active_days")}*\n\n${t(lang, "active_days")}: ${newDays.join(", ") || "All days"}`, daysKb(newDays, lang));
  }

  // Weekend Silence toggle
  if (data === "menu:weekend") {
    await tgAnswer(env, cbid, "");
    return tgEdit(env, cid, mid, `\u{1F4C5} *${t(lang, "weekend_silence")}*`, weekendKb(cfg.weekend !== false, lang));
  }
  if (data === "toggle:weekend") {
    await tgAnswer(env, cbid, "");
    await setCfg(env, cid, "weekend", (!cfg.weekend).toString());
    return tgEdit(env, cid, mid, `\u{1F4C5} *${t(lang, "weekend_silence")}*`, weekendKb(!cfg.weekend, lang));
  }

  // Compact Mode toggle
  if (data === "menu:compact") {
    await tgAnswer(env, cbid, "");
    return tgEdit(env, cid, mid, `\u{1F504} *${t(lang, "compact_mode")}*`, compactKb(cfg.compact === true, lang));
  }
  if (data === "toggle:compact") {
    await tgAnswer(env, cbid, "");
    await setCfg(env, cid, "compact", (!cfg.compact).toString());
    return tgEdit(env, cid, mid, `\u{1F504} *${t(lang, "compact_mode")}*`, compactKb(!cfg.compact, lang));
  }

  // Session Alerts
  if (data === "menu:session_alerts") {
    await tgAnswer(env, cbid, "");
    return tgEdit(env, cid, mid, `\u{1F30D} *${t(lang, "sessions")}*`, sessionAlertsKb(cfg, lang));
  }
  if (data.startsWith("session:open:")) {
    const sessionName = data.slice(13);
    await tgAnswer(env, cbid, "");
    const currentOpen = cfg.sessionAlerts?.open || [];
    const newOpen = currentOpen.includes(sessionName) 
      ? currentOpen.filter(s => s !== sessionName) 
      : [...currentOpen, sessionName];
    await setCfg(env, cid, "sessionAlerts", { ...cfg.sessionAlerts, open: newOpen });
    return tgEdit(env, cid, mid, `\u{1F30D} *${t(lang, "sessions")}*`, sessionAlertsKb({ ...cfg, sessionAlerts: { ...cfg.sessionAlerts, open: newOpen } }, lang));
  }
  if (data.startsWith("session:close:")) {
    const sessionName = data.slice(14);
    await tgAnswer(env, cbid, "");
    const currentClose = cfg.sessionAlerts?.close || [];
    const newClose = currentClose.includes(sessionName)
      ? currentClose.filter(s => s !== sessionName)
      : [...currentClose, sessionName];
    await setCfg(env, cid, "sessionAlerts", { ...cfg.sessionAlerts, close: newClose });
    return tgEdit(env, cid, mid, `\u{1F30D} *${t(lang, "sessions")}*`, sessionAlertsKb({ ...cfg, sessionAlerts: { ...cfg.sessionAlerts, close: newClose } }, lang));
  }

  // News preview
  if (data.startsWith("news:")) {
    const nt = data.slice(5);
    await tgAnswer(env, cbid, "");
    return handleNews(env, cid, mid, nt, cfg, lang);
  }
}