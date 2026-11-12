import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Boomika/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const exportRoot = path.join(project, 'out');
const resultsDirectory = path.join(project, 'test-results');
fs.mkdirSync(resultsDirectory, { recursive: true });
const checks = [];
const errors = [];
const failedRequests = [];
const screenshots = [];
const openPages = new Set();
const selectedScenarios = process.argv.find((argument) => argument.startsWith('--only='))?.slice(7).split(',');
const reportName = selectedScenarios ? 'motion-followup-results.json' : 'motion-results.json';
const check = (name, ok, detail) => {
  checks.push({ name, ok: Boolean(ok), ...(detail === undefined ? {} : { detail }) });
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${!ok && detail ? `: ${typeof detail === 'string' ? detail : JSON.stringify(detail)}` : ''}`);
};
const mime = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.json': 'application/json', '.txt': 'text/x-component' };
if (!fs.existsSync(path.join(exportRoot, 'index.html'))) {
  console.error('No static export found. Build the site first; this QA script deliberately does not run a build.');
  process.exit(1);
}
const server = http.createServer((request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    let file = path.resolve(exportRoot, `.${pathname}`);
    if (file !== exportRoot && !file.startsWith(exportRoot + path.sep)) { response.writeHead(403).end(); return; }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) { response.writeHead(404).end('Missing'); return; }
    response.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
    fs.createReadStream(file).pipe(response);
  } catch { response.writeHead(400).end('Bad request'); }
});
await new Promise((resolve, reject) => {
  server.once('error', reject);
  server.listen(0, '127.0.0.1', resolve);
});
const base = `http://127.0.0.1:${server.address().port}`;
let browser;
const screenshot = async (page, name) => {
  const filename = `motion-${name}.png`;
  await page.screenshot({ path: path.join(resultsDirectory, filename), animations: 'disabled' });
  screenshots.push(filename);
};
const observe = (page, label) => {
  openPages.add(page);
  page.on('pageerror', (error) => errors.push({ page: label, message: error.message }));
  page.on('response', (response) => {
    if (response.status() >= 400) failedRequests.push({ page: label, status: response.status(), url: response.url() });
  });
};
const settle = async (page) => page.waitForTimeout(850);
const noOverflow = (page) => page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth, ok: document.documentElement.scrollWidth <= innerWidth + 1 }));
const chapterScroll = async (page, fraction) => {
  await page.locator('.scroll-garage').evaluate((element, progress) => {
    const top = element.getBoundingClientRect().top + scrollY;
    const distance = Math.max(1, element.offsetHeight - innerHeight);
    scrollTo({ top: top + distance * progress, behavior: 'instant' });
  }, fraction);
  await settle(page);
};
const heroState = (page) => page.evaluate(() => {
  const hero = document.querySelector('.hero');
  const selectors = ['.hero-media', '.hero-image', '.hero-title', '.hero-line:first-child', '.hero-line:last-child', '.hero-side', '.hero-bottom'];
  return {
    scrollY,
    rootStyle: document.documentElement.getAttribute('style'),
    heroStyle: hero?.getAttribute('style'),
    marqueeStyle: document.querySelector('.speed-marquee')?.getAttribute('style'),
    rootData: { ...document.documentElement.dataset },
    transforms: Object.fromEntries(selectors.map((selector) => [selector, document.querySelector(selector) ? getComputedStyle(document.querySelector(selector)).transform : null])),
  };
});
const chapterState = (page) => page.locator('.scroll-garage').evaluate((element) => ({
  progress: Number(element.dataset.progress), scene: element.dataset.scene, motion: element.dataset.motion,
  immersive: element.classList.contains('scroll-garage--immersive'), height: element.offsetHeight, viewport: innerHeight,
  posterVisible: (() => { const image = element.querySelector('.scroll-garage-poster'); if (!image) return false; const style = getComputedStyle(image); return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0; })(),
}));
const scenario = async (name, callback) => {
  if (selectedScenarios && !selectedScenarios.includes(name.toLowerCase().replaceAll(' ', '-'))) return;
  try { await callback(); }
  catch (error) { check(`${name} completes`, false, error.message); }
  finally { await Promise.allSettled([...openPages].filter((page) => !page.isClosed()).map((page) => page.close())); openPages.clear(); }
};

