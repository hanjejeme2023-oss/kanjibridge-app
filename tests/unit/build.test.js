import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const hash = (file) => createHash('sha256').update(readFileSync(file)).digest('hex');

describe('production build', () => {
  it.skipIf(!existsSync('dist'))('contains the complete pinned app without secrets', () => {
    expect(readFileSync('dist/app/index.html', 'utf8')).not.toContain('{{');
    expect(hash('dist/app/data.js')).toBe('3eb99e245782a1aae7e76144bd656be9648c7b075441b70f2e1a6f7f0eb84af9');
    expect(readdirSync('dist/app/licenses')).toHaveLength(11);
    expect(existsSync('dist/index.html')).toBe(true);

    const stack = ['dist'];
    const forbidden = /service_role|sb_secret_|-----BEGIN/;
    while (stack.length) {
      const directory = stack.pop();
      for (const entry of readdirSync(directory, { withFileTypes: true })) {
        const full = path.join(directory, entry.name);
        if (entry.isDirectory()) stack.push(full);
        else expect(readFileSync(full, 'utf8')).not.toMatch(forbidden);
      }
    }
  });
});
