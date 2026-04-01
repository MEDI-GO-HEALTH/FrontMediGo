import React, { useEffect, useState } from 'react';
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

export default function DeliveryMap() {
  const [deliveries, setDeliveries] = useState([]);

  useEffect(() => {
    /* 
    // ---- Simulador local deshabilitado para usar el backend real ----
    const mockInterval = setInterval(() => {
      // ...
    }, 1000); 
    */

    // Inicializa el cliente STOMP
    const client = new Client({
      brokerURL: 'ws://localhost:8080/ws', // URL del backend Spring Boot
      reconnectDelay: 5000,
      onConnect: () => {
        console.log('Conectado a WebSocket STOMP');

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
      }
    });

    try {
      client.activate();
    } catch (e) {
      console.log('STOMP start failed (backend mock)', e);
    }

    return () => {
      // clearInterval(mockInterval);
      client.deactivate();
    };
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
