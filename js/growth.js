/*
 * Рост: «Страхи», «Тренажёр камеры», «Разминка речи», «Почему не залетело» (анкета + анализ видео + ИИ-разбор),
 * карточка «Мой код» для сторис, «Актуальные-воронки».
 * Подключается к app.js через контекст C, как js/studio.js.
 */
window.VektorGrowth = function (C) {
  const GD = window.VektorGrowthData, AR = window.VektorArchetypes, SN = window.VektorSynth, NI = window.VektorNiches, HK = window.VektorHooks, D = window.VektorData, CFG = window.VektorConfig;
  const { esc, G, head } = C;
  const st = () => C.state;
  const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
  const low = (s) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);
  const leadArch = () => (C.arch() ? C.arch().ranked[0] : null);
  const nicheObj = () => { const t = (st().ideaForm.niche || (st().profile && st().profile.niche) || '').trim(); return t ? NI.resolve(t) : null; };
  const tg = window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData ? window.Telegram.WebApp : null;
  const S = (k, def) => (st()[k] = st()[k] || def);

  /* ================= СТРАХИ ================= */
  function fearRank() {
    const q = (st().fears || {}).quiz || [];
    if (q.filter((x) => x != null).length < GD.FEARS.length) return null;
    return GD.FEARS.map((f, i) => ({ f, v: q[i] })).sort((a, b) => b.v - a.v);
  }
  function fearCardMini(f, v) {
    return `<button class="card tap fear-tile" data-a="go" data-v="fear" data-k="${f.key}"><span class="fi">${f.icon}</span><span class="t"><b>${esc(f.title)}</b><small>${esc(f.voice)}</small></span>${v != null ? `<span class="fv"><i style="width:${(v / 3) * 100}%"></i></span>` : '<span class="v muted">›</span>'}</button>`;
  }

  /* ================= ТРЕНАЖЁР ================= */
  const trainer = () => S('trainer', { start: null, done: {}, remind: { on: false, hour: 19 } });
  const trainerDayNow = () => { const t = trainer(); if (!t.start) return 0; return Math.min(GD.TRAINER.length - 1, Object.keys(t.done).length); };
  const IDB = {
    open() { return new Promise((res, rej) => { try { const r = indexedDB.open('vektor-clips', 1); r.onupgradeneeded = () => r.result.createObjectStore('clips'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); } catch (e) { rej(e); } }); },
    async put(k, v) { const db = await this.open(); return new Promise((res, rej) => { const tx = db.transaction('clips', 'readwrite'); tx.objectStore('clips').put(v, k); tx.oncomplete = () => res(true); tx.onerror = () => rej(tx.error); }); },
    async get(k) { const db = await this.open(); return new Promise((res) => { const rq = db.transaction('clips').objectStore('clips').get(k); rq.onsuccess = () => res(rq.result || null); rq.onerror = () => res(null); }); },
  };
  function fearChart() {
    const t = trainer(), pts = GD.TRAINER.map((_, i) => (t.done[i] && t.done[i].fear != null ? t.done[i].fear : null));
    const known = pts.map((v, i) => [i, v]).filter((x) => x[1] != null);
    if (known.length < 2) return '';
    const W = 300, H = 90, x = (i) => 10 + (i / (GD.TRAINER.length - 1)) * (W - 20), y = (v) => 10 + ((10 - v) / 9) * (H - 20);
    const d = known.map(([i, v], k) => `${k ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
    const first = known[0][1], last = known[known.length - 1][1];
    return `<div class="card stack"><div class="row between"><span class="eyebrow">Уровень страха по дням</span><span class="badge">${first} → ${last}</span></div>
      <svg viewBox="0 0 ${W} ${H}" class="fearline"><path d="${d}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="draw"/>${known.map(([i, v]) => `<circle cx="${x(i).toFixed(1)}" cy="${y(v).toFixed(1)}" r="3.2" fill="var(--accent)"/>`).join('')}</svg>
      <p class="dim">${last < first ? `Страх снизился на ${first - last} ${HK.plural(first - last, 'балл', 'балла', 'баллов')}. Так работает привыкание.` : 'Страх может прыгать — особенно в дни с новыми заданиями. Это нормально, главное — регулярность.'}</p></div>`;
  }

  /* ================= РАЗМИНКА РЕЧИ ================= */
  function warmSteps() {
    return GD.WARMUP.map((w) => {
      if (w.k === 'twist') { const all = GD.SPEECH.twisters.flatMap((g) => g.items); const t = all[(st().twistIdx || 0) % all.length]; return { t: 'Скороговорка', d: `«${t}» — 3 раза: медленно, обычно, быстро.`, sec: 45 }; }
      if (w.k === 'final') return w;
      return GD.SPEECH[w.k][w.i];
    });
  }
  let warmTimer = null;
  function warmTick() {
    const w = st().warm; if (!w || !w.run) return;
    const steps = warmSteps(), cur = steps[w.i];
    w.left = Math.max(0, w.left - 1);
    if (w.left <= 0) { C.haptic('medium'); if (w.i < steps.length - 1) { w.i++; w.left = steps[w.i].sec; } else { w.run = false; w.finished = true; clearInterval(warmTimer); warmTimer = null; C.toast('Разминка готова — можно снимать'); } C.render(); return; }
    const el = document.getElementById('warmLeft'); if (el) el.textContent = w.left; const ring = document.getElementById('warmRing'); if (ring) ring.style.setProperty('--p', 1 - w.left / cur.sec);
  }

  /* ================= ПОЧЕМУ НЕ ЗАЛЕТЕЛО ================= */
  const diag = () => S('diag', { a: {}, stats: {}, video: null, ai: null });
  function statsIssues(sx) {
    const n = (k) => { const v = parseFloat(String(sx[k] || '').replace(',', '.')); return isFinite(v) ? v : null; };
    const views = n('views'), out = [];
    if (n('hold3') != null && n('hold3') < GD.BENCH.hold3) out.push({ w: 9, z: 'stats', t: `Удержание на 3-й секунде ${n('hold3')}%`, fix: 'Больше трети зрителей уходят в самом начале — проблема в хуке и первом кадре. Перепиши хук ниже и начни с движения или крупного плана.' });
    if (n('avgPct') != null && n('avgPct') < GD.BENCH.avgPct) out.push({ w: 6, z: 'stats', t: `Досматривают в среднем ${n('avgPct')}% ролика`, fix: 'Ролик теряет внимание в середине. Сократи на треть и добавь поворот каждые 5–7 секунд.' });
    if (views && views > 0) {
      const r = (k) => (n(k) != null ? (n(k) / views) * 100 : null);
      if (r('saves') != null && r('saves') < GD.BENCH.saves) out.push({ w: 4, z: 'stats', t: `Сохранений ${r('saves').toFixed(2)}% от просмотров`, fix: 'Мало практической пользы. Дай список, шаги или шпаргалку и скажи: «Сохрани, чтобы не потерять».' });
      if (r('shares') != null && r('shares') < GD.BENCH.shares) out.push({ w: 3, z: 'stats', t: `Репостов ${r('shares').toFixed(2)}% от просмотров`, fix: 'Ролик не вызывает желания переслать. Добавь эмоцию или узнавание: «это про тебя», «отправь тому, кто…».' });
      if (r('follows') != null && r('follows') < GD.BENCH.follows) out.push({ w: 3, z: 'stats', t: `Подписок ${r('follows').toFixed(2)}% от просмотров`, fix: 'Человеку непонятно, зачем подписываться. Назови в конце, что будет дальше: «завтра покажу вторую часть».' });
    }
    return out;
  }
  function videoIssues(v) {
    if (!v) return [];
    const out = [], ar = v.h / v.w;
    if (ar < 1.6) out.push({ w: 8, z: 'tech', t: ar < 1 ? 'Горизонтальный ролик' : 'Квадратный или нестандартный формат', fix: 'Для Reels, Shorts и клипов нужен вертикальный формат 9:16 (1080×1920), иначе ролик теряет половину экрана.' });
    if (Math.min(v.w, v.h) < 720) out.push({ w: 3, z: 'tech', t: `Низкое разрешение ${v.w}×${v.h}`, fix: 'Снимай в 1080p или 4K и экспортируй в 1080×1920.' });
    if (v.dur > 60) out.push({ w: 5, z: 'mid', t: `Длина ${Math.round(v.dur)} с`, fix: 'Для охвата целься в 20–40 секунд. Длинный ролик держит только история с поворотами.' });
    if (v.luma < 70) out.push({ w: 6, z: 'tech', t: 'Тёмная картинка', fix: 'Средняя яркость кадра низкая. Встань лицом к окну или добавь лампу спереди.' });
    else if (v.luma > 205) out.push({ w: 3, z: 'tech', t: 'Пересвеченная картинка', fix: 'Зафиксируй экспозицию долгим нажатием на лицо и чуть убавь яркость.' });
    if (!v.motion3) out.push({ w: 5, z: 'hook', t: 'Статичное начало', fix: 'В первые 3 секунды кадр почти не меняется. Начни с движения: шаг в кадр, резкий наезд, жест, смена плана.' });
    if (v.dur > 10 && v.cutsPer10 < 1) out.push({ w: 5, z: 'mid', t: `Смена кадра реже раза в 10 секунд`, fix: 'Добавь перебивки: крупный план, руки, детали, текст на экране.' });
    if (v.longest > 8) out.push({ w: 4, z: 'mid', t: `Самый длинный план без изменений — ${Math.round(v.longest)} с`, fix: 'Разбей длинный план склейкой или наездом: кадр дольше 5–6 секунд без изменений теряет внимание.' });
    if (v.audio) {
      const a = v.audio;
      if (a.silent) out.push({ w: 3, z: 'tech', t: 'В ролике нет звука', fix: 'Даже без голоса добавь музыку или звуки процесса: тишина воспринимается как ошибка.' });
      else {
        if (a.onset > 0.8) out.push({ w: 7, z: 'hook', t: `Тишина в начале ${a.onset.toFixed(1)} с`, fix: 'Голос или звук должен начинаться с первого кадра. Обрежь паузу в начале.' });
        if (a.level < -30) out.push({ w: 6, z: 'tech', t: `Тихий звук (${Math.round(a.level)} дБ)`, fix: 'Подними громкость голоса до уровня около −14…−16 дБ или поднеси микрофон ближе.' });
        if (a.clip > 0.5) out.push({ w: 4, z: 'tech', t: 'Звук перегружен и хрипит', fix: 'Снизь громкость записи или отодвинь микрофон — пики упираются в максимум.' });
        if (a.pauses > 25) out.push({ w: 4, z: 'mid', t: `Паузы занимают ${Math.round(a.pauses)}% ролика`, fix: 'Вырежи паузы между фразами — темп должен быть плотным.' });
      }
    }
    return out;
  }
  function diagResult() {
    const d = diag(), list = [];
    GD.DIAG_Q.forEach((q) => { const i = d.a[q.k]; if (i != null && q.o[i] && q.o[i][1]) list.push(Object.assign({}, q.o[i][1])); });
    list.push(...statsIssues(d.stats), ...videoIssues(d.video));
    // одинаковые зоны: оставляем все, но сортируем по весу
    list.sort((a, b) => b.w - a.w);
    const answered = Object.keys(d.a).length + (d.video ? 4 : 0) + Object.values(d.stats).filter(Boolean).length;
    const score = Math.max(5, 100 - list.reduce((s, x) => s + x.w * 2.2, 0));
    return { list, score: Math.round(score), answered };
  }

  /** Анализ видео прямо на устройстве: формат, яркость, смена кадров, звук. Видео никуда не отправляется. */
  async function analyzeVideo(file, onProgress) {
    const url = URL.createObjectURL(file);
    const v = document.createElement('video'); v.muted = true; v.playsInline = true; v.preload = 'auto'; v.src = url;
    const once = (ev, ms) => new Promise((res, rej) => { const t = setTimeout(() => rej(new Error('timeout ' + ev)), ms || 8000); v.addEventListener(ev, () => { clearTimeout(t); res(); }, { once: true }); v.addEventListener('error', () => { clearTimeout(t); rej(new Error('video')); }, { once: true }); });
    await once('loadedmetadata', 15000);
    const dur = v.duration, w = v.videoWidth, h = v.videoHeight;
    if (!isFinite(dur) || !w) throw new Error('meta');
    const cw = 36, ch = Math.round(cw * (h / w)) || 64;
    const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch; const cx = cv.getContext('2d', { willReadFrequently: true });
    const big = document.createElement('canvas'); const bw = 360; big.width = bw; big.height = Math.round(bw * (h / w)); const bx = big.getContext('2d');
    const times = []; for (let t = 0.05; t < Math.min(3, dur); t += 0.5) times.push(t); for (let t = 3; t < dur - 0.05; t += Math.max(0.75, dur / 60)) times.push(t);
    const keyAt = [0.2, 1.5, 3, dur * 0.35, dur * 0.6, dur * 0.9].filter((t) => t < dur);
    let prev = null, lumaSum = 0, cuts = 0, motion3 = false, lastCut = 0, longest = 0; const frames = [];
    for (let k = 0; k < times.length; k++) {
      v.currentTime = times[k]; await once('seeked', 6000);
      cx.drawImage(v, 0, 0, cw, ch); const px = cx.getImageData(0, 0, cw, ch).data;
      let l = 0; const cur = new Float32Array(cw * ch);
      for (let i = 0, j = 0; i < px.length; i += 4, j++) { const y = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]; cur[j] = y; l += y; }
      lumaSum += l / cur.length;
      if (prev) { let diff = 0; for (let j = 0; j < cur.length; j++) diff += Math.abs(cur[j] - prev[j]); diff /= cur.length; if (diff > 26) { cuts++; longest = Math.max(longest, times[k] - lastCut); lastCut = times[k]; } if (times[k] <= 3.1 && diff > 5) motion3 = true; }
      prev = cur;
      if (onProgress) onProgress(Math.round((k / times.length) * 80));
    }
    longest = Math.max(longest, dur - lastCut);
    for (const t of keyAt) { v.currentTime = t; await once('seeked', 6000); bx.drawImage(v, 0, 0, big.width, big.height); frames.push(big.toDataURL('image/jpeg', 0.7)); }
    URL.revokeObjectURL(url);
    let audio = null;
    if (file.size < 90 * 1024 * 1024) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext; const ac = new AC();
        const buf = await new Promise((res, rej) => { file.arrayBuffer().then((ab) => { const p = ac.decodeAudioData(ab, res, rej); if (p && p.then) p.then(res, rej); }, rej); });
        audio = audioStats(buf); try { ac.close(); } catch (e) {}
      } catch (e) { audio = null; }
    }
    if (onProgress) onProgress(100);
    return { dur, w, h, luma: lumaSum / times.length, cuts, cutsPer10: (cuts / dur) * 10, motion3, longest, audio, frames, name: file.name, size: file.size };
  }
  function audioStats(buf) {
    const data = buf.getChannelData(0), sr = buf.sampleRate, win = Math.round(sr * 0.05), lv = [];
    let clipN = 0;
    for (let i = 0; i + win <= data.length; i += win) { let s = 0; for (let j = i; j < i + win; j++) { const x = data[j]; s += x * x; if (Math.abs(x) > 0.985) clipN++; } lv.push(10 * Math.log10(s / win + 1e-12)); }
    const loud = lv.filter((x) => x > -45);
    if (!loud.length) return { silent: true };
    const sorted = loud.slice().sort((a, b) => a - b), median = sorted[Math.floor(sorted.length / 2)];
    const onsetIdx = lv.findIndex((x) => x > Math.min(-40, median - 8));
    return { silent: false, onset: onsetIdx < 0 ? 0 : (onsetIdx * win) / sr, level: median, clip: (clipN / data.length) * 100, pauses: (lv.filter((x) => x < median - 20).length / lv.length) * 100 };
  }
  let diagBusy = null;

  /* ================= КАРТОЧКА «МОЙ КОД» ================= */
  const EL_PAL = { fire: ['#FF5A36', '#FFB547', '#2A0F0A'], earth: ['#5E7F4F', '#D8C38E', '#14160E'], air: ['#4F8DFF', '#BFE3FF', '#0B1424'], water: ['#4B4BFF', '#9AA8FF', '#0C0B24'] };
  /** Три короткие строки кода: каким быть, как снимать, что снимать (до ~44 знаков каждая). */
  function cardRules(p, lead) {
    const cut = (t, n) => { const parts = String(t || '').replace(/[.;]+$/, '').split(/,\s*/); let out = ''; for (const x of parts) { const nx = out ? out + ', ' + x : x; if (nx.length > n && out) break; out = nx; } return out.length > n + 8 ? out.slice(0, n).replace(/\s\S*$/, '') + '…' : out; };
    const A = lead ? AR.A[lead] : null, f = SN.rankFormats(p);
    const r = [];
    if (A) r.push({ i: '◉', k: 'Каким быть', v: cut(A.inFrame.split('.')[0], 40) });
    else if (p.chart) r.push({ i: '◉', k: 'Каким быть', v: cut(D.SIGNS[p.chart.asc ? p.chart.asc.sign : p.chart.planets.sun.sign].show, 40) });
    if (A) r.push({ i: '✦', k: 'Как снимать', v: cut(A.shoot.split('.')[0], 40) });
    if (f && f.length) r.push({ i: '▶', k: 'Что снимать', v: `${f[0].name}, ${f[1].name.toLowerCase()}` });
    return r.slice(0, 3);
  }
  function cardData() {
    const p = C.P(), a = C.arch(), ch = C.chart(), num = C.num(), hd = C.hd();
    const lead = a ? a.ranked[0] : null, PP = lead ? window.VektorPassports[lead] || {} : {};
    const si = ch ? ch.planets.sun.sign : st().demoSign;
    const sign = si != null ? D.SIGNS[si] : null;
    const el = sign ? sign.element : 'fire';
    return {
      name: C.userName() || 'Креатор', el, pal: EL_PAL[el],
      arch: lead ? AR.A[lead].name : null, archGlyph: lead ? AR.A[lead].glyph : '✦', tagline: PP.tagline || (lead ? AR.A[lead].motto : ''),
      second: a ? a.ranked.slice(1, 3).map((k) => AR.A[k].name) : [],
      sign: sign ? sign.name : null, signGlyph: sign ? sign.glyph : '', element: sign ? D.ELEMENTS[el].name : null,
      life: num ? num.life : null, hd: hd ? `${window.VektorSystems.HD_TYPES[hd.type].name} ${hd.profile}` : null,
      rules: cardRules(p, lead),
    };
  }
  function cardHtml(d) {
    return `<div class="mycard el-${d.el}" style="--c1:${d.pal[0]};--c2:${d.pal[1]};--c3:${d.pal[2]}">
      <div class="mc-bg"></div>
      <div class="mc-spark">${Array.from({ length: 14 }, (_, i) => `<i style="--i:${i}"></i>`).join('')}</div>
      <div class="mc-top"><span>КОД КРЕАТОРА</span><span>${esc(CFG.appName)}</span></div>
      <div class="mc-hero"><div class="mc-ring"></div><div class="mc-ring r2"></div><div class="mc-glyph">${G(d.archGlyph)}</div>
        ${[d.sign && G(d.signGlyph), d.life, d.hd && '⬡'].filter(Boolean).map((x, i) => `<span class="mc-orb" style="--a:${-90 + i * 120}deg">${x}</span>`).join('')}</div>
      <div class="mc-id"><div class="mc-name">${esc(d.name)}</div>
      ${d.arch ? `<div class="mc-arch">${esc(d.arch)}</div><div class="mc-tag">${esc(d.tagline)}</div>` : '<div class="mc-tag">Пройди тест архетипов — и здесь появится твой ведущий архетип</div>'}</div>
      ${d.rules.length ? `<div class="mc-rules">${d.rules.map((r, i) => `<div style="--d:${0.3 + i * 0.15}s"><i>${r.i}</i><span><small>${esc(r.k)}</small>${esc(r.v)}</span></div>`).join('')}</div>` : ''}
      <div class="mc-chips">${[d.sign && `${G(d.signGlyph)} ${d.sign}`, d.element, d.life && `Путь ${d.life}`, d.hd].filter(Boolean).map((x) => `<span>${esc(x)}</span>`).join('')}</div>
      <div class="mc-foot">${d.second.length ? `<small>+ ${esc(d.second.join(' · '))}</small>` : ''}А какой код у тебя?</div></div>`;
  }
  /** Один кадр карточки 1080×1920 на момент t (секунды). t ≥ 3 — финальная статичная картинка. */
  function drawFrame(x, d, t) {
    const W = 1080, H = 1920, cyc = 520, R = 230, ease = (v) => 1 - Math.pow(1 - Math.max(0, Math.min(1, v)), 3);
    const fade = (from) => ease((t - from) / 0.6), fin = t >= 3;
    x.globalAlpha = 1; x.setLineDash([]); x.textBaseline = 'alphabetic';
    const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, d.pal[2]); g.addColorStop(0.55, '#090C18'); g.addColorStop(1, d.pal[2]); x.fillStyle = g; x.fillRect(0, 0, W, H);
    const pulse = fin ? 1 : 0.92 + 0.08 * Math.sin(t * 2.2);
    const rg = x.createRadialGradient(W / 2, cyc, 30, W / 2, cyc, 520 * pulse); rg.addColorStop(0, d.pal[0] + 'cc'); rg.addColorStop(0.5, d.pal[0] + '30'); rg.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = rg; x.fillRect(0, 0, W, H);
    const rg2 = x.createRadialGradient(150, H - 200, 10, 150, H - 200, 520); rg2.addColorStop(0, d.pal[1] + '33'); rg2.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = rg2; x.fillRect(0, 0, W, H);
    const rot = fin ? 0.6 : t * 0.5;
    x.strokeStyle = d.pal[1] + '99'; x.lineWidth = 3; x.beginPath(); x.arc(W / 2, cyc, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (fin ? 1 : ease(t / 1.2))); x.stroke();
    x.save(); x.translate(W / 2, cyc); x.rotate(-rot * 0.6); x.setLineDash([4, 18]); x.strokeStyle = d.pal[1] + '66'; x.beginPath(); x.arc(0, 0, R + 80, 0, Math.PI * 2); x.stroke(); x.setLineDash([]);
    for (let i = 0; i < 30; i++) { const a2 = (i / 30) * Math.PI * 2, r = R + 70 + ((i * 37) % 40); x.fillStyle = d.pal[1] + (i % 3 ? '44' : '99'); x.beginPath(); x.arc(Math.cos(a2) * r, Math.sin(a2) * r, i % 4 ? 2.5 : 4, 0, Math.PI * 2); x.fill(); }
    x.restore();
    if (!fin) for (let i = 0; i < 18; i++) { const ph = ((t * 0.18 + i / 18) % 1), px = 80 + ((i * 211) % 920), py = H - ph * (H + 100); x.globalAlpha = Math.sin(ph * Math.PI) * 0.7; x.fillStyle = d.pal[1]; x.beginPath(); x.arc(px, py, 3 + (i % 3), 0, Math.PI * 2); x.fill(); }
    x.globalAlpha = 1; x.textAlign = 'center';
    x.fillStyle = '#ffffffaa'; x.font = '600 32px Manrope, sans-serif'; x.fillText('КОД КРЕАТОРА · ' + CFG.appName.toUpperCase().replace(/\?$/, ''), W / 2, 120);
    // символ архетипа — в центре круга
    x.globalAlpha = fade(0.1); x.fillStyle = d.pal[1]; x.font = '700 210px Unbounded, serif'; x.textBaseline = 'middle'; x.fillText(d.archGlyph, W / 2, cyc + (fin ? 0 : Math.sin(t * 2) * 8)); x.textBaseline = 'alphabetic';
    // значки на орбите: знак, число, Дизайн человека
    const orbs = [d.signGlyph && d.signGlyph + '\uFE0E', d.life, d.hd && '⬡'].filter(Boolean);
    orbs.forEach((o, i) => { const an = -Math.PI / 2 + rot + (i * Math.PI * 2) / 3; const ox = W / 2 + Math.cos(an) * R, oy = cyc + Math.sin(an) * R; x.globalAlpha = fade(0.5 + i * 0.1); x.fillStyle = '#141A2E'; x.beginPath(); x.arc(ox, oy, 46, 0, Math.PI * 2); x.fill(); x.strokeStyle = d.pal[1]; x.lineWidth = 3; x.stroke(); x.fillStyle = d.pal[1]; x.font = '700 44px Unbounded, sans-serif'; x.textBaseline = 'middle'; x.fillText(String(o), ox, oy + 2); x.textBaseline = 'alphabetic'; });
    const wrap = (txt, y, font, color, maxW, lh, align, x0) => { x.font = font; x.fillStyle = color; x.textAlign = align || 'center'; const words = txt.split(' '); let line = '', yy = y; const X = x0 != null ? x0 : W / 2; for (const w of words) { const test = line ? line + ' ' + w : w; if (x.measureText(test).width > maxW && line) { x.fillText(line, X, yy); line = w; yy += lh; } else line = test; } if (line) x.fillText(line, X, yy); x.textAlign = 'center'; return yy; };
    let y = cyc + R + 150;
    x.globalAlpha = fade(0.4); x.fillStyle = '#fff'; x.font = '700 60px Unbounded, sans-serif'; x.fillText(d.name.slice(0, 22), W / 2, y);
    if (d.arch) {
      x.globalAlpha = fade(0.8); const sc = fin ? 1 : 0.9 + 0.1 * fade(0.8);
      x.save(); x.translate(W / 2, y + 105); x.scale(sc, sc); x.fillStyle = d.pal[1]; x.font = '700 96px Unbounded, sans-serif'; x.fillText(d.arch.toUpperCase(), 0, 0); x.restore();
      x.globalAlpha = fade(1.1); y = wrap('«' + d.tagline + '»', y + 175, '500 38px Manrope, sans-serif', '#ffffffcc', 860, 50);
      if (d.second.length) { x.globalAlpha = fade(1.2); x.fillStyle = '#ffffff88'; x.font = '500 30px Manrope, sans-serif'; x.fillText('+ ' + d.second.join(' · '), W / 2, y + 52); y += 40; }
    }
    // три строки кода
    y += 60;
    d.rules.forEach((r, i) => {
      x.globalAlpha = fade(1.3 + i * 0.15); const bx = 90, bw = W - 180, bh = 128;
      x.fillStyle = '#ffffff12'; roundRect(x, bx, y, bw, bh, 28); x.fill(); x.strokeStyle = d.pal[1] + '33'; x.lineWidth = 2; x.stroke();
      x.fillStyle = d.pal[1] + '33'; x.beginPath(); x.arc(bx + 66, y + bh / 2, 36, 0, Math.PI * 2); x.fill();
      x.fillStyle = d.pal[1]; x.font = '700 36px Unbounded, sans-serif'; x.textBaseline = 'middle'; x.fillText(r.i, bx + 66, y + bh / 2 + 2); x.textBaseline = 'alphabetic';
      x.textAlign = 'left'; x.fillStyle = d.pal[1]; x.font = '700 26px Manrope, sans-serif'; x.fillText(r.k.toUpperCase(), bx + 126, y + 48);
      x.fillStyle = '#fff'; x.font = '600 34px Manrope, sans-serif'; let v = r.v; while (x.measureText(v).width > bw - 160 && v.length > 4) v = v.slice(0, -2).replace(/\s*\S*$/, '') + '…'; x.fillText(v, bx + 126, y + 94); x.textAlign = 'center';
      y += bh + 22;
    });
    const chips = [d.sign, d.element, d.life && 'Путь ' + d.life, d.hd].filter(Boolean);
    x.font = '600 34px Manrope, sans-serif'; let cy2 = y + 70, row = [], rw = 0; const rows = [];
    chips.forEach((c) => { const w = x.measureText(c).width + 60; if (rw + w > 940 && row.length) { rows.push([row, rw]); row = []; rw = 0; } row.push([c, w]); rw += w + 16; });
    if (row.length) rows.push([row, rw]);
    let k = 0;
    rows.forEach(([r, total]) => { let cx0 = (W - total + 16) / 2; r.forEach(([c, w]) => { x.globalAlpha = fade(1.8 + k++ * 0.1); x.fillStyle = '#ffffff1f'; roundRect(x, cx0, cy2 - 46, w, 68, 34); x.fill(); x.fillStyle = '#fff'; x.font = '600 34px Manrope, sans-serif'; x.fillText(c, cx0 + w / 2, cy2); cx0 += w + 16; }); cy2 += 86; });
    x.globalAlpha = fade(2.2); x.fillStyle = d.pal[1]; x.font = '700 44px Unbounded, sans-serif'; x.fillText('А какой код у тебя?', W / 2, H - 140);
    x.fillStyle = '#ffffff88'; x.font = '500 30px Manrope, sans-serif'; x.fillText((CFG.botUrl || '').replace(/^https?:\/\//, ''), W / 2, H - 86);
    x.globalAlpha = 1;
  }
  async function fontsReady() { try { if (document.fonts && document.fonts.load) await Promise.all([document.fonts.load('700 80px Unbounded'), document.fonts.load('600 40px Manrope')]); } catch (e) {} }
  /** PNG 1080×1920 для сторис. */
  async function cardPng(d) {
    await fontsReady();
    const c = document.createElement('canvas'); c.width = 1080; c.height = 1920; drawFrame(c.getContext('2d'), d, 99);
    return c.toDataURL('image/png');
  }
  /** Моушн-видео 6 секунд для сторис: появление текста, вращение колец, частицы. mp4, если устройство умеет, иначе webm. */
  async function cardVideo(d, onProgress) {
    await fontsReady();
    if (!window.MediaRecorder) throw new Error('no recorder');
    const c = document.createElement('canvas'); c.width = 720; c.height = 1280; const x = c.getContext('2d'); x.scale(720 / 1080, 1280 / 1920);
    const type = ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm'].find((t) => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t));
    if (!type) throw new Error('no type');
    const stream = c.captureStream(30), rec = new MediaRecorder(stream, { mimeType: type, videoBitsPerSecond: 6e6 }), chunks = [];
    rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
    const done = new Promise((res) => { rec.onstop = res; });
    const DUR = 6; drawFrame(x, d, 0); rec.start(250);
    const t0 = performance.now();
    await new Promise((res) => { const step = () => { const t = (performance.now() - t0) / 1000; drawFrame(x, d, Math.min(t, 2.99)); if (onProgress) onProgress(Math.min(100, Math.round((t / DUR) * 100))); if (t < DUR) requestAnimationFrame(step); else res(); }; requestAnimationFrame(step); });
    rec.stop(); await done;
    const blob = new Blob(chunks, { type: type.split(';')[0] });
    return { blob, ext: type.includes('mp4') ? 'mp4' : 'webm' };
  }
  function roundRect(x, X, Y, w, h, r) { x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r); x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath(); }

  /* ================= АКТУАЛЬНЫЕ ================= */
  const hl = () => S('hl', { pain: 0, len: 7, magnet: 'guide', code: 'ГАЙД' });
  const PREP = new Set(['в', 'на', 'с', 'к', 'по', 'от', 'до', 'за', 'из', 'у', 'о', 'и', 'не', 'а', 'но', 'для', 'без', 'при', 'под', 'над', 'через']);
  /** Название актуального до 15 знаков: готовое из js/hl-titles.js, для своей ниши — начало боли по целым словам. */
  function hlTitleFor(N, i) { const T = (window.VEKTOR_HL_TITLES || {})[N.key]; const t = T && T.split('|')[i]; return t || hlTitle(N.pain[i]); }
  function hlTitle(pain) {
    const words = pain.replace(/[«»,]/g, '').split(' ');
    let ws = [];
    for (const w of words) { if ((ws.concat(w).join(' ')).length > 14) break; ws.push(w); }
    if (!ws.length) ws = [words[0].slice(0, 13)];
    while (ws.length > 1 && PREP.has(ws[ws.length - 1])) ws.pop();
    return cap(ws.join(' ')) + '?';
  }
  function buildHighlight(N, painIdx, len, magnetKey, code, archKey) {
    const r = C.rng((painIdx + 1) * 97 + len * 13 + (st().hlSeed || 1) * 7);
    const pick = (a) => a[Math.floor(r() * a.length)];
    const pain = N.pain[painIdx % N.pain.length];
    const want = N.want[painIdx % N.want.length], err = N.err[painIdx % N.err.length], myth = N.myth[painIdx % N.myth.length], res = N.res[painIdx % N.res.length];
    const mg = GD.MAGNETS[magnetKey] || GD.MAGNETS.guide, magnet = mg.make(want), kw = (code || 'ГАЙД').toUpperCase();
    const voice = archKey && window.VektorPassports[archKey] ? AR.A[archKey].name : null;
    const S2 = {
      pain: () => ({ text: `Знакомо: ${pain}?`, show: 'Крупный план лица или руки в процессе, живой кадр без заставки. Текст крупно сверху.', sticker: 'Стикер-реакция или опрос «Да, это про меня / Нет»' }),
      poll: () => ({ text: `Как давно это с тобой: ${pain}?`, show: 'Фон из твоего рабочего места, текст по центру.', sticker: 'Опрос: «Неделю / Месяц / Давно и бесит»' }),
      agitate: () => ({ text: pick([`И чем дольше это тянется, тем сложнее ${want}`, 'Кажется, что дело в тебе. Это не так', 'Ты пробуешь одно, другое — а результат тот же']), show: 'Кадр-«боль»: то, как это выглядит в жизни у клиента.', sticker: 'Шкала-эмодзи «Насколько бесит?»' }),
      cause: () => ({ text: `Чаще всего причина одна: ${err}`, show: 'Покажи ошибку наглядно: «так делают» → крестик.', sticker: 'Викторина: «Как думаешь, в чём причина?» с 3 вариантами' }),
      myth: () => ({ text: `А ещё мешает миф: «${myth}». Это не так`, show: 'Ты в кадре, жест «стоп» или зачёркнутый текст мифа.', sticker: 'Опрос «Ты тоже так думал(а)?»' }),
      who: () => ({ text: `Почему мне можно верить: [твой опыт в цифрах — годы, клиенты, результат]`, show: 'Ты за работой + цифры текстом. Без «я эксперт» — только факты.', sticker: '—' }),
      tip: () => ({ text: `Что поможет ${want}: [твой главный совет в одной фразе]`, show: 'Показываешь решение руками или на примере.', sticker: 'Стикер «Сохрани»: попроси сделать скриншот' }),
      step: () => ({ text: `Шаг 1 — сделай сегодня: [простое действие на 5 минут]`, show: 'Пошаговый кадр: до и после одного действия.', sticker: 'Стикер-вопрос «Получилось? Напиши»' }),
      proof: () => ({ text: `Результат клиента: ${res}`, show: 'Фото или видео «до/после», скрин отзыва (с разрешения клиента).', sticker: 'Реакция «🔥»' }),
      objection: () => ({ text: pick(['«У меня не получится» — получится, если идти по шагам', '«Нет времени» — нужно 10 минут в день', '«Это не для меня» — подходит даже новичкам']), show: 'Ты в кадре, спокойный тон, смотришь в объектив.', sticker: 'Стикер-вопрос «Что тебя останавливает?»' }),
      magnet: () => ({ text: `Забирай бесплатно ${magnet}. Напиши «${kw}» в директ`, show: 'Обложка лид-магнита или его страницы листаются в кадре.', sticker: `Ссылка или стикер «Напиши ${kw}»` }),
      cta: () => ({ text: `Пока не забыл(а): напиши «${kw}» — пришлю ${magnetKey === 'discount' || magnetKey === 'review' ? magnet : 'материал'} сегодня`, show: 'Ты с телефоном в руке, улыбка, указываешь вниз на стикер.', sticker: `Ссылка «Забрать»` }),
    };
    const flow = GD.HL_FLOW[len] || GD.HL_FLOW[7];
    const custom = ((st().hl || {}).titles || {})[painIdx];
    return { title: custom || hlTitleFor(N, painIdx % N.pain.length), pain, magnet, kw, voice, stories: flow.map((role, i) => Object.assign({ n: i + 1, role, roleName: GD.HL_ROLE[role] }, S2[role]())) };
  }
  const HL_COVER = ['✦', '◐', '✚', '☾', '▲', '◆', '✿', '❖'];

  /* ================= ЭКРАНЫ ================= */
  const screens = {
    fears() {
      const R = fearRank(), k = leadArch();
      return head('Снимать без страха', 'Что тебя держит?', 'Десять самых частых страхов тех, кто начинает вести блог. Найди свой — внутри объяснение, откуда он, и что сделать уже сегодня.') + `<div class="stack-lg">
        ${R ? `<div class="card accent stack"><span class="eyebrow">Твой главный страх</span><h2>${R[0].f.icon} ${esc(R[0].f.title)}</h2><p class="muted">${esc(R[0].f.why.split('. ')[0])}.</p><button class="btn sm" data-a="go" data-v="fear" data-k="${R[0].f.key}" style="align-self:flex-start">Разобрать →</button></div>` :
          `<div class="card accent stack"><span class="eyebrow">Тест на 1 минуту</span><h2>Какой страх главный именно у тебя?</h2><p class="muted">10 утверждений — отметь, насколько каждое про тебя. Получишь свой порядок проработки.</p><button class="btn sm" data-a="fearQuizStart" style="align-self:flex-start">Пройти</button></div>`}
        ${k ? `<div class="card stack"><span class="eyebrow">Твой способ · ${esc(AR.A[k].name)}</span><p>${esc(GD.ARCH_FEAR[k])}</p></div>` : ''}
        <div class="stack">${(R ? R.map((x) => fearCardMini(x.f, x.v)) : GD.FEARS.map((f) => fearCardMini(f))).join('')}</div>
        ${R ? '<button class="btn ghost" data-a="fearQuizStart">Пройти тест заново</button>' : ''}
        <div class="card flat stack"><span class="eyebrow">Практика лучше теории</span><p class="dim">Страх камеры уходит не от чтения, а от дозированной практики. Начни «Тренажёр камеры» — 21 день по 5–10 минут.</p><button class="btn sm soft" data-a="go" data-v="trainer" style="align-self:flex-start">Открыть тренажёр</button></div></div>`;
    },
    fearQuiz() {
      const f = (st().fears = st().fears || {}), q = (f.quiz = f.quiz || []);
      const i = q.findIndex((x) => x == null) >= 0 ? q.findIndex((x) => x == null) : q.length;
      if (i >= GD.FEARS.length) return screens.fears();
      const F = GD.FEARS[i];
      return `<div class="row between" style="margin-bottom:14px"><button class="linkbtn" data-a="back" style="text-decoration:none">✕ Выйти</button><span class="dim">${i + 1} / ${GD.FEARS.length}</span></div>
        <div class="progress" style="margin-bottom:24px"><i style="width:${(i / GD.FEARS.length) * 100}%;background:var(--accent)"></i></div>
        <span class="eyebrow">Насколько это про тебя?</span><h1 class="q" style="min-height:0;margin-bottom:18px">${esc(F.q)}</h1>
        <div class="stack">${[['Совсем не про меня', 0], ['Иногда', 1], ['Часто', 2], ['Это точно я', 3]].map(([t, v]) => `<button class="card tap fc" data-a="fearAnswer" data-v="${v}">${t}</button>`).join('')}</div>
        ${i > 0 ? '<button class="btn sm ghost" data-a="fearPrev" style="margin-top:18px">← Назад</button>' : ''}`;
    },
    fear({ k }) {
      const F = GD.FEARS.find((x) => x.key === k) || GD.FEARS[0], a = leadArch();
      return head(`${F.icon} Страх`, esc(F.title), '') + `<div class="stack-lg">
        <div class="card fear-voice"><p>${esc(F.voice)}</p></div>
        <div class="card stack"><span class="eyebrow">Узнаёшь себя?</span>${F.signs.map((x) => `<p class="line">• ${esc(x)}</p>`).join('')}</div>
        <div class="card stack"><span class="eyebrow">Откуда он берётся</span><p>${esc(F.why)}</p></div>
        <div class="card stack"><span class="eyebrow">Как на самом деле</span>${F.truth.map((x) => `<p class="line">✓ ${esc(x)}</p>`).join('')}</div>
        <div class="card stack"><span class="eyebrow">Что делать</span><ol class="steps">${F.steps.map((x) => `<li>${esc(x)}</li>`).join('')}</ol></div>
        ${a ? `<div class="card stack"><span class="eyebrow">Под твой архетип · ${esc(AR.A[a].name)}</span><p>${esc(GD.ARCH_FEAR[a])}</p></div>` : ''}
        <div class="card accent stack"><span class="eyebrow">Сделай прямо сейчас</span><p>${esc(F.practice)}</p></div>
        <div class="card stack"><span class="eyebrow">Преврати страх в контент</span><p>${esc(F.reel)}</p></div>
        <button class="btn" data-a="go" data-v="trainerDay" data-d="${F.day - 1}">Задание тренажёра под этот страх — день ${F.day}</button>
        <button class="btn ghost" data-a="go" data-v="fears">Все страхи</button></div>`;
    },

    trainer() {
      const t = trainer(), done = Object.keys(t.done).length, now = trainerDayNow();
      return head('Снимать без страха', 'Тренажёр «Не боюсь камеры»', '21 день по 5–10 минут: от голосового самому себе до ролика в людном месте. Нагрузка растёт постепенно — страх уходит без насилия над собой.') + `<div class="stack-lg">
        <div class="card stack"><div class="row between"><b>Пройдено ${done} из 21</b><span class="dim">${Math.round((done / 21) * 100)}%</span></div><div class="progress"><i style="width:${(done / 21) * 100}%"></i></div>
          <button class="btn" data-a="go" data-v="trainerDay" data-d="${now}">${t.start ? (done >= 21 ? 'Тренажёр пройден — посмотреть итог' : `Задание дня ${now + 1}: ${esc(GD.TRAINER[now].t)}`) : 'Начать с дня 1'}</button></div>
        ${fearChart()}
        ${remindCard()}
        <div class="card"><span class="eyebrow">Все дни</span>${GD.TRAINER.map((d, i) => `<div class="todo ${t.done[i] ? 'done' : ''}" data-a="go" data-v="trainerDay" data-d="${i}"><span class="box">${t.done[i] ? '✓' : i + 1}</span><div><div class="day">День ${i + 1} · ${'●'.repeat(d.lvl)}${'○'.repeat(5 - d.lvl)}</div><div class="tx">${esc(d.t)}</div></div></div>`).join('')}</div>
        <button class="btn soft" data-a="go" data-v="speech">Разминка речи перед записью</button></div>`;
    },
    trainerDay({ d }) {
      const i = Math.max(0, Math.min(20, +d || 0)), T = GD.TRAINER[i], t = trainer(), rec = t.done[i];
      const isVoice = i < 2, needsRec = T.sec > 0;
      return head(`Тренажёр · день ${i + 1} из 21`, esc(T.t), `Сложность ${'●'.repeat(T.lvl)}${'○'.repeat(5 - T.lvl)}${T.sec ? ` · до ${T.sec} с` : ''}`) + `<div class="stack-lg">
        <div class="card accent stack"><span class="eyebrow">Задание</span><p style="font-size:17px">${esc(T.task)}</p><p class="dim">${esc(T.why)}</p></div>
        ${T.lvl >= 3 ? `<button class="btn soft" data-a="go" data-v="warmup">Сначала разминка речи — 5 минут</button>` : ''}
        ${needsRec ? `<div class="card stack"><span class="eyebrow">${isVoice ? 'Запиши голосовое' : 'Запиши видео'}</span>
          ${isVoice ? '<p class="dim">Запиши голосовое в «Избранное» в Telegram или в диктофон — и отметь день выполненным.</p>' : `<label class="btn ghost filebtn">🎥 Открыть камеру<input type="file" accept="video/*" capture="user" data-in="trainerClip" data-d="${i}" hidden></label><p class="dim">Видео остаётся только на твоём телефоне.${T.keep ? ' Это видео сохраним для сравнения «до и после».' : ''}</p>`}
          <div id="clipBox"></div></div>` : ''}
        ${i === 20 ? '<div class="card stack"><span class="eyebrow">До и после</span><div class="grid2" id="beforeAfter"><div class="ba" data-k="4"><small>День 5</small></div><div class="ba" data-k="20"><small>День 21</small></div></div><p class="dim">Сравни, как изменились голос, взгляд и темп.</p></div>' : ''}
        <div class="card stack"><span class="eyebrow">Насколько было страшно? ${rec && rec.fear != null ? `· ${rec.fear}/10` : ''}</span>
          <div class="scale10">${Array.from({ length: 10 }, (_, k) => `<button class="${rec && rec.fear === k + 1 ? 'on' : ''}" data-a="trainerFear" data-d="${i}" data-v="${k + 1}">${k + 1}</button>`).join('')}</div>
          <p class="dim">1 — спокойно, 10 — очень страшно. Из оценок строится график.</p></div>
        <button class="btn" data-a="trainerDone" data-d="${i}">${rec ? 'Выполнено ✓' : 'Отметить выполненным'}</button>
        <div class="row between">${i > 0 ? `<button class="btn sm ghost" data-a="go" data-v="trainerDay" data-d="${i - 1}">← День ${i}</button>` : '<span></span>'}${i < 20 ? `<button class="btn sm ghost" data-a="go" data-v="trainerDay" data-d="${i + 1}">День ${i + 2} →</button>` : ''}</div></div>`;
    },

    speech() {
      const Sp = GD.SPEECH, tw = Sp.twisters, ti = st().twistIdx || 0, mi = st().twistMode || 0, all = tw.flatMap((g) => g.items.map((t) => ({ g: g.g, t })));
      const cur = all[ti % all.length];
      const block = (title, arr) => `<div class="card stack"><span class="eyebrow">${title}</span>${arr.map((x) => `<div class="ex"><b>${esc(x.t)}</b><span class="dim">${x.sec} с</span><p>${esc(x.d)}</p></div>`).join('')}</div>`;
      return head('Снимать без страха', 'Разминка речи', 'Голос, дикция и дыхание за 5 минут до записи. Делай перед каждой съёмкой — через неделю речь станет чётче, а голос увереннее.') + `<div class="stack-lg">
        <button class="btn" data-a="go" data-v="warmup">▶ Разминка перед съёмкой · 5 минут с таймером</button>
        <div class="card accent stack"><span class="eyebrow">Скороговорка · ${esc(cur.g)}</span><p class="twister">${esc(cur.t)}</p><p class="dim">Режим: <b>${esc(Sp.twisterModes[mi % Sp.twisterModes.length])}</b></p>
          <div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn sm" data-a="twistNext">Другая</button><button class="btn sm ghost" data-a="twistMode">Сменить режим</button></div></div>
        ${block('Дыхание и опора', Sp.breath)}
        ${block('Артикуляционная гимнастика', Sp.artic)}
        ${block('Голос', Sp.voice)}
        <div class="card stack"><span class="eyebrow">${esc(Sp.cork.t)}</span><ol class="steps">${Sp.cork.how.map((x) => `<li>${esc(x)}</li>`).join('')}</ol>
          <div class="exhook"><span class="dim">Текст для чтения</span><br>${esc(Sp.cork.text)}</div><p class="dim">⚠ ${esc(Sp.cork.safety)}</p></div>
        <div class="card stack"><span class="eyebrow">Все скороговорки</span>${tw.map((g) => `<p class="line"><b>${esc(g.g)}.</b> ${g.items.map(esc).join(' · ')}</p>`).join('')}</div></div>`;
    },
    warmup() {
      const steps = warmSteps(), w = (st().warm = st().warm || { i: 0, left: steps[0].sec, run: false });
      if (w.i >= steps.length) { w.i = 0; w.left = steps[0].sec; }
      const cur = steps[w.i], total = steps.reduce((a, s) => a + s.sec, 0);
      return head('Разминка перед съёмкой', w.finished ? 'Готово — можно снимать' : `Шаг ${w.i + 1} из ${steps.length}`, `Всего около ${Math.round(total / 60)} минут.`) + `<div class="stack-lg">
        <div class="card warm"><div class="wring" id="warmRing" style="--p:${1 - w.left / cur.sec}"><b id="warmLeft">${w.left}</b><small>сек</small></div>
          <h2>${esc(cur.t)}</h2><p>${esc(cur.d)}</p></div>
        <div class="row" style="gap:8px"><button class="btn" data-a="warmToggle" style="flex:1">${w.run ? 'Пауза' : w.finished ? 'Ещё раз' : 'Старт'}</button><button class="btn ghost" data-a="warmNext" style="flex:1">Следующий шаг</button></div>
        <div class="card">${steps.map((s, k) => `<div class="todo ${k < w.i || w.finished ? 'done' : ''}"><span class="box">${k < w.i || w.finished ? '✓' : k + 1}</span><div class="tx">${esc(s.t)} <span class="dim">· ${s.sec} с</span></div></div>`).join('')}</div></div>`;
    },

    diag() {
      const d = diag(), N = nicheObj(), aiOn = !!(CFG.analyzeEndpoint || '').trim();
      const v = d.video;
      return head('Разбор ролика', 'Почему не залетело', 'Три слоя разбора: анкета о ролике, цифры из статистики и анализ самого видео. Видео анализируется прямо на телефоне и никуда не отправляется.') + `<div class="stack-lg">
        <div class="card stack"><span class="eyebrow">1 · Загрузи ролик</span>
          ${diagBusy != null ? `<p>Смотрю видео… ${diagBusy}%</p><div class="progress"><i style="width:${diagBusy}%"></i></div>` : v ? `<p><b>${esc(v.name || 'видео')}</b> · ${Math.round(v.dur)} с · ${v.w}×${v.h}</p><div class="vstats"><span>Яркость ${Math.round((v.luma / 255) * 100)}%</span><span>Склеек ${v.cuts}</span><span>${v.audio ? (v.audio.silent ? 'Без звука' : `Звук ${Math.round(v.audio.level)} дБ`) : 'Звук не прочитан'}</span></div><label class="btn sm ghost filebtn">Другое видео<input type="file" accept="video/*" data-in="diagVideo" hidden></label>` :
            `<label class="btn filebtn">📤 Выбрать видео<input type="file" accept="video/*" data-in="diagVideo" hidden></label><p class="dim">Проверю формат, свет, смену кадров, паузы и громкость, тишину в начале.</p>`}</div>
        <div class="card stack"><span class="eyebrow">2 · Ответь про ролик</span>${GD.DIAG_Q.map((q) => `<div class="dq"><b>${esc(q.t)}</b><div class="chips">${q.o.map((o, i) => `<button type="button" class="chip ${d.a[q.k] === i ? 'on' : ''}" data-a="diagAns" data-k="${q.k}" data-v="${i}">${esc(o[0])}</button>`).join('')}</div></div>`).join('')}</div>
        <div class="card stack"><span class="eyebrow">3 · Цифры из статистики <span class="dim">— если есть</span></span>
          <div class="grid2">${[['views', 'Просмотры'], ['hold3', 'Удержание 3 с, %'], ['avgPct', 'Досмотр, % ролика'], ['saves', 'Сохранения'], ['shares', 'Репосты'], ['follows', 'Подписки']].map(([k, l]) => `<label class="f">${l}<input type="number" inputmode="decimal" data-in="dstat:${k}" value="${esc(d.stats[k] || '')}" min="0"></label>`).join('')}</div></div>
        <button class="btn" data-a="go" data-v="diagRes">Показать разбор</button>
        ${aiOn ? '' : '<p class="dim center">ИИ-разбор по кадрам появится, когда автор подключит его в настройках.</p>'}</div>`;
    },
    diagRes() {
      const R = diagResult(), N = nicheObj() || NI.custom(''), d = diag(), aiOn = !!(CFG.analyzeEndpoint || '').trim();
      if (!R.answered) return head('Разбор ролика', 'Пока нечего разбирать', 'Загрузи ролик или ответь хотя бы на несколько вопросов.') + '<button class="btn" data-a="back">← Назад</button>';
      const zones = {}; R.list.forEach((x) => { (zones[x.z] = zones[x.z] || []).push(x); });
      const hooks = HK.batch(N, { tone: 'psy', count: 3, seed: Date.now() % 9973 }).items;
      const color = R.score >= 75 ? 'var(--ok, #6FD39A)' : R.score >= 50 ? 'var(--accent)' : '#F08A6E';
      return head('Разбор ролика', R.list.length ? 'Вот что мешает' : 'Серьёзных проблем не видно', `Учтено: ${R.answered} ${HK.plural(R.answered, 'параметр', 'параметра', 'параметров')}.`) + `<div class="stack-lg">
        <div class="card dscore"><div class="sring" style="--p:${R.score / 100};--c:${color}"><b>${R.score}</b><small>из 100</small></div><div><span class="eyebrow">Сила ролика</span><p>${R.list.length ? `Главная причина: <b>${esc(R.list[0].t.toLowerCase())}</b>.` : 'Если просмотров всё равно мало — дело в теме или регулярности. Проверь их.'}</p></div></div>
        ${Object.entries(zones).map(([z, arr]) => `<div class="card stack"><span class="eyebrow">${esc(GD.ZONES[z])}</span>${arr.map((x) => `<div class="issue w${x.w >= 7 ? 3 : x.w >= 5 ? 2 : 1}"><b>${esc(x.t)}</b><p>${esc(x.fix)}</p></div>`).join('')}</div>`).join('')}
        <div class="card stack"><span class="eyebrow">Новый хук для следующего ролика · ${esc(N.name)}</span>${hooks.map((h) => `<div class="exhook"><b>${esc(h.text)}</b>${h.trig ? `<br><span class="dim">${esc(HK.TRIGGERS[h.trig][0])}</span>` : ''}</div>`).join('')}<button class="btn sm ghost" data-a="go" data-v="hooks" style="align-self:flex-start">Все хуки</button></div>
        ${aiOn && d.video ? `<div class="card accent stack"><span class="eyebrow">ИИ-разбор по кадрам</span>${d.ai && d.ai.text ? `<div class="aitext">${esc(d.ai.text).replace(/\n/g, '<br>')}</div>` : `<p class="muted">Нейросеть посмотрит ключевые кадры и цифры и даст разбор: хук, подача, свет, текст на экране и что переснять.</p>${d.ai && d.ai.err ? `<p class="err">${esc(d.ai.err)}</p>` : ''}<button class="btn" data-a="diagAi">${d.ai && d.ai.busy ? 'Смотрю кадры…' : 'Разобрать с ИИ'}</button>`}${d.ai && d.ai.credits != null ? `<p class="dim">Осталось разборов: ${d.ai.credits}</p>` : ''}${d.ai && d.ai.needPay ? '<button class="btn soft" data-a="diagBuy">Купить разборы за звёзды Telegram</button>' : ''}</div>` : ''}
        <button class="btn soft" data-a="copyDiag">Скопировать разбор</button>
        <button class="btn ghost" data-a="diagReset">Разобрать другой ролик</button></div>`;
    },

    mycard() {
      const d = cardData();
      return head('Поделиться', 'Карточка «Мой код»', 'Живая карточка с твоим архетипом, знаком и числами. Сохрани картинку и выложи в сторис — друзья захотят узнать свой код.') + `<div class="stack-lg">
        ${cardHtml(d)}
        <button class="btn" data-a="cardSave">Сохранить картинку для сторис</button>
        <button class="btn soft" data-a="cardVideo">Сохранить моушн-видео · 6 секунд</button>
        <button class="btn soft" data-a="share">Отправить друзьям ссылку</button>
        <div id="cardOut"></div>
        ${!d.arch ? '<button class="btn ghost" data-a="go" data-v="archTest">Пройти тест архетипов</button>' : ''}</div>`;
    },

    highlights() {
      const N = nicheObj(), h = hl(), a = leadArch();
      if (!N) return head('Мастерская', 'Актуальные-воронки', 'Каждое актуальное — отдельная боль клиента: человек кликает, проходит 5–12 сторис и в конце забирает лид-магнит.') + `<div class="stack-lg"><div class="card stack">${nicheFieldLite()}</div></div>`;
      const H = buildHighlight(N, h.pain, h.len, h.magnet, h.code, a);
      const set = N.pain.map((p, i) => ({ t: ((h.titles || {})[i]) || hlTitleFor(N, i), i }));
      return head('Мастерская', 'Актуальные-воронки', 'Не «обо мне» и «кейсы», а конкретная боль: человек узнаёт себя в названии, кликает, проходит сторис и в конце забирает лид-магнит.') + `<div class="stack-lg">
        <div class="card stack">${nicheFieldLite()}
          <span class="dim">Набор актуальных для ниши «${esc(N.name)}» — выбери боль</span>
          <div class="hlset">${set.map((s, k) => `<button class="hlc ${h.pain === s.i ? 'on' : ''}" data-a="hlPain" data-v="${s.i}"><span class="hlring"><i>${HL_COVER[k % HL_COVER.length]}</i></span><small>${esc(s.t)}</small></button>`).join('')}</div>
          <span class="dim">Сколько сторис</span><div class="chips">${[5, 7, 10, 12].map((n) => `<button type="button" class="chip ${h.len === n ? 'on' : ''}" data-a="hlLen" data-v="${n}">${n}</button>`).join('')}</div>
          <span class="dim">Лид-магнит в конце</span><div class="chips">${Object.entries(GD.MAGNETS).map(([k, m]) => `<button type="button" class="chip ${h.magnet === k ? 'on' : ''}" data-a="hlMagnet" data-v="${k}">${m.name}</button>`).join('')}</div>
          <label class="f">Кодовое слово<input type="text" data-in="hl:code" value="${esc(h.code)}" maxlength="16"></label></div>
        <div class="card accent stack"><span class="eyebrow">Обложка и название</span><div class="row"><span class="hlring big"><i>${HL_COVER[h.pain % HL_COVER.length]}</i></span><div style="flex:1"><label class="f">Название <span class="dim">— до 15 знаков</span><input type="text" data-in="hl:title" value="${esc(H.title)}" maxlength="15"></label></div></div>
          <p class="dim">Боль: «${esc(H.pain)}». Название — короткая боль с вопросом, чтобы человек узнал себя и кликнул. Поправь его своими словами. Обложки делай в одном стиле и в палитре своего архетипа.</p></div>
        ${H.stories.map((s) => `<div class="card story"><div class="snum"><b>${s.n}</b><small>${esc(s.roleName)}</small></div><div><p class="say">${esc(s.text)}</p><dl class="kv"><dt>В кадре</dt><dd>${esc(s.show)}</dd><dt>Стикер</dt><dd>${esc(s.sticker)}</dd></dl></div></div>`).join('')}
        <button class="btn" data-a="copyHl">Скопировать сценарий</button>
        <button class="btn ghost" data-a="hlNew">Другие формулировки</button>
        <div class="card flat stack"><span class="eyebrow">Как это работает</span><p class="line">1. Название — боль, а не рубрика: «Ресницы выпадают?» вместо «Уход».</p><p class="line">2. Первая сторис повторяет боль — человек убеждается, что попал куда нужно.</p><p class="line">3. Каждая сторис — одна мысль и одно действие: опрос, викторина, шкала. Реакции поднимают охват.</p><p class="line">4. В конце — один лид-магнит и одно кодовое слово. Слово подключи к боту — и воронка работает сама.</p><p class="line">5. Квадратные скобки — место для твоих фактов. Без них сценарий звучит шаблонно.</p><p class="line">6. Раз в месяц обновляй доказательства: свежие результаты клиентов.</p></div></div>`;
    },
  };
  function nicheFieldLite() {
    const N = nicheObj();
    return `<label class="f">Ниша<input type="text" data-in="nicheSearch" value="${esc(st().ideaForm.niche)}" placeholder="например: маникюр, психология" maxlength="60" autocomplete="off"></label><div id="nicheSuggest"></div>${N ? `<p class="dim nichenote">${N.custom ? `Ниши «${esc(N.name)}» нет в базе — использую универсальные формулировки.` : `Ниша в базе: <b>${esc(N.name)}</b>`}</p>` : ''}`;
  }

  /* ================= НАПОМИНАНИЯ ================= */
  function remindCard() {
    const t = trainer(), on = !!(CFG.remindEndpoint || '').trim();
    const hours = [8, 9, 10, 12, 14, 17, 19, 20, 21];
    return `<div class="card stack"><span class="eyebrow">Напоминания</span>
      ${on ? `<p class="dim">Бот будет присылать задание дня в выбранное время.</p><div class="chips">${hours.map((h) => `<button type="button" class="chip ${t.remind.hour === h ? 'on' : ''}" data-a="remindHour" data-v="${h}">${h}:00</button>`).join('')}</div>
        <button class="btn ${t.remind.on ? 'ghost' : ''}" data-a="remindToggle">${t.remind.on ? 'Выключить напоминания' : 'Включить напоминания'}</button>` :
        `<p class="dim">Поставь в телефоне ежедневное напоминание на ${t.remind.hour}:00 с текстом «Тренажёр: 5 минут». Привычка закрепляется, когда задание в одно и то же время.</p>`}</div>`;
  }
  async function remindSync() {
    const t = trainer(), url = (CFG.remindEndpoint || '').trim(); if (!url) return;
    try {
      const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ initData: tg ? tg.initData : '', on: t.remind.on, hour: t.remind.hour, tz: -new Date().getTimezoneOffset(), start: t.start, done: Object.keys(t.done).length }) });
      if (!r.ok) throw new Error(r.status); C.toast(t.remind.on ? `Напоминания в ${t.remind.hour}:00` : 'Напоминания выключены');
    } catch (e) { C.toast('Не удалось связаться с ботом'); }
  }

  /* ================= ДЕЙСТВИЯ ================= */
  const actions = {
    fearQuizStart() { const f = (st().fears = st().fears || {}); f.quiz = []; C.save(); C.go('fearQuiz'); },
    fearAnswer(el) {
      const q = st().fears.quiz, i = q.findIndex((x) => x == null) >= 0 ? q.findIndex((x) => x == null) : q.length; q[i] = +el.dataset.v; C.save(); C.haptic(); el.classList.add('on');
      setTimeout(() => { if (q.length >= GD.FEARS.length && q.every((x) => x != null)) { C.toast('Готово — вот твой порядок'); C.go('fears', {}, true); } else C.render(true); }, 140);
    },
    fearPrev() { st().fears.quiz.pop(); C.save(); C.render(true); },
    trainerFear(el) { const t = trainer(), i = +el.dataset.d; t.done[i] = Object.assign(t.done[i] || { at: Date.now() }, { fear: +el.dataset.v }); if (!t.start) t.start = Date.now(); C.save(); C.haptic(); C.render(); },
    trainerDone(el) { const t = trainer(), i = +el.dataset.d; if (!t.start) t.start = Date.now(); t.done[i] = t.done[i] || { at: Date.now() }; C.save(); C.haptic('medium'); C.toast(i === 20 ? 'Тренажёр пройден! Ты молодец' : 'День засчитан'); if (t.remind.on) remindSync(); if (st().route && st().route.start && C.tab) { C.tab('code'); return; } if (i < 20) C.go('trainerDay', { d: i + 1 }, true); else C.render(); },
    remindHour(el) { trainer().remind.hour = +el.dataset.v; C.save(); C.haptic(); C.render(); if (trainer().remind.on) remindSync(); },
    remindToggle() {
      const t = trainer(); const next = !t.remind.on;
      const apply = () => { t.remind.on = next; if (!t.start) t.start = Date.now(); C.save(); C.render(); remindSync(); };
      if (next && tg && tg.requestWriteAccess) { try { tg.requestWriteAccess((ok) => { if (ok) apply(); else C.toast('Без разрешения бот не сможет писать'); }); } catch (e) { apply(); } } else apply();
    },
    twistNext() { st().twistIdx = (st().twistIdx || 0) + 1; C.save(); C.haptic(); C.render(); },
    twistMode() { st().twistMode = (st().twistMode || 0) + 1; C.save(); C.haptic(); C.render(); },
    warmToggle() {
      const w = st().warm, steps = warmSteps();
      if (w.finished) { w.finished = false; w.i = 0; w.left = steps[0].sec; }
      w.run = !w.run; C.haptic();
      if (w.run && !warmTimer) warmTimer = setInterval(warmTick, 1000);
      if (!w.run && warmTimer) { clearInterval(warmTimer); warmTimer = null; }
      C.render();
    },
    warmNext() { const w = st().warm, steps = warmSteps(); if (w.i < steps.length - 1) { w.i++; w.left = steps[w.i].sec; } else { w.finished = true; w.run = false; if (warmTimer) { clearInterval(warmTimer); warmTimer = null; } } C.haptic(); C.render(); },
    diagAns(el) { diag().a[el.dataset.k] = +el.dataset.v; C.save(); C.haptic(); el.parentNode.querySelectorAll('.chip').forEach((c) => c.classList.toggle('on', c === el)); },
    diagReset() { st().diag = { a: {}, stats: {}, video: null, ai: null }; C.save(); C.go('diag', {}, true); },
    async diagAi() {
      const d = diag(); if (!d.video || (d.ai && d.ai.busy)) return;
      d.ai = Object.assign(d.ai || {}, { busy: true, err: null }); C.render();
      try {
        const R = diagResult(), N = nicheObj();
        const r = await fetch(CFG.analyzeEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ initData: tg ? tg.initData : '', frames: d.video.frames, facts: { dur: d.video.dur, w: d.video.w, h: d.video.h, luma: d.video.luma, cuts: d.video.cuts, audio: d.video.audio }, issues: R.list.map((x) => x.t), niche: N ? N.name : '', arch: leadArch() ? AR.A[leadArch()].name : '' }) });
        const j = await r.json().catch(() => ({}));
        if (r.status === 402 || j.error === 'no_credits') { d.ai = { needPay: true, credits: 0, err: 'Бесплатные разборы закончились.' }; }
        else if (!r.ok) throw new Error(j.error || r.status);
        else d.ai = { text: j.text, credits: j.credits };
      } catch (e) { d.ai = { err: 'Не получилось связаться с ИИ. Попробуй позже.' }; }
      C.save(); C.render();
    },
    async diagBuy() {
      const url = (CFG.analyzeEndpoint || '').replace(/\/analyze\/?$/, '') + '/invoice';
      try {
        const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ initData: tg ? tg.initData : '', pack: 'p5' }) }); const j = await r.json();
        if (!j.link) throw new Error('no link');
        if (tg && tg.openInvoice) tg.openInvoice(j.link, (status) => { if (status === 'paid') { diag().ai = { credits: null }; C.save(); C.toast('Оплачено! Разборы добавлены'); C.render(); } });
        else C.toast('Оплата работает только внутри Telegram');
      } catch (e) { C.toast('Оплата пока недоступна'); }
    },
    copyDiag() { const R = diagResult(); C.copy(`Разбор ролика: ${R.score}/100\n\n` + R.list.map((x, i) => `${i + 1}. ${x.t}\n— ${x.fix}`).join('\n\n') + (diag().ai && diag().ai.text ? `\n\nИИ-разбор:\n${diag().ai.text}` : '')); },
    async cardSave() {
      const box = document.getElementById('cardOut'); if (box) box.innerHTML = '<p class="dim center">Рисую картинку…</p>';
      try {
        const url = await cardPng(cardData());
        let shared = false;
        try {
          const blob = await (await fetch(url)).blob(), file = new File([blob], 'moy-kod.png', { type: 'image/png' });
          if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: 'Мой код креатора' }); shared = true; }
        } catch (e) {}
        if (box) box.innerHTML = `<div class="card stack"><img src="${url}" alt="Карточка «Мой код»" class="cardimg"><p class="dim center">${shared ? 'Готово!' : 'Нажми на картинку и удерживай, чтобы сохранить в галерею.'}</p><a class="btn sm ghost" href="${url}" download="moy-kod.png" style="align-self:center">Скачать файл</a></div>`;
        C.haptic('medium');
      } catch (e) { if (box) box.innerHTML = '<p class="err">Не удалось нарисовать картинку на этом устройстве.</p>'; }
    },
    async cardVideo() {
      const box = document.getElementById('cardOut'); if (box) box.innerHTML = '<p class="dim center" id="vidProg">Записываю анимацию… 0%</p>';
      try {
        const v = await cardVideo(cardData(), (p) => { const e = document.getElementById('vidProg'); if (e) e.textContent = `Записываю анимацию… ${p}%`; });
        const url = URL.createObjectURL(v.blob), name = 'moy-kod.' + v.ext;
        let shared = false;
        try { const file = new File([v.blob], name, { type: v.blob.type }); if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: 'Мой код креатора' }); shared = true; } } catch (e) {}
        if (box) box.innerHTML = `<div class="card stack"><video src="${url}" class="cardimg" autoplay loop muted playsinline controls></video><p class="dim center">${shared ? 'Готово!' : v.ext === 'mp4' ? 'Скачай файл и выложи в сторис.' : 'Это устройство записало видео в формате webm. Для сторис лучше сохранить картинку или записать видео с телефона.'}</p><a class="btn sm ghost" href="${url}" download="${name}" style="align-self:center">Скачать видео</a></div>`;
        C.haptic('medium');
      } catch (e) { if (box) box.innerHTML = '<p class="err">Это устройство не умеет записывать видео из приложения. Сохрани картинку — она в том же стиле.</p>'; }
    },
    hlPain(el) { hl().pain = +el.dataset.v; C.save(); C.haptic(); C.render(); },
    hlLen(el) { hl().len = +el.dataset.v; C.save(); C.haptic(); C.render(); },
    hlMagnet(el) { const h = hl(), CODES = { guide: 'ГАЙД', checklist: 'ЧЕКЛИСТ', lesson: 'УРОК', review: 'РАЗБОР', discount: 'СКИДКА', list: 'ПОДБОРКА' }; if (!h.code || Object.values(CODES).includes(h.code.toUpperCase())) h.code = CODES[el.dataset.v]; h.magnet = el.dataset.v; C.save(); C.haptic(); C.render(); },
    hlNew() { st().hlSeed = (st().hlSeed || 1) + 1; C.save(); C.haptic(); C.render(); },
    copyHl() {
      const N = nicheObj(); if (!N) return; const h = hl(), H = buildHighlight(N, h.pain, h.len, h.magnet, h.code, leadArch());
      C.copy(`АКТУАЛЬНОЕ «${H.title}»\n\n` + H.stories.map((s) => `${s.n}. ${s.roleName.toUpperCase()}\nТекст: ${s.text}\nВ кадре: ${s.show}\nСтикер: ${s.sticker}`).join('\n\n'));
    },
  };
  // параметры go с data-k / data-d
  const goParams = (el) => (el.dataset.k ? { k: el.dataset.k } : el.dataset.d != null ? { d: +el.dataset.d } : null);

  function onInput(k, el) {
    if (k.startsWith('dstat:')) { diag().stats[k.slice(6)] = el.value; C.save(); return true; }
    if (k === 'hl:code') { hl().code = el.value; C.save(); return true; }
    if (k === 'hl:title') { const h = hl(); h.titles = h.titles || {}; h.titles[h.pain] = el.value.trim(); C.save(); const sm = document.querySelector('.hlc.on small'); if (sm) sm.textContent = el.value; return true; }
    return false;
  }
  function onChange(k, el) {
    if (k === 'diagVideo' && el.files && el.files[0]) {
      const f = el.files[0]; diagBusy = 0; C.render();
      analyzeVideo(f, (p) => { diagBusy = p; const b = document.querySelector('.progress i'); if (b) b.style.width = p + '%'; })
        .then((v) => { diag().video = v; diag().ai = null; diagBusy = null; C.save(); C.haptic('medium'); C.toast('Видео разобрано'); C.render(); })
        .catch(() => { diagBusy = null; C.toast('Не получилось прочитать видео на этом устройстве'); C.render(); });
      return true;
    }
    if (k === 'trainerClip' && el.files && el.files[0]) {
      const f = el.files[0], i = +el.dataset.d, t = trainer();
      if (!t.start) t.start = Date.now(); t.done[i] = t.done[i] || { at: Date.now() }; t.done[i].clip = true; C.save();
      IDB.put('day' + i, f).catch(() => {}).finally(() => { C.toast('Дубль сохранён'); C.render(); });
      return true;
    }
    return false;
  }
  /** После отрисовки: показать сохранённые дубли тренажёра. */
  function afterTrainerDay(params) {
    const i = +(params && params.d) || 0;
    const show = (key, box) => IDB.get(key).then((b) => { if (b && box) { const u = URL.createObjectURL(b); box.insertAdjacentHTML('beforeend', `<video src="${u}" controls playsinline class="clip"></video>`); } }).catch(() => {});
    show('day' + i, document.getElementById('clipBox'));
    document.querySelectorAll('#beforeAfter .ba').forEach((b) => show('day' + b.dataset.k, b));
  }
  function afterWarmup() { const w = st().warm; if (w && w.run && !warmTimer) warmTimer = setInterval(warmTick, 1000); }
  function leave() { if (warmTimer && C.routeName() !== 'warmup') { clearInterval(warmTimer); warmTimer = null; if (st().warm) st().warm.run = false; } }

  /** Плитки раздела в «Контенте». */
  function tiles() {
    const t = trainer(), done = Object.keys(t.done).length, R = fearRank();
    return `<h2 class="sec">Снимать без страха</h2><div class="tiles">
      <button class="tile" data-a="go" data-v="fears"><span class="ic">🫣</span><span><b>Страхи</b><small>${R ? esc(R[0].f.title) : '10 страхов и как их снять'}</small></span></button>
      <button class="tile" data-a="go" data-v="trainer"><span class="ic">🎯</span><span><b>Тренажёр камеры</b><small>${done ? `${done} из 21 дня` : '21 день по 5 минут'}</small></span></button>
      <button class="tile" data-a="go" data-v="speech"><span class="ic">🗣</span><span><b>Разминка речи</b><small>Дикция, голос, пробка</small></span></button>
      <button class="tile" data-a="go" data-v="diag"><span class="ic">🔍</span><span><b>Почему не залетело</b><small>Разбор ролика</small></span></button></div>`;
  }

  return { screens, actions, onInput, onChange, goParams, tiles, afterTrainerDay, afterWarmup, leave, cardData, cardHtml, buildHighlight, hlTitle, hlTitleFor, diagResult, videoIssues, statsIssues, audioStats };
};
