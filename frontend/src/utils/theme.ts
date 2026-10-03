export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'theme';

/**
 * Sistem tema (dark/light) berbasis atribut data-theme di <html>.
 * Nilai warna diambil dari token CSS di styles/variables.css,
 * jadi toggle hanya mengganti atribut — tanpa style baru per halaman.
 */

export function getStoredTheme(): Theme {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function setTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme);
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* penyimpanan lokal tidak tersedia — tema tetap aktif di sesi ini */
  }
}

export function toggleTheme(): Theme {
  const next: Theme = getStoredTheme() === 'dark' ? 'light' : 'dark';
  setTheme(next);
  return next;
}
