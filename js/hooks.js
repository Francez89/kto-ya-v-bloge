/*
 * «Кто я в блоге?» — движок хуков.
 * Шаблон × формы ниши (js/niches.js) → сотни грамматически корректных хуков на нишу.
 * Внутренняя библиотека коротких хуков (для идей, плана, разбора и острых тонов). Основной экран хуков — js/stop.js (система СТОП).
 * Каждый шаблон размечен по ВИСП (В — выгода, И — интрига, С — срочность, П — польза),
 * по форматам (js/data.js FORMATS) и по архетипам — чтобы подбирать хуки под код креатора.
 *
 * Слоты: {name} {inT} {about} {doer} {aud} {audDat} {audGen} {act} — формы ниши,
 *        {res} {pain} {err} {myth} {want} — элементы списков ниши, {n} — число с правильным словом.
 */
window.VektorHooks = (function () {
  const T = [
    // ——— Польза
    ['{err} — главная ошибка {inT}. Показываю, как исправить', 'ПИ', 'expert,howto', 'sage,ruler,caregiver'],
    ['{n:3,5,7|ошибка|ошибки|ошибок} {inT}, из-за которых {pain}', 'ПИ', 'expert', 'sage,rebel'],
    ['Как {want} — пошагово за 60 секунд', 'ПВ', 'howto', 'sage,caregiver,ruler'],
    ['Сохрани: как {want} и не потратить лишнего', 'ПВ', 'howto', 'caregiver,everyman,ruler'],
    ['Чек-лист для {audGen}: проверь себя за минуту', 'П', 'howto,series', 'ruler,caregiver,sage'],
    ['Если {pain} — сделай это сегодня', 'ПС', 'howto', 'caregiver,hero'],
    ['Почему {pain} и что с этим делать', 'ПИ', 'expert', 'sage,caregiver'],
    ['Объясняю за 30 секунд, почему {pain}', 'ПИ', 'expert', 'sage'],
    ['Простой приём, чтобы {want}', 'ПВ', 'howto', 'magician,sage,innocent'],
    ['Что делать, если {pain}', 'П', 'howto,expert', 'caregiver,sage'],
    ['{err}? Вот как сделать правильно', 'П', 'expert,howto', 'sage,ruler'],
    ['{n:3,5|шаг|шага|шагов}, чтобы {want}', 'ПВ', 'howto', 'hero,sage,ruler'],
    ['{n:3,5,7|способ|способа|способов} {want}', 'ПВ', 'howto,expert', 'sage,explorer'],
    ['Ответ на самый частый вопрос {about}', 'П', 'expert,interview', 'sage,caregiver'],
    ['{n:3|вопроса|вопроса|вопросов} {about}, которые стесняются задать', 'ПИ', 'interview,expert', 'caregiver,everyman'],
    ['Не начинай {act}, пока не посмотришь это', 'ПС', 'howto', 'sage,caregiver'],
    ['Шпаргалка для {audGen} — сохрани, пригодится', 'П', 'howto,series', 'sage,ruler'],
    ['Что стоит знать, если только начинаешь {act}', 'П', 'expert,story', 'sage,innocent'],
    // ——— Выгода
    ['Как {want}: мой план на 30 дней', 'ВП', 'howto,series', 'hero,ruler'],
    ['{res}: показываю, как к этому прийти', 'ВИ', 'backstage,story', 'magician,hero'],
    ['Показываю результат: {res}', 'В', 'mood,backstage', 'lover,magician,creator'],
    ['Хочешь {want}? Начни с одного шага', 'ВП', 'howto', 'hero,caregiver,innocent'],
    ['Один приём — и в итоге {res}', 'ВИ', 'experiment,backstage', 'magician'],
    ['Как {want} и не выгореть', 'ВП', 'howto,story', 'caregiver,innocent'],
    ['{res}: сколько это стоит на самом деле', 'ВИ', 'expert', 'ruler,sage'],
    ['Было — стало: {res} за месяц', 'В', 'experiment,backstage', 'magician,hero'],
    ['{res} — и это проще, чем кажется', 'ВП', 'howto', 'innocent,magician,everyman'],
    ['Это видео сэкономит тебе месяцы ошибок {inT}', 'ВИ', 'expert', 'sage,ruler'],
    ['Как превратить «{pain}» в «{res}»', 'ВИ', 'story,experiment', 'magician,hero'],
    ['Смотри до конца: как {want}', 'ВИ', 'howto,experiment', 'magician'],
    ['Система, по которой работают лучшие {inT}', 'ВП', 'expert', 'ruler'],
    ['{name} за 0 ₽ и за 100 000 ₽ — в чём разница', 'ВИ', 'experiment,expert', 'ruler,explorer,jester'],
    // ——— Интрига
    ['Об этом {inT} молчат даже профессионалы', 'И', 'expert,reaction', 'rebel,sage,magician'],
    ['Миф: {myth}. Проверяю на практике', 'ИП', 'experiment', 'explorer,rebel,sage'],
    ['«{myth}» — правда или миф?', 'И', 'reaction,expert', 'sage,rebel'],
    ['Почему я больше не верю, что {myth}', 'И', 'story,reaction', 'rebel,sage'],
    ['Что на самом деле происходит, когда {pain}', 'ИП', 'expert', 'sage,magician'],
    ['Ты удивишься, почему {pain}', 'И', 'expert,reaction', 'magician,jester'],
    ['Секрет, о котором не рассказывают {audDat}', 'И', 'backstage,expert', 'magician,rebel'],
    ['{name} изнутри: что не показывают в ленте', 'И', 'backstage', 'everyman,magician,creator'],
    ['Самый странный совет {about}, который сработал', 'И', 'experiment', 'jester,explorer'],
    ['Никто не говорит правду о том, почему {pain}', 'И', 'reaction,expert', 'rebel'],
    ['Опрос: 100 человек ответили, почему {pain}. Неожиданно', 'ИП', 'interview', 'sage,everyman'],
    ['Почему {err} — это не мелочь', 'ИП', 'expert', 'sage,ruler'],
    ['Непопулярное мнение {about}', 'И', 'reaction', 'rebel,jester'],
    ['Разрушаю миф: {myth}', 'ИП', 'reaction,expert', 'rebel,sage'],
    ['Год назад: {pain}. Сегодня: {res}', 'ИВ', 'story', 'hero,magician'],
    ['История клиента: «{pain}» → «{res}»', 'ИВ', 'story,interview', 'caregiver,magician,hero'],
    ['7 дней проверяю популярный совет {about}', 'И', 'experiment,series', 'explorer,hero'],
    // ——— Срочность
    ['Срочно убери из работы: {err}', 'СП', 'reaction,howto', 'rebel,hero'],
    ['Хватит терпеть, что {pain}', 'СВ', 'reaction', 'hero,rebel'],
    ['Стоп. {err} — вот почему это вредит', 'СИ', 'reaction,expert', 'rebel,sage'],
    ['До конца ролика ты поймёшь, почему {pain}', 'СИ', 'expert', 'magician,sage'],
    ['Сделай это до конца недели, если хочешь {want}', 'СВ', 'howto,series', 'hero,ruler'],
    ['Если {pain}, не откладывай — вот что делать', 'СП', 'howto', 'caregiver,hero'],
    ['Сохрани прямо сейчас — завтра пригодится: как {want}', 'СП', 'howto', 'caregiver,sage'],
    ['Перестань это делать, если хочешь {want}', 'СВ', 'reaction,howto', 'rebel,hero'],
    ['Посмотри это перед тем, как {act}', 'СП', 'howto', 'sage,caregiver'],
    // ——— Истории, серии, настроение, юмор
    ['День 1 из 30: учусь {act} по-новому', 'ИС', 'series,experiment', 'hero,explorer'],
    ['Мой путь {inT}: от «{pain}» до «{res}»', 'ИВ', 'story', 'hero,creator'],
    ['Что я понял за годы работы {inT}', 'ИП', 'story', 'sage,hero'],
    ['Типичный новичок {inT} в трёх стадиях', 'И', 'series,story', 'jester,everyman'],
    ['Ожидание и реальность {inT}', 'И', 'mood,reaction', 'jester,everyman'],
    ['Когда тебе снова говорят, что {myth}', 'И', 'reaction', 'jester,rebel'],
    ['Эстетика процесса: {name} в деталях', 'В', 'mood,backstage', 'lover,creator'],
    ['Тихий ролик о том, почему я люблю своё дело — {name}', 'В', 'mood,story', 'lover,innocent'],
    ['Стандарт, ниже которого не опускается хороший {doer}', 'ВП', 'expert', 'ruler'],
    ['Как начать {act} с нуля в этом году', 'ПВ', 'howto,story', 'hero,innocent,explorer'],
    ['{name}: если начинать заново, то вот так', 'ПИ', 'story,expert', 'sage,hero'],
    ['Вопрос от подписчика: почему {pain}?', 'ПИ', 'interview', 'caregiver,everyman,sage'],
    ['Разбираю чужую ошибку: {err}', 'ПИ', 'reaction,expert', 'sage,ruler,rebel'],
    ['Рубрика «{name} за минуту»: выпуск 1', 'П', 'series', 'sage,ruler'],
    ['Честно о том, как {want}', 'ПВ', 'story,howto', 'everyman,innocent'],
    ['Как я работаю: {name} без прикрас', 'И', 'backstage', 'everyman,creator'],
    ['Неловкий момент {inT}, который остался в ролике', 'И', 'story,mood', 'jester,everyman'],
    ['Если бы {doer} говорил правду клиентам', 'И', 'reaction,series', 'jester,rebel'],
    ['{name}: что изменилось за последний год', 'ИП', 'expert', 'sage,explorer'],
    ['Магия процесса: путь к результату «{res}»', 'ВИ', 'backstage,mood', 'magician,creator,lover'],
    // ——— Сочетания (боль + желание, миф + желание и т. п.)
    ['Вместо «{pain}» — «{res}». Рассказываю, как', 'ВИ', 'story', 'magician,hero'],
    ['Было: {pain}. Стало: {res}', 'ВИ', 'story,experiment', 'magician,hero'],
    ['Путь к результату «{res}»: 3 шага', 'ВП', 'howto', 'hero,ruler'],
    ['Почему у одних {res}, а у других — нет', 'ИВ', 'expert', 'magician,sage'],
    // ——— Дополнительные одиночные
    ['Почему {pain}, даже если делаешь всё правильно', 'ИП', 'expert', 'sage'],
    ['Тебе не говорят, но «{myth}» — это миф', 'И', 'reaction', 'rebel'],
    ['Самая частая ошибка {audGen}: {err}', 'П', 'expert', 'sage,ruler'],
    ['{aud} спрашивают: как {want}?', 'П', 'interview', 'caregiver,everyman'],
    ['Мини-урок: как {want}', 'П', 'howto', 'sage'],
    ['Разбор за минуту: почему {pain}', 'П', 'expert', 'sage'],
    ['Если ты из {audGen} — это для тебя', 'И', 'expert,howto', 'caregiver,everyman'],
    ['Не повторяй чужую ошибку: {err}', 'ПС', 'story,reaction', 'everyman,hero'],
    ['{res}: как это выглядит изнутри', 'В', 'backstage', 'creator,magician'],
    ['{n:3,5|признак|признака|признаков}, что пора {want}', 'ИП', 'expert', 'sage'],
    ['{n:3,5|привычка|привычки|привычек}, которые помогают {want}', 'П', 'howto', 'sage,ruler'],
    ['Сделай так — и результат: {res}', 'ВП', 'howto', 'hero'],
    ['Это изменит твой взгляд на то, как {want}', 'И', 'expert', 'magician'],
    ['Вся правда о том, почему {pain}', 'И', 'reaction', 'rebel'],
    ['Как {want}, если совсем нет времени', 'П', 'howto', 'caregiver,ruler'],
    ['Как {want}, если ты только начинаешь', 'П', 'howto', 'innocent,caregiver'],
    ['Как {want} без больших вложений', 'ПВ', 'howto', 'everyman,ruler'],

    // ——— ПСИХОЛОГИЯ: 15 триггеров внимания (6-е поле — ключ триггера)
    ['В конце покажу, почему {pain}. Досмотри', 'ИП', 'expert', 'magician,sage', 'base', 'loop'],
    ['Третий пункт тебя удивит: {n:3,5|способ|способа|способов} {want}', 'ИП', 'howto', 'magician,sage', 'base', 'loop'],
    ['Пока ты листаешь ленту, кто-то уже знает, как {want}', 'СВ', 'howto,expert', 'hero,ruler', 'base', 'fomo'],
    ['Скоро это будут знать все {aud}. Как {want}', 'СИ', 'expert', 'magician,explorer', 'base', 'fomo'],
    ['Сколько ты теряешь из-за этого: {err}', 'СП', 'expert', 'ruler,sage', 'base', 'loss'],
    ['Что ты теряешь, пока {pain}', 'СИ', 'expert,reaction', 'ruler,hero', 'base', 'loss'],
    ['Так делают все, у кого {res}', 'ВП', 'expert,howto', 'ruler,everyman', 'base', 'social'],
    ['Мои клиенты пришли к результату «{res}». Вот как', 'ВИ', 'story,interview', 'caregiver,magician', 'base', 'social'],
    ['Как {doer} с опытом скажу честно: «{myth}» — это миф', 'ИП', 'expert,reaction', 'sage,ruler', 'base', 'authority'],
    ['Профессионалы {inT} первым делом проверяют это', 'ПИ', 'expert', 'sage,ruler', 'base', 'authority'],
    ['Это видео только для тех, кто хочет {want}', 'ВИ', 'howto,expert', 'ruler,caregiver', 'base', 'identity'],
    ['Если ты из {audGen}, которым надоело, что {pain}', 'ИП', 'expert', 'caregiver,everyman', 'base', 'identity'],
    ['Не смотри это, если не хочешь {want}', 'ИС', 'howto,reaction', 'rebel,jester', 'base', 'reverse'],
    ['Пролистывай, если тебя устраивает, что {pain}', 'ИС', 'reaction', 'rebel,hero', 'base', 'reverse'],
    ['Представь: {res}. А теперь смотри, как это сделать', 'ВИ', 'howto,mood', 'magician,lover', 'base', 'imagine'],
    ['Возможно, ты уже замечал(а), что {pain}', 'ИП', 'expert,story', 'magician,caregiver', 'base', 'imagine'],
    ['17 секунд — и ты поймёшь, почему {pain}', 'ИС', 'expert', 'sage,ruler', 'base', 'specific'],
    ['Одна цифра объясняет, почему {pain}', 'ИП', 'expert', 'sage', 'base', 'specific'],
    ['Делай меньше, если хочешь {want}', 'ИВ', 'expert,reaction', 'magician,rebel', 'base', 'paradox'],
    ['Чем больше стараешься {act}, тем хуже? Вот почему', 'ИП', 'expert', 'sage,magician', 'base', 'paradox'],
    ['Только не говори никому: как {want}', 'ИВ', 'backstage,howto', 'magician,jester', 'base', 'secret'],
    ['Профессиональная хитрость {inT}, которую не продают на курсах', 'ИП', 'backstage,expert', 'magician,rebel', 'base', 'secret'],
    ['Спорим, ты не знал(а), что «{myth}» — это миф?', 'И', 'reaction', 'jester,rebel', 'base', 'challenge'],
    ['Проверь себя: а ты сможешь {want}?', 'ИС', 'series,experiment', 'hero,explorer', 'base', 'challenge'],
    ['Ты тоже замечал(а), что {pain}?', 'И', 'story,interview', 'everyman,caregiver', 'base', 'mirror'],
    ['Узнаёшь себя? {err}', 'ИП', 'reaction,expert', 'everyman,jester', 'base', 'mirror'],
    ['Через год скажешь спасибо, если сегодня начнёшь {act} иначе', 'ВС', 'howto,story', 'hero,sage', 'base', 'future'],
    ['Пожалеешь, если начнёшь {act} без этого', 'СП', 'howto', 'sage,caregiver', 'base', 'future'],
    ['Стоп. Это не реклама. Это про то, почему {pain}', 'ИС', 'reaction', 'rebel,jester', 'base', 'break'],
    ['Я сделал(а) всё неправильно — и получил(а) «{res}»', 'ИВ', 'story', 'jester,explorer', 'base', 'break'],
    // ——— ЖЁСТКИЕ
    ['Жёстко, но честно: «{myth}» — сказка для новичков', 'ИС', 'reaction', 'rebel,ruler', 'hard'],
    ['Хватит ныть, что {pain}. Вот что реально работает', 'СП', 'reaction,howto', 'hero,rebel', 'hard'],
    ['Ты делаешь это неправильно: {err}', 'СП', 'reaction,expert', 'ruler,rebel', 'hard'],
    ['Перестань верить, что {myth}', 'СИ', 'reaction', 'rebel,sage', 'hard'],
    ['Не хочешь {want}? Тогда пролистывай', 'СВ', 'reaction', 'hero,rebel', 'hard'],
    ['Мне не понравится то, что я сейчас скажу {audDat}', 'И', 'reaction', 'rebel,ruler', 'hard'],
    ['Хочешь {want}? Забудь всё, чему тебя учили', 'ВИ', 'expert,reaction', 'rebel,magician', 'hard'],
    ['Да, я это скажу: {err} — признак дилетанта', 'СИ', 'reaction,expert', 'ruler,rebel', 'hard'],
    ['Дело не в тебе, а в этом: {err}', 'ИП', 'expert', 'ruler,sage', 'hard'],
    ['Неприятная правда: {pain} — и никто тебе этого не скажет', 'И', 'reaction', 'rebel,sage', 'hard'],
    ['Этот ролик разозлит половину {audGen}', 'И', 'reaction', 'rebel', 'hard'],
    ['Без этого даже не пытайся {act}', 'СП', 'expert,howto', 'ruler,hero', 'hard'],
    ['Тебе врали: {myth}', 'И', 'reaction', 'rebel', 'hard'],
    ['Хватит сливать деньги и время: {err}', 'СП', 'reaction,expert', 'ruler,hero', 'hard'],
    ['Скажу то, за что меня не любят коллеги {inT}', 'И', 'reaction,backstage', 'rebel,ruler', 'hard'],
    // ——— АБСУРД
    ['Объясняю {about} на примере пельменей', 'ИП', 'expert,howto', 'jester,creator', 'absurd'],
    ['Бабушка у подъезда объяснила мне {about} лучше любого курса', 'И', 'story,reaction', 'jester,everyman', 'absurd'],
    ['Спросил(а) у кота, почему {pain}. Он ответил взглядом', 'И', 'mood,reaction', 'jester', 'absurd'],
    ['Если {pain}, ретроградный Меркурий тут ни при чём', 'ИП', 'reaction,expert', 'jester,rebel', 'absurd'],
    ['{err} — это как есть суп вилкой', 'ИП', 'expert,reaction', 'jester', 'absurd'],
    ['Если бы {doer} работал в НАСА', 'И', 'series,mood', 'jester,creator', 'absurd'],
    ['{name} глазами инопланетянина', 'И', 'series,mood', 'jester,explorer', 'absurd'],
    ['Мама до сих пор уверена, что {myth}', 'И', 'story,reaction', 'jester,everyman', 'absurd'],
    ['Пять стадий принятия, когда {pain}', 'И', 'series,reaction', 'jester,everyman', 'absurd'],
    ['Уровень сложности: {want} в понедельник утром', 'И', 'mood,series', 'jester', 'absurd'],
    ['Это не реклама, это крик души: {err}', 'ИС', 'reaction', 'jester,rebel', 'absurd'],
    ['Пытаться {act} без этого — всё равно что играть в лотерею', 'ИП', 'expert', 'jester,sage', 'absurd'],
    ['Мой пёс знает {about} больше, чем интернет', 'И', 'mood,reaction', 'jester', 'absurd'],
    ['Ошибка «{err}» заслуживает отдельного фильма ужасов', 'И', 'reaction', 'jester', 'absurd'],
    ['Учёные до сих пор не объяснили, почему {pain}. А я объясню', 'ИП', 'expert', 'jester,sage', 'absurd'],
    // ——— 18+ (мат под звёздочками — для аудитории, которой это органично)
    ['Да е**ть, опять {pain}', 'И', 'reaction,mood', 'jester,rebel', 'x18'],
    ['Почему, бл**ь, никто не говорил, что «{myth}» — это миф?', 'И', 'reaction', 'rebel,jester', 'x18'],
    ['Ну нах*р этот миф: «{myth}»', 'И', 'reaction', 'rebel', 'x18'],
    ['П****ц, как просто {want}', 'ВИ', 'howto', 'jester,rebel', 'x18'],
    ['Хватит х**нёй страдать, если хочешь {want}', 'СВ', 'reaction,howto', 'rebel,hero', 'x18'],
    ['Это не ошибка, это п****ц: {err}', 'СИ', 'reaction', 'rebel,jester', 'x18'],
    ['З**бало, что {pain}? Смотри', 'СП', 'reaction,howto', 'rebel,everyman', 'x18'],
    ['Нах*р дорогие курсы. Вот как {want}', 'ВП', 'howto', 'rebel,everyman', 'x18'],
    ['Самый х**вый совет {about}: «{myth}»', 'И', 'reaction', 'rebel,jester', 'x18'],
    ['Ох**ть: {res} — и вот как', 'ВИ', 'backstage,story', 'jester,magician', 'x18'],
    ['Б**ть, сколько можно: {err}', 'С', 'reaction', 'rebel', 'x18'],
    ['Сорян за мат, но {err} — это п****ц', 'И', 'reaction', 'jester,rebel', 'x18'],
  ];
  const TPL = T.map((t, i) => ({ id: i, text: t[0], visp: t[1], fmts: t[2].split(','), arch: t[3].split(','), tone: t[4] || 'base', trig: t[5] || null }));
  const VISP = { В: 'Выгода', И: 'Интрига', С: 'Срочность', П: 'Польза' };
  const TONES = { base: 'Обычные', hard: 'Жёсткие', absurd: 'Абсурд', x18: '18+ с матом' };
  /** 15 психологических триггеров: как работает и когда использовать */
  const TRIGGERS = {
    loop: ['Незакрытая петля', 'Мозг не любит незавершённое (эффект Зейгарник): обещание ответа «в конце» держит до конца ролика.'],
    fomo: ['Страх упустить', 'Ощущение, что другие уже знают, а ты нет, заставляет остановиться.'],
    loss: ['Боязнь потери', 'Потерять неприятнее, чем приобрести то же самое: «ты теряешь» цепляет сильнее, чем «ты получишь».'],
    social: ['Социальное доказательство', '«Так делают те, у кого получилось» — мы ориентируемся на результат других.'],
    authority: ['Авторитет', 'Голос опыта и профессии повышает доверие к словам.'],
    identity: ['Идентичность', 'Человек останавливается, когда узнаёт в ролике «про себя».'],
    reverse: ['Обратная психология', 'Запрет вызывает желание сделать наоборот — досмотреть.'],
    imagine: ['Встроенная команда', '«Представь», «возможно, ты замечал» — мягко запускают воображение и согласие.'],
    specific: ['Конкретика', 'Точные цифры кажутся правдой и обещают быстрый ответ.'],
    paradox: ['Парадокс', 'Утверждение против здравого смысла ломает ожидание и вызывает вопрос «как это?».'],
    secret: ['Секрет', 'Закрытая информация «для своих» ценнее открытой.'],
    challenge: ['Вызов', 'Спор и проверка себя включают азарт.'],
    mirror: ['Узнавание', '«Ты тоже…» — зритель видит своё отражение и чувствует, что его поняли.'],
    future: ['Будущий я', 'Взгляд из будущего делает цену бездействия ощутимой.'],
    break: ['Разрыв шаблона', 'Неожиданное начало выбивает из автопилота пролистывания.'],
  };
  const plural = (n, a, b, c) => { const m = n % 10, h = n % 100; return m === 1 && h !== 11 ? a : m >= 2 && m <= 4 && (h < 10 || h >= 20) ? b : c; };
  const capFirst = (s) => s.replace(/^(«?)(\p{Ll})/u, (m, q, c) => q + c.toUpperCase());

  /** Все варианты одного шаблона для ниши. */
  function expand(tpl, N) {
    let outs = [tpl.text];
    const listSlots = ['res', 'pain', 'err', 'myth', 'want'];
    // числа
    outs = outs.flatMap((s) => { const m = s.match(/\{n:([\d,]+)\|([^|]+)\|([^|]+)\|([^}]+)\}/); if (!m) return [s]; return m[1].split(',').map((x) => s.replace(m[0], `${x} ${plural(+x, m[2], m[3], m[4])}`)); });
    // формы ниши
    outs = outs.map((s) => s.replace(/\{(name|inT|about|doer|aud|audDat|audGen|act)\}/g, (m, k) => (k === 'name' ? (s.indexOf(m) === 0 || !/^[А-ЯЁ][а-яё]/.test(N.name) ? N.name : N.name.charAt(0).toLowerCase() + N.name.slice(1)) : N[k])));
    // списки (каждый слот раскрывается во все варианты)
    for (const k of listSlots) {
      outs = outs.flatMap((s) => (s.includes('{' + k + '}') ? (N[k] || []).map((v) => s.split('{' + k + '}').join(v)) : [s]));
    }
    return outs.map((s) => capFirst(s.replace(/\s+/g, ' ').trim()));
  }

  /** Оценка по ВИСП 0–10 на компонент (как в генераторе хуков автора): главные метки шаблона дают высокий балл. */
  function score(tpl, text) {
    const base = { В: 6, И: 6, С: 5, П: 6 };
    tpl.visp.split('').forEach((l, i) => { base[l] = i === 0 ? 10 : 8; });
    if (/\d/.test(text)) base.П = Math.min(10, base.П + 1);
    if (/«/.test(text)) base.И = Math.min(10, base.И + 1);
    const words = text.split(/\s+/).length;
    const tot = base.В + base.И + base.С + base.П - (words > 14 ? 3 : words > 11 ? 1 : 0);
    return { В: base.В, И: base.И, С: base.С, П: base.П, total: Math.max(10, Math.min(40, tot)), words };
  }

  /** Полный пул хуков ниши с метаданными. */
  function pool(N) {
    const out = [], seen = new Set();
    TPL.forEach((t) => expand(t, N).forEach((text) => { if (seen.has(text) || text.split(/\s+/).length > 16) return; seen.add(text); out.push({ text, tpl: t.id, visp: t.visp, fmts: t.fmts, arch: t.arch, tone: t.tone, trig: t.trig, score: score(t, text) }); }));
    return out;
  }

  function rng(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
  /**
   * Следующая порция хуков без повторов.
   * opts: { visp: 'В'|'И'|'С'|'П'|null, tone: 'base'|'hard'|'absurd'|'x18'|'psy'|null, trig: ключ триггера|null, arch: [ключи архетипов]|null, fmts: [ключи]|null, used: Set(text), seed, count }
   */
  function batch(N, opts) {
    const o = Object.assign({ count: 10, used: new Set(), seed: 1 }, opts);
    let p = pool(N);
    if (o.visp) p = p.filter((h) => h.visp.includes(o.visp));
    // тон: по умолчанию все, кроме 18+; 'psy' — только психологические триггеры
    if (o.tone === 'psy') p = p.filter((h) => h.trig);
    else if (o.tone) p = p.filter((h) => h.tone === o.tone);
    else p = p.filter((h) => h.tone !== 'x18');
    if (o.trig) p = p.filter((h) => h.trig === o.trig);
    const rand = rng(o.seed);
    const weight = (h) => {
      let w = h.score.total / 40 + rand() * 0.8;
      if (o.arch && h.arch.some((a) => o.arch.includes(a))) w += o.arch.indexOf(h.arch.find((a) => o.arch.includes(a))) === 0 ? 0.7 : 0.4;
      if (o.fmts && h.fmts.some((f) => o.fmts.includes(f))) w += 0.3;
      return w;
    };
    const fresh = p.filter((h) => !o.used.has(h.text));
    const exhausted = fresh.length < o.count;
    const src = exhausted ? p : fresh;
    // не больше двух хуков из одного шаблона в порции — разнообразие
    const ranked = src.map((h) => [weight(h), h]).sort((a, b) => b[0] - a[0]).map((x) => x[1]);
    const res = [], perTpl = {};
    for (const h of ranked) { if ((perTpl[h.tpl] || 0) >= 1 && ranked.length > o.count * 3) continue; perTpl[h.tpl] = (perTpl[h.tpl] || 0) + 1; res.push(h); if (res.length >= o.count) break; }
    return { items: res, total: p.length, left: Math.max(0, fresh.length - res.length), exhausted };
  }

  /** Один хук под формат (для идей, плана, примеров). */
  function forFormat(N, fmtKey, seed, used, usedTpl) {
    const r = rng(seed || 1);
    let cand = pool(N).filter((h) => h.fmts.includes(fmtKey) && h.tone !== 'x18' && h.tone !== 'absurd' && !(used && used.has(h.text)));
    if (usedTpl) { const c2 = cand.filter((h) => !usedTpl.has(h.tpl)); if (c2.length) cand = c2; }
    if (!cand.length) return null;
    return cand[Math.floor(r() * cand.length)];
  }

  return { TPL, VISP, TONES, TRIGGERS, pool, batch, forFormat, expand, score, plural };
})();
