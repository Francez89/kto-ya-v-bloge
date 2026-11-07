/*
 * Экраны «Почему не залетает», «Календарь лучших дней», «Совместимость», «Стратегия на 90 дней», «Тарифы»,
 * шкала «Код раскрыт», редкость кода и мягкий платный замок с личной зацепкой.
 * Подключается к app.js через контекст C, как js/growth.js.
 */
window.VektorInsightUI = function (C) {
  const IN = window.VektorInsight, D = window.VektorData, SY = window.VektorSystems, AR = window.VektorArchetypes, CFG = window.VektorConfig, NI = window.VektorNiches;
  const { esc, head } = C;
  const st = () => C.state;
  const tg = window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData ? window.Telegram.WebApp : null;
  const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  const wd = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
  const fmtD = (d) => `${d.getDate()} ${months[d.getMonth()]}`;
  const fmtList = (arr) => arr.map((d, i) => (i === arr.length - 1 || arr[i + 1].getMonth() !== d.getMonth() ? fmtD(d) : d.getDate())).join(', ');
  const SRC = { chart: 'Карта', arch: 'Архетип', num: 'Числа', hd: 'Дизайн' };
  const chip = (src) => (SRC[src] ? `<span class="src src-${src}">${SRC[src]}</span>` : '');
  const plural = (n, a, b, c) => window.VektorHooks.plural(n, a, b, c);

  /* ---------- доступ и оплата ---------- */
  const PACK_ENT = { code: ['code'], strat: ['strat'], pro: ['code', 'strat'] };
  const ent = () => (st().ent = st().ent && typeof st().ent === 'object' ? st().ent : {});
  const has = (k) => !!CFG.openAll || !!ent()[k];
  const price = (k) => ((CFG.prices || {})[k] || { code: 149, strat: 399, pro: 449 }[k]);
  const base = () => (CFG.analyzeEndpoint || CFG.remindEndpoint || CFG.feedbackEndpoint || '').replace(/\/(analyze|remind|feedback)\/?$/, '');
  const seen = (k) => { const s = st(); s.seen = s.seen || {}; if (!s.seen[k]) { s.seen[k] = Date.now(); C.save(); } };

  /** Замок: настоящее содержимое под размытием и личная зацепка поверх. Купившим — всё открыто. */
  function lock(k, teaser, inner, small) {
    if (has(k)) return inner;
    const pack = k === 'strat' ? 'pro' : 'code';
    return `<div class="lock ${small ? 'sm' : ''}"><div class="lock-blur" aria-hidden="true" inert>${inner}</div><div class="lock-cta"><span class="lock-ic">🔒</span><b>${esc(teaser)}</b><button class="btn sm" data-a="go" data-v="tariffs" data-k="${pack}">Открыть${k === 'strat' ? ' стратегию' : ' полный код'}</button></div></div>`;
  }

  async function sync() {
    if (!tg || !base()) return;
    try {
      const r = await fetch(base() + '/me', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ initData: tg.initData }) });
      const j = await r.json();
      if (j && Array.isArray(j.ent)) { const e = ent(); let changed = false; j.ent.forEach((k) => { if (!e[k]) { e[k] = true; changed = true; } }); if (changed) { C.save(); C.render(); } }
    } catch (e) {}
  }
  async function buy(pack) {
    if (!CFG.paymentsEnabled || !base() || !tg || !tg.openInvoice) { C.toast('Спасибо! Напиши нам — откроем доступ'); setTimeout(() => C.openLink(CFG.contactUrl), 600); return; }
    try {
      C.toast('Готовлю оплату…');
      const r = await fetch(base() + '/invoice', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ initData: tg.initData, pack }) });
      const j = await r.json();
      if (!j.link) { C.toast('Оплата сейчас недоступна, попробуй позже'); return; }
      tg.openInvoice(j.link, (status) => {
        if (status !== 'paid') return;
        (PACK_ENT[pack] || []).forEach((k) => (ent()[k] = true)); C.save();
        C.haptic('heavy'); C.toast('Оплачено! Всё открыто'); C.render(true);
      });
    } catch (e) { C.toast('Нет связи с сервером оплаты'); }
  }

  /* ---------- данные человека ---------- */
  const PX = () => {
    const p = C.P(), s = st(), num = C.num();
    return Object.assign({}, p, { date: s.profile && s.profile.date, life: num && num.life });
  };
  const nicheN = () => { const t = (st().ideaForm.niche || '').trim(); return t ? NI.resolve(t) : null; };
  function hooksFor(n, seed) {
    const N = nicheN(); if (!N || !window.VektorStop) return [];
    try { return window.VektorStop.batch(N, { count: n, seed: seed || 3, delivery: 'voice' }).items.map((h) => h.text); } catch (e) { return []; }
  }

  /* ---------- шкала «Код раскрыт» и редкость ---------- */
  function progressCard() {
    const pr = IN.progress(st(), PX(), has);
    const n = pr.next;
    return `<div class="card prog"><div class="row between"><b>Код раскрыт на ${pr.pct}%</b><span class="dim">${pr.pct >= 100 ? 'полностью' : 'осталось ' + (100 - pr.pct) + '%'}</span></div>
      <span class="pbar big"><i style="width:${pr.pct}%"></i></span>
      ${n ? `<button class="prog-next" data-a="go" data-v="${n.to}"${n.to === 'tariffs' ? ' data-k="code"' : ''}><span>Следующий шаг: <b>${esc(n.name)}</b></span><em>+${n.w}%</em></button>` : ''}</div>`;
  }
  function rarityCard() {
    const r = IN.rarity(PX()); if (!r) return '';
    return `<div class="card rare"><span class="rare-n">${r.pctText}%</span><div><b>Твоё сочетание — у ${r.pctText}% людей</b><small>${esc(r.parts.join(' + '))} — примерно 1 из ${r.oneIn.toLocaleString('ru-RU')}. Оценка по частоте каждого признака.</small></div><button class="iconbtn" data-a="shareRare" aria-label="Поделиться">↗</button></div>`;
  }
  function codeCards() {
    if (!st().profile) return '';
    const W = IN.why(PX()), top = W[0];
    return progressCard() + rarityCard() + `<button class="card tap why-cta" data-a="go" data-v="why"><span class="why-ic">?</span><span><small>Разбор по твоему коду</small><b>Почему твои ролики не залетают</b><span class="dim">Главная причина: ${esc(top.title.toLowerCase())}. И ещё две.</span></span><span class="v muted">›</span></button>
      <div class="tiles three"><button class="tile" data-a="go" data-v="calendar"><span class="ic">🗓</span><span><b>Лучшие дни</b><small>Когда снимать и продавать</small></span></button>
      <button class="tile" data-a="go" data-v="compat"><span class="ic">🤝</span><span><b>Совместимость</b><small>Коллабы и клиенты</small></span></button>
      <button class="tile" data-a="go" data-v="strategy"><span class="ic">🧭</span><span><b>Стратегия 90 дней</b><small>${has('strat') ? 'Открыта' : 'План до продаж'}</small></span></button></div>`;
  }

  /* ---------- экраны ---------- */
  const needData = () => `<div class="card empty"><div class="ic">✦</div><p style="margin-bottom:16px">Нужна хотя бы дата рождения.</p><button class="btn" data-a="go" data-v="birth">Ввести данные</button></div>`;
  const screens = {
    why() {
      if (!st().profile) return head('Разбор', 'Почему не залетает', '') + needData();
      seen('why');
      const W = IN.why(PX()), sys = C.nSystems();
      return head('Разбор по твоему коду', 'Почему твои ролики не залетают', `Три главные причины именно у тебя — и что с каждой делать. ${sys < 4 ? `Собрано систем: ${sys} из 4 — чем больше, тем точнее.` : ''}`) + `<div class="stack-lg">
        ${W.map((r, i) => `<article class="card why" style="--d:${i * 0.1}s"><div class="row between"><span class="why-n">${i + 1}</span><span class="badge">${esc(r.catName)}</span></div>
          <h2>${esc(r.title)}</h2><p>${esc(r.text)} ${chip(r.src)}</p>
          <div class="gx gx-grow"><span>Что делать</span><ul class="gx-l">${r.fix.map((f) => `<li>${esc(f)}</li>`).join('')}</ul></div>
          <button class="btn sm" data-a="go" data-v="${r.act}">${esc(r.actLabel)} →</button></article>`).join('')}
        ${has('strat') ? '' : `<div class="card accent stack offer-mini"><span class="eyebrow">Закрыть все три причины за 90 дней</span><p>Стратегия по твоему коду: план на 13 недель, готовые сценарии на первые 2 недели, воронка и практики прокачки слабых сторон.</p><button class="btn" data-a="go" data-v="strategy">Посмотреть стратегию</button></div>`}
        ${!C.arch() ? '<button class="btn soft" data-a="go" data-v="archTest">Пройти тест архетипов — разбор станет точнее</button>' : ''}</div>`;
    },
    calendar() {
      if (!st().profile) return head('Календарь', 'Лучшие дни', '') + needData();
      seen('calendar');
      const date = st().profile.date, days = IN.calendar(date, new Date(), 30), t = days[0];
      const hk = hooksFor(3, new Date().getDate())[0];
      const sell = IN.bestDays(days, ['sell']), shoot = IN.bestDays(days, ['shoot', 'batch']), start = IN.bestDays(days, ['start']);
      const row = (d, i) => `<div class="cal-d ${i === 0 ? 'on' : ''} k-${d.kind}"><div class="cal-date"><b>${d.date.getDate()}</b><small>${wd[d.date.getDay()]}</small></div><div class="cal-t"><b>${d.K.ic} ${esc(d.K.name)}</b><small>${esc(d.idea)}</small>${d.retro ? '<em>☿ ретро</em>' : ''}</div></div>`;
      const rem = st().dayRemind || {};
      return head('Календарь лучших дней', 'Когда снимать, продавать и отдыхать', 'По твоему личному дню, Луне и Меркурию. Подстрой под него контент-план — и делай сложное в свои сильные дни.') + `<div class="stack-lg">
        <div class="card accent stack"><span class="eyebrow">Сегодня · ${fmtD(t.date)}</span><h2>${t.K.ic} ${esc(t.K.name)}</h2><p>${esc(t.K.text)}</p>
          <p class="dim">Личный день ${t.pDay}${t.moon != null ? ` · Луна в знаке ${D.SIGNS[t.moon].name}: ${esc(t.fmt)}` : ''}.</p>${t.note ? `<p class="warnline">${esc(t.note)}</p>` : ''}
          <div class="gx gx-use"><span>Идея на сегодня</span><p>${esc(t.idea)}</p></div>
          ${hk ? `<div class="gx gx-grow"><span>Хук под твою нишу</span><p>«${esc(hk)}»</p></div>` : '<button class="linkbtn" data-a="go" data-v="hooks">Укажи нишу — добавлю хук дня</button>'}</div>
        <div class="card stack"><span class="eyebrow">Лучшие дни в ближайшие 30 дней</span>
          <p><b>💰 Продавать:</b> ${sell.length ? fmtList(sell) : 'в ближайший месяц нет — копи кейсы и отзывы'}</p>
          ${lock('code', `Ещё ${shoot.length + start.length} сильных ${plural(shoot.length + start.length, 'день', 'дня', 'дней')} для съёмок и запусков — в полном коде`, `<p><b>🎬 Снимать:</b> ${fmtList(shoot) || '—'}</p><p><b>🚀 Запускать:</b> ${fmtList(start) || '—'}</p>`, true)}</div>
        <div class="card stack"><span class="eyebrow">Неделя</span><div class="cal">${days.slice(0, 7).map(row).join('')}</div>
          ${lock('code', 'Календарь на месяц вперёд с идеей на каждый день', `<div class="cal">${days.slice(7, 30).map((d) => row(d, -1)).join('')}</div>`)}</div>
        ${CFG.remindEndpoint && tg ? `<div class="card stack"><span class="eyebrow">Утреннее сообщение</span><p class="dim">Каждое утро бот пришлёт: какой сегодня день и что снять.</p><button class="btn ${rem.on ? 'ghost' : ''}" data-a="dayRemind">${rem.on ? 'Выключить' : 'Присылать каждое утро в 9:00'}</button></div>` : ''}</div>`;
    },
    compat() {
      seen('compat');
      const s = st(), f = (s.compatForm = s.compatForm || { name: '', date: '', mode: 'collab' });
      const myDate = s.profile && s.profile.date;
      if (!myDate) return head('Совместимость', 'Сначала твои данные', '') + needData();
      let res = '';
      if (f.result) {
        const chartSun = C.chart() ? C.chart().planets.sun.sign : null;
        const r = IN.compat({ sun: chartSun, life: IN.lifeOf(myDate), date: myDate }, { date: f.result.date }, f.result.mode);
        const nm = esc(f.result.name || (f.result.mode === 'client' ? 'клиент' : 'партнёр'));
        const cl = r.client;
        res = `<div class="card accent stack compat-res"><div class="cmp-top"><div class="cmp-ring" style="--p:${r.score}"><b>${r.score}</b><small>из 100</small></div><div><span class="eyebrow">${f.result.mode === 'client' ? 'Ты и клиент' : 'Ты и ' + nm}</span><h2>${esc(r.verdict)}</h2><p class="dim">${nm}: ${D.SIGNS[r.other.sign].name}${r.other.cusp ? ' (на границе знаков)' : ''} · путь ${r.other.life} — ${esc(r.other.title.toLowerCase())}</p></div></div>
          <p>${esc(r.el)}</p><p>${esc(r.nums)}</p></div>
          ${cl ? `<div class="card stack"><span class="eyebrow">Как ${nm} принимает решения</span><p>${esc(cl.decides)}.</p><div class="gx gx-use"><span>Как продавать</span><p>${esc(cl.sell)}</p></div>
            ${lock('code', `Слова, которые продают именно ${f.result.name ? nm : 'этому клиенту'}, и готовое первое сообщение`, `<div class="gx gx-grow"><span>Слова, которые работают</span><p>${esc(cl.words)}</p></div><div class="gx gx-risk"><span>Чего избегать</span><p>${esc(cl.avoid)}</p></div><div class="gx gx-bal"><span>Первое сообщение</span><p>«${esc(cl.first)}»</p></div><button class="btn sm ghost" data-a="copyText" data-v="${esc(cl.first)}">Скопировать сообщение</button>`)}</div>`
            : `<div class="card stack"><span class="eyebrow">Ваша коллаборация</span><div class="gx gx-use"><span>Формат, который зайдёт</span><p>${esc(r.format)}</p></div><div class="gx gx-grow"><span>Кто ведёт</span><p>${esc(r.roles)}</p></div>
            ${lock('code', 'Где вы можете поссориться и как этого избежать', `<div class="gx gx-risk"><span>Где споткнётесь</span><p>${esc(r.risk)}</p></div>`, true)}</div>`}
          <button class="btn soft" data-a="shareCompat">Поделиться — пусть друзья проверят свою пару</button>`;
      }
      const hist = (s.compatHist || []).slice(0, 5);
      return head('Совместимость', 'С кем снимать и как продавать', 'Введи дату рождения блогера для коллаборации — или клиента, чтобы понять, как ему продавать.') + `<div class="stack-lg">
        <div class="card stack"><div class="chips"><button class="chip ${f.mode === 'collab' ? 'on' : ''}" data-a="compatMode" data-v="collab">🤝 Коллаборация</button><button class="chip ${f.mode === 'client' ? 'on' : ''}" data-a="compatMode" data-v="client">💼 Клиент</button></div>
          <label class="f">Имя<input type="text" data-in="compatName" value="${esc(f.name)}" maxlength="30" placeholder="например: Аня" autocomplete="off"></label>
          <label class="f">Дата рождения<input type="date" data-in="compatDate" value="${esc(f.date)}" min="1920-01-01" max="2025-12-31"></label>
          <button class="btn" data-a="compatRun">Проверить совместимость</button>
          ${hist.length ? `<div class="chips">${hist.map((h, i) => `<button class="chip" data-a="compatHist" data-i="${i}">${esc(h.name || h.date)}</button>`).join('')}</div>` : ''}</div>
        ${res}</div>`;
    },
    strategy() {
      if (!st().profile) return head('Стратегия', 'На 90 дней', '') + needData();
      seen('strategy');
      const owned = has('strat'), S = IN.strategy(PX(), { hooks: hooksFor(8, 5) });
      const wk = (w) => `<article class="card stack wk"><div class="row between"><span class="eyebrow">Неделя ${w.n} · ${esc(w.phase)}</span><span class="dim">с ${fmtD(w.date)}</span></div><h2>${esc(w.theme)}</h2>
        ${w.videos.map((v) => `<div class="vid r${v.r}"><b>${esc(v.role)}</b>${v.hook ? `<p class="hook">«${esc(v.hook)}»</p>` : ''}<ol class="steps">${v.beats.map((b) => `<li>${esc(b)}</li>`).join('')}</ol>${v.shoot ? `<small class="dim">Как снимать: ${esc(v.shoot)}</small>` : ''}</div>`).join('')}
        ${w.focus ? `<p class="dim">Личный ${esc(w.focus)}.</p>` : ''}${w.practice ? `<div class="gx gx-grow"><span>Практика недели</span><p>${esc(w.practice)}</p></div>` : ''}</article>`;
      const offer = owned ? '' : `<div class="card accent stack offer"><span class="eyebrow">Что внутри стратегии</span>
        <ul class="gx-l"><li><b>План на 13 недель</b> — от узнаваемости к продажам, темы и роли каждого ролика.</li><li><b>Готовые сценарии на 2 недели</b> с хуками под твою нишу.</li><li><b>Воронка и лестница продуктов</b> по твоей линии заработка.</li><li><b>Практика недели</b> — прокачка слабых линий квадрата.</li><li><b>Бонус:</b> полный код открыт и 5 ИИ-разборов роликов.</li></ul>
        <p class="anchor">Продюсер за такую стратегию берёт от 15 000 ₽.</p>
        <button class="btn" data-a="buy" data-v="pro">Открыть за ${price('pro')} ⭐</button></div>`;
      return head('Стратегия блога на 90 дней', 'От первого ролика до продаж', 'Собрана по твоему архетипу, числам и квадрату. Первая неделя — бесплатно.') + `<div class="stack-lg">
        ${!nicheN() ? `<div class="card stack"><p class="dim">Укажи нишу — сценарии получат хуки именно под неё.</p>${C.nicheField()}</div>` : ''}
        <div class="card stack"><span class="eyebrow">Три этапа</span>${S.phases.map((p, i) => `<div class="phase"><b>${i + 1}. ${esc(p.name)}</b><small>${esc(p.goal)} Смотрим на: ${esc(p.kpi)}.</small></div>`).join('')}</div>
        ${S.style ? `<div class="card stack"><span class="eyebrow">Твой стиль · ${esc(S.style.name)}</span><p>${esc(S.style.inFrame)}</p><p class="dim">${esc(S.style.shoot)}</p></div>` : ''}
        ${wk(S.weeks[0])}
        ${offer}
        ${lock('strat', `Ещё 12 недель плана, сценарии второй недели и твоя воронка продаж`, S.weeks.slice(1).map(wk).join('') + `<div class="card stack"><span class="eyebrow">Воронка</span><ol class="steps">${S.funnel.map((x) => `<li>${esc(x)}</li>`).join('')}</ol></div><div class="card stack"><span class="eyebrow">Лестница продуктов</span><ol class="steps">${S.ladder.map((x) => `<li>${esc(x)}</li>`).join('')}</ol></div>`)}</div>`;
    },
    tariffs({ k } = {}) {
      const card = (key, name, items, opts) => `<article class="card tariff ${opts.best ? 'accent best' : ''} ${k === key ? 'pick' : ''}">${opts.best ? '<span class="best-tag">выбор большинства</span>' : ''}<div class="row between"><h2>${esc(name)}</h2>${opts.owned ? '<span class="badge">открыто</span>' : ''}</div>
        <div class="price">${price(key)} ⭐${opts.old ? `<s>${opts.old} ⭐</s>` : ''}</div><ul>${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>${opts.owned ? '' : `<button class="btn ${opts.best ? '' : 'ghost'} sm" style="margin-top:14px" data-a="buy" data-v="${key}">Открыть</button>`}</article>`;
      const all = has('code') && has('strat');
      return head('Тарифы', 'Открой код полностью', 'Основное — бесплатно. Платно — то, что экономит месяцы проб и ошибок.') + `<div class="stack">
        ${card('code', 'Полный код', ['Планы прокачки всех ячеек и линий квадрата', 'Опасности и тормоза по Дизайну человека', 'Календарь лучших дней на месяц', 'Глубокая совместимость: слова и первое сообщение клиенту'], { owned: has('code') })}
        ${card('pro', 'Всё вместе', ['Полный код', 'Стратегия на 90 дней', '5 ИИ-разборов роликов', 'Все будущие разделы кода'], { best: true, owned: all, old: price('code') + price('strat') + 150 })}
        ${card('strat', 'Стратегия на 90 дней', ['13 недель плана от узнаваемости до продаж', 'Сценарии на первые 2 недели', 'Воронка и лестница продуктов'], { owned: has('strat') })}
        <p class="anchor">Для сравнения: одна консультация продюсера — от 5 000 ₽.</p>
        ${!CFG.paymentsEnabled ? '<p class="dim">Оплата звёздами Telegram скоро. Нажми «Открыть» — напишем, как получить доступ.</p>' : ''}</div>`;
    },
  };

  /* ---------- действия ---------- */
  const actions = {
    buy: (el) => buy(el.dataset.v),
    compatMode(el) { const f = st().compatForm; f.mode = el.dataset.v; if (f.result) f.result.mode = f.mode; C.save(); C.render(); },
    compatRun() {
      const f = st().compatForm;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(f.date || '') || +f.date.slice(0, 4) < 1920) { C.toast('Укажи дату рождения'); return; }
      f.result = { name: (f.name || '').trim(), date: f.date, mode: f.mode };
      const h = (st().compatHist = (st().compatHist || []).filter((x) => x.date !== f.date || x.name !== f.result.name));
      h.unshift({ name: f.result.name, date: f.date, mode: f.mode }); h.length = Math.min(h.length, 8);
      C.save(); C.haptic('medium'); C.render();
      setTimeout(() => { const r = document.querySelector('.compat-res'); if (r) r.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 50);
    },
    compatHist(el) { const x = (st().compatHist || [])[+el.dataset.i]; if (!x) return; Object.assign(st().compatForm, { name: x.name, date: x.date, mode: x.mode, result: Object.assign({}, x) }); C.save(); C.render(); },
    shareCompat() { C.openLink(`https://t.me/share/url?url=${encodeURIComponent(CFG.botUrl)}&text=${encodeURIComponent('Проверил(а) нашу совместимость для блога. Проверь свою пару — и узнай, с кем снимать коллабы')}`); },
    shareRare() { const r = IN.rarity(PX()); if (!r) return; C.openLink(`https://t.me/share/url?url=${encodeURIComponent(CFG.botUrl)}&text=${encodeURIComponent(`Мой код креатора — ${r.parts.join(' + ')}. Такой у ${r.pctText}% людей. А какой у тебя?`)}`); },
    copyText(el) { C.copy(el.dataset.v); },
    async dayRemind() {
      const rem = (st().dayRemind = st().dayRemind || {}), on = !rem.on;
      try {
        const r = await fetch(CFG.remindEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ initData: tg.initData, kind: 'day', on, hour: 9, tz: -new Date().getTimezoneOffset(), date: st().profile.date }) });
        if (!r.ok) throw new Error(); rem.on = on; C.save(); C.toast(on ? 'Каждое утро в 9:00 — подсказка дня' : 'Утренние сообщения выключены'); C.render();
      } catch (e) { C.toast('Не получилось. Открой бота и нажми «Запустить»'); }
    },
  };
  function onInput(k, el) {
    if (k === 'compatName' || k === 'compatDate') { const f = st().compatForm = st().compatForm || { mode: 'collab' }; f[k === 'compatName' ? 'name' : 'date'] = el.value; C.save(); return true; }
    return false;
  }
  return { screens, actions, onInput, lock, has, sync, codeCards, progressCard, rarityCard, PX };
};
