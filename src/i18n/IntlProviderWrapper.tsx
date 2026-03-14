import { useContext } from 'react';
import { IntlProvider } from 'react-intl';
import GameContext from '@/context/GameContext';
import { messages } from './messages';
import type { Locale } from '@/types/game';

const LOCALE_STORAGE_KEY = 'map-hunter-locale';

function getStoredLocale(): Locale {
  try {
    const s = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (s === 'uk' || s === 'en') return s;
  } catch {}
  return 'uk';
}

export function IntlProviderWrapper({ children }: { children: React.ReactNode }) {
  const ctx = useContext(GameContext);
  const locale = ctx?.state?.locale ?? getStoredLocale();
  const localeMessages = messages[locale] ?? messages.uk;

  return (
    <IntlProvider locale={locale} messages={localeMessages} defaultLocale="uk">
      {children}
    </IntlProvider>
  );
}
