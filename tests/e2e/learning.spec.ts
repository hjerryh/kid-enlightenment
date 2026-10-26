import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import type { Page } from '@playwright/test';
import { concepts } from '../../src/data/curriculum';
import type { AgeBand, Concept } from '../../src/data/curriculum';
import { localDate, STORAGE_KEY } from '../../src/lib/progress';
import type { Progress } from '../../src/lib/progress';

async function savedProgress(page: Page): Promise<Progress> {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), STORAGE_KEY);
}

function sessionCount(progress: Progress): number {
  return Object.values(progress.days).reduce((sum, day) => sum + day.sessions, 0);
}

async function openParents(page: Page) {
  await expect(page.locator('.app-shell')).toBeVisible();
  const profile = page.getByRole('button', { name: /Learning stage:/ });
  if (await profile.isVisible()) await profile.click();
  else
    await page
      .getByRole('navigation', { name: 'Mobile navigation', exact: true })
      .getByRole('button', { name: 'Parents', exact: true })
      .tap();
  const dialog = page.getByRole('dialog', { name: 'Parents’ corner' });
  const challenge = await dialog.locator('label[for="parent-answer"]').textContent();
  const [a, b] = challenge!.match(/\d+/g)!.map(Number);
  await dialog.getByRole('textbox', { name: 'Answer to parent check' }).fill(String(a + b));
  await dialog.getByRole('textbox', { name: 'Answer to parent check' }).press('Enter');
  await expect(dialog.getByRole('radiogroup', { name: 'Learning age' })).toBeVisible();
  return dialog;
}

async function setAge(page: Page, age: AgeBand) {
  const dialog = await openParents(page);
  await dialog.getByRole('radio', { name: new RegExp(age.replace('-', '–')) }).click();
  await expect(
    dialog.getByRole('radio', { name: new RegExp(age.replace('-', '–')) }),
  ).toHaveAttribute('aria-checked', 'true');
  await dialog.getByRole('button', { name: 'Close Parents’ corner' }).click();
}

async function startFruitQuiz(page: Page) {
  await page.getByRole('button', { name: 'Explore Fruits', exact: true }).click();
  await page.getByRole('button', { name: 'Practice fruits', exact: true }).click();
  await expect(page.locator('.answer-grid')).toBeVisible();
}

async function answerForCurrentQuestion(page: Page): Promise<Concept> {
  const clue = (await page.locator('.question-heading h1').textContent())!;
  const answer = concepts.find(
    (concept) =>
      concept.description === clue ||
      concept.fact === clue ||
      `Find the ${concept.word.toLowerCase()}.` === clue ||
      (concept.category === 'colors' && `Find the color ${concept.word.toLowerCase()}.` === clue) ||
      (concept.category === 'numbers' && `Find the number ${concept.word.toLowerCase()}.` === clue),
  );
  expect(answer, `The rendered clue must describe a curriculum concept: ${clue}`).toBeTruthy();
  return answer!;
}

