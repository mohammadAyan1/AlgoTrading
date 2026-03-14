

const db = require('../config/db');
const livePriceService = require('../services/websocketService');
const scripMaster = require('../services/scripMasterService');

// ─────────────────────────────────────────────────────────────────────────────
// INIT — start price feeds and load contract master
// ─────────────────────────────────────────────────────────────────────────────
async function init() {
  try { // [TRY/CATCH ADDED]
    await scripMaster.init();

    // Always start price feed (auto-detects internet vs simulation)
    await livePriceService.startYahooPolling();

    // If active AB session exists, try to upgrade to real-time WS
    try {
      const [rows] = await db.query(
        `SELECT user_id, user_session FROM clients
         WHERE is_active=1 AND user_session IS NOT NULL
           AND session_expires_at > NOW()
         LIMIT 1`
      );
      if (rows.length && livePriceService.hasNetwork()) {
        console.log(`🔑 Active session found for ${rows[0].user_id}, upgrading to WS…`);
        await livePriceService.startReal(rows[0].user_session, rows[0].user_id);
      } else if (rows.length) {
        console.log('ℹ️  Session exists but no internet — using simulation');
      }
    } catch (err) {
      // DB might not have table yet — ignore
      console.error('init DB session check error:', err.message);
    }
  } catch (err) {
    console.error('init error:', err.message);
  }
}

init().catch(err => console.warn('Market init error:', err.message));

