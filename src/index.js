const CURRENCY_MAP = {
  EURUSD: "EUR", GBPUSD: "GBP", USDJPY: "JPY", USDCHF: "CHF",
  AUDUSD: "AUD", USDCAD: "CAD", NZDUSD: "NZD", EURGBP: "EUR",
  EURJPY: "EUR", GBPJPY: "GBP", AUDJPY: "AUD", EURAUD: "EUR",
  EURCAD: "EUR", EURCHF: "EUR", EURNZD: "EUR", GBPAUD: "GBP",
  GBPCAD: "GBP", GBPCHF: "GBP", AUDCAD: "AUD", AUDNZD: "AUD",
  CADJPY: "CAD", CHFJPY: "CHF", NZDJPY: "NZD", USDCNH: "CNY",
};
const DEFAULT_CURRENCIES = ["EURUSD", "GBPUSD", "USDJPY", "USDCHF", "AUDUSD", "USDCAD", "NZDUSD"];
const DEFAULT_IMPACT = ["high", "medium", "low"];
const DEFAULT_TZ = "Asia/Tehran";
const ALL_CODES = ["USD", "EUR", "GBP", "JPY", "CHF", "AUD", "CAD", "NZD", "CNY"];

const ALL_CURRENCIES = [
  { code: "EURUSD", flag: "\u{1F1EA}\u{1F1FA}" }, { code: "GBPUSD", flag: "\u{1F1EC}\u{1F1E7}" },
  { code: "USDJPY", flag: "\u{1F1EF}\u{1F1F5}" }, { code: "USDCHF", flag: "\u{1F1E8}\u{1F1ED}" },
  { code: "AUDUSD", flag: "\u{1F1E6}\u{1F1FA}" }, { code: "USDCAD", flag: "\u{1F1E8}\u{1F1E6}" },
  { code: "NZDUSD", flag: "\u{1F1F3}\u{1F1FF}" }, { code: "EURGBP", flag: "\u{1F1EA}\u{1F1FA}" },
  { code: "EURJPY", flag: "\u{1F1EA}\u{1F1FA}" }, { code: "GBPJPY", flag: "\u{1F1EC}\u{1F1E7}" },
  { code: "AUDJPY", flag: "\u{1F1E6}\u{1F1FA}" }, { code: "EURAUD", flag: "\u{1F1EA}\u{1F1FA}" },
  { code: "EURCAD", flag: "\u{1F1EA}\u{1F1FA}" }, { code: "EURCHF", flag: "\u{1F1EA}\u{1F1FA}" },
  { code: "EURNZD", flag: "\u{1F1EA}\u{1F1FA}" }, { code: "GBPAUD", flag: "\u{1F1EC}\u{1F1E7}" },
  { code: "GBPCAD", flag: "\u{1F1EC}\u{1F1E7}" }, { code: "GBPCHF", flag: "\u{1F1EC}\u{1F1E7}" },
  { code: "AUDCAD", flag: "\u{1F1E6}\u{1F1FA}" }, { code: "AUDNZD", flag: "\u{1F1E6}\u{1F1FA}" },
  { code: "CADJPY", flag: "\u{1F1E8}\u{1F1E6}" }, { code: "CHFJPY", flag: "\u{1F1E8}\u{1F1ED}" },
  { code: "NZDJPY", flag: "\u{1F1F3}\u{1F1FF}" },
];

const TIMEZONES = [
  { id: "America/New_York", label: "New York (EST)", offset: -5 },
  { id: "America/Chicago", label: "Chicago (CST)", offset: -6 },
  { id: "America/Los_Angeles", label: "Los Angeles (PST)", offset: -8 },
  { id: "America/Toronto", label: "Toronto (EST)", offset: -5 },
  { id: "America/Sao_Paulo", label: "Sao Paulo (BRT)", offset: -3 },
  { id: "America/Argentina/Buenos_Aires", label: "Buenos Aires (ART)", offset: -3 },
  { id: "America/Mexico_City", label: "Mexico City (CST)", offset: -6 },
  { id: "America/Bogota", label: "Bogota (COT)", offset: -5 },
  { id: "America/Lima", label: "Lima (PET)", offset: -5 },
  { id: "America/Santiago", label: "Santiago (CLT)", offset: -4 },
  { id: "America/Caracas", label: "Caracas (VET)", offset: -4 },
  { id: "America/Panama", label: "Panama (EST)", offset: -5 },
  { id: "America/Guayaquil", label: "Guayaquil (ECT)", offset: -5 },
  { id: "America/Manaus", label: "Manaus (AMT)", offset: -4 },
  { id: "America/Asuncion", label: "Asuncion (PYT)", offset: -4 },
  { id: "America/Montevideo", label: "Montevideo (UYT)", offset: -3 },
  { id: "Europe/London", label: "London (GMT)", offset: 0 },
  { id: "Europe/Berlin", label: "Berlin (CET)", offset: 1 },
  { id: "Europe/Paris", label: "Paris (CET)", offset: 1 },
  { id: "Europe/Madrid", label: "Madrid (CET)", offset: 1 },
  { id: "Europe/Rome", label: "Rome (CET)", offset: 1 },
  { id: "Europe/Amsterdam", label: "Amsterdam (CET)", offset: 1 },
  { id: "Europe/Zurich", label: "Zurich (CET)", offset: 1 },
  { id: "Europe/Vienna", label: "Vienna (CET)", offset: 1 },
  { id: "Europe/Stockholm", label: "Stockholm (CET)", offset: 1 },
  { id: "Europe/Warsaw", label: "Warsaw (CET)", offset: 1 },
  { id: "Europe/Bucharest", label: "Bucharest (EET)", offset: 2 },
  { id: "Europe/Athens", label: "Athens (EET)", offset: 2 },
  { id: "Europe/Istanbul", label: "Istanbul (TRT)", offset: 3 },
  { id: "Europe/Moscow", label: "Moscow (MSK)", offset: 3 },
  { id: "Europe/Kiev", label: "Kiev (EET)", offset: 2 },
  { id: "Asia/Dubai", label: "Dubai (GST)", offset: 4 },
  { id: "Asia/Qatar", label: "Qatar (AST)", offset: 3 },
  { id: "Asia/Bahrain", label: "Bahrain (AST)", offset: 3 },
  { id: "Asia/Kuwait", label: "Kuwait (AST)", offset: 3 },
  { id: "Asia/Riyadh", label: "Riyadh (AST)", offset: 3 },
  { id: "Asia/Tehran", label: "Tehran (IRST)", offset: 3.5 },
  { id: "Asia/Karachi", label: "Karachi (PKT)", offset: 5 },
  { id: "Asia/Kolkata", label: "Mumbai (IST)", offset: 5.5 },
  { id: "Asia/Dhaka", label: "Dhaka (BST)", offset: 6 },
  { id: "Asia/Bangkok", label: "Bangkok (ICT)", offset: 7 },
  { id: "Asia/Singapore", label: "Singapore (SGT)", offset: 8 },
  { id: "Asia/Hong_Kong", label: "Hong Kong (HKT)", offset: 8 },
  { id: "Asia/Shanghai", label: "Shanghai (CST)", offset: 8 },
  { id: "Asia/Tokyo", label: "Tokyo (JST)", offset: 9 },
  { id: "Asia/Seoul", label: "Seoul (KST)", offset: 9 },
  { id: "Asia/Jakarta", label: "Jakarta (WIB)", offset: 7 },
  { id: "Asia/Kuala_Lumpur", label: "Kuala Lumpur (MYT)", offset: 8 },
  { id: "Asia/Manila", label: "Manila (PHT)", offset: 8 },
  { id: "Asia/Taipei", label: "Taipei (CST)", offset: 8 },
  { id: "Asia/Ho_Chi_Minh", label: "Ho Chi Minh (ICT)", offset: 7 },
  { id: "Africa/Cairo", label: "Cairo (EET)", offset: 2 },
  { id: "Africa/Algiers", label: "Algiers (CET)", offset: 1 },
  { id: "Africa/Lagos", label: "Lagos (WAT)", offset: 1 },
  { id: "Africa/Johannesburg", label: "Johannesburg (SAST)", offset: 2 },
  { id: "Africa/Nairobi", label: "Nairobi (EAT)", offset: 3 },
  { id: "Africa/Casablanca", label: "Casablanca (WET)", offset: 0 },
];

// ---- Market Sessions (UTC hours) ----
const SESSIONS = [
  { name: "Sydney", icon: "\u{1F30F}", open: 22, close: 7, currencies: ["AUD", "NZD"] },
  { name: "Tokyo", icon: "\u{1F5FC}", open: 0, close: 9, currencies: ["JPY"] },
  { name: "London", icon: "\u{1F5FC}", open: 8, close: 17, currencies: ["EUR", "GBP", "CHF"] },
  { name: "New York", icon: "\u{1F3FA}", open: 13, close: 22, currencies: ["USD", "CAD"] },
];

