
/**
 * ScripMasterService
 * 
 * Downloads live instrument data from Alice Blue Contract Master API:
 * https://v2api.aliceblueonline.com/restpy/static/contract_master/V2/{EXCHANGE}
 * 
 * Supported exchanges: NSE, BSE, NFO, MCX, CDS, BCD, BFO
 * Falls back to hardcoded data if download fails (no internet on server).
 * 
 * Frontend can also fetch contract master directly via browser (CORS is open).
 */

const axios = require('axios');
const path = require('path');
const fs = require('fs');

const CONTRACT_MASTER_BASE = 'https://v2api.aliceblueonline.com/restpy/static/contract_master/V2';
const CACHE_FILE = path.join(__dirname, '../../contract_master_cache.json');
const EXCHANGES = ['NSE', 'BSE', 'NFO', 'MCX', 'CDS', 'BCD', 'BFO'];

// ── Hardcoded fallback (used only when download fails) ────────────────────
const FALLBACK = {
  NSE: [
    { trading_symbol: 'RELIANCE-EQ', symbol: 'RELIANCE', token: '1922', lot_size: '1', tick_size: '0.05', exch: 'NSE' },
    { trading_symbol: 'TCS-EQ', symbol: 'TCS', token: '11536', lot_size: '1', tick_size: '0.05', exch: 'NSE' },
    { trading_symbol: 'HDFCBANK-EQ', symbol: 'HDFCBANK', token: '1333', lot_size: '1', tick_size: '0.05', exch: 'NSE' },
    { trading_symbol: 'INFY-EQ', symbol: 'INFY', token: '1594', lot_size: '1', tick_size: '0.05', exch: 'NSE' },
    { trading_symbol: 'ICICIBANK-EQ', symbol: 'ICICIBANK', token: '4963', lot_size: '1', tick_size: '0.05', exch: 'NSE' },
    { trading_symbol: 'SBIN-EQ', symbol: 'SBIN', token: '3045', lot_size: '1', tick_size: '0.05', exch: 'NSE' },
    { trading_symbol: 'AXISBANK-EQ', symbol: 'AXISBANK', token: '10794', lot_size: '1', tick_size: '0.05', exch: 'NSE' },
    { trading_symbol: 'KOTAKBANK-EQ', symbol: 'KOTAKBANK', token: '10999', lot_size: '1', tick_size: '0.05', exch: 'NSE' },
    { trading_symbol: 'TATAMOTORS-EQ', symbol: 'TATAMOTORS', token: '884', lot_size: '1', tick_size: '0.05', exch: 'NSE' },
    { trading_symbol: 'TATASTEEL-EQ', symbol: 'TATASTEEL', token: '2475', lot_size: '1', tick_size: '0.05', exch: 'NSE' },
    { trading_symbol: 'WIPRO-EQ', symbol: 'WIPRO', token: '11532', lot_size: '1', tick_size: '0.05', exch: 'NSE' },
    { trading_symbol: 'HCLTECH-EQ', symbol: 'HCLTECH', token: '7229', lot_size: '1', tick_size: '0.05', exch: 'NSE' },
    { trading_symbol: 'MARUTI-EQ', symbol: 'MARUTI', token: '14977', lot_size: '1', tick_size: '0.05', exch: 'NSE' },
    { trading_symbol: 'ADANIPORTS-EQ', symbol: 'ADANIPORTS', token: '21808', lot_size: '1', tick_size: '0.05', exch: 'NSE' },
    { trading_symbol: 'TITAN-EQ', symbol: 'TITAN', token: '467', lot_size: '1', tick_size: '0.05', exch: 'NSE' },
    { trading_symbol: 'NTPC-EQ', symbol: 'NTPC', token: '2142', lot_size: '1', tick_size: '0.05', exch: 'NSE' },
    { trading_symbol: 'ONGC-EQ', symbol: 'ONGC', token: '1660', lot_size: '1', tick_size: '0.05', exch: 'NSE' },
    { trading_symbol: 'ITC-EQ', symbol: 'ITC', token: '1232', lot_size: '1', tick_size: '0.05', exch: 'NSE' },
    { trading_symbol: 'SUNPHARMA-EQ', symbol: 'SUNPHARMA', token: '3456', lot_size: '1', tick_size: '0.05', exch: 'NSE' },
    { trading_symbol: 'CIPLA-EQ', symbol: 'CIPLA', token: '14309', lot_size: '1', tick_size: '0.05', exch: 'NSE' },
    { trading_symbol: 'DRREDDY-EQ', symbol: 'DRREDDY', token: '1042', lot_size: '1', tick_size: '0.05', exch: 'NSE' },
    { trading_symbol: 'APOLLOHOSP-EQ', symbol: 'APOLLOHOSP', token: '157', lot_size: '1', tick_size: '0.05', exch: 'NSE' },
    { trading_symbol: 'BAJFINANCE-EQ', symbol: 'BAJFINANCE', token: '317', lot_size: '1', tick_size: '0.05', exch: 'NSE' },
    { trading_symbol: 'HINDUNILVR-EQ', symbol: 'HINDUNILVR', token: '1270', lot_size: '1', tick_size: '0.05', exch: 'NSE' },
    { trading_symbol: 'LT-EQ', symbol: 'LT', token: '11483', lot_size: '1', tick_size: '0.05', exch: 'NSE' },
    { trading_symbol: 'JSWSTEEL-EQ', symbol: 'JSWSTEEL', token: '3300', lot_size: '1', tick_size: '0.05', exch: 'NSE' },
    { trading_symbol: 'TECHM-EQ', symbol: 'TECHM', token: '11703', lot_size: '1', tick_size: '0.05', exch: 'NSE' },
    { trading_symbol: 'COALINDIA-EQ', symbol: 'COALINDIA', token: '1656', lot_size: '1', tick_size: '0.05', exch: 'NSE' },
    { trading_symbol: 'HEROMOTOCO-EQ', symbol: 'HEROMOTOCO', token: '1394', lot_size: '1', tick_size: '0.05', exch: 'NSE' },
    { trading_symbol: 'M&M-EQ', symbol: 'M&M', token: '10940', lot_size: '1', tick_size: '0.05', exch: 'NSE' },
    { trading_symbol: 'ASIANPAINT-EQ', symbol: 'ASIANPAINT', token: '13', lot_size: '1', tick_size: '0.05', exch: 'NSE' },
    { trading_symbol: 'ULTRACEMCO-EQ', symbol: 'ULTRACEMCO', token: '11915', lot_size: '1', tick_size: '0.05', exch: 'NSE' },
    { trading_symbol: 'POWERGRID-EQ', symbol: 'POWERGRID', token: '14978', lot_size: '1', tick_size: '0.05', exch: 'NSE' },
    { trading_symbol: 'BAJAJFINSV-EQ', symbol: 'BAJAJFINSV', token: '16675', lot_size: '1', tick_size: '0.05', exch: 'NSE' },
    { trading_symbol: 'HINDALCO-EQ', symbol: 'HINDALCO', token: '1348', lot_size: '1', tick_size: '0.05', exch: 'NSE' },
    { trading_symbol: 'INDUSINDBK-EQ', symbol: 'INDUSINDBK', token: '3672', lot_size: '1', tick_size: '0.05', exch: 'NSE' },
    { trading_symbol: 'BHARTIARTL-EQ', symbol: 'BHARTIARTL', token: '18391', lot_size: '1', tick_size: '0.05', exch: 'NSE' },
    { trading_symbol: 'NESTLEIND-EQ', symbol: 'NESTLEIND', token: '17963', lot_size: '1', tick_size: '0.05', exch: 'NSE' },
    { trading_symbol: 'ZOMATO-EQ', symbol: 'ZOMATO', token: '3150', lot_size: '1', tick_size: '0.05', exch: 'NSE' },
    { trading_symbol: 'TATAPOWER-EQ', symbol: 'TATAPOWER', token: '2893', lot_size: '1', tick_size: '0.05', exch: 'NSE' },
    { trading_symbol: 'BAJAJ-AUTO-EQ', symbol: 'BAJAJ-AUTO', token: '20286', lot_size: '1', tick_size: '0.05', exch: 'NSE' },
    { trading_symbol: 'EICHERMOT-EQ', symbol: 'EICHERMOT', token: '910', lot_size: '1', tick_size: '0.05', exch: 'NSE' },
    { trading_symbol: 'DIVISLAB-EQ', symbol: 'DIVISLAB', token: '2303', lot_size: '1', tick_size: '0.05', exch: 'NSE' },
    { trading_symbol: 'GRASIM-EQ', symbol: 'GRASIM', token: '1234', lot_size: '1', tick_size: '0.05', exch: 'NSE' },
    { trading_symbol: 'TATACONSUM-EQ', symbol: 'TATACONSUM', token: '2975', lot_size: '1', tick_size: '0.05', exch: 'NSE' },
    { trading_symbol: 'SAIL-EQ', symbol: 'SAIL', token: '502', lot_size: '1', tick_size: '0.05', exch: 'NSE' },
    { trading_symbol: 'IDEA-EQ', symbol: 'IDEA', token: '1099', lot_size: '1', tick_size: '0.05', exch: 'NSE' },
    { trading_symbol: 'DMART-EQ', symbol: 'DMART', token: '20374', lot_size: '1', tick_size: '0.05', exch: 'NSE' },
    { trading_symbol: 'SHREECEM-EQ', symbol: 'SHREECEM', token: '3431', lot_size: '1', tick_size: '0.05', exch: 'NSE' },
    { trading_symbol: 'BRITANNIA-EQ', symbol: 'BRITANNIA', token: '547', lot_size: '1', tick_size: '0.05', exch: 'NSE' },
    { trading_symbol: 'ACC-EQ', symbol: 'ACC', token: '22', lot_size: '1', tick_size: '0.05', exch: 'NSE' },
    { trading_symbol: 'HAVELLS-EQ', symbol: 'HAVELLS', token: '1041', lot_size: '1', tick_size: '0.05', exch: 'NSE' },
    { trading_symbol: 'SIEMENS-EQ', symbol: 'SIEMENS', token: '3104', lot_size: '1', tick_size: '0.05', exch: 'NSE' },
    { trading_symbol: 'PIDILITIND-EQ', symbol: 'PIDILITIND', token: '2664', lot_size: '1', tick_size: '0.05', exch: 'NSE' },
    { trading_symbol: 'NIFTY 50', symbol: 'NIFTY 50', token: '26000', lot_size: '1', tick_size: '0.05', exch: 'NSE' },
    { trading_symbol: 'NIFTY BANK', symbol: 'NIFTY BANK', token: '26009', lot_size: '1', tick_size: '0.05', exch: 'NSE' },
  ],
  BSE: [
    { trading_symbol: 'SENSEX', symbol: 'SENSEX', token: '1', lot_size: '1', tick_size: '0.01', exch: 'BSE' },
  ],
  MCX: [
    { trading_symbol: 'CRUDEOIL25MARFUT', symbol: 'CRUDEOIL', token: '241506', lot_size: '100', tick_size: '1', exch: 'MCX', expiry: '19-03-2025', instrument_type: 'FUTCOM' },
    { trading_symbol: 'CRUDEOIL25APRFUT', symbol: 'CRUDEOIL', token: '241507', lot_size: '100', tick_size: '1', exch: 'MCX', expiry: '17-04-2025', instrument_type: 'FUTCOM' },
    { trading_symbol: 'CRUDEOILM25MARFUT', symbol: 'CRUDEOILM', token: '241508', lot_size: '10', tick_size: '1', exch: 'MCX', expiry: '28-03-2025', instrument_type: 'FUTCOM' },
    { trading_symbol: 'NATURALGAS25MARFUT', symbol: 'NATURALGAS', token: '242001', lot_size: '1250', tick_size: '0.1', exch: 'MCX', expiry: '25-02-2025', instrument_type: 'FUTCOM' },
    { trading_symbol: 'GOLD25APRFUT', symbol: 'GOLD', token: '239601', lot_size: '1', tick_size: '1', exch: 'MCX', expiry: '05-04-2025', instrument_type: 'FUTCOM' },
    { trading_symbol: 'GOLDM25MARFUT', symbol: 'GOLDM', token: '239602', lot_size: '10', tick_size: '1', exch: 'MCX', expiry: '28-03-2025', instrument_type: 'FUTCOM' },
    { trading_symbol: 'SILVER25MARFUT', symbol: 'SILVER', token: '240001', lot_size: '30', tick_size: '1', exch: 'MCX', expiry: '05-03-2025', instrument_type: 'FUTCOM' },
    { trading_symbol: 'SILVERM25MARFUT', symbol: 'SILVERM', token: '240002', lot_size: '5', tick_size: '1', exch: 'MCX', expiry: '28-02-2025', instrument_type: 'FUTCOM' },
    { trading_symbol: 'COPPER25MARFUT', symbol: 'COPPER', token: '241001', lot_size: '2500', tick_size: '0.05', exch: 'MCX', expiry: '28-02-2025', instrument_type: 'FUTCOM' },
    { trading_symbol: 'ZINC25MARFUT', symbol: 'ZINC', token: '241003', lot_size: '5000', tick_size: '0.05', exch: 'MCX', expiry: '28-02-2025', instrument_type: 'FUTCOM' },
    { trading_symbol: 'ALUMINIUM25MARFUT', symbol: 'ALUMINIUM', token: '241002', lot_size: '5000', tick_size: '0.05', exch: 'MCX', expiry: '28-02-2025', instrument_type: 'FUTCOM' },
    { trading_symbol: 'NICKEL25MARFUT', symbol: 'NICKEL', token: '241005', lot_size: '1500', tick_size: '0.1', exch: 'MCX', expiry: '28-02-2025', instrument_type: 'FUTCOM' },
  ],
};

