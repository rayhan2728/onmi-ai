
import React, { useState, useEffect } from 'react';
import { CalendarIcon, ClockIcon, CheckBadgeIcon } from '@heroicons/react/24/outline';

export default function DateTimeDisplay() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur-xl border border-indigo-500/30 rounded-2xl p-4 mt-6 select-none shadow-lg shadow-indigo-500/5 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-100 transition-opacity">
        <CheckBadgeIcon className="w-5 h-5 text-emerald-400" />
      </div>
      
      <div className="flex items-center space-x-2 mb-3">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-300">
          Temporal Sync: Active
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center space-x-3">
          <CalendarIcon className="w-4 h-4 text-slate-500" />
          <p className="text-sm font-medium text-slate-200">{formatDate(now)}</p>
        </div>
        
        <div className="flex items-center space-x-3 bg-slate-950/50 rounded-xl p-3 border border-slate-800">
          <ClockIcon className="w-5 h-5 text-rose-500" />
          <p className="mono text-xl font-bold bg-gradient-to-r from-rose-400 via-indigo-400 to-rose-400 bg-[length:200%_auto] animate-[gradient_3s_linear_infinite] bg-clip-text text-transparent">
            {formatTime(now)}
          </p>
        </div>
      </div>
      
      <style>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
      `}</style>
    </div>
  );
}
