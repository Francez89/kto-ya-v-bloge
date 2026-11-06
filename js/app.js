/* «Кто я в блоге?» — агрегатор: натальная карта + архетипы + нумерология + Дизайн человека → код креатора и ответы на вопросы. */
(function () {
  const D = window.VektorData, X = window.VektorAstro, C = window.VektorConfig;
  const AR = window.VektorArchetypes, SY = window.VektorSystems, HD = window.VektorHD, SN = window.VektorSynth;
  const tg = window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData ? window.Telegram.WebApp : null;
  const tgv = (v) => !!(tg && tg.isVersionAtLeast && tg.isVersionAtLeast(v));
  const $app = document.getElementById('app'), $tabs = document.getElementById('tabbar'), $toast = document.getElementById('toast');
  const KEY = 'vektor:v2';

  /* ---------- utils ---------- */
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const G = (s) => s + '︎';
  const S = (i) => D.SIGNS[i];
  const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
  const fmtDeg = (d) => `${Math.floor(d)}°${String(Math.floor((d % 1) * 60)).padStart(2, '0')}′`;
  const uid = () => Math.random().toString(36).slice(2, 9);
  const haptic = (t = 'light') => { try { if (tgv('6.1')) tg.HapticFeedback.impactOccurred(t); } catch (e) {} };
  let toastT;
  function toast(msg) { $toast.textContent = msg; $toast.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => $toast.classList.remove('show'), 1800); }
  function copy(text) {
    const done = () => { toast('Скопировано'); haptic(); };
    const fallback = () => { const t = document.createElement('textarea'); t.value = text; t.style.position = 'fixed'; t.style.opacity = '0'; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); done(); } catch (e) { toast('Не удалось скопировать'); } t.remove(); };
    try { if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, fallback); else fallback(); } catch (e) { fallback(); }
  }
  function openLink(url) {
    if (!url) return;
    if (tg && /^https:\/\/t\.me\//.test(url)) tg.openTelegramLink(url); else if (tg) tg.openLink(url); else window.open(url, '_blank', 'noopener');
  }
  function rng(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
  const srcChip = (src) => `<span class="src src-${src}">${SN.SRC[src]}</span>`;

  /* ---------- state ---------- */
  const fresh = () => ({ v: 2, onboarded: false, goal: null, profile: null, demoSign: null, archAnswers: [], archIndex: 0, archPicks: [], archFeedback: null, archVersion: AR.VERSION, check: {}, bioForm: { offer: 'guide', code: 'ГАЙД' }, hookSeed: 1, mini: {}, stats: { firstSeen: Date.now(), copies: 0, ideas: 0, hooks: 0 }, saved: [], plan: null, ideaForm: { niche: '', audience: '', platform: 'Reels', goal: 'trust', freq: '3 в неделю' }, ideas: [], ideaSeed: 1, chat: [] });
  let state = fresh();
  try { const raw = localStorage.getItem(KEY); if (raw) state = Object.assign(fresh(), JSON.parse(raw)); } catch (e) {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} };
  if (!state.stats) state.stats = { firstSeen: Date.now(), copies: 0, ideas: 0, hooks: 0 };
  if (!state.mini || typeof state.mini !== 'object') state.mini = {};
  if (!state.stats || typeof state.stats !== 'object') state.stats = { firstSeen: Date.now(), copies: 0, ideas: 0, hooks: 0 };
  // защита от старых или повреждённых сохранений
  if (state.plan && (!Array.isArray(state.plan.items) || !D.PLANS[state.plan.goal])) state.plan = null;
  if (state.plan && !Array.isArray(state.plan.extra)) state.plan.extra = [];
  if (state.plan) { state.plan.items = state.plan.items.filter((x) => x && typeof x.text === 'string'); state.plan.extra = state.plan.extra.filter((x) => x && typeof x.text === 'string'); }
  if (!Array.isArray(state.saved)) state.saved = []; else state.saved = state.saved.filter((x) => x && typeof x === 'object');
  if (!Array.isArray(state.ideas)) state.ideas = [];
  if (!Array.isArray(state.chat)) state.chat = [];
  if (!state.ideaForm || typeof state.ideaForm !== 'object') state.ideaForm = { niche: '', audience: '', platform: 'Reels', goal: 'trust', freq: '3 в неделю' };
  if (state.profile && (!state.profile.date || !/^\d{4}-\d{2}-\d{2}$/.test(state.profile.date))) state.profile = null;
  { const EX = window.VektorExtras; if (state.mini.percRes && !EX.PERCEPTION.result[state.mini.percRes]) state.mini.percRes = null; if (state.mini.colorRes && !EX.COLORTYPE.season[state.mini.colorRes]) state.mini.colorRes = null; }
  if (state.mini.chronoRes != null && !(state.mini.chronoRes >= 0 && state.mini.chronoRes <= 2)) state.mini.chronoRes = null;
  if (!state.bioForm || !state.bioForm.offer) state.bioForm = Object.assign({ offer: 'guide', code: 'ГАЙД' }, state.bioForm || {});
  if (state.archVersion !== AR.VERSION) { state.archAnswers = []; state.archIndex = 0; state.archPicks = []; state.archFeedback = null; state.archVersion = AR.VERSION; save(); } // старый тест на 48 вопросов несовместим

  let chart = null, bal = null, hd = null, num = null, arch = null, chartError = null;
  const archAllAnswered = () => AR.QUESTIONS.every((_, i) => state.archAnswers[i]);
  function recompute() {
    chart = bal = hd = num = arch = chartError = null;
    if (state.profile) {
      try { chart = X.calcChart(state.profile); bal = X.balance(chart); } catch (e) { chartError = e.message || String(e); }
      try { num = SY.numerology(state.profile.date, state.profile.name); } catch (e) {}
      if (chart && chart.timeKnown) { try { hd = HD.calcDesign(new Date(chart.utc)); } catch (e) {} }
    }
    if (archAllAnswered() && !AR.nextClarify(state.archAnswers, state.archPicks)) arch = AR.score(state.archAnswers, state.archPicks);
  }
  recompute();
  const P = () => ({ name: state.profile && state.profile.name, niche: state.profile && state.profile.niche || state.ideaForm.niche, chart, bal, hd, num, arch, demoSign: chart ? null : state.demoSign });
  const nSystems = () => [chart, arch, num, hd].filter(Boolean).length;

  /* ---------- portrait cards (натальная карта) ---------- */
  const WEAK = {
    fire: 'Огня в карте меньше всего — стартовать может быть сложнее, помогают внешние дедлайны.',
    earth: 'Земли в карте меньше всего — пригодится простой регламент: когда снимаешь и когда публикуешь.',
    air: 'Воздуха в карте меньше всего — проговаривай идеи вслух или с кем-то, прежде чем снимать.',
    water: 'Воды в карте меньше всего — добавь в контент личного: зрителю важно чувствовать тебя.',
  };
  const cardsCache = {};
  function buildCards() {
    if (!chart) return [];
    const p = chart.planets, el = (i) => S(i).element;
    const signName = (pl) => (pl.uncertain ? pl.uncertain.map((i) => S(i).name).join(' / ') : S(pl.sign).name);
    const showSign = chart.asc ? chart.asc.sign : p.sun.sign, exSign = chart.asc ? showSign : p.venus.sign;
    const cards = {
      core: { title: 'Что тебя ведёт', factor: `Солнце в знаке ${signName(p.sun)}`, lead: S(p.sun.sign).core, ex: D.BY_ELEMENT.show[el(p.sun.sign)][0], act: D.BY_ELEMENT.show[el(p.sun.sign)][1] },
      show: { title: 'Твой стиль проявления', factor: `${chart.asc ? 'Асцендент' : 'Солнце'} в знаке ${S(showSign).name} + Венера в знаке ${S(p.venus.sign).name}`, lead: S(showSign).show + ' ' + S(p.venus.sign).aesthetic, ex: D.BY_ELEMENT.show[el(exSign)][0], act: D.BY_ELEMENT.show[el(exSign)][1] },
      think: { title: 'Как я думаю', factor: `Меркурий в знаке ${S(p.mercury.sign).name}`, lead: S(p.mercury.sign).think, ex: D.BY_ELEMENT.think[el(p.mercury.sign)][0], act: D.BY_ELEMENT.think[el(p.mercury.sign)][1] },
      decide: { title: 'Как принимаю решения', factor: `Марс в знаке ${S(p.mars.sign).name}`, lead: S(p.mars.sign).decide, ex: D.BY_ELEMENT.decide[el(p.mars.sign)][0], act: D.BY_ELEMENT.decide[el(p.mars.sign)][1] },
      energy: { title: 'Что меня заряжает', factor: `Луна в знаке ${signName(p.moon)}`, lead: p.moon.uncertain ? p.moon.uncertain.map((i) => S(i).energy).join(' Или: ') : S(p.moon.sign).energy, ex: D.BY_ELEMENT.energy[el(p.moon.sign)][0], act: D.BY_ELEMENT.energy[el(p.moon.sign)][1] },
      brake: { title: 'Что меня тормозит', factor: `Сатурн в знаке ${S(p.saturn.sign).name} + баланс стихий`, lead: S(p.saturn.sign).brake + ' ' + WEAK[bal.weakElement], ex: D.BY_ELEMENT.brake[el(p.saturn.sign)][0], act: D.BY_ELEMENT.brake[el(p.saturn.sign)][1] },
      work: { title: 'Как мне удобнее работать', factor: `Стихия: ${D.ELEMENTS[bal.element].name} · крест: ${D.MODES[bal.mode].name.toLowerCase()}`, lead: `Больше всего в карте — ${D.ELEMENTS[bal.element].short}: ${D.ELEMENTS[bal.element].vibe}. ${D.MODES[bal.mode].text}`, ex: D.BY_ELEMENT.work[bal.element][0], act: D.BY_ELEMENT.work[bal.element][1] },
    };
    return ['show', 'core', 'work', 'think', 'brake', 'energy', 'decide'].map((k) => Object.assign({ id: 'p:' + k, kind: 'insight' }, cards[k]));
  }

  /** Точки карты для экранов: планеты, узел, асцендент, MC. */
  function natalPoints() {
    if (!chart) return [];
    const p = chart.planets, out = [];
    const add = (k, o) => out.push({ k, lon: o.lon, sign: o.sign, deg: o.deg, retro: !!o.retro, uncertain: o.uncertain, house: chart.houses && chart.houses[k] ? chart.houses[k] : null });
    ['sun', 'moon'].forEach((k) => add(k, p[k]));
    if (chart.asc) out.push({ k: 'asc', lon: chart.asc.lon, sign: chart.asc.sign, deg: chart.asc.deg, house: null });
    ['mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'node'].forEach((k) => p[k] && add(k, p[k]));
    if (chart.mc) out.push({ k: 'mc', lon: chart.mc.lon, sign: chart.mc.sign, deg: chart.mc.deg, house: null });
    return out;
  }
  /** Круг карты: знаки, куспиды, планеты. Асцендент слева, как рисуют астрологи. Планеты кликабельны. */
  function natalWheel(pts) {
    const C0 = 160, R1 = 150, R2 = 122, R3 = 62, base = chart.asc ? chart.asc.lon : 0;
    const ang = (lon) => ((180 - (lon - base)) * Math.PI) / 180;
    const xy = (lon, r) => [C0 + r * Math.cos(ang(lon)), C0 - r * Math.sin(ang(lon))];
    const ELC = { fire: '#FF7A45', earth: '#9BC27A', air: '#8EC5FF', water: '#7C8CFF' };
    let svg = '';
    const arcPts = (a0, a1, r) => { const out = []; for (let k = 0; k <= 8; k++) out.push(xy(a0 + ((a1 - a0) * k) / 8, r).map((v) => v.toFixed(1)).join(' ')); return out; };
    for (let i = 0; i < 12; i++) {
      const a0 = i * 30, a1 = a0 + 30, el = S(i).element;
      const pts2 = arcPts(a0, a1, R1).concat(arcPts(a1, a0, R2));
      svg += `<path d="M${pts2.join(' L')}Z" fill="${ELC[el]}" fill-opacity=".16" stroke="rgba(255,255,255,.12)" class="wseg" style="--i:${i}"/>`;
      const [gx, gy] = xy(a0 + 15, (R1 + R2) / 2);
      svg += `<text x="${gx}" y="${gy}" class="wsign" fill="${ELC[el]}">${S(i).glyph}&#xFE0E;</text>`;
    }
    if (chart.cusps) chart.cusps.forEach((c, i) => { const [a1, b1] = xy(c, R2), [a2, b2] = xy(c, R3); const major = i % 3 === 0; svg += `<line x1="${a1}" y1="${b1}" x2="${a2}" y2="${b2}" stroke="${major ? 'rgba(255,181,71,.7)' : 'rgba(255,255,255,.14)'}" stroke-width="${major ? 1.4 : 0.8}"/>`; const nx = (c + ((chart.cusps[(i + 1) % 12] - c + 360) % 360) / 2); const [tx, ty] = xy(nx, R3 + 9); svg += `<text x="${tx}" y="${ty}" class="whouse">${i + 1}</text>`; });
    svg += `<circle cx="${C0}" cy="${C0}" r="${R2}" fill="none" stroke="rgba(255,255,255,.16)"/><circle cx="${C0}" cy="${C0}" r="${R3}" fill="rgba(0,0,0,.18)" stroke="rgba(255,255,255,.1)"/>`;
    // планеты с разведением наложений
    const list = pts.filter((x) => x.k !== 'asc' && x.k !== 'mc').map((x) => ({ x, d: x.lon })).sort((a, b) => a.d - b.d);
    // раскладка без наложений: развернуть круг по самому большому разрыву, собрать скопления, разнести их
    const MIN = 15;
    if (list.length > 1) {
      let gi = 0, gmax = -1; list.forEach((it, j) => { const n = list[(j + 1) % list.length]; const g = (n.d - it.d + 360) % 360; if (g > gmax) { gmax = g; gi = j; } });
      const seq = list.slice(gi + 1).concat(list.slice(0, gi + 1)); let base0 = seq[0].d; seq.forEach((it) => { it.u = (it.d - base0 + 360) % 360; });
      let cl = seq.map((it) => ({ items: [it], c: it.u }));
      const span = (c) => (c.items.length - 1) * (MIN / 2);
      for (let it = 0; it < 50; it++) {
        let merged = false;
        for (let j = 0; j < cl.length - 1; j++) { const A0 = cl[j], B0 = cl[j + 1]; if (B0.c - span(B0) / 2 - (A0.c + span(A0) / 2) < MIN / 2) { const items = A0.items.concat(B0.items); cl.splice(j, 2, { items, c: items.reduce((x, y) => x + y.u, 0) / items.length }); merged = true; break; } }
        if (!merged) break;
      }
      cl.forEach((c) => { const n = c.items.length; c.items.forEach((it, k) => { it.d = base0 + c.c + (k - (n - 1) / 2) * (MIN / 2); it.r = n > 1 ? (k % 2 ? 79 : 104) : 104; }); });
    } else list.forEach((it) => { it.r = 104; });
    list.forEach(({ x, d, r }, j) => { const [px, py] = xy(d, r), [lx, ly] = xy(x.lon, R2 - 2), [mx, my] = xy(d, r + 11); svg += `<g class="wpl" data-a="go" data-v="planet" data-k="${x.k}" style="--i:${j}"><line x1="${lx}" y1="${ly}" x2="${mx}" y2="${my}" stroke="rgba(255,255,255,.3)"/><circle cx="${px}" cy="${py}" r="10" class="wdot"/><text x="${px}" y="${py}" class="wglyph">${window.VektorNatal.POINT[x.k].glyph}&#xFE0E;</text></g>`; });
    if (chart.asc) { const [ax, ay] = xy(chart.asc.lon, R1 + 6); svg += `<g class="wpl" data-a="go" data-v="planet" data-k="asc"><text x="${ax - 4}" y="${ay}" class="wangle">ASC</text></g>`; const [mx, my] = xy(chart.mc.lon, R1 + 7); svg += `<g class="wpl" data-a="go" data-v="planet" data-k="mc"><text x="${mx}" y="${my - 2}" class="wangle">MC</text></g>`; }
    return `<svg viewBox="-12 -12 344 344" class="wheel" role="img" aria-label="Натальная карта">${svg}</svg>`;
  }

  /* ---------- plan ---------- */
  function ensurePlan(force) {
    const goal = state.goal || 'blog';
    if (state.plan && state.plan.goal === goal && !force) return;
    const r = SN.rankFormats(P());
    state.plan = { goal, start: Date.now(), items: D.PLANS[goal].map((t) => ({ text: t.replace('{fmt}', r[0].name).replace('{fmt2}', r[1].name), done: false })), extra: (state.plan && state.plan.extra) || [] };
    save();
  }
  const nextStep = () => { if (!state.plan) return null; const all = state.plan.items.concat(state.plan.extra); const i = all.findIndex((x) => !x.done); return i < 0 ? null : { i, item: all[i], day: i < 7 ? i + 1 : null }; };

  /* ---------- ideas ---------- */
  const durationFor = (p) => ({ Reels: '25–35 с', TikTok: '20–40 с', Shorts: '30–45 с', Telegram: 'кружок до 60 с + пост', YouTube: 'Shorts 45 с или видео 6–8 мин' }[p] || '30 с');
  function storyboard(idea) {
    const tpl = D.SHOTS[idea.fmt] || D.SHOTS.default;
    const texts = [idea.title, idea.beats[0], idea.beats[1], idea.beats[2], idea.cta], secs = [3, 6, 7, 8, 6];
    return tpl.map((s, i) => ({ n: i + 1, sec: secs[i], size: s[0], move: s[1], action: s[2], text: texts[i], sound: s[3], props: s[4] }));
  }
  const ideaText = (i) => `${i.title}\nФормат: ${i.fmtName} · ${i.platform}\n\n${i.beats.map((b, k) => `${k + 1}. ${b}`).join('\n')}\n\nCTA: ${i.cta}`;
  const cardText = (c) => `${c.title}\n${c.lead}\n\nПример: ${c.ex}\nПопробуй: ${c.act}\n\n— ${C.appName}`;
  const findIdea = (id) => state.ideas.find((x) => x.id === id) || state.saved.find((x) => x.id === id);
  const isSaved = (id) => state.saved.some((x) => x.id === id);

  /* ---------- router ---------- */
  let stack = [], route = { name: 'welcome', params: {} };
  let GROW = null;
  const TABS = [['code', '✦', 'Код'], ['systems', '◎', 'Системы'], ['ask', '✎', 'Спросить'], ['content', '▶', 'Контент'], ['profile', '○', 'Профиль']];
  const NO_TABS = ['welcome', 'goal', 'start', 'demo', 'birth', 'archTest', 'archIntro', 'mini', 'fearQuiz'];
  function go(name, params, replace) { if (!replace) stack.push(route); route = { name, params: params || {} }; render(true); }
  function tab(name) { stack = []; route = { name, params: {} }; haptic(); render(true); }
  function back() { if (stack.length) { route = stack.pop(); render(true); } }
  const afterRender = {};
  function render(scrollTop) {
    if (GROW) GROW.leave();
    const fn = screens[route.name] || screens.code;
    const backLink = !tg && stack.length && route.name !== 'archTest' ? '<button class="linkbtn" data-a="back" style="margin:-6px 0 6px;text-decoration:none">← Назад</button>' : '';
    let html;
    try { html = fn(route.params); }
    catch (e) {
      console.error('screen ' + route.name, e);
      html = `<div class="stack-lg">${head('Ошибка экрана', 'Этот экран не открылся', 'Остальные разделы работают. Скриншот этого сообщения поможет быстро исправить.')}<div class="card stack"><p class="dim">Экран: ${esc(route.name)}<br>${esc(String(e && e.message || e))}</p></div><button class="btn" data-a="tab" data-v="code">К коду креатора</button></div>`;
    }
    $app.innerHTML = `<section class="screen">${backLink}${html}</section>`;
    const showTabs = state.onboarded && !NO_TABS.includes(route.name);
    $tabs.hidden = !showTabs; $app.classList.toggle('no-tabs', !showTabs);
    const active = (stack[0] || route).name;
    $tabs.innerHTML = TABS.map(([k, i, l]) => `<button data-a="tab" data-v="${k}" class="${active === k ? 'on' : ''}"><span class="i">${G(i)}</span>${l}</button>`).join('');
    if (tg && tgv('6.1')) { if (stack.length) tg.BackButton.show(); else tg.BackButton.hide(); }
    if (scrollTop) window.scrollTo(0, 0);
    try { if (afterRender[route.name]) afterRender[route.name](route.params); } catch (e) { console.error(e); }
  }

  /* ---------- components ---------- */
  function insightCard(c) {
    cardsCache[c.id] = c;
    return `<article class="card insight">
      <div class="top"><div><div class="factor">${esc(c.factor)}</div><h2 style="margin-top:6px">${esc(c.title)}</h2></div>
        <button class="iconbtn ${isSaved(c.id) ? 'on' : ''}" data-a="saveCard" data-id="${c.id}" aria-label="Сохранить">${isSaved(c.id) ? '★' : '☆'}</button></div>
      <p class="lead">${esc(c.lead)}</p><p class="ex">${esc(c.ex)}</p>
      <div class="act"><b>Попробуй</b>${esc(c.act)}</div>
      <div class="row"><button class="btn sm" data-a="tryAct" data-id="${c.id}">Попробовать</button><button class="btn sm ghost" data-a="copyCard" data-id="${c.id}">Скопировать</button></div>
    </article>`;
  }
  function ideaCard(i) {
    return `<article class="card stack">
      <div class="row between"><span class="eyebrow">${esc(i.fmtName)} · ${esc(i.platform)}</span>
        <button class="iconbtn ${isSaved(i.id) ? 'on' : ''}" data-a="saveIdea" data-id="${i.id}" aria-label="Сохранить">${isSaved(i.id) ? '★' : '☆'}</button></div>
      <h3 class="idea-t">${esc(i.title)}</h3>
      <ol class="steps">${i.beats.map((b) => `<li>${esc(b)}</li>`).join('')}</ol>
      ${i.alt ? `<p class="dim">Альтернативный хук: ${esc(i.alt)}</p>` : ''}
      <p class="dim">CTA: ${esc(i.cta)} · ${esc(durationFor(i.platform))}</p>
      <div class="row"><button class="btn sm" data-a="board" data-id="${i.id}">Раскадровка</button><button class="btn sm ghost" data-a="copyIdea" data-id="${i.id}">Скопировать</button></div>
    </article>`;
  }
  const disclaimer = `<p class="disclaimer">Астрология, архетипы, нумерология и Дизайн человека здесь — инструменты саморефлексии и вдохновения, а не научная диагностика. Проверяй советы на практике и оставляй то, что работает у тебя.</p>`;
  const head = (eyebrow, title, sub) => `<header class="head">${eyebrow ? `<span class="eyebrow">${eyebrow}</span>` : ''}<h1>${title}</h1>${sub ? `<p>${sub}</p>` : ''}</header>`;
  const needProfile = (what) => `<div class="card empty"><div class="ic">${G('✦')}</div><p style="margin-bottom:16px">${what}</p><button class="btn" data-a="go" data-v="birth">Ввести данные рождения</button></div>`;
  const userName = () => (state.profile && state.profile.name ? state.profile.name.split(' ')[0] : tg && tg.initDataUnsafe && tg.initDataUnsafe.user ? tg.initDataUnsafe.user.first_name : '');

  function radar(scores) {
    const keys = AR.ORDER, n = keys.length, R = 110, cx = 150, cy = 140;
    const pt = (i, r) => { const a = -Math.PI / 2 + (i * 2 * Math.PI) / n; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; };
    const rings = [0.25, 0.5, 0.75, 1].map((k) => `<polygon points="${keys.map((_, i) => pt(i, R * k).join(',')).join(' ')}" fill="none" stroke="var(--line)" />`).join('');
    const poly = keys.map((k, i) => pt(i, R * Math.max(0.04, (scores[k] - AR.PER) / (AR.MAX - AR.PER))).join(',')).join(' ');
    const top = arch.top;
    const labels = keys.map((k, i) => { const [x, y] = pt(i, R + 22); const on = top.includes(k); return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="middle" dominant-baseline="middle" font-size="10.5" font-weight="${on ? 700 : 500}" fill="${on ? 'var(--accent)' : 'var(--muted)'}">${AR.A[k].name}</text>`; }).join('');
    const axes = keys.map((_, i) => { const [x, y] = pt(i, R); return `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="var(--line)"/>`; }).join('');
    return `<svg viewBox="-28 0 356 285" class="radar" role="img" aria-label="Профиль архетипов">${rings}${axes}<polygon points="${poly}" fill="rgba(255,181,71,.22)" stroke="var(--accent)" stroke-width="2"/>${labels}</svg>`;
  }

  // Бодиграф: упрощённая схема 9 центров
  const BG = { head: [160, 40, 'tri-up'], ajna: [160, 105, 'tri-down'], throat: [160, 172, 'sq'], g: [160, 245, 'dia'], heart: [222, 268, 'tri-sm'], spleen: [58, 330, 'tri-r'], sp: [262, 330, 'tri-l'], sacral: [160, 330, 'sq'], root: [160, 405, 'sq'] };
  function shape(kind, x, y) {
    const s = 26;
    switch (kind) {
      case 'tri-up': return `<polygon points="${x},${y - s} ${x + s},${y + s * 0.8} ${x - s},${y + s * 0.8}"/>`;
      case 'tri-down': return `<polygon points="${x - s},${y - s * 0.8} ${x + s},${y - s * 0.8} ${x},${y + s}"/>`;
      case 'tri-sm': return `<polygon points="${x},${y - 16} ${x + 18},${y + 14} ${x - 18},${y + 14}"/>`;
      case 'tri-r': return `<polygon points="${x - s},${y - s} ${x + s},${y} ${x - s},${y + s}"/>`;
      case 'tri-l': return `<polygon points="${x + s},${y - s} ${x - s},${y} ${x + s},${y + s}"/>`;
      case 'dia': return `<polygon points="${x},${y - 30} ${x + 30},${y} ${x},${y + 30} ${x - 30},${y}"/>`;
      default: return `<rect x="${x - s}" y="${y - s}" width="${s * 2}" height="${s * 2}" rx="6"/>`;
    }
  }
  function bodygraph(h) {
    const def = new Set(h.defined), chSet = new Set(h.channels.map((c) => c.join('-')));
    const pairCount = {};
    const lines = HD.CHANNELS.map(([a, b]) => {
      const ca = HD.GATE_CENTER[a], cb = HD.GATE_CENTER[b], key = [ca, cb].sort().join();
      const k = (pairCount[key] = (pairCount[key] || 0) + 1) - 1;
      const [x1, y1] = BG[ca], [x2, y2] = BG[cb];
      const len = Math.hypot(x2 - x1, y2 - y1) || 1, ox = (-(y2 - y1) / len) * (k - 1) * 9, oy = ((x2 - x1) / len) * (k - 1) * 9;
      const on = chSet.has(`${a}-${b}`);
      return `<line x1="${x1 + ox}" y1="${y1 + oy}" x2="${x2 + ox}" y2="${y2 + oy}" stroke="${on ? 'var(--accent)' : 'rgba(255,255,255,.10)'}" stroke-width="${on ? 4 : 3}" stroke-linecap="round"/>`;
    }).join('');
    const centers = Object.entries(BG).map(([c, [x, y, k]]) => `<g fill="${def.has(c) ? 'var(--accent)' : 'var(--card2)'}" stroke="${def.has(c) ? 'var(--accent)' : 'var(--line2)'}" stroke-width="1.5">${shape(k, x, y)}</g>`).join('');
    return `<svg viewBox="0 0 320 440" class="bodygraph" role="img" aria-label="Бодиграф">${lines}${centers}</svg>`;
  }

  /* ---------- screens ---------- */
  const screens = {
    welcome() {
      return `<div class="logo"><i></i>${esc(C.appName)}</div>
      <div class="welcome-art" aria-hidden="true"><div class="o spin" style="width:200px;height:200px"><span class="p" style="left:-5px;top:95px"></span></div><div class="o spin r" style="width:130px;height:130px"><span class="p" style="right:8px;top:12px;width:7px;height:7px"></span></div><div class="o" style="width:64px;height:64px"></div><div class="c">${G('✦')}</div></div>
      <div class="stack-lg">
        <div class="stack"><h1>${userName() ? esc(userName()) + ', т' : 'Т'}вой код креатора</h1>
        <p class="muted">Четыре системы — натальная карта, архетипы, нумерология и Дизайн человека — сходятся в один ответ: что тебе снимать, как снимать и каким быть в кадре.</p></div>
        <div class="sys-row">${['Карта', 'Архетип', 'Числа', 'Дизайн'].map((x, i) => `<span class="src src-${['chart', 'arch', 'num', 'hd'][i]}">${x}</span>`).join('')}</div>
        <button class="btn" data-a="go" data-v="goal">Собрать мой код</button>
        ${disclaimer}
      </div>`;
    },
    goal() {
      return head('Шаг 1 из 2', 'Что хочешь получить?', 'От цели зависит план на 7 дней. Поменять можно в любой момент.') +
        `<div class="stack">${Object.entries(D.GOALS).map(([k, g]) => `<button class="card tap choice ${state.goal === k ? 'on' : ''}" data-a="setGoal" data-v="${k}"><span class="ic">${g.icon}</span><span><b>${g.name}</b><small>${g.desc}</small></span></button>`).join('')}</div>`;
    },
    start() {
      return head('Шаг 2 из 2', 'Как начнём?', '') + `<div class="stack">
        <button class="card tap choice accent" data-a="go" data-v="birth"><span class="ic">${G('✦')}</span><span><b>Полный код креатора</b><small>Имя, дата, время и место рождения → карта, нумерология и Дизайн человека за раз.</small></span></button>
        <button class="card tap choice" data-a="go" data-v="demo"><span class="ic">${G('♌')}</span><span><b>Быстрое демо по знаку</b><small>Без личных данных — просто выбери свой знак.</small></span></button></div>`;
    },
    demo() {
      return head('Демо', 'Выбери свой знак', 'Быстрая карточка только по солнечному знаку.') +
        `<div class="signs">${D.SIGNS.map((s, i) => `<button class="sign" data-a="pickSign" data-v="${i}"><div class="g">${G(s.glyph)}</div><div class="n">${s.name}</div><div class="d">${s.dates}</div></button>`).join('')}</div>`;
    },
    demoResult() {
      const s = S(state.demoSign), el = s.element, r = SN.rankFormats(P());
      const card = { id: 'd:' + s.key, kind: 'insight', title: 'Твой стиль проявления', factor: `Солнце в знаке ${s.name} · демо`, lead: s.core + ' ' + s.show, ex: D.BY_ELEMENT.show[el][0], act: D.BY_ELEMENT.show[el][1] };
      return head(`${G(s.glyph)} ${s.name} · ${D.ELEMENTS[el].name}`, 'Твоя демо-карточка', '') +
        `<div class="stack-lg">${insightCard(card)}
        <div class="card flat stack"><h3>Форматы, которые стоит проверить</h3>${r.slice(0, 3).map((f) => `<div class="row"><span style="font-size:20px">${f.icon}</span><div><b>${f.name}</b><div class="dim">${esc(f.test)}</div></div></div>`).join('')}</div>
        <div class="card accent stack"><h2>Это 1 фактор из 30+</h2><p class="muted">Полный код учитывает 7 планет и асцендент, 72 ответа теста архетипов, 4 числа и 26 активаций Дизайна человека.</p><button class="btn" data-a="go" data-v="birth">Собрать полный код</button></div>
        <button class="btn ghost" data-a="finishDemo">Перейти в меню</button></div>`;
    },
    birth() {
      const p = state.profile || {}, custom = p.custom || false;
      return head('Код креатора', 'Данные для расчёта', 'Хранятся только на твоём устройстве. Удалить можно в «Профиле».') +
        `<form class="stack-lg" data-form="birth" novalidate>
          <label class="f">Имя и фамилия при рождении <span class="dim">— для нумерологии</span><input type="text" name="name" value="${esc(p.name || '')}" placeholder="Анна Смирнова" maxlength="60" autocomplete="name"></label>
          <label class="f">Дата рождения<input type="date" name="date" value="${esc(p.date || '')}" min="1900-01-01" max="${new Date().toISOString().slice(0, 10)}" required></label>
          <div class="stack"><label class="f">Время рождения <span class="dim">— нужно для асцендента и Дизайна человека</span><input type="time" name="time" value="${esc(p.time || '')}" ${p.date && !p.time ? 'disabled' : ''}></label>
            <label class="check"><input type="checkbox" name="noTime" ${p.date && !p.time ? 'checked' : ''} data-in="noTime"> Не знаю время</label></div>
          <div class="stack">
            <label class="f">Город рождения<input type="text" name="city" autocomplete="off" placeholder="Начни вводить: Москва" value="${esc(p.cityName && !custom ? p.cityName : '')}" data-in="city" ${custom ? 'disabled' : ''}></label>
            <div id="suggest"></div>
            <label class="check"><input type="checkbox" name="custom" ${custom ? 'checked' : ''} data-in="custom"> Моего города нет в списке</label>
            <div id="customBox" ${custom ? '' : 'hidden'} class="stack">
              <label class="f">Название места<input type="text" name="cname" value="${esc(custom ? p.cityName : '')}" placeholder="пос. Яблоновский"></label>
              <div class="grid2"><label class="f">Широта<input type="number" step="0.001" name="lat" value="${custom ? esc(p.lat) : ''}" placeholder="55.75"></label><label class="f">Долгота<input type="number" step="0.001" name="lon" value="${custom ? esc(p.lon) : ''}" placeholder="37.62"></label></div>
              <label class="f">Часовой пояс в момент рождения, UTC±<input type="number" step="0.5" name="tz" value="${custom ? esc(p.tz) : ''}" placeholder="3"></label>
            </div>
          </div>
          <label class="f">Ниша блога <span class="dim">— необязательно</span><input type="text" name="niche" value="${esc(p.niche || state.ideaForm.niche || '')}" placeholder="мобильная съёмка" maxlength="60"></label>
          <label class="check"><input type="checkbox" name="consent" ${state.profile ? 'checked' : ''}> Согласен(на), что эти данные используются для расчёта на моём устройстве. На сервер они не отправляются.</label>
          <p class="err" id="formErr"></p>
          <button class="btn" type="submit">Рассчитать код</button>
          ${disclaimer}
        </form>`;
    },

    /* ===== КОД ===== */
    code() {
      if (state.goal) ensurePlan();
      const p = P(), f = SN.formula(p), n = nSystems();
      if (!n && state.demoSign == null) return head('Код креатора', 'Пока пусто', '') + needProfile('Введи данные рождения — соберём твой код из четырёх систем.');
      const B = SN.code(p), pill = SN.pill(p), today = SN.today(p), ns = nextStep();
      const ML = STUDIO.miniLines(); B.who.push(...ML.who); B.how.push(...ML.how); B.rhythm.push(...ML.rhythm);
      const block = (title, arr, icon) => arr.length ? `<div class="card stack"><div class="row"><span class="bi">${icon}</span><h2>${title}</h2></div>${arr.map((x) => `<p class="line">${esc(x.text)} ${srcChip(x.src)}</p>`).join('')}</div>` : '';
      const missing = [[!chart, 'Натальная карта', 'birth', 'нужны дата и место'], [!arch, 'Тест архетипов', 'archTest', `72 утверждения · ~7 мин${state.archAnswers.filter(Boolean).length ? ` · отвечено ${state.archAnswers.filter(Boolean).length}` : ''}`], [!num, 'Нумерология', 'birth', 'нужна дата'], [!hd && chart, 'Дизайн человека', 'birth', 'нужно время рождения'], [!hd && !chart, 'Дизайн человека', 'birth', 'нужны дата, время и место']].filter((x) => x[0]);
      return `<div class="row between" style="margin-bottom:16px"><div class="logo"><i></i>${esc(C.appName)}</div><button class="chip" data-a="go" data-v="goal">${D.GOALS[state.goal || 'blog'].icon} ${D.GOALS[state.goal || 'blog'].name}</button></div>
      <div class="head code-head">${STUDIO.signBadge()}<span class="eyebrow">Код креатора${userName() ? ' · ' + esc(userName()) : ''}</span>
        <div class="formula">${f.map((x) => `<span class="fchip src-${x.src}"><b>${esc(G(x.glyph))}</b>${esc(x.text)}</span>`).join('<span class="plus">+</span>')}</div></div>
      <div class="stack-lg">
        <div class="card coverage"><div class="row between"><b>Собрано систем: ${n} из 4</b><span class="dim">${n === 4 ? 'полный код' : 'точность растёт'}</span></div>
          <div class="seg4">${['chart', 'arch', 'num', 'hd'].map((k) => `<i class="${({ chart, arch, num, hd })[k] ? 'on src-' + k : ''}"></i>`).join('')}</div>
          ${missing.map((m) => `<button class="li tap" data-a="go" data-v="${m[2]}" style="width:100%;background:none;border:0;color:inherit;font:inherit;text-align:left"><span class="g">+</span><span class="t"><b>${m[1]}</b><br><span class="dim">${m[3]}</span></span><span class="v muted">›</span></button>`).join('')}
        </div>
        ${n ? `<div class="card accent stack"><span class="eyebrow">Твоя формула в трёх правилах</span>${pill.map((r) => `<div class="pill-row"><span>${r.k}</span><p>${esc(r.v)}</p></div>`).join('')}
          <button class="btn sm" data-a="tab" data-v="ask" style="align-self:flex-start">Задать вопрос →</button></div>` : ''}
        <div class="card stack"><span class="eyebrow">Энергия дня · ${today.date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}</span>${today.tips.map((t) => `<p class="line">${esc(t.text)} ${srcChip(t.src)}</p>`).join('')}</div>
        ${STUDIO.rechargeCard()}
        ${ns ? `<div class="card stack"><span class="eyebrow">Шаг на сегодня${ns.day ? ' · день ' + ns.day : ''}</span><div class="todo" data-a="toggle" data-i="${ns.i}" style="border:0;padding:4px 0 0"><span class="box"></span><span class="tx" style="font-weight:600">${esc(ns.item.text)}</span></div></div>` : ''}
        ${block('Каким быть в кадре', B.who, '◉')}
        ${block('Как снимать', B.how, '◫')}
        ${block('Что снимать', B.what, '✎')}
        ${block('Твой ритм', B.rhythm, '◷')}
        ${block('Где ловушка', B.trap, '△')}
        ${n ? `<button class="card tap mycard-cta" data-a="go" data-v="mycard"><span class="mcc-g">✶</span><span><b>Карточка «Мой код» для сторис</b><small>Живой дизайн + картинка 1080×1920</small></span><span class="v muted">›</span></button><button class="btn soft" data-a="copyCode">Скопировать мой код</button>` : ''}
        ${disclaimer}
      </div>`;
    },

    /* ===== СИСТЕМЫ ===== */
    systems() {
      const t = (k, title, sub, status, to, glyph) => `<button class="card tap sys-tile" data-a="go" data-v="${to}"><span class="sys-g src-${k}">${glyph}</span><span class="t"><b>${title}</b><small>${sub}</small></span><span class="badge ${status ? '' : 'warn'}">${status ? 'готово' : 'добавить'}</span></button>`;
      const answered = state.archAnswers.filter(Boolean).length;
      return head('Системы', 'Четыре взгляда на тебя', 'Каждая система — отдельный слой. Вместе они дают код креатора.') + `<div class="stack">
        ${t('chart', 'Натальная карта', chart ? `${S(chart.planets.sun.sign).name} · Луна ${S(chart.planets.moon.sign).name}${chart.asc ? ' · Асц ' + S(chart.asc.sign).name : ''}` : 'Планеты, асцендент, стихии', !!chart, chart ? 'natal' : 'birth', G('☉'))}
        ${t('arch', 'Архетипы', arch ? AR.ORDER.length && arch.top.map((k) => AR.A[k].name).join(' · ') : answered ? `Отвечено ${answered} из 72` : '72 утверждения · 12 архетипов Юнга–Пирсон', !!arch, arch ? 'archResult' : 'archTest', G('◆'))}
        ${t('num', 'Нумерология', num ? `Путь ${num.life} · ${SY.NUM[num.life].title}` : 'Число пути, выражения, души', !!num, num ? 'numer' : 'birth', num ? num.life : '7')}
        ${t('hd', 'Дизайн человека', hd ? `${SY.HD_TYPES[hd.type].name} · ${hd.profile}` : chart ? 'Нужно время рождения' : 'Тип, стратегия, авторитет, профиль', !!hd, hd ? 'hdView' : 'birth', '⬡')}
      </div` + STUDIO.extrasTiles();
    },
    natal() {
      if (!chart) return head('Натальная карта', '', '') + needProfile('Карта ещё не рассчитана.');
      const NT = window.VektorNatal, cards = buildCards(), e = bal.elements, tot = Object.values(e).reduce((a, b) => a + b, 0), p = chart.planets;
      const pct = (k) => Math.round((e[k] / tot) * 100);
      const order = ['fire', 'earth', 'air', 'water'].sort((x, y) => e[y] - e[x]);
      const ELC = { fire: '#FF7A45', earth: '#9BC27A', air: '#8EC5FF', water: '#7C8CFF' };
      const pts = natalPoints();
      const tile = (k) => { const x = pts.find((q) => q.k === k); if (!x) return ''; const I = NT.POINT[k]; return `<button class="card tap ptile" data-a="go" data-v="planet" data-k="${k}"><span class="pg">${G(I.glyph)}</span><span class="t"><small>${esc(I.tag)}</small><b>${esc(I.name)}${x.retro ? ' <span class="retro">R</span>' : ''}</b><span>${G(S(x.sign).glyph)} ${S(x.sign).name}${x.house ? ` · ${x.house} дом` : ''}</span></span><span class="v muted">›</span></button>`; };
      return head('Натальная карта', 'Твоя карта', 'Нажми на планету в круге или в списке — откроется разбор: за что она отвечает и что значит именно у тебя.') + `<div class="stack-lg">
        <div class="card wheelcard">${natalWheel(pts)}<div class="w-legend"><span>Тропический зодиак · ${chart.houseSystem === 'porphyry' ? 'дома Порфирия' : chart.cusps ? 'дома Плацидуса' : 'без домов — нет времени рождения'}</span></div></div>
        <div class="card stack"><span class="eyebrow">Стихии в карте</span>
          <div class="elements">${order.map((k, i) => `<div class="elx el-${k}" style="--c:${ELC[k]};--p:${pct(k)};--d:${i * 0.15}s"><div class="elring"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" class="bg"/><circle cx="50" cy="50" r="44" class="fg" style="stroke-dasharray:${(pct(k) / 100) * 276.5} 276.5"/></svg><div class="elemb">${STUDIO.emblem(k, 46)}</div></div><b>${pct(k)}%</b><small>${D.ELEMENTS[k].name}</small></div>`).join('')}</div>
          <p><b>Больше всего — ${D.ELEMENTS[bal.element].short}:</b> ${esc(D.ELEMENTS[bal.element].vibe)}.</p><p class="dim">${esc(WEAK[bal.weakElement])}</p>
          <div class="modes">${['cardinal', 'fixed', 'mutable'].map((k) => { const mt = Object.values(bal.modes).reduce((a, b) => a + b, 0), v = Math.round((bal.modes[k] / mt) * 100); return `<div class="${k === bal.mode ? 'on' : ''}"><i style="height:${Math.max(8, v)}%"></i><b>${v}%</b><small>${D.MODES[k].name}</small></div>`; }).join('')}</div>
          <p class="dim">${esc(D.MODES[bal.mode].text)}</p>
          ${chart.notes.length ? `<p class="dim">${chart.notes.map(esc).join(' ')}</p>` : ''}</div>
        <h2 class="sec">Главная тройка</h2>${['sun', 'moon', 'asc'].map(tile).join('')}
        <h2 class="sec">Личные планеты</h2>${['mercury', 'venus', 'mars'].map(tile).join('')}
        <h2 class="sec">Социальные планеты</h2>${['jupiter', 'saturn'].map(tile).join('')}
        <h2 class="sec">Высшие планеты и точки</h2>${['uranus', 'neptune', 'pluto', 'node', 'mc'].map(tile).join('')}
        <h2 class="sec">Как тебе проявляться</h2>${cards.map(insightCard).join('')}
        <div class="card"><span class="eyebrow">Точные положения</span><div class="list" style="margin-top:6px">${pts.map((x) => `<div class="li tap" data-a="go" data-v="planet" data-k="${x.k}"><span class="g">${G(NT.POINT[x.k].glyph)}</span><span class="t">${NT.POINT[x.k].name}${x.retro ? ' <span class="retro">R</span>' : ''}</span><span class="v">${G(S(x.sign).glyph)} ${S(x.sign).name}<small>${fmtDeg(x.deg)}${x.house ? ' · ' + x.house + ' дом' : ''}${x.uncertain ? ' · неточно' : ''}</small></span></div>`).join('')}</div>
          <p class="dim" style="margin-top:8px">Тропический зодиак, истинный узел, дома Плацидуса — как в большинстве астрологических программ. Расчёт: Astronomy Engine, сверено со Swiss Ephemeris (расхождение меньше 1′).</p></div>
      </div>`;
    },
    planet({ k }) {
      if (!chart) return screens.natal();
      const NT = window.VektorNatal, pts = natalPoints(), x = pts.find((q) => q.k === k) || pts[0], I = NT.POINT[x.k], sg = S(x.sign);
      const H = x.house ? NT.HOUSES[x.house - 1] : null, i = pts.indexOf(x);
      const det = NT.details(x.k, x.sign);
      const unc = x.uncertain ? `<p class="dim">Без точного времени рождения знак может быть: ${x.uncertain.map((q) => S(q).name).join(' или ')}.</p>` : '';
      return `<div class="stack-lg"><div class="card planet-hero el-${sg.element}"><div class="ph-orbit"><span class="ph-g">${G(I.glyph)}</span></div>
          <span class="eyebrow">${esc(I.tag)}</span><h1>${esc(I.name)} в знаке ${sg.name}</h1>
          <p class="dim">${G(sg.glyph)} ${fmtDeg(x.deg)} ${sg.name}${x.house ? ` · ${x.house} дом` : ''}${x.retro ? ' · ретроградный' : ''}</p></div>
        <div class="card stack"><span class="eyebrow">За что отвечает</span><p>${esc(I.role)}</p></div>
        ${det.map(([t, v]) => `<div class="card stack"><span class="eyebrow">${esc(t)}</span><p>${esc(v)}</p></div>`).join('')}${unc}
        ${H ? `<div class="card stack"><span class="eyebrow">${x.house} дом · ${esc(H[0])}</span><p>Энергия этой точки сильнее всего проявляется в сфере: ${esc(H[1])}.</p></div>` : x.k !== 'asc' && x.k !== 'mc' ? '<div class="card flat"><p class="dim">Укажи время рождения — и увидишь дом, в котором стоит планета.</p></div>' : ''}
        ${x.retro ? '<div class="card stack"><span class="eyebrow">Ретроградность</span><p>Планета в момент рождения двигалась попятно (если смотреть с Земли). Её темы обычно проживаются глубже и «внутрь»: сначала обдумываешь, потом проявляешь.</p></div>' : ''}
        <div class="card accent stack"><span class="eyebrow">Почему на это смотреть креатору</span><p>${esc(I.why)}</p></div>
        <div class="chips">${pts.map((q, j) => `<button type="button" class="chip ${j === i ? 'on' : ''}" data-a="go" data-v="planet" data-k="${q.k}">${G(NT.POINT[q.k].glyph)} ${NT.POINT[q.k].name}</button>`).join('')}</div>
        <button class="btn ghost" data-a="go" data-v="natal">Вся карта</button></div>`;
    },
    archIntro() {
      const started = state.archAnswers.filter(Boolean).length;
      return head('Тест архетипов', 'Кто ты по архетипам', '12 архетипов К. Пирсон по идеям К. Г. Юнга. Структура как у оригинального Heroic Myth Index: по 6 утверждений на архетип, 6–30 баллов, «активная зона» — от 24.') + `<div class="stack-lg">
        <div class="card stack"><span class="eyebrow">Как отвечать</span>
          <p class="line">1. Отвечай про себя <b>настоящего</b>, а не каким хочется быть.</p>
          <p class="line">2. Думай о жизни в целом — и о работе, и о личном.</p>
          <p class="line">3. Первое ощущение — самое точное. Не застревай на одном утверждении.</p>
          <p class="line">4. Если у нескольких архетипов окажется одинаковый максимальный балл, в конце будет 3–9 коротких вопросов «что ближе» — они определят ведущий.</p></div>
        <div class="grid2"><div class="card flat mini"><span class="dim">Утверждений</span><b>72</b></div><div class="card flat mini"><span class="dim">Время</span><b>≈ 7 минут</b></div></div>
        <button class="btn" data-a="archStart">${started ? `Продолжить с ${Math.min(started + 1, 72)}-го` : 'Начать тест'}</button>
        ${started ? '<button class="btn ghost" data-a="archRestart">Начать заново</button>' : ''}
        <p class="disclaimer">Архетипы — модель для самопонимания и бренда, а не медицинская или психологическая диагностика.</p></div>`;
    },
    archTest() {
      if (archAllAnswered()) {
        const cq = AR.nextClarify(state.archAnswers, state.archPicks);
        if (!cq) return screens.archResult();
        const k = state.archPicks.length, total = Math.max(AR.clarifyPlan(state.archAnswers).length, k + 1);
        return `<div class="row between" style="margin-bottom:14px"><button class="linkbtn" data-a="archExit" style="text-decoration:none">✕ Выйти</button><span class="dim">уточнение ${k + 1}${cq.final ? '' : ' / ' + total}</span></div>
          <div class="progress" style="margin-bottom:24px"><i style="width:100%;background:var(--accent)"></i></div>
          <span class="eyebrow">${cq.final ? 'Решающий вопрос' : 'Уточняющий раунд'}</span>
          <p class="muted" style="margin-top:8px">${k === 0 ? 'У тебя почти поровну баллов у нескольких архетипов. Выбери, что ближе, — это определит ведущий.' : 'Выбирай быстро, по ощущению.'}</p>
          <h1 class="q" style="min-height:0;margin-bottom:18px">${esc(cq.prompt)}</h1>
          <div class="stack">${cq.opts.map((key) => `<button class="card tap fc" data-a="archPick" data-v="${key}">${esc(AR.A[key].fc[cq.type])}</button>`).join('')}</div>
          ${k > 0 ? '<button class="btn sm ghost" data-a="archUnpick" style="margin-top:18px">← Назад</button>' : '<button class="btn sm ghost" data-a="archPrev" style="margin-top:18px">← К утверждениям</button>'}`;
      }
      const i = Math.min(state.archIndex || 0, AR.QUESTIONS.length - 1), q = AR.QUESTIONS[i], cur = state.archAnswers[i];
      const done = state.archAnswers.filter(Boolean).length;
      const note = done === 36 ? 'Половина пути — дальше быстрее' : done === 60 ? 'Осталось 12 утверждений' : 'Первое ощущение — самое точное';
      return `<div class="row between" style="margin-bottom:14px"><button class="linkbtn" data-a="archExit" style="text-decoration:none">✕ Выйти</button><span class="dim">${i + 1} / ${AR.QUESTIONS.length}</span></div>
        <div class="progress" style="margin-bottom:28px"><i style="width:${(done / AR.QUESTIONS.length) * 100}%;background:var(--accent)"></i></div>
        <span class="eyebrow">Тест архетипов</span>
        <h1 class="q">${esc(q.text)}</h1>
        <div class="scale">${AR.SCALE.map((s, k) => `<button class="sc ${cur === k + 1 ? 'on' : ''}" data-a="archAnswer" data-v="${k + 1}"><span class="dot">${k + 1}</span>${s}</button>`).join('')}</div>
        <div class="row between" style="margin-top:20px">${i > 0 ? '<button class="btn sm ghost" data-a="archPrev">← Назад</button>' : '<span></span>'}<span class="dim">${note}</span></div>`;
    },
    archResult() {
      if (!arch) return screens[state.archAnswers.some(Boolean) ? 'archTest' : 'archIntro']();
      const r = arch, L = AR.A[r.ranked[0]], S2 = AR.A[r.ranked[1]], S3 = AR.A[r.ranked[2]];
      const nm = (a) => a.name + (a.alt && a.alt !== a.name ? ` <span class="dim">(у Пирсон — ${a.alt})</span>` : '');
      const badge = { strong: ['Ярко выражен', ''], clear: ['Выражен', ''], tie: ['Равенство баллов', 'warn'] }[r.clarity];
      const sc = (k) => r.scores[k];
      const coreOthers = r.core.filter((k) => k !== r.ranked[0]);
      const summary = r.clarity === 'tie'
        ? `Ты — ${L.name}. По баллам ${r.tied.map((k) => AR.A[k].name).join(' и ')} равны (${sc(r.ranked[0])}), а в уточняющих вопросах тебе ближе оказался ${L.name}. ${L.essence}`
        : r.clarity === 'clear'
          ? `Ты — ${L.name}, а рядом, почти вровень, ${coreOthers.map((k) => AR.A[k].name).join(', ') || S2.name}. ${L.essence}`
          : `Ты — ${L.name}. ${(window.VektorPassports[r.ranked[0]] || {}).desc || L.essence}`;
      const zoneColor = { active: 'z-active', developed: 'z-dev', weak: 'z-weak', dormant: 'z-dorm' };
      const bar = (k) => { const v = r.scores[k], z = AR.zoneOf(v); return `<details class="arow"><summary><span class="ag">${G(AR.A[k].glyph)}</span><span class="an">${AR.A[k].name}</span><span class="ab"><i style="width:${Math.round((v / AR.MAX) * 100)}%" class="${zoneColor[z[1]]}"></i></span><span class="av">${v}</span></summary><p class="muted"><b>${z[2]}.</b> «${esc(AR.A[k].motto)}». ${esc(AR.A[k].essence)}${AR.A[k].alt !== AR.A[k].name ? ` В модели Пирсон — ${AR.A[k].alt}.` : ''}</p></details>`; };
      const dTot = Object.values(r.drives).reduce((a, b) => a + b, 0);
      return `<div class="stack-lg">
        <div class="card accent arch-hero"><span class="eyebrow">Твой ведущий архетип</span>
          <div class="ah"><span class="aglyph">${G(L.glyph)}</span><div><h1>${L.name}</h1><span class="badge ${badge[1]}">${badge[0]}</span>${r.clarified ? ' <span class="dim">· уточнено выбором</span>' : ''}</div></div>
          <p class="lead" style="font-weight:600">${esc(summary)}</p>
          <p class="dim">«${esc(L.motto)}»${L.alt !== L.name ? ` · в модели Пирсон — ${L.alt}` : ''} · ${r.scores[r.ranked[0]]} из ${AR.MAX}</p>
          ${r.active.length ? `<div class="core"><span class="dim">Активная зона (24+):</span> ${r.active.map((k) => `<b>${AR.A[k].name} ${r.scores[k]}</b>`).join(' · ')}</div>` : ''}</div>
        ${r.flat ? `<div class="card"><p class="err" style="min-height:0">Твои ответы почти одинаковые — результат может быть неточным. Пройди тест ещё раз и смелее используй крайние варианты «совсем не про меня» и «точно про меня».</p></div>` : ''}
        ${r.why.length && !r.flat ? `<div class="card stack"><span class="eyebrow">Почему ${L.name}</span><p class="muted">Твои самые сильные ответы:</p>${r.why.map((w) => `<p class="hook">«${esc(w)}»</p>`).join('')}</div>` : ''}
        <div class="card stack"><span class="eyebrow">Твоя архетипическая формула</span>
          <div class="frole"><span class="badge">Ведущий</span><div><b>${nm(L)}</b><p class="muted">Как ты проявляешься естественно и чем тебя запоминают. Строй на нём образ в кадре.</p></div></div>
          <div class="frole"><span class="badge warn">Поддерживающие</span><div><b>${nm(S2)} · ${nm(S3)}</b><p class="muted">Чем ты усиливаешь подачу: ${esc(S2.topics[0].toLowerCase())}, ${esc(S3.topics[0].toLowerCase())}.</p></div></div>
          <div class="frole"><span class="badge off">Спящие</span><div><b>${r.low.map((k) => AR.A[k].name).join(' · ')}</b><p class="muted">Сейчас меньше всего проявлены. Не стоит строить на них образ — будет фальшиво. Можно брать как приём в отдельном ролике.</p></div></div></div>
        <div class="card stack"><span class="eyebrow">Главная мотивация</span><h2>${AR.DRIVES[r.drive].name}</h2><p class="muted">${AR.DRIVES[r.drive].text}</p>
          <div class="bars">${Object.keys(AR.DRIVES).map((d) => `<div class="bar" style="grid-template-columns:150px 1fr 34px"><span>${AR.DRIVES[d].name}</span><span class="track"><span class="fill" style="display:block;width:${Math.round((r.drives[d] / dTot) * 100)}%;background:${d === r.drive ? 'var(--accent)' : 'rgba(255,255,255,.28)'}"></span></span><span class="n">${Math.round((r.drives[d] / dTot) * 100)}%</span></div>`).join('')}</div></div>
        <div class="card">${radar(r.scores)}</div>
        <div class="card flat"><div class="row between"><span class="eyebrow">Все 12 архетипов</span><span class="dim">нажми, чтобы прочитать</span></div><div class="arows">${r.ranked.map(bar).join('')}</div>
          <div class="zones"><span class="z-dorm">6–11</span><span class="z-weak">12–17</span><span class="z-dev">18–23</span><span class="z-active">24–30 активная зона</span></div></div>
        ${(() => { const PP = window.VektorPassports[r.ranked[0]]; if (!PP) return ''; const li = (arr) => `<ul class="plist">${arr.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`; return `
        <h2 style="margin-top:6px">Твой контент-паспорт · ${esc(L.name)}</h2>
        <div class="card stack psy"><span class="eyebrow">Кто ты на самом деле</span><p>${esc(PP.psyche)}</p></div>
        <div class="grid2 g1m"><div class="card stack"><span class="eyebrow ok">Сильные стороны</span>${li(PP.strengths)}</div><div class="card stack"><span class="eyebrow warn">Слепые зоны</span>${li(PP.blindspots)}</div></div>
        <div class="card accent stack"><span class="eyebrow">Точка роста</span><p style="font-weight:600">${esc(PP.growth)}</p></div>
        <div class="grid2 g1m"><div class="card stack"><span class="eyebrow">Что снимать</span>${li(PP.content)}</div><div class="card stack"><span class="eyebrow">Твои форматы</span>${li(PP.formats)}</div></div>
        <div class="card stack"><span class="eyebrow">Идеи роликов под тебя</span>${PP.examples.map((e) => `<p class="hook">${esc(e)}</p>`).join('')}</div>
        <div class="card stack"><span class="eyebrow">Как держаться в кадре</span><p class="line"><b>Манера.</b> ${esc(PP.onCam)}</p><p class="line"><b>Голос.</b> ${esc(PP.voice)}</p><p class="line"><b>Одежда.</b> ${esc(PP.clothes)}</p><p class="line"><b>Метод съёмки.</b> ${esc(PP.method)}</p><p class="line"><b>Кино-референсы.</b> ${esc(L.films)}</p></div>
        <div class="card stack"><span class="eyebrow">Палитра — нажми цвет, чтобы скопировать</span><div class="swatches">${PP.palette.map((c) => `<button class="sw" style="background:${c}" data-a="copyHex" data-v="${c}"><code>${c}</code></button>`).join('')}</div><p class="dim">${esc(PP.paletteName)}</p></div>
        <div class="card flat"><p class="muted">💡 ${esc(PP.brands)}</p></div>`; })()}
        ${feedbackCard(r)}
        <button class="btn" data-a="copyArch">Скопировать результат</button>
        <button class="btn ghost" data-a="archRestart">Пройти тест заново</button>
      </div>`;
    },
    numer() {
      const cap1 = (t) => (t ? t.charAt(0).toUpperCase() + t.slice(1) : t), low1 = (t) => (t ? t.charAt(0).toLowerCase() + t.slice(1) : t);
      const agesRu = (a) => { const n = (a.match(/\d+/g) || []).map(Number), last = n[n.length - 1]; if (a.startsWith('до') || a.startsWith('с')) return a + ' ' + window.VektorHooks.plural(last, 'года', 'лет', 'лет'); return a + ' ' + window.VektorHooks.plural(last, 'год', 'года', 'лет'); };
      if (!num) return head('Нумерология', '', '') + needProfile('Нужна дата рождения.');
      const NX = window.VektorNumer, L = SY.NUM[num.life], sq = NX.square(state.profile.date), cy = NX.cycles(state.profile.date);
      const age = Math.floor((Date.now() - new Date(state.profile.date)) / (365.25 * 86400000));
      const curPeak = cy.ages.findIndex((a) => { const n = a.match(/\d+/g).map(Number); return a.startsWith('до') ? age <= n[0] : a.startsWith('с') ? age >= n[0] : age >= n[0] && age <= n[1]; });
      const nc = (n, label, hint, i) => `<div class="numcard ${n ? '' : 'off'}" style="--d:${i * 0.08}s"><b>${n || '—'}</b><span>${label}</span><small>${n ? esc((SY.NUM[n] || {}).title || '') : hint}</small></div>`;
      const NG = window.VektorNumerGrow;
      const ul = (arr) => `<ul class="gx-l">${arr.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`;
      const gx = (b, kind) => {
        if (!b) return '';
        let h = '';
        if (b.use) h += `<div class="gx gx-use"><span>${kind === 'strong' ? 'Как использовать на максимум' : 'Как использовать'}</span>${ul(b.use)}</div>`;
        if (b.grow) h += `<div class="gx gx-grow"><span>${b.use ? 'Как усилить' : 'Как прокачать'}</span>${ul(b.grow)}</div>`;
        if (b.tools) h += `<div class="gx gx-tool"><span>С помощью чего</span><p>${esc(b.tools)}</p></div>`;
        if (b.risk) h += `<div class="gx gx-risk"><span>Осторожно</span>${ul(b.risk)}</div>`;
        if (b.balance) h += `<div class="gx gx-bal"><span>Как держать баланс</span><p>${esc(b.balance)}</p></div>`;
        if (b.blog) h += `<div class="gx gx-blog"><span>Как обойти в блоге</span><p>${esc(b.blog)}</p></div>`;
        return `<div class="gxs">${h}</div>`;
      };
      const cellBox = (k) => { const c = sq.cells[k], lvk = NG.cellLevel(c); return `<details class="pcell lv${Math.min(c, 4)}" style="--d:${k * 0.06}s"><summary><b>${c ? String(k).repeat(c) : '—'}</b><small>${esc(NX.CELLS[k].name)}</small><i class="pc-tag ${lvk}">${lvk === 'weak' ? 'прокачать' : lvk === 'strong' ? 'сила' : 'норма'}</i></summary><div class="pc-body"><p>${esc(NX.CELLS[k].lv[NX.level(c)])}</p>${c >= 2 ? `<p class="dim">Для блога: ${esc(NX.CELLS[k].blog)}.</p>` : ''}${gx(NG.CELL[k][lvk], lvk)}</div></details>`; };
      const sum = NG.summary(sq, NX.LINES);
      const lineMax = Math.max(...Object.values(sq.lines), 1);
      return head('Нумерология', `Число пути ${num.life}`, `${L.title}. ${L.role}.`) + `<div class="stack-lg">
        <div class="numgrid six">${nc(num.life, 'Путь', '', 0)}${nc(num.expression, 'Выражение', 'нужно имя', 1)}${nc(num.soul, 'Душа', 'нужно имя', 2)}${nc(num.personality, 'Личность', 'нужно имя', 3)}${nc(num.birthday, 'День рождения', '', 4)}${nc(num.maturity, 'Зрелость', 'нужно имя', 5)}</div>
        <div class="card stack"><span class="eyebrow">Что значат твои числа</span>
          <p><b>Путь ${num.life}</b> — главная задача жизни: ${esc(L.role.toLowerCase())}. Темы: ${esc(L.content)}. Ловушка: ${esc(L.trap)}.</p>
          ${num.expression ? `<p><b>Выражение ${num.expression}</b> — каким тебя видят и в чём твой природный инструмент: ${esc(SY.NUM[num.expression].role.toLowerCase())}. Подача: ${esc(SY.NUM[num.expression].tone)}.</p>` : ''}
          ${num.soul ? `<p><b>Душа ${num.soul}</b> — внутренняя мотивация, чего хочется на самом деле: ${esc(SY.NUM[num.soul].content)}.</p>` : ''}
          ${num.personality ? `<p><b>Личность ${num.personality}</b> — маска для незнакомых, первое впечатление: ${esc(SY.NUM[num.personality].tone)}.</p>` : ''}
          <p><b>День рождения ${num.birthday}</b> — врождённый талант: умение ${esc(NX.BIRTHDAY[num.birthday] || NX.BIRTHDAY[NX.red(num.birthday)])}.</p>
          ${num.maturity ? `<p><b>Зрелость ${num.maturity}</b> — к чему ты приходишь после 35–40 лет: ${esc(SY.NUM[num.maturity].role.toLowerCase())}.</p>` : ''}</div>
        <div class="card stack"><div class="row between"><span class="eyebrow">Квадрат Пифагора</span><span class="badge">${esc(sq.method)}</span></div>
          <p class="dim">Цифры даты рождения и 4 рабочих числа: ${sq.work.join(', ')}. Нажми на ячейку — откроется расшифровка.</p>
          <div class="psq">${[1, 4, 7, 2, 5, 8, 3, 6, 9].map(cellBox).join('')}</div></div>
        <div class="card stack"><span class="eyebrow">Твой план по квадрату</span>
          ${sum.strong.length ? `<div class="gx gx-use"><span>Сильные стороны — опирайся на них</span><ul class="gx-l">${sum.strong.map((x) => `<li><b>${esc(x.name)} (${x.v}).</b> ${esc(x.tip)}</li>`).join('')}</ul></div>` : '<p class="dim">Ярко выраженных линий нет — ты универсал(ка): сила в балансе, а не в одном перекосе.</p>'}
          ${sum.weak.length ? `<div class="gx gx-grow"><span>Зоны роста — план на месяц</span><ol class="gx-l">${sum.weak.map((x, i) => `<li><b>${i + 1}-я неделя${i === sum.weak.length - 1 && sum.weak.length < 4 ? ' и дальше' : ''} — ${esc(x.name)}.</b> ${esc(x.step)}</li>`).join('')}</ol></div>` : '<p class="dim">Слабых линий нет — задача не прокачивать, а направить силу в один главный проект.</p>'}
          ${sum.weakCells.length ? `<p class="dim">Пустые ячейки (${sum.weakCells.join(', ')}) — не приговор: это качества, которые развиваются практикой. Открой ячейку в квадрате — там конкретные шаги.</p>` : ''}</div>
        <div class="card stack"><span class="eyebrow">Линии квадрата</span><p class="dim">Нажми на линию — что с ней делать.</p>${NX.LINES.map((l, i) => { const v = sq.lines[l.k], lv = NX.lineLevel(v), lk = NG.lineKey(v); return `<details class="pline lv${lv[1]}" style="--d:${i * 0.07}s"><summary><div class="row between"><b>${esc(l.name)}</b><span class="dim">${v} · ${lv[0]}</span></div><span class="pbar"><i style="width:${Math.round((v / lineMax) * 100)}%"></i></span><small>${lk === 'strong' ? 'Сильная сторона в блоге' : lk === 'weak' ? 'Зона роста' : 'В блоге'}: ${esc(l.blog)}.</small></summary>${gx(NG.LINE[l.k][lk], lk)}</details>`; }).join('')}</div>
        <div class="card stack"><span class="eyebrow">Вершины и вызовы жизни</span><div class="peaks">${cy.peaks.map((p, i) => `<div class="peak ${i === curPeak ? 'on' : ''}"><div class="pk-n"><b>${p}</b><small>${esc(agesRu(cy.ages[i]))}</small></div><div class="pk-t"><span>${esc(cap1(NX.PEAK[p] || ''))}</span><em>Вызов ${cy.challenges[i]}: ${esc(NX.CHALLENGE[cy.challenges[i]])}</em>${i === curPeak || (curPeak < 0 && i === 0) ? `<div class="gx gx-grow"><span>Как пройти вызов</span>${ul(NG.CHALLENGE_HOW[cy.challenges[i]] || [])}</div>` : `<small class="pk-how">Как пройти: ${esc(low1((NG.CHALLENGE_HOW[cy.challenges[i]] || [''])[0]))}</small>`}</div>${i === curPeak ? '<i class="pk-now">сейчас</i>' : ''}</div>`).join('')}</div>
          ${curPeak >= 0 ? `<p class="dim">Сейчас тебе ${age} — ты в ${curPeak + 1}-й вершине: время для темы «${esc(NX.PEAK[cy.peaks[curPeak]] || '')}».</p>` : ''}</div>
        ${num.lessons ? `<div class="card stack"><span class="eyebrow">Кармические уроки</span>${num.lessons.length ? `<p>В имени нет цифр ${num.lessons.join(', ')} — качества, которые жизнь будет предлагать развивать. Как это делать:</p><ul class="gx-l">${num.lessons.map((n) => `<li><b>${n} — ${esc(NX.LESSON[n])}.</b> ${esc(NG.LESSON_HOW[n])}</li>`).join('')}</ul>` : '<p>В имени есть все цифры от 1 до 9 — редкое равновесие качеств.</p>'}</div>` : ''}
        <div class="card accent stack"><span class="eyebrow">Сейчас</span><p><b>Личный год ${num.pYear}.</b> ${esc(SY.YEAR[num.pYear])}</p><p><b>Личный месяц ${num.pMonth}.</b> ${esc(SY.NUM[num.pMonth].role)}.</p><p><b>Личный день ${num.pDay}.</b> ${esc(SY.NUM[num.pDay].day)}</p></div>
        ${!state.profile.name ? '<button class="btn soft" data-a="go" data-v="birth">Добавить имя для полной нумерологии</button>' : ''}
        <p class="dim">Пифагорейская система: кириллица и латиница, мастер-числа 11, 22, 33. Квадрат Пифагора — по методике А. Ф. Александрова.</p>
      </div>`;
    },
    hdView() {
      if (!hd) return head('Дизайн человека', 'Нужно время рождения', 'Без точного времени тип и профиль могут посчитаться неверно.') + `<button class="btn" data-a="go" data-v="birth">Указать время рождения</button>`;
      const X = window.VektorHDX, T = SY.HD_TYPES[hd.type], TX = X.TYPE[hd.type], au = SY.HD_AUTH[hd.authority], [l1, l2] = hd.profile.split('/').map(Number);
      const HC = window.VektorHD.CENTERS, open = Object.keys(HC).filter((c) => !hd.defined.includes(c));
      const act = (arr, label) => `<div><span class="eyebrow">${label}</span><div class="list">${arr.map((a) => `<div class="li"><span class="t">${a.name}</span><span class="v">${a.gate}.${a.line}</span></div>`).join('')}</div></div>`;
      const lst = (arr, cls) => `<ul class="hdl ${cls}">${arr.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`;
      return head('Дизайн человека', T.name, `${T.energy}. Стратегия — «${T.strategy}».`) + `<div class="stack-lg">
        <div class="card bg-card">${bodygraph(hd)}<p class="dim" style="text-align:center">Закрашены определённые центры и каналы</p></div>
        <div class="grid2"><div class="card flat mini"><span class="dim">Авторитет</span><b>${au[0]}</b></div><div class="card flat mini"><span class="dim">Профиль</span><b>${hd.profile}</b></div><div class="card flat mini"><span class="dim">Определённость</span><b>${SY.HD_DEF[hd.definition]}</b></div><div class="card flat mini"><span class="dim">Каналов</span><b>${hd.channels.length}</b></div></div>
        <div class="hdsig"><div class="ok"><small>Ты на своём пути, когда чувствуешь</small><b>${TX.signature}</b></div><div class="no"><small>Сигнал, что идёшь не туда</small><b>${TX.notself}</b></div></div>
        <div class="card stack"><span class="eyebrow">Боли — узнаёшь себя?</span>${lst(TX.pains, 'pain')}</div>
        <div class="card stack"><span class="eyebrow">Решения</span>${lst(TX.solutions, 'sol')}</div>
        <div class="grid2 collapse"><div class="card stack"><span class="eyebrow">Опасности</span>${lst(TX.dangers, 'dang')}</div><div class="card stack"><span class="eyebrow">Что тормозит</span>${lst(TX.blockers, 'blk')}</div></div>
        <div class="card accent stack"><span class="eyebrow">Как тебе вести блог</span><p>${esc(T.content)}</p><p><b>Ритм:</b> ${esc(TX.rhythm)}</p></div>
        <div class="card stack"><span class="eyebrow">Авторитет: ${au[0]}</span><p>${esc(au[1])}</p><p class="dim">Авторитет — способ принимать верные для тебя решения: какую тему снимать, с кем работать, когда запускать продукт.</p></div>
        <div class="card stack"><span class="eyebrow">Профиль ${hd.profile}</span><p>${esc(X.PROFILE[hd.profile] || '')}</p><p class="muted">Линия ${l1} — ${HD_LINE(l1)}. Линия ${l2} — ${HD_LINE(l2)}.</p></div>
        ${hd.defined.length ? `<div class="card stack"><span class="eyebrow">Определённые центры — твоя стабильность</span>${hd.defined.map((c) => `<details class="hdc def"><summary><b>${HC[c].name}</b><small>${esc(X.CENTER[c].about)}</small></summary><p>${esc(X.CENTER[c].defined)}</p></details>`).join('')}</div>` : ''}
        ${open.length ? `<div class="card stack"><span class="eyebrow">Открытые центры — где ты впитываешь чужое</span><p class="dim">Здесь ты гибкий(ая) и мудрый(ая), но легко принимаешь чужое за своё. Вопрос-ловушка поможет заметить.</p>${open.map((c) => `<details class="hdc"><summary><b>${HC[c].name}</b><small>${esc(X.CENTER[c].trap)}</small></summary><p>${esc(X.CENTER[c].open)}</p></details>`).join('')}</div>` : ''}
        ${hd.channels.length ? `<div class="card stack"><span class="eyebrow">Твои каналы — постоянные таланты</span>${hd.channels.map(([a, b]) => `<p class="line"><b>${a}–${b}</b> · канал ${esc(X.channelName(a, b))}: ${esc(HC[window.VektorHD.GATE_CENTER[a]].name)} ↔ ${esc(HC[window.VektorHD.GATE_CENTER[b]].name)}</p>`).join('')}</div>` : ''}
        <div class="card flat grid2" style="gap:16px">${act(hd.personality, 'Личность')}${act(hd.design, 'Дизайн')}</div>
        <p class="dim">Момент дизайна: Солнце на 88° раньше рождения (${esc(hd.designUtc.slice(0, 10))}). Узлы — истинные.</p>
      </div>`;
    },

    /* ===== СПРОСИТЬ ===== */
    ask() {
      const n = nSystems();
      const chips = ['Что мне снять на этой неделе?', 'Каким мне быть в кадре?', 'Как мне снимать, чтобы было похоже на меня?', 'Почему я откладываю съёмки?', 'Какой формат мне подойдёт?', 'Как мне продавать через контент?', 'Что сегодня за день для съёмки?'];
      const msgs = state.chat.length ? state.chat : [{ role: 'assistant', content: `Привет${userName() ? ', ' + userName() : ''}! Я вижу ${n ? `твой код из ${n} ${n === 1 ? 'системы' : 'систем'}` : 'пока только демо'}. Спроси, что снимать, как снимать или каким быть в кадре — отвечу с опорой на твою карту, архетип, числа и Дизайн человека.` }];
      return head('Спросить', 'Твой личный наставник', '') + `<div class="chat" id="chat">${msgs.map(bubble).join('')}</div>
        <p class="dim" id="aiState" style="margin:4px 0 10px"></p>
        <div class="chips ask-chips" style="margin-bottom:12px">${chips.map((c) => `<button class="chip" data-a="askChip" data-v="${esc(c)}">${esc(c)}</button>`).join('')}</div>
        ${state.chat.length ? '<button class="linkbtn" data-a="clearChat" style="margin-bottom:8px">Очистить диалог</button>' : ''}
        <form class="askbar" data-form="ask"><input type="text" name="q" placeholder="Спроси о своём контенте…" autocomplete="off" maxlength="300"><button class="btn sm" type="submit" aria-label="Отправить">↑</button></form>`;
    },

    /* ===== КОНТЕНТ ===== */
    content() {
      return head('Контент', 'Мастерская', 'Всё, что нужно, чтобы превратить код в ролики — и перестать бояться камеры.') + GROW.tiles() + `<h2 class="sec">Создавать</h2><div class="tiles">
        <button class="tile" data-a="go" data-v="hooks"><span class="ic">🎣</span><span><b>Хуки</b><small>100 ниш · 15 триггеров</small></span></button>
        <button class="tile" data-a="go" data-v="ideas"><span class="ic">💡</span><span><b>Идеи</b><small>Под твою нишу</small></span></button>
        <button class="tile" data-a="go" data-v="formats"><span class="ic">🎥</span><span><b>Форматы</b><small>Рейтинг по 4 системам</small></span></button>
        <button class="tile" data-a="go" data-v="highlights"><span class="ic">⭕</span><span><b>Актуальные-воронки</b><small>Боль → сторис → лид-магнит</small></span></button>
        <button class="tile" data-a="go" data-v="bio"><span class="ic">🪪</span><span><b>Шапка профиля</b><small>15 стилей и регалии</small></span></button>
        <button class="tile" data-a="go" data-v="checklist"><span class="ic">🎬</span><span><b>Чек-лист съёмки</b><small>Перед записью</small></span></button>
      </div><h2 class="sec">Планировать</h2><div class="tiles">
        <button class="tile" data-a="go" data-v="plan"><span class="ic">☑</span><span><b>План на 7 дней</b><small>${state.plan ? state.plan.items.filter((x) => x.done).length + ' из 7' : 'Начать'}</small></span></button>
        <button class="tile" data-a="go" data-v="month"><span class="ic">🗓</span><span><b>План на месяц</b><small>Воронка на 4 недели</small></span></button>
        <button class="tile" data-a="go" data-v="saved"><span class="ic">★</span><span><b>Сохранённое</b><small>${state.saved.length} карточек</small></span></button>
        <button class="tile" data-a="go" data-v="mycard"><span class="ic">✶</span><span><b>Карточка «Мой код»</b><small>Для сторис</small></span></button>
      </div>${C.channelUrl ? `<button class="btn soft" style="margin-top:16px" data-a="link" data-v="${esc(C.channelUrl)}">Telegram-канал автора</button>` : ''}`;
    },
    board({ id }) {
      const idea = findIdea(id);
      if (!idea) return head('Раскадровка', 'Идея не найдена', '') + `<button class="btn" data-a="go" data-v="ideas">К идеям</button>`;
      const shots = storyboard(idea), a = arch ? AR.A[arch.top[0]] : null;
      const look = a ? a.shoot : D.LOOK[bal ? bal.element : 'water'];
      return head(`Раскадровка · ${esc(idea.fmtName)}`, esc(idea.title), `${esc(idea.platform)} · ${esc(durationFor(idea.platform))} · ${shots.length} кадров`) +
        `<div class="stack-lg"><div class="card accent"><span class="eyebrow">Визуальный стиль${a ? ' · ' + a.name : ''}</span><p style="margin-top:8px">${esc(look)}</p>${a ? `<p class="dim" style="margin-top:6px">Референсы: ${esc(a.films)}</p>` : ''}</div>
          ${shots.map((s) => `<article class="card shot"><div class="num"><small>кадр</small><b>${s.n}</b><small>${s.sec} с</small></div><div><p class="say">${esc(s.text)}</p><dl class="kv"><dt>Крупность</dt><dd>${esc(s.size)}</dd><dt>Камера</dt><dd>${esc(s.move)}</dd><dt>Действие</dt><dd>${esc(s.action)}</dd><dt>Звук</dt><dd>${esc(s.sound)}</dd><dt>Реквизит</dt><dd>${esc(s.props)}</dd></dl></div></article>`).join('')}
          <button class="btn" data-a="copyBoard" data-id="${idea.id}">Скопировать раскадровку</button>
          <button class="btn ghost" data-a="ideaToPlan" data-id="${idea.id}">Добавить съёмку в план</button></div>`;
    },
    plan() {
      if (!state.goal) state.goal = 'blog';
      ensurePlan();
      const pl = state.plan, done = pl.items.filter((x) => x.done).length + pl.extra.filter((x) => x.done).length, total = pl.items.length + pl.extra.length;
      const todo = (it, i, label) => `<div class="todo ${it.done ? 'done' : ''}" data-a="toggle" data-i="${i}"><span class="box">${it.done ? '✓' : ''}</span><div><div class="day">${label}</div><div class="tx">${esc(it.text)}</div></div></div>`;
      return head(`План · ${D.GOALS[pl.goal].name}`, 'План на 7 дней', 'Один небольшой шаг в день.') + `<div class="stack-lg">
        <div class="stack"><div class="row between"><span class="muted">${done} из ${total}</span><span class="dim">${Math.round((done / total) * 100)}%</span></div><div class="progress"><i style="width:${(done / total) * 100}%"></i></div></div>
        <div class="card">${pl.items.map((it, i) => todo(it, i, 'День ' + (i + 1))).join('')}</div>
        ${pl.extra.length ? `<div class="stack"><h2>Попробовать</h2><div class="card">${pl.extra.map((it, k) => todo(it, pl.items.length + k, 'из карточек')).join('')}</div></div>` : ''}
        <button class="btn ghost" data-a="resetPlan">Начать план заново</button></div>`;
    },
    saved() {
      const list = state.saved;
      return head('Сохранённое', 'Твои карточки', '') + (list.length ? `<div class="stack-lg">${list.slice().reverse().map((x) => (x.kind === 'idea' ? ideaCard(x) : x.kind === 'hook' ? `<div class="card"><span class="eyebrow">Хук</span><div class="hookrow" style="margin-top:8px"><p class="hook">${esc(x.text)}</p><button class="iconbtn" data-a="copyText" data-v="${esc(x.text)}">⧉</button></div></div>` : insightCard(x))).join('')}</div>` : `<div class="card empty"><div class="ic">☆</div><p>Нажми ☆ на карточке или идее — она появится здесь.</p></div>`);
    },

    /* ===== ПРОФИЛЬ ===== */
    profile() { return PROF.html(); },
    tariffs() {
      return head('Тарифы', 'Что входит', 'Базовый код — бесплатно. Платные пакеты скоро: нажми «Хочу», чтобы узнать первым.') + `<div class="stack">${C.tariffs.map((t) => `<article class="card tariff ${t.current ? 'accent' : ''}"><div class="row between"><h2>${esc(t.name)}</h2>${t.current ? '<span class="badge">сейчас</span>' : '<span class="badge warn">скоро</span>'}</div><div class="price" style="margin-top:8px">${esc(t.price)}</div><ul>${t.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>${t.current ? '' : `<button class="btn sm" style="margin-top:14px" data-a="want">Хочу</button>`}</article>`).join('')}
        <p class="dim">Оплата ${C.paymentsEnabled ? 'подключена' : 'пока не подключена — деньги не списываются'}.</p></div>`;
    },
    about() {
      return head('О приложении', 'Как это работает', '') + `<div class="stack-lg"><div class="card stack">
        <h3 style="font-weight:700">Натальная карта и Дизайн человека</h3><p class="muted">Положения планет считает астрономическая библиотека Astronomy Engine (открытый код, MIT). Дизайн человека: 13 активаций в момент рождения и в момент, когда Солнце было на 88° раньше, мандала 64 ворот, 36 каналов, 9 центров.</p>
        <h3 style="font-weight:700">Архетипы</h3><p class="muted">12 архетипов К. Пирсон на основе идей К. Г. Юнга. Структура как у Heroic Myth Index: 72 утверждения (по 6 на архетип), шкала 1–5, 6–30 баллов, зоны 6–11 / 12–17 / 18–23 / 24–30. Утверждения измеряют цель, страх, реакцию на трудность и дар каждого архетипа. Ведущий — архетип с наибольшим баллом; при равенстве — уточняющие вопросы «что ближе».</p>
        <h3 style="font-weight:700">Нумерология</h3><p class="muted">Пифагорейская система, кириллица и латиница, мастер-числа.</p>
        <h3 style="font-weight:700">Ответы на вопросы</h3><p class="muted">Если подключён ИИ — он отвечает, опираясь только на рассчитанный профиль. Без ИИ работают встроенные ответы из базы.</p>
        <h3 style="font-weight:700">Твои данные</h3><p class="muted">Хранятся на этом устройстве. При вопросах к ИИ профиль (без даты и места рождения) отправляется в модель для ответа.</p>
        <h3 style="font-weight:700">Ограничения</h3><p class="muted">Это инструмент саморефлексии и вдохновения, а не научная диагностика. Без медицинских, юридических и финансовых советов.</p>
      </div></div>`;
    },
  };
  const HD_LINE = (l) => `${l} — ${SY.HD_LINES[l][0]} (${SY.HD_LINES[l][1]})`;

  // родительный падеж для «с нотой …»
  const genOf = (a) => a.gen || a.name;
  function archMaybeFinish() {
    if (archAllAnswered() && !AR.nextClarify(state.archAnswers, state.archPicks)) {
      state.onboarded = true; recompute(); ensurePlan(); save(); haptic('heavy');
      stack = [{ name: 'systems', params: {} }]; route = { name: 'archResult', params: {} }; render(true); toast('Архетипы добавлены в код');
    } else render(true);
  }
  // клавиши 1–5 и ← в тесте (для компьютера)
  document.addEventListener('keydown', (e) => {
    if (route.name !== 'archTest' || e.target.tagName === 'INPUT') return;
    if (/^[1-5]$/.test(e.key)) { const b = $app.querySelectorAll('.sc, .fc')[+e.key - 1]; if (b) b.click(); }
    if (e.key === 'ArrowLeft') { const b = $app.querySelector('[data-a=archPrev], [data-a=archUnpick]'); if (b) b.click(); }
  });

  /* ---------- оценка точности теста ---------- */
  const RATE = ['Совсем мимо', 'Скорее нет', 'Отчасти', 'Скорее да', 'В точку'];
  let fbDraft = { rating: 0, self: null };
  function feedbackCard(r) {
    const fb = state.archFeedback;
    if (fb && fb.sent) return `<div class="card stack fb"><span class="eyebrow">Спасибо за ответ</span><p class="muted">Твоя оценка точности — ${fb.rating} из 5${fb.self ? `, свой ведущий архетип по ощущению — ${AR.A[fb.self].name}` : ''}. Это помогает делать тест точнее.</p></div>`;
    const low = fbDraft.rating && fbDraft.rating <= 3;
    return `<div class="card stack fb"><span class="eyebrow">Последний вопрос</span><h2>Насколько точно это про тебя?</h2>
      <div class="rate">${RATE.map((t, i) => `<button class="rt ${fbDraft.rating === i + 1 ? 'on' : ''}" data-a="fbRate" data-v="${i + 1}"><b>${i + 1}</b><span>${t}</span></button>`).join('')}</div>
      ${low ? `<p class="muted">Какой архетип, по-твоему, твой ведущий?</p><div class="chips">${AR.ORDER.map((k) => `<button class="chip ${fbDraft.self === k ? 'on' : ''}" data-a="fbSelf" data-v="${k}">${AR.A[k].name}</button>`).join('')}<button class="chip ${fbDraft.self === 'none' ? 'on' : ''}" data-a="fbSelf" data-v="none">Не знаю</button></div>
        <button class="btn" data-a="fbSend" ${fbDraft.self ? '' : 'disabled'}>Отправить</button>` : ''}</div>`;
  }
  async function sendFeedback() {
    const r = arch; if (!r) return;
    const payload = { kind: 'archetype_feedback', v: AR.VERSION, rating: fbDraft.rating, self: fbDraft.self && fbDraft.self !== 'none' ? fbDraft.self : null, lead: r.ranked[0], clarity: r.clarity, scores: r.scores, answers: state.archAnswers, picks: state.archPicks, initData: (tg && tg.initData) || '' };
    state.archFeedback = { rating: payload.rating, self: payload.self, at: new Date().toISOString(), sent: true }; save();
    if (C.feedbackEndpoint) { try { await fetch(C.feedbackEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); } catch (e) {} }
    haptic('medium'); toast('Спасибо!'); render();
  }

  /* ---------- chat ---------- */
  function fmtAnswer(t) {
    return esc(t).replace(/\[(Карта|Архетип|Нумерология|Дизайн)\]/g, (m, s) => srcChip(Object.keys(SN.SRC).find((k) => SN.SRC[k] === s))).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/→ Действие:/g, '<b class="actline">→ Действие:</b>').replace(/\n/g, '<br>');
  }
  function bubble(m) { return `<div class="msg ${m.role === 'user' ? 'me' : 'bot'}">${m.role === 'user' ? esc(m.content) : fmtAnswer(m.content)}${m.src === 'local' ? '<span class="msrc">базовый ответ</span>' : m.src === 'ai' ? '<span class="msrc">ИИ</span>' : ''}</div>`; }
  let asking = false;
  async function askQ(q) {
    q = (q || '').trim(); if (!q || asking) return;
    asking = true; haptic();
    state.chat.push({ role: 'user', content: q }); save(); render();
    const box = document.getElementById('chat');
    const el = document.createElement('div'); el.className = 'msg bot typing'; el.innerHTML = '<span class="dots"><i></i><i></i><i></i></span>'; box.appendChild(el);
    el.scrollIntoView({ block: 'end', behavior: 'smooth' });
    const hist = state.chat.map((m) => ({ role: m.role, content: m.content }));
    let r;
    try { r = await SN.ask(P(), hist, (t) => { el.classList.remove('typing'); el.innerHTML = fmtAnswer(t); }); } catch (e) { r = { text: SN.localAnswer(P(), q), source: 'local' }; }
    state.chat.push({ role: 'assistant', content: r.text, src: r.source });
    if (state.chat.length > 30) state.chat = state.chat.slice(-30);
    save(); asking = false;
    if (route.name === 'ask') { render(); const c = document.getElementById('chat'); if (c && c.lastElementChild) c.lastElementChild.scrollIntoView({ block: 'start' }); }
  }
  afterRender.ask = () => {
    const f = $app.querySelector('[data-form=ask]');
    f.addEventListener('submit', (e) => { e.preventDefault(); const q = f.q.value; f.q.value = ''; askQ(q); });
    SN.aiStatus().then((s) => { const el = document.getElementById('aiState'); if (el) el.textContent = s === 'local' ? 'Сейчас работают встроенные ответы. С подключённым ИИ ответы станут живыми и подробными.' : 'Отвечает ИИ на основе твоего профиля.'; });
  };

  /* ---------- birth form ---------- */
  let pickedCity = null;
  afterRender.birth = () => {
    const p = state.profile;
    if (p && !p.custom) pickedCity = D.CITIES.find((c) => c[0] === p.cityName) || null;
    const form = $app.querySelector('[data-form=birth]');
    form.addEventListener('submit', (e) => { e.preventDefault(); submitBirth(form); });
  };
  const normRu = (s) => s.toLowerCase().replace(/ё/g, 'е');
  function renderSuggest(q) {
    const box = document.getElementById('suggest'); if (!box) return;
    q = normRu(q.trim());
    if (!q || (pickedCity && normRu(pickedCity[0]) === q)) { box.innerHTML = ''; return; }
    const list = D.CITIES.filter((c) => normRu(c[0]).startsWith(q)).concat(D.CITIES.filter((c) => !normRu(c[0]).startsWith(q) && normRu(c[0]).includes(q))).slice(0, 8);
    box.innerHTML = list.length ? `<div class="suggest">${list.map((c) => `<button type="button" data-a="pickCity" data-v="${esc(c[0])}">${esc(c[0])}</button>`).join('')}</div>` : `<p class="dim">Не нашли — отметь «Моего города нет в списке» и укажи координаты.</p>`;
  }
  function submitBirth(form) {
    const fd = new FormData(form), err = document.getElementById('formErr');
    const fail = (m) => { err.textContent = m; haptic('medium'); err.scrollIntoView({ block: 'center', behavior: 'smooth' }); };
    const date = fd.get('date'), noTime = !!fd.get('noTime'), time = noTime ? null : fd.get('time') || null, custom = !!fd.get('custom');
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return fail('Укажи дату рождения.');
    if (+date.slice(0, 4) < 1900 || new Date(date) > new Date()) return fail('Дата должна быть между 1900 годом и сегодняшним днём.');
    if (!noTime && !time) return fail('Укажи время рождения или отметь «Не знаю время».');
    let place;
    if (custom) {
      const lat = parseFloat(fd.get('lat')), lon = parseFloat(fd.get('lon')), tz = parseFloat(fd.get('tz'));
      if (!(lat >= -90 && lat <= 90) || !(lon >= -180 && lon <= 180)) return fail('Проверь координаты: широта от −90 до 90, долгота от −180 до 180.');
      if (!(tz >= -12 && tz <= 14)) return fail('Часовой пояс — число от −12 до 14, например 3 для Москвы.');
      place = { cityName: (fd.get('cname') || '').trim() || `${lat.toFixed(2)}, ${lon.toFixed(2)}`, lat, lon, tz, custom: true };
    } else {
      const name = normRu((fd.get('city') || '').trim());
      const c = pickedCity && normRu(pickedCity[0]) === name ? pickedCity : D.CITIES.find((x) => normRu(x[0]) === name);
      if (!c) return fail('Выбери город из списка или отметь «Моего города нет в списке».');
      place = { cityName: c[0], lat: c[1], lon: c[2], tz: c[3], custom: false };
    }
    if (!fd.get('consent')) return fail('Нужно согласие на использование данных для расчёта.');
    const profile = Object.assign({ date, time, name: (fd.get('name') || '').trim().slice(0, 60), niche: (fd.get('niche') || '').trim().slice(0, 60) }, place);
    try { X.calcChart(profile); } catch (e) { return fail('Не получилось рассчитать карту: ' + (e.message || e)); }
    state.profile = profile; state.onboarded = true; state.consentAt = new Date().toISOString();
    if (profile.niche && !state.ideaForm.niche) state.ideaForm.niche = profile.niche;
    if (!state.goal) state.goal = 'blog';
    recompute(); ensurePlan(true); save(); haptic('medium');
    stack = []; route = { name: 'code', params: {} }; render(true);
    toast(`Код собран: ${nSystems()} из 4 систем`);
  }

  /* ---------- actions ---------- */
  let delArmed = false;
  const A = {
    tab: (el) => tab(el.dataset.v),
    back: () => back(),
    go: (el) => { if (el.dataset.v === 'archTest') return go(arch ? 'archResult' : state.archAnswers.some(Boolean) ? 'archTest' : 'archIntro'); go(el.dataset.v, GROW.goParams(el)); },
    link: (el) => openLink(el.dataset.v),
    setGoal(el) {
      const first = !state.onboarded;
      state.goal = el.dataset.v; save(); haptic();
      if (state.plan && state.plan.goal !== state.goal) ensurePlan(true);
      if (first && !state.profile && state.demoSign == null) go('start', {}, true);
      else { back(); toast('Цель обновлена'); }
    },
    pickSign(el) { state.demoSign = +el.dataset.v; save(); haptic(); go('demoResult', {}, true); },
    finishDemo() { state.onboarded = true; if (!state.goal) state.goal = 'blog'; ensurePlan(); save(); tab('code'); },
    pickCity(el) { pickedCity = D.CITIES.find((c) => c[0] === el.dataset.v); $app.querySelector('input[name=city]').value = pickedCity[0]; document.getElementById('suggest').innerHTML = ''; haptic(); },
    archStart() { state.archIndex = AR.QUESTIONS.findIndex((_, k) => !state.archAnswers[k]); if (state.archIndex < 0) state.archIndex = 0; save(); go('archTest', {}, true); },
    archAnswer(el) {
      const i = state.archIndex || 0; state.archAnswers[i] = +el.dataset.v; haptic(); el.classList.add('on');
      const nextEmpty = AR.QUESTIONS.findIndex((_, k) => k > i && !state.archAnswers[k]);
      const anyEmpty = AR.QUESTIONS.findIndex((_, k) => !state.archAnswers[k]);
      state.archIndex = nextEmpty >= 0 ? nextEmpty : anyEmpty >= 0 ? anyEmpty : i; save();
      setTimeout(() => (anyEmpty < 0 ? archMaybeFinish() : render(true)), 140);
    },
    archPick(el) { state.archPicks.push(el.dataset.v); save(); haptic(); el.classList.add('on'); setTimeout(archMaybeFinish, 140); },
    archUnpick() { state.archPicks.pop(); save(); render(true); },
    archPrev() { if (archAllAnswered() && state.archPicks.length === 0 && route.name === 'archTest') { state.archIndex = AR.QUESTIONS.length - 1; state.archAnswers[state.archIndex] = 0; } else state.archIndex = Math.max(0, (state.archIndex || 0) - 1); save(); render(true); },
    archExit() { if (stack.length) back(); else tab(state.onboarded ? 'systems' : 'code'); },
    archRestart() { state.archAnswers = []; state.archIndex = 0; state.archPicks = []; state.archFeedback = null; fbDraft = { rating: 0, self: null }; recompute(); save(); route = { name: 'archIntro', params: {} }; render(true); },
    copyArch() {
      if (!arch) return; const r = arch, L = AR.A[r.ranked[0]], PP = window.VektorPassports[r.ranked[0]] || {};
      const sec = (t, x) => (x ? `\n\n— ${t} —\n` + (Array.isArray(x) ? x.map((i) => '• ' + i).join('\n') : x) : '');
      copy(`Мой ведущий архетип — ${L.name} («${PP.tagline || L.motto}»)` + (r.clarity === 'tie' ? `\nПо баллам равны: ${r.tied.map((k) => AR.A[k].name).join(', ')} — ведущий выбран в уточняющих вопросах` : '') + (r.active.length ? `\nАктивная зона (24+): ${r.active.map((k) => AR.A[k].name).join(', ')}` : '') + `\nМотивация: ${AR.DRIVES[r.drive].name}\n\n` + r.ranked.map((k) => `${AR.A[k].name} — ${r.scores[k]}/${AR.MAX}`).join('\n')
        + sec('КТО Я НА САМОМ ДЕЛЕ', PP.psyche) + sec('СИЛЬНЫЕ СТОРОНЫ', PP.strengths) + sec('СЛЕПЫЕ ЗОНЫ', PP.blindspots) + sec('ТОЧКА РОСТА', PP.growth) + sec('ЧТО СНИМАТЬ', PP.content) + sec('ФОРМАТЫ', PP.formats) + sec('ИДЕИ РОЛИКОВ', PP.examples) + sec('В КАДРЕ', PP.onCam) + sec('ГОЛОС', PP.voice) + sec('ОДЕЖДА', PP.clothes) + sec('МЕТОД СЪЁМКИ', PP.method) + sec('ПАЛИТРА', PP.palette && PP.palette.join('  ')) + `\n\nПройди тест: ${C.botUrl}`);
    },
    fbRate(el) { fbDraft.rating = +el.dataset.v; haptic(); if (fbDraft.rating >= 4) { fbDraft.self = null; sendFeedback(); } else render(); },
    fbSelf(el) { fbDraft.self = el.dataset.v; haptic(); render(); },
    fbSend() { if (fbDraft.self) sendFeedback(); },
    copyHex(el) { copy(el.dataset.v); },

    saveCard(el) { const id = el.dataset.id, c = cardsCache[id]; if (isSaved(id)) state.saved = state.saved.filter((x) => x.id !== id); else if (c) state.saved.push(Object.assign({}, c)); save(); haptic(); toast(isSaved(id) ? 'Сохранено' : 'Убрано'); render(); },
    saveIdea(el) { const id = el.dataset.id, i = findIdea(id); if (isSaved(id)) state.saved = state.saved.filter((x) => x.id !== id); else if (i) state.saved.push(Object.assign({}, i)); save(); haptic(); toast(isSaved(id) ? 'Сохранено' : 'Убрано'); render(); },
    tryAct(el) { const c = cardsCache[el.dataset.id]; if (!c) return; ensurePlan(); if (!state.plan.extra.some((x) => x.text === c.act)) state.plan.extra.push({ text: c.act, done: false }); save(); haptic('medium'); toast('Добавлено в план'); },
    copyCard(el) { const c = cardsCache[el.dataset.id]; if (c) copy(cardText(c)); },
    copyIdea(el) { const i = findIdea(el.dataset.id); if (i) copy(ideaText(i)); },
    copyCode() {
      const p = P(), B = SN.code(p);
      const sec = (t, arr) => arr.length ? `\n${t}\n` + arr.map((x) => `— ${x.text}`).join('\n') : '';
      copy(`Мой код креатора: ${SN.formula(p).map((x) => x.text).join(' + ')}\n` + SN.pill(p).map((r) => `${r.k}: ${r.v}`).join('\n') + sec('Каким быть в кадре', B.who) + sec('Как снимать', B.how) + sec('Что снимать', B.what) + `\n\n— ${C.appName}`);
    },
    board(el) { go('board', { id: el.dataset.id }); },
    copyBoard(el) { const i = findIdea(el.dataset.id); if (!i) return; copy(`Раскадровка: «${i.title}»\n${i.fmtName} · ${i.platform}\n\n` + storyboard(i).map((s) => `Кадр ${s.n} (${s.sec} с) — ${s.size}, ${s.move}\nТекст: ${s.text}\nДействие: ${s.action}\nЗвук: ${s.sound}\nРеквизит: ${s.props}`).join('\n\n')); },
    ideaToPlan(el) { const i = findIdea(el.dataset.id); if (!i) return; ensurePlan(); const t = `Снять по раскадровке: «${i.title}»`; if (!state.plan.extra.some((x) => x.text === t)) state.plan.extra.push({ text: t, done: false }); save(); haptic('medium'); toast('Добавлено в план'); },
    ideaOpt(el) { state.ideaForm[el.dataset.k] = el.dataset.v; save(); haptic(); render(); },
    toggle(el) { const i = +el.dataset.i, pl = state.plan; if (!pl) return; const it = i < pl.items.length ? pl.items[i] : pl.extra[i - pl.items.length]; it.done = !it.done; save(); haptic(it.done ? 'medium' : 'light'); if (it.done) toast('Готово! Так держать'); render(); },
    resetPlan() { state.plan = null; ensurePlan(true); state.plan.extra = []; save(); toast('Новый план готов'); render(); },
    askChip(el) { askQ(el.dataset.v); },
    clearChat() { state.chat = []; save(); render(); },
    want() { toast('Спасибо! Напиши нам — сообщим о запуске'); setTimeout(() => openLink(C.contactUrl), 600); haptic(); },
    share() { openLink(`https://t.me/share/url?url=${encodeURIComponent(C.botUrl)}&text=${encodeURIComponent('Узнай свой код креатора: что снимать, как снимать и каким быть в кадре')}`); },
    delete(el) {
      if (!delArmed) { delArmed = true; el.textContent = 'Точно удалить? Нажми ещё раз'; haptic('heavy'); setTimeout(() => { delArmed = false; if (el.isConnected) el.textContent = 'Удалить мои данные'; }, 4000); return; }
      delArmed = false; try { localStorage.removeItem(KEY); } catch (e) {}
      state = fresh(); recompute(); stack = []; route = { name: 'welcome', params: {} }; render(true); toast('Все данные удалены');
    },
  };

  /* ---------- студия ---------- */
  const STUDIO = window.VektorStudio({
    get state() { return state; }, save, esc, G, head, srcChip, render, go, tab, haptic, toast, copy, rng, P, ensurePlan, ideaCard, userName, nSystems,
    arch: () => arch, chart: () => chart, num: () => num, hd: () => hd, bal: () => bal, routeName: () => route.name,
  });
  Object.assign(screens, STUDIO.screens);
  Object.assign(A, STUDIO.actions);
  afterRender.profile = STUDIO.animateDash;
  GROW = window.VektorGrowth({
    get state() { return state; }, save, esc, G, head, render, go, haptic, toast, copy, rng, P, userName,
    arch: () => arch, chart: () => chart, num: () => num, hd: () => hd, routeName: () => route.name,
  });
  Object.assign(screens, GROW.screens);
  Object.assign(A, GROW.actions);
  afterRender.trainerDay = GROW.afterTrainerDay;
  const LAB = window.VektorHookLab({ get state() { return state; }, save, esc, head, render, haptic, toast, routeName: () => route.name, nicheObj: () => STUDIO.nicheObj(), nicheField: () => STUDIO.nicheField(), plural: (n, a, b, c) => window.VektorHooks.plural(n, a, b, c) });
  Object.assign(screens, LAB.screens);
  Object.assign(A, LAB.actions);
  const PROF = window.VektorProfile({ get state() { return state; }, esc, G, P, userName, radar: (sc) => radar(sc), emblem: (e, z) => STUDIO.emblem(e, z), arch: () => arch, chart: () => chart, num: () => num, hd: () => hd, bal: () => bal });
  afterRender.warmup = GROW.afterWarmup;

  $app.addEventListener('click', (e) => { const el = e.target.closest('[data-a]'); if (!el || !$app.contains(el)) return; const fn = A[el.dataset.a]; if (fn) { e.preventDefault(); fn(el, e); } });
  $tabs.addEventListener('click', (e) => { const el = e.target.closest('[data-a]'); if (el) A[el.dataset.a](el, e); });
  $app.addEventListener('input', (e) => {
    const el = e.target, k = el.dataset && el.dataset.in; if (!k) return;
    if (LAB.onInput(k, el) || STUDIO.onInput(k, el) || GROW.onInput(k, el)) return;
    if (k === 'niche' || k === 'audience') { state.ideaForm[k] = el.value; save(); }
    if (k === 'bioAudience') { state.bioForm.audience = el.value; save(); }
    if (k === 'bioCode') { state.bioForm.code = el.value; save(); }
    if (k === 'city') { pickedCity = null; renderSuggest(el.value); }
  });
  $app.addEventListener('change', (e) => {
    const el = e.target, k = el.dataset && el.dataset.in; if (!k) return;
    if (GROW.onChange(k, el) || STUDIO.onChange(k)) return;
    if (k === 'noTime') { const t = $app.querySelector('input[name=time]'); t.disabled = el.checked; if (el.checked) t.value = ''; }
    if (k === 'custom') { $app.querySelector('#customBox').hidden = !el.checked; $app.querySelector('input[name=city]').disabled = el.checked; document.getElementById('suggest').innerHTML = ''; }
  });

  if (tg) {
    try { tg.ready(); tg.expand(); if (tgv('6.1')) { tg.setHeaderColor('#090C18'); tg.setBackgroundColor('#090C18'); tg.BackButton.onClick(back); } if (tgv('7.7') && tg.disableVerticalSwipes) tg.disableVerticalSwipes(); } catch (e) {}
  }
  if (state.onboarded) route = { name: 'code', params: {} };
  else if (state.demoSign != null && state.goal) route = { name: 'demoResult', params: {} };
  render(true);
})();
