/*
 * Экран «Движок хуков» (система СТОП): от ниши или от сценария, параметры, команды
 * «Ещё 20», «Докрути», «Нравится», «Только 30+», «Голосом/Текстом», ИИ-режим по полному ТЗ.
 */
window.VektorHookLab = function (C) {
  const SP = window.VektorStop, SN = window.VektorSynth, NI = window.VektorNiches, AR = window.VektorArchetypes;
  const { esc, head } = C;
  const st = () => C.state;
  const S = () => (st().stop = st().stop || { mode: 'niche', delivery: 'voice', warmth: 'cold', strategy: 'auto', tone: 'neutral', format: null, only30: false, likes: {}, used: {}, script: '', useAi: true, seed: 1 });
  let view = null, busy = false, aiAvail = null, open = {};
  SN.aiStatus().then((x) => { aiAvail = x !== 'local'; if (C.routeName() === 'hooks') C.render(); }).catch(() => { aiAvail = false; });

  const keyOf = (N) => (S().mode === 'scenario' ? 'sc:' + (S().script || '').slice(0, 40) : 'n:' + N.key + (N.custom ? ':' + N.name : ''));
  const opts = () => { const s = S(); return { delivery: s.delivery, warmth: s.warmth, strategy: s.strategy, tone: s.tone, format: s.format, only30: s.only30, likes: s.likes, gender: s.gender || null }; };
  const lvl = (t) => SP.level(t);

  async function generate(more) {
    const s = S(), N = C.nicheObj(), scenario = s.mode === 'scenario';
    if (!scenario && !N) { C.toast('Сначала выбери нишу'); return; }
    if (scenario && SP.words(s.script || '') < 15) { C.toast('Вставь сценарий — хотя бы несколько предложений'); return; }
    const k = keyOf(N || NI.custom('')), used = new Set((s.used[k] || []));
    if (!more) used.clear();
    busy = true; C.render();
    let res = null, source = 'local';
    if (s.useAi && aiAvail && s.tone !== 'x18') {
      const likesText = Object.keys(s.likes || {}).length ? Object.entries(s.likes).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([f]) => (SP.F.find((x) => x.k === f) || {}).name).filter(Boolean).join(', ') : '';
      const prompt = (s.gender ? `Автор говорит от ${s.gender === 'f' ? 'женского' : 'мужского'} лица.\n` : '') + SP.aiPrompt(scenario ? 'scenario' : 'niche', Object.assign(opts(), { likesText }), N || NI.custom(''), s.script || '', N ? SP.mapOf(N) : null, [...used]);
      const text = await SN.complete(prompt, 3000).catch(() => null);
      res = SP.parseAi(text); if (res && res.items.length) source = 'ai'; else res = null;
    }
    if (!res) {
      s.seed = (s.seed || 1) + 1;
      if (scenario) { const A = SP.parseScenario(s.script); res = Object.assign(SP.scenarioHooks(A, N, Object.assign(opts(), { used, count: 20 })), { analysis: A }); }
      else { res = SP.batch(N, Object.assign(opts(), { used, count: 20, seed: s.seed * 7919 })); res.map = SP.mapOf(N); if (!res.items.length && more) { used.clear(); res = SP.batch(N, Object.assign(opts(), { used, count: 20, seed: s.seed * 7919 })); res.map = SP.mapOf(N); C.toast('База этой ниши пройдена — начинаем новый круг'); } }
    }
    if (s.gender && source === 'local') res.items = res.items.map((h) => Object.assign({}, h, { text: SP.genderize(h.text, s.gender) }));
    res.items.forEach((h) => used.add(h.text));
    s.used[k] = [...used].slice(-600);
    const st0 = st(); st0.stats = st0.stats || {}; st0.stats.hooks = (st0.stats.hooks || 0) + res.items.length;
    view = Object.assign(res, { key: k, source, N, round: more && view ? view.round + 1 : 1 });
    open = {}; busy = false; C.save(); C.render();
    const el = document.querySelector('.sh-list'); if (el && more) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function chips(key, map, cur) { return `<div class="chips">${Object.entries(map).map(([k, l]) => `<button type="button" class="chip ${cur === k ? 'on' : ''}" data-a="stopOpt" data-k="${key}" data-v="${k}">${esc(l)}</button>`).join('')}</div>`; }
  function hookRow(h, i) {
    const L = lvl(h.s.total), vars = open[h.id];
    return `<div class="sh">
      <div class="sh-n">${i + 1}</div>
      <div class="sh-b"><p class="sh-t">${esc(h.text)}</p>
        <div class="sh-meta"><span>${esc(h.formula)}</span>${h.trig && h.trig[0] ? `<span>· ${esc(h.trig.join(', '))}</span>` : ''}</div>
        <div class="stop"><span>С<b>${h.s.С}</b></span><span>Т<b>${h.s.Т}</b></span><span>О<b>${h.s.О}</b></span><span>П<b>${h.s.П}</b></span><em class="lv-${L[1]}">${h.s.total}/40 · ${L[0]}</em></div>
        ${h.why ? `<p class="sh-why">${esc(h.why)}</p>` : ''}
        <div class="sh-act"><button class="iconbtn" data-a="hookCopy" data-v="${esc(h.text)}" aria-label="Скопировать">⧉</button><button class="iconbtn ${st().stop.likes[h.f] ? 'liked' : ''}" data-a="stopLike" data-v="${esc(h.f)}" aria-label="Нравится">♥</button><button class="iconbtn" data-a="hookSave" data-v="${esc(h.text)}" data-f="expert" data-n="${esc(view && view.N ? (view.N.custom ? view.N.name : view.N.key) : '')}" aria-label="Сохранить">☆</button><button class="btn sm ghost" data-a="stopTweak" data-v="${esc(h.id)}">${vars ? 'Скрыть' : 'Докрути'}</button></div>
        ${vars ? `<div class="sh-vars">${vars.busy ? '<p class="dim">Докручиваю…</p>' : vars.list.map((v) => `<div class="sh-var"><small>${esc(v.kind)} · ${v.s.total}/40</small><p>${esc(v.text)}</p><button class="iconbtn" data-a="hookCopy" data-v="${esc(v.text)}" aria-label="Скопировать">⧉</button></div>`).join('')}</div>` : ''}
      </div></div>`;
  }
  function mapCard(m) {
    if (!m) return '';
    const g = (t, arr) => (arr && arr.length ? `<div class="am"><b>${t}</b>${arr.map((x) => `<span>${esc(x)}</span>`).join('')}</div>` : '');
    return `<details class="card amap" open><summary><span class="eyebrow">Карта аудитории</span></summary>${g('Боли', m.pains)}${g('Желания', m.wants)}${g('Страхи', m.fears)}${g('Мифы', m.myths)}${g('Возражения', m.objs || m.objections)}</details>`;
  }
  function analysisCard(A) {
    if (!A) return '';
    const row = (t, v) => (v ? `<p class="line"><b>${t}:</b> ${esc(Array.isArray(v) ? v.join(' · ') : v)}</p>` : '');
    return `<details class="card amap" open><summary><span class="eyebrow">Разбор сценария</span></summary>${row('Тема', A.topic)}${row('Главный инсайт', A.insight)}${row('Что получит зритель', A.gets)}${row('Цепляющие детали', (A.details || []).slice(0, 5))}${row('Цифры', (A.nums || []).map((n) => n.phrase))}${row('Главная эмоция', A.emotion)}${row('Целевой зритель', A.viewer)}</details>`;
  }

  const screens = {
    hooks() {
      const s = S(), N = C.nicheObj(), sc = s.mode === 'scenario';
      if (view && view.key !== keyOf(N || NI.custom(''))) view = null;
      const items = view ? (s.only30 ? view.items.filter((h) => h.s.total >= 30) : view.items) : [];
      return head('Мастерская', 'Движок хуков', 'Хук продаёт не продукт, а следующие 3 секунды. Каждый хук — с формулой, триггером и оценкой СТОП: Сейчас, Тайна, Обещание, Попадание (до 40 баллов, сильный — от 30).') + `<div class="stack-lg">
        <div class="seg"><button class="${!sc ? 'on' : ''}" data-a="stopOpt" data-k="mode" data-v="niche">От ниши</button><button class="${sc ? 'on' : ''}" data-a="stopOpt" data-k="mode" data-v="scenario">От сценария</button></div>
        <div class="card stack">${C.nicheField()}
          ${sc ? `<label class="f">Текст сценария<textarea data-in="stop:script" rows="7" placeholder="Вставь сценарий ролика целиком — хуки будут вести именно в него и использовать его цифры и повороты.">${esc(s.script || '')}</textarea></label>` : ''}
          <span class="dim">Подача</span>${chips('delivery', { voice: '🎙 Голосом в камеру', text: '🔤 Текстом на экране' }, s.delivery)}
          <details class="params"><summary>Параметры: ${esc(SP.WARM_NAMES[s.warmth])} · ${esc(SP.STRAT_NAMES[s.strategy])} · ${esc(SP.TONE_NAMES[s.tone])}${s.format ? ' · ' + esc(SP.FORMAT_NAMES[s.format]) : ''}</summary>
            <span class="dim">Прогрев аудитории</span>${chips('warmth', SP.WARM_NAMES, s.warmth)}
            <span class="dim">Эмоциональная стратегия</span>${chips('strategy', SP.STRAT_NAMES, s.strategy)}
            <span class="dim">Тон</span>${chips('tone', SP.TONE_NAMES, s.tone)}
            <span class="dim">Говорю от лица</span>${chips('gender', { '': 'Нейтрально «(а)»', f: 'Женского', m: 'Мужского' }, s.gender || '')}
            <span class="dim">Формат контента</span>${chips('format', Object.assign({ '': 'Любой' }, SP.FORMAT_NAMES), s.format || '')}
            ${s.tone === 'x18' ? '<p class="dim">Мат под звёздочками. Площадки могут снижать охват роликов с ненормативной лексикой.</p>' : ''}</details>
          ${aiAvail ? `<label class="tgl"><input type="checkbox" data-in="stop:ai" ${s.useAi ? 'checked' : ''}><span>ИИ по полному ТЗ «Движка хуков»</span></label>` : ''}
          <button class="btn" data-a="stopGen" ${busy ? 'disabled' : ''}>${busy ? 'Пишу хуки…' : view ? 'Сгенерировать заново' : sc ? 'Разобрать сценарий и дать 20 хуков' : 'Дать 20 хуков'}</button></div>
        ${view ? `${sc ? analysisCard(view.analysis) : mapCard(view.map)}
          <div class="row between"><span class="eyebrow">${items.length} ${C.plural(items.length, 'хук', 'хука', 'хуков')} · ${view.source === 'ai' ? 'ИИ по ТЗ' : 'шаблоны СТОП'}${view.round > 1 ? ` · партия ${view.round}` : ''}</span><label class="tgl sm"><input type="checkbox" data-in="stop:only30" ${s.only30 ? 'checked' : ''}><span>Только 30+</span></label></div>
          <div class="card sh-list">${items.length ? items.map(hookRow).join('') : '<p class="dim">Сильных хуков 30+ в этой партии нет — нажми «Ещё 20».</p>'}</div>
          ${view.top3 && view.top3.length ? `<div class="card accent stack"><span class="eyebrow">Топ-3</span>${view.top3.map((t, i) => `<p class="line"><b>№${t.n}.</b> ${esc(t.h ? t.h.text : '')}<br><span class="dim">${esc(t.reason || '')}</span></p>`).join('')}</div>` : ''}
          <div class="cmdbar"><button class="btn" data-a="stopMore">Ещё 20</button><button class="btn ghost" data-a="stopOpt" data-k="delivery" data-v="${s.delivery === 'voice' ? 'text' : 'voice'}">${s.delivery === 'voice' ? 'Текстом' : 'Голосом'}</button><button class="btn ghost" data-a="stopReset">${sc ? 'Новый сценарий' : 'Новая ниша'}</button></div>` : `<div class="card empty"><div class="ic">🎣</div><p>${sc ? 'Вставь сценарий — получишь разбор и 20 хуков, которые ведут именно в него.' : 'Выбери нишу — получишь карту аудитории и 20 хуков с оценкой СТОП.'}</p></div>`}
        <details class="card flat"><summary class="eyebrow">Как работает СТОП</summary><p class="line"><b>С — Сейчас:</b> почему смотреть немедленно.</p><p class="line"><b>Т — Тайна:</b> сила открытой петли и недосказанности.</p><p class="line"><b>О — Обещание:</b> понятно ли, что получит зритель.</p><p class="line"><b>П — Попадание:</b> узнаёт ли зритель себя.</p><p class="dim">До 22 — слабый, 22–29 — рабочий, 30+ — сильный. Хуки ниже 25 движок не выдаёт. Голосом — 10–22 слова живой речи, текстом — до 12 слов. Цифры в хуках — пример: подставь свои реальные.</p></details>
        <details class="card flat"><summary class="eyebrow">Визуал первой секунды и A/B-тест</summary><p class="line">• Начинай с движения или слова — в первом кадре действие или текст.</p><p class="line">• Лицо или руки крупным планом, резкий зум на ключевом слове.</p><p class="line">• Текст на экране с нулевого кадра — многие смотрят без звука.</p><p class="line">• Контраст фона и объекта — глаз цепляется за контраст быстрее, чем за смысл.</p><p class="line">• A/B: меняй одну переменную, минимум 1000 просмотров на вариант, главная метрика — процент досмотра. Утверждение обычно сильнее вопроса.</p></details>
        <details class="card flat"><summary class="eyebrow">20 формул и 20 триггеров</summary><p class="dim">${SP.F.map((f) => esc(f.name)).join(' · ')}</p><p class="dim">${Object.values(SP.TRIG).map(esc).join(' · ')}</p></details>
      </div>`;
    },
  };

  const actions = {
    stopOpt(el) {
      const s = S(), k = el.dataset.k; s[k] = el.dataset.v === '' ? null : el.dataset.v; C.save(); C.haptic();
      if (k === 'mode') { view = null; C.render(); return; }
      if (view && !busy) generate(false); else C.render();
    },
    stopGen() { generate(false); },
    stopMore() { generate(true); C.haptic('medium'); },
    stopReset() { const s = S(); if (s.mode === 'scenario') s.script = ''; else { st().ideaForm.niche = ''; } view = null; C.save(); C.render(); },
    stopLike(el) { const s = S(), f = el.dataset.v; s.likes[f] = (s.likes[f] || 0) + 1; C.save(); C.haptic(); C.toast('Учту вкус: следующие партии сместятся в эту сторону'); el.classList.add('liked'); },
    async stopTweak(el) {
      const id = el.dataset.v; if (open[id]) { delete open[id]; C.render(); return; }
      const h = view && view.items.find((x) => x.id === id); if (!h) return;
      const N = C.nicheObj() || NI.custom('');
      open[id] = { busy: true, list: [] }; C.render();
      let list = null;
      if (S().useAi && aiAvail) {
        const t = await SN.complete(`${window.VEKTOR_STOP_SPEC || ''}\n\nКоманда «Докрути». Хук: «${h.text}». Дай 3 варианта с сохранением идеи: один агрессивнее, один загадочнее, один максимально конкретный. Подача: ${S().delivery === 'text' ? 'текст на экране' : 'голосом'}. Ответь строго JSON: {"hooks":[{"text":"","formula":"Агрессивнее","S":0,"T":0,"O":0,"P":0,"why":""},{"text":"","formula":"Загадочнее",...},{"text":"","formula":"Максимально конкретно",...}]}`, 900).catch(() => null);
        const p = SP.parseAi(t); if (p && p.items.length) list = p.items.slice(0, 3).map((x) => ({ kind: x.formula, text: x.text, s: x.s }));
      }
      open[id] = { list: (list || SP.tweak(N, h, opts())).map((v) => Object.assign(v, { text: SP.genderize(v.text, S().gender) })) }; C.render();
    },
  };
  function onInput(k, el) {
    if (k === 'stop:script') { S().script = el.value; C.save(); return true; }
    if (k === 'stop:ai') { S().useAi = el.checked; C.save(); return true; }
    if (k === 'stop:only30') { S().only30 = el.checked; C.save(); C.render(); return true; }
    return false;
  }
  return { screens, actions, onInput, reset: () => { view = null; } };
};
