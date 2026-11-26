import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_LOCALE, PREFILL_LOCALE, LOCALES, getLocale, isLocale, localeMeta, resolveLocale, setLocale, t, tHtml } from '../../src/i18n/index.js';
import { jr, kr } from '../../src/app/lib/word.js';
import { fillHtml, readLocales } from '../../vite/i18n-html.js';
import { validateAppMarkers } from '../../vite/html-markers.js';
import { templateTexts, uiTextFailures } from './lib/source-text.js';

// Architect answer to HANDOFF Note 14: remove this constant and its use in step 4.
const PENDING_OVERVIEW_KEYS = [
  'overview.page_title', 'overview.meta_description', 'overview.lead', 'overview.free',
  'overview.views_heading', 'overview.shot_alt', 'overview.sources_heading', 'overview.notices',
  'overview.privacy_heading', 'overview.privacy_text',
];
const catalogs = readLocales();
const startupLocale = getLocale();
const placeholders = value => [...new Set([...value.matchAll(/\{([A-Za-z_]+)\}/g)].map(match => match[1]))].sort();
function filesUnder(root, predicate) {
  return readdirSync(root, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(root, entry.name);
    return entry.isDirectory() ? filesUnder(file, predicate) : predicate(file) ? [file] : [];
  });
}
const sources = [...filesUnder('src', file => file.endsWith('.js')), 'app/index.html', 'index.html'];
beforeEach(() => setLocale('en'));

describe('locale catalogs', () => {
  it('discovers locales and checks exact completeness, duplicate keys and metadata', () => {
    expect(LOCALES).toEqual(Object.keys(catalogs).sort());
    expect(LOCALES).toEqual(expect.arrayContaining(['en', 'ja', 'ko']));
    const keys = Object.keys(catalogs.en);
    expect(keys).toHaveLength(130);
    for (const [code, values] of Object.entries(catalogs)) {
      const file = `src/i18n/${code}.json`;
      const rawKeys = [...readFileSync(file, 'utf8').matchAll(/^\s*"([a-z0-9_.]+)"\s*:/gm)].map(match => match[1]);
      expect(rawKeys.length, `${file}: duplicate keys`).toBe(new Set(rawKeys).size);
      const missing = keys.filter(key => !Object.hasOwn(values, key));
      const extra = Object.keys(values).filter(key => !Object.hasOwn(catalogs.en, key));
      expect({ missing, extra }, `${file}: missing/extra keys`).toEqual({ missing: [], extra: [] });
      expect(values['meta.html_lang'], file).toBe(code);
      expect(() => new Intl.NumberFormat(values['meta.number_locale']), file).not.toThrow();
      expect(localeMeta(code)).toEqual({ nativeName: values['meta.native_name'], htmlLang: code, numberLocale: values['meta.number_locale'] });
      for (const key of keys) {
        expect(typeof values[key], `${file}: ${key}`).toBe('string');
        expect(values[key], `${file}: ${key}`).not.toMatch(/[<>]/);
        expect(placeholders(values[key]), `${file}: ${key} placeholders`).toEqual(placeholders(catalogs.en[key]));
      }
      expect(values['about.edrdg'], file).toBe(catalogs.en['about.edrdg']);
    }
  });
  it('preserves every Stage 1 Japanese app value', () => {
    const old = JSON.parse(readFileSync('tests/unit/fixtures/ja-stage1.json', 'utf8'));
    const keys = Object.keys(old).filter(key => key !== 'overview.open_app');
    expect(keys).toHaveLength(114);
    for (const key of keys) expect(catalogs.ja[key], key).toBe(old[key]);
  });
  it('matches the approved table character for character', () => {
    const section = readFileSync('docs/STAGE2_STRINGS.md', 'utf8').split('## 3. All keys')[1].split('## 4. Key count check')[0];
    let count = 0;
    for (const line of section.split('\n')) {
      if (!/^\| `[a-z0-9_.]+` \|/.test(line)) continue;
      const cells = line.split('|').map(cell => cell.trim());
      const key = cells[1].slice(1, -1);
      ['ja', 'en', 'ko'].forEach((code, index) => {
        let value = cells[index + 2] === '*(identical)*' ? cells[2] : cells[index + 2];
        value = value.replaceAll('⎵', ' ').replaceAll('〔U+3000〕', '\u3000');
        expect(catalogs[code][key], `${code}: ${key}`).toBe(value);
      });
      count++;
    }
    expect(count).toBe(130);
  });
  it('references only existing keys and uses every implemented non-meta key', () => {
    const used = new Set();
    for (const file of sources) {
      const source = readFileSync(file, 'utf8');
      for (const match of source.matchAll(/\b(?:t|tHtml)\('([a-z0-9_.]+)'/g)) used.add(match[1]);
      for (const match of source.matchAll(/\{\{([a-z0-9_.]+)(?:\|[^{}]+)?\}\}/g)) used.add(match[1]);
      for (const match of source.matchAll(/data-i18n(?:-text|-attr)?="([^"]+)"/g)) {
        const keys = match[0].startsWith('data-i18n-attr') ? match[1].split(';').map(pair => pair.split('=')[1]) : match[1].split(' ');
        keys.forEach(key => used.add(key));
      }
      for (const match of source.matchAll(/data-i18n-text="([^"]+)"/g)) for (const key of match[1].split(' ')) {
        for (const [code, values] of Object.entries(catalogs)) expect(values[key]?.trim(), `${code}: empty mixed-content key ${key}`).toBeTruthy();
      }
    }
    expect([...used].filter(key => !Object.hasOwn(catalogs.en, key)), 'unknown referenced keys').toEqual([]);
    const unused = Object.keys(catalogs.en).filter(key => !key.startsWith('meta.') && !used.has(key));
    expect(unused.sort(), 'only pending overview keys may be unused before step 4').toEqual([...PENDING_OVERVIEW_KEYS].sort());
  });
  it('keeps hard-coded UI text out of source and HTML templates', () => {
    const failures = [];
    const allowedRegexes = ['/[,/，／、]/', '/[（）()]/g', '/^（.*）$/'];
    for (const file of sources) {
      const source = readFileSync(file, 'utf8');
      let checked = source;
      for (const literal of allowedRegexes) checked = checked.replaceAll(literal, '');
      checked.split('\n').forEach((line, index) => {
        if (/[\u1100-\u11ff\u3000-\u303f\u3040-\u30ff\u3130-\u318f\u3400-\u9fff\uac00-\ud7af\uff00-\uffef]/.test(line)) failures.push(`${file}:${index + 1}: CJK/Hangul`);
      });
      const chunks = file.endsWith('.html') ? [{ text: source, line: 1 }] : templateTexts(source);
      chunks.forEach(chunk => failures.push(...uiTextFailures(chunk.text, file, chunk.line)));
    }
    expect(failures).toEqual([]);
  });
});

