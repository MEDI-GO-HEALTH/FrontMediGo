import { Link } from 'react-router';
import { Plus, RefreshCw, Info } from 'lucide-react';
import { useAuctions } from '../hooks/useAuctions';
import AuctionCard from '../components/auction/AuctionCard';
import { isAdmin } from '../lib/auth';

/**
 * Screen 1: Auction List
 *
 * Shows all ACTIVE auctions (only endpoint available: GET /api/auctions/active).
 * Filters by other statuses (SCHEDULED, CLOSED) require a future admin endpoint.
 * ADMIN role: sees link to create new auction.
 */
export default function AuctionListPage() {
  const { data: auctions, isLoading, isError, error, refetch, isFetching } = useAuctions();
  const admin = isAdmin();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Subastas</h1>
          <p className="text-sm text-slate-500 mt-0.5">Subastas activas en tiempo real</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5
                       text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
            Actualizar
          </button>
          {admin && (
            <Link
              to="/auctions/new"
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5
                         text-sm font-medium text-white hover:bg-indigo-700"
            >
              <Plus size={14} />
              Nueva subasta
            </Link>
          )}
        </div>
      </div>

      {/* API scope notice */}
      <div className="mb-4 flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-700">
        <Info size={13} className="mt-0.5 flex-shrink-0" />
        <span>
          Mostrando subastas <strong>activas</strong>. El listado se actualiza automáticamente cada 30 segundos.
          {admin && ' Para ver subastas programadas o cerradas, accede al detalle directamente.'}
        </span>
      </div>

      {/* States */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm font-medium text-red-700">
            {error?.displayMessage ?? 'Error al cargar las subastas.'}
          </p>
          <button
            onClick={() => refetch()}
            className="mt-3 rounded-lg bg-red-600 px-4 py-1.5 text-sm text-white hover:bg-red-700"
          >
            Reintentar
          </button>
        </div>
      )}

      {!isLoading && !isError && auctions?.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 py-16 text-center">
          <p className="text-slate-500 text-sm">No hay subastas activas en este momento.</p>
          {admin && (
            <Link
              to="/auctions/new"
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2
                         text-sm font-medium text-white hover:bg-indigo-700"
            >
              <Plus size={14} />
              Crear primera subasta
            </Link>
          )}
        </div>
      )}

      {!isLoading && !isError && auctions?.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {auctions.map((auction) => (
            <AuctionCard key={auction.id} auction={auction} />
          ))}
        </div>
      )}
    </div>
  );
}
