'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { Market } from '@/lib/types';
import { useVapor, PositionData } from '@/hooks/useVapor';
import { PriceChart } from './PriceChart';

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
    sellShares,
    createMarket,
    checkMarketExists,
    getPositions,
    estimateTrade,
    clearError 
  } = useVapor();
  
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState<string>('0.01');
  const [sellAmount, setSellAmount] = useState<string>('');
  const [marketOnChain, setMarketOnChain] = useState<boolean | null>(null);
  const [positions, setPositions] = useState<{ yes: PositionData | null; no: PositionData | null }>({ yes: null, no: null });
  const [showTxLink, setShowTxLink] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'yes' | 'no'>('yes');
  const [mode, setMode] = useState<'buy' | 'sell'>('buy');
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [deploying, setDeploying] = useState(false);
  
  const isResolved = market.status === 'resolved';
  const amountNum = parseFloat(amount) || 0;
  const sellAmountNum = parseFloat(sellAmount) || 0;
  
  // Check if market exists on-chain
  useEffect(() => {
    const check = async () => {
      const exists = await checkMarketExists(market.projectId);
      setMarketOnChain(exists);
    };
    check();
  }, [market.projectId, checkMarketExists]);
  
  // Fetch user's positions (both YES and NO)
  useEffect(() => {
    const fetchPositions = async () => {
      if (connected && publicKey) {
        const pos = await getPositions(market.projectId);
        setPositions(pos);
      } else {
        setPositions({ yes: null, no: null });
      }
    };
    fetchPositions();
  }, [connected, publicKey, market.projectId, getPositions, txSignature]);
  
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
        
        // Update Supabase via API
        const res = await fetch(`/api/markets/${market.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            side, 
            action: 'buy',
            amount: Math.floor(amountNum * 1_000_000),
            shares: estimatedShares,
            userAddress: publicKey?.toBase58(),
            txSignature: sig 
          }),
        });
        
        const data = await res.json();
        if (data.success && onUpdate) {
          onUpdate(data.market);
        }
        
        // Refresh positions
        const pos = await getPositions(market.projectId);
        setPositions(pos);
        
        setTimeout(() => setShowTxLink(null), 10000);
      }
    } catch (error) {
      console.error('Failed to buy shares:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle sell
  const handleSell = async (side: 'yes' | 'no') => {
    if (!connected) {
      setVisible(true);
      return;
    }
    
    const position = side === 'yes' ? positions.yes : positions.no;
    if (!position || loading || vaporLoading) return;
    
    const sharesToSell = sellAmountNum > 0 ? Math.floor(sellAmountNum * 1e6) : position.shares;
    if (sharesToSell <= 0 || sharesToSell > position.shares) {
      return;
    }
    
    setLoading(true);
    clearError();
    
    try {
      const sig = await sellShares(market.projectId, side, sharesToSell);
      
      if (sig) {
        setShowTxLink(sig);
        setSellAmount('');
        
        // Update Supabase via API
        await fetch(`/api/markets/${market.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            side, 
            action: 'sell',
            amount: sharesToSell,
            shares: sharesToSell,
            userAddress: publicKey?.toBase58(),
            txSignature: sig 
          }),
        });
        
        // Refresh positions
        const pos = await getPositions(market.projectId);
        setPositions(pos);
        
        setTimeout(() => setShowTxLink(null), 10000);
      }
    } catch (error) {
      console.error('Failed to sell shares:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Deploy market on-chain (anyone can call this crank)
  const handleDeployMarket = async () => {
    if (!connected) {
      setVisible(true);
      return;
    }
    
    setDeploying(true);
    clearError();
    
    try {
      const sig = await createMarket(market.projectId, market.projectName, 7);
      
      if (sig) {
        setMarketOnChain(true);
        setShowDeployModal(false);
        setShowTxLink(sig);
        setTimeout(() => setShowTxLink(null), 10000);
      }
    } catch (error) {
      console.error('Failed to deploy market:', error);
    } finally {
      setDeploying(false);
    }
  };
  
  // Colosseum project link
  const colosseumLink = `https://colosseum.com/agent-hackathon/projects/${market.projectSlug || market.projectName.toLowerCase().replace(/\s+/g, '-')}`;
  
  // Calculate estimated shares
  const estimatedShares = amountNum > 0 
    ? estimateTrade(market.yesPool, market.noPool, amountNum, activeTab)
    : 0;
  
  const activePosition = activeTab === 'yes' ? positions.yes : positions.no;
  const hasAnyPosition = positions.yes || positions.no;
  
  // Check if this is the Vapor project (our own)
  const isVaporProject = market.projectId === 341 || market.projectName.toLowerCase() === 'vapor';
  
  // Format volume in SOL
  const volumeInSol = (market.totalVolume / 1_000_000).toFixed(2);
  
  return (
    <div className={`vapor-card p-6 ${isVaporProject ? 'ring-2 ring-[var(--arena-gold)] relative' : ''}`}>
      {/* Vapor Badge */}
      {isVaporProject && (
        <div 
          className="absolute -top-2 -right-2 px-2 py-1 bg-gradient-to-r from-[var(--arena-gold)] to-[#f5d799] text-black text-xs font-bold rounded-full cursor-help group"
          title="Bet on the oracle. Will Faahh see the future? 💨"
        >
          💨 It's Me
        </div>
      )}
      
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-1">
            {market.projectName}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={colosseumLink}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 rounded hover:bg-[var(--arena-surface-alt)] transition-colors"
            title="View on Colosseum"
          >
            <svg className="w-4 h-4 text-[var(--arena-muted)] hover:text-[var(--arena-gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            isResolved 
              ? 'bg-[var(--vapor-accent)]/20 text-[var(--vapor-accent)]' 
              : 'bg-[var(--vapor-green)]/20 text-[var(--vapor-green)]'
          }`}>
            {isResolved ? 'Resolved' : 'Open'}
          </div>
        </div>
      </div>
      
      {/* Question - Fixed height with tooltip for overflow */}
      <div className="relative group mb-3">
        <p className="text-sm text-[var(--vapor-muted)] line-clamp-2 h-10">
          {market.question}
        </p>
        {market.question.length > 80 && (
          <div className="absolute left-0 right-0 bottom-full mb-2 hidden group-hover:block z-20">
            <div className="bg-[var(--arena-surface)] border border-[var(--arena-border)] rounded-lg p-3 text-sm text-[var(--arena-text)] shadow-lg">
              {market.question}
            </div>
          </div>
        )}
      </div>
      
      {/* Deployment Status - Highlighted */}
      {marketOnChain !== null && (
        <div 
          className={`mb-4 p-3 rounded-lg flex items-center justify-between ${
            marketOnChain 
              ? 'bg-[var(--arena-green)]/10 border border-[var(--arena-green)]/30' 
              : 'bg-[var(--arena-gold)]/10 border border-[var(--arena-gold)]/30 cursor-pointer hover:bg-[var(--arena-gold)]/20'
          }`}
          onClick={() => !marketOnChain && setShowDeployModal(true)}
        >
          <div className="flex items-center gap-2">
            <span className={`text-lg ${marketOnChain ? 'text-[var(--arena-green)]' : 'text-[var(--arena-gold)]'}`}>
              {marketOnChain ? '✓' : '○'}
            </span>
            <span className={`text-sm font-medium ${marketOnChain ? 'text-[var(--arena-green)]' : 'text-[var(--arena-gold)]'}`}>
              {marketOnChain ? 'Deployed On-Chain' : 'Not Deployed Yet'}
            </span>
          </div>
          {!marketOnChain && (
            <button className="text-xs px-3 py-1 rounded bg-[var(--arena-gold)] text-black font-medium hover:opacity-90">
              Deploy Now
            </button>
          )}
        </div>
      )}
      
      {/* Deploy Modal */}
      {showDeployModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowDeployModal(false)}>
          <div className="vapor-card p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-white mb-4">Deploy Market On-Chain</h3>
            <p className="text-[var(--arena-muted)] mb-4">
              This market exists in the database but hasn't been deployed to Solana yet. 
              Anyone can deploy it as a "crank" to initialize the on-chain state.
            </p>
            <div className="bg-[var(--arena-surface-alt)] rounded-lg p-4 mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-[var(--arena-muted)]">Project:</span>
                <span className="text-white">{market.projectName}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-[var(--arena-muted)]">Initial Pools:</span>
                <span className="text-white">1 SOL each</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--arena-muted)]">Starting Odds:</span>
                <span className="text-white">50% / 50%</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowDeployModal(false)}
                className="flex-1 vapor-button vapor-button-outline"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeployMarket}
                disabled={deploying}
                className="flex-1 vapor-button vapor-button-primary disabled:opacity-50"
              >
                {deploying ? 'Deploying...' : 'Deploy Market'}
              </button>
            </div>
            {vaporError && (
              <p className="text-[var(--arena-red)] text-sm mt-3">{vaporError}</p>
            )}
          </div>
        </div>
      )}
      
      {/* Price Chart */}
      <div className="mb-4">
        <PriceChart history={market.priceHistory || []} height={50} />
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
      
      {/* Positions Display */}
      {hasAnyPosition && (
        <div className="mb-4 space-y-2">
          {positions.yes && (
            <div className="p-2 rounded-lg bg-[var(--vapor-green)]/10 border border-[var(--vapor-green)]/30 flex justify-between items-center">
              <span className="text-sm text-[var(--vapor-green)]">
                YES: {(positions.yes.shares / 1e6).toFixed(4)} shares
              </span>
              <button
                onClick={() => { setActiveTab('yes'); setMode('sell'); }}
                className="text-xs px-2 py-1 rounded bg-[var(--vapor-green)]/20 text-[var(--vapor-green)] hover:bg-[var(--vapor-green)]/30"
              >
                Sell
              </button>
            </div>
          )}
          {positions.no && (
            <div className="p-2 rounded-lg bg-[var(--vapor-red)]/10 border border-[var(--vapor-red)]/30 flex justify-between items-center">
              <span className="text-sm text-[var(--vapor-red)]">
                NO: {(positions.no.shares / 1e6).toFixed(4)} shares
              </span>
              <button
                onClick={() => { setActiveTab('no'); setMode('sell'); }}
                className="text-xs px-2 py-1 rounded bg-[var(--vapor-red)]/20 text-[var(--vapor-red)] hover:bg-[var(--vapor-red)]/30"
              >
                Sell
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* Stats */}
      <div className="flex items-center justify-between text-sm mb-4">
        <div className="text-[var(--vapor-muted)]">
          Vol: <span className="text-white">{volumeInSol} SOL</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-[var(--vapor-muted)]">
            <span className="text-white">{market.participants || 0}</span> traders
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
          {/* Mode Toggle */}
          <div className="flex rounded-lg overflow-hidden border border-[var(--vapor-border)]">
            <button
              onClick={() => setMode('buy')}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                mode === 'buy'
                  ? 'bg-[var(--vapor-accent)]/20 text-[var(--vapor-accent)]'
                  : 'bg-transparent text-[var(--vapor-muted)] hover:bg-[var(--vapor-surface)]'
              }`}
            >
              Buy
            </button>
            <button
              onClick={() => setMode('sell')}
              disabled={!hasAnyPosition}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                mode === 'sell'
                  ? 'bg-[var(--vapor-accent)]/20 text-[var(--vapor-accent)]'
                  : 'bg-transparent text-[var(--vapor-muted)] hover:bg-[var(--vapor-surface)]'
              } ${!hasAnyPosition ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Sell
            </button>
          </div>
          
          {/* Side Selector */}
          <div className="flex rounded-lg overflow-hidden border border-[var(--vapor-border)]">
            <button
              onClick={() => setActiveTab('yes')}
              disabled={mode === 'sell' && !positions.yes}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                activeTab === 'yes'
                  ? 'bg-[var(--vapor-green)]/20 text-[var(--vapor-green)]'
                  : 'bg-transparent text-[var(--vapor-muted)] hover:bg-[var(--vapor-surface)]'
              } ${mode === 'sell' && !positions.yes ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              YES
            </button>
            <button
              onClick={() => setActiveTab('no')}
              disabled={mode === 'sell' && !positions.no}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                activeTab === 'no'
                  ? 'bg-[var(--vapor-red)]/20 text-[var(--vapor-red)]'
                  : 'bg-transparent text-[var(--vapor-muted)] hover:bg-[var(--vapor-surface)]'
              } ${mode === 'sell' && !positions.no ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              NO
            </button>
          </div>
          
          {mode === 'buy' ? (
            <>
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
                  Est. shares: ~{(estimatedShares / 1e6).toFixed(4)} {activeTab.toUpperCase()}
                </div>
              )}
              
              {/* Buy Button */}
              <button 
                onClick={() => handleBuy(activeTab)}
                disabled={loading || vaporLoading || amountNum <= 0}
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
            </>
          ) : (
            <>
              {/* Sell Amount Input */}
              {activePosition && (
                <>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={sellAmount}
                      onChange={(e) => setSellAmount(e.target.value)}
                      className="flex-1 bg-[var(--vapor-bg)] border border-[var(--vapor-border)] rounded-lg px-3 py-2 text-white text-sm focus:border-[var(--vapor-accent)] focus:outline-none"
                      placeholder={`Max: ${(activePosition.shares / 1e6).toFixed(4)}`}
                      min="0"
                      max={activePosition.shares / 1e6}
                      step="0.0001"
                    />
                    <button 
                      onClick={() => setSellAmount((activePosition.shares / 1e6).toString())}
                      className="text-xs px-2 py-1 rounded bg-[var(--vapor-surface)] text-[var(--vapor-muted)] hover:text-white"
                    >
                      Max
                    </button>
                  </div>
                  
                  <div className="text-xs text-[var(--vapor-muted)] text-center">
                    Available: {(activePosition.shares / 1e6).toFixed(4)} {activeTab.toUpperCase()} shares
                  </div>
                  
                  {/* Sell Button */}
                  <button 
                    onClick={() => handleSell(activeTab)}
                    disabled={loading || vaporLoading || (sellAmountNum <= 0 && !activePosition)}
                    className={`w-full vapor-button ${
                      activeTab === 'yes'
                        ? 'bg-[var(--vapor-green)]/20 text-[var(--vapor-green)] hover:bg-[var(--vapor-green)]/30'
                        : 'bg-[var(--vapor-red)]/20 text-[var(--vapor-red)] hover:bg-[var(--vapor-red)]/30'
                    } disabled:opacity-50`}
                  >
                    {loading || vaporLoading ? (
                      <span className="animate-pulse">Processing...</span>
                    ) : (
                      `Sell ${sellAmountNum > 0 ? sellAmountNum.toFixed(4) : 'All'} ${activeTab.toUpperCase()}`
                    )}
                  </button>
                </>
              )}
            </>
          )}
          
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
