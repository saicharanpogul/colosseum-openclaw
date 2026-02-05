'use client';

export function Header() {
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
            <button className="vapor-button vapor-button-outline text-sm">
              Connect Wallet
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
