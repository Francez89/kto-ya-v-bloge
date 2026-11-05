// Проверки теста архетипов: структура и различающая способность на симулированных людях
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
globalThis.window = globalThis.window || {};
require('../js/archetypes.js');
const AR = globalThis.window.VektorArchetypes;

test('72 утверждения, по 6 на архетип, без повторов подряд, без «(а)»', () => {
  assert.equal(AR.QUESTIONS.length, 72);
  const c = {}; AR.QUESTIONS.forEach((q) => (c[q.a] = (c[q.a] || 0) + 1));
  assert.ok(Object.values(c).every((v) => v === 6));
  for (let i = 1; i < 72; i++) assert.notEqual(AR.QUESTIONS[i].a, AR.QUESTIONS[i - 1].a);
  assert.ok(AR.QUESTIONS.every((q) => !/\(а\)/.test(q.text)));
  assert.equal(new Set(AR.QUESTIONS.map((q) => q.text)).size, 72);
});

function simulate(n, seed0) {
  let seed = seed0; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  let hit = 0, tieTop = 0, flat = 0, badOrder = 0;
  for (let i = 0; i < n; i++) {
    const order = AR.ORDER.slice().sort(() => rnd() - 0.5);
    const lvl = {}; AR.ORDER.forEach((k) => (lvl[k] = 3.1 + rnd() * 0.5)); // «согласие со всем подряд»
    lvl[order[0]] += 1.0; lvl[order[1]] += 0.75; lvl[order[2]] += 0.5; // истинный ведущий + два поддерживающих
    const ans = AR.QUESTIONS.map((q) => Math.max(1, Math.min(5, Math.round(lvl[q.a] + (rnd() - 0.5) * 2.4))));
    const picks = []; let p;
    while ((p = AR.nextClarify(ans, picks))) { const t = p.opts.find((k) => k === order[0]) || p.opts.find((k) => k === order[1]) || p.opts[0]; picks.push(rnd() < 0.8 ? t : p.opts.find((k) => k !== t)); }
    const r = AR.score(ans, picks);
    if (r.ranked[0] === order[0]) hit++;
    if (AR.ORDER.some((k) => r.scores[k] > r.scores[r.ranked[0]])) badOrder++;
    if (r.tiedPicks) tieTop++;
    if (r.flat) flat++;
  }
  return { hit: hit / n, tieTop: tieTop / n, flat: flat / n, badOrder };
}

test('лидер всегда с максимальным баллом; ничьи наверху разрешаются уточнением', () => {
  const r = simulate(3000, 11);
  console.log('simulation', JSON.stringify(Object.fromEntries(Object.entries(r).map(([k, v]) => [k, typeof v === 'number' ? +(v * 100).toFixed(1) + '%' : v]))));
  assert.equal(r.badOrder, 0, 'архетип с меньшим баллом стоит выше');
  assert.equal(r.tieTop, 0, 'ничья не разрешена');
});

test('профиль из HMI (Герой 28, Мудрец 26, Любовник 25, Правитель 25, Маг 24 … Славный малый 8) воспроизводится', () => {
  const hmi = { innocent: 18, everyman: 8, hero: 28, caregiver: 21, explorer: 23, rebel: 17, lover: 25, creator: 21, ruler: 25, magician: 24, sage: 26, jester: 22 };
  // человек отвечает в соответствии со своим уровнем: среднее на пункт = балл/6, распределено по 6 пунктам
  const ans = AR.QUESTIONS.map((q) => { const tot = hmi[q.a], base = Math.floor(tot / 6), extra = tot - base * 6; return base + (q.n < extra ? 1 : 0); });
  const r = AR.score(ans, []);
  assert.equal(r.ranked[0], 'hero'); assert.equal(r.scores.everyman, 8); assert.deepEqual(r.active, ['hero', 'sage', 'lover', 'ruler', 'magician'].filter((k) => r.scores[k] >= 24).sort((a, b) => r.scores[b] - r.scores[a] || AR.ORDER.indexOf(a) - AR.ORDER.indexOf(b)));
});

test('однотипные ответы распознаются', () => {
  const r = AR.score(Array(72).fill(4), []);
  assert.equal(r.flat, true);
});

test('персона: 5 на своих утверждениях → свой архетип, ясность strong', () => {
  for (const t of AR.ORDER) { const r = AR.score(AR.QUESTIONS.map((q) => (q.a === t ? 5 : 3)), []); assert.equal(r.ranked[0], t); assert.equal(r.clarity, 'strong'); }
});
