/**
 * Auth service for SHARE-server: login and register.
 * Re-exports from api/auth; keeps token helpers and legacy type names for backward compatibility.
 */

import {
  login as apiLogin,
  register as apiRegister,
  getStoredToken as apiGetStoredToken,
  clearAuth as apiClearAuth,
  AUTH_TOKEN_KEY,
} from '@/api/auth';
import type { ApiAuthResponse as ApiAuthResp, RegisterPayload as RegPayload } from '@/api/auth';
import type { User } from '@/types/api';

export { AUTH_TOKEN_KEY };

export type ApiAuthResponse = ApiAuthResp;
export type RegisterPayload = RegPayload;

/** @deprecated Use User from '@/types/api' */
export type ServerUser = User;

export const login = apiLogin;
export const register = apiRegister;
export const getStoredToken = apiGetStoredToken;
export const clearAuth = apiClearAuth;
