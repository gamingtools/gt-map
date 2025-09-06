#!/usr/bin/env node
// Lightweight automatic versioning for packages/gtmap using conventional commits.
// - Determines bump (major/minor/patch) from commits that touched packages/gtmap
// - Updates packages/gtmap/package.json
// - Prepends packages/gtmap/CHANGELOG.md with commit summaries
// - With --commit, creates a git commit and tag (gtmap-vX.Y.Z)

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const ROOT = resolve(process.cwd());
const PKG_DIR = resolve(ROOT, 'packages/gtmap');
const PKG_JSON_PATH = resolve(PKG_DIR, 'package.json');
const CHANGELOG_PATH = resolve(PKG_DIR, 'CHANGELOG.md');

function run(cmd) {
  return execSync(cmd, { encoding: 'utf8' }).trim();
}

function parseJSON(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function writeJSON(path, obj) {
  writeFileSync(path, JSON.stringify(obj, null, 2) + '\n', 'utf8');
}

function incSemver(ver, bump) {
  const [maj, min, pat] = ver.split('.').map((n) => parseInt(n, 10));
  if (bump === 'major') return `${maj + 1}.0.0`;
  if (bump === 'minor') return `${maj}.${min + 1}.0`;
  return `${maj}.${min}.${(pat || 0) + 1}`;
}

function lastTag() {
  try {
    // Prefer package-scoped tags like gtmap-vX.Y.Z, fallback to vX.Y.Z
    const tags = run('git tag --list --sort=-creatordate').split('\n');
    const pkgTag = tags.find((t) => /^gtmap-v\d+\.\d+\.\d+$/.test(t));
    if (pkgTag) return pkgTag;
    const anyTag = tags.find((t) => /^v\d+\.\d+\.\d+$/.test(t));
    return anyTag || null;
  } catch {
    return null;
  }
}

function commitsSinceTag(tag) {
  try {
    const range = tag ? `${tag}..HEAD` : 'HEAD';
    // Only commits touching the gtmap package
    const raw = run(`git log --pretty=format:%H%x00%s%x00%b%x00END%x00 ${range} -- packages/gtmap`);
    const parts = raw.split('\x00END\x00');
    const commits = [];
    for (const chunk of parts) {
      if (!chunk.trim()) continue;
      const [hash, subject, body] = chunk.split('\x00');
      if (!hash || !subject) continue;
      commits.push({ hash, subject, body: body || '' });
    }
    return commits;
  } catch {
    return [];
  }
}

function decideBump(commits) {
  let bump = null; // null means no change
  for (const c of commits) {
    const s = c.subject.toLowerCase();
    const b = c.body.toLowerCase();
    const hasBang = /^(feat|fix|refactor|perf|chore|revert|docs|style|build|ci)(\([^)]*\))?!:\s/.test(s);
    if (hasBang || b.includes('breaking change')) return 'major';
  }
  if (commits.some((c) => /^feat(\([^)]*\))?:\s/i.test(c.subject))) return 'minor';
  if (commits.some((c) => /^(fix|perf|refactor|revert)(\([^)]*\))?:\s/i.test(c.subject))) return 'patch';
  // fallback: if there are any commits at all, treat as patch to move version forward
  return commits.length > 0 ? 'patch' : null;
}

function formatChangelogSection(version, dateISO, commits) {
  const lines = [];
  lines.push(`## v${version} - ${dateISO}`);
  for (const c of commits) {
    const subj = c.subject.replace(/\s+/g, ' ').trim();
    lines.push(`- ${subj} (${c.hash.slice(0, 7)})`);
  }
  lines.push('');
  return lines.join('\n');
}

function main() {
  const doCommit = process.argv.includes('--commit');
  const forceBumpArg = (() => {
    const i = process.argv.indexOf('--bump');
    if (i !== -1 && process.argv[i + 1]) return process.argv[i + 1];
    return null;
  })();
  const detect = process.argv.includes('--detect');
  // Default to patch-only auto bump unless --detect is passed
  const patchOnly = process.argv.includes('--patch-only') || !detect;
  const pkg = parseJSON(PKG_JSON_PATH);
  const baseVer = pkg.version;
  const tag = lastTag();
  const commits = commitsSinceTag(tag);
  let bump;
  if (forceBumpArg === 'major' || forceBumpArg === 'minor' || forceBumpArg === 'patch') {
    bump = forceBumpArg;
  } else if (patchOnly) {
    bump = commits.length > 0 ? 'patch' : null;
  } else {
    bump = decideBump(commits);
  }

  if (!bump) {
    console.log('version-auto: No relevant commits for packages/gtmap; skipping bump.');
    process.exit(0);
  }

  const nextVer = incSemver(baseVer, bump);
  pkg.version = nextVer;
  writeJSON(PKG_JSON_PATH, pkg);

  const section = formatChangelogSection(nextVer, new Date().toISOString().slice(0, 10), commits);
  const existing = existsSync(CHANGELOG_PATH) ? readFileSync(CHANGELOG_PATH, 'utf8') : '# Changelog\n\n';
  const updated = existing.startsWith('# Changelog')
    ? existing.replace('# Changelog\n', `# Changelog\n\n${section}\n`)
    : `${section}\n${existing}`;
  writeFileSync(CHANGELOG_PATH, updated, 'utf8');

  console.log(`version-auto: gtmap ${baseVer} -> ${nextVer} (${bump})`);

  if (doCommit) {
    try {
      run(`git add ${PKG_JSON_PATH} ${CHANGELOG_PATH}`);
      run(`git commit -m "chore(release): gtmap v${nextVer}"`);
      run(`git tag gtmap-v${nextVer}`);
      console.log('version-auto: committed and tagged.');
    } catch (e) {
      console.warn('version-auto: commit/tag failed:', e?.message || String(e));
    }
  }
}

main();
