import { expect, test as base } from '@playwright/test';
import { createParity, nav } from './lib/parity.js';

// The reference supplies answers/IDs and the quiz-input count only. All gate
// assertions inspect the new app's DOM or localStorage, never its internals.
// createParity also enforces the shared aborted-font-only console exception.
const test = base.extend({
  gate: async ({ browser }, use) => {
    const pair = await createParity(browser);
    try {
      await use({ page: pair.current, reference: pair.baseline });
      expect((await pair.current.locator('main,header').allTextContents()).join(''), 'badText').not.toMatch(/undefined|NaN|\bnull\b|\[object/);
    } finally { await pair.close(); }
  },
});
const stored = (page, key) => page.evaluate((key) => JSON.parse(localStorage.getItem(key)), key);
const result = (input) => input.locator('..').locator('.test-result');
const glyphInput = (page, id, lang) => page.locator(`input[data-test-cell="${id}:${lang}"]`);
const glyphRows = (page) => page.locator('#glyphbox .grow');
const ffId = (page) => page.locator('[data-ff-card]').getAttribute('data-ff-card');

async function openLongList(page, view, selector) {
  const firstScreen = await page.evaluate(({ view, selector }) => {
    document.querySelector(`#nav button[data-v="${view}"]`).click();
    return document.querySelectorAll(selector).length;
  }, { view, selector });
  expect(firstScreen, `${view}: first screen has at most 30 rows (same evaluate as click)`).toBeLessThanOrEqual(30);
  expect(firstScreen, `${view}: first screen is populated`).toBeGreaterThan(0);
}

test('gate: counts, explanations, cards and keyboard', async ({ gate: { page, reference } }) => {
  await expect(page, 'title without 試作版').toHaveTitle('漢字ブリッジ');
  for (const [view, count] of Object.entries({ cards: '4,051', rules: '8', ff: '1,242', read: '80', glyph: '2,164' })) {
    await expect(page.locator(`#count-${view}`), `counts: ${view}`).toHaveText(count);
  }
  await expect(page.locator('.tab-explain'), 'explain: five views').toHaveCount(5);
  expect(await page.locator('.tab-explain').allTextContents(), 'explain: original wording').toEqual(await reference.locator('.tab-explain').allTextContents());
  await expect(page.locator('#gvi'), 'cards-initial').toBeVisible();
  const cards = await reference.evaluate(() => ({
    first: { id: cur.id, vi: cur.v },
    second: due().find((word) => word.id !== cur.id).v,
  }));
  await page.locator('#gvi').fill(cards.first.vi.normalize('NFD').replace(/[\u0323\u0301\u0300\u0309\u0303]/g, '').normalize('NFC'));
  await page.locator('#gvi').press('Enter');
  await expect(page.locator('#cardbox .you.ok'), 'card tone-stripped right').toHaveText('正解');
  await page.keyboard.press('3');
  expect((await stored(page, 'kb_srs'))[cards.first.id], 'card rated: progress saved').toMatchObject({ box: 1 });
  await expect(page.locator('#gvi'), 'card rated: next front').toBeVisible();
  await page.locator('#gvi').fill('zzz');
  await page.locator('#gvi').press('Enter');
  await expect(page.locator('#cardbox .you.ng'), 'card wrong shows answer').toHaveText(cards.second);
  await page.keyboard.press('1');
  await page.locator(':focus').blur();
  await page.keyboard.press('Space');
  await expect(page.locator('#cardbox .reveal'), 'space flips card').toBeVisible();
  await page.keyboard.press('2');
  await page.locator('#target button[data-t="both"]').click();
  await expect(page.locator('#cardbox .tone-hint'), 'card_both_hints: one per language').toHaveCount(2);
  for (const hint of await page.locator('#cardbox .tone-hint').allTextContents()) {
    expect(hint, 'card_both_hints: nonempty hint').not.toBe('');
  }
  await expect(page.locator('#gvi'), 'card_both_hints: vi input').toBeVisible();
  await expect(page.locator('#gzh'), 'card_both_hints: zh input').toBeVisible();
});

test('gate: rule table test, quiz, every rule and saved examples state', async ({ gate: { page, reference } }) => {
  await nav(reference, 'rules');
  const rule = await reference.evaluate(() => ({
    ex: RULES.find((row) => row.id === ruleSel).ex,
    ids: RULES.map((row) => row.id),
  }));
  await nav(page, 'rules');
  await expect(page.locator('#v-rules'), 'rules').toBeVisible();
  const untouched = await page.evaluate(() => localStorage.getItem('kb_rules'));
  await page.locator('#ruletest').click();
  const inputs = page.locator('#ruledetail input[data-test-cell]');
  await expect(inputs, 'rule test inputs').toHaveCount(rule.ex.length * 2);
  await inputs.nth(0).fill(rule.ex[0][3]);
  await inputs.nth(0).blur();
  await expect(inputs.nth(0), 'rule vi right').toHaveClass(/ok/);
  await expect(result(inputs.nth(0)), 'rule vi right: result').toHaveText('正解');
  await inputs.nth(1).fill('qqq');
  await inputs.nth(1).press('Enter');
  await expect(inputs.nth(1), 'enter judges').toHaveClass(/ng/);
  await expect(result(inputs.nth(1)), 'rule zh wrong shows answer').toHaveText(rule.ex[0][4]);
  await inputs.nth(2).fill('ab');
  await inputs.nth(2).press('Space');
  await expect(inputs.nth(2), 'space types in unjudged input').toHaveValue('ab ');
  await page.locator('#ruletest').click();
  await page.locator('#ruletest').click();
  await expect(inputs.nth(0), 'reopen empties but keeps colour: empty vi').toHaveValue('');
  await expect(inputs.nth(1), 'reopen empties but keeps colour: empty zh').toHaveValue('');
  await expect(inputs.nth(0), 'reopen empties but keeps colour: ok').toHaveClass(/ok/);
  await expect(inputs.nth(1), 'reopen empties but keeps colour: ng').toHaveClass(/ng/);
  await expect(result(inputs.nth(0)), 'reopen empties but keeps colour: no answer').toHaveText('');
  expect(await page.evaluate(() => localStorage.getItem('kb_rules')), 'kb_rules untouched by P1-09..13').toBe(untouched);
  await page.locator('#ruletest').click();
  await page.keyboard.press('1');
  await expect(page.locator('#qnext'), 'rule quiz answered, then next: answered').toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page.locator('#qnext'), 'rule quiz answered, then next: new question').toHaveCount(0);
  for (const id of rule.ids) {
    await page.locator(`#rulebar button[data-id="${id}"]`).click();
    await expect(page.locator('#rulebar button.on'), `every rule: ${id}`).toHaveAttribute('data-id', id);
    await expect(page.locator('#ruledetail .qcard'), `every rule: ${id} question`).toBeVisible();
  }
  const details = page.locator('#ruledetail details');
  if (await details.evaluate((node) => node.open)) await details.locator('summary').click();
  await details.locator('summary').click();
  await expect.poll(() => stored(page, 'kb_ex_open'), { message: 'kb_ex_open: open stored' }).toBe(true);
  await details.locator('summary').click();
  await expect.poll(() => stored(page, 'kb_ex_open'), { message: 'kb_ex_open: closed stored' }).toBe(false);
});

