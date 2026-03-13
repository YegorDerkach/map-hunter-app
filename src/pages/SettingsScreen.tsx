import { useNavigate } from 'react-router-dom';
import { Music, Volume2, Bell, User, Lock, HelpCircle, LogOut, Moon } from 'lucide-react';
import { GameShell } from '@/components/game/GameShell';
import { BackHeader } from '@/components/game/BackHeader';
import { ScreenTransition } from '@/components/game/ScreenTransition';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useGame } from '@/context/GameContext';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';

interface SettingRowProps {
  icon: React.ReactNode;
  label: string;
  right?: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
}

function SettingRow({ icon, label, right, onClick, danger }: SettingRowProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 py-3.5 px-4 hover:bg-muted/50 transition-colors"
      disabled={!onClick && !right}
    >
      <div className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center ${danger ? 'bg-[hsl(var(--game-red)/0.1)] border-[hsl(var(--game-red)/0.25)]' : 'bg-muted border-border'}`}>
        <span className={danger ? 'text-[hsl(var(--game-red))]' : 'text-muted-foreground'}>
          {icon}
        </span>
      </div>
      <span className={`flex-1 text-sm font-medium text-left ${danger ? 'text-[hsl(var(--game-red))]' : 'text-foreground'}`}>
        {label}
      </span>
      {right && <div className="shrink-0">{right}</div>}
      {!right && onClick && (
        <span className="text-muted-foreground text-xs">›</span>
      )}
    </button>
  );
}

export default function SettingsScreen() {
  const { state, dispatch } = useGame();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { settings } = state;

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
    navigate('/login', { replace: true });
  };

  return (
    <GameShell>
      <BackHeader title="Settings" />
      <ScreenTransition>
        <div className="flex-1 overflow-y-auto">
          {/* Audio section */}
          <div className="px-4 pt-4 pb-1">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1 px-1">
              Audio
            </p>
          </div>
          <div className="bg-card rounded-lg border-2 border-b-4 border-border mx-4 overflow-hidden game-shadow-card">
            <SettingRow
              icon={<Music className="w-4 h-4" />}
              label="Music"
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
              label="Sound Effects"
              right={
                <Switch
                  checked={settings.soundEnabled}
                  onCheckedChange={() => dispatch({ type: 'TOGGLE_SETTING', payload: 'soundEnabled' })}
                />
              }
            />
          </div>

          {/* Notifications */}
          <div className="px-4 pt-4 pb-1">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1 px-1">
              Notifications
            </p>
          </div>
          <div className="bg-card rounded-lg border-2 border-b-4 border-border mx-4 overflow-hidden game-shadow-card">
            <SettingRow
              icon={<Bell className="w-4 h-4" />}
              label="Push Notifications"
              right={
                <Switch
                  checked={settings.notificationsEnabled}
                  onCheckedChange={() => dispatch({ type: 'TOGGLE_SETTING', payload: 'notificationsEnabled' })}
                />
              }
            />
          </div>

          {/* Display */}
          <div className="px-4 pt-4 pb-1">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1 px-1">
              Display
            </p>
          </div>
          <div className="bg-card rounded-lg border-2 border-b-4 border-border mx-4 overflow-hidden game-shadow-card">
            <SettingRow
              icon={<Moon className="w-4 h-4" />}
              label="Dark Mode"
              right={
                <Switch
                  checked={theme === 'dark'}
                  onCheckedChange={(v) => setTheme(v ? 'dark' : 'light')}
                />
              }
            />
          </div>

          {/* Account */}
          <div className="px-4 pt-4 pb-1">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1 px-1">
              Account
            </p>
          </div>
          <div className="bg-card rounded-lg border-2 border-b-4 border-border mx-4 overflow-hidden game-shadow-card">
            <SettingRow
              icon={<User className="w-4 h-4" />}
              label="Account Details"
              onClick={() => toast.info('Coming soon!')}
            />
            <Separator />
            <SettingRow
              icon={<Lock className="w-4 h-4" />}
              label="Privacy Policy"
              onClick={() => toast.info('Coming soon!')}
            />
            <Separator />
            <SettingRow
              icon={<HelpCircle className="w-4 h-4" />}
              label="Help & Support"
              onClick={() => toast.info('Coming soon!')}
            />
            <Separator />
            <SettingRow
              icon={<LogOut className="w-4 h-4" />}
              label="Logout"
              onClick={handleLogout}
              danger
            />
          </div>

          {/* Version */}
          <p className="text-center text-xs text-muted-foreground py-6">
            Map Hunter v1.0.0 • Made with ❤️
          </p>
        </div>
      </ScreenTransition>
    </GameShell>
  );
}
