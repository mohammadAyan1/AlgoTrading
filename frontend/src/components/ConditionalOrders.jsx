// import React, { useState, useEffect, useCallback } from 'react';
// import { clientAPI, orderAPI } from '../services/api';
// import { useLivePrices } from '../context/WSContext';
// import toast from 'react-hot-toast';
// import { SymbolSearch } from './OrderPanel';
// import { Target, TrendingUp, TrendingDown, Users, CheckSquare, Square, Trash2, RefreshCw, Edit3, X, Save } from 'lucide-react';

// const S = {
//   input: { background: '#0f172a', border: '1px solid #334155', borderRadius: 6, padding: '8px 12px', color: '#e2e8f0', fontSize: 13, width: '100%', boxSizing: 'border-box', outline: 'none' },
//   label: { color: '#94a3b8', fontSize: 11, marginBottom: 4, display: 'block', fontWeight: 600 },
//   select: { background: '#0f172a', border: '1px solid #334155', borderRadius: 6, padding: '8px 12px', color: '#e2e8f0', fontSize: 13, width: '100%', outline: 'none' },
// };

// const STATUS_COLOR = { PENDING: '#f59e0b', PLACED: '#6366f1', TRIGGERED: '#22c55e', CANCELLED: '#64748b', FAILED: '#ef4444' };
// const GTT_TYPES = {
//   LTP_B_O: { label: 'Buy when LTP drops BELOW trigger', color: '#22c55e', icon: TrendingDown },
//   LTP_A_O: { label: 'Sell when LTP rises ABOVE trigger', color: '#f59e0b', icon: TrendingUp },
// };

// // ─── GTT Modify Modal ─────────────────────────────────────────────────────
// function ModifyModal({ order, onClose, onSaved }) {
//   const [saving, setSaving] = useState(false);
//   const [form, setForm] = useState({
//     gttValue: String(order.trigger_price || ''),
//     price: String(order.order_price || ''),
//     quantity: String(order.quantity || 1),
//     orderType: order.order_type || 'LIMIT',
//     product: order.product || 'LONGTERM',
//     gttType: order.gtt_type || 'LTP_B_O',
//   });

//   const handleSave = async () => {
//     if (!form.gttValue || Number(form.gttValue) <= 0) { toast.error('Trigger price required'); return; }
//     if (!form.price || Number(form.price) <= 0) { toast.error('Order price required'); return; }

//     setSaving(true);
//     try {
//       const payload = {
//         orderNumber: order.alice_order_id,
//         tradingSymbol: order.trading_symbol,
//         exchange: order.exchange,
//         transactionType: order.transaction_type,
//         orderType: form.orderType,
//         product: form.product,
//         validity: 'DAY',
//         quantity: String(parseInt(form.quantity) || 1),
//         price: Number(form.price),
//         orderComplexity: 'REGULAR',
//         instrumentId: order.instrument_id,
//         gttType: form.gttType,
//         gttValue: String(Number(form.gttValue)),
//       };

//       const res = await orderAPI.modifyGTT(order.client_id, payload);
//       const d = res.data.data;
//       if (d?.status === 'Ok') {
//         toast.success('✅ GTT order modified!');
//         onSaved();
//         onClose();
//       } else {
//         toast.error(`❌ ${d?.message || 'Modify failed'}`);
//       }
//     } catch (e) {
//       toast.error(e.response?.data?.message || e.message || 'Modify failed');
//     }
//     setSaving(false);
//   };

//   return (
//     <div style={{
//       position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.7)',
//       display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
//     }}>
//       <div style={{ background: '#1e293b', borderRadius: 12, padding: 24, width: '100%', maxWidth: 420, border: '1px solid #334155', boxShadow: '0 24px 64px rgba(0,0,0,0.8)' }}>
//         {/* Header */}
//         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
//           <div>
//             <h3 style={{ color: '#e2e8f0', margin: 0, fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
//               <Edit3 size={15} color="#6366f1" /> Modify GTT Order
//             </h3>
//             <p style={{ color: '#64748b', margin: '3px 0 0', fontSize: 11 }}>
//               {order.transaction_type} {order.trading_symbol} · {order.exchange} · OrderID: {order.alice_order_id}
//             </p>
//           </div>
//           <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 4 }}>
//             <X size={18} />
//           </button>
//         </div>

//         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
//           {/* GTT Type */}
//           <div style={{ gridColumn: '1/-1' }}>
//             <label style={S.label}>Trigger Condition</label>
//             <div style={{ display: 'flex', gap: 4 }}>
//               {Object.entries(GTT_TYPES).map(([key, val]) => (
//                 <button key={key} onClick={() => setForm(f => ({ ...f, gttType: key }))}
//                   style={{
//                     flex: 1, padding: '8px 0', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 700,
//                     background: form.gttType === key ? val.color + '22' : '#0f172a',
//                     color: form.gttType === key ? val.color : '#64748b',
//                     borderWidth: 1, borderStyle: 'solid',
//                     borderColor: form.gttType === key ? val.color : '#334155'
//                   }}>
//                   {val.label.split(' ').slice(0, 4).join(' ')}
//                 </button>
//               ))}
//             </div>
//           </div>

//           <div>
//             <label style={S.label}>Trigger Price ₹ <span style={{ color: '#f59e0b' }}>*</span></label>
//             <input style={{ ...S.input, borderColor: '#f59e0b' }} type="number" step="0.05"
//               value={form.gttValue} onChange={e => setForm(f => ({ ...f, gttValue: e.target.value }))} />
//             <div style={{ fontSize: 9, color: '#475569', marginTop: 2 }}>Order is triggered when LTP hits this price</div>
//           </div>

