

// import React, { useState, useEffect, useRef } from 'react';
// import { useLivePrices } from '../context/WSContext';
// import { marketAPI } from '../services/api';
// import { TrendingUp, TrendingDown, Wifi, WifiOff, Search, Star, X, RefreshCw } from 'lucide-react';

// // Flash when price changes
// function PriceRow({ symbol, name, exchange, price, onSelect, onAdd, inWatchlist }) {
//   const prevLtp = useRef(price?.ltp);
//   const [flash, setFlash] = useState(null);

//   useEffect(() => {
//     if (price?.ltp == null || prevLtp.current == null) { prevLtp.current = price?.ltp; return; }
//     if (price.ltp !== prevLtp.current) {
//       setFlash(price.ltp > prevLtp.current ? 'up' : 'down');
//       const t = setTimeout(() => setFlash(null), 600);
//       prevLtp.current = price.ltp;
//       return () => clearTimeout(t);
//     }
//   }, [price?.ltp]);

//   if (!price || !price.ltp) return null;
//   const isUp = price.changePct >= 0;
//   const flashBg = flash === 'up' ? 'rgba(34,197,94,0.12)' : flash === 'down' ? 'rgba(239,68,68,0.12)' : 'transparent';
//   const dispName = (name || symbol).replace(/-EQ$|-BE$|-SM$/i, '');

//   return (
//     <div className="price-row" style={{
//       display: 'flex', alignItems: 'center', padding: '6px 10px',
//       borderBottom: '1px solid #080e1a', background: flashBg, transition: 'background 0.5s',
//       cursor: 'pointer'
//     }}>
//       <div style={{ flex: 1, minWidth: 0 }} onClick={() => onSelect?.(symbol, exchange)}>
//         <div className="symbol-name" style={{
//           fontSize: 12, fontWeight: 600, color: '#e2e8f0',
//           overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
//         }}>
//           {dispName}
//         </div>
//         <div className="change-info" style={{ fontSize: 10, color: '#334155', lineHeight: 1.3 }}>
//           <span style={{
//             color: isUp ? '#166534' : '#7f1d1d',
//             background: isUp ? '#dcfce7' : '#fee2e2',
//             padding: '0 4px', borderRadius: 3, fontSize: 9, fontWeight: 700
//           }}>
//             {isUp ? '▲' : '▼'} {price.change >= 0 ? '+' : ''}{price.change?.toFixed(2)}
//           </span>
//           <span style={{ marginLeft: 4, color: '#475569' }}>
//             Vol: {price.volume?.toLocaleString('en-IN')}
//           </span>
//         </div>
//       </div>

//       <div className="price-display" style={{ textAlign: 'right', marginRight: 5 }} onClick={() => onSelect?.(symbol, exchange)}>
//         <div className="ltp" style={{
//           fontSize: 13, fontWeight: 700, fontFamily: 'monospace',
//           color: isUp ? '#22c55e' : '#ef4444',
//           transition: 'color 0.2s'
//         }}>
//           ₹{price.ltp?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//         </div>
//         <div className="change-pct" style={{
//           fontSize: 10, color: isUp ? '#22c55e' : '#ef4444',
//           display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1
//         }}>
//           {isUp ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
//           {isUp ? '+' : ''}{price.changePct?.toFixed(2)}%
//         </div>
//       </div>

//       <button className="watch-star" onClick={() => onAdd?.({ symbol, exchange, name })}
//         style={{
//           background: 'none', border: 'none', cursor: 'pointer', padding: 2,
//           color: inWatchlist ? '#f59e0b' : '#1e293b',
//           transition: 'color 0.2s'
//         }}>
//         <Star size={11} fill={inWatchlist ? '#f59e0b' : 'none'} />
//       </button>
//     </div>
//   );
// }

// export default function LivePriceTicker({ onSelectSymbol }) {
//   const { prices, connected, source } = useLivePrices();
//   const [tab, setTab] = useState('live');
//   const [searchQ, setSearchQ] = useState('');
//   const [results, setResults] = useState([]);
//   const [watchlist, setWatchlist] = useState([]);
//   const [searching, setSearching] = useState(false);
//   const [lastUpdate, setLastUpdate] = useState(null);
//   const debounce = useRef(null);
//   const prevCount = useRef(0);

//   // Track last update time
//   useEffect(() => {
//     const count = Object.keys(prices).length;
//     if (count !== prevCount.current) {
//       setLastUpdate(new Date());
//       prevCount.current = count;
//     }
//   }, [prices]);

//   useEffect(() => {
//     marketAPI.getWatchlist().then(r => setWatchlist(r.data.data || [])).catch(() => { });
//   }, []);

//   // Debounced search
//   useEffect(() => {
//     clearTimeout(debounce.current);
//     if (searchQ.length < 2) { setResults([]); return; }
//     setSearching(true);
//     debounce.current = setTimeout(async () => {
//       try {
//         const r = await marketAPI.searchInstruments(searchQ, null, 30);
//         console.log('====================================');
//         console.log(r);
//         console.log('====================================');
//         setResults(r.data || []);
//       } catch (e) { setResults([]); }
//       setSearching(false);
//     }, 300);
//   }, [searchQ]);

//   const addToWatchlist = async ({ symbol, exchange, name, token }) => {
//     try {
//       await marketAPI.addToWatchlist({ trading_symbol: symbol, exchange, display_name: name, token });
//       const r = await marketAPI.getWatchlist();
//       setWatchlist(r.data.data || []);
//     } catch (e) { }
//   };

//   const removeFromWatchlist = async (id) => {
//     try {
//       await marketAPI.removeFromWatchlist(id);
//       setWatchlist(prev => prev.filter(w => w.id !== id));
//     } catch (e) { }
//   };

