/**
 * PerfilRepartidor.jsx (Profile Page - Driver)
 * ═════════════════════════════════════════════════════════════════
 * Página de perfil del repartidor
 * - Información personal
 * - Foto de perfil
 * - Configuración de cuenta
 */

import DriverSidebar from '../../components/layout/DriverSidebar'

export default function PerfilRepartidor() {
  return (
    <div className="bg-surface min-h-screen">
      <DriverSidebar />

      <main className="ml-72 p-12">
        <h1 className="text-2xl font-bold text-sky-900 mb-8">Configuración de Perfil</h1>

        <div className="max-w-xl bg-white p-8 rounded-xl border border-outline-variant shadow-sm">
          {/* Profile Picture */}
          <div className="flex flex-col items-center mb-8">
            <img
              className="w-32 h-32 rounded-full object-cover border-4 border-primary shadow-lg"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBoskHY9L7pCz7LAAraqrE9Zcu4G9fHwScz5dp7VCPf9Vx7ckNp2xEHhknrxbv9Aw5PPp_43vcnoakQnbumxkYq6TGDZWee_yJbe9gfDmhx8jzXkfzcVFUZrN7xgW1a4uix4LRrcIRAdYgPWrYO--zqUo1ZZYvEl-ApDvO70Aiw_lzHACtHRNUcVo12sy94jDMYJVqTCL7bmPytKx5zpCQ9GhqM8a72RmFTowlIDqXv4W3yAPC_5m3ct6PLdZFzCr9b7KXPXmCgL4v9"
              alt="Carlos Rivera"
            />
            <h2 className="text-xl font-bold mt-4 text-primary">Carlos Rivera Santillán</h2>
            <p className="text-sm text-slate-500 mt-1">Repartidor Certificado</p>

            <button className="mt-4 text-sm text-primary font-semibold hover:underline flex items-center gap-2">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                photo_camera
              </span>
              Cambiar foto
            </button>
          </div>

          {/* Form */}
          <form className="space-y-6">
            {/* Full Name */}
            <div>
              <label className="text-sm font-bold text-slate-600 block mb-2">Nombre Completo</label>
              <input
                className="w-full bg-surface-container-low border-none rounded-xl p-4 focus:ring-2 focus:ring-primary/20"
                type="text"
                defaultValue="Carlos Rivera Santillán"
              />
            </div>

            {/* Email */}
            <div>
              <label className="text-sm font-bold text-slate-600 block mb-2">Correo Electrónico</label>
              <input
                className="w-full bg-surface-container-low border-none rounded-xl p-4 focus:ring-2 focus:ring-primary/20"
                type="email"
                defaultValue="carlos.rivera@medigo.co"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="text-sm font-bold text-slate-600 block mb-2">Teléfono Móvil</label>
              <input
                className="w-full bg-surface-container-low border-none rounded-xl p-4 focus:ring-2 focus:ring-primary/20"
                type="tel"
                defaultValue="+57 3101234567"
              />
            </div>

            {/* Vehicle */}
            <div>
              <label className="text-sm font-bold text-slate-600 block mb-2">Vehículo</label>
              <input
                className="w-full bg-surface-container-low border-none rounded-xl p-4 focus:ring-2 focus:ring-primary/20"
                type="text"
                placeholder="Placa o descripción del vehículo"
              />
            </div>

            {/* License */}
            <div>
              <label className="text-sm font-bold text-slate-600 block mb-2">Licencia de Conducción</label>
              <input
                className="w-full bg-surface-container-low border-none rounded-xl p-4 focus:ring-2 focus:ring-primary/20"
                type="text"
                placeholder="Número de licencia"
              />
            </div>

            {/* Save Button */}
            <button
              type="button"
              className="w-full bg-gradient-to-r from-primary to-primary-container text-white font-bold py-3 px-8 rounded-xl hover:shadow-lg transition-shadow"
            >
              Guardar Cambios
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
