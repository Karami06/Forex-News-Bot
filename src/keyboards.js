import { t } from "./translations.js";
import { ALL_CURRENCIES, ALL_CODES, TIMEZONES, DEFAULT_CURRENCIES } from "./config.js";

export function kb(rows) { return { inline_keyboard: rows }; }
export function btn(text, cb) { return { text, callback_data: cb }; }

export function mainMenuKb(lang) {
  return kb([
    [btn(`\u{1F4CA} ${t(lang, "news_today")}`, "news:today"), btn(`\u{1F4C8} ${t(lang, "news_tomorrow")}`, "news:tomorrow")],
    [btn(`\u{1F4C5} ${t(lang, "weekly_calendar")}`, "calendar")],
    [btn(`\u{1F30D} ${t(lang, "sessions")}`, "sessions"), btn(`\u{2699}\u{FE0F} ${t(lang, "settings")}`, "menu:settings")],
  ]);
}

export function calendarKb(lang) {
  return kb([
    [btn(`\u{2190} ${t(lang, "back")}`, "menu:main")],
  ]);
}

export function settingsKb(lang) {
  return kb([
    [btn(`\u{1F4CC} ${t(lang, "indexes")}`, "menu:index")],
    [btn(`\u{1F534} ${t(lang, "impact")}`, "menu:impact")],
    [btn(`\u{23F0} ${t(lang, "schedule")}`, "menu:schedule"), btn(`\u{1F310} ${t(lang, "timezone")}`, "menu:tz")],
    [btn(`\u{1F310} ${t(lang, "lang")}`, "menu:lang")],
    [btn(`\u{23F0} ${t(lang, "pre_alerts")}`, "menu:pre")],
    [btn(`\u{1F4CA} ${t(lang, "post_release")}`, "menu:post")],
    [btn(`\u{1F504} ${t(lang, "auto_send")}`, "menu:auto")],
    [btn(`\u{1F4C5} ${t(lang, "weekend_silence")}`, "menu:weekend")],
    [btn(`\u{1F504} ${t(lang, "compact_mode")}`, "menu:compact")],
    [btn(`\u{2190} ${t(lang, "back")}`, "menu:main")],
  ]);
}

export function currencyKb(active, lang) {
  const rows = [];
  const sorted = [...ALL_CURRENCIES].sort((a, b) => (active.includes(a.code) ? 0 : 1) - (active.includes(b.code) ? 0 : 1));
  for (let i = 0; i < sorted.length; i += 3) {
    const row = [];
    for (let j = i; j < Math.min(i + 3, sorted.length); j++) {
      const c = sorted[j];
      row.push(btn(`${active.includes(c.code) ? "\u2705" : "\u274C"} ${c.code}`, `cur:${c.code}`));
    }
    rows.push(row);
  }
  rows.push([btn("\u{1F504} Reset", "cur:reset"), btn(`\u{2190} ${t(lang, "back")}`, "menu:settings")]);
  return kb(rows);
}

export function impactKb(active, lang) {
  return kb([
    [btn(`${active.includes("high") ? "\u2705" : "\u274C"} HIGH`, "imp:high"),
     btn(`${active.includes("medium") ? "\u2705" : "\u274C"} MEDIUM`, "imp:medium"),
     btn(`${active.includes("low") ? "\u2705" : "\u274C"} LOW`, "imp:low")],
    [btn(`\u{2190} ${t(lang, "back")}`, "menu:settings")],
  ]);
}

export function currencyCodeKb(active, lang) {
  const rows = [];
  for (let i = 0; i < ALL_CODES.length; i += 3) {
    const row = [];
    for (let j = i; j < Math.min(i + 3, ALL_CODES.length); j++) {
      const code = ALL_CODES[j];
      row.push(btn(`${active.includes(code) ? "\u2705" : "\u274C"} ${code}`, `cc:${code}`));
    }
    rows.push(row);
  }
  rows.push([btn("\u{1F504} Reset", "cc:reset"), btn(`\u{2190} ${t(lang, "back")}`, "menu:settings")]);
  return kb(rows);
}

export function langKb(current) {
  const langs = [
    ["en", "English"], ["fa", "\u0641\u0627\u0631\u0633\u06CC"], ["ar", "\u0627\u0644\u0639\u0631\u0628\u064A\u0629"],
    ["ru", "\u0420\u0443\u0441\u0441\u043A\u0438\u0439"], ["es", "Espa\u00F1ol"], ["zh", "\u4E2D\u6587"], ["ja", "\u65E5\u672C\u8A9E"],
  ];
  return kb([
    ...langs.map(([code, name]) => [btn(`${current === code ? "\u{25CF}" : "\u{25CB}"} ${name}`, `lang:${code}`)]),
    [btn(`\u{2190} Back`, "menu:settings")],
  ]);
}

