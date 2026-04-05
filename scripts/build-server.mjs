import { build } from 'esbuild';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync, statSync } from 'fs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

mkdirSync(resolve(root, 'api'), { recursive: true });

await build({
  entryPoints: [resolve(root, 'server/src/index.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: resolve(root, 'api/server.mjs'),
  external: [
    'pg-native',
    'better-sqlite3',
    'oracledb',
    'mock-aws-s3',
    'nock',
    'sharp',
  ],
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  target: 'node20',
  minify: false,
  sourcemap: false,
  splitting: false,
});

const bytes = statSync(resolve(root, 'api/server.mjs')).size;
const mb = (bytes / 1024 / 1024).toFixed(1);
console.log(`Server bundle written to api/server.mjs (${mb} MB)`);
