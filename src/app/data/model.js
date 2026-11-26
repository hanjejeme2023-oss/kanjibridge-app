import { splitVals } from '../lib/text.js';

export function buildModel(kb) {
  if (!kb) throw new Error('KB_DATA failed to load');

  const WC_BY_WORD = new Map();
  kb.word_chars.forEach((row) => {
    if (!WC_BY_WORD.has(row.word_id)) WC_BY_WORD.set(row.word_id, []);
    WC_BY_WORD.get(row.word_id).push(row);
  });
  const RAW_WORD_BY_ID = new Map(kb.words.map((row) => [row.word_id, row]));
  const adaptWord = (row) => {
    const word = {
      id: row.word_id,
      h: row.trad,
      j: row.jp || row.trad,
      z: row.simp || row.trad,
      p: row.pinyin || '',
      ja: row.ja || '',
      jaRare: row.ja_use === 'rare',
      ko: row.ko || '',
      koRare: row.ko_use === 'rare',
      v: row.vi || '',
      ff: row.false_friend || '',
      lit: !!row.lit,
      pt: row.pt || '',
      syl: row.syl_aligned ? (WC_BY_WORD.get(row.word_id) || []) : null,
    };
    if (row.vi) {
      const alternatives = splitVals(row.vi_alt);
      if (alternatives.length) word.va = alternatives;
    }
    if (row.note_ja) word.note = row.note_ja;
    return word;
  };
  const WORD_BY_ID = new Map(kb.words.map((row) => [row.word_id, adaptWord(row)]));
  const WORDS = kb.words.filter((row) => row.card_eligible && [...row.trad].length > 1)
    .sort((left, right) => (left.level ?? 99) - (right.level ?? 99)
      || (left.freq_vi ?? Number.MAX_SAFE_INTEGER) - (right.freq_vi ?? Number.MAX_SAFE_INTEGER)
      || left.word_id.localeCompare(right.word_id))
    .map((row) => WORD_BY_ID.get(row.word_id));

  const EXAMPLES = new Map(kb.examples.map((row) => [`${row[0]}:${row[1]}:${row[2]}`, {
    wordId: row[0], lang: row[1], use: row[2], sentence: row[3], pinyin: row[4],
    translation: row[5], start: row[6], len: row[7],
  }]));
  const RULES = kb.rules;
  const NONE_RULE = { jong: 0, vi: [''] };

  const LANG_ORDER = ['ja', 'ko', 'zh', 'vi'];
  const FF_ROWS = new Map();
  kb.ff_meanings.forEach((row) => {
    if (!FF_ROWS.has(row.word_id)) FF_ROWS.set(row.word_id, []);
    FF_ROWS.get(row.word_id).push(row);
  });
  const FF = kb.words.filter((row) => row.false_friend).map((row) => {
    const word = WORD_BY_ID.get(row.word_id);
    const rows = (FF_ROWS.get(row.word_id) || []).slice()
      .sort((left, right) => LANG_ORDER.indexOf(left.lang) - LANG_ORDER.indexOf(right.lang));
    const display = (meaning) => meaning.reading_display
      || (meaning.lang === 'zh' && word.z !== word.j && word.z !== word.h ? `${word.z} ${word.p}` : meaning.reading || '');
    const line = (meaning) => ({
      lang: meaning.lang,
      reading: display(meaning),
      meaning: meaning.meaning_ja || '',
      trap: !!meaning.is_trap,
    });
    return {
      id: row.word_id,
      w: row.jp || row.trad,
      word,
      rows: rows.map(line),
      traps: row.false_friend.split(';'),
    };
  });

  const PASSAGE_ROWS = kb.passages.slice().sort((left, right) => (left.lang === 'vi' ? 0 : 1) - (right.lang === 'vi' ? 0 : 1)
    || left.level - right.level || left.passage_id.localeCompare(right.passage_id));
  const PASSAGE_N = { vi: 0, zh: 0 };
  const PASSAGES = PASSAGE_ROWS.map((passage) => ({
    id: passage.passage_id,
    lang: passage.lang,
    n: ++PASSAGE_N[passage.lang],
    tr: passage.translation_ja,
    toks: passage.tokens.map((token) => (token.word_id
      ? { t: token.t, w: WORD_BY_ID.get(token.word_id) }
      : token.gloss_ja ? { t: token.t, g: token.gloss_ja } : { t: token.t, x: 1 })),
  }));

  const CHAR_BY_ID = new Map(kb.chars.map((row) => [row.char_id, row]));
  const CHAR_NOTES = new Map(kb.char_notes);
  const USAGE = new Map(kb.usage.map((row) => [row[0], { zh: row[1], vi: row[2] }]));
  const GLYPHS = kb.glyphs.map((row) => {
    const character = CHAR_BY_ID.get(row[0]);
    return [
      character.jp,
      character.key_char,
      character.simp,
      splitVals(character.pinyin_all).join(' / '),
      splitVals(character.ja_on_all).join(' / '),
      splitVals(character.ko_base_all).join(' / '),
      splitVals(character.vi_all).join(' / '),
      row[0], row[1], row[2], row[3], row[4],
    ];
  });

  return {
    ALL_WORD_IDS: new Set(WORD_BY_ID.keys()),
    FF_BY_ID: new Map(FF.map(f => [f.id, f])),
    PASSAGE_IDS: new Set(PASSAGES.map(p => p.id)),
    GLYPH_IDS: new Set(GLYPHS.map(g => g[7])),
    WORD_BY_ID,
    RAW_WORD_BY_ID,
    WORDS,
    EXAMPLES,
    RULES,
    NONE_RULE,
    FF,
    PASSAGES,
    CHAR_NOTES,
    USAGE,
    GLYPHS,
  };
}
