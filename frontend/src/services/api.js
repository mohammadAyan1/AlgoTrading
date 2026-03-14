import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true
});

// ─── Client APIs ──────────────────────────────────────────────────────────
export const clientAPI = {
  getAll: () => api.get('/clients'),
  getSessions: () => api.get('/clients/sessions'),
  create: (data) => api.post('/clients', data),
  update: (id, data) => api.put(`/clients/${id}`, data),
  delete: (id) => api.delete(`/clients/${id}`),
  getLoginUrl: (id) => api.get(`/clients/${id}/login-url`),
  activateSession: (id, authCode) => api.post(`/clients/${id}/activate-session`, { authCode }),
  getProfile: (id) => api.get(`/clients/${id}/profile`),
  getLimits: (id) => api.get(`/clients/${id}/limits`),
};

// ─── Order APIs ───────────────────────────────────────────────────────────
export const orderAPI = {
  placeOrder: (clientId, data) => api.post(`/orders/${clientId}/place`, data),
  getOrderBook: (clientId) => api.get(`/orders/${clientId}/book`),
  getTrades: (clientId) => api.get(`/orders/${clientId}/trades`),
  cancelOrder: (clientId, data) => api.post(`/orders/${clientId}/cancel`, data),
  getHoldings: (clientId, productType = 'CNC') => api.get(`/orders/${clientId}/holdings?productType=${productType}`),
  getPositions: (clientId) => api.get(`/orders/${clientId}/positions`),

  // GTT / Conditional
  placeGTT: (clientId, data) => api.post(`/orders/${clientId}/gtt/place`, data),
  getGTTOrders: (clientId) => api.get(`/orders/${clientId}/gtt`),
  cancelGTT: (clientId, data) => api.post(`/orders/${clientId}/gtt/cancel`, data),
  modifyGTT: (clientId, data) => api.put(`/orders/${clientId}/gtt/modify`, data),

  // Bulk operations
  placeBulkOrder: (data) => api.post('/orders/bulk/place', data),
  placeBulkGTT: (data) => api.post('/orders/bulk/gtt', data),

  // Logs
  getOrdersLog: (params) => api.get('/orders-log', { params }),
  getConditionalOrders: (params) => api.get('/conditional-orders', { params }),
};

// ─── Market APIs ──────────────────────────────────────────────────────────
export const marketAPI = {
  getLivePrices: () => api.get('/market/prices'),
  getSymbolPrice: (symbol, exchange = 'NSE') => api.get(`/market/price/${symbol}?exchange=${exchange}`),
  getCandleData: (symbol, interval = '1min', count = 60, exchange = 'NSE') =>
    api.get(`/market/candles/${symbol}?interval=${interval}&count=${count}&exchange=${exchange}`),
  searchInstruments: (q, exchange = null, limit = 20) =>
    api.get(`/market/search?q=${encodeURIComponent(q)}${exchange ? `&exchange=${exchange}` : ''}&limit=${limit}`),
  subscribeSymbols: (symbols) => api.post('/market/subscribe', { symbols }),
  getAllInstruments: (exchange = null) => api.get(`/market/instruments${exchange ? `?exchange=${exchange}` : ''}`),
  getWatchlist: () => api.get('/market/watchlist'),
  addToWatchlist: (data) => api.post('/market/watchlist', data),
  removeFromWatchlist: (id) => api.delete(`/market/watchlist/${id}`),
};

export default api;



// import axios from 'axios';

// const api = axios.create({
//   baseURL: process.env.REACT_APP_API_URL,
//   headers: { 'Content-Type': 'application/json' },
//   withCredentials: true
// });

// // ─── Client APIs ──────────────────────────────────────────────────────────
// export const clientAPI = {
//   getAll: () => api.get('/clients'),
//   getSessions: () => api.get('/clients/sessions'),
//   create: (data) => api.post('/clients', data),
//   update: (id, data) => api.put(`/clients/${id}`, data),
//   delete: (id) => api.delete(`/clients/${id}`),
//   getLoginUrl: (id) => api.get(`/clients/${id}/login-url`),
//   activateSession: (id, authCode) => api.post(`/clients/${id}/activate-session`, { authCode }),
//   getProfile: (id) => api.get(`/clients/${id}/profile`),
//   getLimits: (id) => api.get(`/clients/${id}/limits`),
// };

// // ─── Order APIs ───────────────────────────────────────────────────────────
// export const orderAPI = {
//   placeOrder: (clientId, data) => api.post(`/orders/${clientId}/place`, data),
//   getOrderBook: (clientId) => api.get(`/orders/${clientId}/book`),
//   getTrades: (clientId) => api.get(`/orders/${clientId}/trades`),
//   cancelOrder: (clientId, data) => api.post(`/orders/${clientId}/cancel`, data),
//   getHoldings: (clientId, productType = 'CNC') =>
//     api.get(`/orders/${clientId}/holdings?productType=${productType}`),
//   getPositions: (clientId) => api.get(`/orders/${clientId}/positions`),

//   // GTT / Conditional
//   placeGTT: (clientId, data) => api.post(`/orders/${clientId}/gtt/place`, data),
//   getGTTOrders: (clientId) => api.get(`/orders/${clientId}/gtt`),
//   cancelGTT: (clientId, data) => api.post(`/orders/${clientId}/gtt/cancel`, data),
//   modifyGTT: (clientId, data) => api.put(`/orders/${clientId}/gtt/modify`, data),

//   // Bulk operations
//   placeBulkOrder: (data) => api.post('/orders/bulk/place', data),
//   placeBulkGTT: (data) => api.post('/orders/bulk/gtt', data),

//   // Logs
//   getOrdersLog: (params) => api.get('/orders-log', { params }),
//   getConditionalOrders: (params) => api.get('/conditional-orders', { params }),
// };

// // ─── Market APIs ──────────────────────────────────────────────────────────
// export const marketAPI = {
//   getLivePrices: () => api.get('/market/prices'),

//   getSymbolPrice: (symbol, exchange = 'NSE') =>
//     api.get(`/market/price/${symbol}?exchange=${exchange}`),

//   // ✅ NEW: Live F&O quote — works for NFO options/futures
//   // Fetches from Alice Blue REST if not in WS cache
//   getQuote: (exchange, token, symbol) => {
//     const params = new URLSearchParams();
//     if (exchange) params.set('exchange', exchange);
//     if (token) params.set('token', token);
//     if (symbol) params.set('symbol', symbol);
//     return api.get(`/market/quote?${params.toString()}`);
//   },

//   getCandleData: (symbol, interval = '1min', count = 60, exchange = 'NSE') =>
//     api.get(`/market/candles/${symbol}?interval=${interval}&count=${count}&exchange=${exchange}`),

//   searchInstruments: (q, exchange = null, limit = 20) =>
//     api.get(`/market/search?q=${encodeURIComponent(q)}${exchange ? `&exchange=${exchange}` : ''}&limit=${limit}`),

//   // ✅ Subscribe tokens to Alice Blue WS for live prices (F&O instruments)
//   subscribeSymbols: (symbols) => api.post('/market/subscribe', { symbols }),

//   getAllInstruments: (exchange = null) =>
//     api.get(`/market/instruments${exchange ? `?exchange=${exchange}` : ''}`),

//   getWatchlist: () => api.get('/market/watchlist'),
//   addToWatchlist: (data) => api.post('/market/watchlist', data),
//   removeFromWatchlist: (id) => api.delete(`/market/watchlist/${id}`),
// };

// export default api;