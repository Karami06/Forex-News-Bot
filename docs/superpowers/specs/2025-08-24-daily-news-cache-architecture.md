# Daily News Cache Architecture

**Date:** 2025-08-24  
**Status:** Draft - Pending User Review  
**Related Files:** `src/news-core.js`, `src/storage.js`, `src/alerts.js`, `src/auto-send.js`, `src/index.js`, `wrangler.toml`

---

## 1. Problem Statement

Current architecture: Every request (scheduled send, pre-release alert, manual `/news today`) hits the external Fair Economy API. This creates:
- Unnecessary load on Cloudflare Workers (approaching 100k requests/day limit)
- Redundant API calls for same data
- Latency on user-facing operations
- No resilience if external API is down during the day

**Goal:** Fetch news **once daily at 00:00 UTC** + **incremental refresh every 15 minutes**, store in KV cache, serve all requests from cache.

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLOUDFLARE WORKER                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐  │
│  │  Cron 00:00  │    │  Cron 15min  │    │   Cron 5min      │  │
│  │  (Daily Full)│    │ (Incremental)│    │  (Serve from     │  │
│  └──────┬───────┘    └──────┬───────┘    │   cache only)    │  │
│         │                   │            └────────┬─────────┘  │
│         ▼                   ▼                     │            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    KV STORAGE (single namespace)          │  │
│  │  cached_news:YYYY-MM-DD  →  { events: [...], meta: {...} }│  │
│  │  cached_news:meta        →  { lastFullFetch, lastIncr... } │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            │                                    │
│         ┌──────────────────┼──────────────────┐                 │
│         ▼                  ▼                  ▼                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │
│  │ Pre-release │    │ Scheduled   │    │ Manual CMDs │        │
│  │ Alerts      │    │ Send        │    │ /news today │        │
│  │ (from cache)│    │ (from cache)│    │ (from cache)│        │
│  └─────────────┘    └─────────────┘    └─────────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Data Model

### 3.1 Cache Key Structure
```
cached_news:2025-08-24   →  DailyNewsCache (see below)
cached_news:2025-08-25   →  DailyNewsCache (tomorrow pre-fetched if available)
cached_news:meta         →  CacheMeta
```

### 3.2 DailyNewsCache (JSON)
```typescript
interface DailyNewsCache {
  date: string;                    // "2025-08-24" (UTC)
  fetchedAt: number;               // Unix ms when full fetch completed
  lastIncrementalAt: number;       // Unix ms of last incremental fetch
  events: CachedEvent[];           // ALL events for this date (unfiltered)
  incrementalUpdates: IncrementalUpdate[]; // History of incremental changes
}

interface CachedEvent {
  // Original Fair Economy fields (preserved)
  id: string;
  title: string;
  country: string;
  currency: string;
  impact: "High" | "Medium" | "Low";
  forecast: string | null;
  previous: string | null;
  actual: string | null;           // Filled after release
  date: string;                    // "2025-08-24"
  time: string;                    // "14:30" (UTC)
  timestamp: number;               // Unix ms (UTC)
  
  // Computed fields for fast serving
  preReleaseAt: number;            // timestamp - 5*60*1000 (for alerts)
  sentFlags: {
    preRelease: boolean;           // Pre-release alert sent
    scheduled: boolean;            // Scheduled send done
    postReleaseCheck: boolean;     // 1-min post-release check done
  };
  source: "full" | "incremental";  // Origin of this record
}

interface IncrementalUpdate {
  fetchedAt: number;
  added: number;       // Count of new events
  updated: number;     // Count of updated events (actual value filled, etc.)
  removed: number;     // Count of removed events (rare)
}

interface CacheMeta {
  lastFullFetch: number | null;    // Unix ms
  lastIncrementalFetch: number | null;
  consecutiveFailures: number;     // For alerting
}
```

---

## 4. Cron Jobs

### 4.1 Daily Full Fetch — `0 0 * * *` (00:00 UTC)
**Handler:** `handleDailyFullFetch()`

