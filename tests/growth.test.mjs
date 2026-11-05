import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
globalThis.window = globalThis.window || {};
for (const f of ['config', 'data', 'archetypes', 'passports', 'systems', 'synth', 'niches-more', 'niches', 'hooks', 'hl-titles', 'growth-data', 'growth']) require(`../js/${f}.js`);
const W = globalThis.window, N = W.VektorNiches, GD = W.VektorGrowthData;
const state = { ideaForm: { niche: '' }, profile: null, demoSign: null };
const rng = (seed) => { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); };
const C = { get state() { return state; }, save() {}, esc: (s) => String(s), G: (s) => s, head: () => '', render() {}, go() {}, haptic() {}, toast() {}, copy() {}, rng, P: () => ({}), userName: () => '', arch: () => null, chart: () => null, num: () => null, hd: () => null, routeName: () => '' };
const G = W.VektorGrowth(C);

test('страхи: 10 штук, все поля, ссылки на существующие дни тренажёра', () => {
  assert.equal(GD.FEARS.length, 10);
  for (const f of GD.FEARS) {
    for (const k of ['key', 'icon', 'title', 'voice', 'q', 'why', 'practice', 'reel']) assert.ok(f[k] && f[k].length >= 1, f.key + ' ' + k);
    assert.ok(f.signs.length >= 3 && f.truth.length >= 3 && f.steps.length >= 4, f.key);
    assert.ok(f.day >= 1 && f.day <= 21, f.key);
  }
  assert.equal(Object.keys(GD.ARCH_FEAR).length, 12);
});

test('тренажёр 21 день, нагрузка растёт, «до» и «после» отмечены', () => {
  assert.equal(GD.TRAINER.length, 21);
  const w = (a) => a.reduce((s, d) => s + d.lvl, 0) / a.length;
  assert.ok(w(GD.TRAINER.slice(0, 7)) < w(GD.TRAINER.slice(7, 14)) && w(GD.TRAINER.slice(7, 14)) <= w(GD.TRAINER.slice(14)));
  assert.ok(GD.TRAINER[4].keep && GD.TRAINER[20].keep);
});

test('разминка: все шаги существуют и длятся 4–7 минут', () => {
  let sec = 0;
  for (const w of GD.WARMUP) { if (w.k === 'twist') { sec += 45; continue; } const s = w.k === 'final' ? w : GD.SPEECH[w.k][w.i]; assert.ok(s && s.t && s.d && s.sec, JSON.stringify(w)); sec += s.sec; }
  assert.ok(sec >= 240 && sec <= 420, 'длительность ' + sec);
});

test('актуальные: для всех 100 ниш и всех длин — без пропусков, название до 15 знаков', () => {
  for (const n of N.NICHES) assert.equal(W.VEKTOR_HL_TITLES[n.key].split('|').length, n.pain.length, n.key);
  assert.ok([...G.hlTitle(N.custom('вязание').pain[0])].length <= 15);
  for (const n of N.NICHES) for (const len of [5, 7, 10, 12]) for (let p = 0; p < n.pain.length; p++) {
    const H = G.buildHighlight(n, p, len, 'guide', 'гайд', null);
    assert.equal(H.stories.length, len);
    assert.ok([...H.title].length <= 15, n.key + ': ' + H.title);
    assert.equal(H.title, W.VEKTOR_HL_TITLES[n.key].split('|')[p]);
    assert.equal(H.stories[len - (len === 12 ? 2 : 1)].role, 'magnet');
    for (const s of H.stories) for (const k of ['text', 'show', 'sticker']) assert.ok(s[k] && !/undefined|null|\{/.test(s[k]), n.key + ' ' + s.role + ' ' + s[k]);
    assert.ok(H.stories.at(-1).text.includes('ГАЙД') || H.stories.at(-2).text.includes('ГАЙД'));
  }
});

test('разбор видео: правила срабатывают на типичные проблемы', () => {
  const bad = G.videoIssues({ dur: 75, w: 1920, h: 1080, luma: 50, cuts: 1, cutsPer10: 0.13, motion3: false, longest: 40, audio: { silent: false, onset: 2.1, level: -36, clip: 0, pauses: 30 } }).map((x) => x.t).join(' | ');
  for (const re of [/Горизонтальный/, /Длина/, /Тёмная/, /Статичное/, /Тишина в начале/, /Тихий звук/, /Паузы/, /реже раза/]) assert.match(bad, re);
  const good = G.videoIssues({ dur: 28, w: 1080, h: 1920, luma: 130, cuts: 9, cutsPer10: 3.2, motion3: true, longest: 4, audio: { silent: false, onset: 0.1, level: -16, clip: 0, pauses: 8 } });
  assert.equal(good.length, 0);
});

test('разбор статистики: низкое удержание и сохранения находятся', () => {
  const r = G.statsIssues({ views: '1000', hold3: '35', avgPct: '30', saves: '2', shares: '1', follows: '1' }).map((x) => x.t).join(' | ');
  assert.match(r, /Удержание/); assert.match(r, /Досматривают/); assert.match(r, /Сохранений/);
  assert.equal(G.statsIssues({ views: '1000', hold3: '75', avgPct: '70', saves: '30', shares: '20', follows: '10' }).length, 0);
});

test('звук: тишина, громкость и начало звука считаются', () => {
  const sr = 8000, data = new Float32Array(sr * 4);
  for (let i = sr; i < data.length; i++) data[i] = 0.2 * Math.sin(i / 5); // тишина 1 с, потом тон
  const a = G.audioStats({ sampleRate: sr, getChannelData: () => data });
  assert.ok(!a.silent && a.onset > 0.9 && a.onset < 1.1, JSON.stringify(a));
  assert.ok(a.level > -25 && a.level < -10);
  assert.ok(G.audioStats({ sampleRate: sr, getChannelData: () => new Float32Array(sr) }).silent);
});

test('анкета разбора: у каждого вопроса есть хотя бы один «хороший» ответ', () => {
  for (const q of GD.DIAG_Q) { assert.ok(q.o.some((o) => o[1] === null), q.k); for (const o of q.o) if (o[1]) assert.ok(o[1].w && o[1].t && o[1].fix && GD.ZONES[o[1].z], q.k); }
});