test('gate: false-friend lists, examples, round length and rating queue', async ({ gate: { page, reference } }) => {
  const f = await reference.evaluate(() => ({
    paozi: FF.find((row) => row.w === '包子').id,
    zh: newFFRoundIds(FF, 'zh', {}), vi: newFFRoundIds(FF, 'vi', {}),
  }));
  await openLongList(page, 'ff', '#fflist .tile');
  await expect(page.locator('#fflist .tile'), 'ff: tile count 1,242').toHaveCount(1242, { timeout: 60_000 });
  await page.locator(`#fflist .tile[data-w="${f.paozi}"]`).click();
  await expect(page.locator(`#fflist .tile[data-w="${f.paozi}"] .example`), 'paozi examples 2').toHaveCount(2);
  await page.locator('#fffilter button[data-f="vi"]').click();
  await expect(page.locator('#fflist .tile'), 'ff_vi_tiles').toHaveCount(486, { timeout: 60_000 });
  await page.locator('#fffilter button[data-f="all"]').click();
  await page.locator('#ffmode button[data-m="cards"]').click();
  await expect(page.locator('.ff-card .front-lines'), 'ffcards-front').toBeVisible();
  expect(await ffId(page), '20 per round: first card').toBe(f.zh[0]);
  await page.keyboard.press('Enter');
  await expect(page.locator('.ff-card .back-line'), 'enter flips ff').toBeVisible();
  await page.keyboard.press('1');
  expect((await stored(page, 'kb_ffcard'))[`${f.zh[0]}:zh`], 'miss returns to end: miss stored').toEqual({ miss: 1, ok: 0 });
  expect(await ffId(page), 'miss returns to end: next card shown').toBe(f.zh[1]);
  await page.keyboard.press('Space');
  await page.keyboard.press('2');
  expect((await stored(page, 'kb_ffcard'))[`${f.zh[1]}:zh`], 'queue shrinks on ok: OK stored').toEqual({ miss: 0, ok: 1 });
  // Consume the remaining fronts through the UI: a miss is last, while an OK
  // never returns before the round ends. No access to the new app's queue.
  const seen = [f.zh[0], f.zh[1]];
  for (const id of f.zh.slice(2)) {
    const current = await ffId(page);
    expect(current, 'queue shrinks on ok: remaining order').toBe(id);
    seen.push(current);
    await page.keyboard.press('Enter');
    await page.keyboard.press('2');
  }
  expect(seen, '20 per round: exactly the original 20 fronts before the missed card returns').toEqual(f.zh);
  expect(new Set(seen).size, '20 per round: distinct cards').toBe(20);
  expect(await ffId(page), 'miss returns to end: first miss is now the only remaining card').toBe(f.zh[0]);
  const stats = await stored(page, 'kb_ffcard');
  expect(Object.values(stats).filter((row) => row.ok === 1).length, 'queue shrinks on ok: 19 removed, one missed card remains').toBe(19);
  await page.locator('#fflang button[data-l="vi"]').click();
  await expect(page.locator('#count-ff'), 'ffround_vi_len: vi pool count').toHaveText('486');
  const viSeen = [];
  for (const id of f.vi) {
    viSeen.push(await ffId(page));
    expect(viSeen.at(-1), 'ffround_vi_len: new vi round order').toBe(id);
    await page.keyboard.press('Enter');
    await expect(page.locator('.ff-card .back-line'), 'ffcards-vi').toBeVisible();
    await page.keyboard.press('2');
  }
  expect(new Set(viSeen).size, 'ffround_vi_len: 20 cards').toBe(20);
  expect(viSeen, 'ffround_vi_len: whole round').toEqual(f.vi);
  expect(viSeen.includes(await ffId(page)), 'ffround_vi_len: after 20 OK ratings a new round starts').toBe(false);
});

