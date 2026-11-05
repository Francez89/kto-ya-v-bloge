/*
 * «Кто я в блоге?» — прослойка для ИИ на Cloudflare Workers (бесплатный тариф: 100 000 запросов в день).
 * Хранит ключ API на сервере, проверяет, что запрос пришёл из твоего Telegram-бота, и отвечает {text}.
 *
 * Переменные (Settings → Variables and Secrets):
 *   API_KEY        — ключ провайдера ИИ (секрет)
 *   API_URL        — OpenAI-совместимый адрес, например:
 *                    https://api.openai.com/v1/chat/completions
 *                    https://openrouter.ai/api/v1/chat/completions
 *                    https://api.proxyapi.ru/openai/v1/chat/completions
 *   MODEL          — модель, например gpt-4o-mini или anthropic/claude-sonnet-4.5 (OpenRouter)
 *   BOT_TOKEN      — токен бота из @BotFather (секрет). Если задан — запросы без подписи Telegram отклоняются
 *   ALLOWED_ORIGIN — адрес приложения, например https://login.github.io
 *   ADMIN_CHAT_ID  — твой Telegram ID (узнать у @userinfobot): сюда бот присылает оценки теста архетипов
 *   VISION_MODEL   — модель для разбора кадров (умеет картинки), например gpt-4o-mini. Пусто — берётся MODEL
 *   FREE_ANALYSES  — сколько бесплатных ИИ-разборов роликов у каждого (по умолчанию 1)
 *   STARS_P5       — цена пакета из 5 разборов в звёздах Telegram (по умолчанию 150)
 *   WEBHOOK_SECRET — любая строка: защищает адрес /tg, куда Telegram присылает оплаты
 *   APP_URL        — адрес приложения (для кнопки в напоминаниях)
 * Привязка KV (Settings → Bindings → KV namespace) с именем DB — хранит кредиты и напоминания.
 * Cron (Settings → Triggers → Cron): "0 * * * *" — раз в час рассылает напоминания тренажёра.
 *
 * Маршруты: POST /         — ответ ИИ
 *           POST /feedback — оценка точности теста → сообщение тебе в Telegram
 *           POST /analyze  — ИИ-разбор ролика по кадрам (списывает 1 разбор)
 *           POST /invoice  — ссылка на оплату пакета разборов звёздами Telegram
 *           POST /tg       — вебхук бота: подтверждение и зачисление оплат
 *           POST /remind   — включить/выключить напоминания тренажёра
 */