//   const watchSet = new Set(watchlist.map(w => `${w.exchange}:${w.trading_symbol}`));
//   const liveList = Object.entries(prices)
//     .filter(([, p]) => p?.ltp > 0)
//     .sort((a, b) => a[0].localeCompare(b[0]));

//   const isYahoo = source?.includes('Yahoo');
//   const isAB = source?.includes('AliceBlue');

//   const tabBtn = (id, lbl) => (
//     <button onClick={() => setTab(id)} className={`tab-btn ${tab === id ? 'active' : ''}`}>
//       {lbl}
//     </button>
//   );

//   return (
//     <div className="live-price-ticker">
//       <style>{`
//         .live-price-ticker {
//           background: #0f172a;
//           height: 100%;
//           display: flex;
//           flex-direction: column;
//           overflow: hidden;
//         }
//         .ticker-header {
//           padding: 8px 10px;
//           background: #1e293b;
//           flex-shrink: 0;
//         }
//         .header-row {
//           display: flex;
//           align-items: center;
//           justify-content: space-between;
//           margin-bottom: 4px;
//           flex-wrap: wrap;
//           gap: 4px;
//         }
//         .title {
//           color: #94a3b8;
//           font-weight: 700;
//           font-size: 11px;
//           text-transform: uppercase;
//         }
//         .connection-status {
//           display: flex;
//           align-items: center;
//           gap: 3px;
//         }
//         .source-badge {
//           font-size: 9px;
//           padding: 1px 5px;
//           border-radius: 3px;
//           font-weight: 700;
//           background: ${isAB ? '#1e3a5f' : '#1a2e1a'};
//           color: ${isAB ? '#60a5fa' : '#4ade80'};
//         }
//         .source-detail {
//           font-size: 9px;
//           color: #475569;
//           margin-bottom: 5px;
//           display: flex;
//           align-items: center;
//           gap: 4px;
//           flex-wrap: wrap;
//         }
//         .source-dot {
//           color: ${isAB ? '#60a5fa' : '#4ade80'};
//         }
//         .update-time {
//           margin-left: auto;
//           color: #334155;
//         }
//         .tab-bar {
//           display: flex;
//           gap: 2px;
//           background: #0f172a;
//           border-radius: 5px;
//           padding: 2px;
//         }
//         .tab-btn {
//           flex: 1;
//           padding: 5px 2px;
//           border: none;
//           border-radius: 4px;
//           background: transparent;
//           color: #64748b;
//           font-size: 10px;
//           font-weight: 600;
//           cursor: pointer;
//           transition: all 0.2s;
//         }
//         .tab-btn.active {
//           background: #6366f1;
//           color: white;
//         }
//         .search-container {
//           padding: 6px 8px;
//           border-bottom: 1px solid #1e293b;
//           flex-shrink: 0;
//         }
//         .search-wrapper {
//           position: relative;
//         }
//         .search-input {
//           width: 100%;
//           box-sizing: border-box;
//           background: #1e293b;
//           border: 1px solid #334155;
//           border-radius: 5px;
//           padding: 6px 6px 6px 24px;
//           color: #e2e8f0;
//           font-size: 12px;
//           outline: none;
//         }
//         .search-icon {
//           position: absolute;
//           left: 7px;
//           top: 50%;
//           transform: translateY(-50%);
//           color: #64748b;
//         }
//         .clear-search {
//           position: absolute;
//           right: 5px;
//           top: 50%;
//           transform: translateY(-50%);
//           background: none;
//           border: none;
//           cursor: pointer;
//           color: #64748b;
//           padding: 0;
//         }
//         .scroll-area {
//           flex: 1;
//           overflow-y: auto;
//         }
//         .empty-message {
//           color: #64748b;
//           text-align: center;
//           padding: 30px;
//           font-size: 12px;
//         }
//         .footer {
//           padding: 4px 10px;
//           border-top: 1px solid #1e293b;
//           flex-shrink: 0;
//           display: flex;
//           justify-content: space-between;
//           align-items: center;
//           font-size: 9px;
//           color: #334155;
//         }
//         .footer-count {
//           color: #334155;
//         }
//         .footer-source {
//           color: ${isAB ? '#3b82f6' : '#22c55e'};
//         }

//         /* Responsive */
//         @media (max-width: 768px) {
//           .ticker-header {
//             padding: 6px 8px;
//           }
//           .title {
//             font-size: 10px;
//           }
//           .source-detail {
//             font-size: 8px;
//           }
//           .tab-btn {
//             font-size: 9px;
//             padding: 4px 2px;
//           }
//           .search-input {
//             font-size: 11px;
//             padding: 5px 5px 5px 22px;
//           }
//           .price-row {
//             padding: 4px 8px;
//           }
//           .symbol-name {
//             font-size: 11px;
//           }
//           .change-info {
//             font-size: 9px;
//           }
//           .ltp {
//             font-size: 12px;
//           }
//           .change-pct {
//             font-size: 9px;
//           }
//         }

//         @media (max-width: 480px) {
//           .ticker-header {
//             padding: 4px 6px;
//           }
//           .title {
//             font-size: 9px;
//           }
//           .source-badge {
//             font-size: 8px;
//             padding: 1px 3px;
//           }
//           .source-detail {
//             font-size: 7px;
//           }
//           .tab-btn {
//             font-size: 8px;
//             padding: 3px 1px;
//           }
//           .search-input {
//             font-size: 10px;
//             padding: 4px 4px 4px 20px;
//           }
//           .price-row {
//             padding: 3px 6px;
//           }
//           .symbol-name {
//             font-size: 10px;
//           }
//           .change-info {
//             font-size: 8px;
//           }
//           .ltp {
//             font-size: 11px;
//           }
//           .change-pct {
//             font-size: 8px;
//           }
//           .footer {
//             font-size: 8px;
//           }
//         }

