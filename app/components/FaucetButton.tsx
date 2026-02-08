'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

export function FaucetButton() {
  const { publicKey, connected } = useWallet();
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const requestAirdrop = async () => {
    if (!connected || !publicKey) return;

    setLoading(true);

    try {
      const address = publicKey.toBase58();
      
      // Try RPC airdrop first
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
        setShowModal(true);
        return;
      }

      // Fallback to web faucet
      window.open(`https://faucet.solana.com/?address=${address}`, '_blank');
      setShowModal(true);
    } catch (err) {
      const address = publicKey.toBase58();
      window.open(`https://faucet.solana.com/?address=${address}`, '_blank');
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  if (!connected) return null;

  return (
    <>
      <button
        onClick={requestAirdrop}
        disabled={loading}
        className="text-sm text-[var(--arena-muted)] hover:text-[var(--arena-gold)] transition-colors font-medium disabled:opacity-50"
        title="Get Devnet SOL"
      >
        {loading ? '⏳' : '💧'} Faucet
      </button>

      {/* Success Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="vapor-card p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <div className="text-center">
              <div className="text-4xl mb-3">💧</div>
              <h3 className="text-xl font-bold text-white mb-2">Faucet Opened!</h3>
              <p className="text-sm text-[var(--arena-muted)] mb-4">
                Request devnet SOL from the Solana faucet. Check your balance in a few seconds.
              </p>
              <button
                onClick={() => setShowModal(false)}
                className="vapor-button vapor-button-primary w-full"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
