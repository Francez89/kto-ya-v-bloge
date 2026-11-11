/*
 * Маршрут на 30 дней — один ответ на вопрос «что мне делать сегодня».
 * Собирает в одну линию тренажёр камеры, ролики из стратегии, настройку блога и итоги недели.
 * Подстраивается под человека: страх камеры → мягкий маршрут; слабые линии квадрата и причины
 * из «Почему не залетает» → личные правила в заданиях.
 * VektorRoute — расчёты (проверяются тестами), VektorRouteUI — экраны.
 */
(function (root) {
  const IN = () => root.VektorInsight, NX = () => root.VektorNumer, GD = () => root.VektorGrowthData, AR = () => root.VektorArchetypes;
  const DAY = 86400000;
  const dkey = (t) => { const d = new Date(t); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); };

  const SOFT = ['first', 's:niche', 't2', 't3', 't4', 'v0', 'r1', 't7', 's:bio', 't8', 'v1', 't11', 'v2', 'r2', 't12', 'v3', 's:arch', 'v4', 's:funnel', 't16', 'r3', 'v5', 't17', 's:magnet', 'v6', 't18', 'v8', 'r4', 'v9', 't20'];
  const BOLD = ['first', 's:niche', 'v0', 't12', 'v1', 'v2', 'r1', 's:bio', 'v3', 's:arch', 'v4', 'v5', 't14', 'r2', 's:funnel', 'v6', 'v7', 't17', 'v8', 's:batch', 'r3', 's:magnet', 'v9', 'v10', 't18', 'v11', 'v12', 'r4', 'v13', 'final'];
  const themes = () => IN().WEEK_THEMES.concat(['Приглашение на продукт: кому, что внутри, как попасть']);
  const VIDEO_T = ['t4', 't7', 't8', 't13', 't15', 't16', 't18', 't19', 't20'];
  const roleOf = (i) => (i < 4 ? 0 : i < 9 ? 1 : 2);

  const SETUP = {
    's:niche': { title: 'Твоя ниша и три хука', min: 7, text: 'Укажи свою нишу и подбери три хука, которые тебе откликаются. Нажми ♥ на лучших — они пойдут в твои сценарии.', link: ['hooks', 'Открыть хуки'], why: 'Все сценарии маршрута строятся под нишу. Без неё задания общие.' },
    's:bio': { title: 'Шапка профиля', min: 10, text: 'Собери шапку профиля: кто ты, кому помогаешь, что человек получит. Скопируй и поставь в свой профиль.', link: ['bio', 'Собрать шапку'], why: 'Ролик приводит человека в профиль. Если там непонятно, кто ты, — он уходит.' },
    's:arch': { title: 'Тест архетипов', min: 7, text: 'Пройди тест из 72 утверждений. После него задания и сценарии подстроятся под твой характер в кадре.', link: ['archIntro', 'Пройти тест'], why: 'Архетип определяет, каким тебе быть в кадре, — это половина твоего кода.' },
    's:funnel': { title: 'Актуальные как воронка', min: 15, text: 'Собери 4–5 актуальных: кто я, результаты, как работаю, отзывы, как купить. Названия и порядок — в разделе.', link: ['highlights', 'Собрать актуальные'], why: 'Актуальные продают, пока ты спишь: зритель сам проходит путь до заявки.' },
    's:magnet': { title: 'Лид-магнит и кодовое слово', min: 15, text: 'Придумай один полезный подарок: чек-лист, гайд или шаблон на 1 страницу. Выбери кодовое слово. Теперь в конце роликов говори: «Напиши слово … в комментариях — пришлю».', steps: ['Что зритель хочет получить быстро и бесплатно? Запиши 3 варианта и выбери один.', 'Сделай подарок на одну страницу — заметка или картинка.', 'Выбери короткое кодовое слово и добавь призыв в следующий ролик.'], why: 'Кодовое слово превращает просмотры в диалоги, а диалоги — в клиентов.' },
    's:batch': { title: 'Съёмочный день: три ролика за раз', min: 60, text: 'Сними три ролика подряд по чек-листу съёмочного дня. Сценарии возьми из следующих заданий маршрута или из «Ролика под ключ».', link: ['checklist', 'Чек-лист съёмки'], why: 'Съёмка пачкой убирает ежедневное «надо снять» и даёт запас на неделю.' },
  };

  /** Мягкий маршрут — если человек боится камеры. Выбор можно поменять вручную. */
  function trackOf(s) {
    const r = s.route || {};
    if (r.track === 'soft' || r.track === 'bold') return r.track;
    const q = ((s.fears || {}).quiz || []).filter((x) => x != null);
    if (q.length >= 10) return q.reduce((a, b) => a + b, 0) / q.length >= 1.2 ? 'soft' : 'bold';
    if (s.profile && s.profile.date && NX()) { const v = NX().square(s.profile.date).lines.self; if (v >= 5) return 'bold'; }
    return 'soft';
  }
  const ids = (s) => (trackOf(s) === 'bold' ? BOLD : SOFT);

  function isDone(s, id, has) {
    const r = s.route || {}, t = s.trainer || {};
    if ((r.done || {})[id]) return true;
    if (id[0] === 't') return !!(t.done || {})[+id.slice(1)];
    if (id === 's:arch') return !!(has && has.arch);
    if (id === 's:niche') return !!(s.ideaForm && (s.ideaForm.niche || '').trim());
    return false;
  }
  /** Все отметки «сделано» с датами — для серии дней. */
  function stamps(s) {
    const r = s.route || {}, t = s.trainer || {}, out = [];
    Object.values(r.done || {}).forEach((x) => x && x.at && out.push(x.at));
    Object.values(t.done || {}).forEach((x) => x && x.at && out.push(x.at));
    return out;
  }
  /** Серия: сколько дней подряд есть хотя бы одно выполненное задание (сегодня или вчера — серия жива). */
  function streak(times, now) {
    const set = new Set(times.map(dkey)); let n = 0, t = now || Date.now();
    if (!set.has(dkey(t))) t -= DAY;
    while (set.has(dkey(t))) { n++; t -= DAY; }
    return n;
  }
  function status(s, has, now) {
    now = now || Date.now();
    const list = ids(s), done = list.filter((id) => isDone(s, id, has));
    const next = list.find((id) => !isDone(s, id, has)) || null;
    const st = stamps(s), today = st.some((t) => dkey(t) === dkey(now));
    return { track: trackOf(s), list, done: done.length, total: list.length, next, day: next ? list.indexOf(next) + 1 : list.length, doneToday: today, streak: streak(st, now), finished: !next, videos: done.filter((id) => id[0] === 'v' || id === 'first' || VIDEO_T.includes(id)).length };
  }

  /** Личные правила: что в заданиях меняется под этого человека. */
  function rules(P, s) {
    const out = [], sq = P.date && NX() ? NX().square(P.date) : null, top = P.arch ? P.arch.ranked[0] : null;
    if ((sq && sq.cells[3] >= 4) || top === 'creator' || top === 'ruler') out.push({ k: 'perfect', text: 'Лимит: три дубля и 30 минут на монтаж. Публикуй, когда готово на 80%.', for: ['v', 'first'] });
    if (sq && sq.lines.goal <= 2) out.push({ k: 'start', text: 'Поставь таймер на 15 минут и начни прямо сейчас — не оставляй на вечер.', for: ['v', 't', 's', 'first'] });
    if (sq && sq.lines.temper <= 2) out.push({ k: 'voice', text: 'Перед съёмкой — две минуты разминки речи: голос станет живее.', for: ['v', 'first'], link: ['speech', 'Разминка'] });
    if (sq && sq.lines.self <= 2) out.push({ k: 'self', text: 'Говори о деле, а не о себе: фокус на теме снимает зажим.', for: ['v'] });
    if (sq && sq.lines.money <= 2) out.push({ k: 'sell', text: 'Продавай через результат клиента, а не «про себя» — так тебе будет легче.', for: ['sale'] });
    const hd = P.hd && P.hd.type;
    const H = { generator: 'Из двух тем выбери ту, на которую есть живое «хочу».', mg: 'Снял(а) быстро — не бросай: доведи до публикации сегодня же.', projector: 'Начни ролик с вопроса, который тебе задавали, — тебя слушают, когда спросили.', manifestor: 'Предупреди аудиторию в сторис, что выходит ролик, — так его ждут.', reflector: 'Снимай в месте, где тебе хорошо: среда решает половину результата.' };
    if (hd && H[hd]) out.push({ k: 'hd', text: H[hd], for: ['v'] });
    if (trackOf(s) === 'soft') out.push({ k: 'soft', text: 'Можно без лица: руки, экран или вид из окна и твой голос за кадром.', for: ['first', 'v0', 'v1'] });
    return out;
  }
  const rulesFor = (all, id) => all.filter((r) => r.for.some((f) => f === id || (f === 'v' && id[0] === 'v') || (f === 't' && id[0] === 't') || (f === 's' && id[0] === 's') || (f === 'sale' && id[0] === 'v' && roleOf(+id.slice(1)) === 2)));

  /** Готовый ролик: тема → хук, сценарий по шагам, как снять, подпись. */
  function video(P, theme, role, hook, seed) {
    const B = IN().BEATS[role], beats = B[(seed || 0) % B.length](theme);
    const a = P.arch ? AR().A[P.arch.ranked[0]] : null;
    const h = hook || [`«${theme}»: то, о чём обычно молчат`, `Три вещи про «${theme}», которые я понял(а) на практике`, `«${theme}» — главная ошибка, которую делают почти все`][(seed || 0) % 3];
    const cta = ['Подпишись — завтра продолжение.', 'Сохрани, чтобы не потерять.', 'Напиши кодовое слово в комментариях — пришлю подробности.'][role];
    return {
      theme, role: IN().ROLE[role], hook: h, beats: beats.slice(1), cta,
      shoot: a ? a.shoot.split('.')[0] + '.' : 'Дневной свет у окна, камера на уровне глаз, телефон на опоре.',
      inFrame: a ? a.inFrame.split('.')[0] + '.' : '',
      caption: `${h}\n\n${['Рассказываю коротко и по делу.', 'Разбираю по шагам — на своём опыте.', 'Показываю, что внутри и кому подойдёт.'][role]}\n\n${cta}`,
      length: role === 2 ? '40–60 секунд' : '20–40 секунд',
    };
  }
  /** Задание по идентификатору. */
  function task(id, P, s, hook) {
    if (id === 'first') return { id, kind: 'first', title: 'Первый ролик за 20 секунд', min: 5, why: 'Тот, кто снял в первый день, продолжает. Тот, кто только прочитал про себя, — обычно нет.', phrases: ['Привет, я … и я занимаюсь …', 'Этот блог — для тех, кто хочет …', 'Подпишись: здесь я буду показывать, как …'], text: 'Три фразы, один дубль, 20 секунд. Публиковать не обязательно — важно снять.' };
    if (id === 'final') return { id, kind: 'final', title: 'Итог месяца: до и после', min: 15, text: 'Открой свой первый ролик и последний. Сними 30 секунд: что изменилось за месяц. Внеси цифры в дневник результатов.', link: ['results', 'Дневник результатов'], why: 'Ты видишь путь своими глазами — это лучшая мотивация на следующий месяц.' };
    if (id[0] === 'r') return { id, kind: 'review', title: `Итоги недели ${id.slice(1)}`, min: 5, text: 'Внеси три цифры: подписчики, просмотры за неделю и заявки. Посмотри, какой ролик зашёл лучше, и повтори его приём.', link: ['results', 'Внести цифры'], why: 'Без цифр кажется, что ничего не меняется. С цифрами видно рост.' };
    if (id[0] === 't') { const i = +id.slice(1), T = GD() ? GD().TRAINER[i] : null; return { id, kind: 'trainer', title: T ? T.t : 'Тренажёр камеры', min: 5, text: T ? T.task : '', why: T ? T.why : '', link: ['trainerDay', 'Открыть задание', { d: i }], auto: true }; }
    if (id[0] === 'v') { const i = +id.slice(1), th = themes()[i], v = video(P, th, roleOf(i), hook, i); return Object.assign({ id, kind: 'video', title: th, min: 15, why: ['Ролик на охват: приводит новых людей.', 'Ролик на доверие: показывает, что ты разбираешься.', 'Продающий ролик: превращает зрителя в клиента.'][roleOf(i)] }, { video: v }); }
    const S = SETUP[id]; return Object.assign({ id, kind: 'setup', auto: id === 's:arch' || id === 's:niche' }, S);
  }

  /** Дневник результатов: сводка по внесённым цифрам. */
  function summary(results, st) {
    const r = (results || []).slice().sort((a, b) => a.at - b.at);
    if (!r.length) return null;
    const f = r[0], l = r[r.length - 1], weeks = Math.max(1, Math.round((l.at - f.at) / (7 * DAY)));
    const best = r.reduce((a, b) => ((b.views || 0) > (a.views || 0) ? b : a), r[0]);
    return { n: r.length, weeks, subs: l.subs, dSubs: r.length > 1 ? l.subs - f.subs : null, leads: r.reduce((a, x) => a + (x.leads || 0), 0), bestViews: best.views || 0, bestAt: best.at, videos: st ? st.videos : 0, first: f, last: l };
  }

  root.VektorRoute = { SOFT, BOLD, trackOf, ids, isDone, status, streak, rules, rulesFor, task, video, summary, roleOf, themes, dkey };

  /* ================= ЭКРАНЫ ================= */
  root.VektorRouteUI = function (C) {
    const R = root.VektorRoute, NI = root.VektorNiches, HK = root.VektorHooks;
    const { esc, head } = C;
    const st = () => C.state;
    const rt = () => (st().route = st().route && typeof st().route === 'object' ? st().route : { start: null, done: {} });
    const has = () => ({ arch: !!C.arch() });
    const S = () => R.status(st(), has());
    const plural = (n, a, b, c) => HK.plural(n, a, b, c);
    const nicheN = () => { const t = ((st().ideaForm || {}).niche || '').trim(); return t ? NI.resolve(t) : null; };
    function hookFor(i) {
      const N = nicheN(); if (!N || !root.VektorStop) return null;
      try { const b = root.VektorStop.batch(N, { count: 14, seed: 11, delivery: 'voice' }).items; return b.length ? b[i % b.length].text : null; } catch (e) { return null; }
    }
    const T = (id) => R.task(id, C.PX(), st(), id[0] === 'v' ? hookFor(+id.slice(1)) : null);
    const kindIc = { first: '🎬', video: '🎬', trainer: '🎯', setup: '🧩', review: '📊', final: '🏁' };
    const mark = (id) => { const r = rt(); if (!r.start) r.start = Date.now(); r.done = r.done || {}; if (!r.done[id]) r.done[id] = { at: Date.now() }; C.save(); };
    const fire = (n) => (n ? `<span class="streak">🔥 ${n} ${plural(n, 'день', 'дня', 'дней')}</span>` : '');

    /** Карточка «Сегодня» для главного экрана. */
    function todayCard() {
      if (!st().profile) return '';
      const s = S();
      if (s.finished) return `<div class="card accent stack today"><div class="row between"><span class="eyebrow">Маршрут пройден</span>${fire(s.streak)}</div><h2>30 дней позади</h2><p>Снято роликов: ${s.videos}. Посмотри, что изменилось, и собери план на следующие 90 дней.</p><div class="row"><button class="btn sm" data-a="go" data-v="results">Мои результаты</button><button class="btn sm ghost" data-a="go" data-v="strategy">Стратегия</button></div></div>`;
      const t = T(s.next), pct = Math.round((s.done / s.total) * 100);
      if (s.doneToday && !rt().more) return `<div class="card stack today done"><div class="row between"><span class="eyebrow">Сегодня · сделано ${s.done} из ${s.total}</span>${fire(s.streak)}</div><h2>✓ На сегодня всё</h2><span class="pbar big"><i style="width:${pct}%"></i></span><p class="dim">Завтра: ${esc(t.title)} · ${t.min} мин</p><div class="row"><button class="btn sm ghost" data-a="routeMore">Сделать ещё одно</button><button class="btn sm ghost" data-a="go" data-v="route">Весь маршрут</button></div></div>`;
      return `<div class="card accent stack today"><div class="row between"><span class="eyebrow">Сегодня · день ${s.day} из ${s.total}</span>${fire(s.streak)}</div>
        <h2>${kindIc[t.kind]} ${esc(t.title)}</h2><p class="dim">${t.min} минут · ${esc(t.why)}</p><span class="pbar big"><i style="width:${pct}%"></i></span>
        <button class="btn" data-a="go" data-v="step" data-k="${t.id}">Открыть задание</button>
        <button class="linkbtn" data-a="go" data-v="route">Весь маршрут на 30 дней</button></div>`;
    }

    const rulesBlock = (id) => { const rr = R.rulesFor(R.rules(C.PX(), st()), id); return rr.length ? `<div class="card stack"><span class="eyebrow">Под тебя</span>${rr.map((r) => `<p class="line">${esc(r.text)}${r.link ? ` <button class="linkbtn inl" data-a="go" data-v="${r.link[0]}">${esc(r.link[1])} →</button>` : ''}</p>`).join('')}</div>` : ''; };
    function videoBlock(v, withNiche) {
      return `<div class="card stack"><span class="eyebrow">${esc(v.role)} · ${esc(v.length)}</span>
          <div class="gx gx-use"><span>Хук — первая фраза</span><p class="hook">«${esc(v.hook)}»</p></div>
          <div class="gx gx-grow"><span>Дальше по шагам</span><ol class="steps">${v.beats.map((b) => `<li>${esc(b)}</li>`).join('')}</ol></div>
          <div class="gx gx-tool"><span>Как снять</span><p>${esc(v.shoot)}${v.inFrame ? ' ' + esc(v.inFrame) : ''}</p></div>
          <div class="gx gx-bal"><span>Подпись к ролику</span><p class="pre">${esc(v.caption)}</p></div>
          <button class="btn sm ghost" data-a="copyText" data-v="${esc(`Хук: ${v.hook}\n\n${v.beats.map((b, i) => `${i + 1}. ${b}`).join('\n')}\n\nКак снять: ${v.shoot}\n\nПодпись:\n${v.caption}`)}">Скопировать сценарий</button>
          ${withNiche && !nicheN() ? '<p class="dim">Укажи нишу — хук станет точнее.</p>' + C.nicheField() : ''}</div>`;
    }

    const screens = {
      step({ k, intro } = {}) {
        const s = S(), id = k && R.ids(st()).concat(R.SOFT, R.BOLD).includes(k) ? k : s.next;
        if (!id) return screens.route();
        const t = T(id), done = R.isDone(st(), id, has());
        let body = '';
        if (t.kind === 'first') body = `<div class="card stack"><span class="eyebrow">Скажи три фразы</span><ol class="steps big">${t.phrases.map((p) => `<li>${esc(p)}</li>`).join('')}</ol><p class="dim">${esc(t.text)}</p></div>
          <div class="card stack"><span class="eyebrow">Как снять</span><p>${esc(R.video(C.PX(), '', 0).shoot)} Телефон вертикально, смотри в объектив, а не на себя.</p></div>`;
        else if (t.kind === 'video') body = videoBlock(t.video, true);
        else body = `<div class="card stack"><p>${esc(t.text)}</p>${t.steps ? `<ol class="steps">${t.steps.map((x) => `<li>${esc(x)}</li>`).join('')}</ol>` : ''}${t.link ? `<button class="btn sm" data-a="go" data-v="${t.link[0]}"${t.link[2] ? ` data-d="${t.link[2].d}"` : ''}>${esc(t.link[1])} →</button>` : ''}</div>`;
        const idx = R.ids(st()).indexOf(id);
        return head(intro ? 'Код собран · первое действие' : idx >= 0 ? `День ${idx + 1} из ${s.total} · ${t.min} мин` : `${t.min} мин`, esc(t.title), esc(intro ? 'Разбор подождёт две минуты. Сначала — действие: с него начинается блог.' : t.why)) + `<div class="stack-lg">
          ${body}${rulesBlock(id)}
          ${done ? '<p class="okline">✓ Сделано</p>' : t.auto && t.kind !== 'trainer' ? '<p class="dim">Засчитается само, когда закончишь.</p>' : t.kind === 'trainer' ? '<p class="dim">Отметь выполнение внутри задания — оно засчитается и здесь.</p>' : `<button class="btn" data-a="routeDone" data-k="${id}">${t.kind === 'video' || t.kind === 'first' ? 'Снял(а) — засчитать' : 'Сделано'}</button>`}
          ${intro ? '<button class="btn ghost" data-a="tab" data-v="code">Позже — посмотреть мой код</button>' : ''}</div>`;
      },
      route() {
        const s = S(), list = s.list;
        const wk = (n) => list.slice(n * 7, n === 3 ? 30 : n * 7 + 7);
        return head('Маршрут', '30 дней до блога, который работает', 'Одно задание в день на 5–15 минут. Всё готово: тема, хук, сценарий. От тебя — только сделать.') + `<div class="stack-lg">
          <div class="card stack"><div class="row between"><b>Пройдено ${s.done} из ${s.total}</b>${fire(s.streak)}</div><span class="pbar big"><i style="width:${Math.round((s.done / s.total) * 100)}%"></i></span>
            <div class="chips"><button class="chip ${s.track === 'soft' ? 'on' : ''}" data-a="routeTrack" data-v="soft">Мягкий — боюсь камеры</button><button class="chip ${s.track === 'bold' ? 'on' : ''}" data-a="routeTrack" data-v="bold">Смелый — сразу ролики</button></div>
            <p class="dim">${s.track === 'soft' ? 'Сначала привыкаем к камере: голос, руки, короткие дубли. Ролики — постепенно.' : 'Камеры не боишься: с первой недели снимаем и публикуем ролики.'}</p></div>
          ${[0, 1, 2, 3].map((n) => `<div class="card"><span class="eyebrow">Неделя ${n + 1}</span>${wk(n).map((id) => { const t = T(id), d = R.isDone(st(), id, has()), i = list.indexOf(id); return `<div class="todo ${d ? 'done' : ''} ${id === s.next ? 'now' : ''}" data-a="go" data-v="step" data-k="${id}"><span class="box">${d ? '✓' : i + 1}</span><div><div class="day">${kindIc[t.kind]} ${t.min} мин${id === s.next ? ' · сегодня' : ''}</div><div class="tx">${esc(t.title)}</div></div></div>`; }).join('')}</div>`).join('')}
          <button class="btn soft" data-a="go" data-v="results">Дневник результатов</button></div>`;
      },
      results() {
        const res = (st().results = Array.isArray(st().results) ? st().results : []), s = S(), sm = R.summary(res, s), f = (st().resForm = st().resForm || { subs: '', views: '', leads: '' });
        const sorted = res.slice().sort((a, b) => a.at - b.at);
        let chart = '';
        if (sorted.length >= 2) {
          const W = 300, H = 110, vals = sorted.map((x) => x.subs), mn = Math.min(...vals), mx = Math.max(...vals), sp = mx - mn || 1;
          const pt = (x, i) => [10 + (i / (sorted.length - 1)) * (W - 20), H - 14 - ((x.subs - mn) / sp) * (H - 34)];
          const pts = sorted.map(pt);
          chart = `<svg class="rchart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Рост подписчиков"><polyline points="${pts.map((p) => p.map((v) => v.toFixed(1)).join(',')).join(' ')}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>${pts.map((p, i) => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3.5" fill="var(--accent)"/>${i === 0 || i === pts.length - 1 ? `<text x="${p[0].toFixed(1)}" y="${(p[1] - 8).toFixed(1)}" text-anchor="${i ? 'end' : 'start'}" class="rc-t">${sorted[i].subs.toLocaleString('ru-RU')}</text>` : ''}`).join('')}</svg>`;
        }
        const dfmt = (t) => new Date(t).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
        return head('Дневник результатов', 'Что изменилось', 'Раз в неделю внеси три цифры из статистики профиля. Через месяц увидишь путь.') + `<div class="stack-lg">
          ${sm ? `<div class="card accent stack"><span class="eyebrow">Твой результат</span><div class="rnums"><div><b>${s.videos}</b><small>${plural(s.videos, 'ролик', 'ролика', 'роликов')} снято</small></div><div><b>${sm.dSubs == null ? sm.subs.toLocaleString('ru-RU') : (sm.dSubs >= 0 ? '+' : '−') + Math.abs(sm.dSubs).toLocaleString('ru-RU')}</b><small>${sm.dSubs == null ? 'подписчиков сейчас' : 'подписчиков'}</small></div><div><b>${sm.leads}</b><small>${plural(sm.leads, 'заявка', 'заявки', 'заявок')}</small></div></div>${chart}
            <p class="dim">${sm.n < 2 ? 'Это твоя точка отсчёта. Внеси цифры через неделю — появится график.' : sm.dSubs > 0 ? `Рост за ${sm.weeks} ${plural(sm.weeks, 'неделю', 'недели', 'недель')}. Лучшая неделя по просмотрам — ${dfmt(sm.bestAt)}: вспомни, что ты тогда снимал(а), и повтори приём.` : 'Подписчики пока не растут — это нормально в первые недели. Смотри на просмотры и сохранения: они растут раньше.'}</p></div>` : `<div class="card stack"><p>Пока нет записей. Внеси цифры сегодня — это твоя точка «до».</p><p class="dim">Роликов снято по маршруту: ${s.videos}.</p></div>`}
          <div class="card stack"><span class="eyebrow">Цифры на сегодня</span>
            <label class="f">Подписчики<input type="number" inputmode="numeric" min="0" data-in="rf:subs" value="${esc(f.subs)}" placeholder="например: 1240"></label>
            <label class="f">Просмотры за неделю<input type="number" inputmode="numeric" min="0" data-in="rf:views" value="${esc(f.views)}" placeholder="все ролики вместе"></label>
            <label class="f">Заявки и сообщения от клиентов за неделю<input type="number" inputmode="numeric" min="0" data-in="rf:leads" value="${esc(f.leads)}" placeholder="0"></label>
            <p class="err" id="rfErr"></p><button class="btn" data-a="resultsSave">Сохранить</button></div>
          ${sorted.length ? `<div class="card"><span class="eyebrow">Записи</span>${sorted.slice().reverse().map((x) => `<div class="rrow"><span>${dfmt(x.at)}</span><span>${x.subs.toLocaleString('ru-RU')} подп.</span><span>${(x.views || 0).toLocaleString('ru-RU')} просм.</span><span>${x.leads || 0} заяв.</span></div>`).join('')}</div>` : ''}</div>`;
      },
      turnkey() {
        const f = (st().turnkey = st().turnkey || { topic: '', role: 0, seed: 0 });
        const topic = (f.topic || '').trim();
        const v = topic && f.made ? R.video(C.PX(), topic, f.role, null, f.seed) : null;
        return head('Ролик под ключ', 'Тема → готовый ролик', 'Напиши, о чём хочешь снять. Получишь хук, сценарий по шагам, как снять и подпись.') + `<div class="stack-lg">
          <div class="card stack"><label class="f">О чём ролик<input type="text" data-in="tk:topic" value="${esc(f.topic)}" maxlength="80" placeholder="например: как выбрать первый объектив" autocomplete="off"></label>
            <div class="chips">${['На охват', 'На доверие', 'Продающий'].map((n, i) => `<button class="chip ${f.role === i ? 'on' : ''}" data-a="tkRole" data-v="${i}">${n}</button>`).join('')}</div>
            <button class="btn" data-a="tkMake">${v ? 'Другой вариант' : 'Собрать ролик'}</button></div>
          ${v ? videoBlock(v, false) + rulesBlock(f.role === 2 ? 'v9' : 'v5') : ''}</div>`;
      },
    };
    const actions = {
      routeDone(el) {
        const id = el.dataset.k; mark(id); rt().more = false; C.save(); C.haptic('heavy');
        const s = S(); C.toast(s.finished ? 'Маршрут пройден! Ты сделал(а) это' : `Засчитано · серия ${s.streak} ${plural(s.streak, 'день', 'дня', 'дней')}`);
        C.tab('code');
      },
      routeMore() { rt().more = true; C.save(); C.render(); },
      routeTrack(el) { rt().track = el.dataset.v; C.save(); C.haptic(); C.render(); },
      tkRole(el) { st().turnkey.role = +el.dataset.v; C.save(); C.render(); },
      tkMake() { const f = st().turnkey; if (!(f.topic || '').trim()) { C.toast('Напиши тему ролика'); return; } if (f.made) f.seed = (f.seed || 0) + 1; f.made = true; C.save(); C.haptic(); C.render(); },
      resultsSave() {
        const f = st().resForm || {}, err = document.getElementById('rfErr'), n = (v) => (v === '' || v == null ? null : Math.round(+v));
        const subs = n(f.subs), views = n(f.views) || 0, leads = n(f.leads) || 0;
        if (subs == null || !isFinite(subs) || subs < 0 || views < 0 || leads < 0 || !isFinite(views) || !isFinite(leads)) { if (err) err.textContent = 'Укажи число подписчиков.'; return; }
        const res = (st().results = Array.isArray(st().results) ? st().results : []), now = Date.now();
        const same = res.findIndex((x) => R.dkey(x.at) === R.dkey(now));
        if (same >= 0) res[same] = { at: now, subs, views, leads }; else res.push({ at: now, subs, views, leads });
        const s = S(); if (s.next && (s.next[0] === 'r' || s.next === 'final')) mark(s.next);
        st().resForm = { subs: '', views: '', leads: '' }; C.save(); C.haptic('medium'); C.toast('Записано'); C.render();
      },
    };
    function onInput(k, el) {
      if (k.startsWith('rf:')) { (st().resForm = st().resForm || {})[k.slice(3)] = el.value; C.save(); return true; }
      if (k === 'tk:topic') { const f = (st().turnkey = st().turnkey || { role: 0, seed: 0 }); f.topic = el.value; f.made = false; C.save(); return true; }
      return false;
    }
    return { screens, actions, onInput, todayCard, status: S };
  };
})(typeof window !== 'undefined' ? window : globalThis);
