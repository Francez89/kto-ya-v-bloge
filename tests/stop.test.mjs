import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
globalThis.window = globalThis.window || {};
for (const f of ['niches-more', 'niches', 'hooks', 'niches-map', 'stop-spec', 'stop', 'numer-data', 'numer-grow', 'hd-data']) require(`../js/${f}.js`);
const W = globalThis.window, N = W.VektorNiches, S = W.VektorStop;

test('СТОП: для всех 100 ниш — 20 хуков голосом и текстом, все ≥25, нужная длина, без пропусков', () => {
  for (const n of N.NICHES) for (const delivery of ['voice', 'text']) {
    const b = S.batch(n, { delivery, seed: 3 });
    assert.equal(b.items.length, 20, n.key + ' ' + delivery + ' ' + b.items.length);
    for (const h of b.items) {
      assert.ok(h.s.total >= 25 && h.s.total <= 40, n.key + ': ' + h.s.total + ' ' + h.text);
      assert.equal(h.s.total, h.s.С + h.s.Т + h.s.О + h.s.П);
      assert.ok(!/[{}]|undefined|null/.test(h.text), h.text);
      const w = S.words(h.text);
      if (delivery === 'voice') assert.ok(w >= 8 && w <= 26, w + ' ' + h.text); else assert.ok(w <= 12, w + ' ' + h.text);
      assert.ok(!/^(привет|в этом видео|сегодня поговорим|хочешь узнать)/i.test(h.text));
    }
    assert.ok(new Set(b.items.map((h) => h.f)).size >= 12, n.key + ' мало разных формул');
    assert.ok(b.top3.length === 3);
  }
});

test('«Ещё 20» без повторов, «Только 30+», «Нравится» смещает формулы', () => {
  const n = N.find('маникюр'), used = new Set();
  for (let i = 0; i < 4; i++) { const b = S.batch(n, { used, seed: 10 + i }); b.items.forEach((h) => { assert.ok(!used.has(h.text)); used.add(h.text); }); }
  const only = S.batch(n, { only30: true, seed: 2 }); assert.ok(only.items.length > 0 && only.items.every((h) => h.s.total >= 30));
  const liked = S.batch(n, { likes: { myth: 5 }, seed: 4 }); assert.ok(liked.items.filter((h) => h.f === 'myth').length >= 2);
  const strat = S.batch(n, { strategy: 'provocation', seed: 4 }); assert.ok(strat.items.filter((h) => S.STRAT.provocation.includes(h.f)).length >= 10);
});

test('«Докрути»: три варианта — агрессивнее, загадочнее, конкретнее', () => {
  const n = N.find('психология'), h = S.batch(n, { seed: 1 }).items[0], t = S.tweak(n, h, {});
  assert.deepEqual(t.map((x) => x.kind), ['Агрессивнее', 'Загадочнее', 'Максимально конкретно']);
  t.forEach((x) => assert.ok(x.text.length > 20 && !/[{}]/.test(x.text)));
});

test('режим «от сценария»: цифры, поворот, итог и род автора; хуки ведут в сценарий', () => {
  const t = 'Год назад мои рилсы набирали по 200 просмотров. Я снимала каждый день, но ничего не менялось. Оказалось, что проблема была в первых двух секундах: я начинала с приветствия. В итоге удержание выросло на 43%, а за месяц пришло 38 клиентов. Главное — первая фраза должна обещать результат.';
  const A = S.parseScenario(t);
  assert.deepEqual(A.nums.map((x) => x.phrase), ['200 просмотров', '43%', '38 клиентов']);
  assert.equal(A.gender, 'f'); assert.match(A.resultClause, /^удержание выросло на 43%/); assert.equal(A.turnClause, 'проблема была в первых двух секундах');
  const r = S.scenarioHooks(A, N.find('рилсмейкер'), {});
  assert.equal(r.items.length, 20);
  assert.ok(r.items.filter((h) => /43%|38 клиентов|200 просмотров|первых двух секундах/.test(h.text)).length >= 5);
  assert.ok(r.items.every((h) => !/\(а\)/.test(h.text)), 'род автора подставлен');
});

