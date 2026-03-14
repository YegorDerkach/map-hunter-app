/**
 * Item API: create and get.
 */

import { request } from './client';
import type { ApiItem, CreateItemDTO } from '@/types/api';

export async function createItem(dto: CreateItemDTO): Promise<ApiItem> {
  return request<ApiItem>('/api/item/create', 'POST', dto);
}

export async function getItem(): Promise<ApiItem | null> {
  return request<ApiItem | null>('/api/item', 'GET');
}
