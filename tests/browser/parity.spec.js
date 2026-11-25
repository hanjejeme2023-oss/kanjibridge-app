import { chromium, expect, test as base } from '@playwright/test';
import { createParity, inspectBaseline, nav } from './lib/parity.js';

const test = base.extend({
  isolatedBrowser: async ({}, use) => {
    const browser = await chromium.launch({ args: ['--disable-gpu', '--disable-gpu-rasterization', '--disable-font-subpixel-positioning'] });
    try { await use(browser); } finally { await browser.close(); }
  },
});

const jsonStorage = (values) => Object.fromEntries(
  Object.entries(values).map(([key, value]) => [key, JSON.stringify(value)]),
);

async function baselineFixtures(browser) {
  return inspectBaseline(browser, (page) => page.evaluate(() => {
    const passageWords = PASSAGES.slice(0, 3).flatMap((passage) => passage.toks.filter((token) => token.w).map((token) => token.w.id));
    return {
      deck: WORDS.slice(0, 24).map((word) => word.id),
      passageWords: [...new Set(passageWords)],
      passages: PASSAGES.slice(0, 3).map((passage) => passage.id),
      rules: RULES.slice(0, 2).map((rule) => ({ id: rule.id, han: rule.ex[0][0], key: `${rule.id}:${rule.ex[0][0]}` })),
      glyphs: [3, 10, 400, 2000, 1000].map((index) => GLYPHS[index][7]),
      ff: FF.slice(0, 4).map((row) => row.id),
    };
  }));
}

async function checkpointViews(pair, prefix, { styles = false } = {}) {
  await pair.checkpoint(`${prefix}-cards`, { styles });
  for (const view of ['rules', 'ff', 'read', 'glyph']) {
    await pair.act((page) => nav(page, view));
    await pair.checkpoint(`${prefix}-${view}`, { styles });
  }
}

test('P1-01..07 cards gate walk parity', async ({ isolatedBrowser: browser }) => {
  const pair = await createParity(browser);
  try {
    await pair.checkpoint('P1-01', { styles: true });
    const answer = await pair.valueFromBaseline((page) => page.evaluate(() => cur.v.normalize('NFD').replace(/[̣́̀̉̃]/g, '').normalize('NFC')));
    await pair.act(async (page) => { await page.locator('#gvi').fill(answer); await page.locator('#gvi').press('Enter'); });
    await pair.checkpoint('P1-02');
    await pair.act((page) => page.keyboard.press('3')); await pair.checkpoint('P1-03');
    await pair.act(async (page) => { await page.locator('#gvi').fill('zzz'); await page.locator('#gvi').press('Enter'); });
    await pair.checkpoint('P1-04');
    await pair.act((page) => page.keyboard.press('1'));
    await pair.act(async (page) => { await page.locator(':focus').blur(); await page.keyboard.press('Space'); });
    await pair.checkpoint('P1-05');
    await pair.act((page) => page.keyboard.press('2'));
    await pair.act((page) => page.locator('#target button[data-t="both"]').click()); await pair.checkpoint('P1-06');
    await pair.act((page) => page.locator('#target button[data-t="vi"]').click()); await pair.checkpoint('P1-07');
  } finally { await pair.close(); }
});

