import { useEffect, useState, useRef } from 'react'
import { getMe } from '../../api/authService'
import { getCart, addToCart, confirmOrder } from '../../api/orderService'
import AffiliateShell from '../../components/layout/AffiliateShell'
import { useTracking } from '../../hooks/useTracking'
import '../../styles/affiliate/perfil-afiliado.css'
import '../../styles/affiliate/mapa-pedidos.css'

const BOGOTA_CENTER = [4.7110, -74.0721];

export default function MapaPedidos() {
  const [userProfile, setUserProfile] = useState(null);
  const [cart, setCart] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [isOrdering, setIsOrdering] = useState(false);
  const [routeData, setRouteData] = useState({
    origin: 'Seleccione una farmacia en el mapa',
    destination: 'Cargando dirección...',
  });

  const { deliveries, branches, activeOrder, isConnected } = useTracking();

  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const courierMarkersRef = useRef({});
  const branchMarkersRef = useRef({});
  const destinationMarkerRef = useRef(null);

  // 1. Inicializar perfil
  useEffect(() => {
    const init = async () => {
      try {
        const profile = await getMe();
        setUserProfile(profile);
        setRouteData(prev => ({ ...prev, destination: profile.address || 'Sin dirección' }));
        if (profile.address) geocodeAddress(profile.address);
      } catch (err) { console.error(err); }
    };
    init();
  }, []);

  // 2. Cargar carrito cuando cambia la sede seleccionada
  useEffect(() => {
    if (userProfile?.user_id && selectedBranch?.id) {
      getCart(userProfile.user_id, selectedBranch.id)
        .then(setCart)
        .catch(() => setCart(null));
    }
  }, [selectedBranch, userProfile]);

  const handleAddToCart = async (medId) => {
    if (!userProfile?.user_id || !selectedBranch?.id) {
      alert("Por favor selecciona una farmacia en el mapa primero");
      return;
    }
    try {
      const updatedCart = await addToCart({
        affiliateId: userProfile.user_id,
        branchId: selectedBranch.id,
        medicationId: medId,
        quantity: 1
      });
      setCart(updatedCart);
    } catch (e) { alert("Error al añadir: " + e.message); }
  };

  const handleConfirmOrder = async () => {
    if (!cart || !userProfile?.user_id || !selectedBranch?.id) return;
    setIsOrdering(true);
    try {
      // Mock de datos requeridos por ConfirmOrderRequest en el backend
      await confirmOrder(selectedBranch.id, userProfile.user_id, {
        street: "Calle Demo",
        streetNumber: "123",
        city: "Bogotá",
        commune: "Usaquén",
        latitude: BOGOTA_CENTER[0],
        longitude: BOGOTA_CENTER[1]
      });
      alert("¡Pedido confirmado! Buscando repartidor...");
      setCart(null);
    } catch (e) { alert("Error: " + e.message); }
    setIsOrdering(false);
  };

  // --- Mapa ---
  const geocodeAddress = async (address) => {
    const query = encodeURIComponent(`${address}, Bogotá, Colombia`);
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`);
    const data = await res.json();
    if (data?.[0]) updateDestinationMarker([parseFloat(data[0].lat), parseFloat(data[0].lon)], address);
  };

  const updateDestinationMarker = (coords, address) => {
    if (!mapInstance.current || !window.L) return;
    if (destinationMarkerRef.current) destinationMarkerRef.current.remove();
    const homeIcon = window.L.divIcon({
      html: '<span class="material-symbols-outlined" style="color: #1976d2; font-size: 32px; background: white; border-radius: 50%; padding: 4px; border: 2px solid #1976d2;">home</span>',
      className: 'custom-div-icon', iconSize: [40, 40]
    });
    destinationMarkerRef.current = window.L.marker(coords, { icon: homeIcon }).addTo(mapInstance.current);
  };

  useEffect(() => {
    if (!mapInstance.current && window.L && mapRef.current) {
      mapInstance.current = window.L.map(mapRef.current).setView(BOGOTA_CENTER, 13);
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapInstance.current);
    }
  }, []);

  // Sincronizar Farmacias
  useEffect(() => {
    if (!mapInstance.current || !window.L) return;
    branches.forEach(b => {
      if (branchMarkersRef.current[b.id]) return;
      const farmIcon = window.L.divIcon({
        html: `<div class="map-marker" style="background: #e91e63; color: white; border-radius: 50%; width: 35px; height: 35px; display: flex; align-items: center; justify-content: center; border: 2px solid white; cursor: pointer;"><span class="material-symbols-outlined" style="font-size: 20px;">local_pharmacy</span></div>`,
        className: 'custom-div-icon', iconSize: [35, 35]
      });
      const marker = window.L.marker([b.latitude, b.longitude], { icon: farmIcon }).addTo(mapInstance.current);
      marker.on('click', () => {
        setSelectedBranch(b);
        setRouteData(prev => ({ ...prev, origin: b.name }));
      });
      branchMarkersRef.current[b.id] = marker;
    });
  }, [branches]);

  // Sincronizar Repartidores
  useEffect(() => {
    if (!mapInstance.current || !window.L) return;
    deliveries.forEach(d => {
      const isMyDriver = activeOrder && (d.orderId == activeOrder.id || d.id == activeOrder.driverId);
      const markerColor = isMyDriver ? '#1976d2' : '#4caf50';
      const size = isMyDriver ? 40 : 30;

      if (courierMarkersRef.current[d.id]) {
        courierMarkersRef.current[d.id].setLatLng([d.latitude, d.longitude]);
        // Actualizar icono si cambia el estado de asignación
        if (isMyDriver) {
           const pulseIcon = window.L.divIcon({
            html: `<div class="map-marker" style="background: #1976d2; color: white; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 0 15px rgba(25,118,210,0.6);"><span class="material-symbols-outlined" style="font-size: 24px;">electric_moped</span></div>`,
            className: 'custom-div-icon', iconSize: [40, 40]
          });
          courierMarkersRef.current[d.id].setIcon(pulseIcon);
        }
      } else {
        const icon = window.L.divIcon({
          html: `<div class="map-marker" style="background: ${markerColor}; color: white; border-radius: 50%; width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center; border: 2px solid white;"><span class="material-symbols-outlined" style="font-size: ${size/1.6}px;">electric_moped</span></div>`,
          className: 'custom-div-icon', iconSize: [size, size]
        });
        courierMarkersRef.current[d.id] = window.L.marker([d.latitude, d.longitude], { icon }).addTo(mapInstance.current);
      }
    });
  }, [deliveries, activeOrder]);

  return (
    <AffiliateShell active="map" contentMode="fluid">
      <div className="affiliate-map-workspace">
        <section className="map-viewport">
          <div ref={mapRef} style={{ width: '100%', height: '100%', minHeight: '650px' }} />
          
          {/* Catalogo Dinámico Basado en la Sede Seleccionada */}
          {selectedBranch && (
            <div style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 1000, background: 'white', padding: '15px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', width: '220px' }}>
              <h5 style={{ marginBottom: '5px' }}>{selectedBranch.name}</h5>
              <p style={{ fontSize: '11px', color: '#666', marginBottom: '10px' }}>Productos disponibles:</p>
              {selectedBranch.medications?.map(med => (
                <button key={med.id} onClick={() => handleAddToCart(med.id)} style={{ width: '100%', marginBottom: '5px', padding: '8px', fontSize: '12px', cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{med.name}</span>
                  <span style={{ fontWeight: 'bold' }}>+</span>
                </button>
              ))}
            </div>
          )}
        </section>

        <aside className="logistics-panel">
          <div className="panel-header">
            <h3>Mi Pedido</h3>
            <p>{isConnected ? '🟢 Sistema Online' : '🔴 Desconectado'}</p>
          </div>

          <div className="panel-body">
            {activeOrder ? (
              <div className="active-order-status" style={{ background: '#e3f2fd', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #1976d2' }}>
                <h4 style={{ color: '#1976d2' }}>{activeOrder.status === 'DELIVERED' ? '✅ ENTREGADO' : `Estado: ${activeOrder.status}`}</h4>
                <p style={{ fontSize: '13px', marginTop: '5px' }}>{activeOrder.message || 'Tu pedido está siendo procesado.'}</p>
              </div>
            ) : selectedBranch ? (
              <div className="cart-summary">
                <label className="panel-label">Carrito: {selectedBranch.name}</label>
                <div style={{ margin: '15px 0' }}>
                  {!cart || cart.items?.length === 0 ? (
                    <p style={{ fontSize: '13px', color: '#999' }}>Carrito vacío. Agrega productos del catálogo.</p>
                  ) : (
                    <>
                      {cart.items.map(item => (
                        <div key={item.medicationId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '5px' }}>
                          <span>Med ID #{item.medicationId} x{item.quantity}</span>
                          <span>${item.subtotal}</span>
                        </div>
                      ))}
                      <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '10px 0' }}/>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                        <span>Total:</span><span>${cart.totalPrice}</span>
                      </div>
                      <button onClick={handleConfirmOrder} disabled={isOrdering} style={{ width: '100%', background: '#1976d2', color: 'white', border: 'none', padding: '12px', borderRadius: '6px', cursor: 'pointer', marginTop: '15px', fontWeight: 'bold' }}>
                        {isOrdering ? 'Procesando...' : 'Confirmar Pedido'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#ccc' }}>touch_app</span>
                <p style={{ marginTop: '10px' }}>Toca una farmacia (icono rosa) para ver sus productos e iniciar un pedido.</p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </AffiliateShell>
  )
}
