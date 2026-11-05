/*
 * «Кто я в блоге?» — студия: хуки, идеи, форматы, контент-план, шапка профиля, чек-лист,
 * мини-тесты, «Где ты заряжаешься», матрица судьбы, дашборд профиля и анимированные эмблемы стихий.
 * Подключается к app.js через контекст C (геттеры состояния и общие функции).
 */
window.VektorStudio = function (C) {
  const D = window.VektorData, AR = window.VektorArchetypes, SN = window.VektorSynth, NI = window.VektorNiches, HK = window.VektorHooks, EX = window.VektorExtras;
  const { esc, G, head, srcChip } = C;
  const st = () => C.state;
  const pick = (arr, r) => arr[Math.floor(r() * arr.length)];
  const nicheText = () => (st().ideaForm.niche || (st().profile && st().profile.niche) || '').trim();
  const nicheObj = () => (nicheText() ? NI.resolve(nicheText()) : null);
  const leadArch = () => (C.arch() ? C.arch().ranked[0] : null);
  const archTop = () => (C.arch() ? C.arch().top : null);
  const VISP_CLASS = { В: 'v-b', И: 'v-i', С: 'v-s', П: 'v-p' };
  const fmtName = (k) => (D.FORMATS.find((f) => f.key === k) || {}).name || k;
  const stats = () => (st().stats = st().stats || { firstSeen: Date.now(), copies: 0, ideas: 0, hooks: 0 });

  /* ---------- общий выбор ниши ---------- */
  const POPULAR = ['Маникюр', 'Психология', 'Фитнес', 'Видеосъёмка', 'Мобильная съёмка', 'Продвижение в соцсетях', 'Личный бренд', 'Недвижимость', 'Кулинария', 'Английский язык', 'Косметология', 'Астрология'];
  function nicheField(hint) {
    const N = nicheObj();
    return `<label class="f">Ниша<input type="text" data-in="nicheSearch" value="${esc(st().ideaForm.niche)}" placeholder="например: маникюр, психология, видеосъёмка" maxlength="60" autocomplete="off"></label>
      <div id="nicheSuggest"></div>
      ${N ? `<p class="dim nichenote">${N.custom ? `Ниши «${esc(N.name)}» нет в базе — использую универсальные формулировки. Для точных хуков выбери близкую нишу из списка.` : `Ниша в базе: <b>${esc(N.name)}</b> · группа «${esc(N.group)}»${hint ? " · " + hint : ""}`}</p>` : `<div class="chips">${POPULAR.map((n) => `<button type="button" class="chip" data-a="pickNiche" data-v="${esc(n)}">${esc(n)}</button>`).join('')}</div>`}`;
  }
  function renderNicheSuggest(q) {
    const box = document.getElementById('nicheSuggest'); if (!box) return;
    const list = NI.search(q);
    box.innerHTML = q.trim() && list.length && !(list.length === 1 && list[0].name.toLowerCase() === q.trim().toLowerCase()) ? `<div class="suggest">${list.map((n) => `<button type="button" data-a="pickNiche" data-v="${esc(n.name)}">${esc(n.name)} <span class="dim">· ${esc(n.group)}</span></button>`).join('')}</div>` : '';
  }

  /* ---------- бит-структуры под форматы ---------- */
  const BEATS = {
    expert: (N, r) => [`Проблема: ${pick(N.pain, r)}`, `Причина: ${pick(N.err, r)}`, `Решение: как ${pick(N.want, r)}`],
    story: (N, r) => [`Было: ${pick(N.pain, r)}`, 'Поворот: что изменилось и почему', `Стало: ${pick(N.res, r)}`],
    experiment: (N, r) => [`Гипотеза: правда ли, что ${pick(N.myth, r)}?`, 'Процесс: 3 дня проверки на практике', 'Итог и вывод для зрителя'],
    reaction: (N, r) => [`Чужой тезис: «${pick(N.myth, r)}»`, 'Почему это не так — один сильный аргумент', `Как на самом деле: ${pick(N.want, r)}`],
    backstage: (N, r) => [`Готовый результат: ${pick(N.res, r)}`, 'Перемотка в начало процесса', 'Момент, который не видно в ленте'],
    howto: (N, r) => [`Результат в начале: ${pick(N.res, r)}`, `Шаги: как ${pick(N.want, r)}`, `Частая ошибка: ${pick(N.err, r)}`],
    interview: (N, r) => [`Вопрос: почему ${pick(N.pain, r)}?`, 'Ответ эксперта или клиента', `Вывод для ${N.audGen}`],
    series: (N, r) => [`Тема выпуска: ${pick(N.err, r)}`, 'Одна мысль и пример', `Анонс следующего: как ${pick(N.want, r)}`],
    mood: (N, r) => [`Кадр-настроение: ${pick(N.res, r)}`, 'Детали процесса крупно', 'Одна фраза на экране'],
  };
  function makeIdea(N, fmtKey, hookText, seed, platform, cta) {
    const r = C.rng(seed);
    return { id: Math.random().toString(36).slice(2, 9), kind: 'idea', fmt: fmtKey, fmtName: fmtName(fmtKey), title: hookText, beats: (BEATS[fmtKey] || BEATS.expert)(N, r), cta: cta || pick(D.CONTENT_GOALS[st().ideaForm.goal || 'trust'].cta, r), platform: platform || st().ideaForm.platform, niche: N.key };
  }

  /* ---------- ИДЕИ ---------- */
  function genIdeas(more) {
    const s = st(), N = nicheObj() || NI.find('мобильная съёмка');
    if (!more) s.ideas = [];
    s.ideaSeed = (s.ideaSeed || 1) + 1;
    s.ideaHistory = s.ideaHistory || [];
    const used = new Set(s.ideaHistory.concat(s.ideas.map((x) => x.title)));
    const ranked = SN.rankFormats(C.P()), r = C.rng(s.ideaSeed * 7919);
    const pool = ranked.slice(0, 4).map((f) => f.key).concat([ranked[4 + Math.floor(r() * (ranked.length - 4))].key]);
    const ctas = D.CONTENT_GOALS[s.ideaForm.goal].cta;
    pool.forEach((fk, k) => {
      const h = HK.forFormat(N, fk, s.ideaSeed * 31 + k, used) || HK.forFormat(N, fk, s.ideaSeed * 31 + k);
      if (!h) return; used.add(h.text);
      s.ideas.push(makeIdea(N, fk, h.text, s.ideaSeed * 13 + k, s.ideaForm.platform, ctas[(k + s.ideaSeed) % ctas.length]));
    });
    s.ideaHistory = s.ideaHistory.concat(s.ideas.map((x) => x.title)).slice(-400);
    stats().ideas += pool.length; C.save();
  }

  /* ---------- ХУКИ ---------- */
  let hookView = null;
  function hookBatch(force) {
    const s = st(), N = nicheObj(); if (!N) return null;
    const key = N.key + '|' + (N.custom ? N.name : '') + '|' + (s.hookVisp || '') + '|' + (s.hookTone || '') + '|' + (s.hookTrig || '') + '|' + (s.hookArch !== false && archTop() ? archTop().join() : '');
    if (hookView && hookView.key === key && !force) return hookView;
    s.hookUsed = s.hookUsed || {};
    const uk = N.key + (N.custom ? ':' + N.name : '');
    const used = new Set(s.hookUsed[uk] || []);
    s.hookSeed = (s.hookSeed || 1) + 1;
    const b = HK.batch(N, { visp: s.hookVisp || null, tone: s.hookTone || null, trig: s.hookTone === 'psy' ? s.hookTrig || null : null, arch: s.hookArch !== false ? archTop() : null, fmts: SN.rankFormats(C.P()).slice(0, 3).map((f) => f.key), used, seed: s.hookSeed * 977, count: 10 });
    if (b.exhausted) used.clear();
    b.items.forEach((h) => used.add(h.text));
    s.hookUsed[uk] = [...used].slice(-800);
    hookView = { key, N, items: b.items, total: b.total, shown: used.size };
    stats().hooks += b.items.length; C.save();
    return hookView;
  }
  function hookCard(h, N, savedMode) {
    const sc = h.score;
    const tag = h.trig ? `<span class="hktag">${esc(HK.TRIGGERS[h.trig][0])}</span>` : h.tone && h.tone !== 'base' ? `<span class="hktag t-${h.tone}">${esc(HK.TONES[h.tone])}</span>` : '';
    return `<div class="hk"><p class="hook">${esc(h.text)}</p>${tag}
      <div class="hkmeta"><span class="visp">${h.visp.split('').map((l) => `<i class="${VISP_CLASS[l]}" title="${HK.VISP[l]}">${l}</i>`).join('')}</span>
        <span class="hkscore" title="Выгода ${sc.В} · Интрига ${sc.И} · Срочность ${sc.С} · Польза ${sc.П}"><b style="width:${(sc.total / 40) * 100}%"></b></span><span class="dim">${sc.total}/40</span>
        <span class="hkbtns"><button class="iconbtn" data-a="hookCopy" data-v="${esc(h.text)}" aria-label="Скопировать">⧉</button>${savedMode ? '' : `<button class="iconbtn" data-a="hookSave" data-v="${esc(h.text)}" data-f="${esc(h.fmts[0])}" data-n="${esc(N.custom ? N.name : N.key)}" aria-label="Сохранить">☆</button><button class="iconbtn" data-a="hookBoard" data-v="${esc(h.text)}" data-f="${esc(h.fmts[0])}" aria-label="Раскадровка">▶</button>`}</span></div></div>`;
  }

  /* ---------- КОНТЕНТ-ПЛАН ---------- */
  const WEEKS = [
    { name: 'Знакомство и доверие', goal: 'trust', fmts: ['story', 'backstage', 'mood', 'interview'], note: 'Покажи, кто ты, как работаешь и почему тебе можно доверять.' },
    { name: 'Польза и экспертность', goal: 'reach', fmts: ['expert', 'howto', 'series'], note: 'Сохраняемый контент растит охваты: разборы, инструкции, рубрики.' },
    { name: 'Вовлечение и мнение', goal: 'reach', fmts: ['reaction', 'experiment', 'interview'], note: 'Мнение, эксперименты и вопросы дают комментарии и пересылки.' },
    { name: 'Прогрев и продажа', goal: 'sales', fmts: ['story', 'howto', 'expert'], note: 'Кейсы, результат клиентов и мягкое предложение с кодовым словом.' },
  ];
  const DAYS = { 3: ['Пн', 'Ср', 'Пт'], 5: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт'], 7: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] };
  const GOAL_LABEL = { trust: 'Доверие', reach: 'Охват', sales: 'Продажа' };
  function buildMonth() {
    const s = st(), N = nicheObj() || NI.find('мобильная съёмка'), freq = s.monthFreq || 3, pref = SN.rankFormats(C.P()).map((f) => f.key);
    const used = new Set(), seed0 = (s.monthSeed || 1) * 101;
    return WEEKS.map((w, wi) => {
      const fm = w.fmts.slice().sort((a, b) => pref.indexOf(a) - pref.indexOf(b));
      const usedTpl = new Set();
      const days = DAYS[freq].map((day, di) => {
        const fk = fm[di % fm.length];
        const goal = wi === 3 && di === DAYS[freq].length - 1 ? 'sales' : di === 0 && wi !== 3 ? 'trust' : w.goal;
        const h = HK.forFormat(N, fk, seed0 + wi * 17 + di, used, usedTpl) || HK.forFormat(N, fk, seed0 + di);
        if (h) { used.add(h.text); usedTpl.add(h.tpl); }
        const ctas = D.CONTENT_GOALS[goal === 'sales' ? 'sales' : goal === 'reach' ? 'reach' : 'trust'].cta;
        return { day, fmt: fmtName(fk), fmtKey: fk, goal: GOAL_LABEL[goal], hook: h ? h.text : '', cta: ctas[(wi + di) % ctas.length] };
      });
      return { name: w.name, note: w.note, days };
    });
  }

  /* ---------- ШАПКА ПРОФИЛЯ ---------- */
  const OFFERS = { guide: 'гайд', checklist: 'чек-лист', lesson: 'урок', bot: 'бот', channel: 'Telegram-канал', consult: 'консультация', booking: 'запись', course: 'курс' };
  const REG_TPL = ['Автор книги «…»', 'Спикер …', 'Первый(ая) в России, кто …', 'Обучил(а) 500+ специалистов', 'Работал(а) с брендами: …', 'В СМИ: …', 'Победитель конкурса …', 'Своя школа / студия …'];
  function cta(f, N, r) {
    const code = (f.code || '').trim().toUpperCase() || 'ГАЙД', w = pick(N.want, r);
    const V = {
      guide: [`👇 Напиши «${code}» — пришлю гайд`, `🎁 Гайд «Как ${w}» — по слову ${code} в директ`, `↓ Слово «${code}» в директ = гайд бесплатно`],
      checklist: [`👇 Напиши «${code}» — пришлю чек-лист`, `✅ Чек-лист «Как ${w}» — по слову ${code}`, `↓ «${code}» в директ — и чек-лист твой`],
      lesson: [`🎬 Бесплатный урок — напиши «${code}»`, `▶ Урок «Как ${w}» — по слову ${code}`],
      bot: ['🤖 Бот с подарками — по ссылке ↓', `🤖 Забери материалы в боте: как ${w} ↓`],
      channel: ['👇 Больше пользы — в моём Telegram-канале', '📌 Канал, где всё без воды — по ссылке', '↓ Закрытая польза — в Telegram'],
      consult: ['👇 Запись на консультацию по ссылке', '📩 Разберу твою ситуацию — ссылка ниже'],
      booking: ['📍 Онлайн-запись — по ссылке ниже', '🗓 Свободные окна — по ссылке ↓'],
      course: ['🎓 Курс и обучение — по ссылке', `🎓 Научу ${w} — старт по ссылке ↓`],
    };
    return pick(V[f.offer] || V.guide, r);
  }
  const cap1 = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
  const shortest = (arr) => arr.slice().sort((a, b) => a.length - b.length)[0];
  function buildBio() {
    const s = st(), f = s.bioForm, N = nicheObj() || NI.custom(''), r = C.rng((s.bioSeed || 1) * 7907);
    const who = cap1(N.doer), city = (f.city || '').trim();
    const yrs = +f.years || 0, cl = +f.clients || 0;
    const exp = yrs ? `${yrs} ${HK.plural(yrs, 'год', 'года', 'лет')}` : '';
    const proof = cl ? `${cl}+ ${HK.plural(cl, 'клиент', 'клиента', 'клиентов')}` : '';
    const aud = (f.aud || '').trim() || N.audGen;
    const res = (f.res || '').trim() || pick(N.res, r);
    const regs = (f.regs || '').split('\n').map((x) => x.trim()).filter((x) => x && !/…/.test(x)).slice(0, 3);
    const pain = shortest(N.pain), want = pick(N.want, r), myth = shortest(N.myth);
    const facts = [exp, proof].filter(Boolean).join(' · ');
    const C2 = () => cta(f, N, r);
    const join = (...lines) => lines.filter(Boolean).join('\n');
    const V = [
      { k: 'classic', name: 'Классика', arch: ['sage', 'ruler', 'caregiver', 'everyman'], text: join([who, exp, city].filter(Boolean).join(' · '), `Для ${aud}: ${res}`, proof, C2()) },
      regs.length || facts ? { k: 'regalia', name: 'Регалии вперёд', arch: ['ruler', 'hero', 'sage'], text: join(`${who}${city ? ' · ' + city : ''}`, (regs.length ? regs : [facts]).map((x) => '▪ ' + x).join('\n'), C2()) } : null,
      facts || regs.length ? { k: 'numbers', name: 'Только цифры', arch: ['ruler', 'sage', 'magician'], text: join([exp, proof].concat(regs.filter((x) => /\d/.test(x)).slice(0, 1)).filter(Boolean).join(' | '), `${who} для ${aud}`, C2()) } : null,
      { k: 'result', name: 'Через результат', arch: ['magician', 'hero', 'ruler'], text: join(`${cap1(res)} — для ${aud}`, [who, proof].filter(Boolean).join(' · '), C2()) },
      { k: 'pain', name: 'Через боль', arch: ['caregiver', 'hero', 'everyman'], text: join(`${cap1(pain)}? Исправим.`, [who, exp].filter(Boolean).join(' · '), C2()) },
      { k: 'manifest', name: 'Манифест', arch: ['ruler', 'rebel', 'hero'], text: join(`${cap1(res)} — это норма, а не чудо.`, [who, proof].filter(Boolean).join('. '), C2()) },
      { k: 'myth', name: 'Разрушаю миф', arch: ['rebel', 'sage', 'explorer'], text: join(`Миф: «${myth}». Разбираю, почему это не так`, [who, exp].filter(Boolean).join(' · '), C2()) },
      { k: 'mystery', name: 'Интрига', arch: ['magician', 'creator', 'explorer'], text: join(`Знаю, почему ${pain}. И как это исправить`, who, C2()) },
      { k: 'care', name: 'Забота', arch: ['caregiver', 'innocent', 'lover'], text: join(`Бережно помогаю ${(f.aud || '').trim() ? 'тем, кто рядом,' : N.audDat} ${want}`, [who, facts].filter(Boolean).join(' · '), C2()) },
      { k: 'journey', name: 'Путь героя', arch: ['hero', 'explorer', 'magician'], text: join(`Путь от «${pain}» к «${shortest(N.res)}»`, `${who}${exp ? ', ' + exp + ' в деле' : ''}`, C2()) },
      { k: 'irony', name: 'С иронией', arch: ['jester', 'everyman', 'rebel'], text: join(`Профессионально борюсь с тем, что ${pain}`, [who, city].filter(Boolean).join(' · '), C2()) },
      { k: 'aesthetic', name: 'Эстетика', arch: ['lover', 'creator', 'innocent'], text: join(`${N.name}. ${city || 'Детали'}. Вкус.`, `✧ ${res}`, C2()) },
      { k: 'list', name: 'Список с эмодзи', arch: ['sage', 'caregiver', 'everyman'], text: join(`✦ ${who}${city ? ' · ' + city : ''}`, facts ? `✦ ${facts}` : '', `✦ ${cap1(res)}`, C2()) },
      { k: 'expert', name: 'Опыт и польза', arch: ['sage', 'hero', 'ruler'], text: join(exp ? `${exp} ${N.inT}${proof ? '. ' + proof : ''}` : `${who}${proof ? '. ' + proof : ''}`, `Рассказываю, как ${want}`, C2()) },
      regs.some((x) => /перв|единствен|лучш|чемпион|победит|топ/i.test(x)) ? { k: 'first', name: 'Первый и единственный', arch: ['ruler', 'creator', 'hero'], text: join(regs.find((x) => /перв|единствен|лучш|чемпион|победит|топ/i.test(x)), `${who} для ${aud}`, C2()) } : null,
    ].filter(Boolean);
    const keys = archTop() || [];
    const rank = (v) => { let best = 99; keys.forEach((k, i) => { const j = v.arch.indexOf(k); if (j >= 0) best = Math.min(best, i * 3 + j); }); return best; };
    V.forEach((v) => { v.score = rank(v); v.fit = v.score < 99 ? AR.A[keys[Math.floor(v.score / 3)]].name : null; v.len = [...v.text].length; if (v.len > 150) { const lines = v.text.split('\n'); while ([...lines.join('\n')].length > 150 && lines.length > 2) lines.splice(lines.length - 2, 1); v.short = lines.join('\n'); v.len = [...v.short].length; } });
    V.sort((a, b) => a.score - b.score);
    const nm = f.name || 'Имя', nn = N.custom || !/^[А-ЯЁ][а-яё]/.test(N.name) ? N.name : N.name.charAt(0).toLowerCase() + N.name.slice(1);
    const names = [[nm, nn, city].filter(Boolean).join(' | '), `${nm} · ${N.doer}${city ? ' · ' + city : ''}`, `${cap1(nn)}${city ? ' ' + city : ''} | ${nm}`];
    return { variants: V, names };
  }
  /* ---------- ЧЕК-ЛИСТ ---------- */
  function buildChecklist() {
    const s = st(), k = leadArch(), PP = k ? window.VektorPassports[k] : null, mini = s.mini || {};
    const g = [
      { t: 'Накануне', i: ['Хук написан в 3 вариантах — выберешь лучший в кадре', 'Есть раскадровка или список кадров (раздел «Идеи» → «Раскадровка»)', 'Локация проверена в то же время суток, что и съёмка', 'Одежда выбрана и проверена в кадре на фоне', 'Реквизит собран в одну коробку', 'Батареи заряжены, на телефоне свободно 10+ ГБ'] },
      { t: 'Техника', i: ['Снимаешь на основную камеру, а не фронтальную', 'Формат 9:16, 4K 30 к/с или 1080p 60 к/с для замедлений', 'Экспозиция и фокус зафиксированы долгим нажатием', 'Режим «Не беспокоить» включён', 'Объектив протёрт', 'Телефон на штативе на уровне глаз'] },
      { t: 'Свет', i: ['Лицо к окну или рисующий свет под 45°', 'С другой стороны — мягкий заполняющий свет или отражатель', 'Верхний свет в комнате выключен', 'Контровой свет отделяет тебя от фона', 'Все источники одной цветовой температуры'] },
      { t: 'Звук', i: ['Петличка или микрофон в 20–30 см ото рта', 'Комната без эха: шторы, ковёр, мягкие вещи', 'Кондиционер и холодильник выключены', 'Тестовая запись 10 секунд прослушана в наушниках'] },
      { t: 'Кадр', i: ['Глаза на линии верхней трети кадра', 'Над головой небольшой запас, без «отрезанной» макушки', 'Фон с глубиной и без хлама', 'Текст и лицо вне зон интерфейса соцсети (низ и правый край)', 'Есть передний план для объёма'] },
      { t: 'Подача', i: ['Голос разогрет 1 минуту', 'Энергия на 20% выше обычной — камера её «съедает»', 'Смотришь в объектив, а не на экран', 'Первая фраза — сразу хук, без «привет, ребята»', 'Эмоция в первые 3 секунды'] },
      { t: 'Дубли', i: ['Хук снят в 3 вариантах', 'Каждый тезис — минимум 2 дубля', '5–8 перебивок: руки, детали, процесс', 'Финальная фраза и призыв к действию отдельно', '5 секунд тишины в локации — для чистки звука'] },
      { t: 'После съёмки', i: ['Материал скопирован в облако', 'Первые 3 секунды понятны без звука', 'Лучший дубль отмечен сразу'] },
    ];
    const style = [];
    if (PP) style.push('Одежда: ' + first(PP.clothes), 'Картинка: ' + first(PP.method), 'Голос: ' + first(PP.voice), 'Палитра в кадре: ' + PP.paletteName.toLowerCase());
    if (mini.colorRes) style.push(`Цветотип ${EX.COLORTYPE.season[mini.colorRes].title}: избегай у лица — ${EX.COLORTYPE.season[mini.colorRes].avoid}`);
    if (mini.percRes) style.push(`Канал «${EX.PERCEPTION.result[mini.percRes].title}»: ${EX.PERCEPTION.result[mini.percRes].content[0].toLowerCase()}`);
    if (mini.chronoRes != null) style.push(EX.CHRONO.result[mini.chronoRes].shoot);
    if (style.length) g.push({ t: `Твой стиль${k ? ' · ' + AR.A[k].name : ''}`, i: style });
    return g.map((x, gi) => ({ title: x.t, items: x.i.map((t, i) => ({ id: gi + '-' + i, text: t })) }));
  }
  const first = (t) => t.split('. ')[0].replace(/\.$/, '') + '.';

  /* ---------- МИНИ-ТЕСТЫ ---------- */
  const MINI = {
    perc: { title: 'Канал восприятия', sub: '8 вопросов · 1 минута', q: () => EX.PERCEPTION.q.map(([t, o]) => ({ t, o: o.map((x, i) => [x, i]) })) },
    chrono: { title: 'Хронотип', sub: '4 вопроса · 30 секунд', q: () => EX.CHRONO.q.map(([t, o]) => ({ t, o: o.map((x, i) => [x, i]) })) },
    color: { title: 'Цветотип', sub: '5 вопросов · 1 минута', q: () => EX.COLORTYPE.q.map(([t, o]) => ({ t, o })) },
  };
  function miniDone(k) { const m = st().mini || {}; return k === 'perc' ? m.percRes : k === 'chrono' ? m.chronoRes != null : k === 'color' ? m.colorRes : false; }
  function miniFinish(k) {
    const m = st().mini; const a = m[k] || [];
    if (k === 'perc') m.percRes = EX.perceptionResult(a).lead;
    if (k === 'chrono') m.chronoRes = EX.CHRONO.result.indexOf(EX.chronoResult(a));
    if (k === 'color') m.colorRes = EX.colorResult(a).key;
    C.save();
  }

  /* ---------- ЭМБЛЕМЫ СТИХИЙ (анимированные SVG) ---------- */
  function emblem(el, size) {
    const s = size || 64;
    const art = {
      fire: `<path class="em-flame" d="M32 6c4 10 14 14 14 28a14 14 0 0 1-28 0c0-8 5-12 6-18 3 4 3 8 6 10 1-8-2-14 2-20z" fill="url(#gf)"/><path class="em-flame2" d="M32 30c3 4 6 6 6 11a6 6 0 0 1-12 0c0-3 2-5 3-8 1 2 2 3 3 3 0-3-1-4 0-6z" fill="#FFE29A"/>
        <defs><linearGradient id="gf" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#FF5A36"/><stop offset="1" stop-color="#FFB547"/></linearGradient></defs>`,
      earth: `<path d="M6 50 L22 26 L30 36 L40 20 L58 50 Z" fill="#8A7A55"/><path d="M40 20 L46 30 L42 29 L38 32 L35 28 Z" fill="#EEE6D0"/><g class="em-leaf"><path d="M50 52c0-8 6-12 10-12-1 6-4 11-10 12z" fill="#7FCB7A"/><path d="M50 52 L58 42" stroke="#4E8F4A" stroke-width="1.2"/></g><path d="M4 52h56" stroke="#C9B37E" stroke-width="2" stroke-linecap="round"/>`,
      air: `<g fill="none" stroke="#8FC8FF" stroke-width="3" stroke-linecap="round"><path class="em-wind w1" d="M8 22h30a7 7 0 1 0-7-7"/><path class="em-wind w2" d="M6 34h44a6 6 0 1 1-6 6"/><path class="em-wind w3" d="M12 46h22"/></g>`,
      water: `<g fill="none" stroke-width="3" stroke-linecap="round"><path class="em-wave v1" stroke="#7C8CFF" d="M4 26c6-6 10-6 14 0s10 6 14 0 10-6 14 0 10 6 14 0"/><path class="em-wave v2" stroke="#9AA8FF" d="M4 38c6-6 10-6 14 0s10 6 14 0 10-6 14 0 10 6 14 0"/><path class="em-wave v3" stroke="#B8C2FF" d="M4 50c6-6 10-6 14 0s10 6 14 0 10-6 14 0 10 6 14 0"/></g>`,
    }[el] || '';
    return `<svg class="emblem em-${el}" viewBox="0 0 64 64" width="${s}" height="${s}" aria-hidden="true">${art}</svg>`;
  }
  function signBadge() {
    const ch = C.chart(), ds = st().demoSign; const si = ch ? ch.planets.sun.sign : ds != null ? ds : null; if (si == null) return '';
    const sg = D.SIGNS[si];
    return `<div class="sign-badge" title="${sg.name} · ${D.ELEMENTS[sg.element].name}">${emblem(sg.element, 46)}<span class="sb-glyph">${G(sg.glyph)}</span></div>`;
  }

  /* ---------- «Где ты заряжаешься» ---------- */
  function rechargeCard() {
    const R = EX.recharge(C.P()); if (!R) return '';
    return `<div class="card stack recharge"><div class="row"><span class="bi">⚡</span><h2>Где ты заряжаешься</h2></div>
      <div class="chips">${R.places.map((p) => `<span class="rchip src-${p.src}">${esc(p.text)}</span>`).join('')}</div>
      ${R.ritual15 ? `<p class="line"><b>Ритуал на 15 минут.</b> ${esc(R.ritual15.text)} ${srcChip(R.ritual15.src)}</p>` : ''}
      ${R.weekend ? `<p class="line"><b>Перезагрузка.</b> ${esc(R.weekend.text)} ${srcChip(R.weekend.src)}</p>` : ''}
      ${R.notes.map((n) => `<p class="line">${esc(n.text)} ${srcChip(n.src)}</p>`).join('')}
      ${R.drain.length ? `<p class="line"><b>Что опустошает.</b> ${esc(R.drain.map((d) => d.text.replace(/\.$/, '')).join('; '))}.</p>` : ''}
      ${R.content ? `<div class="act"><b>Преврати в контент</b>${esc(R.content.text)}</div>` : ''}</div>`;
  }
  function miniLines() {
    const m = st().mini || {}, out = { who: [], how: [], rhythm: [] };
    if (m.colorRes && EX.COLORTYPE.season[m.colorRes]) { const c = EX.COLORTYPE.season[m.colorRes]; out.who.push({ src: 'extra', text: `Цветотип ${c.title}: в кадре носи цвета своей палитры, избегай у лица — ${c.avoid}.` }); }
    if (m.percRes && EX.PERCEPTION.result[m.percRes]) { const p = EX.PERCEPTION.result[m.percRes]; out.how.push({ src: 'extra', text: `Твой канал — ${p.title.toLowerCase()}: ${p.content[0].charAt(0).toLowerCase() + p.content[0].slice(1)}.` }); }
    if (m.chronoRes != null && EX.CHRONO.result[m.chronoRes]) { const c = EX.CHRONO.result[m.chronoRes]; out.rhythm.push({ src: 'extra', text: `${c.title}. ${c.shoot}` }); }
    return out;
  }

  /* ---------- ДАШБОРД ПРОФИЛЯ ---------- */
  function donut(parts) {
    const tot = parts.reduce((a, p) => a + p.v, 0) || 1, R = 38, Cc = 2 * Math.PI * R; let off = 0;
    return `<svg viewBox="0 0 100 100" class="donut">${parts.map((p, i) => { const len = (p.v / tot) * Cc; const el = `<circle r="${R}" cx="50" cy="50" fill="none" stroke="${p.c}" stroke-width="14" stroke-dasharray="${len} ${Cc - len}" stroke-dashoffset="${-off}" class="dseg" style="animation-delay:${i * 0.12}s"/>`; off += len; return el; }).join('')}</svg>`;
  }
  function counter(n, label, sub) { return `<div class="stat"><b class="count" data-to="${n}">0</b><span>${label}</span>${sub ? `<small>${sub}</small>` : ''}</div>`; }

  /* ================= ЭКРАНЫ ================= */
  const screens = {
    hooks() {
      const s = st(), N = nicheObj(), v = N ? hookBatch(false) : null, a = C.arch();
      return head('Мастерская', 'Хуки под тебя', 'Первая фраза решает, досмотрят ли ролик. База: 100 ниш и сотни хуков на каждую. Оценка по системе СТОП и 15 психологическим триггерам. Тон выбираешь сам: от мягкого до жёсткого и абсурдного.') + `<div class="stack-lg">
        <div class="card stack">${nicheField()}
          ${N ? `<div class="chips">${[['', 'Все'], ['В', 'Выгода'], ['И', 'Интрига'], ['С', 'Срочность'], ['П', 'Польза']].map(([k, l]) => `<button type="button" class="chip ${(s.hookVisp || '') === k ? 'on' : ''}" data-a="hookVisp" data-v="${k}">${l}</button>`).join('')}
            ${a ? `<button type="button" class="chip ${s.hookArch !== false ? 'on' : ''}" data-a="hookArchToggle">Под мой архетип: ${esc(AR.A[a.ranked[0]].name)}</button>` : ''}</div>
          <span class="dim">Тон</span><div class="chips">${[['', 'Все'], ['psy', '🧠 Психология'], ['base', 'Обычные'], ['hard', '🔥 Жёсткие'], ['absurd', '🙃 Абсурд'], ['x18', '🔞 18+']].map(([k, l]) => `<button type="button" class="chip ${(s.hookTone || '') === k ? 'on' : ''}" data-a="hookTone" data-v="${k}">${l}</button>`).join('')}</div>
          ${s.hookTone === 'psy' ? `<div class="chips">${[['', 'Все 15 триггеров']].concat(Object.entries(HK.TRIGGERS).map(([k, v]) => [k, v[0]])).map(([k, l]) => `<button type="button" class="chip sm ${(s.hookTrig || '') === k ? 'on' : ''}" data-a="hookTrig" data-v="${k}">${esc(l)}</button>`).join('')}</div>${s.hookTrig ? `<p class="dim">${esc(HK.TRIGGERS[s.hookTrig][1])}</p>` : ''}` : ''}
          ${s.hookTone === 'x18' ? '<p class="dim">Мат под звёздочками. Используй, только если это органично для тебя и аудитории: площадки могут снижать охват ролика с ненормативной лексикой.</p>' : ''}` : ''}</div>
        ${v ? `<div class="card stack">${v.items.map((h) => hookCard(h, v.N)).join('')}</div>
          <button class="btn" data-a="hooksMore">Другие варианты</button>
          <p class="dim center">Показано ${Math.min(v.shown, v.total)} из ${v.total}. Повторов не будет, пока не закончится вся база ниши.</p>` : `<div class="card empty"><div class="ic">🎣</div><p>Выбери нишу — и получишь хуки под неё.</p></div>`}
        <div class="card flat stack"><span class="eyebrow">Как читать оценку</span><p class="dim">Оценка СТОП: Сейчас, Тайна, Обещание, Попадание — до 40 баллов.</p></div></div>`;
    },
    ideas() {
      const f = st().ideaForm;
      const chips = (name, arr, cur) => `<div class="chips">${arr.map(([v, l]) => `<button type="button" class="chip ${cur === v ? 'on' : ''}" data-a="ideaOpt" data-k="${name}" data-v="${esc(v)}">${esc(l)}</button>`).join('')}</div>`;
      return head('Генератор идей', 'Идеи под твою нишу', C.nSystems() ? 'Форматы — из твоего кода, хук и структура — из базы ниши.' : 'Собери код — и идеи будут учитывать твой стиль.') +
        `<div class="stack-lg"><div class="card stack">${nicheField()}
          <span class="dim">Платформа</span>${chips('platform', D.PLATFORMS.map((p) => [p, p]), f.platform)}
          <span class="dim">Цель контента</span>${chips('goal', Object.entries(D.CONTENT_GOALS).map(([k, v]) => [k, v.name]), f.goal)}
          <button class="btn" data-a="genIdeas" style="margin-top:6px">${st().ideas.length ? 'Сгенерировать заново' : 'Получить идеи'}</button></div>
          ${st().ideas.map(C.ideaCard).join('')}
          ${st().ideas.length ? `<button class="btn ghost" data-a="moreIdeas">Ещё 5 идей</button>` : ''}</div>`;
    },
    formats() {
      const p = C.P(), r = SN.rankFormats(p), has = C.nSystems() || p.demoSign != null, N = nicheObj() || NI.find('мобильная съёмка');
      return head('Форматы', 'Что тебе подойдёт', (has ? 'Рейтинг собран из голосов всех систем, которые у тебя есть.' : 'Добавь данные, чтобы отсортировать форматы под тебя.') + ` Примеры хуков — для ниши «${esc(N.name)}».`) +
        `<div class="stack">${r.map((f, i) => { const h = HK.forFormat(N, f.key, 7 + i); return `<article class="card stack">
          <div class="row between"><div class="row"><span style="font-size:22px">${f.icon}</span><h2>${f.name}</h2></div>${has && i < 3 ? `<span class="badge">топ-${i + 1}</span>` : ''}</div>
          ${f.srcs && f.srcs.length ? `<div class="row wrap" style="gap:6px">${f.srcs.map(srcChip).join('')}</div>` : ''}
          <p class="muted">${esc(f.why)}</p>
          ${h ? `<div class="exhook"><span class="dim">Пример хука</span><br><b>${esc(h.text)}</b></div>` : ''}
          <ol class="steps">${f.structure.map((x) => `<li>${esc(x)}</li>`).join('')}</ol>
          <p style="font-size:14px"><b style="color:var(--accent)">Тест:</b> ${esc(f.test)}</p></article>`; }).join('')}</div>`;
    },
    month() {
      const s = st(), plan = buildMonth(), N = nicheObj();
      return head('Мастерская', 'Контент-план на месяц', 'Четыре недели — четыре задачи воронки: доверие → польза → вовлечение → продажа. Форматы из твоего кода, хуки из базы ниши.') + `<div class="stack-lg">
        <div class="card stack">${nicheField()}<span class="dim">Публикаций в неделю</span><div class="chips">${[3, 5, 7].map((n) => `<button type="button" class="chip ${(s.monthFreq || 3) === n ? 'on' : ''}" data-a="monthFreq" data-v="${n}">${n}</button>`).join('')}</div>
          <button class="btn ghost" data-a="monthNew">Другие хуки в плане</button></div>
        ${!N ? '<p class="dim">Пока ниша не выбрана, план собран на примере ниши «Мобильная съёмка».</p>' : ''}
        ${plan.map((w, wi) => `<div class="card stack"><span class="eyebrow">Неделя ${wi + 1} · ${esc(w.name)}</span><p class="dim">${esc(w.note)}</p>${w.days.map((d) => `<div class="mrow"><span class="mday">${d.day}</span><div><b>${esc(d.hook)}</b><p class="dim">${esc(d.fmt)} · <span class="gtag g-${{ Доверие: 't', Охват: 'r', Продажа: 's' }[d.goal]}">${d.goal}</span> · ${esc(d.cta)}</p></div></div>`).join('')}</div>`).join('')}
        <button class="btn" data-a="copyMonth">Скопировать план</button>
        <button class="btn ghost" data-a="monthToPlan">Добавить неделю 1 в «План»</button></div>`;
    },
    bio() {
      const f = st().bioForm, b = buildBio();
      const sel = (k, opts) => `<div class="chips">${opts.map(([v, l]) => `<button type="button" class="chip ${f[k] === v ? 'on' : ''}" data-a="bioOpt" data-k="${k}" data-v="${v}">${l}</button>`).join('')}</div>`;
      return head('Мастерская', 'Шапка профиля', 'У шапки 3 секунды: кто ты, почему тебе верить и что сделать дальше. Заполни факты — получишь варианты в разных стилях, первыми идут стили твоих архетипов.') + `<div class="stack-lg">
        <div class="card stack">${nicheField()}
          <div class="grid2"><label class="f">Имя<input type="text" data-in="bio:name" value="${esc(f.name || '')}" placeholder="Анна" maxlength="30"></label><label class="f">Город<input type="text" data-in="bio:city" value="${esc(f.city || '')}" placeholder="Находка" maxlength="30"></label></div>
          <div class="grid2"><label class="f">Лет опыта<input type="number" data-in="bio:years" value="${esc(f.years || '')}" placeholder="5" min="0" max="60"></label><label class="f">Клиентов / учеников<input type="number" data-in="bio:clients" value="${esc(f.clients || '')}" placeholder="2500" min="0"></label></div>
          <label class="f">Для кого <span class="dim">— кого? чего?</span><input type="text" data-in="bio:aud" value="${esc(f.aud || '')}" placeholder="${esc((nicheObj() || { audGen: 'клиентов' }).audGen)}" maxlength="50"></label>
          <label class="f">Главный результат для клиента<input type="text" data-in="bio:res" value="${esc(f.res || '')}" placeholder="${esc((nicheObj() || { res: ['результат'] }).res[0])}" maxlength="60"></label>
          <label class="f">Регалии <span class="dim">— каждая с новой строки, до 3</span><textarea data-in="bio:regs" rows="3" maxlength="160" placeholder="Автор книги «Ногти без боли»&#10;Спикер BeautyExpo&#10;Первая в городе, кто…">${esc(f.regs || '')}</textarea></label>
          <div class="chips">${REG_TPL.map((t) => `<button type="button" class="chip" data-a="bioReg" data-v="${esc(t)}">+ ${esc(t)}</button>`).join('')}</div>
          <span class="dim">Воронка: куда ведёт шапка</span>${sel('offer', Object.entries(OFFERS))}
          ${['guide', 'checklist', 'lesson'].includes(f.offer || 'guide') ? `<label class="f">Кодовое слово<input type="text" data-in="bio:code" value="${esc(f.code || '')}" placeholder="ГАЙД" maxlength="16"></label>` : ''}
          <button class="btn" data-a="bioGen">Обновить варианты</button></div>
        <div class="card stack"><span class="eyebrow">Поле «Имя» — по нему ищут</span>${b.names.map((n) => `<div class="row between"><pre class="bio" style="flex:1">${esc(n)}</pre><button class="iconbtn" data-a="copyText" data-v="${esc(n)}" aria-label="Скопировать">⧉</button></div>`).join('')}<p class="dim">Ниша и город в поле «Имя» — так тебя найдут через поиск. В описании это можно не повторять.</p></div>
        ${b.variants.map((v) => `<div class="card stack"><div class="row between"><span class="eyebrow">${esc(v.name)}${v.fit ? ` · <span class="fit">${esc(v.fit)}</span>` : ''}</span><span class="badge ${v.len > 150 ? 'warn' : ''}">${v.len}/150</span></div><pre class="bio">${esc(v.short || v.text)}</pre>${v.short ? '<p class="dim">Сокращено до лимита 150 знаков.</p>' : ''}<button class="btn sm ghost" data-a="copyText" data-v="${esc(v.short || v.text)}" style="align-self:flex-start">Скопировать</button></div>`).join('')}
        <button class="btn ghost" data-a="bioMore">Другие формулировки</button>
        <div class="card flat stack"><span class="eyebrow">Как выделиться</span><p class="line">1. Первая строка решает. Не «эксперт», а конкретная профессия или сильная фраза.</p><p class="line">2. Одна цифра сильнее трёх эпитетов: «2500 клиентов» вместо «опытный и внимательный».</p><p class="line">3. Регалия должна быть проверяемой: книга, сцена, СМИ, рекорд, своя школа.</p><p class="line">4. Говори голосом своего архетипа: Правитель — манифест, Шут — ирония, Любовник — эстетика, Маг — интрига.</p><p class="line">5. Одно действие в конце: кодовое слово, бот или ссылка. Два призыва — ни одного.</p><p class="line">6. Ссылку закрепи первой и подпиши так же, как в призыве. Визуальный трюк: разделители «|», «·», «▪» и пустая строка перед призывом.</p></div></div>`;
    },
    checklist() {
      const groups = buildChecklist(), check = st().check || {}, all = groups.reduce((a, g) => a + g.items.length, 0), done = groups.reduce((a, g) => a + g.items.filter((i) => check[i.id]).length, 0);
      return head('Мастерская', 'Чек-лист съёмки', 'От подготовки накануне до бэкапа после. Отмечай пункты — прогресс сохраняется.') + `<div class="stack-lg">
        <div class="stack"><div class="row between"><span class="muted">${done} из ${all}</span><span class="dim">${Math.round((done / all) * 100)}%</span></div><div class="progress"><i style="width:${(done / all) * 100}%"></i></div></div>
        ${groups.map((g) => `<div class="card"><span class="eyebrow">${esc(g.title)}</span>${g.items.map((i) => `<div class="todo ${check[i.id] ? 'done' : ''}" data-a="checkToggle" data-v="${i.id}"><span class="box">${check[i.id] ? '✓' : ''}</span><div class="tx">${esc(i.text)}</div></div>`).join('')}</div>`).join('')}
        <button class="btn ghost" data-a="checkReset">Сбросить отметки</button></div>`;
    },
    mini({ t }) {
      const M = MINI[t], m = (st().mini = st().mini || {}), a = (m[t] = m[t] || []), qs = M.q();
      const i = a.findIndex((x) => x == null) >= 0 ? a.findIndex((x) => x == null) : a.length;
      if (i >= qs.length) return screens.miniRes({ t });
      const q = qs[i];
      return `<div class="row between" style="margin-bottom:14px"><button class="linkbtn" data-a="back" style="text-decoration:none">✕ Выйти</button><span class="dim">${i + 1} / ${qs.length}</span></div>
        <div class="progress" style="margin-bottom:24px"><i style="width:${(i / qs.length) * 100}%;background:var(--accent)"></i></div>
        <span class="eyebrow">${M.title}</span><h1 class="q" style="min-height:0;margin-bottom:18px">${esc(q.t)}</h1>
        <div class="stack">${q.o.map(([txt, val]) => `<button class="card tap fc" data-a="miniAnswer" data-t="${t}" data-v="${esc(String(val))}">${esc(txt)}</button>`).join('')}</div>
        ${i > 0 ? `<button class="btn sm ghost" data-a="miniPrev" data-t="${t}" style="margin-top:18px">← Назад</button>` : ''}`;
    },
    miniRes({ t }) {
      const m = st().mini || {};
      let body = '';
      if (t === 'perc') { const r = EX.perceptionResult(m.perc || []), R = EX.PERCEPTION.result[r.lead], R2 = EX.PERCEPTION.result[r.second], tie = r.counts[r.lead] === r.counts[r.second], tot = 8; body = `<h1>${tie ? R.title + ' + ' + R2.title.toLowerCase() : R.title}</h1><p class="muted">${esc(R.text)}${tie ? ' ' + esc(R2.text) : ''}</p><div class="card stack"><div class="bars">${EX.PERCEPTION.keys.map((k) => `<div class="bar" style="grid-template-columns:96px 1fr 30px"><span>${EX.PERCEPTION.names[k]}</span><span class="track"><span class="fill" style="display:block;width:${(r.counts[k] / tot) * 100}%;background:${k === r.lead ? 'var(--accent)' : 'rgba(255,255,255,.28)'}"></span></span><span class="n">${r.counts[k]}</span></div>`).join('')}</div></div><div class="card stack"><span class="eyebrow">Как подавать контент</span>${R.content.map((c) => `<p class="line">• ${esc(c)}</p>`).join('')}<p class="dim">Второй канал — ${EX.PERCEPTION.names[r.second].toLowerCase()}: добавляй его элементы, чтобы зацепить больше зрителей.</p></div>`; }
      if (t === 'chrono') { const R = EX.CHRONO.result[m.chronoRes]; body = `<h1>${R.title}</h1><div class="card stack"><p class="line"><b>Съёмка.</b> ${esc(R.shoot)}</p><p class="line"><b>Сценарии.</b> ${esc(R.write)}</p><p class="line"><b>Не трогай камеру.</b> ${esc(R.avoid)}</p><p class="dim">Время публикации выбирай по статистике своей аудитории, а не по своему хронотипу.</p></div>`; }
      if (t === 'color') { const R = EX.COLORTYPE.season[m.colorRes], k = leadArch(), PP = k ? window.VektorPassports[k] : null; body = `<h1>${R.title}</h1><p class="muted">${esc(R.text)}</p><div class="card stack"><span class="eyebrow">Цвета одежды в кадре</span><div class="swatches s6">${R.wear.map((c) => `<button class="sw" style="background:${c}" data-a="copyText" data-v="${c}"><code>${c}</code></button>`).join('')}</div><p class="line"><b>Избегай у лица:</b> ${esc(R.avoid)}.</p>${PP ? `<p class="dim">Палитра архетипа ${esc(AR.A[k].name)} — для фона и графики: ${PP.palette.join(' ')}. Одежда — из своей палитры, фон — из палитры архетипа.</p>` : ''}</div>`; }
      return `<div class="stack-lg"><span class="eyebrow">${MINI[t].title}</span>${body}<button class="btn ghost" data-a="miniRestart" data-t="${t}">Пройти заново</button><button class="btn soft" data-a="tab" data-v="code">К коду креатора</button></div>`;
    },
    matrix() {
      const p = st().profile; if (!p) return head('Матрица судьбы', 'Нужна дата рождения', '') + `<button class="btn" data-a="go" data-v="birth">Ввести данные</button>`;
      const M = EX.matrix(p.date);
      return head('Дополнительно', 'Матрица судьбы', 'Пять ключевых энергий по дате рождения (метод 22 арканов). Это игровой слой для вдохновения, а не прогноз.') + `<div class="stack-lg">
        <div class="mx">${M.map((x, i) => `<div class="mxp p${i}"><b>${x.n}</b><small>${esc(x.title)}</small></div>`).join('')}<svg viewBox="0 0 200 200" class="mxlines"><rect x="40" y="40" width="120" height="120" fill="none" stroke="var(--line2)"/><path d="M100 18 L182 100 L100 182 L18 100 Z" fill="none" stroke="var(--line2)"/></svg></div>
        ${M.map((x) => `<div class="card stack"><div class="row between"><span class="eyebrow">${esc(x.title)}</span><span class="badge">${x.n} · ${esc(x.name)}</span></div><p>${esc(x.content.charAt(0).toUpperCase() + x.content.slice(1))}.</p></div>`).join('')}</div>`;
    },
  };

  /* ---------- дополнения к «Системам» и «Коду» ---------- */
  function extrasTiles() {
    const m = st().mini || {};
    const t = (to, ic, title, sub, done, params) => `<button class="card tap sys-tile" data-a="${params ? 'goMini' : 'go'}" data-v="${to}"${params ? ` data-t="${params}"` : ''}><span class="sys-g src-extra">${ic}</span><span class="t"><b>${title}</b><small>${sub}</small></span><span class="badge ${done ? '' : 'warn'}">${done ? 'готово' : 'пройти'}</span></button>`;
    return `<h2 style="margin-top:22px">Дополнительно — по минуте</h2><div class="stack" style="margin-top:12px">
      ${t('mini', '👁', 'Канал восприятия', m.percRes ? EX.PERCEPTION.result[m.percRes].title : 'Через что тебе подавать контент', !!m.percRes, 'perc')}
      ${t('mini', '◷', 'Хронотип', m.chronoRes != null ? EX.CHRONO.result[m.chronoRes].title : 'Когда снимать и когда писать', m.chronoRes != null, 'chrono')}
      ${t('mini', '🎨', 'Цветотип', m.colorRes ? EX.COLORTYPE.season[m.colorRes].title : 'Цвета одежды в кадре', !!m.colorRes, 'color')}
      ${t('matrix', '✶', 'Матрица судьбы', st().profile ? 'Пять энергий по дате рождения' : 'Нужна дата рождения', !!st().profile)}</div>`;
  }

  function profileDashboard() {
    try { return profileDashboardInner(); } catch (e) { console.error('dashboard', e); return `<div class="card stack"><span class="eyebrow">Профиль креатора</span><h1>${esc(C.userName() || 'Креатор')}</h1><p class="dim">Сводка временно недоступна.</p></div>`; }
  }
  function profileDashboardInner() {
    const s = st(), ch = C.chart(), a = C.arch(), num = C.num(), hd = C.hd(), m = s.mini || {};
    const sys = [ch, a, num, hd].filter(Boolean).length, extra = [m.percRes, m.chronoRes != null ? 1 : null, m.colorRes].filter(Boolean).length;
    const days = Math.max(1, Math.round((Date.now() - (stats().firstSeen || Date.now())) / 864e5) + 1);
    const plan = s.plan, pl = plan ? (plan.items || []).concat(plan.extra || []).filter(Boolean) : [], pd = pl.filter((x) => x.done).length;
    const el = ch && C.bal() ? C.bal().elements : null;
    const sg = ch ? D.SIGNS[ch.planets.sun.sign] : s.demoSign != null ? D.SIGNS[s.demoSign] : null;
    return `<div class="dash">
      <div class="card dash-hero">${sg ? `<div class="dh-emblem">${emblem(sg.element, 88)}<span class="dh-orbit"><i>${G(sg.glyph)}</i></span></div>` : ''}
        <div><span class="eyebrow">Профиль креатора</span><h1>${esc(C.userName() || 'Креатор')}</h1><p class="muted">${sg ? `${sg.name} · ${D.ELEMENTS[sg.element].name}` : 'Данные рождения не указаны'}${a ? ` · ${AR.A[a.ranked[0]].name}` : ''}${hd && window.VektorSystems.HD_TYPES[hd.type] ? ` · ${window.VektorSystems.HD_TYPES[hd.type].name}` : ''}</p></div></div>
      <div class="stats">${counter(sys, 'систем из 4', extra ? `+ ${extra} мини-теста` : '')}${counter(pd, 'шагов плана', plan ? `из ${pl.length}` : '')}${counter((s.saved || []).length, 'в сохранённом', '')}${counter(stats().hooks || 0, 'хуков подобрано', '')}${counter(stats().ideas || 0, 'идей создано', '')}${counter(days, HK.plural(days, 'день', 'дня', 'дней') + ' в приложении', '')}</div>
      ${el ? `<div class="card dash-row"><div class="dr-chart">${donut(['fire', 'earth', 'air', 'water'].map((k) => ({ v: el[k], c: { fire: '#FF7A45', earth: '#C9B37E', air: '#8FC8FF', water: '#7C8CFF' }[k] })))}</div><div class="dr-legend"><span class="eyebrow">Баланс стихий</span>${['fire', 'earth', 'air', 'water'].map((k) => `<div class="lg"><i style="background:${{ fire: '#FF7A45', earth: '#C9B37E', air: '#8FC8FF', water: '#7C8CFF' }[k]}"></i>${D.ELEMENTS[k].name}<b>${Math.round((el[k] / Object.values(el).reduce((x, y) => x + y, 0)) * 100)}%</b></div>`).join('')}</div></div>` : ''}
      ${a ? `<div class="card stack"><span class="eyebrow">Топ-5 архетипов</span>${a.ranked.slice(0, 5).map((k, i) => `<div class="abar"><span>${G(AR.A[k].glyph)} ${AR.A[k].name}</span><span class="track"><span class="fill grow" style="--w:${(a.scores[k] / AR.MAX) * 100}%;animation-delay:${i * 0.08}s"></span></span><b>${a.scores[k]}</b></div>`).join('')}</div>` : ''}
      ${num ? `<div class="card stack"><span class="eyebrow">Числа</span><div class="numrow">${[['Путь', num.life], ['Выражение', num.expression], ['Душа', num.soul], ['Личный год', num.pYear], ['Личный день', num.pDay]].filter((x) => x[1]).map(([l, v]) => `<div><b>${v}</b><small>${l}</small></div>`).join('')}</div></div>` : ''}
      ${(m.percRes || m.chronoRes != null || m.colorRes) ? `<div class="card stack"><span class="eyebrow">Мини-тесты</span><div class="numrow">${m.percRes && EX.PERCEPTION.result[m.percRes] ? `<div><b>👁</b><small>${EX.PERCEPTION.result[m.percRes].title}</small></div>` : ''}${m.chronoRes != null && EX.CHRONO.result[m.chronoRes] ? `<div><b>◷</b><small>${EX.CHRONO.result[m.chronoRes].title}</small></div>` : ''}${m.colorRes && EX.COLORTYPE.season[m.colorRes] ? `<div><b>🎨</b><small>${EX.COLORTYPE.season[m.colorRes].title}</small></div>` : ''}</div></div>` : ''}
    </div>`;
  }
  function animateDash() {
    document.querySelectorAll('.count').forEach((el) => {
      const to = +el.dataset.to, t0 = performance.now(), dur = 900;
      const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduce || !to) { el.textContent = to; return; }
      const step = (t) => { const k = Math.min(1, (t - t0) / dur); el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    });
  }

  /* ================= ДЕЙСТВИЯ ================= */
  const actions = {
    pickNiche(el) { st().ideaForm.niche = el.dataset.v; hookView = null; C.save(); C.haptic(); C.render(); },
    hookVisp(el) { st().hookVisp = el.dataset.v || null; hookView = null; C.save(); C.haptic(); C.render(); },
    hookTone(el) { st().hookTone = el.dataset.v || null; st().hookTrig = null; hookView = null; C.save(); C.haptic(); C.render(); },
    hookTrig(el) { st().hookTrig = el.dataset.v || null; hookView = null; C.save(); C.haptic(); C.render(); },
    hookArchToggle() { st().hookArch = st().hookArch === false; hookView = null; C.save(); C.haptic(); C.render(); },
    hooksMore() { hookBatch(true); C.haptic(); C.render(); const c = document.querySelector('.hk'); if (c) c.scrollIntoView({ behavior: 'smooth', block: 'center' }); },
    hookCopy(el) { stats().copies++; C.save(); C.copy(el.dataset.v); },
    hookSave(el) { const s = st(); if (!s.saved.some((x) => x.kind === 'hook' && x.text === el.dataset.v)) s.saved.push({ id: 'h' + Date.now(), kind: 'hook', text: el.dataset.v, fmt: el.dataset.f }); C.save(); C.haptic(); C.toast('Хук сохранён'); el.textContent = '★'; el.classList.add('on'); },
    hookBoard(el) { const N = nicheObj() || NI.custom(''); const idea = makeIdea(N, el.dataset.f, el.dataset.v, Date.now() % 100000); st().ideas.unshift(idea); C.save(); C.go('board', { id: idea.id }); },
    genIdeas() { genIdeas(false); C.haptic('medium'); C.render(); const c = document.querySelector('article.card'); if (c) c.scrollIntoView({ behavior: 'smooth', block: 'start' }); C.toast('Новые идеи готовы'); },
    moreIdeas() { genIdeas(true); C.haptic(); C.render(); },
    monthFreq(el) { st().monthFreq = +el.dataset.v; C.save(); C.haptic(); C.render(); },
    monthNew() { st().monthSeed = (st().monthSeed || 1) + 1; C.save(); C.haptic(); C.render(); C.toast('План пересобран'); },
    copyMonth() { C.copy(buildMonth().map((w, i) => `НЕДЕЛЯ ${i + 1} · ${w.name}\n` + w.days.map((d) => `${d.day} · ${d.fmt} · ${d.goal}\n${d.hook}\nCTA: ${d.cta}`).join('\n\n')).join('\n\n')); },
    monthToPlan() { C.ensurePlan(); const s = st(); buildMonth()[0].days.forEach((d) => { const t = `${d.day}: «${d.hook}» (${d.fmt.toLowerCase()})`; if (!s.plan.extra.some((x) => x.text === t)) s.plan.extra.push({ text: t, done: false }); }); C.save(); C.haptic('medium'); C.toast('Неделя 1 добавлена в план'); },
    bioOpt(el) { st().bioForm[el.dataset.k] = el.dataset.v; C.save(); C.haptic(); C.render(); },
    bioGen() { C.save(); C.haptic(); C.render(); C.toast('Варианты обновлены'); },
    bioMore() { st().bioSeed = (st().bioSeed || 1) + 1; C.save(); C.haptic(); C.render(); C.toast('Новые формулировки'); },
    bioReg(el) { const f = st().bioForm, lines = (f.regs || '').split('\n').filter((x) => x.trim()); if (lines.length >= 3) { C.toast('Максимум 3 регалии'); return; } lines.push(el.dataset.v); f.regs = lines.join('\n'); C.save(); C.haptic(); C.render(); const ta = document.querySelector('textarea[data-in="bio:regs"]'); if (ta) { ta.focus(); const i = ta.value.lastIndexOf('…'); if (i >= 0) ta.setSelectionRange(i, i + 1); } },
    checkToggle(el) { const s = st(); s.check = s.check || {}; s.check[el.dataset.v] = !s.check[el.dataset.v]; C.save(); C.haptic(); C.render(); },
    checkReset() { st().check = {}; C.save(); C.render(); },
    goMini(el) { C.go(miniDone(el.dataset.t) ? 'miniRes' : 'mini', { t: el.dataset.t }); },
    miniAnswer(el) {
      const t = el.dataset.t, m = (st().mini = st().mini || {}), a = (m[t] = m[t] || []), i = a.findIndex((x) => x == null) >= 0 ? a.findIndex((x) => x == null) : a.length;
      const raw = el.dataset.v; a[i] = /^\d+$/.test(raw) ? +raw : raw; C.save(); C.haptic(); el.classList.add('on');
      setTimeout(() => { if (a.length >= MINI[t].q().length && a.every((x) => x != null)) { miniFinish(t); C.toast('Добавлено в код креатора'); C.go('miniRes', { t }, true); } else C.render(true); }, 140);
    },
    miniPrev(el) { const a = st().mini[el.dataset.t]; a.pop(); C.save(); C.render(true); },
    miniRestart(el) { const m = st().mini; m[el.dataset.t] = []; if (el.dataset.t === 'perc') m.percRes = null; if (el.dataset.t === 'chrono') m.chronoRes = null; if (el.dataset.t === 'color') m.colorRes = null; C.save(); C.go('mini', { t: el.dataset.t }, true); },
    copyText(el) { stats().copies++; C.save(); C.copy(el.dataset.v); },
  };
  function onInput(k, el) {
    if (k === 'nicheSearch') { st().ideaForm.niche = el.value; hookView = null; C.save(); renderNicheSuggest(el.value); return true; }
    if (k.startsWith('bio:')) { st().bioForm[k.slice(4)] = el.value; C.save(); return true; }
    return false;
  }
  function onChange(k) { if (k === 'nicheSearch' && ['hooks', 'month', 'bio', 'ideas', 'formats', 'highlights'].includes(C.routeName())) { setTimeout(() => C.render(), 0); return true; } return false; }

  return { screens, actions, onInput, onChange, nicheObj, nicheField, extrasTiles, rechargeCard, miniLines, profileDashboard, animateDash, signBadge, emblem, hookCard: (h) => hookCard(h, nicheObj() || NI.custom(''), true) };
};
