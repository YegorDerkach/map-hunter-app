import { useNavigate } from 'react-router-dom';
import { Music, Volume2, Bell, User, Lock, HelpCircle, LogOut, Languages } from 'lucide-react';
import { GameShell } from '@/components/game/GameShell';
import { BackHeader } from '@/components/game/BackHeader';
import { ScreenTransition } from '@/components/game/ScreenTransition';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useGame } from '@/context/GameContext';
import { useT } from '@/i18n/useT';
import { toast } from 'sonner';
import type { Locale } from '@/types/game';

interface SettingRowProps {
  icon: React.ReactNode;
  label: string;
  right?: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
}

function SettingRow({ icon, label, right, onClick, danger }: SettingRowProps) {
  const className =
    'w-full flex items-center gap-3 py-3.5 px-4 rounded-lg transition-[transform,box-shadow,background-color] duration-150 ease-out hover:bg-muted/60 hover:scale-[1.01] active:scale-[0.99] active:bg-muted/80';
  const content = (
    <>
      <div className={`w-9 h-9 rounded-lg border-2 flex items-center justify-center shrink-0 shadow-[0_2px_0_hsl(var(--border)),inset_0_1px_0_hsl(var(--bar-highlight)/0.6)] ${danger ? 'bg-[hsl(var(--game-red)/0.12)] border-[hsl(var(--game-red)/0.4)]' : 'bg-muted border-border'}`}>
        <span className={danger ? 'text-[hsl(var(--game-red))]' : 'text-muted-foreground'}>
          {icon}
        </span>
      </div>
      <span className={`flex-1 text-sm font-display font-bold text-left ${danger ? 'text-[hsl(var(--game-red))]' : 'text-foreground'}`}>
        {label}
      </span>
      {right && <div className="shrink-0" onClick={(e) => e.stopPropagation()}>{right}</div>}
      {!right && onClick && (
        <span className="text-muted-foreground text-sm">›</span>
      )}
    </>
  );
  if (right) {
    return <div className={className}>{content}</div>;
  }
  return (
    <button type="button" onClick={onClick} className={className} disabled={!onClick}>
      {content}
    </button>
  );
}

export default function SettingsScreen() {
  const { state, dispatch } = useGame();
  const navigate = useNavigate();
  const { t } = useT();
  const { settings, locale } = state;

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
    navigate('/login', { replace: true });
  };

  const setLocale = (l: Locale) => dispatch({ type: 'SET_LOCALE', payload: l });

  return (
    <GameShell pattern="settings">
      <BackHeader title={t('title_settings')} />
      <ScreenTransition>
        <div className="flex-1 overflow-y-auto">
          {/* Language */}
          <div className="px-4 pt-4 pb-2">
            <p className="game-panel-header text-xs font-bold text-muted-foreground uppercase tracking-widest mb-0 px-1">
              {t('settings_language')}
            </p>
          </div>
          <div className="game-panel mx-4 overflow-hidden">
            <SettingRow
              icon={<Languages className="w-4 h-4" />}
              label={t('settings_language')}
              right={
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setLocale('uk')}
                    className={`px-2 py-1 rounded text-xs font-bold border-2 ${locale === 'uk' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted border-border'}`}
                  >
                    {t('settings_language_uk')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setLocale('en')}
                    className={`px-2 py-1 rounded text-xs font-bold border-2 ${locale === 'en' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted border-border'}`}
                  >
                    {t('settings_language_en')}
                  </button>
                </div>
              }
            />
          </div>

          {/* Audio section */}
          <div className="px-4 pt-4 pb-2">
            <p className="game-panel-header text-xs font-bold text-muted-foreground uppercase tracking-widest mb-0 px-1">
              {t('settings_audio')}
            </p>
          </div>
          <div className="game-panel mx-4 overflow-hidden">
            <SettingRow
              icon={<Music className="w-4 h-4" />}
              label={t('settings_music')}
              right={
                <Switch
                  checked={settings.musicEnabled}
                  onCheckedChange={() => dispatch({ type: 'TOGGLE_SETTING', payload: 'musicEnabled' })}
                />
              }
            />
            <Separator />
            <SettingRow
              icon={<Volume2 className="w-4 h-4" />}
              label={t('settings_soundEffects')}
              right={
                <Switch
                  checked={settings.soundEnabled}
                  onCheckedChange={() => dispatch({ type: 'TOGGLE_SETTING', payload: 'soundEnabled' })}
                />
              }
            />
          </div>

          {/* Notifications */}
          <div className="px-4 pt-4 pb-2">
            <p className="game-panel-header text-xs font-bold text-muted-foreground uppercase tracking-widest mb-0 px-1">
              {t('settings_notifications')}
            </p>
          </div>
          <div className="game-panel mx-4 overflow-hidden">
            <SettingRow
              icon={<Bell className="w-4 h-4" />}
              label={t('settings_pushNotifications')}
              right={
                <Switch
                  checked={settings.notificationsEnabled}
                  onCheckedChange={() => dispatch({ type: 'TOGGLE_SETTING', payload: 'notificationsEnabled' })}
                />
              }
            />
          </div>

          {/* Account */}
          <div className="px-4 pt-4 pb-2">
            <p className="game-panel-header text-xs font-bold text-muted-foreground uppercase tracking-widest mb-0 px-1">
              {t('settings_account')}
            </p>
          </div>
          <div className="game-panel mx-4 overflow-hidden">
            <SettingRow
              icon={<User className="w-4 h-4" />}
              label={t('settings_accountDetails')}
              onClick={() => toast.info('Coming soon!')}
            />
            <Separator />
            <SettingRow
              icon={<Lock className="w-4 h-4" />}
              label={t('settings_privacyPolicy')}
              onClick={() => toast.info('Coming soon!')}
            />
            <Separator />
            <SettingRow
              icon={<HelpCircle className="w-4 h-4" />}
              label={t('settings_helpSupport')}
              onClick={() => toast.info('Coming soon!')}
            />
            <Separator />
            <SettingRow
              icon={<LogOut className="w-4 h-4" />}
              label={t('settings_logout')}
              onClick={handleLogout}
              danger
            />
          </div>

          {/* Version */}
          <p className="text-center text-xs text-muted-foreground py-6">
            {t('settings_version')}
          </p>
        </div>
      </ScreenTransition>
    </GameShell>
  );
}
