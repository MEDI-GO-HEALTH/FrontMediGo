/**
 * CentroSubastas.jsx (Auctions Page - Affiliate)
 * ═════════════════════════════════════════════════════════════════
 * Página de centro de subastas para afiliados
 * - Grid de subastas disponibles
 * - Información de medicamentos
 * - Botón para pujar
 */

import AffiliateSidebar from '../../components/layout/AffiliateSidebar'

export default function CentroSubastas() {
  const auctions = [
    {
      id: 1,
      name: 'Insulina Glargina',
      price: '$12,450,000',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA_-81jLihfEnYj5MeakpJSJeEnvJ9xiBu72yDnNX8mCJJuAdRqwaKBcYhesSkT0KmlhGDWZ2WVjJOAvDiu4DGieMnzjzfZgs1nAIxS_WdaiLj8wseAkhnETOSZc6fPkDSW1O9H_ElB8j8ddZZ6DOpW6YA1emd_D9wuSoVpc-Za9ayg8Z5CUcmzmXxC-_vhqS2-odkxesXK-RZ-nrDyg7fDiG8wQQm15LyZKrbarrmqHwEKrgkB2z1PFzGldYwQ16SybRijsybA8OCO',
    },
    {
      id: 2,
      name: 'Amoxicilina 500mg',
      price: '$8,750,000',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA_-81jLihfEnYj5MeakpJSJeEnvJ9xiBu72yDnNX8mCJJuAdRqwaKBcYhesSkT0KmlhGDWZ2WVjJOAvDiu4DGieMnzjzfZgs1nAIxS_WdaiLj8wseAkhnETOSZc6fPkDSW1O9H_ElB8j8ddZZ6DOpW6YA1emd_D9wuSoVpc-Za9ayg8Z5CUcmzmXxC-_vhqS2-odkxesXK-RZ-nrDyg7fDiG8wQQm15LyZKrbarrmqHwEKrgkB2z1PFzGldYwQ16SybRijsybA8OCO',
    },
    {
      id: 3,
      name: 'Dipirona 500mg',
      price: '$5,200,000',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA_-81jLihfEnYj5MeakpJSJeEnvJ9xiBu72yDnNX8mCJJuAdRqwaKBcYhesSkT0KmlhGDWZ2WVjJOAvDiu4DGieMnzjzfZgs1nAIxS_WdaiLj8wseAkhnETOSZc6fPkDSW1O9H_ElB8j8ddZZ6DOpW6YA1emd_D9wuSoVpc-Za9ayg8Z5CUcmzmXxC-_vhqS2-odkxesXK-RZ-nrDyg7fDiG8wQQm15LyZKrbarrmqHwEKrgkB2z1PFzGldYwQ16SybRijsybA8OCO',
    },
  ]

  return (
    <div className="bg-background text-on-surface min-h-screen">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl fixed top-0 w-full z-40 px-8 py-4 flex justify-between border-b shadow-sm">
        <span className="text-2xl font-bold text-sky-900">MediGo Affiliate</span>
      </header>

      <AffiliateSidebar />

      {/* Main Content */}
      <main className="lg:pl-64 pt-24 pb-24 px-12">
        <h1 className="text-4xl font-extrabold text-primary mb-8">Centro de Subastas</h1>

        {/* Auctions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {auctions.map((auction) => (
            <div key={auction.id} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-outline-variant hover:shadow-lg transition-shadow">
              <img
                src={auction.image}
                className="w-full h-40 object-cover"
                alt={auction.name}
              />
              <div className="p-6">
                <h4 className="text-lg font-bold text-on-surface mb-2">{auction.name}</h4>
                <p className="mb-4">
                  <span className="text-xs text-slate-500 uppercase tracking-widest">Precio Base</span>
                </p>
                <p className="text-primary text-xl font-bold mb-6">{auction.price}</p>
                <button className="w-full bg-gradient-to-r from-primary to-primary-container text-white py-4 rounded-2xl font-bold hover:shadow-lg transition-shadow">
                  Pujar Ahora
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