//           <div>
//             <label style={S.label}>Order Price ₹ <span style={{ color: '#6366f1' }}>*</span></label>
//             <input style={{ ...S.input, borderColor: '#6366f1' }} type="number" step="0.05"
//               value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
//             <div style={{ fontSize: 9, color: '#475569', marginTop: 2 }}>Actual buy/sell price</div>
//           </div>

//           <div>
//             <label style={S.label}>Quantity</label>
//             <input style={S.input} type="number" min="1"
//               value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
//           </div>

//           <div>
//             <label style={S.label}>Order Type</label>
//             <select style={S.select} value={form.orderType} onChange={e => setForm(f => ({ ...f, orderType: e.target.value }))}>
//               <option value="LIMIT">LIMIT</option>
//               <option value="MARKET">MARKET</option>
//             </select>
//           </div>

//           <div>
//             <label style={S.label}>Product</label>
//             <select style={S.select} value={form.product} onChange={e => setForm(f => ({ ...f, product: e.target.value }))}>
//               <option value="LONGTERM">DELIVERY (CNC)</option>
//               <option value="INTRADAY">INTRADAY (MIS)</option>
//             </select>
//           </div>
//         </div>

//         {/* Current vs New Summary */}
//         <div style={{ background: '#0f172a', borderRadius: 8, padding: 10, marginTop: 14, fontSize: 11, color: '#64748b' }}>
//           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, textAlign: 'center' }}>
//             <div><div>Current Trigger</div><div style={{ color: '#f59e0b', fontWeight: 700, fontFamily: 'monospace' }}>₹{order.trigger_price}</div></div>
//             <div><div>→ New Trigger</div><div style={{ color: '#22c55e', fontWeight: 700, fontFamily: 'monospace' }}>₹{form.gttValue || '—'}</div></div>
//             <div><div>→ New Order</div><div style={{ color: '#6366f1', fontWeight: 700, fontFamily: 'monospace' }}>₹{form.price || '—'}</div></div>
//           </div>
//         </div>

//         <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
//           <button onClick={onClose}
//             style={{ flex: 1, padding: '10px 0', background: '#1e293b', border: '1px solid #334155', borderRadius: 6, color: '#94a3b8', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
//             Cancel
//           </button>
//           <button onClick={handleSave} disabled={saving}
//             style={{
//               flex: 2, padding: '10px 0', background: '#6366f1', border: 'none', borderRadius: 6, color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: 13,
//               display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: saving ? 0.7 : 1
//             }}>
//             <Save size={14} />{saving ? 'Saving…' : 'Save Changes'}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// // ─── Order Card ───────────────────────────────────────────────────────────
// function OrderCard({ order, onCancel, onModify }) {
//   const { getPrice } = useLivePrices();
//   const lp = getPrice(order.trading_symbol);
//   const ltp = lp?.ltp;
//   const dist = ltp ? ((order.trigger_price - ltp) / ltp * 100).toFixed(1) : null;
//   const near = dist && Math.abs(parseFloat(dist)) < 1;
//   const sc = STATUS_COLOR[order.status] || '#64748b';

//   return (
//     <div style={{ background: '#1e293b', borderRadius: 8, padding: 12, marginBottom: 8, border: `${near ? 2 : 1}px solid ${near ? '#f59e0b' : '#334155'}` }}>
//       {near && <div style={{ background: '#451a03', color: '#f59e0b', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, marginBottom: 8, display: 'inline-block' }}>⚡ Trigger ke paas! {dist}% dur</div>}
//       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
//         <div style={{ flex: 1 }}>
//           <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
//             <span style={{ fontWeight: 700, color: order.transaction_type === 'BUY' ? '#22c55e' : '#ef4444', fontSize: 12 }}>{order.transaction_type}</span>
//             <span style={{ color: '#e2e8f0', fontWeight: 700 }}>{order.trading_symbol}</span>
//             <span style={{ color: '#64748b', fontSize: 11 }}>{order.exchange}</span>
//             <span style={{ padding: '1px 6px', borderRadius: 10, fontSize: 10, fontWeight: 700, background: sc + '22', color: sc }}>{order.status}</span>
//           </div>
//           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '2px 12px', fontSize: 11 }}>
//             <span style={{ color: '#94a3b8' }}>Client: <strong style={{ color: '#e2e8f0' }}>{order.client_name}</strong></span>
//             <span style={{ color: '#94a3b8' }}>Qty: <strong style={{ color: '#e2e8f0' }}>{order.quantity}</strong></span>
//             <span style={{ color: '#f59e0b' }}>Trigger: <strong>₹{order.trigger_price}</strong></span>
//             <span style={{ color: '#6366f1' }}>Order: <strong>₹{order.order_price}</strong></span>
//             {ltp > 0 && <span style={{ color: '#94a3b8' }}>LTP: <strong style={{ color: lp.changePct >= 0 ? '#22c55e' : '#ef4444' }}>₹{ltp.toFixed(2)}</strong></span>}
//             <span style={{ color: '#475569', fontSize: 10 }}>{order.gtt_type === 'LTP_B_O' ? '↓ Below' : '↑ Above'}</span>
//           </div>
//           <div style={{ fontSize: 9, color: '#475569', marginTop: 4 }}>{new Date(order.created_at).toLocaleString('en-IN')}</div>
//         </div>

//         {/* Action buttons */}
//         {(order.status === 'PLACED' || order.status === 'PENDING') && (
//           <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
//             {order.alice_order_id && (
//               <button onClick={() => onModify(order)}
//                 style={{ background: '#6366f1', border: 'none', borderRadius: 6, color: 'white', padding: '5px 8px', cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
//                 <Edit3 size={10} /> Modify
//               </button>
//             )}
//             <button onClick={() => onCancel(order)}
//               style={{ background: 'none', border: '1px solid #ef4444', borderRadius: 6, color: '#ef4444', padding: '5px 8px', cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
//               <Trash2 size={10} /> Cancel
//             </button>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// // ─── Main ConditionalOrders Component ────────────────────────────────────
// export default function ConditionalOrders({ selectedSymbol }) {
//   const { getPrice } = useLivePrices();

