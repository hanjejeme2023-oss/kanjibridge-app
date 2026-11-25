import ja from '../src/i18n/ja.json' with { type: 'json' };

const esc = (value) => String(value).replace(/[&<>"]/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;',
})[character]);

function fill(template, key, paramsText) {
  if (!(key in ja)) throw new Error(`Unknown i18n HTML key: ${key}`);
  const params = Object.fromEntries(
    paramsText ? paramsText.split(',').map((part) => part.split('=', 2)) : [],
  );
  const value = ja[key].replace(/\{([A-Za-z_]+)\}/g, (_, name) => {
    if (!(name in params)) throw new Error(`Missing HTML parameter ${name} for ${key}`);
    return params[name];
  });
  return esc(value);
}

export function i18nHtml() {
  return {
    name: 'kanji-bridge-i18n-html',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        const result = html.replace(/\{\{([a-z0-9_.]+)(?:\|([^{}]+))?\}\}/g, (_, key, params) => (
          fill(html, key, params)
        ));
        if (result.includes('{{')) throw new Error('Unresolved i18n HTML placeholder');
        return result;
      },
    },
  };
}
