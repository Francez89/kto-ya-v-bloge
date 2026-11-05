import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
globalThis.window = globalThis.window || {};
window.Astronomy = require('../vendor/astronomy.browser.min.js');
const AS = require('../js/astro.js');
require('../js/natal-data.js');
const NT = window.VektorNatal;
const F = JSON.parse(readFileSync(new URL('./fixtures/swe.json', import.meta.url)));
const diff = (a, b) => Math.abs(((a - b + 540) % 360) - 180) * 60; // в угловых минутах

test('совпадение со Swiss Ephemeris: планеты, узел, асцендент, MC, куспиды Плацидуса, ретроградность', () => {
  let mp = 0, ma = 0, mc = 0, retroMiss = 0;
  for (const f of F) {
    const ch = AS.calcChart({ date: f.date, time: f.time, lat: f.lat, lon: f.lon, tz: 0 });
    for (const [k, [lon, retro]] of Object.entries(f.pl)) { mp = Math.max(mp, diff(ch.planets[k].lon, lon)); if (k !== 'node' && k !== 'sun' && k !== 'moon' && ch.planets[k].retro !== retro && Math.abs(diff(lon, lon)) === 0) retroMiss += ch.planets[k].retro !== retro ? 1 : 0; }
    ma = Math.max(ma, diff(ch.asc.lon, f.asc), diff(ch.mc.lon, f.mc));
    if (ch.houseSystem === 'placidus') f.cusps.forEach((c, i) => { mc = Math.max(mc, diff(ch.cusps[i], c)); });
  }
  assert.ok(mp < 1.5, 'планеты ' + mp.toFixed(2) + '′');
  assert.ok(ma < 0.5, 'углы ' + ma.toFixed(2) + '′');
  assert.ok(mc < 0.5, 'куспиды ' + mc.toFixed(2) + '′');
  assert.ok(retroMiss <= 1, 'ретроградность: ошибок ' + retroMiss);
});

test('дом планеты определяется по куспидам; за полярным кругом — Порфирий', () => {
  const ch = AS.calcChart({ date: '1990-06-15', time: '08:30', lat: 42.82, lon: 132.89, tz: 'Asia/Vladivostok' });
  for (const k in ch.planets) assert.equal(ch.houses[k], AS.houseOf(ch.planets[k].lon, ch.cusps));
  assert.equal(AS.houseOf(ch.asc.lon + 0.01, ch.cusps), 1);
  const polar = AS.calcChart({ date: '1990-12-20', time: '12:00', lat: 69.6, lon: 18.9, tz: 1 });
  assert.equal(polar.houseSystem, 'porphyry');
  assert.equal(polar.cusps.length, 12);
});

test('тексты: для каждой точки и каждого знака есть разбор', () => {
  for (const k of ['sun', 'moon', 'asc', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'node'])
    for (let s = 0; s < 12; s++) { const d = NT.details(k, s); assert.ok(d.length >= 1 && d.every(([t, v]) => t && v && v.length > 10), k + s); }
  assert.equal(NT.HOUSES.length, 12);
  for (const k of Object.keys(NT.POINT)) assert.ok(NT.POINT[k].role && NT.POINT[k].why);
});
