import { readdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const API_DIR = join(process.cwd(), 'docs', 'api');
const API_README = join(API_DIR, 'README.md');
const SOURCE_README = join(process.cwd(), 'docs', 'API_OVERVIEW.md');

function listFiles() {
  const files = readdirSync(API_DIR).filter((f) => f.endsWith('.md'));
  const byPrefix = {
    Class: [],
    Interface: [],
    TypeAlias: [],
    Function: [],
    Namespace: [],
    Other: [],
  };
  for (const f of files) {
    if (f === 'README.md') continue;
    const [prefix] = f.split('.');
    if (prefix in byPrefix) {
      byPrefix[prefix].push(f);
    } else {
      byPrefix.Other.push(f);
    }
  }
  for (const key of Object.keys(byPrefix)) {
    byPrefix[key].sort((a, b) => a.localeCompare(b));
  }
  return byPrefix;
}

function displayName(file) {
  const name = file.replace(/\.md$/, '');
  const parts = name.split('.');
  return parts.length > 1 ? parts.slice(1).join('.') : name;
}

function toLinks(arr, basePath) {
  return arr.map((f) => `- [${displayName(f)}](${basePath}${f})`).join('\n');
}

function buildHeader(basePath) {
  return '**@gaming.tools/gtmap**\n\n***\n\n# API Overview\n\nQuick links to common tasks using the GTMap API.\n\n'
    + `- Create a map: see [GTMap](${basePath}Class.GTMap.md)\n`
    + `- Configure imagery: set [image](${basePath}Interface.MapOptions.md#image) (url/width/height) and optional wrap/bounds options\n`
    + `- Wrap & bounds: [setWrapX](${basePath}Class.GTMap.md#setwrapx), [setMaxBoundsPx](${basePath}Class.GTMap.md#setmaxboundspx), [setMaxBoundsViscosity](${basePath}Class.GTMap.md#setmaxboundsviscosity)\n`
    + `- Change the view: [ViewTransition](${basePath}Interface.ViewTransition.md), [transition()](${basePath}Class.GTMap.md#transition)\n`
    + `- Add content: [addIcon](${basePath}Class.GTMap.md#addicon), [addMarker](${basePath}Class.GTMap.md#addmarker), [addVector](${basePath}Class.GTMap.md#addvector)\n`
    + `- Events: [MapEvents](${basePath}Interface.MapEvents.md), [Layer.events](${basePath}Class.Layer.md#events), [Marker.events](${basePath}Class.Marker.md#events)\n`
    + `- Utilities: [setAutoResize](${basePath}Class.GTMap.md#setautoresize), [invalidateSize](${basePath}Class.GTMap.md#invalidatesize), [setFpsCap](${basePath}Class.GTMap.md#setfpscap), [setBackgroundColor](${basePath}Class.GTMap.md#setbackgroundcolor)\n\n`
    + 'Tip: The events pages list supported event names and payloads for IntelliSense.\n\n'
    + '## Contents\n\nUse the lists below to jump directly to types and members.';
}

function buildReadme(byPrefix, basePath) {
  const header = buildHeader(basePath);

  const sections = [];
  if (byPrefix.Class.length) {
    sections.push(`\n### Classes\n\n${toLinks(byPrefix.Class, basePath)}`);
  }
  if (byPrefix.Interface.length) {
    sections.push(`\n### Interfaces\n\n${toLinks(byPrefix.Interface, basePath)}`);
  }
  if (byPrefix.TypeAlias.length) {
    sections.push(`\n### Type Aliases\n\n${toLinks(byPrefix.TypeAlias, basePath)}`);
  }
  if (byPrefix.Function.length) {
    sections.push(`\n### Functions\n\n${toLinks(byPrefix.Function, basePath)}`);
  }
  if (byPrefix.Namespace.length) {
    sections.push(`\n### Namespaces\n\n${toLinks(byPrefix.Namespace, basePath)}`);
  }
  // If there are other pages (like globals.md), include them in an Extras section
  const others = byPrefix.Other.filter((f) => f !== 'globals.md');
  if (others.length || existsSync(join(API_DIR, 'globals.md'))) {
    const lines = [];
    if (existsSync(join(API_DIR, 'globals.md'))) {
      lines.push(`- [globals](${basePath}globals.md)`);
    }
    for (const f of others) lines.push(`- [${displayName(f)}](${basePath}${f})`);
    if (lines.length) sections.push(`\n### Extras\n\n${lines.join('\n')}`);
  }

  return `${header}\n${sections.join('\n')}\n`;
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/`/g, '')
    .replace(/\([^\)]*\)/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function generateLocalToc(markdown) {
  if (/^##\s+Contents\b/m.test(markdown)) return null; // already has a contents
  const lines = markdown.split(/\r?\n/);
  const headings = [];
  for (const line of lines) {
    const m = /^(#{1,3})\s+(.+)$/.exec(line);
    if (!m) continue;
    const level = m[1].length;
    const text = m[2].trim();
    // Skip repo link/breadcrumbs marker and horizontal rules
    if (text === '***') continue;
    headings.push({ level, text, slug: slugify(text) });
  }
  if (!headings.length) return null;
  // Only include level 2 and 3 in the TOC
  const tocLines = ['## Contents', ''];
  for (const h of headings) {
    if (h.level === 2) {
      tocLines.push(`- [${h.text}](#${h.slug})`);
    } else if (h.level === 3) {
      tocLines.push(`  - [${h.text}](#${h.slug})`);
    }
  }
  return tocLines.join('\n') + '\n\n';
}

