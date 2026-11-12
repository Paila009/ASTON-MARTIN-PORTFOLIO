import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.env.SITE_EXPORT_DIR || 'out');
const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? '').trim().replace(/\/+$/, '');
const origin = process.env.SITE_URL ? new URL(process.env.SITE_URL).origin : 'https://static-export.invalid';
const htmlFiles = [];
const cssFiles = [];
const issues = new Set();
let checked = 0;

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (entry.name.endsWith('.html')) htmlFiles.push(file);
    else if (entry.name.endsWith('.css')) cssFiles.push(file);
  }
}

function checkReference(reference, file) {
  if (!reference || reference.startsWith('#')) return;
  const relativeFile = path.relative(root, file).split(path.sep).join('/');
  try {
    const source = new URL(`${basePath}/${relativeFile}`, origin);
    const url = new URL(reference.replaceAll('&amp;', '&'), source);
    if (url.origin !== origin) return;
    checked++;
    const pathname = decodeURIComponent(url.pathname);
    if (basePath && pathname !== basePath && !pathname.startsWith(`${basePath}/`)) {
      issues.add(`${relativeFile}: ${reference} escapes the configured base path ${basePath}`);
      return;
    }
    const relativeTarget = pathname.slice(basePath.length) || '/';
    const target = path.resolve(root, `.${relativeTarget}`);
    const contained = target === root || target.startsWith(root + path.sep);
    const exists = contained && fs.existsSync(target) && (fs.statSync(target).isFile() || fs.existsSync(path.join(target, 'index.html')));
    if (!exists) issues.add(`${relativeFile}: missing destination ${reference}`);
  } catch {
    issues.add(`${relativeFile}: invalid URL ${reference}`);
  }
}

if (!fs.existsSync(path.join(root, 'index.html'))) throw new Error('Build first with pnpm build.');
walk(root);

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  // Connection hints resolve only an origin, so they don't need a deployment path.
  const document = html.replace(/<link\b(?=[^>]*\brel="(?:preconnect|dns-prefetch)")[^>]*>/gi, '');
  for (const match of document.matchAll(/\b(?:href|src|poster)="([^"\s]*)"/g)) checkReference(match[1], file);
  if (process.env.SITE_URL) {
    for (const match of html.matchAll(/<meta property="og:image" content="([^"]+)"/g)) {
      if (new URL(match[1], origin).origin !== origin) issues.add(`${path.relative(root, file)}: Open Graph image points to a different site: ${match[1]}`);
      else checkReference(match[1], file);
    }
  }
}

for (const file of cssFiles) {
  const css = fs.readFileSync(file, 'utf8');
  for (const match of css.matchAll(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^)'"\s]+))\s*\)/g)) checkReference(match[1] ?? match[2] ?? match[3], file);
}

if (issues.size) {
  console.error(`Export validation failed (${issues.size} unresolved references):\n${[...issues].slice(0, 35).join('\n')}`);
  process.exitCode = 1;
} else {
  console.log(`Export validation passed at ${basePath || '/'}: ${htmlFiles.length} HTML pages, ${cssFiles.length} stylesheets and ${checked} local references.`);
}
