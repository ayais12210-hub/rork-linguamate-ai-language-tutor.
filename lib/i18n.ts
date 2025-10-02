import { useMemo } from 'react';

const en = {
  common: {
    ok: 'OK',
    cancel: 'Cancel',
    retry: 'Retry',
    error_generic: 'Something went wrong. Please try again.',
    error_network: 'Network error. Check your connection and try again.',
  },
};

type LocaleKeys = typeof en;

type DeepKeyOf<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends object
    ? DeepKeyOf<T[K], `${P}${K}.`>
    : `${P}${K}`;
}[keyof T & string];

const locales: Record<string, LocaleKeys> = { en };

export function t(key: DeepKeyOf<LocaleKeys>, lang: string = 'en'): string {
  const dict = locales[lang] ?? locales.en;
  const parts = key.split('.');
  let cur: any = dict;
  for (const p of parts) {
    cur = cur?.[p];
    if (cur == null) break;
  }
  return (typeof cur === 'string' ? cur : key) as string;
}

export function useT(lang: string = 'en') {
  return useMemo(() => (key: DeepKeyOf<LocaleKeys>) => t(key, lang), [lang]);
}
