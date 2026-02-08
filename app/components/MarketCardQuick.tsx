'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { Market } from '@/lib/types';
import { useVapor } from '@/hooks/useVapor';
import { useToast } from './ToastProvider';

interface MarketCardProps {
  market: Market;
  onUpdate?: (market: Market) => void;
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

export function MarketCard({ market, onUpdate }: MarketCardProps) {
  const router = useRouter();
  const { connected } = useWallet();
  const { setVisible } = useWalletModal();
  const { showToast } = useToast();
  const { buyShares, loading: vaporLoading } = useVapor();
  
  const [amount, setAmount] = useState('0.1');
  const [buying, setBuying] = useState(false);
  
  const isDeployed = market.marketAddress != null && market.marketAddress !== '';
  const isVaporProject = market.isVapor;
  
  const handleQuickBuy = async (side: 'yes' | 'no', e: React.MouseEvent) => {
    e.stopPropagation(); // Don't navigate to detail page
    
    if (!connected) {
      setVisible(true);
      return;
    }
    
    if (!isDeployed) {
      showToast('Market not deployed yet. Deploy it first!', 'error');
      router.push(`/market/${market.id}`);
      return;
    }
    
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      showToast('Invalid amount', 'error');
      return;
    }
    
    setBuying(true);
    try {
      await buyShares(market.projectId, side, amountNum);
      showToast(`✅ Bought ${side.toUpperCase()} shares!`, 'success');
      if (onUpdate) {
        // Trigger a refresh
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (err: any) {
      showToast(err.message || 'Trade failed', 'error');
    } finally {
      setBuying(false);
    }
  };
  
  return (
    <div 
      className={`vapor-card p-5 hover:border-[var(--arena-gold)] transition-all relative ${
        isVaporProject ? 'ring-2 ring-[var(--arena-gold)]' : ''
      } ${!isDeployed ? 'opacity-60' : ''}`}
    >
      {/* Vapor Badge */}
      {isVaporProject && (
        <div className="absolute -top-2 -right-2 px-2 py-1 bg-gradient-to-r from-[var(--arena-gold)] to-[#f5d799] text-black text-xs font-bold rounded-full z-10">
          💨 It's Me
        </div>
      )}
      
      {/* Header - Clickable */}
      <div 
        className="cursor-pointer"
        onClick={() => router.push(`/market/${market.id}`)}
      >
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
        <div className="flex items-center justify-between text-xs text-[var(--arena-muted)] mb-4">
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
      
      {/* Quick Buy Section */}
      {isDeployed && (
        <div className="pt-3 border-t border-[var(--arena-border)]" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1 px-2 py-1.5 bg-[var(--arena-surface-alt)] border border-[var(--arena-border)] rounded text-sm text-white focus:outline-none focus:border-[var(--arena-gold)]"
              placeholder="0.1"
              disabled={buying || vaporLoading}
            />
            <button
              onClick={(e) => handleQuickBuy('yes', e)}
              disabled={buying || vaporLoading}
              className="flex-1 px-3 py-1.5 bg-[var(--vapor-green)]/20 hover:bg-[var(--vapor-green)]/30 text-[var(--vapor-green)] rounded text-sm font-medium transition-colors disabled:opacity-50"
            >
              {buying ? '...' : 'YES'}
            </button>
            <button
              onClick={(e) => handleQuickBuy('no', e)}
              disabled={buying || vaporLoading}
              className="flex-1 px-3 py-1.5 bg-[var(--vapor-red)]/20 hover:bg-[var(--vapor-red)]/30 text-[var(--vapor-red)] rounded text-sm font-medium transition-colors disabled:opacity-50"
            >
              {buying ? '...' : 'NO'}
            </button>
          </div>
        </div>
      )}
      
      {/* Deploy CTA for undeployed markets */}
      {!isDeployed && (
        <div 
          className="pt-3 border-t border-[var(--arena-border)] cursor-pointer hover:bg-[var(--arena-surface-alt)]/30 -mx-5 -mb-5 px-5 pb-5 rounded-b-lg transition-colors"
          onClick={() => router.push(`/market/${market.id}`)}
        >
          <div className="text-center text-xs text-[var(--arena-gold)] font-medium">
            ⚡ Deploy this market to start trading →
          </div>
        </div>
      )}
    </div>
  );
}