test('ИИ-ответ разбирается в хуки с оценкой СТОП', () => {
  const p = S.parseAi('вот: {"hooks":[{"text":"Хук один","formula":"Тайна / запретное знание","trigger":"Секрет","S":5,"T":10,"O":7,"P":8,"why":"x"},{"text":"Хук два","formula":"Цифра + обещание","S":9,"T":9,"O":9,"P":9}],"top3":[{"n":1,"reason":"лучший"}]}');
  assert.equal(p.items[0].text, 'Хук два'); assert.equal(p.items[0].s.total, 36); assert.equal(p.items[1].f, 'secret');
  assert.equal(S.parseAi('нет json'), null);
  const pr = S.aiPrompt('niche', { delivery: 'voice' }, N.find('маникюр'), '', S.mapOf(N.find('маникюр')), []);
  assert.match(pr, /ОЦЕНКА СТОП/); assert.match(pr, /Маникюр/);
});

test('карта аудитории: 5 болей, 4 желания, 3 страха, 3 мифа, 3 возражения для всех ниш', () => {
  for (const n of N.NICHES) { const m = S.mapOf(n); assert.equal(m.pains.length, 5, n.key); assert.equal(m.wants.length, 4); assert.equal(m.fears.length, 3); assert.equal(m.myths.length, 3); assert.equal(m.objs.length, 3, n.key); }
});

test('квадрат Пифагора и вершины считаются по методике', () => {
  const q = W.VektorNumer.square('1990-06-15');
  assert.deepEqual(q.work, [31, 4, 29, 11]);
  assert.deepEqual([1, 2, 3, 4, 5, 6, 7, 8, 9].map((k) => q.cells[k]), [5, 1, 1, 1, 1, 1, 0, 0, 3]);
  assert.equal(W.VektorNumer.square('2003-11-04').method, 'с 2000 года (+19)');
  const c = W.VektorNumer.cycles('1990-06-15'); assert.deepEqual(c.peaks, [3, 7, 1, 7]); assert.equal(c.ages[0], 'до 32');
});

test('Дизайн человека: названия всех 36 каналов и 12 профилей', () => {
  const X = W.VektorHDX, H = require('../js/hd.js');
  const HD = W.VektorHD || H; const chans = (HD.CHANNELS || []);
  assert.equal(chans.length, 36); chans.forEach(([a, b]) => assert.ok(X.channelName(a, b), a + '-' + b));
  ['1/3', '1/4', '2/4', '2/5', '3/5', '3/6', '4/6', '4/1', '5/1', '5/2', '6/2', '6/3'].forEach((p) => assert.ok(X.PROFILE[p], p));
  for (const t of ['generator', 'mg', 'projector', 'manifestor', 'reflector']) { const T = X.TYPE[t]; assert.ok(T.pains.length >= 4 && T.solutions.length >= 4 && T.dangers.length >= 3 && T.blockers.length >= 3); }
});

test('нумерология: у каждой ячейки, линии, вызова и урока есть план — прокачка, использование, опасности', () => {
  const NX = window.VektorNumer, NG = window.VektorNumerGrow;
  for (let k = 1; k <= 9; k++) {
    const c = NG.CELL[k];
    assert.ok(c.weak.grow.length >= 2 && c.weak.tools && c.weak.blog, `ячейка ${k}: слабая`);
    assert.ok(c.norm.use.length && c.norm.grow.length, `ячейка ${k}: норма`);
    assert.ok(c.strong.use.length >= 2 && c.strong.risk.length && c.strong.balance, `ячейка ${k}: сильная`);
  }
  for (const L of NX.LINES) {
    const x = NG.LINE[L.k];
    assert.ok(x.weak.grow.length >= 2 && x.weak.tools && x.weak.blog && x.mid.use && x.strong.risk && x.strong.balance, L.k);
  }
  for (let i = 0; i <= 8; i++) assert.ok(NG.CHALLENGE_HOW[i].length >= 2);
  for (let i = 1; i <= 9; i++) assert.ok(NG.LESSON_HOW[i]);
  assert.equal(NG.cellLevel(0), 'weak'); assert.equal(NG.cellLevel(3), 'norm'); assert.equal(NG.cellLevel(4), 'strong');
  const s = NG.summary(NX.square('1990-06-15'), NX.LINES);
  assert.deepEqual(s.strong.map((x) => x.name), ['Духовность', 'Самооценка', 'Целеустремлённость']);
  assert.deepEqual(s.weak.map((x) => x.name).sort(), ['Семейность', 'Темперамент']);
  assert.deepEqual(s.weakCells, [7, 8]);
  assert.ok(!/[a-z]{3,}/i.test(JSON.stringify([NG.CELL, NG.LINE, NG.CHALLENGE_HOW, NG.LESSON_HOW]).replace(/"[a-z]+":/g, '')), 'без английских слов');
});