test.describe('desktop learning journeys', () => {
  test('opening a concept plays its real recording and persists discovery across reloads', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Explore Fruits', exact: true }).click();
    const recording = page.waitForResponse((response) =>
      response.url().endsWith('/audio/apple.mp3'),
    );
    await page.getByRole('button', { name: 'Discover Apple', exact: true }).focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog', { name: 'Apple discovery' })).toBeVisible();
    const response = await recording;
    expect(response.ok()).toBeTruthy();
    expect(response.headers()['content-type']).toContain('audio/mpeg');
    const fullRecording = readFileSync(new URL('../../public/audio/apple.mp3', import.meta.url));
    expect(fullRecording.byteLength).toBeGreaterThan(1000);
    const body = await response.body();
    if (response.status() === 206) {
      // WebKit first probes a tiny byte range before loading the audio stream.
      const range = /^bytes (\d+)-(\d+)\/(\d+)$/.exec(response.headers()['content-range']);
      expect(range).not.toBeNull();
      const [, start, end, total] = range!.map(Number);
      expect(total).toBe(fullRecording.byteLength);
      expect(body.equals(fullRecording.subarray(start, end + 1))).toBeTruthy();
    } else {
      expect(response.status()).toBe(200);
      expect(body.equals(fullRecording)).toBeTruthy();
    }
    await expect.poll(async () => (await savedProgress(page)).discovered).toEqual(['apple']);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await page.getByRole('button', { name: 'Discover Apple', exact: true }).click();
    await page.keyboard.press('Escape');
    expect((await savedProgress(page)).discovered).toEqual(['apple']);
    expect(sessionCount(await savedProgress(page))).toBe(0);
    await page.reload();
    await page.getByRole('button', { name: 'Explore Fruits', exact: true }).click();
    await expect(
      page.getByRole('button', { name: 'Discover Apple', exact: true }).locator('.discovered-dot'),
    ).toBeVisible();
    expect((await savedProgress(page)).discovered).toEqual(['apple']);
  });

  test('parent check rejects a wrong answer and younger stage changes both games', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Learning stage:/ }).click();
    const dialog = page.getByRole('dialog', { name: 'Parents’ corner' });
    await dialog.getByRole('textbox', { name: 'Answer to parent check' }).fill('0');
    await dialog.getByRole('button', { name: 'Continue', exact: true }).click();
    await expect(dialog.getByRole('alert')).toBeVisible();
    await expect(dialog.getByRole('radiogroup', { name: 'Learning age' })).toHaveCount(0);
    await page.keyboard.press('Escape');
    await setAge(page, '3-4');
    expect((await savedProgress(page)).ageBand).toBe('3-4');
    await startFruitQuiz(page);
    await expect(page.locator('.answer-card')).toHaveCount(2);
    await page.getByRole('button', { name: 'Back to exploring', exact: true }).click();
    await page.getByRole('button', { name: 'Save & leave', exact: true }).click();
    await page
      .getByRole('navigation', { name: 'Main navigation', exact: true })
      .getByRole('button', { name: 'Play & learn', exact: true })
      .click();
    await page.getByRole('button', { name: 'Let’s match', exact: true }).click();
    await expect(page.locator('.match-column').first().getByRole('button')).toHaveCount(3);
    await expect(page.locator('.match-column').last().getByRole('button')).toHaveCount(3);
    await expect(page.locator('.match-column').last().locator('img')).toHaveCount(3);
  });

  test('wrong-then-correct quiz answers count once per attempt and review only missed concepts', async ({
    page,
  }) => {
    await page.goto('/');
    await startFruitQuiz(page);
    const first = await answerForCurrentQuestion(page);
    const wrong = page
      .locator('.answer-card')
      .filter({ hasNot: page.locator(`img[src="${first.art}"]`) })
      .first();
    await wrong.click();
    await expect(wrong).toBeDisabled();
    await expect
      .poll(async () => (await savedProgress(page)).attempts[first.id])
      .toEqual({ total: 1, correct: 0 });
    expect((await savedProgress(page)).days[localDate()].words).toEqual([]);
    expect(sessionCount(await savedProgress(page))).toBe(0);

    const correct = page.getByRole('button', { name: `Choose ${first.word}`, exact: true });
    await correct.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('.answer-correct')).toHaveCount(1);
    await expect(page.getByRole('button', { name: 'Next discovery', exact: true })).toBeFocused();
    await expect
      .poll(async () => (await savedProgress(page)).attempts[first.id])
      .toEqual({ total: 2, correct: 1 });
    await page.keyboard.press('Enter');

    for (let index = 1; index < 6; index += 1) {
      const answer = await answerForCurrentQuestion(page);
      await page.getByRole('button', { name: `Choose ${answer.word}`, exact: true }).click();
      await page
        .getByRole('button', {
          name: index === 5 ? 'Finish adventure' : 'Next discovery',
          exact: true,
        })
        .click();
    }
    await expect(page.locator('.celebration')).toBeVisible();
    await expect.poll(async () => sessionCount(await savedProgress(page))).toBe(1);
    const progress = await savedProgress(page);
    expect(progress.days[localDate()].words).toHaveLength(6);
    expect(Object.values(progress.attempts).reduce((sum, attempt) => sum + attempt.total, 0)).toBe(
      7,
    );
    await page.getByRole('button', { name: 'Revisit 1 discovery', exact: true }).click();
    expect((await answerForCurrentQuestion(page)).id).toBe(first.id);
    await page.getByRole('button', { name: `Choose ${first.word}`, exact: true }).click();
    await page.getByRole('button', { name: 'Finish adventure', exact: true }).click();
    await expect.poll(async () => sessionCount(await savedProgress(page))).toBe(2);
    expect((await savedProgress(page)).days[localDate()].words).toHaveLength(6);
    await expect(page.getByRole('button', { name: 'Play again', exact: true })).toBeVisible();
  });

  test('matching blocks mismatched picks, then completes each pair once', async ({ page }) => {
    await page.goto('/');
    await page
      .getByRole('navigation', { name: 'Main navigation', exact: true })
      .getByRole('button', { name: 'Play & learn', exact: true })
      .click();
    await page.getByRole('button', { name: 'Fruits', exact: true }).click();
    await page.getByRole('button', { name: 'Let’s match', exact: true }).click();
    const left = page.locator('.match-column').first();
    const labels = await left
      .getByRole('button')
      .evaluateAll((buttons) =>
        buttons.map((button) => button.getAttribute('aria-label')!.replace('Picture: ', '')),
      );
    expect(labels).toHaveLength(4);
    await page.getByRole('button', { name: `Picture: ${labels[0]}`, exact: true }).click();
    await page.getByRole('button', { name: `Word: ${labels[1]}`, exact: true }).click();
    await expect(page.locator('.match-wrong')).toHaveCount(2);
    await expect(
      page.getByRole('button', { name: `Picture: ${labels[0]}`, exact: true }),
    ).toBeDisabled();
    await expect(page.locator('.match-wrong')).toHaveCount(0);
    for (const label of labels) {
      await page.getByRole('button', { name: `Picture: ${label}`, exact: true }).click();
      await page.getByRole('button', { name: `Word: ${label}`, exact: true }).click();
      await expect(
        page.getByRole('button', { name: `Picture: ${label}`, exact: true }),
      ).toBeDisabled();
    }
    await expect(page.locator('.match-complete')).toHaveCount(8);
    expect(sessionCount(await savedProgress(page))).toBe(0);
    await page.getByRole('button', { name: 'Finish adventure', exact: true }).click();
    await expect.poll(async () => sessionCount(await savedProgress(page))).toBe(1);
    expect((await savedProgress(page)).days[localDate()].words).toHaveLength(4);
    expect(
      Object.values((await savedProgress(page)).attempts).reduce(
        (sum, item) => sum + item.total,
        0,
      ),
    ).toBe(5);
    await expect(
      page.getByRole('button', { name: 'Revisit 1 discovery', exact: true }),
    ).toBeVisible();
  });

  test('mute persists, suppresses clip playback, and can be switched back on', async ({ page }) => {
    const audioRequests: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/audio/')) audioRequests.push(request.url());
    });
    await page.goto('/');
    await page.getByRole('button', { name: 'Turn sound off', exact: true }).click();
    await page.getByRole('button', { name: 'Explore Fruits', exact: true }).click();
    await page.getByRole('button', { name: 'Discover Banana', exact: true }).click();
    await expect(page.getByRole('status')).toContainText('Sound is off');
    expect(audioRequests).toEqual([]);
    expect((await savedProgress(page)).sound).toBe(false);
    await page.keyboard.press('Escape');
    await page.reload();
    await expect(page.getByRole('button', { name: 'Turn sound on', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Turn sound on', exact: true }).click();
    await page.getByRole('button', { name: 'Explore Fruits', exact: true }).click();
    const audio = page.waitForResponse((response) => response.url().endsWith('/audio/banana.mp3'));
    await page.getByRole('button', { name: 'Discover Banana', exact: true }).click();
    expect((await audio).ok()).toBeTruthy();
  });

  test('a blocked storage write is reported to parents while discovery still works', async ({
    page,
  }) => {
    await page.addInitScript((key) => {
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = function (name, value) {
        if (name === key) throw new DOMException('Storage is full', 'QuotaExceededError');
        return original.call(this, name, value);
      };
    }, STORAGE_KEY);
    await page.goto('/');
    await page.getByRole('button', { name: 'Discover Apple', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Apple discovery' })).toBeVisible();
    await page.keyboard.press('Escape');
    const dialog = await openParents(page);
    await expect(
      dialog.getByText('Your browser is blocking saved storage.', { exact: false }),
    ).toBeVisible();
    await dialog.getByRole('radio', { name: /3–4/ }).click();
    await expect(dialog.getByRole('radio', { name: /3–4/ })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  test('a search with no matches can be cleared without leaving exploration stuck', async ({
    page,
  }) => {
    await page.goto('/');
    const search = page.getByRole('textbox', { name: 'Search discoveries' });
    await search.fill('not-an-existing-concept');
    await expect(page.locator('.browse-grid .concept-card')).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: 'Explore all topics', exact: true }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Clear search', exact: true }).click();
    await expect(search).toHaveValue('');
    await expect(page.locator('.topic-card')).toHaveCount(6);
    await search.fill('ApPlE');
    await expect(page.locator('.browse-grid .concept-card')).toHaveCount(1);
    await expect(page.getByRole('button', { name: 'Discover Apple', exact: true })).toBeVisible();
  });
});

test.describe('phone touch journeys', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test('touch discovery, modal dismissal, and mobile navigation stay usable', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Explore Animals', exact: true }).tap();
    await page.getByRole('button', { name: 'Discover Rabbit', exact: true }).tap();
    await expect(page.getByRole('dialog', { name: 'Rabbit discovery' })).toBeVisible();
    await page.getByRole('button', { name: 'Close Rabbit discovery', exact: true }).tap();
    await page
      .getByRole('navigation', { name: 'Mobile navigation', exact: true })
      .getByRole('button', { name: 'My discoveries', exact: true })
      .tap();
    await expect(page.locator('.stat-card').first()).toContainText('1');
    expect((await savedProgress(page)).discovered).toEqual(['rabbit']);
    const sizes = await page.evaluate(() => ({
      width: innerWidth,
      page: document.documentElement.scrollWidth,
    }));
    expect(sizes.page).toBeLessThanOrEqual(sizes.width);
  });

  test('youngest stage uses two tappable choices and saves leaving without a completed session', async ({
    page,
  }) => {
    await page.goto('/');
    await setAge(page, '3-4');
    await startFruitQuiz(page);
    await expect(page.locator('.answer-card')).toHaveCount(2);
    const answer = await answerForCurrentQuestion(page);
    await page.getByRole('button', { name: `Choose ${answer.word}`, exact: true }).tap();
    await expect(page.locator('.answer-correct')).toHaveCount(1);
    await page.getByRole('button', { name: 'Back to exploring', exact: true }).tap();
    await page.getByRole('button', { name: 'Keep playing', exact: true }).tap();
    await expect(page.locator('.answer-correct')).toHaveCount(1);
    await page.getByRole('button', { name: 'Back to exploring', exact: true }).tap();
    await page.getByRole('button', { name: 'Save & leave', exact: true }).tap();
    await expect(page.locator('.practice-shell')).toHaveCount(0);
    expect((await savedProgress(page)).attempts[answer.id]).toEqual({ total: 1, correct: 1 });
    expect(sessionCount(await savedProgress(page))).toBe(0);
  });
});
