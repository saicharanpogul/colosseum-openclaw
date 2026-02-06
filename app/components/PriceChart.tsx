'use client';

import { useMemo } from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, YAxis } from 'recharts';

interface PriceChartProps {
  history: { timestamp: number; yesPrice: number; noPrice: number }[];
  height?: number;
}

export function PriceChart({ history, height = 60 }: PriceChartProps) {
  // Generate chart data, fill with synthetic if no history
  const data = useMemo(() => {
    if (history.length >= 2) {
      return history.map(h => ({
        time: h.timestamp,
        yes: h.yesPrice,
        no: h.noPrice,
      }));
    }
    
    // Generate synthetic starting data (flat at 50%)
    const now = Date.now();
    const hourMs = 60 * 60 * 1000;
    return Array.from({ length: 12 }, (_, i) => ({
      time: now - (11 - i) * hourMs,
      yes: 50,
      no: 50,
    }));
  }, [history]);
  
  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="yesGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="noGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis domain={[0, 100]} hide />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1a1a2e', 
              border: '1px solid #333',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            labelFormatter={() => ''}
          />
          <Area
            type="monotone"
            dataKey="yes"
            stroke="#10b981"
            strokeWidth={2}
            fill="url(#yesGradient)"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
