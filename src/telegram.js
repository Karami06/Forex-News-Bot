const TG = "https://api.telegram.org/bot";

export async function tgApi(env, method, body, retry = true) {
  const token = env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.error("[TG] TELEGRAM_BOT_TOKEN is not set in environment variables");
    return null;
  }
  try {
    const r = await fetch(`${TG}${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await r.json();
    if (r.status === 429 && retry) {
      const retryAfter = (data.parameters?.retry_after || 1) * 1000;
      console.log(`TG rate limited, waiting ${retryAfter}ms`);
      await new Promise(r => setTimeout(r, retryAfter + 100));
      return tgApi(env, method, body, false);
    }
    return data;
  } catch (e) {
    console.log(`TG ${method}:`, e);
    return null;
  }
}

export async function tgSend(env, cid, text, rm) {
  const body = { chat_id: cid, text, disable_web_page_preview: true, parse_mode: "Markdown" };
  if (rm) body.reply_markup = rm;
  return tgApi(env, "sendMessage", body);
}

export async function tgSendPlain(env, cid, text) {
  const body = { chat_id: cid, text, disable_web_page_preview: true };
  return tgApi(env, "sendMessage", body);
}

export async function tgSendHTML(env, cid, text) {
  const body = { chat_id: cid, text, disable_web_page_preview: true, parse_mode: "HTML" };
  return tgApi(env, "sendMessage", body);
}

export async function tgEdit(env, cid, mid, text, rm) {
  const body = { chat_id: cid, message_id: mid, text, parse_mode: "Markdown" };
  if (rm) body.reply_markup = rm;
  return tgApi(env, "editMessageText", body);
}

export async function tgAnswer(env, cbid, text, alert) {
  return tgApi(env, "answerCallbackQuery", {
    callback_query_id: cbid,
    text,
    show_alert: !!alert,
  });
}

export function getAdminIds(env) {
  const s = env.ADMIN_USER_IDS || "";
  return s ? s.split(",").map(x => parseInt(x.trim())).filter(x => !isNaN(x)) : [];
}

export function isAdmin(env, uid) {
  const a = getAdminIds(env);
  return !a.length || a.includes(uid);
}