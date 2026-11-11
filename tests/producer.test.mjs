// Режим продюсера: разбор клиента по любым данным, отчёт текстом, экраны
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
globalThis.window = globalThis.window || {};
const W = globalThis.window;
W.Astronomy = globalThis.Astronomy = require('../vendor/astronomy.browser.min.js');
W.VektorAstro = require('../js/astro.js');
W.VektorHD = require('../js/hd.js');
for (const f of ['config', 'data', 'archetypes', 'passports', 'systems', 'synth', 'numer-data', 'numer-grow', 'hd-data', 'niches-more', 'niches', 'hooks', 'insight', 'producer']) require(`../js/${f}.js`);
const PR = W.VektorProducer;

test('полные данные: карта с асцендентом, Дизайн человека, архетип; все блоки разбора заполнены', () => {
  const c = { name: 'Анна Смирнова', date: '1991-04-12', time: '14:20', city: 'Москва', niche: 'стоматолог', arch: 'caregiver', arch2: 'sage' };
  const R = PR.report(c, new Date(2026, 10, 7));
  assert.ok(R.P.exact && R.P.hd && R.P.chart.asc);
  assert.equal(R.P.arch.ranked[0], 'caregiver'); assert.equal(R.P.arch.top[1], 'sage');
  assert.ok(R.who.length >= 2 && R.how.length && R.what.length && R.trap.length);
  assert.equal(R.formats.length, 3);
  assert.ok(R.work.decides && R.work.sell && R.work.hd && R.work.rhythm);
  assert.equal(R.why.length, 3); assert.equal(R.missing.length, 0);
  assert.ok(R.head.some((h) => /Заботливый/.test(h)));
  const t = PR.reportText(c, R, 'Кто я в блоге?');
  assert.match(t, /КАКИМ БЫТЬ В КАДРЕ/); assert.match(t, /Анна Смирнова · стоматолог/); assert.ok(t.length > 400);
});

test('только дата: без асцендента и Дизайна человека, но разбор есть и подсказывает, что добавить', () => {
  const R = PR.report({ name: '', date: '1988-09-30' });
  assert.equal(R.P.hd, null); assert.equal(R.P.chart.asc, null); assert.equal(R.P.arch, null);
  assert.ok(R.who.length && R.what.length && R.work.decides && R.why.length === 3);
  assert.equal(R.missing.length, 3);
  for (let y = 1960; y < 2010; y += 7) for (const m of ['01', '05', '09', '12']) assert.ok(PR.report({ date: `${y}-${m}-1${y % 9}` }).work.sell);
});

test('экраны: список, форма, сохранение, разбор, удаление', () => {
  const state = {};
  let route = null;
  const C = { get state() { return state; }, save() {}, esc: (s) => String(s), head: (a, b, c) => `<h1>${b}</h1><p>${c}</p>`, render() {}, go: (n, p) => { route = [n, p]; }, back() { route = ['back']; }, haptic() {}, toast() {}, copy(t) { state.copied = t; } };
  const U = W.VektorProducerUI(C);
  assert.match(U.screens.producer(), /Пока нет клиентов/);
  U.onInput('cf:name', { value: 'Олег' }); U.onInput('cf:date', { value: '1990-02-02' }); U.onInput('cf:city', { value: 'Казань' }); U.onInput('cf:time', { value: '07:00' });
  globalThis.document = { getElementById: () => null };
  U.actions.clientSave();
  assert.equal(state.clients.length, 1); assert.equal(route[0], 'client');
  const html = U.screens.client({ k: state.clients[0].id });
  assert.match(html, /Каким быть в кадре/); assert.match(html, /Где будет сопротивляться/); assert.match(html, /Лучшие дни/);
  U.actions.clientCopy({ dataset: { k: state.clients[0].id } }); assert.match(state.copied, /Олег/);
  state.clientForm = { date: '1990-02-02', city: 'Нет-такого' }; U.actions.clientSave(); assert.equal(state.clients.length, 1);
  const el = { dataset: { k: state.clients[0].id }, isConnected: true, textContent: '' };
  U.actions.clientDel(el); assert.equal(state.clients.length, 1); U.actions.clientDel(el); assert.equal(state.clients.length, 0);
});

