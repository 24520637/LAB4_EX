import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import useForumMessages from './useForumMessages.js';

const getUrl = channel => `/test/${channel}`;
const ok = data => ({ ok: true, json: async () => data });
const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
};

afterEach(() => vi.unstubAllGlobals());

describe('useForumMessages', () => {
  it('loads data and handles empty results', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn()
        .mockResolvedValueOnce(ok([{ id: 1 }]))
        .mockResolvedValueOnce(ok([])),
    );
    const { result, rerender } = renderHook(
      ({ channel }) => useForumMessages(channel, getUrl),
      { initialProps: { channel: 'nasa' } },
    );

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.data).toEqual([{ id: 1 }]);

    rerender({ channel: 'notNasa' });
    expect(result.current.status).toBe('loading');
    await waitFor(() => expect(result.current.status).toBe('empty'));
    expect(result.current.data).toEqual([]);
  });

  it('aborts obsolete requests and ignores late responses', async () => {
    const old = deferred();
    const latest = deferred();
    const fetchMock = vi.fn()
      .mockImplementationOnce(() => old.promise)
      .mockImplementationOnce(() => latest.promise);
    vi.stubGlobal('fetch', fetchMock);
    const { result, rerender } = renderHook(
      ({ channel }) => useForumMessages(channel, getUrl),
      { initialProps: { channel: 'nasa' } },
    );
    const oldSignal = fetchMock.mock.calls[0][1].signal;

    rerender({ channel: 'esports-tribunal' });
    expect(oldSignal.aborted).toBe(true);
    expect(result.current.status).toBe('loading');

    await act(async () => {
      latest.resolve(ok([{ id: 'new' }]));
    });
    await waitFor(() => expect(result.current.data).toEqual([{ id: 'new' }]));

    await act(async () => {
      old.resolve(ok([{ id: 'stale' }]));
    });
    expect(result.current.data).toEqual([{ id: 'new' }]);
  });

  it('aborts on unmount and does not surface intentional abort errors', async () => {
    const pending = deferred();
    const fetchMock = vi.fn(() => pending.promise);
    vi.stubGlobal('fetch', fetchMock);
    const { unmount } = renderHook(() => useForumMessages('nasa', getUrl));
    const signal = fetchMock.mock.calls[0][1].signal;

    unmount();
    expect(signal.aborted).toBe(true);

    await act(async () => {
      pending.reject(Object.assign(new Error('aborted'), { name: 'AbortError' }));
    });
  });

  it('reports HTTP and network failures without stale data', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn()
        .mockResolvedValueOnce({ ok: false, status: 503 })
        .mockRejectedValueOnce(new Error('Offline')),
    );
    const { result, rerender } = renderHook(
      ({ channel }) => useForumMessages(channel, getUrl),
      { initialProps: { channel: 'nasa' } },
    );

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error).toMatch(/503/);
    expect(result.current.data).toBeNull();

    rerender({ channel: 'notNasa' });
    await waitFor(() => expect(result.current.error).toBe('Offline'));
    expect(result.current.data).toBeNull();
  });
});
