import fs from 'node:fs/promises';
import path from 'node:path';

const INDEX_URL = 'https://svelte.dev/llms.txt';
const OUT_ROOT = path.join('docs', 'svelte');

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

function toOutPath(urlStr) {
  const u = new URL(urlStr);
  let pathname = u.pathname;
  if (pathname.endsWith('/')) pathname += 'index.html';
  return path.join(OUT_ROOT, u.host, pathname.replace(/^\/+/, ''));
}

async function download(urlStr) {
  const u = new URL(urlStr);
  const outPath = toOutPath(urlStr);
  await ensureDir(path.dirname(outPath));

  const res = await fetch(urlStr, { redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${urlStr}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(outPath, buf);
  return outPath;
}

async function main() {
  await ensureDir(OUT_ROOT);
  const idxRes = await fetch(INDEX_URL);
  if (!idxRes.ok) throw new Error(`Failed to fetch llms.txt: ${idxRes.status}`);
  const indexText = await idxRes.text();

  // Save index alongside downloads
  await fs.writeFile(path.join(OUT_ROOT, 'llms.txt'), indexText);

  // Extract links from the index page (markdown/plain text)
  const linkRegex = /https?:\/\/[^)\]\s]+/g;
  const urls = Array.from(new Set((indexText.match(linkRegex) || []).map((u) => u.trim())));

  let ok = 0;
  let fail = 0;
  const urlToLocal = new Map();
  for (const url of urls) {
    try {
      const p = await download(url);
      urlToLocal.set(url, p);
      ok++;
      console.log(`Downloaded: ${url} -> ${p}`);
    } catch (err) {
      fail++;
      console.error(`Failed: ${url} -> ${err.message}`);
    }
  }
  console.log(`Complete. OK: ${ok}, Failed: ${fail}`);

  // Post-process: replace absolute Svelte LLM URLs in downloaded files with local paths
  if (ok > 0) {
    const allFiles = [];
    async function walk(dir) {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const e of entries) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) await walk(p);
        else allFiles.push(p);
      }
    }
    await walk(OUT_ROOT);
    for (const file of allFiles) {
      try {
        let text = await fs.readFile(file, 'utf8');
        let changed = false;
        for (const [remote, localAbs] of urlToLocal.entries()) {
          const localPosix = localAbs.split(path.sep).join('/');
          const before = text;
          text = text.split(remote).join(localPosix);
          if (text !== before) changed = true;
        }
        if (changed) {
          await fs.writeFile(file, text, 'utf8');
          console.log(`Rewrote links in: ${file}`);
        }
      } catch {}
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
