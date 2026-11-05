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
