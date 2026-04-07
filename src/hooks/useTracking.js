import { useEffect, useState, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import { API_CONFIG } from '../config/api';

export function useTracking({ deliveryId, enablePublishing = false } = {}) {
  const [deliveries, setDeliveries] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState('Iniciando...');
  const [isMock, setIsMock] = useState(false);

  const stompClient = useRef(null);

  const BACKEND_URL = (() => {
    // Usar VITE_WS_URL si está definido (apunta directo al backend, no al gateway)
    // El API Gateway (8081) no hace proxy de WebSockets
    const envWsUrl = import.meta.env.VITE_WS_URL;
    if (envWsUrl) return envWsUrl;

    // Fallback: derivar WS URL desde la base URL del API
    const baseUrl = API_CONFIG.baseURL;
    const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    if (!baseUrl || baseUrl.startsWith('/')) return `${wsProtocol}://${window.location.host}/ws`;
    try {
      const url = new URL(baseUrl);
      return `${wsProtocol}://${url.host}/ws`;
    } catch {
      return `${wsProtocol}://${window.location.host}/ws`;
    }
  })();

  const sendLocation = useCallback((lat, lng) => {
    if (stompClient.current?.connected && deliveryId) {
      stompClient.current.publish({
        destination: `/app/location/${deliveryId}`,
        body: JSON.stringify({ id: deliveryId, latitude: lat, longitude: lng, status: 'active' })
      });
    }
  }, [deliveryId]);

  useEffect(() => {
    // ── Crear y activar el cliente STOMP ──────────────────────────────────
    const createClient = () => {
      if (stompClient.current) return;

      const token = localStorage.getItem('medigo_token');
      console.log('useTracking: Conectando a:', BACKEND_URL);

      const client = new Client({
        brokerURL: BACKEND_URL,
        connectHeaders: {
          Authorization: `Bearer ${token}` // Punto 2: Autenticación obligatoria
        },
        reconnectDelay: 0,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        onConnect: () => {
          console.log('STOMP: ¡Conectado y Autenticado!');
          setIsConnected(true);

          // Punto 3: Suscripción a ubicaciones globales
          client.subscribe('/topic/deliveries', (message) => {
            if (message.body) {
              const data = JSON.parse(message.body);
              setDeliveries((prev) => {
                const idx = prev.findIndex((d) => d.id === data.id);
                if (idx >= 0) {
                  const next = [...prev];
                  next[idx] = data;
                  return next;
                }
                return [...prev, data];
              });
            }
          });

          // Punto 5: Suscripción a errores de seguridad propios
          client.subscribe('/user/queue/errors', (message) => {
            console.error('Error de Seguridad STOMP:', message.body);
            setStatus(`Error: ${message.body}`);
          });
        },
        onDisconnect: () => setIsConnected(false),
        onStompError: (frame) => {
          console.error('STOMP Error:', frame.headers['message']);
          setStatus('Error de conexión');
        },
        onWebSocketClose: (evt) => console.warn('WS Cerrado:', evt.code, evt.reason)
      });

      stompClient.current = client;
      client.activate();
    };

    // ── Destruir el cliente STOMP ─────────────────────────────────────────
    const destroyClient = () => {
      if (stompClient.current) {
        stompClient.current.deactivate();
        stompClient.current = null;
        setIsConnected(false);
      }
    };

    // Conectar solo si la pestaña ya está visible al montar
    if (!document.hidden) {
      createClient();
    }

    // ── Visibility API: cerrar WS al cambiar de pestaña/ventana ──────────
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('useTracking: Pestaña oculta — cerrando WS');
        destroyClient();
      } else {
        console.log('useTracking: Pestaña visible — reconectando WS');
        createClient();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // ── Geolocalización (solo si enablePublishing) ────────────────────────
    let watchId = null;
    if (enablePublishing && 'geolocation' in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => sendLocation(pos.coords.latitude, pos.coords.longitude),
        (err) => { console.warn('GPS Error:', err.message); setIsMock(true); },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }

    // ── Cleanup al desmontar el componente ────────────────────────────────
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (watchId) navigator.geolocation.clearWatch(watchId);
      destroyClient();
    };
  }, [BACKEND_URL, enablePublishing, sendLocation]);

  return { deliveries, status, isMock, isConnected };
}
