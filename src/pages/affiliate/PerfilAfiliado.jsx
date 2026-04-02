/**
 * PerfilAfiliado.jsx (Profile Page - Affiliate)
 * ═════════════════════════════════════════════════════════════════
 * Página de perfil del afiliado
 * - Información personal
 * - Editar perfil
 * - Configuración de cuenta
 */

import AffiliateSidebar from '../../components/layout/AffiliateSidebar'

export default function PerfilAfiliado() {
  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <header className="bg-white/80 fixed top-0 w-full z-40 px-8 py-4 flex border-b shadow-sm">
        <span className="text-2xl font-bold text-sky-900">MediGo Affiliate</span>
      </header>

      <AffiliateSidebar />

      {/* Main Content */}
      <main className="lg:pl-64 pt-24 px-12">
        <h1 className="text-4xl font-extrabold text-primary mb-8">Perfil del Afiliado</h1>

        <div className="bg-white rounded-3xl p-8 border border-outline-variant shadow-sm max-w-2xl">
          <form className="space-y-6">
            {/* Full Name */}
            <div>
              <label className="text-sm font-bold text-slate-600 block mb-2">Nombre Completo</label>
              <input
                className="w-full bg-surface-container-low border-none rounded-xl p-4 focus:ring-2 focus:ring-primary/20"
                defaultValue="Dr. Alejandro Ramírez"
                readOnly
              />
            </div>

            {/* Email */}
            <div>
              <label className="text-sm font-bold text-slate-600 block mb-2">Correo Electrónico</label>
              <input
                className="w-full bg-surface-container-low border-none rounded-xl p-4 focus:ring-2 focus:ring-primary/20"
                type="email"
                defaultValue="a.ramirez@clinica-central.es"
                readOnly
              />
            </div>

            {/* Institution */}
            <div>
              <label className="text-sm font-bold text-slate-600 block mb-2">Institución</label>
              <input
                className="w-full bg-surface-container-low border-none rounded-xl p-4 focus:ring-2 focus:ring-primary/20"
                defaultValue="Clínica Central de Bogotá"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="text-sm font-bold text-slate-600 block mb-2">Teléfono</label>
              <input
                className="w-full bg-surface-container-low border-none rounded-xl p-4 focus:ring-2 focus:ring-primary/20"
                type="tel"
                placeholder="Teléfono de contacto"
              />
            </div>

            {/* Address */}
            <div>
              <label className="text-sm font-bold text-slate-600 block mb-2">Dirección</label>
              <input
                className="w-full bg-surface-container-low border-none rounded-xl p-4 focus:ring-2 focus:ring-primary/20"
                placeholder="Dirección completa"
              />
            </div>

            {/* Save Button */}
            <button
              type="button"
              className="bg-gradient-to-r from-primary to-primary-container text-white font-bold py-3 px-8 rounded-xl hover:shadow-lg transition-shadow"
            >
              Guardar Cambios
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
