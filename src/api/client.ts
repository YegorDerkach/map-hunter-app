/**
 * Base API client: base URL, auth headers, and request helper.
 * Uses VITE_API_BASE; token from localStorage (same key as auth service).
 */

import type { ErrorResponse } from '@/types/api';

const AUTH_TOKEN_KEY = 'map-hunter-auth-token';

export function getApiBase(): string {
  const base = import.meta.env.VITE_API_BASE;
  if (base) return base.replace(/\/$/, '');
  return '';
}

export function getAuthHeaders(url: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (url.includes('/api/auth/login') || url.includes('/api/auth/register')) {
    return headers;
  }
  try {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  } catch {
    // ignore
  }
  return headers;
}

async function parseError(res: Response): Promise<string> {
  const text = await res.text();
  if (!text) return res.statusText || 'Request failed';
  try {
    const json: ErrorResponse = JSON.parse(text);
    const msg = json?.message ?? text;
    return String(msg).replace(/\s+/g, ' ').trim() || res.statusText || 'Request failed';
  } catch {
    return text.trim() || res.statusText || 'Request failed';
  }
}

export type RequestOptions = {
  /** If true, do not set Content-Type (e.g. for FormData) */
  skipContentType?: boolean;
  /** If true, expect text response (e.g. GET /api/photo/profile returns URL string) */
  responseText?: boolean;
};

/**
 * Performs fetch with base URL and auth. For auth endpoints, no Bearer is sent.
 * Body can be object (JSON), FormData, or File (wrapped as FormData with key "file").
 */
export async function request<T>(
  path: string,
  method: string,
  body?: unknown,
  options: RequestOptions = {}
): Promise<T> {
  const base = getApiBase();
  const url = path.startsWith('http')
    ? path
    : base
      ? `${base}${path.startsWith('/') ? '' : '/'}${path}`
      : `${path.startsWith('/') ? '' : '/'}${path}`;
  const headers = getAuthHeaders(url);

  let actualBody: BodyInit | null = null;
  let skipContentType = options.skipContentType;
  if (body != null) {
    if (body instanceof FormData) {
      actualBody = body;
      skipContentType = true;
    } else if (body instanceof File) {
      const formData = new FormData();
      formData.append('file', body);
      actualBody = formData;
      skipContentType = true;
    } else {
      actualBody = JSON.stringify(body);
    }
  }
  if (skipContentType) {
    delete headers['Content-Type'];
  }

  const res = await fetch(url, {
    method,
    headers,
    body: actualBody,
  });

  if (!res.ok) {
    const message = await parseError(res);
    throw new Error(message);
  }

  if (options.responseText) {
    return (await res.text()) as T;
  }
  const data = await res.json().catch(() => null);
  return data as T;
}
