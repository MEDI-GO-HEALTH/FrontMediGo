/**
 * GestionSubastas.jsx (Auctions Page - Admin)
 * ═════════════════════════════════════════════════════════════════
 * Página de gestión de subastas
 * - Estadísticas de subastas
 * - Tabla de subastas activas
 * - Búsqueda y filtros
 */

import { useNavigate } from 'react-router'
import AdminSidebar from '../../components/layout/AdminSidebar'
import { ROUTES } from '../../constants/routes'

export default function GestionSubastas() {
  const navigate = useNavigate()

  return (
    <div className="bg-background text-on-background font-body min-h-screen">
      <AdminSidebar />

      <main className="ml-64 min-h-screen">
        {/* Header */}
        <header className="bg-slate-50/80 backdrop-blur-md sticky top-0 z-40 h-16 flex justify-between items-center w-full px-8 shadow-sm">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-full max-w-md">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                search
              </span>
              <input
                className="w-full bg-surface-container border-none rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20"
                placeholder="Search auctions..."
                type="text"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-bold text-sky-900 leading-none">Admin User</p>
              <p className="text-[11px] text-slate-500 mt-1">Administrator</p>
            </div>
            <img
              className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBWQxdANn4N_lMGjibZcl2aLykMfVQbhTpB50kj_bnyRRpjzR62XaMkzifznbdndiBQ4lveEu4ZbwXKtC5dq-Ru1FouOkYxAr9kv-C8S68Ber9QgfomkMz05YwoK4Xogu7cMHhFpiL-7DHvMFiS1K-M6SuWeiihkTfA8hEvS7xLNtYVNVRzbcVAMgoy_FvzgmypWJsVO61wk932z208YAjfeoXAHBNu7VuSRSWzs4M0ojqCMOppUc5RbN2OewFaTEU2tEn9EPF458BG"
              alt="Admin"
            />
          </div>
        </header>

        {/* Page Content */}
        <div className="p-10 max-w-[1400px] mx-auto">
          {/* Title Section */}
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-4xl font-headline font-extrabold text-primary tracking-tight">Subastas</h2>
              <p className="text-slate-500 mt-2 font-medium">Gestione eventos de adquisición en vivo.</p>
            </div>
            <button className="bg-gradient-to-r from-primary to-primary-container text-white px-8 py-4 rounded-xl font-bold flex items-center gap-3 shadow-xl hover:shadow-2xl transition-shadow">
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                add
              </span>
              Crear Nueva Subasta
            </button>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-12 gap-6 mb-12">
            <div className="col-span-12 lg:col-span-4 bg-surface-container-lowest p-8 rounded-xl border border-outline-variant shadow-sm">
              <h3 className="text-slate-500 text-sm font-semibold uppercase tracking-wider">Subastas Activas</h3>
              <p className="text-5xl font-headline font-extrabold text-primary mt-2">142</p>
            </div>
            <div className="col-span-12 lg:col-span-8 bg-surface-container p-8 rounded-xl border border-outline-variant relative overflow-hidden">
              <h3 className="text-slate-500 text-sm font-semibold uppercase tracking-wider mb-6">Valor Total de Subastas</h3>
              <p className="text-5xl font-headline font-extrabold text-primary">$2,481,200</p>
            </div>
          </div>

          {/* Auctions Table */}
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase">Medicamento y Lote</th>
                  <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase text-center">Estado</th>
                  <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase">Precio Inicial</th>
                  <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase">Tiempo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                <tr className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-8 py-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-surface-container-high flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined">pill</span>
                    </div>
                    <div>
                      <p className="font-bold">Amoxicillin 500mg</p>
                      <p className="text-xs text-slate-500">Batch #AMX-2024-001</p>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-secondary-container text-on-secondary-container">
                      EN VIVO
                    </span>
                  </td>
                  <td className="px-8 py-6 font-bold">$12,400.00</td>
                  <td className="px-8 py-6">04h 12m</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
