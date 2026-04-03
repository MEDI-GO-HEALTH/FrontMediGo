/** @param {{ status: 'SCHEDULED'|'ACTIVE'|'CLOSED'|'CANCELLED' }} props */
export default function AuctionStatusBadge({ status }) {
  const config = {
    SCHEDULED: { label: 'Programada', className: 'bg-amber-100 text-amber-800 border border-amber-300' },
    ACTIVE:    { label: 'Activa',     className: 'bg-emerald-100 text-emerald-800 border border-emerald-300' },
    CLOSED:    { label: 'Cerrada',    className: 'bg-slate-100 text-slate-600 border border-slate-300' },
    CANCELLED: { label: 'Cancelada',  className: 'bg-red-100 text-red-700 border border-red-300' },
  };

  const { label, className } = config[status] ?? { label: status, className: 'bg-gray-100 text-gray-600' };

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {status === 'ACTIVE' && (
        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
      )}
      {label}
    </span>
  );
}
