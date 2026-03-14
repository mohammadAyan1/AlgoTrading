

import React, { useState, useEffect, useCallback } from 'react';
import { ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { marketAPI } from '../services/api';
import { useLivePrices } from '../context/WSContext';
import { TrendingUp, TrendingDown, BarChart2 } from 'lucide-react';

// Custom Candlestick Bar (not used directly, but kept for reference)
function CandlestickBar(props) {
  const { x, y, width, height, payload } = props;
  if (!payload) return null;

  const { open, close, high, low } = payload;
  const isGreen = close >= open;
  const color = isGreen ? '#22c55e' : '#ef4444';

  const barX = x + width / 4;
  const barWidth = width / 2;
  const candleTop = Math.min(y, y + height);
  const candleBottom = Math.max(y, y + height);
  const candleHeight = Math.abs(height);

  return (
    <g>
      {/* Wick line */}
      <line
        x1={x + width / 2} y1={candleTop - 5}
        x2={x + width / 2} y2={candleBottom + 5}
        stroke={color} strokeWidth={1}
      />
      {/* Candle body */}
      <rect
        x={barX} y={candleTop}
        width={barWidth} height={Math.max(candleHeight, 1)}
        fill={color} opacity={0.9}
      />
    </g>
  );
}

// Custom Tooltip
function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;

  return (
    <div style={{
      background: '#1e293b', border: '1px solid #334155',
      borderRadius: 6, padding: '8px 12px', fontSize: 12
    }}>
      <div style={{ color: '#94a3b8', marginBottom: 4 }}>
        {new Date(d.time).toLocaleTimeString()}
      </div>
      {[['O', d.open, '#94a3b8'], ['H', d.high, '#22c55e'], ['L', d.low, '#ef4444'], ['C', d.close, '#e2e8f0']].map(([k, v, c]) => (
        <div key={k} style={{ color: c }}>
          {k}: <strong>₹{v?.toFixed(2)}</strong>
        </div>
      ))}
      <div style={{ color: '#64748b' }}>Vol: {d.volume?.toLocaleString()}</div>
    </div>
  );
}

