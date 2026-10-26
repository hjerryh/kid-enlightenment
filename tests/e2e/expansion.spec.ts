import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { concepts } from '../../src/data/curriculum';
import { animalIdsByGroup } from '../../src/data/animals';
import { localizeConcept } from '../../src/data/localization';
import { freshProgress, localDate, STORAGE_KEY } from '../../src/lib/progress';
import type { Progress } from '../../src/lib/progress';

async function savedProgress(page: Page): Promise<Progress> {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), STORAGE_KEY);
}

async function currentAnswer(page: Page) {
  const prompt = await page.locator('.question-heading h1').textContent();
  const answer = concepts.find((concept) => concept.description === prompt);
  expect(answer, `A known animal must answer the rendered clue: ${prompt}`).toBeTruthy();
  return answer!;
}

async function expectWaterOptions(page: Page) {
  const sources = await page
    .locator('.answer-card img')
    .evaluateAll((images) => images.map((image) => image.getAttribute('src')));
  expect(sources).toHaveLength(4);
  expect(new Set(sources).size).toBe(4);
  for (const src of sources) {
    const concept = concepts.find((candidate) => candidate.art === src);
    expect(animalIdsByGroup.water).toContain(concept?.id);
  }
}

test('number cards show zero to nineteen in order, switch languages, and fit tablets and phones', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1194, height: 834 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Explore Numbers', exact: true }).click();
  const grid = page.locator('.number-browse-grid');
  const cards = grid.locator('.concept-card');
  await expect(cards).toHaveCount(20);
  await expect(page.locator('.result-count')).toHaveText('20 discoveries');
  const expectedNumbers = Array.from({ length: 20 }, (_, index) => String(index));
  expect(await cards.locator('.concept-category').allTextContents()).toEqual(expectedNumbers);
  const numberConcepts = concepts.filter((concept) => concept.category === 'numbers');
  expect(await cards.locator('.concept-name').allTextContents()).toEqual(
    numberConcepts.map(({ word }) => word),
  );
  expect(
    await cards
      .locator('img')
      .evaluateAll((images) => images.map((image) => image.getAttribute('src'))),
  ).toEqual(numberConcepts.map(({ id }) => `/art/numbers/${id}.webp`));
  expect(
    await grid.evaluate(
      (element) => getComputedStyle(element).gridTemplateColumns.split(' ').length,
    ),
  ).toBe(4);
  await expect
    .poll(() =>
      cards
        .first()
        .locator('img')
        .evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0),
    )
    .toBe(true);
  await cards.last().scrollIntoViewIfNeeded();
  await expect
    .poll(() =>
      cards
        .last()
        .locator('img')
        .evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0),
    )
    .toBe(true);

  await page.getByRole('button', { name: '中文', exact: true }).click();
  await expect(page.locator('.result-count')).toHaveText('20 个发现');
  expect(await cards.locator('.concept-name').allTextContents()).toEqual(
    numberConcepts.map((concept) => localizeConcept(concept, 'zh').word),
  );
  await page.getByRole('textbox', { name: '搜索认知内容' }).fill('19');
  await expect(cards).toHaveCount(1);
  await expect(page.getByRole('button', { name: '认识十九', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'English', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Discover Nineteen', exact: true })).toBeVisible();
  await page.getByRole('textbox', { name: 'Search discoveries' }).fill('0');
  await expect(cards).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Discover Zero', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Clear search', exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(cards).toHaveCount(20);
  expect(
    await grid.evaluate(
      (element) => getComputedStyle(element).gridTemplateColumns.split(' ').length,
    ),
  ).toBe(2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('animal collections expose twelve zodiac and fifty additional animals in both languages', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Explore Animals', exact: true }).click();
  const expectedGroups = [
    { en: 'Chinese zodiac', zh: '十二生肖', count: 12 },
    { en: 'Land animals', zh: '陆地动物', count: 23 },
    { en: 'Birds', zh: '鸟类朋友', count: 10 },
    { en: 'Water animals', zh: '水中动物', count: 9 },
    { en: 'More animal friends', zh: '更多动物朋友', count: 8 },
  ];
  expect(expectedGroups.slice(1).reduce((sum, group) => sum + group.count, 0)).toBe(50);
  for (const language of ['en', 'zh'] as const) {
    await page
      .getByRole('button', { name: language === 'en' ? 'English' : '中文', exact: true })
      .click();
    const filters = page.getByRole('group', {
      name: language === 'en' ? 'Animal groups' : '动物分类',
      exact: true,
    });
    await filters
      .getByRole('button', { name: language === 'en' ? /^All animals/ : /^全部动物/ })
      .click();
    await expect(page.locator('.browse-grid .concept-card')).toHaveCount(62);
    await expect(page.locator('.result-count')).toHaveText(
      language === 'en' ? '62 discoveries' : '62 个发现',
    );
    for (const group of expectedGroups) {
      const chip = filters.getByRole('button', { name: new RegExp(`^${group[language]}`) });
      await expect(chip.locator('.filter-count')).toHaveText(String(group.count));
      await chip.click();
      await expect(chip).toHaveAttribute('aria-pressed', 'true');
      const cards = page.locator('.browse-grid .concept-card');
      await expect(cards).toHaveCount(group.count);
      await expect
        .poll(() =>
          cards
            .first()
            .locator('img')
            .evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0),
        )
        .toBe(true);
      if (group.en === 'Chinese zodiac') {
        await expect(
          page.getByRole('button', {
            name: language === 'en' ? 'Discover Dragon' : '认识龙',
            exact: true,
          }),
        ).toContainText(language === 'en' ? 'Mythical animal' : '传说中的动物');
        await page
          .getByRole('button', { name: language === 'en' ? 'Discover Pig' : '认识猪', exact: true })
          .click();
        const dialog = page.getByRole('dialog');
        await dialog
          .getByRole('button', {
            name: language === 'en' ? 'Next discovery' : '下一个发现',
            exact: true,
          })
          .click();
        await expect(
          dialog.getByRole('heading', { name: language === 'en' ? 'Rat' : '鼠', exact: true }),
        ).toBeVisible();
        await dialog
          .getByRole('button', {
            name: language === 'en' ? 'Previous discovery' : '上一个发现',
            exact: true,
          })
          .click();
        await expect(
          dialog.getByRole('heading', { name: language === 'en' ? 'Pig' : '猪', exact: true }),
        ).toBeVisible();
        await page.keyboard.press('Escape');
      }
    }
  }
});

test('a water-animal quiz and targeted review stay in the selected group and retain earlier progress', async ({
  page,
}) => {
  const oldProgress: Progress = {
    ...freshProgress(),
    discovered: ['apple', 'rabbit', 'three'],
    attempts: { apple: { total: 2, correct: 1 } },
    days: { '2026-01-02': { words: ['apple'], sessions: 2 } },
  };
  await page.addInitScript(
    ({ key, progress }) => {
      if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(progress));
    },
    { key: STORAGE_KEY, progress: oldProgress },
  );
  await page.goto('/');
  const navigation = page.getByRole('navigation', { name: 'Main navigation', exact: true });
  await navigation.getByRole('button', { name: 'My discoveries', exact: true }).click();
  await expect(page.locator('.stat-card').first().locator('strong')).toHaveText('3 / 106');
  await navigation.getByRole('button', { name: 'Explore', exact: true }).click();
  await page.getByRole('button', { name: 'Explore Animals', exact: true }).click();
  await page
    .getByRole('group', { name: 'Animal groups', exact: true })
    .getByRole('button', { name: /^Water animals/ })
    .click();
  await page.getByRole('button', { name: 'Practice water animals', exact: true }).click();
  await expect(page.locator('.session-progress strong')).toHaveText('1 / 6');
  const first = await currentAnswer(page);
  expect(animalIdsByGroup.water).toContain(first.id);
  const practicedIds: string[] = [];
  for (let index = 0; index < 6; index += 1) {
    const answer = await currentAnswer(page);
    practicedIds.push(answer.id);
    await expectWaterOptions(page);
    if (index === 0) {
      const wrong = page
        .locator('.answer-card')
        .filter({ hasNot: page.locator(`img[src="${answer.art}"]`) })
        .first();
      await wrong.click();
      await expect(wrong).toBeDisabled();
    }
    await page.getByRole('button', { name: `Choose ${answer.word}`, exact: true }).click();
    await page
      .getByRole('button', {
        name: index === 5 ? 'Finish adventure' : 'Next discovery',
        exact: true,
      })
      .click();
  }
  expect(new Set(practicedIds).size).toBe(6);
  await page.getByRole('button', { name: 'Revisit 1 discovery', exact: true }).click();
  await expect(page.locator('.session-progress strong')).toHaveText('1 / 1');
  expect((await currentAnswer(page)).id).toBe(first.id);
  await expectWaterOptions(page);
  await page.getByRole('button', { name: `Choose ${first.word}`, exact: true }).click();
  await page.getByRole('button', { name: 'Finish adventure', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Play again', exact: true })).toBeVisible();
  const saved = await savedProgress(page);
  expect(saved.attempts.apple).toEqual({ total: 2, correct: 1 });
  expect(saved.days['2026-01-02']).toEqual(oldProgress.days['2026-01-02']);
  expect(saved.attempts[first.id]).toEqual({ total: 3, correct: 2 });
  expect(saved.days[localDate()].sessions).toBe(2);
  expect(saved.days[localDate()].words).toHaveLength(6);
  expect(saved.discovered).toHaveLength(9);
  expect(saved.discovered).toEqual(expect.arrayContaining(oldProgress.discovered));
  await page.reload();
  await navigation.getByRole('button', { name: 'My discoveries', exact: true }).click();
  await expect(page.locator('.stat-card').first().locator('strong')).toHaveText('9 / 106');
});

test('Chinese matching draws every pair from the selected bird collection', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '中文', exact: true }).click();
  await page
    .getByRole('navigation', { name: '主导航', exact: true })
    .getByRole('button', { name: '玩中学', exact: true })
    .click();
  await page.getByRole('button', { name: '动物', exact: true }).click();
  await page
    .getByRole('group', { name: '动物分类', exact: true })
    .getByRole('button', { name: /^鸟类朋友/ })
    .click();
  await page.getByRole('button', { name: '开始配一配', exact: true }).click();
  const left = page.locator('.match-column').first();
  await expect(left.getByRole('button')).toHaveCount(4);
  const words = await left
    .getByRole('button')
    .evaluateAll((buttons) =>
      buttons.map((button) => button.getAttribute('aria-label')!.replace('图片：', '')),
    );
  const birdWords = animalIdsByGroup.birds.map(
    (id) =>
      localizeConcept(
        concepts.find((concept) => concept.id === id)!,
        'zh',
      ).word,
  );
  expect(new Set(words).size).toBe(4);
  for (const word of words) {
    expect(birdWords).toContain(word);
    await page.getByRole('button', { name: `图片：${word}`, exact: true }).click();
    await page.getByRole('button', { name: `词语：${word}`, exact: true }).click();
  }
  await expect(page.locator('.match-complete')).toHaveCount(8);
  await page.getByRole('button', { name: '完成探索', exact: true }).click();
  await expect(page.locator('.celebration')).toBeVisible();
  const saved = await savedProgress(page);
  expect(Object.keys(saved.attempts)).toHaveLength(4);
  expect(Object.keys(saved.attempts).every((id) => animalIdsByGroup.birds.includes(id))).toBe(true);
});
