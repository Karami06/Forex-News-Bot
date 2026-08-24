import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getDailyCache, setDailyCache, getMeta, setMeta, mergeIncremental, deleteOldCache } from '../src/cache.js';

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

describe('cache.js', () => {
  let mockEnv;
  let mockKV;

  beforeEach(() => {
    mockKV = createMockKV();
    mockEnv = { KV: mockKV };
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-08-24T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getDailyCache / setDailyCache', () => {
    it('should return null for non-existent cache', async () => {
      const result = await getDailyCache(mockEnv, '2025-08-24');
      expect(result).toBeNull();
    });

    it('should store and retrieve cache data', async () => {
      const testData = { date: '2025-08-24', events: [{ id: '1', title: 'Test' }] };
      await setDailyCache(mockEnv, '2025-08-24', testData);
      const result = await getDailyCache(mockEnv, '2025-08-24');
      expect(result).toEqual(testData);
    });

    it('should use correct key prefix', async () => {
      await setDailyCache(mockEnv, '2025-08-24', { date: '2025-08-24', events: [] });
      expect(mockKV.put).toHaveBeenCalledWith(
        'cached_news:2025-08-24',
        expect.any(String),
        expect.objectContaining({ expirationTtl: 172800 }) // 48 hours
      );
    });
  });

  describe('getMeta / setMeta', () => {
    it('should return null for non-existent meta', async () => {
      const result = await getMeta(mockEnv);
      expect(result).toBeNull();
    });

    it('should store and retrieve meta', async () => {
      const meta = { lastFullFetch: Date.now(), consecutiveFailures: 0 };
      await setMeta(mockEnv, meta);
      const result = await getMeta(mockEnv);
      expect(result).toEqual(meta);
    });

    it('should use correct meta key with 7-day TTL', async () => {
      await setMeta(mockEnv, { lastFullFetch: 0 });
      expect(mockKV.put).toHaveBeenCalledWith(
        'cached_news:meta',
        expect.any(String),
        expect.objectContaining({ expirationTtl: 604800 }) // 7 days
      );
    });
  });

  describe('mergeIncremental', () => {
    it('should add new events to existing cache', async () => {
      // Pre-populate cache
      const existing = {
        date: '2025-08-24',
        fetchedAt: Date.now() - 3600000,
        lastIncrementalAt: Date.now() - 3600000,
        events: [
          { id: '1', title: 'Event 1', _utcMs: 1000, preReleaseAt: 1000 - 300000, sentFlags: { preRelease: false, scheduled: false, postReleaseCheck: false }, source: 'full' }
        ],
        incrementalUpdates: []
      };
      await setDailyCache(mockEnv, '2025-08-24', existing);

      // Fresh items from source (2 new)
      const fresh = [
        { id: '1', title: 'Event 1', country: 'US', currency: 'USD', impact: 'High', forecast: '', previous: '', actual: '', date: '2025-08-24', time: '12:00', timestamp: 1000 },
        { id: '2', title: 'Event 2', country: 'EU', currency: 'EUR', impact: 'Medium', forecast: '', previous: '', actual: '', date: '2025-08-24', time: '13:00', timestamp: 2000 },
        { id: '3', title: 'Event 3', country: 'JP', currency: 'JPY', impact: 'Low', forecast: '', previous: '', actual: '', date: '2025-08-24', time: '14:00', timestamp: 3000 }
      ];

      const result = await mergeIncremental(mockEnv, '2025-08-24', fresh);

      expect(result.added).toBe(2); // id 2 and 3 are new
      expect(result.updated).toBe(1); // id 1 already exists, gets updated
      expect(result.removed).toBe(0);

      const cache = await getDailyCache(mockEnv, '2025-08-24');
      expect(cache.events).toHaveLength(3);
    });

    it('should update existing events with new actual values', async () => {
      const existing = {
        date: '2025-08-24',
        fetchedAt: Date.now() - 3600000,
        lastIncrementalAt: Date.now() - 3600000,
        events: [
          { id: '1', title: 'Event 1', _utcMs: 1000, preReleaseAt: 1000 - 300000, sentFlags: { preRelease: true, scheduled: true, postReleaseCheck: false }, source: 'full' }
        ],
        incrementalUpdates: []
      };
      await setDailyCache(mockEnv, '2025-08-24', existing);

      // Fresh item with actual value filled in
      const fresh = [
        { id: '1', title: 'Event 1', country: 'US', currency: 'USD', impact: 'High', forecast: '1.5%', previous: '1.3%', actual: '1.6%', date: '2025-08-24', time: '12:00', timestamp: 1000 }
      ];

      const result = await mergeIncremental(mockEnv, '2025-08-24', fresh);

      expect(result.added).toBe(0);
      expect(result.updated).toBe(1);
      expect(result.removed).toBe(0);

      const cache = await getDailyCache(mockEnv, '2025-08-24');
      expect(cache.events[0].actual).toBe('1.6%');
      // sentFlags should be preserved
      expect(cache.events[0].sentFlags.preRelease).toBe(true);
      expect(cache.events[0].sentFlags.scheduled).toBe(true);
    });

    it('should track removed events', async () => {
      const existing = {
        date: '2025-08-24',
        fetchedAt: Date.now() - 3600000,
        lastIncrementalAt: Date.now() - 3600000,
        events: [
          { id: '1', title: 'Event 1', _utcMs: 1000, preReleaseAt: 1000 - 300000, sentFlags: { preRelease: false, scheduled: false, postReleaseCheck: false }, source: 'full' },
          { id: '2', title: 'Event 2', _utcMs: 2000, preReleaseAt: 2000 - 300000, sentFlags: { preRelease: false, scheduled: false, postReleaseCheck: false }, source: 'full' }
        ],
        incrementalUpdates: []
      };
      await setDailyCache(mockEnv, '2025-08-24', existing);

      // Fresh items missing id '2'
      const fresh = [
        { id: '1', title: 'Event 1', country: 'US', currency: 'USD', impact: 'High', forecast: '', previous: '', actual: '', date: '2025-08-24', time: '12:00', timestamp: 1000 }
      ];

      const result = await mergeIncremental(mockEnv, '2025-08-24', fresh);

      expect(result.removed).toBe(1);
      const cache = await getDailyCache(mockEnv, '2025-08-24');
      expect(cache.events).toHaveLength(1);
      expect(cache.events[0].id).toBe('1');
    });

    it('should record incremental update in history', async () => {
      await setDailyCache(mockEnv, '2025-08-24', { date: '2025-08-24', fetchedAt: 0, lastIncrementalAt: 0, events: [], incrementalUpdates: [] });

      const fresh = [{ id: '1', title: 'Event 1', country: 'US', currency: 'USD', impact: 'High', forecast: '', previous: '', actual: '', date: '2025-08-24', time: '12:00', timestamp: 1000 }];

      await mergeIncremental(mockEnv, '2025-08-24', fresh);

      const cache = await getDailyCache(mockEnv, '2025-08-24');
      expect(cache.incrementalUpdates).toHaveLength(1);
      expect(cache.incrementalUpdates[0]).toMatchObject({ added: 1, updated: 0, removed: 0 });
    });

    it('should keep only last 50 incremental updates', async () => {
      const updates = Array.from({ length: 55 }, (_, i) => ({
        fetchedAt: Date.now() - i * 1000,
        added: 1,
        updated: 0,
        removed: 0
      }));
      await setDailyCache(mockEnv, '2025-08-24', { date: '2025-08-24', fetchedAt: 0, lastIncrementalAt: 0, events: [], incrementalUpdates: updates });

      const fresh = [{ id: 'new', title: 'New', country: 'US', currency: 'USD', impact: 'High', forecast: '', previous: '', actual: '', date: '2025-08-24', time: '12:00', timestamp: Date.now() }];
      await mergeIncremental(mockEnv, '2025-08-24', fresh);

      const cache = await getDailyCache(mockEnv, '2025-08-24');
      expect(cache.incrementalUpdates.length).toBe(50);
    });
  });

  describe('deleteOldCache', () => {
    it('should delete keys older than 2 days', async () => {
      // Add some old keys
      mockKV._store.set('cached_news:2025-08-20', 'old');
      mockKV._store.set('cached_news:2025-08-21', 'old');
      mockKV._store.set('cached_news:2025-08-22', 'recent');
      mockKV._store.set('cached_news:2025-08-23', 'recent');
      mockKV._store.set('cached_news:2025-08-24', 'today');

      await deleteOldCache(mockEnv);

      expect(mockKV.delete).toHaveBeenCalledWith('cached_news:2025-08-20');
      expect(mockKV.delete).toHaveBeenCalledWith('cached_news:2025-08-21');
      expect(mockKV.delete).not.toHaveBeenCalledWith('cached_news:2025-08-22');
      expect(mockKV.delete).not.toHaveBeenCalledWith('cached_news:2025-08-23');
      expect(mockKV.delete).not.toHaveBeenCalledWith('cached_news:2025-08-24');
    });
  });
});