// ── Normalize raw Alice Blue instrument to our common format ─────────────
function normalize(raw, exch) {
  try { // [TRY/CATCH ADDED]
    return {
      trading_symbol: raw.trading_symbol,
      symbol: raw.symbol || raw.trading_symbol.replace(/-EQ$/, ''),
      token: raw.token,
      lot_size: parseInt(raw.lot_size) || 1,
      tick_size: parseFloat(raw.tick_size) || 0.05,
      exch: raw.exch || exch,
      exchange: raw.exch || exch,   // alias
      instrument_type: raw.instrument_type || '',
      expiry: raw.expiry_date ? new Date(parseInt(raw.expiry_date)).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : null,
      option_type: raw.option_type || null,
      strike_price: raw.strike_price || null,
      formatted_name: raw.formatted_ins_name || raw.trading_symbol,
    };
  } catch (err) {
    console.error('normalize error:', err);
    return null;
  }
}

class ScripMasterService {
  constructor() {
    try { // [TRY/CATCH ADDED]
      this.instruments = [];  // flat array of all normalized instruments
      this.bySymbolKey = new Map();  // "NSE:SBIN-EQ" → instrument
      this.byTokenKey = new Map();  // "NSE:3045"    → instrument
      this.isLoaded = false;
      this.stats = {};
    } catch (err) {
      console.error('ScripMasterService constructor error:', err);
    }
  }

