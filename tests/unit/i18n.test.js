import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import ja from '../../src/i18n/ja.json';
import { t, tHtml } from '../../src/i18n/index.js';

function filesUnder(root, predicate) {
  const files = [];
  const visit = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(full);
      else if (predicate(full)) files.push(full);
    }
  };
  visit(root);
  return files;
}

describe('Japanese message catalog', () => {
  it('has exactly 115 unique keys', () => {
    const raw = readFileSync('src/i18n/ja.json', 'utf8');
    const rawKeys = [...raw.matchAll(/^\s*"([a-z0-9_.]+)"\s*:/gm)].map((match) => match[1]);
    expect(rawKeys).toHaveLength(115);
    expect(new Set(rawKeys).size).toBe(115);
    expect(Object.keys(ja)).toHaveLength(115);
  });

  it('uses every key and references only existing keys', () => {
    const sourceFiles = [
      ...filesUnder('src', (file) => file.endsWith('.js')),
      'app/index.html',
      'index.html',
    ];
    const used = new Set();
    for (const file of sourceFiles) {
      const source = readFileSync(file, 'utf8');
      for (const match of source.matchAll(/\b(?:t|tHtml)\('([a-z0-9_.]+)'/g)) used.add(match[1]);
      for (const match of source.matchAll(/\{\{([a-z0-9_.]+)(?:\|[^{}]+)?\}\}/g)) used.add(match[1]);
    }
    expect([...used].filter((key) => !(key in ja))).toEqual([]);
    expect(Object.keys(ja).filter((key) => !used.has(key))).toEqual([]);
  });

  it('keeps CJK UI text out of JavaScript and HTML', () => {
    const sourceFiles = [
      ...filesUnder('src', (file) => file.endsWith('.js')),
      'app/index.html',
      'index.html',
    ];
    const allowed = new Set([',/，／、', '（）()', '^（.*）$']);
    const failures = [];
    for (const file of sourceFiles) {
      const lines = readFileSync(file, 'utf8').split(/\r?\n/);
      lines.forEach((line, index) => {
        if (!/[\u3000-\u303f\u3040-\u30ff\u3400-\u9fff\uff00-\uffef]/.test(line)) return;
        if (![...allowed].some((fragment) => line.includes(fragment))) failures.push(`${file}:${index + 1}`);
      });
    }
    expect(failures).toEqual([]);
  });

  it('substitutes text and trusted markup safely', () => {
    expect(t('cards.queue', { n: 3 })).toBe('残り 3 枚');
    expect(tHtml('cards.glyph_tag', {
      j: '&lt;j&gt;', h: '<span>h</span>', z: '<span>z</span>',
    })).toBe('字体　&lt;j&gt;　<span>h</span>　<span>z</span>');
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(t('missing.test')).toBe('missing.test');
    expect(t('missing.test')).toBe('missing.test');
    expect(error).toHaveBeenCalledTimes(1);
    error.mockRestore();
  });
});
