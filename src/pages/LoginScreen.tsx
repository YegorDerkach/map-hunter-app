import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '@/context/GameContext';
import { useT } from '@/i18n/useT';
import { GameButton } from '@/components/game/GameButton';
import { login, register } from '@/service/auth';
import type { AuthUser } from '@/types/game';

const mapDecorations = ['🌲', '⛰️', '🏰', '🌊', '🌋', '🏕️', '🌿', '🗻', '🏔️', '🌾'];

const inputClass =
  'w-full rounded-lg border-2 border-[hsl(173_50%_45%/0.5)] bg-[hsl(200_35%_22%/0.8)] px-3 py-2.5 font-display text-[hsl(40_50%_95%)] placeholder-[hsl(38_30%_60%)] focus:border-[hsl(173_60%_55%)] focus:outline-none focus:ring-2 focus:ring-[hsl(173_60%_55%/0.3)]';

export default function LoginScreen() {
  const navigate = useNavigate();
  const { dispatch, state } = useGame();
  const { t } = useT();

  const [mode, setMode] = useState<'choose' | 'login' | 'register'>('choose');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [id, setId] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGuest = () => {
    dispatch({ type: 'LOGIN', payload: { name: 'Hunter' } });
    navigate(state.tutorialComplete ? '/map' : '/tutorial');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError(t('login_error'));
      return;
    }
    setLoading(true);
    try {
      const res = await login(email.trim(), password);
      const user = res.data as AuthUser | null;
      if (res.token && user) {
        dispatch({ type: 'LOGIN_SERVER', payload: { token: res.token, user } });
        navigate(state.tutorialComplete ? '/map' : '/tutorial');
      } else {
        setError(t('login_error'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('login_error'));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const tid = id.trim();
    const tnick = nickname.trim();
    const temail = email.trim();
    if (!tid) {
      setError(t('register_required_username'));
      return;
    }
    if (!tnick) {
      setError(t('register_required_nickname'));
      return;
    }
    if (!temail) {
      setError(t('register_required_email'));
      return;
    }
    if (!password) {
      setError(t('register_required_password'));
      return;
    }
    setLoading(true);
    try {
      const res = await register({ id: tid, nickname: tnick, email: temail, password });
      const user = res.data as AuthUser | null;
      if (res.token && user) {
        dispatch({ type: 'LOGIN_SERVER', payload: { token: res.token, user } });
        navigate(state.tutorialComplete ? '/map' : '/tutorial');
      } else {
        setError(t('register_error'));
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('register_error');
      const isEmailTaken =
        msg.toLowerCase().includes('already registered') ||
        msg.toLowerCase().includes('вже зареєстровано');
      setError(isEmailTaken ? t('register_email_taken') : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden game-gradient-hero flex flex-col items-center justify-end pb-12 px-6">
      <div className="absolute inset-0 screen-texture-dots pointer-events-none opacity-80" />
      <div className="absolute inset-0 grid grid-cols-5 gap-4 p-4 opacity-20 pointer-events-none select-none">
        {Array.from({ length: 30 }).map((_, i) => (
          <span key={i} className="text-2xl flex items-center justify-center">
            {mapDecorations[i % mapDecorations.length]}
          </span>
        ))}
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-[hsl(200_40%_12%/0.85)] via-[hsl(173_50%_20%/0.2)] to-transparent" />

      <div className="relative z-10 w-full max-w-[360px] flex flex-col items-center gap-4">
        <div className="text-center mb-2">
          <div className="w-24 h-24 mx-auto mb-3 rounded-2xl border-2 border-[hsl(173_60%_55%/0.5)] bg-[hsl(173_50%_35%/0.25)] backdrop-blur flex items-center justify-center text-6xl animate-float shadow-[0_4px_0_hsl(200_30%_15%/0.5)]">
            🗺️
          </div>
          <h1 className="font-display font-bold text-5xl text-[hsl(40_60%_96%)] game-text-stroke tracking-wide drop-shadow-md">
            {t('login_appName')}
          </h1>
          <p className="text-[hsl(38_70%_80%)] text-xs font-display tracking-widest uppercase mt-1">
            {t('login_tagline')}
          </p>
        </div>

        <div className="w-full flex flex-col gap-3 bg-[hsl(200_35%_18%/0.6)] backdrop-blur border-[3px] border-[hsl(173_50%_45%/0.4)] rounded-xl p-5 shadow-[0_4px_0_hsl(200_30%_12%/0.5),inset_0_1px_0_hsl(173_50%_70%/0.15)]">
          {mode === 'choose' && (
            <>
              <GameButton variant="gold" size="lg" fullWidth onClick={handleGuest}>
                🎮 {t('login_playGuest')}
              </GameButton>
              <GameButton
                variant="outline"
                size="lg"
                fullWidth
                className="bg-[hsl(173_40%_35%/0.3)] border-[hsl(173_50%_50%/0.5)] text-[hsl(40_50%_95%)] hover:bg-[hsl(173_40%_40%/0.4)]"
                onClick={() => setMode('login')}
              >
                ✉️ {t('login_submit')}
              </GameButton>
              <button
                type="button"
                className="text-sm text-[hsl(173_60%_65%)] hover:underline font-display"
                onClick={() => setMode('register')}
              >
                {t('login_switchToRegister')}
              </button>
              <GameButton
                variant="outline"
                size="lg"
                fullWidth
                className="bg-[hsl(173_40%_35%/0.3)] border-[hsl(173_50%_50%/0.5)] text-[hsl(40_50%_95%)]"
                onClick={handleGuest}
              >
                <span className="font-bold text-lg leading-none">G</span> {t('login_google')}
              </GameButton>
              <GameButton
                variant="outline"
                size="lg"
                fullWidth
                className="bg-[hsl(173_40%_35%/0.3)] border-[hsl(173_50%_50%/0.5)] text-[hsl(40_50%_95%)]"
                onClick={handleGuest}
              >
                🍎 {t('login_apple')}
              </GameButton>
            </>
          )}

          {mode === 'login' && (
            <form onSubmit={handleLogin} className="flex flex-col gap-3">
              <input
                type="email"
                placeholder={t('login_email')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                autoComplete="email"
                disabled={loading}
              />
              <input
                type="password"
                placeholder={t('login_password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                autoComplete="current-password"
                disabled={loading}
              />
              {error && <p className="text-sm text-[hsl(0_70%_55%)]">{error}</p>}
              <GameButton type="submit" variant="gold" size="lg" fullWidth disabled={loading}>
                {loading ? '...' : t('login_submit')}
              </GameButton>
              <button
                type="button"
                className="text-sm text-[hsl(173_60%_65%)] hover:underline font-display"
                onClick={() => { setMode('register'); setError(null); }}
              >
                {t('login_switchToRegister')}
              </button>
              <button
                type="button"
                className="text-sm text-[hsl(38_40%_70%)] hover:underline font-display"
                onClick={() => { setMode('choose'); setError(null); }}
              >
                ← {t('common_back')}
              </button>
            </form>
          )}

          {mode === 'register' && (
            <form onSubmit={handleRegister} className="flex flex-col gap-3">
              <input
                type="text"
                placeholder={t('register_id')}
                value={id}
                onChange={(e) => setId(e.target.value)}
                className={inputClass}
                autoComplete="username"
                disabled={loading}
              />
              <input
                type="text"
                placeholder={t('register_nickname')}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className={inputClass}
                autoComplete="nickname"
                disabled={loading}
              />
              <input
                type="email"
                placeholder={t('register_email')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                autoComplete="email"
                disabled={loading}
              />
              <input
                type="password"
                placeholder={t('register_password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                autoComplete="new-password"
                disabled={loading}
              />
              {error && <p className="text-sm text-[hsl(0_70%_55%)]">{error}</p>}
              <GameButton type="submit" variant="gold" size="lg" fullWidth disabled={loading}>
                {loading ? '...' : t('register_submit')}
              </GameButton>
              <button
                type="button"
                className="text-sm text-[hsl(173_60%_65%)] hover:underline font-display"
                onClick={() => { setMode('login'); setError(null); }}
              >
                {t('register_switchToLogin')}
              </button>
              <button
                type="button"
                className="text-sm text-[hsl(38_40%_70%)] hover:underline font-display"
                onClick={() => { setMode('choose'); setError(null); }}
              >
                ← {t('common_back')}
              </button>
            </form>
          )}
        </div>

        <p className="text-[hsl(38_40%_70%)] text-xs text-center">
          {t('login_terms')}
        </p>
      </div>
    </div>
  );
}
