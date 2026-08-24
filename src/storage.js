import { DEFAULT_CURRENCIES, DEFAULT_IMPACT, DEFAULT_TZ } from "./config.js";

export async function getGroups(env) {
  try {
    const v = await env.KV.get("g:list");
    return v ? JSON.parse(v) : [];
  } catch (e) {
    console.log("getGroups parse error:", e);
    return [];
  }
}

export async function addGroup(env, gid) {
  const gs = await getGroups(env);
  if (!gs.includes(gid)) {
    gs.push(gid);
    await env.KV.put("g:list", JSON.stringify(gs));
    return true;
  }
  return false;
}

export async function rmGroup(env, gid) {
  const gs = await getGroups(env);
  const i = gs.indexOf(gid);
  if (i >= 0) {
    gs.splice(i, 1);
    await env.KV.put("g:list", JSON.stringify(gs));
    for (const k of ["c", "cc", "i", "tt", "tm", "tz", "lang", "subs", "pre", "post", "auto", "days"])
      await env.KV.delete(`g:${gid}:${k}`);
    return true;
  }
  return false;
}

export async function getCfg(env, gid) {
  const c = {
    c: [...DEFAULT_CURRENCIES],
    cc: [],
    i: [...DEFAULT_IMPACT],
    tt: "12:00",
    tm: "00:00",
    tz: DEFAULT_TZ,
    lang: "en",
    subs: [],
    pre: true,
    post: true,
    auto: true,
    days: [],
    weekend: true,
    compact: false,
    sessionAlerts: { open: [], close: [] },
    dailyRecap: false,  // Daily recap at end of day
  };
  try {
    for (const k of ["c", "cc", "i", "subs", "days"]) {
      const v = await env.KV.get(`g:${gid}:${k}`);
      if (v) c[k] = JSON.parse(v);
    }
    for (const k of ["tt", "tm", "tz", "lang"]) {
      const v = await env.KV.get(`g:${gid}:${k}`);
      if (v) c[k] = v;
    }
    const preVal = await env.KV.get(`g:${gid}:pre`);
    if (preVal !== null) c.pre = preVal === "true";
    const postVal = await env.KV.get(`g:${gid}:post`);
    if (postVal !== null) c.post = postVal === "true";
    const autoVal = await env.KV.get(`g:${gid}:auto`);
    if (autoVal !== null) c.auto = autoVal === "true";
    const weekendVal = await env.KV.get(`g:${gid}:weekend`);
    if (weekendVal !== null) c.weekend = weekendVal === "true";
    const compactVal = await env.KV.get(`g:${gid}:compact`);
    if (compactVal !== null) c.compact = compactVal === "true";
    const sessionAlertsVal = await env.KV.get(`g:${gid}:sessionAlerts`);
    if (sessionAlertsVal !== null) c.sessionAlerts = JSON.parse(sessionAlertsVal);
    const dailyRecapVal = await env.KV.get(`g:${gid}:dailyRecap`);
    if (dailyRecapVal !== null) c.dailyRecap = dailyRecapVal === "true";
  } catch {}
  return c;
}

export async function setCfg(env, gid, k, v) {
  await env.KV.put(`g:${gid}:${k}`, typeof v === "string" ? v : JSON.stringify(v));
}