test('P1-08..16 rules gate walk parity', async ({ isolatedBrowser: browser }) => {
  const pair = await createParity(browser);
  try {
    await pair.act((page) => nav(page, 'rules')); await pair.checkpoint('P1-08', { styles: true });
    await pair.act((page) => page.locator('#ruletest').click()); await pair.checkpoint('P1-09');
    const answer = await pair.valueFromBaseline((page) => page.evaluate(() => RULES.find((row) => row.id === ruleSel).ex[0][3]));
    await pair.act(async (page) => { const input = page.locator('input[data-test-cell]').first(); await input.fill(answer); await input.blur(); }); await pair.checkpoint('P1-10');
    await pair.act(async (page) => { const input = page.locator('input[data-test-cell]').nth(1); await input.fill('qqq'); await input.press('Enter'); }); await pair.checkpoint('P1-11');
    await pair.act(async (page) => { const input = page.locator('input[data-test-cell]').nth(2); await input.fill('ab'); await input.press('Space'); }); await pair.checkpoint('P1-12');
    await pair.act(async (page) => { await page.locator('#ruletest').click(); await page.locator('#ruletest').click(); }); await pair.checkpoint('P1-13');
    await pair.act(async (page) => { await page.locator('#ruletest').click(); await page.keyboard.press('1'); await page.keyboard.press('Enter'); }); await pair.checkpoint('P1-14');
    const count = await pair.valueFromBaseline((page) => page.locator('#rulebar button').count());
    for (let index = 0; index < count; index += 1) {
      await pair.act((page) => page.locator('#rulebar button').nth(index).click());
      await pair.checkpoint(`P1-15-${index + 1}`);
    }
    await pair.act((page) => page.locator('#ruledetail details').evaluate((node) => { node.open = true; node.dispatchEvent(new Event('toggle')); })); await pair.checkpoint('P1-16-open');
    await pair.act((page) => page.locator('#ruledetail details').evaluate((node) => { node.open = false; node.dispatchEvent(new Event('toggle')); })); await pair.checkpoint('P1-16-closed');
  } finally { await pair.close(); }
});

test('P1-17..27 false-friend gate walk parity', async ({ isolatedBrowser: browser }) => {
  const pair = await createParity(browser);
  try {
    await pair.act((page) => nav(page, 'ff')); await pair.checkpoint('P1-17', { styles: true });
    const paozi = await pair.valueFromBaseline((page) => page.evaluate(() => FF.find((row) => row.w === '包子').id));
    await pair.act((page) => page.locator(`#fflist .tile[data-w="${paozi}"]`).click()); await pair.checkpoint('P1-18');
    await pair.act((page) => page.locator('#fffilter button[data-f="vi"]').click()); await pair.checkpoint('P1-19');
    await pair.act((page) => page.locator('#fffilter button[data-f="all"]').click()); await pair.checkpoint('P1-20');
    await pair.act((page) => page.locator('#ffmode button[data-m="cards"]').click()); await pair.checkpoint('P1-21', { styles: true });
    await pair.act((page) => page.keyboard.press('Enter')); await pair.checkpoint('P1-22');
    await pair.act((page) => page.keyboard.press('1')); await pair.checkpoint('P1-23');
    await pair.act(async (page) => { await page.keyboard.press('Space'); await page.keyboard.press('2'); }); await pair.checkpoint('P1-24');
    await pair.act((page) => page.locator('#fflang button[data-l="vi"]').click()); await pair.checkpoint('P1-25');
    await pair.act((page) => page.keyboard.press('Enter')); await pair.checkpoint('P1-26');
    await pair.act((page) => page.locator('#ffmode button[data-m="list"]').click()); await pair.checkpoint('P1-27');
  } finally { await pair.close(); }
});

test('P1-28..34 reading gate walk parity', async ({ isolatedBrowser: browser }) => {
  const pair = await createParity(browser);
  try {
    await pair.act((page) => nav(page, 'read')); await pair.checkpoint('P1-28', { styles: true });
    await pair.act((page) => page.locator('.tok.sino .s').first().click()); await pair.checkpoint('P1-29');
    await pair.act(async (page) => { if (await page.locator('#addcard:not([disabled])').count()) await page.locator('#addcard').click(); }); await pair.checkpoint('P1-30');
    await pair.act((page) => page.locator('#psel button').nth(1).click()); await pair.checkpoint('P1-31');
    await pair.act((page) => page.locator('#psel button').nth(2).click()); await pair.checkpoint('P1-32');
    await pair.act((page) => page.locator('#showann').uncheck()); await pair.checkpoint('P1-33-off');
    await pair.act((page) => page.locator('#showann').check()); await pair.checkpoint('P1-33-on');
    await pair.act(async (page) => { await page.locator('#psel button').first().click(); await page.locator('.tok.sino .s').first().click(); await page.locator('[data-review-i]').first().click(); }); await pair.checkpoint('P1-34');
  } finally { await pair.close(); }
});

