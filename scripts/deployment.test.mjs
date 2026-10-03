import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('Compiled API has no runtime imports of local TypeScript sources', async () => {
  const bundle = await readFile(new URL('../server-build/api.js', import.meta.url), 'utf8');
  assert.doesNotMatch(bundle, /(?:from|import\()\s*['"][^'"]+\.ts['"]/);
});

test('Both built Vercel endpoints boot and handle requests without a TypeScript loader', async () => {
  process.env.VERCEL = '1';
  delete process.env.GEMINI_API_KEY;
  const { default: status } = await import('../api/status.js');
  const { default: fn } = await import('../api/function.js');
  for (const app of [status, fn]) {
    const server = await new Promise((resolve) => {
      const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
    });
    try {
      const base = `http://127.0.0.1:${server.address().port}/api`;
      const response = await fetch(`${base}/status`);
      assert.equal(response.status, 200);
      assert.deepEqual(Object.keys(await response.json()), ['configured']);
      const invalid = await fetch(`${base}/function`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [] }),
      });
      assert.equal(invalid.status, 400);
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  }
});
