import { useState } from 'react';
import { Gavel, AlertCircle, RefreshCw } from 'lucide-react';
import { usePlaceBid } from '../../hooks/useAuctionMutations';

/**
 * Bid placement form with full business rule enforcement.
 *
 * Business rules reflected here:
 * - Only AFILIADO role can bid (not ADMIN, not GUEST)
 * - User must have joined the auction first
 * - Auction must be ACTIVE
 * - amount > max(basePrice, current highest bid)
 * - Rate limit: 10 bids/min (429 → show retry countdown)
 * - BidLockNotAcquired → auto-retry after 5s
 *
 * @param {{ auctionId: number|string, currentAmount: number, basePrice: number,
 *            isActive: boolean, isJoined: boolean, canBid: boolean,
 *            notJoinedReason?: string }} props
 */
export default function BidForm({
  auctionId,
  currentAmount,
  basePrice,
  isActive,
  isJoined,
  canBid,
  notJoinedReason,
}) {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState(null);
  const [retryIn, setRetryIn] = useState(0);

  const minAmount = Math.max(currentAmount ?? 0, basePrice ?? 0);

  const { mutate: placeBid, isPending } = usePlaceBid(auctionId, {
    onSuccess: () => {
      setAmount('');
      setError(null);
    },
    onError: (err) => {
      const status = err.statusCode;
      const msg = err.displayMessage;

      if (status === 429) {
        setError('Límite de pujas alcanzado. Espere antes de volver a pujar.');
        startRetryCountdown(60);
        return;
      }

      // BidLockNotAcquiredException → retry after 5s
      if (msg?.toLowerCase().includes('lock') || msg?.toLowerCase().includes('proceso')) {
        setError('Hay una puja en proceso. Reintentando en 5 segundos...');
        startRetryCountdown(5, true);
        return;
      }

      setError(msg ?? 'No se pudo colocar la puja.');
    },
  });

  function startRetryCountdown(seconds, autoRetry = false) {
    setRetryIn(seconds);
    const interval = setInterval(() => {
      setRetryIn((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setError(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    if (autoRetry && amount) {
      setTimeout(() => handleSubmit(), seconds * 1000);
    }
  }

  function handleSubmit(e) {
    if (e) e.preventDefault();
    setError(null);

    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) {
      setError('Ingrese un monto válido.');
      return;
    }
    if (parsed <= minAmount) {
      setError(`El monto debe superar ${formatCurrency(minAmount)}.`);
      return;
    }

    // getUserContext is injected from parent via props to avoid coupling auth here
    placeBid({ amount: parsed });
  }

  // ── Disabled states ────────────────────────────────────────────────────────
  if (!isActive) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-500">
        Las pujas solo están disponibles cuando la subasta está activa.
      </div>
    );
  }

  if (!canBid) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-500">
        {notJoinedReason ?? 'No tienes permiso para pujar en esta subasta.'}
      </div>
    );
  }

  if (!isJoined) {
    return (
      <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-center text-sm text-amber-700">
        Debes unirte a la subasta antes de pujar.
      </div>
    );
  }

  // ── Active form ────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          Tu oferta (mínimo {formatCurrency(minAmount + 1)})
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            min={minAmount + 1}
            step="any"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={isPending || retryIn > 0}
            placeholder={`> ${formatCurrency(minAmount)}`}
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none
                       focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100
                       disabled:bg-slate-50 disabled:text-slate-400"
          />
          <button
            type="submit"
            disabled={isPending || retryIn > 0 || !amount}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium
                       text-white transition-colors hover:bg-indigo-700
                       disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isPending ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <Gavel size={14} />
            )}
            {retryIn > 0 ? `${retryIn}s` : 'Pujar'}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <p className="text-xs text-slate-400">
        Monto actual más alto: <span className="font-medium text-slate-600">{formatCurrency(currentAmount)}</span>
      </p>
    </form>
  );
}

function formatCurrency(amount) {
  if (amount == null || isNaN(amount)) return '—';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amount);
}