test('P1-35..40 glyph quiz answer parity', async ({ isolatedBrowser: browser }) => {
  const pair = await createParity(browser);
  try {
    await pair.act((page) => nav(page, 'glyph')); await pair.checkpoint('P1-35', { styles: true });
    await pair.act((page) => page.locator('#gmode button[data-g="quiz"]').click()); await pair.checkpoint('P1-36');
    const ids = await pair.valueFromBaseline((page) => page.evaluate(() => ({ huan: GLYPHS.find((glyph) => glyph[1] === '還')[7], xing: GLYPHS.find((glyph) => glyph[1] === '行')[7] })));
    await pair.act(async (page) => { const input = page.locator(`input[data-test-cell="${ids.huan}:zh"]`); await input.fill('hai, huan'); await input.press('Enter'); }); await pair.checkpoint('P1-37');
    await pair.act(async (page) => { const input = page.locator(`input[data-test-cell="${ids.huan}:vi"]`); await input.fill('hoan'); await input.blur(); }); await pair.checkpoint('P1-38');
    await pair.act(async (page) => { const input = page.locator(`input[data-test-cell="${ids.xing}:zh"]`); await input.fill('hang, xuan'); await input.blur(); }); await pair.checkpoint('P1-39');
    await pair.act((page) => page.locator('#gfilter button[data-p="wrong"]').click()); await pair.checkpoint('P1-40');
  } finally { await pair.close(); }
});

test('P1-41..48 glyph filters and reopen parity', async ({ isolatedBrowser: browser }) => {
  const pair = await createParity(browser);
  try {
    await pair.act(async (page) => { await nav(page, 'glyph'); await page.locator('#gmode button[data-g="quiz"]').click(); });
    const ids = await pair.valueFromBaseline((page) => page.evaluate(() => ({ huan: GLYPHS.find((glyph) => glyph[1] === '還')[7], xing: GLYPHS.find((glyph) => glyph[1] === '行')[7] })));
    await pair.act(async (page) => { const input = page.locator(`input[data-test-cell="${ids.huan}:zh"]`); await input.fill('hai, huan'); await input.press('Enter'); });
    await pair.act(async (page) => { const input = page.locator(`input[data-test-cell="${ids.huan}:vi"]`); await input.fill('hoan'); await input.blur(); });
    await pair.act(async (page) => { const input = page.locator(`input[data-test-cell="${ids.xing}:zh"]`); await input.fill('hang, xuan'); await input.blur(); });
    for (let level = 1; level <= 7; level += 1) {
      await pair.act((page) => page.locator(`#gfilter button[data-p="level-${level}"]`).click());
      await pair.checkpoint(`P1-${40 + level}`);
    }
    await pair.act(async (page) => { await page.locator('#gfilter button[data-p="all"]').click(); await page.locator('#gmode button[data-g="list"]').click(); await page.locator('#gmode button[data-g="quiz"]').click(); }); await pair.checkpoint('P1-48');
  } finally { await pair.close(); }
});

test('P1-49..50 glyph-to-ff parity', async ({ isolatedBrowser: browser }) => {
  const pair = await createParity(browser);
  try {
    await pair.act((page) => nav(page, 'glyph'));
    const glyph = await pair.valueFromBaseline((page) => page.evaluate(() => GLYPHS.find((row) => { const usage = USAGE.get(row[7]); return usage && [...usage.zh, ...usage.vi].some((item) => (WORD_BY_ID.get(item[0]) || {}).ff); })[7]));
    await pair.act((page) => page.locator(`details[data-usage="${glyph}"]`).evaluate((node) => { node.open = true; node.dispatchEvent(new Event('toggle')); })); await pair.checkpoint('P1-49');
    await pair.act((page) => page.locator(`details[data-usage="${glyph}"] [data-ff-word]`).first().click()); await pair.checkpoint('P1-50');
  } finally { await pair.close(); }
});

