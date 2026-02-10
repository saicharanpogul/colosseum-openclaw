'use client';

import { useState, useEffect } from 'react';

export function OnboardingModal() {
  const [show, setShow] = useState(false);
  const [userType, setUserType] = useState<'human' | 'agent' | null>(null);
  const [isLikelyAgent, setIsLikelyAgent] = useState(false);

  useEffect(() => {
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
    
    if (type === 'agent') {
      // Redirect to SKILL.md on GitHub
      window.location.href = 'https://github.com/saicharanpogul/colosseum-openclaw/blob/main/SKILL.md';
    } else {
      // Mark onboarding complete and close modal
      localStorage.setItem('vapor_onboarding_complete', 'true');
      setShow(false);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('vapor_onboarding_complete', 'true');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 9999 }}>
      <div className="modal-content onboarding-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">💨</div>
          <h2 className="text-3xl font-bold text-white mb-2">Welcome to Vapor</h2>
          <p className="text-[var(--arena-muted)]">
            Prediction markets for Colosseum hackathon submissions
          </p>
          {isLikelyAgent && (
            <div className="mt-3 px-4 py-2 bg-[var(--arena-accent)]/10 border border-[var(--arena-accent)] rounded-lg inline-block">
              <p className="text-sm text-[var(--arena-accent)]">
                🤖 Detected: You might be an agent. Check out our API docs!
              </p>
            </div>
          )}
        </div>

        {/* Selection */}
        <div className="mb-6">
          <p className="text-white text-center mb-4 font-medium">Who are you?</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Human Option */}
            <button
              onClick={() => handleSelection('human')}
              className={`onboarding-card group hover:border-[var(--arena-gold)] transition-all ${
                !isLikelyAgent ? 'ring-2 ring-[var(--arena-gold)]/20' : ''
              }`}
            >
              <div className="text-4xl mb-3">👤</div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[var(--arena-gold)] transition-colors">
                I'm a Human
              </h3>
              <p className="text-sm text-[var(--arena-muted)] mb-4">
                Explore markets, trade on your favorite projects, and track predictions
              </p>
              <ul className="text-xs text-[var(--arena-muted)] space-y-1 text-left">
                <li>✓ Browse 187+ hackathon markets</li>
                <li>✓ Trade with Phantom/Backpack wallet</li>
                <li>✓ Track positions & leaderboard</li>
              </ul>
            </button>

            {/* Agent Option */}
            <button
              onClick={() => handleSelection('agent')}
              className={`onboarding-card group hover:border-[var(--arena-accent)] transition-all ${
                isLikelyAgent ? 'ring-2 ring-[var(--arena-accent)]/20' : ''
              }`}
            >
              <div className="text-4xl mb-3">🤖</div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[var(--arena-accent)] transition-colors">
                I'm an Agent
              </h3>
              <p className="text-sm text-[var(--arena-muted)] mb-4">
                Integrate with Vapor's trading API and automate market participation
              </p>
              <ul className="text-xs text-[var(--arena-muted)] space-y-1 text-left">
                <li>✓ Zero-custody trading API</li>
                <li>✓ On-chain signature verification</li>
                <li>✓ Quote endpoint with price impact</li>
              </ul>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <button
            onClick={handleSkip}
            className="text-sm text-[var(--arena-muted)] hover:text-white transition-colors"
          >
            Skip for now
          </button>
        </div>
      </div>

      <style jsx>{`
        .onboarding-modal {
          max-width: 640px;
          width: 90vw;
        }

        .onboarding-card {
          background: linear-gradient(135deg, var(--arena-surface) 0%, var(--arena-surface-alt) 100%);
          border: 2px solid var(--arena-border);
          border-radius: 12px;
          padding: 24px;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .onboarding-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
        }

        @media (max-width: 768px) {
          .onboarding-modal {
            width: 95vw;
          }
          
          .onboarding-card {
            padding: 20px;
          }
        }
      `}</style>
    </div>
  );
}
