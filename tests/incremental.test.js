import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { handleIncrementalFetch, handleDailyFullFetch } from '../src/incremental.js';
import { getDailyCache, getMeta } from '../src/cache.js';

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

// Raw API format (what Fair Economy actually returns)
const sampleRawApiData = [
  { date: '2025-08-24T12:00:00.000Z', country: 'US', title: 'CPI', impact: 'High', actual: '', forecast: '3.0%', previous: '2.9%' },
  { date: '2025-08-24T14:30:00.000Z', country: 'EU', title: 'ECB Rate Decision', impact: 'High', actual: '', forecast: '4.25%', previous: '4.25%' },
  { date: '2025-08-25T12:00:00.000Z', country: 'US', title: 'PPI', impact: 'Medium', actual: '', forecast: '2.5%', previous: '2.4%' },
];

const createMockFetch = (responseData) => {
  return vi.fn(async (url) => ({
    ok: true,
    json: async () => responseData
  }));
};

describe('incremental.js', () => {
  let mockEnv;
  let mockKV;
  let originalFetch;

  beforeEach(() => {
    mockKV = createMockKV();
    mockEnv = { KV: mockKV };
    originalFetch = global.fetch;
    global.fetch = createMockFetch(sampleRawApiData);
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-08-24T12:00:00.000Z'));
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.useRealTimers();
  });

  describe('handleDailyFullFetch', () => {
    it('should run full fetch and populate cache', async () => {
      const result = await handleDailyFullFetch(mockEnv);
      
      expect(result).toHaveProperty('today');
      expect(result).toHaveProperty('tomorrow');
      expect(result.today.length).toBe(2);
      expect(result.tomorrow.length).toBe(1);
      
      const todayCache = await getDailyCache(mockEnv, '2025-08-24');
      expect(todayCache.events).toHaveLength(2);
      
      const meta = await getMeta(mockEnv);
      expect(meta.lastFullFetch).toBeDefined();
      expect(meta.consecutiveFailures).toBe(0);
    });

    it('should handle fetch failure gracefully', async () => {
      global.fetch = createMockFetch([]);
      
      const result = await handleDailyFullFetch(mockEnv);
      
      expect(result).toHaveProperty('error');
    });
  });

  describe('handleIncrementalFetch', () => {
    beforeEach(async () => {
      await handleDailyFullFetch(mockEnv);
    });

    it('should run incremental fetch and merge results', async () => {
      const newData = [
        ...sampleRawApiData,
        { date: '2025-08-24T16:00:00.000Z', country: 'JP', title: 'BoJ Meeting', impact: 'High', actual: '', forecast: '', previous: '' }
      ];
      global.fetch = createMockFetch(newData);
      
      const result = await handleIncrementalFetch(mockEnv);
      
      expect(result).toHaveProperty('today');
      // After full fetch, IDs match so new item is "added", existing are "updated"
      expect(result.today.added).toBe(1);
      expect(result.today.updated).toBe(2);
      
      const todayCache = await getDailyCache(mockEnv, '2025-08-24');
      expect(todayCache.events.length).toBe(3);
    });

    it('should update meta lastIncrementalFetch', async () => {
      await handleIncrementalFetch(mockEnv);
      
      const meta = await getMeta(mockEnv);
      expect(meta.lastIncrementalFetch).toBeDefined();
    });

    it('should handle fetch failure gracefully', async () => {
      global.fetch = createMockFetch([]);
      
      const result = await handleIncrementalFetch(mockEnv);
      
      expect(result).toHaveProperty('error');
    });
  });
});