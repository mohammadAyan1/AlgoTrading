


import React, { useState, useEffect, useRef, useCallback } from 'react';
import { clientAPI, orderAPI, marketAPI } from '../services/api';
import { useLivePrices } from '../context/WSContext';
import { useContractMaster } from '../context/ContractMasterContext';
import toast from 'react-hot-toast';
import { ShoppingCart, TrendingUp, TrendingDown, Users, CheckSquare, Square, Search, X, RefreshCw } from 'lucide-react';

const S = {
  input: { background: '#0f172a', border: '1px solid #334155', borderRadius: 6, padding: '8px 12px', color: '#e2e8f0', fontSize: 13, width: '100%', boxSizing: 'border-box', outline: 'none' },
  label: { color: '#94a3b8', fontSize: 11, marginBottom: 4, display: 'block', fontWeight: 600 },
  select: { background: '#0f172a', border: '1px solid #334155', borderRadius: 6, padding: '8px 12px', color: '#e2e8f0', fontSize: 13, width: '100%', outline: 'none' },
};

const EXCH_COLOR = { NSE: '#3b82f6', BSE: '#f59e0b', NFO: '#8b5cf6', MCX: '#ef4444', CDS: '#22c55e', BCD: '#06b6d4', BFO: '#a78bfa' };