test('P1-51..52 global control and chunk parity', async ({ isolatedBrowser: browser }) => {
  const pair = await createParity(browser);
  try {
    await pair.act((page) => page.locator('#mute').click()); await pair.checkpoint('P1-51-on');
    await pair.act((page) => page.locator('#mute').click()); await pair.checkpoint('P1-51-off');
    await pair.act(async (page) => { await nav(page, 'glyph'); await page.locator('#gfilter button[data-p="diff"]').click(); await page.locator('#gfilter button[data-p="all"]').click(); await page.locator('#gmode button[data-g="quiz"]').click(); await page.locator('#gmode button[data-g="list"]').click(); }); await pair.checkpoint('P1-52');
  } finally { await pair.close(); }
});

test('P1-53..59 tile, About, and reset parity', async ({ isolatedBrowser: browser }) => {
  const pair = await createParity(browser);
  try {
    await pair.act(async (page) => { await nav(page, 'ff'); await page.locator('#fflist .tile').first().click(); }); await pair.checkpoint('P1-53');
    await pair.act((page) => page.locator('#fflist .tile').first().press('Enter')); await pair.checkpoint('P1-54');
    await pair.act((page) => page.locator('#about').click()); await pair.checkpoint('P1-55');
    await pair.act((page) => page.locator('#about').click()); await pair.checkpoint('P1-56');
    await pair.act(async (page) => { await page.locator('#about').click(); await page.keyboard.press('Escape'); }); await pair.checkpoint('P1-57');
    await pair.act((page) => page.locator('#reset').click(), { settle: false }); await pair.checkpoint('P1-58', { screenshot: false });
    await pair.act((page) => page.locator('#reset').click()); await pair.checkpoint('P1-59');
  } finally { await pair.close(); }
});

test('P2 fresh glyph long-list render cases', async ({ isolatedBrowser: browser }) => {
  const pair = await createParity(browser);
  try {
    await pair.act(async (page) => {
      const count = await page.evaluate(() => {
        document.querySelector('#nav button[data-v="glyph"]').click();
        return document.querySelectorAll('#glyphbox .grow').length;
      });
      expect(count).toBeLessThanOrEqual(30);
    });
    await pair.checkpoint('P2-01');
    await pair.act((page) => page.locator('#gmode button[data-g="quiz"]').click()); await pair.checkpoint('P2-02');
    await pair.act((page) => page.locator('#gmode button[data-g="list"]').click());
    await pair.act((page) => page.locator('#gfilter button[data-p="level-3"]').click()); await pair.checkpoint('P2-03');
    await pair.act((page) => page.locator('#gmode button[data-g="quiz"]').click()); await pair.checkpoint('P2-04');
  } finally { await pair.close(); }
});

test('P2 fresh false-friend long-list render cases', async ({ isolatedBrowser: browser }) => {
  const pair = await createParity(browser);
  try {
    await pair.act(async (page) => {
      const count = await page.evaluate(() => {
        document.querySelector('#nav button[data-v="ff"]').click();
        return document.querySelectorAll('#fflist .tile').length;
      });
      expect(count).toBeLessThanOrEqual(30);
    });
    await pair.checkpoint('P2-09');
    const paozi = await pair.valueFromBaseline((page) => page.evaluate(() => FF.find((row) => row.w === '包子').id));
    await pair.act(async (page) => { await page.locator(`#fflist .tile[data-w="${paozi}"]`).click(); await page.locator('#fflist .tile').last().click(); }); await pair.checkpoint('P2-10');
    await pair.act((page) => page.locator(`#fflist .tile[data-w="${paozi}"]`).click()); await pair.checkpoint('P2-11');
    await pair.act((page) => page.locator('#fffilter button[data-f="zh"]').click()); await pair.checkpoint('P2-12');
  } finally { await pair.close(); }
});

