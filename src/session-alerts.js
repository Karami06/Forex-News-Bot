import { getGroups, getCfg } from "./storage.js";
import { nowInTz, TIMEZONES, SESSIONS } from "./calendar.js";
import { tgSendHTML } from "./telegram.js";
import { t } from "./translations.js";
import { kvGet, kvPut } from "./kv-utils.js";

export async function sendSessionAlerts(env) {
  const gs = await getGroups(env);
  if (!gs.length) return;

  for (const gid of gs) {
    try {
      const cfg = await getCfg(env, gid);
      if (!cfg.sessionAlerts) continue;
      
      const userTz = cfg.tz || "Asia/Tehran";
      const tzNow = nowInTz(userTz);
      const currentHour = tzNow.h;
      const currentMin = tzNow.m;
      const currentMinOfDay = currentHour * 60 + currentMin;

      // Get sessions in user's timezone
      const userTzInfo = TIMEZONES.find(t => t.id === userTz) || TIMEZONES.find(t => t.id === "Asia/Tehran");
      const tzOffset = userTzInfo.offset;
      
      const sessionsWithLocal = SESSIONS.map(s => {
        const openMin = s.open * 60;
        const closeMin = s.close * 60;
        
        // Convert to user's timezone
        let localOpenMin = openMin + tzOffset * 60;
        let localCloseMin = closeMin + tzOffset * 60;
        
        // Normalize to 0-1439
        localOpenMin = ((localOpenMin % 1440) + 1440) % 1440;
        localCloseMin = ((localCloseMin % 1440) + 1440) % 1440;
        
        return {
          ...s,
          localOpenMin,
          localCloseMin,
          localOpen: `${String(Math.floor(localOpenMin / 60)).padStart(2, "0")}:${String(localOpenMin % 60).padStart(2, "0")}`,
          localClose: `${String(Math.floor(localCloseMin / 60)).padStart(2, "0")}:${String(localCloseMin % 60).padStart(2, "0")}`,
        };
      });

      // Check for session open/close events (within 5 minutes)
      for (const s of sessionsWithLocal) {
              // Check open
              if (cfg.sessionAlerts?.open?.includes(s.name)) {
                const openDiff = (currentMinOfDay - s.localOpenMin + 1440) % 1440;
                if (openDiff <= 5 && openDiff >= 0) {
                  const dedupKey = `session_open:${gid}:${s.name}:${new Date().toISOString().slice(0, 10)}`;
                  const alreadySent = await kvGet(env, dedupKey);
                  if (!alreadySent) {
                    const lang = cfg.lang || "en";
                    await tgSendHTML(env, gid, 
                      `🔔 <b>${t(lang, "session_open_alert")}: ${s.icon} ${s.name}</b>\n` +
                      `⏰ ${t(lang, "opened_at")} ${s.localOpen} (${t(lang, "your_timezone")})\n` +
                      `💱 ${t(lang, "active_currencies")}: ${s.currencies.join(", ")}`
                    );
                    await kvPut(env, dedupKey, "1", { expirationTtl: 86400 });
                  }
                }
              }
        
              // Check close
              if (cfg.sessionAlerts?.close?.includes(s.name)) {
                const closeDiff = (currentMinOfDay - s.localCloseMin + 1440) % 1440;
                if (closeDiff <= 5 && closeDiff >= 0) {
                  const dedupKey = `session_close:${gid}:${s.name}:${new Date().toISOString().slice(0, 10)}`;
                  const alreadySent = await kvGet(env, dedupKey);
                  if (!alreadySent) {
                    const lang = cfg.lang || "en";
                    await tgSendHTML(env, gid,
                      `🔔 <b>${t(lang, "session_close_alert")}: ${s.icon} ${s.name}</b>\n` +
                      `⏰ ${t(lang, "closed_at")} ${s.localClose} (${t(lang, "your_timezone")})\n` +
                      `💱 ${t(lang, "active_currencies")}: ${s.currencies.join(", ")}`
                    );
                    await kvPut(env, dedupKey, "1", { expirationTtl: 86400 });
                  }
                }
              }
            }
    } catch (e) { console.log(`Session alerts err ${gid}:`, e); }
  }
}