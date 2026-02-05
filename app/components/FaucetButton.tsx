'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

export function FaucetButton() {
  const { publicKey, connected } = useWallet();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const requestAirdrop = async () => {
    if (!connected || !publicKey) {
      setStatus('error');
      setMessage('Connect wallet first');
      return;
    }

    setLoading(true);
    setStatus('idle');
    setMessage('');

    try {
      // Try multiple faucet methods
      const address = publicKey.toBase58();
      
      // Method 1: Direct RPC airdrop
      const rpcResponse = await fetch('https://api.devnet.solana.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'requestAirdrop',
          params: [address, 1000000000], // 1 SOL
        }),
      });

      const rpcData = await rpcResponse.json();
      
      if (rpcData.result) {
        setStatus('success');
        setMessage('1 SOL airdropped! Refresh in a few seconds.');
        return;
      }

      // If RPC failed, show web faucet option
      if (rpcData.error) {
        // Open web faucet in new tab as fallback
        window.open(`https://faucet.solana.com/?address=${address}`, '_blank');
        setStatus('success');
        setMessage('Opened Solana Faucet - request SOL there!');
        return;
      }

      setStatus('error');
      setMessage('Faucet rate limited. Try web faucet.');
    } catch (err: any) {
      console.error('Airdrop failed:', err);
      // Fallback to web faucet
      const address = publicKey.toBase58();
      window.open(`https://faucet.solana.com/?address=${address}`, '_blank');
      setStatus('success');
      setMessage('Opened Solana Faucet in new tab');
    } finally {
      setLoading(false);
    }
  };

  if (!connected) return null;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={requestAirdrop}
        disabled={loading}
        className="vapor-button text-xs bg-[var(--vapor-accent)]/20 text-[var(--vapor-accent)] hover:bg-[var(--vapor-accent)]/30 disabled:opacity-50 px-3 py-1.5"
      >
        {loading ? '⏳' : '💧'} Get Devnet SOL
      </button>
      {status === 'success' && (
        <span className="text-xs text-[var(--vapor-green)]">{message}</span>
      )}
      {status === 'error' && (
        <span className="text-xs text-[var(--vapor-red)]">{message}</span>
      )}
    </div>
  );
}
