import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';
import {
  buildServiceWorker,
  createRangeResponse,
  parseByteRange,
  renderServiceWorker,
} from '../scripts/build-service-worker.mjs';

const ORIGIN = 'https://little-world.test';

/** Execute the actual generated worker with standards-based Request/Response bodies. */
function workerHarness() {
  const handlers = new Map<string, (event: any) => void>();
  const stores = new Map<string, Map<string, Response>>();
  let skipWaiting = 0;
  let claims = 0;
  let network: (request: Request) => Promise<Response> = async () => new Response('network');
  const keyOf = (input: Request | string) =>
    new URL(typeof input === 'string' ? input : input.url, ORIGIN).href;
  class BrowserRequest extends Request {
    constructor(input: Request | string, options?: RequestInit) {
      super(typeof input === 'string' ? new URL(input, ORIGIN) : input, options);
    }
  }
  const caches = {
    async keys() {
      return [...stores.keys()];
    },
    async delete(name: string) {
      return stores.delete(name);
    },
    async open(name: string) {
      if (!stores.has(name)) stores.set(name, new Map());
      const store = stores.get(name)!;
      return {
        async match(key: Request | string) {
          return store.get(keyOf(key))?.clone();
        },
        async put(key: Request | string, response: Response) {
          store.set(keyOf(key), response.clone());
        },
        async addAll(requests: Request[]) {
          const entries = await Promise.all(
            requests.map(async (request) => {
              const response = await network(request);
              if (!response.ok || response.status === 206) throw new Error('Precache failed');
              return [keyOf(request), response] as const;
            }),
          );
          for (const [key, response] of entries) store.set(key, response.clone());
        },
      };
    },
  };
  const self = {
    location: { origin: ORIGIN },
    addEventListener(type: string, handler: (event: any) => void) {
      handlers.set(type, handler);
    },
    async skipWaiting() {
      skipWaiting++;
    },
    clients: {
      async claim() {
        claims++;
      },
    },
  };
  runInNewContext(
    renderServiceWorker('little-world-current', ['/index.html', '/audio/apple.mp3']),
    {
      self,
      caches,
      Request: BrowserRequest,
      Response,
      Headers,
      URL,
      console,
      fetch: (request: Request) => network(request),
    },
  );
  return {
    stores,
    setNetwork(handler: typeof network) {
      network = handler;
    },
    get skips() {
      return skipWaiting;
    },
    get claims() {
      return claims;
    },
    async put(path: string, body: string, headers: HeadersInit = {}) {
      const cache = await caches.open('little-world-current');
      await cache.put(path, new Response(body, { headers }));
    },
    async lifecycle(type: string) {
      let pending: Promise<unknown> | undefined;
      handlers.get(type)!({
        waitUntil(promise: Promise<unknown>) {
          pending = promise;
        },
      });
      await pending;
    },
    request(
      request: Request | { method: string; url: string; mode: string },
    ): Promise<Response> | undefined {
      let pending: Promise<Response> | undefined;
      handlers.get('fetch')!({
        request,
        respondWith(promise: Promise<Response>) {
          pending = promise;
        },
      });
      return pending;
    },
  };
}

test('byte ranges support closed, open-ended, and suffix requests with correct boundaries', () => {
  assert.deepEqual(parseByteRange('bytes=0-1', 10), { start: 0, end: 1 });
  assert.deepEqual(parseByteRange('bytes=3-', 10), { start: 3, end: 9 });
  assert.deepEqual(parseByteRange('bytes=-3', 10), { start: 7, end: 9 });
  assert.deepEqual(parseByteRange('bytes=-100', 10), { start: 0, end: 9 });
  assert.deepEqual(parseByteRange('bytes=8-100', 10), { start: 8, end: 9 });
  for (const invalid of [
    'bytes=10-',
    'bytes=8-2',
    'bytes=-0',
    'bytes=-',
    'bytes=0-1,4-5',
    'wrong=0-1',
  ]) {
    assert.equal(parseByteRange(invalid, 10), null, invalid);
  }
  assert.equal(parseByteRange('bytes=0-', 0), null);
});

