import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const projectName = searchParams.get('project') || 'Unknown Project';
    const side = searchParams.get('side') as 'yes' | 'no' || 'yes';
    const shares = searchParams.get('shares') || '0';
    const odds = searchParams.get('odds') || '50';
    const value = searchParams.get('value') || '0';
    const wallet = searchParams.get('wallet') || '';

    const sideColor = side === 'yes' ? '#22c55e' : '#ef4444';
    const sideBg = side === 'yes' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)';

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0c0c0c',
            backgroundImage: 'radial-gradient(circle at 25px 25px, #1a1a1a 2%, transparent 0%), radial-gradient(circle at 75px 75px, #1a1a1a 2%, transparent 0%)',
            backgroundSize: '100px 100px',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '40px' }}>
            <div style={{ fontSize: '60px', marginRight: '20px' }}>🏛️</div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#d4a853' }}>
                Vapor
              </div>
              <div style={{ fontSize: '20px', color: '#737373' }}>
                Colosseum Prediction Markets
              </div>
            </div>
          </div>

          {/* Main Card */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#141414',
              border: '2px solid #2a2a2a',
              borderRadius: '24px',
              padding: '48px 60px',
              width: '900px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            }}
          >
            {/* Project Name */}
            <div
              style={{
                fontSize: '40px',
                fontWeight: 'bold',
                color: '#fafafa',
                marginBottom: '32px',
                textAlign: 'center',
              }}
            >
              {projectName}
            </div>

            {/* Position Badge */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: '32px',
              }}
            >
              <div
                style={{
                  backgroundColor: sideBg,
                  border: `2px solid ${sideColor}`,
                  borderRadius: '16px',
                  padding: '16px 32px',
                  fontSize: '32px',
                  fontWeight: 'bold',
                  color: sideColor,
                  textTransform: 'uppercase',
                }}
              >
                {side}
              </div>
            </div>

            {/* Stats Grid */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-around',
                marginBottom: '32px',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ fontSize: '20px', color: '#737373', marginBottom: '8px' }}>
                  Shares
                </div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#fafafa' }}>
                  {shares}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ fontSize: '20px', color: '#737373', marginBottom: '8px' }}>
                  Odds
                </div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#d4a853' }}>
                  {odds}%
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ fontSize: '20px', color: '#737373', marginBottom: '8px' }}>
                  Value
                </div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#d4a853' }}>
                  {value} SOL
                </div>
              </div>
            </div>

            {/* Wallet */}
            {wallet && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  fontSize: '18px',
                  color: '#737373',
                }}
              >
                {wallet}
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              display: 'flex',
              marginTop: '40px',
              fontSize: '20px',
              color: '#737373',
            }}
          >
            app-rosy-mu.vercel.app · Solana Devnet 💨
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      },
    );
  } catch (e: any) {
    console.log(`${e.message}`);
    return new Response(`Failed to generate image`, {
      status: 500,
    });
  }
}
