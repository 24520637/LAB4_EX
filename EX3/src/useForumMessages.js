import { useEffect, useState } from 'react';

/**
 * Fetch forum messages for a selected channel.
 * `getUrl` must implement the confirmed backend's GET route contract.
 * No endpoint or response payload shape is assumed here.
 */
export default function useForumMessages(channel, getUrl) {
  const [request, setRequest] = useState({
    channel: null,
    status: 'idle',
    data: null,
    error: null,
  });

  useEffect(() => {
    if (!channel || typeof getUrl !== 'function') return undefined;

    const controller = new AbortController();
    let active = true;
    setRequest({ channel, status: 'loading', data: null, error: null });

    async function load() {
      try {
        const url = getUrl(channel);
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) throw new Error(`Request failed (${response.status})`);

        const data = await response.json();
        if (!active || controller.signal.aborted) return;

        const status = Array.isArray(data) && data.length === 0 ? 'empty' : 'success';
        setRequest({ channel, status, data, error: null });
      } catch (error) {
        if (!active || controller.signal.aborted || error?.name === 'AbortError') return;

        setRequest({
          channel,
          status: 'error',
          data: null,
          error: error instanceof Error ? error.message : 'Request failed',
        });
      }
    }

    load();
    return () => {
      active = false;
      controller.abort();
    };
  }, [channel, getUrl]);

  if (!channel || typeof getUrl !== 'function') {
    return { status: 'idle', data: null, error: null, loading: false };
  }

  const current = request.channel === channel
    ? request
    : { status: 'loading', data: null, error: null };
  return {
    status: current.status,
    data: current.data,
    error: current.error,
    loading: current.status === 'loading',
  };
}
