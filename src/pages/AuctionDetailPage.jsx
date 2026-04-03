import { useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Users, Edit, Pill, Package } from 'lucide-react';
import { useAuctionDetail } from '../hooks/useAuctionDetail';
import { useBids } from '../hooks/useBids';
import { useJoinAuction } from '../hooks/useAuctionMutations';
import { useAuctionSocket } from '../hooks/useAuctionSocket';
import AuctionStatusBadge from '../components/auction/AuctionStatusBadge';
import AuctionTimer from '../components/auction/AuctionTimer';
import BidHistory from '../components/auction/BidHistory';
import BidForm from '../components/auction/BidForm';
import WinnerBanner from '../components/auction/WinnerBanner';
import { getCurrentUser, isAdmin, isAfiliado } from '../lib/auth';
import { isJoined } from '../lib/joinedAuctions';

/**
 * Screen 2: Auction Detail with real-time bids via WebSocket STOMP.
 *
 * Real-time events handled:
 *   BID_PLACED       → update current amount + refresh bid history
 *   AUCTION_STARTED  → refresh auction detail
 *   AUCTION_CLOSED   → refresh auction detail + show winner
 *   WINNER_ADJUDICATED → refresh detail + banner
 */
export default function AuctionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const user = getCurrentUser();

  const { data: detail, isLoading, isError, error } = useAuctionDetail(id);
  const { data: bids, isLoading: bidsLoading } = useBids(id);

  // Real-time current amount (updated by WebSocket; falls back to bid history)
  const [liveAmount, setLiveAmount] = useState(null);
  const [liveEvent, setLiveEvent] = useState(null);

  // Handle real-time events from /topic/auction/{id}
  const handleSocketEvent = useCallback(
    (event) => {
      setLiveEvent(event);

      if (event.type === 'BID_PLACED') {
        setLiveAmount(event.currentAmount);
        qc.invalidateQueries({ queryKey: ['bids', String(id)] });
      }

      if (
        event.type === 'AUCTION_CLOSED' ||
        event.type === 'AUCTION_STARTED' ||
        event.type === 'WINNER_ADJUDICATED'
      ) {
        qc.invalidateQueries({ queryKey: ['auction', String(id)] });
        qc.invalidateQueries({ queryKey: ['bids', String(id)] });
      }
    },
    [id, qc]
  );

  useAuctionSocket(id, handleSocketEvent);

  // Join mutation
  const { mutate: doJoin, isPending: joining } = useJoinAuction(id, {
    onSuccess: () => setLiveEvent({ type: 'JOINED' }),
  });

  if (isLoading) return <DetailSkeleton />;

  if (isError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-red-600">{error?.displayMessage ?? 'Error al cargar la subasta.'}</p>
        <button onClick={() => navigate(-1)} className="mt-3 text-sm text-indigo-600 hover:underline">
          Volver
        </button>
      </div>
    );
  }

  // Unpack AuctionDetailView
  const { auction, medicationName, medicationUnit, winnerName } = detail ?? {};
  const {
    status,
    basePrice,
    maxPrice,
    startTime,
    endTime,
    closureType,
    inactivityMinutes,
    branchId,
    medicationId,
    winnerId,
  } = auction ?? {};

  const isActive    = status === 'ACTIVE';
  const isScheduled = status === 'SCHEDULED';
  const isClosed    = status === 'CLOSED';

  // Compute current highest bid amount
  const highestBid = bids?.length
    ? Math.max(...bids.map((b) => Number(b.amount)))
    : null;
  const currentAmount = liveAmount ?? highestBid ?? Number(basePrice ?? 0);

  // Permissions
  const admin    = isAdmin();
  const afiliado = isAfiliado();
  const joined   = user ? isJoined(user.userId, id) : false;

  const canBid = afiliado && !admin;
  const notJoinedReason = !afiliado
    ? admin
      ? 'Los administradores no pueden realizar pujas.'
      : 'Inicia sesión con una cuenta de afiliado para pujar.'
    : null;

  // Winner view (minimal — full data from GET /api/auctions/{id}/winner is separate)
  const winner = isClosed && winnerId
    ? { auctionId: id, winnerId, winnerName: winnerName ?? 'Ganador', winningAmount: currentAmount }
    : isClosed && !winnerId
    ? { auctionId: id, winnerId: null }
    : null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Back */}
      <Link to="/auctions" className="mb-4 flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft size={15} />
        Subastas
      </Link>

      {/* Live event toast */}
      {liveEvent && liveEvent.type !== 'JOINED' && (
        <div className="mb-4 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm text-indigo-700">
          {liveEvent.message ?? liveEvent.type}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column: info + bids */}
        <div className="lg:col-span-2 space-y-6">
          {/* Auction header */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Pill size={20} />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-slate-900">
                    {medicationName ?? `Medicamento #${medicationId}`}
                  </h1>
                  {medicationUnit && (
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Package size={11} />
                      {medicationUnit}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <AuctionStatusBadge status={status} />
                {admin && isScheduled && (
                  <Link
                    to={`/auctions/${id}/edit`}
                    className="flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1
                               text-xs text-slate-600 hover:bg-slate-50"
                  >
                    <Edit size={12} />
                    Editar
                  </Link>
                )}
              </div>
            </div>

            {/* Key numbers */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 mb-4">
              <StatBox label="Precio base" value={formatCurrency(basePrice)} />
              <StatBox
                label="Oferta actual"
                value={formatCurrency(currentAmount)}
                highlight={currentAmount > Number(basePrice ?? 0)}
              />
              {maxPrice && (
                <StatBox label="Precio máximo" value={formatCurrency(maxPrice)} />
              )}
            </div>

            {/* Meta */}
            <div className="flex flex-wrap gap-2 text-xs text-slate-500">
              <span className="rounded-full bg-slate-100 px-2 py-0.5">Sucursal #{branchId}</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5">
                Cierre: {closureTypeLabel(closureType)}
              </span>
              {closureType === 'INACTIVITY' && inactivityMinutes && (
                <span className="rounded-full bg-amber-100 text-amber-700 px-2 py-0.5">
                  Inactividad: {inactivityMinutes} min
                </span>
              )}
            </div>

            {/* Timers */}
            <div className="mt-4 space-y-1">
              {isScheduled && <AuctionTimer targetDate={startTime} label="Inicia en" />}
              {isActive && <AuctionTimer targetDate={endTime} label="Cierra en" urgent />}
              {isClosed && (
                <p className="text-sm text-slate-500">
                  Cerrada el {new Date(endTime).toLocaleDateString('es-CO')}
                </p>
              )}
            </div>
          </div>

          {/* Winner banner */}
          <WinnerBanner winner={winner} status={status} />

          {/* Bid history */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-700">
              Historial de pujas {bids?.length ? `(${bids.length})` : ''}
            </h2>
            <BidHistory bids={bids} loading={bidsLoading} currentUserId={user?.userId} />
          </div>
        </div>

        {/* Right column: actions */}
        <div className="space-y-4">
          {/* Join card */}
          {isActive && afiliado && !joined && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <Users size={16} className="text-slate-500" />
                <h3 className="text-sm font-semibold text-slate-700">Participar</h3>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                Únete a la subasta para poder realizar pujas.
              </p>
              <button
                onClick={() => doJoin(user.userId)}
                disabled={joining}
                className="w-full rounded-lg bg-emerald-600 py-2 text-sm font-medium text-white
                           hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {joining ? 'Uniéndose...' : 'Unirse a la subasta'}
              </button>
            </div>
          )}

          {/* Joined badge */}
          {joined && isActive && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-center text-sm text-emerald-700">
              Eres participante de esta subasta
            </div>
          )}

          {/* Bid form */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-slate-700">Realizar puja</h3>
            <BidForm
              auctionId={id}
              currentAmount={currentAmount}
              basePrice={Number(basePrice ?? 0)}
              isActive={isActive}
              isJoined={joined}
              canBid={canBid}
              notJoinedReason={notJoinedReason}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, highlight = false }) {
  return (
    <div className={`rounded-lg p-3 ${highlight ? 'bg-emerald-50' : 'bg-slate-50'}`}>
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-base font-bold ${highlight ? 'text-emerald-700' : 'text-slate-800'}`}>
        {value}
      </p>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-4">
      <div className="h-6 w-24 animate-pulse rounded bg-slate-100" />
      <div className="h-64 animate-pulse rounded-xl bg-slate-100" />
      <div className="h-48 animate-pulse rounded-xl bg-slate-100" />
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

function closureTypeLabel(type) {
  return { FIXED_TIME: 'Tiempo fijo', INACTIVITY: 'Inactividad', MAX_PRICE: 'Precio máx.' }[type] ?? type;
}
