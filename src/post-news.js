import { getGroups, getCfg } from "./storage.js";
import { refreshNews, filterNews, getEventTimeInTz } from "./news-core.js";
import { nowInTz, todayInTz } from "./calendar.js";
import { tgSendHTML } from "./telegram.js";
import { TV_DEFAULT, tvLink } from "./config.js";
import { t } from "./translations.js";

function parseNumeric(val) {
  if (!val || val === "-" || val === "") return NaN;
  const cleaned = String(val).replace(/[^0-9.-]/g, "");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? NaN : parsed;
}

/**
 * Safe KV operations with error handling
 */
async function kvGet(env, key) {
  try {
    return await env.KV.get(key);
  } catch (e) {
    console.log(`[KV GET ERROR] ${key}:`, e?.message);
    return null;
  }
}

async function kvPut(env, key, value, options = {}) {
  try {
    return await env.KV.put(key, value, options);
  } catch (e) {
    console.log(`[KV PUT ERROR] ${key}:`, e?.message);
    return false;
  }
}

async function kvDelete(env, key) {
  try {
    return await env.KV.delete(key);
  } catch (e) {
    console.log(`[KV DELETE ERROR] ${key}:`, e?.message);
    return false;
  }
}

export async function sendPostNews(env) {
  const gs = await getGroups(env);
  if (!gs.length) return;

  const news = await refreshNews(env);
  if (!news.length) return;

  const now = Date.now();

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
      const filtered = filterNews(news, cfg.c || [], cfg.i || [], cfg.cc || []);
      const todayItems = filtered.filter(item => {
        const evt = getEventTimeInTz(item, userTz);
        return evt._date === todayDate;
      });

      for (const item of todayItems) {
        const evt = getEventTimeInTz(item, userTz);
        const [h, m] = evt.t.split(":").map(Number);
        const eventMin = h * 60 + m;

        // چک کردن اینکه آیا actual موجود است یا نه
        const hasActual = item.a != null && item.a !== "" && item.a !== "-" && item.a !== "?";

        if (hasActual && currentMin >= eventMin) {
          // رویداد منتشر شده و actual داریم — ارسال اصلی
          const dedupKey = `post:${gid}:${evt._date}:${evt.t}:${item.e}`;
          const alreadySent = await kvGet(env, dedupKey);
          if (alreadySent) continue;

          const lang = cfg.lang || "en";
          const tvPair = TV_DEFAULT[item.c.toUpperCase()];
          const tvLinkStr = tvPair ? `\n\u{1F310} <a href="${tvLink(tvPair)}">${t(lang, "trading_view")}</a>` : "";
          const impactEmoji = item.i === "high" ? "\u{1F534}" : item.i === "medium" ? "\u{1F7E1}" : "\u{1F7E2}";

          let msg = `\u{1F4CA} <b>${t(lang, "post_release")}: ${item.c} | ${item.e}</b> ${impactEmoji}\n`;
          msg += `\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\n`;
          msg += `<b>${t(lang, "previous")}:</b> ${item.p || "-"}\n`;
          msg += `<b>${t(lang, "forecast")}:</b> ${item.f || "-"}\n`;
          msg += `<b>${t(lang, "actual")}:</b> ${item.a}`;

          if (item.f && item.f !== "-" && item.a !== "-") {
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
          await kvPut(env, dedupKey, "1", { expirationTtl: 86400 });

          // اگر pulse برای این رویداد فعال بود، پاک میکنیم (اصلی ارسال شده)
          // Atomic: only delete if pulse hasn't sent yet
          const pulseKey = `pulse_scheduled:${item.e}:${item.c}:${gid}`;
          await kvDelete(env, pulseKey);
        } else if (!hasActual && currentMin >= eventMin) {
          // رویداد منتشر شده اما actual هنوز نیامده — pulse schedule میکنیم
          const pulseKey = `pulse_scheduled:${item.e}:${item.c}:${gid}`;
          const sentPulse = await kvGet(env, pulseKey);
          if (!sentPulse) {
            await kvPut(env, pulseKey, "1", { expirationTtl: 900 }); // 15 دقیقه
          }
        }
        // اگر actual خالی است و رویداد هنوز منتشر نشده → کاری نمیکنیم (زمانش نرسیده)
      }
    } catch (e) { console.log(`Post-news err ${gid}:`, e); }
  }
}

/**
 * Pulse runner: چک می‌کند آیا برای یک رویداد که قبلاً pulse برنامه‌ریزی کرده‌ایم،
 * actual جدید دریافت شده است یا خیر.
 * این تابع باید هر 1 دقیقه فراخوانی شود (cron جداگانه * * * * * در wrangler.toml)
 */
export async function runPostPulse(env) {
  const gs = await getGroups(env);
  if (!gs.length) return;

  const news = await refreshNews(env);
  if (!news.length) return;

  const now = Date.now();

  for (const gid of gs) {
    try {
      const cfg = await getCfg(env, gid);
      if (cfg.post === false) continue;

      // Weekend Silence در pulse هم اعمال شود
      const userTz = cfg.tz || "Asia/Tehran";
      const tzNow = nowInTz(userTz);
      if (cfg.weekend !== false) {
        const dayNames = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
        const todayName = dayNames[tzNow.getUTCDay()];
        if (todayName === "sat" || todayName === "sun") continue;
      }

      const todayDate = todayInTz(userTz);
      const filtered = filterNews(news, cfg.c || [], cfg.i || [], cfg.cc || []);
      
      // فقط آیتم‌هایی که در 15 دقیقه اخیر انتشار یافته‌اند (زمان انتشار گذشته) و pulse برایشان فعال است
      const recentItems = filtered.filter(item => {
        const evt = getEventTimeInTz(item, userTz);
        return evt._date === todayDate && item._utcMs <= now && item._utcMs > now - 900000;
      });

      for (const item of recentItems) {
        const hasActual = item.a != null && item.a !== "" && item.a !== "-" && item.a !== "?";
        if (!hasActual) continue; // هنوز actual نیامده

        const pulseKey = `pulse_scheduled:${item.e}:${item.c}:${gid}`;
        const wasScheduled = await kvGet(env, pulseKey);
        if (!wasScheduled) continue; // pulse برای این رویداد فعال نبود

        // جلوگیری از ارسال تکراری — چک sent (atomic check-and-set pattern)
        const sentKey = `${pulseKey}:sent`;
        const alreadySent = await kvGet(env, sentKey);
        if (alreadySent) {
          // پاکسازی pulse_scheduled اگر قبلاً ارسال شده
          await kvDelete(env, pulseKey);
          continue;
        }

        // Atomic: set sent key with NX-like behavior using expirationTtl
        // Since KV doesn't have NX, we check then set (small race window acceptable)
        const setResult = await kvPut(env, sentKey, "1", { expirationTtl: 86400 });
        if (!setResult) continue; // KV error, skip

        // ارسال پیام فالو‑اپ
        const lang = cfg.lang || "en";
        const evt = getEventTimeInTz(item, userTz);
        const msg = `📢 <b>به‌روزرسانی:</b> ${item.e} ${item.c}\n` +
          `✅ A: ${item.a} | F: ${item.f || "-"} | P: ${item.p || "-"}\n` +
          `🕒 ${evt.t}`;

        await tgSendHTML(env, gid, msg);
        await kvDelete(env, pulseKey); // پاکسازی pulse_scheduled
      }
    } catch (e) { console.log(`[POST-PULSE] err ${gid}:`, e); }
  }
}