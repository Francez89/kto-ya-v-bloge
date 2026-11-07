// «Почему не залетает», календарь, совместимость, редкость, «Код раскрыт», стратегия, платный замок
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
globalThis.window = globalThis.window || {};
const W = globalThis.window;
W.Astronomy = globalThis.Astronomy = require('../vendor/astronomy.browser.min.js');
W.VektorAstro = require('../js/astro.js');
const HD = require('../js/hd.js');
for (const f of ['config', 'data', 'archetypes', 'systems', 'numer-data', 'numer-grow', 'niches-more', 'niches', 'hooks', 'niches-map', 'stop-spec', 'stop', 'insight', 'insight-ui']) require(`../js/${f}.js`);
const IN = W.VektorInsight, AR = W.VektorArchetypes, SY = W.VektorSystems;

const profile = { name: 'Николай Леммер', date: '1989-07-21', time: '08:30', lat: 42.82, lon: 132.89, tz: 'Asia/Vladivostok' };
const chart = W.VektorAstro.calcChart(profile);
const hd = HD.calcDesign(new Date(chart.utc));
const answers = AR.QUESTIONS.map((q) => (q.a === 'hero' ? 5 : q.a === 'sage' ? 4 : 2));
const arch = AR.score(answers, []);
const num = SY.numerology(profile.date, profile.name);
const PX = { chart, hd, arch, num, date: profile.date, life: num.life };
const latin = (o) => /[a-z]{3,}/i.test(JSON.stringify(o).replace(/"[a-zA-Z]+":/g, '').replace(/src-\w+|"(chart|arch|num|hd|base|hook|delivery|regular|sell|brand|trust|start|talk|shoot|batch|test|care|think|finish|hooks|speech|plan|strategy|formats|ideas|trainer|highlights)"/g, ''));

test('«Почему не залетает»: ровно 3 причины про разное, с решением и действием; работает и без данных', () => {
  const w = IN.why(PX);
  assert.equal(w.length, 3); assert.equal(new Set(w.map((x) => x.cat)).size, 3);
  for (const r of w) { assert.ok(r.title && r.text && r.fix.length >= 2 && r.act && r.actLabel); }
  assert.equal(w[0].src, 'arch'); assert.equal(w[0].title, IN.ARCH_WHY[arch.ranked[0]][0]);
  const bare = IN.why({ date: '2001-01-01', life: 5 });
  assert.equal(bare.length, 3);
  assert.equal(IN.why({}).length, 3);
  for (const k of AR.ORDER) assert.ok(IN.ARCH_WHY[k], k);
  for (const k of Object.keys(SY.HD_TYPES)) assert.ok(IN.HD_WHY[k], k);
  assert.ok(!latin(IN.ARCH_WHY) && !latin(IN.HD_WHY) && !latin(IN.LINE_WHY), 'без английских слов');
});

test('календарь: личный день совпадает с нумерологией, Луна и ретро-Меркурий, ретро переносит продажи', () => {
  const t = new Date(2026, 10, 7);
  const d = IN.day(profile.date, t);
  assert.equal(d.pDay, SY.numerology(profile.date, '', new Date(2026, 10, 7, 12)).pDay);
  assert.ok(d.moon >= 0 && d.moon < 12 && d.K && d.idea);
  const days = IN.calendar(profile.date, t, 30); assert.equal(days.length, 30);
  assert.equal(days[1].date.getDate(), 8);
  // осень 2026: Меркурий ретроградный примерно с 24 октября по 13 ноября
  assert.equal(IN.day(profile.date, new Date(2026, 10, 3)).retro, true);
  assert.equal(IN.day(profile.date, new Date(2026, 10, 20)).retro, false);
  const retroDays = IN.calendar(profile.date, new Date(2026, 9, 26), 17);
  assert.ok(retroDays.every((x) => x.kind !== 'sell' && x.kind !== 'start'), 'в ретро нет продаж и запусков');
  assert.ok(IN.bestDays(days, ['sell']).every((d) => d instanceof Date && days.some((x) => x.date === d && x.kind === 'sell')));
});

test('совместимость: оценка, роли, формат; для клиента — как продавать и первое сообщение', () => {
  const c = IN.compat({ sun: chart.planets.sun.sign, life: num.life, date: profile.date }, { date: '1992-03-10' }, 'collab');
  assert.ok(c.score >= 40 && c.score <= 100); assert.ok(c.format && c.roles && c.risk && c.verdict);
  assert.equal(c.other.life, IN.lifeOf('1992-03-10')); assert.equal(c.client, null);
  const k = IN.compat({ life: num.life, date: profile.date }, { date: '1985-12-05' }, 'client');
  for (const f of ['decides', 'sell', 'words', 'avoid', 'first']) assert.ok(k.client[f], f);
  for (let i = 1; i <= 9; i++) assert.ok(IN.CLIENT[i]);
  assert.equal(Object.keys(IN.EL_PAIR).length, 10);
  assert.equal(IN.sunSignOf('1990-06-15').sign, 2); // Близнецы
  assert.equal(IN.sunSignOf('1990-03-20').cusp || IN.sunSignOf('1990-03-21').cusp, true);
});