export default {
  async fetch(req, env) {
    const cors = {
      'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (req.method !== 'POST') return json({ error: 'method' }, 405, cors);

    let body;
    try { body = await req.json(); } catch { return json({ error: 'bad_json' }, 400, cors); }
    const path = new URL(req.url).pathname;
    if (path.endsWith('/feedback')) return feedback(body, env, cors);
    if (path.endsWith('/analyze')) return analyze(body, env, cors);
    if (path.endsWith('/invoice')) return invoice(body, env, cors);
    if (path.endsWith('/remind')) return remind(body, env, cors);
    if (path.endsWith('/tg')) return tgWebhook(req, body, env);
    const { system, messages, initData } = body || {};
    if (typeof system !== 'string' || !Array.isArray(messages) || !messages.length) return json({ error: 'bad_request' }, 400, cors);

    if (env.BOT_TOKEN && !(await validInitData(initData || '', env.BOT_TOKEN))) return json({ error: 'unauthorized' }, 401, cors);

    const big = +body.maxTokens > 0; // движок хуков: длинное ТЗ и 20 хуков в ответе
    const clean = messages.slice(-8).map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content || '').slice(0, big ? 20000 : 2000) }));
    const r = await fetch(env.API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.API_KEY}` },
      body: JSON.stringify({ model: env.MODEL, max_tokens: big ? Math.min(3000, +body.maxTokens) : 600, temperature: 0.8, messages: [{ role: 'system', content: system.slice(0, 6000) }, ...clean] }),
    });
    if (!r.ok) return json({ error: 'upstream', status: r.status }, 502, cors);
    const j = await r.json();
    const text = j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
    return json({ text: text || '' }, 200, cors);
  },
  async scheduled(event, env, ctx) { ctx.waitUntil(sendReminders(env)); },
};

/* ---------- общие помощники ---------- */
const tgApi = (env, method, payload) => fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/${method}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).then((r) => r.json()).catch(() => ({}));
function userOf(initData) { try { return JSON.parse(new URLSearchParams(initData || '').get('user') || '{}'); } catch { return {}; } }
async function authUser(b, env) {
  if (env.BOT_TOKEN && !(await validInitData((b && b.initData) || '', env.BOT_TOKEN))) return null;
  const u = userOf(b && b.initData);
  return u.id ? String(u.id) : env.BOT_TOKEN ? null : 'anon';
}
async function getCredits(env, uid) {
  if (!env.DB) return 99;
  const v = await env.DB.get('cr:' + uid);
  return v == null ? +(env.FREE_ANALYSES || 1) : +v;
}
const setCredits = (env, uid, n) => (env.DB ? env.DB.put('cr:' + uid, String(n)) : null);

/* ---------- ИИ-разбор ролика ---------- */
async function analyze(b, env, cors) {
  const uid = await authUser(b, env); if (!uid) return json({ error: 'unauthorized' }, 401, cors);
  const frames = Array.isArray(b.frames) ? b.frames.filter((f) => typeof f === 'string' && f.startsWith('data:image/') && f.length < 400000).slice(0, 6) : [];
  if (!frames.length) return json({ error: 'bad_request' }, 400, cors);
  const credits = await getCredits(env, uid);
  if (credits <= 0) return json({ error: 'no_credits', credits: 0 }, 402, cors);
  const f = b.facts || {}, a = f.audio || {};
  const facts = `Длина ${Math.round(f.dur || 0)} с, ${f.w}×${f.h}, средняя яркость ${Math.round(((f.luma || 0) / 255) * 100)}%, склеек ${f.cuts}. Звук: ${a.silent ? 'нет' : a.level != null ? `${Math.round(a.level)} дБ, тишина в начале ${(a.onset || 0).toFixed(1)} с, паузы ${Math.round(a.pauses || 0)}%` : 'не прочитан'}. Ниша: ${String(b.niche || 'не указана').slice(0, 60)}. Ведущий архетип автора: ${String(b.arch || 'не указан').slice(0, 30)}. Автоматические находки: ${(Array.isArray(b.issues) ? b.issues.slice(0, 10).join('; ') : '').slice(0, 800)}.`;
  const system = 'Ты — продюсер коротких вертикальных видео (Reels, Shorts, клипы). Тебе дают 6 ключевых кадров ролика по порядку (0,2 с; 1,5 с; 3 с; 35%; 60%; 90%) и технические данные. Разбери ролик по-русски, без воды, без англицизмов. Структура: 1) Первые 3 секунды: что видит зритель, есть ли хук и текст, остановит ли это пролистывание. 2) Подача: лицо, взгляд, эмоция, крупность. 3) Свет, фон, композиция, зоны интерфейса. 4) Текст на экране: читаемость, размер. 5) Три конкретные правки для пересъёмки — по пунктам. 6) Новый хук в одну строку. Не выдумывай то, чего не видно на кадрах; если чего-то не понять по кадрам — так и скажи.';
  const content = [{ type: 'text', text: facts }].concat(frames.map((u) => ({ type: 'image_url', image_url: { url: u } })));
  const r = await fetch(env.API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.API_KEY}` }, body: JSON.stringify({ model: env.VISION_MODEL || env.MODEL, max_tokens: 900, temperature: 0.6, messages: [{ role: 'system', content: system }, { role: 'user', content }] }) });
  if (!r.ok) return json({ error: 'upstream', status: r.status }, 502, cors);
  const j = await r.json();
  const text = j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
  if (!text) return json({ error: 'empty' }, 502, cors);
  await setCredits(env, uid, credits - 1);
  return json({ text, credits: env.DB ? credits - 1 : null }, 200, cors);
}

