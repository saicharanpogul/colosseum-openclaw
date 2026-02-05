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
    
    setLoading(true);
    clearError();
    
    try {
      // First, ensure market exists on-chain
      if (!marketOnChain) {
        // Create market first
        const createSig = await createMarket(
          market.projectId,
          market.projectName,
          7 // 7 days until resolution
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
        
        // Update local state via API (for UI sync)
        const res = await fetch(`/api/markets/${market.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            side, 
            amount: Math.floor(amountNum * 1_000_000), // Convert to mock tokens
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
        
        // Clear tx link after 10 seconds
        setTimeout(() => setShowTxLink(null), 10000);
      }
    } catch (error) {
      console.error('Failed to buy shares:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Calculate estimated shares
  const estimatedYesShares = amountNum > 0 
    ? estimateTrade(market.yesPool, market.noPool, amountNum, 'yes')
    : 0;
  const estimatedNoShares = amountNum > 0 
    ? estimateTrade(market.yesPool, market.noPool, amountNum, 'no')
    : 0;
  
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
          <div className="text-sm">
            <span className="text-[var(--vapor-muted)]">Your position: </span>
            <span className={position.side === 'yes' ? 'text-[var(--vapor-green)]' : 'text-[var(--vapor-red)]'}>
              {position.shares.toLocaleString()} {position.side.toUpperCase()} shares
            </span>
          </div>
        </div>
      )}
      
      {/* Stats */}
      <div className="flex items-center justify-between text-sm mb-4">
        <div className="text-[var(--vapor-muted)]">
          Volume: <span className="text-white">{market.totalVolume.toLocaleString()}</span>
        </div>
        {market.marketAddress && (
          <a 
            href={`https://explorer.solana.com/address/${market.marketAddress}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--vapor-accent)] text-xs font-mono hover:underline truncate max-w-[120px]"
            title={market.marketAddress}
          >
            {market.marketAddress.slice(0, 4)}...{market.marketAddress.slice(-4)}
          </a>
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
            ✓ Transaction confirmed!{' '}
            <a 
              href={`https://explorer.solana.com/tx/${showTxLink}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              View on Solana Explorer
            </a>
          </p>
        </div>
      )}
      
      {/* Trading Interface */}
      {!isResolved && (
        <div className="space-y-3">
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
          
          {amountNum > 0 && (
            <div className="flex justify-between text-xs text-[var(--vapor-muted)]">
              <span>Est. YES shares: ~{(estimatedYesShares / 1e9).toFixed(2)}</span>
              <span>Est. NO shares: ~{(estimatedNoShares / 1e9).toFixed(2)}</span>
            </div>
          )}
          
          <div className="flex gap-3">
            <button 
              onClick={() => handleBuy('yes')}
              disabled={loading || vaporLoading || amountNum <= 0}
              className="flex-1 vapor-button bg-[var(--vapor-green)]/20 text-[var(--vapor-green)] hover:bg-[var(--vapor-green)]/30 disabled:opacity-50"
            >
              {loading || vaporLoading ? (
                <span className="animate-pulse">Processing...</span>
              ) : !connected ? (
                'Connect Wallet'
              ) : (
                `Buy Yes @ ${market.yesOdds}%`
              )}
            </button>
            <button 
              onClick={() => handleBuy('no')}
              disabled={loading || vaporLoading || amountNum <= 0}
              className="flex-1 vapor-button bg-[var(--vapor-red)]/20 text-[var(--vapor-red)] hover:bg-[var(--vapor-red)]/30 disabled:opacity-50"
            >
              {loading || vaporLoading ? (
                <span className="animate-pulse">Processing...</span>
              ) : !connected ? (
                'Connect Wallet'
              ) : (
                `Buy No @ ${market.noOdds}%`
              )}
            </button>
          </div>
          
          {!connected && (
            <p className="text-center text-xs text-[var(--vapor-muted)]">
              Connect your wallet to trade on-chain
            </p>
          )}
        </div>
      )}
    </div>
  );
}