//   const [clients, setClients] = useState([]);
//   const [selectedClients, setSelectedClients] = useState([]);
//   const [orders, setOrders] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [modifyOrder, setModifyOrder] = useState(null); // order to modify
//   const [gtt, setGtt] = useState({
//     tradingSymbol: '',
//     exchange: 'NSE',
//     transactionType: 'BUY',
//     orderType: 'LIMIT',
//     product: 'LONGTERM',
//     validity: 'DAY',
//     quantity: 1,
//     gttValue: '',
//     price: '',
//     gttType: 'LTP_B_O',
//     orderComplexity: 'REGULAR',
//     instrumentId: '',
//   });

//   useEffect(() => {
//     clientAPI.getSessions().then(r => setClients(r.data.data || [])).catch(() => { });
//     loadOrders();
//   }, []);

//   useEffect(() => {
//     if (selectedSymbol) setGtt(g => ({ ...g, tradingSymbol: selectedSymbol, instrumentId: '' }));
//   }, [selectedSymbol]);

//   useEffect(() => {
//     setGtt(g => ({ ...g, gttType: g.transactionType === 'BUY' ? 'LTP_B_O' : 'LTP_A_O' }));
//   }, [gtt.transactionType]);

//   const loadOrders = async () => {
//     try { const r = await orderAPI.getConditionalOrders(); setOrders(r.data.data || []); } catch { }
//   };

//   const handleSymbolSelect = useCallback(inst => {
//     setGtt(g => ({
//       ...g,
//       tradingSymbol: inst.trading_symbol || inst.symbol || g.tradingSymbol,
//       exchange: inst.exchange || g.exchange,
//       instrumentId: inst.token || '',
//     }));
//   }, []);

//   const toggleClient = id => setSelectedClients(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
//   const selectAll = () => setSelectedClients(clients.filter(c => c.session_status === 'active').map(c => c.id));

//   const handlePlace = async () => {
//     if (!selectedClients.length) { toast.error('Client select karo'); return; }
//     if (!gtt.tradingSymbol) { toast.error('Symbol select karo'); return; }
//     if (!gtt.instrumentId) { toast.error('Symbol dropdown se select karo (token chahiye)'); return; }
//     if (!gtt.gttValue || Number(gtt.gttValue) <= 0) { toast.error('Trigger price enter karo'); return; }
//     if (!gtt.price || Number(gtt.price) <= 0) { toast.error('Order price enter karo'); return; }

//     setLoading(true);
//     try {
//       const data = { ...gtt, gttValue: Number(gtt.gttValue), price: Number(gtt.price), quantity: parseInt(gtt.quantity) || 1 };
//       if (selectedClients.length === 1) {
//         const res = await orderAPI.placeGTT(selectedClients[0], data);
//         const d = res.data.data;
//         if (d?.status === 'Ok') toast.success('✅ GTT order placed!');
//         else toast.error(`❌ ${d?.message || JSON.stringify(d)}`);
//       } else {
//         const res = await orderAPI.placeBulkGTT({ clientIds: selectedClients, gttData: data });
//         const ok = (res.data.data || []).filter(r => r.status === 'PLACED').length;
//         toast.success(`✅ GTT ${ok}/${selectedClients.length} clients ke liye place hua`);
//       }
//       loadOrders();
//       setGtt(g => ({ ...g, gttValue: '', price: '' }));
//     } catch (e) {
//       toast.error(e.response?.data?.message || e.message || 'GTT failed');
//     }
//     setLoading(false);
//   };

//   const handleCancel = async (order) => {
//     if (!window.confirm(`Cancel GTT order for ${order.trading_symbol}?`)) return;
//     try {
//       await orderAPI.cancelGTT(order.client_id, { orderNumber: order.alice_order_id });
//       toast.success('Order cancelled');
//       loadOrders();
//     } catch (e) {
//       toast.error(e.response?.data?.message || 'Cancel failed');
//     }
//   };

//   const livePrice = getPrice(gtt.tradingSymbol);
//   const curGttType = GTT_TYPES[gtt.gttType];

//   return (
//     <div style={{ padding: 16 }}>
//       {/* Modify Modal */}
//       {modifyOrder && (
//         <ModifyModal
//           order={modifyOrder}
//           onClose={() => setModifyOrder(null)}
//           onSaved={loadOrders}
//         />
//       )}

//       <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
//         <div>
//           <h2 style={{ color: '#e2e8f0', margin: 0, fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
//             <Target size={18} color="#f59e0b" /> Conditional Orders (GTT)
//           </h2>
//           <p style={{ color: '#64748b', margin: '3px 0 0', fontSize: 12 }}>Price target pe auto-execute hoga</p>
//         </div>
//         <button onClick={loadOrders} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 6, color: '#94a3b8', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
//           <RefreshCw size={12} /> Refresh
//         </button>
//       </div>

//       <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 16 }}>
//         {/* ── GTT Form ───────────────────────────────────────────────────── */}
//         <div style={{ background: '#0f172a', borderRadius: 10, padding: 16, border: '1px solid #1e293b' }}>
//           <h3 style={{ color: '#e2e8f0', margin: '0 0 12px', fontSize: 13 }}>New Conditional Order</h3>

