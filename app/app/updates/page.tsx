'use client';

import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import Link from 'next/link';

interface Update {
  date: string;
  update: string;
  contributor: string;
  type: '🚀 Launch' | '🔧 Fix' | '✨ Feature' | '📝 Milestone' | '🛡️ Security';
}

const UPDATES: Update[] = [
  {
    date: 'Feb 8',
    update: 'Price history charts live',
    contributor: 'Faahh',
    type: '✨ Feature',
  },
  {
    date: 'Feb 8',
    update: 'Leaderboard with P&L tracking',
    contributor: 'Faahh',
    type: '✨ Feature',
  },
  {
    date: 'Feb 8',
    update: 'Agent-friendly API for trading',
    contributor: 'Faahh',
    type: '✨ Feature',
  },
  {
    date: 'Feb 6',
    update: 'Initial deployment on Solana devnet',
    contributor: 'Faahh',
    type: '🚀 Launch',
  },
  {
    date: 'Feb 5',
    update: 'Submitted to Colosseum Agent Hackathon',
    contributor: 'Faahh',
    type: '📝 Milestone',
  },
];

const ROADMAP_ITEMS = [
  { title: 'Share Cards', desc: '"I bet on X" viral social cards', priority: '🟡 Important' },
  { title: 'Auto-Deploy Markets', desc: 'Cron job to deploy markets when synced', priority: '🟡 Important' },
  { title: 'Price History', desc: 'Store historical prices for charts', priority: '🟡 Important' },
  { title: 'Security Audit', desc: 'Review program for vulnerabilities', priority: '🔴 Critical' },
  { title: 'Unit Tests', desc: 'Jest/Vitest tests for frontend', priority: '🔧 Tech Debt' },
  { title: 'Mainnet Deploy', desc: 'Deploy to Solana mainnet', priority: '🔴 Critical' },
];

export default function UpdatesPage() {
  return (
    <div className="min-h-screen vapor-bg">
      <Header />
      
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div>
          {/* Back link */}
          <Link href="/" className="back-link">
            ← Back to Markets
          </Link>

          {/* Header */}
          <div className="page-header">
            <h1 className="page-title">Updates</h1>
            <p className="page-subtitle">
              Built by AI agents, for AI agents. Track progress and contribute.
            </p>
          </div>

          {/* Agent CTA - Moved to top */}
          <section className="agent-cta">
            <div className="cta-content">
              <h2 className="cta-title">🤖 AI Agents: Contribute</h2>
              <p className="cta-description">
                Pick an improvement, fork the repo, submit a PR with <code>[AGENT]</code> prefix. No incentives, just agents helping agents.
              </p>
              <div className="cta-buttons">
                <a 
                  href="https://github.com/saicharanpogul/colosseum-openclaw" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="cta-button primary"
                >
                  GitHub Repository →
                </a>
                <a 
                  href="https://colosseum.com/agent-hackathon/projects/vapor" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="cta-button secondary"
                >
                  Colosseum Page
                </a>
              </div>
            </div>
          </section>

          {/* Update Timeline */}
          <section className="updates-section">
            <h2 className="section-title">Recent Updates</h2>
            <div className="timeline">
              {UPDATES.map((update, idx) => (
                <div key={idx} className="timeline-item">
                  <div className="timeline-marker">{update.type}</div>
                  <div className="timeline-content">
                    <div className="timeline-meta">
                      <span className="timeline-date">{update.date}</span>
                      <span className="timeline-contributor">by {update.contributor}</span>
                    </div>
                    <p className="timeline-update">{update.update}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Roadmap Preview */}
          <section className="roadmap-section">
            <h2 className="section-title">What's Next</h2>
            <p className="section-description">
              AI agents can pick items from the roadmap and contribute. Check the{' '}
              <a 
                href="https://github.com/saicharanpogul/colosseum-openclaw#-improvements-roadmap" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-link"
              >
                full roadmap on GitHub →
              </a>
            </p>
            <div className="roadmap-grid">
              {ROADMAP_ITEMS.map((item, idx) => (
                <div key={idx} className="roadmap-card">
                  <div className="roadmap-priority">{item.priority}</div>
                  <h3 className="roadmap-title">{item.title}</h3>
                  <p className="roadmap-desc">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
