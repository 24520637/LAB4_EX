import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { app } from './index.js';

let server;
let base;

before(async () => {
  server = app.listen(0);
  await new Promise(resolve => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => server?.close());

const endpoint = channel => `${base}/api/channels/${channel}/messages`;
const post = (body, channel = 'nasa') => fetch(endpoint(channel), {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body,
});

test('GET supports all three channels and rejects unknown channels', async () => {
  for (const channel of ['nasa', 'esports-tribunal', 'notNasa']) {
    const response = await fetch(endpoint(channel));
    assert.equal(response.status, 200);
    assert.ok(Array.isArray(await response.json()));
  }

  assert.equal((await fetch(endpoint('unknown'))).status, 404);
  assert.equal((await post('{}', 'unknown')).status, 404);
});

test('valid POST creates a trimmed message visible through GET', async () => {
  const response = await post(JSON.stringify({ author: ' Ada ', message: ' Hello ' }));
  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), { author: 'Ada', message: 'Hello' });

  const messages = await (await fetch(endpoint('nasa'))).json();
  assert.ok(messages.some(message => message.author === 'Ada' && message.message === 'Hello'));
});

test('invalid POST payloads are rejected by server-side validation', async () => {
  const invalidPayloads = [
    {},
    { author: 'A' },
    { author: '', message: 'ok' },
    { author: 'A', message: ' ' },
    { author: 3, message: 'ok' },
    { author: 'A', message: 2 },
    [],
    null,
  ];

  for (const payload of invalidPayloads) {
    assert.equal((await post(JSON.stringify(payload))).status, 400);
  }
});

test('malformed JSON is rejected with 400', async () => {
  const response = await post('{bad-json');
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: 'Malformed JSON request body' });
});

test('CORS allows the configured frontend origin', async () => {
  const response = await fetch(endpoint('nasa'), {
    headers: { Origin: 'http://localhost:5173' },
  });

  assert.equal(response.headers.get('access-control-allow-origin'), 'http://localhost:5173');
});

test('CORS preflight is handled separately from request validation', async () => {
  const response = await fetch(endpoint('nasa'), {
    method: 'OPTIONS',
    headers: {
      Origin: 'http://localhost:5173',
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'content-type',
    },
  });

  assert.equal(response.status, 204);
  assert.equal(response.headers.get('access-control-allow-origin'), 'http://localhost:5173');
  assert.match(response.headers.get('access-control-allow-methods'), /POST/);
  assert.match(response.headers.get('access-control-allow-headers'), /content-type/i);
});

test('CORS does not authenticate or block server-side POST requests', async () => {
  const response = await fetch(endpoint('notNasa'), {
    method: 'POST',
    headers: {
      Origin: 'https://untrusted.example',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ author: 'Ada', message: 'Hello' }),
  });

  assert.equal(response.status, 201);
  assert.equal(response.headers.get('access-control-allow-origin'), 'http://localhost:5173');
});
