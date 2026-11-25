import { expect, test } from '@playwright/test';
import { createRequire } from 'node:module';
import path from 'node:path';
import { isAbortedFontError } from './console-errors.js';

const require = createRequire(import.meta.url);
const playwrightCoreDirectory = path.dirname(require.resolve('playwright-core'));
const { PNG } = require(path.join(playwrightCoreDirectory, 'lib/utilsBundle.js'));

const BASELINE_URL = 'http://127.0.0.1:4174/index.html';
const NEW_URL = 'http://127.0.0.1:4173/app/';
const FIXED_TIME = '2026-11-24T10:00:00+09:00';

function initScript({ seed, speech = 'voices', storage = {}, storageUnavailable = false }) {
  let randomState = seed >>> 0;
  Math.random = () => {
    randomState += 0x6D2B79F5;
    let value = randomState;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
  window.__speech = [];
  if (speech === 'missing') {
    delete window.speechSynthesis;
    delete window.SpeechSynthesisUtterance;
  } else {
    const voices = speech === 'none' ? [] : [
      { name: 'Test zh', lang: 'zh-CN' },
      { name: 'Test vi', lang: 'vi-VN' },
    ];
    class Utterance {
      constructor(text) { this.text = text; this.lang = ''; this.rate = 1; this.voice = null; }
    }
    Object.defineProperty(window, 'SpeechSynthesisUtterance', { configurable: true, value: Utterance });
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: {
        getVoices: () => voices,
        addEventListener: () => {},
        cancel: () => {},
        speak: (utterance) => {
          window.__speech.push([utterance.text, utterance.lang, utterance.rate]);
          if (utterance.onend) utterance.onend();
        },
      },
    });
  }
  if (storageUnavailable) {
    Storage.prototype.getItem = () => { throw new Error('storage unavailable'); };
    Storage.prototype.setItem = () => { throw new Error('storage unavailable'); };
  } else {
    for (const [key, value] of Object.entries(storage)) localStorage.setItem(key, value);
  }
}

async function quiet(page) {
  await page.evaluate(() => new Promise((resolve, reject) => {
    let timer;
    const finish = () => { observer.disconnect(); resolve(); };
    const observer = new MutationObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(finish, 300);
    });
    observer.observe(document.body, { subtree: true, childList: true, attributes: true, characterData: true });
    timer = setTimeout(finish, 300);
    setTimeout(() => { observer.disconnect(); reject(new Error('page did not become quiet')); }, 60_000);
  }));
}

async function selectorPath(page) {
  return page.evaluate(() => {
    const element = document.activeElement;
    if (!element || element === document.body) return 'body';
    const parts = [];
    let current = element;
    while (current && current !== document.body) {
      let part = current.tagName.toLowerCase();
      if (current.id) part += `#${current.id}`;
      if (current.classList.length) part += `.${[...current.classList].join('.')}`;
      if (current.parentElement) part += `:nth-child(${[...current.parentElement.children].indexOf(current) + 1})`;
      parts.unshift(part);
      current = current.parentElement;
    }
    return `body>${parts.join('>')}`;
  });
}

