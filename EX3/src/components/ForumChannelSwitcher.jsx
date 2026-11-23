import { useState } from 'react';
import useForumMessages from '../useForumMessages.js';

export const CHANNELS = ['nasa', 'esports-tribunal', 'notNasa'];
const getChannelUrl = channel => `/api/channels/${encodeURIComponent(channel)}/messages`;

export default function ForumChannelSwitcher() {
  const [channel, setChannel] = useState(CHANNELS[0]);
  const { status, data, error } = useForumMessages(channel, getChannelUrl);

  return (
    <section aria-labelledby="forum-heading" aria-busy={status === 'loading'}>
      <h2 id="forum-heading">Forum messages</h2>
      <fieldset>
        <legend>Choose a channel</legend>
        {CHANNELS.map(id => (
          <label key={id} className="channel-choice">
            <input
              type="radio"
              name="forum-channel"
              value={id}
              checked={channel === id}
              onChange={() => setChannel(id)}
            />
            {id}
          </label>
        ))}
      </fieldset>

      {status === 'loading' && <p role="status">Loading messages for {channel}...</p>}
      {status === 'empty' && <p role="status">No messages in {channel}.</p>}
      {status === 'error' && <p role="alert">Unable to load {channel}: {error}</p>}
      {status === 'success' && (
        <section aria-label={`Messages in ${channel}`}>
          <p role="status">Messages loaded for {channel}.</p>
          <ul>
            {Array.isArray(data) && data.map((item, index) => (
              <li key={`${channel}-${index}`}>
                <strong>{item.author}</strong>: {item.message}
              </li>
            ))}
          </ul>
        </section>
      )}
    </section>
  );
}
