'use client';

import { VaporStats } from '@/lib/types';

interface StatsBarProps {
  stats: VaporStats;
}

export function StatsBar({ stats }: StatsBarProps) {
  return (
    <div className="vapor-card p-4 mb-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold gradient-text">
            {stats.totalMarkets}
          </div>
          <div className="text-sm text-[var(--vapor-muted)]">
            Total Markets
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-[var(--vapor-green)]">
            {stats.activeMarkets}
          </div>
          <div className="text-sm text-[var(--vapor-muted)]">
            Active
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-[var(--vapor-accent)]">
            {stats.resolvedMarkets}
          </div>
          <div className="text-sm text-[var(--vapor-muted)]">
            Resolved
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-white">
            {stats.totalVolume.toLocaleString()}
          </div>
          <div className="text-sm text-[var(--vapor-muted)]">
            Total Volume
          </div>
        </div>
      </div>
    </div>
  );
}
