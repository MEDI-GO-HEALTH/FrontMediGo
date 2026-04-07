import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  acceptDriverOrder,
  getDriverCurrentOrder,
  getDriverMapSnapshot,
  startDriverShift,
} from '../../api/driverDeliveryService';
import '../../styles/driver/mapa-entregas.css';

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

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      try {
        const [mapSnapshot, currentOrder] = await Promise.all([
          getDriverMapSnapshot(),
          getDriverCurrentOrder(),
        ]);

        if (!mounted) {
          return;
        }

        setDashboardData((prev) => ({
          ...prev,
          ...mapSnapshot,
          selectedOrder: {
            ...prev.selectedOrder,
            ...(currentOrder ?? {}),
          },
        }));
      } catch {
        if (!mounted) {
          return;
        }

        setDashboardData(FALLBACK_DATA);
      }
    };

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  const selectedOrder = useMemo(() => dashboardData.selectedOrder ?? FALLBACK_DATA.selectedOrder, [dashboardData]);

  const handleStartShift = async () => {
    setActionError('');
    setLoading(true);

    try {
      await startDriverShift();
    } catch {
      setActionError('No fue posible iniciar turno con el backend. Se mantiene modo de prueba local.');
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
      setActionError('No fue posible confirmar el pedido con el backend. El flujo visual permanece activo.');
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
        <aside className="driver-sidenav" aria-label="Navegacion de repartidor">
          <div className="driver-side-head">
            <div className="driver-side-brand">
              <div className="driver-side-logo">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                  local_shipping
                </span>
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

            <button
              type="button"
              className="driver-nav-btn"
              onClick={() => navigate('/repartidor/historial')}
            >
              <span className="material-symbols-outlined">history</span>
              Historial de Viajes
            </button>

            <button
              type="button"
              className="driver-nav-btn"
              onClick={() => navigate('/repartidor/perfil')}
            >
              <span className="material-symbols-outlined">person</span>
              Mi Perfil
            </button>
          </nav>

          <div className="driver-sidenav-footer">
            <button
              type="button"
              className="start-shift-btn"
              onClick={handleStartShift}
              disabled={loading}
            >
              {loading ? 'Procesando...' : 'Iniciar Turno'}
            </button>

            <button type="button" className="driver-footer-link">
              <span className="material-symbols-outlined">help</span>
              Help
            </button>

            <button type="button" className="driver-footer-link danger" onClick={handleLogout}>
              <span className="material-symbols-outlined">logout</span>
              Cerrar sesion
            </button>
          </div>
        </aside>

        <main className="driver-main" aria-label="Mapa de entregas provisional">
          <header className="driver-topbar">
            <h2 className="driver-top-title">MediGo Clinical Logistics</h2>

            <div className="driver-topbar-right">
              <div className="driver-top-online">
                <span />
                <span>Online</span>
              </div>

              <button type="button" className="driver-icon-btn" aria-label="Notificaciones">
                <span className="material-symbols-outlined">notifications</span>
              </button>

              <div className="driver-top-avatar" aria-label="Avatar por defecto del repartidor">
                <span className="material-symbols-outlined">local_shipping</span>
              </div>
            </div>
          </header>

          <div className="driver-main-stage">
            <div className="driver-map-canvas" role="img" aria-label="Mapa provisional para futura integracion en tiempo real">
              <div className="driver-map-grid" />
              <div className="driver-map-overlay" />

              <div className="driver-marker eps-a">
                <span className="material-symbols-outlined">location_on</span>
              </div>

              <div className="driver-marker eps-b">
                <span className="material-symbols-outlined">location_on</span>
              </div>

              <div className="driver-marker truck-busy">
                <span className="material-symbols-outlined">local_shipping</span>
              </div>

              <div className="driver-marker truck-free">
                <span className="material-symbols-outlined">local_shipping</span>
              </div>

              <div className="driver-self-marker">
                <div className="pulse" />
                <div className="dot-wrap">
                  <div className="dot" />
                </div>
                <span className="tag">Tu ubicacion</span>
              </div>

              <svg className="driver-route-svg" viewBox="0 0 1200 720" preserveAspectRatio="none" aria-hidden="true">
                <path d="M 180 520 C 260 470, 340 410, 430 395 C 515 380, 575 420, 650 350 C 760 250, 820 220, 980 200" />
              </svg>
            </div>

            <div className="driver-search-floating">
              <div className="driver-search-bar">
                <div className="driver-search-inner">
                  <span className="material-symbols-outlined">search</span>
                  <input type="text" placeholder="Buscar sede, pedido o direccion" disabled />
                </div>
                <button type="button" className="filter-btn" aria-label="Filtrar">
                  <span className="material-symbols-outlined">tune</span>
                </button>
              </div>
            </div>

            <div className="driver-legend" aria-label="Leyenda del mapa">
              <div className="driver-legend-row">
                <span className="driver-legend-dot free" />
                Repartidor libre
              </div>
              <div className="driver-legend-row">
                <span className="driver-legend-dot busy" />
                Repartidor ocupado
              </div>
              <div className="driver-legend-row">
                <span className="driver-legend-dot orders" />
                Punto de pedido
              </div>
            </div>

            <article className="driver-order-card" aria-label="Detalle de pedido actual">
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
                <div className="stat-box">
                  <small>ETA estimado</small>
                  <p>
                    <span className="material-symbols-outlined">schedule</span>
                    {selectedOrder.estimatedTimeLabel}
                  </p>
                </div>

                <div className="stat-box">
                  <small>Distancia</small>
                  <p>
                    <span className="material-symbols-outlined">route</span>
                    {selectedOrder.distanceLabel}
                  </p>
                </div>
              </div>

              <div className="route-flow">
                <div className="route-axis" aria-hidden="true">
                  <span className="route-point start" />
                  <span className="route-line" />
                  <span className="route-point end" />
                </div>

                <div className="route-text">
                  <small>Recoger en</small>
                  <p>{selectedOrder.pickupAddress}</p>

                  <small>Entregar en</small>
                  <p>{selectedOrder.destinationAddress}</p>
                </div>
              </div>

              <button type="button" className="accept-order-btn" onClick={handleAcceptOrder} disabled={loading}>
                <span className="material-symbols-outlined">check_circle</span>
                {loading ? 'Procesando...' : 'Aceptar Pedido'}
              </button>

              {actionError ? <p style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#ba1a1a' }}>{actionError}</p> : null}
            </article>

            <div className="driver-map-controls" aria-label="Controles de mapa">
              <button type="button" aria-label="Acercar">
                <span className="material-symbols-outlined">add</span>
              </button>
              <button type="button" aria-label="Alejar">
                <span className="material-symbols-outlined">remove</span>
              </button>
              <button type="button" className="locate" aria-label="Ubicarme">
                <span className="material-symbols-outlined">my_location</span>
              </button>
            </div>
          </div>

          <footer className="driver-mobile-footer" aria-label="Navegacion movil repartidor">
            <button type="button" onClick={() => navigate('/repartidor/historial')}>
              <span className="material-symbols-outlined">history</span>
              Historial
            </button>

            <span className="driver-mobile-center" aria-hidden="true">
              <span className="material-symbols-outlined">map</span>
            </span>

            <button type="button" onClick={() => navigate('/repartidor/perfil')}>
              <span className="material-symbols-outlined">person</span>
              Perfil
            </button>
          </footer>
        </main>
      </div>
    </div>
  );
}