describe('translation API', () => {
  it('starts in English and validates locale selection', () => {
    expect(startupLocale).toBe('en');
    expect(DEFAULT_LOCALE).toBe('en'); expect(PREFILL_LOCALE).toBe('en');
    expect(isLocale(123)).toBe(false); expect(isLocale('xx')).toBe(false);
    expect(() => setLocale('xx')).toThrow('Unknown locale');
    setLocale('ko'); expect(getLocale()).toBe('ko');
  });
  it('substitutes plain text and escapes trusted-slot templates', () => {
    expect(t('cards.yours', { s: '<&"' })).toBe('You: <&"');
    setLocale('ja');
    expect(t('cards.queue', { n: 3 })).toBe('残り 3 枚');
    expect(tHtml('cards.glyph_tag', { j: '&lt;j&gt;', h: '<span>h</span>', z: '<span>z</span>' })).toBe('字体　&lt;j&gt;　<span>h</span>　<span>z</span>');
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    for (const code of ['ja', 'ko']) { setLocale(code); expect(t('missing.test')).toBe('missing.test'); t('missing.test'); }
    expect(error).toHaveBeenCalledTimes(2); error.mockRestore();
  });
  it('falls back to English and logs once per missing key and locale', async () => {
    vi.resetModules();
    const ko = { ...catalogs.ko }; delete ko['common.correct'];
    vi.doMock('../../src/i18n/ko.json', () => ({ default: ko }));
    const api = await import('../../src/i18n/index.js');
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    try { api.setLocale('ko'); expect(api.t('common.correct')).toBe('Correct'); expect(api.tHtml('common.correct')).toBe('Correct'); expect(error).toHaveBeenCalledExactlyOnceWith('i18n: missing key', 'common.correct', 'ko'); }
    finally { error.mockRestore(); vi.doUnmock('../../src/i18n/ko.json'); vi.resetModules(); }
  });
  it.each([
    [{ query: 'ko', stored: 'ja', languages: ['en-US'] }, 'ko'],
    [{ query: 'xx', stored: 'ko', languages: ['ja-JP'] }, 'ko'],
    [{ stored: 123, languages: ['ja-JP'] }, 'ja'],
    [{ stored: 'xx', languages: ['zh-TW', 'ko-KR'] }, 'ko'],
    [{ languages: ['EN-gb'] }, 'en'], [{ languages: ['fr-FR'] }, 'en'],
    [{ languages: [] }, 'en'], [{}, 'en'],
  ])('resolves locale precedence: %j', (input, expected) => expect(resolveLocale(input)).toBe(expected));
  it('formats rare readings at call time in every locale', () => {
    const word = { ja: 'ja-reading', ko: 'ko-reading', jaRare: true, koRare: true };
    for (const code of LOCALES) {
      setLocale(code);
      expect(jr(word)).toBe(t('word.rare_reading', { r: word.ja }));
      expect(kr(word)).toBe(t('word.rare_reading', { r: word.ko }));
      expect(jr({ ja: 'raw' })).toBe('raw'); expect(kr({ ko: '' })).toBe('');
    }
  });
});

describe('HTML build contract', () => {
  it('requires exactly paired markers, placeholders and parameters', () => {
    const source = readFileSync('app/index.html', 'utf8');
    expect(() => validateAppMarkers(source)).not.toThrow();
    expect(() => validateAppMarkers(source.replace(' data-i18n="cards.explain"', ''))).toThrow('cards.explain');
    expect(() => validateAppMarkers(source.replace('{{cards.explain}}', ''))).toThrow('cards.explain');
    expect(() => validateAppMarkers('<body><select data-i18n-attr="aria-label=header.lang_label"></select></body>')).toThrow('header.lang_label');
    expect(() => validateAppMarkers('<body><select aria-label="{{header.lang_label}}" data-i18n-attr="aria-label=header.lang_label"></select></body>')).not.toThrow();
    expect(() => fillHtml('{{not.a.key}}', catalogs.en)).toThrow('not.a.key');
    expect(() => fillHtml('{{glyph.filter_level}}', catalogs.en)).toThrow('n');
    expect(fillHtml('{{cards.yours|s=<test>}}', catalogs.en)).toBe('You: &lt;test&gt;');
  });
});
