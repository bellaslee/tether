'use client';

import { useEffect, useState } from 'react';

type ThemePreference = 'light' | 'dark' | 'system';

const THEME_STORAGE_KEY = 'tether-theme';

const THEME_OPTIONS: Array<{ value: ThemePreference; label: string }> = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

function isThemePreference(value: string | null): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}

function applyThemePreference(theme: ThemePreference) {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.classList.toggle(
    'dark',
    theme === 'dark' || (theme === 'system' && prefersDark),
  );
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemePreference>('system');

  useEffect(() => {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    const nextTheme = isThemePreference(storedTheme) ? storedTheme : 'system';
    applyThemePreference(nextTheme);
    const id = window.requestAnimationFrame(() => setTheme(nextTheme));
    return () => window.cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (theme !== 'system') return;

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyThemePreference('system');
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [theme]);

  function selectTheme(nextTheme: ThemePreference) {
    setTheme(nextTheme);
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    applyThemePreference(nextTheme);
  }

  return (
    <fieldset className="space-y-2 px-1.5 py-1">
      <legend className="px-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
        Appearance
      </legend>
      <div className="grid grid-cols-3 gap-1 rounded-2xl border border-border-soft bg-surface/70 p-1">
        {THEME_OPTIONS.map((option) => {
          const active = theme === option.value;
          return (
            <button
              key={option.value}
              type="button"
              className={[
                'rounded-xl px-2 py-1.5 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                active
                  ? 'bg-accent text-white'
                  : 'text-muted hover:bg-surface-strong hover:text-foreground',
              ].join(' ')}
              aria-pressed={active}
              onClick={() => selectTheme(option.value)}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