1. Call `fetchWeeklyNewsFromSource()` (existing function in `news-core.js`)
2. Filter events for **today (UTC)** and **tomorrow (UTC)**
3. For each event:
   - Compute `preReleaseAt = timestamp - 5*60*1000`
   - Initialize `sentFlags = { preRelease: false, scheduled: false, postReleaseCheck: false }`
   - `source = "full"`
4. Write `cached_news:today` and `cached_news:tomorrow` to KV
5. Update `cached_news:meta.lastFullFetch = now`
6. Reset `consecutiveFailures = 0`
7. Log: `INFO [DailyFetch] Fetched N events for 2025-08-24, M for 2025-08-25`

**Retry:** Infinite retries every 5 minutes until success (via cron re-trigger). Each failure increments `consecutiveFailures` and logs to Workers Logs.

---

### 4.2 Incremental Fetch — `*/15 * * * *` (Every 15 minutes)
**Handler:** `handleIncrementalFetch()`

1. Call `fetchWeeklyNewsFromSource()` (same source)
2. Filter events for **today (UTC)** and **tomorrow (UTC)**
3. Load existing `cached_news:today` and `cached_news:tomorrow` from KV
4. For each date, **merge** new data:
   - **New events** (id not in cache): add with `source = "incremental"`, `sentFlags` all false
   - **Updated events** (id exists, but `actual` changed or other fields): update fields, preserve `sentFlags`, `source = "incremental"`
   - **Removed events** (in cache but not in source): mark removed (soft delete) or drop — log warning
5. Write updated caches to KV
6. Update `cached_news:meta.lastIncrementalFetch = now`
7. Append to `incrementalUpdates` array (keep last 50)
8. Log: `INFO [IncrFetch] 2025-08-24: +3 new, 1 updated, 0 removed`

**Retry:** Same as daily — infinite every 5 min via cron.

---

### 4.3 Existing 5-min Cron — `*/5 * * * *` (Unchanged schedule)
**Handler:** `handleScheduledCron()` — **MODIFIED to read ONLY from cache**

Responsibilities (all from cache):
1. **Pre-release alerts**: For each group, find events where `now >= preReleaseAt` and `!sentFlags.preRelease` → send alert, set `sentFlags.preRelease = true`, write back to KV
2. **Scheduled sends**: For each group, if `now >= scheduledTime` and `!sentFlags.scheduled` → send news, set `sentFlags.scheduled = true`, write back
3. **Post-release check (1 min after)**: For events where `now >= timestamp + 60*1000` and `!sentFlags.postReleaseCheck` → 
   - Read event from cache (which now has `actual` from incremental fetch)
   - If `actual` exists: log `INFO [PostRelease] Event X actual: Y`
   - If `actual` missing: log `WARN [PostRelease] Event X — no actual value in source yet`
   - Set `sentFlags.postReleaseCheck = true`, write back

**Critical:** This cron makes **ZERO external API calls**. All reads from KV.

---

## 5. Cache Invalidation & TTL

| Key | TTL | Notes |
|-----|-----|-------|
| `cached_news:YYYY-MM-DD` | 48 hours | Covers today + tomorrow + buffer |
| `cached_news:meta` | 7 days | Long-lived metadata |

Auto-cleanup: In `handleDailyFullFetch()`, delete keys older than 2 days.

---

## 6. Integration Points (Files to Modify)

| File | Changes |
|------|---------|
| `src/news-core.js` | Add `fetchAndCacheDailyNews()`, `fetchAndCacheIncremental()`, `getCachedNews(date)`, `mergeIncrementalNews()` |
| `src/storage.js` | Add `getCachedNews(date)`, `setCachedNews(date, data)`, `getCacheMeta()`, `setCacheMeta(meta)`, `deleteOldCache()` |
| `src/alerts.js` | Refactor `checkAndSendPreReleaseAlerts()` to read from cache via `news-core.getCachedNews()` |
| `src/auto-send.js` | Refactor `sendScheduledNews()` to read from cache |
| `src/index.js` | Register 3 cron handlers: daily (00:00), incremental (15min), scheduled (5min) |
| `wrangler.toml` | Add 2 new cron triggers |

