import { expect, test } from '@playwright/test';
import { concepts } from '../../src/data/curriculum';
import { localizeConcept } from '../../src/data/localization';
import { LANGUAGE_STORAGE_KEY } from '../../src/lib/language';
import { STORAGE_KEY } from '../../src/lib/progress';

test('switching language changes cards and audio, persists, and keeps discoveries', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Discover Apple', exact: true }).click();
  await page.getByRole('button', { name: 'Close Apple discovery', exact: true }).click();
  const before = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);

  await page.getByRole('button', { name: '中文', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
  await expect(page.getByRole('heading', { name: '你好，小小探索家。' })).toBeVisible();
  await page.getByRole('textbox', { name: '搜索认知内容' }).fill('苹果');
  await expect(page.locator('.browse-grid .concept-card')).toHaveCount(1);
  const recording = page.waitForResponse((response) =>
    response.url().endsWith('/audio/zh/apple.mp3'),
  );
  await page.getByRole('button', { name: '认识苹果', exact: true }).click();
  expect((await recording).ok()).toBeTruthy();
  await expect(page.getByRole('dialog', { name: '认识苹果' })).toContainText(
    '它是一种圆圆的红色水果。',
  );
  await page.getByRole('button', { name: '关闭认识苹果', exact: true }).click();
  expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBe(before);
  await page.reload();
  await expect(page.getByRole('button', { name: '中文', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  expect(await page.evaluate((key) => localStorage.getItem(key), LANGUAGE_STORAGE_KEY)).toBe('zh');
  await page.getByRole('button', { name: 'English', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { name: 'Hello, little explorer.' })).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Discover Apple', exact: true }).locator('.discovered-dot'),
  ).toBeVisible();
  const englishRecording = page.waitForResponse((response) =>
    response.url().endsWith('/audio/apple.mp3'),
  );
  await page.getByRole('button', { name: 'Discover Apple', exact: true }).click();
  expect((await englishRecording).ok()).toBeTruthy();
  await expect(page.getByRole('dialog', { name: 'Apple discovery' })).toContainText(
    'It is a round red fruit.',
  );
});

test('Chinese quiz and matching use translated clues and preserve learning progress', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: '中文', exact: true }).click();
  await page.getByRole('button', { name: '探索水果', exact: true }).click();
  const promptAudio = page.waitForResponse((response) =>
    /\/audio\/zh\/question-5-6-.*\.mp3$/.test(response.url()),
  );
  await page.locator('.category-intro .button').click();
  expect((await promptAudio).ok()).toBeTruthy();
  for (let i = 0; i < 6; i += 1) {
    const prompt = await page.locator('.question-heading h1').textContent();
    const answer = concepts
      .map((concept) => localizeConcept(concept, 'zh'))
      .find((concept) => concept.description === prompt);
    expect(answer).toBeTruthy();
    await expect(page.locator('.answer-card')).toHaveCount(4);
    await page.getByRole('button', { name: `选择${answer!.word}`, exact: true }).click();
    await page
      .getByRole('button', { name: i === 5 ? '完成探索' : '下一个发现', exact: true })
      .click();
  }
  await expect(page.locator('.celebration')).toBeVisible();
  const progress = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    STORAGE_KEY,
  );
  expect(Object.keys(progress.attempts)).toHaveLength(6);
  await page.getByRole('button', { name: 'English', exact: true }).click();
  await page
    .getByRole('navigation', { name: 'Main navigation', exact: true })
    .getByRole('button', { name: 'Play & learn', exact: true })
    .click();
  await page.getByRole('button', { name: '中文', exact: true }).click();
  await page.getByRole('button', { name: '水果', exact: true }).click();
  await page.locator('.game-card').nth(1).getByRole('button').click();
  const cards = page.locator('.match-column').first().getByRole('button');
  const words = await cards.evaluateAll((buttons) =>
    buttons.map((button) => button.getAttribute('aria-label')!.split('：')[1]),
  );
  expect(words).toHaveLength(4);
  for (const word of words) {
    expect(word).toMatch(/\p{Script=Han}/u);
    await page.getByRole('button', { name: `图片：${word}`, exact: true }).click();
    await page.getByRole('button', { name: `词语：${word}`, exact: true }).click();
  }
  await page.getByRole('button', { name: '完成探索', exact: true }).click();
  await expect(page.locator('.celebration')).toBeVisible();
});

test('parents can switch language without closing settings or resetting the chosen stage', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Learning stage:/ }).click();
  const dialog = page.getByRole('dialog');
  const challenge = await dialog.locator('label[for="parent-answer"]').textContent();
  const [a, b] = challenge!.match(/\d+/g)!.map(Number);
  await dialog.getByRole('textbox', { name: 'Answer to parent check' }).fill(String(a + b));
  await dialog.getByRole('button', { name: 'Continue', exact: true }).click();
  await dialog.getByRole('radio', { name: /7–8/ }).click();
  await dialog.getByRole('radio', { name: '简体中文', exact: true }).click();
  await expect(dialog).toHaveAttribute('aria-label', '家长专区');
  await expect(dialog.getByRole('radiogroup', { name: '学习年龄' })).toBeVisible();
  await expect(dialog.getByRole('radio', { name: /7–8/ })).toHaveAttribute('aria-checked', 'true');
  await expect(dialog.getByRole('switch', { name: '中文语音' })).toBeVisible();
  await dialog.getByRole('button', { name: '关闭家长专区', exact: true }).click();
  await page.reload();
  await expect(page.getByRole('button', { name: /学习阶段：7至8岁/ })).toBeVisible();
});

test.describe('mobile language controls', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  test('language switch is tappable on phones and tablet with no horizontal overflow', async ({
    page,
  }) => {
    await page.goto('/');
    for (const width of [390, 320, 768]) {
      await page.setViewportSize({ width, height: 844 });
      await page.getByRole('button', { name: '中文', exact: true }).tap();
      await expect(page.getByRole('heading', { name: '你好，小小探索家。' })).toBeVisible();
      const dimensions = await page.evaluate(() => ({
        width: innerWidth,
        page: document.documentElement.scrollWidth,
      }));
      expect(dimensions.page).toBeLessThanOrEqual(dimensions.width);
      await page.getByRole('button', { name: 'English', exact: true }).tap();
      await expect(page.getByRole('heading', { name: 'Hello, little explorer.' })).toBeVisible();
    }
  });
});
