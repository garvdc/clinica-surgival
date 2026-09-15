'use client';
import { useSyncExternalStore } from 'react';
import { Moon, Sun } from 'lucide-react';
const key = 'surgival-theme';
function subscribe(notify: () => void) {
  function sync(event: StorageEvent) {
    if (event.key !== key && event.key !== null) return;
    document.documentElement.dataset.theme =
      event.newValue === 'dark' ? 'dark' : 'light';
    notify();
  }
  window.addEventListener('surgival-theme-change', notify);
  window.addEventListener('storage', sync);
  return () => {
    window.removeEventListener('surgival-theme-change', notify);
    window.removeEventListener('storage', sync);
  };
}
function snapshot() {
  return document.documentElement.dataset.theme === 'dark';
}
export function ThemeToggle() {
  const dark = useSyncExternalStore(subscribe, snapshot, () => false);
  function toggle() {
    const theme = snapshot() ? 'light' : 'dark';
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(key, theme);
    } catch {
      /* The toggle also works when storage is unavailable. */
    }
    window.dispatchEvent(new Event('surgival-theme-change'));
  }
  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label="Modo oscuro"
      aria-pressed={dark}
      title={dark ? 'Activar modo claro' : 'Activar modo oscuro'}
      onClick={toggle}
    >
      {dark ? (
        <Sun size={20} aria-hidden="true" />
      ) : (
        <Moon size={20} aria-hidden="true" />
      )}
      <span>{dark ? 'Modo claro' : 'Modo oscuro'}</span>
    </button>
  );
}