//           <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
//             {['BUY', 'SELL'].map(t => (
//               <button key={t} onClick={() => setGtt(g => ({ ...g, transactionType: t }))}
//                 style={{
//                   flex: 1, padding: '8px 0', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: 12,
//                   background: gtt.transactionType === t ? (t === 'BUY' ? '#166534' : '#7f1d1d') : '#1e293b',
//                   color: gtt.transactionType === t ? (t === 'BUY' ? '#22c55e' : '#ef4444') : '#64748b'
//                 }}>
//                 {t}
//               </button>
//             ))}
//           </div>

//           <div style={{ background: '#1e293b', borderRadius: 6, padding: '7px 10px', marginBottom: 12, fontSize: 11 }}>
//             <div style={{ color: curGttType?.color, fontWeight: 700 }}>{curGttType?.label}</div>
//           </div>

//           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
//             <div style={{ gridColumn: '1/-1' }}>
//               <label style={S.label}>Symbol — NSE / BSE / NFO / MCX / CDS</label>
//               <SymbolSearch
//                 value={gtt.tradingSymbol}
//                 token={gtt.instrumentId}
//                 onSelect={handleSymbolSelect}
//                 placeholder="ADANIPORTS-EQ, CRUDEOIL, GOLD…"
//               />
//               {livePrice?.ltp > 0 && (
//                 <div style={{ fontSize: 10, color: '#64748b', marginTop: 3, display: 'flex', gap: 8 }}>
//                   <span>LTP: <span style={{ color: livePrice.changePct >= 0 ? '#22c55e' : '#ef4444', fontWeight: 700 }}>₹{livePrice.ltp.toFixed(2)}</span></span>
//                   <span>H:<span style={{ color: '#22c55e' }}>₹{livePrice.high?.toFixed(2)}</span></span>
//                   <span>L:<span style={{ color: '#ef4444' }}>₹{livePrice.low?.toFixed(2)}</span></span>
//                 </div>
//               )}
//             </div>

//             <div>
//               <label style={S.label}>Trigger ₹ <span style={{ color: '#f59e0b' }}>*</span></label>
//               <input style={{ ...S.input, borderColor: '#f59e0b' }} type="number" step="0.05"
//                 placeholder={gtt.transactionType === 'BUY' ? 'Buy trigger price' : 'Sell trigger price'}
//                 value={gtt.gttValue} onChange={e => setGtt(g => ({ ...g, gttValue: e.target.value }))} />
//             </div>
//             <div>
//               <label style={S.label}>Order Price ₹ <span style={{ color: '#6366f1' }}>*</span></label>
//               <input style={{ ...S.input, borderColor: '#6366f1' }} type="number" step="0.05"
//                 placeholder="Actual trade price"
//                 value={gtt.price} onChange={e => setGtt(g => ({ ...g, price: e.target.value }))} />
//             </div>
//             <div>
//               <label style={S.label}>Quantity</label>
//               <input style={S.input} type="number" min="1" value={gtt.quantity} onChange={e => setGtt(g => ({ ...g, quantity: e.target.value }))} />
//             </div>
//             <div>
//               <label style={S.label}>Product</label>
//               <select style={S.select} value={gtt.product} onChange={e => setGtt(g => ({ ...g, product: e.target.value }))}>
//                 <option value="LONGTERM">DELIVERY (CNC)</option>
//                 <option value="INTRADAY">INTRADAY (MIS)</option>
//               </select>
//             </div>
//           </div>

//           {/* Clients */}
//           <div style={{ marginBottom: 12 }}>
//             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
//               <label style={{ ...S.label, margin: 0 }}><Users size={11} style={{ display: 'inline', marginRight: 4 }} />Clients</label>
//               <button onClick={selectAll} style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: 10, cursor: 'pointer', fontWeight: 600 }}>All Active</button>
//             </div>
//             {clients.map(c => {
//               const sel = selectedClients.includes(c.id), act = c.session_status === 'active';
//               return (
//                 <div key={c.id} onClick={() => act && toggleClient(c.id)}
//                   style={{
//                     display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px', marginBottom: 3, borderRadius: 5,
//                     cursor: act ? 'pointer' : 'not-allowed', background: sel ? '#1e3a5f' : '#1e293b',
//                     border: `1px solid ${sel ? '#3b82f6' : '#334155'}`, opacity: act ? 1 : 0.5
//                   }}>
//                   {sel ? <CheckSquare size={12} color="#3b82f6" /> : <Square size={12} color="#64748b" />}
//                   <span style={{ color: '#e2e8f0', fontSize: 12, flex: 1 }}>{c.name}</span>
//                   <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 10, background: act ? '#14532d' : '#450a0a', color: act ? '#22c55e' : '#ef4444' }}>{act ? 'Active' : 'Inactive'}</span>
//                 </div>
//               );
//             })}
//           </div>

//           <button onClick={handlePlace}
//             disabled={loading || !selectedClients.length || !gtt.tradingSymbol || !gtt.instrumentId || !gtt.gttValue || !gtt.price}
//             style={{
//               width: '100%', padding: '11px 0', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: 13, cursor: 'pointer',
//               background: gtt.transactionType === 'BUY' ? '#22c55e' : '#ef4444', color: 'white',
//               opacity: (loading || !selectedClients.length || !gtt.tradingSymbol || !gtt.instrumentId || !gtt.gttValue || !gtt.price) ? 0.6 : 1
//             }}>
//             {loading ? 'Placing…' : `Set GTT ${gtt.transactionType} ${gtt.tradingSymbol || '(select symbol)'}`}
//           </button>
//         </div>