/* ---------- оплата звёздами Telegram ---------- */
const PACKS = { p5: { n: 5, title: '5 ИИ-разборов роликов', env: 'STARS_P5', def: 150 } };
async function invoice(b, env, cors) {
  const uid = await authUser(b, env); if (!uid || uid === 'anon') return json({ error: 'unauthorized' }, 401, cors);
  const P = PACKS[b.pack] || PACKS.p5, price = +(env[P.env] || P.def);
  const r = await tgApi(env, 'createInvoiceLink', { title: P.title, description: 'Разбор ролика по кадрам: хук, подача, свет, текст и что переснять.', payload: `${b.pack || 'p5'}:${uid}`, currency: 'XTR', prices: [{ label: P.title, amount: price }] });
  if (!r.ok) return json({ error: 'telegram', detail: r.description }, 502, cors);
  return json({ link: r.result }, 200, cors);
}
async function tgWebhook(req, u, env) {
  if (env.WEBHOOK_SECRET && req.headers.get('X-Telegram-Bot-Api-Secret-Token') !== env.WEBHOOK_SECRET) return new Response('forbidden', { status: 403 });
  if (u.pre_checkout_query) await tgApi(env, 'answerPreCheckoutQuery', { pre_checkout_query_id: u.pre_checkout_query.id, ok: true });
  const pay = u.message && u.message.successful_payment;
  if (pay && env.DB) {
    const [pack, uid] = String(pay.invoice_payload || '').split(':');
    const P = PACKS[pack];
    if (P && uid && !(await env.DB.get('pay:' + pay.telegram_payment_charge_id))) {
      await env.DB.put('pay:' + pay.telegram_payment_charge_id, uid);
      await setCredits(env, uid, (await getCredits(env, uid)) + P.n);
      await tgApi(env, 'sendMessage', { chat_id: u.message.chat.id, text: `Готово! Добавлено ${P.n} ИИ-разборов. Возвращайся в приложение 🎬` });
    }
  }
  return new Response('ok');
}

/* ---------- напоминания тренажёра ---------- */
const TRAINER = ['Голосовое себе', 'Слушаю свой голос', 'Руки в кадре', '10 секунд взгляда', 'Мой первый «до»', 'Три вещи дня', 'Итог недели', 'Почему моё дело', 'Камера на улице', 'Разминка на камеру', 'Ответ на вопрос', 'Сторис с лицом', 'Три дубля', 'Первый ролик', 'Пять эмоций', 'Разрушаю миф', 'История ошибки', 'Кружок или эфир', 'Людное место', 'По раскадровке', 'Моё «после»'];
async function remind(b, env, cors) {
  const uid = await authUser(b, env); if (!uid || uid === 'anon') return json({ error: 'unauthorized' }, 401, cors);
  if (!env.DB) return json({ error: 'no_storage' }, 501, cors);
  const hour = Math.max(0, Math.min(23, +b.hour || 19)), tz = Math.max(-720, Math.min(840, +b.tz || 180));
  if (!b.on) { await env.DB.delete('rem:' + uid); return json({ ok: true, on: false }, 200, cors); }
  const prev = JSON.parse((await env.DB.get('rem:' + uid)) || '{}');
  await env.DB.put('rem:' + uid, JSON.stringify({ hour, tz, done: Math.max(0, Math.min(21, +b.done || 0)), last: prev.last || '' }));
  return json({ ok: true, on: true }, 200, cors);
}
async function sendReminders(env) {
  if (!env.DB || !env.BOT_TOKEN) return;
  const now = Date.now(); let cursor;
  do {
    const page = await env.DB.list({ prefix: 'rem:', cursor });
    for (const k of page.keys) {
      const r = JSON.parse((await env.DB.get(k.name)) || '{}');
      const local = new Date(now + (r.tz || 0) * 60000), day = local.toISOString().slice(0, 10);
      if (local.getUTCHours() !== r.hour || r.last === day || r.done >= 21) continue;
      const uid = k.name.slice(4), i = Math.min(20, r.done || 0);
      const res = await tgApi(env, 'sendMessage', { chat_id: uid, text: `🎯 Тренажёр «Не боюсь камеры» — день ${i + 1} из 21
«${TRAINER[i]}». 5 минут — и ещё один шаг к свободе в кадре.`, reply_markup: env.APP_URL ? { inline_keyboard: [[{ text: 'Открыть задание', web_app: { url: env.APP_URL } }]] } : undefined });
      if (res.ok) { r.last = day; await env.DB.put(k.name, JSON.stringify(r)); } else if (res.error_code === 403) await env.DB.delete(k.name);
    }
    cursor = page.list_complete ? null : page.cursor;
  } while (cursor);
}

