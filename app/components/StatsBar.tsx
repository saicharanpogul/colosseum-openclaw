'use client';

import { VaporStats } from '@/lib/types';

interface StatsBarProps {
  stats: VaporStats;
}

function formatNumber(num: number): string {
  if (num < 1000) return num.toString();
  if (num < 1_000_000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
}

function formatVolume(lamports: number): string {
  const sol = lamports / 1_000_000_000;
  if (sol < 1000) return sol.toFixed(2);
  if (sol < 1_000_000) return (sol / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return (sol / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
}

export function StatsBar({ stats }: StatsBarProps) {
  const volumeDisplay = formatVolume(stats.totalVolume);
  
  return (
    <div className="vapor-card p-6 mb-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="text-center">
          <div className="text-3xl font-bold gradient-text">
            {formatNumber(stats.totalMarkets)}
          </div>
          <div className="text-sm text-[var(--arena-muted)] mt-1">
            Markets
          </div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-[var(--arena-green)]">
            {formatNumber(stats.activeMarkets)}
          </div>
          <div className="text-sm text-[var(--arena-muted)] mt-1">
            Open
          </div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-[var(--arena-gold)]">
            {formatNumber(stats.totalTraders)}
          </div>
          <div className="text-sm text-[var(--arena-muted)] mt-1">
            Traders
          </div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-white">
            {volumeDisplay} <span className="text-lg text-[var(--arena-muted)]">SOL</span>
          </div>
          <div className="text-sm text-[var(--arena-muted)] mt-1">
            Volume
          </div>
        </div>
      </div>
    </div>
  );
}
