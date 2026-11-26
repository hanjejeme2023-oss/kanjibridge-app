const placeholders = text => [...text.matchAll(/\{\{([a-z0-9_.]+)(?:\|([^{}]+))?\}\}/g)].map(match => ({ key: match[1], params: match[2] || '' }));
const voidTags = new Set(['meta', 'link', 'input', 'br', 'img', 'hr', 'source']);
export function htmlElements(html) {
  const stack = [], elements = [];
  for (const match of html.matchAll(/<!--[\s\S]*?-->|<![^>]*>|<\/?[A-Za-z][^>]*>|[^<]+/g)) {
    const token = match[0];
    if (token.startsWith('<!')) continue;
    if (token.startsWith('</')) {
      const tag = token.match(/^<\/([^\s>]+)/)[1];
      const index = stack.findLastIndex(node => node.tag === tag);
      if (index >= 0) stack.length = index;
    } else if (token.startsWith('<')) {
      const [, tag, rest] = token.match(/^<([^\s>]+)([\s\S]*?)>$/);
      const attrs = Object.fromEntries([...rest.matchAll(/([\w:-]+)(?:="([^"]*)")?/g)].map(item => [item[1], item[2] ?? '']));
      const node = { tag, attrs, texts: [], children: 0, body: tag === 'body' || !!stack.at(-1)?.body };
      if (stack.length) stack.at(-1).children++;
      elements.push(node);
      if (!voidTags.has(tag)) stack.push(node);
    } else if (stack.length) stack.at(-1).texts.push(token);
  }
  return elements;
}
export function validateAppMarkers(html) {
  for (const node of htmlElements(html).filter(node => node.body)) {
    const a = node.attrs, actual = node.texts.flatMap(placeholders);
    const whole = a['data-i18n'], mixed = a['data-i18n-text'];
    if (whole && mixed) throw new Error(`Conflicting i18n markers: ${whole}`);
    const expected = whole ? [{ key: whole, params: a['data-i18n-params'] || '' }]
      : mixed ? mixed.split(' ').map(key => ({ key, params: '' })) : [];
    if (JSON.stringify(actual) !== JSON.stringify(expected) || (whole && node.children)) {
      throw new Error(`i18n text marker/placeholder mismatch: ${[...actual, ...expected].map(item => item.key).join(', ')}`);
    }
    const attrMarkers = Object.fromEntries((a['data-i18n-attr'] || '').split(';').filter(Boolean).map(pair => pair.split('=')));
    for (const [attribute, key] of Object.entries(attrMarkers)) {
      if (a[attribute] !== `{{${key}}}`) throw new Error(`i18n attribute marker/placeholder mismatch: ${key}`);
    }
    for (const [attribute, value] of Object.entries(a)) {
      for (const { key } of placeholders(value)) {
        if (attrMarkers[attribute] !== key) throw new Error(`Missing i18n attribute marker: ${key}`);
      }
    }
  }
}
