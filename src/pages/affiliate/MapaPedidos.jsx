import { useEffect, useState, useRef } from 'react'
import { getMe } from '../../api/authService'
import AffiliateShell from '../../components/layout/AffiliateShell'
import { useTracking } from '../../hooks/useTracking'
import '../../styles/affiliate/perfil-afiliado.css'
import '../../styles/affiliate/mapa-pedidos.css'

// Puntos de referencia base
const BOGOTA_CENTER = [4.65, -74.08];

export default function MapaPedidos() {
  const [userProfile, setUserProfile] = useState(null);
  const [routeData, setRouteData] = useState({
    origin: 'Almacen Central Norte',
    destination: 'Cargando dirección...',
    status: 'Conectado al Gateway',
  });

  const { deliveries, isConnected } = useTracking({
    enablePublishing: false
  });

  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef({});
  const destinationMarkerRef = useRef(null);

  // 1. Obtener perfil del usuario (punto 1 de tu lista de backend)
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profile = await getMe();
        setUserProfile(profile);
        setRouteData(prev => ({ ...prev, destination: profile.address || 'Sin dirección registrada' }));
        
        if (profile.address) {
          geocodeAddress(profile.address);
        }
      } catch (err) {
        console.error("Error al obtener perfil:", err);
      }
    };
    fetchProfile();
  }, []);

  // Función para convertir dirección de texto a coordenadas (Geocoding gratuito)
  const geocodeAddress = async (address) => {
    try {
      // Buscamos la dirección en Bogotá para mayor precisión
      const query = encodeURIComponent(`${address}, Bogotá, Colombia`);
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`);
      const data = await response.json();
      
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const newCoords = [parseFloat(lat), parseFloat(lon)];
        updateDestinationMarker(newCoords, address);
      }
    } catch (err) {
      console.warn("No se pudo geocodificar la dirección automáticamente:", err);
    }
  };

  const updateDestinationMarker = (coords, address) => {
    if (!mapInstance.current || !window.L) return;

    // Remover marcador anterior si existe
    if (destinationMarkerRef.current) {
      destinationMarkerRef.current.remove();
    }

    const homeIcon = window.L.divIcon({
      html: '<span class="material-symbols-outlined" style="color: #1976d2; font-size: 32px; background: white; border-radius: 50%; padding: 4px; border: 2px solid #1976d2;">home</span>',
      className: 'custom-div-icon',
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    destinationMarkerRef.current = window.L.marker(coords, { icon: homeIcon })
      .addTo(mapInstance.current)
      .bindPopup(`<b>Mi Dirección de Entrega</b><br/>${address}`);
    
    // Centrar mapa en la nueva ubicación
    mapInstance.current.setView(coords, 14);
  };

  useEffect(() => {
    // Inicializar mapa
    if (!mapInstance.current && window.L && mapRef.current) {
      mapInstance.current = window.L.map(mapRef.current).setView(BOGOTA_CENTER, 12);
      
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(mapInstance.current);
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Sincronizar marcadores de repartidores
  useEffect(() => {
    if (!mapInstance.current || !window.L) return;

    // Actualizar o crear marcadores
    deliveries.forEach((d) => {
      const { id, latitude, longitude, status } = d;
      
      if (markersRef.current[id]) {
        // Mover marcador existente con animación suave
        markersRef.current[id].setLatLng([latitude, longitude]);
      } else {
        // Crear nuevo marcador
        const courierIcon = window.L.divIcon({
          html: `<div class="map-marker ${status === 'active' ? 'courier-free' : 'courier-busy'}" style="position: static; transform: none;">
                   <span class="material-symbols-outlined">${status === 'active' ? 'directions_run' : 'electric_moped'}</span>
                 </div>`,
          className: 'custom-div-icon',
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        });

        const marker = window.L.marker([latitude, longitude], { icon: courierIcon })
          .addTo(mapInstance.current)
          .bindPopup(`<b>Repartidor: ${id}</b><br/>Estado: ${status}`);
        
        markersRef.current[id] = marker;
      }
    });

    // Opcional: limpiar marcadores que ya no están en 'deliveries'
    // ...
  }, [deliveries]);

  return (
    <AffiliateShell active="map" contentMode="fluid">
      <div className="affiliate-map-workspace">
        <section className="map-viewport">
          <div 
            ref={mapRef} 
            className="map-surface" 
            style={{ width: '100%', height: '100%', minHeight: '600px' }}
          >
            {/* El mapa de Leaflet se inyectará aquí */}
          </div>
          

        </section>

        <aside className="logistics-panel">
          <div className="panel-header">
            <h3>Seguimiento en Tiempo Real</h3>
            <p>Monitoreo logístico Bogotá</p>
          </div>

          <div className="panel-body">
            <section className="tracking-stats">
              <div className="stat-card">
                <span className="stat-value">{deliveries.length}</span>
                <span className="stat-label">Repartidores Activos</span>
              </div>
            </section>

            <section className="route-card">
              <div className="route-card-head">
                <h4>Detalles de Operación</h4>
                <span className={`status-badge ${isConnected ? 'live' : 'offline'}`}>
                  {isConnected ? 'LIVE' : 'OFFLINE'}
                </span>
              </div>
              <div className="route-points">
                <div>
                  <small>ORIGEN</small>
                  <p>{routeData.origin}</p>
                </div>
                <div>
                  <small>DESTINO</small>
                  <p>{routeData.destination}</p>
                </div>
              </div>
            </section>

            <section className="deliveries-list" style={{ marginTop: '20px' }}>
              <label className="panel-label">Repartidores en zona</label>
              <div className="list-container" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {deliveries.map(d => (
                  <div key={d.id} className="delivery-item-mini" style={{
                    padding: '10px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: '10px'
                  }}>
                    <span className="material-symbols-outlined" style={{ color: d.status === 'active' ? '#4caf50' : '#ff9800' }}>
                      {d.status === 'active' ? 'directions_run' : 'electric_moped'}
                    </span>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{d.id}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>{d.latitude.toFixed(4)}, {d.longitude.toFixed(4)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="panel-footer">
            <button type="button" onClick={() => window.location.reload()}>Actualizar Mapa</button>
          </div>
        </aside>
      </div>
    </AffiliateShell>
  )
}
