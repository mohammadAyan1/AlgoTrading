/**
 * ContractMasterContext
 * 
 * Contract master backend API se load hota hai.
 * Browser direct Alice Blue domain hit nahi karta (CORS-safe).
 * 
 * Contract Master URL (backend): http://localhost:5000/api/market/contract-master?exchange={EXCHANGE}
 * Exchanges: NSE, BSE, NFO, MCX, CDS, BCD, BFO
 * 
 * Search results mein hamesha REAL tokens honge.
 */

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

const BACKEND_API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const EXCHANGES = ['NSE', 'BSE', 'NFO', 'MCX', 'CDS', 'BCD', 'BFO'];
const LS_KEY = 'contract_master_cache_v1';
const CACHE_TTL = 12 * 60 * 60 * 1000; // 12 hours

const ContractMasterContext = createContext(null);

function normalize(raw, exch) {
  const expiry = raw.expiry_date
    ? new Date(parseInt(raw.expiry_date)).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : null;
  return {
    trading_symbol: raw.trading_symbol,
    symbol: raw.symbol || raw.trading_symbol,
    token: raw.token,
    lot_size: parseInt(raw.lot_size) || 1,
    tick_size: parseFloat(raw.tick_size) || 0.05,
    exchange: raw.exch || exch,
    exch: raw.exch || exch,
    instrument_type: raw.instrument_type || 'EQ',
    expiry,
    option_type: raw.option_type || null,
    strike_price: raw.strike_price || null,
    formatted_name: raw.formatted_ins_name || raw.trading_symbol,
  };
}

export function ContractMasterProvider({ children }) {
  // Maps built from downloaded data
  const bySymbol = useRef(new Map()); // "NSE:SBIN-EQ" → inst
  const byToken = useRef(new Map()); // "NSE:3045"    → inst
  const allInsts = useRef([]);

  const [loadState, setLoadState] = useState({
    loading: true,
    loaded: false,
    error: null,
    stats: {},
    totalCount: 0,
  });

  // ── Build lookup maps ─────────────────────────────────────────────────
  const buildMaps = useCallback((data) => {
    bySymbol.current.clear();
    byToken.current.clear();
    allInsts.current = [];
    const stats = {};

    for (const [exch, list] of Object.entries(data)) {
      if (!Array.isArray(list)) continue;
      stats[exch] = list.length;
      for (const raw of list) {
        const inst = normalize(raw, exch);
        allInsts.current.push(inst);
        bySymbol.current.set(`${exch}:${inst.trading_symbol}`, inst);
        // Also index by base symbol (SBIN from SBIN-EQ)
        if (inst.symbol !== inst.trading_symbol) {
          bySymbol.current.set(`${exch}:${inst.symbol}`, inst);
        }
        byToken.current.set(`${exch}:${inst.token}`, inst);
      }
    }

    const total = Object.values(stats).reduce((a, b) => a + b, 0);
    setLoadState({ loading: false, loaded: true, error: null, stats, totalCount: total });
    console.log(`📋 Contract Master ready: ${total} instruments`, stats);
    return true;
  }, []);

  // ── LocalStorage cache ────────────────────────────────────────────────
  const saveToCache = (data) => {
    try { localStorage.setItem(LS_KEY, JSON.stringify({ ts: Date.now(), data })); } catch { }
  };
  const loadFromCache = () => {
    try {
      const raw = JSON.parse(localStorage.getItem(LS_KEY) || 'null');
      if (!raw) return false;
      if (Date.now() - raw.ts > CACHE_TTL) return false;
      buildMaps(raw.data);
      return true;
    } catch { return false; }
  };

  // ── Download from Alice Blue ──────────────────────────────────────────
  const download = useCallback(async () => {
    setLoadState(s => ({ ...s, loading: true, error: null }));
    const downloaded = {};
    let anySuccess = false;

    await Promise.allSettled(EXCHANGES.map(async (exch) => {
      try {
        const res = await fetch(`${BACKEND_API_BASE}/market/contract-master?exchange=${exch}`, { signal: AbortSignal.timeout(20000) });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const list = Array.isArray(json?.data) ? json.data : [];
        if (Array.isArray(list) && list.length > 0) {
          downloaded[exch] = list;
          anySuccess = true;
          console.log(`  ✅ ${exch}: ${list.length} instruments`);
        }
      } catch (err) {
        console.warn(`  ⚠️  ${exch} download failed:`, err.message);
      }
    }));

    if (anySuccess) {
      buildMaps(downloaded);
      saveToCache(downloaded);
    } else {
      setLoadState(s => ({ ...s, loading: false, error: 'Download failed. Check internet connection.' }));
    }
  }, [buildMaps]);

  // ── Init: cache → download ────────────────────────────────────────────
  useEffect(() => {
    if (loadFromCache()) return;
    download();
  }, []); // eslint-disable-line

  // ── Public API ────────────────────────────────────────────────────────

  // Get by trading_symbol (exact) on exchange
  const getBySymbol = useCallback((exchange, tradingSymbol) => {
    const exch = exchange.toUpperCase();
    return bySymbol.current.get(`${exch}:${tradingSymbol}`)
      || bySymbol.current.get(`${exch}:${tradingSymbol}-EQ`);
  }, []);

  // Get by token
  const getByToken = useCallback((exchange, token) => {
    return byToken.current.get(`${exchange.toUpperCase()}:${token}`);
  }, []);

  // Search — returns up to `limit` instruments matching query
  // exchange: null = search all exchanges
  const search = useCallback((query, exchange = null, limit = 25) => {
    const q = query.toLowerCase().trim();
    if (!q || q.length < 1) return [];
    const results = [];
    for (const inst of allInsts.current) {
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
  }, []);

  return (
    <ContractMasterContext.Provider value={{ ...loadState, getBySymbol, getByToken, search, reload: download }}>
      {children}
    </ContractMasterContext.Provider>
  );
}

export function useContractMaster() {
  const ctx = useContext(ContractMasterContext);
  if (!ctx) throw new Error('useContractMaster must be used inside ContractMasterProvider');
  return ctx;
}
