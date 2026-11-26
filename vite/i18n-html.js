import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { validateAppMarkers } from './html-markers.js';

export const DEFAULT_LOCALE = 'en';
export const PREFILL_LOCALE = 'en';
export function readLocales(root = process.cwd()) {
  return Object.fromEntries(readdirSync(resolve(root, 'src/i18n')).filter(name => name.endsWith('.json')).sort().map(name => [
    name.slice(0, -5), JSON.parse(readFileSync(resolve(root, 'src/i18n', name), 'utf8')),
  ]));
}
export const esc = value => String(value).replace(/[&<>"]/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;',
})[character]);
export function fillHtml(html, messages, { references = false } = {}) {
  const result = html.replace(/\{\{([a-z0-9_.]+)(?:\|([^{}]+))?\}\}/g, (_, key, text) => {
    if (!Object.hasOwn(messages, key)) throw new Error(`Unknown i18n HTML key: ${key}`);
    const params = Object.fromEntries(text ? text.split(',').map(part => part.split('=', 2)) : []);
    const value = messages[key].replace(/\{([A-Za-z_]+)\}/g, (_, name) => {
      if (!(name in params)) throw new Error(`Missing HTML parameter ${name} for ${key}`);
      if (!params[name].startsWith('@')) return params[name];
      if (!references) throw new Error(`Referenced parameter is overview-only: ${key}`);
      const target = params[name].slice(1);
      if (!Object.hasOwn(messages, target)) throw new Error(`Unknown i18n HTML key: ${target}`);
      return messages[target];
    });
    return esc(value);
  });
  if (result.includes('{{')) throw new Error('Unresolved i18n HTML placeholder');
  return result;
}
export function i18nHtml() {
  const locales = readLocales();
  return {
    name: 'kanji-bridge-i18n-html',
    transformIndexHtml: {
      order: 'pre',
      handler(html, context) {
        if (context.path === '/app/index.html' || context.filename?.replaceAll('\\', '/').endsWith('/app/index.html')) validateAppMarkers(html);
        return fillHtml(html, locales[PREFILL_LOCALE]);
      },
    },
  };
}
