const THEME_KEY = 'kugou-theme';
export type Theme = 'light' | 'dark';

function getStoredTheme(): Theme | null {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return v === 'light' || v === 'dark' ? v : null;
  } catch {
    return null;
  }
}

function systemTheme(): Theme {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function currentTheme(): Theme {
  return getStoredTheme() ?? systemTheme();
}

export function applyTheme(theme: Theme) {
  const el = document.documentElement;
  el.dataset.theme = theme;
  // Element Plus 的暗色组件样式挂在 html.dark 下，需同步切换，否则组件 hover 等仍是浅色
  el.classList.toggle('dark', theme === 'dark');
  el.style.colorScheme = theme;
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* ignore */
  }
}

export function toggleTheme(): Theme {
  const next: Theme = currentTheme() === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  return next;
}

export function initTheme() {
  applyTheme(currentTheme());
}
