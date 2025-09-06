#!/usr/bin/env node
import { readdirSync, statSync, rmSync } from 'node:fs';
import { join } from 'node:path';

function walk(dir, onFile) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, onFile);
    else onFile(p);
  }
}

let removed = 0;
walk(process.cwd(), (p) => {
  if (p.endsWith('.tgz')) {
    try { rmSync(p); removed++; } catch {}
  }
});
console.log(`Removed ${removed} *.tgz files`);

