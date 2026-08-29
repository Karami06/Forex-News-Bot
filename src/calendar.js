import { TIMEZONES, DEFAULT_TZ, SESSIONS } from "./config.js";

export { TIMEZONES, DEFAULT_TZ, SESSIONS };

export function nowInTz(tzId) {
  const tz = TIMEZONES.find(t => t.id === tzId) || TIMEZONES.find(t => t.id === DEFAULT_TZ);
  const now = new Date();
  const utcMin = now.getUTCHours() * 60 + now.getUTCMinutes();
  const tzOffsetMin = Math.round(tz.offset * 60);
  const tzMin = utcMin + tzOffsetMin;
  const adj = ((tzMin % 1440) + 1440) % 1440;
  const offsetMs = tzOffsetMin * 60 * 1000;
  const d = new Date(now.getTime() + offsetMs);
  return { h: Math.floor(adj / 60), m: adj % 60, date: d.toISOString().slice(0, 10) };
}

export function todayInTz(tzId) {
  return nowInTz(tzId).date;
}

export function tomorrowInTz(tzId) {
  const tz = TIMEZONES.find(t => t.id === tzId) || TIMEZONES.find(t => t.id === DEFAULT_TZ);
  const now = new Date();
  const utcMin = now.getUTCHours() * 60 + now.getUTCMinutes();
  const tzOffsetMin = Math.round(tz.offset * 60);
  const tzMin = utcMin + tzOffsetMin;
  const adj = ((tzMin % 1440) + 1440) % 1440;
  const offsetMs = tzOffsetMin * 60 * 1000;
  const d = new Date(now.getTime() + offsetMs);
  // Tomorrow in the TARGET timezone: if we're past midnight in target tz, tomorrow is next day
  // We already have the date in target timezone from `d`, so just add 1 day to that date
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

export function weekInTz(tzId) {
  const today = todayInTz(tzId);
  const d = new Date(today + "T12:00:00Z");
  const dow = d.getUTCDay();
  const offsetToMon = (dow + 6) % 7;
  d.setUTCDate(d.getUTCDate() - offsetToMon);
  const monday = d.toISOString().slice(0, 10);
  d.setUTCDate(d.getUTCDate() + 6);
  const sunday = d.toISOString().slice(0, 10);
  return { monday, sunday };
}

const DAY_NAMES_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function parseDateStr(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return { y, m, d };
}

export function formatDayHeader(dateStr) {
  const { y, m, d } = parseDateStr(dateStr);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const dow = dt.getUTCDay();
  return `${DAY_NAMES_EN[dow]}, ${MONTH_NAMES_EN[m - 1]} ${String(d).padStart(2, "0")}`;
}

export function convertDateToTz(dateStr, fromTz, toTz) {
  const from = TIMEZONES.find(t => t.id === fromTz) || TIMEZONES.find(t => t.id === DEFAULT_TZ);
  const to = TIMEZONES.find(t => t.id === toTz) || TIMEZONES.find(t => t.id === DEFAULT_TZ);
  const d = new Date(dateStr + "T12:00:00Z");
  const fromOffset = from.offset * 60;
  const toOffset = to.offset * 60;
  const diffMinutes = toOffset - fromOffset;
  d.setUTCMinutes(d.getUTCMinutes() + diffMinutes);
  return d.toISOString().slice(0, 10);
}

export function getTimeInTz(tzId) {
  const tz = TIMEZONES.find(t => t.id === tzId) || TIMEZONES.find(t => t.id === DEFAULT_TZ);
  const now = new Date();
  const utcMin = now.getUTCHours() * 60 + now.getUTCMinutes();
  const tzMin = utcMin + tz.offset * 60;
  const adj = ((tzMin % 1440) + 1440) % 1440;
  return `${String(Math.floor(adj / 60)).padStart(2, "0")}:${String(adj % 60).padStart(2, "0")}`;
}

export function timeToMin(str) {
  const [h, m] = str.split(":").map(Number);
  return h * 60 + m;
}

export function minsSinceMidnight(tzId) {
  const tz = TIMEZONES.find(t => t.id === tzId) || TIMEZONES.find(t => t.id === DEFAULT_TZ);
  const now = new Date();
  const utc = now.getUTCHours() * 60 + now.getUTCMinutes();
  return ((utc + tz.offset * 60) % 1440 + 1440) % 1440;
}

export function getSessionsStatus(tzOffset) {
  const now = new Date();
  const utcH = now.getUTCHours();
  const utcM = now.getUTCMinutes();
  const currentMin = utcH * 60 + utcM;
  return SESSIONS.map(s => {
    const openMin = s.open * 60;
    const closeMin = s.close * 60;
    let isOpen;
    if (openMin < closeMin) {
      isOpen = currentMin >= openMin && currentMin < closeMin;
    } else {
      isOpen = currentMin >= openMin || currentMin < closeMin;
    }
    const toTz = (min) => {
      const adj = ((min + tzOffset * 60) % 1440 + 1440) % 1440;
      return `${String(Math.floor(adj / 60)).padStart(2, "0")}:${String(adj % 60).padStart(2, "0")}`;
    };
    return { ...s, isOpen, localOpen: toTz(openMin), localClose: toTz(closeMin) };
  });
}