async function snapshot(page, styles, captureScreenshot) {
  await page.evaluate(async () => {
    const position = [scrollX, scrollY];
    const prior = document.body.getAttribute('style');
    document.body.style.display = 'none';
    void document.body.offsetHeight;
    if (prior === null) document.body.removeAttribute('style');
    else document.body.setAttribute('style', prior);
    scrollTo(...position);
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    document.getAnimations().forEach((animation) => animation.finish());
  });
  const value = await page.evaluate(({ styles }) => {
    const clone = document.body.cloneNode(true);
    clone.querySelectorAll('script').forEach((node) => node.remove());
    const footer = clone.querySelector('footer');
    if (footer) {
      let node = footer.nextSibling;
      while (node) {
        const next = node.nextSibling;
        if (node.nodeType === Node.TEXT_NODE && !node.textContent.trim()) node.remove();
        node = next;
      }
    }
    const css = [...document.styleSheets]
      .filter((sheet) => !sheet.href || new URL(sheet.href).origin === location.origin)
      .flatMap((sheet) => [...sheet.cssRules].map((rule) => rule.cssText));
    const metadata = [...document.head.querySelectorAll('meta,title,link[rel="preconnect"],link[href*="fonts.googleapis.com"]')]
      .map((element) => element.outerHTML);
    const forms = [...document.querySelectorAll('input')].map((input) => [
      input.id ? `#${input.id}` : input.dataset.testCell ? `[data-test-cell="${input.dataset.testCell}"]` : input.outerHTML,
      input.value,
      input.checked,
    ]);
    let storage;
    try {
      storage = Object.keys(localStorage).sort().map((key) => [key, localStorage.getItem(key)]);
    } catch (error) {
      storage = [`unavailable: ${error.message}`];
    }
    const bad = (document.querySelector('main').innerText + document.querySelector('header').innerText)
      .match(/undefined|NaN|\bnull\b|\[object/g) || [];
    let computed = null;
    if (styles) {
      const elements = [
        ...document.querySelectorAll('header *'),
        ...[...document.querySelectorAll('main *')].slice(0, 400),
        ...document.querySelectorAll('footer *'),
      ];
      computed = elements.map((element) => {
        const style = getComputedStyle(element);
        return [element.tagName, [...style].sort().map((property) => [property, style.getPropertyValue(property)])];
      });
    }
    return {
      body: clone.innerHTML,
      title: document.title,
      lang: document.documentElement.lang,
      metadata,
      forms,
      scroll: [scrollX, scrollY],
      storage,
      speech: window.__speech,
      css,
      bad,
      computed,
    };
  }, { styles });
  value.focus = await selectorPath(page);
  value.screenshot = captureScreenshot ? await page.screenshot({ animations: 'disabled', caret: 'hide' }) : null;
  return value;
}

function firstDifference(left, right) {
  const length = Math.max(left.length, right.length);
  let index = 0;
  while (index < length && left[index] === right[index]) index += 1;
  return `${left.slice(Math.max(0, index - 100), index + 100)}\n---\n${right.slice(Math.max(0, index - 100), index + 100)}`;
}

function comparePngPixels(left, right) {
  const a = PNG.sync.read(left);
  const b = PNG.sync.read(right);
  return a.width === b.width && a.height === b.height && Buffer.from(a.data).equals(Buffer.from(b.data));
}

function describePngDifference(left, right) {
  const a = PNG.sync.read(left);
  const b = PNG.sync.read(right);
  let count = 0;
  let minX = Infinity; let minY = Infinity; let maxX = -1; let maxY = -1;
  const width = Math.min(a.width, b.width);
  const height = Math.min(a.height, b.height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const ai = (y * a.width + x) * 4;
      const bi = (y * b.width + x) * 4;
      if (a.data[ai] !== b.data[bi] || a.data[ai + 1] !== b.data[bi + 1]
        || a.data[ai + 2] !== b.data[bi + 2] || a.data[ai + 3] !== b.data[bi + 3]) {
        count += 1; minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
      }
    }
  }
  return `${count} differing pixels; bounds ${minX},${minY}..${maxX},${maxY}; dimensions ${a.width}x${a.height}/${b.width}x${b.height}`;
}

function pngDifferenceStats(left, right) {
  const a = PNG.sync.read(left);
  const b = PNG.sync.read(right);
  if (a.width !== b.width || a.height !== b.height) return { count: Infinity, maxDelta: Infinity };
  let count = 0; let maxDelta = 0;
  for (let index = 0; index < a.data.length; index += 4) {
    const delta = Math.max(
      Math.abs(a.data[index] - b.data[index]),
      Math.abs(a.data[index + 1] - b.data[index + 1]),
      Math.abs(a.data[index + 2] - b.data[index + 2]),
      Math.abs(a.data[index + 3] - b.data[index + 3]),
    );
    if (delta) { count += 1; maxDelta = Math.max(maxDelta, delta); }
  }
  return { count, maxDelta };
}

function makePngDiff(left, right) {
  const a = PNG.sync.read(left);
  const b = PNG.sync.read(right);
  const width = Math.max(a.width, b.width);
  const height = Math.max(a.height, b.height);
  const diff = new PNG({ width, height });
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const out = (y * width + x) * 4;
      const ai = (y * a.width + x) * 4;
      const bi = (y * b.width + x) * 4;
      const same = x < a.width && y < a.height && x < b.width && y < b.height
        && a.data[ai] === b.data[bi]
        && a.data[ai + 1] === b.data[bi + 1]
        && a.data[ai + 2] === b.data[bi + 2]
        && a.data[ai + 3] === b.data[bi + 3];
      diff.data[out] = same ? Math.round(a.data[ai] * 0.25 + 191) : 255;
      diff.data[out + 1] = same ? Math.round(a.data[ai + 1] * 0.25 + 191) : 0;
      diff.data[out + 2] = same ? Math.round(a.data[ai + 2] * 0.25 + 191) : 0;
      diff.data[out + 3] = 255;
    }
  }
  return PNG.sync.write(diff);
}

