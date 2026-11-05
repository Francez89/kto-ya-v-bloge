import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
globalThis.window = globalThis.window || {};
require('../js/niches-more.js'); require('../js/niches.js'); require('../js/hooks.js');
const N = globalThis.window.VektorNiches, H = globalThis.window.VektorHooks;

test('100 ниш, у каждой полный набор форм и списков', () => {
  assert.equal(N.NICHES.length, 100);
  assert.equal(new Set(N.NICHES.map((n) => n.key)).size, 100);
  for (const n of N.NICHES) {
    for (const k of ['name', 'inT', 'about', 'doer', 'aud', 'audDat', 'audGen', 'act']) assert.ok(n[k] && n[k].length > 2, n.key + ' ' + k);
    for (const k of ['res', 'pain', 'err', 'want']) assert.ok(n[k].length >= 4, n.key + ' ' + k);
    assert.ok(n.myth.length >= 3, n.key + ' myth');
    assert.match(n.about, /^про /, n.key + ' about');
    assert.match(n.inT, /^(в|во|на) /, n.key + ' inT');
  }
});

test('на каждую нишу 400+ уникальных хуков без технических ошибок', () => {
  let total = 0;
  for (const n of N.NICHES.concat([N.custom('татуировки')])) {
    const p = H.pool(n); total += p.length;
    assert.ok(p.length >= 500, n.key + ' ' + p.length);
    for (const h of p) {
      assert.ok(!/[{}]/.test(h.text), 'слот: ' + h.text);
      assert.ok(!/\s{2,}|\s[,.?:]/.test(h.text), 'пробелы: ' + h.text);
      assert.ok(/^[«А-ЯЁA-Z0-9]/.test(h.text), 'начало: ' + h.text);
      assert.ok(!/\b(ugc|telegram|hr)[- ]/.test(h.text), 'латиница со строчной: ' + h.text);
      assert.ok(!/[а-яё,:] (Маникюр|Ресницы|Брови|Психология|Фитнес)\b/.test(h.text), 'заглавная посреди: ' + h.text);
      assert.ok(h.score.words <= 16, 'длинный: ' + h.text);
    }
  }
  console.log('всего хуков:', total);
});

test('«Другие варианты» не повторяются, пока пул не исчерпан', () => {
  const n = N.find('маникюр'), used = new Set();
  for (let i = 0; i < 20; i++) { const b = H.batch(n, { seed: i + 1, used }); b.items.forEach((h) => { assert.ok(!used.has(h.text), 'повтор: ' + h.text); used.add(h.text); }); }
  assert.equal(used.size, 200);
});

test('фильтр ВИСП и архетип работают', () => {
  const n = N.find('видеосъёмка');
  const s = H.batch(n, { visp: 'С', seed: 2 }); assert.ok(s.items.every((h) => h.visp.includes('С')));
  const a = H.batch(n, { arch: ['rebel'], seed: 2 }); assert.ok(a.items.filter((h) => h.arch.includes('rebel')).length >= 5);
});

test('распознавание ниш', () => {
  assert.equal(N.find('креативный продюсер видео').key, 'video');
  assert.equal(N.find('ногти').key, 'nails');
  assert.equal(N.find('ЕГЭ').key, 'ege');
  assert.equal(N.find('тату').key, 'tattoo');
  const cases = { рилсмейкер: 'reels', reels: 'reels', видеомейкер: 'video', ugc: 'ugc', блог: 'blog', озон: 'marketplaces', 'тг-канал': 'tgchannel', нейросети: 'neuro', шугаринг: 'sugaring', дикция: 'speaking', ведущий: 'events', собака: 'dogs', бизнес: 'smallbiz', 'дизайн человека': 'humandesign' };
  for (const [q, k] of Object.entries(cases)) assert.equal((N.find(q) || {}).key, k, q);
});

test('тоны и 15 психологических триггеров', () => {
  const n = N.find('маникюр');
  assert.equal(Object.keys(H.TRIGGERS).length, 15);
  for (const k of Object.keys(H.TRIGGERS)) assert.ok(H.TPL.filter((t) => t.trig === k).length >= 2, 'мало шаблонов: ' + k);
  const all = H.batch(n, { seed: 3, count: 400 }); assert.ok(all.items.every((h) => h.tone !== 'x18'), '18+ только по запросу');
  for (const t of ['base', 'hard', 'absurd', 'x18']) { const b = H.batch(n, { tone: t, seed: 4, count: 12 }); assert.ok(b.items.length >= 10 && b.items.every((h) => h.tone === t), t); }
  const psy = H.batch(n, { tone: 'psy', seed: 5, count: 12 }); assert.ok(psy.items.every((h) => h.trig));
  const one = H.batch(n, { tone: 'psy', trig: 'loss', seed: 6, count: 5 }); assert.ok(one.items.length && one.items.every((h) => h.trig === 'loss'));
  for (let i = 0; i < 50; i++) { const h = H.forFormat(n, 'reaction', i); assert.ok(h && h.tone !== 'x18' && h.tone !== 'absurd'); }
  const x = H.batch(n, { tone: 'x18', seed: 1, count: 60 }); assert.ok(x.items.every((h) => !/(бля|хуй|пизд|еба|ебат)/i.test(h.text)), 'мат должен быть под звёздочками');
});