test('«Вы с клиентом»: природная ниже рабочей, договорённости поднимают шкалу ровно до потенциала', () => {
  const me = { name: 'Николай Леммер', date: '1989-07-21', time: '08:30', lat: 42.82, lon: 132.89, tz: 'Asia/Vladivostok' };
  for (const d of ['1991-04-12', '1990-06-15', '1985-12-05', '1995-01-01', '2000-08-08', '1979-03-03', '1989-07-21', '1972-11-30']) {
    const c = { name: 'Иван Петров', date: d, time: '10:00', city: 'Москва' };
    const pr = PR.pair(me, c);
    assert.ok(pr.natural >= 3 && pr.natural < pr.potential && pr.potential <= 96, `${d}: ${pr.natural}→${pr.potential}`);
    assert.ok(pr.items.length >= 2 && pr.items.every((x) => x.pts > 0 && x.title && x.accept && x.how));
    assert.equal(PR.working(pr, {}), pr.natural);
    const all = {}; pr.items.forEach((x) => (all[x.k] = true));
    assert.equal(PR.working(pr, all), pr.potential);
    assert.ok(!/партнёр/.test(pr.roles));
  }
  // структурный продюсер и клиент без режима: есть пункт про дисциплину и он весомый
  const r = PR.pair(me, { name: 'Пётр', date: '1979-03-03' });
  assert.equal(r.items[0].k, 'discipline');
});

test('экран клиента: блок «Вы с клиентом», отметка договорённости сохраняется; в текст для клиента не попадает', () => {
  const state = { profile: { name: 'Николай Леммер', date: '1989-07-21', time: '08:30', lat: 42.82, lon: 132.89, tz: 'Asia/Vladivostok' }, clients: [{ id: 'x', name: 'Пётр', date: '1979-03-03' }] };
  const C = { get state() { return state; }, save() {}, esc: (s) => String(s), head: (a, b, c) => `<h1>${b}</h1>${c}`, render() {}, go() {}, back() {}, haptic() {}, toast() {}, copy(t) { state.copied = t; } };
  const U = W.VektorProducerUI(C);
  const html = U.screens.client({ k: 'x' });
  assert.match(html, /Вы с клиентом/); assert.match(html, /Если договориться/); assert.match(html, /data-a="agreeTick"/);
  U.actions.agreeTick({ dataset: { k: 'x', v: 'discipline' }, classList: { toggle() {} }, closest: () => null });
  assert.equal(state.clients[0].agree.discipline, true);
  U.actions.clientCopy({ dataset: { k: 'x' } }); assert.ok(!/Вы с клиентом|договор/i.test(state.copied));
  delete state.profile; assert.match(U.screens.client({ k: 'x' }), /Введи свои данные рождения/);
});

test('любая дата клиента и продюсера, включая мастер-числа 11, 22, 33: разбор и «Вы с клиентом» не падают', () => {
  const PR = W.VektorProducer, SY = W.VektorSystems;
  const masters = new Set();
  const dates = [];
  for (let t = Date.UTC(1950, 0, 3); t < Date.UTC(2012, 0, 1); t += 86400000 * 37) dates.push(new Date(t).toISOString().slice(0, 10));
  dates.push('1992-09-29', '1985-08-29', '1979-12-29'); // путь 11, 22-подобные
  for (const d of dates) {
    const L = SY.numerology(d, '').life; if (L > 9) masters.add(L);
    const c = { name: 'Тест Тестов', date: d };
    const R = PR.report(c); assert.ok(R.work.decides, d);
    const pr = PR.pair({ date: dates[(dates.indexOf(d) * 7) % dates.length], name: 'Я' }, c);
    assert.ok(pr.items.length && pr.natural < pr.potential, d);
    const pr2 = PR.pair(c, { date: '1989-07-21' }); assert.ok(pr2.items.length, d);
  }
  assert.ok(masters.has(11) && masters.has(22), 'в выборке есть мастер-числа: ' + [...masters]);
});
