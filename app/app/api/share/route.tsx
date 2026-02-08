import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const projectName = searchParams.get('project') || 'Unknown Project';
    const side = (searchParams.get('side') || 'yes') as 'yes' | 'no';
    const shares = searchParams.get('shares') || '0';
    const odds = searchParams.get('odds') || '50';
    const value = searchParams.get('value') || '0';

    const sideColor = side === 'yes' ? '#22c55e' : '#ef4444';

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
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '20px',
            }}
          >
            <div style={{ fontSize: '60px', color: '#d4a853' }}>
              Vapor 💨
            </div>
            
            <div style={{ fontSize: '40px', fontWeight: 'bold', color: '#fafafa' }}>
              {projectName}
            </div>

            <div
              style={{
                padding: '20px 40px',
                borderRadius: '12px',
                backgroundColor: side === 'yes' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                border: `2px solid ${sideColor}`,
              }}
            >
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: sideColor }}>
                {side.toUpperCase()}
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                gap: '40px',
                marginTop: '20px',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ fontSize: '18px', color: '#737373' }}>Shares</div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#fafafa' }}>
                  {shares}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ fontSize: '18px', color: '#737373' }}>Odds</div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#d4a853' }}>
                  {odds}%
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ fontSize: '18px', color: '#737373' }}>Value</div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#d4a853' }}>
                  {value} SOL
                </div>
              </div>
            </div>

            <div style={{ fontSize: '16px', color: '#737373', marginTop: '20px' }}>
              app-rosy-mu.vercel.app
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      },
    );
  } catch (e: any) {
    console.error('Share card error:', e);
    return new Response(`Failed to generate image: ${e.message}`, {
      status: 500,
    });
  }
}
