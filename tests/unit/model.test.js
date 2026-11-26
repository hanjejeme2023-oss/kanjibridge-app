import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { beforeEach, describe, expect, it } from 'vitest';
import { setLocale } from '../../src/i18n/index.js';
beforeEach(() => setLocale('ja'));
import { buildModel } from '../../src/app/data/model.js';
import { toneHint } from '../../src/app/lib/tone.js';

function loadData() {
  const context = { window: {} };
  vm.runInNewContext(readFileSync('public/app/data.js', 'utf8'), context);
  return context.window.KB_DATA;
}

describe('data model', () => {
  it('adapts the pinned dataset with app v2 counts and valid tone hints', () => {
    const data = loadData();
    const model = buildModel(data);
    expect(model.GLYPHS).toHaveLength(2164);
    expect(model.FF).toHaveLength(1242);
    expect(model.PASSAGES).toHaveLength(80);
    expect(model.RULES).toHaveLength(6);
    expect(model.WORDS).toHaveLength(6983);

    const badHint = (hint) => !hint || /^・|・$|・・|undefined|^ \/|\/ $|\/ \/ /.test(hint);
    const zhBad = [];
    const viBad = [];
    const ptLenMismatch = [];
    for (const word of model.WORDS) {
      if (word.p) {
        const hint = toneHint('zh', [word.p], word.pt);
        if (badHint(hint) || !word.pt) zhBad.push(word.id);
        if (word.pt && word.pt.length !== hint.split('・').length) ptLenMismatch.push(word.id);
      }
      if (word.v && badHint(toneHint('vi', [word.v]))) viBad.push(word.id);
    }
    const glyphBad = [];
    for (const glyph of model.GLYPHS) {
      for (const [lang, index] of [['zh', 10], ['vi', 11]]) {
        if (glyph[index].length && badHint(toneHint(lang, glyph[index]))) glyphBad.push(`${glyph[7]}${lang}`);
      }
    }
    expect({ zhBad, viBad, glyphBad }).toEqual({ zhBad: [], viBad: [], glyphBad: [] });
    console.log(`ptLenMismatch=${ptLenMismatch.length}`);
  });
});
