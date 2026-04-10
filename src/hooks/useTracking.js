import { useEffect, useState, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import { API_CONFIG } from '../config/api';

export function useTracking({ deliveryId, enablePublishing = false } = {}) {
  const [deliveries, setDeliveries] = useState([]); // Ubicaciones de repartidores
  const [branches, setBranches] = useState([]);     // Sedes/Farmacias
  const [availableOrders, setAvailableOrders] = useState([]); // Mercado global de pedidos
  const [activeOrder, setActiveOrder] = useState(null); // Estado de la orden actual (Afiliado)
  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState('Desconectado');

  const stompClient = useRef(null);

  const BACKEND_URL = (() => {
    const envWsUrl = import.meta.env.VITE_WS_URL;
    if (envWsUrl) return envWsUrl;
    const baseUrl = API_CONFIG.baseURL;
    const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
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
    const createClient = () => {
      if (stompClient.current) return;

      const token = localStorage.getItem('medigo_token');
      const userStr = localStorage.getItem('medigo_user');
      const user = userStr ? JSON.parse(userStr) : null;

      const client = new Client({
        brokerURL: BACKEND_URL,
        connectHeaders: { Authorization: `Bearer ${token}` },
        debug: (msg) => console.log('STOMP:', msg),
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        onConnect: () => {
          setIsConnected(true);
          setStatus('Conectado');

          // 1. Repartidores (Global)
          client.subscribe('/topic/deliveries', (message) => {
            const data = JSON.parse(message.body);
            setDeliveries(prev => {
              const items = Array.isArray(data) ? data : [data];
              let next = [...prev];
              items.forEach(item => {
                const idx = next.findIndex(d => d.id === item.id);
                if (idx >= 0) next[idx] = item;
                else next.push(item);
              });
              return next;
            });
          });

          // 2. Sedes (Global)
          client.subscribe('/topic/branches', (message) => {
            setBranches(JSON.parse(message.body));
          });

          // 3. Mercado Global de Pedidos (Para Repartidores)
          const isDriver = user?.role === 'DELIVERY' || user?.role === 'REPARTIDOR';
          if (isDriver) {
            client.subscribe('/topic/available-orders', (message) => {
              const order = JSON.parse(message.body);
              setAvailableOrders(prev => {
                if (prev.find(o => o.id === order.id)) return prev;
                return [...prev, order];
              });
            });
          }

          // 4. Mi Orden Personal (Para Afiliados)
          const userId = user?.user_id || user?.id;
          const isAffiliate = user?.role === 'AFFILIATE' || user?.role === 'AFILIADO';
          if (userId && isAffiliate) {
            client.subscribe(`/topic/orders/${userId}`, (message) => {
              setActiveOrder(JSON.parse(message.body));
            });
          }
        },
        onDisconnect: () => {
          setIsConnected(false);
          setStatus('Desconectado');
        }
      });

      stompClient.current = client;
      client.activate();
    };

    createClient();
    return () => {
      if (stompClient.current) {
        stompClient.current.deactivate();
        stompClient.current = null;
      }
    };
  }, [BACKEND_URL]);

  useEffect(() => {
    if (!enablePublishing || !isConnected) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => sendLocation(pos.coords.latitude, pos.coords.longitude),
      (err) => console.error('GPS Error:', err),
      { enableHighAccuracy: true }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [enablePublishing, isConnected, sendLocation]);

  return { deliveries, branches, availableOrders, setAvailableOrders, activeOrder, status, isConnected };
}