//         @media (max-width: 360px) {
//           .price-row {
//             flex-wrap: wrap;
//           }
//           .price-display {
//             margin-right: 2px;
//           }
//           .watch-star {
//             padding: 1px;
//           }
//         }
//       `}</style>

//       {/* Header */}
//       <div className="ticker-header">
//         <div className="header-row">
//           <span className="title">Market Watch</span>
//           <div className="connection-status">
//             {connected ? <Wifi size={10} color="#22c55e" /> : <WifiOff size={10} color="#ef4444" />}
//             <span className="source-badge">
//               {isAB ? '⚡ AB LIVE' : isYahoo ? '📡 NSE LIVE' : '…'}
//             </span>
//           </div>
//         </div>

//         {/* Source badge */}
//         <div className="source-detail">
//           <span className="source-dot">●</span>
//           {source || 'Connecting…'}
//           {lastUpdate && (
//             <span className="update-time">
//               {lastUpdate.toLocaleTimeString('en-IN')}
//             </span>
//           )}
//         </div>

//         <div className="tab-bar">
//           {tabBtn('live', '📈 Live')}
//           {tabBtn('watchlist', '⭐ Watch')}
//           {tabBtn('search', '🔍 Search')}
//         </div>
//       </div>

//       {/* Search input */}
//       {tab === 'search' && (
//         <div className="search-container">
//           <div className="search-wrapper">
//             <Search size={11} className="search-icon" />
//             <input
//               autoFocus
//               value={searchQ}
//               onChange={e => setSearchQ(e.target.value)}
//               placeholder="Search NSE / BSE / F&O…"
//               className="search-input"
//             />
//             {searchQ && (
//               <button onClick={() => setSearchQ('')} className="clear-search">
//                 <X size={11} />
//               </button>
//             )}
//           </div>
//         </div>
//       )}

//       {/* Scrollable list */}
//       <div className="scroll-area">

//         {/* ── LIVE TAB ── */}
//         {tab === 'live' && (
//           liveList.length === 0
//             ? <div className="empty-message">
//               <RefreshCw size={18} color="#334155" style={{ marginBottom: 8 }} /><br />
//               Fetching NSE prices…<br />
//               <span style={{ fontSize: 10, color: '#334155' }}>Usually takes ~5 seconds</span>
//             </div>
//             : liveList.map(([sym, p]) => (
//               <PriceRow key={sym}
//                 symbol={sym} name={p.name} exchange={p.exchange || 'NSE'} price={p}
//                 onSelect={onSelectSymbol}
//                 onAdd={addToWatchlist}
//                 inWatchlist={watchSet.has(`${p.exchange || 'NSE'}:${sym}`)}
//               />
//             ))
//         )}

//         {/* ── WATCHLIST TAB ── */}
//         {tab === 'watchlist' && (
//           watchlist.length === 0
//             ? <div className="empty-message">
//               No stocks.{' '}
//               <span style={{ color: '#6366f1', cursor: 'pointer' }} onClick={() => setTab('search')}>
//                 Search to add →
//               </span>
//             </div>
//             : watchlist.map(item => {
//               const lp = prices[item.trading_symbol] || prices[item.trading_symbol + '-EQ'];
//               const isUp = (lp?.changePct ?? 0) >= 0;
//               return (
//                 <div key={item.id} className="price-row" style={{ display: 'flex', alignItems: 'center' }}>
//                   <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
//                     onClick={() => onSelectSymbol?.(item.trading_symbol, item.exchange)}>
//                     <div className="symbol-name" style={{
//                       fontSize: 12, fontWeight: 600, color: '#e2e8f0',
//                       overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
//                     }}>
//                       {(item.display_name || item.trading_symbol).replace(/-EQ$/i, '')}
//                     </div>
//                     <div style={{ fontSize: 10, color: '#475569' }}>{item.exchange}</div>
//                   </div>
//                   {lp?.ltp > 0 && (
//                     <div className="price-display" style={{ textAlign: 'right', marginRight: 6 }}
//                       onClick={() => onSelectSymbol?.(item.trading_symbol, item.exchange)}>
//                       <div className="ltp" style={{
//                         fontSize: 12, fontWeight: 700, fontFamily: 'monospace',
//                         color: isUp ? '#22c55e' : '#ef4444'
//                       }}>
//                         ₹{lp.ltp?.toFixed(2)}
//                       </div>
//                       <div className="change-pct" style={{
//                         fontSize: 10, color: isUp ? '#22c55e' : '#ef4444'
//                       }}>
//                         {isUp ? '+' : ''}{lp.changePct?.toFixed(2)}%
//                       </div>
//                     </div>
//                   )}
//                   <button onClick={() => removeFromWatchlist(item.id)}
//                     style={{
//                       background: 'none', border: 'none', cursor: 'pointer',
//                       color: '#ef4444', opacity: 0.5, padding: 2
//                     }}>
//                     <X size={11} />
//                   </button>
//                 </div>
//               );
//             })
//         )}

