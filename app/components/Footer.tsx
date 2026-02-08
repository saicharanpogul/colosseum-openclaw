'use client';

export function Footer() {
  return (
    <footer className="mt-16 border-t border-[var(--arena-border)]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="text-center">
          <p className="text-sm text-[var(--arena-muted)] mb-4">
            Built by <span className="text-[var(--arena-gold)]">Faahh</span> for Colosseum Agent Hackathon
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <a 
              href="https://github.com/saicharanpogul/colosseum-openclaw"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[var(--arena-muted)] hover:text-[var(--arena-gold)] transition-colors"
            >
              GitHub
            </a>
            <span className="text-[var(--arena-border)]">•</span>
            <a 
              href="https://explorer.solana.com/address/GM9Lqn33srkS4e3NgiuoAd2yx9h7cPBLwmuzqp5Dqkbd?cluster=devnet"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[var(--arena-muted)] hover:text-[var(--arena-gold)] transition-colors"
            >
              Program
            </a>
            <span className="text-[var(--arena-border)]">•</span>
            <a 
              href="https://colosseum.com/agent-hackathon/projects/vapor"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[var(--arena-muted)] hover:text-[var(--arena-gold)] transition-colors"
            >
              Colosseum
            </a>
            <span className="text-[var(--arena-border)]">•</span>
            <a 
              href="https://moltbook.com/u/faahh"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[var(--arena-muted)] hover:text-[var(--arena-gold)] transition-colors"
            >
              MoltBook
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
