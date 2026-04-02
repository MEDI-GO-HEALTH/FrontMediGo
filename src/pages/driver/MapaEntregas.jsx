/**
 * MapaEntregas.jsx (Map Page - Driver)
 * ═════════════════════════════════════════════════════════════════
 * Página de mapa de entregas para repartidores
 * - Mapa interactivo con ubicación actual
 * - Panel de pedidos disponibles
 * - Aceptar/rechazar pedidos
 */

import DriverSidebar from '../../components/layout/DriverSidebar'

export default function MapaEntregas() {
  return (
    <div className="bg-surface h-screen overflow-hidden">
      <DriverSidebar />

      <main className="ml-72 pt-16 h-full relative">
        {/* Map Background */}
        <div className="absolute inset-0 bg-slate-100">
          <img
            className="w-full h-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAwjnP8A_l6GXYHx3BO6JrZexfgAVRJoumb82nDZGAw9IkXU2-7QiODHpPcEHfTvQrqq4RAtAG1111JWLXabE8YYyHcpJUyf3xnCx7NNK-FMZgtII-h7Fe3v15oWKpybhlsAg8DFVh4E4naakl-rQrEIQ3zuCO_8GKAOOCJR9S3dq5_E8S7pl_jFvIXCj2Jren-Yfl9NKCb1wP83TnrkPflF8dWBg_Rl7mH2T8UFewf9P3T9Xll1Ca-X-Mbw2Zo-uDKS0zFWyQC3aET"
            alt="Mapa de entregas"
          />
          {/* Current Location Marker */}
          <div className="absolute top-[45%] left-[45%] w-6 h-6 bg-sky-600 rounded-full border-4 border-white shadow-xl animate-pulse"></div>
        </div>

        {/* Order Details Card */}
        <div className="absolute bottom-10 left-10 w-[420px] bg-white rounded-2xl shadow-2xl p-8 border border-slate-200">
          <span className="bg-sky-100 text-sky-800 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest">
            EPS Sanitas
          </span>
          <h2 className="text-2xl font-bold mt-4">Pedido #MG-8829</h2>
          <p className="text-slate-500 text-sm mb-6">Entrega de 12 ítems • 2.4 km</p>

          {/* Order Details */}
          <div className="space-y-4 mb-6 p-4 bg-surface-container-low rounded-lg">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Origen</p>
              <p className="font-semibold text-sm">Centro Logístico Central</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Destino</p>
              <p className="font-semibold text-sm">EPS Sanitas - Calle 5 #45-10</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button className="flex-1 bg-gradient-to-r from-primary to-primary-container text-white py-4 rounded-xl font-bold hover:shadow-lg transition-shadow">
              Aceptar Pedido
            </button>
            <button className="flex-1 bg-surface-container text-on-surface py-4 rounded-xl font-bold hover:bg-surface-container-high transition-colors">
              Rechazar
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
