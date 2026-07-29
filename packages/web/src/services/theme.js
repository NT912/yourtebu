const THEME_KEY = 'yourtebu_theme';

export function initTheme() {
  const saved = localStorage.getItem(THEME_KEY) || 'system';
  setTheme(saved);
  return saved;
}

export function setTheme(theme) {
  if (['light', 'dark', 'system'].includes(theme)) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
  }
}

export function getTheme() {
  return localStorage.getItem(THEME_KEY) || 'system';
}
