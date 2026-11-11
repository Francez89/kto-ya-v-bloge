// Маршрут на 30 дней: состав, подстройка под человека, серия, результаты, экраны
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
globalThis.window = globalThis.window || {};
const W = globalThis.window;
W.Astronomy = globalThis.Astronomy = require('../vendor/astronomy.browser.min.js');
W.VektorAstro = require('../js/astro.js');
W.VektorHD = require('../js/hd.js');
for (const f of ['config', 'data', 'archetypes', 'passports', 'systems', 'synth', 'numer-data', 'numer-grow', 'hd-data', 'growth-data', 'niches-more', 'niches', 'hooks', 'niches-map', 'stop-spec', 'stop', 'insight', 'route']) require(`../js/${f}.js`);
const R = W.VektorRoute, GD = W.VektorGrowthData;
const DAY = 86400000;

test('оба маршрута: ровно 30 дней, без повторов, каждое задание собирается и имеет текст', () => {
  for (const list of [R.SOFT, R.BOLD]) {
    assert.equal(list.length, 30); assert.equal(new Set(list).size, 30); assert.equal(list[0], 'first');
    for (const id of list) {
      const t = R.task(id, { date: '1989-07-21' }, {}, null);
      assert.ok(t.title && t.min > 0 && t.why, id);
      if (t.kind === 'video') { assert.ok(t.video.hook && t.video.beats.length >= 2 && t.video.caption && t.video.shoot, id); }
      else if (t.kind === 'first') assert.equal(t.phrases.length, 3);
      else assert.ok(t.text, id);
      if (id[0] === 't') assert.ok(GD.TRAINER[+id.slice(1)], id);
    }
    assert.deepEqual([6, 13, 20, 27].map((i) => list[i]), ['r1', 'r2', 'r3', 'r4'], 'итоги недели — каждый седьмой день');
  }
  assert.ok(R.SOFT.filter((x) => x[0] === 't').length > R.BOLD.filter((x) => x[0] === 't').length);
  assert.ok(R.BOLD.filter((x) => x[0] === 'v').length > R.SOFT.filter((x) => x[0] === 'v').length);
});

test('выбор маршрута: тест страхов, линия самооценки, ручной выбор', () => {
  assert.equal(R.trackOf({}), 'soft');
  assert.equal(R.trackOf({ fears: { quiz: Array(10).fill(0) } }), 'bold');
  assert.equal(R.trackOf({ fears: { quiz: Array(10).fill(2) } }), 'soft');
  assert.equal(R.trackOf({ fears: { quiz: Array(10).fill(3) }, route: { track: 'bold' } }), 'bold');
  const NX = W.VektorNumer; let strong = null;
  for (let y = 1960; y < 2000 && !strong; y++) for (let m = 1; m <= 12 && !strong; m++) { const d = `${y}-${String(m).padStart(2, '0')}-11`; if (NX.square(d).lines.self >= 5) strong = d; }
  assert.equal(R.trackOf({ profile: { date: strong } }), 'bold');
});

test('прогресс: отметки, тренажёр и автозачёт; задания идут по порядку', () => {
  const s = { route: { track: 'soft', done: {} }, trainer: { done: {} }, ideaForm: {} };
  let x = R.status(s, {}); assert.equal(x.next, 'first'); assert.equal(x.day, 1); assert.equal(x.done, 0);
  s.route.done.first = { at: Date.now() }; x = R.status(s, {}); assert.equal(x.next, 's:niche'); assert.ok(x.doneToday); assert.equal(x.videos, 1);
  s.ideaForm.niche = 'маникюр'; x = R.status(s, {}); assert.equal(x.next, 't2');
  s.trainer.done[2] = { at: Date.now() }; x = R.status(s, {}); assert.equal(x.next, 't3'); assert.equal(x.done, 3); assert.equal(x.day, 4);
  assert.ok(R.isDone(s, 's:arch', { arch: true })); assert.ok(!R.isDone(s, 's:arch', {}));
  // смена маршрута не теряет сделанное
  s.route.track = 'bold'; x = R.status(s, {}); assert.equal(x.next, 'v0'); assert.equal(x.done, 2);
  R.BOLD.forEach((id) => (s.route.done[id] = { at: Date.now() })); x = R.status(s, {}); assert.ok(x.finished); assert.equal(x.next, null); assert.equal(x.day, 30);
});

test('серия дней: считает подряд, живёт до конца следующего дня, рвётся после пропуска', () => {
  const now = new Date(2026, 10, 11, 15).getTime();
  assert.equal(R.streak([], now), 0);
  assert.equal(R.streak([now], now), 1);
  assert.equal(R.streak([now, now - DAY, now - 2 * DAY], now), 3);
  assert.equal(R.streak([now - DAY, now - 2 * DAY], now), 2, 'сегодня ещё не сделано — серия жива');
  assert.equal(R.streak([now - 2 * DAY, now - 3 * DAY], now), 0, 'пропущен день — серия сгорела');
  assert.equal(R.streak([now, now - 2 * DAY], now), 1);
  assert.equal(R.streak([now, now - 3600000, now - DAY], now), 2, 'два задания в один день — один день серии');
});

