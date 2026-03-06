// const db = require('../config/db');
// const livePriceService = require('../services/websocketService');
// const scripMaster = require('../services/scripMasterService');

// async function init() {
//   await scripMaster.init();

//   // Always start price feed (auto-detects internet vs simulation)
//   await livePriceService.startYahooPolling();

//   // If active AB session exists, try to upgrade to real-time WS
//   try {
//     const [rows] = await db.query(
//       `SELECT user_id, user_session FROM clients
//        WHERE is_active=1 AND user_session IS NOT NULL
//          AND session_expires_at > NOW()
//        LIMIT 1`
//     );
//     if (rows.length && livePriceService.hasNetwork()) {
//       console.log(`🔑 Active session found for ${rows[0].user_id}, upgrading to WS…`);
//       await livePriceService.startReal(rows[0].user_session, rows[0].user_id);
//     } else if (rows.length) {
//       console.log('ℹ️  Session exists but no internet — using simulation');
//     }
//   } catch (err) {
//     // DB might not have table yet — ignore
//   }
// }

// init().catch(err => console.warn('Market init error:', err.message));

// const getStatus = () => {
//   if (livePriceService.isRealTime()) return { source: 'AliceBlue WebSocket (real-time)', badge: 'AB_LIVE' };
//   if (livePriceService.hasNetwork()) return { source: 'Yahoo Finance NSE (live ~3s delay)', badge: 'YAHOO' };
//   return { source: 'Simulation ⚠️ NOT real prices — fix internet on server', badge: 'SIM' };
// };

// exports.getLivePrices = async (req, res) => {
//   const status = getStatus();
//   res.json({ success: true, ...status, data: livePriceService.getAllPrices() });
// };

// exports.getSymbolPrice = async (req, res) => {
//   const { exchange = 'NSE' } = req.query;
//   const sym = req.params.symbol.toUpperCase();
//   const price = livePriceService.getBySymbol(exchange, sym) ||
//     livePriceService.getBySymbol(exchange, sym + '-EQ');
//   if (!price) return res.status(404).json({ success: false, message: 'Symbol not found' });
//   res.json({ success: true, data: price });
// };

// exports.getCandleData = async (req, res) => {
//   const { interval = '1min', count = 60, exchange = 'NSE' } = req.query;
//   const candles = livePriceService.generateCandleData(
//     req.params.symbol.toUpperCase(), exchange, interval, parseInt(count)
//   );
//   res.json({ success: true, data: { symbol: req.params.symbol.toUpperCase(), exchange, interval, candles } });
// };

// exports.searchInstruments = async (req, res) => {
//   const { q, exchange = null, limit = 20 } = req.query;
//   if (!q || q.length < 2) return res.status(400).json({ success: false, message: 'Min 2 chars' });
//   const results = scripMaster.search(q, exchange, parseInt(limit));
//   const enriched = results.map(inst => ({
//     ...inst, livePrice: livePriceService.getBySymbol(inst.exchange, inst.symbol)
//   }));
//   res.json({ success: true, data: enriched });
// };

// exports.subscribeSymbols = async (req, res) => {
//   const { symbols } = req.body;
//   if (!symbols?.length) return res.status(400).json({ success: false, message: 'symbols required' });
//   livePriceService.subscribe(symbols);
//   res.json({ success: true, message: `Subscribed ${symbols.length} instruments` });
// };

// exports.getAllInstruments = async (req, res) => {
//   const { exchange } = req.query;
//   const all = Object.values(livePriceService.getAllPrices());
//   const data = exchange ? all.filter(i => i.exchange === exchange.toUpperCase()) : all;
//   res.json({ success: true, count: data.length, data });
// };

// exports.getWatchlist = async (req, res) => {
//   const [rows] = await db.query('SELECT * FROM watchlist ORDER BY trading_symbol');
//   const enriched = rows.map(item => ({
//     ...item,
//     livePrice: livePriceService.getBySymbol(item.exchange, item.trading_symbol)
//   }));
//   res.json({ success: true, data: enriched });
// };

// exports.addToWatchlist = async (req, res) => {
//   const { trading_symbol, exchange, display_name, instrument_id, token } = req.body;
//   await db.query(
//     'INSERT IGNORE INTO watchlist (trading_symbol, exchange, display_name, instrument_id) VALUES (?,?,?,?)',
//     [trading_symbol.toUpperCase(), exchange, display_name || trading_symbol, instrument_id || token || '']
//   );
//   if (token) livePriceService.subscribe([{
//     token, symbol: trading_symbol.toUpperCase(),
//     exchange: exchange.toUpperCase(), name: display_name || trading_symbol
//   }]);
//   res.json({ success: true, message: 'Added to watchlist' });
// };

// exports.removeFromWatchlist = async (req, res) => {
//   await db.query('DELETE FROM watchlist WHERE id = ?', [req.params.id]);
//   res.json({ success: true, message: 'Removed' });
// };

// exports.getStatus = async (req, res) => {
//   res.json({ success: true, ...getStatus(), hasInternet: livePriceService.hasNetwork() });
// };

// exports.livePriceService = livePriceService;

// // GET /api/market/reload-instruments  — manually trigger contract master download
// exports.reloadInstruments = async (req, res) => {
//   try {
//     const msg = await scripMaster.reload();
//     res.json({ success: true, message: msg, stats: scripMaster.getStats() });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// // GET /api/market/instruments-stats
// exports.getInstrumentsStats = async (req, res) => {
//   res.json({ success: true, data: scripMaster.getStats() });
// };

// // GET /api/market/contract-master-url — return URL so frontend can fetch directly
// exports.getContractMasterUrl = (req, res) => {
//   const { exchange = 'NSE' } = req.query;
//   res.json({
//     success: true,
//     url: `https://v2api.aliceblueonline.com/restpy/static/contract_master/V2/${exchange.toUpperCase()}`,
//     exchange: exchange.toUpperCase()
//   });
// };




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
