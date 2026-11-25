import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const hash = (file) => createHash('sha256').update(readFileSync(file)).digest('hex');

function buildFiles(directory = 'dist') {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? buildFiles(file) : [file];
  });
}

describe('production build', () => {
  it('contains no unfilled placeholders in any built HTML file', () => {
    expect(existsSync('dist'), 'dist/ is missing; run npm run build first').toBe(true);
    const html = buildFiles().filter((file) => path.extname(file) === '.html');
    expect(html).toContain(path.join('dist', 'index.html'));
    expect(html).toContain(path.join('dist', 'app', 'index.html'));
    for (const file of html) {
      expect(readFileSync(file, 'utf8').includes('{{'), `${file}: unfilled {{ placeholder`).toBe(false);
    }
  });

  it('contains the complete pinned app without secrets', () => {
    expect(existsSync('dist'), 'dist/ is missing; run npm run build first').toBe(true);
    expect(hash('dist/app/data.js')).toBe('3eb99e245782a1aae7e76144bd656be9648c7b075441b70f2e1a6f7f0eb84af9');
    expect(readdirSync('dist/app/licenses', { withFileTypes: true }).filter((entry) => entry.isFile())).toHaveLength(11);
    for (const file of buildFiles()) {
      expect(readFileSync(file, 'utf8'), `${file}: secret scan`).not.toMatch(/service_role|sb_secret_|-----BEGIN/);
    }
  });
});