export async function createParity(browser, options = {}) {
  const settings = {
    viewport: options.viewport ?? { width: 1280, height: 800 },
    deviceScaleFactor: 1,
    locale: 'ja-JP',
    timezoneId: 'Asia/Tokyo',
    reducedMotion: 'reduce',
  };
  const contexts = await Promise.all([browser.newContext(settings), browser.newContext(settings)]);
  const records = [];
  const pages = [];
  for (let index = 0; index < contexts.length; index += 1) {
    const context = contexts[index];
    const record = { errors: [], pageErrors: [], requests: [], aborted: [], fontErrors: [] };
    records.push(record);
    await context.addInitScript(initScript, {
      seed: 20261124,
      speech: options.speech ?? 'voices',
      storage: options.storage ?? {},
      storageUnavailable: options.storageUnavailable ?? false,
    });
    await context.route('**/*', async (route) => {
      const url = new URL(route.request().url());
      record.requests.push(url.href);
      if (url.hostname !== '127.0.0.1') {
        record.aborted.push(url.href);
        await route.abort();
      } else await route.continue();
    });
    const page = await context.newPage();
    page.on('pageerror', (error) => record.pageErrors.push(String(error)));
    page.on('console', (message) => {
      if (message.type() !== 'error') return;
      const entry = { text: message.text(), url: message.location().url };
      if (isAbortedFontError(message, record.aborted)) record.fontErrors.push(entry);
      else record.errors.push(entry);
    });
    await page.clock.setFixedTime(new Date(FIXED_TIME));
    pages.push(page);
  }
  await pages[0].goto(BASELINE_URL, { waitUntil: 'load' });
  await pages[1].goto(NEW_URL, { waitUntil: 'load' });
  await Promise.all(pages.map(quiet));

  const api = {
    baseline: pages[0],
    current: pages[1],
    async valueFromBaseline(callback) { return callback(pages[0]); },
    async act(callback, { settle = true } = {}) {
      await callback(pages[0]);
      await callback(pages[1]);
      if (settle) await Promise.all(pages.map(quiet));
    },
    async checkpoint(name, { styles = false, screenshot = true } = {}) {
      await Promise.all(pages.map((page) => page.evaluate(() => document.fonts.ready)));
      const [left, right] = screenshot
        ? [await snapshot(pages[0], styles, true), await snapshot(pages[1], styles, true)]
        : await Promise.all(pages.map((page) => snapshot(page, styles, false)));
      let leftShot = left.screenshot;
      let rightShot = right.screenshot;
      delete left.screenshot;
      delete right.screenshot;
      expect(left.bad, `${name}: baseline bad text`).toEqual([]);
      expect(right.bad, `${name}: new bad text`).toEqual([]);
      if (left.body !== right.body) throw new Error(`${name}: body markup differs\n${firstDifference(left.body, right.body)}`);
      expect(right, `${name}: snapshot`).toEqual(left);
      for (let attempt = 0; screenshot && attempt < 5 && !comparePngPixels(leftShot, rightShot); attempt += 1) {
        await Promise.all(pages.map((page) => page.waitForTimeout(250)));
        leftShot = await pages[0].screenshot({ animations: 'disabled', caret: 'hide' });
        rightShot = await pages[1].screenshot({ animations: 'disabled', caret: 'hide' });
      }
      const exactPixels = !screenshot || comparePngPixels(leftShot, rightShot);
      const stats = exactPixels ? { count: 0, maxDelta: 0 } : pngDifferenceStats(leftShot, rightShot);
      const windowsRasterMatch = process.platform === 'win32' && stats.count <= 64 && stats.maxDelta <= 1;
      const pixelsMatch = exactPixels || windowsRasterMatch;
      if (!exactPixels) {
        await test.info().attach(`${name}-baseline.png`, { body: leftShot, contentType: 'image/png' });
        await test.info().attach(`${name}-new.png`, { body: rightShot, contentType: 'image/png' });
        await test.info().attach(`${name}-diff.png`, { body: makePngDiff(leftShot, rightShot), contentType: 'image/png' });
      }
      expect(pixelsMatch, `${name}: decoded screenshot pixels; ${pixelsMatch ? '' : describePngDifference(leftShot, rightShot)}`).toBe(true);
    },
    async close() {
      try {
        for (const [index, record] of records.entries()) {
          expect(record.pageErrors, `${index ? 'new' : 'baseline'} page errors`).toEqual([]);
          expect(record.errors, `${index ? 'new' : 'baseline'} console errors`).toEqual([]);
          expect(record.requests.filter((url) => {
            const host = new URL(url).hostname;
            return !['127.0.0.1', 'fonts.googleapis.com', 'fonts.gstatic.com'].includes(host);
          }), 'unexpected requests').toEqual([]);
        }
      } finally {
        await Promise.all(contexts.map((context) => context.close()));
      }
    },
  };
  return api;
}

export async function inspectBaseline(browser, callback) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    locale: 'ja-JP',
    timezoneId: 'Asia/Tokyo',
  });
  try {
    await context.route('**/*', (route) => new URL(route.request().url()).hostname === '127.0.0.1'
      ? route.continue() : route.abort());
    const page = await context.newPage();
    await page.clock.setFixedTime(new Date(FIXED_TIME));
    await page.goto(BASELINE_URL, { waitUntil: 'load' });
    return await callback(page);
  } finally {
    await context.close();
  }
}

export const nav = (page, view) => page.locator(`#nav button[data-v="${view}"]`).click();
