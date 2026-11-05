import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
globalThis.Astronomy = require('../vendor/astronomy.browser.min.js');
const HD = require('../js/hd.js');
const A = globalThis.Astronomy;

test('колесо: 64 уникальных ворот, каналы — между разными центрами', () => {
  assert.equal(new Set(HD.WHEEL).size, 64);
  for (const [a, b] of HD.CHANNELS) assert.notEqual(HD.GATE_CENTER[a], HD.GATE_CENTER[b]);
  assert.equal(HD.CHANNELS.length, 36);
});
test('ворота 41 начинаются с 2° Водолея, противоположные пары 1/2 и 13/7', () => {
  assert.deepEqual(HD.gateOf(302.01), { gate: 41, line: 1 });
  const idx = (g) => HD.WHEEL.indexOf(g);
  assert.equal((idx(2) - idx(1) + 64) % 64, 32);
  assert.equal((idx(7) - idx(13) + 64) % 64, 32);
});
test('момент дизайна: Солнце ровно на 88° раньше, ~88–92 дня', () => {
  const b = new Date('1994-08-07T10:35:00Z');
  const d = HD.designDate(b);
  const diff = ((A.SunPosition(b).elon - A.SunPosition(d).elon) % 360 + 360) % 360;
  assert.ok(Math.abs(diff - 88) < 1e-4, diff);
  const days = (b - d) / 864e5;
  assert.ok(days > 85 && days < 93, days);
});
test('распределение типов на случайных датах похоже на известное', () => {
  const n = 1500, c = {};
  let seed = 7; const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < n; i++) {
    const t = new Date(Date.UTC(1950, 0, 1) + r() * 70 * 365.25 * 864e5);
    const x = HD.calcDesign(t); c[x.type] = (c[x.type] || 0) + 1;
  }
  const p = Object.fromEntries(Object.entries(c).map(([k, v]) => [k, +(v / n * 100).toFixed(1)]));
  console.log('types %', p);
  assert.ok(p.generator + p.mg > 60 && p.generator + p.mg < 78);
  assert.ok(p.projector > 14 && p.projector < 27);
  assert.ok(p.manifestor > 4 && p.manifestor < 14);
});