//         {/* ── SEARCH TAB ── */}
//         {tab === 'search' && (
//           searching
//             ? <div className="empty-message">Searching…</div>
//             : searchQ.length < 2
//               ? <div style={{ color: '#475569', textAlign: 'center', padding: 20, fontSize: 11 }}>
//                 Type symbol or company name<br />
//                 <span style={{ color: '#334155' }}>e.g. RELIANCE, TATA, NIFTY, BANKNIFTY</span>
//               </div>
//               : results.length === 0
//                 ? <div className="empty-message">No results for "{searchQ}"</div>
//                 : results.map((inst, i) => {
//                   const lp = prices[inst.symbol] || prices[inst.symbol.replace(/-EQ$/i, '')];
//                   const isUp = (lp?.changePct ?? 0) >= 0;
//                   const inWatch = watchSet.has(`${inst.exchange}:${inst.symbol}`);
//                   return (
//                     <div key={i} className="price-row" style={{ display: 'flex', alignItems: 'center' }}>
//                       <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
//                         onClick={() => onSelectSymbol?.(inst.symbol, inst.exchange)}>
//                         <div className="symbol-name" style={{
//                           fontSize: 12, fontWeight: 600, color: '#e2e8f0',
//                           overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
//                         }}>
//                           {inst.name || inst.symbol}
//                         </div>
//                         <div style={{ fontSize: 10, color: '#475569' }}>
//                           {inst.symbol} · {inst.exchange}
//                           {inst.expiry && <span style={{ color: '#a78bfa', marginLeft: 4 }}>{inst.expiry}</span>}
//                         </div>
//                       </div>
//                       {lp?.ltp > 0 && (
//                         <div className="price-display" style={{ textAlign: 'right', marginRight: 5 }}
//                           onClick={() => onSelectSymbol?.(inst.symbol, inst.exchange)}>
//                           <div className="ltp" style={{
//                             fontSize: 12, fontWeight: 700, fontFamily: 'monospace',
//                             color: isUp ? '#22c55e' : '#ef4444'
//                           }}>
//                             ₹{lp.ltp?.toFixed(2)}
//                           </div>
//                           <div className="change-pct" style={{
//                             fontSize: 10, color: isUp ? '#22c55e' : '#ef4444'
//                           }}>
//                             {isUp ? '+' : ''}{lp.changePct?.toFixed(2)}%
//                           </div>
//                         </div>
//                       )}
//                       <button onClick={() => addToWatchlist({
//                         symbol: inst.symbol, exchange: inst.exchange, name: inst.name, token: inst.token
//                       })}
//                         className="watch-star" style={{
//                           background: 'none', border: 'none', cursor: 'pointer', padding: 2,
//                           color: inWatch ? '#f59e0b' : '#1e293b'
//                         }}>
//                         <Star size={11} fill={inWatch ? '#f59e0b' : 'none'} />
//                       </button>
//                     </div>
//                   );
//                 })
//         )}
//       </div>

//       {/* Footer */}
//       <div className="footer">
//         <span className="footer-count">{liveList.length} live</span>
//         <span className="footer-source">
//           {isAB ? '⚡ Real-time' : '● NSE prices'} · 3s refresh
//         </span>
//       </div>
//     </div>
//   );
// }



