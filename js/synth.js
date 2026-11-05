/*
 * «Кто я в блоге?» — синтез четырёх систем («Код креатора»), рейтинг форматов, энергия дня,
 * встроенные ответы на вопросы и подключение ИИ.
 */
window.VektorSynth = (function () {
  const D = window.VektorData, AR = window.VektorArchetypes, SY = window.VektorSystems, C = window.VektorConfig;
  const SRC = { chart: 'Карта', arch: 'Архетип', num: 'Нумерология', hd: 'Дизайн', extra: 'Мини-тест' };
  const S = (i) => D.SIGNS[i];

  /* P = { name, chart, bal, hd, num, arch } — любое поле может быть null */
  function coverage(P) {
    return [['chart', !!P.chart], ['arch', !!P.arch], ['num', !!P.num], ['hd', !!P.hd]];
  }

  function formula(P) {
    const f = [];
    if (P.arch) f.push({ src: 'arch', text: AR.A[P.arch.top[0]].name, glyph: AR.A[P.arch.top[0]].glyph });
    if (P.chart) f.push({ src: 'chart', text: S(P.chart.planets.sun.sign).name + ' · ' + D.ELEMENTS[P.bal.element].name, glyph: S(P.chart.planets.sun.sign).glyph });
    if (P.num) f.push({ src: 'num', text: 'Путь ' + P.num.life, glyph: String(P.num.life) });
    if (P.hd) f.push({ src: 'hd', text: SY.HD_TYPES[P.hd.type].name + ' ' + P.hd.profile, glyph: '⬡' });
    return f;
  }

  /* Рейтинг форматов — голоса всех систем */
  const HD_FMT = { generator: { series: 2, howto: 1 }, mg: { experiment: 2, reaction: 1 }, projector: { expert: 2, interview: 1 }, manifestor: { reaction: 2, experiment: 1 }, reflector: { interview: 2, mood: 1 } };
  const NUM_FMT = { 1: { reaction: 2 }, 2: { interview: 2 }, 3: { story: 2 }, 4: { howto: 2 }, 5: { experiment: 2 }, 6: { howto: 1, interview: 1 }, 7: { expert: 2 }, 8: { expert: 1, series: 1 }, 9: { story: 2 }, 11: { mood: 2 }, 22: { backstage: 2 }, 33: { howto: 2 } };
  function rankFormats(P) {
    const sc = {}; D.FORMATS.forEach((f) => (sc[f.key] = { f, s: 0, why: [] }));
    const add = (k, v, src) => { if (sc[k]) { sc[k].s += v; if (!sc[k].why.includes(src)) sc[k].why.push(src); } };
    if (P.bal) {
      const el = P.bal.elements, mo = P.bal.modes, sE = Object.values(el).reduce((a, b) => a + b, 0), sM = Object.values(mo).reduce((a, b) => a + b, 0);
      D.FORMATS.forEach((f) => { let s = 0; for (const k in f.aff) s += f.aff[k] * ((el[k] || 0) / sE + (mo[k] || 0) / sM); add(f.key, s * 1.2, 'chart'); });
    } else if (P.demoSign != null) {
      const s = S(P.demoSign); D.FORMATS.forEach((f) => add(f.key, ((f.aff[s.element] || 0) + (f.aff[s.mode] || 0)) * 0.6, 'chart'));
    }
    if (P.arch) P.arch.top.forEach((k, r) => AR.A[k].formats.forEach((fk, j) => add(fk, (3 - r) * (1.2 - j * 0.3), 'arch')));
    if (P.hd) Object.entries(HD_FMT[P.hd.type]).forEach(([k, v]) => add(k, v, 'hd'));
    if (P.num) Object.entries(NUM_FMT[P.num.life] || {}).forEach(([k, v]) => add(k, v, 'num'));
    return Object.values(sc).sort((a, b) => b.s - a.s).map((x) => Object.assign({}, x.f, { score: x.s, srcs: x.why }));
  }

  /* Код креатора: как снимать / что снимать / каким быть / ритм / ловушка */
  function code(P) {
    const B = { who: [], how: [], what: [], rhythm: [], trap: [] };
    const a = P.arch ? AR.A[P.arch.top[0]] : null, a2 = P.arch ? AR.A[P.arch.top[1]] : null;
    const n = P.num ? SY.NUM[P.num.life] : null;
    const t = P.hd ? SY.HD_TYPES[P.hd.type] : null;
    if (a) {
      B.who.push({ src: 'arch', text: a.inFrame });
      B.how.push({ src: 'arch', text: a.shoot });
      B.how.push({ src: 'arch', text: 'Кино-референс: ' + a.films + '.' });
      B.what.push({ src: 'arch', text: 'Темы архетипа ' + (a.gen || a.name) + ': ' + a.topics.join(', ').toLowerCase() + '.' });
      if (a2) B.what.push({ src: 'arch', text: `Второй архетип — ${a2.name}: добавь ${a2.topics[0].toLowerCase()} и ${a2.topics[1].toLowerCase()}.` });
      B.trap.push({ src: 'arch', text: a.shadow });
    }
    if (P.chart) {
      const showSign = P.chart.asc ? P.chart.asc.sign : P.chart.planets.sun.sign;
      B.who.push({ src: 'chart', text: S(showSign).show + ' ' + S(P.chart.planets.venus.sign).aesthetic });
      if (!a) B.how.push({ src: 'chart', text: D.LOOK[P.bal.element] });
      B.rhythm.push({ src: 'chart', text: D.MODES[P.bal.mode].text });
      B.trap.push({ src: 'chart', text: S(P.chart.planets.saturn.sign).brake });
    }
    if (n) {
      B.what.push({ src: 'num', text: `Число пути ${P.num.life} — «${n.title}»: ${n.content}.` });
      B.who.push({ src: 'num', text: `Тон голоса: ${n.tone}.` });
      B.trap.push({ src: 'num', text: 'Ловушка числа: ' + n.trap + '.' });
    }
    if (t) {
      B.rhythm.push({ src: 'hd', text: `${t.name}, стратегия «${t.strategy}». ${t.content}` });
      B.rhythm.push({ src: 'hd', text: 'Решения: ' + SY.HD_AUTH[P.hd.authority][1] });
      B.trap.push({ src: 'hd', text: t.trap });
      if (P.hd.defined.includes('throat')) B.who.push({ src: 'hd', text: SY.HD_CENTER_TIPS.throat });
    }
    return B;
  }

  /* «Таблетка» — три правила в одну строку каждое */
  function pill(P) {
    const r = [];
    const a = P.arch ? AR.A[P.arch.top[0]] : null;
    const fmts = rankFormats(P);
    if (a) r.push({ k: 'Каким быть', v: a.inFrame.split('.')[0] + '.' });
    else if (P.chart) r.push({ k: 'Каким быть', v: S(P.chart.asc ? P.chart.asc.sign : P.chart.planets.sun.sign).show });
    r.push({ k: 'Что снимать', v: `${fmts[0].name} и ${fmts[1].name.toLowerCase()}` + (P.num ? ` — про ${SY.NUM[P.num.life].content.split(',')[0]}.` : '.') });
    if (a) r.push({ k: 'Как снимать', v: a.shoot.split('.')[0] + '.' });
    else if (P.bal) r.push({ k: 'Как снимать', v: D.LOOK[P.bal.element] });
    if (P.hd) r.push({ k: 'Ритм', v: SY.HD_TYPES[P.hd.type].strategy + '. ' + SY.HD_AUTH[P.hd.authority][1].split(':')[0].split('.')[0] + '.' });
    return r;
  }

  /* Энергия дня: личный день + Луна сегодня */
  function today(P, now) {
    now = now || new Date();
    let moon = null;
    try { moon = Math.floor((((window.Astronomy.EclipticGeoMoon(now).lon % 360) + 360) % 360) / 30); } catch (e) {}
    const MOON_TIP = {
      fire: 'Луна в огненном знаке — день для энергичных форматов: вызов, реакция, движение в кадре.',
      earth: 'Луна в земном знаке — день для пользы: инструкция, процесс, результат крупно.',
      air: 'Луна в воздушном знаке — день для слов: разговорный ролик, ответы на вопросы, коллаборация.',
      water: 'Луна в водном знаке — день для атмосферы и личных историй: тёплый свет, музыка, чувства.',
    };
    const out = { date: now, moon, tips: [] };
    if (moon != null) out.tips.push({ src: 'chart', text: `Луна сегодня в знаке ${S(moon).name}. ` + MOON_TIP[S(moon).element] });
    if (P.num) { out.pDay = P.num.pDay; out.tips.push({ src: 'num', text: `Твой личный день ${P.num.pDay}. ` + SY.NUM[P.num.pDay].day }); }
    return out;
  }

  /* ---------- встроенные ответы (без ИИ) ---------- */
  const INTENTS = [
    ['block', /не могу|страш|боюсь|лень|прокраст|выгор|мотивац|начать|стесня|откладыва|нет сил|устал/i],
    ['money', /прода|монетиз|деньг|запуск|продукт|курс|клиент|заработ|доход/i],
    ['who', /каким.{0,8}быть|какой.{0,8}быть|в кадре|образ|подач|голос|одежд|харизм|говорить|вести себя/i],
    ['how', /как.{0,8}снима|свет|камер|картинк|стиль|визуал|монтаж|ракурс|цвет|кадр/i],
    ['format', /формат|рилс|reels|видео какое|шортс|сторис/i],
    ['niche', /ниш|о чём блог|о чем блог|тема блога|позиционир|кто я/i],
    ['what', /что.{0,8}сня|что.{0,8}снима|идеи|о чём|о чем|тема|темы|контент/i],
    ['when', /когда|сегодня|завтра|какой день|что за день/i],
  ];
  function intent(q) { for (const [k, re] of INTENTS) if (re.test(q)) return k; return 'general'; }
  const bullets = (arr) => arr.map((x) => '• ' + x.text + ` [${SRC[x.src]}]`).join('\n');

  function localAnswer(P, q) {
    const B = code(P), k = intent(q), fm = rankFormats(P), a = P.arch ? AR.A[P.arch.top[0]] : null;
    const missing = coverage(P).filter((x) => !x[1]).map((x) => SRC[x[0]]);
    let body = '', act = '';
    switch (k) {
      case 'how': body = 'Как тебе снимать:\n' + bullets(B.how.length ? B.how : [{ src: 'chart', text: D.LOOK[(P.bal && P.bal.element) || 'water'] }]); act = 'Сними один и тот же 10-секундный кадр в двух вариантах света и сравни — какой больше похож на тебя.'; break;
      case 'who': body = 'Каким быть в кадре:\n' + bullets(B.who); act = 'Запиши 3 дубля одной фразы: спокойно, энергично и с юмором. Оставь тот, где ты узнаёшь себя.'; break;
      case 'block': body = 'Что может тормозить и как с этим быть:\n' + bullets(B.trap) + (P.hd ? `\n\nТвоя опора: ${SY.HD_AUTH[P.hd.authority][1]}` : ''); act = 'Поставь таймер на 15 минут и сними черновик без права на монтаж. Готово лучше идеального.'; break;
      case 'format': body = 'Форматы, которые стоит проверить первыми:\n' + fm.slice(0, 3).map((f) => `• ${f.name}. ${f.test}`).join('\n'); act = `Сними «${fm[0].name}» на этой неделе и сравни досмотры с обычными роликами.`; break;
      case 'niche': body = 'Где твоя естественная ниша:\n' + bullets(B.what.concat(P.chart ? [{ src: 'chart', text: S(P.chart.planets.sun.sign).core }] : [])); act = 'Выпиши 10 тем, о которых ты можешь говорить час без подготовки. Пересечение с этим списком — твоя ниша.'; break;
      case 'money': body = 'Как тебе естественнее продавать:\n' + bullets([].concat(P.hd ? [{ src: 'hd', text: SY.HD_TYPES[P.hd.type].content }] : [], P.num ? [{ src: 'num', text: 'Роль: ' + SY.NUM[P.num.life].role + '.' }] : [], a ? [{ src: 'arch', text: `${a.name} продаёт через: ${a.essence.toLowerCase()}` }] : [])); act = 'Сделай один пост с мягким предложением и кодовым словом — и посчитай, сколько людей написали.'; break;
      case 'when': { const t = today(P); body = 'Энергия сегодня:\n' + bullets(t.tips) + (P.num ? `\n\nГод: ${SY.YEAR[P.num.pYear]}` : ''); act = 'Сними сегодня один ролик в формате, который подсказывает день.'; break; }
      case 'what': body = 'Что тебе снимать:\n' + bullets(B.what) + '\n\nФорматы: ' + fm.slice(0, 3).map((f) => f.name).join(', ') + '.'; act = a ? `Возьми хук «${a.hooks[0]}» и адаптируй его под свою тему.` : 'Открой «Идеи» и получи 5 идей под свою нишу.'; break;
      default: body = 'Твой код в трёх правилах:\n' + pill(P).map((r) => `• ${r.k}: ${r.v}`).join('\n'); act = 'Выбери одно правило и примени его в ближайшем ролике.';
    }
    if (missing.length) body += `\n\nОтвет станет точнее, если добавить: ${missing.join(', ')}.`;
    return body + '\n\n→ Действие: ' + act;
  }

  /* ---------- ИИ ---------- */
  function profileText(P) {
    const L = [];
    if (P.name) L.push('Имя: ' + P.name);
    if (P.chart) {
      const p = P.chart.planets;
      L.push(`Натальная карта: Солнце ${S(p.sun.sign).name}, Луна ${S(p.moon.sign).name}, Меркурий ${S(p.mercury.sign).name}, Венера ${S(p.venus.sign).name}, Марс ${S(p.mars.sign).name}, Сатурн ${S(p.saturn.sign).name}` + (P.chart.asc ? `, Асцендент ${S(P.chart.asc.sign).name}` : ', время рождения неизвестно') + `. Ведущая стихия: ${D.ELEMENTS[P.bal.element].name}, крест: ${D.MODES[P.bal.mode].name}.`);
    }
    if (P.arch) L.push(`Архетипы (баллы из ${AR.MAX}): ` + P.arch.ranked.slice(0, 5).map((k) => `${AR.A[k].name} ${P.arch.scores[k]}`).join(', ') + `. Активная зона (24+): ${P.arch.active.map((k) => AR.A[k].name).join(', ') || 'нет'}. Ведущий — ${AR.A[P.arch.ranked[0]].name} (${({ strong: 'ярко выражен', clear: 'выражен, рядом близкие', tie: 'равен по баллам с другими, выбран в уточнении' })[P.arch.clarity]}), мотивация — ${AR.DRIVES[P.arch.drive].name}.`);
    if (P.num) L.push(`Нумерология: число пути ${P.num.life} (${SY.NUM[P.num.life].title})` + (P.num.expression ? `, число выражения ${P.num.expression}` : '') + (P.num.soul ? `, число души ${P.num.soul}` : '') + `, личный год ${P.num.pYear}, личный день ${P.num.pDay}.`);
    if (P.hd) L.push(`Дизайн человека: ${SY.HD_TYPES[P.hd.type].name}, стратегия «${SY.HD_TYPES[P.hd.type].strategy}», авторитет ${SY.HD_AUTH[P.hd.authority][0]}, профиль ${P.hd.profile}, определённые центры: ${P.hd.defined.map((c) => window.VektorHD.CENTERS[c].name).join(', ') || 'нет'}.`);
    if (P.niche) L.push('Ниша блога: ' + P.niche);
    return L.join('\n');
  }
  function systemPrompt(P) {
    return `Ты — наставник приложения «${(window.VektorConfig || {}).appName || 'Кто я в блоге?'}», для блогеров и креаторов. Ты объединяешь натальную карту, архетипы Юнга–Пирсон, нумерологию и Дизайн человека, чтобы ответить человеку: что снимать, как снимать и каким быть в кадре.
Профиль человека:
${profileText(P)}

Правила ответа:
- Пиши по-русски, на «ты», живо и вдохновляюще, но конкретно. 90–160 слов.
- Связывай совет минимум с двумя системами профиля и называй их коротко в скобках, например (архетип Герой, Генератор).
- Давай практику: конкретные темы, приёмы съёмки, свет, ракурс, подачу, хуки.
- Формулировки мягкие: «может подойти», «попробуй». Не предсказывай судьбу, здоровье, деньги и отношения; не давай медицинских, юридических и финансовых советов.
- Если вопрос не про контент и самореализацию — мягко верни к этим темам.
- Заканчивай строкой «→ Действие: …» с одним шагом, который можно сделать сегодня.`;
  }

  let samplePromise = null;
  function getSample() {
    if (!samplePromise && window.claude && window.claude.use) samplePromise = window.claude.use('sample').catch(() => null);
    return samplePromise || Promise.resolve(null);
  }
  /** history: [{role:'user'|'assistant', content}] — последний элемент от пользователя. */
  async function ask(P, history, onText) {
    const q = history[history.length - 1].content;
    const sys = systemPrompt(P);
    const sample = await getSample();
    if (sample) {
      try {
        const msgs = history.slice(-8).map((m, i, arr) => ({ role: m.role, content: i === arr.length - 1 && m.role === 'user' ? sys + '\n\nВопрос: ' + m.content : m.content }));
        if (msgs[0].role !== 'user') msgs.shift();
        const r = await sample(msgs, { onText: ({ text }) => onText && onText(text), cache: false });
        return { text: r.text, source: 'ai' };
      } catch (e) { if (e && e.code === 'rate_limited') return { text: localAnswer(P, q), source: 'local', note: 'ИИ временно занят — вот базовый ответ.' }; }
    }
    if (C.aiEndpoint) {
      try {
        const res = await fetch(C.aiEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ system: sys, messages: history.slice(-8), initData: (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData) || '' }) });
        if (res.ok) { const j = await res.json(); if (j.text) return { text: j.text, source: 'ai' }; }
      } catch (e) {}
    }
    return { text: localAnswer(P, q), source: 'local' };
  }

  /** Одиночный запрос к ИИ (для движка хуков): sample в демо → воркер → null. */
  async function complete(prompt, maxTokens) {
    const sample = await getSample();
    if (sample) { try { const r = await sample([{ role: 'user', content: prompt }], { cache: false }); return r.text; } catch (e) { if (!C.aiEndpoint) return null; } }
    if (C.aiEndpoint) {
      try { const res = await fetch(C.aiEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ system: 'Ты — «Движок хуков». Следуй ТЗ из сообщения пользователя.', messages: [{ role: 'user', content: prompt }], maxTokens: maxTokens || 2600, initData: (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData) || '' }) }); if (res.ok) { const j = await res.json(); return j.text || null; } } catch (e) {}
    }
    return null;
  }
  async function aiStatus() { if (await getSample()) return 'claude'; return C.aiEndpoint ? 'endpoint' : 'local'; }

  return { aiStatus, complete, SRC, coverage, formula, rankFormats, code, pill, today, localAnswer, ask, intent, profileText };
})();
