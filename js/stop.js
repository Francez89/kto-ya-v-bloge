/*
 * «Движок хуков» по системе СТОП (С — Сейчас, Т — Тайна, О — Обещание, П — Попадание; 0–10 каждая, итог /40).
 * 20 формул, 20 триггеров, подача голосом/текстом, прогрев, стратегия, тон, формат контента.
 * Режимы: «от ниши» (карта аудитории → хуки) и «от сценария» (разбор текста → хуки из его деталей).
 * Без ИИ работает на шаблонах; с ИИ — по полному ТЗ (js/stop-spec.js).
 */
window.VektorStop = (function () {
  const NI = () => window.VektorNiches, HK = () => window.VektorHooks;

  /* ---------- 20 триггеров ---------- */
  const TRIG = {
    benefit: 'Выгода', error: 'Ошибка', secret: 'Секрет', ban: 'Запрет', curiosity: 'Любопытство', contrast: 'Контраст', conflict: 'Конфликт',
    myth: 'Разрушение мифа', loss: 'Страх потери', urgency: 'Срочность', numbers: 'Цифры', story: 'История', shock: 'Шок', paradox: 'Парадокс',
    authority: 'Авторитет', social: 'Социальное доказательство', concrete: 'Конкретика', speed: 'Скорость', simple: 'Простота', compare: 'Неожиданное сравнение',
  };

  /* ---------- 20 формул: базовые С, Т, О, П; голос (10–22 слова) и текст (до 12 слов) ----------
     Слоты: {pain} {want} {res} {err} {myth} {fear} {obj} {doer} {aud} {audDat} {audGen} {act} {about} {inT} {name}
     Числа: {k:3,5|форма1|форма2|форма5}. Тон шаблона: h — жёстко, f — дружелюбно. */
  const F = [
    { k: 'num', name: 'Цифра + обещание', trig: ['numbers', 'benefit'], base: [5, 6, 9, 7], why: 'Конкретное число и понятный результат — мозг цепляется за цифру.', vis: 'Цифра крупно на экране с первого кадра.',
      v: [['Дай мне {k:3,5|минуты|минуты|минут}, и я покажу, как {want} — без лишних трат и сложных схем.', 'want'], ['Я покажу {k:3,4|шага|шага|шагов}, которые помогут тебе {want} уже на этой неделе.', 'want'], ['За {k:7,14,30|день|дня|дней} можно {want}, если перестать делать одну вещь, — сейчас объясню какую.', 'want'], ['Слушай внимательно: {k:3|шага|шага|шагов} — и ты сможешь {want}, а не ждать чуда месяцами.', 'want', 'h']],
      t: [['{k:3,5|шага|шага|шагов}, чтобы {want}', 'want'], ['Как {want} за {k:7,14|день|дня|дней}', 'want']] },
    { k: 'provoke', name: 'Провокационное заявление', trig: ['conflict', 'myth'], base: [5, 8, 6, 7], why: 'Спор с общепринятым вызывает желание проверить, кто прав.', vis: 'Резкий зум на лицо на ключевом слове.',
      v: [['Все повторяют, что {myth}, а я скажу честно: это самая дорогая ошибка {inT}.', 'myth'], ['Сейчас скажу то, за что меня не любят коллеги: {myth} — это неправда, и вот почему.', 'myth'], ['Хватит верить, что {myth}. Это удобная сказка, и она прямо сейчас стоит тебе денег.', 'myth', 'h'], ['Мне тоже долго казалось, что {myth}, — пока я не увидел(а) одну вещь своими глазами.', 'myth', 'f'], ['Если ты думаешь «{obj}», дай мне тридцать секунд — и ты передумаешь.', 'obj']],
      t: [['«{myth}» — нет. Объясняю', 'myth'], ['«{obj}»? Давай проверим', 'obj']] },
    { k: 'fail', name: 'Личный провал → урок', trig: ['story', 'error'], base: [5, 8, 7, 8], why: 'Уязвимость вызывает доверие, а чужую ошибку хочется узнать, чтобы не повторить.', vis: 'Начни с крупного плана и серьёзного взгляда.',
      v: [['Я потерял(а) клиентов из-за одной ошибки — {err}. Не повторяй, сейчас расскажу, как это исправить.', 'err'], ['Мне стыдно признавать, но долго я делал(а) вот так: {err}. И вот чем это закончилось.', 'err'], ['Расскажу о своей самой глупой ошибке — {err}. Если узнаешь себя, досмотри до конца.', 'err', 'f'], ['Я сам(а) наступил(а) на эти грабли: {err}. Ты, скорее всего, делаешь так же прямо сейчас.', 'err', 'h']],
      t: [['Моя ошибка: {err}. Не повторяй', 'err'], ['Как я потерял(а) клиентов из-за ошибки', 'name']] },
    { k: 'pain', name: 'Прямое обращение к боли', trig: ['loss', 'concrete'], base: [6, 6, 7, 10], why: 'Зритель слышит свою проблему и думает: «это про меня».', vis: 'Текст боли крупно, лицо в кадре с первой секунды.',
      v: [['Если {pain}, досмотри до конца, потому что дело совсем не в том, о чём ты думаешь.', 'pain'], ['Если {pain}, это не случайность — сейчас покажу, откуда это берётся и как остановить.', 'pain'], ['Хватит терпеть, что {pain}. Сейчас покажу, что именно ты делаешь не так.', 'pain', 'h'], ['Знаю, как обидно, когда {pain}. Давай за минуту разберёмся, что с этим делать.', 'pain', 'f'], ['Ты боишься, что {fear}? Сейчас покажу, почему этого не случится, если знать одну вещь.', 'fear']],
      t: [['Если {pain} — смотри до конца', 'pain'], ['{Pain}? Причина не та, что думаешь', 'pain'], ['Боишься, что {fear}? Смотри', 'fear']] },
    { k: 'secret', name: 'Тайна / запретное знание', trig: ['secret', 'curiosity'], base: [6, 10, 7, 7], why: 'Закрытое знание ценнее открытого: страшно упустить то, что знают «свои».', vis: 'Шёпот или жест «тсс» в первом кадре.',
      v: [['Есть одна вещь, о которой {doer} обычно молчит, — именно она помогает {want}.', 'want'], ['Я случайно узнал(а) приём, который помогает {want}, и не понимаю, почему о нём никто не говорит.', 'want'], ['Мои коллеги не хотят, чтобы ты знал(а) это: как {want} без переплат.', 'want', 'h']],
      t: [['Секрет, как {want}, о котором молчат', 'want'], ['Мало кто знает, как {want}', 'want']] },
    { k: 'ba', name: 'Сравнение «до/после»', trig: ['contrast'], base: [4, 8, 8, 8], why: 'Контраст «было — стало» сразу показывает ценность и вызывает вопрос «как?».', vis: 'Сплит-экран «до/после» в первом кадре.',
      v: [['Раньше у меня не было и близко такого результата, а сейчас — {res}. Разница в одной детали.', 'res'], ['Посмотри на «до» и «после»: {res} — и всё благодаря одному решению, которое я покажу.', 'res']],
      t: [['До → после: {res}', 'res'], ['Было: {pain}. Стало — иначе', 'pain']] },
    { k: 'counter', name: 'Счётчик с интригой', trig: ['numbers', 'curiosity'], base: [4, 9, 8, 7], why: 'Список обещает структуру, а «номер X удивит» держит до конца.', vis: 'Номер пункта крупно в углу кадра.',
      v: [['Вот {k:3,5|причины|причины|причин}, почему {pain}, — и третья удивит даже опытных.', 'pain'], ['Пять вещей, которые я понял(а) за годы {inT}, и последняя изменила всё.', 'name'], ['Три ошибки {audGen}, которые стоят денег, — и номер два делают почти все.', 'name', 'h']],
      t: [['{k:3,5|причины|причины|причин}, почему {pain}', 'pain'], ['5 уроков {inT}. Последний — главный', 'name']] },
    { k: 'challenge', name: 'Челлендж / ставка', trig: ['story', 'curiosity'], base: [6, 9, 7, 6], why: 'Ставка и неизвестный исход включают азарт: «получится или нет?».', vis: 'Таймер или календарь в кадре.',
      v: [['Я поспорил(а), что смогу {want} за {k:7|день|дня|дней}, — смотри, что из этого вышло.', 'want'], ['Я поставил(а) эксперимент: месяц {act} по-новому. Результат удивил даже меня.', 'act']],
      t: [['Эксперимент: {want} за {k:7|день|дня|дней}', 'want'], ['Месяц {act} иначе. Итог', 'act']] },
    { k: 'trap', name: 'Вопрос-ловушка', trig: ['curiosity', 'myth'], base: [5, 8, 6, 8], why: 'Вопрос с неочевидным ответом заставляет проверить себя.', vis: 'Вопрос текстом и пауза-взгляд в камеру.',
      v: [['Как думаешь, почему {pain}? Почти все отвечают неправильно — проверь себя.', 'pain'], ['Ответь честно: ты тоже думаешь, что {myth}? Тогда этот ролик для тебя.', 'myth']],
      t: [['Почему {pain}? Почти все ошибаются', 'pain'], ['Ты тоже веришь, что {myth}?', 'myth']] },
    { k: 'urgent', name: 'Срочность', trig: ['urgency', 'loss'], base: [10, 6, 7, 7], why: 'Ограниченное время заставляет смотреть сейчас, а не «потом».', vis: 'Красный акцент или таймер в первом кадре.',
      v: [['Скоро это перестанет работать, поэтому успей сейчас: как {want}, пока остальные не догадались.', 'want'], ['Каждый день, пока {pain}, ты теряешь время и деньги. Вот что сделать сегодня.', 'pain'], ['Сохрани, пока не забыл(а): если хочешь {want}, начни с этого до конца недели.', 'want', 'f']],
      t: [['Успей, пока работает: как {want}', 'want'], ['Пока {pain}, ты теряешь деньги', 'pain']] },
    { k: 'auth', name: 'Авторитетное признание', trig: ['authority', 'story'], base: [4, 7, 8, 8], why: 'Опыт говорящего повышает вес совета, а «что бы я сказал себе» — это честно.', vis: 'Ты за работой, уверенный план.',
      v: [['Я {k:5,7,10|год|года|лет} {inT}. Вот что я сказал(а) бы себе в самом начале, чтобы не терять время.', 'name'], ['После сотен работ я точно знаю: {err} — первое, что стоит исправить.', 'err']],
      t: [['{k:7,10|год|года|лет} {inT}: главный совет новичку', 'name'], ['Опыт сотен работ: исправь это первым', 'name']] },
    { k: 'pov', name: 'POV / смена перспективы', trig: ['curiosity', 'story'], base: [5, 7, 5, 9], why: 'Зритель примеряет ситуацию на себя и остаётся узнать развязку.', vis: 'Съёмка от первого лица.',
      v: [['POV: ты наконец узнаёшь, почему {pain}, — и становится обидно за потраченное время.', 'pain'], ['Представь, что завтра у тебя {res}. Сейчас покажу, что для этого сделать сегодня.', 'res']],
      t: [['POV: ты узнаёшь, почему {pain}', 'pain'], ['POV: у тебя наконец {res}', 'res']] },
    { k: 'analogy', name: 'Неожиданная аналогия', trig: ['compare'], base: [4, 8, 7, 7], why: 'Странное сравнение ломает ожидание и объясняет сложное через знакомое.', vis: 'Покажи предмет-сравнение в кадре.',
      v: [['{Err} — это как ехать на машине с ручником, и сейчас ты поймёшь почему.', 'err'], ['Объясню {about} на примере кофе — после этого ты точно запомнишь, как {want}.', 'want']],
      t: [['{Err} — это ручник на машине', 'err'], ['{name} на примере кофе', 'name']] },
    { k: 'myth', name: 'Разоблачение мифа', trig: ['myth'], base: [5, 8, 7, 8], why: 'Разрушение привычной истины вызывает когнитивный диссонанс — мозг хочет его разрешить.', vis: 'Зачеркни текст мифа на экране.',
      v: [['Ты всю жизнь думал(а), что {myth}. На самом деле всё наоборот — смотри факты.', 'myth'], ['Давай разберём главный миф {inT}: «{myth}». Спойлер — это не так.', 'myth']],
      t: [['Миф: {myth}. Разбираю', 'myth'], ['Это неправда: {myth}', 'myth']] },
    { k: 'stat', name: 'Шокирующая статистика', trig: ['numbers', 'shock'], base: [6, 8, 6, 8], why: 'Масштаб проблемы пугает и заставляет проверить себя.', vis: 'Цифра или график крупно.',
      v: [['Большинство {audGen} допускают одну и ту же ошибку — {err}. Проверь, нет ли её у тебя.', 'err'], ['Почти половина {audGen} не знает, почему {pain}. А ты знаешь?', 'pain', null, 'noyou']],
      t: [['Большинство {audGen} ошибаются здесь', 'name'], ['Половина {audGen} не знает, почему {pain}', 'pain', null, 'noyou']] },
    { k: 'transform', name: 'Обещание трансформации', trig: ['benefit'], base: [5, 6, 9, 8], why: 'Обещание конкретного изменения отвечает на главный вопрос зрителя «что мне будет?».', vis: 'Кадр результата в первую секунду.',
      v: [['После этого видео ты больше не будешь мириться с тем, что {pain}.', 'pain'], ['Досмотри до конца — и у тебя будет понятный план к результату: {res}.', 'res']],
      t: [['План к результату: {res}', 'res'], ['После ролика: {pain} — в прошлом', 'pain']] },
    { k: 'contra', name: 'Противоречие эксперту', trig: ['conflict', 'authority'], base: [5, 8, 7, 7], why: 'Спор с авторитетом — это всегда конфликт, а за конфликтом хочется наблюдать.', vis: 'Скрин чужого совета и твоя реакция.',
      v: [['Гуру {inT} советуют одно и то же: «{myth}». Я с этим не согласен(на), и вот почему.', 'myth'], ['Мне неважно, сколько у них подписчиков: совет «{myth}» вредит тебе, и я это докажу.', 'myth', 'h']],
      t: [['Эксперты советуют: «{myth}». Я против', 'myth']] },
    { k: 'tutorial', name: 'Туториал-затравка', trig: ['speed', 'simple'], base: [6, 5, 10, 7], why: 'Быстро, просто и сразу применимо — низкий порог входа.', vis: 'Руки и процесс с первого кадра.',
      v: [['Я научу тебя {want} за одну минуту — просто повторяй за мной.', 'want'], ['Сейчас покажу самый простой способ {want}: без опыта, без бюджета и без сложных инструментов.', 'want']],
      t: [['Как {want} за 1 минуту', 'want'], ['Простой способ {want}', 'want']] },
    { k: 'demo', name: 'Реакция / демонстрация', trig: ['curiosity', 'concrete'], base: [7, 8, 6, 6], why: 'Наглядное действие останавливает палец быстрее слов.', vis: 'Действие в кадре с нулевой секунды.',
      v: [['Смотри внимательно, что делает с результатом одна ошибка — {err}. Разница видна сразу.', 'err'], ['Смотри, что будет, если сделать наоборот, — покажу на живом примере, как {want}.', 'want']],
      t: [['Смотри, что делает {err}', 'err'], ['Смотри, что будет, если наоборот', 'name']] },
    { k: 'loop', name: 'Петля', trig: ['story', 'curiosity'], base: [5, 9, 6, 7], why: 'Финал в начале создаёт открытую петлю: зритель ждёт, как к этому пришли.', vis: 'Первый кадр — финальный результат.',
      v: [['Вот результат — {res}. А теперь смотри, с чего всё начиналось на самом деле.', 'res'], ['Это конец истории, где {pain}. Начало тебя удивит — оно связано с одной ошибкой.', 'pain']],
      t: [['Результат: {res}. Как я к нему пришёл(а)', 'res']] },
  ];

  /* ---------- 35 приёмов (справка) ---------- */
  const ARCHS = ['Обещание результата', 'Ошибка', 'Список', 'История', 'Исповедь', 'Разрушение мифа', 'Эксперимент', 'Кейс', 'А что если', 'Провокация', 'Прогноз', 'До/после', 'Сравнение', 'Шок-реакция', 'Демонстрация', 'Запрет', 'Секрет', 'Парадокс', 'Страх потери', 'Контраст'];

  const STRAT = { curiosity: ['secret', 'counter', 'trap', 'pov', 'analogy', 'demo', 'loop', 'challenge'], loss: ['pain', 'urgent', 'stat', 'fail', 'myth'], benefit: ['num', 'transform', 'tutorial', 'ba', 'auth'], provocation: ['provoke', 'myth', 'contra', 'stat', 'trap'], story: ['fail', 'ba', 'challenge', 'loop', 'pov', 'auth'] };
  const FORMAT = { edu: ['tutorial', 'num', 'myth', 'counter', 'analogy'], sale: ['ba', 'transform', 'pain', 'auth', 'urgent'], brand: ['fail', 'auth', 'provoke', 'contra', 'loop'], motivation: ['transform', 'fail', 'challenge', 'ba'], lifestyle: ['pov', 'demo', 'loop', 'analogy', 'challenge'] };
  const STRAT_NAMES = { auto: 'Авто-микс', curiosity: 'Любопытство', loss: 'Страх потери', benefit: 'Выгода', provocation: 'Провокация', story: 'История' };
  const FORMAT_NAMES = { edu: 'Обучение', sale: 'Продажа', brand: 'Личный бренд', motivation: 'Мотивация', lifestyle: 'Лайфстайл' };
  const WARM_NAMES = { cold: 'Холодная', warm: 'Тёплая', own: 'Свои подписчики' };
  const TONE_NAMES = { neutral: 'Нейтрально', hard: 'Жёстко', friendly: 'Дружелюбно', absurd: 'Абсурд', x18: '18+' };

  /* ---------- карта аудитории ---------- */
  let MAP = null;
  function mapOf(N) {
    if (!MAP) { MAP = {}; (window.VEKTOR_NICHE_MAP || '').trim().split('\n').forEach((l) => { const p = l.split('|'); if (p.length === 6) MAP[p[0]] = { pain5: p[1], fears: [p[2], p[3], p[4]], objs: p[5].split(';').map((x) => x.trim()) }; }); }
    const m = MAP[N.key] || { pain5: null, fears: ['потратишь время и деньги впустую', 'у тебя не получится', 'над тобой посмеются'], objs: ['это слишком дорого', 'у меня нет времени', 'у меня не получится'] };
    return { pains: N.pain.concat(m.pain5 ? [m.pain5] : []).slice(0, 5), wants: N.want.slice(0, 4), fears: m.fears.slice(0, 3), myths: N.myth.slice(0, 3), objs: m.objs.slice(0, 3), errs: N.err.slice(0, 4), res: N.res.slice(0, 4) };
  }

  /* ---------- сборка текста ---------- */
  const cap = (s) => (!s ? s : s.charAt(0) === '«' ? '«' + s.charAt(1).toUpperCase() + s.slice(2) : s.charAt(0).toUpperCase() + s.slice(1));
  const words = (s) => s.replace(/[—–-]\s/g, ' ').split(/\s+/).filter((w) => /[\p{L}\d]/u.test(w)).length;
  function plural(n, a, b, c) { const m10 = n % 10, m100 = n % 100; return m10 === 1 && m100 !== 11 ? a : m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20) ? b : c; }
  function fill(tpl, N, val, slot, r, map) {
    let s = tpl.replace(/\{k:([\d,]+)\|([^|}]+)\|([^|}]+)\|([^}]+)\}/g, (_, ns, a, b, c) => { const arr = ns.split(',').map(Number), n = arr[Math.floor(r() * arr.length)]; return `${n} ${plural(n, a, b, c)}`; });
    const pick = (arr) => arr[Math.floor(r() * arr.length)];
    const V = { pain: slot === 'pain' ? val : pick(map.pains), want: slot === 'want' ? val : pick(map.wants), res: slot === 'res' ? val : pick(map.res), err: slot === 'err' ? val : pick(map.errs), myth: slot === 'myth' ? val : pick(map.myths), fear: slot === 'fear' ? val : pick(map.fears), obj: slot === 'obj' ? val : pick(map.objs), act: N.act, doer: N.doer, aud: N.aud, audDat: N.audDat, audGen: N.audGen, about: N.about, inT: N.inT, name: N.name };
    s = s.replace(/\{(Pain|Err|Want|Res|Myth)\}/g, (_, k) => cap(V[k.toLowerCase()]));
    s = s.replace(/\{(\w+)\}/g, (m, k) => (k === 'name' ? (s.indexOf(m) === 0 || !/^[А-ЯЁ][а-яё]/.test(N.name) ? N.name : N.name.charAt(0).toLowerCase() + N.name.slice(1)) : V[k] != null ? V[k] : m));
    return cap(s.replace(/\s+/g, ' ').trim());
  }

  /* ---------- оценка СТОП ---------- */
  const RX = { num: /\d/, you: /(^|[^а-яё])(ты|тебе|тебя|твой|твоя|твои|твоё|тобой|твою|твоих)(?![а-яё])/iu, loop: /(покажу|в конце|до конца|почему|вот почему|оказалось|удивит|секрет|одна вещь|одну вещь|какую|что из этого|с чего)/i, now: /(сейчас|сегодня|пока не|успей|скоро|до конца недели|прямо сейчас|каждый день)/i, cliche: /(сегодня поговорим|в этом видео|хочешь узнать|^привет(?![а-яё]))/iu };
  function hash(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); }
  function score(f, text, o, tone) {
    let [S, T, O, P] = f.base;
    if (RX.num.test(text)) { O += 1; S += 0; }
    if (RX.you.test(text)) P += 1;
    if (RX.loop.test(text)) T += 1;
    if (RX.now.test(text)) S += 2;
    if (tone === 'h') { T += 1; S += 1; }
    if (o.warmth === 'own') P += 1;
    if (o.warmth === 'cold' && f.k === 'auth') P -= 1;
    const w = words(text);
    if (o.delivery === 'voice') { if (w < 10) { O -= 2; P -= 1; } else if (w > 22) { O -= 2; } }
    else if (w > 12) O -= 3;
    if (RX.cliche.test(text)) { S -= 4; T -= 3; }
    const j = hash(text) % 3 - 1; if (j > 0) T += 1; else if (j < 0) P -= 1;
    const c = (x) => Math.max(0, Math.min(10, x));
    const s = { С: c(S), Т: c(T), О: c(O), П: c(P) };
    s.total = s.С + s.Т + s.О + s.П;
    return s;
  }
  const level = (t) => (t >= 30 ? ['сильный', 'hi'] : t >= 22 ? ['рабочий', 'mid'] : ['слабый', 'lo']);

  function rng(seed) { let x = seed >>> 0 || 1; return () => ((x = (x * 1664525 + 1013904223) >>> 0) / 4294967296); }
  const slotValues = (map, slot) => ({ pain: map.pains, want: map.wants, res: map.res, err: map.errs, myth: map.myths, fear: map.fears, obj: map.objs, act: [null], name: [null] }[slot] || [null]);

  /** Пул всех хуков ниши для заданных параметров. */
  function pool(N, o) {
    const map = mapOf(N), out = [], seen = new Set();
    const toneOk = (t) => (o.tone === 'hard' ? t !== 'f' : o.tone === 'friendly' ? t !== 'h' : !t);
    F.forEach((f) => {
      (o.delivery === 'text' ? f.t : f.v).forEach((tp, ti) => {
        if (!toneOk(tp[2])) return;
        slotValues(map, tp[1]).forEach((val, vi) => {
          if (tp[3] === 'noyou' && val && /(^|[^а-яё])(ты|тебе|тебя)([^а-яё]|$)/iu.test(val)) return;
          const r = rng(hash(f.k + ti + vi + N.key));
          let text = fill(tp[0], N, val, tp[1], r, map);
          if (o.delivery === 'voice' && o.warmth === 'own' && ti % 2 === 0 && words(text) <= 18) text = 'Вы просили — рассказываю. ' + text;
          if (o.delivery === 'voice' && o.warmth === 'warm' && ti % 3 === 1 && words(text) <= 18) text = 'Если ты давно меня смотришь, это будет неожиданно. ' + text;
          if (seen.has(text)) return; seen.add(text);
          if (o.delivery === 'text' && words(text) > 12) return;
          if (o.delivery === 'voice' && words(text) > 26) return;
          let s = score(f, text, o, tp[2]);
          // контроль качества: ниже 25 — докручиваем открытой петлёй, иначе не выдаём
          if (s.total < 25 && o.delivery === 'voice' && !/покажу/i.test(text) && words(text) <= 18) { text = text.replace(/[.!]$/, '') + ' — сейчас покажу, в чём дело.'; s = score(f, text, o, tp[2]); }
          if (s.total < 25) return;
          out.push({ id: 's' + hash(text), text, f: f.k, formula: f.name, trig: f.trig.map((x) => TRIG[x]), s, why: f.why, vis: f.vis, slot: tp[1], val, tone: tp[2] || null });
        });
      });
    });
    // острые тоны — из библиотеки коротких хуков, с оценкой СТОП
    if (o.tone === 'absurd' || o.tone === 'x18') {
      const H = HK(); if (H) H.batch(N, { tone: o.tone, count: 200, seed: 7 }).items.forEach((h) => {
        if (seen.has(h.text)) return; seen.add(h.text);
        const f = { k: o.tone, base: o.tone === 'x18' ? [6, 8, 5, 8] : [5, 9, 5, 7] };
        const s = score(f, h.text, Object.assign({}, o, { delivery: 'text' }));
        out.push({ id: 's' + hash(h.text), text: h.text, f: o.tone, formula: o.tone === 'x18' ? '18+ провокация' : 'Абсурд', trig: ['Разрыв шаблона'], s, why: o.tone === 'x18' ? 'Грубое слово мгновенно выбивает из автопилота — но режет охваты на части площадок.' : 'Абсурд ломает ожидание, мозг останавливается понять, что происходит.', vis: 'Неожиданный предмет или реакция в кадре.', slot: 'name', val: null });
      });
      return out.filter((h) => h.f === o.tone);
    }
    return out;
  }

  /**
   * Партия хуков. o: { delivery:'voice'|'text', warmth, strategy, tone, format, used:Set, likes:{формула:число}, only30, count, seed }
   * Возвращает { items, total, left, top3 }. В партии — разные формулы и разные боли.
   */
  function batch(N, o) {
    o = Object.assign({ delivery: 'voice', warmth: 'cold', strategy: 'auto', tone: 'neutral', format: null, count: 20, seed: 1 }, o);
    const r = rng(o.seed);
    let p = pool(N, o);
    const total = p.length;
    if (o.used) p = p.filter((h) => !o.used.has(h.text));
    if (o.only30) p = p.filter((h) => h.s.total >= 30);
    const w = (h) => {
      let x = h.s.total / 10 + r() * 2.2;
      if (o.strategy && o.strategy !== 'auto' && STRAT[o.strategy]) x += STRAT[o.strategy].includes(h.f) ? 3 : -3;
      if (o.format && FORMAT[o.format] && FORMAT[o.format].includes(h.f)) x += 1.5;
      if (o.likes && o.likes[h.f]) x += Math.min(3, o.likes[h.f] * 1.2);
      return x;
    };
    p = p.map((h) => ({ h, w: w(h) })).sort((a, b) => b.w - a.w).map((x) => x.h);
    const out = [], fUse = {}, vUse = {};
    for (const pass of [1, 2, 3]) {
      for (const h of p) {
        if (out.length >= o.count) break;
        if (out.includes(h)) continue;
        const bonus = (o.likes && o.likes[h.f] ? Math.min(2, o.likes[h.f]) : 0) + (o.strategy && STRAT[o.strategy] && STRAT[o.strategy].includes(h.f) ? 2 : 0), fl = (pass === 1 ? 1 : pass === 2 ? 2 : 9) + bonus, vl = pass === 3 ? 9 : 2;
        if ((fUse[h.f] || 0) >= fl || (h.val && (vUse[h.val] || 0) >= vl)) continue;
        out.push(h); fUse[h.f] = (fUse[h.f] || 0) + 1; if (h.val) vUse[h.val] = (vUse[h.val] || 0) + 1;
      }
    }
    out.sort((a, b) => b.s.total - a.s.total);
    return { items: out, total, left: p.length - out.length, top3: top3(out) };
  }
  function top3(items) {
    const t = [], fs = new Set();
    for (const h of items) { if (t.length >= 3) break; if (fs.has(h.f)) continue; fs.add(h.f); t.push(h); }
    return t.map((h, i) => ({ h, n: items.indexOf(h) + 1, reason: i === 0 ? `Взял(а) бы первым — ${h.s.total}/40. ${h.why}` : `${h.s.total}/40. ${h.why}` }));
  }

  /* ---------- «Докрути №X»: агрессивнее, загадочнее, конкретнее ---------- */
  const TW = {
    agg: { pain: 'Хватит терпеть, что {pain}. Ты сам(а) это допускаешь — и сейчас я покажу где.', want: 'Если ты до сих пор не можешь {want}, проблема не в удаче — и я это докажу за минуту.', err: 'Если у тебя {err} — ты сам(а) себе вредишь, и вот почему это надо прекратить сегодня.', myth: 'Кто тебе сказал, что {myth}? Это полная ерунда, и сейчас я это докажу.', res: 'Ты можешь получить {res}, но не получишь, пока делаешь как все. Смотри.', fear: 'Ты боишься, что {fear}, и поэтому стоишь на месте. Хватит — смотри, что делать.', obj: '«{obj}» — это отговорка, и она стоит тебе денег. Сейчас объясню почему.', name: 'Сейчас будет неприятно, но кто-то должен тебе это сказать про {about}.' },
    mys: { pain: 'Есть одна причина, почему {pain}, — и о ней почти никто не говорит вслух.', want: 'Я знаю, как {want}, но сначала покажу, почему у большинства это не выходит.', err: 'Одна незаметная деталь — {err} — тихо ломает весь результат. Досмотри, и увидишь её.', myth: 'Говорят, что {myth}. Но есть кое-что, что меняет эту картину полностью.', res: 'За этим результатом — {res} — стоит одна вещь, которую я покажу в самом конце.', fear: 'Страх, что {fear}, появляется не просто так. Настоящая причина тебя удивит.', obj: 'Ты думаешь «{obj}»? Я тоже так думал(а), пока не узнал(а) одну вещь.', name: 'Есть одна вещь {about}, которую я понял(а) слишком поздно. Расскажу в конце.' },
    con: { pain: 'Когда {pain}, в 8 случаях из 10 виновата одна настройка — покажу её за 30 секунд.', want: 'Чтобы {want}, нужно три действия и 15 минут — показываю по шагам.', err: '{Err} — исправляется за 10 минут, и результат видно уже на следующий день.', myth: '«{myth}» — проверено на 38 клиентах: всё ровно наоборот. Вот цифры.', res: '{Res} — за 14 дней и без лишних трат. Вот точный план.', fear: 'Шанс, что {fear}, падает почти до нуля, если сделать две вещи. Показываю.', obj: '«{obj}»? Давай посчитаем за 20 секунд — цифры скажут сами.', name: 'Три цифры {about}, которые изменят твой подход уже сегодня.' },
  };
  function tweak(N, h, o) {
    o = Object.assign({ delivery: 'voice', warmth: 'cold' }, o);
    const map = mapOf(N), f = F.find((x) => x.k === h.f) || F[0], r = rng(hash(h.text));
    const slot = TW.agg[h.slot] ? h.slot : 'name';
    return ['agg', 'mys', 'con'].map((k) => {
      const text = fill(TW[k][slot], N, h.val, slot, r, map);
      const s = score(Object.assign({}, f, { base: f.base.map((b, i) => b + (k === 'agg' && i === 0 ? 1 : k === 'mys' && i === 1 ? 2 : k === 'con' && i === 2 ? 2 : 0)) }), text, o, k === 'agg' ? 'h' : null);
      return { kind: { agg: 'Агрессивнее', mys: 'Загадочнее', con: 'Максимально конкретно' }[k], text, s };
    });
  }

  /* ---------- режим «от сценария» ---------- */
  const EMO = [['страх', /(страш|боюсь|опасн|паник|риск|потерял|потеря)/i], ['удивление', /(оказалось|неожиданн|вдруг|не поверишь|шок|удивил)/i], ['надежда', /(получилось|смог|наконец|мечта|можно|реально)/i], ['злость', /(бесит|достал|хватит|обман|врут|раздраж)/i], ['любопытство', /(почему|как|секрет|что если|зачем)/i]];
  function sentences(t) { return t.replace(/\s+/g, ' ').split(/(?<=[.!?…])\s+/).map((x) => x.trim()).filter((x) => words(x) >= 3); }
  function parseScenario(text) {
    const S = sentences(text || '');
    if (!S.length) return null;
    const numRx = /(\d+(?:[.,]\d+)?\s?(?:%|процент[а-яё]*|руб[а-яё]*|₽|тыс[а-яё]*|млн|дн[а-яё]*|недел[а-яё]*|месяц[а-яё]*|лет|год[а-яё]*|час[а-яё]*|минут[а-яё]*|секунд[а-яё]*|клиент[а-яё]*|подписчик[а-яё]*|просмотр[а-яё]*|раз[а-яё]*|человек|заказ[а-яё]*|заяв[а-яё]*|продаж[а-яё]*)?)/giu;
    const nums = []; S.forEach((s) => { for (const m of s.matchAll(numRx)) nums.push({ phrase: m[1].trim().replace(/[.,]$/, ''), sentence: s }); });
    const pref = (arr, rx) => arr.filter((x) => rx.test(x)).concat(arr.filter((x) => !rx.test(x)));
    const turn = pref(S.filter((s) => /(оказалось|но |однако|а потом|вдруг|неожиданно|на самом деле|зато)/iu.test(s)), /оказалось|на самом деле/iu);
    const isInsight = (x) => /^(главное|секрет|суть|ключ|важно)/iu.test(x);
    const result = pref(S.filter((s) => !isInsight(s) && /(в итоге|в результате|получил|получилось|вырос|выросл|стало|теперь|смог)/iu.test(s)), /в итоге|в результате/iu);
    const mistake = S.filter((s) => /(ошибк|неправильн|не делай|никогда не|зря)/iu.test(s));
    const insight = S.find((s) => /(главное|секрет|суть|ключ|важно|потому что|дело в том)/iu.test(s)) || turn[0] || S[Math.min(1, S.length - 1)];
    const emoScores = EMO.map(([n, rx]) => [n, S.filter((s) => rx.test(s)).length]).sort((a, b) => b[1] - a[1]);
    const viewer = /(эксперт|мастер|блогер|предприниматель|родител|клиент|новичк)/i.exec(text) ? /(эксперт|мастер|блогер|предприниматель|родител|клиент|новичк)\w*/i.exec(text)[0] : 'тот, кто хочет того же результата';
    const topic = S[0].length > 90 ? S[0].slice(0, 87).replace(/\s\S*$/, '') + '…' : S[0];
    const details = [].concat(nums.map((n) => n.sentence), turn, result).filter((x, i, a) => a.indexOf(x) === i).slice(0, 5);
    const resultClause = result.length ? (clause(result[0], /(в итоге|в результате|итог:?)/iu) || low1(result[0].replace(/[.!?…]+$/, ''))) : null;
    let turnClause = turn.length ? clause(turn[0], /оказалось,?\s*(что)?/iu) || clause(turn[0], /(на самом деле|однако|но)\s/iu) : null;
    if (turnClause) turnClause = turnClause.split(/[:;]/)[0].trim();
    const insightClause = insight ? clause(insight, /(главное|секрет|суть|ключ|важно)\s*(—|-|:|в том, что|—\s*это)?/i) || low1(insight.replace(/[.!?…]+$/, '')) : null;
    const mistakeClause = mistake.length ? low1(mistake[0].replace(/[.!?…]+$/, '')) : null;
    return { topic, insight, nums, turn, result, mistake, emotion: emoScores[0][1] ? emoScores[0][0] : 'любопытство', viewer, details, gets: resultClause || insight, sentences: S, resultClause, turnClause, insightClause, mistakeClause, gender: genderOf(text) };
  }
  const short = (s, n) => { const w = s.replace(/[«»"]/g, '').split(' '); return w.length > n ? w.slice(0, n).join(' ') + '…' : s.replace(/[.!?]$/, ''); };
  const low1 = (x) => (x ? x.charAt(0).toLowerCase() + x.slice(1) : x);
  const clause = (sent, rx) => { const m = sent.match(rx); return m ? low1(sent.slice(m.index + m[0].length).replace(/^[\s,:—-]+/, '').replace(/[.!?…]+$/, '')) : null; };
  /** Род говорящего по сценарию: «я снимала» → ж, «я снимал» → м. */
  function genderOf(text) {
    const f = (text.match(/(^|[^а-яё])я\s+[а-яё]+(ла|лась)(?![а-яё])/giu) || []).length, m = (text.match(/(^|[^а-яё])я\s+[а-яё]+(л|лся)(?![а-яё])/giu) || []).length;
    return f > m ? 'f' : m > f ? 'm' : null;
  }
  function genderize(t, g) {
    if (!g) return t;
    return t.replace(/(\S*?)лся\(лась\)/g, (_, r) => r + (g === 'f' ? 'лась' : 'лся')).replace(/(\S+?)\((а|ла|на)\)/g, (_, r, e) => r + (g === 'f' ? e : ''));
  }
  function scenarioHooks(A, N, o) {
    o = Object.assign({ delivery: 'voice', warmth: 'cold', count: 20, used: null }, o);
    const g = o.gender || A.gender, out = [], v = o.delivery === 'voice';
    const add = (fk, text, why) => { if (!text) return; text = genderize(cap(text.replace(/\s+/g, ' ').trim()), g); if (o.used && o.used.has(text)) return; const f = F.find((x) => x.k === fk); const s2 = score(f, text, o); if (v && (words(text) < 8 || words(text) > 26)) return; if (!v && words(text) > 12) return; if (s2.total < 25) return; out.push({ id: 's' + hash(text), text, f: fk, formula: f.name, trig: f.trig.map((x) => TRIG[x]), s: s2, why: why || f.why, vis: f.vis, slot: 'name', val: null }); };
    const n = A.nums.map((x) => x.phrase), n1 = n[0], nl = n[n.length - 1], res = A.resultClause, turn = A.turnClause, ins = A.insightClause, mis = A.mistakeClause;
    const real = 'В хуке реальные цифры и повороты из твоего сценария — они цепляют сильнее выдуманных.';
    if (n.length >= 2) {
      add('ba', v ? `Раньше было ${n1}, а сейчас — ${nl}. Разница в одной вещи, и я покажу её прямо сейчас.` : `${n1} → ${nl}: что я поменял(а)`, real);
      add('num', v ? `Как из ${n1} сделать ${nl} — без бюджета и без новой техники. Покажу по шагам.` : `Из ${n1} в ${nl}. Как`, real);
      add('loop', v ? `Вот итог — ${nl}. А теперь смотри, с чего всё начиналось на самом деле.` : `Итог: ${nl}. Начало удивит`, real);
    }
    if (n.length) {
      add('stat', v ? `${cap(nl)} — звучит как случайность, но за этой цифрой стоит конкретная система. Сейчас покажу её.` : `${cap(nl)} — не случайность`, real);
      add('challenge', v ? `Я рискнул(а) поменять всего одну деталь — и получил(а) ${nl}. Смотри, что именно я сделал(а).` : `Одна деталь — и ${nl}`, real);
    }
    if (res) {
      add('transform', v ? `Я поменял(а) одну вещь в начале ролика — и ${res}. Сейчас покажу какую.` : `Одна правка — и ${short(res, 6)}`, real);
      add('pov', v ? `POV: ты меняешь одну деталь — и ${res}. Звучит как сказка, но я покажу, как это работает.` : `POV: ${short(res, 8)}`, real);
    }
    if (turn) {
      add('secret', v ? `Я долго не понимал(а), в чём дело, а оказалось, что ${turn}. Сейчас объясню, как это исправить.` : `Оказалось, ${short(turn, 8)}`, 'Поворот из сценария: зритель узнаёт свою ситуацию и хочет решение.');
      add('trap', v ? `Как думаешь, почему всё стояло на месте? Ответ тебя удивит — и он точно есть у тебя.` : 'Почему всё стояло? Ответ удивит');
      add('pain', v ? `Если ты делаешь всё правильно, а результата нет, — скорее всего, ${turn}. Проверь себя.` : 'Делаешь всё правильно, а результата нет?', 'Попадание в боль: зритель узнаёт себя и остаётся за решением.');
    }
    if (mis) add('fail', v ? `Моя ошибка стоила мне месяцев: ${short(mis, 10)}. Не повторяй — сейчас покажу, как правильно.` : `Ошибка, которая стоила месяцев`, real);
    if (ins) {
      add('myth', v ? `Все думают, что дело в количестве роликов, но главное совсем другое: ${short(ins, 10)}.` : 'Дело не в количестве. Главное — другое');
      add('provoke', v ? `Сейчас скажу то, что изменило мои результаты: ${short(ins, 10)}. И это не совет из курсов.` : `${cap(short(ins, 9))}`);
    }
    add('demo', v ? `Смотри внимательно на первые две секунды этого ролика — в них весь секрет моей истории.` : 'Смотри первые 2 секунды');
    add('urgent', v ? `Если ты сейчас в той же точке, где был(а) я, — посмотри это сегодня, пока не потратил(а) ещё месяц.` : 'Посмотри, пока не потратил(а) месяц');
    if (N) batch(N, Object.assign({}, o, { count: Math.max(0, o.count - out.length), seed: hash(A.topic) })).items.forEach((h) => out.push(Object.assign({}, h, { text: genderize(h.text, g) })));
    const uniq = []; const seen = new Set(); out.forEach((h) => { if (!seen.has(h.text)) { seen.add(h.text); uniq.push(h); } });
    const items = uniq.sort((a, b) => b.s.total - a.s.total).slice(0, o.count);
    return { items, top3: top3(items), total: uniq.length, left: 0 };
  }

  /* ---------- ИИ: промпт по полному ТЗ и разбор ответа ---------- */
  function aiPrompt(mode, o, N, scenario, map, prev) {
    const spec = window.VEKTOR_STOP_SPEC || '';
    const par = `Параметры: подача — ${o.delivery === 'text' ? 'текст на экране' : 'голосом в камеру'}; прогрев — ${WARM_NAMES[o.warmth] || 'холодная'}; стратегия — ${STRAT_NAMES[o.strategy] || 'авто-микс'}; тон — ${TONE_NAMES[o.tone] || 'нейтрально'}; формат контента — ${FORMAT_NAMES[o.format] || 'не указан'}.${o.likesText ? ' Пользователю понравились хуки: ' + o.likesText + ' — смести стиль в эту сторону.' : ''}${o.only30 ? ' Выдавай только хуки 30+.' : ''}`;
    const avoid = prev && prev.length ? `\nНе повторяй идеи и формулировки этих хуков: ${prev.slice(-60).map((t) => '«' + t + '»').join('; ')}` : '';
    const task = mode === 'scenario'
      ? `Режим «От сценария». Сценарий:\n"""${scenario.slice(0, 6000)}"""\nСделай разбор сценария и 20 хуков, ведущих именно в него.`
      : `Режим «От ниши». Ниша: ${N.name}. Аудитория: ${N.aud}. Карта аудитории (живые формулировки): боли — ${map.pains.join('; ')}; желания — ${map.wants.join('; ')}; страхи — ${map.fears.join('; ')}; мифы — ${map.myths.join('; ')}; возражения — ${map.objs.join('; ')}. Улучши карту при необходимости и напиши 20 хуков.`;
    const fmt = `Ответь СТРОГО одним JSON без пояснений вокруг:\n{"analysis":{"topic":"","insight":"","gets":"","details":[""],"emotion":"","viewer":""},"map":{"pains":[""],"wants":[""],"fears":[""],"myths":[""],"objections":[""]},"hooks":[{"text":"","formula":"","trigger":"","S":0,"T":0,"O":0,"P":0,"why":""}],"top3":[{"n":1,"reason":""}]}\nПоле analysis — только для режима «От сценария», map — только для режима «От ниши». S, T, O, P — оценки СТОП 0–10 (С — Сейчас, Т — Тайна, О — Обещание, П — Попадание). Хуки отсортируй по сумме, от сильного к слабому. Проведи внутренний контроль качества перед выдачей.`;
    return `${spec}\n\n---\n${par}\n${task}${avoid}\n\n${fmt}`;
  }
  function parseAi(text) {
    if (!text) return null;
    const a = text.indexOf('{'), b = text.lastIndexOf('}'); if (a < 0 || b < a) return null;
    let j; try { j = JSON.parse(text.slice(a, b + 1)); } catch (e) { return null; }
    if (!j || !Array.isArray(j.hooks)) return null;
    const c = (x) => Math.max(0, Math.min(10, Math.round(+x || 0)));
    const items = j.hooks.filter((h) => h && h.text).map((h) => { const s = { С: c(h.S), Т: c(h.T), О: c(h.O), П: c(h.P) }; s.total = s.С + s.Т + s.О + s.П; const f = F.find((x) => (h.formula || '').toLowerCase().includes(x.name.toLowerCase().split(' ')[0])); return { id: 'a' + hash(h.text), text: String(h.text).trim(), f: f ? f.k : 'ai', formula: h.formula || 'Формула ИИ', trig: [h.trigger || ''], s, why: h.why || '', vis: f ? f.vis : '', slot: 'name', val: null, ai: true }; }).sort((x, y) => y.s.total - x.s.total);
    const top = Array.isArray(j.top3) ? j.top3.map((t) => ({ n: +t.n, reason: t.reason, h: items[(+t.n || 1) - 1] })).filter((t) => t.h) : top3(items);
    return { items, top3: top, analysis: j.analysis || null, map: j.map || null };
  }

  return { genderize, genderOf, F, TRIG, ARCHS, STRAT, FORMAT, STRAT_NAMES, FORMAT_NAMES, WARM_NAMES, TONE_NAMES, mapOf, pool, batch, tweak, score, level, parseScenario, scenarioHooks, aiPrompt, parseAi, words };
})();