//         {/* ── Order List ─────────────────────────────────────────────────── */}
//         <div>
//           <h3 style={{ color: '#e2e8f0', margin: '0 0 12px', fontSize: 14 }}>
//             Active Orders ({orders.filter(o => o.status === 'PLACED' || o.status === 'PENDING').length} / {orders.length} total)
//           </h3>
//           {orders.length === 0
//             ? <div style={{ color: '#475569', textAlign: 'center', padding: 40, fontSize: 13 }}>Koi GTT order nahi hai</div>
//             : orders.map(o => <OrderCard key={o.id} order={o} onCancel={handleCancel} onModify={setModifyOrder} />)
//           }
//         </div>
//       </div>
//     </div>
//   );
// }



import React, { useState, useEffect, useCallback } from 'react';
import { clientAPI, orderAPI } from '../services/api';
import { useLivePrices } from '../context/WSContext';
import toast from 'react-hot-toast';
import { SymbolSearch } from './OrderPanel';
import { Target, TrendingUp, TrendingDown, Users, CheckSquare, Square, Trash2, RefreshCw, Edit3, X, Save } from 'lucide-react';

const S = {
  input: { background: '#0f172a', border: '1px solid #334155', borderRadius: 6, padding: '8px 12px', color: '#e2e8f0', fontSize: 13, width: '100%', boxSizing: 'border-box', outline: 'none' },
  label: { color: '#94a3b8', fontSize: 11, marginBottom: 4, display: 'block', fontWeight: 600 },
  select: { background: '#0f172a', border: '1px solid #334155', borderRadius: 6, padding: '8px 12px', color: '#e2e8f0', fontSize: 13, width: '100%', outline: 'none' },
};

const STATUS_COLOR = { PENDING: '#f59e0b', PLACED: '#6366f1', TRIGGERED: '#22c55e', CANCELLED: '#64748b', FAILED: '#ef4444' };
const GTT_TYPES = {
  LTP_B_O: { label: 'Buy when LTP drops BELOW trigger', color: '#22c55e', icon: TrendingDown },
  LTP_A_O: { label: 'Sell when LTP rises ABOVE trigger', color: '#f59e0b', icon: TrendingUp },
};

