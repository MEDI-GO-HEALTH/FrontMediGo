import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { getActiveDeliveries, completeDelivery, pickupDelivery, acceptOrder } from '../../api/logisticsService';
import { useTracking } from '../../hooks/useTracking';
import '../../styles/driver/mapa-entregas.css';

const BOGOTA_CENTER = [4.7110, -74.0721];

export default function MapaEntregas() {
  const navigate = useNavigate();
  const [myOrders, setMyOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const userStr = localStorage.getItem('medigo_user');
  const user = userStr ? JSON.parse(userStr) : null;
  const driverId = user?.user_id || user?.id;

  const { deliveries, branches, availableOrders, isConnected } = useTracking({
    deliveryId: driverId,
    enablePublishing: true
  });

  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef({});
  const branchMarkersRef = useRef({});

  const loadMyOrders = async () => {
    if (!driverId) return;
    try {
      const orders = await getActiveDeliveries(driverId);
      setMyOrders(orders);
    } catch (e) { console.warn(e); }
  };

  useEffect(() => { loadMyOrders(); }, [driverId]);

  useEffect(() => {
    if (!mapInstance.current && window.L && mapRef.current) {
      mapInstance.current = window.L.map(mapRef.current).setView(BOGOTA_CENTER, 13);
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapInstance.current);
    }
  }, []);

  // Marcadores de farmacias y repartidores (Igual que antes...)
  useEffect(() => {
    if (!mapInstance.current || !window.L) return;
    branches.forEach(b => {
      if (branchMarkersRef.current[b.id]) return;
      const icon = window.L.divIcon({
        html: `<div style="background: #e91e63; color: white; border-radius: 50%; width: 25px; height: 25px; display: flex; align-items: center; justify-content: center; border: 2px solid white;"><span class="material-symbols-outlined" style="font-size: 14px;">local_pharmacy</span></div>`,
        className: 'custom-div-icon', iconSize: [25, 25]
      });
      branchMarkersRef.current[b.id] = window.L.marker([b.latitude, b.longitude], { icon }).addTo(mapInstance.current);
    });
  }, [branches]);

  useEffect(() => {
    if (!mapInstance.current || !window.L) return;
    deliveries.forEach(d => {
      const isMe = d.id === driverId || d.id === `driver-${driverId}`;
      if (markersRef.current[d.id]) {
        markersRef.current[d.id].setLatLng([d.latitude, d.longitude]);
      } else {
        const icon = window.L.divIcon({
          html: `<div style="background: ${isMe ? '#1976d2' : '#4caf50'}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white;"></div>`,
          className: 'custom-div-icon', iconSize: [20, 20]
        });
        markersRef.current[d.id] = window.L.marker([d.latitude, d.longitude], { icon }).addTo(mapInstance.current);
      }
    });
  }, [deliveries, driverId]);

  const handleAccept = async (orderId) => {
    setLoading(true);
    try {
      await acceptOrder(orderId, driverId);
      await loadMyOrders();
      alert("¡Pedido aceptado!");
    } catch (e) { alert("Error al aceptar: " + e.message); }
    setLoading(false);
  };

  return (
    <div className="driver-map-page">
      <div className="driver-layout">
        <aside className="driver-sidenav">
          <div className="driver-side-head">
            <h1>Panel Repartidor</h1>
            <p>ID: {driverId}</p>
          </div>
          <nav>
            <button className="driver-nav-btn active">Entregas</button>
            <button className="driver-nav-btn" onClick={() => navigate('/')}>Cerrar Sesión</button>
          </nav>
        </aside>

        <main className="driver-main">
          <div className="driver-main-stage">
            <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

            {/* Mercado Global de Pedidos */}
            <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 1000, background: 'white', padding: '15px', borderRadius: '12px', width: '250px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
              <h4 style={{ marginBottom: '10px' }}>🛒 Mercado Global</h4>
              {availableOrders.length === 0 && <p style={{ fontSize: '12px', color: '#999' }}>No hay pedidos nuevos...</p>}
              {availableOrders.map(order => (
                <div key={order.id} style={{ padding: '10px', border: '1px solid #eee', borderRadius: '8px', marginBottom: '10px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 'bold' }}>#{order.orderNumber}</div>
                  <div style={{ fontSize: '11px' }}>Total: ${order.total}</div>
                  <button onClick={() => handleAccept(order.id)} disabled={loading} style={{ width: '100%', marginTop: '5px', background: '#ff9800', color: 'white', border: 'none', padding: '5px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>Aceptar</button>
                </div>
              ))}
            </div>

            {/* Mis Entregas Activas */}
            <div className="driver-orders-overlay" style={{ position: 'absolute', bottom: '20px', left: '20px', right: '20px', zIndex: 1000, display: 'flex', gap: '15px', overflowX: 'auto' }}>
              {myOrders.map(order => (
                <article key={order.id} style={{ background: 'white', padding: '15px', borderRadius: '12px', minWidth: '280px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
                  <div style={{ fontWeight: 'bold', color: '#1976d2' }}>Mi Entrega Activa: {order.status}</div>
                  <p style={{ fontSize: '12px' }}>Pedido #{order.orderId}</p>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    {order.status !== 'IN_ROUTE' ? (
                      <button onClick={() => pickupDelivery(order.id).then(loadMyOrders)} style={{ flex: 1, background: '#1976d2', color: 'white', border: 'none', padding: '8px', borderRadius: '6px' }}>Recoger</button>
                    ) : (
                      <button onClick={() => completeDelivery(order.id).then(loadMyOrders)} style={{ flex: 1, background: '#4caf50', color: 'white', border: 'none', padding: '8px', borderRadius: '6px' }}>Entregar</button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
