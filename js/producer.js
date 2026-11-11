/*
 * Режим продюсера: клиенты продюсера или SMM-специалиста и разбор каждого —
 * каким его снимать, что ему снимать, как с ним работать, где будет сопротивляться, лучшие дни для съёмок.
 * report() — чистый расчёт (проверяется тестами), VektorProducerUI — экраны.
 */
(function (root) {
  const X = () => root.VektorAstro, HD = () => root.VektorHD, SY = () => root.VektorSystems, SN = () => root.VektorSynth;
  const AR = () => root.VektorArchetypes, D = () => root.VektorData, IN = () => root.VektorInsight, NX = () => root.VektorNumer, NG = () => root.VektorNumerGrow, HDX = () => root.VektorHDX;

  // Мастер-числа 11, 22, 33 для советов «как работать» сводим к базовым 2, 4, 6
  const baseNum = (n) => (n > 9 ? n % 9 || 9 : n);

  /** Профиль клиента → те же объекты, что у пользователя: карта, баланс стихий, числа, Дизайн человека, архетип. */
  function clientP(c) {
    const city = isFinite(c.lat) && isFinite(c.lon) ? [c.cityName || '', c.lat, c.lon, c.tz] : D().CITIES.find((x) => x[0] === c.city);
    const place = city ? { lat: city[1], lon: city[2], tz: city[3] } : { lat: 55.752, lon: 37.618, tz: 'Europe/Moscow' };
    const prof = Object.assign({ date: c.date, time: c.time || null, name: c.name }, place);
    let chart = null, bal = null, hd = null;
    try { chart = X().calcChart(prof); bal = X().balance(chart); } catch (e) {}
    if (chart && chart.timeKnown && city) { try { hd = HD().calcDesign(new Date(chart.utc)); } catch (e) {} }
    const num = SY().numerology(c.date, c.name || '');
    const arch = c.arch && AR().A[c.arch] ? (() => { const r = [c.arch].concat(c.arch2 && c.arch2 !== c.arch ? [c.arch2] : []); const rest = AR().ORDER.filter((k) => !r.includes(k)); return { ranked: r.concat(rest), top: r, active: r }; })() : null;
    if (chart && !city) chart.asc = null;
    return { name: c.name, niche: c.niche, chart, bal, hd, num, arch, demoSign: null, date: c.date, life: num.life, exact: !!(city && c.time) };
  }

  function report(c, today) {
    const P = clientP(c), B = SN().code(P), fm = SN().rankFormats(P).slice(0, 3);
    const cl = IN().CLIENT[baseNum(P.life)];
    const sq = NX().square(c.date);
    const weak = NX().LINES.map((l) => ({ l, v: sq.lines[l.k] })).filter((x) => x.v <= 2).sort((a, b) => a.v - b.v).slice(0, 3)
      .map((x) => ({ name: x.l.name, v: x.v, fix: NG().LINE[x.l.k].weak.grow[0], blog: NG().LINE[x.l.k].weak.blog }));
    const strong = NX().LINES.map((l) => ({ l, v: sq.lines[l.k] })).filter((x) => x.v >= 5).sort((a, b) => b.v - a.v).slice(0, 3)
      .map((x) => ({ name: x.l.name, v: x.v, use: NG().LINE[x.l.k].strong.use[0] }));
    const hdx = P.hd && HDX() ? HDX().TYPE[P.hd.type] : null;
    const days = IN().calendar(c.date, today || new Date(), 14);
    const sun = P.chart ? D().SIGNS[P.chart.planets.sun.sign] : null;
    const head = [sun ? `${sun.name}` : null, `путь ${P.num.life} — ${SY().NUM[P.num.life].title.toLowerCase()}`, P.hd ? `${SY().HD_TYPES[P.hd.type].name} ${P.hd.profile}` : null, P.arch ? AR().A[P.arch.ranked[0]].name : null].filter(Boolean);
    return {
      P, head,
      who: B.who, how: B.how, what: B.what, rhythm: B.rhythm, trap: B.trap,
      formats: fm.map((f) => ({ name: f.name, test: f.test })),
      work: { decides: cl.decides, sell: cl.sell, words: cl.words, avoid: cl.avoid, hd: P.hd ? `${SY().HD_TYPES[P.hd.type].strategy}. ${SY().HD_AUTH[P.hd.authority][1]}` : null, rhythm: hdx ? hdx.rhythm : null },
      resist: { weak, blockers: hdx ? hdx.blockers : [], notself: hdx ? hdx.notself : null },
      strong,
      why: IN().why(P),
      shoot: IN().bestDays(days, ['shoot', 'batch']), sell: IN().bestDays(days, ['sell']), start: IN().bestDays(days, ['start']),
      missing: [!c.time || !c.city ? 'время и город рождения (асцендент и Дизайн человека)' : null, !c.arch ? 'архетип (попроси клиента пройти тест)' : null, !c.name ? 'полное имя (числа имени)' : null].filter(Boolean),
    };
  }

  /** Отчёт текстом — чтобы отправить клиенту или вставить в свой документ. */
  function reportText(c, R, appName) {
    const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    const d = (arr) => arr.map((x) => `${x.getDate()} ${months[x.getMonth()]}`).join(', ');
    const L = (t, arr) => (arr.length ? `\n${t}\n` + arr.map((x) => '• ' + (x.text || x)).join('\n') + '\n' : '');
    return `${c.name || 'Клиент'}${c.niche ? ' · ' + c.niche : ''}\n${R.head.join(' · ')}\n`
      + L('КАКИМ БЫТЬ В КАДРЕ', R.who)
      + L('КАК СНИМАТЬ', R.how)
      + L('ЧТО СНИМАТЬ', R.what.concat(R.formats.map((f) => `Формат «${f.name}»: ${f.test}`)))
      + L('СИЛЬНЫЕ СТОРОНЫ', R.strong.map((s) => `${s.name}: ${s.use}`))
      + L('ЗОНЫ РОСТА', R.resist.weak.map((w) => `${w.name}: ${w.fix}`))
      + L('ЛУЧШИЕ ДНИ', [R.shoot.length ? 'Снимать: ' + d(R.shoot) : '', R.sell.length ? 'Продавать: ' + d(R.sell) : ''].filter(Boolean))
      + `\n— ${appName}`;
  }


  /* ================= ВЫ С КЛИЕНТОМ =================
   * Природная совместимость — как вы сойдётесь «сами по себе». Каждая договорённость (принять минус и знать, как с ним работать)
   * добавляет баллы — получается рабочая совместимость. Шкала условная: это ориентир для разговора, а не приговор.
   */
  const clamp = (v, a, b) => Math.max(a, Math.min(b, Math.round(v)));
  function pair(me, c) {
    const A = clientP(me), B = clientP(c);
    const qa = NX().square(me.date), qb = NX().square(c.date), la = qa.lines, lb = qb.lines;
    const base = IN().compat({ sun: A.chart ? A.chart.planets.sun.sign : null, life: A.life, date: me.date }, { date: c.date }, 'collab');
    const items = [];
    let pen = 0;
    const add = (k, p, pts, title, accept, how) => { pen += p; items.push({ k, pts, title, accept, how }); };
    const nm = c.name ? c.name.split(' ')[0] : 'клиент';
    // дисциплина и регулярность
    const dg = la.goal - lb.goal;
    if (dg >= 3) add('discipline', 22, 20, 'Ты держишь режим, клиент — нет', `Без напоминаний ${c.name ? nm : 'клиент'} не будет снимать регулярно. Это не лень назло тебе, а особенность характера: вести клиента — часть твоей работы.`, 'Съёмочный день раз в неделю в календаре у обоих, сценарии готовишь ты, напоминание за день. Хвали за каждый снятый ролик.');
    else if (dg <= -3) add('discipline', 18, 16, 'Клиент дисциплинированнее тебя', 'Он будет ждать от тебя сроков и отчётов — и раздражаться, если ты «в потоке».', 'Договоритесь о дедлайнах письменно и присылай короткий отчёт раз в неделю.');
    // лидерство
    const leadA = [1, 8].includes(baseNum(A.life)) || qa.cells[1] >= 4, leadB = [1, 8].includes(baseNum(B.life)) || qb.cells[1] >= 4;
    if (leadA && leadB) add('lead', 14, 14, 'Два лидера', 'Оба привыкли решать сами — спор за последнее слово неизбежен.', 'Сразу поделите зоны: идея и съёмка — твои, тема и финальное «да» — его. Записать в договор или чат.');
    else if (!leadA && leadB) add('lead', 6, 8, 'Клиент будет перетягивать решения', 'Он захочет контролировать всё, включая то, в чём не разбирается.', 'Давай выбор из двух готовых вариантов, а не открытый вопрос — так он решает, а качество остаётся за тобой.');
    // темп и характер по стихиям
    const ep = IN().EL_PAIR[[D().SIGNS[base.other.sign].element, A.chart ? D().SIGNS[A.chart.planets.sun.sign].element : base.other.el].sort().join('-')];
    if (ep && ep[0] < 70) add('tempo', 75 - ep[0], 14, 'Разный темп', ep[3], 'Обсудите заранее, сколько дней на сценарий, съёмку и монтаж. Кто быстрее — не торопит, кто медленнее — не тянет.');
    // энергия
    const eg = Math.abs(qa.cells[2] - qb.cells[2]);
    if (eg >= 2) { const low = qa.cells[2] < qb.cells[2] ? 'ты устаёшь' : `${nm} устаёт`; add('energy', 8, 9, 'Разный запас сил', `На длинной съёмке ${low} заметно раньше — отсюда раздражение и «давай уже закончим».`, 'Съёмки блоками по 60–90 минут с перерывом, самое важное — в начале дня.'); }
    // эмоции
    const tg = Math.abs(la.temper - lb.temper);
    if (tg >= 3) add('emotion', 6, 7, 'Разная эмоциональность', 'Один реагирует бурно, другой — сдержанно: легко принять спокойствие за безразличие, а эмоции — за конфликт.', 'Обсуждайте правки текстом, а не на эмоциях; острые вопросы — на следующий день.');
    // страх камеры
    if (lb.self <= 2) add('camera', 8, 9, 'Клиент зажат в кадре', 'Ему трудно показывать себя, он будет переносить съёмки и придираться к своему виду.', 'Первые съёмки — без лица или с фокусом на деле. Дай ему тренажёр камеры и хвали конкретно.');
    // продажи
    if (lb.money <= 2) add('sales', 4, 7, 'Клиенту трудно продавать', 'Он будет бояться продающих роликов и называть цену.', 'Продавай через кейсы и отзывы, а не «про себя». Продающие сценарии пиши ты.');
    // Дизайн человека клиента
    const HDT = { projector: ['Клиенту нужно признание', 'Если давить и не спрашивать его мнения — он выгорает и закрывается.', 'Спрашивай: «как ты видишь?» и признавай его экспертность вслух.'], generator: ['Клиент работает на отклике', 'На «надо» он снимает вяло, на «хочу» — живо.', 'Задавай вопросы с ответом «да/нет»: «снимем это?» — и снимай то, на что он загорелся.'], mg: ['Клиент бросает на полпути', 'Быстро загорается и так же быстро остывает к формату.', 'Договоритесь: каждый формат — минимум 5 роликов, потом решаем.'], manifestor: ['Клиент не любит контроль', 'Жёсткий надзор вызывает злость и сопротивление.', 'Дай рамку и свободу внутри неё, проси просто предупреждать о планах.'], reflector: ['Клиенту нужно время', 'Быстрые решения потом отменяются.', 'Большие решения — не в день созвона, дай ему неделю.'] };
    if (B.hd && HDT[B.hd.type]) { const h = HDT[B.hd.type]; add('hd', 5, 8, h[0], h[1], h[2]); }
    // как подавать идеи — всегда
    const cl = IN().CLIENT[baseNum(B.life)];
    add('ideas', 3, 6, 'Как подавать ему идеи', `Решения принимает ${cl.decides}.`, cl.sell);
    // правила правок — всегда
    add('rules', 6, 8, 'Правила правок', 'Без договорённости правки бесконечны — главная причина ссор продюсера и клиента.', 'Два круга правок, срок ответа 48 часов, правки одним сообщением списком.');
    const natural = clamp(base.score - pen, 3, 92);
    const sum = items.reduce((a, x) => a + x.pts, 0);
    const potential = clamp(Math.max(natural + 12, base.score * 0.35 + 60), natural, 96);
    // нормируем баллы, чтобы все договорённости вместе давали ровно потенциал
    const k = (potential - natural) / sum; let acc = 0;
    items.forEach((x, i) => { x.pts = i === items.length - 1 ? potential - natural - acc : Math.round(x.pts * k); acc += x.pts; });
    items.sort((a, b) => b.pts - a.pts);
    return { natural, potential, items, roles: base.roles.replace(/партнёр/g, 'клиент'), meData: A, clData: B };
  }
  const cap = (x) => (x ? x.charAt(0).toUpperCase() + x.slice(1) : x);
  const working = (pr, agreed) => pr.natural + pr.items.reduce((a, x) => a + (agreed && agreed[x.k] ? x.pts : 0), 0);

  root.VektorProducer = { clientP, report, reportText, pair, working };

  /* ================= ЭКРАНЫ ================= */
  root.VektorProducerUI = function (C) {
    const PR = root.VektorProducer, CFG = root.VektorConfig;
    const { esc, head } = C;
    const st = () => C.state;
    const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    const dl = (arr) => arr.map((x, i) => (i === arr.length - 1 || arr[i + 1].getMonth() !== x.getMonth() ? `${x.getDate()} ${months[x.getMonth()]}` : x.getDate())).join(', ');
    const SRC = { chart: 'Карта', arch: 'Архетип', num: 'Числа', hd: 'Дизайн' };
    const chip = (src) => (SRC[src] ? ` <span class="src src-${src}">${SRC[src]}</span>` : '');
    const list = () => (st().clients = Array.isArray(st().clients) ? st().clients : []);
    const form = () => (st().clientForm = st().clientForm || { name: '', date: '', time: '', city: '', niche: '', arch: '', arch2: '' });
    const sec = (title, arr, cls) => (arr && arr.length ? `<div class="card stack ${cls || ''}"><span class="eyebrow">${title}</span>${arr.map((x) => `<p class="line">${esc(x.text || x)}${chip(x.src)}</p>`).join('')}</div>` : '');
    const archOpts = (v) => `<option value="">не знаю</option>` + AR().ORDER.map((k) => `<option value="${k}" ${v === k ? 'selected' : ''}>${esc(AR().A[k].name)}</option>`).join('');

    const lvl = (v) => (v < 30 ? 'Будет тяжело без договорённостей' : v < 55 ? 'Рабочая пара, если договориться' : v < 75 ? 'Хорошая рабочая пара' : 'Сильная команда');
    function pairBlock(c) {
      const me = st().profile;
      if (!me || !me.date) return `<div class="card stack pairc"><span class="eyebrow">Вы с клиентом</span><p>Введи свои данные рождения — посчитаю, как вам работать вместе и о чём договориться на старте.</p><button class="btn sm" data-a="go" data-v="birth">Ввести мои данные</button></div>`;
      const pr = PR.pair(me, c), ag = c.agree || {}, w = PR.working(pr, ag);
      return `<div class="card stack pairc" data-pair="${c.id}"><div class="row between"><span class="eyebrow">Вы с клиентом</span><span class="badge warn">видишь только ты</span></div>
        <div class="ps-nums"><div><small>Сейчас</small><b class="ps-w">${w}%</b></div><span class="ps-arr">→</span><div><small>Если договориться</small><b class="ps-p">${pr.potential}%</b></div></div>
        <div class="ps-bar"><i class="ps-nat" style="width:${pr.natural}%"></i><i class="ps-work" style="left:${pr.natural}%;width:${w - pr.natural}%"></i><i class="ps-pot" style="left:${w}%;width:${pr.potential - w}%"></i></div>
        <p class="ps-lvl">${esc(lvl(w))}</p>
        <p class="dim">Природная совместимость — ${pr.natural}%: так вы сойдётесь, если ничего не обсуждать. Каждая договорённость ниже — принять минус и знать, как с ним работать — поднимает шкалу. Отмечай, о чём договорились. Шкала условная: это ориентир для разговора, а не приговор.</p>
        <div class="gx gx-grow"><span>Кто ведёт</span><p>${esc(pr.roles)}</p></div>
        <div class="agrees">${pr.items.map((x) => `<button class="agree ${ag[x.k] ? 'on' : ''}" data-a="agreeTick" data-k="${c.id}" data-v="${x.k}"><span class="ag-box"></span><span class="ag-t"><b>${esc(x.title)} <em>+${x.pts}%</em></b><small>${esc(x.accept)}</small><small class="ag-how">Как работать: ${esc(x.how.charAt(0).toLowerCase() + x.how.slice(1))}</small></span></button>`).join('')}</div></div>`;
    }
    const screens = {
      producer() {
        const f = form(), cl = list(), edit = f.editId;
        return head('Режим продюсера', 'Твои клиенты', 'Для продюсеров и СММ-специалистов: введи данные клиента — получишь разбор, как его снимать, что ему снимать и как с ним работать.') + `<div class="stack-lg">
          ${cl.length ? `<div class="stack">${cl.map((c) => { let h = ''; try { h = PR.report(c).head.join(' · '); } catch (e) {} return `<button class="card tap client-row" data-a="go" data-v="client" data-k="${c.id}"><span class="cl-av">${esc((c.name || '?').trim().charAt(0).toUpperCase())}</span><span class="t"><b>${esc(c.name || 'Без имени')}</b><small>${esc(c.niche || '')}${c.niche ? ' · ' : ''}${esc(h)}</small></span><span class="v muted">›</span></button>`; }).join('')}</div>` : '<div class="card empty"><div class="ic">🎬</div><p>Пока нет клиентов. Добавь первого — разбор займёт секунду.</p></div>'}
          <div class="card stack" id="clientForm"><span class="eyebrow">${edit ? 'Изменить клиента' : 'Новый клиент'}</span>
            <label class="f">Имя и фамилия<input type="text" data-in="cf:name" value="${esc(f.name)}" maxlength="60" placeholder="полное имя — для чисел имени" autocomplete="off"></label>
            <label class="f">Дата рождения<input type="date" data-in="cf:date" value="${esc(f.date)}" min="1920-01-01" max="2025-12-31"></label>
            <div class="grid2"><label class="f">Время<input type="time" data-in="cf:time" value="${esc(f.time)}"></label>
            <label class="f">Город<input type="text" data-in="cf:city" value="${esc(f.city)}" list="cityList" placeholder="Москва" autocomplete="off"></label></div>
            <datalist id="cityList">${D().CITIES.map((c) => `<option value="${esc(c[0])}">`).join('')}</datalist>
            <label class="f">Ниша<input type="text" data-in="cf:niche" value="${esc(f.niche)}" maxlength="60" placeholder="например: стоматолог" autocomplete="off"></label>
            <div class="grid2"><label class="f">Архетип<select data-in="cf:arch">${archOpts(f.arch)}</select></label><label class="f">Второй архетип<select data-in="cf:arch2">${archOpts(f.arch2)}</select></label></div>
            <p class="dim">Время и город — по желанию: с ними будут асцендент и Дизайн человека. Архетип — если клиент прошёл тест.</p>
            <p class="err" id="cfErr"></p>
            <button class="btn" data-a="clientSave">${edit ? 'Сохранить' : 'Добавить и разобрать'}</button>${edit ? '<button class="btn ghost" data-a="clientCancel">Отмена</button>' : ''}</div></div>`;
      },
      client({ k } = {}) {
        const c = list().find((x) => x.id === k);
        if (!c) return head('Клиент', 'Не найден', '') + '<button class="btn" data-a="go" data-v="producer">К списку клиентов</button>';
        const R = PR.report(c), W = R.work;
        return head(esc(c.niche || 'Клиент'), esc(c.name || 'Без имени'), esc(R.head.join(' · '))) + `<div class="stack-lg">
          ${R.missing.length ? `<p class="dim">Для точности добавь: ${esc(R.missing.join('; '))}.</p>` : ''}
          ${pairBlock(c)}
          ${sec('Каким быть в кадре', R.who, 'accent')}
          ${sec('Как снимать', R.how)}
          ${sec('Что снимать', R.what)}
          <div class="card stack"><span class="eyebrow">Форматы — проверить первыми</span>${R.formats.map((f, i) => `<p class="line"><b>${i + 1}. ${esc(f.name)}.</b> ${esc(f.test)}</p>`).join('')}</div>
          <div class="card stack"><span class="eyebrow">Как с ним работать</span><p>Решения принимает ${esc(W.decides)}.</p>
            <div class="gx gx-use"><span>Как договариваться и продавать идеи</span><p>${esc(W.sell)}</p></div>
            <div class="gx gx-grow"><span>Слова, которые работают</span><p>${esc(W.words)}</p></div>
            <div class="gx gx-risk"><span>Чего избегать</span><p>${esc(W.avoid)}</p></div>
            ${W.hd ? `<div class="gx gx-bal"><span>Как он принимает решения по Дизайну</span><p>${esc(W.hd)}</p></div>` : ''}
            ${W.rhythm ? `<div class="gx gx-tool"><span>Ритм съёмок</span><p>${esc(W.rhythm)}</p></div>` : ''}</div>
          ${R.strong.length ? `<div class="card stack"><span class="eyebrow">Сильные стороны</span>${R.strong.map((s) => `<p class="line"><b>${esc(s.name)} (${s.v}).</b> ${esc(s.use)}</p>`).join('')}</div>` : ''}
          <div class="card stack"><span class="eyebrow">Где будет сопротивляться</span>
            ${R.resist.weak.map((w) => `<div class="gx gx-risk"><span>${esc(w.name)} — ${w.v}</span><p>${esc(w.blog)}</p><p class="dim">Что предложить: ${esc(w.fix.charAt(0).toLowerCase() + w.fix.slice(1))}</p></div>`).join('')}
            ${R.trap.map((t) => `<p class="line">${esc(t.text)}${chip(t.src)}</p>`).join('')}
            ${R.resist.blockers.length ? `<p class="dim">Что его тормозит: ${esc(R.resist.blockers.map((b) => b.replace(/[.!]+$/, '')).join('; ').toLowerCase())}. Сигнал, что он не в своём: ${esc((R.resist.notself || '').toLowerCase())}.</p>` : ''}</div>
          <div class="card stack"><span class="eyebrow">Почему у него может не залетать</span>${R.why.map((w, i) => `<p class="line"><b>${i + 1}. ${esc(w.title)}.</b> ${esc(w.fix[0])}</p>`).join('')}</div>
          <div class="card stack"><span class="eyebrow">Лучшие дни — 2 недели</span><p><b>🎬 Съёмка:</b> ${dl(R.shoot) || '—'}</p><p><b>💰 Продажи:</b> ${dl(R.sell) || '—'}</p><p><b>🚀 Запуски:</b> ${dl(R.start) || '—'}</p></div>
          <button class="btn" data-a="clientCopy" data-k="${c.id}">Скопировать разбор для клиента</button>
          <div class="row"><button class="btn sm ghost" data-a="clientEdit" data-k="${c.id}">Изменить данные</button><button class="btn sm ghost" data-a="clientDel" data-k="${c.id}">Удалить</button></div></div>`;
      },
    };
    let delArm = null;
    const actions = {
      clientSave() {
        const f = form(), err = document.getElementById('cfErr'), fail = (m) => { if (err) err.textContent = m; C.haptic('medium'); };
        if (!/^\d{4}-\d{2}-\d{2}$/.test(f.date || '') || +f.date.slice(0, 4) < 1920 || new Date(f.date) > new Date()) return fail('Укажи дату рождения.');
        if (f.city && !D().CITIES.some((x) => x[0] === f.city)) return fail('Выбери город из списка или оставь поле пустым.');
        const data = { name: (f.name || '').trim(), date: f.date, time: f.time || '', city: f.city || '', niche: (f.niche || '').trim(), arch: f.arch || '', arch2: f.arch2 || '' };
        let id = f.editId;
        if (id) { const c = list().find((x) => x.id === id); if (c) Object.assign(c, data); }
        else { id = Math.random().toString(36).slice(2, 9); list().unshift(Object.assign({ id, at: Date.now() }, data)); }
        st().clientForm = null; C.save(); C.haptic('medium'); C.go('client', { k: id });
      },
      agreeTick(el) {
        const c = list().find((x) => x.id === el.dataset.k); if (!c || !st().profile) return;
        c.agree = c.agree || {}; c.agree[el.dataset.v] = !c.agree[el.dataset.v]; C.save(); C.haptic(c.agree[el.dataset.v] ? 'medium' : 'light');
        const pr = PR.pair(st().profile, c), w = PR.working(pr, c.agree), box = el.closest('.pairc');
        el.classList.toggle('on', !!c.agree[el.dataset.v]);
        if (!box) return;
        box.querySelector('.ps-w').textContent = w + '%'; box.querySelector('.ps-lvl').textContent = lvl(w);
        const wk = box.querySelector('.ps-work'), pt = box.querySelector('.ps-pot');
        wk.style.width = (w - pr.natural) + '%'; pt.style.left = w + '%'; pt.style.width = (pr.potential - w) + '%';
        if (w === pr.potential) C.toast('Обо всём договорились — максимум для вашей пары');
      },
      clientCancel() { st().clientForm = null; C.save(); C.render(); },
      clientEdit(el) { const c = list().find((x) => x.id === el.dataset.k); if (!c) return; st().clientForm = Object.assign({}, c, { editId: c.id }); C.save(); C.go('producer'); setTimeout(() => { const f = document.getElementById('clientForm'); if (f) f.scrollIntoView({ block: 'start' }); }, 50); },
      clientDel(el) {
        if (delArm !== el.dataset.k) { delArm = el.dataset.k; el.textContent = 'Точно удалить?'; setTimeout(() => { delArm = null; if (el.isConnected) el.textContent = 'Удалить'; }, 3500); return; }
        st().clients = list().filter((x) => x.id !== el.dataset.k); delArm = null; C.save(); C.toast('Клиент удалён'); C.back();
      },
      clientCopy(el) { const c = list().find((x) => x.id === el.dataset.k); if (c) C.copy(PR.reportText(c, PR.report(c), CFG.appName)); },
    };
    function onInput(k, el) {
      if (!k.startsWith('cf:')) return false;
      form()[k.slice(3)] = el.value; C.save(); return true;
    }
    return { screens, actions, onInput };
  };
})(typeof window !== 'undefined' ? window : globalThis);
