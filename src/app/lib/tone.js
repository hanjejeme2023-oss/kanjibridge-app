import { t } from '../../i18n/index.js';

const PY_TONE_NAME = {
  1: () => t('tone.zh_1'),
  2: () => t('tone.zh_2'),
  3: () => t('tone.zh_3'),
  4: () => t('tone.zh_4'),
  5: () => t('tone.zh_5'),
};
const VI_TONE_NAME = { '\u0301': 'sắc', '\u0300': 'huyền', '\u0309': 'hỏi', '\u0303': 'ngã', '\u0323': 'nặng' };

export function markedTone(syllable, lang) {
  const marks = [...String(syllable).normalize('NFD')];
  if (lang === 'zh') {
    const order = '\u0304\u0301\u030c\u0300';
    const mark = marks.find((character) => order.includes(character));
    return mark ? PY_TONE_NAME[order.indexOf(mark) + 1]() : t('tone.zh_5');
  }
  const mark = marks.find((character) => VI_TONE_NAME[character]);
  return mark ? VI_TONE_NAME[mark] : 'ngang';
}

export function toneHint(lang, readings, tones = '') {
  const values = (Array.isArray(readings) ? readings : [readings]).filter(Boolean);
  return values.map((reading) => {
    if (lang === 'zh' && tones && values.length === 1) {
      return [...tones].map((tone) => PY_TONE_NAME[tone]?.()).filter(Boolean).join(t('tone.separator'));
    }
    const syllables = String(reading).split(/\s+|['’-]+/).filter(Boolean);
    return syllables.map((syllable) => markedTone(syllable, lang)).join(t('tone.separator'));
  }).join(' / ');
}
