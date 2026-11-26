import ja from './ja.json';

const MESSAGES = { ja };
const META = { ja: { htmlLang: 'ja', numberLocale: 'ja-JP' } };
const missing = new Set();
let locale = 'ja';

const esc = (value) => String(value).replace(/[&<>"]/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;',
})[character]);

export const getLocale = () => locale;
export const localeMeta = () => META[locale];

export function t(key, params = {}) {
  const value = MESSAGES[locale][key];
  if (value === undefined) {
    if (!missing.has(key)) {
      missing.add(key);
      console.error('i18n: missing key', key);
    }
    return key;
  }
  return value.replace(/\{([A-Za-z_]+)\}/g, (_, name) => String(params[name]));
}

export function tHtml(key, slots = {}) {
  const value = MESSAGES[locale][key];
  if (value === undefined) return t(key);
  const escaped = esc(value);
  return escaped.replace(/\{([A-Za-z_]+)\}/g, (_, name) => slots[name] ?? '');
}
