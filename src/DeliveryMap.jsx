import React, { useEffect, useState, useRef } from 'react';
import DeckGL from '@deck.gl/react';
import { ScatterplotLayer } from '@deck.gl/layers';
import { Map } from 'react-map-gl/maplibre';
import { Client } from '@stomp/stompjs';
import 'maplibre-gl/dist/maplibre-gl.css';

// En caso de que vayamos a usar un mapa mejor hay que poner un token de 
// Mapbox, por ahora se pone así pero toca usar usar variables de entorno (ej. import.meta.env.VITE_MAPBOX_TOKEN)
const MAPBOX_ACCESS_TOKEN = '';

// Vista inicial configurada para el centro de Bogotá (Se puede ajustar)
const INITIAL_VIEW_STATE = {
  longitude: -74.0721,
  latitude: 4.7110,
  zoom: 12,
  pitch: 0,
  bearing: 0
};

// Dirección del servidor (cambia localhost por tu IP local si pruebas desde otro PC)
const WS_PROTOCOL = window.location.protocol === "https:" ? "wss" : "ws";
const BACKEND_URL = `${WS_PROTOCOL}://${window.location.host}/ws`;

export default function DeliveryMap() {
  const [deliveries, setDeliveries] = useState([]);
  const [isMock, setIsMock] = useState(false);
  const [status, setStatus] = useState("Iniciando...");
  const [wsStatus, setWsStatus] = useState("Desconectado 🔴");

  const stompClient = useRef(null);
  // Identificador único para esta sesión de repartidor
  const [myDeliveryId] = useState(() => `repartidor-${Math.floor(Math.random() * 10000)}`);

  // 1. Efecto para la conexión STOMP
  useEffect(() => {
    const client = new Client({
      brokerURL: BACKEND_URL,
      reconnectDelay: 5000,
      onConnect: () => {
        console.log('Conectado a WebSocket STOMP');
        setWsStatus("Conectado 🟢");
        client.subscribe('/topic/deliveries', (message) => {
          if (message.body) {
            const newDelivery = JSON.parse(message.body);
            setDeliveries(prevData => {
              const index = prevData.findIndex(d => d.id === newDelivery.id);
              if (index >= 0) {
                const newData = [...prevData];
                newData[index] = newDelivery;
                return newData;
              }
              return [...prevData, newDelivery];
            });
          }
        });
      },
      onDisconnect: () => {
        console.log('Desconectado de WebSocket');
        setWsStatus("Desconectado 🔴");
      }
    });

    stompClient.current = client;
    client.activate();

    return () => client.deactivate();
  }, []);

  // 2. Efecto para Geolocation (basado en el snippet del usuario)
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setStatus("Error: Geolocation no soportada");
      setIsMock(true);
      return;
    }

    const sendLocation = (lat, lng) => {
      if (stompClient.current && stompClient.current.connected) {
        stompClient.current.publish({
          destination: `/app/location/${myDeliveryId}`,
          body: JSON.stringify({ id: myDeliveryId, latitude: lat, longitude: lng, status: "active" })
        });
      }
    };

    const watcherId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        console.log(`Ubicación real OK (${accuracy}m): ${latitude}, ${longitude}`);
        setIsMock(false);
        setStatus("Ubicación Real Activa");
        sendLocation(latitude, longitude);
      },
      (error) => {
        console.warn("Error GPS:", error.message);
        setStatus(`Error GPS: ${error.message}.`);
        setIsMock(true);
        // Fallback a IP o simulador si el usuario lo desea, 
        // pero por ahora seguimos el estilo simple solicitado
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );

    return () => navigator.geolocation.clearWatch(watcherId);
  }, []);

  // Capa de visualización de Deck.gl
  const layers = [
    new ScatterplotLayer({
      id: 'deliveries-layer',
      data: deliveries,
      pickable: true,
      opacity: 0.8,
      stroked: true,
      filled: true,
      radiusScale: 6,
      radiusMinPixels: 8,
      radiusMaxPixels: 100,
      lineWidthMinPixels: 2,
      getPosition: d => [d.longitude, d.latitude],
      getFillColor: d => d.status === 'active' ? [0, 255, 128] : [255, 60, 60],
      getLineColor: d => [255, 255, 255]
    })
  ];

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'absolute', top: 0, left: 0, overflow: 'hidden' }}>
      {/* Panel de estado */}
      <div style={{
        position: 'absolute', top: 20, right: 20, zIndex: 1000,
        background: 'rgba(0,0,0,0.7)', color: 'white', padding: '15px',
        borderRadius: '8px', fontFamily: 'sans-serif', backdropFilter: 'blur(4px)'
      }}>
        <h4 style={{ margin: '0 0 10px 0' }}>Estado GPS</h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            width: '10px', height: '10px', borderRadius: '50%',
            backgroundColor: isMock ? '#ff4040' : '#00ff80'
          }}></span>
          <p style={{ margin: 0, fontSize: '14px' }}>{status}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '5px' }}>
          <p style={{ margin: 0, fontSize: '12px', color: '#aaa' }}>Stream: {wsStatus}</p>
        </div>
        {isMock && (
          <button 
            onClick={() => window.location.reload()}
            style={{
              marginTop: '10px', background: '#333', color: 'white', border: '1px solid #555',
              padding: '5px 10px', borderRadius: '4px', cursor: 'pointer'
            }}
          >
            Reintentar Real
          </button>
        )}
      </div>

      <DeckGL
        initialViewState={INITIAL_VIEW_STATE}
        controller={true}
        layers={layers}
      >
        <Map
          mapboxAccessToken={MAPBOX_ACCESS_TOKEN}
          // Mapa gratuito, no requiere token obligatorio
          mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
        />
      </DeckGL>
    </div>
  );
}
