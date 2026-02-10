'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface PriceHistoryPoint {
  id: number;
  market_id: string;
  yes_odds: number;
  no_odds: number;
  yes_pool: number;
  no_pool: number;
  total_volume: number;
  recorded_at: string;
}

interface PriceHistoryChartProps {
  marketId: string;
}

type TimeRange = '1h' | '24h' | '7d' | '30d' | 'all';

export function PriceHistoryChart({ marketId }: PriceHistoryChartProps) {
  const [history, setHistory] = useState<PriceHistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/markets/${marketId}/history?range=${timeRange}`);
        const data = await res.json();
        
        if (data.success) {
          setHistory(data.history);
          setError(null);
        } else {
          setError(data.error || 'Failed to load price history');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch price history');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
    const interval = setInterval(fetchHistory, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [marketId, timeRange]);

  // Transform data for chart
  const chartData = history.map(point => ({
    time: new Date(point.recorded_at).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }),
    fullTime: new Date(point.recorded_at).toLocaleString(),
    YES: Number(point.yes_odds),
    NO: Number(point.no_odds),
  }));

  if (loading && history.length === 0) {
    return (
      <div className="vapor-card p-6">
        <h3 className="text-lg font-bold text-white mb-4">Price History</h3>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="spinner mb-2"></div>
            <p className="text-xs text-[var(--arena-muted)]">Loading price history...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="vapor-card p-6">
        <h3 className="text-lg font-bold text-white mb-4">Price History</h3>
        <div className="bg-[var(--arena-surface-alt)] rounded-lg p-6 text-center">
          <p className="text-sm text-[var(--arena-muted)] mb-2">⚠️ Unable to load price history</p>
          <p className="text-xs text-[var(--arena-text-dim)]">{error}</p>
        </div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="vapor-card p-6">
        <h3 className="text-lg font-bold text-white mb-4">Price History</h3>
        <div className="bg-[var(--arena-surface-alt)] rounded-lg p-6 text-center">
          <div className="text-4xl mb-3">📊</div>
          <p className="text-sm text-[var(--arena-muted)] mb-2">
            No price history available yet
          </p>
          <p className="text-xs text-[var(--arena-text-dim)]">
            Price data is recorded every 5 minutes. Check back soon after the first trade!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="vapor-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-white">Price History</h3>
        
        {/* Time Range Selector */}
        <div className="flex gap-2">
          {(['1h', '24h', '7d', '30d', 'all'] as TimeRange[]).map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                timeRange === range
                  ? 'bg-[var(--arena-gold)] text-black'
                  : 'bg-[var(--arena-surface-alt)] text-[var(--arena-muted)] hover:text-white border border-[var(--arena-border)]'
              }`}
            >
              {range === 'all' ? 'All' : range.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--arena-border)" />
          <XAxis 
            dataKey="time" 
            stroke="var(--arena-muted)"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="var(--arena-muted)"
            style={{ fontSize: '12px' }}
            domain={[0, 100]}
            label={{ value: 'Odds (%)', angle: -90, position: 'insideLeft', fill: 'var(--arena-muted)' }}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'var(--arena-surface)',
              border: '1px solid var(--arena-border)',
              borderRadius: '8px',
              color: 'var(--arena-text)',
            }}
            labelFormatter={(label) => {
              const point = chartData.find(p => p.time === label);
              return point?.fullTime || label;
            }}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="YES" 
            stroke="var(--arena-green)" 
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6 }}
          />
          <Line 
            type="monotone" 
            dataKey="NO" 
            stroke="var(--arena-red)" 
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-4 p-3 bg-[var(--arena-surface-alt)] rounded-lg">
        <p className="text-xs text-[var(--arena-text-dim)] text-center">
          💡 Prices update every 5 minutes. Chart refreshes automatically.
        </p>
      </div>
    </div>
  );
}
