// Extract template text, retaining line breaks while dropping interpolation code.
export function templateTexts(source) {
  const templates = [];
  const quote = (start, q) => { let i = start + 1; while (i < source.length) { if (source[i] === '\\') i += 2; else if (source[i++] === q) break; } return i; };
  function code(start, nested = false) {
    let i = start, depth = nested ? 1 : 0;
    while (i < source.length) {
      const c = source[i];
      if (c === '"' || c === "'") { i = quote(i, c); continue; }
      if (c === '`') { i = template(i); continue; }
      if (source.startsWith('//', i)) { const end = source.indexOf('\n', i); i = end < 0 ? source.length : end + 1; continue; }
      if (source.startsWith('/*', i)) { const end = source.indexOf('*/', i + 2); i = end < 0 ? source.length : end + 2; continue; }
      if (nested && c === '{') depth++;
      if (nested && c === '}' && --depth === 0) return i + 1;
      i++;
    }
    return i;
  }
  function template(start) {
    let i = start + 1, text = '';
    while (i < source.length) {
      if (source[i] === '\\') { text += source.slice(i, i + 2); i += 2; continue; }
      if (source[i] === '`') { i++; break; }
      if (source.startsWith('${', i)) {
        const end = code(i + 2, true);
        text += '\n'.repeat((source.slice(i, end).match(/\n/g) || []).length);
        i = end;
      } else text += source[i++];
    }
    templates.push({ text, line: source.slice(0, start).split('\n').length });
    return i;
  }
  code(0);
  return templates;
}
export function uiTextFailures(text, file, line = 1) {
  const failures = [];
  const allowed = raw => {
    const value = raw.replace(/\{\{[^{}]+\}\}/g, '').trim();
    return !/\p{L}/u.test(value) || /^(?:Enter|V|C|LICENSE-DATA)$/.test(value)
      || /^(?:https?:\/\/|github\.com\/)[^\s]+$/.test(value)
      || /^[\w.-]+\.(?:md|txt|json|js|html|png)$/.test(value);
  };
  for (const match of text.matchAll(/>([^<>]*)<|\b(?:aria-label|title|placeholder|alt)="([^"]*)"/g)) {
    const value = match[1] ?? match[2];
    if (!allowed(value)) failures.push(`${file}:${line + text.slice(0, match.index).split('\n').length - 1}: ${value.trim()}`);
  }
  return failures;
}