test('partial MP3 responses contain exactly the requested bytes and truthful headers', async () => {
  const response = await createRangeResponse(
    new Response('0123456789', {
      headers: { 'Content-Type': 'audio/mpeg', 'Content-Encoding': 'gzip', 'Content-Length': '10' },
    }),
    'bytes=3-5',
  );
  assert.equal(response.status, 206);
  assert.equal(response.headers.get('Content-Range'), 'bytes 3-5/10');
  assert.equal(response.headers.get('Content-Length'), '3');
  assert.equal(response.headers.get('Content-Type'), 'audio/mpeg');
  assert.equal(response.headers.get('Content-Encoding'), null);
  assert.equal(await response.text(), '345');
  const invalid = await createRangeResponse(new Response('abc'), 'bytes=3-');
  assert.equal(invalid.status, 416);
  assert.equal(invalid.headers.get('Content-Range'), 'bytes */3');
  assert.equal(await invalid.text(), '');
});

test('build hashes file content, precaches every asset, and excludes the generated worker', async () => {
  const root = await mkdtemp(join(tmpdir(), 'little-world-sw-'));
  try {
    await mkdir(join(root, 'assets'));
    await mkdir(join(root, 'audio'));
    await mkdir(join(root, 'art'));
    for (const [path, content] of Object.entries({
      'index.html': '<html>app</html>',
      'assets/app.js': 'window.app=1',
      'assets/style.css': 'body{}',
      'audio/apple.mp3': 'test audio',
      'art/apple.svg': '<svg/>',
      'manifest.webmanifest': '{}',
      'app icon.png': 'icon',
      'sw.js': 'outdated worker',
    }))
      await writeFile(join(root, path), content);
    const first = await buildServiceWorker(root);
    assert.equal(first.assetCount, 7);
    const generated = await readFile(join(root, 'sw.js'), 'utf8');
    assert.match(generated, /\/app%20icon\.png/);
    assert.match(generated, /\/audio\/apple\.mp3/);
    assert.doesNotMatch(generated, /"\/sw\.js"/);
    const second = await buildServiceWorker(root);
    assert.equal(first.cacheName, second.cacheName);
    await writeFile(join(root, 'assets/app.js'), 'window.app=2');
    const changed = await buildServiceWorker(root);
    assert.notEqual(first.cacheName, changed.cacheName);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('installation waits for all assets and activation only removes this app’s old caches', async () => {
  const worker = workerHarness();
  worker.setNetwork(async () => {
    throw new Error('Offline');
  });
  await assert.rejects(worker.lifecycle('install'), /Offline/);
  assert.equal(worker.skips, 0);
  worker.setNetwork(async () => new Response('asset'));
  await worker.lifecycle('install');
  assert.equal(worker.skips, 1);
  worker.stores.set('little-world-old', new Map());
  worker.stores.set('another-app-cache', new Map());
  await worker.lifecycle('activate');
  assert.equal(worker.stores.has('little-world-old'), false);
  assert.equal(worker.stores.has('little-world-current'), true);
  assert.equal(worker.stores.has('another-app-cache'), true);
  assert.equal(worker.claims, 1);
});

test('offline navigation falls back to the installed shell and query-string assets still resolve', async () => {
  const worker = workerHarness();
  await worker.put('/index.html', '<html>offline app</html>');
  await worker.put('/audio/apple.mp3', '0123456789', { 'Content-Type': 'audio/mpeg' });
  worker.setNetwork(async () => {
    throw new Error('Offline');
  });
  const navigation = await worker.request({
    method: 'GET',
    url: `${ORIGIN}/learn?topic=fruits`,
    mode: 'navigate',
  });
  assert.equal(await navigation!.text(), '<html>offline app</html>');
  const partial = await worker.request(
    new Request(`${ORIGIN}/audio/apple.mp3?v=2`, { headers: { Range: 'bytes=2-4' } }),
  );
  assert.equal(partial!.status, 206);
  assert.equal(await partial!.text(), '234');
  const complete = await worker.request(new Request(`${ORIGIN}/audio/apple.mp3`));
  assert.equal(complete!.status, 200);
  assert.equal(await complete!.text(), '0123456789');
});

test('network partial responses never replace a full cached asset', async () => {
  const worker = workerHarness();
  worker.setNetwork(
    async () => new Response('12', { status: 206, headers: { 'Content-Range': 'bytes 1-2/10' } }),
  );
  const response = await worker.request(
    new Request(`${ORIGIN}/new.mp3`, { headers: { Range: 'bytes=1-2' } }),
  );
  assert.equal(response!.status, 206);
  assert.equal(await response!.text(), '12');
  assert.equal(worker.stores.get('little-world-current')!.size, 0);
});

test('foreign-origin and non-GET requests are left to the browser', () => {
  const worker = workerHarness();
  assert.equal(worker.request(new Request('https://another.test/asset.js')), undefined);
  assert.equal(worker.request(new Request(`${ORIGIN}/save`, { method: 'POST' })), undefined);
});