test('gate: reading marks, passage checks, annotations and review selection', async ({ gate: { page, reference } }) => {
  const f = await reference.evaluate(() => ({
    passages: PASSAGES.slice(0, 3).map((row) => row.id),
    word: PASSAGES[0].toks.find((token) => token.w).w.id,
  }));
  await nav(page, 'read');
  expect((await page.locator('#psel button').allTextContents()).some((text) => text.includes('✓')), 'no check on first display').toBe(false);
  await page.locator('.tok.sino .s').first().click();
  expect(await stored(page, 'kb_unknown'), 'kb_unknown has mark').toContain(f.word);
  await expect(page.locator('#unknownreview'), 'review list').toContainText('わからない');
  await expect(page.locator('[data-review-i]'), 'review list: marked word').toHaveCount(1);
  await page.locator('#psel button').nth(1).click();
  expect(await stored(page, 'kb_read'), 'kb_read has p0').toContain(f.passages[0]);
  await expect(page.locator('#psel button').nth(0), 'marked passage no check').not.toContainText('✓');
  await page.locator('#psel button').nth(2).click();
  await expect(page.locator('#psel button').nth(1), 'left unmarked passage has check').toContainText('✓');
  await page.locator('#showann').uncheck();
  expect(await page.locator('#passage .a').allTextContents(), 'annotations: hidden').toEqual(Array(await page.locator('#passage .a').count()).fill(''));
  await page.locator('#showann').check();
  expect((await page.locator('#passage .a').allTextContents()).some(Boolean), 'annotations: restored').toBe(true);
  await nav(page, 'glyph');
  expect(await stored(page, 'kb_read'), 'tab switch marks read').toContain(f.passages[2]);
  await nav(page, 'read');
  await page.locator('#psel button').nth(0).click();
  await page.locator('[data-review-i]').first().click();
  const selected = await page.locator('[data-review-i]').first().getAttribute('data-review-i');
  await expect(page.locator('.tok.sel'), 'review selection').toHaveAttribute('data-i', selected);
  await expect(page.locator('#tokdetail .sheet'), 'review selection: word detail').toBeVisible();
});