  async init() {
    try { // [TRY/CATCH ADDED]
      // 1. Try loading from file cache first (fastest startup)
      if (this._loadFromCache()) return;
      // 2. Try downloading from Alice Blue
      await this._download();
    } catch (err) {
      console.error('init error:', err);
    }
  }

  async reload() {
    try { // [TRY/CATCH ADDED]
      const ok = await this._download();
      return ok ? `Downloaded: ${JSON.stringify(this.stats)}` : 'Download failed, using fallback';
    } catch (err) {
      console.error('reload error:', err);
      return 'Reload failed: ' + err.message;
    }
  }

  // ── Download from Alice Blue contract master ──────────────────────────
  async _download() {
    try { // [TRY/CATCH ADDED]
      console.log('📥 Downloading Contract Master from Alice Blue…');
      const downloaded = {};
      let totalCount = 0;

      await Promise.allSettled(EXCHANGES.map(async (exch) => {
        try {
          const url = `${CONTRACT_MASTER_BASE}/${exch}`;
          const res = await axios.get(url, { timeout: 15000 });
          const raw = res.data;
          // Response is { "NSE": [...] } or { "MCX": [...] } etc.
          const key = Object.keys(raw)[0];
          const list = raw[key];
          if (Array.isArray(list) && list.length > 0) {
            downloaded[exch] = list;
            totalCount += list.length;
            console.log(`  ✅ ${exch}: ${list.length} instruments`);
          }
        } catch (err) {
          console.log(`  ⚠️  ${exch} download failed: ${err.message}`);
        }
      }));

      if (totalCount > 0) {
        this._buildMaps(downloaded);
        this._saveCache(downloaded);
        console.log(`📋 Contract Master loaded: ${totalCount} total instruments`);
        return true;
      } else {
        console.log('⚠️  All downloads failed — using hardcoded fallback data');
        this._buildMaps(FALLBACK);
        return false;
      }
    } catch (err) {
      console.error('_download error:', err);
      this._buildMaps(FALLBACK);
      return false;
    }
  }

