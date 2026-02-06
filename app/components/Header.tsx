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
    const interval = setInterval(fetchBalance, 5000); // Update every 5 seconds for real-time feel
    return () => clearInterval(interval);
  }, [connected, publicKey]);

  const shortAddress = publicKey
    ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`
    : '';

  return (
    <header className="border-b border-[var(--arena-border)] bg-[var(--arena-surface)]/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="text-2xl group-hover:scale-110 transition-transform">
              🏛️
            </div>
            <div>
              <h1 className="text-xl font-bold gradient-text">Vapor</h1>
              <p className="text-xs text-[var(--arena-muted)]">
                Colosseum Prediction Markets
              </p>
            </div>
          </Link>
          
          {/* Right side */}
          <div className="flex items-center gap-4">
            {/* Devnet badge */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--arena-surface-alt)] border border-[var(--arena-border)]">
              <div className="w-2 h-2 rounded-full bg-[var(--arena-green)] animate-pulse" />
              <span className="text-sm text-[var(--arena-muted)]">Devnet</span>
            </div>
            
            {mounted && (
              connected ? (
                <div className="flex items-center gap-3">
                  <Link 
                    href="/profile"
                    className="vapor-button vapor-button-outline text-sm"
                  >
                    Portfolio
                  </Link>
                  <FaucetButton />
                  {balance !== null && (
                    <div className="hidden sm:block text-sm text-[var(--arena-muted)]">
                      <span className="text-[var(--arena-gold)]">{balance.toFixed(2)}</span> SOL
                    </div>
                  )}
                  <button
                    onClick={() => disconnect()}
                    className="vapor-button vapor-button-outline text-sm flex items-center gap-2"
                  >
                    <span className="w-2 h-2 rounded-full bg-[var(--arena-green)]" />
                    {shortAddress}
                  </button>
                </div>
              ) : (
                <WalletMultiButton className="vapor-button vapor-button-primary text-sm" />
              )
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
