import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    const projectName = searchParams.get('project') || 'Unknown';
    const side = searchParams.get('side') || 'yes';
    const shares = searchParams.get('shares') || '0';
    const odds = searchParams.get('odds') || '50';
    const value = searchParams.get('value') || '0';

    return new ImageResponse(
      (
        <div
          style={{
            background: '#0c0c0c',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px',
          }}
        >
          <div
            style={{
              fontSize: 60,
              color: '#d4a853',
              fontWeight: 'bold',
              marginBottom: 40,
            }}
          >
            Vapor
          </div>

          <div
            style={{
              fontSize: 40,
              color: '#fafafa',
              fontWeight: 'bold',
              textAlign: 'center',
              marginBottom: 30,
            }}
          >
            {projectName}
          </div>

          <div
            style={{
              background: side === 'yes' ? '#22c55e' : '#ef4444',
              color: '#000',
              fontSize: 32,
              fontWeight: 'bold',
              padding: '15px 40px',
              borderRadius: 12,
              marginBottom: 40,
            }}
          >
            {side.toUpperCase()}
          </div>

          <div
            style={{
              display: 'flex',
              gap: 40,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontSize: 18, color: '#737373' }}>Shares</div>
              <div style={{ fontSize: 28, color: '#fafafa', fontWeight: 'bold' }}>{shares}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontSize: 18, color: '#737373' }}>Odds</div>
              <div style={{ fontSize: 28, color: '#d4a853', fontWeight: 'bold' }}>{odds}%</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontSize: 18, color: '#737373' }}>Value</div>
              <div style={{ fontSize: 28, color: '#d4a853', fontWeight: 'bold' }}>{value} SOL</div>
            </div>
          </div>

          <div
            style={{
              fontSize: 16,
              color: '#737373',
              marginTop: 40,
            }}
          >
            app-rosy-mu.vercel.app
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      },
    );
  } catch (e) {
    return new Response(`Failed to generate image`, {
      status: 500,
    });
  }
}
