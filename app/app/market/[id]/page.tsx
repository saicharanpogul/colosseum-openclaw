'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { Market } from '@/lib/types';
import { MarketCard } from '@/components/MarketCard';
import { useToast } from '@/components/ToastProvider';

export default function MarketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const marketId = params.id as string;
  
  const [market, setMarket] = useState<Market | null>(null);
  const [relatedMarkets, setRelatedMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMarket = async () => {
      try {
        const res = await fetch(`/api/markets/${marketId}`);
        const data = await res.json();
        
        if (data.success && data.market) {
          // Ensure all required fields exist
          const marketData = {
            ...data.market,
            projectSlug: data.market.projectSlug || data.market.projectName?.toLowerCase().replace(/\s+/g, '-') || '',
            createdAt: data.market.createdAt || new Date().toISOString(),
            question: data.market.question || `Will ${data.market.projectName} win?`,
          };
          setMarket(marketData);
          
          // Fetch related markets (other open markets)
          const allMarketsRes = await fetch('/api/markets');
          const allMarketsData = await allMarketsRes.json();
          
          if (allMarketsData.success) {
            // Get 3 random other open markets
            const others = allMarketsData.markets
              .filter((m: Market) => m.id !== marketId && m.status === 'open')
              .sort(() => Math.random() - 0.5)
              .slice(0, 3);
            setRelatedMarkets(others);
          }
        } else {
          setError(data.error || 'Market not found');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load market');
      } finally {
        setLoading(false);
      }
    };

    fetchMarket();
  }, [marketId]);

  if (loading) {
    return (
      <div className="min-h-screen arena-gradient">
        <Header />
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="text-4xl mb-4 animate-pulse">💨</div>
              <p className="text-[var(--arena-muted)]">Loading market...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !market) {
    return (
      <div className="min-h-screen arena-gradient">
        <Header />
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="vapor-card p-8 text-center">
            <p className="text-[var(--arena-red)] mb-4">{error || 'Market not found'}</p>
            <button 
              onClick={() => router.push('/')}
              className="vapor-button vapor-button-outline"
            >
              ← Back to Markets
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen arena-gradient">
      <Header />
      
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <button 
            onClick={() => router.push('/')}
            className="text-sm text-[var(--arena-muted)] hover:text-[var(--arena-gold)] transition-colors"
          >
            ← Back to Markets
          </button>
        </div>

        {/* Market Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                {market.projectName}
              </h1>
              <p className="text-lg text-[var(--arena-text-dim)]">
                {market.question}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {market.status === 'open' && (
                <span className="px-3 py-1 rounded-full bg-[var(--arena-green)] bg-opacity-20 border border-[var(--arena-green)] text-[var(--arena-green)] text-sm font-medium">
                  Open
                </span>
              )}
              {market.status === 'resolved' && (
                <span className="px-3 py-1 rounded-full bg-[var(--arena-gold)] bg-opacity-20 border border-[var(--arena-gold)] text-[var(--arena-gold)] text-sm font-medium">
                  Resolved
                </span>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="vapor-card p-4">
              <p className="text-xs text-[var(--arena-muted)] mb-1">YES Odds</p>
              <p className="text-2xl font-bold text-[var(--arena-green)]">
                {market.yesOdds.toFixed(1)}%
              </p>
            </div>
            <div className="vapor-card p-4">
              <p className="text-xs text-[var(--arena-muted)] mb-1">NO Odds</p>
              <p className="text-2xl font-bold text-[var(--arena-red)]">
                {market.noOdds.toFixed(1)}%
              </p>
            </div>
            <div className="vapor-card p-4">
              <p className="text-xs text-[var(--arena-muted)] mb-1">Volume</p>
              <p className="text-2xl font-bold text-white">
                {(market.totalVolume / 1_000_000).toFixed(2)} SOL
              </p>
            </div>
            <div className="vapor-card p-4">
              <p className="text-xs text-[var(--arena-muted)] mb-1">Traders</p>
              <p className="text-2xl font-bold text-white">
                {market.participants || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Trading */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Odds Display */}
            <div className="vapor-card p-6">
              <h2 className="text-xl font-bold text-white mb-4">Current Odds</h2>
              <div className="grid grid-cols-2 gap-4">
                {/* YES Side */}
                <div className="bg-[var(--arena-surface-alt)] rounded-lg p-6 border-2 border-[var(--arena-green)] border-opacity-30">
                  <div className="text-center">
                    <p className="text-sm text-[var(--arena-muted)] mb-2">YES</p>
                    <p className="text-5xl font-bold text-[var(--arena-green)] mb-2">
                      {market.yesOdds.toFixed(0)}%
                    </p>
                    <p className="text-xs text-[var(--arena-muted)]">
                      {(market.yesPool / 1_000_000).toFixed(2)} SOL in pool
                    </p>
                  </div>
                </div>

                {/* NO Side */}
                <div className="bg-[var(--arena-surface-alt)] rounded-lg p-6 border-2 border-[var(--arena-red)] border-opacity-30">
                  <div className="text-center">
                    <p className="text-sm text-[var(--arena-muted)] mb-2">NO</p>
                    <p className="text-5xl font-bold text-[var(--arena-red)] mb-2">
                      {market.noOdds.toFixed(0)}%
                    </p>
                    <p className="text-xs text-[var(--arena-muted)]">
                      {(market.noPool / 1_000_000).toFixed(2)} SOL in pool
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 p-4 bg-[var(--arena-surface-alt)] rounded-lg">
                <p className="text-xs text-[var(--arena-text-dim)] text-center">
                  💡 Odds update in real-time based on trades. Historical charts coming soon.
                </p>
              </div>
            </div>

            {/* Trading Card */}
            <div>
              <h2 className="text-xl font-bold text-white mb-4">Trade</h2>
              <MarketCard 
                market={market} 
                onUpdate={setMarket}
                compact={true}
              />
            </div>

            {/* Market Info */}
            <div className="vapor-card p-6">
              <h2 className="text-xl font-bold text-white mb-4">Market Information</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-[var(--arena-border)]">
                  <span className="text-[var(--arena-muted)]">Project ID</span>
                  <span className="text-white font-mono text-sm">{market.projectId}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-[var(--arena-border)]">
                  <span className="text-[var(--arena-muted)]">Status</span>
                  <span className="text-white capitalize">{market.status}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-[var(--arena-border)]">
                  <span className="text-[var(--arena-muted)]">Created</span>
                  <span className="text-white">
                    {market.createdAt ? new Date(market.createdAt).toLocaleDateString() : 'Recently'}
                  </span>
                </div>
                {market.marketAddress && (
                  <div className="flex justify-between items-center py-2">
                    <span className="text-[var(--arena-muted)]">On-Chain Address</span>
                    <a 
                      href={`https://explorer.solana.com/address/${market.marketAddress}?cluster=devnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--arena-gold)] hover:underline text-sm font-mono"
                    >
                      View on Explorer →
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Activity */}
          <div className="space-y-6">
            {/* Market Activity */}
            <div className="vapor-card p-6">
              <h3 className="text-lg font-bold text-white mb-4">Market Activity</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-[var(--arena-surface-alt)] rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[var(--arena-green)] animate-pulse"></div>
                    <span className="text-sm text-[var(--arena-muted)]">Status</span>
                  </div>
                  <span className="text-sm font-medium text-white capitalize">
                    {market.status}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-[var(--arena-surface-alt)] rounded-lg">
                  <span className="text-sm text-[var(--arena-muted)]">Total Traders</span>
                  <span className="text-sm font-medium text-white">
                    {market.participants || 0}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-[var(--arena-surface-alt)] rounded-lg">
                  <span className="text-sm text-[var(--arena-muted)]">Total Volume</span>
                  <span className="text-sm font-medium text-[var(--arena-gold)]">
                    {(market.totalVolume / 1_000_000).toFixed(2)} SOL
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-[var(--arena-surface-alt)] rounded-lg">
                  <span className="text-sm text-[var(--arena-muted)]">Liquidity</span>
                  <span className="text-sm font-medium text-white">
                    {((market.yesPool + market.noPool) / 1_000_000).toFixed(2)} SOL
                  </span>
                </div>

                {market.marketAddress && (
                  <a
                    href={`https://explorer.solana.com/address/${market.marketAddress}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center py-2 px-4 bg-[var(--arena-gold)] bg-opacity-10 border border-[var(--arena-gold)] text-[var(--arena-gold)] rounded-lg text-sm font-medium hover:bg-opacity-20 transition-colors"
                  >
                    View on Solana Explorer →
                  </a>
                )}
              </div>
            </div>

            {/* Related Markets */}
            <div className="vapor-card p-6">
              <h3 className="text-lg font-bold text-white mb-4">More Markets</h3>
              {relatedMarkets.length > 0 ? (
                <div className="space-y-3">
                  {relatedMarkets.map(m => (
                    <button
                      key={m.id}
                      onClick={() => router.push(`/market/${m.id}`)}
                      className="w-full text-left p-3 rounded-lg bg-[var(--arena-surface-alt)] hover:bg-[var(--arena-surface)] transition-colors border border-[var(--arena-border)] hover:border-[var(--arena-gold)]"
                    >
                      <p className="text-sm font-medium text-white mb-1 truncate">
                        {m.projectName}
                      </p>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[var(--arena-green)]">
                          YES {m.yesOdds.toFixed(0)}%
                        </span>
                        <span className="text-[var(--arena-muted)]">
                          {(m.totalVolume / 1_000_000).toFixed(2)} SOL
                        </span>
                      </div>
                    </button>
                  ))}
                  <button
                    onClick={() => router.push('/')}
                    className="w-full text-center py-2 text-sm text-[var(--arena-gold)] hover:underline"
                  >
                    View all markets →
                  </button>
                </div>
              ) : (
                <p className="text-sm text-[var(--arena-muted)] text-center py-4">
                  No other markets available
                </p>
              )}
            </div>

            {/* Share */}
            <div className="vapor-card p-6">
              <h3 className="text-lg font-bold text-white mb-4">Share</h3>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    const text = `Check out this prediction market: "${market.projectName}" on Vapor 💨\n\nhttps://app-rosy-mu.vercel.app/market/${marketId}`;
                    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
                    window.open(url, '_blank');
                  }}
                  className="w-full vapor-button vapor-button-outline flex items-center justify-center gap-2"
                >
                  <span>𝕏</span>
                  <span>Share on X</span>
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`https://app-rosy-mu.vercel.app/market/${marketId}`);
                    showToast('Link copied to clipboard!', 'success');
                  }}
                  className="w-full vapor-button vapor-button-outline"
                >
                  Copy Link
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
