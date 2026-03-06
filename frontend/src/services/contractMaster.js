/**
 * Contract Master Service — Browser-side
 * ─────────────────────────────────────────────────────────────
 * Downloads instrument data DIRECTLY from Alice Blue in the browser.
 * Browser can access v2api.aliceblueonline.com, server cannot.
 *
 * token field = instrumentId (required for every Alice Blue order)
 *
 * Usage:
 *   import { searchInstruments, getBySymbol } from './contractMaster';
 *   const results = await searchInstruments('CIPLA');
 *   const inst    = getBySymbol('NSE', 'CIPLA-EQ');
 *   // inst.token = "14309" ← this is instrumentId
 * ─────────────────────────────────────────────────────────────
 */

const BASE_URL   = 'https://v2api.aliceblueonline.com/restpy/static/contract_master/V2';
const EXCHANGES  = ['NSE', 'BSE', 'NFO', 'MCX', 'CDS', 'BFO', 'BCD'];
const CACHE_KEY  = 'ab_contract_master_v2';
const CACHE_TTL  = 6 * 60 * 60 * 1000; // 6 hours

// In-memory maps (rebuilt on load)
let allInstruments = [];
let symbolMap      = new Map(); // "NSE:CIPLA-EQ" → instrument
let tokenMap       = new Map(); // "NSE:14309"    → instrument
let loadState      = 'idle';   // idle | loading | ready | error
let loadPromise    = null;

// ── Normalize one row from Alice Blue contract master ──────────────────────
function normalize(row, exchange) {
  const exch = (row.exch || exchange).toUpperCase();
  return {
    exchange:    exch,
    token:       String(row.token || ''),
    symbol:      String(row.trading_symbol || row.symbol || ''),
    name:        String(row.formatted_ins_name || row.symbol || row.trading_symbol || ''),
    lotSize:     parseInt(row.lot_size || '1') || 1,
    tickSize:    parseFloat(row.tick_size || '0.05') || 0.05,
    instrument:  String(row.instrument_type || 'EQ'),
    expiry:      row.expiry_date ? fmtExpiry(row.expiry_date) : '',
    strikePrice: String(row.strike_price || ''),
    optionType:  String(row.option_type  || ''),
    segment:     String(row.exchange_segment || ''),
  };
}

function fmtExpiry(epochMs) {
  try {
    return new Date(parseInt(epochMs)).toLocaleDateString('en-IN',
      { day:'2-digit', month:'short', year:'numeric' });
  } catch { return ''; }
}

// ── Build lookup maps ──────────────────────────────────────────────────────
function buildMaps(records) {
  symbolMap.clear();
  tokenMap.clear();
  records.forEach(inst => {
    symbolMap.set(`${inst.exchange}:${inst.symbol}`, inst);
    tokenMap.set(`${inst.exchange}:${inst.token}`,   inst);
    // Also index without -EQ suffix: "NSE:CIPLA" → same inst as "NSE:CIPLA-EQ"
    const bare = inst.symbol.replace(/-EQ$/i, '');
    if (bare !== inst.symbol) symbolMap.set(`${inst.exchange}:${bare}`, inst);
  });
  allInstruments = records;
}

// ── Try to restore from memory cache (sessionStorage) ─────────────────────
function tryRestoreCache() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return false;
    const obj = JSON.parse(raw);
    if (!obj.savedAt || !obj.instruments?.length) return false;
    if (Date.now() - obj.savedAt > CACHE_TTL) return false;
    buildMaps(obj.instruments);
    loadState = 'ready';
    console.log(`📋 Contract master from cache: ${allInstruments.length} instruments`);
    return true;
  } catch (e) { return false; }
}

function saveCache(records) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), instruments: records }));
  } catch (e) { /* sessionStorage full — ignore */ }
}

// ── Fetch one exchange ────────────────────────────────────────────────────
async function fetchExchange(exch) {
  const url = `${BASE_URL}/${exch}`;
  const res = await fetch(url, {
    headers: { 'Accept': 'application/json' },
    cache: 'default'
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();

  // Response: { "NSE": [...] }  or  { "NFO": [...] }  etc.
  const key  = Object.keys(data).find(k => k.toUpperCase() === exch) || Object.keys(data)[0];
  const rows = data[key];
  if (!Array.isArray(rows)) throw new Error('Invalid format');
  return rows.map(r => normalize(r, exch));
}

// ── Main load function ─────────────────────────────────────────────────────
export function load() {
  if (loadState === 'ready')   return Promise.resolve(true);
  if (loadState === 'loading') return loadPromise;

  // Try cache first
  if (tryRestoreCache()) return Promise.resolve(true);

  loadState   = 'loading';
  loadPromise = (async () => {
    console.log('📥 Downloading contract master from Alice Blue…');
    const all = [];
    let ok     = 0;

    for (const exch of EXCHANGES) {
      try {
        const records = await fetchExchange(exch);
        all.push(...records);
        ok++;
        console.log(`  ✅ ${exch}: ${records.length} instruments`);
      } catch (e) {
        console.warn(`  ❌ ${exch}: ${e.message}`);
      }
    }

    if (all.length > 0) {
      buildMaps(all);
      saveCache(all);
      loadState = 'ready';
      console.log(`✅ Contract master ready: ${all.length} total instruments`);
      return true;
    }

    loadState = 'error';
    return false;
  })();

  return loadPromise;
}

// ── Force reload (clear cache + re-download) ───────────────────────────────
export async function reload() {
  try { sessionStorage.removeItem(CACHE_KEY); } catch (e) {}
  loadState = 'idle';
  return load();
}

// ── Lookup by symbol ────────────────────────────────────────────────────────
// e.g. getBySymbol('NSE', 'CIPLA-EQ')  or  getBySymbol('NSE', 'CIPLA')
export function getBySymbol(exchange, symbol) {
  const exch = exchange.toUpperCase();
  return symbolMap.get(`${exch}:${symbol}`)
      || symbolMap.get(`${exch}:${symbol}-EQ`)
      || symbolMap.get(`${exch}:${symbol.replace(/-EQ$/i,'')}`);
}

// ── Lookup by token ─────────────────────────────────────────────────────────
export function getByToken(exchange, token) {
  return tokenMap.get(`${exchange.toUpperCase()}:${token}`);
}

// ── Search ──────────────────────────────────────────────────────────────────
// exchange: 'NSE' | 'BSE' | 'NFO' | 'MCX' | null (all)
export function searchInstruments(query, exchange = null, limit = 25) {
  const q = query.toLowerCase().trim();
  if (!q || allInstruments.length === 0) return [];
  const out = [];
  for (const inst of allInstruments) {
    if (exchange && inst.exchange !== exchange.toUpperCase()) continue;
    if (inst.symbol.toLowerCase().includes(q) || inst.name.toLowerCase().includes(q)) {
      out.push(inst);
      if (out.length >= limit) break;
    }
  }
  return out;
}

export function getStats() {
  const byExchange = {};
  allInstruments.forEach(i => { byExchange[i.exchange] = (byExchange[i.exchange]||0)+1; });
  return { total: allInstruments.length, byExchange, state: loadState };
}

export function isReady()   { return loadState === 'ready'; }
export function isLoading() { return loadState === 'loading'; }
export function getAll()    { return allInstruments; }
