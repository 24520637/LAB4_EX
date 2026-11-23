import cors from 'cors';
import express from 'express';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const CHANNEL_IDS = ['nasa', 'esports-tribunal', 'notNasa'];
export const app = express();
const messagesByChannel = new Map(CHANNEL_IDS.map(channelId => [channelId, []]));

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.use((error, _request, response, next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return response.status(400).json({ error: 'Malformed JSON request body' });
  }
  return next(error);
});

app.param('channelId', (request, response, next, channelId) => {
  if (!messagesByChannel.has(channelId)) {
    return response.status(404).json({ error: 'Unknown channel' });
  }
  return next();
});

app.get('/api/channels/:channelId/messages', (request, response) => {
  return response.json(messagesByChannel.get(request.params.channelId));
});

app.post('/api/channels/:channelId/messages', (request, response) => {
  const { body } = request;
  if (!body || typeof body !== 'object' || Array.isArray(body) ||
      typeof body.author !== 'string' || !body.author.trim() ||
      typeof body.message !== 'string' || !body.message.trim()) {
    return response.status(400).json({ error: 'author and message must be non-empty strings' });
  }

  const record = { author: body.author.trim(), message: body.message.trim() };
  messagesByChannel.get(request.params.channelId).push(record);
  return response.status(201).json(record);
});

const isMainModule = process.argv[1] &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1]);

if (isMainModule) {
  app.listen(3001, () => console.log('Forum API listening on port 3001'));
}
