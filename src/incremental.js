import { fetchIncrementalNews, fetchFullNews } from "./news-core.js";

/**
 * Incremental fetch handler - runs every 15 minutes
 * This is designed to be called from the cron trigger
 */
export async function handleIncrementalFetch(env) {
  console.log("[INCREMENTAL] Starting scheduled incremental fetch");
  try {
    const result = await fetchIncrementalNews(env);
    console.log("[INCREMENTAL] Completed successfully");
    return result;
  } catch (e) {
    console.log("[INCREMENTAL] Failed:", e?.message);
    // Don't throw - let the cron continue, retry will happen on next run
    return { error: e?.message };
  }
}

/**
 * Full weekly fetch handler - runs at 00:00 UTC
 */
export async function handleDailyFullFetch(env) {
  console.log("[WEEKLY] Starting scheduled full fetch");
  try {
    const result = await fetchFullNews(env);
    console.log("[WEEKLY] Completed successfully");
    return result;
  } catch (e) {
    console.log("[WEEKLY] Failed:", e?.message);
    // Don't throw - let the cron continue, retry will happen on next run
    return { error: e?.message };
  }
}