test('P2 seeded wrong, empty, jz, and fresh vi cases', async ({ isolatedBrowser: browser }) => {
  const f = await baselineFixtures(browser);
  const results = { [f.glyphs[0]]: { zh: 0 }, [f.glyphs[2]]: { vi: 0 }, [f.glyphs[3]]: { zh: 0 }, [f.glyphs[1]]: { zh: 1, vi: 1 } };
  const pair = await createParity(browser, { storage: jsonStorage({ kb_glyphquiz: results }) });
  try {
    await pair.act(async (page) => { await nav(page, 'glyph'); await page.locator('#gfilter button[data-p="wrong"]').click(); }); await pair.checkpoint('P2-05');
    await pair.act((page) => page.locator('#gmode button[data-g="quiz"]').click()); await pair.checkpoint('P2-06');
    await pair.act(async (page) => { await page.locator('#gmode button[data-g="list"]').click(); await page.locator('#gfilter button[data-p="jz"]').click(); }); await pair.checkpoint('P2-08');
    await pair.act(async (page) => { await nav(page, 'ff'); await page.locator('#fffilter button[data-f="vi"]').click(); }); await pair.checkpoint('P2-13');
  } finally { await pair.close(); }

  const empty = await createParity(browser, { storage: jsonStorage({ kb_glyphquiz: {} }) });
  try {
    await empty.act(async (page) => { await nav(page, 'glyph'); await page.locator('#gfilter button[data-p="wrong"]').click(); }); await empty.checkpoint('P2-07');
  } finally { await empty.close(); }
});

test('P3 returning learner parity', async ({ isolatedBrowser: browser }) => {
  const f = await baselineFixtures(browser);
  const now = new Date('2026-11-24T10:00:00+09:00').getTime();
  const storage = jsonStorage({
    kb_srs: Object.fromEntries(f.deck.slice(0, 10).map((id, index) => [id, { box: index % 5, due: index < 5 ? now - 1 : now + 86400000 }])),
    kb_custom: f.passageWords.slice(0, 2), kb_newtoday: { date: '2026-11-24', ids: f.deck.slice(0, 5) },
    kb_target: 'both', kb_mute: true, kb_auto: false, kb_ex_open: true,
    kb_rules: Object.fromEntries(f.rules.map((row) => [row.id, [row.han]])),
    kb_ruletest: Object.fromEntries(f.rules.map((row) => [row.key, { zh: 1, vi: 0 }])),
    kb_ffcard: { [`${f.ff[0]}:zh`]: { miss: 4, ok: 1 }, [`${f.ff[1]}:vi`]: { miss: 2, ok: 3 } },
    kb_read: f.passages, kb_unknown: [f.passageWords[2]],
    kb_glyphquiz: Object.fromEntries(f.glyphs.map((id, index) => [id, { zh: index % 2, vi: (index + 1) % 2 }])),
  });
  const pair = await createParity(browser, { storage });
  try {
    await checkpointViews(pair, 'P3-initial');
    await pair.act((page) => nav(page, 'cards'));
    for (const [index, rating] of [2, 3, 0].entries()) {
      await pair.act(async (page) => { await page.keyboard.press('Enter'); await page.keyboard.press(String(rating)); });
      await pair.checkpoint(`P3-review-${index + 1}`);
    }
    await pair.act((page) => nav(page, 'read')); await pair.checkpoint('P3-read-checks');
    await pair.act(async (page) => { await nav(page, 'glyph'); await page.locator('#gfilter button[data-p="wrong"]').click(); }); await pair.checkpoint('P3-glyph-wrong');
    await pair.act(async (page) => { await nav(page, 'ff'); await page.locator('#ffmode button[data-m="cards"]').click(); }); await pair.checkpoint('P3-ff-misses');
  } finally { await pair.close(); }
});

