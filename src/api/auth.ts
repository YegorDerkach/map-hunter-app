/**
 * Auth API: login and register. Persists token to localStorage.
 */

import { getApiBase } from './client';
import type { ApiResponse, User } from '@/types/api';

const AUTH_TOKEN_KEY = 'map-hunter-auth-token';

export interface ApiAuthResponse {
  token: string;
  message: string;
  data: User | null;
}

async function parseErrorResponse(res: Response, context?: string): Promise<string> {
  const text = await res.text();
  let message: string;
  if (!text) {
    message =
      res.status === 400
        ? context === 'register'
          ? 'Fill all fields. If the problem persists, this email may already be registered.'
          : 'Invalid email or password. Check your credentials or register first.'
        : res.statusText || 'Request failed';
  } else {
    try {
      const json = JSON.parse(text);
      if (json?.error === 'Bad Request' && json?.path) {
        message =
          context === 'register'
            ? 'Registration failed. Fill all fields (username, nickname, email, password) and ensure the email is not already registered.'
            : 'Invalid email or password. Check your credentials or register first.';
      } else {
        message = typeof json === 'string' ? json : (json?.message || text);
      }
    } catch {
      message = text.trim();
    }
    message = message.replace(/\s+/g, ' ').trim();
    if (!message) message = res.statusText || 'Request failed';
  }
  if (context && res.status === 400) {
    console.warn(`[Auth ${context}] ${res.status}:`, message);
  }
  return message;
}

export async function login(email: string, password: string): Promise<ApiAuthResponse> {
  const base = getApiBase();
  if (!base) throw new Error('VITE_API_BASE is not set');
  const res = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim(), password }),
  });
  if (!res.ok) {
    const message = await parseErrorResponse(res, 'login');
    throw new Error(message);
  }
  const data = (await res.json().catch(() => ({}))) as ApiResponse<User>;
  const out: ApiAuthResponse = {
    token: data.token ?? '',
    message: data.message ?? '',
    data: data.data ?? null,
  };
  if (out.token) {
    localStorage.setItem(AUTH_TOKEN_KEY, out.token);
  }
  return out;
}

export interface RegisterPayload {
  id: string;
  nickname: string;
  email: string;
  password: string;
}

export async function register(payload: RegisterPayload): Promise<ApiAuthResponse> {
  const base = getApiBase();
  if (!base) throw new Error('VITE_API_BASE is not set');
  const id = payload.id?.trim() ?? '';
  const nickname = payload.nickname?.trim() ?? '';
  const email = payload.email?.trim() ?? '';
  const password = payload.password ?? '';
  const body = { id, nickname, email, password };
  const res = await fetch(`${base}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const message = await parseErrorResponse(res, 'register');
    throw new Error(message);
  }
  const data = (await res.json().catch(() => ({}))) as ApiResponse<User>;
  const out: ApiAuthResponse = {
    token: data.token ?? '',
    message: data.message ?? '',
    data: data.data ?? null,
  };
  if (out.token) {
    localStorage.setItem(AUTH_TOKEN_KEY, out.token);
  }
  return out;
}

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function clearAuth(): void {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  } catch {
    // ignore
  }
}

export { AUTH_TOKEN_KEY };
