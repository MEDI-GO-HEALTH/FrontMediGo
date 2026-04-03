import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

/**
 * Countdown timer to a target ISO date string.
 * @param {{ targetDate: string, label: string, urgent?: boolean }} props
 */
export default function AuctionTimer({ targetDate, label, urgent = false }) {
  const [remaining, setRemaining] = useState(() => getRemaining(targetDate));

  useEffect(() => {
    const id = setInterval(() => {
      const r = getRemaining(targetDate);
      setRemaining(r);
      if (r.total <= 0) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  if (!targetDate) return null;
  if (remaining.total <= 0) {
    return (
      <div className="flex items-center gap-1.5 text-sm text-slate-500">
        <Clock size={14} />
        <span>{label}: —</span>
      </div>
    );
  }

  const isUrgent = urgent && remaining.total < 5 * 60 * 1000; // < 5 min
  return (
    <div className={`flex items-center gap-1.5 text-sm font-mono ${isUrgent ? 'text-red-600 font-semibold' : 'text-slate-700'}`}>
      <Clock size={14} className={isUrgent ? 'text-red-500' : 'text-slate-400'} />
      <span className="text-xs text-slate-500 font-sans mr-1">{label}:</span>
      <span>{pad(remaining.hours)}:{pad(remaining.minutes)}:{pad(remaining.seconds)}</span>
    </div>
  );
}

function pad(n) {
  return String(n).padStart(2, '0');
}

function getRemaining(targetDate) {
  const total = new Date(targetDate).getTime() - Date.now();
  if (total <= 0) return { total: 0, hours: 0, minutes: 0, seconds: 0 };
  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const hours   = Math.floor(total / 1000 / 60 / 60);
  return { total, hours, minutes, seconds };
}
