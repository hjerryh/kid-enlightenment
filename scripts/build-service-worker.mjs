#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, join, relative, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const CACHE_PREFIX = 'little-world-';

/** Parse one HTTP byte range; null means malformed or unsatisfiable. */
export function parseByteRange(header, size) {
  if (!Number.isSafeInteger(size) || size <= 0) return null;
  const match = /^bytes=(\d*)-(\d*)$/i.exec(header.trim());
  if (!match || (!match[1] && !match[2])) return null;
  let start;
  let end;
  if (!match[1]) {
    const length = Number(match[2]);
    if (!Number.isSafeInteger(length) || length <= 0) return null;
    start = Math.max(0, size - length);
    end = size - 1;
  } else {
    start = Number(match[1]);
    end = match[2] ? Number(match[2]) : size - 1;
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start >= size || end < start)
      return null;
    end = Math.min(end, size - 1);
  }
  return { start, end };
}

/** Build a correct partial response from the complete cached MP3, for Safari. */
export async function createRangeResponse(complete, rangeHeader) {
  if (complete.status !== 200) return complete;
  const bytes = await complete.arrayBuffer();
  const range = parseByteRange(rangeHeader, bytes.byteLength);
  const headers = new Headers(complete.headers);
  // The Fetch API exposes decoded bytes. Never describe the sliced body as compressed.
  headers.delete('Content-Encoding');
  headers.delete('Transfer-Encoding');
  headers.set('Accept-Ranges', 'bytes');
  if (!range) {
    headers.set('Content-Range', `bytes */${bytes.byteLength}`);
    headers.set('Content-Length', '0');
    return new Response(null, { status: 416, statusText: 'Range Not Satisfiable', headers });
  }
  const body = bytes.slice(range.start, range.end + 1);
  headers.set('Content-Range', `bytes ${range.start}-${range.end}/${bytes.byteLength}`);
  headers.set('Content-Length', String(body.byteLength));
  return new Response(body, { status: 206, statusText: 'Partial Content', headers });
}

/** Embedded as executable code in the generated worker; no Node dependencies. */
export function registerServiceWorker({ cacheName, cachePrefix, urls }) {
  const knownPaths = new Set(urls);
  const shellUrl = '/index.html';

  self.addEventListener('install', (event) => {
    event.waitUntil(
      (async () => {
        const cache = await caches.open(cacheName);
        // addAll rejects an incomplete/failed response, including 206 responses.
        await cache.addAll(urls.map((url) => new Request(url, { cache: 'reload' })));
        await self.skipWaiting();
      })(),
    );
  });

  self.addEventListener('activate', (event) => {
    event.waitUntil(
      (async () => {
        const names = await caches.keys();
        await Promise.all(
          names
            .filter((name) => name.startsWith(cachePrefix) && name !== cacheName)
            .map((name) => caches.delete(name)),
        );
        await self.clients.claim();
      })(),
    );
  });

  async function navigate(request) {
    let networkResponse;
    try {
      networkResponse = await fetch(request);
      if (networkResponse.ok) return networkResponse;
    } catch {
      // The installed shell and its hashed assets form one coherent offline version.
    }
    const cache = await caches.open(cacheName);
    const shell = await cache.match(shellUrl);
    if (shell) return shell;
    return (
      networkResponse ??
      new Response('You are offline. Open Little World once while connected.', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      })
    );
  }

  async function resource(request, url) {
    const cache = await caches.open(cacheName);
    // Cache-busting queries on known build files still identify the same static asset.
    const key = knownPaths.has(url.pathname) ? url.pathname : request;
    const rangeHeader = request.headers.get('Range');
    let complete = await cache.match(key);
    if (!complete) {
      complete = await fetch(request);
      const isComplete = complete.status === 200;
      const allowsStorage = !/\bno-store\b/i.test(complete.headers.get('Cache-Control') ?? '');
      // Never store 206: doing so makes later full-file/offline playback incomplete.
      if (isComplete && allowsStorage) {
        try {
          await cache.put(key, complete.clone());
        } catch {
          // A full disk must not prevent successful online playback.
        }
      }
    }
    if (rangeHeader && complete.status === 200) {
      const ifRange = request.headers.get('If-Range');
      if (
        ifRange &&
        ifRange !== complete.headers.get('ETag') &&
        ifRange !== complete.headers.get('Last-Modified')
      ) {
        return complete;
      }
      return createRangeResponse(complete, rangeHeader);
    }
    return complete;
  }

  self.addEventListener('fetch', (event) => {
    const { request } = event;
    if (request.method !== 'GET') return;
    const url = new URL(request.url);
    if (url.origin !== self.location.origin) return;
    event.respondWith(request.mode === 'navigate' ? navigate(request) : resource(request, url));
  });
}

export function renderServiceWorker(cacheName, urls) {
  return (
    `/* Generated by scripts/build-service-worker.mjs. Do not edit. */\n` +
    `${parseByteRange.toString()}\n\n${createRangeResponse.toString()}\n\n` +
    `(${registerServiceWorker.toString()})(${JSON.stringify({ cacheName, cachePrefix: CACHE_PREFIX, urls }, null, 2)});\n`
  );
}

export async function collectBuildAssets(directory) {
  const root = resolve(directory);
  const assets = [];
  async function visit(folder) {
    const entries = await readdir(folder, { withFileTypes: true });
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      const absolute = join(folder, entry.name);
      if (entry.isDirectory()) await visit(absolute);
      else if (entry.isFile()) {
        const path = relative(root, absolute).split(sep).join('/');
        if (path === 'sw.js') continue;
        const url = `/${path.split('/').map(encodeURIComponent).join('/')}`;
        assets.push({ path, url, bytes: await readFile(absolute) });
      }
    }
  }
  await visit(root);
  return assets.sort((a, b) => a.url.localeCompare(b.url));
}

export async function buildServiceWorker(directory) {
  const root = resolve(directory);
  const assets = await collectBuildAssets(root);
  if (!assets.some((asset) => asset.path === 'index.html')) {
    throw new Error(
      `No index.html in ${root}. Run Vite build before generating the service worker.`,
    );
  }
  const urls = assets.map((asset) => asset.url);
  const hash = createHash('sha256');
  // A worker logic change must also isolate its cache from the previous worker.
  hash.update(renderServiceWorker('version-placeholder', urls));
  for (const asset of assets) hash.update(asset.url).update('\0').update(asset.bytes).update('\0');
  const cacheName = `${CACHE_PREFIX}${hash.digest('hex').slice(0, 20)}`;
  const output = join(root, 'sw.js');
  await writeFile(output, renderServiceWorker(cacheName, urls));
  return {
    cacheName,
    assetCount: assets.length,
    bytes: assets.reduce((sum, asset) => sum + asset.bytes.length, 0),
    output,
  };
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (isMain) {
  const root = resolve(fileURLToPath(new URL('../dist', import.meta.url)));
  const result = await buildServiceWorker(root);
  console.log(
    `Offline cache: ${result.assetCount} files, ${(result.bytes / 1024 / 1024).toFixed(2)} MiB (${result.cacheName})`,
  );
}
