import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ForumChannelSwitcher from './ForumChannelSwitcher.jsx';

afterEach(() => vi.unstubAllGlobals());

const response = data => ({ ok: true, json: async () => data });
const messagesFor = async channel => {
  const region = await screen.findByRole('region', { name: `Messages in ${channel}` });
  return within(region).findByRole('listitem');
};

describe('ForumChannelSwitcher', () => {
  it('loads all three channels through pointer interaction', async () => {
    const fetchMock = vi.fn(url => Promise.resolve(response([
      { author: 'User', message: url.split('/')[3] },
    ])));
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    render(<ForumChannelSwitcher />);

    expect(await messagesFor('nasa')).toHaveTextContent('User: nasa');
    await user.click(screen.getByRole('radio', { name: 'esports-tribunal' }));
    expect(await messagesFor('esports-tribunal')).toHaveTextContent('User: esports-tribunal');
    await user.click(screen.getByRole('radio', { name: 'notNasa' }));
    expect(await messagesFor('notNasa')).toHaveTextContent('User: notNasa');
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      '/api/channels/nasa/messages',
      '/api/channels/esports-tribunal/messages',
      '/api/channels/notNasa/messages',
    ]);
  });

  it('supports keyboard navigation through the radio group', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => response([])));
    const user = userEvent.setup();
    render(<ForumChannelSwitcher />);
    const nasa = screen.getByRole('radio', { name: 'nasa' });
    nasa.focus();

    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('radio', { name: 'esports-tribunal' })).toBeChecked();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('radio', { name: 'notNasa' })).toBeChecked();
    expect(await screen.findByText('No messages in notNasa.')).toBeInTheDocument();
  });

  it('announces loading, empty, and error states accessibly', async () => {
    let resolveFetch;
    vi.stubGlobal('fetch', vi.fn(() => new Promise(resolve => {
      resolveFetch = resolve;
    })));
    const user = userEvent.setup();
    render(<ForumChannelSwitcher />);

    expect(screen.getByRole('status')).toHaveTextContent('Loading messages');
    resolveFetch(response([]));
    expect(await screen.findByText('No messages in nasa.')).toBeInTheDocument();

    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 503 })));
    await user.click(screen.getByRole('radio', { name: 'notNasa' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Request failed (503)');
  });

  it('cancels previous requests and never renders stale responses', async () => {
    const requests = [];
    vi.stubGlobal('fetch', vi.fn((url, options) => new Promise(resolve => {
      requests.push({ url, signal: options.signal, resolve });
    })));
    const user = userEvent.setup();
    render(<ForumChannelSwitcher />);

    await user.click(screen.getByRole('radio', { name: 'esports-tribunal' }));
    expect(requests[0].signal.aborted).toBe(true);
    await user.click(screen.getByRole('radio', { name: 'notNasa' }));
    expect(requests[1].signal.aborted).toBe(true);

    requests[2].resolve(response([{ author: 'Latest', message: 'Current' }]));
    expect(await messagesFor('notNasa')).toHaveTextContent('Latest: Current');
    await act(async () => {
      requests[0].resolve(response([{ author: 'Old', message: 'Stale' }]));
    });
    expect(screen.getByRole('listitem')).toHaveTextContent('Latest: Current');
    expect(screen.queryByText('Stale')).not.toBeInTheDocument();
  });
});