const NAMES = { innocent: 'Простодушный', everyman: 'Славный малый', hero: 'Герой', caregiver: 'Заботливый', explorer: 'Искатель', rebel: 'Бунтарь', lover: 'Любовник', creator: 'Творец', ruler: 'Правитель', magician: 'Маг', sage: 'Мудрец', jester: 'Шут' };
async function feedback(b, env, cors) {
  if (!b || b.kind !== 'archetype_feedback' || !(b.rating >= 1 && b.rating <= 5) || !b.scores) return json({ error: 'bad_request' }, 400, cors);
  if (env.BOT_TOKEN && !(await validInitData(b.initData || '', env.BOT_TOKEN))) return json({ error: 'unauthorized' }, 401, cors);
  if (!env.BOT_TOKEN || !env.ADMIN_CHAT_ID) return json({ ok: true, stored: false }, 200, cors);
  let user = '';
  try { const u = JSON.parse(new URLSearchParams(b.initData).get('user') || '{}'); user = u.username ? '@' + u.username : (u.first_name || ''); } catch {}
  const sc = Object.entries(b.scores).filter(([k]) => NAMES[k]).sort((x, y) => y[1] - x[1]).map(([k, v]) => `${NAMES[k]} ${v}`).join(', ');
  const text = `🎭 Оценка теста архетипов (v${b.v}): ${'★'.repeat(b.rating)}${'☆'.repeat(5 - b.rating)} ${b.rating}/5\n`
    + `Тест: ${NAMES[b.lead] || b.lead}` + (b.self ? `\nЧеловек считает: ${NAMES[b.self] || b.self}` : '') + (b.clarity === 'tie' ? '\nЛидер выбран уточнением (равные баллы)' : '')
    + `\n\n${sc}` + (user ? `\n\n${user}` : '');
  await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: env.ADMIN_CHAT_ID, text: text.slice(0, 4000) }) });
  return json({ ok: true }, 200, cors);
}

function json(obj, status, headers) {
  return new Response(JSON.stringify(obj), { status, headers: { ...headers, 'Content-Type': 'application/json; charset=utf-8' } });
}

/* Проверка подписи Telegram WebApp initData (core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app) */
async function validInitData(initData, botToken) {
  if (!initData) return false;
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return false;
  params.delete('hash');
  const dataCheck = [...params.entries()].map(([k, v]) => `${k}=${v}`).sort().join('\n');
  const enc = new TextEncoder();
  const hmac = async (key, data) => new Uint8Array(await crypto.subtle.sign('HMAC', await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']), enc.encode(data)));
  const secret = await hmac(enc.encode('WebAppData'), botToken);
  const sig = await hmac(secret, dataCheck);
  const hex = [...sig].map((b) => b.toString(16).padStart(2, '0')).join('');
  const authDate = +params.get('auth_date') || 0;
  return hex === hash && Date.now() / 1000 - authDate < 86400;
}
