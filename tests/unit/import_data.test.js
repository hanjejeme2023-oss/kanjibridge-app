import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { checkImport, importData } from '../../scripts/import_data.mjs';

const temporary = [];
const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const write = (root, file, value) => {
  const target = path.join(root, file);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, value);
};

function fixtureRepository() {
  const root = mkdtempSync(path.join(os.tmpdir(), 'kb-import-source-'));
  temporary.push(root);
  const files = {
    'app/data.js': Buffer.from('window.KB_DATA={ok:true};\r\n'),
    'NOTICE.md': Buffer.from('notice\n'),
    'LICENSE-DATA': Buffer.from('data licence\n'),
    'licenses/ONE.txt': Buffer.from('one\n'),
    'app/index.html': Buffer.from('<!doctype html>\n'),
    'docs/review_scripts/stage5_gate_harness.js': Buffer.from('/* gate */\n'),
    LICENSE: Buffer.from('MIT\n'),
  };
  for (const [file, value] of Object.entries(files)) write(root, file, value);
  execFileSync('git', ['init'], { cwd: root });
  execFileSync('git', ['config', 'core.autocrlf', 'false'], { cwd: root });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: root });
  execFileSync('git', ['config', 'user.email', 'test@example.invalid'], { cwd: root });
  execFileSync('git', ['add', '--all'], { cwd: root });
  execFileSync('git', ['commit', '-m', 'fixture'], { cwd: root });
  const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
  const dataBlob = execFileSync('git', ['cat-file', 'blob', `${commit}:app/data.js`], { cwd: root });
  return { root, files, dataBlob, commit };
}

function outputRoot() {
  const root = mkdtempSync(path.join(os.tmpdir(), 'kb-import-target-'));
  temporary.push(root);
  write(root, 'public/app/DATA-LICENSE.md', 'keep\n');
  return root;
}

afterEach(() => {
  while (temporary.length) rmSync(temporary.pop(), { recursive: true, force: true });
});

describe('pinned data import', () => {
  it('imports raw git bytes and produces a deterministic manifest', () => {
    const fixture = fixtureRepository();
    const root = outputRoot();
    const options = {
      source: fixture.root,
      root,
      sourceRepo: 'https://example.invalid/source',
      sourceCommit: fixture.commit,
      dataHash: sha256(fixture.dataBlob),
    };
    importData(options);
    expect(readFileSync(path.join(root, 'public/app/data.js'))).toEqual(fixture.dataBlob);
    expect(readFileSync(path.join(root, 'public/app/DATA-LICENSE.md'), 'utf8')).toBe('keep\n');
    const first = readFileSync(path.join(root, 'public/app/DATA-MANIFEST.json'));
    importData(options);
    expect(readFileSync(path.join(root, 'public/app/DATA-MANIFEST.json'))).toEqual(first);
    expect(checkImport({ root, sourceCommit: fixture.commit, dataHash: options.dataHash })).toEqual([]);
  });

  it('refuses a wrong data hash before writing anything', () => {
    const fixture = fixtureRepository();
    const root = outputRoot();
    expect(() => importData({ source: fixture.root, root, sourceCommit: fixture.commit, dataHash: '0'.repeat(64) }))
      .toThrow(/checksum mismatch/);
    expect(existsSync(path.join(root, 'public/app/data.js'))).toBe(false);
    expect(existsSync(path.join(root, 'public/app/DATA-MANIFEST.json'))).toBe(false);
  });

  it('check mode reports changed, missing, and extra files', () => {
    const fixture = fixtureRepository();
    const root = outputRoot();
    const dataHash = sha256(fixture.dataBlob);
    importData({ source: fixture.root, root, sourceCommit: fixture.commit, dataHash });
    write(root, 'public/app/data.js', 'changed');
    rmSync(path.join(root, 'public/app/NOTICE.md'));
    write(root, 'public/app/licenses/EXTRA.txt', 'extra');
    const problems = checkImport({ root, sourceCommit: fixture.commit, dataHash });
    expect(problems.join('\n')).toMatch(/data\.js: (byte count|checksum) mismatch/);
    expect(problems.join('\n')).toMatch(/NOTICE\.md: missing/);
    expect(problems.join('\n')).toMatch(/EXTRA\.txt: extra file/);
  });
});
