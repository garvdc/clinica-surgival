import { spawnSync } from 'node:child_process';
import { mkdirSync, chmodSync } from 'node:fs';
mkdirSync('backups', { recursive: true, mode: 0o700 });
const file = `backups/clinic-${new Date().toISOString().replace(/[:.]/g, '-')}.sql`;
const result = spawnSync(
  process.execPath,
  [
    'node_modules/wrangler/bin/wrangler.js',
    'd1',
    'export',
    'DB',
    '--local',
    '--config',
    'wrangler.local.json',
    '--output',
    file,
  ],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      WRANGLER_SEND_METRICS: 'false',
      WRANGLER_LOG_PATH: '.wrangler/logs',
    },
  },
);
if (result.status !== 0) process.exit(result.status || 1);
chmodSync(file, 0o600);
console.log('Respaldo local:', file);
