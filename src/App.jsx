import { BrowserRouter, Routes, Route, Link, NavLink, Navigate } from 'react-router';
import { Gavel, List, Trophy } from 'lucide-react';
import AuctionListPage from './pages/AuctionListPage';
import AuctionDetailPage from './pages/AuctionDetailPage';
import AuctionFormPage from './pages/AuctionFormPage';
import MyBidsPage from './pages/MyBidsPage';
import { isAfiliado } from './lib/auth';

export default function App() {
  const afiliado = isAfiliado();

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50">
        {/* Top Nav */}
        <nav className="border-b border-slate-200 bg-white px-4 shadow-sm">
          <div className="mx-auto flex h-14 max-w-5xl items-center justify-between">
            <Link to="/auctions" className="flex items-center gap-2 font-bold text-indigo-700">
              <Gavel size={20} />
              MediGo Subastas
            </Link>
            <div className="flex items-center gap-1">
              <NavItem to="/auctions" icon={<List size={15} />} label="Subastas" />
              {afiliado && (
                <NavItem to="/my-bids" icon={<Trophy size={15} />} label="Mis pujas" />
              )}
            </div>
          </div>
        </nav>

        {/* Routes */}
        <main>
          <Routes>
            <Route index element={<Navigate to="/auctions" replace />} />
            <Route path="/auctions" element={<AuctionListPage />} />
            <Route path="/auctions/new" element={<AuctionFormPage />} />
            <Route path="/auctions/:id" element={<AuctionDetailPage />} />
            <Route path="/auctions/:id/edit" element={<AuctionFormPage />} />
            {afiliado && <Route path="/my-bids" element={<MyBidsPage />} />}
            <Route path="*" element={<Navigate to="/auctions" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

function NavItem({ to, icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
          isActive
            ? 'bg-indigo-50 text-indigo-700'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        }`
      }
    >
      {icon}
      {label}
    </NavLink>
  );
}
