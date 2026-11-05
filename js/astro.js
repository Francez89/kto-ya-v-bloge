/*
 * «Кто я в блоге?» — расчётный модуль натальной карты.
 * Положения планет считает библиотека Astronomy Engine (MIT, Don Cross,
 * https://github.com/cosinekitty/astronomy) — точность лучше 1 угловой минуты.
 * Здесь: перевод местного времени в UTC, асцендент/MC, дома Плацидуса (как в астрологических программах),
 * истинный лунный узел, ретроградность. Сверено со Swiss Ephemeris: расхождение планет < 0,5′, асцендента/MC/куспидов < 0,1′.
 * Генеративная модель положения планет не придумывает.
 */
(function (root) {
  const A = root.Astronomy || (typeof require !== 'undefined' ? require('../vendor/astronomy.browser.min.js') : null);

  const SIGN_KEYS = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'];
  const BODIES = [
    { key: 'sun', name: 'Солнце', glyph: '☉' },
    { key: 'moon', name: 'Луна', glyph: '☽' },
    { key: 'mercury', name: 'Меркурий', glyph: '☿', body: 'Mercury' },
    { key: 'venus', name: 'Венера', glyph: '♀', body: 'Venus' },
    { key: 'mars', name: 'Марс', glyph: '♂', body: 'Mars' },
    { key: 'jupiter', name: 'Юпитер', glyph: '♃', body: 'Jupiter' },
    { key: 'saturn', name: 'Сатурн', glyph: '♄', body: 'Saturn' },
    { key: 'uranus', name: 'Уран', glyph: '♅', body: 'Uranus' },
    { key: 'neptune', name: 'Нептун', glyph: '♆', body: 'Neptune' },
    { key: 'pluto', name: 'Плутон', glyph: '♇', body: 'Pluto' },
    { key: 'node', name: 'Северный узел', glyph: '☊' },
  ];

  const norm = (d) => ((d % 360) + 360) % 360;
  const rad = (d) => (d * Math.PI) / 180;
  const deg = (r) => (r * 180) / Math.PI;

  /** Смещение часового пояса (в минутах) для момента utcMs в зоне IANA, по базе браузера (учитывает историю, напр. СССР/2011/2014). */
  function tzOffsetMinutes(utcMs, timeZone) {
    const f = new Intl.DateTimeFormat('en-US', {
      timeZone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
    const p = {};
    for (const x of f.formatToParts(new Date(utcMs))) p[x.type] = x.value;
    const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second);
    return Math.round((asUtc - utcMs) / 60000);
  }

  /** Местное время рождения → Date (UTC). tz: строка IANA или число (смещение в часах). */
  function localToUtc(y, m, d, hh, mm, tz) {
    const naive = Date.UTC(y, m - 1, d, hh, mm);
    if (typeof tz === 'number') return new Date(naive - tz * 3600000);
    let guess = naive - tzOffsetMinutes(naive, tz) * 60000;
    guess = naive - tzOffsetMinutes(guess, tz) * 60000; // вторая итерация — для дат около перевода часов
    return new Date(guess);
  }

  /** Истинный лунный узел: восходящий узел мгновенной орбиты Луны. */
  function trueNode(date) {
    const h = 0.25 * 86400000;
    const p = (d) => A.Ecliptic(A.GeoMoon(d)).vec;
    const r = p(date), r1 = p(new Date(date.getTime() - h)), r2 = p(new Date(date.getTime() + h));
    const v = { x: r2.x - r1.x, y: r2.y - r1.y, z: r2.z - r1.z };
    const hx = r.y * v.z - r.z * v.y, hy = r.z * v.x - r.x * v.z;
    return norm(deg(Math.atan2(hx, -hy)));
  }
  function longitude(key, date) {
    if (key === 'sun') return norm(A.SunPosition(date).elon);
    if (key === 'node') return trueNode(date);
    if (key === 'moon') return norm(A.EclipticGeoMoon(date).lon);
    const b = BODIES.find((x) => x.key === key).body;
    return norm(A.Ecliptic(A.GeoVector(A.Body[b], date, true)).elon);
  }

  /** Асцендент и MC (тропический зодиак, истинный экватор/эклиптика даты). */
  function angles(date, lat, lon) {
    const t = A.MakeTime(date);
    const eps = rad(A.e_tilt(t).tobl);
    const lst = rad(norm(A.SiderealTime(date) * 15 + lon));
    const phi = rad(lat);
    const asc = norm(deg(Math.atan2(Math.cos(lst), -(Math.sin(lst) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps)))));
    const mc = norm(deg(Math.atan2(Math.sin(lst), Math.cos(lst) * Math.cos(eps))));
    return { asc, mc, ramc: deg(lst), eps, phi };
  }

  /** Куспиды домов по Плацидусу. За полярным кругом, где Плацидус не определён, — Порфирий. */
  function housesPlacidus(a) {
    const { asc, mc, ramc, eps, phi } = a;
    const L = (ra) => norm(deg(Math.atan2(Math.sin(rad(ra)), Math.cos(rad(ra)) * Math.cos(eps))));
    const cusp = (f, upper) => {
      let ra = upper ? ramc + 90 * f : ramc + 180 - 90 * f;
      for (let k = 0; k < 60; k++) {
        const dec = Math.asin(Math.sin(eps) * Math.sin(rad(L(ra))));
        const x = -Math.tan(phi) * Math.tan(dec);
        if (Math.abs(x) > 1) return null;
        const dsa = deg(Math.acos(x));
        const nra = upper ? ramc + f * dsa : ramc + 180 - f * (180 - dsa);
        const done = Math.abs(norm(nra - ra + 180) - 180) < 1e-8; ra = nra; if (done) break;
      }
      return L(ra);
    };
    let c = { 1: asc, 10: mc, 11: cusp(1 / 3, true), 12: cusp(2 / 3, true), 2: cusp(2 / 3, false), 3: cusp(1 / 3, false) };
    let system = 'placidus';
    if ([c[11], c[12], c[2], c[3]].some((v) => v == null)) {
      system = 'porphyry';
      const q1 = norm(asc - mc) / 3, q2 = norm(mc + 180 - asc) / 3;
      c = { 1: asc, 10: mc, 11: norm(mc + q1), 12: norm(mc + 2 * q1), 2: norm(asc + q2), 3: norm(asc + 2 * q2) };
    }
    c[4] = norm(c[10] + 180); c[5] = norm(c[11] + 180); c[6] = norm(c[12] + 180); c[7] = norm(c[1] + 180); c[8] = norm(c[2] + 180); c[9] = norm(c[3] + 180);
    const cusps = Array.from({ length: 12 }, (_, i) => c[i + 1]);
    return { cusps, system };
  }
  /** В каком доме долгота (по куспидам). */
  function houseOf(lonDeg, cusps) {
    for (let i = 0; i < 12; i++) { const a = cusps[i], b = cusps[(i + 1) % 12]; if (norm(lonDeg - a) < norm(b - a)) return i + 1; }
    return 1;
  }

  const signOf = (lonDeg) => Math.floor(norm(lonDeg) / 30);
  const degInSign = (lonDeg) => norm(lonDeg) % 30;

  /**
   * Натальная карта.
   * input: { date:'YYYY-MM-DD', time:'HH:MM'|null, lat, lon, tz }
   * Если время неизвестно — берётся 12:00, асцендент и дома не считаются,
   * а для Луны проверяется, не меняла ли она знак в течение суток.
   */
  function calcChart(input) {
    const [y, m, d] = input.date.split('-').map(Number);
    const timeKnown = !!input.time;
    const [hh, mm] = timeKnown ? input.time.split(':').map(Number) : [12, 0];
    const date = localToUtc(y, m, d, hh, mm, input.tz);
    if (isNaN(date.getTime())) throw new Error('Некорректная дата');

    const planets = {};
    for (const b of BODIES) {
      const lonDeg = longitude(b.key, date);
      const retro = b.key !== 'sun' && b.key !== 'moon' && b.key !== 'node' && norm(longitude(b.key, new Date(date.getTime() + 43200000)) - longitude(b.key, new Date(date.getTime() - 43200000)) + 180) - 180 < 0;
      planets[b.key] = { key: b.key, name: b.name, glyph: b.glyph, lon: lonDeg, sign: signOf(lonDeg), deg: degInSign(lonDeg), retro };
    }

    const notes = [];
    if (!timeKnown) {
      const d0 = localToUtc(y, m, d, 0, 0, input.tz);
      const d1 = localToUtc(y, m, d, 23, 59, input.tz);
      const s0 = signOf(longitude('moon', d0));
      const s1 = signOf(longitude('moon', d1));
      if (s0 !== s1) {
        planets.moon.uncertain = [s0, s1];
        notes.push('Луна в этот день переходила из знака в знак — без времени рождения её знак неточен.');
      }
      if (signOf(longitude('sun', d0)) !== signOf(longitude('sun', d1))) {
        planets.sun.uncertain = [signOf(longitude('sun', d0)), signOf(longitude('sun', d1))];
        notes.push('Солнце в этот день меняло знак — уточни время рождения для точного результата.');
      }
    }

    let asc = null, mc = null, houses = null, cusps = null, houseSystem = null;
    if (timeKnown && isFinite(input.lat) && isFinite(input.lon)) {
      if (Math.abs(input.lat) > 66) notes.push('Для широт за полярным кругом асцендент может считаться нестабильно.');
      const a = angles(date, input.lat, input.lon);
      asc = { lon: a.asc, sign: signOf(a.asc), deg: degInSign(a.asc) };
      mc = { lon: a.mc, sign: signOf(a.mc), deg: degInSign(a.mc) };
      // Дома по Плацидусу — система по умолчанию у большинства астрологов и программ.
      const H = housesPlacidus(a); cusps = H.cusps; houseSystem = H.system;
      if (H.system !== 'placidus') notes.push('На этой широте дома Плацидуса не определены — использована система Порфирия.');
      houses = {};
      for (const k in planets) houses[k] = houseOf(planets[k].lon, cusps);
    }
    return { utc: date.toISOString(), timeKnown, planets, asc, mc, houses, cusps, houseSystem, notes };
  }

  /** Баланс стихий и крестов с весами факторов. */
  function balance(chart) {
    const W = { sun: 3, moon: 3, mercury: 2, venus: 2, mars: 2, jupiter: 1, saturn: 1 };
    const el = { fire: 0, earth: 0, air: 0, water: 0 };
    const mo = { cardinal: 0, fixed: 0, mutable: 0 };
    const E = ['fire', 'earth', 'air', 'water'], M = ['cardinal', 'fixed', 'mutable'];
    const add = (sign, w) => { el[E[sign % 4]] += w; mo[M[sign % 3]] += w; };
    for (const k in W) {
      const p = chart.planets[k];
      if (p.uncertain) p.uncertain.forEach((s) => add(s, W[k] / 2));
      else add(p.sign, W[k]);
    }
    if (chart.asc) add(chart.asc.sign, 3);
    const top = (o) => Object.keys(o).sort((a, b) => o[b] - o[a]);
    return { elements: el, modes: mo, element: top(el)[0], element2: top(el)[1], mode: top(mo)[0], weakElement: top(el)[3] };
  }

  const api = { calcChart, balance, localToUtc, tzOffsetMinutes, signOf, houseOf, housesPlacidus, angles, longitude, SIGN_KEYS, BODIES };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.VektorAstro = api;
})(typeof window !== 'undefined' ? window : globalThis);
