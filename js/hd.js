/*
 * «Кто я в блоге?» — расчёт «Дизайна человека» (Human Design).
 * Позиции планет — Astronomy Engine. Момент дизайна — когда Солнце было на 88° дуги раньше.
 * Ворота: колесо мандалы, ворота 41 начинаются с 2°00′ Водолея (302° тропического зодиака), шаг 5.625°.
 */
(function (root) {
  const A = root.Astronomy || (typeof require !== 'undefined' ? require('../vendor/astronomy.browser.min.js') : null);
  const norm = (d) => ((d % 360) + 360) % 360;
  const deg = (r) => (r * 180) / Math.PI;

  const WHEEL = [41, 19, 13, 49, 30, 55, 37, 63, 22, 36, 25, 17, 21, 51, 42, 3, 27, 24, 2, 23, 8, 20, 16, 35, 45, 12, 15, 52, 39, 53, 62, 56, 31, 33, 7, 4, 29, 59, 40, 64, 47, 6, 46, 18, 48, 57, 32, 50, 28, 44, 1, 43, 14, 34, 9, 5, 26, 11, 10, 58, 38, 54, 61, 60];
  const START = 302;

  const CENTERS = {
    head: { name: 'Теменной', gates: [64, 61, 63] },
    ajna: { name: 'Аджна', gates: [47, 24, 4, 17, 43, 11] },
    throat: { name: 'Горловой', gates: [62, 23, 56, 35, 12, 45, 33, 8, 31, 20, 16] },
    g: { name: 'G-центр (Я)', gates: [1, 13, 25, 46, 2, 15, 10, 7] },
    heart: { name: 'Сердце (Эго)', gates: [21, 40, 26, 51] },
    sacral: { name: 'Сакральный', gates: [5, 14, 29, 59, 9, 3, 42, 27, 34] },
    sp: { name: 'Солнечное сплетение', gates: [6, 37, 22, 36, 30, 55, 49] },
    spleen: { name: 'Селезёнка', gates: [48, 57, 44, 50, 32, 28, 18] },
    root: { name: 'Корневой', gates: [53, 60, 52, 19, 39, 41, 58, 38, 54] },
  };
  const GATE_CENTER = {};
  for (const c in CENTERS) for (const g of CENTERS[c].gates) GATE_CENTER[g] = c;

  const CHANNELS = [[64, 47], [61, 24], [63, 4], [17, 62], [43, 23], [11, 56], [31, 7], [8, 1], [33, 13], [20, 10], [16, 48], [20, 57], [20, 34], [35, 36], [12, 22], [45, 21], [25, 51], [5, 15], [14, 2], [29, 46], [34, 10], [10, 57], [26, 44], [40, 37], [27, 50], [34, 57], [59, 6], [42, 53], [3, 60], [9, 52], [18, 58], [28, 38], [32, 54], [19, 49], [39, 55], [41, 30]];

  const BODIES = [
    ['sun', 'Солнце'], ['earth', 'Земля'], ['moon', 'Луна'], ['nnode', 'Сев. узел'], ['snode', 'Юж. узел'],
    ['mercury', 'Меркурий'], ['venus', 'Венера'], ['mars', 'Марс'], ['jupiter', 'Юпитер'], ['saturn', 'Сатурн'],
    ['uranus', 'Уран'], ['neptune', 'Нептун'], ['pluto', 'Плутон'],
  ];

  function sunLon(date) { return norm(A.SunPosition(date).elon); }
  function trueNode(date) {
    const h = 0.25 * 86400000;
    const p = (d) => A.Ecliptic(A.GeoMoon(d)).vec;
    const r = p(date), r1 = p(new Date(date.getTime() - h)), r2 = p(new Date(date.getTime() + h));
    const v = { x: r2.x - r1.x, y: r2.y - r1.y, z: r2.z - r1.z };
    const hx = r.y * v.z - r.z * v.y, hy = r.z * v.x - r.x * v.z;
    return norm(deg(Math.atan2(hx, -hy)));
  }
  function lonOf(key, date) {
    switch (key) {
      case 'sun': return sunLon(date);
      case 'earth': return norm(sunLon(date) + 180);
      case 'moon': return norm(A.EclipticGeoMoon(date).lon);
      case 'nnode': return trueNode(date);
      case 'snode': return norm(trueNode(date) + 180);
      default: {
        const b = key.charAt(0).toUpperCase() + key.slice(1);
        return norm(A.Ecliptic(A.GeoVector(A.Body[b], date, true)).elon);
      }
    }
  }
  function gateOf(lon) {
    const x = norm(lon - START);
    const i = Math.floor(x / 5.625);
    const line = Math.floor((x - i * 5.625) / 0.9375) + 1;
    return { gate: WHEEL[i], line: Math.min(line, 6) };
  }

  /** Момент, когда Солнце было на 88° раньше по дуге. */
  function designDate(birth) {
    const target = norm(sunLon(birth) - 88);
    let t = new Date(birth.getTime() - 88 / 0.9856 * 86400000);
    for (let k = 0; k < 8; k++) {
      let diff = norm(sunLon(t) - target);
      if (diff > 180) diff -= 360;
      t = new Date(t.getTime() - (diff / 0.9856) * 86400000);
      if (Math.abs(diff) < 1e-6) break;
    }
    return t;
  }

  function activations(date) {
    return BODIES.map(([key, name]) => Object.assign({ key, name, lon: lonOf(key, date) }, gateOf(lonOf(key, date))));
  }

  /** birthUtc: Date (UTC момент рождения). */
  function calcDesign(birthUtc) {
    const dDate = designDate(birthUtc);
    const pers = activations(birthUtc), des = activations(dDate);
    const gates = new Set(pers.concat(des).map((a) => a.gate));
    const channels = CHANNELS.filter(([a, b]) => gates.has(a) && gates.has(b));
    const defined = new Set();
    channels.forEach(([a, b]) => { defined.add(GATE_CENTER[a]); defined.add(GATE_CENTER[b]); });

    // граф определённых центров
    const adj = {};
    channels.forEach(([a, b]) => { const x = GATE_CENTER[a], y = GATE_CENTER[b]; (adj[x] = adj[x] || new Set()).add(y); (adj[y] = adj[y] || new Set()).add(x); });
    const connected = (from, to) => {
      if (!defined.has(from) || !defined.has(to)) return false;
      const seen = new Set([from]), q = [from];
      while (q.length) { const c = q.shift(); if (c === to) return true; (adj[c] || []).forEach((n) => { if (!seen.has(n)) { seen.add(n); q.push(n); } }); }
      return false;
    };
    const motorToThroat = ['sacral', 'sp', 'heart', 'root'].some((m) => connected(m, 'throat'));
    let type;
    if (!defined.size) type = 'reflector';
    else if (defined.has('sacral')) type = motorToThroat ? 'mg' : 'generator';
    else type = ['sp', 'heart', 'root'].some((m) => connected(m, 'throat')) ? 'manifestor' : 'projector';

    let authority;
    if (type === 'reflector') authority = 'lunar';
    else if (defined.has('sp')) authority = 'emotional';
    else if (defined.has('sacral')) authority = 'sacral';
    else if (defined.has('spleen')) authority = 'splenic';
    else if (defined.has('heart')) authority = 'ego';
    else if (connected('g', 'throat')) authority = 'self';
    else authority = 'mental';

    const profile = `${pers[0].line}/${des[0].line}`;
    // Определение: одно целое, раздельное и т.д.
    const comps = [];
    const seen = new Set();
    defined.forEach((c) => { if (seen.has(c)) return; const comp = [c]; seen.add(c); const q = [c]; while (q.length) { const x = q.shift(); (adj[x] || []).forEach((n) => { if (!seen.has(n)) { seen.add(n); comp.push(n); q.push(n); } }); } comps.push(comp); });
    const definition = ['none', 'single', 'split', 'triple', 'quad'][Math.min(comps.length, 4)];
    const cross = { sunP: pers[0].gate, earthP: pers[1].gate, sunD: des[0].gate, earthD: des[1].gate };
    return { designUtc: dDate.toISOString(), personality: pers, design: des, gates: [...gates].sort((a, b) => a - b), channels, defined: [...defined], type, authority, profile, definition, cross };
  }

  const api = { calcDesign, gateOf, designDate, CENTERS, CHANNELS, GATE_CENTER, WHEEL };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.VektorHD = api;
})(typeof window !== 'undefined' ? window : globalThis);