  // ── Build lookup maps from raw data ──────────────────────────────────
  _buildMaps(data) {
    try { // [TRY/CATCH ADDED]
      this.instruments = [];
      this.bySymbolKey.clear();
      this.byTokenKey.clear();
      this.stats = {};

      for (const [exch, list] of Object.entries(data)) {
        if (!Array.isArray(list)) continue;
        this.stats[exch] = list.length;
        for (const raw of list) {
          try { // inner try for each instrument
            const inst = normalize(raw, exch);
            if (!inst) continue;
            this.instruments.push(inst);
            // Primary key: exact trading_symbol
            this.bySymbolKey.set(`${exch}:${inst.trading_symbol}`, inst);
            // Also key by base symbol (without -EQ)
            if (inst.symbol !== inst.trading_symbol) {
              this.bySymbolKey.set(`${exch}:${inst.symbol}`, inst);
            }
            this.byTokenKey.set(`${exch}:${inst.token}`, inst);
          } catch (e) {
            console.error('Error processing instrument:', raw, e);
          }
        }
      }
      this.isLoaded = true;
    } catch (err) {
      console.error('_buildMaps error:', err);
    }
  }

  // ── File cache (avoids re-downloading on every restart) ───────────────
  _saveCache(data) {
    try {
      fs.writeFileSync(CACHE_FILE, JSON.stringify({ ts: Date.now(), data }));
    } catch { /* ignore */ }
  }

