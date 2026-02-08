'use client';

import { useRouter } from 'next/navigation';
import { Market } from '@/lib/types';

interface MarketCardProps {
  market: Market;
}

function formatNumber(num: number): string {
  if (num < 1000) return num.toString();
  if (num < 1_000_000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
}

function formatVolume(lamports: number): string {
  const sol = lamports / 1_000_000_000;
  if (sol < 1) return sol.toFixed(3);
  if (sol < 1000) return sol.toFixed(2);
  if (sol < 1_000_000) return (sol / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return (sol / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
}

export function MarketCard({ market }: MarketCardProps) {
  const router = useRouter();
  const isDeployed = market.marketAddress != null && market.marketAddress !== '';
  const isVaporProject = market.isVapor;
  
  return (
    <div 
      className={`vapor-card p-5 cursor-pointer hover:border-[var(--arena-gold)] transition-all ${
        isVaporProject ? 'ring-2 ring-[var(--arena-gold)]' : ''
      } ${!isDeployed ? 'opacity-60' : ''}`}
      onClick={() => router.push(`/market/${market.id}`)}
    >
      {/* Vapor Badge */}
      {isVaporProject && (
        <div className="absolute -top-2 -right-2 px-2 py-1 bg-gradient-to-r from-[var(--arena-gold)] to-[#f5d799] text-black text-xs font-bold rounded-full">
          💨 It's Me
        </div>
      )}
      
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-base font-semibold text-white line-clamp-1 flex-1">
          {market.projectName}
        </h3>
        <div className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${
          isDeployed 
            ? 'bg-[var(--arena-green)]/20 text-[var(--arena-green)]' 
            : 'bg-[var(--arena-muted)]/20 text-[var(--arena-muted)]'
        }`}>
          {isDeployed ? 'Live' : 'Not Deployed'}
        </div>
      </div>
      
      {/* Odds Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1.5">
          <span className="text-[var(--vapor-green)] font-medium">
            YES {market.yesOdds}%
          </span>
          <span className="text-[var(--vapor-red)] font-medium">
            NO {market.noOdds}%
          </span>
        </div>
        <div className="odds-bar">
          <div 
            className="odds-fill yes" 
            style={{ width: `${market.yesOdds}%` }}
          />
        </div>
      </div>
      
      {/* Stats */}
      <div className="flex items-center justify-between text-xs text-[var(--arena-muted)]">
        <div className="flex items-center gap-3">
          <span>{formatVolume(market.totalVolume)} SOL</span>
          <span>•</span>
          <span>{formatNumber(market.participants || 0)} traders</span>
        </div>
        <div className="text-[var(--arena-gold)] hover:text-[var(--arena-gold)]/80 font-medium">
          View →
        </div>
      </div>
    </div>
  );
}
