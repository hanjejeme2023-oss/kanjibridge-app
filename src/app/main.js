import './styles.css';
import { buildModel } from './data/model.js';
import { setModel } from './data/instance.js';
import { initSpeech, initAutoplay } from './ui/speech.js';
import { initNav, render } from './nav.js';
import { initCards } from './views/cards.js';
import { initRules } from './views/rules.js';
import { initFF } from './views/ff.js';
import { initRead } from './views/read.js';
import { initGlyph } from './views/glyph.js';
import { initKeyboard } from './keyboard.js';
import { initAbout, initReset } from './footer.js';

import { isLocale, resolveLocale, setLocale } from '../i18n/index.js';
import { applyLanguage } from './language.js';
import { loadData } from './data/load.js';
import { S } from './storage.js';

async function start() {
  const query = new URLSearchParams(location.search).get('lang');
  const code = resolveLocale({ query, stored: S.get('kb_lang', null), languages: navigator.languages?.length ? navigator.languages : [navigator.language] });
  setLocale(code);
  if (isLocale(query)) S.set('kb_lang', query);
  if (query !== null) history.replaceState(history.state, '', location.pathname + location.hash);
  applyLanguage(code, { initial: true });
  await loadData();
  setModel(buildModel(window.KB_DATA));
  initSpeech();
  initAutoplay();
  initNav();
  initCards();
  initRules();
  initFF();
  initRead();
  initGlyph();
  initKeyboard();
  initAbout();
  initReset();
  render();
}

start();
