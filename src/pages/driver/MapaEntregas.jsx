import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  acceptDriverOrder,
  finalizeDelivery,
  getDriverCurrentOrder,
  getDriverMapSnapshot,
  startDriverShift,
} from '../../api/driverDeliveryService';
import MedigoSidebarBrand from '../../components/common/MedigoSidebarBrand';
import PageLoadingOverlay from '../../components/common/PageLoadingOverlay';
import useCappedLoading from '../../hooks/useCappedLoading';
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
    deliveryId: null,       // ID real del delivery para HU-10
    statusLabel: 'Pedido sugerido',
    status: 'IN_ROUTE',     // 'IN_ROUTE' | 'DELIVERED'
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

  // HU-10: estado de modal de confirmación y entrega completada
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [deliveryCompleted, setDeliveryCompleted] = useState(false);
  const [deliveredAt, setDeliveredAt] = useState(null);

  const showLoader = useCappedLoading(loading, 3000);

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      setLoading(true);
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
      } finally {
        if (mounted) {
          setLoading(false);
        }
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

  /** HU-10: repartidor presiona "Finalizar Entrega" → muestra modal de confirmación */
  const handleFinalizeClick = () => {
    setActionError('');
    setShowConfirmModal(true);
  };

  /** HU-10: repartidor confirma en el modal → llama al backend */
  const handleConfirmFinalize = async () => {
    setShowConfirmModal(false);
    setLoading(true);
    setActionError('');

    try {
      const deliveryId = selectedOrder.deliveryId ?? selectedOrder.id;
      const result = await finalizeDelivery(deliveryId);
      const now = result?.deliveredAt ? new Date(result.deliveredAt) : new Date();
      setDeliveredAt(now);
      setDeliveryCompleted(true);
      setDashboardData((prev) => ({
        ...prev,
        selectedOrder: {
          ...prev.selectedOrder,
          status: 'DELIVERED',
          statusLabel: 'Entregado',
        },
      }));
    } catch {
      setActionError('No se pudo confirmar la entrega con el servidor. Por favor intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  /** HU-10: repartidor cancela el modal → no hace nada */
  const handleCancelFinalize = () => {
    setShowConfirmModal(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('medigo_token');
    localStorage.removeItem('medigo_user');
    navigate('/');
  };

  /** Formatea fecha de entrega */
  const fmtDeliveredAt = (date) =>
    date
      ? date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
      : '';

  return (
    <div className="driver-map-page">
      <PageLoadingOverlay visible={showLoader} message="Cargando mapa de entregas..." />

      {/* HU-10: Modal de confirmación de entrega */}
      {showConfirmModal && (
        <div className="delivery-confirm-overlay" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
          <div className="delivery-confirm-modal">
            <div className="delivery-confirm-icon">
              <span className="material-symbols-outlined">local_shipping</span>
            </div>
            <h2 id="confirm-title">¿Confirmar entrega?</h2>
            <p>
              Estás por marcar el pedido <strong>#{selectedOrder.id}</strong> como entregado.
              Esta acción no se puede deshacer.
            </p>
            <div className="delivery-confirm-address">
              <span className="material-symbols-outlined">location_on</span>
              {selectedOrder.destinationAddress}
            </div>
            <div className="delivery-confirm-actions">
              <button
                type="button"
                id="btn-cancel-finalize"
                className="delivery-confirm-btn--cancel"
                onClick={handleCancelFinalize}
              >
                Cancelar
              </button>
              <button
                type="button"
                id="btn-confirm-finalize"
                className="delivery-confirm-btn--confirm"
                onClick={handleConfirmFinalize}
                disabled={loading}
              >
                <span className="material-symbols-outlined">check_circle</span>
                Confirmar entrega
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="driver-layout">
        <aside className="driver-sidenav" aria-label="Navegacion de repartidor">
          <div className="driver-side-head">
            <MedigoSidebarBrand
              containerClassName="driver-side-brand"
              logoContainerClassName="driver-side-logo"
              textContainerClassName="driver-side-brand-text"
              title="Driver Portal"
              subtitle="Clinical Logistics Unit"
            />
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

              {/* HU-10: marcador del repartidor cambia a "libre" tras la entrega */}
              {deliveryCompleted ? (
                <div className="driver-marker truck-free">
                  <span className="material-symbols-outlined">local_shipping</span>
                </div>
              ) : (
                <div className="driver-marker truck-busy">
                  <span className="material-symbols-outlined">local_shipping</span>
                </div>
              )}

              <div className="driver-self-marker">
                <div className="pulse" />
                <div className="dot-wrap">
                  <div className="dot" />
                </div>
                <span className="tag">Tu ubicacion</span>
              </div>

              {!deliveryCompleted && (
                <svg className="driver-route-svg" viewBox="0 0 1200 720" preserveAspectRatio="none" aria-hidden="true">
                  <path d="M 180 520 C 260 470, 340 410, 430 395 C 515 380, 575 420, 650 350 C 760 250, 820 220, 980 200" />
                </svg>
              )}
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

            {/* ── Tarjeta de pedido ─── */}
            <article className="driver-order-card" aria-label="Detalle de pedido actual">
              {/* HU-10: Vista post-entrega */}
              {deliveryCompleted ? (
                <div className="delivery-success-panel" aria-live="polite">
                  <div className="delivery-success-icon">
                    <span className="material-symbols-outlined">task_alt</span>
                  </div>
                  <h2 className="delivery-success-title">¡Entrega completada!</h2>
                  <p className="delivery-success-sub">
                    Pedido <strong>#{selectedOrder.id}</strong> entregado exitosamente
                  </p>
                  {deliveredAt && (
                    <div className="delivery-success-time">
                      <span className="material-symbols-outlined">schedule</span>
                      Entregado a las {fmtDeliveredAt(deliveredAt)}
                    </div>
                  )}
                  <button
                    type="button"
                    id="btn-next-order"
                    className="accept-order-btn"
                    onClick={() => {
                      setDeliveryCompleted(false);
                      setDeliveredAt(null);
                      setDashboardData(FALLBACK_DATA);
                    }}
                  >
                    <span className="material-symbols-outlined">arrow_forward</span>
                    Ver siguiente pedido
                  </button>
                </div>
              ) : (
                /* Vista normal del pedido */
                <>
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

                  {/* Botón principal HU-10: Finalizar Entrega (aparece cuando está EN_ROUTE) */}
                  {selectedOrder.status === 'IN_ROUTE' ? (
                    <button
                      type="button"
                      id="btn-finalize-delivery"
                      className="finalize-delivery-btn"
                      onClick={handleFinalizeClick}
                      disabled={loading}
                    >
                      <span className="material-symbols-outlined">task_alt</span>
                      {loading ? 'Procesando...' : 'Finalizar Entrega'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="accept-order-btn"
                      onClick={handleAcceptOrder}
                      disabled={loading}
                    >
                      <span className="material-symbols-outlined">check_circle</span>
                      {loading ? 'Procesando...' : 'Aceptar Pedido'}
                    </button>
                  )}

                  {actionError ? <p style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#ba1a1a' }}>{actionError}</p> : null}
                </>
              )}
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
