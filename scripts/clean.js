#!/usr/bin/env node
/**
 * Clean build/dev caches before running Next.js.
 * - Removes `.next` (including dev cache)
 * - Removes `tsconfig.tsbuildinfo` (TypeScript incremental cache)
 * - Optionally skips when NEXT_SKIP_CLEAN=1
 */
const fs = require('fs');
const path = require('path');

if (process.env.NEXT_SKIP_CLEAN === '1') {
  console.log('[clean] NEXT_SKIP_CLEAN=1 set; skipping clean.');
  process.exit(0);
}

const targets = [
  '.next',
  'tsconfig.tsbuildinfo',
  '.turbo', // harmless if absent; included for completeness
];

function remove(target) {
  const p = path.resolve(process.cwd(), target);
  try {
    if (!fs.existsSync(p)) return;
    const stat = fs.lstatSync(p);
    if (stat.isDirectory()) {
      fs.rmSync(p, { recursive: true, force: true });
    } else {
      fs.rmSync(p, { force: true });
    }
    console.log(`[clean] Removed ${target}`);
  } catch (err) {
    console.warn(`[clean] Failed to remove ${target}: ${err.message}`);
  }
}

for (const t of targets) remove(t);

