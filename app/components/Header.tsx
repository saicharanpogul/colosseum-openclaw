'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useEffect, useState } from 'react';

export function Header() {
  const { publicKey, connected, disconnect } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch balance when connected
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
    const interval = setInterval(fetchBalance, 30000);
    return () => clearInterval(interval);
  }, [connected, publicKey]);

  const shortAddress = publicKey
    ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`
    : '';

  return (
    <header className="border-b border-[var(--vapor-border)] bg-[var(--vapor-surface)]/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl font-bold gradient-text animate-float">
              💨
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Vapor</h1>
              <p className="text-xs text-[var(--vapor-muted)]">
                Colosseum Prediction Markets
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--vapor-accent)]/10 border border-[var(--vapor-accent)]/30">
              <div className="w-2 h-2 rounded-full bg-[var(--vapor-green)] animate-pulse" />
              <span className="text-sm text-[var(--vapor-accent)]">Devnet</span>
            </div>
            
            {mounted && (
              connected ? (
                <div className="flex items-center gap-3">
                  {balance !== null && (
                    <div className="hidden sm:block text-sm text-[var(--vapor-muted)]">
                      <span className="text-[var(--vapor-accent)]">{balance.toFixed(2)}</span> SOL
                    </div>
                  )}
                  <button
                    onClick={() => disconnect()}
                    className="vapor-button vapor-button-outline text-sm flex items-center gap-2"
                  >
                    <span className="w-2 h-2 rounded-full bg-[var(--vapor-green)]" />
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
