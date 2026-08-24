import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Setup hoisted mocks
const { mockTgSendPlain, mockTgSendHTML, mockTgApi } = vi.hoisted(() => ({
  mockTgSendPlain: vi.fn(async () => ({ ok: true })),
  mockTgSendHTML: vi.fn(async () => ({ ok: true })),
  mockTgApi: vi.fn(async () => ({ ok: true }))
}));

vi.mock('../src/telegram.js', () => ({
  tgSendPlain: mockTgSendPlain,
  tgSendHTML: mockTgSendHTML,
  tgApi: mockTgApi,
  tgSend: vi.fn(async () => ({ ok: true }))
}));

vi.mock('../src/storage.js', async () => {
  const actual = await vi.importActual('../src/storage.js');
  return {
    ...actual,
    getGroups: vi.fn(async (env) => {
      const v = await env.KV.get('g:list');
      return v ? JSON.parse(v) : [];
    }),
    getCfg: vi.fn(async (env, gid) => {
      const c = {
        c: ['EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'USDCAD', 'NZDUSD'],
        cc: [],
        i: ['high', 'medium', 'low'],
        tt: '12:00',
        tm: '00:00',
        tz: 'Asia/Tehran',
        lang: 'en',
        subs: [],
        pre: true,
        post: true,
        auto: true,
        days: [],
        weekend: true,
        compact: false,
        sessionAlerts: { open: [], close: [] },
        dailyRecap: false
      };
      try {
        for (const k of ['c', 'cc', 'i', 'subs', 'days']) {
          const v = await env.KV.get(`g:${gid}:${k}`);
          if (v) c[k] = JSON.parse(v);
        }
        for (const k of ['tt', 'tm', 'tz', 'lang']) {
          const v = await env.KV.get(`g:${gid}:${k}`);
          if (v) c[k] = v;
        }
        const preVal = await env.KV.get(`g:${gid}:pre`);
        if (preVal !== null) c.pre = preVal === 'true';
        const postVal = await env.KV.get(`g:${gid}:post`);
        if (postVal !== null) c.post = postVal === 'true';
        const autoVal = await env.KV.get(`g:${gid}:auto`);
        if (autoVal !== null) c.auto = autoVal === 'true';
        const weekendVal = await env.KV.get(`g:${gid}:weekend`);
        if (weekendVal !== null) c.weekend = weekendVal === 'true';
        const compactVal = await env.KV.get(`g:${gid}:compact`);
        if (compactVal !== null) c.compact = compactVal === 'true';
        const sessionAlertsVal = await env.KV.get(`g:${gid}:sessionAlerts`);
        if (sessionAlertsVal !== null) c.sessionAlerts = JSON.parse(sessionAlertsVal);
        const dailyRecapVal = await env.KV.get(`g:${gid}:dailyRecap`);
        if (dailyRecapVal !== null) c.dailyRecap = dailyRecapVal === 'true';
      } catch {}
      return c;
    })
  };
});

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

// Now import the modules under test
import { sendAlerts } from '../src/alerts.js';
import { sendScheduled } from '../src/auto-send.js';
import { sendPostNews } from '../src/post-news.js';

describe('Scheduled Jobs (cache-only)', () => {
  let mockEnv;
  let mockKV;

  beforeEach(() => {
    mockKV = createMockKV();
    mockEnv = { KV: mockKV };
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-08-24T12:00:00.000Z')); // 12:00 UTC
    
    // Clear mocks
    mockTgSendPlain.mockClear();
    mockTgSendHTML.mockClear();
    mockTgApi.mockClear();
    
    // Pre-populate cache with cached events
    mockKV._store.set('cached_news:2025-08-24', JSON.stringify({
      date: '2025-08-24',
      fetchedAt: Date.now(),
      lastIncrementalAt: Date.now(),
      events: [
        { id: 'US-CPI-1724484000000', title: 'CPI', country: 'US', currency: 'USD', impact: 'high', forecast: '3.0%', previous: '2.9%', actual: '', date: '2025-08-24', time: '12:00', timestamp: 1724484000000, preReleaseAt: 1724484000000 - 300000, sentFlags: { preRelease: false, scheduled: false, postReleaseCheck: false }, source: 'full' },
        { id: 'EU-ECB Rate Decision-1724493000000', title: 'ECB Rate Decision', country: 'EU', currency: 'EUR', impact: 'high', forecast: '4.25%', previous: '4.25%', actual: '', date: '2025-08-24', time: '14:30', timestamp: 1724493000000, preReleaseAt: 1724493000000 - 300000, sentFlags: { preRelease: false, scheduled: false, postReleaseCheck: false }, source: 'full' },
        { id: 'JP-BoJ Meeting-1724500800000', title: 'BoJ Meeting', country: 'JP', currency: 'JPY', impact: 'medium', forecast: '', previous: '', actual: 'actual value here', date: '2025-08-24', time: '16:00', timestamp: 1724500800000, preReleaseAt: 1724500800000 - 300000, sentFlags: { preRelease: false, scheduled: false, postReleaseCheck: false }, source: 'full' }
      ],
      incrementalUpdates: []
    }));
    
    // Mock groups
    mockKV._store.set('g:list', JSON.stringify(['-100123456']));
    mockKV._store.set('g:-100123456:pre', 'true');
    mockKV._store.set('g:-100123456:post', 'true');
    mockKV._store.set('g:-100123456:auto', 'true');
    mockKV._store.set('g:-100123456:tz', 'Asia/Tehran');
    mockKV._store.set('g:-100123456:tt', '12:00');
    mockKV._store.set('g:-100123456:tm', '00:00');
    mockKV._store.set('g:-100123456:lang', 'en');
    mockKV._store.set('g:-100123456:c', JSON.stringify(['EURUSD', 'GBPUSD']));
    mockKV._store.set('g:-100123456:i', JSON.stringify(['high', 'medium', 'low']));
    mockKV._store.set('g:-100123456:cc', JSON.stringify([]));
    mockKV._store.set('g:-100123456:weekend', 'true');
    mockKV._store.set('g:-100123456:days', JSON.stringify([]));
    mockKV._store.set('g:-100123456:subs', JSON.stringify([]));
    mockKV._store.set('g:-100123456:compact', 'false');
    mockKV._store.set('g:-100123456:sessionAlerts', JSON.stringify({ open: [], close: [] }));
    mockKV._store.set('g:-100123456:dailyRecap', 'false');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('sendAlerts', () => {
    it('should send pre-release alerts for events within 5 minutes', async () => {
      // Advance time to 11:55 UTC (5 min before 12:00 event)
      vi.setSystemTime(new Date('2025-08-24T11:55:00.000Z'));
      
      await sendAlerts(mockEnv);
      
      expect(mockTgSendPlain).toHaveBeenCalled();
      const callArgs = mockTgSendPlain.mock.calls[0];
      expect(callArgs[1]).toBe('-100123456'); // chat_id
      expect(callArgs[2]).toContain('PRE-RELEASE');
      expect(callArgs[2]).toContain('CPI');
    });

    it('should NOT send alerts for events more than 5 minutes away', async () => {
      // At 11:00 UTC - 60 min before event
      vi.setSystemTime(new Date('2025-08-24T11:00:00.000Z'));
      
      await sendAlerts(mockEnv);
      
      expect(mockTgSendPlain).not.toHaveBeenCalled();
    });

    it('should NOT send alerts for events that already passed', async () => {
      // At 13:00 UTC - after 12:00 event
      vi.setSystemTime(new Date('2025-08-24T13:00:00.000Z'));
      
      await sendAlerts(mockEnv);
      
      expect(mockTgSendPlain).not.toHaveBeenCalled();
    });

    it('should respect cooldown - not send duplicate alerts', async () => {
      vi.setSystemTime(new Date('2025-08-24T11:55:00.000Z'));
      
      // First call - should send
      await sendAlerts(mockEnv);
      expect(mockTgSendPlain).toHaveBeenCalledTimes(1);
      
      // Second call - should be blocked by cooldown
      mockTgSendPlain.mockClear();
      await sendAlerts(mockEnv);
      expect(mockTgSendPlain).not.toHaveBeenCalled();
    });
  });

  describe('sendScheduled', () => {
    it('should send scheduled news at configured time', async () => {
      // Set time to 12:00 Tehran = 08:30 UTC
      vi.setSystemTime(new Date('2025-08-24T08:30:00.000Z'));
      
      await sendScheduled(mockEnv);
      
      expect(mockTgSendHTML).toHaveBeenCalled();
      const callArgs = mockTgSendHTML.mock.calls[0];
      expect(callArgs[1]).toBe('-100123456');
      expect(callArgs[2]).toContain('CPI');
    });

    it('should NOT send if already sent (dedup key exists)', async () => {
      vi.setSystemTime(new Date('2025-08-24T08:30:00.000Z'));
      
      // First send
      await sendScheduled(mockEnv);
      expect(mockTgSendHTML).toHaveBeenCalledTimes(1);
      
      // Second call - should be blocked by dedup key
      mockTgSendHTML.mockClear();
      await sendScheduled(mockEnv);
      expect(mockTgSendHTML).not.toHaveBeenCalled();
    });
  });

  describe('sendPostNews', () => {
    it('should send post-release notification when actual value appears', async () => {
      // Time after event (16:00 UTC = 19:30 Tehran)
      vi.setSystemTime(new Date('2025-08-24T16:30:00.000Z'));
      
      await sendPostNews(mockEnv);
      
      expect(mockTgSendHTML).toHaveBeenCalled();
      const callArgs = mockTgSendHTML.mock.calls[0];
      expect(callArgs[2]).toContain('post_release');
      expect(callArgs[2]).toContain('BoJ Meeting');
      expect(callArgs[2]).toContain('actual value here');
    });

    it('should NOT send for events without actual value', async () => {
      vi.setSystemTime(new Date('2025-08-24T12:30:00.000Z'));
      
      await sendPostNews(mockEnv);
      
      // CPI and ECB don't have actual values yet
      expect(mockTgSendHTML).not.toHaveBeenCalled();
    });

    it('should respect dedup key for post-release', async () => {
      vi.setSystemTime(new Date('2025-08-24T16:30:00.000Z'));
      
      await sendPostNews(mockEnv);
      expect(mockTgSendHTML).toHaveBeenCalledTimes(1);
      
      mockTgSendHTML.mockClear();
      await sendPostNews(mockEnv);
      expect(mockTgSendHTML).not.toHaveBeenCalled();
    });
  });
});