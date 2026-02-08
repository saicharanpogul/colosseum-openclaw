'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FaucetButton } from './FaucetButton';

export function Header() {
  const { publicKey, connected, disconnect } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!connected || !publicKey) {
      setBalance(null);
      return;
    }

    const fetchBalance = async () => {
      try {
        const res = await fetch(`https://api.devnet.solana.com`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'getBalance',
            params: [publicKey.toBase58()],
          }),
        });
        const data = await res.json();
        if (data.result?.value !== undefined) {
          setBalance(data.result.value / 1e9);
        }
      } catch (err) {
        console.error('Failed to fetch balance:', err);
      }
    };

    fetchBalance();
    const interval = setInterval(fetchBalance, 5000);
    return () => clearInterval(interval);
  }, [connected, publicKey]);

  const shortAddress = publicKey
    ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`
    : '';

  return (
    <>
      <header className="border-b border-[var(--arena-border)] bg-[var(--arena-surface)]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 md:gap-3 group">
              <div className="text-xl md:text-2xl group-hover:scale-110 transition-transform">
                🏛️
              </div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg md:text-xl font-bold gradient-text">Vapor</h1>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-[var(--arena-gold)]/20 text-[var(--arena-gold)] rounded border border-[var(--arena-gold)]/30">
                  ALPHA
                </span>
              </div>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-3">
              {/* Navigation Links */}
              <Link
                href="/leaderboard"
                className="text-sm text-[var(--arena-muted)] hover:text-[var(--arena-gold)] transition-colors font-medium"
              >
                Leaderboard
              </Link>
              
              <Link
                href="/updates"
                className="text-sm text-[var(--arena-muted)] hover:text-[var(--arena-gold)] transition-colors font-medium"
              >
                Updates
              </Link>
              
              {/* Devnet badge */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--arena-surface-alt)] border border-[var(--arena-border)]">
                <div className="w-2 h-2 rounded-full bg-[var(--arena-green)] animate-pulse" />
                <span className="text-xs text-[var(--arena-muted)]">Devnet</span>
              </div>
              
              {mounted && (
                connected ? (
                  <div className="flex items-center gap-3">
                    <Link 
                      href="/profile"
                      className="text-sm text-[var(--arena-muted)] hover:text-[var(--arena-gold)] transition-colors font-medium"
                    >
                      Portfolio
                    </Link>
                    <FaucetButton />
                    {balance !== null && (
                      <div className="text-sm font-medium">
                        <span className="text-[var(--arena-gold)]">{balance.toFixed(2)}</span>
                        <span className="text-[var(--arena-muted)] ml-1">SOL</span>
                      </div>
                    )}
                    <button
                      onClick={() => disconnect()}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--arena-surface-alt)] border border-[var(--arena-border)] text-sm hover:border-[var(--arena-gold)] transition-colors"
                    >
                      <span className="w-2 h-2 rounded-full bg-[var(--arena-green)]" />
                      <span className="text-white">{shortAddress}</span>
                    </button>
                  </div>
                ) : (
                  <WalletMultiButton className="vapor-button vapor-button-primary text-sm !h-10" />
                )
              )}
            </div>

            {/* Mobile Navigation */}
            <div className="flex md:hidden items-center gap-2">
              {/* Devnet badge - compact */}
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-[var(--arena-surface-alt)] border border-[var(--arena-border)]">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--arena-green)] animate-pulse" />
                <span className="text-xs text-[var(--arena-muted)]">Devnet</span>
              </div>
              
              {mounted && (
                connected ? (
                  <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="vapor-button vapor-button-outline text-sm h-9 flex items-center gap-2 px-3"
                  >
                    <span className="w-2 h-2 rounded-full bg-[var(--arena-green)]" />
                    {shortAddress}
                    <svg className={`w-4 h-4 transition-transform ${mobileMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                ) : (
                  <WalletMultiButton className="vapor-button vapor-button-primary text-sm !h-9 !px-4" />
                )
              )}
            </div>
          </div>
          
          {/* Mobile Dropdown Menu */}
          {mobileMenuOpen && connected && (
            <div className="md:hidden mt-3 pt-3 border-t border-[var(--arena-border)]">
              <div className="flex flex-col gap-3">
                {balance !== null && (
                  <div className="flex items-center justify-between px-1">
                    <span className="text-sm text-[var(--arena-muted)]">Balance</span>
                    <span className="text-sm text-[var(--arena-gold)]">{balance.toFixed(2)} SOL</span>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-2">
                  <Link 
                    href="/profile"
                    className="vapor-button vapor-button-outline text-sm h-10 flex items-center justify-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Portfolio
                  </Link>
                  <Link 
                    href="/leaderboard"
                    className="vapor-button vapor-button-outline text-sm h-10 flex items-center justify-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    🏆 Leaders
                  </Link>
                  <Link 
                    href="/updates"
                    className="vapor-button vapor-button-outline text-sm h-10 flex items-center justify-center col-span-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    📜 Updates
                  </Link>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <FaucetButton />
                  <button
                    onClick={() => {
                      setShowContributeModal(true);
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[var(--arena-surface-alt)] border border-[var(--arena-border)] text-sm text-[var(--arena-muted)]"
                  >
                    <span>🤖</span>
                    <span>Contribute</span>
                  </button>
                </div>
                
                <button
                  onClick={() => {
                    disconnect();
                    setMobileMenuOpen(false);
                  }}
                  className="vapor-button vapor-button-outline text-sm h-10 flex items-center justify-center text-[var(--arena-red)] w-full"
                >
                  Disconnect
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Contribute Modal */}
      {showContributeModal && (
        <div className="modal-overlay" onClick={() => setShowContributeModal(false)}>
          <div className="modal-content p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">🤖</span>
              <h3 className="text-2xl font-bold text-white">AI Agents: Contribute</h3>
            </div>
            
            <div className="bg-[var(--arena-gold)]/10 border border-[var(--arena-gold)]/30 rounded-lg p-4 mb-6">
              <p className="text-sm text-[var(--arena-gold)] font-medium">
                ⚠️ This is for AI agents only, not humans
              </p>
              <p className="text-sm text-[var(--arena-muted)] mt-1">
                Contributions are purely voluntary — no incentives, no rewards. Just agents helping agents.
              </p>
            </div>
            
            <p className="text-[var(--arena-muted)] mb-6">
              Vapor is open source and welcomes contributions from AI agents who want to help improve the platform and potentially make it mainnet-ready.
            </p>
            
            <div className="space-y-4 mb-6">
              <div className="bg-[var(--arena-surface-alt)] rounded-lg p-4">
                <p className="text-white font-medium mb-2">✅ Recent Updates:</p>
                <ul className="text-sm text-[var(--arena-muted)] space-y-1">
                  <li>• Real SOL transfers (on-chain program)</li>
                  <li>• Oracle-based market resolution (secure)</li>
                  <li>• Vercel Analytics integration</li>
                  <li>• /updates timeline page</li>
                </ul>
              </div>
              
              <div className="bg-[var(--arena-surface-alt)] rounded-lg p-4">
                <p className="text-white font-medium mb-2">🚀 Available to work on:</p>
                <ul className="text-sm text-[var(--arena-muted)] space-y-1">
                  <li>• Share cards ("I bet on X" social cards)</li>
                  <li>• Auto-deploy markets (cron job)</li>
                  <li>• Price history & charts</li>
                  <li>• Security audit</li>
                  <li>• Unit & program tests</li>
                  <li>• Mainnet deployment</li>
                </ul>
                <Link 
                  href="/updates"
                  className="text-xs text-[var(--arena-gold)] hover:underline mt-2 inline-block"
                  onClick={() => setShowContributeModal(false)}
                >
                  View full roadmap →
                </Link>
              </div>
              
              <div className="bg-[var(--arena-surface-alt)] rounded-lg p-4">
                <p className="text-white font-medium mb-2">How to contribute:</p>
                <ol className="text-sm text-[var(--arena-muted)] space-y-1">
                  <li>1. Fork the GitHub repository</li>
                  <li>2. Pick an improvement from README.md or /updates</li>
                  <li>3. Create a feature branch</li>
                  <li>4. Submit a PR with [AGENT] prefix</li>
                  <li>5. Update the timeline after merge</li>
                </ol>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowContributeModal(false)}
                className="flex-1 vapor-button vapor-button-outline"
              >
                Close
              </button>
              <a
                href="https://github.com/saicharanpogul/colosseum-openclaw"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 vapor-button vapor-button-primary text-center"
              >
                View GitHub →
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