test('редкость: частоты чисел пути в сумме 1, оценка «1 из N»', () => {
  const f = IN.lifeFrequency(); const sum = Object.values(f).reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(sum - 1) < 1e-9); assert.ok(Object.keys(f).length === 9);
  const r = IN.rarity(PX); assert.equal(r.parts.length, 3); assert.ok(r.oneIn > 50 && r.oneIn < 20000, String(r.oneIn));
  assert.equal(IN.rarity({}), null);
});

test('«Код раскрыт»: фора 25% за дату, платные шаги — в конце, максимум 100', () => {
  const none = () => false, all = () => true;
  const p = IN.progress({ profile: { date: '1990-01-01' }, ideaForm: {} }, {}, none);
  assert.equal(p.pct, 25); assert.ok(!p.next.paid);
  const full = IN.progress({ profile: profile, ideaForm: { niche: 'маникюр' }, seen: { why: 1, numer: 1, natal: 1, calendar: 1, compat: 1 } }, PX, all);
  assert.equal(full.pct, 100); assert.equal(full.next, undefined);
  const free = IN.progress({ profile: profile, ideaForm: { niche: 'маникюр' }, seen: { why: 1, numer: 1, natal: 1, calendar: 1, compat: 1 } }, PX, none);
  assert.equal(free.pct, 74); assert.equal(free.next.to, 'tariffs');
});

test('стратегия: 13 недель, 3 этапа, сценарии с хуками на первые 2 недели, практика из квадрата', () => {
  const S = IN.strategy(PX, { hooks: ['Хук один', 'Хук два', 'Хук три', 'Хук четыре', 'Хук пять', 'Хук шесть'], start: new Date(2026, 10, 9) });
  assert.equal(S.weeks.length, 13); assert.deepEqual([...new Set(S.weeks.map((w) => w.phase))], ['Узнаваемость', 'Доверие', 'Продажи']);
  assert.equal(S.weeks[0].videos[0].hook, 'Хук один'); assert.ok(S.weeks[1].videos.every((v) => v.hook && v.shoot));
  assert.ok(S.weeks[5].videos.every((v) => !v.hook));
  assert.ok(S.weeks[12].videos.some((v) => v.role === 'Продажа'));
  const sqW = W.VektorNumerGrow.summary(W.VektorNumer.square(profile.date), W.VektorNumer.LINES).weak;
  assert.equal(!!S.weeks[0].practice, sqW.length > 0);
  assert.ok(IN.strategy({ date: '1990-06-15' }, {}).weeks[0].practice);
  assert.ok(S.funnel.length === 4 && S.ladder.length >= 3);
  assert.equal(S.weeks[1].date.getDate(), 16);
});

test('экраны: замок скрывает платное, после оплаты всё открыто; хуки дня под нишу', () => {
  const state = { profile, ideaForm: { niche: 'маникюр' }, ent: {}, seen: {} };
  const C = { get state() { return state; }, save() {}, esc: (s) => String(s), head: (a, b, c) => `<h1>${b}</h1>${c}`, render() {}, haptic() {}, toast() {}, copy() {}, openLink() {}, P: () => ({ chart, hd, arch, num }), nSystems: () => 4, nicheField: () => '', arch: () => arch, chart: () => chart, num: () => num, hd: () => hd };
  const U = W.VektorInsightUI(C);
  W.VektorConfig.openAll = true; assert.ok(!/class="lock/.test(U.screens.strategy()), 'режим тестирования: всё открыто');
  W.VektorConfig.openAll = false;
  const locked = U.screens.strategy();
  assert.match(locked, /class="lock /); assert.match(locked, /Неделя 1/); assert.match(locked, /Открыть за 449/);
  assert.ok(state.seen.strategy);
  state.ent = { code: true, strat: true };
  const open = U.screens.strategy();
  assert.ok(!/class="lock/.test(open)); assert.match(open, /Неделя 13/);
  state.ent = {};
  const cal = U.screens.calendar(); assert.match(cal, /Хук под твою нишу/); assert.match(cal, /class="lock/);
  assert.match(U.screens.why(), /Почему твои ролики не залетают/);
  state.compatForm = { name: 'Аня', date: '1992-03-10', mode: 'client', result: { name: 'Аня', date: '1992-03-10', mode: 'client' } };
  const cp = U.screens.compat(); assert.match(cp, /Как Аня принимает решения/); assert.match(cp, /Первое сообщение/);
  assert.match(U.screens.tariffs({}), /выбор большинства/);
  assert.match(U.codeCards(), /Код раскрыт на \d+%/);
});
