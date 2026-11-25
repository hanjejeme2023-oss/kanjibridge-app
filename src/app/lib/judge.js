const PY_TONE_MARKS = /[\u0304\u0301\u030c\u0300]/g;
const VI_TONE_MARKS = /[\u0301\u0300\u0309\u0303\u0323]/g;
const VI_SHAPED = /[ăâêôơưđáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/i;

export function telexSyllable(raw) {
  let value = raw.toLocaleLowerCase('vi');
  if (VI_SHAPED.test(value)) return value;
  value = value.replace(/dd/g, 'đ').replace(/uwow/g, 'ươ').replace(/uow/g, 'ươ')
    .replace(/aa/g, 'â').replace(/ee/g, 'ê').replace(/oo/g, 'ô')
    .replace(/aw/g, 'ă').replace(/ow/g, 'ơ').replace(/uw/g, 'ư');
  while (value.includes('w')) {
    const index = value.indexOf('w');
    const before = value.slice(0, index);
    let changed = before;
    const uo = before.lastIndexOf('uo');
    if (uo >= 0) changed = `${before.slice(0, uo)}ươ${before.slice(uo + 2)}`;
    else {
      let position = -1;
      for (let current = 0; current < before.length; current += 1) if (/[aou]/.test(before[current])) position = current;
      if (position >= 0) {
        const map = { a: 'ă', o: 'ơ', u: 'ư' };
        changed = before.slice(0, position) + map[before[position]] + before.slice(position + 1);
      } else changed = `${before}ư`;
    }
    value = changed + value.slice(index + 1);
  }
  const first = [...value].findIndex((character) => /[aeiouyăâêôơư]/.test(character));
  if (first >= 0) value = [...value].filter((character, index) => !(index > first && /[sfrxjz]/.test(character))).join('');
  return value;
}

export const pyKey = (value) => String(value).toLocaleLowerCase().replace(/u:|v/g, 'ü').normalize('NFD')
  .replace(PY_TONE_MARKS, '').replace(/[ '’-]/g, '');

export const viKey = (value, typed = false) => {
  let normalized = String(value).toLocaleLowerCase('vi').normalize('NFC');
  if (typed) normalized = normalized.replace(/\p{L}+/gu, telexSyllable);
  return normalized.normalize('NFD').replace(VI_TONE_MARKS, '').normalize('NFC').replace(/\s+/g, '');
};

export const splitAnswerParts = (input) => input.split(/[,/，／、]/).map((value) => value.trim()).filter(Boolean);

export function judge(input, lang, accepted, viAlt = [], several = false) {
  if (!input || !input.trim()) return null;
  const answers = (Array.isArray(accepted) ? accepted : [accepted]).filter(Boolean);
  const alternates = lang === 'vi' ? (Array.isArray(viAlt) ? viAlt : [viAlt]).filter(Boolean) : [];
  const parts = several ? splitAnswerParts(input) : [input];
  if (!parts.length) return null;
  const expected = lang === 'zh' ? answers.map(pyKey) : answers.concat(alternates).map((value) => viKey(value, false));
  return parts.every((part) => expected.includes(lang === 'zh' ? pyKey(part) : viKey(part, true))) ? 'ok' : 'ng';
}
