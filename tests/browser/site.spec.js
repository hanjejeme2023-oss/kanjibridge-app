import { expect, test } from '@playwright/test';

test('overview and deployed app assets are present', async ({ page, request }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('http://127.0.0.1:4173/', { waitUntil: 'load' });
  await expect(page).toHaveTitle('漢字ブリッジ');
  await expect(page.locator('main a')).toHaveCount(1);
  await expect(page.locator('main a')).toHaveAttribute('href', '/app/');
  for (const path of [
    '/app/data.js',
    '/app/NOTICE.md',
    '/app/LICENSE-DATA',
    '/app/licenses/CC-BY-SA-4.0.txt',
  ]) {
    expect((await request.get(`http://127.0.0.1:4173${path}`)).status(), path).toBe(200);
  }
  expect(errors).toEqual([]);
});