// ─── Shared Symbol Search Component ───────────────────────────────────────
// Uses ContractMasterContext (real Alice Blue tokens)
export function SymbolSearch({ value, token, onSelect, placeholder, filterExchange }) {
  const { search, loading: cmLoading, reload } = useContractMaster();
  const { getPrice } = useLivePrices();

  const [query, setQuery] = useState(value || '');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const timer = useRef(null);
  const boxRef = useRef(null);

  useEffect(() => { setQuery(value || ''); }, [value]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    clearTimeout(timer.current);
    if (query.length < 1) { setResults([]); return; }
    timer.current = setTimeout(async () => {
      try {
        // Use contract master search (fast local)
        const localResults = search(query, filterExchange || null, 25);
        setResults(localResults);
        // Optionally also call marketAPI for live data (if needed)
        // const apiResults = await marketAPI.searchInstruments(query);
        // setResults(apiResults.data.data);
      } catch (err) {
        console.error('Symbol search error:', err);
        setResults([]);
      }
    }, 150);
  }, [query, filterExchange, search]);

  const pick = (inst) => {
    try {
      setQuery(inst.trading_symbol);
      setOpen(false);
      setResults([]);
      onSelect(inst);
    } catch (err) {
      console.error('Symbol selection error:', err);
      toast.error('Error selecting symbol');
    }
  };

  const clear = () => {
    try {
      setQuery('');
      setResults([]);
      onSelect({ trading_symbol: '', symbol: '', token: '', exchange: 'NSE' });
    } catch (err) {
      console.error('Clear error:', err);
    }
  };

  const hasToken = token && String(token).trim() !== '';

  return (
    <div ref={boxRef} style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <Search size={11} color="#64748b" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        <input
          style={{ ...S.input, paddingLeft: 28, paddingRight: 56, borderColor: hasToken ? '#22c55e' : '#f59e0b' }}
          value={query}
          onChange={e => { setQuery(e.target.value.toUpperCase()); setOpen(true); if (hasToken) onSelect({ trading_symbol: e.target.value.toUpperCase(), symbol: '', token: '', exchange: 'NSE' }); }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder || 'Type: SBIN, CRUDEOIL, GOLD, NIFTY…'}
        />
        <div style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: 2 }}>
          {cmLoading && <RefreshCw size={11} color="#64748b" style={{ animation: 'spin 1s linear infinite' }} />}
          {query && <button onClick={clear} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 2 }}><X size={11} /></button>}
        </div>
      </div>

      {/* Token status */}
      <div style={{ fontSize: 10, marginTop: 2, color: hasToken ? '#22c55e' : '#f59e0b' }}>
        {hasToken
          ? `✓ Token: ${token}  (instrument confirmed)`
          : query.length < 1
            ? 'Symbol type karo — dropdown se select karo'
            : '⚠ Dropdown se select karo (token auto-fill hoga)'}
      </div>

      {/* Dropdown */}
      {open && query.length >= 1 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 9999,
          background: '#1e293b', border: '1px solid #334155', borderRadius: 8,
          maxHeight: 260, overflowY: 'auto', boxShadow: '0 12px 40px rgba(0,0,0,0.7)'
        }}>
          {results.length === 0 ? (
            <div style={{ padding: '12px', color: '#64748b', fontSize: 12 }}>
              No results for "{query}"
              <div style={{ fontSize: 10, color: '#475569', marginTop: 3 }}>
                Try: RELIANCE, CRUDEOIL, GOLD, NIFTY 50
              </div>
            </div>
          ) : results.map((inst, i) => {
            const lp = getPrice(inst.trading_symbol) || getPrice(inst.symbol);
            const isUp = (lp?.changePct || 0) >= 0;
            const eColor = EXCH_COLOR[inst.exchange] || '#64748b';
            return (
              <div key={i} onClick={() => pick(inst)}
                style={{
                  padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #0f172a',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#334155'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                    <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 12 }}>{inst.trading_symbol}</span>
                    <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: eColor + '22', color: eColor, fontWeight: 700 }}>{inst.exchange}</span>
                    {inst.expiry && <span style={{ fontSize: 9, color: '#a78bfa' }}>{inst.expiry}</span>}
                    {inst.option_type && inst.option_type !== 'XX' && (
                      <span style={{ fontSize: 9, color: inst.option_type === 'CE' ? '#22c55e' : '#ef4444', fontWeight: 700 }}>{inst.option_type} {inst.strike_price}</span>
                    )}
                  </div>
                  <div style={{ fontSize: 10, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {inst.formatted_name}
                    {inst.lot_size > 1 && <span style={{ color: '#475569', marginLeft: 6 }}>Lot:{inst.lot_size}</span>}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  {lp?.ltp > 0 ? (
                    <>
                      <div style={{ fontSize: 12, fontWeight: 700, fontFamily: 'monospace', color: isUp ? '#22c55e' : '#ef4444' }}>₹{lp.ltp.toFixed(2)}</div>
                      <div style={{ fontSize: 10, color: isUp ? '#22c55e' : '#ef4444' }}>{isUp ? '+' : ''}{lp.changePct?.toFixed(2)}%</div>
                    </>
                  ) : (
                    <div style={{ fontSize: 9, color: '#475569' }}>#{inst.token}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main OrderPanel Component ────────────────────────────────────────────
export default function OrderPanel({ selectedSymbol }) {
  const { getPrice } = useLivePrices();

  const [clients, setClients] = useState([]);
  const [selectedClients, setSelectedClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState({
    tradingSymbol: '',
    exchange: 'NSE',
    transactionType: 'BUY',
    orderType: 'MARKET',
    product: 'INTRADAY',
    validity: 'DAY',
    quantity: 1,
    price: 0,
    orderComplexity: 'REGULAR',
    instrumentId: '',
  });

  // Load clients with error handling
  useEffect(() => {
    const loadClients = async () => {
      try {
        const res = await clientAPI.getSessions();
        const all = res.data.data || [];
        const active = all.filter(c => c.session_status === 'active');
        setClients(all);
        if (active.length) setSelectedClients([active[0].id]);
      } catch (err) {
        console.error('Failed to load clients:', err);
        toast.error('Unable to load clients. Check your connection.');
      }
    };
    loadClients();
  }, []);

  // Update symbol when selected from ticker
  useEffect(() => {
    try {
      if (selectedSymbol) setOrder(o => ({ ...o, tradingSymbol: selectedSymbol, instrumentId: '' }));
    } catch (err) {
      console.error('Error updating symbol:', err);
    }
  }, [selectedSymbol]);

  const handleSymbolSelect = useCallback((inst) => {
    try {
      setOrder(o => ({
        ...o,
        tradingSymbol: inst.trading_symbol || inst.symbol || o.tradingSymbol,
        exchange: inst.exchange || o.exchange,
        instrumentId: inst.token || '',
      }));
    } catch (err) {
      console.error('Symbol select error:', err);
      toast.error('Error selecting symbol');
    }
  }, []);

  const toggleClient = (id) => {
    try {
      setSelectedClients(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
    } catch (err) {
      console.error('Toggle client error:', err);
    }
  };

  const selectAll = () => {
    try {
      setSelectedClients(clients.filter(c => c.session_status === 'active').map(c => c.id));
    } catch (err) {
      console.error('Select all error:', err);
    }
  };

  const handlePlaceOrder = async () => {
    try {
      if (!selectedClients.length) { toast.error('Client select karo'); return; }
      if (!order.tradingSymbol) { toast.error('Symbol select karo'); return; }
      if (!order.instrumentId) { toast.error('Symbol dropdown se select karo (token auto-fill hoga)'); return; }

      setLoading(true);
      if (selectedClients.length === 1) {
        const res = await orderAPI.placeOrder(selectedClients[0], order);
        const d = res.data.data;
        if (d?.status === 'Ok') {
          toast.success(`✅ Order placed! ID: ${d.result?.[0]?.orderNumber || 'OK'}`);
        } else {
          toast.error(`❌ ${d?.message || JSON.stringify(d)}`);
        }
      } else {
        const res = await orderAPI.placeBulkOrder({
          clientIds: selectedClients,
          orderData: order,
          groupName: `${order.transactionType}-${order.tradingSymbol}`
        });
        toast.success(res.data.message);
      }
    } catch (err) {
      console.error('Place order error:', err);
      toast.error(err.response?.data?.message || err.message || 'Order failed');
    } finally {
      setLoading(false);
    }
  };

  const livePrice = getPrice(order.tradingSymbol);
  const isBuy = order.transactionType === 'BUY';

  return (
    <div className="order-panel">
      <style>{`
        .order-panel {
          background: #0f172a;
          border-radius: 8px;
          overflow: hidden;
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        .order-header {
          background: #1e293b;
          padding: 10px 14px;
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }
        .order-header h3 {
          color: #e2e8f0;
          font-weight: 700;
          font-size: 13px;
          margin: 0;
        }
        .live-price-header {
          margin-left: auto;
          font-family: monospace;
          font-weight: 700;
          font-size: 13px;
        }
        .order-content {
          flex: 1;
          overflow-y: auto;
          padding: 14px;
        }
        .buy-sell-row {
          display: flex;
          gap: 4px;
          margin-bottom: 14px;
        }
        .buy-sell-btn {
          flex: 1;
          padding: 9px 0;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 700;
          font-size: 13px;
          transition: all 0.2s;
        }
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 12px;
        }
        .client-list {
          margin-bottom: 14px;
        }
        .client-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 7px 10px;
          margin-bottom: 4px;
          border-radius: 6px;
          border: 1px solid #334155;
          cursor: pointer;
        }
        .client-item.selected {
          background: #1e3a5f;
          border-color: #3b82f6;
        }
        .client-item.inactive {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .place-order-btn {
          width: 100%;
          padding: 12px 0;
          border: none;
          border-radius: 6px;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .place-order-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .order-content {
            padding: 10px;
          }
          .buy-sell-btn {
            font-size: 12px;
            padding: 7px 0;
          }
          .form-grid {
            gap: 8px;
          }
        }
        @media (max-width: 480px) {
          .order-header {
            padding: 8px 10px;
          }
          .order-header h3 {
            font-size: 12px;
          }
          .live-price-header {
            font-size: 12px;
          }
          .form-grid {
            grid-template-columns: 1fr;
          }
          .client-item {
            padding: 5px 8px;
          }
          .place-order-btn {
            font-size: 13px;
            padding: 10px 0;
          }
        }
      `}</style>

      <div className="order-header">
        <ShoppingCart size={15} color="#6366f1" />
        <h3>Place Order</h3>
        {livePrice?.ltp > 0 && (
          <span className="live-price-header" style={{
            color: livePrice.changePct >= 0 ? '#22c55e' : '#ef4444'
          }}>
            ₹{livePrice.ltp.toFixed(2)}
            <span style={{ fontSize: 10, marginLeft: 4, color: '#64748b' }}>
              {livePrice.changePct >= 0 ? '+' : ''}{livePrice.changePct?.toFixed(2)}%
            </span>
          </span>
        )}
      </div>

      <div className="order-content">
        {/* BUY / SELL */}
        <div className="buy-sell-row">
          {['BUY', 'SELL'].map(t => (
            <button
              key={t}
              onClick={() => setOrder(o => ({ ...o, transactionType: t }))}
              className="buy-sell-btn"
              style={{
                background: order.transactionType === t ? (t === 'BUY' ? '#166534' : '#7f1d1d') : '#1e293b',
                color: order.transactionType === t ? (t === 'BUY' ? '#22c55e' : '#ef4444') : '#64748b'
              }}
            >
              {t === 'BUY' ? <TrendingUp size={13} style={{ display: 'inline', marginRight: 4 }} /> : <TrendingDown size={13} style={{ display: 'inline', marginRight: 4 }} />}
              {t}
            </button>
          ))}
        </div>

        <div className="form-grid">
          <div style={{ gridColumn: '1/-1' }}>
            <label style={S.label}>Symbol — NSE / BSE / NFO / MCX / CDS / BFO</label>
            <SymbolSearch
              value={order.tradingSymbol}
              token={order.instrumentId}
              onSelect={handleSymbolSelect}
              placeholder="Type: SBIN, CRUDEOIL, GOLDM, NIFTY 50…"
            />
          </div>

          <div>
            <label style={S.label}>Exchange</label>
            <select style={S.select} value={order.exchange}
              onChange={e => setOrder(o => ({ ...o, exchange: e.target.value, instrumentId: '' }))}>
              {['NSE', 'BSE', 'NFO', 'MCX', 'CDS', 'BCD', 'BFO'].map(ex => <option key={ex}>{ex}</option>)}
            </select>
          </div>

          <div>
            <label style={S.label}>Quantity</label>
            <input style={S.input} type="number" min="1" value={order.quantity}
              onChange={e => setOrder(o => ({ ...o, quantity: parseInt(e.target.value) || 1 }))} />
          </div>

          <div>
            <label style={S.label}>Order Type</label>
            <select style={S.select} value={order.orderType}
              onChange={e => setOrder(o => ({ ...o, orderType: e.target.value }))}>
              {['MARKET', 'LIMIT', 'SL', 'SLM'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label style={S.label}>Product</label>
            <select style={S.select} value={order.product}
              onChange={e => setOrder(o => ({ ...o, product: e.target.value }))}>
              <option value="INTRADAY">INTRADAY (MIS)</option>
              <option value="LONGTERM">DELIVERY (CNC)</option>
              <option value="MTF">MTF</option>
            </select>
          </div>

          {order.orderType !== 'MARKET' && (
            <div style={{ gridColumn: '1/-1' }}>
              <label style={S.label}>Price (₹)</label>
              <input style={S.input} type="number" step="0.05" value={order.price}
                onChange={e => setOrder(o => ({ ...o, price: parseFloat(e.target.value) || 0 }))} />
            </div>
          )}
        </div>

        {/* Clients */}
        <div className="client-list">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <label style={{ ...S.label, margin: 0 }}><Users size={11} style={{ display: 'inline', marginRight: 4 }} />Clients</label>
            <button onClick={selectAll} style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>
              All Active
            </button>
          </div>
          {clients.length === 0 ? (
            <p style={{ color: '#64748b', fontSize: 12 }}>Koi client nahi. Pehle client add karo.</p>
          ) : (
            clients.map(c => {
              const sel = selectedClients.includes(c.id), act = c.session_status === 'active';
              return (
                <div
                  key={c.id}
                  onClick={() => act && toggleClient(c.id)}
                  className={`client-item ${sel ? 'selected' : ''} ${!act ? 'inactive' : ''}`}
                >
                  {sel ? <CheckSquare size={13} color="#3b82f6" /> : <Square size={13} color="#64748b" />}
                  <span style={{ color: '#e2e8f0', fontSize: 12, flex: 1 }}>{c.name}</span>
                  <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 10, background: act ? '#14532d' : '#450a0a', color: act ? '#22c55e' : '#ef4444' }}>
                    {act ? 'Active' : 'Inactive'}
                  </span>
                </div>
              );
            })
          )}
        </div>

        <button
          onClick={handlePlaceOrder}
          disabled={loading || !selectedClients.length || !order.tradingSymbol || !order.instrumentId}
          className="place-order-btn"
          style={{
            background: isBuy ? '#22c55e' : '#ef4444',
            color: 'white'
          }}
        >
          {loading ? 'Placing…' : `${order.transactionType} ${order.tradingSymbol || '(select symbol)'}${selectedClients.length > 1 ? ` (${selectedClients.length} clients)` : ''}`}
        </button>
      </div>
    </div>
  );
}



// import React, { useState, useEffect, useRef, useCallback } from 'react';
// import { clientAPI, orderAPI, marketAPI } from '../services/api';
// import { useLivePrices } from '../context/WSContext';
// import { useContractMaster } from '../context/ContractMasterContext';
// import toast from 'react-hot-toast';
// import {
//   ShoppingCart, TrendingUp, TrendingDown, Users,
//   CheckSquare, Square, Search, X, RefreshCw,
//   AlertCircle, Activity, BarChart2
// } from 'lucide-react';

// const S = {
//   input: { background: '#0f172a', border: '1px solid #334155', borderRadius: 6, padding: '8px 12px', color: '#e2e8f0', fontSize: 13, width: '100%', boxSizing: 'border-box', outline: 'none' },
//   label: { color: '#94a3b8', fontSize: 11, marginBottom: 4, display: 'block', fontWeight: 600 },
//   select: { background: '#0f172a', border: '1px solid #334155', borderRadius: 6, padding: '8px 12px', color: '#e2e8f0', fontSize: 13, width: '100%', outline: 'none' },
// };

// const EXCH_COLOR = {
//   NSE: '#3b82f6', BSE: '#f59e0b', NFO: '#8b5cf6',
//   MCX: '#ef4444', CDS: '#22c55e', BCD: '#06b6d4', BFO: '#a78bfa'
// };

// const INST_COLOR = {
//   FUTIDX: '#f59e0b', FUTSTK: '#fb923c',
//   OPTIDX: '#a78bfa', OPTSTK: '#c084fc',
//   EQ: '#3b82f6'
// };

// // ─── Live F&O Quote Hook ──────────────────────────────────────────────────
// // Fetches price from backend if not available in WebSocket cache
// function useFnoQuote(symbol, exchange, token) {
//   const { getPrice } = useLivePrices();
//   const [quote, setQuote] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const fetchRef = useRef(null);

//   useEffect(() => {
//     if (!symbol && !token) { setQuote(null); return; }

//     // Check WS cache first
//     const lp = getPrice(symbol);
//     if (lp?.ltp > 0) { setQuote(lp); return; }

//     // Debounce fetch
//     clearTimeout(fetchRef.current);
//     fetchRef.current = setTimeout(async () => {
//       if (!token && !symbol) return;
//       setLoading(true);
//       try {
//         const res = await marketAPI.getQuote(exchange, token, symbol);
//         if (res.data?.data) setQuote(res.data.data);
//       } catch {
//         // silent
//       } finally {
//         setLoading(false);
//       }
//     }, 400);

//     return () => clearTimeout(fetchRef.current);
//   }, [symbol, token, exchange]);

//   // Keep refreshing from WS
//   const lp = getPrice(symbol);
//   const finalQuote = (lp?.ltp > 0) ? lp : quote;
//   return { quote: finalQuote, loading };
// }

// // ─── F&O Details Badge ───────────────────────────────────────────────────
// function InstBadge({ type, small }) {
//   const color = INST_COLOR[type] || '#64748b';
//   return (
//     <span style={{
//       fontSize: small ? 8 : 9, padding: small ? '1px 4px' : '1px 5px',
//       borderRadius: 3, background: color + '22', color, fontWeight: 700,
//     }}>
//       {type === 'FUTIDX' ? 'IDX FUT' : type === 'FUTSTK' ? 'STK FUT' :
//         type === 'OPTIDX' ? 'IDX OPT' : type === 'OPTSTK' ? 'STK OPT' : type || 'EQ'}
//     </span>
//   );
// }

// // ─── Live Quote Display ───────────────────────────────────────────────────
// // Shows LTP, change%, OI, bid/ask in a compact broker-style panel
// function LiveQuotePanel({ symbol, exchange, token, instMeta, compact }) {
//   const { quote, loading } = useFnoQuote(symbol, exchange, token);
//   const isUp = (quote?.changePct ?? 0) >= 0;

//   if (loading && !quote) {
//     return (
//       <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#64748b', padding: '4px 0' }}>
//         <RefreshCw size={10} style={{ animation: 'spin 1s linear infinite' }} /> Fetching live price…
//       </div>
//     );
//   }

//   if (!quote || !quote.ltp) {
//     return (
//       <div style={{ fontSize: 10, color: '#475569', padding: '4px 0', display: 'flex', alignItems: 'center', gap: 4 }}>
//         <AlertCircle size={10} /> Price unavailable — login a client for live F&amp;O prices
//       </div>
//     );
//   }

//   if (compact) {
//     return (
//       <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
//         <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'monospace', color: isUp ? '#22c55e' : '#ef4444' }}>
//           ₹{quote.ltp?.toFixed(2)}
//         </span>
//         <span style={{ fontSize: 10, color: isUp ? '#22c55e' : '#ef4444', display: 'flex', alignItems: 'center', gap: 2 }}>
//           {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
//           {isUp ? '+' : ''}{quote.changePct?.toFixed(2)}%
//         </span>
//         {quote.oi > 0 && (
//           <span style={{ fontSize: 9, color: '#64748b' }}>OI: {(quote.oi / 1000).toFixed(1)}K</span>
//         )}
//       </div>
//     );
//   }

//   return (
//     <div style={{ background: '#1e293b', borderRadius: 6, padding: '8px 10px', marginTop: 6 }}>
//       {/* Main price row */}
//       <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
//         <div>
//           <span style={{ fontSize: 20, fontWeight: 800, fontFamily: 'monospace', color: isUp ? '#22c55e' : '#ef4444' }}>
//             ₹{quote.ltp?.toFixed(2)}
//           </span>
//           <span style={{ fontSize: 11, color: isUp ? '#22c55e' : '#ef4444', marginLeft: 8, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
//             {isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
//             {quote.change >= 0 ? '+' : ''}{quote.change?.toFixed(2)} ({isUp ? '+' : ''}{quote.changePct?.toFixed(2)}%)
//           </span>
//         </div>
//         {instMeta?.lot_size > 1 && (
//           <span style={{ fontSize: 10, color: '#94a3b8', background: '#0f172a', padding: '2px 6px', borderRadius: 4 }}>
//             Lot: {instMeta.lot_size}
//           </span>
//         )}
//       </div>

//       {/* OHLC Grid */}
//       <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '3px 8px', fontSize: 10, marginBottom: 6 }}>
//         {[
//           ['Open', quote.open, '#94a3b8'],
//           ['High', quote.high, '#22c55e'],
//           ['Low', quote.low, '#ef4444'],
//           ['Prev', quote.prevClose, '#64748b'],
//         ].map(([label, val, color]) => (
//           <div key={label}>
//             <div style={{ color: '#475569' }}>{label}</div>
//             <div style={{ color, fontWeight: 600, fontFamily: 'monospace' }}>₹{val?.toFixed(2) || '—'}</div>
//           </div>
//         ))}
//       </div>

//       {/* Volume, OI, Bid/Ask */}
//       <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 8px', fontSize: 10 }}>
//         {quote.volume > 0 && (
//           <div>
//             <span style={{ color: '#475569' }}>Vol: </span>
//             <span style={{ color: '#94a3b8', fontWeight: 600 }}>{quote.volume?.toLocaleString('en-IN')}</span>
//           </div>
//         )}
//         {quote.oi > 0 && (
//           <div>
//             <span style={{ color: '#475569' }}>OI: </span>
//             <span style={{ color: '#a78bfa', fontWeight: 600 }}>{quote.oi?.toLocaleString('en-IN')}</span>
//           </div>
//         )}
//         {quote.bid > 0 && (
//           <div>
//             <span style={{ color: '#475569' }}>Bid: </span>
//             <span style={{ color: '#22c55e', fontWeight: 600, fontFamily: 'monospace' }}>
//               ₹{quote.bid?.toFixed(2)} {quote.bidQty > 0 && `(${quote.bidQty})`}
//             </span>
//           </div>
//         )}
//         {quote.ask > 0 && (
//           <div>
//             <span style={{ color: '#475569' }}>Ask: </span>
//             <span style={{ color: '#ef4444', fontWeight: 600, fontFamily: 'monospace' }}>
//               ₹{quote.ask?.toFixed(2)} {quote.askQty > 0 && `(${quote.askQty})`}
//             </span>
//           </div>
//         )}
//         {quote.upperCircuit > 0 && (
//           <div>
//             <span style={{ color: '#475569' }}>UC: </span>
//             <span style={{ color: '#22c55e', fontWeight: 600, fontFamily: 'monospace' }}>₹{quote.upperCircuit?.toFixed(2)}</span>
//           </div>
//         )}
//         {quote.lowerCircuit > 0 && (
//           <div>
//             <span style={{ color: '#475569' }}>LC: </span>
//             <span style={{ color: '#ef4444', fontWeight: 600, fontFamily: 'monospace' }}>₹{quote.lowerCircuit?.toFixed(2)}</span>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// // ─── Shared Symbol Search Component ──────────────────────────────────────
// export function SymbolSearch({ value, token, onSelect, placeholder, filterExchange }) {
//   const { search, loading: cmLoading } = useContractMaster();
//   const { getPrice } = useLivePrices();

//   const [query, setQuery] = useState(value || '');
//   const [results, setResults] = useState([]);
//   const [open, setOpen] = useState(false);
//   const [selectedInst, setSelectedInst] = useState(null);
//   const timer = useRef(null);
//   const boxRef = useRef(null);

//   useEffect(() => { setQuery(value || ''); }, [value]);

//   useEffect(() => {
//     const handleClickOutside = (e) => {
//       if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
//     };
//     document.addEventListener('mousedown', handleClickOutside);
//     return () => document.removeEventListener('mousedown', handleClickOutside);
//   }, []);

//   useEffect(() => {
//     clearTimeout(timer.current);
//     if (query.length < 1) { setResults([]); return; }
//     timer.current = setTimeout(() => {
//       try {
//         const localResults = search(query, filterExchange || null, 30);
//         setResults(localResults);
//       } catch {
//         setResults([]);
//       }
//     }, 150);
//   }, [query, filterExchange, search]);

//   const pick = (inst) => {
//     try {
//       setQuery(inst.trading_symbol);
//       setOpen(false);
//       setResults([]);
//       setSelectedInst(inst);
//       onSelect(inst);

//       // ✅ Auto-subscribe to Alice Blue WebSocket for live price
//       if (inst.token && inst.exchange) {
//         marketAPI.subscribeSymbols([{
//           token: inst.token,
//           symbol: inst.trading_symbol,
//           exchange: inst.exchange,
//           name: inst.formatted_name || inst.trading_symbol,
//         }]).catch(() => { });
//       }
//     } catch (err) {
//       toast.error('Error selecting symbol');
//     }
//   };

//   const clear = () => {
//     setQuery('');
//     setResults([]);
//     setSelectedInst(null);
//     onSelect({ trading_symbol: '', symbol: '', token: '', exchange: 'NSE' });
//   };

//   const hasToken = token && String(token).trim() !== '';
//   const isFno = selectedInst && ['NFO', 'MCX', 'CDS', 'BFO', 'BCD'].includes(selectedInst?.exchange);

//   return (
//     <div ref={boxRef} style={{ position: 'relative' }}>
//       {/* Search input */}
//       <div style={{ position: 'relative' }}>
//         <Search size={11} color="#64748b" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
//         <input
//           style={{ ...S.input, paddingLeft: 28, paddingRight: 56, borderColor: hasToken ? '#22c55e' : '#f59e0b' }}
//           value={query}
//           onChange={e => {
//             setQuery(e.target.value.toUpperCase());
//             setOpen(true);
//             setSelectedInst(null);
//             if (hasToken) onSelect({ trading_symbol: e.target.value.toUpperCase(), symbol: '', token: '', exchange: 'NSE' });
//           }}
//           onFocus={() => setOpen(true)}
//           placeholder={placeholder || 'SBIN-EQ, NIFTY25MARFUT, BANKNIFTY…'}
//         />
//         <div style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: 2 }}>
//           {cmLoading && <RefreshCw size={11} color="#64748b" style={{ animation: 'spin 1s linear infinite' }} />}
//           {query && <button onClick={clear} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 2 }}><X size={11} /></button>}
//         </div>
//       </div>

//       {/* Token status */}
//       <div style={{ fontSize: 10, marginTop: 2, color: hasToken ? '#22c55e' : '#f59e0b' }}>
//         {hasToken
//           ? `✓ Token: ${token} (instrument confirmed)`
//           : query.length < 1
//             ? 'Symbol type karo — dropdown se select karo for live price'
//             : '⚠ Dropdown se select karo (token auto-fill hoga)'}
//       </div>

//       {/* ✅ F&O Live Quote Panel — shown after selection */}
//       {selectedInst && hasToken && (
//         <LiveQuotePanel
//           symbol={selectedInst.trading_symbol}
//           exchange={selectedInst.exchange}
//           token={selectedInst.token}
//           instMeta={selectedInst}
//           compact={false}
//         />
//       )}

//       {/* Dropdown */}
//       {open && query.length >= 1 && (
//         <div style={{
//           position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 9999,
//           background: '#1e293b', border: '1px solid #334155', borderRadius: 8,
//           maxHeight: 320, overflowY: 'auto', boxShadow: '0 12px 40px rgba(0,0,0,0.7)'
//         }}>
//           {results.length === 0 ? (
//             <div style={{ padding: '12px', color: '#64748b', fontSize: 12 }}>
//               No results for "{query}"
//               <div style={{ fontSize: 10, color: '#475569', marginTop: 3 }}>
//                 Try: NIFTY25MARFUT, BANKNIFTY25MARFUT, RELIANCE-EQ, CRUDEOIL
//               </div>
//             </div>
//           ) : results.map((inst, i) => {
//             const lp = getPrice(inst.trading_symbol) || getPrice(inst.symbol);
//             const isUp = (lp?.changePct || 0) >= 0;
//             const eColor = EXCH_COLOR[inst.exchange] || '#64748b';
//             const iType = inst.instrument_type || '';
//             const isOption = iType.includes('OPT');
//             const isFuture = iType.includes('FUT');

//             return (
//               <div
//                 key={i}
//                 onClick={() => pick(inst)}
//                 style={{
//                   padding: '8px 12px',
//                   cursor: 'pointer',
//                   borderBottom: '1px solid #0f172a',
//                   transition: 'background 0.1s',
//                 }}
//                 onMouseEnter={e => e.currentTarget.style.background = '#334155'}
//                 onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
//               >
//                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
//                   {/* Left: symbol info */}
//                   <div style={{ minWidth: 0, flex: 1 }}>
//                     <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', marginBottom: 2 }}>
//                       <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 12 }}>{inst.trading_symbol}</span>
//                       <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: eColor + '22', color: eColor, fontWeight: 700 }}>
//                         {inst.exchange}
//                       </span>
//                       {iType && <InstBadge type={iType} small />}
//                       {isOption && inst.option_type && inst.option_type !== 'XX' && (
//                         <span style={{
//                           fontSize: 9, fontWeight: 800, padding: '1px 5px', borderRadius: 3,
//                           background: inst.option_type === 'CE' ? '#14532d' : '#450a0a',
//                           color: inst.option_type === 'CE' ? '#22c55e' : '#ef4444'
//                         }}>
//                           {inst.option_type}
//                         </span>
//                       )}
//                     </div>

//                     {/* F&O Details row */}
//                     <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', fontSize: 10 }}>
//                       {inst.expiry && (
//                         <span style={{ color: '#a78bfa' }}>📅 {inst.expiry}</span>
//                       )}
//                       {isOption && inst.strike_price && (
//                         <span style={{ color: '#f59e0b', fontWeight: 700 }}>Strike: ₹{inst.strike_price}</span>
//                       )}
//                       {inst.lot_size > 1 && (
//                         <span style={{ color: '#64748b' }}>Lot: {inst.lot_size}</span>
//                       )}
//                       {inst.tick_size && (
//                         <span style={{ color: '#475569' }}>Tick: {inst.tick_size}</span>
//                       )}
//                     </div>

//                     {inst.formatted_name && inst.formatted_name !== inst.trading_symbol && (
//                       <div style={{ fontSize: 10, color: '#475569', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
//                         {inst.formatted_name}
//                       </div>
//                     )}
//                   </div>

//                   {/* Right: live price (if available in WS cache) */}
//                   <div style={{ textAlign: 'right', flexShrink: 0 }}>
//                     {lp?.ltp > 0 ? (
//                       <>
//                         <div style={{ fontSize: 12, fontWeight: 700, fontFamily: 'monospace', color: isUp ? '#22c55e' : '#ef4444' }}>
//                           ₹{lp.ltp.toFixed(2)}
//                         </div>
//                         <div style={{ fontSize: 10, color: isUp ? '#22c55e' : '#ef4444' }}>
//                           {isUp ? '+' : ''}{lp.changePct?.toFixed(2)}%
//                         </div>
//                         {lp.oi > 0 && (
//                           <div style={{ fontSize: 9, color: '#a78bfa' }}>OI: {(lp.oi / 1000).toFixed(0)}K</div>
//                         )}
//                       </>
//                     ) : (
//                       <div style={{ fontSize: 9, color: '#334155', textAlign: 'right' }}>
//                         <div>#{inst.token}</div>
//                         <div style={{ color: '#475569', marginTop: 1 }}>Select for</div>
//                         <div style={{ color: '#475569' }}>live price</div>
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       )}
//     </div>
//   );
// }

// // ─── Main OrderPanel ──────────────────────────────────────────────────────
// export default function OrderPanel({ selectedSymbol }) {
//   const { getPrice } = useLivePrices();

//   const [clients, setClients] = useState([]);
//   const [selectedClients, setSelectedClients] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [selectedInst, setSelectedInst] = useState(null);
//   const [order, setOrder] = useState({
//     tradingSymbol: '',
//     exchange: 'NSE',
//     transactionType: 'BUY',
//     orderType: 'MARKET',
//     product: 'INTRADAY',
//     validity: 'DAY',
//     quantity: 1,
//     price: 0,
//     orderComplexity: 'REGULAR',
//     instrumentId: '',
//   });

//   useEffect(() => {
//     const loadClients = async () => {
//       try {
//         const res = await clientAPI.getSessions();
//         const all = res.data.data || [];
//         const active = all.filter(c => c.session_status === 'active');
//         setClients(all);
//         if (active.length) setSelectedClients([active[0].id]);
//       } catch (err) {
//         toast.error('Unable to load clients.');
//       }
//     };
//     loadClients();
//   }, []);

//   useEffect(() => {
//     try {
//       if (selectedSymbol) setOrder(o => ({ ...o, tradingSymbol: selectedSymbol, instrumentId: '' }));
//     } catch { }
//   }, [selectedSymbol]);

//   // Auto-set product based on exchange
//   useEffect(() => {
//     if (['NFO', 'MCX', 'CDS', 'BFO', 'BCD'].includes(order.exchange)) {
//       setOrder(o => ({ ...o, product: 'INTRADAY' }));
//     }
//   }, [order.exchange]);

//   // Auto-set lot size quantity when F&O instrument selected
//   const handleSymbolSelect = useCallback((inst) => {
//     try {
//       const isFno = ['NFO', 'MCX', 'CDS', 'BFO', 'BCD'].includes(inst.exchange);
//       setSelectedInst(inst.token ? inst : null);
//       setOrder(o => ({
//         ...o,
//         tradingSymbol: inst.trading_symbol || inst.symbol || o.tradingSymbol,
//         exchange: inst.exchange || o.exchange,
//         instrumentId: inst.token || '',
//         // F&O: default quantity = 1 lot
//         quantity: inst.lot_size > 1 ? inst.lot_size : o.quantity,
//         // F&O: INTRADAY by default
//         product: isFno ? 'INTRADAY' : o.product,
//       }));
//     } catch (err) {
//       toast.error('Error selecting symbol');
//     }
//   }, []);

//   const toggleClient = (id) => {
//     setSelectedClients(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
//   };

//   const selectAll = () => {
//     setSelectedClients(clients.filter(c => c.session_status === 'active').map(c => c.id));
//   };

//   const handlePlaceOrder = async () => {
//     try {
//       if (!selectedClients.length) { toast.error('Client select karo'); return; }
//       if (!order.tradingSymbol) { toast.error('Symbol select karo'); return; }
//       if (!order.instrumentId) { toast.error('Symbol dropdown se select karo (token auto-fill hoga)'); return; }
//       if (order.orderType !== 'MARKET' && (!order.price || order.price <= 0)) {
//         toast.error('Limit/SL order ke liye price enter karo'); return;
//       }

//       setLoading(true);
//       if (selectedClients.length === 1) {
//         const res = await orderAPI.placeOrder(selectedClients[0], order);
//         const d = res.data.data;
//         if (d?.status === 'Ok') {
//           toast.success(`✅ Order placed! ID: ${d.result?.[0]?.orderNumber || 'OK'}`);
//         } else {
//           toast.error(`❌ ${d?.message || JSON.stringify(d)}`);
//         }
//       } else {
//         const res = await orderAPI.placeBulkOrder({
//           clientIds: selectedClients,
//           orderData: order,
//           groupName: `${order.transactionType}-${order.tradingSymbol}`
//         });
//         toast.success(res.data.message);
//       }
//     } catch (err) {
//       toast.error(err.response?.data?.message || err.message || 'Order failed');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const livePrice = getPrice(order.tradingSymbol);
//   const isBuy = order.transactionType === 'BUY';
//   const isFno = ['NFO', 'MCX', 'CDS', 'BFO', 'BCD'].includes(order.exchange);
//   const lotSize = selectedInst?.lot_size || 1;
//   const totalQty = order.quantity;
//   const lots = lotSize > 1 ? Math.round(totalQty / lotSize) : null;

//   return (
//     <div className="order-panel">
//       <style>{`
//         @keyframes spin { to { transform: rotate(360deg); } }
//         .order-panel {
//           background: #0f172a;
//           border-radius: 8px;
//           overflow: hidden;
//           height: 100%;
//           display: flex;
//           flex-direction: column;
//         }
//         .order-header {
//           background: #1e293b;
//           padding: 10px 14px;
//           display: flex;
//           align-items: center;
//           gap: 8px;
//           flex-shrink: 0;
//         }
//         .order-header h3 {
//           color: #e2e8f0;
//           font-weight: 700;
//           font-size: 13px;
//           margin: 0;
//         }
//         .live-price-header {
//           margin-left: auto;
//           font-family: monospace;
//           font-weight: 700;
//           font-size: 13px;
//         }
//         .order-content {
//           flex: 1;
//           overflow-y: auto;
//           padding: 14px;
//         }
//         .buy-sell-row {
//           display: flex;
//           gap: 4px;
//           margin-bottom: 14px;
//         }
//         .buy-sell-btn {
//           flex: 1;
//           padding: 9px 0;
//           border: none;
//           border-radius: 6px;
//           cursor: pointer;
//           font-weight: 700;
//           font-size: 13px;
//           transition: all 0.2s;
//         }
//         .form-grid {
//           display: grid;
//           grid-template-columns: 1fr 1fr;
//           gap: 10px;
//           margin-bottom: 12px;
//         }
//         .client-list {
//           margin-bottom: 14px;
//         }
//         .client-item {
//           display: flex;
//           align-items: center;
//           gap: 8px;
//           padding: 7px 10px;
//           margin-bottom: 4px;
//           border-radius: 6px;
//           border: 1px solid #334155;
//           cursor: pointer;
//         }
//         .client-item.selected { background: #1e3a5f; border-color: #3b82f6; }
//         .client-item.inactive { opacity: 0.5; cursor: not-allowed; }
//         .place-order-btn {
//           width: 100%;
//           padding: 12px 0;
//           border: none;
//           border-radius: 6px;
//           font-weight: 700;
//           font-size: 14px;
//           cursor: pointer;
//           transition: opacity 0.2s;
//         }
//         .place-order-btn:disabled { opacity: 0.6; cursor: not-allowed; }
//         .margin-info {
//           background: #1e293b;
//           border-radius: 6px;
//           padding: 8px 10px;
//           margin-bottom: 12px;
//           font-size: 11px;
//         }
//         @media (max-width: 768px) {
//           .order-content { padding: 10px; }
//           .form-grid { gap: 8px; }
//         }
//         @media (max-width: 480px) {
//           .order-header { padding: 8px 10px; }
//           .form-grid { grid-template-columns: 1fr; }
//           .client-item { padding: 5px 8px; }
//           .place-order-btn { font-size: 13px; padding: 10px 0; }
//         }
//       `}</style>

//       {/* Header */}
//       <div className="order-header">
//         <ShoppingCart size={15} color="#6366f1" />
//         <h3>Place Order</h3>
//         {livePrice?.ltp > 0 && (
//           <span className="live-price-header" style={{ color: livePrice.changePct >= 0 ? '#22c55e' : '#ef4444' }}>
//             ₹{livePrice.ltp.toFixed(2)}
//             <span style={{ fontSize: 10, marginLeft: 4, color: '#64748b' }}>
//               {livePrice.changePct >= 0 ? '+' : ''}{livePrice.changePct?.toFixed(2)}%
//             </span>
//           </span>
//         )}
//       </div>

//       <div className="order-content">
//         {/* BUY / SELL */}
//         <div className="buy-sell-row">
//           {['BUY', 'SELL'].map(t => (
//             <button
//               key={t}
//               onClick={() => setOrder(o => ({ ...o, transactionType: t }))}
//               className="buy-sell-btn"
//               style={{
//                 background: order.transactionType === t ? (t === 'BUY' ? '#166534' : '#7f1d1d') : '#1e293b',
//                 color: order.transactionType === t ? (t === 'BUY' ? '#22c55e' : '#ef4444') : '#64748b'
//               }}
//             >
//               {t === 'BUY'
//                 ? <TrendingUp size={13} style={{ display: 'inline', marginRight: 4 }} />
//                 : <TrendingDown size={13} style={{ display: 'inline', marginRight: 4 }} />}
//               {t}
//             </button>
//           ))}
//         </div>

//         <div className="form-grid">
//           {/* Symbol search — spans full width */}
//           <div style={{ gridColumn: '1/-1' }}>
//             <label style={S.label}>Symbol — NSE / BSE / NFO / MCX / CDS / BFO</label>
//             <SymbolSearch
//               value={order.tradingSymbol}
//               token={order.instrumentId}
//               onSelect={handleSymbolSelect}
//               placeholder="SBIN-EQ, NIFTY25MARFUT, NIFTY17MAR26C24000…"
//             />
//           </div>

//           {/* Exchange */}
//           <div>
//             <label style={S.label}>Exchange</label>
//             <select
//               style={S.select}
//               value={order.exchange}
//               onChange={e => setOrder(o => ({ ...o, exchange: e.target.value, instrumentId: '' }))}
//             >
//               {['NSE', 'BSE', 'NFO', 'MCX', 'CDS', 'BCD', 'BFO'].map(ex => (
//                 <option key={ex}>{ex}</option>
//               ))}
//             </select>
//           </div>

//           {/* Quantity */}
//           <div>
//             <label style={S.label}>
//               Quantity
//               {lots !== null && (
//                 <span style={{ color: '#a78bfa', marginLeft: 6, fontWeight: 700 }}>
//                   ({lots} lot{lots !== 1 ? 's' : ''})
//                 </span>
//               )}
//             </label>
//             <input
//               style={S.input}
//               type="number"
//               min={lotSize > 1 ? lotSize : 1}
//               step={lotSize > 1 ? lotSize : 1}
//               value={order.quantity}
//               onChange={e => setOrder(o => ({ ...o, quantity: parseInt(e.target.value) || 1 }))}
//             />
//             {lotSize > 1 && (
//               <div style={{ fontSize: 9, color: '#475569', marginTop: 2 }}>
//                 Lot size: {lotSize} — enter multiples of {lotSize}
//               </div>
//             )}
//           </div>

//           {/* Order Type */}
//           <div>
//             <label style={S.label}>Order Type</label>
//             <select
//               style={S.select}
//               value={order.orderType}
//               onChange={e => setOrder(o => ({ ...o, orderType: e.target.value }))}
//             >
//               {['MARKET', 'LIMIT', 'SL', 'SLM'].map(t => <option key={t}>{t}</option>)}
//             </select>
//           </div>

//           {/* Product */}
//           <div>
//             <label style={S.label}>Product</label>
//             <select
//               style={S.select}
//               value={order.product}
//               onChange={e => setOrder(o => ({ ...o, product: e.target.value }))}
//             >
//               <option value="INTRADAY">INTRADAY (MIS)</option>
//               <option value="LONGTERM">DELIVERY (CNC)</option>
//               {isFno && <option value="NRML">NRML (Carry Forward)</option>}
//               <option value="MTF">MTF</option>
//             </select>
//           </div>

//           {/* Price — only for non-MARKET */}
//           {order.orderType !== 'MARKET' && (
//             <div style={{ gridColumn: '1/-1' }}>
//               <label style={S.label}>
//                 {order.orderType === 'SL' || order.orderType === 'SLM' ? 'Trigger Price (₹)' : 'Price (₹)'}
//               </label>
//               <input
//                 style={S.input}
//                 type="number"
//                 step={selectedInst?.tick_size || 0.05}
//                 value={order.price}
//                 onChange={e => setOrder(o => ({ ...o, price: parseFloat(e.target.value) || 0 }))}
//               />
//             </div>
//           )}

//           {/* SL trigger price */}
//           {order.orderType === 'SL' && (
//             <div style={{ gridColumn: '1/-1' }}>
//               <label style={S.label}>Limit Price (₹)</label>
//               <input
//                 style={{ ...S.input, borderColor: '#f59e0b' }}
//                 type="number"
//                 step={selectedInst?.tick_size || 0.05}
//                 placeholder="Limit price after trigger"
//                 onChange={e => setOrder(o => ({ ...o, limitPrice: parseFloat(e.target.value) || 0 }))}
//               />
//             </div>
//           )}
//         </div>

//         {/* ✅ F&O Margin info (approximate) */}
//         {isFno && livePrice?.ltp > 0 && lotSize > 1 && (
//           <div className="margin-info">
//             <div style={{ color: '#64748b', marginBottom: 4, fontSize: 10, fontWeight: 700 }}>📊 APPROX VALUE</div>
//             <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
//               <div>
//                 <span style={{ color: '#475569' }}>Contract Value: </span>
//                 <span style={{ color: '#e2e8f0', fontFamily: 'monospace', fontWeight: 700 }}>
//                   ₹{(livePrice.ltp * order.quantity).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
//                 </span>
//               </div>
//               {lots !== null && (
//                 <div>
//                   <span style={{ color: '#475569' }}>Lots: </span>
//                   <span style={{ color: '#a78bfa', fontWeight: 700 }}>{lots}</span>
//                 </div>
//               )}
//             </div>
//           </div>
//         )}

//         {/* Client list */}
//         <div className="client-list">
//           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
//             <label style={{ ...S.label, margin: 0 }}>
//               <Users size={11} style={{ display: 'inline', marginRight: 4 }} />
//               Clients
//             </label>
//             <button
//               onClick={selectAll}
//               style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}
//             >
//               All Active
//             </button>
//           </div>
//           {clients.length === 0 ? (
//             <p style={{ color: '#64748b', fontSize: 12 }}>Koi client nahi. Pehle client add karo.</p>
//           ) : (
//             clients.map(c => {
//               const sel = selectedClients.includes(c.id);
//               const act = c.session_status === 'active';
//               return (
//                 <div
//                   key={c.id}
//                   onClick={() => act && toggleClient(c.id)}
//                   className={`client-item ${sel ? 'selected' : ''} ${!act ? 'inactive' : ''}`}
//                 >
//                   {sel ? <CheckSquare size={13} color="#3b82f6" /> : <Square size={13} color="#64748b" />}
//                   <span style={{ color: '#e2e8f0', fontSize: 12, flex: 1 }}>{c.name}</span>
//                   <span style={{
//                     fontSize: 10, padding: '1px 6px', borderRadius: 10,
//                     background: act ? '#14532d' : '#450a0a',
//                     color: act ? '#22c55e' : '#ef4444'
//                   }}>
//                     {act ? 'Active' : 'Inactive'}
//                   </span>
//                 </div>
//               );
//             })
//           )}
//         </div>

//         {/* Place Order button */}
//         <button
//           onClick={handlePlaceOrder}
//           disabled={loading || !selectedClients.length || !order.tradingSymbol || !order.instrumentId}
//           className="place-order-btn"
//           style={{ background: isBuy ? '#22c55e' : '#ef4444', color: 'white' }}
//         >
//           {loading
//             ? 'Placing…'
//             : `${order.transactionType} ${order.tradingSymbol || '(select symbol)'}${selectedClients.length > 1 ? ` (${selectedClients.length} clients)` : ''}`
//           }
//         </button>
//       </div>
//     </div>
//   );
// }