// ─────────────────────────────────────────────────────────────────────────────
// Helper: get current data source status
// ─────────────────────────────────────────────────────────────────────────────
const getStatus = () => {
  try { // [TRY/CATCH ADDED]
    if (livePriceService.isRealTime()) return { source: 'AliceBlue WebSocket (real-time)', badge: 'AB_LIVE' };
    if (livePriceService.hasNetwork()) return { source: 'Yahoo Finance NSE (live ~3s delay)', badge: 'YAHOO' };
    return { source: 'Simulation ⚠️ NOT real prices — fix internet on server', badge: 'SIM' };
  } catch (err) {
    console.error('getStatus error:', err.message);
    return { source: 'Unknown', badge: 'ERR' };
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTED CONTROLLER FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

exports.getLivePrices = async (req, res) => {
  try { // [TRY/CATCH ADDED]
    const status = getStatus();
    res.json({ success: true, ...status, data: livePriceService.getAllPrices() });
  } catch (err) {
    console.error('getLivePrices error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getSymbolPrice = async (req, res) => {
  try { // [TRY/CATCH ADDED]
    const { exchange = 'NSE' } = req.query;
    const sym = req.params.symbol.toUpperCase();
    const price = livePriceService.getBySymbol(exchange, sym) ||
      livePriceService.getBySymbol(exchange, sym + '-EQ');
    if (!price) return res.status(404).json({ success: false, message: 'Symbol not found' });
    res.json({ success: true, data: price });
  } catch (err) {
    console.error('getSymbolPrice error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getCandleData = async (req, res) => {
  try { // [TRY/CATCH ADDED]
    const { interval = '1min', count = 60, exchange = 'NSE' } = req.query;
    const candles = livePriceService.generateCandleData(
      req.params.symbol.toUpperCase(), exchange, interval, parseInt(count)
    );
    res.json({ success: true, data: { symbol: req.params.symbol.toUpperCase(), exchange, interval, candles } });
  } catch (err) {
    console.error('getCandleData error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.searchInstruments = async (req, res) => {
  try { // [TRY/CATCH ADDED]
    const { q, exchange = null, limit = 20 } = req.query;
    if (!q || q.length < 2) return res.status(400).json({ success: false, message: 'Min 2 chars' });
    const results = scripMaster.search(q, exchange, parseInt(limit));
    const enriched = results.map(inst => ({
      ...inst, livePrice: livePriceService.getBySymbol(inst.exchange, inst.symbol)
    }));
    res.json({ success: true, data: enriched });
  } catch (err) {
    console.error('searchInstruments error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.subscribeSymbols = async (req, res) => {
  try { // [TRY/CATCH ADDED]
    const { symbols } = req.body;
    if (!symbols?.length) return res.status(400).json({ success: false, message: 'symbols required' });
    livePriceService.subscribe(symbols);
    res.json({ success: true, message: `Subscribed ${symbols.length} instruments` });
  } catch (err) {
    console.error('subscribeSymbols error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAllInstruments = async (req, res) => {
  try { // [TRY/CATCH ADDED]
    const { exchange } = req.query;
    const all = Object.values(livePriceService.getAllPrices());
    const data = exchange ? all.filter(i => i.exchange === exchange.toUpperCase()) : all;
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    console.error('getAllInstruments error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getWatchlist = async (req, res) => {
  try { // [TRY/CATCH ADDED]
    const [rows] = await db.query('SELECT * FROM watchlist ORDER BY trading_symbol');
    const enriched = rows.map(item => ({
      ...item,
      livePrice: livePriceService.getBySymbol(item.exchange, item.trading_symbol)
    }));
    res.json({ success: true, data: enriched });
  } catch (err) {
    console.error('getWatchlist error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.addToWatchlist = async (req, res) => {
  try { // [TRY/CATCH ADDED]
    const { trading_symbol, exchange, display_name, instrument_id, token } = req.body;
    await db.query(
      'INSERT IGNORE INTO watchlist (trading_symbol, exchange, display_name, instrument_id) VALUES (?,?,?,?)',
      [trading_symbol.toUpperCase(), exchange, display_name || trading_symbol, instrument_id || token || '']
    );
    if (token) livePriceService.subscribe([{
      token, symbol: trading_symbol.toUpperCase(),
      exchange: exchange.toUpperCase(), name: display_name || trading_symbol
    }]);
    res.json({ success: true, message: 'Added to watchlist' });
  } catch (err) {
    console.error('addToWatchlist error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.removeFromWatchlist = async (req, res) => {
  try { // [TRY/CATCH ADDED]
    await db.query('DELETE FROM watchlist WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Removed' });
  } catch (err) {
    console.error('removeFromWatchlist error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getStatus = async (req, res) => {
  try { // [TRY/CATCH ADDED]
    res.json({ success: true, ...getStatus(), hasInternet: livePriceService.hasNetwork() });
  } catch (err) {
    console.error('getStatus error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.livePriceService = livePriceService;

// GET /api/market/reload-instruments  — manually trigger contract master download
exports.reloadInstruments = async (req, res) => {
  try {
    const msg = await scripMaster.reload();
    res.json({ success: true, message: msg, stats: scripMaster.getStats() });
  } catch (err) {
    console.error('reloadInstruments error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/market/instruments-stats
exports.getInstrumentsStats = async (req, res) => {
  try { // [TRY/CATCH ADDED]
    res.json({ success: true, data: scripMaster.getStats() });
  } catch (err) {
    console.error('getInstrumentsStats error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/market/contract-master-url — return URL so frontend can fetch directly
exports.getContractMasterUrl = (req, res) => {
  try { // [TRY/CATCH ADDED]
    const { exchange = 'NSE' } = req.query;
    res.json({
      success: true,
      url: `https://v2api.aliceblueonline.com/restpy/static/contract_master/V2/${exchange.toUpperCase()}`,
      exchange: exchange.toUpperCase()
    });
  } catch (err) {
    console.error('getContractMasterUrl error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/market/contract-master?exchange=NSE
// Returns instruments from backend cache/service so browser never calls external domain directly.
exports.getContractMaster = (req, res) => {
  try {
    const { exchange = 'NSE' } = req.query;
    const exch = String(exchange).toUpperCase();
    const data = scripMaster.getInstruments(exch);
    res.json({
      success: true,
      exchange: exch,
      count: data.length,
      data
    });
  } catch (err) {
    console.error('getContractMaster error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};



// const db = require('../config/db');
// const livePriceService = require('../services/websocketService');
// const scripMaster = require('../services/scripMasterService');
// const axios = require('axios');

// const BASE_URL = process.env.ALICE_BASE_URL || 'https://a3.aliceblueonline.com';

// // ─────────────────────────────────────────────────────────────────────────────
// // Helper: get any active client session (for fetching F&O prices)
// // ─────────────────────────────────────────────────────────────────────────────
// async function getAnyActiveSession() {
//   try {
//     const [rows] = await db.query(
//       `SELECT user_session, user_id FROM clients
//        WHERE is_active = 1 AND user_session IS NOT NULL
//          AND session_expires_at > NOW()
//        ORDER BY id ASC LIMIT 1`
//     );
//     return rows.length ? rows[0] : null;
//   } catch (e) {
//     return null;
//   }
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Helper: fetch live quote from Alice Blue REST for a specific token/symbol
// // Used for F&O instruments that Yahoo Finance doesn't cover
// // ─────────────────────────────────────────────────────────────────────────────
// async function fetchAliceQuote(session, exchange, token) {
//   try {
//     // Alice Blue market data v2 quote endpoint
//     const resp = await axios.get(
//       `${BASE_URL}/open-api/market-data/v2/quotes`,
//       {
//         headers: { Authorization: `Bearer ${session}` },
//         params: { exchange, token },
//         timeout: 5000,
//       }
//     );
//     const d = resp.data?.result?.[0] || resp.data?.data?.[0];
//     if (!d) return null;

//     const ltp = parseFloat(d.ltp || d.price || 0);
//     const prevClose = parseFloat(d.close || d.prevClose || 0);
//     const change = ltp - prevClose;
//     const changePct = prevClose > 0 ? (change / prevClose) * 100 : 0;

//     return {
//       ltp: +ltp.toFixed(2),
//       open: parseFloat(d.open || 0),
//       high: parseFloat(d.high || 0),
//       low: parseFloat(d.low || 0),
//       prevClose: +prevClose.toFixed(2),
//       volume: parseInt(d.volume || d.vol || 0),
//       oi: parseInt(d.oi || d.openInterest || 0),
//       bid: parseFloat(d.bid || d.bestBuyPrice || 0),
//       ask: parseFloat(d.ask || d.bestSellPrice || 0),
//       bidQty: parseInt(d.bidQty || d.bestBuyQty || 0),
//       askQty: parseInt(d.askQty || d.bestSellQty || 0),
//       change: +change.toFixed(2),
//       changePct: +changePct.toFixed(2),
//       upperCircuit: parseFloat(d.upperCircuit || d.uc || 0),
//       lowerCircuit: parseFloat(d.lowerCircuit || d.lc || 0),
//       timestamp: Date.now(),
//       isSimulated: false,
//     };
//   } catch (e) {
//     // Try alternate Alice Blue endpoint (ScripDetails)
//     try {
//       const resp2 = await axios.post(
//         `${BASE_URL}/open-api/ScripDetails`,
//         { exchange, tradingSymbol: token },
//         {
//           headers: { Authorization: `Bearer ${session}`, 'Content-Type': 'application/json' },
//           timeout: 5000,
//         }
//       );
//       const d = resp2.data?.result || resp2.data?.data;
//       if (!d) return null;
//       const ltp = parseFloat(d.ltp || 0);
//       const prevClose = parseFloat(d.closeprice || d.prevClose || 0);
//       const change = ltp - prevClose;
//       const changePct = prevClose > 0 ? (change / prevClose) * 100 : 0;
//       return {
//         ltp: +ltp.toFixed(2),
//         open: parseFloat(d.openprice || 0),
//         high: parseFloat(d.highprice || 0),
//         low: parseFloat(d.lowprice || 0),
//         prevClose: +prevClose.toFixed(2),
//         volume: parseInt(d.volume || 0),
//         oi: parseInt(d.openinterest || 0),
//         bid: parseFloat(d.bestbuy1price || 0),
//         ask: parseFloat(d.bestsell1price || 0),
//         change: +change.toFixed(2),
//         changePct: +changePct.toFixed(2),
//         timestamp: Date.now(),
//         isSimulated: false,
//       };
//     } catch {
//       return null;
//     }
//   }
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // INIT
// // ─────────────────────────────────────────────────────────────────────────────
// async function init() {
//   try {
//     await scripMaster.init();
//     await livePriceService.startYahooPolling();
//     try {
//       const [rows] = await db.query(
//         `SELECT user_id, user_session FROM clients
//          WHERE is_active=1 AND user_session IS NOT NULL
//            AND session_expires_at > NOW()
//          LIMIT 1`
//       );
//       if (rows.length && livePriceService.hasNetwork()) {
//         console.log(`🔑 Active session found for ${rows[0].user_id}, upgrading to WS…`);
//         await livePriceService.startReal(rows[0].user_session, rows[0].user_id);
//       }
//     } catch (err) {
//       console.error('init DB session check error:', err.message);
//     }
//   } catch (err) {
//     console.error('init error:', err.message);
//   }
// }

// init().catch(err => console.warn('Market init error:', err.message));

// const getStatus = () => {
//   try {
//     if (livePriceService.isRealTime()) return { source: 'AliceBlue WebSocket (real-time)', badge: 'AB_LIVE' };
//     if (livePriceService.hasNetwork()) return { source: 'Yahoo Finance NSE (live ~3s delay)', badge: 'YAHOO' };
//     return { source: 'Simulation ⚠️ NOT real prices', badge: 'SIM' };
//   } catch (err) {
//     return { source: 'Unknown', badge: 'ERR' };
//   }
// };

// // ─────────────────────────────────────────────────────────────────────────────
// // CONTROLLERS
// // ─────────────────────────────────────────────────────────────────────────────

// exports.getLivePrices = async (req, res) => {
//   try {
//     const status = getStatus();
//     res.json({ success: true, ...status, data: livePriceService.getAllPrices() });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// exports.getSymbolPrice = async (req, res) => {
//   try {
//     const { exchange = 'NSE' } = req.query;
//     const sym = req.params.symbol.toUpperCase();
//     const price = livePriceService.getBySymbol(exchange, sym) ||
//       livePriceService.getBySymbol(exchange, sym + '-EQ');
//     if (!price) return res.status(404).json({ success: false, message: 'Symbol not found' });
//     res.json({ success: true, data: price });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// // ─────────────────────────────────────────────────────────────────────────────
// // ✅ NEW: Live F&O Quote — fetches real-time price for any NFO/MCX instrument
// // GET /api/market/quote?exchange=NFO&token=12345&symbol=NIFTY17MAR26C24000
// // ─────────────────────────────────────────────────────────────────────────────
// exports.getQuote = async (req, res) => {
//   try {
//     const { exchange = 'NFO', token, symbol } = req.query;
//     if (!token && !symbol) {
//       return res.status(400).json({ success: false, message: 'token or symbol required' });
//     }

//     // 1. Check live price cache first (already subscribed via WS)
//     const cached = token
//       ? livePriceService.priceCache.get(`${exchange}:${token}`)
//       : livePriceService.getBySymbol(exchange, symbol);

//     if (cached && Date.now() - (cached.timestamp || 0) < 5000) {
//       return res.json({ success: true, source: 'websocket', data: cached });
//     }

//     // 2. Fetch from Alice Blue REST using any active session
//     const sess = await getAnyActiveSession();
//     if (!sess) {
//       // No active session — return cached (possibly stale) or empty
//       if (cached) return res.json({ success: true, source: 'cache_stale', data: cached });
//       return res.status(404).json({ success: false, message: 'No active session for F&O price fetch. Please login a client.' });
//     }

//     const lookupKey = token || symbol;
//     const quote = await fetchAliceQuote(sess.user_session, exchange, lookupKey);

//     if (!quote) {
//       if (cached) return res.json({ success: true, source: 'cache_stale', data: cached });
//       return res.status(404).json({ success: false, message: 'Price not available for this instrument' });
//     }

//     // 3. Save to cache and emit
//     if (symbol) {
//       const instMeta = token
//         ? scripMaster.getByToken(exchange, token)
//         : scripMaster.getBySymbol(exchange, symbol);

//       const fullQuote = {
//         ...quote,
//         symbol: symbol || instMeta?.trading_symbol || lookupKey,
//         name: instMeta?.formatted_name || symbol || lookupKey,
//         exchange: exchange,
//         token: token || instMeta?.token || '',
//         lotSize: instMeta?.lot_size || 1,
//         instrumentType: instMeta?.instrument_type || '',
//         expiry: instMeta?.expiry || null,
//         strikePrice: instMeta?.strike_price || null,
//         optionType: instMeta?.option_type || null,
//       };

//       // Cache it for WebSocket broadcast
//       if (fullQuote.symbol) {
//         livePriceService.priceCache.set(fullQuote.symbol, fullQuote);
//         if (fullQuote.token) {
//           livePriceService.priceCache.set(`${exchange}:${fullQuote.token}`, fullQuote);
//         }
//       }

//       return res.json({ success: true, source: 'alice_rest', data: fullQuote });
//     }

//     res.json({ success: true, source: 'alice_rest', data: quote });
//   } catch (err) {
//     console.error('getQuote error:', err.message);
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// exports.getCandleData = async (req, res) => {
//   try {
//     const { interval = '1min', count = 60, exchange = 'NSE' } = req.query;
//     const candles = livePriceService.generateCandleData(
//       req.params.symbol.toUpperCase(), exchange, interval, parseInt(count)
//     );
//     res.json({ success: true, data: { symbol: req.params.symbol.toUpperCase(), exchange, interval, candles } });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// exports.searchInstruments = async (req, res) => {
//   try {
//     const { q, exchange = null, limit = 20 } = req.query;
//     if (!q || q.length < 2) return res.status(400).json({ success: false, message: 'Min 2 chars' });
//     const results = scripMaster.search(q, exchange, parseInt(limit));
//     const enriched = results.map(inst => ({
//       ...inst,
//       livePrice: livePriceService.getBySymbol(inst.exchange, inst.trading_symbol)
//         || livePriceService.priceCache.get(`${inst.exchange}:${inst.token}`)
//     }));
//     res.json({ success: true, data: enriched });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// // ─────────────────────────────────────────────────────────────────────────────
// // subscribeSymbols — subscribe tokens to Alice Blue WS for live F&O prices
// // ─────────────────────────────────────────────────────────────────────────────
// exports.subscribeSymbols = async (req, res) => {
//   try {
//     const { symbols } = req.body;
//     if (!symbols?.length) return res.status(400).json({ success: false, message: 'symbols required' });

//     // Subscribe to live price service (Alice Blue WS if connected)
//     livePriceService.subscribe(symbols);

//     // If Alice Blue is not yet connected, try to connect using active session
//     if (!livePriceService.isRealTime()) {
//       const sess = await getAnyActiveSession();
//       if (sess && livePriceService.hasNetwork()) {
//         livePriceService.startReal(sess.user_session, sess.user_id).catch(() => { });
//       }
//     }

//     res.json({ success: true, message: `Subscribed ${symbols.length} instruments`, realtime: livePriceService.isRealTime() });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// exports.getAllInstruments = async (req, res) => {
//   try {
//     const { exchange } = req.query;
//     const all = Object.values(livePriceService.getAllPrices());
//     const data = exchange ? all.filter(i => i.exchange === exchange.toUpperCase()) : all;
//     res.json({ success: true, count: data.length, data });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// exports.getWatchlist = async (req, res) => {
//   try {
//     const [rows] = await db.query('SELECT * FROM watchlist ORDER BY trading_symbol');
//     const enriched = rows.map(item => ({
//       ...item,
//       livePrice: livePriceService.getBySymbol(item.exchange, item.trading_symbol)
//         || livePriceService.priceCache.get(`${item.exchange}:${item.instrument_id}`)
//     }));
//     res.json({ success: true, data: enriched });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// exports.addToWatchlist = async (req, res) => {
//   try {
//     const { trading_symbol, exchange, display_name, instrument_id, token } = req.body;
//     await db.query(
//       'INSERT IGNORE INTO watchlist (trading_symbol, exchange, display_name, instrument_id) VALUES (?,?,?,?)',
//       [trading_symbol.toUpperCase(), exchange, display_name || trading_symbol, instrument_id || token || '']
//     );
//     const tokenVal = instrument_id || token;
//     if (tokenVal) {
//       livePriceService.subscribe([{
//         token: tokenVal,
//         symbol: trading_symbol.toUpperCase(),
//         exchange: exchange.toUpperCase(),
//         name: display_name || trading_symbol
//       }]);
//     }
//     res.json({ success: true, message: 'Added to watchlist' });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// exports.removeFromWatchlist = async (req, res) => {
//   try {
//     await db.query('DELETE FROM watchlist WHERE id = ?', [req.params.id]);
//     res.json({ success: true, message: 'Removed' });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// exports.getStatus = async (req, res) => {
//   try {
//     res.json({ success: true, ...getStatus(), hasInternet: livePriceService.hasNetwork() });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// exports.livePriceService = livePriceService;

// exports.reloadInstruments = async (req, res) => {
//   try {
//     const msg = await scripMaster.reload();
//     res.json({ success: true, message: msg, stats: scripMaster.getStats() });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// exports.getInstrumentsStats = async (req, res) => {
//   try {
//     res.json({ success: true, data: scripMaster.getStats() });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// exports.getContractMasterUrl = (req, res) => {
//   try {
//     const { exchange = 'NSE' } = req.query;
//     res.json({
//       success: true,
//       url: `${CONTRACT_MASTER_BASE}/${exchange.toUpperCase()}`,
//       exchange: exchange.toUpperCase()
//     });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// exports.getContractMaster = (req, res) => {
//   try {
//     const { exchange = 'NSE' } = req.query;
//     const exch = String(exchange).toUpperCase();
//     const data = scripMaster.getInstruments(exch);
//     res.json({ success: true, exchange: exch, count: data.length, data });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// const CONTRACT_MASTER_BASE = 'https://v2api.aliceblueonline.com/restpy/static/contract_master/V2';