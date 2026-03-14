/**
 * Chat API: REST messages + WebSocket via STOMP/SockJS.
 *
 * Server WebSocket endpoint: /wss (NOT /api/wss — WebSocket bypasses the /api prefix)
 * Send destination:    /app/chat.private
 * Receive destination: /user/{email}/queue/private   (principal = user email per JWTChanelInterceptor)
 */

import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { request, getApiBase } from './client';
import type { ChatMessageEntity, ChatMessageDTO } from '@/types/api';

const AUTH_TOKEN_KEY = 'map-hunter-auth-token';

// ─── REST ─────────────────────────────────────────────────────────────────────

export async function getPrivateMessages(withUsername: string): Promise<ChatMessageEntity[]> {
  const params = new URLSearchParams({ with: withUsername });
  return request<ChatMessageEntity[]>(`/api/chat/messages/private?${params}`, 'GET');
}

// ─── WebSocket (singleton) ────────────────────────────────────────────────────

let stompClient: Client | null = null;

function getToken(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Subscribe to private chat messages for `email`.
 * Returns an unsubscribe function — call it when the component unmounts.
 */
export function subscribePrivateChat(
  email: string,
  onMessage: (msg: ChatMessageEntity) => void
): () => void {
  // Tear down any existing connection
  if (stompClient) {
    stompClient.deactivate();
    stompClient = null;
  }

  const token = getToken();
  const base = getApiBase();
  // WebSocket endpoint is /wss (not /api/wss)
  const wsUrl = base ? `${base}/wss` : '/wss';

  const client = new Client({
    webSocketFactory: () => new SockJS(wsUrl) as WebSocket,
    connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
    reconnectDelay: 5000,
    onConnect: () => {
      client.subscribe(`/user/${email}/queue/private`, (frame) => {
        try {
          const msg: ChatMessageEntity = JSON.parse(frame.body);
          onMessage(msg);
        } catch {
          // ignore malformed frames
        }
      });
    },
    onStompError: (frame) => {
      console.error('STOMP error', frame.headers['message']);
    },
  });

  client.activate();
  stompClient = client;

  return () => {
    client.deactivate();
    if (stompClient === client) stompClient = null;
  };
}

/**
 * Send a private message via WebSocket.
 * Silently drops if not connected (caller should handle UI feedback).
 */
export function sendPrivateMessage(msg: ChatMessageDTO): void {
  if (!stompClient?.connected) {
    console.warn('Chat WebSocket not connected');
    return;
  }
  stompClient.publish({
    destination: '/app/chat.private',
    body: JSON.stringify(msg),
  });
}
