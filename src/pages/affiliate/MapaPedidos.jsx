/**
 * MapaPedidos.jsx (Map Page - Affiliate)
 * ═════════════════════════════════════════════════════════════════
 * Página de mapa logístico para afiliados
 * - Mapa interactivo con ubicaciones
 * - Panel lateral con información de pedidos
 * - Confirmación de logística
 */

import { useState } from 'react'
import AffiliateSidebar from '../../components/layout/AffiliateSidebar'
import { ROUTES } from '../../constants/routes'

export default function MapaPedidos() {
  const [selectedOrder, setSelectedOrder] = useState({
    id: 'MG-8829',
    facility: 'EPS Sanitas',
    items: 12,
    distance: '2.4 km',
  })

  return (
    <div className="bg-background font-body text-on-surface overflow-hidden h-screen">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl shadow-sm sticky top-0 z-50 flex justify-between items-center w-full px-8 py-4 border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary-container flex items-center justify-center text-white">
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              medical_services
            </span>
          </div>
          <span className="text-2xl font-bold text-sky-900">MediGo Affiliate</span>
        </div>
        <button className="bg-primary text-white px-6 py-2 rounded-md font-semibold text-sm hover:shadow-lg transition-shadow">
          Nuevo Pedido
        </button>
      </header>

      <div className="flex h-[calc(100vh-76px)]">
        <AffiliateSidebar />

        {/* Main Content */}
        <main className="flex-1 relative flex lg:ml-64">
          {/* Map Section */}
          <div className="flex-1 relative bg-slate-200 overflow-hidden">
            <img
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDjbN4oniwwyOEMsFM0zsG9ucDESQkOZiG2j7Y33J6V2_2wcltCa9pQLKs6J_rB6snK1lKDWeBrHqflFhNYT_59eHkLgzKYk5Ph9PORKlsX0JrN8A0gY7xK42GbcZA6DmZB_WU2wpooJFX35OZ1U0ImWOPG7SQHCR-sv0I1s1tPLjTuNyuSqiIclHqaeYGAtz6Ra7Xtadeef-KrXMp80e65IBRTAmISgB-p2NNcjGT0xEDTKbIjGt0i2ZEXGHW5jQ6WSo2MUYzX3VMa"
              alt="Mapa de entregas"
            />
            {/* Marker */}
            <div className="absolute top-[45%] left-[45%] w-6 h-6 bg-primary rounded-full border-4 border-white shadow-xl animate-pulse"></div>
          </div>

          {/* Order Details Panel */}
          <aside className="w-96 h-full bg-white/95 border-l border-slate-200 p-8 overflow-y-auto shadow-2xl">
            <h3 className="text-xl font-extrabold text-primary mb-6">Logística de Pedido</h3>

            {/* Order Info */}
            <div className="space-y-4 mb-8">
              <div>
                <span className="bg-sky-100 text-sky-800 text-[10px] font-bold px-2 py-1 rounded">
                  {selectedOrder.facility}
                </span>
                <h2 className="text-2xl font-bold mt-2">Pedido #{selectedOrder.id}</h2>
                <p className="text-slate-500 text-sm">
                  Entrega de {selectedOrder.items} ítems • {selectedOrder.distance}
                </p>
              </div>

              {/* Pickup Location */}
              <div className="bg-surface-container-low p-4 rounded-lg">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Origen</p>
                <p className="font-semibold">Centro Logístico Central</p>
                <p className="text-sm text-slate-500">Cra. 45 #23-10, Bogotá</p>
              </div>

              {/* Delivery Location */}
              <div className="bg-surface-container-low p-4 rounded-lg">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Destino</p>
                <p className="font-semibold">EPS Sanitas Cali</p>
                <p className="text-sm text-slate-500">Cra. 5 #100-50, Cali</p>
              </div>

              {/* Medicine List */}
              <div className="bg-surface-container-low p-4 rounded-lg">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Medicamentos</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Amoxicilina 500mg</span>
                    <span className="font-bold">24 cajas</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Insulina Glargina</span>
                    <span className="font-bold">12 frascos</span>
                  </div>
                </div>
              </div>

              {/* Search Input */}
              <input
                className="w-full bg-slate-100 p-4 rounded-xl border-none text-sm focus:ring-2 focus:ring-primary/20"
                placeholder="Buscar repartidor..."
                type="text"
              />
            </div>

            {/* Action Button */}
            <button className="w-full bg-gradient-to-r from-primary to-primary-container text-white py-4 rounded-xl font-bold hover:shadow-lg transition-shadow">
              Confirmar Logística
            </button>
          </aside>
        </main>
      </div>
    </div>
  )
}
