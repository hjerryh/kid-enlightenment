import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { concepts } from '../../src/data/curriculum';

const narrationManifest = JSON.parse(
  readFileSync(new URL('../../public/audio/manifest.json', import.meta.url), 'utf8'),
);
const chineseManifest = JSON.parse(
  readFileSync(new URL('../../public/audio/zh/manifest.json', import.meta.url), 'utf8'),
);
const expectedAudio = Object.entries(narrationManifest.clips)
  .map(([id, value]) => ({
    path: `/audio/${id}.mp3`,
    bytes: (value as { bytes: number }).bytes,
  }))
  .concat(
    Object.entries(chineseManifest.clips).map(([id, value]) => ({
      path: `/audio/zh/${id}.mp3`,
      bytes: (value as { bytes: number }).bytes,
    })),
  );
const expectedAssets = [
  ...expectedAudio,
  ...concepts.map((concept) => ({
    path: concept.art,
    bytes: readFileSync(new URL(`../../public${concept.art}`, import.meta.url)).byteLength,
  })),
];

test.use({ baseURL: 'http://127.0.0.1:4174' });

test('the production app reloads and speaks from its complete offline cache', async ({
  page,
  context,
}) => {
  test.setTimeout(90_000);
  const pageErrors: string[] = [];
  const offlineAssetFailures: string[] = [];
  const offlineResponses: { path: string; status: number; fromWorker: boolean }[] = [];
  let offline = false;
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('requestfailed', (request) => {
    if (offline && /\/(?:assets|art|audio)\//.test(new URL(request.url()).pathname)) {
      offlineAssetFailures.push(`${request.url()}: ${request.failure()?.errorText}`);
    }
  });
  page.on('response', (response) => {
    if (offline)
      offlineResponses.push({
        path: new URL(response.url()).pathname,
        status: response.status(),
        fromWorker: response.fromServiceWorker(),
      });
  });
  // Observe the genuine native Audio instance without substituting audio or playback.
  await page.addInitScript(() => {
    const events: { event: string; src: string; duration: number; error: number | null }[] = [];
    (window as unknown as { __nativeMediaEvents: typeof events }).__nativeMediaEvents = events;
    window.Audio = new Proxy(window.Audio, {
      construct(Constructor, args) {
        const audio = Reflect.construct(Constructor, args) as HTMLAudioElement;
        for (const event of ['loadedmetadata', 'playing', 'ended', 'error']) {
          audio.addEventListener(event, () =>
            events.push({
              event,
              src: audio.currentSrc || audio.src,
              duration: audio.duration,
              error: audio.error?.code ?? null,
            }),
          );
        }
        return audio;
      },
    });
  });

  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Hello, little explorer.' })).toBeVisible();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));

  const cacheAudit = await page.evaluate(async (expected) => {
    const names = (await caches.keys()).filter((name) => name.startsWith('little-world-'));
    if (names.length !== 1)
      return { names, files: [], mismatches: ['Expected exactly one active app cache'] };
    const cache = await caches.open(names[0]);
    const files = (await cache.keys()).map((request) => new URL(request.url).pathname);
    const mismatches: string[] = [];
    for (const asset of expected) {
      const response = await cache.match(asset.path);
      if (
        !response ||
        response.status !== 200 ||
        (await response.arrayBuffer()).byteLength !== asset.bytes
      ) {
        mismatches.push(asset.path);
      }
    }
    return { names, files, mismatches };
  }, expectedAssets);
  expect(expectedAudio).toHaveLength((concepts.length * 4 + 3) * 2);
  expect(cacheAudit.files.filter((path) => path.endsWith('.mp3'))).toHaveLength(
    expectedAudio.length,
  );
  expect(cacheAudit.mismatches).toEqual([]);
  expect(cacheAudit.files).toContain('/index.html');
  expect(cacheAudit.files.some((path) => path.endsWith('.woff2'))).toBe(true);
  expect(cacheAudit.files).toContain('/art/discovery-scene.svg');

  offline = true;
  await context.setOffline(true);
  await page.reload({ waitUntil: 'networkidle' });
  await expect(page.getByRole('heading', { name: 'Hello, little explorer.' })).toBeVisible();
  await expect(
    page.getByRole('button', {
      name: /^Explore (Fruits|Animals|Colors|Numbers|Shapes|Our world)$/,
    }),
  ).toHaveCount(6);
  await page.locator('.favorites-section').scrollIntoViewIfNeeded();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          [...document.images].filter((image) => !image.complete || image.naturalWidth === 0)
            .length,
      ),
    )
    .toBe(0);
  const fonts = await page.evaluate(async () => {
    await document.fonts.ready;
    return [...document.fonts]
      .filter((font) => font.status === 'loaded')
      .map((font) => font.family.replace(/['"]/g, ''));
  });
  expect(fonts).toContain('Nunito');
  expect(fonts).toContain('DM Sans');
  expect(
    offlineResponses.some(
      (response) => response.path.endsWith('.js') && response.status === 200 && response.fromWorker,
    ),
  ).toBe(true);
  expect(
    offlineResponses.some(
      (response) =>
        response.path.endsWith('.css') && response.status === 200 && response.fromWorker,
    ),
  ).toBe(true);

  await page.getByRole('button', { name: 'Explore Fruits', exact: true }).click();
  await expect(page.getByRole('button', { name: /^Discover / })).toHaveCount(6);
  const audioResponsePromise = page.waitForResponse(
    (response) => new URL(response.url()).pathname === '/audio/apple.mp3',
  );
  await page.getByRole('button', { name: 'Discover Apple', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Apple discovery' })).toBeVisible();
  const audioResponse = await audioResponsePromise;
  expect([200, 206]).toContain(audioResponse.status());
  expect(audioResponse.fromServiceWorker()).toBe(true);
  await expect
    .poll(() =>
      page.evaluate(() => {
        const events = (
          window as unknown as {
            __nativeMediaEvents: {
              event: string;
              src: string;
              duration: number;
              error: number | null;
            }[];
          }
        ).__nativeMediaEvents;
        return events.some(
          (event) =>
            event.event === 'loadedmetadata' &&
            event.src.endsWith('/audio/apple.mp3') &&
            event.duration > 0.2,
        );
      }),
    )
    .toBe(true);
  await expect
    .poll(() =>
      page.evaluate(() => {
        const events = (
          window as unknown as { __nativeMediaEvents: { event: string; src: string }[] }
        ).__nativeMediaEvents;
        return events.some(
          (event) => event.event === 'playing' && event.src.endsWith('/audio/apple.mp3'),
        );
      }),
    )
    .toBe(true);
  await expect(page.getByText('Audio could not play.', { exact: false })).toHaveCount(0);

  const ranges = await page.evaluate(async () => {
    const complete = await fetch('/audio/apple.mp3');
    const full = new Uint8Array(await complete.arrayBuffer());
    const partial = await fetch('/audio/apple.mp3?offline-range-check=1', {
      headers: { Range: 'bytes=2-9' },
    });
    const partialBytes = [...new Uint8Array(await partial.arrayBuffer())];
    const suffix = await fetch('/audio/apple.mp3', { headers: { Range: 'bytes=-4' } });
    const suffixBytes = [...new Uint8Array(await suffix.arrayBuffer())];
    const invalid = await fetch('/audio/apple.mp3', {
      headers: { Range: `bytes=${full.length}-` },
    });
    return {
      fullStatus: complete.status,
      length: full.length,
      partialStatus: partial.status,
      contentRange: partial.headers.get('Content-Range'),
      contentLength: partial.headers.get('Content-Length'),
      partialBytes,
      expectedPartial: [...full.slice(2, 10)],
      suffixStatus: suffix.status,
      suffixBytes,
      expectedSuffix: [...full.slice(-4)],
      invalidStatus: invalid.status,
      invalidRange: invalid.headers.get('Content-Range'),
      invalidLength: (await invalid.arrayBuffer()).byteLength,
    };
  });
  expect(ranges.fullStatus).toBe(200);
  expect(ranges.partialStatus).toBe(206);
  expect(ranges.contentRange).toBe(`bytes 2-9/${ranges.length}`);
  expect(ranges.contentLength).toBe('8');
  expect(ranges.partialBytes).toEqual(ranges.expectedPartial);
  expect(ranges.suffixStatus).toBe(206);
  expect(ranges.suffixBytes).toEqual(ranges.expectedSuffix);
  expect(ranges.invalidStatus).toBe(416);
  expect(ranges.invalidRange).toBe(`bytes */${ranges.length}`);
  expect(ranges.invalidLength).toBe(0);
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: '中文', exact: true }).click();
  await page.reload({ waitUntil: 'networkidle' });
  await expect(page.getByRole('heading', { name: '你好，小小探索家。' })).toBeVisible();
  const chineseResponsePromise = page.waitForResponse(
    (response) => new URL(response.url()).pathname === '/audio/zh/apple.mp3',
  );
  await page.getByRole('button', { name: '认识苹果', exact: true }).click();
  const chineseResponse = await chineseResponsePromise;
  expect([200, 206]).toContain(chineseResponse.status());
  expect(chineseResponse.fromServiceWorker()).toBe(true);
  await expect
    .poll(() =>
      page.evaluate(() => {
        const events = (
          window as unknown as {
            __nativeMediaEvents: { event: string; src: string; duration: number }[];
          }
        ).__nativeMediaEvents;
        return (
          events.some(
            (event) =>
              event.event === 'loadedmetadata' &&
              event.src.endsWith('/audio/zh/apple.mp3') &&
              event.duration > 0.2,
          ) &&
          events.some(
            (event) => event.event === 'playing' && event.src.endsWith('/audio/zh/apple.mp3'),
          )
        );
      }),
    )
    .toBe(true);
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'English', exact: true }).click();
  expect(offlineAssetFailures).toEqual([]);
  expect(pageErrors).toEqual([]);

  offline = false;
  await context.setOffline(false);
  await page.reload({ waitUntil: 'networkidle' });
  await expect(page.getByRole('heading', { name: 'Hello, little explorer.' })).toBeVisible();
  await page.getByRole('button', { name: 'Explore Animals', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Discover Rabbit', exact: true })).toBeVisible();
  expect(pageErrors).toEqual([]);
});
