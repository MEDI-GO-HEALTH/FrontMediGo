/**
 * HistorialViajes.jsx (History Page - Driver)
 * ═════════════════════════════════════════════════════════════════
 * Página de historial de viajes
 * - Tabla de entregas completadas
 * - Estadísticas de desempeño
 * - Detalles de cada viaje
 */

import DriverSidebar from '../../components/layout/DriverSidebar'

export default function HistorialViajes() {
  return (
    <div className="bg-surface min-h-screen">
      <DriverSidebar />

      <main className="ml-72 p-12">
        <h3 className="text-3xl font-extrabold text-primary mb-8">Historial de Actividad</h3>

        {/* Statistics Cards */}
        <div className="grid grid-cols-3 gap-8 mb-12">
          <div className="bg-white p-8 rounded-xl shadow-sm border border-outline-variant">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Viajes Totales</p>
            <p className="text-4xl font-black text-primary mt-3">128</p>
            <p className="text-xs text-slate-500 mt-2">En toda tu carrera</p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-sm border border-outline-variant">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Viajes Este Mes</p>
            <p className="text-4xl font-black text-secondary mt-3">24</p>
            <p className="text-xs text-slate-500 mt-2">Entregas activas</p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-sm border border-outline-variant">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Calificación</p>
            <p className="text-4xl font-black text-primary mt-3">4.9★</p>
            <p className="text-xs text-slate-500 mt-2">De 5.0 estrellas</p>
          </div>
        </div>

        {/* History Table */}
        <div className="space-y-4">
          <h4 className="font-bold text-slate-600 uppercase tracking-widest text-sm">Viajes Recientes</h4>
          <div className="bg-white grid grid-cols-5 px-8 py-6 rounded-xl shadow-sm border border-outline-variant hover:bg-surface-container-low transition-colors">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">ID Pedido</p>
              <p className="font-bold">#MG-82910</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Fecha</p>
              <p className="font-semibold">12 Oct 2024</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Destino</p>
              <p className="font-semibold">Hospital Ángeles</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Distancia</p>
              <p className="font-semibold">5.2 km</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Estado</p>
              <p className="text-secondary font-bold">Completado</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