try {
  browser = await chromium.launch({
    headless: true,
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--disable-dev-shm-usage', '--enable-webgl', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  await scenario('Route cleanup', async () => {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'no-preference' });
    observe(page, 'route-cleanup');
    await page.goto(base, { waitUntil: 'networkidle' });
    await settle(page);
    check('Home activates the scroll engine before client navigation', await page.locator('html').getAttribute('data-scroll-effects') === 'active');
    await page.locator('.desktop-nav').getByRole('link', { name: 'Team & Drivers', exact: true }).click();
    await page.waitForURL((url) => /^\/team\/?$/.test(url.pathname));
    await settle(page);
    check('Client navigation reaches the team page', await page.locator('h1').count() === 1, page.url());
    check('Client navigation disposes home scroll state and scene', await page.locator('html').getAttribute('data-scroll-effects') === null && await page.locator('.scroll-garage').count() === 0 && await page.locator('.hero').count() === 0);
    await page.locator('.brand').click();
    await page.waitForURL((url) => url.pathname === '/');
    await settle(page);
    check('Returning home mounts exactly one scroll engine and chapter', await page.locator('html').getAttribute('data-scroll-effects') === 'active' && await page.locator('.scroll-garage').count() === 1);
  });
  await scenario('Manual reduced motion', async () => {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'no-preference' });
    observe(page, 'manual-reduced-motion');
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Reduced motion: off', exact: true }).click();
    await settle(page);
    const chapter = await chapterState(page);
    const mode = await page.locator('html').getAttribute('data-scroll-effects');
    check('User motion preference disables sliding and the immersive chapter', mode === 'reduced' && chapter.motion === 'reduced' && !chapter.immersive, { mode, chapter });
    await page.reload({ waitUntil: 'networkidle' });
    await settle(page);
    check('User motion preference survives a reload', await page.locator('html').getAttribute('data-scroll-effects') === 'reduced' && await page.getByRole('button', { name: 'Reduced motion: on', exact: true }).count() === 1);
  });
  await scenario('Desktop scroll motion', async () => {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1, reducedMotion: 'no-preference' });
    observe(page, 'desktop');
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.locator('.hero').waitFor();
    await settle(page);
    check('Desktop scroll engine enables its declared active mode', await page.locator('html').getAttribute('data-scroll-effects') === 'active');
    await screenshot(page, 'desktop-start');
    const initial = await heroState(page);
    await page.evaluate(() => scrollTo({ top: 420, behavior: 'instant' }));
    await settle(page);
    const scrolled = await heroState(page);
    check('Desktop hero transforms respond to document scroll', JSON.stringify(initial.transforms) !== JSON.stringify(scrolled.transforms), { initial, scrolled });
    check('Scroll motion updates CSS state', initial.rootStyle !== scrolled.rootStyle || initial.heroStyle !== scrolled.heroStyle, { rootBefore: initial.rootStyle, rootAfter: scrolled.rootStyle, heroBefore: initial.heroStyle, heroAfter: scrolled.heroStyle });
    await screenshot(page, 'desktop-hero-scrolled');
    await page.getByRole('button', { name: 'Pause visual effects', exact: true }).click();
    await settle(page);
    check('Pause visual effects disables the global scroll engine', await page.locator('html').getAttribute('data-scroll-effects') === 'reduced' && !(await page.locator('.hero').getAttribute('style'))?.includes('--hero-progress'));
    await page.getByRole('button', { name: 'Resume visual effects', exact: true }).click();
    await settle(page);
    check('Resume visual effects restores the global scroll engine', await page.locator('html').getAttribute('data-scroll-effects') === 'active');
    await page.locator('.speed-marquee').evaluate((element) => scrollTo({ top: element.getBoundingClientRect().top + scrollY - innerHeight * 0.85, behavior: 'instant' }));
    await settle(page);
    const marqueeBefore = await page.locator('.speed-marquee').getAttribute('style');
    await page.evaluate(() => scrollBy({ top: 250, behavior: 'instant' }));
    await settle(page);
    const marqueeAfter = await page.locator('.speed-marquee').getAttribute('style');
    check('Scroll moves the speed marquee', marqueeBefore !== marqueeAfter && marqueeAfter?.includes('--marquee-x'), { before: marqueeBefore, after: marqueeAfter });
    await page.locator('.people-section').scrollIntoViewIfNeeded();
    await settle(page);
    await page.locator('.driver-duo').evaluate((element) => scrollTo({ top: element.getBoundingClientRect().top + scrollY - innerHeight * 0.2, behavior: 'instant' }));
    await settle(page);
    const cards = await page.locator('.driver-feature').evaluateAll((elements) => elements.map((element) => ({ className: element.className, style: element.getAttribute('style'), transform: getComputedStyle(element).transform, opacity: getComputedStyle(element).opacity })));
    check('Both driver reveals become visible', cards.length === 2 && cards.every((card) => Number(card.opacity) >= 0.95), cards);
    check('Driver cards receive their scroll-linked entry variables', cards.length === 2 && cards.every((card) => card.style?.includes('--card-slide') && card.style?.includes('--card-turn')), cards);
    check('The people heading receives its observed reveal class', await page.locator('.people-section .motion-reveal.is-visible').count() > 0);
    await screenshot(page, 'desktop-driver-reveals');
    check('Home contains the scroll-driven 3D chapter', await page.locator('.scroll-garage').count() === 1);
    await chapterScroll(page, 0.1);
    await page.waitForFunction(() => document.querySelector('.scroll-garage')?.dataset.scene === 'ready', null, { timeout: 15000 });
    const before = await chapterState(page);
    const canvas = page.locator('.scroll-garage-canvas canvas');
    const canvasInfo = await canvas.evaluate((element) => ({ width: element.width, height: element.height, webgl: Boolean(element.getContext('webgl2') || element.getContext('webgl')) }));
    check('Scroll chapter renders a real WebGL canvas', canvasInfo.webgl && canvasInfo.width > 100 && canvasInfo.height > 100, canvasInfo);
    check('Desktop scroll chapter becomes immersive', before.immersive && before.motion === 'full' && before.height > before.viewport * 2, before);
    const firstCanvas = crypto.createHash('sha256').update(await canvas.screenshot()).digest('hex');
    const cameraBefore = await canvas.getAttribute('data-scroll-camera');
    await screenshot(page, 'desktop-garage-opening');
    await chapterScroll(page, 0.8);
    const after = await chapterState(page);
    const secondCanvas = crypto.createHash('sha256').update(await canvas.screenshot()).digest('hex');
    const cameraAfter = await canvas.getAttribute('data-scroll-camera');
    check('Document scroll advances 3D chapter progress', after.progress > before.progress + 0.4, { before, after });
    check('Document scroll changes the actual Three.js camera', Boolean(cameraBefore) && Boolean(cameraAfter) && cameraBefore !== cameraAfter, { before: cameraBefore, after: cameraAfter });
    check('Scroll changes the rendered 3D view', firstCanvas !== secondCanvas, { firstCanvas, secondCanvas });
    await screenshot(page, 'desktop-garage-advanced');
    check('Desktop motion page has no horizontal overflow', (await noOverflow(page)).ok, await noOverflow(page));
    // Use a real internal link to exercise client-side effect disposal, not a fresh document load.
    await page.locator('.desktop-nav').getByRole('link', { name: 'Team & Drivers', exact: true }).click();
    await page.waitForURL((url) => /^\/team\/?$/.test(url.pathname));
    await settle(page);
    check('Navigation removes the home scroll scene', await page.locator('.scroll-garage').count() === 0 && await page.locator('.hero').count() === 0);
    const routeState = await page.evaluate(() => ({ rootStyle: document.documentElement.getAttribute('style'), rootData: { ...document.documentElement.dataset }, scrollY }));
    check('Leaving home cleans up the global scroll-effects state', !Object.hasOwn(routeState.rootData, 'scrollEffects'), routeState);
    check('Route after motion chapter remains usable', await page.locator('h1').count() > 0 && (await noOverflow(page)).ok, routeState);
    await page.locator('.brand').click();
    await page.waitForURL(base + '/');
    await page.locator('.scroll-garage').waitFor();
    check('Returning home mounts one scroll chapter', await page.locator('.scroll-garage').count() === 1);
    await page.close();
  });

  await scenario('Mobile scroll motion', async () => {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, reducedMotion: 'no-preference' });
    observe(page, 'mobile');
    await page.goto(base, { waitUntil: 'networkidle' });
    await settle(page);
    check('Mobile home has no horizontal overflow at the opening', (await noOverflow(page)).ok, await noOverflow(page));
    await screenshot(page, 'mobile-start');
    await page.locator('.people-section').scrollIntoViewIfNeeded();
    await settle(page);
    check('Mobile driver reveals do not create horizontal overflow', (await noOverflow(page)).ok, await noOverflow(page));
    await screenshot(page, 'mobile-drivers');
    await chapterScroll(page, 0.55);
    await page.waitForFunction(() => ['ready', 'fallback'].includes(document.querySelector('.scroll-garage')?.dataset.scene), null, { timeout: 30000 });
    const chapter = await chapterState(page);
    check('Mobile 3D chapter stays within the viewport width', (await noOverflow(page)).ok, { chapter, overflow: await noOverflow(page) });
    check('Mobile chapter creates a ready WebGL canvas', chapter.scene === 'ready' && await page.locator('.scroll-garage-canvas canvas').count() === 1, chapter);
    await screenshot(page, 'mobile-garage');
    await chapterScroll(page, 0.88);
    await screenshot(page, 'mobile-garage-late');
    await page.close();
  });

  await scenario('Reduced motion', async () => {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
    observe(page, 'reduced-motion');
    await page.goto(base, { waitUntil: 'networkidle' });
    await settle(page);
    check('System reduced motion selects the reduced scroll engine', await page.locator('html').getAttribute('data-scroll-effects') === 'reduced');
    const initial = await heroState(page);
    await page.evaluate(() => scrollTo({ top: 420, behavior: 'instant' }));
    await settle(page);
    const after = await heroState(page);
    check('System reduced motion disables scroll transforms', JSON.stringify(initial.transforms) === JSON.stringify(after.transforms), { initial, after });
    const heroAnimation = await page.locator('.hero-image').evaluate((element) => getComputedStyle(element).animationName);
    check('System reduced motion disables hero automatic animation', heroAnimation === 'none', heroAnimation);
    await page.locator('.scroll-garage').scrollIntoViewIfNeeded();
    await settle(page);
    const chapter = await chapterState(page);
    check('Reduced motion removes the extended sticky 3D chapter', chapter.motion === 'reduced' && !chapter.immersive && chapter.height < chapter.viewport * 2, chapter);
    const narratives = await page.locator('.scroll-garage-story').evaluateAll((elements) => elements.map((element) => ({ opacity: getComputedStyle(element).opacity, transform: getComputedStyle(element).transform, text: element.textContent.trim() })));
    check('Reduced-motion chapter retains all three readable narratives', narratives.length === 3 && narratives.every((item) => Number(item.opacity) === 1 && item.transform === 'none' && item.text.length > 80), narratives);
    await screenshot(page, 'reduced-motion-chapter');
    await page.close();
  });

  await scenario('WebGL fallback', async () => {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'no-preference' });
    observe(page, 'webgl-fallback');
    await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...args) { return String(type).includes('webgl') ? null : original.call(this, type, ...args); };
    });
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.locator('.scroll-garage').scrollIntoViewIfNeeded();
    await page.waitForFunction(() => document.querySelector('.scroll-garage')?.dataset.scene === 'fallback', null, { timeout: 10000 });
    await settle(page);
    const chapter = await chapterState(page);
    check('Unavailable WebGL supplies a compact static chapter', chapter.scene === 'fallback' && !chapter.immersive && chapter.posterVisible, chapter);
    check('Fallback renders no unusable WebGL canvas', await page.locator('.scroll-garage-canvas canvas').count() === 0);
    check('Mobile fallback has no horizontal overflow', (await noOverflow(page)).ok, await noOverflow(page));
    await screenshot(page, 'fallback-mobile');
    await page.close();
  });
  check('No uncaught browser errors during motion scenarios', errors.length === 0, errors);
  check('No missing local assets or chunks during motion scenarios', failedRequests.length === 0, failedRequests);
} catch (error) {
  check('Motion QA starts and runs', false, error.stack || error.message);
} finally {
  if (browser) await browser.close();
  await new Promise((resolve) => server.close(resolve));
  const report = {
    recordedAt: new Date().toISOString(),
    environment: 'Local existing static export, headless Chrome, SwiftShader WebGL, no network throttling. No build was run by this script.',
    exportModifiedAt: fs.statSync(path.join(exportRoot, 'index.html')).mtime.toISOString(),
    passed: checks.filter((entry) => entry.ok).length,
    total: checks.length,
    checks, errors, failedRequests, screenshots,
  };
  fs.writeFileSync(path.join(resultsDirectory, reportName), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ passed: report.passed, total: report.total, screenshots, report: `test-results/${reportName}` }, null, 2));
  if (checks.some((entry) => !entry.ok)) process.exitCode = 1;
}
