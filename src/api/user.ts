/**
 * User API: profile and items.
 */

import { request } from './client';
import type { User, UserDTO, ApiItem } from '@/types/api';

export async function updateProfile(dto: UserDTO): Promise<User> {
  return request<User>('/api/user/info/profile', 'POST', dto);
}

export async function updateItems(items: ApiItem[]): Promise<User> {
  return request<User>('/api/user/info/items', 'POST', items);
}