test('личные правила: зависят от квадрата, архетипа и Дизайна; попадают в нужные задания', () => {
  const NX = W.VektorNumer; let weakGoal = null, many3 = null;
  for (let y = 1960; y < 2005; y++) for (let m = 1; m <= 12; m++) for (const dd of ['03', '13', '23']) { const d = `${y}-${String(m).padStart(2, '0')}-${dd}`, q = NX.square(d); if (!weakGoal && q.lines.goal <= 2) weakGoal = d; if (!many3 && q.cells[3] >= 4) many3 = d; }
  assert.ok(R.rules({ date: weakGoal }, {}).some((r) => r.k === 'start'));
  const rp = R.rules({ date: many3, hd: { type: 'projector' } }, { route: { track: 'bold' } });
  assert.ok(rp.some((r) => r.k === 'perfect') && rp.some((r) => r.k === 'hd') && !rp.some((r) => r.k === 'soft'));
  assert.ok(R.rulesFor(rp, 'v3').some((r) => r.k === 'perfect')); assert.ok(!R.rulesFor(rp, 's:bio').some((r) => r.k === 'perfect'));
  const soft = R.rules({}, {}); assert.ok(R.rulesFor(soft, 'first').some((r) => r.k === 'soft')); assert.ok(!R.rulesFor(soft, 'v5').some((r) => r.k === 'soft'));
  const all = JSON.stringify(R.rules({ date: weakGoal, hd: { type: 'mg' } }, {}).map((r) => r.text)); assert.ok(!/[a-z]{3,}/i.test(all));
});

test('ролик под ключ: любая тема, три роли, разные варианты; продающий длиннее', () => {
  const a = R.video({}, 'как выбрать объектив', 0, null, 0), b = R.video({}, 'как выбрать объектив', 0, null, 1), c = R.video({}, 'мой курс', 2, 'Готовый хук', 0);
  assert.match(a.hook, /как выбрать объектив/); assert.notEqual(a.hook, b.hook); assert.equal(c.hook, 'Готовый хук');
  assert.match(a.caption, /Подпишись/); assert.match(c.caption, /кодовое слово/); assert.equal(c.length, '40–60 секунд');
});

test('дневник результатов: прирост, заявки, лучшая неделя', () => {
  const t = Date.now();
  assert.equal(R.summary([], null), null);
  const one = R.summary([{ at: t, subs: 100, views: 500, leads: 0 }], { videos: 2 }); assert.equal(one.dSubs, null); assert.equal(one.videos, 2);
  const s = R.summary([{ at: t - 14 * DAY, subs: 100, views: 500, leads: 1 }, { at: t, subs: 340, views: 900, leads: 2 }, { at: t - 7 * DAY, subs: 180, views: 4000, leads: 0 }], { videos: 9 });
  assert.equal(s.dSubs, 240); assert.equal(s.leads, 3); assert.equal(s.weeks, 2); assert.equal(s.bestViews, 4000); assert.equal(s.bestAt, t - 7 * DAY);
});

test('экраны: карточка «Сегодня», выполнение, «на сегодня всё», результаты засчитывают итог недели', () => {
  const state = { profile: { date: '1989-07-21' }, ideaForm: { niche: 'маникюр' }, route: { track: 'soft', done: {} } };
  let tabbed = null;
  const C = { get state() { return state; }, save() {}, esc: (s) => String(s), head: (a, b, c) => `<small>${a}</small><h1>${b}</h1><p>${c}</p>`, render() {}, go() {}, back() {}, tab: (n) => { tabbed = n; }, haptic() {}, toast: (t) => { state.toast = t; }, copy() {}, arch: () => null, PX: () => ({ date: '1989-07-21' }), nicheField: () => '' };
  const U = W.VektorRouteUI(C);
  assert.match(U.todayCard(), /день 1 из 30/); assert.match(U.todayCard(), /Первый ролик за 20 секунд/);
  assert.match(U.screens.step({ k: 'first', intro: 1 }), /Код собран · первое действие/);
  U.actions.routeDone({ dataset: { k: 'first' } });
  assert.equal(tabbed, 'code'); assert.match(state.toast, /серия 1 день/);
  assert.match(U.todayCard(), /На сегодня всё/); assert.match(U.todayCard(), /Завтра:/);
  U.actions.routeMore(); assert.match(U.todayCard(), /Открыть задание/);
  const v = U.screens.step({ k: 'v0' }); assert.match(v, /Хук — первая фраза/); assert.match(v, /Подпись к ролику/); assert.match(v, /Снял\(а\) — засчитать/);
  assert.match(U.screens.route(), /Неделя 4/);
  // итог недели засчитывается при сохранении цифр
  for (const id of ['t2', 't3', 't4']) state.trainer = Object.assign(state.trainer || { done: {} }, { done: Object.assign((state.trainer || { done: {} }).done, { [+id.slice(1)]: { at: Date.now() } }) });
  state.route.done.v0 = { at: Date.now() };
  assert.equal(U.status().next, 'r1');
  globalThis.document = { getElementById: () => ({}) };
  state.resForm = { subs: '', views: '', leads: '' }; U.actions.resultsSave(); assert.equal((state.results || []).length, 0);
  U.onInput('rf:subs', { value: '1240' }); U.onInput('rf:views', { value: '5300' }); U.actions.resultsSave();
  assert.equal(state.results.length, 1); assert.ok(state.route.done.r1); assert.equal(U.status().next, 't7');
  U.onInput('rf:subs', { value: '1300' }); U.actions.resultsSave(); assert.equal(state.results.length, 1, 'в один день — одна запись');
  assert.match(U.screens.results(), /Твой результат/);
  U.onInput('tk:topic', { value: 'как выбрать объектив' }); assert.ok(!/Хук — первая фраза/.test(U.screens.turnkey()));
  U.actions.tkMake(); assert.match(U.screens.turnkey(), /как выбрать объектив/);
});
