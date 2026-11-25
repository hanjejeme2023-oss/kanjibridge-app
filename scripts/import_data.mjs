import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const SOURCE_REPO = 'https://github.com/hanjejeme2023-oss/kanji-bridge';
export const SOURCE_COMMIT = '59156e119bb4ec1652ac573e9cf821c0d064e9dc';
export const DATA_JS_SHA256 = '3eb99e245782a1aae7e76144bd656be9648c7b075441b70f2e1a6f7f0eb84af9';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FIXED_FILES = [
  ['data', 'app/data.js', 'public/app/data.js'],
  ['data', 'NOTICE.md', 'public/app/NOTICE.md'],
  ['data', 'LICENSE-DATA', 'public/app/LICENSE-DATA'],
];
const BASELINE_FILES = [
  ['baseline', 'app/index.html', 'tests/baseline/app/index.html'],
  ['baseline', 'docs/review_scripts/stage5_gate_harness.js', 'tests/baseline/stage5_gate_harness.js'],
  ['baseline', 'LICENSE', 'tests/baseline/LICENSE'],
];

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const posix = (value) => value.replaceAll('\\', '/');

function git(source, args, options = {}) {
  return execFileSync('git', ['-C', source, ...args], {
    encoding: options.encoding ?? 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    stdio: options.stdio ?? ['ignore', 'pipe', 'pipe'],
  });
}

function listFiles(root) {
  if (!existsSync(root)) return [];
  const result = [];
  const visit = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(full);
      else result.push(posix(path.relative(root, full)));
    }
  };
  visit(root);
  return result.sort();
}

function expectedBaselineTargets(manifest) {
  return manifest.files
    .filter(({ group }) => group === 'baseline')
    .map(({ target }) => posix(path.relative('tests/baseline', target)))
    .sort();
}

export function checkImport({ root = ROOT, sourceCommit = SOURCE_COMMIT, dataHash = DATA_JS_SHA256 } = {}) {
  const problems = [];
  const manifestPath = path.join(root, 'public/app/DATA-MANIFEST.json');
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  } catch (error) {
    problems.push(`manifest: ${error.message}`);
    return problems;
  }

  if (manifest.source?.commit !== sourceCommit) problems.push('manifest: source commit mismatch');
  const dataEntry = manifest.files?.find(({ source }) => source === 'app/data.js');
  if (!dataEntry || dataEntry.sha256 !== dataHash) problems.push('manifest: data.js hash mismatch');

  for (const entry of manifest.files ?? []) {
    const target = path.join(root, entry.target);
    if (!existsSync(target)) {
      problems.push(`${entry.target}: missing`);
      continue;
    }
    const bytes = readFileSync(target);
    if (bytes.length !== entry.bytes) problems.push(`${entry.target}: byte count mismatch`);
    if (sha256(bytes) !== entry.sha256) problems.push(`${entry.target}: checksum mismatch`);
  }

  const actualLicences = listFiles(path.join(root, 'public/app/licenses'));
  const expectedLicences = (manifest.files ?? [])
    .filter(({ source }) => source.startsWith('licenses/'))
    .map(({ target }) => posix(path.relative('public/app/licenses', target)))
    .sort();
  for (const file of actualLicences.filter((file) => !expectedLicences.includes(file))) {
    problems.push(`public/app/licenses/${file}: extra file`);
  }

  const actualBaseline = listFiles(path.join(root, 'tests/baseline')).filter((file) => file !== 'README.md');
  const expectedBaseline = expectedBaselineTargets(manifest);
  for (const file of actualBaseline.filter((file) => !expectedBaseline.includes(file))) {
    problems.push(`tests/baseline/${file}: extra file`);
  }
  return problems;
}

export function importData({
  source,
  root = ROOT,
  sourceRepo = SOURCE_REPO,
  sourceCommit = SOURCE_COMMIT,
  dataHash = DATA_JS_SHA256,
} = {}) {
  if (!source) throw new Error('--source is required');
  try {
    git(source, ['cat-file', '-e', `${sourceCommit}^{commit}`]);
  } catch {
    throw new Error('commit not found; fetch kanji-bridge first');
  }

  const licenceFiles = git(source, ['ls-tree', '-r', '--name-only', sourceCommit, 'licenses/'])
    .split(/\r?\n/)
    .filter((file) => file && !file.endsWith('/.gitkeep') && file !== 'licenses/.gitkeep')
    .sort();
  const files = [
    ...FIXED_FILES,
    ...licenceFiles.map((file) => ['data', file, `public/app/${file}`]),
    ...BASELINE_FILES,
  ];
  const pending = files.map(([group, sourcePath, target]) => {
    const bytes = git(source, ['cat-file', 'blob', `${sourceCommit}:${sourcePath}`], { encoding: 'buffer' });
    return { group, source: sourcePath, target, bytes, sha256: sha256(bytes) };
  });

  const data = pending.find(({ source: sourcePath }) => sourcePath === 'app/data.js');
  if (data.sha256 !== dataHash) throw new Error(`app/data.js checksum mismatch: ${data.sha256}`);

  const licenceRoot = path.join(root, 'public/app/licenses');
  mkdirSync(licenceRoot, { recursive: true });
  const wantedLicences = new Set(licenceFiles.map((file) => path.basename(file)));
  for (const file of readdirSync(licenceRoot)) {
    const full = path.join(licenceRoot, file);
    if (statSync(full).isFile() && !wantedLicences.has(file)) rmSync(full);
  }

  for (const entry of pending) {
    const target = path.join(root, entry.target);
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, entry.bytes);
  }
  const manifest = {
    source: { repository: sourceRepo, commit: sourceCommit },
    files: pending.map(({ group, source: sourcePath, target, bytes, sha256: hash }) => ({
      group,
      source: sourcePath,
      target,
      bytes: bytes.length,
      sha256: hash,
    })),
  };
  writeFileSync(
    path.join(root, 'public/app/DATA-MANIFEST.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8',
  );
  return manifest;
}

function main(argv) {
  if (argv.includes('--check')) {
    const problems = checkImport();
    for (const problem of problems) console.error(problem);
    if (problems.length) process.exitCode = 1;
    else console.log('Imported data and baseline files match DATA-MANIFEST.json.');
    return;
  }
  const sourceIndex = argv.indexOf('--source');
  const source = sourceIndex >= 0 ? argv[sourceIndex + 1] : undefined;
  try {
    const manifest = importData({ source });
    console.log(`Imported ${manifest.files.length} files from ${SOURCE_COMMIT}.`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2));
}
