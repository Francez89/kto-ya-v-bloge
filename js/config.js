/*
 * Настройки приложения «Кто я в блоге?». Меняй только этот файл.
 */
window.VektorConfig = {
  appName: 'КТО Я?',
  analyticsEndpoint: '', // HTTPS URL of the deployed Worker + /analytics
  uniqUrl: 'https://t.me/uniqvideobot?start=stories', // known UNIQ link; configure dedicated attribution in UNIQ later
  // Ссылка на бота (после создания в @BotFather), например: 'https://t.me/vektor_navigator_bot'
  botUrl: 'https://t.me/kto_ya_v_bloge_bot',
  // Куда вести по кнопкам «Хочу» в тарифах и «Поддержка» — твой личный аккаунт или менеджер
  contactUrl: 'https://t.me/Enothor',
  // Твой Telegram-канал (кнопка в идеях и после результата). Пусто — кнопка скрыта
  channelUrl: 'https://t.me/a_shto_dalshe',
  // Адрес серверной прослойки для ИИ (см. worker/README). Пусто — встроенные ответы без ИИ
  aiEndpoint: '',
  // ИИ-разбор роликов по кадрам (тот же воркер, путь /analyze). Пусто — работает только разбор на устройстве
  analyzeEndpoint: '',
  // Напоминания тренажёра из бота (тот же воркер, путь /remind). Пусто — кнопка напоминаний скрыта
  remindEndpoint: '',
  // Куда отправлять оценки точности теста (тот же воркер, путь /feedback). Пусто — оценки сохраняются только на устройстве
  feedbackEndpoint: '',
  // Цены в звёздах Telegram. Те же числа задай в воркере (STARS_CODE, STARS_STRAT, STARS_PRO), иначе в счёте будет другая цена
  prices: { code: 149, strat: 399, pro: 449 },
  // ТЕСТ-ДРАЙВ: доступ ко всем локальным разделам открыт. Поставь false для возврата платных замков.
  openAll: true,
  // Платежи отключены на время тест-драйва. Никаких списаний.
  paymentsEnabled: false,
  testDrive: true, // enable only after production Worker/KV/webhook verification
  tariffs: [
    { key: 'free', name: 'Бесплатно', price: '0 ₽', items: ['Портрет по карте', 'Рейтинг форматов', 'Генератор идей', 'Раскадровка', 'План на 7 дней'], current: true },
    { key: 'report', name: 'Расширенный разбор', price: '490 ₽', items: ['Подробный портрет по всем планетам', 'Разбор сильных сторон в работе', 'PDF для сохранения'] },
    { key: 'pack', name: 'Контент-пакет', price: '990 ₽', items: ['Разбор + 20 идей под твою нишу', 'План на 30 дней', '5 сценариев с раскадровкой'] },
  ],
};