test('gate: glyph quiz input count, answers, score and reopen', async ({ gate: { page, reference } }) => {
  const f = await reference.evaluate(() => ({
    huan: GLYPHS.find((row) => row[1] === '還')[7],
    xing: GLYPHS.find((row) => row[1] === '行')[7],
    noVi: GLYPHS.find((row) => !glyphTargets(row, 'vi').length)[7],
  }));
  await nav(reference, 'glyph');
  await reference.locator('#gmode button[data-g="quiz"]').click();
  await reference.waitForFunction(() => document.querySelectorAll('#glyphbox .grow').length === 2164);
  const expectedInputs = await reference.locator('#glyphbox input[data-test-cell]').count();
  await reference.close(); // Release its large quiz DOM before exercising the new app.
  await openLongList(page, 'glyph', '#glyphbox .grow');
  await expect(glyphRows(page), 'glyph_rows: list').toHaveCount(2164, { timeout: 60_000 });
  await page.locator('#gmode button[data-g="quiz"]').click();
  await expect(glyphRows(page), 'glyph_rows: quiz').toHaveCount(2164, { timeout: 60_000 });
  await expect(page.locator('#glyphbox input[data-test-cell]'), 'glyph_quiz_inputs: count read from baseline page').toHaveCount(expectedInputs);
  const hz = glyphInput(page, f.huan, 'zh');
  await hz.fill('hai, huan');
  await hz.press('Enter');
  await expect(hz, '還 both readings right').toHaveClass(/ok/);
  const usage = page.locator(`details[data-usage="${f.huan}"]`);
  await expect(usage, 'usage opens: 還').toHaveJSProperty('open', true);
  await expect(usage.locator('.usage-grid'), 'usage opens: content').toBeVisible();
  const hv = glyphInput(page, f.huan, 'vi');
  await hv.fill('hoan');
  await hv.blur();
  await expect(result(hv), 'huan_vi_result').toHaveText('正解');
  const xz = glyphInput(page, f.xing, 'zh');
  await xz.fill('hang, xuan');
  await xz.blur();
  await expect(xz, 'xing_wrong').toHaveClass(/ng/);
  await expect(result(xz), 'xing_wrong: correct readings shown').toHaveText('xíng / háng');
  await expect(page.locator('#glyphscore'), 'score').toHaveText('2 / 3 正解');
  expect(await stored(page, 'kb_glyphquiz'), 'score: stored results').toEqual({ [f.huan]: { zh: 1, vi: 1 }, [f.xing]: { zh: 0 } });
  await page.locator('#gfilter button[data-p="wrong"]').click();
  await expect(glyphRows(page), 'wrong_rows').toHaveCount(1);
  await expect(glyphInput(page, f.xing, 'zh'), 'wrong_rows: 行').toBeVisible();
  await page.locator('#gfilter button[data-p="all"]').click();
  await page.locator('#gmode button[data-g="list"]').click();
  await page.locator('#gmode button[data-g="quiz"]').click();
  await expect(glyphRows(page), 'glyph quiz chunks complete').toHaveCount(2164, { timeout: 60_000 });
  await expect(hz, 'glyph reopen empty+ok: empty').toHaveValue('');
  await expect(hz, 'glyph reopen empty+ok: ok').toHaveClass(/ok/);
  await expect(glyphInput(page, f.noVi, 'vi'), 'no input for empty vi list').toHaveCount(0);
});

test('gate: glyph level filters, usage link and completed chunks', async ({ gate: { page, reference } }) => {
  const f = await reference.evaluate(() => ({
    ffChar: GLYPHS.find((row) => { const use = USAGE.get(row[7]); return use && [...use.zh, ...use.vi].some((item) => (WORD_BY_ID.get(item[0]) || {}).ff); })[7],
  }));
  await reference.close();
  await nav(page, 'glyph');
  await expect(glyphRows(page), 'glyph_rows: list before filters').toHaveCount(2164, { timeout: 60_000 });
  const levels = [235, 198, 201, 213, 249, 258, 810];
  for (const [index, count] of levels.entries()) {
    await page.locator(`#gfilter button[data-p="level-${index + 1}"]`).click();
    await expect(glyphRows(page), `level${index + 1}`).toHaveCount(count, { timeout: 60_000 });
  }
  await page.locator('#gfilter button[data-p="all"]').click();
  await page.locator('#gmode button[data-g="list"]').click();
  await expect(glyphRows(page), 'glyph chunks complete').toHaveCount(2164, { timeout: 60_000 });
  const ffUsage = page.locator(`details[data-usage="${f.ffChar}"]`);
  await ffUsage.locator('summary').click();
  await expect(ffUsage.locator('[data-ff-word]').first(), 'usage_ff_char').toBeVisible();
  const badge = ffUsage.locator('[data-ff-word]').first();
  const wordId = await badge.getAttribute('data-ff-word');
  await badge.click();
  await expect(page.locator('#v-ff'), 'ff mark opens entry: view').toBeVisible();
  const tile = page.locator(`#fflist .tile[data-w="${wordId}"]`);
  await expect(tile, 'ff mark opens entry: open').toHaveClass(/open/);
  await expect(tile, 'ff mark opens entry: focused').toBeFocused();
  await expect(page.locator('#fflist .tile'), 'ff chunks complete').toHaveCount(1242, { timeout: 60_000 });
  await nav(page, 'glyph');
  await page.locator('#gfilter button[data-p="diff"]').click();
  await page.locator('#gfilter button[data-p="all"]').click();
  await page.locator('#gmode button[data-g="quiz"]').click();
  await page.locator('#gmode button[data-g="list"]').click();
  await expect(glyphRows(page), 'chunks complete: interrupted filters and modes').toHaveCount(2164, { timeout: 60_000 });
});

