import { fetchNews, filterNews, fmtNews, fmtWeeklyCalendar, refreshNews, getEventTimeInTz } from "./news-core.js";
import { todayInTz, tomorrowInTz } from "./calendar.js";
import { tgApi, tgSendHTML } from "./telegram.js";
import { mainMenuKb, calendarKb } from "./keyboards.js";

export { fetchNews, filterNews, fmtNews, fmtWeeklyCalendar, refreshNews, getEventTimeInTz };

export async function handleNews(env, cid, mid, nt, cfg, lang) {
  const userTz = cfg.tz || "Asia/Tehran";
  const todayDate = todayInTz(userTz);
  const tomorrowDate = tomorrowInTz(userTz);
  const news = await fetchNews(env);
  const filtered = filterNews(news, cfg.c, cfg.i, cfg.cc);
  const targetDate = nt === "today" ? todayDate : tomorrowDate;
  const dayItems = filtered.filter(item => {
    const evt = getEventTimeInTz(item, userTz);
    return evt._date === targetDate;
  });
  console.log(`[NEWS] nt=${nt} tz=${userTz} today=${todayDate} tomorrow=${tomorrowDate} target=${targetDate} raw=${news.length} filtered=${filtered.length} dayItems=${dayItems.length}`);
  if (news.length > 0 && filtered.length === 0) {
    console.log(`[NEWS] cfg.c=${JSON.stringify(cfg.c)} cfg.i=${JSON.stringify(cfg.i)} sample=${JSON.stringify(news[0])}`);
  }
  const msg = fmtNews(dayItems, nt, cfg);
  console.log("[NEWS] msg length:", msg.length, "preview:", msg.slice(0, 100));
  if (msg.length > 4000) {
    await tgApi(env, "editMessageText", { chat_id: cid, message_id: mid, text: msg.slice(0, 4000), parse_mode: "HTML", reply_markup: mainMenuKb(lang) });
    const rest = msg.slice(4000);
    for (let i = 0; i < rest.length; i += 4000) {
      await tgSendHTML(env, cid, rest.slice(i, i + 4000));
    }
  } else {
    await tgApi(env, "editMessageText", { chat_id: cid, message_id: mid, text: msg, parse_mode: "HTML", reply_markup: mainMenuKb(lang) });
  }
}

export async function handleWeeklyCalendar(env, cid, mid, cfg, lang) {
  const news = await fetchNews(env);
  const msg = fmtWeeklyCalendar(news, cfg);
  if (msg.length > 4000) {
    await tgApi(env, "editMessageText", { chat_id: cid, message_id: mid, text: msg.slice(0, 4000), parse_mode: "Markdown", reply_markup: calendarKb(lang) });
    const rest = msg.slice(4000);
    for (let i = 0; i < rest.length; i += 4000) {
      await tgSendHTML(env, cid, rest.slice(i, i + 4000));
    }
  } else {
    await tgApi(env, "editMessageText", { chat_id: cid, message_id: mid, text: msg, parse_mode: "Markdown", reply_markup: calendarKb(lang) });
  }
}