function injectLocalToc(content) {
  // Insert TOC and a back-to-index link right after the first H1
  const toc = generateLocalToc(content);
  const hasBack = /\[.*Back to API index.*\]\(\.\/README\.md\)/.test(content);
  if (!toc && hasBack) return content;
  const lines = content.split(/\r?\n/);
  let insertIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^#\s+/.test(lines[i])) { insertIdx = i + 1; break; }
  }
  if (insertIdx === -1) insertIdx = 0;
  // Ensure a blank line before and after toc block
  const before = lines.slice(0, insertIdx + 1).join('\n');
  const after = lines.slice(insertIdx + 1).join('\n');
  const backLink = hasBack ? '' : '[← Back to API index](./README.md)\n\n';
  const tocBlock = toc ? `${toc}` : '';
  return `${before}\n${backLink}${tocBlock}${after}`.replace(/\n{3,}/g, '\n\n');
}

function main() {
  try {
    const byPrefix = listFiles();
    const apiContent = buildReadme(byPrefix, './');
    writeFileSync(API_README, apiContent, 'utf8');
    // Keep source overview in sync so future TypeDoc runs stay current (links relative to docs/)
    const overviewContent = buildReadme(byPrefix, 'api/').replace(/^\*\*@gaming\.tools\/gtmap\*\*[\s\S]*?\n\n# /, '# ');
    writeFileSync(SOURCE_README, overviewContent, 'utf8');
    // Add per-file local TOC for easier navigation in GitHub
    const files = readdirSync(API_DIR).filter((f) => f.endsWith('.md') && f !== 'README.md');
    for (const f of files) {
      const p = join(API_DIR, f);
      const md = readFileSync(p, 'utf8');
      const updated = injectLocalToc(md);
      if (updated !== md) writeFileSync(p, updated, 'utf8');
    }

    // Simple confirmation for CI logs
    const pkgPath = join(process.cwd(), 'package.json');
    const pkgName = JSON.parse(readFileSync(pkgPath, 'utf8')).name;
    console.log(`[docs] Updated API README for ${pkgName}.`);
  } catch (err) {
    console.error('[docs] Failed to generate API index:', err);
    process.exitCode = 1;
  }
}

main();
