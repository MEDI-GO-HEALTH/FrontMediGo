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
  const driverId = user?.user_id || user?.id || 14;

  const { deliveries, availableOrders, isConnected } = useTracking({
    deliveryId: driverId,
    enablePublishing: true
  });

  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const courierMarkersRef = useRef({});
  const pickupMarkersRef = useRef({});
  const deliveryMarkersRef = useRef({});
  const routePolylineRef = useRef(null);

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

  const calculateRoute = async (start, end) => {
    try {
      const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`);
      const data = await res.json();
      if (data.routes && data.routes[0]) {
        return data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
      }
    } catch (e) { console.warn("Error OSRM:", e); }
    return [];
  };

  // --- 1. Sincronizar Marcadores Fijos (Pickup y Delivery) ---
  useEffect(() => {
    if (!mapInstance.current || !window.L) return;

    // Limpiar marcadores que ya no están en mis pedidos
    const currentOrderIds = myOrders.map(o => o.id);
    Object.keys(pickupMarkersRef.current).forEach(id => {
      if (!currentOrderIds.includes(Number(id))) {
        pickupMarkersRef.current[id].remove();
        delete pickupMarkersRef.current[id];
      }
    });
    Object.keys(deliveryMarkersRef.current).forEach(id => {
      if (!currentOrderIds.includes(Number(id))) {
        deliveryMarkersRef.current[id].remove();
        delete deliveryMarkersRef.current[id];
      }
    });

    myOrders.forEach(order => {
      // Marcador de Recogida (Farmacia) - PERMANENTE
      if (order.pickupLat && order.pickupLng && !pickupMarkersRef.current[order.id]) {
        const icon = window.L.divIcon({
          html: `<div style="background: #e91e63; color: white; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 3px 10px rgba(0,0,0,0.3);"><span class="material-symbols-outlined" style="font-size: 20px;">local_pharmacy</span></div>`,
          className: 'custom-div-icon', iconSize: [32, 32]
        });
        pickupMarkersRef.current[order.id] = window.L.marker([order.pickupLat, order.pickupLng], { icon })
          .addTo(mapInstance.current)
          .bindPopup(`<b>Recoger:</b> ${order.branchName}`);
      }

      // Marcador de Entrega (Casa) - PERMANENTE
      if (order.deliveryLat && order.deliveryLng && !deliveryMarkersRef.current[order.id]) {
        const icon = window.L.divIcon({
          html: `<div style="background: #1976d2; color: white; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 3px 10px rgba(0,0,0,0.3);"><span class="material-symbols-outlined" style="font-size: 20px;">home</span></div>`,
          className: 'custom-div-icon', iconSize: [32, 32]
        });
        deliveryMarkersRef.current[order.id] = window.L.marker([order.deliveryLat, order.deliveryLng], { icon })
          .addTo(mapInstance.current)
          .bindPopup(`<b>Entregar en:</b><br>${order.deliveryAddress}`);
      }
    });
  }, [myOrders]);

  // --- 2. Sincronizar Ruta Dinámica (Seguimiento) ---
  useEffect(() => {
    if (!mapInstance.current || !window.L) return;

    const updateRoute = async () => {
      if (routePolylineRef.current) routePolylineRef.current.remove();

      const myLoc = deliveries.find(d => d.id == driverId);
      if (!myLoc || myOrders.length === 0) return;

      const active = myOrders[0];
      const target = active.status === 'ASSIGNED' 
        ? [active.pickupLat, active.pickupLng] 
        : [active.deliveryLat, active.deliveryLng];
      
      const path = await calculateRoute([myLoc.latitude, myLoc.longitude], target);
      if (path.length > 0) {
        routePolylineRef.current = window.L.polyline(path, { color: '#1976d2', weight: 6, opacity: 0.6, dashArray: '10, 15' }).addTo(mapInstance.current);
      }
    };

    updateRoute();
  }, [myOrders, deliveries]);

  // --- 3. Sincronizar Otros Repartidores ---
  useEffect(() => {
    if (!mapInstance.current || !window.L) return;
    deliveries.forEach(d => {
      const isMe = d.id == driverId;
      if (courierMarkersRef.current[d.id]) {
        courierMarkersRef.current[d.id].setLatLng([d.latitude, d.longitude]);
      } else {
        const icon = window.L.divIcon({
          html: `<div style="background: ${isMe ? '#1976d2' : '#4caf50'}; width: 22px; height: 22px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.2);"></div>`,
          className: 'custom-div-icon', iconSize: [22, 22]
        });
        courierMarkersRef.current[d.id] = window.L.marker([d.latitude, d.longitude], { icon }).addTo(mapInstance.current);
      }
    });
  }, [deliveries]);

  const handleAccept = async (orderId) => {
    setLoading(true);
    try {
      await acceptOrder(orderId, driverId);
      await loadMyOrders();
    } catch (e) { alert("Error: " + e.message); }
    setLoading(false);
  };

  return (
    <div className="driver-map-page">
      <div className="driver-layout">
        <aside className="driver-sidenav">
          <div className="driver-side-head">
            <h1>MediGo Repartidor</h1>
            <p>ID: {driverId}</p>
            <div style={{ padding: '8px', background: isConnected ? '#e8f5e9' : '#ffebee', borderRadius: '6px', marginTop: '10px', fontSize: '11px', color: isConnected ? '#2e7d32' : '#c62828' }}>
              {isConnected ? '● Conexión GPS Activa' : '○ GPS Desconectado'}
            </div>
          </div>
          <nav>
            <button className="driver-nav-btn active">Ruta Actual</button>
            <button className="driver-nav-btn" onClick={() => navigate('/')}>Salir</button>
          </nav>
        </aside>

        <main className="driver-main">
          <div className="driver-main-stage">
            <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

            {/* Mercado Global */}
            <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 1000, background: 'white', padding: '15px', borderRadius: '12px', width: '260px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
              <h4 style={{ marginBottom: '12px' }}>📦 Pedidos Disponibles</h4>
              {availableOrders.length === 0 && <p style={{ fontSize: '12px', color: '#999', textAlign: 'center' }}>Buscando pedidos...</p>}
              {availableOrders.map(order => (
                <div key={order.id} style={{ padding: '10px', border: '1px solid #eee', borderRadius: '8px', marginBottom: '8px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 'bold' }}>Pedido #{order.orderNumber}</div>
                  <button onClick={() => handleAccept(order.id)} disabled={loading} style={{ width: '100%', marginTop: '5px', background: '#ff9800', color: 'white', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Aceptar</button>
                </div>
              ))}
            </div>

            {/* Panel de Tarea */}
            <div className="driver-orders-container" style={{ position: 'absolute', bottom: '20px', left: '20px', right: '20px', zIndex: 1000, display: 'flex', gap: '15px' }}>
              {myOrders.map(order => (
                <article key={order.id} style={{ background: 'white', padding: '20px', borderRadius: '16px', minWidth: '350px', boxShadow: '0 10px 30px rgba(0,0,0,0.25)', borderLeft: '6px solid #1976d2' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '15px' }}>
                    {order.status === 'ASSIGNED' ? '🚩 Siguiente parada: Recoger' : '🏠 Siguiente parada: Entregar'}
                  </div>

                  <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '11px', color: '#e91e63', fontWeight: 'bold', margin: 0 }}>ORIGEN (Rosa)</p>
                      <p style={{ fontSize: '13px', fontWeight: '500' }}>{order.branchName}</p>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '11px', color: '#1976d2', fontWeight: 'bold', margin: 0 }}>DESTINO (Azul)</p>
                      <p style={{ fontSize: '13px', fontWeight: '500' }}>{order.deliveryAddress}</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    {order.status === 'ASSIGNED' ? (
                      <button onClick={() => pickupDelivery(order.id).then(loadMyOrders)} style={{ flex: 1, background: '#e91e63', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>He recogido el pedido</button>
                    ) : (
                      <button onClick={() => completeDelivery(order.id).then(loadMyOrders)} style={{ flex: 1, background: '#4caf50', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Confirmar Entrega Final</button>
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