  _loadFromCache() {
    try {
      if (!fs.existsSync(CACHE_FILE)) return false;
      const raw = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
      // Cache expires after 12 hours
      if (Date.now() - raw.ts > 12 * 60 * 60 * 1000) return false;
      this._buildMaps(raw.data);
      const total = Object.values(this.stats).reduce((a, b) => a + b, 0);
      console.log(`📋 Contract Master loaded from cache: ${total} instruments`);
      return true;
    } catch {
      return false;
    }
  }

  // ── Public lookup API ──────────────────────────────────────────────────

  // Get by trading symbol (e.g. "SBIN-EQ") on given exchange
  getBySymbol(exchange, tradingSymbol) {
    try { // [TRY/CATCH ADDED]
      const exch = exchange.toUpperCase();
      return this.bySymbolKey.get(`${exch}:${tradingSymbol}`)
        || this.bySymbolKey.get(`${exch}:${tradingSymbol}-EQ`);
    } catch (err) {
      console.error('getBySymbol error:', err);
      return null;
    }
  }

  // Get by numeric token
  getByToken(exchange, token) {
    try { // [TRY/CATCH ADDED]
      return this.byTokenKey.get(`${exchange.toUpperCase()}:${token}`);
    } catch (err) {
      console.error('getByToken error:', err);
      return null;
    }
  }

  // Search across all exchanges (or filtered by exchange)
  // Returns up to `limit` results matching query in symbol or name
  search(query, exchange = null, limit = 25) {
    try { // [TRY/CATCH ADDED]
      const q = query.toLowerCase().trim();
      if (!q) return [];

      const results = [];
      for (const inst of this.instruments) {
        if (exchange && inst.exchange !== exchange.toUpperCase()) continue;
        const matchSym = inst.trading_symbol.toLowerCase().includes(q);
        const matchBase = inst.symbol.toLowerCase().includes(q);
        const matchFmt = inst.formatted_name?.toLowerCase().includes(q);
        if (matchSym || matchBase || matchFmt) {
          results.push(inst);
          if (results.length >= limit) break;
        }
      }
      return results;
    } catch (err) {
      console.error('search error:', err);
      return [];
    }
  }

  getStats() {
    try { // [TRY/CATCH ADDED]
      return { ...this.stats, total: Object.values(this.stats).reduce((a, b) => a + b, 0), isLoaded: this.isLoaded };
    } catch (err) {
      console.error('getStats error:', err);
      return { total: 0, isLoaded: false };
    }
  }

  // Return all loaded instruments for one exchange (or all when exchange is null)
  getInstruments(exchange = null) {
    try {
      if (!exchange) return this.instruments;
      const exch = String(exchange).toUpperCase();
      return this.instruments.filter((inst) => inst.exchange === exch || inst.exch === exch);
    } catch (err) {
      console.error('getInstruments error:', err);
      return [];
    }
  }

  // Return the contract master base URL (for frontend to fetch directly)
  getContractMasterUrl(exchange) {
    try { // [TRY/CATCH ADDED]
      return `${CONTRACT_MASTER_BASE}/${exchange.toUpperCase()}`;
    } catch (err) {
      console.error('getContractMasterUrl error:', err);
      return '';
    }
  }
}

// Wrap the entire module export in a try-catch to catch any initialization errors
let scripMasterInstance;
try { // [TRY/CATCH ADDED]
  scripMasterInstance = new ScripMasterService();
} catch (err) {
  console.error('FATAL: Could not initialize ScripMasterService:', err);
  // Provide a dummy instance with no-op methods
  scripMasterInstance = {
    instruments: [],
    bySymbolKey: new Map(),
    byTokenKey: new Map(),
    isLoaded: false,
    stats: {},
    init: async () => { },
    reload: async () => 'Service unavailable',
    getBySymbol: () => null,
    getByToken: () => null,
    search: () => [],
    getStats: () => ({ total: 0, isLoaded: false }),
    getContractMasterUrl: () => '',
    getInstruments: () => [],
  };
}
module.exports = scripMasterInstance;