export function scheduleKb(cfg, lang) {
  return kb([
    [btn(`${t(lang, "today_time")}: ${cfg.tt}`, "sch:today")],
    [btn(`${t(lang, "tomorrow_time")}: ${cfg.tm}`, "sch:tomorrow")],
    [btn(`\u{2190} ${t(lang, "back")}`, "menu:settings")],
  ]);
}

export function timePickerKb(type, current, lang) {
  const [ch, cm] = current.split(":").map(Number);
  const rows = [];
  for (let start = 0; start < 24; start += 6) {
    const hRow = [];
    for (let h = start; h < Math.min(start + 6, 24); h++) {
      hRow.push(btn(h === ch ? `\u{25CF} ${String(h).padStart(2, "0")}` : String(h).padStart(2, "0"), `time:${type}:h:${h}`));
    }
    rows.push(hRow);
  }
  for (let start = 0; start < 60; start += 6) {
    const mRow = [];
    for (let m = start; m < Math.min(start + 6, 60); m++) {
      mRow.push(btn(m === cm ? `\u{25CF} ${String(m).padStart(2, "0")}` : String(m).padStart(2, "0"), `time:${type}:m:${m}`));
    }
    rows.push(mRow);
  }
  rows.push([btn(`\u{2190} ${t(lang, "back")}`, "menu:schedule")]);
  return kb(rows);
}

export function tzKb(current) {
  const rows = [];
  for (let i = 0; i < TIMEZONES.length; i += 2) {
    const row = [];
    const t1 = TIMEZONES[i];
    row.push(btn(`${current === t1.id ? "\u{25CF}" : "\u{25CB}"} ${t1.label}`, `tz:${t1.id}`));
    if (i + 1 < TIMEZONES.length) {
      const t2 = TIMEZONES[i + 1];
      row.push(btn(`${current === t2.id ? "\u{25CF}" : "\u{25CB}"} ${t2.label}`, `tz:${t2.id}`));
    }
    rows.push(row);
  }
  rows.push([btn(`\u{2190} Back`, "menu:settings")]);
  return kb(rows);
}

export function sessionsKb(lang) { return kb([[btn(`\u{2190} ${t(lang, "back")}`, "menu:main")]]); }

export function subsKb(subs, lang) {
  const events = ["NFP", "CPI", "GDP", "Interest Rate", "PMI", "Retail Sales", "Unemployment", "Trade Balance"];
  const rows = events.map(e => [btn(`${subs.includes(e) ? "\u{1F514}" : "\u{1F515}"} ${e}`, `sub:${e}`)]);
  rows.push([btn(`\u{2190} ${t(lang, "back")}`, "menu:settings")]);
  return kb(rows);
}

export function toggleKb(key, val, lang) {
  return kb([
    [btn(`${val ? "\u2705" : "\u274C"} ${val ? t(lang, "alert_on") : t(lang, "alert_off")}`, `toggle:${key}`)],
    [btn(`\u{2190} ${t(lang, "back")}`, "menu:settings")],
  ]);
}

export function autoSendKb(val, lang) {
  return kb([
    [btn(`${val ? "\u2705" : "\u274C"} ${val ? t(lang, "alert_on") : t(lang, "alert_off")}`, "toggle:auto")],
    [btn(`\u{2190} ${t(lang, "back")}`, "menu:settings")],
  ]);
}

export function daysKb(active, lang) {
  const days = [
    ["mon", "\u{1F4C5} Mon"], ["tue", "\u{1F4C5} Tue"], ["wed", "\u{1F4C5} Wed"],
    ["thu", "\u{1F4C5} Thu"], ["fri", "\u{1F4C5} Fri"], ["sat", "\u{1F4C5} Sat"], ["sun", "\u{1F4C5} Sun"],
  ];
  const rows = days.map(([code, label]) => [btn(`${active.includes(code) ? "\u2705" : "\u274C"} ${label}`, `day:${code}`)]);
  rows.push([btn("\u{1F504} Reset", "day:reset"), btn(`\u{2190} ${t(lang, "back")}`, "menu:settings")]);
  return kb(rows);
}

export function weekendKb(val, lang) {
  return kb([
    [btn(`${val ? "\u2705" : "\u274C"} ${val ? t(lang, "weekend_on") : t(lang, "weekend_off")}`, "toggle:weekend")],
    [btn(`\u{2190} ${t(lang, "back")}`, "menu:settings")],
  ]);
}

export function compactKb(val, lang) {
  return kb([
    [btn(`${val ? "\u2705" : "\u274C"} ${val ? t(lang, "compact_on") : t(lang, "compact_off")}`, "toggle:compact")],
    [btn(`\u{2190} ${t(lang, "back")}`, "menu:settings")],
  ]);
}