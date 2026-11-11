/*
 * Новый профиль: обложка с аватаром и орбитой, заполненность профиля, «бенто»-карточки систем,
 * радар архетипов, стихии, активность (тренажёр, план, хуки), энергия дня.
 */
window.VektorProfile = function (C) {
  const D = window.VektorData, AR = window.VektorArchetypes, SY = window.VektorSystems, EX = window.VektorExtras, SN = window.VektorSynth, HK = window.VektorHooks;
  const { esc, G } = C;
  const st = () => C.state;
  const ELC = { fire: '#FF7A45', earth: '#9BC27A', air: '#8EC5FF', water: '#7C8CFF' };
  const count = (n, cls) => `<b class="count ${cls || ''}" data-to="${n}">0</b>`;

  function completion() {
    const s = st(), m = s.mini || {}, p = s.profile;
    const items = [
      ['Дата рождения', !!p, 'birth'], ['Время рождения', !!(p && p.time), 'birth'], ['Имя для нумерологии', !!(p && p.name), 'birth'],
      ['Тест архетипов', !!C.arch(), 'archTest'], ['Канал восприятия', !!m.percRes, 'mini', 'perc'], ['Хронотип', m.chronoRes != null, 'mini', 'chrono'],
      ['Цветотип', !!m.colorRes, 'mini', 'color'], ['Ниша', !!(s.ideaForm && s.ideaForm.niche), 'hooks'],
    ];
    const done = items.filter((x) => x[1]).length;
    return { items, done, pct: Math.round((done / items.length) * 100) };
  }
  function ring(pct, size, stroke, color, inner) {
    const r = (size - stroke) / 2, c = 2 * Math.PI * r;
    return `<svg viewBox="0 0 ${size} ${size}" class="pring" style="--c:${color}"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-width="${stroke}" class="bg"/><circle cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-width="${stroke}" class="fg" style="--len:${c};--off:${c * (1 - pct / 100)}"/></svg>${inner || ''}`;
  }

  const ARC = { innocent: '#7FE0B5', everyman: '#D2B98A', hero: '#FF6B4A', caregiver: '#FF9EC4', explorer: '#4FD1C5', rebel: '#E8505B', lover: '#FF5C8A', creator: '#FFB547', ruler: '#B48CFF', magician: '#8E7CFF', sage: '#6FB3FF', jester: '#FFD93D' };
  /** Мини-график топ-5 архетипов: балл, столбик своего цвета, символ и название, линия активной зоны (24+). */
  function archChart(a) {
    const top = a.ranked.slice(0, 5), lo = Math.max(AR.PER, Math.min(...top.map((k) => a.scores[k])) - 4), hi = AR.MAX;
    const h = (v) => Math.max(6, ((v - lo) / (hi - lo)) * 100);
    const zone = 24 > lo ? h(24) : null;
    return `<span class="ach">${zone != null ? `<span class="ach-zone" style="bottom:calc(38px + 89.6px * ${(zone / 100).toFixed(3)})"></span>` : ''}${top.map((k, i) => `<span class="ach-col ${i === 0 ? 'lead' : ''}" style="--c:${ARC[k] || '#FFB547'};--d:${i * 0.09}s"><span class="trk"><b>${a.scores[k]}</b><i style="--h:${h(a.scores[k])}%"></i></span><small>${G(AR.A[k].glyph)}<br>${AR.A[k].name}</small></span>`).join('')}</span>${zone != null ? '<span class="ach-leg">┄ пунктир — активная зона (24+)</span>' : ''}`;
  }
  function html() {
    const s = st(), ch = C.chart(), a = C.arch(), num = C.num(), hd = C.hd(), bal = C.bal(), m = s.mini || {};
    const sg = ch ? D.SIGNS[ch.planets.sun.sign] : s.demoSign != null ? D.SIGNS[s.demoSign] : null;
    const el = sg ? sg.element : 'fire', lead = a ? a.ranked[0] : null, PP = lead ? (window.VektorPassports[lead] || {}) : {};
    const name = C.userName() || 'Креатор', initials = name.split(' ').map((x) => x[0]).join('').slice(0, 2).toUpperCase();
    const comp = completion(), P = C.P(), formula = SN.formula(P);
    const t = s.trainer || { done: {} }, tDone = Object.keys(t.done || {}).length;
    const plan = s.plan, pl = plan ? (plan.items || []).concat(plan.extra || []).filter(Boolean) : [], pd = pl.filter((x) => x.done).length;
    const stats = s.stats || {}, days = Math.max(1, Math.round((Date.now() - (stats.firstSeen || Date.now())) / 864e5) + 1);
    const next = comp.items.find((x) => !x[1]);

    /* обложка */
    const cover = `<div class="pcover el-${el}" style="--c1:${ELC[el]}">
      <div class="pc-bg"></div>
      <div class="pc-ava"><div class="pc-orbit">${[
          sg ? [G(sg.glyph), sg.name] : ['✦', 'Знак'],
          num ? [String(num.life), 'Путь ' + num.life] : ['7', 'Число'],
          hd && SY.HD_TYPES[hd.type] ? ['⬡', SY.HD_TYPES[hd.type].name] : ['⬡', 'Дизайн'],
        ].map((x, i) => `<i style="--a:${i * 120}deg" title="${esc(x[1])}"><span>${x[0]}</span></i>`).join('')}</div>
        <div class="pc-face">${ring(comp.pct, 132, 5, 'var(--accent)')}<span class="pc-core">${lead ? `<b>${G(AR.A[lead].glyph)}</b><small>${esc(AR.A[lead].name)}</small>` : `<b class="ini">${esc(initials)}</b>`}</span></div></div>
      <h1>${esc(name)}</h1>
      <p class="pc-id">${[lead && AR.A[lead].name, sg && sg.name, hd && SY.HD_TYPES[hd.type] && SY.HD_TYPES[hd.type].name, num && 'Путь ' + num.life].filter(Boolean).map(esc).join(' · ') || 'Заполни профиль, чтобы собрать свой код'}</p>
      ${PP.tagline ? `<p class="pc-tag">«${esc(PP.tagline)}»</p>` : ''}
      <div class="pc-comp"><span>Профиль заполнен на <b>${comp.pct}%</b></span>${next ? `<button class="chip" data-a="${next[2] === 'mini' ? 'goMini' : 'go'}" data-v="${next[2]}" ${next[3] ? `data-t="${next[3]}"` : ''}>+ ${esc(next[0])}</button>` : '<span class="chip on">Всё готово ✓</span>'}</div></div>`;

    /* бенто-карточки систем */
    const tile = (cls, to, eyebrow, big, sub, extra) => `<button class="bento ${cls}" data-a="go" data-v="${to}"><span class="eyebrow">${eyebrow}</span>${big}<small>${sub}</small>${extra || ''}</button>`;
    const bento = `<div class="bento-grid">
      ${tile('b-arch wide', a ? 'archResult' : 'archTest', 'Ведущий архетип', a ? `<b class="bg-big">${G(AR.A[lead].glyph)} ${AR.A[lead].name}</b>` : '<b class="bg-big">Пройти тест</b>', a ? `${a.scores[lead]} из ${AR.MAX} · + ${a.ranked.slice(1, 3).map((k) => AR.A[k].name).join(', ')}` : '72 утверждения · 7 минут', a ? archChart(a) : '')}
      ${tile('b-sign', ch ? 'natal' : 'birth', 'Солнце', sg ? `<span class="bg-emb">${C.emblem(el, 52)}</span><b>${sg.name}</b>` : '<b>—</b>', ch ? `Луна ${D.SIGNS[ch.planets.moon.sign].name}${ch.asc ? ' · Асц ' + D.SIGNS[ch.asc.sign].name : ''}` : 'нужна дата')}
      ${tile('b-num', num ? 'numer' : 'birth', 'Число пути', num ? count(num.life, 'bg-num') : '<b class="bg-num">—</b>', num ? esc(SY.NUM[num.life].title) : 'нужна дата')}
      ${tile('b-hd', hd ? 'hdView' : 'birth', 'Дизайн человека', hd ? `<b>${SY.HD_TYPES[hd.type].name.replace('Манифестирующий', 'Манифести&shy;рующий')}</b>` : '<b>—</b>', hd ? `Профиль ${hd.profile} · ${SY.HD_AUTH[hd.authority][0].toLowerCase()} авторитет` : 'нужно время рождения')}
      ${tile('b-mini', 'systems', 'Мини-тесты', `<span class="bg-minis"><i class="${m.percRes ? 'on' : ''}">👁</i><i class="${m.chronoRes != null ? 'on' : ''}">◷</i><i class="${m.colorRes ? 'on' : ''}">🎨</i></span>`, [m.percRes && EX.PERCEPTION.result[m.percRes] && EX.PERCEPTION.result[m.percRes].title, m.chronoRes != null && EX.CHRONO.result[m.chronoRes] && EX.CHRONO.result[m.chronoRes].title, m.colorRes && EX.COLORTYPE.season[m.colorRes] && EX.COLORTYPE.season[m.colorRes].title].filter(Boolean).join(' · ') || 'восприятие, хронотип, цветотип')}
    </div>`;

    /* формула */
    const form = formula.length ? `<div class="card stack"><span class="eyebrow">Мой код</span><div class="pformula">${formula.map((f, i) => `<span class="pf src-${f.src}" style="--d:${i * 0.1}s"><i>${G(f.glyph)}</i>${esc(f.text)}</span>`).join('<em>+</em>')}</div><button class="btn sm soft" data-a="go" data-v="mycard" style="align-self:flex-start">Карточка для сторис</button></div>` : '';

    /* радар + стихии */
    const radar = a ? `<div class="card"><div class="row between"><span class="eyebrow">Архетипы</span><button class="linkbtn" data-a="go" data-v="archResult">Подробнее</button></div>${C.radar(a.scores)}</div>` : '';
    let elems = '';
    if (bal) {
      const e = bal.elements, tot = Object.values(e).reduce((x, y) => x + y, 0); let acc = 0; const R = 54, Cc = 2 * Math.PI * R;
      const arcs = ['fire', 'earth', 'air', 'water'].map((k, i) => { const v = e[k] / tot, seg = `<circle cx="70" cy="70" r="${R}" fill="none" stroke="${ELC[k]}" stroke-width="16" stroke-dasharray="${Math.max(0, v * Cc - 3)} ${Cc}" stroke-dashoffset="${-acc * Cc}" class="parc" style="--d:${i * 0.12}s"/>`; acc += v; return seg; }).join('');
      elems = `<div class="card pelems"><svg viewBox="0 0 140 140" class="pdonut"><g transform="rotate(-90 70 70)">${arcs}</g><text x="70" y="66" class="pd-big">${Math.round((e[bal.element] / tot) * 100)}%</text><text x="70" y="86" class="pd-sub">${D.ELEMENTS[bal.element].name}</text></svg>
        <div class="pe-leg"><span class="eyebrow">Стихии</span>${['fire', 'earth', 'air', 'water'].map((k) => `<div><i style="background:${ELC[k]}"></i>${D.ELEMENTS[k].name}<b>${Math.round((e[k] / tot) * 100)}%</b></div>`).join('')}<small>${esc(D.MODES[bal.mode].name)} крест</small></div></div>`;
    }

    /* активность */
    const rs = window.VektorRoute.status(s, { arch: !!(C.P && C.P().arch) });
    const act = `<div class="card stack"><span class="eyebrow">Моя активность</span><div class="pact">
      <button class="pa" data-a="go" data-v="trainer"><span class="pa-ring">${ring((tDone / 21) * 100, 64, 6, '#FFB547')}<b>${tDone}</b></span><small>Тренажёр<br>из 21 дня</small></button>
      <button class="pa" data-a="go" data-v="route"><span class="pa-ring">${ring((rs.done / rs.total) * 100, 64, 6, '#6FD39A')}<b>${rs.done}</b></span><small>Маршрут<br>из ${rs.total} дней</small></button>
      <button class="pa" data-a="go" data-v="hooks"><span class="pa-ring">${ring(Math.min(100, (stats.hooks || 0) / 2), 64, 6, '#C9B8FF')}<b>${stats.hooks || 0}</b></span><small>Хуков<br>подобрано</small></button>
      <button class="pa" data-a="go" data-v="saved"><span class="pa-ring">${ring(Math.min(100, (s.saved || []).length * 10), 64, 6, '#8EC5FF')}<b>${(s.saved || []).length}</b></span><small>В сохра-<br>нённом</small></button></div>
      <div class="pstrip"><div>${count(days)}<small>${HK.plural(days, 'день', 'дня', 'дней')} с нами</small></div><div>${count(stats.ideas || 0)}<small>идей</small></div><div>${count(stats.copies || 0)}<small>копирований</small></div></div></div>`;

    /* энергия дня */
    const day = num ? `<div class="card pday"><div class="pd-n">${num.pDay}</div><div><span class="eyebrow">Энергия дня · личный год ${num.pYear}</span><p>${esc(SY.NUM[num.pDay].day)}</p></div></div>` : '';

    /* данные и настройки */
    const g = D.GOALS[s.goal || 'blog'], p = s.profile;
    const settings = `<div class="card flat"><div class="list">
      <div class="li tap" data-a="go" data-v="birth"><span class="g">✎</span><span class="t">Данные рождения</span><span class="v muted">${p ? esc(String(p.date || '').split('-').reverse().join('.')) + (p.cityName ? ' · ' + esc(p.cityName) : '') : 'добавить'}</span></div>
      <div class="li tap" data-a="go" data-v="goal"><span class="g">${g.icon}</span><span class="t">Цель: ${g.name}</span><span class="v muted">›</span></div>
      <div class="li tap" data-a="go" data-v="tariffs"><span class="g">◇</span><span class="t">Тарифы</span><span class="v muted">›</span></div>
      <div class="li tap" data-a="go" data-v="about"><span class="g">i</span><span class="t">О приложении и данных</span><span class="v muted">›</span></div></div></div>
      <button class="btn soft" data-a="share">Поделиться приложением</button>
      <button class="btn danger" data-a="delete">Удалить мои данные</button>`;

    return `<div class="stack-lg pnew">${cover}${bento}${form}${day}${radar}${elems}${act}${settings}</div>`;
  }
  return { html, completion };
};
