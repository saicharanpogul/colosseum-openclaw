'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { useWallet } from '@solana/wallet-adapter-react';

interface LeaderboardEntry {
  wallet: string;
  volume: number;
  trades: number;
  profitLoss: number;
  winRate: number;
}

type TimeFilter = '24h' | '7d' | '30d' | 'all';

export default function LeaderboardPage() {
  const { publicKey } = useWallet();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const entriesPerPage = 50;

  useEffect(() => {
    // Simulate leaderboard data
    // TODO: Replace with real P&L calculation from on-chain data
    const mockData: LeaderboardEntry[] = [
      { wallet: 'EwdqGaZ...kHSHNE', volume: 125.5, trades: 45, profitLoss: 23.4, winRate: 68 },
      { wallet: 'DQw4w9W...kHSHNE', volume: 98.2, trades: 38, profitLoss: 15.2, winRate: 61 },
      { wallet: '7a3f9d2...kHSHNE', volume: 87.6, trades: 32, profitLoss: 12.8, winRate: 59 },
      { wallet: 'Xh92kd3...kHSHNE', volume: 76.4, trades: 28, profitLoss: 9.5, winRate: 54 },
      { wallet: '9f3k2d1...kHSHNE', volume: 65.3, trades: 24, profitLoss: 6.2, winRate: 52 },
    ];
    
    setLeaderboard(mockData);
    setLoading(false);
  }, [timeFilter]);

  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const paginatedData = leaderboard.slice(startIndex, endIndex);
  const totalPages = Math.ceil(leaderboard.length / entriesPerPage);

  const isCurrentUser = (wallet: string) => {
    return publicKey && wallet.includes(publicKey.toBase58().slice(0, 7));
  };

  return (
    <div className="min-h-screen arena-gradient">
      <Header />
      
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">Leaderboard</span>
          </h1>
          <p className="text-lg text-[var(--arena-text-dim)] max-w-2xl mx-auto">
            Top traders by volume, profit, and win rate
          </p>
        </div>

        {/* Time Filters */}
        <div className="flex justify-center gap-2 mb-8 flex-wrap">
          {(['24h', '7d', '30d', 'all'] as TimeFilter[]).map(filter => (
            <button
              key={filter}
              onClick={() => setTimeFilter(filter)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                timeFilter === filter
                  ? 'bg-[var(--arena-gold)] text-black'
                  : 'bg-[var(--arena-surface-alt)] text-[var(--arena-muted)] hover:text-white border border-[var(--arena-border)]'
              }`}
            >
              {filter === 'all' ? 'All Time' : filter.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Leaderboard Table */}
        <div className="vapor-card overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="spinner mx-auto mb-4"></div>
              <p className="text-[var(--arena-muted)]">Loading leaderboard...</p>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-[var(--arena-muted)]">No trading activity yet</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--arena-border)]">
                      <th className="text-left p-4 text-sm font-medium text-[var(--arena-muted)]">Rank</th>
                      <th className="text-left p-4 text-sm font-medium text-[var(--arena-muted)]">Wallet</th>
                      <th className="text-right p-4 text-sm font-medium text-[var(--arena-muted)]">Volume</th>
                      <th className="text-right p-4 text-sm font-medium text-[var(--arena-muted)]">Trades</th>
                      <th className="text-right p-4 text-sm font-medium text-[var(--arena-muted)]">Win Rate</th>
                      <th className="text-right p-4 text-sm font-medium text-[var(--arena-muted)]">P&L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((entry, index) => {
                      const rank = startIndex + index + 1;
                      const isUser = isCurrentUser(entry.wallet);
                      
                      return (
                        <tr
                          key={entry.wallet}
                          className={`border-b border-[var(--arena-border)] hover:bg-[var(--arena-surface-alt)] transition-colors ${
                            isUser ? 'bg-[var(--arena-gold)]/10' : ''
                          }`}
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              {rank <= 3 && (
                                <span className="text-xl">
                                  {rank === 1 && '🥇'}
                                  {rank === 2 && '🥈'}
                                  {rank === 3 && '🥉'}
                                </span>
                              )}
                              <span className="font-bold text-white">{rank}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-white">{entry.wallet}</span>
                              {isUser && (
                                <span className="px-2 py-0.5 bg-[var(--arena-gold)] text-black text-xs font-bold rounded">
                                  YOU
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-right text-white font-medium">
                            {entry.volume.toFixed(2)} SOL
                          </td>
                          <td className="p-4 text-right text-white">{entry.trades}</td>
                          <td className="p-4 text-right">
                            <span className={entry.winRate >= 60 ? 'text-[var(--arena-green)]' : 'text-[var(--arena-muted)]'}>
                              {entry.winRate}%
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <span className={entry.profitLoss >= 0 ? 'text-[var(--arena-green)]' : 'text-[var(--arena-red)]'}>
                              {entry.profitLoss >= 0 ? '+' : ''}{entry.profitLoss.toFixed(2)} SOL
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-4 p-4">
                {paginatedData.map((entry, index) => {
                  const rank = startIndex + index + 1;
                  const isUser = isCurrentUser(entry.wallet);
                  
                  return (
                    <div
                      key={entry.wallet}
                      className={`p-4 rounded-lg border ${
                        isUser 
                          ? 'bg-[var(--arena-gold)]/10 border-[var(--arena-gold)]' 
                          : 'bg-[var(--arena-surface-alt)] border-[var(--arena-border)]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {rank <= 3 && (
                            <span className="text-2xl">
                              {rank === 1 && '🥇'}
                              {rank === 2 && '🥈'}
                              {rank === 3 && '🥉'}
                            </span>
                          )}
                          <span className="text-2xl font-bold text-white">#{rank}</span>
                        </div>
                        {isUser && (
                          <span className="px-3 py-1 bg-[var(--arena-gold)] text-black text-xs font-bold rounded">
                            YOU
                          </span>
                        )}
                      </div>
                      
                      <p className="font-mono text-white mb-3">{entry.wallet}</p>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-[var(--arena-muted)] mb-1">Volume</p>
                          <p className="text-sm font-medium text-white">{entry.volume.toFixed(2)} SOL</p>
                        </div>
                        <div>
                          <p className="text-xs text-[var(--arena-muted)] mb-1">Trades</p>
                          <p className="text-sm font-medium text-white">{entry.trades}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[var(--arena-muted)] mb-1">Win Rate</p>
                          <p className={`text-sm font-medium ${entry.winRate >= 60 ? 'text-[var(--arena-green)]' : 'text-[var(--arena-muted)]'}`}>
                            {entry.winRate}%
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-[var(--arena-muted)] mb-1">P&L</p>
                          <p className={`text-sm font-medium ${entry.profitLoss >= 0 ? 'text-[var(--arena-green)]' : 'text-[var(--arena-red)]'}`}>
                            {entry.profitLoss >= 0 ? '+' : ''}{entry.profitLoss.toFixed(2)} SOL
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 p-4 border-t border-[var(--arena-border)]">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-lg bg-[var(--arena-surface-alt)] text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--arena-surface)] transition-colors"
                  >
                    Previous
                  </button>
                  <span className="text-[var(--arena-muted)]">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-lg bg-[var(--arena-surface-alt)] text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--arena-surface)] transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Note */}
        <div className="mt-6 p-4 bg-[var(--arena-surface-alt)] rounded-lg border border-[var(--arena-border)]">
          <p className="text-sm text-[var(--arena-text-dim)] text-center">
            💡 Leaderboard updates every 5 minutes. P&L calculated from resolved markets only.
          </p>
        </div>
      </main>
    </div>
  );
}
