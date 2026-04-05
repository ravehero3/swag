import { execSync } from 'child_process';
import { mkdirSync, statSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

mkdirSync(resolve(root, 'api'), { recursive: true });

const args = [
  'server/src/index.ts',
  '--bundle',
  '--platform=node',
  '--format=esm',
  '--outfile=api/server.js',
  '--external:pg-native',
  '--external:better-sqlite3',
  '--external:oracledb',
  '--external:mock-aws-s3',
  '--external:nock',
  '--external:sharp',
  '--define:process.env.NODE_ENV=\\"production\\"',
  '--target=node20',
].join(' ');

execSync(`npx esbuild ${args}`, { stdio: 'inherit', cwd: root });

const bytes = statSync(resolve(root, 'api/server.js')).size;
const mb = (bytes / 1024 / 1024).toFixed(1);
console.log(`Server bundle written to api/server.js (${mb} MB)`);
