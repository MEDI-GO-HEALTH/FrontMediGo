import { Link } from 'react-router';
import { Gavel, ExternalLink, TrendingUp } from 'lucide-react';
import { useAuctions } from '../hooks/useAuctions';
import { useBids } from '../hooks/useBids';
import AuctionStatusBadge from '../components/auction/AuctionStatusBadge';
import { getCurrentUser, isAfiliado } from '../lib/auth';
import { isJoined } from '../lib/joinedAuctions';

/**
 * Screen 4: Participant Bid Panel
 *
 * Shows active auctions the user has joined (tracked in localStorage)
 * and their bids within each.
 *
 * NOTE: The API has no "my bids" endpoint, so we:
 *   1. List active auctions (GET /api/auctions/active)
 *   2. Filter by auctions the user has joined (localStorage)
 *   3. For each joined auction, show bid summary via GET /api/auctions/{id}/bids
 */
export default function MyBidsPage() {
  const user = getCurrentUser();
  const afiliado = isAfiliado();

  // Hooks must run before any early return
  const { data: auctions, isLoading } = useAuctions();

  if (!user) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="text-slate-600">Debes iniciar sesión para ver tus pujas.</p>
        <Link to="/auctions" className="mt-3 inline-block text-sm text-indigo-600 hover:underline">
          Ver subastas
        </Link>
      </div>
    );
  }

  if (!afiliado) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="text-slate-600">Esta sección es solo para afiliados.</p>
      </div>
    );
  }
  const joinedAuctions = (auctions ?? []).filter((a) => isJoined(user.userId, a.id));

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Mis pujas</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Subastas activas en las que participas como <strong>{user.username}</strong>
        </p>
      </div>

      {isLoading && (
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      )}

      {!isLoading && joinedAuctions.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 py-16 text-center">
          <Gavel size={32} className="mx-auto mb-3 text-slate-300" />
          <p className="text-sm text-slate-500">No te has unido a ninguna subasta activa aún.</p>
          <Link
            to="/auctions"
            className="mt-3 inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:underline"
          >
            Explorar subastas
          </Link>
        </div>
      )}

      <div className="space-y-4">
        {joinedAuctions.map((auction) => (
          <AuctionParticipationCard
            key={auction.id}
            auction={auction}
            userId={user.userId}
          />
        ))}
      </div>
    </div>
  );
}

/** Sub-card that loads bid history for a specific auction and filters by userId */
function AuctionParticipationCard({ auction, userId }) {
  const { data: bids, isLoading } = useBids(auction.id);

  const myBids = (bids ?? [])
    .filter((b) => b.userId === userId)
    .sort((a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime());

  const allBids = (bids ?? []).sort(
    (a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime()
  );

  const highestBid = allBids[0];
  const myHighest = myBids[0];
  const isLeading = myHighest && highestBid && myHighest.amount >= highestBid.amount;

  return (
    <div className={`rounded-xl border bg-white p-5 shadow-sm ${isLeading ? 'border-emerald-200' : 'border-slate-200'}`}>
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <p className="text-xs text-slate-500">Medicamento #{auction.medicationId}</p>
          <p className="font-semibold text-slate-800">Subasta #{auction.id}</p>
        </div>
        <div className="flex items-center gap-2">
          <AuctionStatusBadge status={auction.status} />
          <Link
            to={`/auctions/${auction.id}`}
            className="flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1
                       text-xs text-slate-600 hover:bg-slate-50"
          >
            <ExternalLink size={11} />
            Ir
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="h-8 animate-pulse rounded bg-slate-100" />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <MiniStat label="Mi mejor puja" value={formatCurrency(myHighest?.amount)} />
          <MiniStat label="Oferta líder" value={formatCurrency(highestBid?.amount)} />
          <MiniStat
            label="Mis pujas"
            value={myBids.length === 0 ? '0' : String(myBids.length)}
          />
        </div>
      )}

      {isLeading && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
          <TrendingUp size={13} />
          Vas liderando esta subasta
        </div>
      )}

      {!isLoading && myBids.length > 0 && !isLeading && (
        <p className="mt-3 text-xs text-amber-600">
          Alguien superó tu oferta. ¡Considera pujar más!
        </p>
      )}
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-lg bg-slate-50 p-2.5">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm font-semibold text-slate-800">{value ?? '—'}</p>
    </div>
  );
}

function formatCurrency(amount) {
  if (amount == null) return '—';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amount);
}
