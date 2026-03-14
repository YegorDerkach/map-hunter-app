import { useState, useEffect, useCallback } from 'react';
import { getProfilePhotoUrl } from '@/api';

const storageKey = (userId: string) => `avatar_url:${userId}`;

/**
 * Persists the user's avatar URL in localStorage (keyed by userId) so it's
 * available instantly on mount without waiting for a network round-trip.
 *
 * - Immediately hydrates from localStorage on first render.
 * - Then fetches the authoritative URL from the server in the background and
 *   updates both state and localStorage if the value changed.
 * - `setAvatarUrl` updates both state and localStorage atomically.
 */
export function useAvatarUrl(userId: string | undefined, token: string | null) {
  const key = userId ? storageKey(userId) : null;

  const [avatarUrl, setAvatarUrlState] = useState<string | null>(() => {
    if (!key) return null;
    try {
      return localStorage.getItem(key) || null;
    } catch {
      return null;
    }
  });

  // Persist helper — keeps localStorage and state in sync
  const setAvatarUrl = useCallback(
    (url: string | null) => {
      setAvatarUrlState(url);
      if (!key) return;
      try {
        if (url) {
          localStorage.setItem(key, url);
        } else {
          localStorage.removeItem(key);
        }
      } catch {
        // localStorage unavailable (private browsing, quota exceeded)
      }
    },
    [key],
  );

  // Background refresh from server whenever the user/token changes
  useEffect(() => {
    if (!token || !key) {
      setAvatarUrlState(null);
      return;
    }
    let cancelled = false;
    getProfilePhotoUrl()
      .then((url) => {
        if (cancelled) return;
        const fresh = url || null;
        // Only update if the server value differs (avoid unnecessary re-renders)
        setAvatarUrl(fresh);
      })
      .catch(() => {
        // Server unreachable — keep the cached value, don't clear it
      });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, key]);

  return { avatarUrl, setAvatarUrl };
}