test('P4 corrupt storage parity', async ({ isolatedBrowser: browser }) => {
  const storage = {
    kb_mute: JSON.stringify('wrong'), kb_auto: JSON.stringify(7), kb_srs: JSON.stringify([]),
    kb_target: JSON.stringify({}), kb_newtoday: JSON.stringify({ date: 7, ids: {} }),
    kb_rules: JSON.stringify([]), kb_ruletest: JSON.stringify([]), kb_ex_open: 'not-json',
    kb_ffcard: JSON.stringify([]), kb_read: JSON.stringify({}), kb_unknown: JSON.stringify({}),
    kb_glyphquiz: JSON.stringify([]), kb_glyph: JSON.stringify('legacy'),
  };
  const pair = await createParity(browser, { storage });
  try { await checkpointViews(pair, 'P4'); } finally { await pair.close(); }
});

test('P5 storage unavailable parity', async ({ isolatedBrowser: browser }) => {
  const pair = await createParity(browser, { storageUnavailable: true });
  try {
    await pair.checkpoint('P5-load');
    await pair.act(async (page) => { await page.keyboard.press('Enter'); await page.keyboard.press('2'); }); await pair.checkpoint('P5-rate');
    for (const view of ['rules', 'ff', 'read', 'glyph']) {
      await pair.act((page) => nav(page, view)); await pair.checkpoint(`P5-${view}`);
    }
  } finally { await pair.close(); }
});

for (const view of ['cards', 'rules', 'ff', 'read', 'glyph']) {
  test(`P6 mobile ${view} initial parity`, async ({ isolatedBrowser: browser }) => {
    const pair = await createParity(browser, { viewport: { width: 390, height: 844 } });
    try {
      if (view !== 'cards') await pair.act((page) => nav(page, view));
      await pair.checkpoint(`P6-${view}`, { styles: true });
    } finally { await pair.close(); }
  });
}

test('P6 mobile card back and About parity', async ({ isolatedBrowser: browser }) => {
  const pair = await createParity(browser, { viewport: { width: 390, height: 844 } });
  try {
    await pair.act((page) => page.keyboard.press('Enter')); await pair.checkpoint('P6-card-back', { styles: true });
    await pair.act((page) => page.locator('#about').click()); await pair.checkpoint('P6-about', { styles: true });
  } finally { await pair.close(); }
});

test('P7 speech stub parity', async ({ isolatedBrowser: browser }) => {
  const pair = await createParity(browser);
  try {
    await pair.act((page) => page.keyboard.press('Enter')); await pair.checkpoint('P7-auto');
    await pair.act((page) => page.keyboard.press('V')); await pair.checkpoint('P7-key');
    await pair.act(async (page) => { await nav(page, 'read'); await page.locator('#v-read .spk').first().click(); }); await pair.checkpoint('P7-read');
  } finally { await pair.close(); }
});

for (const speech of ['missing', 'none']) {
  test(`P7 speech ${speech} parity`, async ({ isolatedBrowser: browser }) => {
    const pair = await createParity(browser, { speech });
    try {
      await pair.act(async (page) => { await nav(page, 'read'); await page.locator('#v-read .spk').first().click(); }); await pair.checkpoint(`P7-${speech}`);
    } finally { await pair.close(); }
  });
}

test('P8 done for today parity', async ({ isolatedBrowser: browser }) => {
  const f = await baselineFixtures(browser);
  const due = new Date('2026-12-01T10:00:00+09:00').getTime();
  const ids = f.deck.slice(0, 20);
  const pair = await createParity(browser, { storage: jsonStorage({
    kb_newtoday: { date: '2026-11-24', ids },
    kb_srs: Object.fromEntries(ids.map((id) => [id, { box: 3, due }])),
  }) });
  try {
    await pair.checkpoint('P8-done');
    await expect(pair.baseline.locator('#cardbox')).toContainText('今日はここまで');
    await expect(pair.current.locator('#cardbox')).toContainText('今日はここまで');
    expect(await pair.baseline.locator('#prog').evaluate((node) => node.style.width)).toBe('100%');
    expect(await pair.current.locator('#prog').evaluate((node) => node.style.width)).toBe('100%');
  } finally { await pair.close(); }
});
