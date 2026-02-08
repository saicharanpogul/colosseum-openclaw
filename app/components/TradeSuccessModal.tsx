'use client';

import { ShareButton } from './ShareButton';

interface TradeSuccessModalProps {
  show: boolean;
  onClose: () => void;
  projectName: string;
  projectId: number;
  side: 'yes' | 'no';
  shares: number;
  odds: number;
  value: number;
  txSignature: string;
  wallet?: string;
}

export function TradeSuccessModal({
  show,
  onClose,
  projectName,
  projectId,
  side,
  shares,
  odds,
  value,
  txSignature,
  wallet,
}: TradeSuccessModalProps) {
  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
        {/* Success Header */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">✓</div>
          <h3 className="text-2xl font-bold text-white mb-2">Trade Successful!</h3>
          <p className="text-[var(--arena-text-dim)]">
            Your position has been recorded on-chain
          </p>
        </div>

        {/* Trade Summary */}
        <div className="bg-[var(--arena-surface-alt)] rounded-lg p-4 mb-6">
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <p className="text-xs text-[var(--arena-muted)] mb-1">Project</p>
              <p className="text-sm font-medium text-white">{projectName}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--arena-muted)] mb-1">Side</p>
              <p
                className={`text-sm font-medium ${
                  side === 'yes' ? 'text-[var(--arena-green)]' : 'text-[var(--arena-red)]'
                }`}
              >
                {side.toUpperCase()}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-[var(--arena-muted)] mb-1">Shares</p>
              <p className="text-sm font-medium text-white">{shares.toFixed(4)}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--arena-muted)] mb-1">Odds</p>
              <p className="text-sm font-medium text-[var(--arena-gold)]">{odds}%</p>
            </div>
            <div>
              <p className="text-xs text-[var(--arena-muted)] mb-1">Value</p>
              <p className="text-sm font-medium text-[var(--arena-gold)]">{value.toFixed(4)} SOL</p>
            </div>
          </div>
        </div>

        {/* Transaction Link */}
        <div className="mb-6 p-3 rounded-lg bg-[var(--arena-green)]/10 border border-[var(--arena-green)]/30">
          <a
            href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[var(--arena-green)] hover:underline flex items-center justify-center gap-2"
          >
            View on Solana Explorer
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        </div>

        {/* Share Buttons */}
        <div className="mb-6">
          <ShareButton
            projectName={projectName}
            projectId={projectId}
            side={side}
            shares={shares}
            odds={odds}
            value={value}
            wallet={wallet}
          />
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full vapor-button vapor-button-primary"
        >
          Close
        </button>
      </div>
    </div>
  );
}