---

## 7. Commands (User-facing) — Read from Cache

| Command | Current | New |
|---------|---------|-----|
| `/news today` | Fetch from source | `news-core.getCachedNews(today)` |
| `/news tomorrow` | Fetch from source | `news-core.getCachedNews(tomorrow)` |
| `/refresh` | Fetch from source | Trigger incremental fetch manually + return cache |

---

## 8. Timezone & Session Handling

- **All timestamps in cache are UTC** (Unix ms + ISO date/time strings)
- **Timezone conversion happens at render time** (existing `translations.js` / formatting logic unchanged)
- **Market sessions**: Calculated from UTC timestamps in cache (existing `calendar.js` unchanged)
- **No timezone bugs**: Cache is timezone-agnostic; presentation layer handles user/group timezone

---

## 9. Logging & Observability

| Event | Level | Details |
|-------|-------|---------|
| Daily fetch start | INFO | "Starting daily full fetch for YYYY-MM-DD" |
| Daily fetch success | INFO | "Cached N events for YYYY-MM-DD" |
| Daily fetch failure | ERROR | "Daily fetch failed: {error}, attempt N" |
| Incremental fetch | INFO | "+A new, B updated, C removed for YYYY-MM-DD" |
| Pre-release sent | INFO | "Pre-release sent for event X to group Y" |
| Scheduled sent | INFO | "Scheduled news sent to group Y (Z events)" |
| Post-release check | INFO/WARN | "Event X actual: Y" / "Event X — no actual value" |
| Cache miss (fallback) | WARN | "Cache miss for YYYY-MM-DD, falling back to source" |

---

## 10. Fallback Behavior

If cache missing (first deploy, or corruption):
1. `getCachedNews(date)` returns `null`
2. Caller falls back to `fetchWeeklyNewsFromSource()` directly (existing behavior)
3. Log `WARN [CacheMiss] Falling back to live fetch for YYYY-MM-DD`
4. Next cron will populate cache normally

---

## 11. Migration / Rollout

1. Deploy with new code + 3 cron triggers
2. At next 00:00 UTC: first daily fetch populates cache
3. At next 15-min mark: first incremental fetch
4. 5-min cron immediately starts reading from cache
5. No manual migration needed — backward compatible

---

## 12. Testing Checklist

- [ ] Daily fetch writes correct structure to KV
- [ ] Incremental fetch merges correctly (new/updated/removed)
- [ ] 5-min cron reads only from KV (no external calls)
- [ ] Pre-release alerts fire at correct time from cache
- [ ] Scheduled sends use cached data
- [ ] Post-release check logs actual value when available
- [ ] Timezone conversion works for groups in different zones
- [ ] Market sessions display correctly from cached UTC times
- [ ] Fallback works when cache empty
- [ ] Cache TTL cleanup removes old keys
- [ ] Retry logic works (simulate source failure)

---

## 13. Open Questions (Resolved in Brainstorming)

| # | Question | Decision |
|---|----------|----------|
| 1 | KV namespace | Existing KV with `cached_news:` prefix |
| 2 | Daily fetch time | 00:00 UTC |
| 3 | Retry policy | Infinite every 5 min, log to Workers Logs |
| 4 | Pre-release with incremental | Computed at full fetch; incremental adds new events with preReleaseAt |
| 5 | Incremental frequency | Every 15 minutes |
| 6 | Post-release check | In 5-min cron, reads from cache (populated by incremental) |
| 7 | Post-release frequency | Every 1 minute via 5-min cron checking `timestamp + 1min` |

---

## 14. Next Steps

1. **User reviews this spec** → approve or request changes
2. Run `skill_view("superpowers:writing-plans")` to create implementation plan
3. Implement with `skill_view("superpowers:test-driven-development")` (TDD)
4. `skill_view("superpowers:requesting-code-review")` before merge
5. `skill_view("superpowers:finishing-a-development-branch")` for PR/merge