'use client';

import { VaporStats } from '@/lib/types';

interface StatsBarProps {
  stats: VaporStats;
}

export function StatsBar({ stats }: StatsBarProps) {
  const volumeInSol = (stats.totalVolume / 1_000_000).toFixed(2);
  
  return (
    <div className="vapor-card p-6 mb-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="text-center">
          <div className="text-3xl font-bold gradient-text">
            {stats.totalMarkets}
          </div>
          <div className="text-sm text-[var(--arena-muted)] mt-1">
            Markets
          </div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-[var(--arena-green)]">
            {stats.activeMarkets}
          </div>
          <div className="text-sm text-[var(--arena-muted)] mt-1">
            Open
          </div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-[var(--arena-gold)]">
            {stats.resolvedMarkets}
          </div>
          <div className="text-sm text-[var(--arena-muted)] mt-1">
            Resolved
          </div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-white">
            {volumeInSol} <span className="text-lg text-[var(--arena-muted)]">SOL</span>
          </div>
          <div className="text-sm text-[var(--arena-muted)] mt-1">
            Volume
          </div>
        </div>
      </div>
    </div>
  );
}
