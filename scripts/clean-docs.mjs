import { rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DIR = join(process.cwd(), 'docs', 'api');

try {
  if (existsSync(DIR)) {
    rmSync(DIR, { recursive: true, force: true });
    console.log('[docs] Cleared docs/api before generation.');
  }
} catch (err) {
  console.error('[docs] Failed to clear docs/api:', err);
  process.exitCode = 1;
}

