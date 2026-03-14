import { IntlProvider } from 'react-intl';
import { useGame } from '@/context/GameContext';
import { messages } from './messages';

export function IntlProviderWrapper({ children }: { children: React.ReactNode }) {
  const { state } = useGame();
  const locale = state.locale;
  const localeMessages = messages[locale] ?? messages.uk;

  return (
    <IntlProvider locale={locale} messages={localeMessages} defaultLocale="uk">
      {children}
    </IntlProvider>
  );
}
