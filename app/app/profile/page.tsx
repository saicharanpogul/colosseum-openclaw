'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import Link from 'next/link';
import { Header } from '@/components';
import { ShareButton } from '@/components/ShareButton';
import { useVapor } from '@/hooks/useVapor';

interface PositionDisplay {
  projectId: number;
  projectName: string;
  side: 'yes' | 'no';
  shares: number;
  marketOdds: number;
}

export default function ProfilePage() {
  const { connected, publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const { getAllPositions } = useVapor();
  
  const [positions, setPositions] = useState<PositionDisplay[]>([]);
  const [loading, setLoading] = useState(false);
  const [markets, setMarkets] = useState<any[]>([]);
  
  // Fetch all markets
  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        const res = await fetch('/api/markets');
        const data = await res.json();
        if (data.markets) {
          setMarkets(data.markets);
        }
      } catch (error) {
        console.error('Failed to fetch markets:', error);
      }
    };
    fetchMarkets();
  }, []);
  
  // Fetch positions efficiently
  const fetchAllPositions = useCallback(async () => {
    if (!connected || !publicKey || markets.length === 0) {
      // console.log('Profile: Skipping fetch', { connected, hasPublicKey: !!publicKey, marketCount: markets.length });
      return;
    }
    
    setLoading(true);
    
    try {
      // console.log('Profile: Fetching positions for', publicKey.toBase58());
      const userPositions = await getAllPositions();
      // console.log('Profile: Raw positions from chain:', userPositions);
      
      const displayPositions: PositionDisplay[] = [];
      
      for (const pos of userPositions) {
        // Find market info by address
        const market = markets.find(m => m.marketAddress === pos.marketAddress);
        
        // console.log('Profile: Looking for market', pos.marketAddress, 'found:', !!market);
        
        if (market) {
          displayPositions.push({
            projectId: market.projectId,
            projectName: market.projectName,
            side: pos.side,
            shares: pos.shares,
            marketOdds: pos.side === 'yes' ? market.yesOdds : market.noOdds,
          });
        } else {
          // Market exists on chain but not linked in DB?
          displayPositions.push({
            projectId: 0,
            projectName: `Unknown Market (${pos.marketAddress.slice(0,4)}...)`,
            side: pos.side,
            shares: pos.shares,
            marketOdds: 50,
          });
        }
      }
      
      // console.log('Profile: Display positions:', displayPositions);
      setPositions(displayPositions);
    } catch (err) {
      console.error('Failed to fetch positions:', err);
    } finally {
      setLoading(false);
    }
  }, [connected, publicKey, markets, getAllPositions]);
  
  useEffect(() => {
    fetchAllPositions();
  }, [fetchAllPositions]);
  
  const totalValue = positions.reduce((sum, p) => {
    const value = (p.shares / 1e9) * (p.marketOdds / 100);
    return sum + value;
  }, 0);
  
  return (
    <div className="min-h-screen arena-gradient">
      <Header />
      
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Your Portfolio</h1>
            <p className="text-[var(--vapor-muted)]">
              {connected ? `${publicKey?.toBase58().slice(0, 4)}...${publicKey?.toBase58().slice(-4)}` : 'Connect wallet to view'}
            </p>
          </div>
          <Link href="/" className="vapor-button vapor-button-outline">
            ← Back to Markets
          </Link>
        </div>
        
        {!connected ? (
          <div className="vapor-card p-12 text-center">
            <p className="text-[var(--vapor-muted)] mb-4">Connect your wallet to view your positions</p>
            <button 
              onClick={() => setVisible(true)}
              className="vapor-button bg-[var(--vapor-accent)]/20 text-[var(--vapor-accent)]"
            >
              Connect Wallet
            </button>
          </div>
        ) : loading ? (
          <div className="vapor-card p-12 text-center">
            <p className="text-[var(--vapor-muted)] animate-pulse">Loading positions...</p>
          </div>
        ) : positions.length === 0 ? (
          <div className="vapor-card p-12 text-center">
            <p className="text-[var(--vapor-muted)] mb-4">No open positions</p>
            <Link href="/" className="vapor-button bg-[var(--vapor-accent)]/20 text-[var(--vapor-accent)]">
              Browse Markets
            </Link>
          </div>
        ) : (
          <>
            {/* Summary Card */}
            <div className="vapor-card p-6 mb-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-[var(--vapor-muted)]">Open Positions</p>
                  <p className="text-2xl font-bold text-white">{positions.length}</p>
                </div>
                <div>
                  <p className="text-sm text-[var(--vapor-muted)]">Total Value (est.)</p>
                  <p className="text-2xl font-bold text-[var(--vapor-accent)]">
                    {totalValue.toFixed(4)} SOL
                  </p>
                </div>
                <div>
                  <p className="text-sm text-[var(--vapor-muted)]">YES Positions</p>
                  <p className="text-2xl font-bold text-[var(--vapor-green)]">
                    {positions.filter(p => p.side === 'yes').length}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-[var(--vapor-muted)]">NO Positions</p>
                  <p className="text-2xl font-bold text-[var(--vapor-red)]">
                    {positions.filter(p => p.side === 'no').length}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Positions List */}
            <div className="space-y-4">
              {positions.map((position, index) => (
                <div 
                  key={`${position.projectId}-${position.side}-${index}`}
                  className={`vapor-card p-4 border-l-4 ${
                    position.side === 'yes' 
                      ? 'border-l-[var(--vapor-green)]' 
                      : 'border-l-[var(--vapor-red)]'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {position.projectName}
                      </h3>
                      <p className="text-sm text-[var(--vapor-muted)]">
                        <span className={position.side === 'yes' ? 'text-[var(--vapor-green)]' : 'text-[var(--vapor-red)]'}>
                          {position.side.toUpperCase()}
                        </span>
                        {' · '}
                        {(position.shares / 1e9).toFixed(4)} shares
                        {' · '}
                        {position.marketOdds}% odds
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-white">
                        {((position.shares / 1e9) * (position.marketOdds / 100)).toFixed(4)} SOL
                      </p>
                      <p className="text-xs text-[var(--vapor-muted)]">est. value</p>
                    </div>
                  </div>
                  
                  {/* Share Button */}
                  <ShareButton
                    projectName={position.projectName}
                    projectId={position.projectId}
                    side={position.side}
                    shares={position.shares / 1e9}
                    odds={position.marketOdds}
                    value={(position.shares / 1e9) * (position.marketOdds / 100)}
                    wallet={publicKey ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}` : ''}
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
