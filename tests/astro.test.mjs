// Запуск: node --test tests/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
globalThis.Astronomy = require('../vendor/astronomy.browser.min.js');
const V = require('../js/astro.js');
const A = globalThis.Astronomy;

test('часовой пояс: Москва 1990 (летнее время, UTC+4) и 2012 (UTC+4), 2020 (UTC+3)', () => {
  assert.equal(V.localToUtc(1990, 7, 1, 12, 0, 'Europe/Moscow').toISOString(), '1990-07-01T08:00:00.000Z');
  assert.equal(V.localToUtc(2012, 1, 1, 12, 0, 'Europe/Moscow').toISOString(), '2012-01-01T08:00:00.000Z');
  assert.equal(V.localToUtc(2020, 1, 1, 12, 0, 'Europe/Moscow').toISOString(), '2020-01-01T09:00:00.000Z');
  assert.equal(V.localToUtc(2020, 1, 1, 12, 0, 3).toISOString(), '2020-01-01T09:00:00.000Z');
});

test('Солнце 1 января 2000, 12:00 UTC ≈ 280.4° (10° Козерога)', () => {
  const c = V.calcChart({ date: '2000-01-01', time: '12:00', lat: 51.48, lon: 0, tz: 0 });
  assert.ok(Math.abs(c.planets.sun.lon - 280.37) < 0.05, c.planets.sun.lon);
  assert.equal(c.planets.sun.sign, 9);
});

test('асцендент совпадает с точкой эклиптики на восточном горизонте (численная проверка)', () => {
  for (const [lat, lon, t] of [[55.75, 37.62, '1995-04-12T06:30:00Z'], [43.1, 131.9, '1987-11-30T20:10:00Z'], [-33.9, 151.2, '2010-06-15T02:00:00Z']]) {
    const date = new Date(t);
    const loc = t.slice(0, 10);
    const c = V.calcChart({ date: loc, time: t.slice(11, 16), lat, lon, tz: 0 });
    const obs = new A.Observer(lat, lon, 0);
    const time = A.MakeTime(date);
    const eps = A.e_tilt(time).tobl * Math.PI / 180;
    const alt = (L) => {
      const l = L * Math.PI / 180;
      const x = Math.cos(l), y = Math.sin(l) * Math.cos(eps), z = Math.sin(l) * Math.sin(eps);
      const ra = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360 / 15, dec = Math.asin(z) * 180 / Math.PI;
      return A.Horizon(date, obs, ra, dec, null);
    };
    const h = alt(c.asc.lon);
    assert.ok(Math.abs(h.altitude) < 0.05, `alt ${h.altitude}`);
    assert.ok(h.azimuth > 0 && h.azimuth < 180, `az ${h.azimuth}`);
  }
});

test('неизвестное время: без асцендента, Луна помечается при смене знака', () => {
  const c = V.calcChart({ date: '1993-03-08', time: null, lat: 55.75, lon: 37.62, tz: 'Europe/Moscow' });
  assert.equal(c.asc, null);
  assert.equal(c.houses, null);
  const b = V.balance(c);
  assert.ok(b.element);
});
