import vi from './vi.json' with { type: 'json' };
import en from './en.json' with { type: 'json' };

const locales = { vi, en };
const STORAGE_KEY = 'yourtebu_lang';

let currentLang = 'vi';

/**
 * Initialize i18n - load saved language preference
 */
export function initI18n() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && locales[saved]) {
      currentLang = saved;
    }
  } catch {
    // localStorage not available
  }
  return currentLang;
}

/**
 * Get translated string by key, with optional interpolation
 * @param {string} key - dot-separated key e.g. "nav.home"
 * @param {Record<string, string|number>} [params] - interpolation params e.g. { count: 100 }
 * @returns {string}
 */
export function t(key, params) {
  const str = locales[currentLang]?.[key] || locales.vi[key] || key;
  if (!params) return str;
  return str.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? `{${k}}`));
}

/**
 * Set active language
 * @param {'vi' | 'en'} lang
 */
export function setLang(lang) {
  if (locales[lang]) {
    currentLang = lang;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // ignore
    }
  }
}

/**
 * Get current language
 * @returns {'vi' | 'en'}
 */
export function getLang() {
  return currentLang;
}

/**
 * Get list of available languages
 */
export function getAvailableLanguages() {
  return [
    { code: 'vi', label: 'Tiếng Việt' },
    { code: 'en', label: 'English' },
  ];
}
