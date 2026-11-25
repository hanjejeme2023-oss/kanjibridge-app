import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '../../..');
const portIndex = process.argv.indexOf('--port');
const port = Number(portIndex >= 0 ? process.argv[portIndex + 1] : 4174);
const baseline = readFileSync(path.join(root, 'tests/baseline/app/index.html'));
const harness = readFileSync(path.join(root, 'tests/baseline/stage5_gate_harness.js'), 'utf8');
const capture = `<script>window.__errs=[];addEventListener('error',e=>window.__errs.push(String(e.error||e.message)));addEventListener('unhandledrejection',e=>window.__errs.push(String(e.reason)));</script>`;
const harnessHtml = Buffer.from(baseline.toString('utf8')
  .replace('<script src="data.js"></script>', `${capture}\n<script src="data.js"></script>`)
  .replace('</body>', `<script>${harness}</script>\n</body>`));

const routes = new Map([
  ['/', [baseline, 'text/html; charset=utf-8']],
  ['/index.html', [baseline, 'text/html; charset=utf-8']],
  ['/harness.html', [harnessHtml, 'text/html; charset=utf-8']],
  ['/data.js', [readFileSync(path.join(root, 'public/app/data.js')), 'text/javascript; charset=utf-8']],
]);

const server = createServer((request, response) => {
  const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;
  const route = routes.get(pathname);
  if (!route) {
    response.writeHead(404, { 'content-type': 'text/plain' });
    response.end('Not found');
    return;
  }
  response.writeHead(200, { 'content-type': route[1], 'cache-control': 'no-store' });
  response.end(route[0]);
});

server.listen(port, '127.0.0.1', () => console.log(`Baseline server listening on ${port}`));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
