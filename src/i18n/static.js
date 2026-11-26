import prefill from './en.json';
import { t } from './index.js';

const edges = new WeakMap();
export function applyStatic(root) {
  root.querySelectorAll('[data-i18n]').forEach(element => {
    const params = Object.fromEntries((element.dataset.i18nParams || '').split(',').filter(Boolean).map(part => part.split('=')));
    element.textContent = t(element.dataset.i18n, params);
  });
  root.querySelectorAll('[data-i18n-text]').forEach(element => {
    const nodes = [...element.childNodes].filter(node => node.nodeType === Node.TEXT_NODE && node.data.trim());
    element.dataset.i18nText.split(' ').forEach((key, index) => {
      const node = nodes[index];
      if (!node) { console.error('i18n: static text mismatch', key); return; }
      if (!edges.has(node)) {
        const value = prefill[key], at = node.data.indexOf(value);
        if (at < 0) { console.error('i18n: static text mismatch', key); return; }
        edges.set(node, { lead: node.data.slice(0, at), trail: node.data.slice(at + value.length) });
      }
      const { lead, trail } = edges.get(node);
      node.data = lead + t(key) + trail;
    });
  });
  root.querySelectorAll('[data-i18n-attr]').forEach(element => {
    element.dataset.i18nAttr.split(';').forEach(pair => {
      const [attribute, key] = pair.split('=');
      element.setAttribute(attribute, t(key));
    });
  });
}
