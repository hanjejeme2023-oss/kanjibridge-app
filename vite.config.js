import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import { i18nHtml } from './vite/i18n-html.js';

export default defineConfig({
  appType: 'mpa',
  base: '/',
  plugins: [i18nHtml()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    cssMinify: false,
    rollupOptions: {
      input: {
        overview: resolve(import.meta.dirname, 'index.html'),
        app: resolve(import.meta.dirname, 'app/index.html'),
      },
    },
  },
});
