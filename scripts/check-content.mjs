#!/usr/bin/env node
/** Validate the real editorial data, relationships and local media without a network request. */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const warnings = [];
const media = new Set();
const fail = (where, message) => errors.push(`${where}: ${message}`);
const sourceFile = path.join(root, 'src/lib/data.ts');
const source = fs.readFileSync(sourceFile, 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  fileName: sourceFile, reportDiagnostics: true,
});
for (const diagnostic of compiled.diagnostics ?? []) {
  if (diagnostic.category === ts.DiagnosticCategory.Error) fail('data.ts', ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'));
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
// data.ts is a self-contained data module. It receives no require/process/network access.
const contentModule = { exports: {} };
try {
  vm.runInNewContext(compiled.outputText, { exports: contentModule.exports, module: contentModule, Intl }, { filename: 'data.ts', timeout: 2000 });
} catch (error) {
  console.error(`Unable to load data.ts in the isolated validator: ${error.message}`);
  process.exit(1);
}
const data = contentModule.exports;
const collections = ['drivers', 'cars', 'races', 'stories', 'heritage', 'sources'];
const indexes = {};
for (const name of collections) {
  if (!Array.isArray(data[name])) { fail(name, 'must export an array'); continue; }
  indexes[name] = new Map();
  const slugs = new Set();
  for (const record of data[name]) {
    if (!record.id || typeof record.id !== 'string') { fail(name, 'record is missing a string id'); continue; }
    if (indexes[name].has(record.id)) fail(name, `duplicate id "${record.id}"`);
    indexes[name].set(record.id, record);
    if (name !== 'sources') {
      if (!record.slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(record.slug)) fail(`${name}.${record.id}`, 'requires a URL-safe slug');
      if (slugs.has(record.slug)) fail(name, `duplicate slug "${record.slug}"`);
      slugs.add(record.slug);
      if (!record.sourceIds?.length) fail(`${name}.${record.id}`, 'requires at least one source');
    }
  }
}
if (collections.some((name) => !indexes[name])) {
  console.error(errors.join('\n'));
  process.exit(1);
}

function dateOnly(value, where) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(`${value}T00:00:00Z`)) || new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) !== value) fail(where, 'must be a real ISO date (YYYY-MM-DD)');
}
function httpsUrl(value, where) {
  try { if (new URL(value).protocol !== 'https:') fail(where, 'external links must use HTTPS'); }
  catch { fail(where, 'must be an absolute URL'); }
}
function instant(value, where) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(value) || !Number.isFinite(Date.parse(value))) fail(where, 'must specify a valid UTC instant ending in Z');
}
function localMedia(value, where) {
  if (!value) return; // Missing portraits are an explicitly supported editorial state.
  if (!value.startsWith('/images/') && !value.startsWith('/fonts/')) { fail(where, 'media must use a local /images/ or /fonts/ path'); return; }
  const resolved = path.resolve(root, 'public', `.${value}`);
  const publicRoot = path.resolve(root, 'public') + path.sep;
  if (!resolved.startsWith(publicRoot)) { fail(where, 'media path escapes public/'); return; }
  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) { fail(where, `missing media ${value}`); return; }
  if (media.has(value)) return;
  media.add(value);
  const bytes = fs.readFileSync(resolved);
  if (!bytes.length) { fail(where, `empty media ${value}`); return; }
  const extension = path.extname(value).toLowerCase();
  if ((extension === '.jpg' || extension === '.jpeg') && !(bytes[0] === 0xff && bytes[1] === 0xd8)) fail(where, `${value} does not contain JPEG data`);
  if (extension === '.png' && bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') fail(where, `${value} does not contain PNG data`);
  if (extension === '.webp' && !(bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WEBP')) fail(where, `${value} does not contain WebP data`);
}

const references = { carId: 'cars', carIds: 'cars', driverId: 'drivers', driverIds: 'drivers', testDriverIds: 'drivers', raceIds: 'races', sourceId: 'sources', sourceIds: 'sources' };
function inspect(value, where) {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) { value.forEach((entry, index) => inspect(entry, `${where}[${index}]`)); return; }
  for (const [key, item] of Object.entries(value)) {
    const location = `${where}.${key}`;
    if (references[key]) {
      const values = Array.isArray(item) ? item : [item];
      if (Array.isArray(item) && new Set(item).size !== item.length) fail(location, 'duplicate relationship id');
      for (const id of values) if (!indexes[references[key]].has(id)) fail(location, `unknown ${references[key]} id "${id}"`);
    }
    if (key === 'image') localMedia(item, location);
    if (['verifiedAt', 'date', 'birthDate', 'updatedAt'].includes(key) && item) dateOnly(item, location);
    if (['url', 'officialUrl'].includes(key)) httpsUrl(item, location);
    inspect(item, location);
  }
}
for (const name of ['drivers', 'cars', 'races', 'stories', 'heritage', 'sources', 'seasons', 'leadership', 'engineering']) inspect(data[name], name);
inspect(data.team, 'team');
dateOnly(data.verificationDate, 'verificationDate');
dateOnly(data.snapshotThrough, 'snapshotThrough');
if (data.snapshotThrough > data.verificationDate) fail('snapshotThrough', 'cannot be later than the verification date');
for (const [name, url] of Object.entries(data.officialLinks ?? {})) httpsUrl(url, `officialLinks.${name}`);

for (const race of data.races) {
  const where = `races.${race.id}`;
  if (race.season !== race.year || !race.date.startsWith(`${race.year}-`)) fail(where, 'year, season and date must agree');
  if (!Number.isInteger(race.round) || race.round < 1) fail(where, 'round must be a positive integer');
  if (race.id !== `${race.year}-${race.round}`) fail(where, 'id must use the stable year-round format');
  try { new Intl.DateTimeFormat('en', { timeZone: race.circuitTimezone }).format(); }
  catch { fail(where, `invalid IANA circuit timezone "${race.circuitTimezone}"`); }
  if (race.status === 'Completed' && !race.results.length) fail(where, 'completed races require the selected Aston Martin results');
  if (race.status === 'Upcoming' && race.results.length) fail(where, 'upcoming races must not contain invented results');
  if (race.status === 'Completed' && race.date > data.snapshotThrough) fail(where, 'completed result is beyond the stated snapshot');
  const raceDrivers = new Set(race.carIds.flatMap((id) => indexes.cars.get(id)?.driverIds ?? []));
  for (const kind of ['results', 'qualifying']) {
    const resultDrivers = new Set();
    for (const result of race[kind]) {
      if (resultDrivers.has(result.driverId)) fail(where, `duplicate ${kind} for ${result.driverId}`);
      resultDrivers.add(result.driverId);
      if (!raceDrivers.has(result.driverId)) fail(where, `${result.driverId} is not a race driver of a linked chassis`);
      if (result.points !== null && (!Number.isFinite(result.points) || result.points < 0)) fail(where, 'points must be non-negative or explicitly null');
      if (!result.position) fail(where, 'classification must specify a position or status');
    }
  }
  if (race.startTime) instant(race.startTime, `${where}.startTime`);
  const sessionIds = new Set();
  for (const session of race.sessions) {
    if (sessionIds.has(session.id)) fail(where, `duplicate session id "${session.id}"`);
    sessionIds.add(session.id);
    instant(session.startUtc, `${where}.sessions.${session.id}.startUtc`);
    if (session.endUtc) {
      instant(session.endUtc, `${where}.sessions.${session.id}.endUtc`);
      if (session.endUtc <= session.startUtc) fail(where, `session ${session.id} must end after it starts`);
    }
  }
  for (const carId of race.carIds) {
    const car = indexes.cars.get(carId);
    if (car && !car.seasons.includes(race.year)) fail(where, `linked chassis ${carId} was not recorded in ${race.year}`);
  }
}

const currentResults = data.races.filter((race) => race.season === data.team.season && race.status === 'Completed');
if (currentResults.length !== data.team.completedRounds) fail('team.completedRounds', `states ${data.team.completedRounds}, but ${currentResults.length} current-season races are completed`);
const resultPoints = currentResults.reduce((sum, race) => sum + race.results.reduce((total, result) => total + (result.points ?? 0), 0), 0);
if (resultPoints !== data.team.points) fail('team.points', `states ${data.team.points}, but the current-season results total ${resultPoints}`);
for (const season of data.seasons) {
  const stats = season.driverIds.map((id) => indexes.drivers.get(id)?.seasonStats.find((stat) => stat.year === season.year));
  if (stats.every((stat) => stat && stat.points !== null)) {
    const points = stats.reduce((sum, stat) => sum + stat.points, 0);
    if (points !== season.points) fail(`seasons.${season.year}`, `constructor points ${season.points} do not equal selected driver points ${points}`);
  }
}
if (!data.nextRace || !indexes.races.has(data.nextRace.id) || data.nextRace.status !== 'Upcoming') fail('nextRace', 'must resolve to an upcoming race');
if (data.coverage.driverCount !== data.drivers.length) fail('coverage.driverCount', 'does not match the driver index');
if (data.coverage.carCount !== data.cars.length) fail('coverage.carCount', 'does not match the car index');

// Include literal media references in layouts/styles; this catches stale social-preview paths too.
function scan(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) { scan(absolute); continue; }
    if (!/\.(?:ts|tsx|css)$/.test(entry.name)) continue;
    const text = fs.readFileSync(absolute, 'utf8');
    const pattern = /\/(?:images|fonts)\/[A-Za-z0-9_.\/-]+\.(?:jpg|jpeg|png|webp|svg|woff2?|ttf)/g;
    for (const match of text.matchAll(pattern)) localMedia(match[0], path.relative(root, absolute));
  }
}
scan(path.join(root, 'src'));
const portraitsMissing = data.drivers.filter((driver) => !driver.image).length;
const chassisMissing = data.cars.filter((car) => !car.image).length;
if (portraitsMissing || chassisMissing) warnings.push(`Declared media gaps: ${portraitsMissing} driver portraits and ${chassisMissing} chassis images. Empty images are supported; supply correctly attributed media to fill these gaps.`);

for (const warning of warnings) console.log(`NOTE ${warning}`);
if (errors.length) {
  console.error(`\nContent validation failed with ${errors.length} issue(s):\n${errors.map((error) => `- ${error}`).join('\n')}`);
  process.exitCode = 1;
} else {
  console.log(`Content validation passed: ${data.drivers.length} drivers, ${data.cars.length} cars, ${data.races.length} races, ${data.stories.length} stories, ${data.sources.length} sources and ${media.size} referenced local media files.`);
  console.log(`Snapshot verified ${data.verificationDate}; race results through ${data.snapshotThrough}. This validates structure and relationships, not external source accuracy or live status.`);
}