import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLivePrices } from '../context/WSContext';
import { marketAPI } from '../services/api';
import {
  TrendingUp, TrendingDown, Wifi, WifiOff, Search, Star, X,
  RefreshCw, ChevronDown, ChevronUp, BarChart2, Activity,
  ArrowUpRight, ArrowDownRight, Info
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns true if symbol looks like an index (Nifty / Sensex / BankNifty etc.) */
const isIndex = (sym = '') => {
  const s = sym.toUpperCase();
  return (
    s.includes('NIFTY') ||
    s.includes('SENSEX') ||
    s.includes('NSEI') ||
    s.includes('BSESN') ||
    s === 'INDIA VIX'
  );
};

/** Resolve live price from prices map using multiple key strategies */
const resolvePrice = (prices, inst) => {
  if (!inst) return null;
  const sym = inst.trading_symbol || inst.symbol || '';
  const base = sym.replace(/-EQ$/i, '');
  return (
    prices[sym] ||
    prices[base] ||
    prices[sym + '-EQ'] ||
    prices[base + '-EQ'] ||
    null
  );
};

/** Format number with Indian locale */
const fmt = (n, decimals = 2) =>
  n == null ? '—' : (+n).toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

// ─── MiniSparkBar — tiny inline OHLC indicator ────────────────────────────────
function MiniSparkBar({ open, high, low, close, ltp }) {
  if (!high || !low || high === low) return null;
  const range = high - low;
  const ltpPct = Math.min(100, Math.max(0, ((ltp - low) / range) * 100));
  const openPct = Math.min(100, Math.max(0, ((open - low) / range) * 100));
  const isUp = ltp >= open;
  return (
    <div style={{ marginTop: 3, position: 'relative', height: 4, background: '#1e293b', borderRadius: 2, overflow: 'visible' }}>
      {/* Day range bar */}
      <div style={{
        position: 'absolute', left: 0, right: 0, top: 1, height: 2,
        background: 'linear-gradient(to right, #ef4444 0%, #22c55e 100%)',
        borderRadius: 1, opacity: 0.3
      }} />
      {/* Open marker */}
      <div style={{
        position: 'absolute', left: `${openPct}%`, top: 0, width: 1, height: 4,
        background: '#94a3b8', borderRadius: 0
      }} />
      {/* LTP dot */}
      <div style={{
        position: 'absolute', left: `${ltpPct}%`, top: -1, width: 6, height: 6,
        borderRadius: '50%', background: isUp ? '#22c55e' : '#ef4444',
        transform: 'translateX(-50%)',
        boxShadow: `0 0 4px ${isUp ? '#22c55e' : '#ef4444'}`
      }} />
    </div>
  );
}

// ─── OHLCDetail — expanded detail panel for a selected stock ────────────────
function OHLCDetail({ symbol, price, onClose, onOpenChart }) {
  if (!price) return null;
  const isUp = price.changePct >= 0;
  const dispName = (price.name || symbol).replace(/-EQ$/i, '');
  const idx = isIndex(symbol);

  return (
    <div style={{
      margin: '4px 8px',
      background: 'linear-gradient(135deg, #0f1f35 0%, #0a1628 100%)',
      border: `1px solid ${isUp ? '#14532d' : '#7f1d1d'}`,
      borderRadius: 8,
      padding: '10px 12px',
      position: 'relative',
      animation: 'slideDown 0.15s ease'
    }}>
      <style>{`@keyframes slideDown { from { opacity:0; transform:translateY(-6px) } to { opacity:1; transform:translateY(0) } }`}</style>

      {/* Close button */}
      <button onClick={onClose} style={{
        position: 'absolute', top: 6, right: 6,
        background: 'none', border: 'none', cursor: 'pointer',
        color: '#475569', padding: 2
      }}><X size={11} /></button>

      {/* Header */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>{dispName}</span>
          {idx && (
            <span style={{
              fontSize: 8, background: '#312e81', color: '#a5b4fc',
              padding: '1px 5px', borderRadius: 3, fontWeight: 700
            }}>INDEX</span>
          )}
          <span style={{
            fontSize: 8, background: '#1e293b', color: '#64748b',
            padding: '1px 4px', borderRadius: 3
          }}>{price.exchange}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 3 }}>
          <span style={{
            fontSize: 18, fontWeight: 800, fontFamily: 'monospace',
            color: isUp ? '#22c55e' : '#ef4444'
          }}>₹{fmt(price.ltp)}</span>
          <span style={{
            fontSize: 11, color: isUp ? '#22c55e' : '#ef4444', fontWeight: 600
          }}>
            {isUp ? <ArrowUpRight size={12} style={{ display: 'inline' }} /> : <ArrowDownRight size={12} style={{ display: 'inline' }} />}
            {isUp ? '+' : ''}{fmt(price.change)} ({isUp ? '+' : ''}{fmt(price.changePct)}%)
          </span>
        </div>
      </div>

      {/* Day range spark */}
      {price.high && price.low && (
        <MiniSparkBar
          open={price.open} high={price.high}
          low={price.low} close={price.ltp} ltp={price.ltp}
        />
      )}

      {/* OHLCV grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
        gap: '6px 8px', marginTop: 10
      }}>
        {[
          { label: 'Open', value: `₹${fmt(price.open)}` },
          { label: 'High', value: `₹${fmt(price.high)}`, color: '#22c55e' },
          { label: 'Low', value: `₹${fmt(price.low)}`, color: '#ef4444' },
          { label: 'Prev Close', value: `₹${fmt(price.prevClose)}` },
          { label: 'Volume', value: price.volume ? price.volume.toLocaleString('en-IN') : '—' },
          { label: 'Chg%', value: `${isUp ? '+' : ''}${fmt(price.changePct)}%`, color: isUp ? '#22c55e' : '#ef4444' },
        ].map(({ label, value, color }) => (
          <div key={label}>
            <div style={{ fontSize: 9, color: '#475569', marginBottom: 1 }}>{label}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: color || '#94a3b8', fontFamily: 'monospace' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
        <button onClick={() => onOpenChart?.(symbol, price.exchange)} style={{
          flex: 1, padding: '5px 8px', borderRadius: 5, border: 'none', cursor: 'pointer',
          background: '#1e3a5f', color: '#60a5fa', fontSize: 10, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4
        }}>
          <BarChart2 size={10} /> View Chart
        </button>
        {price.isSimulated && (
          <div style={{
            fontSize: 8, color: '#f59e0b', background: '#451a03',
            padding: '4px 6px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 3
          }}>
            <Activity size={8} /> Simulated
          </div>
        )}
      </div>
    </div>
  );
}

// ─── PriceRow — single row for Live tab ───────────────────────────────────────
function PriceRow({ symbol, name, exchange, price, onSelect, onAdd, inWatchlist }) {
  const prevLtp = useRef(price?.ltp);
  const [flash, setFlash] = useState(null);

  useEffect(() => {
    if (price?.ltp == null || prevLtp.current == null) { prevLtp.current = price?.ltp; return; }
    if (price.ltp !== prevLtp.current) {
      setFlash(price.ltp > prevLtp.current ? 'up' : 'down');
      const t = setTimeout(() => setFlash(null), 600);
      prevLtp.current = price.ltp;
      return () => clearTimeout(t);
    }
  }, [price?.ltp]);

  if (!price || !price.ltp) return null;
  const isUp = price.changePct >= 0;
  const flashBg = flash === 'up' ? 'rgba(34,197,94,0.12)' : flash === 'down' ? 'rgba(239,68,68,0.12)' : 'transparent';
  const dispName = (name || symbol).replace(/-EQ$|-BE$|-SM$/i, '');
  const idx = isIndex(symbol);

  return (
    <div className="price-row" style={{
      display: 'flex', alignItems: 'center', padding: '6px 10px',
      borderBottom: '1px solid #080e1a', background: flashBg, transition: 'background 0.5s',
      cursor: 'pointer'
    }}>
      <div style={{ flex: 1, minWidth: 0 }} onClick={() => onSelect?.(symbol, exchange)}>
        <div style={{
          fontSize: 12, fontWeight: 600, color: '#e2e8f0',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          display: 'flex', alignItems: 'center', gap: 4
        }}>
          {dispName}
          {idx && <span style={{ fontSize: 7, background: '#312e81', color: '#a5b4fc', padding: '0 3px', borderRadius: 2 }}>IDX</span>}
        </div>
        <div style={{ fontSize: 10, color: '#334155', lineHeight: 1.3, display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{
            color: isUp ? '#166534' : '#7f1d1d',
            background: isUp ? '#dcfce7' : '#fee2e2',
            padding: '0 4px', borderRadius: 3, fontSize: 9, fontWeight: 700
          }}>
            {isUp ? '▲' : '▼'} {price.change >= 0 ? '+' : ''}{price.change?.toFixed(2)}
          </span>
          <span style={{ color: '#475569' }}>
            Vol: {price.volume?.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      <div style={{ textAlign: 'right', marginRight: 5 }} onClick={() => onSelect?.(symbol, exchange)}>
        <div style={{
          fontSize: 13, fontWeight: 700, fontFamily: 'monospace',
          color: isUp ? '#22c55e' : '#ef4444', transition: 'color 0.2s'
        }}>
          ₹{price.ltp?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div style={{
          fontSize: 10, color: isUp ? '#22c55e' : '#ef4444',
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1
        }}>
          {isUp ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
          {isUp ? '+' : ''}{price.changePct?.toFixed(2)}%
        </div>
      </div>

      <button onClick={() => onAdd?.({ symbol, exchange, name })}
        style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: 2,
          color: inWatchlist ? '#f59e0b' : '#1e293b', transition: 'color 0.2s'
        }}>
        <Star size={11} fill={inWatchlist ? '#f59e0b' : 'none'} />
      </button>
    </div>
  );
}

// ─── SearchResultRow — row shown in Search tab ────────────────────────────────
function SearchResultRow({ inst, livePrice, inWatchlist, onSelect, onAdd, isExpanded, onToggleExpand, onOpenChart }) {
  const isUp = (livePrice?.changePct ?? 0) >= 0;
  const idx = isIndex(inst.trading_symbol || inst.symbol || '');
  const dispName = inst.formatted_name || inst.name || inst.trading_symbol || inst.symbol;
  const hasPrice = livePrice?.ltp > 0;

  return (
    <>
      <div className="price-row" style={{
        display: 'flex', alignItems: 'center', padding: '7px 10px',
        borderBottom: '1px solid #080e1a', cursor: 'pointer',
        background: isExpanded ? 'rgba(99,102,241,0.06)' : 'transparent',
        transition: 'background 0.2s'
      }}>
        {/* Left — name + type */}
        <div style={{ flex: 1, minWidth: 0 }} onClick={() => {
          onSelect?.(inst.trading_symbol || inst.symbol, inst.exchange || inst.exch);
          onToggleExpand();
        }}>
          <div style={{
            fontSize: 12, fontWeight: 600, color: '#e2e8f0',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            display: 'flex', alignItems: 'center', gap: 4
          }}>
            {dispName}
            {idx && <span style={{ fontSize: 7, background: '#312e81', color: '#a5b4fc', padding: '0 3px', borderRadius: 2, flexShrink: 0 }}>IDX</span>}
            {inst.instrument_type && !idx && (
              <span style={{ fontSize: 7, background: '#1e3a5f', color: '#60a5fa', padding: '0 3px', borderRadius: 2, flexShrink: 0 }}>
                {inst.instrument_type}
              </span>
            )}
          </div>
          <div style={{ fontSize: 10, color: '#475569', marginTop: 1 }}>
            {inst.trading_symbol} · {inst.exchange || inst.exch}
            {inst.expiry && <span style={{ color: '#a78bfa', marginLeft: 4 }}>exp {inst.expiry}</span>}
            {inst.strike_price && <span style={{ color: '#f59e0b', marginLeft: 4 }}>₹{inst.strike_price} {inst.option_type}</span>}
          </div>
        </div>

        {/* Right — live price */}
        {hasPrice ? (
          <div style={{ textAlign: 'right', marginRight: 5 }}
            onClick={() => { onSelect?.(inst.trading_symbol || inst.symbol, inst.exchange || inst.exch); onToggleExpand(); }}>
            <div style={{
              fontSize: 12, fontWeight: 700, fontFamily: 'monospace',
              color: isUp ? '#22c55e' : '#ef4444'
            }}>₹{fmt(livePrice.ltp)}</div>
            <div style={{ fontSize: 10, color: isUp ? '#22c55e' : '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
              {isUp ? <TrendingUp size={8} /> : <TrendingDown size={8} />}
              {isUp ? '+' : ''}{fmt(livePrice.changePct)}%
            </div>
          </div>
        ) : (
          <div style={{ marginRight: 5, fontSize: 9, color: '#334155', textAlign: 'right' }}>
            <div style={{ color: '#475569' }}>No live</div>
            <div style={{ color: '#334155' }}>data</div>
          </div>
        )}

        {/* Expand toggle */}
        <button onClick={onToggleExpand} style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: 2,
          color: isExpanded ? '#6366f1' : '#334155'
        }}>
          {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
        </button>

        {/* Watchlist star */}
        <button onClick={() => onAdd?.(inst)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 2,
            color: inWatchlist ? '#f59e0b' : '#1e293b', transition: 'color 0.2s'
          }}>
          <Star size={11} fill={inWatchlist ? '#f59e0b' : 'none'} />
        </button>
      </div>

      {/* Expanded OHLC detail panel */}
      {isExpanded && (
        <OHLCDetail
          symbol={inst.trading_symbol || inst.symbol}
          price={livePrice || { ltp: 0, exchange: inst.exchange || inst.exch, name: dispName }}
          onClose={onToggleExpand}
          onOpenChart={onOpenChart}
        />
      )}
    </>
  );
}

