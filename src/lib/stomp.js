import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { getToken } from './auth';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081';

/**
 * Creates a STOMP client connected to the gateway WebSocket endpoint.
 * Auth token is passed as query param for WebSocket handshake (SockJS limitation).
 * @returns {import('@stomp/stompjs').Client}
 */
export function createStompClient() {
  const token = getToken();
  return new Client({
    webSocketFactory: () =>
      new SockJS(`${BASE_URL}/ws${token ? `?token=${encodeURIComponent(token)}` : ''}`),
    reconnectDelay: 5000,
  });
}