function getSessionsStatus(tzOffset) {
  const now = new Date();
  const utcH = now.getUTCHours();
  const utcM = now.getUTCMinutes();
  const currentMin = utcH * 60 + utcM;
  return SESSIONS.map(s => {
    const openMin = s.open * 60;
    const closeMin = s.close * 60;
    let isOpen;
    if (openMin < closeMin) {
      isOpen = currentMin >= openMin && currentMin < closeMin;
    } else {
      isOpen = currentMin >= openMin || currentMin < closeMin;
    }
    // Convert open/close to user timezone
    const toTz = (min) => {
      const adj = ((min + tzOffset * 60) % 1440 + 1440) % 1440;
      return `${String(Math.floor(adj / 60)).padStart(2, "0")}:${String(adj % 60).padStart(2, "0")}`;
    };
    return { ...s, isOpen, localOpen: toTz(openMin), localClose: toTz(closeMin) };
  });
}

// ---- TradingView Links ----
function tvLink(pair) { return `https://www.tradingview.com/symbols/${pair}/`; }

const TV_DEFAULT = { EUR: "EURUSD", GBP: "GBPUSD", JPY: "USDJPY", CHF: "USDCHF", AUD: "AUDUSD", CAD: "USDCAD", NZD: "NZDUSD", USD: "DXY", CNY: "USDCNH", HKD: "USDHKD", MXN: "USDMXN", ZAR: "USDZAR", TRY: "USDTRY", SEK: "USDSEK", NOK: "USDNOK", SGD: "USDSGD", THB: "USDTHB", PLN: "USDPLN", HUF: "USDHUF", CZK: "USDCZK" };

