import fs from 'node:fs/promises';
import path from 'node:path';

const INDEX_URL = 'https://svelte.dev/llms.txt';
const OUT_ROOT = path.join('docs', 'svelte');

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

async function download(urlStr) {
  const u = new URL(urlStr);
  let pathname = u.pathname;
  if (pathname.endsWith('/')) pathname += 'index.html';
  const outPath = path.join(OUT_ROOT, u.host, pathname.replace(/^\/+/, ''));
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
  for (const url of urls) {
    try {
      const p = await download(url);
      ok++;
      console.log(`Downloaded: ${url} -> ${p}`);
    } catch (err) {
      fail++;
      console.error(`Failed: ${url} -> ${err.message}`);
    }
  }
  console.log(`Complete. OK: ${ok}, Failed: ${fail}`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
