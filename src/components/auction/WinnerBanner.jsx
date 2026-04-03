import { Trophy } from 'lucide-react';

/**
 * @param {{ winner: { auctionId, winnerId, winnerName, winningAmount }|null,
 *            status: string }} props
 */
export default function WinnerBanner({ winner, status }) {
  if (status !== 'CLOSED') return null;

  if (!winner?.winnerId) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 text-center">
        La subasta cerró sin pujas.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-amber-400 text-white">
          <Trophy size={20} />
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-amber-600">Ganador</p>
          <p className="text-base font-bold text-amber-900">{winner.winnerName}</p>
          <p className="text-sm text-amber-700">
            Oferta ganadora:{' '}
            <span className="font-semibold">
              {formatCurrency(winner.winningAmount)}
            </span>
          </p>
        </div>
      </div>
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
