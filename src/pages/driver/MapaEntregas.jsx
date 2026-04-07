import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import {
  acceptDriverOrder,
  getDriverCurrentOrder,
  getDriverMapSnapshot,
  startDriverShift,
} from '../../api/driverDeliveryService';
import { useTracking } from '../../hooks/useTracking';
import '../../styles/driver/mapa-entregas.css';

const BOGOTA_CENTER = [4.65, -74.08];

const FALLBACK_DATA = {
  driver: {
    name: 'Laura Mena',
    vehicle: 'Moto - MDG 45B',
  },
  metrics: {
    onlineDrivers: 14,
    pendingOrders: 6,
  },
  selectedOrder: {
    id: 'PED-2031',
    statusLabel: 'Pedido sugerido',
    urgencyLabel: 'Urgente',
    estimatedTimeLabel: '18 min',
    distanceLabel: '4.8 km',
    pickupAddress: 'Sede Norte - Av. Calle 116 #15-28',
    destinationAddress: 'EPS Chapinero - Calle 94 #13-55',
  },
};

export default function MapaEntregas() {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(FALLBACK_DATA);
  const [loading, setLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  // Obtener usuario para el rastreo
  const userStr = localStorage.getItem('medigo_user');
  const user = userStr ? JSON.parse(userStr) : { id: 'driver-1', email: 'delivery.ana@medigo.com' };

  const { deliveries, status: trackingStatus, isMock, isConnected } = useTracking({
    deliveryId: user.id || user.email,
    enablePublishing: true
  });

  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef({});

  useEffect(() => {
    if (!mapInstance.current && window.L && mapRef.current) {
      mapInstance.current = window.L.map(mapRef.current).setView(BOGOTA_CENTER, 13);
      
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

  // Sincronizar marcadores
  useEffect(() => {
    if (!mapInstance.current || !window.L) return;

    deliveries.forEach((d) => {
      const { id, latitude, longitude, status } = d;
      const isMe = id === user.id || id === user.email || id === `delivery-${user.id}`;
      
      if (markersRef.current[id]) {
        markersRef.current[id].setLatLng([latitude, longitude]);
      } else {
        const iconHtml = isMe 
          ? `<div class="driver-self-marker" style="position: static; transform: none;">
               <div class="pulse"></div>
               <div class="dot-wrap"><div class="dot"></div></div>
             </div>`
          : `<div class="driver-marker ${status === 'active' ? 'truck-free' : 'truck-busy'}" style="position: static; transform: none;">
               <span class="material-symbols-outlined">local_shipping</span>
             </div>`;

        const icon = window.L.divIcon({
          html: iconHtml,
          className: 'custom-div-icon',
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        });

        const marker = window.L.marker([latitude, longitude], { icon })
          .addTo(mapInstance.current)
          .bindPopup(isMe ? "<b>Tú (En línea)</b>" : `<b>Repartidor: ${id}</b>`);
        
        markersRef.current[id] = marker;
      }
    });
  }, [deliveries, user.id, user.email]);

  useEffect(() => {
    let mounted = true;
    const loadDashboard = async () => {
      try {
        const [mapSnapshot, currentOrder] = await Promise.all([
          getDriverMapSnapshot(),
          getDriverCurrentOrder(),
        ]);
        if (!mounted) return;
        setDashboardData((prev) => ({
          ...prev,
          ...mapSnapshot,
          selectedOrder: { ...prev.selectedOrder, ...(currentOrder ?? {}) },
        }));
      } catch {
        if (!mounted) return;
        setDashboardData(FALLBACK_DATA);
      }
    };
    loadDashboard();
    return () => { mounted = false; };
  }, []);

  const selectedOrder = dashboardData.selectedOrder ?? FALLBACK_DATA.selectedOrder;

  const handleStartShift = async () => {
    setActionError('');
    setLoading(true);
    try {
      await startDriverShift();
    } catch {
      setActionError('No fue posible iniciar turno con el backend.');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOrder = async () => {
    setActionError('');
    setLoading(true);
    try {
      await acceptDriverOrder(selectedOrder.id);
    } catch {
      setActionError('No fue posible confirmar el pedido.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('medigo_token');
    localStorage.removeItem('medigo_user');
    navigate('/');
  };

  return (
    <div className="driver-map-page">
      <div className="driver-layout">
        <aside className="driver-sidenav">
          <div className="driver-side-head">
            <div className="driver-side-brand">
              <div className="driver-side-logo">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>local_shipping</span>
              </div>
              <div className="driver-side-brand-text">
                <h1>Driver Portal</h1>
                <p>Clinical Logistics Unit</p>
              </div>
            </div>
          </div>

          <nav>
            <button type="button" className="driver-nav-btn active">
              <span className="material-symbols-outlined">map</span>
              Mapa de Entregas
            </button>
            <button type="button" className="driver-nav-btn" onClick={() => navigate('/repartidor/historial')}>
              <span className="material-symbols-outlined">history</span>
              Historial de Viajes
            </button>
            <button type="button" className="driver-nav-btn" onClick={() => navigate('/repartidor/perfil')}>
              <span className="material-symbols-outlined">person</span>
              Mi Perfil
            </button>
          </nav>

          <div className="driver-sidenav-footer">
            <button type="button" className="start-shift-btn" onClick={handleStartShift} disabled={loading}>
              {loading ? 'Procesando...' : 'Iniciar Turno'}
            </button>
            <button type="button" className="driver-footer-link" onClick={handleLogout}>
              <span className="material-symbols-outlined">logout</span>
              Cerrar sesion
            </button>
          </div>
        </aside>

        <main className="driver-main">
          <header className="driver-topbar">
            <h2 className="driver-top-title">MediGo Clinical Logistics</h2>
            <div className="driver-topbar-right">
              <div className="driver-top-online">
                <span style={{ backgroundColor: isConnected ? '#00ff80' : '#ff4040' }} />
                <span>{isConnected ? 'En Línea' : 'Desconectado'}</span>
              </div>
              <div className="driver-gps-status" style={{ fontSize: '0.7rem', color: '#666' }}>
                {isMock ? '📍 Simulador' : '📡 GPS OK'}
              </div>
              <div className="driver-top-avatar">DR</div>
            </div>
          </header>

          <div className="driver-main-stage">
            <div ref={mapRef} className="driver-map-canvas" style={{ width: '100%', height: '100%', position: 'relative', zIndex: 1 }}>
              {/* Leaflet map injects here */}
            </div>

            <article className="driver-order-card" style={{ zIndex: 1000 }}>
              <div className="card-top">
                <div>
                  <span className="card-badge">{selectedOrder.statusLabel}</span>
                  <h2 className="card-title">#{selectedOrder.id}</h2>
                </div>
                <span className="urgency-pill">
                  <span className="material-symbols-outlined">priority_high</span>
                  {selectedOrder.urgencyLabel}
                </span>
              </div>
              <div className="card-stats">
                <div className="stat-box"><small>ETA estimado</small><p>{selectedOrder.estimatedTimeLabel}</p></div>
                <div className="stat-box"><small>Distancia</small><p>{selectedOrder.distanceLabel}</p></div>
              </div>
              <button type="button" className="accept-order-btn" onClick={handleAcceptOrder} disabled={loading}>
                {loading ? 'Procesando...' : 'Aceptar Pedido'}
              </button>
              {actionError && <p style={{ color: '#ba1a1a', fontSize: '0.75rem', marginTop: '5px' }}>{actionError}</p>}
            </article>
          </div>
        </main>
      </div>
    </div>
  );
}
