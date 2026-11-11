import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { webcrypto } from 'node:crypto';

const dir = mkdtempSync(join(tmpdir(), 'wk-')); const f = join(dir, 'worker.mjs');
writeFileSync(f, readFileSync(new URL('../worker/worker.js', import.meta.url), 'utf8'));
const W = (await import(f)).default;
const BOT = '123:ABC';
async function initData(user) {
  const enc = new TextEncoder(), p = new URLSearchParams({ auth_date: String(Math.floor(Date.now() / 1000)), user: JSON.stringify(user) });
  const dc = [...p.entries()].map(([k, v]) => `${k}=${v}`).sort().join('\n');
  const h = async (key, d) => new Uint8Array(await webcrypto.subtle.sign('HMAC', await webcrypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']), enc.encode(d)));
  p.set('hash', [...(await h(await h(enc.encode('WebAppData'), BOT), dc))].map((b) => b.toString(16).padStart(2, '0')).join(''));
  return p.toString();
}
function kv() { const m = new Map(); return { m, get: async (k) => (m.has(k) ? m.get(k) : null), put: async (k, v) => { m.set(k, v); }, delete: async (k) => { m.delete(k); }, list: async ({ prefix }) => ({ keys: [...m.keys()].filter((k) => k.startsWith(prefix)).map((name) => ({ name })), list_complete: true }) }; }
const calls = [];
globalThis.fetch = async (url, opt) => {
  const body = opt && opt.body ? JSON.parse(opt.body) : {}; calls.push({ url: String(url), body });
  if (String(url).includes('api.telegram.org')) return new Response(JSON.stringify({ ok: true, result: 'https://t.me/$invoice' }));
  return new Response(JSON.stringify({ choices: [{ message: { content: 'Разбор: хук слабый.' } }] }));
};
const req = (path, body, headers) => new Request('https://w.dev' + path, { method: 'POST', headers: Object.assign({ 'Content-Type': 'application/json' }, headers || {}), body: JSON.stringify(body) });
const env = () => ({ BOT_TOKEN: BOT, API_URL: 'https://ai/x', API_KEY: 'k', MODEL: 'm', DB: kv(), FREE_ANALYSES: '1', WEBHOOK_SECRET: 's3' });
const frame = 'data:image/jpeg;base64,' + 'A'.repeat(100);

test('/analyze: один бесплатный разбор, потом 402; без подписи — 401', async () => {
  const E = env(), id = await initData({ id: 42, username: 'u' });
  let r = await W.fetch(req('/analyze', { initData: id, frames: [frame], facts: { dur: 20, w: 1080, h: 1920, luma: 120, cuts: 5 } }), E);
  assert.equal(r.status, 200); const j = await r.json(); assert.equal(j.credits, 0); assert.match(j.text, /хук/);
  const ai = calls.at(-1); assert.equal(ai.body.messages[1].content[1].type, 'image_url');
  r = await W.fetch(req('/analyze', { initData: id, frames: [frame] }), E); assert.equal(r.status, 402);
  r = await W.fetch(req('/analyze', { initData: 'hash=bad', frames: [frame] }), E); assert.equal(r.status, 401);
});

test('оплата звёздами: счёт, вебхук зачисляет 5 разборов один раз', async () => {
  const E = env(), id = await initData({ id: 7 });
  const r = await W.fetch(req('/invoice', { initData: id, pack: 'p5' }), E); assert.equal((await r.json()).link, 'https://t.me/$invoice');
  const inv = calls.at(-1).body; assert.equal(inv.currency, 'XTR'); assert.equal(inv.payload, 'p5:7');
  const upd = { message: { chat: { id: 7 }, successful_payment: { invoice_payload: 'p5:7', telegram_payment_charge_id: 'ch1' } } };
  assert.equal((await W.fetch(req('/tg', upd, { 'X-Telegram-Bot-Api-Secret-Token': 'nope' }), E)).status, 403);
  await W.fetch(req('/tg', upd, { 'X-Telegram-Bot-Api-Secret-Token': 's3' }), E);
  await W.fetch(req('/tg', upd, { 'X-Telegram-Bot-Api-Secret-Token': 's3' }), E);
  assert.equal(E.DB.m.get('cr:7'), '6');
  await W.fetch(req('/tg', { pre_checkout_query: { id: 'q1' } }, { 'X-Telegram-Bot-Api-Secret-Token': 's3' }), E);
  assert.ok(calls.at(-1).url.endsWith('/answerPreCheckoutQuery'));
});

test('напоминания: сохраняются, отправляются в свой час один раз в день', async () => {
  const E = env(), id = await initData({ id: 99 });
  const tz = 180, hourNow = new Date(Date.now() + tz * 60000).getUTCHours();
  await W.fetch(req('/remind', { initData: id, on: true, hour: hourNow, tz, done: 4 }), E);
  assert.ok(E.DB.m.has('rem:99'));
  const before = calls.length; await W.scheduled({}, E, { waitUntil: (p) => p }); await new Promise((r) => setTimeout(r, 10));
  const sent = calls.slice(before).filter((c) => c.url.endsWith('/sendMessage'));
  assert.equal(sent.length, 1); assert.match(sent[0].body.text, /день 5 из 21/);
  const b2 = calls.length; await W.scheduled({}, E, { waitUntil: (p) => p }); await new Promise((r) => setTimeout(r, 10));
  assert.equal(calls.slice(b2).filter((c) => c.url.endsWith('/sendMessage')).length, 0);
  await W.fetch(req('/remind', { initData: id, on: false }), E); assert.ok(!E.DB.m.has('rem:99'));
});

test('тарифы: «Всё вместе» открывает код и стратегию + 5 разборов, /me отдаёт доступ, владелец получает уведомление', async () => {
  const E = Object.assign(env(), { ADMIN_CHAT_ID: '555' }), id = await initData({ id: 8 });
  await W.fetch(req('/invoice', { initData: id, pack: 'pro' }), E);
  const inv = calls.at(-1).body; assert.equal(inv.payload, 'pro:8'); assert.equal(inv.prices[0].amount, 449);
  const upd = { message: { chat: { id: 8 }, successful_payment: { invoice_payload: 'pro:8', telegram_payment_charge_id: 'ch9', total_amount: 449 } } };
  await W.fetch(req('/tg', upd, { 'X-Telegram-Bot-Api-Secret-Token': 's3' }), E);
  let j = await (await W.fetch(req('/me', { initData: id }), E)).json();
  assert.deepEqual(j.ent.sort(), ['code', 'strat']); assert.equal(j.credits, 6);
  assert.match(calls.filter((c) => c.body.chat_id === '555').at(-1).body.text, /Оплата: Всё вместе/);
  const pack = await W.fetch(req('/invoice', { initData: id, pack: 'code' }), E); assert.equal(pack.status, 200); assert.equal(calls.at(-1).body.prices[0].amount, 149);
});

test('утреннее сообщение календаря: личный день и что делать, один раз в день', async () => {
  const E = env(), id = await initData({ id: 77 });
  const tz = 180, hourNow = new Date(Date.now() + tz * 60000).getUTCHours();
  const r = await W.fetch(req('/remind', { initData: id, kind: 'day', on: true, hour: hourNow, tz, date: '1990-06-15' }), E);
  assert.equal(r.status, 200); assert.ok(E.DB.m.has('day:77'));
  const before = calls.length; await W.scheduled({}, E, { waitUntil: (p) => p }); await new Promise((r2) => setTimeout(r2, 10));
  const sent = calls.slice(before).filter((c) => c.url.endsWith('/sendMessage') && c.body.chat_id === '77');
  assert.equal(sent.length, 1); assert.match(sent[0].body.text, /Сегодня твой день: .+\n/);
  const b2 = calls.length; await W.scheduled({}, E, { waitUntil: (p) => p }); await new Promise((r2) => setTimeout(r2, 10));
  assert.equal(calls.slice(b2).filter((c) => c.body.chat_id === '77').length, 0);
  await W.fetch(req('/remind', { initData: id, kind: 'day', on: false }), E); assert.ok(!E.DB.m.has('day:77'));
});

test('напоминания: полночь и часовой пояс UTC сохраняются как есть, а не заменяются на значения по умолчанию', async () => {
  const E = env(), id = await initData({ id: 31 });
  await W.fetch(req('/remind', { initData: id, on: true, hour: 0, tz: 0, done: 1 }), E);
  const r = JSON.parse(E.DB.m.get('rem:31')); assert.equal(r.hour, 0); assert.equal(r.tz, 0);
  await W.fetch(req('/remind', { initData: id, kind: 'day', on: true, hour: 0, tz: 0, date: '1990-01-01' }), E);
  const d = JSON.parse(E.DB.m.get('day:31')); assert.equal(d.hour, 0); assert.equal(d.tz, 0);
});