// ---- Translations ----
const TR = {
  en: {
    welcome: "Welcome {name}!",
    desc: "Professional economic news for traders.",
    news_today: "News Today",
    news_tomorrow: "News Tomorrow",
    sessions: "Market Sessions",
    settings: "Settings",
    help: "Help",
    back: "Back",
    currencies: "Currency Pairs",
    toggle_hint: "Toggle on/off",
    impact: "Impact Levels",
    schedule: "Auto-Send Schedule",
    timezone: "Timezone",
    lang: "Language",
    custom_events: "Custom Event Alerts",
    breaking: "Breaking News Alerts",
    pre_alerts: "Pre-Release Alerts",
    today_time: "Today",
    tomorrow_time: "Tomorrow",
    set_time: "Set Time",
    no_news: "No matching events found.",
    source: "Source: Forex Factory",
    open: "OPEN",
    closed: "CLOSED",
    sessions_title: "Market Sessions",
    trading_view: "TradingView Chart",
    subscribe: "Subscribe",
    unsubscribe: "Unsubscribe",
    alert_on: "ON",
    alert_off: "OFF",
    minutes_before: "min before",
  },
  fa: {
    welcome: "\u{062E}\u{0648}\u{0634} \u{0622}\u{0645}\u{062F} {name}!",
    desc: "\u{0627}\u{062E}\u{0628}\u{0627}\u{0631} \u{0627}\u{0642}\u{062A}\u{0635}\u{0627}\u{062F}\u{06CC} \u{0628}\u{0631}\u{0627}\u{06CC} \u{062A}\u{0631}\u{0627}\u{062F}\u{06AF}\u{0631}\u{0627}\u{0646}.",
    news_today: "\u{0627}\u{062E}\u{0628}\u{0627}\u{0631} \u{0627}\u{0645}\u{0631}\u{0648}\u{0632}",
    news_tomorrow: "\u{0627}\u{062E}\u{0628}\u{0627}\u{0631} \u{0641}\u{0631}\u{062F}\u{0627}",
    sessions: "\u{0633}\u{0626}\u{0633}\u{062A} \u{0628}\u{0627}\u{0632}\u{0627}\u{0631}\u{0647}\u{0627}",
    settings: "\u{062A}\u{0646}\u{0638}\u{06CC}\u{0645}\u{0627}\u{062A}",
    help: "\u{0631}\u{0627}\u{0647}\u{0646}\u{0645}\u{0627}",
    back: "\u{0628}\u{0627}\u{0632}\u{06AF}\u{0634}\u{062A}\u{0646}",
    currencies: "\u{062C}\u{0641}\u{0639} \u{0627}\u{0631}\u{0632}",
    toggle_hint: "\u{0641}\u{0639}\u{0627}\u{0644}/\u{063A}\u{06CC}\u{0631}\u{0641}\u{0639}\u{0644} \u{06A9}\u{0631}\u{062F}\u{0646}",
    impact: "\u{0633}\u{0637}\u{0648}\u{062D} \u{062A}\u{0623}\u{062B}\u{0631}",
    schedule: "\u{0632}\u{0645}\u{0627}\u{0646}\u{0628}\u{0646}\u{062F}\u{06CC} \u{062E}\u{0648}\u{062F}\u{06A9}\u{0627}\u{0631}",
    timezone: "\u{0645}\u{0646}\u{0637}\u{0642}\u{0647} \u{0632}\u{0645}\u{0627}\u{0646}\u{06CC}",
    lang: "\u{0632}\u{0628}\u{0627}\u{0646}",
    custom_events: "\u{0647}\u{0634}\u{062F}\u{0627}\u{0631} \u{0633}\u{0641}\u{0627}\u{0631}\u{0634}\u{06CC}",
    breaking: "\u{0627}\u{062E}\u{0628}\u{0627}\u{0631} \u{0641}\u{0648}\u{0631}\u{06CC}",
    pre_alerts: "\u{0647}\u{0634}\u{062F}\u{0627}\u{0631} \u{0642}\u{0628}\u{0644} \u{0627}\u{0632} \u{0627}\u{0646}\u{062A}\u{0634}\u{0627}\u{0631}",
    today_time: "\u{0627}\u{0645}\u{0631}\u{0648}\u{0632}",
    tomorrow_time: "\u{0641}\u{0631}\u{062F}\u{0627}",
    set_time: "\u{0637}\u{0631}\u{062D} \u{0632}\u{0645}\u{0627}\u{0646}",
    no_news: "\u{062E}\u{0628}\u{0631}\u{06CC} \u{06CC}\u{0627}\u{0641}\u{062A} \u{0646}\u{0634}\u{062F}.",
    source: "\u{0645}\u{0646}\u{0628}\u{0639}: Forex Factory",
    open: "\u{0628}\u{0627}\u{0632}",
    closed: "\u{0628}\u{0633}\u{062A}\u{0647}",
    sessions_title: "\u{0633}\u{0626}\u{0633}\u{062A} \u{0628}\u{0627}\u{0632}\u{0627}\u{0631}\u{0647}\u{0627}",
    trading_view: "\u{0646}\u{0645}\u{0648}\u{062F}\u{0631} TradingView",
    subscribe: "\u{0639}\u{0636}\u{0648}",
    unsubscribe: "\u{0644}\u{063A}\u{0648}",
    alert_on: "\u{062E}\u{0648}\u{0634}",
    alert_off: "\u{062E}\u{0627}\u{0645}\u{0648}\u{0634}",
    minutes_before: "\u{062F}\u{0642}\u{06CC}\u{0642}\u{0647} \u{0642}\u{0628}\u{0644}",
  },
  ar: {
    welcome: "\u0645\u0631\u062D\u0628\u064B\u0627 {name}!",
    desc: "\u0623\u062E\u0628\u0627\u0631 \u0627\u0644\u0623\u0642\u062A\u0635\u0627\u062F \u0644\u0644\u0645\u062A\u062F\u0627\u0648\u0644\u064A\u0646.",
    news_today: "\u0623\u062E\u0628\u0627\u0631 \u0627\u0644\u064A\u0648\u0645",
    news_tomorrow: "\u0623\u062E\u0628\u0627\u0631 \u063A\u062F\u064B\u0627",
    sessions: "\u062C\u0644\u0633\u0627\u062A \u0627\u0644\u0633\u0648\u0642",
    settings: "\u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A",
    help: "\u0627\u0644\u0645\u0633\u0627\u0639\u062F\u0629",
    back: "\u0631\u062C\u0648\u0639",
    currencies: "\u0627\u0644\u0639\u0645\u0644\u0627\u062A",
    toggle_hint: "\u062A\u0641\u0639\u064A\u0644/\u062A\u0639\u0637\u064A\u0644",
    impact: "\u0645\u0633\u062A\u0648\u064A \u0627\u0644\u062A\u0623\u062B\u0631",
    schedule: "\u062C\u062F\u0648\u0644 \u0627\u0644\u0625\u0631\u0633\u0627\u0644",
    timezone: "\u0627\u0644\u0645\u0646\u0637\u0642\u0629 \u0627\u0644\u0632\u0645\u0646\u064A\u0629",
    lang: "\u0627\u0644\u0644\u063A\u0629",
    custom_events: "\u062A\u0646\u0628\u064A\u0647\u0627\u062A",
    breaking: "\u0623\u062E\u0628\u0627\u0631 \u0639\u0627\u062C\u0644\u0629",
    pre_alerts: "\u062A\u0646\u0628\u064A\u0647 \u0642\u0628\u0644",
    today_time: "\u0627\u0644\u064A\u0648\u0645",
    tomorrow_time: "\u063A\u062F\u064B\u0627",
    set_time: "\u062A\u062D\u062F\u064A\u062F \u0627\u0644\u0648\u0642\u062A",
    no_news: "\u0644\u0627 \u062A\u0648\u062C\u062F \u0623\u062E\u0628\u0627\u0631.",
    source: "\u0627\u0644\u0645\u0635\u062F\u0631: Forex Factory",
    open: "\u0645\u0641\u062A\u0648\u062D",
    closed: "\u0645\u063a\u0644\u0642",
    sessions_title: "\u062c\u0644\u0633\u0627\u062a \u0627\u0644\u0633\u0648\u0642",
    trading_view: "TradingView",
    subscribe: "\u0627\u0634\u062a\u0631\u0627\u0643",
    unsubscribe: "\u0627\u0644\u0625\u0644\u063a\u0627\u0621",
    alert_on: "\u0645\u0641\u062a\u0648\u062d",
    alert_off: "\u0645\u063a\u0644\u0642",
    minutes_before: "\u062f\u0642\u064a\u0642\u0629 \u0642\u0628\u0644",
  },
  ru: {
    welcome: "\u0414\u043E\u0431\u0440\u043E, {name}!",
    desc: "\u041F\u0440\u043E\u0444\u0435\u0441\u0441\u0438\u043E\u043D\u0430\u043B\u044C\u043D\u044B\u0435 \u043D\u043E\u0432\u043E\u0441\u0442\u0438 \u0434\u043B\u044F \u0442\u0440\u0435\u0439\u0434\u0435\u0440\u043E\u0432.",
    news_today: "\u041D\u043E\u0432\u043E\u0441\u0442\u0438 \u0441\u0435\u0433\u043E\u0434\u043D\u044F",
    news_tomorrow: "\u041D\u043E\u0432\u043E\u0441\u0442\u0438 \u0437\u0430\u0432\u0442\u0440\u0430",
    sessions: "\u0421\u0435\u0441\u0441\u0438\u0438 \u0440\u044B\u043D\u043A\u0430",
    settings: "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438",
    help: "\u041F\u043E\u043C\u043E\u0449\u044C",
    back: "\u041D\u0430\u0437\u0430\u0434",
    currencies: "\u0412\u0430\u043B\u044E\u0442\u044B",
    toggle_hint: "\u0412\u043A\u043B/\u0412\u044B\u043A\u043B",
    impact: "\u0423\u0440\u043E\u0432\u0435\u043D\u044C \u0432\u043B\u0438\u044F\u043D\u0438\u044F",
    schedule: "\u0420\u0430\u0441\u043F\u0438\u0441\u0430\u043D\u0438\u0435",
    timezone: "\u0427\u0430\u0441\u043E\u0432\u043E\u0439 \u043F\u043E\u044F\u0441",
    lang: "\u042F\u0437\u044B\u043A",
    custom_events: "\u041F\u043E\u0434\u043F\u0438\u0441\u043A\u0438",
    breaking: "\u0421\u0440\u043E\u0447\u043D\u044B\u0435 \u043D\u043E\u0432\u043E\u0441\u0442\u0438",
    pre_alerts: "\u041F\u0440\u0435\u0434\u0443\u043F\u0440\u0435\u0436\u0434\u0435\u043D\u0438\u044F",
    today_time: "\u0421\u0435\u0433\u043E\u0434\u043D\u044F",
    tomorrow_time: "\u0417\u0430\u0432\u0442\u0440\u0430",
    set_time: "\u0423\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u044C",
    no_news: "\u041D\u043E\u0432\u043E\u0441\u0442\u0435\u0439 \u043D\u0435\u0442.",
    source: "\u0418\u0441\u0442\u043E\u0447\u043D\u0438\u043A: Forex Factory",
    open: "\u041E\u0442\u043A\u0440\u044B\u0442\u043E",
    closed: "\u0417\u0430\u043A\u0440\u044B\u0442\u043E",
    sessions_title: "\u0421\u0435\u0441\u0441\u0438\u0438 \u0440\u044B\u043D\u043A\u0430",
    trading_view: "TradingView",
    subscribe: "\u041F\u043E\u0434\u043F\u0438\u0441\u0430\u0442\u044C\u0441\u044F",
    unsubscribe: "\u041E\u0442\u043F\u0438\u0441\u0430\u0442\u044C\u0441\u044F",
    alert_on: "\u0412\u043A\u043B",
    alert_off: "\u0412\u044B\u043A\u043B",
    minutes_before: "\u043C\u0438\u043D \u0434\u043E",
  },
  es: {
    welcome: "\u{00A1}Bienvenido {name}!",
    desc: "Noticias econ\u00F3micas profesionales para traders.",
    news_today: "Noticias de Hoy",
    news_tomorrow: "Noticias de Ma\u00F1ana",
    sessions: "Sesiones del Mercado",
    settings: "Configuraci\u00F3n",
    help: "Ayuda",
    back: "Atr\u00E1s",
    currencies: "Pares de Divisas",
    toggle_hint: "Activar/Desactivar",
    impact: "Nivel de Impacto",
    schedule: "Horario Autom\u00E1tico",
    timezone: "Zona Horaria",
    lang: "Idioma",
    custom_events: "Alertas Personalizadas",
    breaking: "Noticias de Ultima Hora",
    pre_alerts: "Alertas Previas",
    today_time: "Hoy",
    tomorrow_time: "Ma\u00F1ana",
    set_time: "Establecer Hora",
    no_news: "No hay noticias.",
    source: "Fuente: Forex Factory",
    open: "ABIERTO",
    closed: "CERRADO",
    sessions_title: "Sesiones del Mercado",
    trading_view: "Gr\u00E1fico TradingView",
    subscribe: "Suscribir",
    unsubscribe: "Cancelar",
    alert_on: "ACTIVADO",
    alert_off: "DESACTIVADO",
    minutes_before: "min antes",
  },
  zh: {
    welcome: "\u{6B22}\u{8FCE} {name}\uFF01",
    desc: "\u{4E13}\u{4E1A}\u{7ECF}\u{6D4E}\u{65B0}\u{95FB}\u{670D}\u{52A1}",
    news_today: "\u{4ECA}\u{65E5}\u{65B0}\u{95FB}",
    news_tomorrow: "\u{660E}\u{65E5}\u{65B0}\u{95FB}",
    sessions: "\u{5E02}\u{573A}\u{65F6}\u{6BB5}",
    settings: "\u{8BBE}\u{7F6E}",
    help: "\u{5E2E}\u{52A9}",
    back: "\u{8FD4}\u{56DE}",
    currencies: "\u{8D27}\u{5E01}\u{5BF9}",
    toggle_hint: "\u{5F00}\u{5173}",
    impact: "\u{5F71}\u{54CD}\u{7B49}\u{7EA7}",
    schedule: "\u{81EA}\u{52A8}\u{65F6}\u{95F4}",
    timezone: "\u{65F6}\u{533A}",
    lang: "\u{8BED}\u{8A00}",
    custom_events: "\u{81EA}\u{5B9A}\u{4E49}\u{63D0}\u{9192}",
    breaking: "\u{7A81}\u{53D1}\u{65B0}\u{95FB}",
    pre_alerts: "\u{9884}\u{8B66}\u{62A5}",
    today_time: "\u{4ECA}\u{5929}",
    tomorrow_time: "\u{660E}\u{5929}",
    set_time: "\u{8BBE}\u{7F6E}\u{65F6}\u{95F4}",
    no_news: "\u{65E0}\u{65B0}\u{95FB}",
    source: "\u{6765}\u{6E90}: Forex Factory",
    open: "\u{5F00}\u{76D8}",
    closed: "\u{6536}\u{76D8}",
    sessions_title: "\u{5E02}\u{573A}\u{65F6}\u{6BB5}",
    trading_view: "TradingView",
    subscribe: "\u{8BA2}\u{9605}",
    unsubscribe: "\u{53D6}\u{6D88}",
    alert_on: "\u{5F00}",
    alert_off: "\u{5173}",
    minutes_before: "\u{5206}\u{949F}\u{524D}",
  },
  ja: {
    welcome: "\u{3088}\u{3046}\u{3053}\u{305D} {name}\uFF01",
    desc: "\u{30C8}\u{30EC}\u{30FC}\u{30C0}\u{30FC}\u{5411}\u{3051}\u{7D4C}\u{6E08}\u{30CB}\u{30E5}\u{30FC}\u{30B9}",
    news_today: "\u{4ECA}\u{65E5}\u{306E}\u{30CB}\u{30E5}\u{30FC}\u{30B9}",
    news_tomorrow: "\u{660E}\u{65E5}\u{306E}\u{30CB}\u{30E5}\u{30FC}\u{30B9}",
    sessions: "\u{5E02}\u{5834}\u{30BB}\u{30C3}\u{30B7}\u{30E7}\u{30F3}",
    settings: "\u{8A2D}\u{5B9A}",
    help: "\u{30DB}\u{30C3}\u{30D7}",
    back: "\u{623B}\u{308B}",
    currencies: "\u{901A}\u{8CA8}\u{30D1}\u{30A4}\u{30A8}",
    toggle_hint: "\u{30AA}\u{30F3}/\u{30AA}\u{30D5}",
    impact: "\u{5F71}\u{97FF}\u{30EC}\u{30D9}\u{30EB}",
    schedule: "\u{81EA}\u{52D5}\u{914D}\u{4FE1}",
    timezone: "\u{30BF}\u{30A4}\u{30E0}\u{30BE}\u{30FC}\u{30F3}",
    lang: "\u{8A00}\u{8A9E}",
    custom_events: "\u{30AB}\u{30B9}\u{30BF}\u{30E0}\u{901A}\u{77E5}",
    breaking: "\u{901A}\u{77E5}",
    pre_alerts: "\u{4E88}\u{544A}",
    today_time: "\u{4ECA}\u{65E5}",
    tomorrow_time: "\u{660E}\u{65E5}",
    set_time: "\u{8A2D}\u{5B9A}",
    no_news: "\u{30CB}\u{30E5}\u{30FC}\u{30B9}\u{306A}\u{3057}",
    source: "\u{51FA}\u{5178}: Forex Factory",
    open: "\u{958B}\u{50AC}",
    closed: "\u{7D42}\u{4E86}",
    sessions_title: "\u{5E02}\u{5834}\u{30BB}\u{30C3}\u{30B7}\u{30E7}\u{30F3}",
    trading_view: "TradingView",
    subscribe: "\u{767B}\u{9332}",
    unsubscribe: "\u{767B}\u{9332}\u{89E3}\u{9664}",
    alert_on: "\u{30AA}\u{30F3}",
    alert_off: "\u{30AA}\u{30D5}",
    minutes_before: "\u{5206}\u{524D}",
  },
};

