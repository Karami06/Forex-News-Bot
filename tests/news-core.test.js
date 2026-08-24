import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { fetchNews, fetchFullNews, fetchIncrementalNews, getCachedNews, cacheModuleReady } from '../src/news-core.js';
import { getDailyCache, setDailyCache, getMeta } from '../src/cache.js';

// Mock KV namespace
const createMockKV = () => {
  const store = new Map();
  return {
    get: vi.fn(async (key) => store.get(key) || null),
    put: vi.fn(async (key, value, options) => { store.set(key, value); }),
    delete: vi.fn(async (key) => { store.delete(key); }),
    list: vi.fn(async () => ({ keys: Array.from(store.keys()).map(name => ({ name })) })),
    _store: store
  };
};

// Mock global fetch
const createMockFetch = (responseData) => {
  return vi.fn(async (url) => ({
    ok: true,
    json: async () => responseData
  }));
};

describe('news-core.js', () => {
  let mockEnv;
  let mockKV;
  let originalFetch;

  const sampleRawData = [
    { date: '2025-08-24T12:00:00.000Z', country: 'US', title: 'CPI', impact: 'High', actual: '', forecast: '3.0%', previous: '2.9%' },
    { date: '2025-08-24T14:30:00.000Z', country: 'EU', title: 'ECB Rate Decision', impact: 'High', actual: '', forecast: '4.25%', previous: '4.25%' },
    { date: '2025-08-25T12:00:00.000Z', country: 'US', title: 'PPI', impact: 'Medium', actual: '', forecast: '2.5%', previous: '2.4%' },
  ];

  beforeEach(() => {
    mockKV = createMockKV();
    mockEnv = { KV: mockKV };
    originalFetch = global.fetch;
    global.fetch = createMockFetch(sampleRawData);
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-08-24T12:00:00.000Z'));
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.useRealTimers();
  });

  describe('fetchFullNews', () => {
    it('should fetch from source and populate cache for today and tomorrow', async () => {
      const result = await fetchFullNews(mockEnv);
      
      expect(result.today).toHaveLength(2);
      expect(result.tomorrow).toHaveLength(1);
      
      // Check cache was populated
      const todayCache = await getDailyCache(mockEnv, '2025-08-24');
      const tomorrowCache = await getDailyCache(mockEnv, '2025-08-25');
      
      expect(todayCache.events).toHaveLength(2);
      expect(tomorrowCache.events).toHaveLength(1);
      
      // Check events have computed fields
      expect(todayCache.events[0]).toMatchObject({
        id: expect.any(String),
        title: 'CPI',
        country: 'US',
        preReleaseAt: expect.any(Number),
        sentFlags: { preRelease: false, scheduled: false, postReleaseCheck: false },
        source: 'full'
      });
    });

    it('should update meta with lastFullFetch', async () => {
      await fetchFullNews(mockEnv);
      
      const meta = await getMeta(mockEnv);
      expect(meta.lastFullFetch).toBeDefined();
      expect(meta.consecutiveFailures).toBe(0);
    });

    it('should throw if source returns empty', async () => {
      global.fetch = createMockFetch([]);
      
      await expect(fetchFullNews(mockEnv)).rejects.toThrow('Full fetch returned no items');
    });
  });

  describe('fetchIncrementalNews', () => {
    beforeEach(async () => {
      // First populate cache with full fetch
      await fetchFullNews(mockEnv);
    });

    it('should merge new items into cache', async () => {
      // New data with one new item for today
      const newData = [
        ...sampleRawData,
        { date: '2025-08-24T16:00:00.000Z', country: 'JP', title: 'BoJ Meeting', impact: 'High', actual: '', forecast: '', previous: '' }
      ];
      global.fetch = createMockFetch(newData);
      
      const result = await fetchIncrementalNews(mockEnv);
      
      // 2 existing items (CPI, ECB) are updated, 1 new (BoJ) is added
      expect(result.today.added).toBe(1);
      expect(result.today.updated).toBe(2);
      
      const todayCache = await getDailyCache(mockEnv, '2025-08-24');
      expect(todayCache.events).toHaveLength(3);
    });

    it('should update existing events with actual values', async () => {
      // Same items but with actual values filled
      const updatedData = sampleRawData.map(item => ({
        ...item,
        actual: item.title === 'CPI' ? '3.1%' : item.actual
      }));
      global.fetch = createMockFetch(updatedData);
      
      const result = await fetchIncrementalNews(mockEnv);
      
      // Both CPI and ECB are "updated" (even though only CPI has actual value change)
      expect(result.today.updated).toBe(2);
      
      const todayCache = await getDailyCache(mockEnv, '2025-08-24');
      const cpiEvent = todayCache.events.find(e => e.title === 'CPI');
      expect(cpiEvent.actual).toBe('3.1%');
    });

    it('should track removed events', async () => {
      // Remove one item
      const reducedData = sampleRawData.filter(item => item.title !== 'CPI');
      global.fetch = createMockFetch(reducedData);
      
      const result = await fetchIncrementalNews(mockEnv);
      
      expect(result.today.removed).toBe(1);
      
      const todayCache = await getDailyCache(mockEnv, '2025-08-24');
      expect(todayCache.events).toHaveLength(1);
      expect(todayCache.events[0].title).toBe('ECB Rate Decision');
    });

    it('should update meta lastIncrementalFetch', async () => {
      await fetchIncrementalNews(mockEnv);
      
      const meta = await getMeta(mockEnv);
      expect(meta.lastIncrementalFetch).toBeDefined();
    });
  });

  describe('fetchNews (user-facing)', () => {
    it('should return cached data when available', async () => {
      await fetchFullNews(mockEnv);
      
      const news = await fetchNews(mockEnv);
      
      expect(news).toHaveLength(2);
      expect(news[0]).toMatchObject({
        c: 'US',
        e: 'CPI',
        i: 'high'
      });
    });

    it('should fall back to full fetch when cache empty', async () => {
      const news = await fetchNews(mockEnv);
      
      expect(news).toHaveLength(2);
    });

    it('should return empty array when both cache and fetch fail', async () => {
      global.fetch = createMockFetch([]);
      
      const news = await fetchNews(mockEnv);
      
      expect(news).toEqual([]);
    });
  });

  describe('getCachedNews', () => {
    it('should return cached events in legacy format', async () => {
      await fetchFullNews(mockEnv);
      
      const news = await getCachedNews(mockEnv, '2025-08-24');
      
      expect(news).toHaveLength(2);
      expect(news[0]).toMatchObject({
        _rawDate: expect.any(String),
        _utcMs: expect.any(Number),
        c: 'US',
        e: 'CPI',
        i: 'high'
      });
    });

    it('should return empty array for missing cache', async () => {
      const news = await getCachedNews(mockEnv, '2025-08-20');
      expect(news).toEqual([]);
    });
  });

  describe('cacheModuleReady', () => {
    it('should return true when cache has data', async () => {
      await fetchFullNews(mockEnv);
      
      const ready = await cacheModuleReady(mockEnv);
      expect(ready).toBe(true);
    });

    it('should return false when cache is empty', async () => {
      const ready = await cacheModuleReady(mockEnv);
      expect(ready).toBe(false);
    });
  });
});