import { Link } from 'react-router';
import { Pill, MapPin, TrendingUp, ArrowRight } from 'lucide-react';
import AuctionStatusBadge from './AuctionStatusBadge';
import AuctionTimer from './AuctionTimer';

/**
 * @param {{ auction: { id, medicationId, branchId, basePrice, maxPrice,
 *   startTime, endTime, status, closureType, winnerId } }} props
 */
export default function AuctionCard({ auction }) {
  const {
    id,
    medicationId,
    branchId,
    basePrice,
    startTime,
    endTime,
    status,
    closureType,
  } = auction;

  const isActive    = status === 'ACTIVE';
  const isScheduled = status === 'SCHEDULED';

  return (
    <Link
      to={`/auctions/${id}`}
      className="group flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm
                 transition-all hover:border-indigo-300 hover:shadow-md"
    >
      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <Pill size={16} />
          </div>
          <div>
            <p className="text-xs text-slate-500">Medicamento ID</p>
            <p className="text-sm font-semibold text-slate-800">#{medicationId}</p>
          </div>
        </div>
        <AuctionStatusBadge status={status} />
      </div>

      {/* Details */}
      <div className="mb-3 grid grid-cols-2 gap-2 text-sm">
        <div className="flex items-center gap-1.5 text-slate-600">
          <MapPin size={13} className="text-slate-400" />
          <span>Sucursal #{branchId}</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-600">
          <TrendingUp size={13} className="text-slate-400" />
          <span>Desde {formatCurrency(basePrice)}</span>
        </div>
      </div>

      {/* Closure type pill */}
      <div className="mb-3">
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
          Cierre: {closureTypeLabel(closureType)}
        </span>
      </div>

      {/* Timer */}
      {isActive && (
        <AuctionTimer targetDate={endTime} label="Cierra en" urgent />
      )}
      {isScheduled && (
        <AuctionTimer targetDate={startTime} label="Inicia en" />
      )}

      {/* CTA */}
      <div className="mt-auto pt-3 flex items-center justify-end text-xs font-medium text-indigo-600
                      opacity-0 transition-opacity group-hover:opacity-100">
        Ver detalle <ArrowRight size={13} className="ml-1" />
      </div>
    </Link>
  );
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amount);
}

function closureTypeLabel(type) {
  return { FIXED_TIME: 'Tiempo fijo', INACTIVITY: 'Inactividad', MAX_PRICE: 'Precio máx.' }[type] ?? type;
}
