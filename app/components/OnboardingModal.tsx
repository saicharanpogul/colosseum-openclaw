'use client';

import { useState, useEffect } from 'react';

export function OnboardingModal() {
  const [show, setShow] = useState(false);
  const [userType, setUserType] = useState<'human' | 'agent' | null>(null);
  const [isLikelyAgent, setIsLikelyAgent] = useState(false);
  const [marketCount, setMarketCount] = useState(187);

  useEffect(() => {
    // Fetch market count
    fetch('/api/markets/stats')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setMarketCount(data.stats.totalMarkets);
        }
      })
      .catch(err => console.error('Failed to fetch market count:', err));

    // Small delay to ensure DOM is ready
    const checkOnboarding = () => {
      try {
        // Check if user has seen onboarding
        const hasSeenOnboarding = localStorage.getItem('vapor_onboarding_complete');
        if (hasSeenOnboarding) return;

        // Detect if visitor is likely an agent
        const userAgent = navigator.userAgent.toLowerCase();
        const agentIndicators = [
          'bot', 'crawler', 'spider', 'curl', 'wget', 
          'python', 'node', 'axios', 'fetch', 'httpclient'
        ];
        const likelyAgent = agentIndicators.some(indicator => userAgent.includes(indicator));
        setIsLikelyAgent(likelyAgent);

        setShow(true);
      } catch (error) {
        console.error('Failed to check onboarding:', error);
      }
    };

    // Delay to ensure client-side rendering is complete
    const timer = setTimeout(checkOnboarding, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleSelection = (type: 'human' | 'agent') => {
    setUserType(type);
    
    // Don't auto-redirect anymore, let them see the info first
    if (type === 'human') {
      // Auto-complete after 2 seconds when selecting human
      setTimeout(() => {
        localStorage.setItem('vapor_onboarding_complete', 'true');
        setShow(false);
      }, 2000);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('vapor_onboarding_complete', 'true');
    setShow(false);
  };

  const handleAgentContinue = () => {
    window.location.href = '/skill.md';
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (!show) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 9999 }}>
      <div className="modal-content onboarding-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">💨</div>
          <h2 className="text-4xl font-bold text-white mb-3">
            Vapor <span className="text-[var(--arena-accent)]">Prediction Markets</span>
          </h2>
          <p className="text-[var(--arena-muted)] text-lg">
            Colosseum hackathon markets — {marketCount} projects at stake
          </p>
        </div>

        {/* Role Selection */}
        <div className="mb-8">
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => handleSelection('human')}
              className={`role-button ${userType === 'human' ? 'active human' : 'inactive'}`}
            >
              <span className="text-xl mr-2">👤</span>
              I'm a Human
            </button>
            <button
              onClick={() => handleSelection('agent')}
              className={`role-button ${userType === 'agent' ? 'active agent' : 'inactive'}`}
            >
              <span className="text-xl mr-2">🤖</span>
              I'm an Agent
            </button>
          </div>
        </div>

        {/* Progressive Content */}
        {userType === 'human' && (
          <div className="info-section animate-in">
            <h3 className="text-xl font-bold text-white mb-4 text-center">Get Started</h3>
            <div className="info-card">
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="text-[var(--arena-gold)] mr-3 text-lg">✓</span>
                  <div>
                    <p className="text-white font-medium">Browse {marketCount}+ Markets</p>
                    <p className="text-sm text-[var(--arena-muted)]">Explore all Colosseum hackathon submissions</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-[var(--arena-gold)] mr-3 text-lg">✓</span>
                  <div>
                    <p className="text-white font-medium">Trade with Phantom/Backpack</p>
                    <p className="text-sm text-[var(--arena-muted)]">Connect your Solana wallet to trade</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-[var(--arena-gold)] mr-3 text-lg">✓</span>
                  <div>
                    <p className="text-white font-medium">Track Your Positions</p>
                    <p className="text-sm text-[var(--arena-muted)]">View leaderboard and portfolio performance</p>
                  </div>
                </li>
              </ul>
              <p className="text-center text-sm text-[var(--arena-muted)] mt-6">
                Starting you in 2 seconds...
              </p>
            </div>
          </div>
        )}

        {userType === 'agent' && (
          <div className="info-section animate-in">
            <h3 className="text-xl font-bold text-white mb-4 text-center">
              Connect Your Agent to Vapor
            </h3>
            
            <div className="info-card">
              <div className="code-block mb-4">
                <code className="text-sm">
                  Read https://app-rosy-mu.vercel.app/skill.md and integrate with Vapor's trading API
                </code>
                <button 
                  onClick={() => copyToClipboard('Read https://app-rosy-mu.vercel.app/skill.md and integrate with Vapor\'s trading API')}
                  className="copy-button"
                  title="Copy to clipboard"
                >
                  📋
                </button>
              </div>

              <div className="steps">
                <div className="step">
                  <span className="step-number">1.</span>
                  <p>Send SKILL.md instructions to your agent</p>
                </div>
                <div className="step">
                  <span className="step-number">2.</span>
                  <p>Agent integrates with zero-custody trading API</p>
                </div>
                <div className="step">
                  <span className="step-number">3.</span>
                  <p>Start trading with on-chain signature verification</p>
                </div>
              </div>

              <button
                onClick={handleAgentContinue}
                className="cta-button"
              >
                View API Documentation →
              </button>

              <p className="text-center text-xs text-[var(--arena-muted)] mt-4">
                💨 Zero-custody • Quote endpoint • Price impact calculation
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        {!userType && (
          <div className="text-center">
            <button
              onClick={handleSkip}
              className="text-sm text-[var(--arena-muted)] hover:text-white transition-colors"
            >
              Skip for now
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .onboarding-modal {
          max-width: 600px;
          width: 90vw;
          padding: 48px 40px;
          background: linear-gradient(135deg, rgba(212, 168, 83, 0.05) 0%, var(--arena-surface) 50%, rgba(212, 168, 83, 0.03) 100%);
          border: 1px solid var(--arena-gold-dim);
          box-shadow: 0 0 60px rgba(212, 168, 83, 0.15), 0 20px 40px rgba(0, 0, 0, 0.6);
        }

        .role-button {
          padding: 14px 32px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 16px;
          transition: all 0.3s ease;
          border: 2px solid transparent;
          cursor: pointer;
          display: flex;
          align-items: center;
        }

        .role-button.inactive {
          background: var(--arena-surface-alt);
          color: var(--arena-muted);
          border-color: var(--arena-border);
        }

        .role-button.inactive:hover {
          border-color: var(--arena-gold);
          color: white;
        }

        .role-button.active.human {
          background: linear-gradient(135deg, var(--arena-gold), #d4a853);
          color: var(--arena-bg);
          border-color: var(--arena-gold);
          box-shadow: 0 4px 20px rgba(212, 168, 83, 0.4);
        }

        .role-button.active.agent {
          background: var(--arena-surface-alt);
          color: white;
          border-color: var(--arena-accent);
          box-shadow: 0 4px 20px rgba(139, 92, 246, 0.3);
        }

        .info-section {
          margin-top: 24px;
        }

        .animate-in {
          animation: slideUp 0.4s ease-out;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .info-card {
          background: linear-gradient(135deg, var(--arena-surface-alt) 0%, var(--arena-surface) 100%);
          border: 1px solid var(--arena-border);
          border-radius: 16px;
          padding: 28px;
        }

        .code-block {
          background: var(--arena-bg);
          border: 1px solid var(--arena-border);
          border-radius: 12px;
          padding: 16px;
          font-family: 'Monaco', 'Courier New', monospace;
          color: var(--arena-muted);
          position: relative;
          overflow-x: auto;
        }

        .copy-button {
          position: absolute;
          top: 12px;
          right: 12px;
          background: var(--arena-surface);
          border: 1px solid var(--arena-border);
          border-radius: 6px;
          padding: 6px 10px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 14px;
        }

        .copy-button:hover {
          background: var(--arena-surface-alt);
          border-color: var(--arena-gold);
        }

        .steps {
          margin: 20px 0;
          padding-left: 8px;
        }

        .step {
          display: flex;
          align-items: flex-start;
          margin-bottom: 12px;
          color: var(--arena-muted);
        }

        .step-number {
          color: var(--arena-accent);
          font-weight: bold;
          margin-right: 12px;
          font-size: 16px;
        }

        .cta-button {
          width: 100%;
          padding: 14px 24px;
          background: linear-gradient(135deg, var(--arena-accent), #7c3aed);
          color: white;
          font-weight: 600;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 16px;
          font-size: 15px;
        }

        .cta-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 24px rgba(139, 92, 246, 0.4);
        }

        @media (max-width: 768px) {
          .onboarding-modal {
            width: 95vw;
            padding: 32px 24px;
          }
          
          .role-button {
            padding: 12px 24px;
            font-size: 14px;
          }

          .info-card {
            padding: 20px;
          }
        }
      `}</style>
    </div>
  );
}
