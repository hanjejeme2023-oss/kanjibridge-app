import { expect, test } from '@playwright/test';

test('new app passes the app v2 gate invariants', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  page.on('console', (message) => {
    if (message.type() === 'error' && !/Failed to load resource/.test(message.text())) errors.push(message.text());
  });
  await page.route('**/*', async (route) => {
    const host = new URL(route.request().url()).hostname;
    if (host !== '127.0.0.1') await route.abort();
    else await route.continue();
  });
  await page.goto('http://127.0.0.1:4173/app/', { waitUntil: 'load' });
  await expect(page).toHaveTitle('漢字ブリッジ');
  await expect(page.locator('.tab-explain')).toHaveCount(5);
  await expect(page.locator('#count-rules')).toHaveText('8');
  await expect(page.locator('#count-ff')).toHaveText('1,242');
  await expect(page.locator('#count-read')).toHaveText('80');
  await expect(page.locator('#count-glyph')).toHaveText('2,164');

  await page.locator('#nav button[data-v="ff"]').click();
  await expect(page.locator('#fflist .tile')).toHaveCount(1242, { timeout: 60_000 });
  await page.locator('#nav button[data-v="glyph"]').click();
  await expect(page.locator('#glyphbox .grow')).toHaveCount(2164, { timeout: 60_000 });
  await page.locator('#gmode button[data-g="quiz"]').click();
  await expect(page.locator('#glyphbox .grow')).toHaveCount(2164, { timeout: 60_000 });

  await page.locator('#about').click();
  await expect(page.locator('#aboutpanel')).toContainText('These files are the property of the Electronic Dictionary Research and Development Group');
  await expect(page.locator('#aboutpanel')).toContainText('AI（Google Gemini）');
  await expect(page.locator('#aboutpanel a')).toHaveAttribute('href', 'https://github.com/hanjejeme2023-oss/kanji-bridge');
  const bad = await page.locator('main,header').allTextContents();
  expect(bad.join('')).not.toMatch(/undefined|NaN|\bnull\b|\[object/);
  expect(errors).toEqual([]);
});