export default function CandlestickChart({ symbol = 'TATAMOTORS' }) {
  const [candles, setCandles] = useState([]);
  const [interval, setIntervalVal] = useState('1min');
  const [loading, setLoading] = useState(false);
  const { getPrice } = useLivePrices();

  const livePrice = getPrice(symbol);

  const loadCandles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await marketAPI.getCandleData(symbol, interval, 60);
      setCandles(res.data.data.candles || []);
    } catch (e) { }
    setLoading(false);
  }, [symbol, interval]);

  useEffect(() => {
    loadCandles();
    const timer = setInterval(loadCandles, 30000);
    return () => clearInterval(timer);
  }, [loadCandles]);

  // Transform for recharts - use height for body
  const chartData = candles.map(c => ({
    ...c,
    timeLabel: new Date(c.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    bodyBottom: Math.min(c.open, c.close),
    bodyHeight: Math.abs(c.close - c.open),
    // For recharts bar: use close - open value
    value: c.close - c.open,
  }));

  const isUp = livePrice?.changePct >= 0;

  return (
    <div className="candlestick-chart-container">
      <style>{`
        .candlestick-chart-container {
          background: #0f172a;
          border: 1px solid #1e293b;
          border-radius: 8px;
          padding: 16px;
          height: 100%;
          min-height: 350px;
          display: flex;
          flex-direction: column;
        }

        /* Header */
        .chart-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
          flex-wrap: wrap;
          gap: 10px;
        }
        .symbol-info {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .live-price {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }
        .interval-selector {
          display: flex;
          gap: 4px;
        }
        .interval-btn {
          padding: 3px 8px;
          font-size: 11px;
          border-radius: 4px;
          cursor: pointer;
          border: none;
          background: #1e293b;
          color: #94a3b8;
          font-weight: 600;
          transition: all 0.2s;
        }
        .interval-btn.active {
          background: #6366f1;
          color: white;
        }

        /* OHLC Summary */
        .ohlc-summary {
          display: flex;
          gap: 16px;
          margin-bottom: 10px;
          padding: 6px 10px;
          background: #1e293b;
          border-radius: 6px;
          font-size: 12px;
          flex-wrap: wrap;
        }

        /* Chart wrapper */
        .chart-wrapper {
          flex: 1;
          min-height: 0;
          width: 100%;
        }

        /* Volume wrapper */
        .volume-wrapper {
          margin-top: 4px;
          height: 60px;
          width: 100%;
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .candlestick-chart-container {
            padding: 12px;
            min-height: 300px;
          }
          .chart-header {
            flex-direction: column;
            align-items: flex-start;
          }
          .interval-selector {
            width: 100%;
            justify-content: flex-end;
          }
          .ohlc-summary {
            font-size: 11px;
            gap: 10px;
          }
          .volume-wrapper {
            height: 40px;
          }
        }

        @media (max-width: 480px) {
          .candlestick-chart-container {
            padding: 8px;
            min-height: 280px;
          }
          .symbol-info span:first-child {
            font-size: 14px;
          }
          .live-price span:first-child {
            font-size: 16px;
          }
          .live-price span:last-child {
            font-size: 11px;
          }
          .ohlc-summary {
            font-size: 10px;
            gap: 8px;
            padding: 4px 8px;
          }
          .interval-btn {
            padding: 2px 6px;
            font-size: 10px;
          }
          .volume-wrapper {
            height: 30px;
          }
        }

        @media (max-width: 360px) {
          .ohlc-summary {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 4px;
          }
        }
      `}</style>

      {/* Header */}
      <div className="chart-header">
        <div className="symbol-info">
          <BarChart2 size={16} color="#6366f1" />
          <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 15 }}>{symbol}</span>
          {livePrice && (
            <div className="live-price">
              <span style={{
                fontSize: 18, fontWeight: 700, fontFamily: 'monospace',
                color: isUp ? '#22c55e' : '#ef4444'
              }}>
                ₹{livePrice.ltp?.toFixed(2)}
              </span>
              <span style={{
                fontSize: 12, color: isUp ? '#22c55e' : '#ef4444',
                display: 'flex', alignItems: 'center', gap: 2
              }}>
                {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {isUp ? '+' : ''}{livePrice.changePct?.toFixed(2)}%
              </span>
            </div>
          )}
        </div>

        {/* Interval selector */}
        <div className="interval-selector">
          {['1min', '5min', '1hour'].map(iv => (
            <button
              key={iv}
              onClick={() => setIntervalVal(iv)}
              className={`interval-btn ${interval === iv ? 'active' : ''}`}
            >
              {iv}
            </button>
          ))}
        </div>
      </div>

      {/* OHLC Summary Bar */}
      {livePrice && (
        <div className="ohlc-summary">
          {[['O', livePrice.open], ['H', livePrice.high], ['L', livePrice.low], ['C', livePrice.ltp]].map(([k, v]) => (
            <span key={k} style={{ color: '#94a3b8' }}>
              {k}: <strong style={{ color: '#e2e8f0', fontFamily: 'monospace' }}>₹{v?.toFixed(2)}</strong>
            </span>
          ))}
          <span style={{ color: '#94a3b8' }}>
            Vol: <strong style={{ color: '#e2e8f0' }}>{livePrice.volume?.toLocaleString()}</strong>
          </span>
        </div>
      )}

      {/* Chart */}
      <div className="chart-wrapper">
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b' }}>
            Loading chart...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="timeLabel"
                tick={{ fill: '#64748b', fontSize: 10 }}
                tickLine={false}
                interval={Math.floor(chartData.length / 8)}
              />
              <YAxis
                tick={{ fill: '#64748b', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={v => `₹${v}`}
                domain={['auto', 'auto']}
                width={60}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="close" shape={<CandleBodyBar />}>
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={entry.isGreen ? '#22c55e' : '#ef4444'} />
                ))}
              </Bar>
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Volume bars */}
      <div className="volume-wrapper">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 0, right: 5, bottom: 0, left: 10 }}>
            <XAxis dataKey="timeLabel" hide />
            <YAxis hide />
            <Bar dataKey="volume">
              {chartData.map((entry, index) => (
                <Cell key={index} fill={entry.isGreen ? '#166534' : '#7f1d1d'} opacity={0.7} />
              ))}
            </Bar>
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Custom bar shape for candle bodies
function CandleBodyBar(props) {
  const { x, y, width, height, payload } = props;
  if (!payload) return null;
  const isGreen = payload.close >= payload.open;
  return (
    <rect
      x={x + 1} y={y}
      width={Math.max(width - 2, 1)} height={Math.max(Math.abs(height), 1)}
      fill={isGreen ? '#22c55e' : '#ef4444'}
      opacity={0.9}
    />
  );
}