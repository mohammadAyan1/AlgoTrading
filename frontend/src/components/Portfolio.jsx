
import React, { useState, useEffect, useRef } from 'react';
import { clientAPI, orderAPI } from '../services/api';
import { useLivePrices } from '../context/WSContext';
import { useContractMaster } from '../context/ContractMasterContext';
import toast from 'react-hot-toast';
import { Briefcase, TrendingUp, TrendingDown, RefreshCw, ShoppingCart, Users, CheckSquare, Square } from 'lucide-react';

export default function Portfolio({ isAdmin }) {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [tab, setTab] = useState('holdings');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sellLoading, setSellLoading] = useState(false);
  const [sellSuggestions, setSellSuggestions] = useState([]);
  const [showSellSuggestions, setShowSellSuggestions] = useState(false);
  const [selectedSellClients, setSelectedSellClients] = useState([]);
  const [bulkSell, setBulkSell] = useState({
    tradingSymbol: '',
    exchange: 'NSE',
    quantity: 1,
    product: 'INTRADAY',
    instrumentId: ''
  });
  const sellBoxRef = useRef(null);
  const { getPrice } = useLivePrices();
  const { getBySymbol } = useContractMaster();

  useEffect(() => {
    clientAPI.getSessions()
      .then(res => {
        const all = res.data.data || [];
        console.log(all);

        const active = all.filter(c => c.session_status === 'active');
        setClients(all);
        if (active.length > 0) setSelectedClient(active[0].id);
        setSelectedSellClients(active.map(c => c.id));
      })
      .catch(err => {
        console.error('Failed to load clients:', err);
        toast.error('Unable to load clients');
      });
  }, []);

  useEffect(() => {
    console.log(selectedClient);
    console.log(selectAllSellClients);


    if (selectedClient) loadData();
  }, [selectedClient, tab, setSelectedSellClients, selectedClient]);

  useEffect(() => {
    setSellSuggestions([]);
    setShowSellSuggestions(false);
  }, [selectedClient]);

  const loadData = async () => {
    setLoading(true);
    setData(null);
    try {
      let res;
      if (tab === 'holdings') res = await orderAPI.getHoldings(selectedClient);
      else if (tab === 'positions') res = await orderAPI.getPositions(selectedClient);
      else if (tab === 'orders') res = await orderAPI.getOrderBook(selectedClient);
      else if (tab === 'trades') res = await orderAPI.getTrades(selectedClient);

      console.log(res?.data?.data);

      setData(res.data.data || null);
    } catch (e) {
      console.error('Failed to load portfolio data:', e);
      toast.error(e.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const activeClients = clients.filter(c => c.session_status === 'active');
  const toggleSellClient = (id) => {
    setSelectedSellClients(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const selectAllSellClients = () => {
    setSelectedSellClients(activeClients.map(c => c.id));
  };

  const extractRows = (payload) => {

    console.log(payload);

    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload.result)) return payload.result;
    if (Array.isArray(payload.holdings)) return payload.holdings;
    if (Array.isArray(payload.positions)) return payload.positions;
    if (Array.isArray(payload.orders)) return payload.orders;
    if (Array.isArray(payload.trades)) return payload.trades;
    return [];
  };

  const rows = extractRows(data);

  const mapProduct = (product) => {
    const p = String(product || '').toUpperCase();

    console.log(p, "this is the product");


    if (p === 'MIS' || p === 'INTRADAY') return 'INTRADAY';
    if (p === 'CNC' || p === 'DELIVERY' || p === 'LONGTERM') return 'LONGTERM';
    if (p === 'MTF') return 'MTF';
    return 'INTRADAY';
  };

  const normalizeSymbol = (symbol) => String(symbol || '').trim().toUpperCase();

  const loadSellSuggestions = async () => {
    if (!selectedClient) return;
    try {
      const [positionsRes, ordersRes, tradesRes] = await Promise.allSettled([
        orderAPI.getPositions(selectedClient),
        orderAPI.getOrderBook(selectedClient),
        orderAPI.getTrades(selectedClient),
      ]);

      const bySymbol = new Map();
      const addRow = (row, fallbackQty = 1) => {
        const symbol = normalizeSymbol(row?.tradingSymbol || row?.formattedInstrumentName);
        if (!symbol) return;
        const qty = Math.max(parseInt(row?.netQuantity || row?.filledQuantity || row?.quantity || fallbackQty || 1, 10) || 1, 1);
        const existing = bySymbol.get(symbol);
        const next = {
          tradingSymbol: symbol,
          exchange: String(row?.exchange || existing?.exchange || 'NSE').toUpperCase(),
          quantity: qty,
          product: mapProduct(row?.product || existing?.product),
          instrumentId: String(row?.instrumentId || existing?.instrumentId || ''),
          avgPrice: parseFloat(row?.netAveragePrice || row?.dayBuyPrice || row?.averageTradedPrice || row?.tradedPrice || existing?.avgPrice || 0) || 0,
        };
        if (!existing || qty >= (existing.quantity || 0)) {
          bySymbol.set(symbol, next);
        }
      };

      const positions = positionsRes.status === 'fulfilled' ? (positionsRes.value?.data?.data?.result || []) : [];
      positions
        .filter(p => Number(p?.netQuantity || 0) > 0)
        .forEach(p => addRow(p, p.netQuantity));

      const orders = ordersRes.status === 'fulfilled' ? (ordersRes.value?.data?.data?.result || []) : [];
      orders
        .filter(o => String(o?.transactionType || '').toUpperCase() === 'BUY')
        .forEach(o => addRow(o, o.filledQuantity || o.quantity || 1));

      const trades = tradesRes.status === 'fulfilled' ? (tradesRes.value?.data?.data?.result || []) : [];
      trades
        .filter(t => String(t?.transactionType || '').toUpperCase() === 'BUY')
        .forEach(t => addRow(t, t.filledQuantity || 1));

      setSellSuggestions(Array.from(bySymbol.values()));
    } catch (err) {
      console.error('Failed to load sell suggestions:', err);
      setSellSuggestions([]);
    }
  };

  const applySuggestion = (item) => {
    setBulkSell(prev => ({
      ...prev,
      tradingSymbol: item.tradingSymbol,
      exchange: item.exchange || prev.exchange,
      quantity: item.quantity || prev.quantity,
      product: item.product || prev.product,
      instrumentId: item.instrumentId || prev.instrumentId,
    }));
    setShowSellSuggestions(false);
  };

  const filteredSuggestions = sellSuggestions.filter(s =>
    s.tradingSymbol.includes(normalizeSymbol(bulkSell.tradingSymbol))
  );

  useEffect(() => {
    const onDocClick = (e) => {
      if (sellBoxRef.current && !sellBoxRef.current.contains(e.target)) {
        setShowSellSuggestions(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const handleBulkSell = async () => {
    try {
      if (!selectedSellClients.length) {
        toast.error('Sell ke liye clients select karo');
        return;
      }
      if (!bulkSell.tradingSymbol.trim()) {
        toast.error('Trading symbol required');
        return;
      }
      if (!bulkSell.quantity || Number(bulkSell.quantity) <= 0) {
        toast.error('Valid quantity required');
        return;
      }

      const symbolInput = bulkSell.tradingSymbol.trim().toUpperCase();
      const symbolWithEq = symbolInput.endsWith('-EQ') ? symbolInput : `${symbolInput}-EQ`;
      const inst = getBySymbol(bulkSell.exchange, symbolInput) || getBySymbol(bulkSell.exchange, symbolWithEq);
      const instrumentId = String(bulkSell.instrumentId || inst?.token || '').trim();

      if (!instrumentId) {
        toast.error(`Token nahi mila ${symbolInput} (${bulkSell.exchange}) ke liye`);
        return;
      }

      setSellLoading(true);
      const orderData = {
        tradingSymbol: inst.trading_symbol || symbolInput,
        exchange: bulkSell.exchange,
        transactionType: 'SELL',
        orderType: 'MARKET',
        product: bulkSell.product,
        validity: 'DAY',
        quantity: parseInt(bulkSell.quantity, 10),
        price: 0,
        orderComplexity: 'REGULAR',
        instrumentId,
      };

      console.log(selectAllSellClients);

      console.log("hii this is ayan");


      // const res = await orderAPI.placeBulkOrder({
      //   clientIds: selectedSellClients,
      //   orderData,
      //   groupName: `SELL-${orderData.tradingSymbol}`
      // });

      console.log(selectedClient);


      const res = await orderAPI.placeOrder(
        selectedClient,
        orderData
      )
      toast.success(res.data?.message || 'Bulk sell placed');
      await loadData();
    } catch (err) {
      console.error('Bulk sell failed:', err);
      toast.error(err.response?.data?.message || err.message || 'Bulk sell failed');
    } finally {
      setSellLoading(false);
    }
  };

  const renderHoldings = (items) => {
    if (!items || items.length === 0) return <div className="empty-message">No holdings found</div>;
    return (
      <div className="table-wrapper">
        <table className="portfolio-table">
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Qty</th>
              <th>Avg Price</th>
              <th>LTP</th>
              <th>P&L</th>
              <th>P&L %</th>
            </tr>
          </thead>
          <tbody>
            {items.map((h, i) => {
              const symbol = h.sym || h.tradingSymbol || h.symbol || '-';
              const lp = getPrice(symbol);
              const ltp = lp?.ltp || parseFloat(h.ltp || h.lastTradedPrice) || 0;
              const avgPrice = parseFloat(h.price || h.avgPrice || h.averagePrice || h.netAveragePrice) || 0;
              const qty = parseInt(h.qty || h.holdQty || h.quantity || h.netQuantity || 0, 10) || 0;
              const pnl = (ltp - avgPrice) * qty;
              const pnlPct = avgPrice > 0 ? ((ltp - avgPrice) / avgPrice * 100) : 0;
              const isProfit = pnl >= 0;

              return (
                <tr key={i}>
                  <td className="symbol-cell">{symbol}</td>
                  <td>{qty}</td>
                  <td>₹{avgPrice.toFixed(2)}</td>
                  <td className="mono">₹{ltp.toFixed(2)}</td>
                  <td className={isProfit ? 'profit' : 'loss'}>
                    {isProfit ? '+' : ''}₹{pnl.toFixed(2)}
                  </td>
                  <td className={isProfit ? 'profit' : 'loss'}>
                    {isProfit ? <TrendingUp size={12} className="inline-icon" /> : <TrendingDown size={12} className="inline-icon" />}
                    {isProfit ? '+' : ''}{pnlPct.toFixed(2)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const renderGenericTable = (items, keys) => {
    if (!items || items.length === 0) return <div className="empty-message">No data found</div>;
    const headers = keys || Object.keys(items[0] || {}).slice(0, 8);
    return (
      <div className="table-wrapper">
        <table className="portfolio-table">
          <thead>
            <tr>
              {headers.map(h => <th key={h}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {items.map((row, i) => (
              <tr key={i}>
                {headers.map(h => (
                  <td key={h}>{String(row[h] ?? '-')}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="portfolio-container">
      <style>{`
        .portfolio-container {
          padding: 20px;
        }
        .portfolio-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 12px;
        }
        .portfolio-title {
          color: #e2e8f0;
          margin: 0;
          font-size: 20px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .portfolio-controls {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .client-select {
          background: #1e293b;
          border: 1px solid #334155;
          border-radius: 6px;
          padding: 7px 12px;
          color: #e2e8f0;
          font-size: 13px;
          outline: none;
        }
        .refresh-btn {
          background: #1e293b;
          border: 1px solid #334155;
          border-radius: 6px;
          color: #94a3b8;
          padding: 7px 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
        }
        .tab-bar {
          display: flex;
          gap: 4px;
          margin-bottom: 16px;
          background: #1e293b;
          border-radius: 8px;
          padding: 4px;
          overflow-x: auto;
          white-space: nowrap;
        }
        .tab-btn {
          padding: 8px 16px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          font-size: 13px;
          background: transparent;
          color: #64748b;
          transition: all 0.2s;
        }
        .tab-btn.active {
          background: #6366f1;
          color: white;
        }
        .content-card {
          background: #0f172a;
          border-radius: 8px;
          border: 1px solid #1e293b;
          overflow: hidden;
        }
        .sell-card {
          background: #0f172a;
          border: 1px solid #1e293b;
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 12px;
        }
        .sell-head {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #e2e8f0;
          font-weight: 700;
          margin-bottom: 10px;
          font-size: 13px;
        }
        .sell-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(120px, 1fr));
          gap: 8px;
          margin-bottom: 10px;
        }
        .sell-symbol-wrap {
          position: relative;
        }
        .sell-input {
          background: #1e293b;
          border: 1px solid #334155;
          border-radius: 6px;
          color: #e2e8f0;
          padding: 8px 10px;
          font-size: 12px;
          outline: none;
        }
        .sell-suggestions {
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          right: 0;
          z-index: 30;
          border: 1px solid #334155;
          border-radius: 8px;
          background: #1e293b;
          max-height: 220px;
          overflow-y: auto;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45);
        }
        .sell-empty {
          color: #94a3b8;
          font-size: 12px;
          padding: 10px;
        }
        .sell-suggestion-item {
          width: 100%;
          border: none;
          border-bottom: 1px solid #0f172a;
          background: transparent;
          color: #e2e8f0;
          text-align: left;
          padding: 8px 10px;
          display: flex;
          justify-content: space-between;
          gap: 8px;
          font-size: 12px;
          cursor: pointer;
        }
        .sell-suggestion-item:hover {
          background: #334155;
        }
        .sell-clients {
          display: grid;
          grid-template-columns: repeat(3, minmax(140px, 1fr));
          gap: 6px;
          margin-bottom: 10px;
        }
        .sell-client {
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          padding: 6px 8px;
          border-radius: 6px;
          border: 1px solid #334155;
          background: #1e293b;
          color: #e2e8f0;
          font-size: 12px;
        }
        .sell-client.active {
          border-color: #3b82f6;
          background: #1e3a5f;
        }
        .sell-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
        .sell-btn {
          background: #ef4444;
          color: #fff;
          border: none;
          border-radius: 6px;
          padding: 9px 12px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }
        .sell-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .loading-message,
        .empty-message {
          text-align: center;
          padding: 40px;
          color: #64748b;
        }
        .table-wrapper {
          overflow-x: auto;
        }
        .portfolio-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 600px;
        }
        .portfolio-table th {
          color: #64748b;
          font-size: 11px;
          font-weight: 600;
          padding: 8px 12px;
          text-align: left;
          text-transform: uppercase;
          background: #1e293b;
        }
        .portfolio-table td {
          color: #e2e8f0;
          font-size: 13px;
          padding: 10px 12px;
          border-bottom: 1px solid #1e293b;
        }
        .portfolio-table .symbol-cell {
          font-weight: 600;
        }
        .portfolio-table .mono {
          font-family: monospace;
        }
        .portfolio-table .profit {
          color: #22c55e;
          font-weight: 600;
        }
        .portfolio-table .loss {
          color: #ef4444;
          font-weight: 600;
        }
        .inline-icon {
          display: inline;
          margin-right: 2px;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .portfolio-container {
            padding: 12px;
          }
          .portfolio-title {
            font-size: 18px;
          }
          .portfolio-controls select,
          .portfolio-controls button {
            font-size: 12px;
            padding: 6px 10px;
          }
          .tab-btn {
            padding: 6px 12px;
            font-size: 12px;
          }
          .portfolio-table th {
            font-size: 10px;
            padding: 6px 8px;
          }
          .portfolio-table td {
            font-size: 12px;
            padding: 8px 8px;
          }
          .sell-grid {
            grid-template-columns: repeat(2, minmax(120px, 1fr));
          }
          .sell-clients {
            grid-template-columns: repeat(2, minmax(120px, 1fr));
          }
        }
        @media (max-width: 480px) {
          .portfolio-header {
            flex-direction: column;
            align-items: stretch;
          }
          .portfolio-controls {
            justify-content: space-between;
          }
          .client-select {
            flex: 1;
          }
          .tab-bar {
            gap: 2px;
          }
          .tab-btn {
            padding: 5px 8px;
            font-size: 11px;
          }
          .loading-message,
          .empty-message {
            padding: 20px;
            font-size: 12px;
          }
          .portfolio-table td {
            font-size: 11px;
            padding: 6px 4px;
          }
          .sell-grid,
          .sell-clients {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="portfolio-header">
        <h2 className="portfolio-title">
          <Briefcase size={20} color="#6366f1" /> Portfolio
        </h2>
        <div className="portfolio-controls">
          <select
            value={selectedClient || ''}
            onChange={e => setSelectedClient(e.target.value)}
            className="client-select"
          >
            <option value="">Select Client</option>
            {clients.filter(c => c.session_status === 'active').map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <button onClick={loadData} className="refresh-btn">
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-bar">
        {['holdings', 'positions', 'orders', 'trades'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`tab-btn ${tab === t ? 'active' : ''}`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {

        isAdmin && (
          <div className="sell-card">
            <div className="sell-head">
              <ShoppingCart size={14} color="#ef4444" />
              One-Click Multi-Client Sell
            </div>
            <div className="sell-grid">
              <div className="sell-symbol-wrap" ref={sellBoxRef}>
                <input
                  className="sell-input"
                  placeholder="Symbol (IDEA / IDEA-EQ)"
                  value={bulkSell.tradingSymbol}
                  onFocus={() => {
                    setShowSellSuggestions(true);
                    loadSellSuggestions();
                  }}
                  onClick={() => {
                    setShowSellSuggestions(true);
                    loadSellSuggestions();
                  }}
                  onChange={e => {
                    setBulkSell(s => ({
                      ...s,
                      tradingSymbol: e.target.value.toUpperCase(),
                      instrumentId: '',
                    }));
                    setShowSellSuggestions(true);
                  }}
                />
                {showSellSuggestions && (
                  <div className="sell-suggestions">
                    {filteredSuggestions.length === 0 ? (
                      <div className="sell-empty">No bought stocks found</div>
                    ) : filteredSuggestions.map((item) => (
                      <button
                        key={`${item.exchange}-${item.tradingSymbol}`}
                        className="sell-suggestion-item"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          applySuggestion(item);
                        }}
                      >
                        <span>{item.tradingSymbol}</span>
                        <span>{item.exchange} | Qty {item.quantity}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <select
                className="sell-input"
                value={bulkSell.exchange}
                onChange={e => setBulkSell(s => ({ ...s, exchange: e.target.value, instrumentId: '' }))}
              >
                {['NSE', 'BSE', 'NFO', 'MCX', 'CDS', 'BCD', 'BFO'].map(ex => <option key={ex}>{ex}</option>)}
              </select>
              <input
                className="sell-input"
                type="number"
                min="1"
                value={bulkSell.quantity}
                onChange={e => setBulkSell(s => ({ ...s, quantity: parseInt(e.target.value, 10) || 1 }))}
              />
              <select
                className="sell-input"
                value={bulkSell.product}
                onChange={e => setBulkSell(s => ({ ...s, product: e.target.value }))}
              >
                <option value="INTRADAY">INTRADAY</option>
                <option value="LONGTERM">LONGTERM</option>
                <option value="MTF">MTF</option>
              </select>
            </div>
            <div className="sell-clients">
              {activeClients.map(c => {
                const checked = selectedSellClients.includes(c.id);
                return (
                  <div
                    key={c.id}
                    className={`sell-client ${checked ? 'active' : ''}`}
                    onClick={() => toggleSellClient(c.id)}
                  >
                    {checked ? <CheckSquare size={13} color="#3b82f6" /> : <Square size={13} color="#64748b" />}
                    {c.name}
                  </div>
                );
              })}
            </div>
            <div className="sell-actions">
              <button className="refresh-btn" onClick={selectAllSellClients}>
                <Users size={13} /> All Active
              </button>
              <button
                className="sell-btn"
                onClick={handleBulkSell}
                disabled={sellLoading || !selectedSellClients.length || !bulkSell.tradingSymbol}
              >
                {sellLoading ? 'Placing SELL...' : `SELL for ${selectedSellClients.length} client(s)`}
              </button>
            </div>
          </div>
        )
      }
      {/* Content */}
      <div className="content-card">
        {loading ? (
          <div className="loading-message">Loading...</div>
        ) : !selectedClient ? (
          <div className="empty-message">Select a client to view their portfolio</div>
        ) : !data ? (
          <div className="empty-message">No data available</div>
        ) : (
          rows.length === 0 ? (
            <div className="empty-message">{data?.message || 'No data found'}</div>
          ) : (
            tab === 'holdings' ? renderHoldings(rows) :
              tab === 'positions' ? renderGenericTable(rows,
                ['tradingSymbol', 'exchange', 'product', 'netQuantity', 'netAveragePrice', 'ltp', 'unrealizedPnl', 'MtoM']) :
                tab === 'orders' ? renderGenericTable(rows,
                  ['tradingSymbol', 'exchange', 'transactionType', 'orderType', 'quantity', 'averageTradedPrice', 'orderStatus', 'orderTime']) :
                  renderGenericTable(rows,
                    ['tradingSymbol', 'exchange', 'transactionType', 'product', 'tradedPrice', 'filledQuantity', 'orderTime', 'fillTimestamp'])
          )
        )}
      </div>
    </div>
  );
}
