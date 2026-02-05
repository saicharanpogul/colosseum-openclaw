'use client';

import { useState } from 'react';
import { Market } from '@/lib/types';

interface MarketCardProps {
  market: Market;
  onUpdate?: (market: Market) => void;
}

export function MarketCard({ market, onUpdate }: MarketCardProps) {
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState(100);
  const isResolved = market.status === 'resolved';
  
  const handleBuy = async (side: 'yes' | 'no') => {
    if (loading) return;
    setLoading(true);
    
    try {
      const res = await fetch(`/api/markets/${market.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ side, amount }),
      });
      
      const data = await res.json();
      if (data.success && onUpdate) {
        onUpdate(data.market);
      }
    } catch (error) {
      console.error('Failed to buy shares:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="vapor-card p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-1">
            {market.projectName}
          </h3>
          <p className="text-sm text-[var(--vapor-muted)]">
            {market.question}
          </p>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          isResolved 
            ? 'bg-[var(--vapor-accent)]/20 text-[var(--vapor-accent)]' 
            : 'bg-[var(--vapor-green)]/20 text-[var(--vapor-green)]'
        }`}>
          {isResolved ? 'Resolved' : 'Open'}
        </div>
      </div>
      
      {/* Odds Display */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-[var(--vapor-green)] font-medium">
            Yes {market.yesOdds}%
          </span>
          <span className="text-[var(--vapor-red)] font-medium">
            No {market.noOdds}%
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
      <div className="flex items-center justify-between text-sm mb-4">
        <div className="text-[var(--vapor-muted)]">
          Volume: <span className="text-white">{market.totalVolume.toLocaleString()}</span>
        </div>
        {market.marketAddress && (
          <div className="text-[var(--vapor-muted)] text-xs font-mono truncate max-w-[120px]" title={market.marketAddress}>
            {market.marketAddress.slice(0, 4)}...{market.marketAddress.slice(-4)}
          </div>
        )}
        {isResolved && market.resolution && (
          <div className={`font-medium ${
            market.resolution === 'yes' 
              ? 'text-[var(--vapor-green)]' 
              : 'text-[var(--vapor-red)]'
          }`}>
            Resolved: {market.resolution.toUpperCase()}
          </div>
        )}
      </div>
      
      {/* Trading Interface */}
      {!isResolved && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Math.max(1, parseInt(e.target.value) || 0))}
              className="flex-1 bg-[var(--vapor-bg)] border border-[var(--vapor-border)] rounded-lg px-3 py-2 text-white text-sm focus:border-[var(--vapor-accent)] focus:outline-none"
              placeholder="Amount"
              min="1"
            />
            <span className="text-sm text-[var(--vapor-muted)]">tokens</span>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => handleBuy('yes')}
              disabled={loading}
              className="flex-1 vapor-button bg-[var(--vapor-green)]/20 text-[var(--vapor-green)] hover:bg-[var(--vapor-green)]/30 disabled:opacity-50"
            >
              {loading ? '...' : `Buy Yes @ ${market.yesOdds}%`}
            </button>
            <button 
              onClick={() => handleBuy('no')}
              disabled={loading}
              className="flex-1 vapor-button bg-[var(--vapor-red)]/20 text-[var(--vapor-red)] hover:bg-[var(--vapor-red)]/30 disabled:opacity-50"
            >
              {loading ? '...' : `Buy No @ ${market.noOdds}%`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
