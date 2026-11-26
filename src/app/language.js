import { DEFAULT_LOCALE, LOCALES, localeMeta, setLocale, t } from '../i18n/index.js';
import { applyStatic } from '../i18n/static.js';
import { S } from './storage.js';
import { rerenderAll } from './nav.js';

export const overviewPath = code => code === DEFAULT_LOCALE ? '/' : `/${code}/`;
export function applyLanguage(code, { initial = false, fromUser = false } = {}) {
  setLocale(code);
  if (fromUser) S.set('kb_lang', code);
  document.documentElement.lang = localeMeta().htmlLang;
  document.title = t('app.title');
  applyStatic(document.body);
  const select = document.querySelector('#lang');
  if (select) {
    if (initial) {
      select.replaceChildren(...LOCALES.map(value => {
        const option = document.createElement('option');
        option.value = value;
        option.lang = value;
        option.textContent = localeMeta(value).nativeName;
        return option;
      }));
      select.onchange = () => applyLanguage(select.value, { fromUser: true });
    }
    select.value = code;
    select.setAttribute('aria-label', t('header.lang_label'));
    let note = document.querySelector('.content-note');
    if (code === 'ja') note?.remove();
    else {
      if (!note) {
        note = document.createElement('p');
        note.className = 'content-note';
        note.setAttribute('role', 'note');
        document.querySelector('main').prepend(note);
      }
      note.textContent = t('notice.content_ja');
    }
  }
  const logo = document.querySelector('a.logo');
  if (logo) logo.setAttribute('href', overviewPath(code));
  if (!initial) {
    rerenderAll();
    if (fromUser) select?.focus({ preventScroll: true });
  }
}
