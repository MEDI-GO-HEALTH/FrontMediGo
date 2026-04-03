import { TrendingUp } from 'lucide-react';

/**
 * @param {{ bids: Array<{id,auctionId,userId,userName,amount,placedAt}>,
 *            loading: boolean,
 *            currentUserId?: number }} props
 */
export default function BidHistory({ bids = [], loading, currentUserId }) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />
        ))}
      </div>
    );
  }

  if (bids.length === 0) {
    return (
      <p className="text-center text-sm text-slate-500 py-6">
        Aún no hay pujas en esta subasta.
      </p>
    );
  }

  // Show newest first
  const sorted = [...bids].sort(
    (a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime()
  );

  return (
    <ul className="space-y-2">
      {sorted.map((bid, idx) => {
        const isLeader = idx === 0;
        const isMe = bid.userId === currentUserId;
        return (
          <li
            key={bid.id}
            className={`flex items-center justify-between rounded-lg border px-4 py-2.5 text-sm transition-colors
              ${isLeader ? 'border-emerald-200 bg-emerald-50' : 'border-slate-100 bg-white'}`}
          >
            <div className="flex items-center gap-2">
              {isLeader && <TrendingUp size={14} className="text-emerald-500 flex-shrink-0" />}
              <span className={`font-medium ${isMe ? 'text-indigo-700' : 'text-slate-800'}`}>
                {bid.userName}
                {isMe && <span className="ml-1 text-xs text-indigo-400">(tú)</span>}
              </span>
            </div>
            <div className="text-right">
              <p className={`font-semibold ${isLeader ? 'text-emerald-700' : 'text-slate-700'}`}>
                {formatCurrency(bid.amount)}
              </p>
              <p className="text-xs text-slate-400">{formatTime(bid.placedAt)}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}
