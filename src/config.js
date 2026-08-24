export const CURRENCY_MAP = {
  EURUSD: "EUR", GBPUSD: "GBP", USDJPY: "JPY", USDCHF: "CHF",
  AUDUSD: "AUD", USDCAD: "CAD", NZDUSD: "NZD", EURGBP: "EUR",
  EURJPY: "EUR", GBPJPY: "GBP", AUDJPY: "AUD", EURAUD: "EUR",
  EURCAD: "EUR", EURCHF: "EUR", EURNZD: "EUR", GBPAUD: "GBP",
  GBPCAD: "GBP", GBPCHF: "GBP", AUDCAD: "AUD", AUDNZD: "AUD",
  CADJPY: "CAD", CHFJPY: "CHF", NZDJPY: "NZD", USDCNH: "CNY",
};

export const DEFAULT_CURRENCIES = ["EURUSD", "GBPUSD", "USDJPY", "USDCHF", "AUDUSD", "USDCAD", "NZDUSD"];
export const DEFAULT_IMPACT = ["high", "medium", "low"];
export const DEFAULT_TZ = "Asia/Tehran";
export const ALL_CODES = ["USD", "EUR", "GBP", "JPY", "CHF", "AUD", "CAD", "NZD", "CNY"];

export const ALL_CURRENCIES = [
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

export const TIMEZONES = [
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

export const SESSIONS = [
  { name: "Sydney", icon: "\u{1F30F}", open: 22, close: 7, currencies: ["AUD", "NZD"] },
  { name: "Tokyo", icon: "\u{1F5FC}", open: 0, close: 9, currencies: ["JPY"] },
  { name: "London", icon: "\u{1F5FC}", open: 8, close: 17, currencies: ["EUR", "GBP", "CHF"] },
  { name: "New York", icon: "\u{1F3FA}", open: 13, close: 22, currencies: ["USD", "CAD"] },
];

export const TV_DEFAULT = {
  EUR: "EURUSD", GBP: "GBPUSD", JPY: "USDJPY", CHF: "USDCHF", AUD: "AUDUSD",
  CAD: "USDCAD", NZD: "NZDUSD", USD: "DXY", CNY: "USDCNH", HKD: "USDHKD",
  MXN: "USDMXN", ZAR: "USDZAR", TRY: "USDTRY", SEK: "USDSEK", NOK: "USDNOK",
  SGD: "USDSGD", THB: "USDTHB", PLN: "USDPLN", HUF: "USDHUF", CZK: "USDCZK",
};

export function tvLink(pair) {
  return `https://www.tradingview.com/symbols/${pair}/`;
}

// کلیدی‌ترین رویدادهای اقتصادی — Smart Highlight
export const KEY_EVENTS = {
  "NFP": { key: "Nonfarm Payrolls", reason: "key_nonfarm" },
  "Non-Farm": { key: "Nonfarm Payrolls", reason: "key_nonfarm" },
  "FOMC": { key: "FOMC", reason: "key_fomc" },
  "CPI": { key: "CPI", reason: "key_cpi" },
  "Interest Rate": { key: "Interest Rate", reason: "key_rate" },
  "Fed": { key: "Federal Reserve", reason: "key_fed" },
  "ECB": { key: "European Central Bank", reason: "key_ecb" },
  "BOJ": { key: "Bank of Japan", reason: "key_boj" },
  "GDP": { key: "GDP", reason: "key_gdp" },
  "Unemployment": { key: "Unemployment", reason: "key_unemploy" },
  "Retail Sales": { key: "Retail Sales", reason: "key_retail" },
  "PMI": { key: "PMI", reason: "key_pmi" },
};