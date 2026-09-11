import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
const env = {
  ...process.env,
  WRANGLER_SEND_METRICS: 'false',
  WRANGLER_LOG_PATH: '.wrangler/logs',
  MINIFLARE_REGISTRY_PATH: '.wrangler/registry',
};
function run(bin, args) {
  const result = spawnSync(bin, args, { stdio: 'inherit', env });
  if (result.status !== 0) process.exit(result.status || 1);
}
if (!existsSync('.demo-credentials'))
  run(process.execPath, ['scripts/seed.mjs']);
run(process.execPath, [
  'node_modules/wrangler/bin/wrangler.js',
  'd1',
  'migrations',
  'apply',
  'DB',
  '--local',
  '--config',
  'wrangler.local.json',
]);
if (existsSync('seed.local.sql'))
  run(process.execPath, [
    'node_modules/wrangler/bin/wrangler.js',
    'd1',
    'execute',
    'DB',
    '--local',
    '--config',
    'wrangler.local.json',
    '--file',
    'seed.local.sql',
  ]);
console.log(
  'Base local lista. Las credenciales están en .demo-credentials (archivo privado).',
);