// ─── GTT Modify Modal ─────────────────────────────────────────────────────
function ModifyModal({ order, onClose, onSaved }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    gttValue: String(order.trigger_price || ''),
    price: String(order.order_price || ''),
    quantity: String(order.quantity || 1),
    orderType: order.order_type || 'LIMIT',
    product: order.product || 'LONGTERM',
    gttType: order.gtt_type || 'LTP_B_O',
  });

  const handleSave = async () => {
    if (!form.gttValue || Number(form.gttValue) <= 0) { toast.error('Trigger price required'); return; }
    if (!form.price || Number(form.price) <= 0) { toast.error('Order price required'); return; }

    setSaving(true);
    try {
      const payload = {
        orderNumber: order.alice_order_id,
        tradingSymbol: order.trading_symbol,
        exchange: order.exchange,
        transactionType: order.transaction_type,
        orderType: form.orderType,
        product: form.product,
        validity: 'DAY',
        quantity: String(parseInt(form.quantity) || 1),
        price: Number(form.price),
        orderComplexity: 'REGULAR',
        instrumentId: order.instrument_id,
        gttType: form.gttType,
        gttValue: String(Number(form.gttValue)),
      };

      const res = await orderAPI.modifyGTT(order.client_id, payload);
      const d = res.data.data;
      if (d?.status === 'Ok') {
        toast.success('✅ GTT order modified!');
        onSaved();
        onClose();
      } else {
        toast.error(`❌ ${d?.message || 'Modify failed'}`);
      }
    } catch (e) {
      toast.error(e.response?.data?.message || e.message || 'Modify failed');
    }
    setSaving(false);
  };

  return (
    <div className="modal-overlay">
      <style>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 10000;
          background: rgba(0,0,0,0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }
        .modal-content {
          background: #1e293b;
          border-radius: 12px;
          padding: 24px;
          width: 100%;
          max-width: 420px;
          border: 1px solid #334155;
          box-shadow: 0 24px 64px rgba(0,0,0,0.8);
        }
        @media (max-width: 480px) {
          .modal-content {
            padding: 16px;
          }
        }
      `}</style>
      <div className="modal-content">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div>
            <h3 style={{ color: '#e2e8f0', margin: 0, fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Edit3 size={15} color="#6366f1" /> Modify GTT Order
            </h3>
            <p style={{ color: '#64748b', margin: '3px 0 0', fontSize: 11 }}>
              {order.transaction_type} {order.trading_symbol} · {order.exchange} · OrderID: {order.alice_order_id}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {/* GTT Type */}
          <div style={{ gridColumn: '1/-1' }}>
            <label style={S.label}>Trigger Condition</label>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {Object.entries(GTT_TYPES).map(([key, val]) => (
                <button key={key} onClick={() => setForm(f => ({ ...f, gttType: key }))}
                  style={{
                    flex: '1 1 auto', padding: '8px 0', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 700,
                    background: form.gttType === key ? val.color + '22' : '#0f172a',
                    color: form.gttType === key ? val.color : '#64748b',
                    borderWidth: 1, borderStyle: 'solid',
                    borderColor: form.gttType === key ? val.color : '#334155'
                  }}>
                  {val.label.split(' ').slice(0, 4).join(' ')}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={S.label}>Trigger Price ₹ <span style={{ color: '#f59e0b' }}>*</span></label>
            <input style={{ ...S.input, borderColor: '#f59e0b' }} type="number" step="0.05"
              value={form.gttValue} onChange={e => setForm(f => ({ ...f, gttValue: e.target.value }))} />
            <div style={{ fontSize: 9, color: '#475569', marginTop: 2 }}>Order is triggered when LTP hits this price</div>
          </div>

          <div>
            <label style={S.label}>Order Price ₹ <span style={{ color: '#6366f1' }}>*</span></label>
            <input style={{ ...S.input, borderColor: '#6366f1' }} type="number" step="0.05"
              value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
            <div style={{ fontSize: 9, color: '#475569', marginTop: 2 }}>Actual buy/sell price</div>
          </div>

          <div>
            <label style={S.label}>Quantity</label>
            <input style={S.input} type="number" min="1"
              value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
          </div>

          <div>
            <label style={S.label}>Order Type</label>
            <select style={S.select} value={form.orderType} onChange={e => setForm(f => ({ ...f, orderType: e.target.value }))}>
              <option value="LIMIT">LIMIT</option>
              <option value="MARKET">MARKET</option>
            </select>
          </div>

          <div>
            <label style={S.label}>Product</label>
            <select style={S.select} value={form.product} onChange={e => setForm(f => ({ ...f, product: e.target.value }))}>
              <option value="LONGTERM">DELIVERY (CNC)</option>
              <option value="INTRADAY">INTRADAY (MIS)</option>
            </select>
          </div>
        </div>

        {/* Current vs New Summary */}
        <div style={{ background: '#0f172a', borderRadius: 8, padding: 10, marginTop: 14, fontSize: 11, color: '#64748b' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, textAlign: 'center' }}>
            <div><div>Current Trigger</div><div style={{ color: '#f59e0b', fontWeight: 700, fontFamily: 'monospace' }}>₹{order.trigger_price}</div></div>
            <div><div>→ New Trigger</div><div style={{ color: '#22c55e', fontWeight: 700, fontFamily: 'monospace' }}>₹{form.gttValue || '—'}</div></div>
            <div><div>→ New Order</div><div style={{ color: '#6366f1', fontWeight: 700, fontFamily: 'monospace' }}>₹{form.price || '—'}</div></div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
          <button onClick={onClose}
            style={{ flex: 1, padding: '10px 0', background: '#1e293b', border: '1px solid #334155', borderRadius: 6, color: '#94a3b8', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            style={{
              flex: 2, padding: '10px 0', background: '#6366f1', border: 'none', borderRadius: 6, color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: 13,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: saving ? 0.7 : 1
            }}>
            <Save size={14} />{saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Order Card ───────────────────────────────────────────────────────────
function OrderCard({ order, onCancel, onModify }) {
  const { getPrice } = useLivePrices();
  const lp = getPrice(order.trading_symbol);
  const ltp = lp?.ltp;
  const dist = ltp ? ((order.trigger_price - ltp) / ltp * 100).toFixed(1) : null;
  const near = dist && Math.abs(parseFloat(dist)) < 1;
  const sc = STATUS_COLOR[order.status] || '#64748b';

  return (
    <div className="order-card" style={{
      background: '#1e293b', borderRadius: 8, padding: 12, marginBottom: 8, border: `${near ? 2 : 1}px solid ${near ? '#f59e0b' : '#334155'}`
    }}>
      {near && <div style={{ background: '#451a03', color: '#f59e0b', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, marginBottom: 8, display: 'inline-block' }}>⚡ Trigger ke paas! {dist}% dur</div>}
      <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 200px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, color: order.transaction_type === 'BUY' ? '#22c55e' : '#ef4444', fontSize: 12 }}>{order.transaction_type}</span>
            <span style={{ color: '#e2e8f0', fontWeight: 700 }}>{order.trading_symbol}</span>
            <span style={{ color: '#64748b', fontSize: 11 }}>{order.exchange}</span>
            <span style={{ padding: '1px 6px', borderRadius: 10, fontSize: 10, fontWeight: 700, background: sc + '22', color: sc }}>{order.status}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '2px 12px', fontSize: 11 }}>
            <span style={{ color: '#94a3b8' }}>Client: <strong style={{ color: '#e2e8f0' }}>{order.client_name}</strong></span>
            <span style={{ color: '#94a3b8' }}>Qty: <strong style={{ color: '#e2e8f0' }}>{order.quantity}</strong></span>
            <span style={{ color: '#f59e0b' }}>Trigger: <strong>₹{order.trigger_price}</strong></span>
            <span style={{ color: '#6366f1' }}>Order: <strong>₹{order.order_price}</strong></span>
            {ltp > 0 && <span style={{ color: '#94a3b8' }}>LTP: <strong style={{ color: lp.changePct >= 0 ? '#22c55e' : '#ef4444' }}>₹{ltp.toFixed(2)}</strong></span>}
            <span style={{ color: '#475569', fontSize: 10 }}>{order.gtt_type === 'LTP_B_O' ? '↓ Below' : '↑ Above'}</span>
          </div>
          <div style={{ fontSize: 9, color: '#475569', marginTop: 4 }}>{new Date(order.created_at).toLocaleString('en-IN')}</div>
        </div>

        {/* Action buttons */}
        {(order.status === 'PLACED' || order.status === 'PENDING') && (
          <div style={{ display: 'flex', flexDirection: 'row', gap: 4, flexShrink: 0, flexWrap: 'wrap' }}>
            {order.alice_order_id && (
              <button onClick={() => onModify(order)}
                style={{ background: '#6366f1', border: 'none', borderRadius: 6, color: 'white', padding: '5px 8px', cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                <Edit3 size={10} /> Modify
              </button>
            )}
            <button onClick={() => onCancel(order)}
              style={{ background: 'none', border: '1px solid #ef4444', borderRadius: 6, color: '#ef4444', padding: '5px 8px', cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Trash2 size={10} /> Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main ConditionalOrders Component ────────────────────────────────────
export default function ConditionalOrders({ selectedSymbol }) {
  const { getPrice } = useLivePrices();

  const [clients, setClients] = useState([]);
  const [selectedClients, setSelectedClients] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modifyOrder, setModifyOrder] = useState(null); // order to modify
  const [gtt, setGtt] = useState({
    tradingSymbol: '',
    exchange: 'NSE',
    transactionType: 'BUY',
    orderType: 'LIMIT',
    product: 'LONGTERM',
    validity: 'DAY',
    quantity: 1,
    gttValue: '',
    price: '',
    gttType: 'LTP_B_O',
    orderComplexity: 'REGULAR',
    instrumentId: '',
  });

  useEffect(() => {
    clientAPI.getSessions().then(r => setClients(r.data.data || [])).catch(() => { });
    loadOrders();
  }, []);

  useEffect(() => {
    if (selectedSymbol) setGtt(g => ({ ...g, tradingSymbol: selectedSymbol, instrumentId: '' }));
  }, [selectedSymbol]);

  useEffect(() => {
    setGtt(g => ({ ...g, gttType: g.transactionType === 'BUY' ? 'LTP_B_O' : 'LTP_A_O' }));
  }, [gtt.transactionType]);

  const loadOrders = async () => {
    try { const r = await orderAPI.getConditionalOrders(); setOrders(r.data.data || []); } catch { }
  };

  const handleSymbolSelect = useCallback(inst => {
    setGtt(g => ({
      ...g,
      tradingSymbol: inst.trading_symbol || inst.symbol || g.tradingSymbol,
      exchange: inst.exchange || g.exchange,
      instrumentId: inst.token || '',
    }));
  }, []);

  const toggleClient = id => setSelectedClients(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const selectAll = () => setSelectedClients(clients.filter(c => c.session_status === 'active').map(c => c.id));

  const handlePlace = async () => {
    if (!selectedClients.length) { toast.error('Client select karo'); return; }
    if (!gtt.tradingSymbol) { toast.error('Symbol select karo'); return; }
    if (!gtt.instrumentId) { toast.error('Symbol dropdown se select karo (token chahiye)'); return; }
    if (!gtt.gttValue || Number(gtt.gttValue) <= 0) { toast.error('Trigger price enter karo'); return; }
    if (!gtt.price || Number(gtt.price) <= 0) { toast.error('Order price enter karo'); return; }

    setLoading(true);
    try {
      const data = { ...gtt, gttValue: Number(gtt.gttValue), price: Number(gtt.price), quantity: parseInt(gtt.quantity) || 1 };
      if (selectedClients.length === 1) {
        const res = await orderAPI.placeGTT(selectedClients[0], data);
        const d = res.data.data;
        if (d?.status === 'Ok') toast.success('✅ GTT order placed!');
        else toast.error(`❌ ${d?.message || JSON.stringify(d)}`);
      } else {
        const res = await orderAPI.placeBulkGTT({ clientIds: selectedClients, gttData: data });
        const ok = (res.data.data || []).filter(r => r.status === 'PLACED').length;
        toast.success(`✅ GTT ${ok}/${selectedClients.length} clients ke liye place hua`);
      }
      loadOrders();
      setGtt(g => ({ ...g, gttValue: '', price: '' }));
    } catch (e) {
      toast.error(e.response?.data?.message || e.message || 'GTT failed');
    }
    setLoading(false);
  };

  const handleCancel = async (order) => {
    if (!window.confirm(`Cancel GTT order for ${order.trading_symbol}?`)) return;
    try {
      await orderAPI.cancelGTT(order.client_id, { orderNumber: order.alice_order_id });
      toast.success('Order cancelled');
      loadOrders();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Cancel failed');
    }
  };

  const livePrice = getPrice(gtt.tradingSymbol);
  const curGttType = GTT_TYPES[gtt.gttType];

  return (
    <div className="conditional-orders">
      <style>{`
        .conditional-orders {
          padding: 16px;
        }
        .conditional-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
          flex-wrap: wrap;
          gap: 8px;
        }
        .conditional-grid {
          display: grid;
          grid-template-columns: 1fr 1.6fr;
          gap: 16px;
        }
        /* Form card */
        .gtt-form-card {
          background: #0f172a;
          border-radius: 10px;
          padding: 16px;
          border: 1px solid #1e293b;
        }
        /* Client list container - make scrollable on small screens */
        .client-list {
          max-height: 300px;
          overflow-y: auto;
          margin-bottom: 12px;
          padding-right: 4px;
        }
        .client-item {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 5px 8px;
          margin-bottom: 3px;
          border-radius: 5px;
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
        /* Responsive */
        @media (max-width: 768px) {
          .conditional-orders {
            padding: 12px;
          }
          .conditional-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }
          .gtt-form-card {
            padding: 12px;
          }
        }
        @media (max-width: 480px) {
          .conditional-orders {
            padding: 8px;
          }
          .gtt-form-card {
            padding: 10px;
          }
          .client-list {
            max-height: 200px;
          }
        }
      `}</style>

      {/* Modify Modal */}
      {modifyOrder && (
        <ModifyModal
          order={modifyOrder}
          onClose={() => setModifyOrder(null)}
          onSaved={loadOrders}
        />
      )}

      <div className="conditional-header">
        <div>
          <h2 style={{ color: '#e2e8f0', margin: 0, fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Target size={18} color="#f59e0b" /> Conditional Orders (GTT)
          </h2>
          <p style={{ color: '#64748b', margin: '3px 0 0', fontSize: 12 }}>Price target pe auto-execute hoga</p>
        </div>
        <button onClick={loadOrders} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 6, color: '#94a3b8', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      <div className="conditional-grid">
        {/* ── GTT Form ───────────────────────────────────────────────────── */}
        <div className="gtt-form-card">
          <h3 style={{ color: '#e2e8f0', margin: '0 0 12px', fontSize: 13 }}>New Conditional Order</h3>

          <div style={{ display: 'flex', gap: 4, marginBottom: 12, flexWrap: 'wrap' }}>
            {['BUY', 'SELL'].map(t => (
              <button key={t} onClick={() => setGtt(g => ({ ...g, transactionType: t }))}
                style={{
                  flex: '1 1 80px', padding: '8px 0', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: 12,
                  background: gtt.transactionType === t ? (t === 'BUY' ? '#166534' : '#7f1d1d') : '#1e293b',
                  color: gtt.transactionType === t ? (t === 'BUY' ? '#22c55e' : '#ef4444') : '#64748b'
                }}>
                {t}
              </button>
            ))}
          </div>

          <div style={{ background: '#1e293b', borderRadius: 6, padding: '7px 10px', marginBottom: 12, fontSize: 11 }}>
            <div style={{ color: curGttType?.color, fontWeight: 700 }}>{curGttType?.label}</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={S.label}>Symbol — NSE / BSE / NFO / MCX / CDS</label>
              <SymbolSearch
                value={gtt.tradingSymbol}
                token={gtt.instrumentId}
                onSelect={handleSymbolSelect}
                placeholder="ADANIPORTS-EQ, CRUDEOIL, GOLD…"
              />
              {livePrice?.ltp > 0 && (
                <div style={{ fontSize: 10, color: '#64748b', marginTop: 3, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span>LTP: <span style={{ color: livePrice.changePct >= 0 ? '#22c55e' : '#ef4444', fontWeight: 700 }}>₹{livePrice.ltp.toFixed(2)}</span></span>
                  <span>H:<span style={{ color: '#22c55e' }}>₹{livePrice.high?.toFixed(2)}</span></span>
                  <span>L:<span style={{ color: '#ef4444' }}>₹{livePrice.low?.toFixed(2)}</span></span>
                </div>
              )}
            </div>

            <div>
              <label style={S.label}>Trigger ₹ <span style={{ color: '#f59e0b' }}>*</span></label>
              <input style={{ ...S.input, borderColor: '#f59e0b' }} type="number" step="0.05"
                placeholder={gtt.transactionType === 'BUY' ? 'Buy trigger price' : 'Sell trigger price'}
                value={gtt.gttValue} onChange={e => setGtt(g => ({ ...g, gttValue: e.target.value }))} />
            </div>
            <div>
              <label style={S.label}>Order Price ₹ <span style={{ color: '#6366f1' }}>*</span></label>
              <input style={{ ...S.input, borderColor: '#6366f1' }} type="number" step="0.05"
                placeholder="Actual trade price"
                value={gtt.price} onChange={e => setGtt(g => ({ ...g, price: e.target.value }))} />
            </div>
            <div>
              <label style={S.label}>Quantity</label>
              <input style={S.input} type="number" min="1" value={gtt.quantity} onChange={e => setGtt(g => ({ ...g, quantity: e.target.value }))} />
            </div>
            <div>
              <label style={S.label}>Product</label>
              <select style={S.select} value={gtt.product} onChange={e => setGtt(g => ({ ...g, product: e.target.value }))}>
                <option value="LONGTERM">DELIVERY (CNC)</option>
                <option value="INTRADAY">INTRADAY (MIS)</option>
              </select>
            </div>
          </div>

          {/* Clients */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
              <label style={{ ...S.label, margin: 0 }}><Users size={11} style={{ display: 'inline', marginRight: 4 }} />Clients</label>
              <button onClick={selectAll} style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: 10, cursor: 'pointer', fontWeight: 600 }}>All Active</button>
            </div>
            <div className="client-list">
              {clients.map(c => {
                const sel = selectedClients.includes(c.id), act = c.session_status === 'active';
                return (
                  <div key={c.id} onClick={() => act && toggleClient(c.id)}
                    className={`client-item ${sel ? 'selected' : ''} ${!act ? 'inactive' : ''}`}>
                    {sel ? <CheckSquare size={12} color="#3b82f6" /> : <Square size={12} color="#64748b" />}
                    <span style={{ color: '#e2e8f0', fontSize: 12, flex: 1 }}>{c.name}</span>
                    <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 10, background: act ? '#14532d' : '#450a0a', color: act ? '#22c55e' : '#ef4444' }}>{act ? 'Active' : 'Inactive'}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <button onClick={handlePlace}
            disabled={loading || !selectedClients.length || !gtt.tradingSymbol || !gtt.instrumentId || !gtt.gttValue || !gtt.price}
            style={{
              width: '100%', padding: '11px 0', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: 13, cursor: 'pointer',
              background: gtt.transactionType === 'BUY' ? '#22c55e' : '#ef4444', color: 'white',
              opacity: (loading || !selectedClients.length || !gtt.tradingSymbol || !gtt.instrumentId || !gtt.gttValue || !gtt.price) ? 0.6 : 1
            }}>
            {loading ? 'Placing…' : `Set GTT ${gtt.transactionType} ${gtt.tradingSymbol || '(select symbol)'}`}
          </button>
        </div>

        {/* ── Order List ─────────────────────────────────────────────────── */}
        <div>
          <h3 style={{ color: '#e2e8f0', margin: '0 0 12px', fontSize: 14 }}>
            Active Orders ({orders.filter(o => o.status === 'PLACED' || o.status === 'PENDING').length} / {orders.length} total)
          </h3>
          {orders.length === 0
            ? <div style={{ color: '#475569', textAlign: 'center', padding: 40, fontSize: 13 }}>Koi GTT order nahi hai</div>
            : orders.map(o => <OrderCard key={o.id} order={o} onCancel={handleCancel} onModify={setModifyOrder} />)
          }
        </div>
      </div>
    </div>
  );
}