// ─── Main LivePriceTicker Component ───────────────────────────────────────────
export default function LivePriceTicker({ onSelectSymbol }) {
  const { prices, connected, source } = useLivePrices();
  const [tab, setTab] = useState('live');
  const [searchQ, setSearchQ] = useState('');
  const [results, setResults] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [searching, setSearching] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [expandedIdx, setExpandedIdx] = useState(null);   // index in results[]
  const [expandedWatch, setExpandedWatch] = useState(null); // watchlist item id
  const debounce = useRef(null);
  const prevCount = useRef(0);

  // Track last update time
  useEffect(() => {
    const count = Object.keys(prices).length;
    if (count !== prevCount.current) { setLastUpdate(new Date()); prevCount.current = count; }
  }, [prices]);

  // Load watchlist on mount
  useEffect(() => {
    marketAPI.getWatchlist()
      .then(r => setWatchlist(r.data.data || []))
      .catch(() => { });
  }, []);

  // Debounced search
  useEffect(() => {
    clearTimeout(debounce.current);
    if (searchQ.length < 2) { setResults([]); setExpandedIdx(null); return; }
    setSearching(true);
    debounce.current = setTimeout(async () => {
      try {
        const r = await marketAPI.searchInstruments(searchQ, null, 40);
        setResults(r.data || []);
        setExpandedIdx(null);
      } catch (e) { setResults([]); }
      setSearching(false);
    }, 300);
  }, [searchQ]);

  const addToWatchlist = useCallback(async (inst) => {
    // Accept both full instrument objects (from search) and simple {symbol,exchange,name} (from live tab)
    const tradingSymbol = inst.trading_symbol || inst.symbol;
    const exchange = inst.exchange || inst.exch || 'NSE';
    const name = inst.formatted_name || inst.name || inst.display_name || tradingSymbol;
    const token = inst.token || '';
    try {
      await marketAPI.addToWatchlist({ trading_symbol: tradingSymbol, exchange, display_name: name, token });
      const r = await marketAPI.getWatchlist();
      setWatchlist(r.data.data || []);
    } catch (e) { }
  }, []);

  const removeFromWatchlist = useCallback(async (id) => {
    try {
      await marketAPI.removeFromWatchlist(id);
      setWatchlist(prev => prev.filter(w => w.id !== id));
    } catch (e) { }
  }, []);

  // Build watchlist set for quick lookup — key is "EXCHANGE:TRADING_SYMBOL"
  const watchSet = new Set(watchlist.map(w => `${w.exchange}:${w.trading_symbol}`));

  // Helper: check if an instrument is already in watchlist
  const inWatchlist = (inst) => {
    const sym = inst.trading_symbol || inst.symbol || '';
    const exch = (inst.exchange || inst.exch || 'NSE').toUpperCase();
    return watchSet.has(`${exch}:${sym}`) || watchSet.has(`${exch}:${sym}-EQ`);
  };

  const liveList = Object.entries(prices)
    .filter(([, p]) => p?.ltp > 0)
    .sort((a, b) => a[0].localeCompare(b[0]));

  const isYahoo = source?.includes('Yahoo');
  const isAB = source?.includes('AliceBlue');

  const tabBtn = (id, lbl) => (
    <button onClick={() => setTab(id)} style={{
      flex: 1, padding: '5px 2px', border: 'none', borderRadius: 4,
      background: tab === id ? '#6366f1' : 'transparent',
      color: tab === id ? 'white' : '#64748b',
      fontSize: 10, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
    }}>{lbl}</button>
  );

  return (
    <div style={{
      background: '#0f172a', height: '100%',
      display: 'flex', flexDirection: 'column', overflow: 'hidden'
    }}>
      {/* ── Header ── */}
      <div style={{ padding: '8px 10px', background: '#1e293b', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4, flexWrap: 'wrap', gap: 4 }}>
          <span style={{ color: '#94a3b8', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Market Watch
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            {connected ? <Wifi size={10} color="#22c55e" /> : <WifiOff size={10} color="#ef4444" />}
            <span style={{
              fontSize: 9, padding: '1px 5px', borderRadius: 3, fontWeight: 700,
              background: isAB ? '#1e3a5f' : '#1a2e1a',
              color: isAB ? '#60a5fa' : '#4ade80'
            }}>
              {isAB ? '⚡ AB LIVE' : isYahoo ? '📡 NSE LIVE' : '…'}
            </span>
          </div>
        </div>

        {/* Source info */}
        <div style={{ fontSize: 9, color: '#475569', marginBottom: 5, display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
          <span style={{ color: isAB ? '#60a5fa' : '#4ade80' }}>●</span>
          {source || 'Connecting…'}
          {lastUpdate && (
            <span style={{ marginLeft: 'auto', color: '#334155' }}>
              {lastUpdate.toLocaleTimeString('en-IN')}
            </span>
          )}
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 2, background: '#0f172a', borderRadius: 5, padding: 2 }}>
          {tabBtn('live', '📈 Live')}
          {tabBtn('watchlist', '⭐ Watch')}
          {tabBtn('search', '🔍 Search')}
        </div>
      </div>

      {/* ── Search Input (only in search tab) ── */}
      {tab === 'search' && (
        <div style={{ padding: '6px 8px', borderBottom: '1px solid #1e293b', flexShrink: 0 }}>
          <div style={{ position: 'relative' }}>
            <Search size={11} style={{ position: 'absolute', left: 7, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              autoFocus
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              placeholder="Search NSE / BSE / F&O / Nifty…"
              style={{
                width: '100%', boxSizing: 'border-box', background: '#1e293b',
                border: '1px solid #334155', borderRadius: 5,
                padding: '6px 24px 6px 24px', color: '#e2e8f0', fontSize: 12, outline: 'none'
              }}
            />
            {searchQ && (
              <button onClick={() => setSearchQ('')} style={{
                position: 'absolute', right: 5, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 0
              }}>
                <X size={11} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Scrollable Content ── */}
      <div style={{ flex: 1, overflowY: 'auto' }}>

        {/* ══ LIVE TAB ══ */}
        {tab === 'live' && (
          liveList.length === 0
            ? (
              <div style={{ color: '#64748b', textAlign: 'center', padding: 30, fontSize: 12 }}>
                <RefreshCw size={18} color="#334155" style={{ marginBottom: 8 }} /><br />
                Fetching NSE prices…<br />
                <span style={{ fontSize: 10, color: '#334155' }}>Usually takes ~5 seconds</span>
              </div>
            )
            : liveList.map(([sym, p]) => (
              <PriceRow key={sym}
                symbol={sym} name={p.name} exchange={p.exchange || 'NSE'} price={p}
                onSelect={onSelectSymbol}
                onAdd={addToWatchlist}
                inWatchlist={watchSet.has(`${p.exchange || 'NSE'}:${sym}`)}
              />
            ))
        )}

        {/* ══ WATCHLIST TAB ══ */}
        {tab === 'watchlist' && (
          watchlist.length === 0
            ? (
              <div style={{ color: '#64748b', textAlign: 'center', padding: 30, fontSize: 12 }}>
                No stocks.{' '}
                <span style={{ color: '#6366f1', cursor: 'pointer' }} onClick={() => setTab('search')}>
                  Search to add →
                </span>
              </div>
            )
            : watchlist.map(item => {
              // Robust price resolution for watchlist items
              const sym = item.trading_symbol || '';
              const base = sym.replace(/-EQ$/i, '');
              const lp = prices[sym] || prices[base] || prices[sym + '-EQ'] || null;
              const isUp = (lp?.changePct ?? 0) >= 0;
              const dispName = (item.display_name || item.trading_symbol || '').replace(/-EQ$/i, '');
              const idx = isIndex(sym);
              const isExpW = expandedWatch === item.id;

              return (
                <React.Fragment key={item.id}>
                  <div className="price-row" style={{
                    display: 'flex', alignItems: 'center', padding: '6px 10px',
                    borderBottom: '1px solid #080e1a', cursor: 'pointer',
                    background: isExpW ? 'rgba(99,102,241,0.06)' : 'transparent'
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}
                      onClick={() => {
                        onSelectSymbol?.(item.trading_symbol, item.exchange);
                        setExpandedWatch(isExpW ? null : item.id);
                      }}>
                      <div style={{
                        fontSize: 12, fontWeight: 600, color: '#e2e8f0',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        display: 'flex', alignItems: 'center', gap: 4
                      }}>
                        {dispName}
                        {idx && <span style={{ fontSize: 7, background: '#312e81', color: '#a5b4fc', padding: '0 3px', borderRadius: 2 }}>IDX</span>}
                      </div>
                      <div style={{ fontSize: 10, color: '#475569' }}>{item.exchange}</div>
                    </div>

                    {lp?.ltp > 0 ? (
                      <div style={{ textAlign: 'right', marginRight: 6 }}
                        onClick={() => {
                          onSelectSymbol?.(item.trading_symbol, item.exchange);
                          setExpandedWatch(isExpW ? null : item.id);
                        }}>
                        <div style={{
                          fontSize: 12, fontWeight: 700, fontFamily: 'monospace',
                          color: isUp ? '#22c55e' : '#ef4444'
                        }}>
                          ₹{fmt(lp.ltp)}
                        </div>
                        <div style={{ fontSize: 10, color: isUp ? '#22c55e' : '#ef4444' }}>
                          {isUp ? '+' : ''}{fmt(lp.changePct)}%
                        </div>
                      </div>
                    ) : (
                      <div style={{ marginRight: 6, fontSize: 9, color: '#334155' }}>—</div>
                    )}

                    <button onClick={() => setExpandedWatch(isExpW ? null : item.id)} style={{
                      background: 'none', border: 'none', cursor: 'pointer', padding: 2,
                      color: isExpW ? '#6366f1' : '#334155'
                    }}>
                      {isExpW ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                    </button>

                    <button onClick={() => removeFromWatchlist(item.id)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: '#ef4444', opacity: 0.5, padding: 2
                      }}>
                      <X size={11} />
                    </button>
                  </div>

                  {/* Expanded OHLC detail in watchlist */}
                  {isExpW && lp && (
                    <OHLCDetail
                      symbol={item.trading_symbol}
                      price={{ ...lp, name: dispName, exchange: item.exchange }}
                      onClose={() => setExpandedWatch(null)}
                      onOpenChart={(sym, exch) => onSelectSymbol?.(sym, exch)}
                    />
                  )}
                </React.Fragment>
              );
            })
        )}

        {/* ══ SEARCH TAB ══ */}
        {tab === 'search' && (
          searching
            ? (
              <div style={{ color: '#64748b', textAlign: 'center', padding: 20, fontSize: 12 }}>
                <RefreshCw size={14} color="#334155" style={{ marginBottom: 6, animation: 'spin 1s linear infinite' }} /><br />
                Searching…
                <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
              </div>
            )
            : searchQ.length < 2
              ? (
                <div style={{ color: '#475569', textAlign: 'center', padding: 20, fontSize: 11 }}>
                  <Info size={16} color="#334155" style={{ marginBottom: 8 }} /><br />
                  Type symbol or company name<br />
                  <span style={{ color: '#334155', fontSize: 10 }}>
                    e.g. RELIANCE, NIFTY 50, BANKNIFTY, GOLD
                  </span>
                </div>
              )
              : results.length === 0
                ? (
                  <div style={{ color: '#64748b', textAlign: 'center', padding: 30, fontSize: 12 }}>
                    No results for "{searchQ}"
                  </div>
                )
                : results.map((inst, i) => {
                  const lp = resolvePrice(prices, inst);
                  return (
                    <SearchResultRow
                      key={`${inst.exchange || inst.exch}:${inst.trading_symbol}:${i}`}
                      inst={inst}
                      livePrice={lp}
                      inWatchlist={inWatchlist(inst)}
                      onSelect={onSelectSymbol}
                      onAdd={addToWatchlist}
                      isExpanded={expandedIdx === i}
                      onToggleExpand={() => setExpandedIdx(expandedIdx === i ? null : i)}
                      onOpenChart={(sym, exch) => onSelectSymbol?.(sym, exch)}
                    />
                  );
                })
        )}
      </div>

      {/* ── Footer ── */}
      <div style={{
        padding: '4px 10px', borderTop: '1px solid #1e293b', flexShrink: 0,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontSize: 9, color: '#334155'
      }}>
        <span>{liveList.length} live · {watchlist.length} watched</span>
        <span style={{ color: isAB ? '#3b82f6' : '#22c55e' }}>
          {isAB ? '⚡ Real-time' : '● NSE prices'} · 3s refresh
        </span>
      </div>
    </div>
  );
}