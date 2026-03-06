// import React, { useState, useEffect } from 'react';
// import { clientAPI, orderAPI } from '../services/api';
// import { useLivePrices } from '../context/WSContext';
// import toast from 'react-hot-toast';
// import { Briefcase, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';

// export default function Portfolio() {
//   const [clients, setClients] = useState([]);
//   const [selectedClient, setSelectedClient] = useState(null);
//   const [tab, setTab] = useState('holdings');
//   const [data, setData] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const { getPrice } = useLivePrices();

//   useEffect(() => {
//     clientAPI.getSessions().then(res => {
//       const active = res.data.data.filter(c => c.session_status === 'active');
//       setClients(res.data.data);
//       if (active.length > 0) setSelectedClient(active[0].id);
//     });
//   }, []);

//   useEffect(() => {
//     if (selectedClient) loadData();
//   }, [selectedClient, tab]);

//   const loadData = async () => {
//     setLoading(true);
//     setData(null);
//     try {
//       let res;
//       if (tab === 'holdings') res = await orderAPI.getHoldings(selectedClient);
//       else if (tab === 'positions') res = await orderAPI.getPositions(selectedClient);
//       else if (tab === 'orders') res = await orderAPI.getOrderBook(selectedClient);
//       else if (tab === 'trades') res = await orderAPI.getTrades(selectedClient);
//       setData(res.data.data);
//     } catch (e) {
//       toast.error(e.response?.data?.message || 'Failed to load data');
//     }
//     setLoading(false);
//   };

//   const styles = {
//     tab: (active) => ({
//       padding: '8px 16px', border: 'none', borderRadius: 6, cursor: 'pointer',
//       fontWeight: 600, fontSize: 13,
//       background: active ? '#6366f1' : 'transparent',
//       color: active ? 'white' : '#64748b'
//     }),
//     th: { color: '#64748b', fontSize: 11, fontWeight: 600, padding: '8px 12px', textAlign: 'left', textTransform: 'uppercase' },
//     td: { color: '#e2e8f0', fontSize: 13, padding: '10px 12px', borderBottom: '1px solid #1e293b' }
//   };

//   const renderHoldings = (items) => {
//     if (!items || items.length === 0) return <div style={{ color: '#64748b', padding: 20, textAlign: 'center' }}>No holdings found</div>;
//     return (
//       <div style={{ overflowX: 'auto' }}>
//         <table style={{ width: '100%', borderCollapse: 'collapse' }}>
//           <thead>
//             <tr style={{ background: '#1e293b' }}>
//               {['Symbol', 'Qty', 'Avg Price', 'LTP', 'P&L', 'P&L %'].map(h => (
//                 <th key={h} style={styles.th}>{h}</th>
//               ))}
//             </tr>
//           </thead>
//           <tbody>
//             {items.map((h, i) => {
//               const lp = getPrice(h.sym || h.tradingSymbol);
//               const ltp = lp?.ltp || parseFloat(h.ltp) || 0;
//               const avgPrice = parseFloat(h.price || h.avgPrice) || 0;
//               const qty = parseInt(h.qty || h.holdQty) || 0;
//               const pnl = (ltp - avgPrice) * qty;
//               const pnlPct = avgPrice > 0 ? ((ltp - avgPrice) / avgPrice * 100) : 0;
//               const isProfit = pnl >= 0;

//               return (
//                 <tr key={i} style={{ ':hover': { background: '#1e293b' } }}>
//                   <td style={{ ...styles.td, fontWeight: 600 }}>{h.sym || h.tradingSymbol}</td>
//                   <td style={styles.td}>{qty}</td>
//                   <td style={styles.td}>₹{avgPrice.toFixed(2)}</td>
//                   <td style={{ ...styles.td, fontFamily: 'monospace' }}>₹{ltp.toFixed(2)}</td>
//                   <td style={{ ...styles.td, color: isProfit ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
//                     {isProfit ? '+' : ''}₹{pnl.toFixed(2)}
//                   </td>
//                   <td style={{ ...styles.td, color: isProfit ? '#22c55e' : '#ef4444' }}>
//                     {isProfit ? <TrendingUp size={12} style={{ display: 'inline', marginRight: 2 }} /> : <TrendingDown size={12} style={{ display: 'inline', marginRight: 2 }} />}
//                     {isProfit ? '+' : ''}{pnlPct.toFixed(2)}%
//                   </td>
//                 </tr>
//               );
//             })}
//           </tbody>
//         </table>
//       </div>
//     );
//   };

//   const renderGenericTable = (items, keys) => {
//     if (!items || items.length === 0) return <div style={{ color: '#64748b', padding: 20, textAlign: 'center' }}>No data found</div>;
//     const headers = keys || Object.keys(items[0] || {}).slice(0, 8);
//     return (
//       <div style={{ overflowX: 'auto' }}>
//         <table style={{ width: '100%', borderCollapse: 'collapse' }}>
//           <thead>
//             <tr style={{ background: '#1e293b' }}>
//               {headers.map(h => <th key={h} style={styles.th}>{h}</th>)}
//             </tr>
//           </thead>
//           <tbody>
//             {items.map((row, i) => (
//               <tr key={i}>
//                 {headers.map(h => (
//                   <td key={h} style={styles.td}>{String(row[h] ?? '-')}</td>
//                 ))}
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     );
//   };