test('gate: mute, tile replacement, About and reset', async ({ gate: { page } }) => {
  await page.locator('#mute').click();
  expect(await stored(page, 'kb_mute'), 'mute stored: on').toBe(true);
  await page.locator('#mute').click();
  expect(await stored(page, 'kb_mute'), 'mute stored: off').toBe(false);
  await nav(page, 'ff');
  await expect(page.locator('#fflist .tile'), 'ff chunks complete').toHaveCount(1242, { timeout: 60_000 });
  const toggle = await page.evaluate(() => {
    const [first, second] = document.querySelectorAll('#fflist .tile');
    first.click();
    const [opened, neighbor] = document.querySelectorAll('#fflist .tile');
    return { replaced: opened !== first, neighborKept: neighbor === second, focused: document.activeElement === opened, open: opened.classList.contains('open'), expanded: opened.getAttribute('aria-expanded') };
  });
  expect(toggle, 'tile toggle opens in place').toEqual({ replaced: true, neighborKept: true, focused: true, open: true, expanded: 'true' });
  await page.locator('#fflist .tile').first().press('Enter');
  await expect(page.locator('#fflist .tile').first(), 'tile Enter closes').not.toHaveClass(/open/);
  await expect(page.locator('#aboutpanel'), 'about closed at start').toBeHidden();
  await page.locator('#about').click();
  await expect(page.locator('#aboutpanel'), 'about opens').toBeVisible();
  await expect(page.locator('#about'), 'about opens: aria').toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#aboutpanel'), 'about EDRDG sentence').toContainText('These files are the property of the Electronic Dictionary Research and Development Group');
  await expect(page.locator('#aboutpanel'), 'about AI note').toContainText('AI（Google Gemini）');
  await expect(page.locator('#aboutpanel a'), 'about repo link').toHaveAttribute('href', 'https://github.com/hanjejeme2023-oss/kanji-bridge');
  await page.locator('#about').click();
  await expect(page.locator('#aboutpanel'), 'about link closes').toBeHidden();
  await page.locator('#about').click();
  await page.keyboard.press('Escape');
  await expect(page.locator('#aboutpanel'), 'Esc closes about').toBeHidden();
  await expect(page.locator('#about'), 'Esc closes about: aria').toHaveAttribute('aria-expanded', 'false');
  await nav(page, 'cards');
  await page.keyboard.press('Enter');
  await page.keyboard.press('3');
  await page.locator('#reset').click();
  await expect(page.locator('#reset'), 'armed text').toHaveText('もう一度押すとリセット');
  await page.locator('#reset').click();
  const cleared = await page.evaluate(() => Object.fromEntries([
    'kb_srs', 'kb_custom', 'kb_rules', 'kb_glyph', 'kb_ruletest', 'kb_glyphquiz', 'kb_unknown', 'kb_read', 'kb_ffcard',
  ].map((key) => [key, JSON.parse(localStorage.getItem(key))])));
  expect(cleared, 'everything reset (storage): progress cleared').toEqual({
    kb_srs: {}, kb_custom: [], kb_rules: {}, kb_glyph: {}, kb_ruletest: {}, kb_glyphquiz: {}, kb_unknown: [], kb_read: [], kb_ffcard: {},
  });
  expect((await stored(page, 'kb_newtoday')).ids, 'everything reset (storage): only the newly displayed card introduced').toHaveLength(1);
  await expect(page.locator('#reset'), 'everything reset (storage): disarmed').toHaveText('記録をリセット');
});
