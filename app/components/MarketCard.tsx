'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { Market } from '@/lib/types';
import { useVapor } from '@/hooks/useVapor';

interface MarketCardProps {
  market: Market;
  onUpdate?: (market: Market) => void;
}

export function MarketCard({ market, onUpdate }: MarketCardProps) {
  const { connected, publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const { 
    loading: vaporLoading, 
    error: vaporError, 
    txSignature,
    buyShares, 
    createMarket,
    checkMarketExists,
    getPosition,
    estimateTrade,
    clearError 
  } = useVapor();
  
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState<string>('0.01');
  const [marketOnChain, setMarketOnChain] = useState<boolean | null>(null);
  const [position, setPosition] = useState<{ side: 'yes' | 'no'; shares: number } | null>(null);
  const [showTxLink, setShowTxLink] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'yes' | 'no'>('yes');
  
  const isResolved = market.status === 'resolved';
  const amountNum = parseFloat(amount) || 0;
  
  // Check if market exists on-chain
  useEffect(() => {
    const check = async () => {
      const exists = await checkMarketExists(market.projectId);
      setMarketOnChain(exists);
    };
    check();
  }, [market.projectId, checkMarketExists]);
  
  // Fetch user's position
  useEffect(() => {
    const fetchPosition = async () => {
      if (connected && publicKey) {
        const pos = await getPosition(market.projectId);
        setPosition(pos);
        // If user has position, default to that tab
        if (pos) {
          setActiveTab(pos.side);
        }
      } else {
        setPosition(null);
      }
    };
    fetchPosition();
  }, [connected, publicKey, market.projectId, getPosition, txSignature]);
  
  // Handle buy with on-chain transaction
  const handleBuy = async (side: 'yes' | 'no') => {
    if (!connected) {
      setVisible(true);
      return;
    }
    
    if (loading || vaporLoading || amountNum <= 0) return;
    
    // Check if user already has opposite position
    if (position && position.side !== side) {
      clearError();
      return;
    }
    
    setLoading(true);
    clearError();
    
    try {
      // First, ensure market exists on-chain
      if (!marketOnChain) {
        const createSig = await createMarket(
          market.projectId,
          market.projectName,
          7
        );
        
        if (!createSig) {
          setLoading(false);
          return;
        }
        
        setMarketOnChain(true);
      }
      
      // Buy shares on-chain
      const sig = await buyShares(market.projectId, side, amountNum);
      
      if (sig) {
        setShowTxLink(sig);
        
        // Update local state via API
        const res = await fetch(`/api/markets/${market.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            side, 
            amount: Math.floor(amountNum * 1_000_000),
            txSignature: sig 
          }),
        });
        
        const data = await res.json();
        if (data.success && onUpdate) {
          onUpdate(data.market);
        }
        
        // Refresh position
        const pos = await getPosition(market.projectId);
        setPosition(pos);
        
        setTimeout(() => setShowTxLink(null), 10000);
      }
    } catch (error) {
      console.error('Failed to buy shares:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Calculate estimated shares
  const estimatedShares = amountNum > 0 
    ? estimateTrade(market.yesPool, market.noPool, amountNum, activeTab)
    : 0;
  
  // Check if opposite side is locked
  const oppositePosition = position && position.side !== activeTab;
  
  return (
    <div className="vapor-card p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-1">
            {market.projectName}
          </h3>
          <p className="text-sm text-[var(--vapor-muted)]">
            {market.question}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            isResolved 
              ? 'bg-[var(--vapor-accent)]/20 text-[var(--vapor-accent)]' 
              : 'bg-[var(--vapor-green)]/20 text-[var(--vapor-green)]'
          }`}>
            {isResolved ? 'Resolved' : 'Open'}
          </div>
          {marketOnChain !== null && (
            <div className={`text-xs ${marketOnChain ? 'text-[var(--vapor-green)]' : 'text-[var(--vapor-muted)]'}`}>
              {marketOnChain ? '● On-chain' : '○ Not deployed'}
            </div>
          )}
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
      
      {/* Position Display */}
      {position && (
        <div className={`mb-4 p-3 rounded-lg ${
          position.side === 'yes' 
            ? 'bg-[var(--vapor-green)]/10 border border-[var(--vapor-green)]/30' 
            : 'bg-[var(--vapor-red)]/10 border border-[var(--vapor-red)]/30'
        }`}>
          <div className="flex justify-between items-center">
            <div className="text-sm">
              <span className="text-[var(--vapor-muted)]">Your position: </span>
              <span className={position.side === 'yes' ? 'text-[var(--vapor-green)]' : 'text-[var(--vapor-red)]'}>
                {(position.shares / 1e9).toFixed(4)} {position.side.toUpperCase()}
              </span>
            </div>
            <div className="text-xs text-[var(--vapor-muted)]">
              (Sell coming soon)
            </div>
          </div>
        </div>
      )}
      
      {/* Stats */}
      <div className="flex items-center justify-between text-sm mb-4">
        <div className="text-[var(--vapor-muted)]">
          Vol: <span className="text-white">{market.totalVolume.toLocaleString()}</span>
        </div>
        {market.marketAddress && (
          <a 
            href={`https://explorer.solana.com/address/${market.marketAddress}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--vapor-accent)] text-xs font-mono hover:underline"
          >
            {market.marketAddress.slice(0, 4)}...{market.marketAddress.slice(-4)}
          </a>
        )}
      </div>
      
      {/* Error Display */}
      {vaporError && (
        <div className="mb-4 p-3 rounded-lg bg-[var(--vapor-red)]/10 border border-[var(--vapor-red)]/30">
          <p className="text-sm text-[var(--vapor-red)]">{vaporError}</p>
        </div>
      )}
      
      {/* Transaction Link */}
      {showTxLink && (
        <div className="mb-4 p-3 rounded-lg bg-[var(--vapor-green)]/10 border border-[var(--vapor-green)]/30">
          <p className="text-sm text-[var(--vapor-green)]">
            ✓ Confirmed!{' '}
            <a 
              href={`https://explorer.solana.com/tx/${showTxLink}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              View TX
            </a>
          </p>
        </div>
      )}
      
      {/* Trading Interface */}
      {!isResolved && (
        <div className="space-y-3">
          {/* Tab Selector */}
          <div className="flex rounded-lg overflow-hidden border border-[var(--vapor-border)]">
            <button
              onClick={() => setActiveTab('yes')}
              disabled={position?.side === 'no'}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                activeTab === 'yes'
                  ? 'bg-[var(--vapor-green)]/20 text-[var(--vapor-green)]'
                  : 'bg-transparent text-[var(--vapor-muted)] hover:bg-[var(--vapor-surface)]'
              } ${position?.side === 'no' ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Buy YES
            </button>
            <button
              onClick={() => setActiveTab('no')}
              disabled={position?.side === 'yes'}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                activeTab === 'no'
                  ? 'bg-[var(--vapor-red)]/20 text-[var(--vapor-red)]'
                  : 'bg-transparent text-[var(--vapor-muted)] hover:bg-[var(--vapor-surface)]'
              } ${position?.side === 'yes' ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Buy NO
            </button>
          </div>
          
          {/* Locked Position Warning */}
          {position && oppositePosition && (
            <p className="text-xs text-[var(--vapor-muted)] text-center">
              ⚠️ You have a {position.side.toUpperCase()} position. Can only buy more {position.side.toUpperCase()}.
            </p>
          )}
          
          {/* Amount Input */}
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1 bg-[var(--vapor-bg)] border border-[var(--vapor-border)] rounded-lg px-3 py-2 text-white text-sm focus:border-[var(--vapor-accent)] focus:outline-none"
              placeholder="Amount"
              min="0.001"
              step="0.01"
            />
            <span className="text-sm text-[var(--vapor-muted)]">SOL</span>
          </div>
          
          {/* Estimate */}
          {amountNum > 0 && (
            <div className="text-xs text-[var(--vapor-muted)] text-center">
              Est. shares: ~{(estimatedShares / 1e9).toFixed(4)} {activeTab.toUpperCase()}
            </div>
          )}
          
          {/* Buy Button */}
          <button 
            onClick={() => handleBuy(activeTab)}
            disabled={loading || vaporLoading || amountNum <= 0 || !!(position && position.side !== activeTab)}
            className={`w-full vapor-button ${
              activeTab === 'yes'
                ? 'bg-[var(--vapor-green)]/20 text-[var(--vapor-green)] hover:bg-[var(--vapor-green)]/30'
                : 'bg-[var(--vapor-red)]/20 text-[var(--vapor-red)] hover:bg-[var(--vapor-red)]/30'
            } disabled:opacity-50`}
          >
            {loading || vaporLoading ? (
              <span className="animate-pulse">Processing...</span>
            ) : !connected ? (
              'Connect Wallet'
            ) : (
              `Buy ${activeTab.toUpperCase()} @ ${activeTab === 'yes' ? market.yesOdds : market.noOdds}%`
            )}
          </button>
          
          {!connected && (
            <p className="text-center text-xs text-[var(--vapor-muted)]">
              Connect wallet to trade
            </p>
          )}
        </div>
      )}
      
      {/* Resolved State */}
      {isResolved && market.resolution && (
        <div className={`text-center p-4 rounded-lg ${
          market.resolution === 'yes'
            ? 'bg-[var(--vapor-green)]/10'
            : 'bg-[var(--vapor-red)]/10'
        }`}>
          <span className={`text-lg font-bold ${
            market.resolution === 'yes' ? 'text-[var(--vapor-green)]' : 'text-[var(--vapor-red)]'
          }`}>
            Resolved: {market.resolution.toUpperCase()}
          </span>
        </div>
      )}
    </div>
  );
}
