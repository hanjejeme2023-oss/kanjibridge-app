const files = import.meta.glob('./*.json', { eager: true, import: 'default' });
const messages = Object.fromEntries(Object.entries(files).map(([name, values]) => [name.slice(2, -5), values]));
export const DEFAULT_LOCALE = 'en';
export const PREFILL_LOCALE = 'en';
export const LOCALES = Object.keys(messages).sort();
export const isLocale = code => typeof code === 'string' && LOCALES.includes(code);
let locale = DEFAULT_LOCALE;
const missing = new Set();
export const getLocale = () => locale;
export function setLocale(code) {
  if (!isLocale(code)) throw new Error(`Unknown locale: ${code}`);
  locale = code;
}
export const localeMeta = (code = locale) => ({
  nativeName: messages[code]['meta.native_name'],
  htmlLang: messages[code]['meta.html_lang'],
  numberLocale: messages[code]['meta.number_locale'],
});
const esc = value => String(value).replace(/[&<>"]/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;',
})[character]);
function message(key) {
  if (Object.hasOwn(messages[locale], key)) return messages[locale][key];
  const id = `${locale}:${key}`;
  if (!missing.has(id)) {
    missing.add(id);
    console.error('i18n: missing key', key, locale);
  }
  return Object.hasOwn(messages[DEFAULT_LOCALE], key) ? messages[DEFAULT_LOCALE][key] : key;
}
export function t(key, params = {}) {
  return message(key).replace(/\{([A-Za-z_]+)\}/g, (_, name) => String(params[name]));
}
export function tHtml(key, slots = {}) {
  return esc(message(key)).replace(/\{([A-Za-z_]+)\}/g, (_, name) => slots[name] ?? '');
}
export function resolveLocale({ query, stored, languages = [] } = {}) {
  if (isLocale(query)) return query;
  if (isLocale(stored)) return stored;
  for (const language of Array.isArray(languages) ? languages : []) {
    if (typeof language !== 'string') continue;
    const code = language.split('-')[0].toLowerCase();
    if (isLocale(code)) return code;
  }
  return DEFAULT_LOCALE;
}
