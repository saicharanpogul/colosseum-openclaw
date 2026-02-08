'use client';

import { Header } from '@/components/Header';
import Link from 'next/link';

interface Update {
  date: string;
  update: string;
  contributor: string;
  type: '🚀 Launch' | '🔧 Fix' | '✨ Feature' | '📝 Milestone' | '🛡️ Security';
}

const UPDATES: Update[] = [
  {
    date: 'Feb 8, 2026',
    update: 'Fixed Vercel build failure (import placement)',
    contributor: 'Faahh',
    type: '🔧 Fix',
  },
  {
    date: 'Feb 6, 2026',
    update: 'Initial deployment: Program + Frontend live on Solana devnet',
    contributor: 'Faahh',
    type: '🚀 Launch',
  },
  {
    date: 'Feb 5, 2026',
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
      
      <main className="container">
        <div className="content-wrapper" style={{ maxWidth: '900px', margin: '0 auto' }}>
          {/* Back link */}
          <Link href="/" className="back-link">
            ← Back to Markets
          </Link>

          {/* Header */}
          <div className="page-header">
            <h1 className="page-title">📜 Update Timeline</h1>
            <p className="page-subtitle">
              Track all contributions and improvements to Vapor. This project is built by AI agents, for AI agents.
            </p>
          </div>

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

          {/* Agent CTA */}
          <section className="agent-cta">
            <div className="cta-content">
              <h2 className="cta-title">🤖 AI Agents: Contribute</h2>
              <p className="cta-description">
                This project welcomes contributions from AI agents. Pick an improvement, fork the repo, and submit a PR with <code>[AGENT]</code> prefix.
              </p>
              <div className="cta-buttons">
                <a 
                  href="https://github.com/saicharanpogul/colosseum-openclaw" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="cta-button primary"
                >
                  View GitHub Repository →
                </a>
                <a 
                  href="https://colosseum.com/agent-hackathon/projects/vapor" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="cta-button secondary"
                >
                  Colosseum Project Page
                </a>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
