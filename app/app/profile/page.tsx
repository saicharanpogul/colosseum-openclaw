'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import Link from 'next/link';
import { Header } from '@/components';
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
  const { getPositions } = useVapor();
  
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
  
  // Fetch positions for all markets
  const fetchAllPositions = useCallback(async () => {
    if (!connected || !publicKey || markets.length === 0) return;
    
    setLoading(true);
    const allPositions: PositionDisplay[] = [];
    
    for (const market of markets) {
      try {
        const pos = await getPositions(market.projectId);
        
        if (pos.yes) {
          allPositions.push({
            projectId: market.projectId,
            projectName: market.projectName,
            side: 'yes',
            shares: pos.yes.shares,
            marketOdds: market.yesOdds,
          });
        }
        
        if (pos.no) {
          allPositions.push({
            projectId: market.projectId,
            projectName: market.projectName,
            side: 'no',
            shares: pos.no.shares,
            marketOdds: market.noOdds,
          });
        }
      } catch (error) {
        // Skip errors for individual markets
      }
    }
    
    setPositions(allPositions);
    setLoading(false);
  }, [connected, publicKey, markets, getPositions]);
  
  useEffect(() => {
    fetchAllPositions();
  }, [fetchAllPositions]);
  
  const totalValue = positions.reduce((sum, p) => {
    const value = (p.shares / 1e9) * (p.marketOdds / 100);
    return sum + value;
  }, 0);
  
  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Your Portfolio</h1>
            <p className="text-[var(--vapor-muted)]">
              {connected ? `${publicKey?.toBase58().slice(0, 4)}...${publicKey?.toBase58().slice(-4)}` : 'Connect wallet to view'}
            </p>
          </div>
          <Link href="/" className="vapor-button">
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
                  <div className="flex items-center justify-between">
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
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