//   return (
//     <div style={{ padding: 20 }}>
//       <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
//         <h2 style={{ color: '#e2e8f0', margin: 0, fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
//           <Briefcase size={20} color="#6366f1" /> Portfolio
//         </h2>
//         <div style={{ display: 'flex', gap: 8 }}>
//           <select
//             value={selectedClient || ''}
//             onChange={e => setSelectedClient(e.target.value)}
//             style={{
//               background: '#1e293b', border: '1px solid #334155', borderRadius: 6,
//               padding: '7px 12px', color: '#e2e8f0', fontSize: 13
//             }}>
//             <option value="">Select Client</option>
//             {clients.filter(c => c.session_status === 'active').map(c => (
//               <option key={c.id} value={c.id}>{c.name}</option>
//             ))}
//           </select>
//           <button onClick={loadData} style={{
//             background: '#1e293b', border: '1px solid #334155', borderRadius: 6,
//             color: '#94a3b8', padding: '7px 12px', cursor: 'pointer',
//             display: 'flex', alignItems: 'center', gap: 6, fontSize: 13
//           }}>
//             <RefreshCw size={13} />
//           </button>
//         </div>
//       </div>

//       {/* Tabs */}
//       <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: '#1e293b', borderRadius: 8, padding: 4 }}>
//         {['holdings', 'positions', 'orders', 'trades'].map(t => (
//           <button key={t} onClick={() => setTab(t)} style={styles.tab(tab === t)}>
//             {t.charAt(0).toUpperCase() + t.slice(1)}
//           </button>
//         ))}
//       </div>

//       {/* Content */}
//       <div style={{ background: '#0f172a', borderRadius: 8, border: '1px solid #1e293b', overflow: 'hidden' }}>
//         {loading ? (
//           <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>Loading...</div>
//         ) : !selectedClient ? (
//           <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
//             Select a client to view their portfolio
//           </div>
//         ) : !data ? (
//           <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>No data available</div>
//         ) : (
//           tab === 'holdings' ? renderHoldings(Array.isArray(data) ? data : data?.holdings || []) :
//           tab === 'positions' ? renderGenericTable(Array.isArray(data) ? data : data?.positions || [],
//             ['tradingSymbol', 'exchange', 'netQty', 'avgPrice', 'ltp', 'pnl', 'product']) :
//           tab === 'orders' ? renderGenericTable(Array.isArray(data) ? data : data?.orders || [],
//             ['tradingSymbol', 'exchange', 'transactionType', 'orderType', 'qty', 'price', 'status', 'orderTime']) :
//           renderGenericTable(Array.isArray(data) ? data : data?.trades || [])
//         )}
//       </div>
//     </div>
//   );
// }


import React, { useState, useEffect } from 'react';
import { clientAPI, orderAPI } from '../services/api';
import { useLivePrices } from '../context/WSContext';
import toast from 'react-hot-toast';
import { Briefcase, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';

export default function Portfolio() {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [tab, setTab] = useState('holdings');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const { getPrice } = useLivePrices();

  useEffect(() => {
    clientAPI.getSessions()
      .then(res => {
        const active = res.data.data.filter(c => c.session_status === 'active');
        setClients(res.data.data);
        if (active.length > 0) setSelectedClient(active[0].id);
      })
      .catch(err => {
        console.error('Failed to load clients:', err);
        toast.error('Unable to load clients');
      });
  }, []);

  useEffect(() => {
    if (selectedClient) loadData();
  }, [selectedClient, tab]);

  const loadData = async () => {
    setLoading(true);
    setData(null);
    try {
      let res;
      if (tab === 'holdings') res = await orderAPI.getHoldings(selectedClient);
      else if (tab === 'positions') res = await orderAPI.getPositions(selectedClient);
      else if (tab === 'orders') res = await orderAPI.getOrderBook(selectedClient);
      else if (tab === 'trades') res = await orderAPI.getTrades(selectedClient);
      setData(res.data.data);
    } catch (e) {
      console.error('Failed to load portfolio data:', e);
      toast.error(e.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
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
              const lp = getPrice(h.sym || h.tradingSymbol);
              const ltp = lp?.ltp || parseFloat(h.ltp) || 0;
              const avgPrice = parseFloat(h.price || h.avgPrice) || 0;
              const qty = parseInt(h.qty || h.holdQty) || 0;
              const pnl = (ltp - avgPrice) * qty;
              const pnlPct = avgPrice > 0 ? ((ltp - avgPrice) / avgPrice * 100) : 0;
              const isProfit = pnl >= 0;

              return (
                <tr key={i}>
                  <td className="symbol-cell">{h.sym || h.tradingSymbol}</td>
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

      {/* Content */}
      <div className="content-card">
        {loading ? (
          <div className="loading-message">Loading...</div>
        ) : !selectedClient ? (
          <div className="empty-message">Select a client to view their portfolio</div>
        ) : !data ? (
          <div className="empty-message">No data available</div>
        ) : (
          tab === 'holdings' ? renderHoldings(Array.isArray(data) ? data : data?.holdings || []) :
            tab === 'positions' ? renderGenericTable(Array.isArray(data) ? data : data?.positions || [],
              ['tradingSymbol', 'exchange', 'netQty', 'avgPrice', 'ltp', 'pnl', 'product']) :
              tab === 'orders' ? renderGenericTable(Array.isArray(data) ? data : data?.orders || [],
                ['tradingSymbol', 'exchange', 'transactionType', 'orderType', 'qty', 'price', 'status', 'orderTime']) :
                renderGenericTable(Array.isArray(data) ? data : data?.trades || [])
        )}
      </div>
    </div>
  );
}