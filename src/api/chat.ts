/**
 * Chat API: REST messages + WebSocket stub.
 */

import { request } from './client';
import type { ChatMessageEntity, ChatMessageDTO } from '@/types/api';

export async function getPrivateMessages(withUsername: string): Promise<ChatMessageEntity[]> {
  const params = new URLSearchParams({ with: withUsername });
  return request<ChatMessageEntity[]>(`/api/chat/messages/private?${params}`, 'GET');
}

/**
 * Stub: WebSocket chat not implemented. Use REST getPrivateMessages for now.
 * When ready: connect to STOMP /app/chat.private (send), /user/{username}/queue/private (receive).
 */
export function subscribePrivateChat(_username: string): Promise<void> {
  console.warn('WebSocket chat not implemented');
  return Promise.resolve();
}

/**
 * Stub: send message via WebSocket. Not implemented.
 */
export function sendPrivateMessage(_msg: ChatMessageDTO): Promise<void> {
  console.warn('WebSocket chat not implemented');
  return Promise.resolve();
}
