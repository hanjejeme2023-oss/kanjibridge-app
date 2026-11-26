import { expect, test } from '@playwright/test';

test('the imported app v2 gate harness passes', async ({ page }) => {
  await page.route('**/*', async (route) => {
    const host = new URL(route.request().url()).hostname;
    if (host !== '127.0.0.1') await route.abort();
    else await route.continue();
  });
  await page.goto('http://127.0.0.1:4174/harness.html');
  await expect(page).toHaveTitle('HARNESS DONE', { timeout: 170_000 });
  const output = JSON.parse(await page.locator('#harness-out').textContent());
  expect(output.errors).toEqual([]);
  expect(output.fail).toEqual([]);
  expect(output.bad).toEqual([]);
  expect(output.exception).toBeUndefined();
  expect(output.checks.tone).toMatchObject({ deck: 6983, zhBad: 0, viBad: 0, glyphBad: 0 });
  test.info().attach('baseline-tone.json', {
    body: JSON.stringify(output.checks.tone, null, 2),
    contentType: 'application/json',
  });
});