function t(lang, key, params = {}) {
  const translations = TR[lang] || TR.en;
  let str = translations[key] || TR.en[key] || key;
  for (const [k, v] of Object.entries(params)) str = str.replace(`{${k}}`, v);
  return str;
}

// ---- Time helpers ----
function nowInTz(tzId) {
  const tz = TIMEZONES.find(t => t.id === tzId) || TIMEZONES.find(t => t.id === DEFAULT_TZ);
  const now = new Date();
  const utcMin = now.getUTCHours() * 60 + now.getUTCMinutes();
  const tzOffsetMin = Math.round(tz.offset * 60);
  const tzMin = utcMin + tzOffsetMin;
  const adj = ((tzMin % 1440) + 1440) % 1440;
  // Use integer ms offset to avoid floating-point corruption
  const offsetMs = tzOffsetMin * 60 * 1000;
  const d = new Date(now.getTime() + offsetMs);
  return { h: Math.floor(adj / 60), m: adj % 60, date: d.toISOString().slice(0, 10) };
}

function todayInTz(tzId) { return nowInTz(tzId).date; }
function tomorrowInTz(tzId) {
  const d = new Date(todayInTz(tzId) + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

function convertDateToTz(dateStr, fromTz, toTz) {
  const from = TIMEZONES.find(t => t.id === fromTz) || TIMEZONES.find(t => t.id === DEFAULT_TZ);
  const to = TIMEZONES.find(t => t.id === toTz) || TIMEZONES.find(t => t.id === DEFAULT_TZ);
  const d = new Date(dateStr + "T12:00:00Z");
  const fromOffset = from.offset * 60;
  const toOffset = to.offset * 60;
  const diffMinutes = toOffset - fromOffset;
  d.setUTCMinutes(d.getUTCMinutes() + diffMinutes);
  return d.toISOString().slice(0, 10);
}

function getTimeInTz(tzId) {
  const tz = TIMEZONES.find(t => t.id === tzId) || TIMEZONES.find(t => t.id === DEFAULT_TZ);
  const now = new Date();
  const utcMin = now.getUTCHours() * 60 + now.getUTCMinutes();
  const tzMin = utcMin + tz.offset * 60;
  const adj = ((tzMin % 1440) + 1440) % 1440;
  return `${String(Math.floor(adj / 60)).padStart(2, "0")}:${String(adj % 60).padStart(2, "0")}`;
}

// ---- KV Config ----
async function getGroups(env) {
  try {
    const v = await env.KV.get("g:list");
    return v ? JSON.parse(v) : [];
  } catch (e) {
    console.log("getGroups parse error:", e);
    return [];
  }
}
async function addGroup(env, gid) {
  const gs = await getGroups(env);
  if (!gs.includes(gid)) { gs.push(gid); await env.KV.put("g:list", JSON.stringify(gs)); return true; } return false;
}
async function rmGroup(env, gid) {
  const gs = await getGroups(env);
  const i = gs.indexOf(gid);
  if (i >= 0) {
    gs.splice(i, 1); await env.KV.put("g:list", JSON.stringify(gs));
    for (const k of ["c", "cc", "i", "tt", "tm", "tz", "lang", "subs", "pre"]) await env.KV.delete(`g:${gid}:${k}`);
    return true;
  } return false;
}
async function getCfg(env, gid) {
  const c = { c: [...DEFAULT_CURRENCIES], cc: [], i: [...DEFAULT_IMPACT], tt: "12:00", tm: "00:00", tz: DEFAULT_TZ, lang: "en", subs: [], pre: true };
  try {
    for (const k of ["c", "cc", "i", "subs"]) { const v = await env.KV.get(`g:${gid}:${k}`); if (v) c[k] = JSON.parse(v); }
    for (const k of ["tt", "tm", "tz", "lang"]) { const v = await env.KV.get(`g:${gid}:${k}`); if (v) c[k] = v; }
    const preVal = await env.KV.get(`g:${gid}:pre`);
    if (preVal !== null) c.pre = preVal === "true";
  } catch {} return c;
}
async function setCfg(env, gid, k, v) {
  await env.KV.put(`g:${gid}:${k}`, typeof v === "string" ? v : JSON.stringify(v));
}

// ---- Telegram API ----
const TG = "https://api.telegram.org/bot";
async function tgApi(env, method, body, retry = true) {
  const token = env.TELEGRAM_BOT_TOKEN; if (!token) return null;
  try {
    const r = await fetch(`${TG}${token}/${method}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await r.json();
    if (r.status === 429 && retry) {
      const retryAfter = (data.parameters?.retry_after || 1) * 1000;
      console.log(`TG rate limited, waiting ${retryAfter}ms`);
      await delay(retryAfter + 100);
      return tgApi(env, method, body, false);
    }
    return data;
  } catch (e) { console.log(`TG ${method}:`, e); return null; }
}
async function tgSend(env, cid, text, rm) {
  const body = { chat_id: cid, text, disable_web_page_preview: true, parse_mode: "Markdown" };
  if (rm) body.reply_markup = rm;
  return tgApi(env, "sendMessage", body);
}
async function tgSendPlain(env, cid, text) {
  const body = { chat_id: cid, text, disable_web_page_preview: true };
  return tgApi(env, "sendMessage", body);
}
async function tgSendHTML(env, cid, text) {
  const body = { chat_id: cid, text, disable_web_page_preview: true, parse_mode: "HTML" };
  return tgApi(env, "sendMessage", body);
}
async function tgEdit(env, cid, mid, text, rm) {
  const body = { chat_id: cid, message_id: mid, text, parse_mode: "Markdown" };
  if (rm) body.reply_markup = rm;
  return tgApi(env, "editMessageText", body);
}
async function tgAnswer(env, cbid, text, alert) {
  return tgApi(env, "answerCallbackQuery", { callback_query_id: cbid, text, show_alert: !!alert });
}
function getAdminIds(env) {
  const s = env.ADMIN_USER_IDS || ""; return s ? s.split(",").map(x => parseInt(x.trim())).filter(x => !isNaN(x)) : [];
}
function isAdmin(env, uid) { const a = getAdminIds(env); return !a.length || a.includes(uid); }

// ---- Keyboards ----
function kb(rows) { return { inline_keyboard: rows }; }
function btn(text, cb) { return { text, callback_data: cb }; }

function mainMenuKb(lang) {
  return kb([
    [btn(`\u{1F4CA} ${t(lang, "news_today")}`, "news:today"), btn(`\u{1F4C8} ${t(lang, "news_tomorrow")}`, "news:tomorrow")],
    [btn(`\u{1F30D} ${t(lang, "sessions")}`, "sessions"), btn(`\u{2699}\u{FE0F} ${t(lang, "settings")}`, "menu:settings")],
  ]);
}

function settingsKb(lang) {
  return kb([
    [btn(`\u{1F4B1} ${t(lang, "currencies")}`, "menu:currencies"), btn(`\u{1F4CC} Currency Codes`, "menu:codes")],
    [btn(`\u{1F534} ${t(lang, "impact")}`, "menu:impact")],
    [btn(`\u{23F0} ${t(lang, "schedule")}`, "menu:schedule"), btn(`\u{1F310} ${t(lang, "timezone")}`, "menu:tz")],
    [btn(`\u{1F310} ${t(lang, "lang")}`, "menu:lang")],
    [btn(`\u{1F514} ${t(lang, "custom_events")}`, "menu:subs")],
    [btn(`\u{23F0} ${t(lang, "pre_alerts")}`, "menu:pre")],
    [btn(`\u{2190} ${t(lang, "back")}`, "menu:main")],
  ]);
}

function currencyKb(active, lang) {
  const rows = [];
  const sorted = [...ALL_CURRENCIES].sort((a, b) => (active.includes(a.code) ? 0 : 1) - (active.includes(b.code) ? 0 : 1));
  for (let i = 0; i < sorted.length; i += 3) {
    const row = [];
    for (let j = i; j < Math.min(i + 3, sorted.length); j++) {
      const c = sorted[j];
      row.push(btn(`${active.includes(c.code) ? "\u2705" : "\u274C"} ${c.code}`, `cur:${c.code}`));
    }
    rows.push(row);
  }
  rows.push([btn("\u{1F504} Reset", "cur:reset"), btn(`\u{2190} ${t(lang, "back")}`, "menu:settings")]);
  return kb(rows);
}

function impactKb(active, lang) {
  return kb([
    [btn(`${active.includes("high") ? "\u2705" : "\u274C"} HIGH`, "imp:high"),
     btn(`${active.includes("medium") ? "\u2705" : "\u274C"} MEDIUM`, "imp:medium"),
     btn(`${active.includes("low") ? "\u2705" : "\u274C"} LOW`, "imp:low")],
    [btn(`\u{2190} ${t(lang, "back")}`, "menu:settings")],
  ]);
}

function currencyCodeKb(active, lang) {
  const rows = [];
  for (let i = 0; i < ALL_CODES.length; i += 3) {
    const row = [];
    for (let j = i; j < Math.min(i + 3, ALL_CODES.length); j++) {
      const code = ALL_CODES[j];
      row.push(btn(`${active.includes(code) ? "\u2705" : "\u274C"} ${code}`, `cc:${code}`));
    }
    rows.push(row);
  }
  rows.push([btn("\u{1F504} Reset", "cc:reset"), btn(`\u{2190} ${t(lang, "back")}`, "menu:settings")]);
  return kb(rows);
}

function langKb(current) {
  const langs = [
    ["en", "English"], ["fa", "\u0641\u0627\u0631\u0633\u06CC"], ["ar", "\u0627\u0644\u0639\u0631\u0628\u064A\u0629"],
    ["ru", "\u0420\u0443\u0441\u0441\u043A\u0438\u0439"], ["es", "Espa\u00F1ol"], ["zh", "\u4E2D\u6587"], ["ja", "\u65E5\u672C\u8A9E"],
  ];
  return kb([
    ...langs.map(([code, name]) => [btn(`${current === code ? "\u{25CF}" : "\u{25CB}"} ${name}`, `lang:${code}`)]),
    [btn(`\u{2190} Back`, "menu:settings")],
  ]);
}

function scheduleKb(cfg, lang) {
  return kb([
    [btn(`${t(lang, "today_time")}: ${cfg.tt}`, "sch:today")],
    [btn(`${t(lang, "tomorrow_time")}: ${cfg.tm}`, "sch:tomorrow")],
    [btn(`\u{2190} ${t(lang, "back")}`, "menu:settings")],
  ]);
}

function timePickerKb(type, current, lang) {
  const [ch, cm] = current.split(":").map(Number);
  const rows = [];
  // Hours 00-23 in rows of 6
  for (let start = 0; start < 24; start += 6) {
    const hRow = [];
    for (let h = start; h < Math.min(start + 6, 24); h++) {
      hRow.push(btn(h === ch ? `\u{25CF} ${String(h).padStart(2, "0")}` : String(h).padStart(2, "0"), `time:${type}:h:${h}`));
    }
    rows.push(hRow);
  }
  // Minutes 00-59 in rows of 6
  for (let start = 0; start < 60; start += 6) {
    const mRow = [];
    for (let m = start; m < Math.min(start + 6, 60); m++) {
      mRow.push(btn(m === cm ? `\u{25CF} ${String(m).padStart(2, "0")}` : String(m).padStart(2, "0"), `time:${type}:m:${m}`));
    }
    rows.push(mRow);
  }
  rows.push([btn(`\u{2190} ${t(lang, "back")}`, "menu:schedule")]);
  return kb(rows);
}

function tzKb(current) {
  const rows = [];
  for (let i = 0; i < TIMEZONES.length; i += 2) {
    const row = [];
    const t1 = TIMEZONES[i];
    row.push(btn(`${current === t1.id ? "\u{25CF}" : "\u{25CB}"} ${t1.label}`, `tz:${t1.id}`));
    if (i + 1 < TIMEZONES.length) {
      const t2 = TIMEZONES[i + 1];
      row.push(btn(`${current === t2.id ? "\u{25CF}" : "\u{25CB}"} ${t2.label}`, `tz:${t2.id}`));
    }
    rows.push(row);
  }
  rows.push([btn(`\u{2190} Back`, "menu:settings")]);
  return kb(rows);
}

function sessionsKb(lang) { return kb([[btn(`\u{2190} ${t(lang, "back")}`, "menu:main")]]); }

function subsKb(subs, lang) {
  const events = ["NFP", "CPI", "GDP", "Interest Rate", "PMI", "Retail Sales", "Unemployment", "Trade Balance"];
  const rows = events.map(e => [btn(`${subs.includes(e) ? "\u{1F514}" : "\u{1F515}"} ${e}`, `sub:${e}`)]);
  rows.push([btn(`\u{2190} ${t(lang, "back")}`, "menu:settings")]);
  return kb(rows);
}

function toggleKb(key, val, lang) {
  return kb([
    [btn(`${val ? "\u2705" : "\u274C"} ${val ? t(lang, "alert_on") : t(lang, "alert_off")}`, `toggle:${key}`)],
    [btn(`\u2190 ${t(lang, "back")}`, "menu:settings")],
  ]);
}

// ---- News ----
const NEWS_URLS = [
  "https://nfs.faireconomy.media/ff_calendar_thisweek.json",
  "https://cdn-nfs.faireconomy.media/ff_calendar_thisweek.json",
];

function parseNewsItems(data) {
  if (!data || !data.length) return [];
  return data.map(item => {
    const d = new Date(item.date);
    const irst = new Date(d.getTime() + (3 * 60 + 30) * 60000);
    return {
      t: `${String(irst.getUTCHours()).padStart(2, "0")}:${String(irst.getUTCMinutes()).padStart(2, "0")}`,
      c: item.country, e: item.title, i: (item.impact || "low").toLowerCase(),
      a: "", f: item.forecast || "", p: item.previous || "",
      _date: irst.toISOString().slice(0, 10), _rawDate: item.date,
    };
  });
}

async function fetchNews(env) {
  if (env) {
    const cached = await env.KV.get("news:cache");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.items && parsed.items.length > 0 && (Date.now() - parsed.ts) < 86400000) {
          return parsed.items;
        }
      } catch {}
    }
  }
  for (const url of NEWS_URLS) {
    try {
      const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
      if (!r.ok) continue;
      const data = await r.json();
      const items = parseNewsItems(data);
      if (items.length > 0) {
        if (env) await env.KV.put("news:cache", JSON.stringify({ ts: Date.now(), items }), { expirationTtl: 86400 });
        return items;
      }
    } catch {}
  }
  return [];
}

async function refreshNews(env) {
  if (env) await env.KV.delete("news:cache");
  return fetchNews(env);
}

function filterNews(items, currencies, impacts, currencyCodes) {
  const codes = new Set();
  for (const p of currencies) { const pu = p.toUpperCase(); if (CURRENCY_MAP[pu]) codes.add(CURRENCY_MAP[pu]); else if (pu.length >= 6) { codes.add(pu.slice(0, 3)); codes.add(pu.slice(3, 6)); } }
  // Add individual currency codes if provided
  if (currencyCodes && currencyCodes.length > 0) {
    for (const cc of currencyCodes) codes.add(cc.toUpperCase());
  }
  const imps = impacts.map(x => x.toLowerCase());
  return items.filter(i => (codes.size === 0 || codes.has(i.c.toUpperCase())) && imps.includes(i.i));
}

function fmtNews(items, ds, nt, cfg) {
  const lang = cfg.lang || "en";
  const tz = TIMEZONES.find(t => t.id === cfg.tz)?.label || "IRST";
  if (!items.length) return `\u{1F4E2} *${nt === "today" ? t(lang, "news_today") : t(lang, "news_tomorrow")}*\n\`\`\`\n${ds}\n\`\`\`\n${t(lang, "no_news")}`;

  // Determine which items have already been released (for strikethrough)
  const irstNow = nowInTz(DEFAULT_TZ);
  const currentMin = irstNow.h * 60 + irstNow.m;
  const isToday = ds === todayInTz(DEFAULT_TZ);

  const hi = items.filter(i => i.i === "high");
  const md = items.filter(i => i.i === "medium");
  const lo = items.filter(i => i.i === "low");

  // Use HTML for strikethrough support
  let msg = `\u{1F4E2} <b>${nt === "today" ? t(lang, "news_today") : t(lang, "news_tomorrow")}</b>\n`;
  msg += `\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\n`;
  msg += `\u{1F4C5} ${ds}  |  \u{1F552} ${tz}\n\n`;

  const sections = [
    { label: "\u{1F534} High Impact", items: hi },
    { label: "\u{1F7E1} Medium Impact", items: md },
    { label: "\u{1F7E2} Low Impact", items: lo },
  ];

  for (const sec of sections) {
    if (!sec.items.length) continue;
    msg += `<b>${sec.label}</b>\n`;
    for (const i of sec.items) {
      const [ih, im] = i.t.split(":").map(Number);
      const itemMin = ih * 60 + im;
      const released = isToday && itemMin <= currentMin;
      const timeStr = released ? `<s>${i.t}</s>` : i.t;
      msg += `\n\u{25B6} ${timeStr}  <b>${i.c}</b> | ${i.e}\n`;
      if (i.f || i.p) msg += `    \u{1F4CA} F: ${i.f || "-"}  |  P: ${i.p || "-"}\n`;
      const tvPair = TV_DEFAULT[i.c.toUpperCase()];
      if (tvPair) msg += `    \u{1F310} <a href="${tvLink(tvPair)}">${t(lang, "trading_view")}</a>\n`;
    }
    msg += "\n";
  }

  msg += `\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\n`;
  msg += `\u{2139}\u{FE0F} ${t(lang, "source")}  |  ${tz}`;
  return msg;
}

// ---- Callback Handler ----
async function handleCb(env, cb) {
  const data = cb.data || "";
  const cid = cb.message?.chat?.id;
  const mid = cb.message?.message_id;
  const uid = cb.from?.id || 0;
  const cbid = cb.id;
  if (!cid || !mid) return;

  // Auto-register DM users who click any button (positive chat ID = DM)
  if (cid > 0) {
    const gs = await getGroups(env);
    if (!gs.includes(cid)) {
      await addGroup(env, cid);
      console.log(`Auto-registered DM user via callback: ${cid}`);
    }
  }

  const cfg = await getCfg(env, cid);
  const lang = cfg.lang;

  if (data === "noop") return tgAnswer(env, cbid, "");

  // Menu navigation
  if (data === "menu:main") {
    await tgAnswer(env, cbid, "");
    return tgEdit(env, cid, mid, `\u{1F30A} *Forex News Bot*\n\n${t(lang, "desc")}`, mainMenuKb(lang));
  }
  if (data === "menu:settings") {
    await tgAnswer(env, cbid, "");
    return tgEdit(env, cid, mid, `\u{2699}\u{FE0F} *${t(lang, "settings")}*`, settingsKb(lang));
  }
  if (data === "menu:help") {
    await tgAnswer(env, cbid, "");
    return tgEdit(env, cid, mid, `\u{1F4CB} *${t(lang, "help")}*\n\n\u{1F4E2} /news - ${t(lang, "news_today")}/${t(lang, "news_tomorrow")}\n\u{1F30D} /sessions - ${t(lang, "sessions")}\n\u{2795} /addgroup - Register group\n\u{2796} /removegroup - Unregister\n\u{2139}\u{FE0F} /settings - ${t(lang, "settings")}`, kb([[btn(`\u{2190} ${t(lang, "back")}`, "menu:main")]]));
  }

  // Sessions
  if (data === "sessions") {
    await tgAnswer(env, cbid, "");
    const tz = TIMEZONES.find(t => t.id === cfg.tz) || TIMEZONES.find(t => t.id === DEFAULT_TZ);
    const sessions = getSessionsStatus(tz.offset);
    let msg = `\u{1F30D} *${t(lang, "sessions_title")}*\n\n`;
    for (const s of sessions) {
      const status = s.isOpen ? `\u{1F7E2} ${t(lang, "open")}` : `\u{1F534} ${t(lang, "closed")}`;
      msg += `${s.icon} *${s.name}*  ${status}\n`;
      msg += `    \u{23F0} ${s.localOpen} - ${s.localClose}\n`;
      msg += `    \u{1F4B1} ${s.currencies.join(", ")}\n\n`;
    }
    return tgEdit(env, cid, mid, msg, sessionsKb(lang));
  }

  // Currency toggle
  if (data === "menu:currencies") {
    await tgAnswer(env, cbid, "");
    return tgEdit(env, cid, mid, `\u{1F4B1} *${t(lang, "currencies")}*\n\n${t(lang, "toggle_hint")}`, currencyKb(cfg.c, lang));
  }
  if (data.startsWith("cur:")) {
    const code = data.slice(4);
    await tgAnswer(env, cbid, "");
    let cur = code === "reset" ? [...DEFAULT_CURRENCIES] : (cfg.c.includes(code) ? cfg.c.filter(x => x !== code) : [...cfg.c, code]);
    if (code === "reset") cur = [...DEFAULT_CURRENCIES];
    await setCfg(env, cid, "c", cur);
    return tgEdit(env, cid, mid, `\u{1F4B1} *${t(lang, "currencies")}*\n\n${t(lang, "toggle_hint")}`, currencyKb(cur, lang));
  }

  // Impact toggle
  if (data === "menu:impact") {
    await tgAnswer(env, cbid, "");
    return tgEdit(env, cid, mid, `\u{1F534} *${t(lang, "impact")}*`, impactKb(cfg.i, lang));
  }
  if (data.startsWith("imp:")) {
    const level = data.slice(4);
    await tgAnswer(env, cbid, "");
    let imp = cfg.i.includes(level) ? cfg.i.filter(x => x !== level) : [...cfg.i, level];
    await setCfg(env, cid, "i", imp);
    return tgEdit(env, cid, mid, `\u{1F534} *${t(lang, "impact")}*`, impactKb(imp, lang));
  }

  // Language
  if (data === "menu:lang") {
    await tgAnswer(env, cbid, "");
    return tgEdit(env, cid, mid, `\u{1F310} *${t(lang, "lang")}*`, langKb(cfg.lang));
  }
  if (data.startsWith("lang:")) {
    const newLang = data.slice(5);
    await tgAnswer(env, cbid, "");
    await setCfg(env, cid, "lang", newLang);
    return tgEdit(env, cid, mid, `\u{1F310} *${t(newLang, "lang")}*`, langKb(newLang));
  }

  // Schedule
  if (data === "menu:schedule") {
    await tgAnswer(env, cbid, "");
    return tgEdit(env, cid, mid, `\u{23F0} *${t(lang, "schedule")}*`, scheduleKb(cfg, lang));
  }
  if (data.startsWith("sch:")) {
    const type = data.slice(4);
    await tgAnswer(env, cbid, "");
    const current = type === "today" ? cfg.tt : cfg.tm;
    return tgEdit(env, cid, mid, `\u{23F0} *${t(lang, "set_time")}*\n\n\`${current}\``, timePickerKb(type, current, lang));
  }
  if (data.startsWith("time:")) {
    const parts = data.split(":");
    const type = parts[1], unit = parts[2], val = parseInt(parts[3]);
    await tgAnswer(env, cbid, "");
    let [h, m] = (type === "today" ? cfg.tt : cfg.tm).split(":").map(Number);
    if (unit === "h") h = val; else m = val;
    const newTime = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    await setCfg(env, cid, type === "today" ? "tt" : "tm", newTime);
    return tgEdit(env, cid, mid, `\u{23F0} *${t(lang, "set_time")}*\n\n\`${newTime}\``, timePickerKb(type, newTime, lang));
  }

  // Timezone
  if (data === "menu:tz") {
    await tgAnswer(env, cbid, "");
    return tgEdit(env, cid, mid, `\u{1F310} *${t(lang, "timezone")}*\n\n\`${cfg.tz}\``, tzKb(cfg.tz));
  }
  if (data.startsWith("tz:")) {
    const tzId = data.slice(3);
    await tgAnswer(env, cbid, "");
    await setCfg(env, cid, "tz", tzId);
    return tgEdit(env, cid, mid, `\u{1F310} *${t(lang, "timezone")}*\n\n\`${tzId}\``, tzKb(tzId));
  }

  // Subscriptions (custom events)
  if (data === "menu:subs") {
    await tgAnswer(env, cbid, "");
    return tgEdit(env, cid, mid, `\u{1F514} *${t(lang, "custom_events")}*`, subsKb(cfg.subs, lang));
  }
  if (data.startsWith("sub:")) {
    const event = data.slice(4);
    await tgAnswer(env, cbid, "");
    let subs = cfg.subs.includes(event) ? cfg.subs.filter(x => x !== event) : [...cfg.subs, event];
    await setCfg(env, cid, "subs", subs);
    return tgEdit(env, cid, mid, `\u{1F514} *${t(lang, "custom_events")}*`, subsKb(subs, lang));
  }

  // Currency code toggle
  if (data === "menu:codes") {
    await tgAnswer(env, cbid, "");
    return tgEdit(env, cid, mid, `\u{1F4CC} *Currency Codes*\n\nFilter by individual currencies (e.g., only USD news)`, currencyCodeKb(cfg.cc || [], lang));
  }
  if (data.startsWith("cc:")) {
    const code = data.slice(3);
    await tgAnswer(env, cbid, "");
    const current = cfg.cc || [];
    let newCodes = code === "reset" ? [] : (current.includes(code) ? current.filter(x => x !== code) : [...current, code]);
    await setCfg(env, cid, "cc", newCodes);
    return tgEdit(env, cid, mid, `\u{1F4CC} *Currency Codes*\n\nFilter by individual currencies (e.g., only USD news)`, currencyCodeKb(newCodes, lang));
  }

  // Breaking alerts toggle (removed)

  // Pre-release alerts toggle
  if (data === "menu:pre") {
    await tgAnswer(env, cbid, "");
    return tgEdit(env, cid, mid, `\u{23F0} *${t(lang, "pre_alerts")}*`, toggleKb("pre", cfg.pre, lang));
  }
  if (data === "toggle:pre") {
    await tgAnswer(env, cbid, "");
    await setCfg(env, cid, "pre", (!cfg.pre).toString());
    return tgEdit(env, cid, mid, `\u{23F0} *${t(lang, "pre_alerts")}*`, toggleKb("pre", !cfg.pre, lang));
  }

  // News preview
  if (data.startsWith("news:")) {
    const nt = data.slice(5);
    await tgAnswer(env, cbid, "");
    const irstDate = nt === "today" ? todayInTz(DEFAULT_TZ) : tomorrowInTz(DEFAULT_TZ);
    const news = await fetchNews(env);
    const flt = filterNews(news.filter(i => i._date === irstDate), cfg.c, cfg.i, cfg.cc);
    const msg = fmtNews(flt, irstDate, nt, cfg);
    if (msg.length > 4000) {
      await tgApi(env, "editMessageText", { chat_id: cid, message_id: mid, text: msg.slice(0, 4000), parse_mode: "HTML", reply_markup: mainMenuKb(lang) });
      const rest = msg.slice(4000);
      for (let i = 0; i < rest.length; i += 4000) {
        await tgSendHTML(env, cid, rest.slice(i, i + 4000));
      }
    } else {
      await tgApi(env, "editMessageText", { chat_id: cid, message_id: mid, text: msg, parse_mode: "HTML", reply_markup: mainMenuKb(lang) });
    }
  }
}

// ---- Commands ----
async function handleCmd(env, cid, ct, text, msg) {
  const parts = text.trim().split(/\s+/);
  const cmd = parts[0].toLowerCase().split("@")[0];
  const args = parts.slice(1);
  const uid = msg.from?.id || 0;
  const nm = msg.from?.first_name || "User";
  console.log(`CMD:${cmd} u:${nm}(${uid}) c:${cid}`);

  // Auto-register ALL DM users who send any command (positive chat ID = DM)
  if (ct === "private" || cid > 0) {
    const gs = await getGroups(env);
    if (!gs.includes(cid)) {
      await addGroup(env, cid);
      console.log(`Auto-registered DM user: ${cid}`);
    }
  }

  if (cmd === "/start") {
    await tgSend(env, cid, `\u{1F30A} *Forex News Bot*\n\n${t("en", "welcome", { name: nm })}\n\n${t("en", "desc")}`, mainMenuKb("en"));
  } else if (cmd === "/help" || cmd === "/settings") {
    const cfg = await getCfg(env, cid);
    await tgSend(env, cid, `\u{2699}\u{FE0F} *${t(cfg.lang, "settings")}*`, settingsKb(cfg.lang));
  } else if (cmd === "/sessions") {
    const cfg = await getCfg(env, cid);
    const tz = TIMEZONES.find(t => t.id === cfg.tz) || TIMEZONES.find(t => t.id === DEFAULT_TZ);
    const sessions = getSessionsStatus(tz.offset);
    let msgText = `\u{1F30D} *${t(cfg.lang, "sessions_title")}*\n\n`;
    for (const s of sessions) {
      const status = s.isOpen ? `\u{1F7E2} ${t(cfg.lang, "open")}` : `\u{1F534} ${t(cfg.lang, "closed")}`;
      msgText += `${s.icon} *${s.name}*  ${status}\n    \u{23F0} ${s.localOpen} - ${s.localClose}\n    \u{1F4B1} ${s.currencies.join(", ")}\n\n`;
    }
    await tgSend(env, cid, msgText, sessionsKb(cfg.lang));
  } else if (cmd === "/addgroup") {
    const gs = await getGroups(env);
    if (gs.includes(cid)) return tgSend(env, cid, "\u{2139}\u{FE0F} Already registered.");
    if (await addGroup(env, cid)) await tgSend(env, cid, `\u{2705} Added!`, settingsKb("en"));
  } else if (cmd === "/removegroup") {
    if (await rmGroup(env, cid)) await tgSend(env, cid, "\u{2705} Removed.");
  } else if (cmd === "/news") {
    const cfg = ct !== "private" ? await getCfg(env, cid) : { c: DEFAULT_CURRENCIES, i: DEFAULT_IMPACT, tz: DEFAULT_TZ, lang: "en" };
    const nt = args[0]?.toLowerCase() || "today";
    if (!["today", "tomorrow"].includes(nt)) return tgSend(env, cid, "Usage: /news today");
    const irstDate = nt === "today" ? todayInTz(DEFAULT_TZ) : tomorrowInTz(DEFAULT_TZ);
    const news = await fetchNews(env);
    const flt = filterNews(news.filter(i => i._date === irstDate), cfg.c, cfg.i, cfg.cc);
    const msgText = fmtNews(flt, irstDate, nt, cfg);
    if (msgText.length > 4000) {
      for (let i = 0; i < msgText.length; i += 4000) await tgSendHTML(env, cid, msgText.slice(i, i + 4000));
    } else {
      await tgSendHTML(env, cid, msgText);
    }
  } else if (cmd === "/setpairs") {
    if (!args.length) return tgSend(env, cid, "Usage: /setpairs EURUSD,GBPUSD");
    await setCfg(env, cid, "c", args[0].split(",").map(p => p.trim().toUpperCase()));
    await tgSend(env, cid, "\u{2705} Updated!");
  } else if (cmd === "/setimpact") {
    if (!args.length) return tgSend(env, cid, "Usage: /setimpact high,medium");
    await setCfg(env, cid, "i", args[0].split(",").map(l => l.trim().toLowerCase()).filter(l => ["high", "medium", "low"].includes(l)));
    await tgSend(env, cid, "\u{2705} Updated!");
  } else if (cmd === "/settime") {
    if (args.length < 2) return tgSend(env, cid, "Usage: /settime today 12:00");
    const nt = args[0].toLowerCase();
    if (!["today", "tomorrow"].includes(nt)) return tgSend(env, cid, "Use today/tomorrow.");
    const tp = args[1].split(":");
    const h = parseInt(tp[0]), mi = parseInt(tp[1]);
    if (isNaN(h) || isNaN(mi) || h < 0 || h > 23 || mi < 0 || mi > 59) return tgSend(env, cid, "Invalid time.");
    await setCfg(env, cid, nt === "today" ? "tt" : "tm", `${String(h).padStart(2, "0")}:${String(mi).padStart(2, "0")}`);
    await tgSend(env, cid, `\u{2705} ${nt}: ${String(h).padStart(2, "0")}:${String(mi).padStart(2, "0")}`);
  } else if (cmd === "/diag") {
    const gs = await getGroups(env);
    let diag = `\u{1F50D} *Diagnostics*\n\nGroups: ${gs.length}\n`;
    for (const gid of gs) {
      const cfg = await getCfg(env, gid);
      const curMin = minsSinceMidnight(cfg.tz);
      const curH = String(Math.floor(curMin / 60)).padStart(2, "0");
      const curM = String(curMin % 60).padStart(2, "0");
      diag += `\n*${gid}*\n  tz: ${cfg.tz}\n  now: ${curH}:${curM}\n  today_send: ${cfg.tt}\n  tomorrow_send: ${cfg.tm}\n  currencies: ${cfg.c.join(", ")}\n  impact: ${cfg.i.join(", ")}\n  lang: ${cfg.lang}\n`;
    }
    const news = await fetchNews(env);
    diag += `\n\u{1F4F0} News API: ${news.length} items`;
    const irstNow = nowInTz(DEFAULT_TZ);
    diag += `\n\u{1F552} IRST now: ${String(irstNow.h).padStart(2, "0")}:${String(irstNow.m).padStart(2, "0")}`;
    await tgSend(env, cid, diag);
  } else if (cmd === "/testsend") {
    // Test sending to current chat
    const nt = args[0]?.toLowerCase() || "today";
    const irstDate = nt === "today" ? todayInTz(DEFAULT_TZ) : tomorrowInTz(DEFAULT_TZ);
    const news = await fetchNews(env);
    const flt = filterNews(news.filter(i => i._date === irstDate), DEFAULT_CURRENCIES, DEFAULT_IMPACT, []);
    if (flt.length) {
      await tgSendHTML(env, cid, fmtNews(flt, irstDate, nt, { lang: "en", tz: DEFAULT_TZ }));
      await tgSend(env, cid, `\u{2705} Test sent ${flt.length} items to this chat`);
    } else {
      await tgSend(env, cid, `\u{274C} No news for ${irstDate}`);
    }
  } else if (cmd === "/forcesend") {
    const nt = args[0]?.toLowerCase() || "today";
    if (!["today", "tomorrow"].includes(nt)) return tgSend(env, cid, "Usage: /forcesend today");
    const cfg = ct !== "private" ? await getCfg(env, cid) : { c: DEFAULT_CURRENCIES, i: DEFAULT_IMPACT, tz: DEFAULT_TZ, lang: "en" };
    const irstDate = nt === "today" ? todayInTz(DEFAULT_TZ) : tomorrowInTz(DEFAULT_TZ);
    const news = await fetchNews(env);
    const flt = filterNews(news.filter(i => i._date === irstDate), cfg.c, cfg.i, cfg.cc);
    if (flt.length) {
      const result = await tgSendHTML(env, cid, fmtNews(flt, irstDate, nt, cfg));
      await tgSend(env, cid, `\u{2705} Force sent ${flt.length} items. Result: ok=${result?.ok} err=${result?.description || "none"}`);
    } else {
      await tgSend(env, cid, `\u{274C} No matching news for ${irstDate}. Total news: ${news.length}`);
    }
  } else if (cmd === "/refresh") {
    const news = await refreshNews(env);
    await tgSend(env, cid, `\u{1F504} Cache refreshed. ${news.length} items available.`);
  }
}

// ---- Scheduled ----
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

function timeToMin(str) {
  const [h, m] = str.split(":").map(Number);
  return h * 60 + m;
}

function minsSinceMidnight(tzId) {
  const tz = TIMEZONES.find(t => t.id === tzId) || TIMEZONES.find(t => t.id === DEFAULT_TZ);
  const now = new Date();
  const utc = now.getUTCHours() * 60 + now.getUTCMinutes();
  return ((utc + tz.offset * 60) % 1440 + 1440) % 1440;
}

async function sendScheduled(env) {
  const gs = await getGroups(env);
  console.log(`[SCHEDULED] ${gs.length} registered`);
  let news = await fetchNews(env);
  if (!news.length) news = await refreshNews(env);
  if (!news.length) return;
  const irstNow = nowInTz(DEFAULT_TZ);
  const currentMin = irstNow.h * 60 + irstNow.m;
  const todayDate = todayInTz(DEFAULT_TZ);
  const tomorrowDate = tomorrowInTz(DEFAULT_TZ);
  for (const gid of gs) {
    try {
      const cfg = await getCfg(env, gid);
      for (const nt of ["today", "tomorrow"]) {
        const targetMin = timeToMin(nt === "today" ? cfg.tt : cfg.tm);
        const diff = (currentMin - targetMin + 1440) % 1440;
        // Only send within 3 minutes of target
        if (diff > 3 && diff < 1437) continue;
        // Dedup: store the minute we sent at, skip if same minute
        const minuteKey = `min:${gid}:${nt}:${currentMin}`;
        const alreadySent = await env.KV.get(minuteKey);
        if (alreadySent) continue;
        const irstDate = nt === "today" ? todayDate : tomorrowDate;
        const dayNews = news.filter(i => i._date === irstDate);
        const flt = filterNews(dayNews, cfg.c, cfg.i, cfg.cc);
        if (!flt.length) continue;
        console.log(`[SCHEDULED] -> ${gid}: ${nt} ${flt.length} items`);
        const msg = fmtNews(flt, irstDate, nt, cfg);
        if (msg.length > 4000) {
          await tgSendHTML(env, gid, msg.slice(0, 4000));
          for (let i = 4000; i < msg.length; i += 4000) await tgSendHTML(env, gid, msg.slice(i, i + 4000));
        } else {
          await tgSendHTML(env, gid, msg);
        }
        // Mark this exact minute as sent (TTL = 5 min, matches cron interval)
        await env.KV.put(minuteKey, "1", { expirationTtl: 300 });
        break;
      }
    } catch (e) { console.log(`sendScheduled err ${gid}:`, e); }
  }
}

// ---- Pre-release alerts only ----
async function sendAlerts(env) {
  const gs = await getGroups(env);
  if (!gs.length) return;
  const news = await fetchNews(env);
  if (!news.length) return;
  const irstNow = nowInTz(DEFAULT_TZ);
  const currentMin = irstNow.h * 60 + irstNow.m;
  const today = todayInTz(DEFAULT_TZ);

  for (const gid of gs) {
    try {
      const cfg = await getCfg(env, gid);
      if (!cfg.pre) continue;
      const todayNews = news.filter(i => i._date === today);
      const filtered = filterNews(todayNews, cfg.c, cfg.i, cfg.cc);

      for (const item of filtered) {
        const [h, m] = item.t.split(":").map(Number);
        const eventMin = h * 60 + m;
        const diff = eventMin - currentMin;

        // Alert 1-5 min BEFORE event
        if (diff > 0 && diff <= 5) {
          const cooldownKey = `pre:${gid}:${item.t}:${item.e}`;
          const lastSent = await env.KV.get(cooldownKey);
          if (!lastSent) {
            const tvPair = TV_DEFAULT[item.c.toUpperCase()];
            const tvLinkStr = tvPair ? `\nTradingView: ${tvLink(tvPair)}` : "";
            const impactEmoji = item.i === "high" ? "\u{1F534}" : item.i === "medium" ? "\u{1F7E1}" : "\u{1F7E2}";
            await tgSendPlain(env, gid, `${impactEmoji} PRE-RELEASE: ${item.c} | ${item.e}\nIn ${diff} min\nForecast: ${item.f || "-"}  |  Previous: ${item.p || "-"}${tvLinkStr}`);
            await env.KV.put(cooldownKey, "1", { expirationTtl: 600 });
          }
        }
      }
    } catch (e) { console.log(`Alert err ${gid}:`, e); }
  }
}

// ---- Worker ----
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "POST" && url.pathname === "/webhook") {
      try {
        const body = await request.json();
        if (body.callback_query) await handleCb(env, body.callback_query);
        else if (body.message) {
          const m = body.message;
          if ((m.text || "").startsWith("/")) await handleCmd(env, m.chat.id, m.chat.type, m.text, m);
        }
        return new Response("OK");
      } catch (e) { console.log("Err:", e); return new Response("OK"); }
    }
    if (url.pathname === "/status") {
      const gs = await getGroups(env);
      const news = await fetchNews(env);
      let info = `Groups: ${gs.length}\nNews: ${news.length}\n`;
      for (const gid of gs) {
        const cfg = await getCfg(env, gid);
        const curMin = minsSinceMidnight(cfg.tz);
        const curH = String(Math.floor(curMin / 60)).padStart(2, "0");
        const curM = String(curMin % 60).padStart(2, "0");
        const diff = curMin - timeToMin(cfg.tt);
        info += `\n${gid}: tz=${cfg.tz} now=${curH}:${curM} today=${cfg.tt} diff=${diff}`;
      }
      if (news.length > 0) {
        const dates = [...new Set(news.map(n => n._date))].sort();
        info += `\nNews dates: ${dates.join(", ")}`;
      }
      return new Response(info);
    }
    if (url.pathname === "/testsend") {
      const adminId = (env.ADMIN_USER_IDS || "").split(",")[0]?.trim();
      if (!adminId) return new Response("No admin ID configured");
      const r = await tgSend(env, parseInt(adminId), "\u{1F916} *Test message*\n\nIf you see this, the bot can send to you automatically.");
      return new Response(`Sent to ${adminId}: ok=${r?.ok} err=${r?.description || "none"}`);
    }
    if (url.pathname === "/clearsent") {
      const gs = await getGroups(env);
      const adminIds = getAdminIds(env);
      const allGids = [...gs, ...adminIds];
      for (const gid of allGids) {
        for (const nt of ["today", "tomorrow"]) {
          for (const tz of [DEFAULT_TZ, "Asia/Tehran"]) {
            const d = nt === "today" ? todayInTz(tz) : tomorrowInTz(tz);
            await env.KV.delete(`sent:${gid}:${nt}:${d}`);
          }
        }
      }
      return new Response("Cleared all sent flags");
    }
    if (url.pathname === "/force") {
      const gid = parseInt(url.searchParams.get("gid"));
      if (!gid) return new Response("Missing gid param");
      let news = await fetchNews(env);
      if (!news.length) news = await refreshNews(env);
      const irstDate = todayInTz(DEFAULT_TZ);
      const dayNews = news.filter(i => i._date === irstDate);
      const cfg = await getCfg(env, gid);
      const flt = filterNews(dayNews, cfg.c, cfg.i, cfg.cc);
      if (flt.length) {
        const msg = fmtNews(flt, irstDate, "today", cfg);
        const r = await tgSendHTML(env, gid, msg);
        return new Response(`Forced to ${gid}: ${flt.length} items, ok=${r?.ok}`);
      }
      return new Response(`No news for ${gid}`);
    }
    if (url.pathname === "/tick") {
      await sendScheduled(env);
      return new Response("OK");
    }
    return new Response("Forex News Bot running");
  },
  async scheduled(event, env) {
    console.log(`[CRON] Fired at ${new Date().toISOString()}`);
    await sendScheduled(env);
    await sendAlerts(env);
    console.log(`[CRON] Complete`);
  },
};