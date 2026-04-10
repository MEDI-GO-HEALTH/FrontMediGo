import { useEffect, useState, useRef } from 'react'
import { getMe } from '../../api/authService'
import { getCart, addToCart, confirmOrder } from '../../api/orderService'
import { getSedes, getSedeMedications } from '../../api/sedesService'
import AffiliateShell from '../../components/layout/AffiliateShell'
import { useTracking } from '../../hooks/useTracking'
import '../../styles/affiliate/perfil-afiliado.css'
import '../../styles/affiliate/mapa-pedidos.css'

const BOGOTA_CENTER = [4.7110, -74.0721];

export default function MapaPedidos() {
  const [userProfile, setUserProfile] = useState(null);
  const [realBranches, setRealBranches] = useState([]);
  const [cart, setCart] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [isOrdering, setIsOrdering] = useState(false);
  
  // Nuevo: Estado para la ubicación de entrega dinámica
  const [deliveryLocation, setDeliveryLocation] = useState({
    coords: BOGOTA_CENTER,
    address: 'Selecciona una ubicación en el mapa'
  });

  const { deliveries, activeOrder } = useTracking();

  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const courierMarkersRef = useRef({});
  const branchMarkersRef = useRef({});
  const destinationMarkerRef = useRef(null);

  // 2. Lógica de selección de ubicación
  async function updateDeliveryMarker(latlng, skipReverseGeocode = false) {
    if (!mapInstance.current || !window.L) return;
    
    const coords = [latlng.lat, latlng.lng];
    
    // Mover o crear marcador
    if (destinationMarkerRef.current) {
      destinationMarkerRef.current.setLatLng(coords);
    } else {
      const homeIcon = window.L.divIcon({
        html: '<div style="background: #1976d2; color: white; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3);"><span class="material-symbols-outlined" style="font-size: 24px;">home</span></div>',
        className: 'custom-div-icon', iconSize: [40, 40]
      });
      destinationMarkerRef.current = window.L.marker(coords, { icon: homeIcon, draggable: true }).addTo(mapInstance.current);
      
      destinationMarkerRef.current.on('dragend', (e) => {
        updateDeliveryMarker(e.target.getLatLng());
      });
    }

    // Obtener dirección textual (Reverse Geocoding)
    let addressName = 'Ubicación seleccionada';
    if (!skipReverseGeocode) {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}`);
        const data = await res.json();
        addressName = data.display_name.split(',').slice(0, 2).join(',');
      } catch { console.warn("Reverse geocode failed"); }
    }

    setDeliveryLocation({ coords, address: addressName });
  }

  async function geocodeAddress(address) {
    try {
      const query = encodeURIComponent(`${address}, Bogotá, Colombia`);
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`);
      const data = await res.json();
      if (data?.[0]) {
        const latlng = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        if (mapInstance.current) {
          mapInstance.current.setView([latlng.lat, latlng.lng], 15);
          updateDeliveryMarker(latlng, true);
          setDeliveryLocation(prev => ({ ...prev, address }));
        }
      }
    } catch (e) { console.error("Geocoding failed", e); }
  }

  const handleUseGPS = () => {
    if (!navigator.geolocation) return alert("Tu navegador no soporta GPS");
    navigator.geolocation.getCurrentPosition((pos) => {
      const latlng = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      mapInstance.current.setView([latlng.lat, latlng.lng], 16);
      updateDeliveryMarker(latlng);
    }, (err) => alert("Error al obtener ubicación GPS: " + err.message));
  };

  // 1. Inicialización
  useEffect(() => {
    const init = async () => {
      try {
        const [profile, branchesData] = await Promise.all([getMe(), getSedes()]);
        setUserProfile(profile);
        setRealBranches(branchesData);

        if (profile.address) {
          geocodeAddress(profile.address);
        }
      } catch (err) { console.error("Error al inicializar mapa:", err); }
    };
    init();
  }, []);

  // 3. Inicializar Leaflet con eventos de clic
  useEffect(() => {
    if (!mapInstance.current && window.L && mapRef.current) {
      mapInstance.current = window.L.map(mapRef.current).setView(BOGOTA_CENTER, 12);
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapInstance.current);
      
      // Evento para poner ubicación manualmente
      mapInstance.current.on('click', (e) => {
        updateDeliveryMarker(e.latlng);
      });
    }
  }, []);

  // 4. Catálogo y Pedido
  const handleSelectBranch = async (branch) => {
    setSelectedBranch(branch);
    try {
      const meds = await getSedeMedications(branch.branchId);
      setSelectedBranch(prev => ({ ...prev, medications: meds }));
      if (userProfile?.user_id) {
        const currentCart = await getCart(userProfile.user_id, branch.branchId);
        setCart(currentCart?.cartId ? currentCart : null);
      }
    } catch (e) { console.warn("Error cargando detalles de sede:", e); }
  };

  const handleAddToCart = async (medId) => {
    if (!userProfile?.user_id || !selectedBranch?.branchId) return;
    try {
      const updatedCart = await addToCart({
        affiliateId: userProfile.user_id,
        branchId: selectedBranch.branchId,
        medicationId: medId,
        quantity: 1
      });
      setCart(updatedCart);
    } catch (e) { alert("Error: " + e.message); }
  };

  const handleConfirmOrder = async () => {
    if (!cart || !userProfile?.user_id || !selectedBranch?.branchId) return;
    setIsOrdering(true);
    try {
      // USAR UBICACIÓN DINÁMICA
      await confirmOrder(selectedBranch.branchId, userProfile.user_id, {
        street: deliveryLocation.address,
        streetNumber: "S/N", city: "Bogotá", commune: "Personalizada",
        latitude: deliveryLocation.coords[0], 
        longitude: deliveryLocation.coords[1]
      });
      alert("¡Pedido confirmado en tu ubicación seleccionada!");
      setCart(null);
    } catch (e) { alert("Error: " + e.message); }
    setIsOrdering(false);
  };

  // 5. Sincronización de Marcadores (Sedes y Repartidores)
  useEffect(() => {
    if (!mapInstance.current || !window.L) return;
    realBranches.forEach(b => {
      if (!b.latitude || !b.longitude || branchMarkersRef.current[b.branchId]) return;
      const icon = window.L.divIcon({
        html: `<div class="map-marker" style="background: #e91e63; color: white; border-radius: 50%; width: 35px; height: 35px; display: flex; align-items: center; justify-content: center; border: 2px solid white; cursor: pointer;"><span class="material-symbols-outlined" style="font-size: 20px;">local_pharmacy</span></div>`,
        className: 'custom-div-icon', iconSize: [35, 35]
      });
      const marker = window.L.marker([b.latitude, b.longitude], { icon }).addTo(mapInstance.current);
      marker.on('click', () => handleSelectBranch(b));
      branchMarkersRef.current[b.branchId] = marker;
    });
  }, [realBranches]);

  useEffect(() => {
    if (!mapInstance.current || !window.L) return;
    deliveries.forEach(d => {
      if (!d.latitude || !d.longitude) return;
      const isMyDriver = activeOrder && (d.orderId == activeOrder.id || d.id == activeOrder.driverId);
      const markerColor = isMyDriver ? '#1976d2' : '#4caf50';
      const size = isMyDriver ? 40 : 30;

      if (courierMarkersRef.current[d.id]) {
        courierMarkersRef.current[d.id].setLatLng([d.latitude, d.longitude]);
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
          
          {/* Botón GPS */}
          <button onClick={handleUseGPS} style={{ position: 'absolute', bottom: '30px', left: '20px', zIndex: 1000, background: 'white', border: 'none', padding: '10px', borderRadius: '50%', boxShadow: '0 4px 10px rgba(0,0,0,0.2)', cursor: 'pointer', display: 'flex' }} title="Usar mi ubicación GPS">
            <span className="material-symbols-outlined" style={{ color: '#1976d2' }}>my_location</span>
          </button>

          {selectedBranch && (
            <div className="catalog-overlay" style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 1000, background: 'white', padding: '15px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', width: '220px' }}>
              <h5 style={{ marginBottom: '5px' }}>{selectedBranch.branchName}</h5>
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {selectedBranch.medications?.map(med => (
                  <button key={med.medicationId} onClick={() => handleAddToCart(med.medicationId)} style={{ width: '100%', marginBottom: '5px', padding: '8px', fontSize: '12px', cursor: 'pointer', textAlign: 'left', border: '1px solid #eee', borderRadius: '4px', background: '#f9f9f9' }}>
                    {med.medicationName} - {med.quantity} disp.
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        <aside className="logistics-panel">
          <div className="panel-header"><h3>Dirección de Entrega</h3></div>
          <div className="panel-body">
            <div style={{ background: '#f5f5f5', padding: '12px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #ddd' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#1976d2' }}>location_on</span>
                <strong style={{ fontSize: '13px' }}>Enviar a:</strong>
              </div>
              <p style={{ fontSize: '12px', color: '#555', margin: 0 }}>{deliveryLocation.address}</p>
              <p style={{ fontSize: '10px', color: '#999', marginTop: '4px' }}>Toca el mapa para cambiar el punto de entrega</p>
            </div>

            {activeOrder ? (
              <div className="active-order-status" style={{ background: '#e3f2fd', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #1976d2' }}>
                <h4 style={{ color: '#1976d2' }}>{activeOrder.status === 'DELIVERED' ? '✅ ENTREGADO' : `Estado: ${activeOrder.status}`}</h4>
                <p style={{ fontSize: '13px', marginTop: '5px' }}>{activeOrder.message}</p>
              </div>
            ) : selectedBranch ? (
              <div className="cart-summary">
                <label className="panel-label">Carrito: {selectedBranch.branchName}</label>
                <div style={{ margin: '15px 0' }}>
                  {cart?.items?.map(item => (
                    <div key={item.medicationId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '5px' }}>
                      <span>Med #{item.medicationId} x{item.quantity}</span><span>${item.subtotal}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginTop: '10px' }}><span>Total:</span><span>${cart?.totalPrice || 0}</span></div>
                  <button onClick={handleConfirmOrder} disabled={isOrdering || !cart} style={{ width: '100%', background: '#1976d2', color: 'white', border: 'none', padding: '12px', borderRadius: '6px', cursor: 'pointer', marginTop: '15px', fontWeight: 'bold' }}>
                    Confirmar Pedido Real
                  </button>
                </div>
              </div>
            ) : <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>Toca una farmacia rosa para comprar.</p>}
          </div>
        </aside>
      </div>
    </AffiliateShell>
  )
}
