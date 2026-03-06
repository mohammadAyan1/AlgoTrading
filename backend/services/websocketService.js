// /**
//  * LivePriceService
//  * ─────────────────────────────────────────────────────────────
//  * Priority 1: Alice Blue WebSocket — real-time ms feed
//  *             (requires active session + internet on server)
//  *
//  * Priority 2: Yahoo Finance / NSE polling
//  *             (requires server to have internet access)
//  *
//  * Fallback: Realistic simulation (market-hours aware)
//  *           Used ONLY when server has no internet — for dev/testing
//  *
//  * NOTE: If you see "No internet / DNS failed" in logs, your Node.js
//  * server machine cannot reach external URLs. Fix options:
//  *   - Check firewall / antivirus blocking outbound HTTPS
//  *   - Check DNS (try setting 8.8.8.8 in network settings)
//  *   - If running in Docker: add --network=host flag
//  * ─────────────────────────────────────────────────────────────
//  */

// const WebSocket    = require('ws');
// const crypto       = require('crypto');
// const https        = require('https');
// const EventEmitter = require('events');
// require('dotenv').config();

// const BASE_URL = process.env.ALICE_BASE_URL || 'https://a3.aliceblueonline.com';
// const AB_WS    = 'wss://ws1.aliceblueonline.com/NorenWS';

// // ─── Master stock list ─────────────────────────────────────────────────────
// // [aliceSymbol, yahooTicker, displayName, exchange, token, basePrice]
// const STOCKS = [
//   ['RELIANCE-EQ',   'RELIANCE.NS',   'Reliance Industries', 'NSE','1922', 2980],
//   ['TCS-EQ',        'TCS.NS',        'TCS',                 'NSE','11536',3900],
//   ['HDFCBANK-EQ',   'HDFCBANK.NS',   'HDFC Bank',           'NSE','1333', 1685],
//   ['INFY-EQ',       'INFY.NS',       'Infosys',             'NSE','1594', 1780],
//   ['ICICIBANK-EQ',  'ICICIBANK.NS',  'ICICI Bank',          'NSE','4963', 1295],
//   ['KOTAKBANK-EQ',  'KOTAKBANK.NS',  'Kotak Bank',          'NSE','10999',1910],
//   ['HINDUNILVR-EQ', 'HINDUNILVR.NS', 'Hindustan Unilever',  'NSE','1270', 2340],
//   ['AXISBANK-EQ',   'AXISBANK.NS',   'Axis Bank',           'NSE','10794',1195],
//   ['LT-EQ',         'LT.NS',         'L&T',                 'NSE','11483',3680],
//   ['ITC-EQ',        'ITC.NS',        'ITC Ltd',             'NSE','1232', 470 ],
//   ['SBIN-EQ',       'SBIN.NS',       'State Bank of India', 'NSE','3045', 805 ],
//   ['BHARTIARTL-EQ', 'BHARTIARTL.NS', 'Bharti Airtel',       'NSE','18391',1840],
//   ['BAJFINANCE-EQ', 'BAJFINANCE.NS', 'Bajaj Finance',       'NSE','317',  7250],
//   ['WIPRO-EQ',      'WIPRO.NS',      'Wipro',               'NSE','11532',487 ],
//   ['HCLTECH-EQ',    'HCLTECH.NS',    'HCL Technologies',    'NSE','7229', 1920],
//   ['MARUTI-EQ',     'MARUTI.NS',     'Maruti Suzuki',       'NSE','14977',12800],
//   ['TATAMOTORS-EQ', 'TATAMOTORS.NS', 'Tata Motors',         'NSE','884',  875 ],
//   ['TATASTEEL-EQ',  'TATASTEEL.NS',  'Tata Steel',          'NSE','2475', 166 ],
//   ['SUNPHARMA-EQ',  'SUNPHARMA.NS',  'Sun Pharma',          'NSE','3456', 1780],
//   ['TITAN-EQ',      'TITAN.NS',      'Titan Company',       'NSE','467',  3460],
//   ['ADANIPORTS-EQ', 'ADANIPORTS.NS', 'Adani Ports',         'NSE','21808',1385],
//   ['NESTLEIND-EQ',  'NESTLEIND.NS',  'Nestle India',        'NSE','17963',2370],
//   ['ULTRACEMCO-EQ', 'ULTRACEMCO.NS', 'UltraTech Cement',    'NSE','11915',10800],
//   ['NTPC-EQ',       'NTPC.NS',       'NTPC Ltd',            'NSE','2142', 375 ],
//   ['POWERGRID-EQ',  'POWERGRID.NS',  'Power Grid',          'NSE','14978',330 ],
//   ['ONGC-EQ',       'ONGC.NS',       'ONGC',                'NSE','1660', 278 ],
//   ['BAJAJFINSV-EQ', 'BAJAJFINSV.NS', 'Bajaj Finserv',       'NSE','16675',1850],
//   ['ASIANPAINT-EQ', 'ASIANPAINT.NS', 'Asian Paints',        'NSE','13',   2490],
//   ['TECHM-EQ',      'TECHM.NS',      'Tech Mahindra',       'NSE','11703',1760],
//   ['HINDALCO-EQ',   'HINDALCO.NS',   'Hindalco Industries', 'NSE','1348', 705 ],
//   ['JSWSTEEL-EQ',   'JSWSTEEL.NS',   'JSW Steel',           'NSE','3300', 930 ],
//   ['DMART-EQ',      'DMART.NS',      'Avenue Supermarts',   'NSE','20374',4760],
//   ['DRREDDY-EQ',    'DRREDDY.NS',    "Dr Reddy's Labs",     'NSE','1042', 6680],
//   ['CIPLA-EQ',      'CIPLA.NS',      'Cipla Ltd',           'NSE','14309',1650],
//   ['COALINDIA-EQ',  'COALINDIA.NS',  'Coal India',          'NSE','1656', 417 ],
//   ['HEROMOTOCO-EQ', 'HEROMOTOCO.NS', 'Hero MotoCorp',       'NSE','1394', 4290],
//   ['INDUSINDBK-EQ', 'INDUSINDBK.NS', 'IndusInd Bank',       'NSE','3672', 1075],
//   ['DIVISLAB-EQ',   'DIVISLAB.NS',   "Divi's Laboratories", 'NSE','2303', 5820],
//   ['BAJAJ-AUTO-EQ', 'BAJAJ-AUTO.NS', 'Bajaj Auto',          'NSE','20286',8990],
//   ['EICHERMOT-EQ',  'EICHERMOT.NS',  'Eicher Motors',       'NSE','910',  4640],
//   ['GRASIM-EQ',     'GRASIM.NS',     'Grasim Industries',   'NSE','1234', 2730],
//   ['APOLLOHOSP-EQ', 'APOLLOHOSP.NS', 'Apollo Hospitals',    'NSE','157',  6850],
//   ['BRITANNIA-EQ',  'BRITANNIA.NS',  'Britannia Industries','NSE','547',  5430],
//   ['TATACONSUM-EQ', 'TATACONSUM.NS', 'Tata Consumer',       'NSE','2975', 1095],
//   ['PIDILITIND-EQ', 'PIDILITIND.NS', 'Pidilite Industries', 'NSE','2664', 2960],
//   ['HAVELLS-EQ',    'HAVELLS.NS',    'Havells India',       'NSE','1041', 1810],
//   ['SIEMENS-EQ',    'SIEMENS.NS',    'Siemens India',       'NSE','3104', 7480],
//   ['AMBUJACEM-EQ',  'AMBUJACEM.NS',  'Ambuja Cements',      'NSE','1270', 625 ],
//   ['SHREECEM-EQ',   'SHREECEM.NS',   'Shree Cement',        'NSE','3431', 27800],
//   ['BERGEPAINT-EQ', 'BERGEPAINT.NS', 'Berger Paints',       'NSE','434',  520 ],
//   ['NIFTY 50',      '^NSEI',         'Nifty 50 Index',      'NSE','26000',22450],
//   ['NIFTY BANK',    '^NSEBANK',      'Bank Nifty Index',    'NSE','26009',48350],
//   ['SENSEX',        '^BSESN',        'BSE Sensex',          'BSE','1',    74500],
// ];

// // ─── Minimal HTTPS GET (no axios) ─────────────────────────────────────────
// function httpsGet(url, extraHeaders = {}, timeoutMs = 8000) {
//   return new Promise((resolve, reject) => {
//     const u = new URL(url);
//     const req = https.request({
//       hostname: u.hostname, path: u.pathname + u.search, method: 'GET',
//       headers: {
//         'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
//         'Accept': 'application/json, */*',
//         'Accept-Language': 'en-US,en;q=0.9',
//         ...extraHeaders
//       },
//       timeout: timeoutMs
//     }, res => {
//       let data = '';
//       res.on('data', c => { data += c; });
//       res.on('end',  () => resolve({ status: res.statusCode, data, headers: res.headers }));
//     });
//     req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
//     req.on('error', reject);
//     req.end();
//   });
// }

// // ─── Check if internet is reachable ───────────────────────────────────────
// async function checkInternet() {
//   try {
//     const r = await httpsGet('https://query1.finance.yahoo.com/v8/finance/chart/TCS.NS?interval=1d&range=1d', {}, 6000);
//     return r.status === 200;
//   } catch (e) {
//     return false;
//   }
// }

// class LivePriceService extends EventEmitter {
//   constructor() {
//     super();
//     this.priceCache    = new Map();
//     this.symbolToToken = new Map();
//     this.tokenToMeta   = new Map();
//     this.yahooToAlice  = new Map();
//     this.aliceToYahoo  = new Map();
//     this.metaMap       = new Map();

//     // Alice Blue WS
//     this.ws            = null;
//     this.abAuthed      = false;
//     this.userSession   = null;
//     this.userId        = null;
//     this.heartbeatTimer= null;
//     this.subscribedKeys= new Set();
//     this.pendingSubs   = new Set();

//     // Polling
//     this.pollTimer     = null;
//     this.pollActive    = false;
//     this.hasInternet   = false;

//     // Simulation (fallback)
//     this.simIntervals  = new Map();
//     this.simOpen       = new Map(); // track day's open for simulation

//     this._initMeta();
//   }

//   _initMeta() {
//     STOCKS.forEach(([alice, yahoo, name, exchange, token]) => {
//       this.aliceToYahoo.set(alice, yahoo);
//       this.yahooToAlice.set(yahoo, alice);
//       this.metaMap.set(alice, { symbol: alice, name, exchange, token });
//       this.symbolToToken.set(alice, token);
//       this.tokenToMeta.set(`${exchange}:${token}`, { symbol: alice, name, exchange, token });
//     });
//   }

//   // ══════════════════════════════════════════════════════════════
//   // MAIN ENTRY POINT — auto-detects internet and starts correct mode
//   // ══════════════════════════════════════════════════════════════
//   async startYahooPolling() {
//     if (this.pollActive) return;
//     this.pollActive = true;

//     console.log('🔍 Checking internet connectivity...');
//     this.hasInternet = await checkInternet();

//     if (this.hasInternet) {
//       console.log('✅ Internet available — fetching REAL NSE prices from Yahoo Finance');
//       await this._pollYahoo(); // immediate first fetch
//       this.pollTimer = setInterval(() => this._pollYahoo(), 3000);
//     } else {
//       console.log('');
//       console.log('⚠️  ─────────────────────────────────────────────────────────');
//       console.log('⚠️  NO INTERNET ACCESS on this machine.');
//       console.log('⚠️  Your Node.js server cannot reach external price APIs.');
//       console.log('⚠️');
//       console.log('⚠️  Fix options:');
//       console.log('⚠️  1. Check if firewall/antivirus is blocking outbound HTTPS');
//       console.log('⚠️  2. Set DNS to 8.8.8.8 in your network adapter settings');
//       console.log('⚠️  3. If Docker: use --network=host flag');
//       console.log('⚠️  4. Disable VPN if active');
//       console.log('⚠️');
//       console.log('⚠️  USING SIMULATION MODE (prices are NOT real)');
//       console.log('⚠️  ─────────────────────────────────────────────────────────');
//       console.log('');
//       this._startSimulation();
//     }
//   }

//   stopYahooPolling() {
//     clearInterval(this.pollTimer);
//     this.pollActive = false;
//     this._stopSimulation();
//   }

//   // ══════════════════════════════════════════════════════════════
//   // YAHOO FINANCE POLLING (when internet available)
//   // ══════════════════════════════════════════════════════════════
//   async _pollYahoo() {
//     const tickers = STOCKS.map(s => s[1]);
//     // Split into chunks of 20 to avoid URL length limits
//     const CHUNK = 20;
//     for (let i = 0; i < tickers.length; i += CHUNK) {
//       const chunk = tickers.slice(i, i + CHUNK);
//       await this._fetchYahooChunk(chunk).catch(() => {});
//     }
//   }

//   async _fetchYahooChunk(tickers) {
//     // Yahoo v8 chart API — most reliable, no crumb needed
//     const promises = tickers.map(ticker => this._fetchOneTicker(ticker));
//     await Promise.allSettled(promises);
//   }

//   async _fetchOneTicker(ticker) {
//     try {
//       const url  = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d&includePrePost=false`;
//       const resp = await httpsGet(url);
//       if (resp.status !== 200) return;

//       const json   = JSON.parse(resp.data);
//       const result = json?.chart?.result?.[0];
//       if (!result) return;

//       const meta      = result.meta;
//       const alice     = this.yahooToAlice.get(ticker);
//       if (!alice) return;

//       const ltp       = meta.regularMarketPrice      || 0;
//       const prevClose = meta.previousClose            || meta.chartPreviousClose || ltp;
//       const open      = meta.regularMarketOpen        || prevClose;
//       const high      = meta.regularMarketDayHigh     || ltp;
//       const low       = meta.regularMarketDayLow      || ltp;
//       const volume    = meta.regularMarketVolume      || 0;
//       const change    = ltp - prevClose;
//       const changePct = prevClose > 0 ? (change / prevClose * 100) : 0;

//       const priceObj = {
//         ltp:       +ltp.toFixed(2),
//         open:      +open.toFixed(2),
//         high:      +high.toFixed(2),
//         low:       +low.toFixed(2),
//         prevClose: +prevClose.toFixed(2),
//         volume,
//         change:    +change.toFixed(2),
//         changePct: +changePct.toFixed(2),
//         timestamp: Date.now(),
//         marketState: meta.tradingSession || (meta.marketState === 'REGULAR' ? 'Open' : 'Closed'),
//         isSimulated: false,
//       };

//       this._savePrice(alice, priceObj);
//     } catch (e) {
//       // silent per ticker
//     }
//   }

//   // ══════════════════════════════════════════════════════════════
//   // SIMULATION (fallback when NO internet)
//   // ══════════════════════════════════════════════════════════════
//   _startSimulation() {
//     // Only simulate during market hours: Mon-Fri 9:15am - 3:30pm IST
//     // Outside hours: show last known prices (frozen)
//     const now   = new Date();
//     const ist   = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
//     const h     = ist.getHours(), m = ist.getMinutes(), day = ist.getDay();
//     const isMarketHours = day >= 1 && day <= 5 && (h > 9 || (h === 9 && m >= 15)) && h < 15 || (h === 15 && m <= 30);

//     STOCKS.forEach(([alice,, name, exchange, token, basePrice]) => {
//       // Simulate realistic opening: ±0.8% from prev close
//       const prevClose = basePrice;
//       const open      = +(prevClose * (1 + (Math.random() - 0.5) * 0.016)).toFixed(2);
//       this.simOpen.set(alice, open);

//       let ltp = open;
//       const seed = this._mkPrice(ltp, open, open, open, prevClose, 0, false);
//       this._savePrice(alice, { ...seed, isSimulated: true });

//       if (!isMarketHours) return; // don't simulate outside market hours

//       const iv = setInterval(() => {
//         const prev = this.priceCache.get(alice) || seed;
//         if (!prev) return;

//         // Realistic random walk with mean-reversion toward VWAP
//         const vwap    = (prev.open + prev.high + prev.low + prev.ltp) / 4;
//         const meanRev = (vwap - prev.ltp) * 0.001;
//         const noise   = (Math.random() - 0.499) * prev.ltp * 0.0008;
//         const newLtp  = Math.max(+(prev.ltp + meanRev + noise).toFixed(2), 0.01);

//         const updated = this._mkPrice(
//           newLtp, prev.open,
//           Math.max(prev.high, newLtp),
//           Math.min(prev.low,  newLtp),
//           prev.prevClose,
//           prev.volume + Math.floor(Math.random() * 200),
//           true
//         );

//         this._savePrice(alice, updated);
//       }, 1500 + Math.floor(Math.random() * 1000));

//       this.simIntervals.set(alice, iv);
//     });

//     console.log(`📊 Simulation started for ${STOCKS.length} stocks (⚠️ NOT real prices)`);
//   }

//   _stopSimulation() {
//     this.simIntervals.forEach(iv => clearInterval(iv));
//     this.simIntervals.clear();
//   }

//   _mkPrice(ltp, open, high, low, prevClose, volume, isSimulated) {
//     const change    = +(ltp - prevClose).toFixed(2);
//     const changePct = prevClose > 0 ? +(change / prevClose * 100).toFixed(2) : 0;
//     return { ltp, open, high, low, prevClose, volume, change, changePct,
//              timestamp: Date.now(), marketState: 'Open', isSimulated };
//   }

//   // ══════════════════════════════════════════════════════════════
//   // SHARED CACHE WRITE
//   // ══════════════════════════════════════════════════════════════
//   _savePrice(alice, priceObj) {
//     const meta = this.metaMap.get(alice) || {};
//     const full = {
//       ...priceObj,
//       symbol:   alice,
//       name:     meta.name     || alice,
//       exchange: meta.exchange || 'NSE',
//       token:    meta.token    || '',
//     };
//     const prev = this.priceCache.get(alice);
//     this.priceCache.set(alice, full);
//     if (meta.token) this.priceCache.set(`${meta.exchange}:${meta.token}`, full);

//     if (!prev || prev.ltp !== full.ltp || prev.changePct !== full.changePct) {
//       this.emit('price_update', {
//         key:      `${meta.exchange}:${meta.token}`,
//         symbol:   alice,
//         exchange: meta.exchange || 'NSE',
//         token:    meta.token    || '',
//         name:     full.name,
//         data:     full
//       });
//     }
//   }

//   // ══════════════════════════════════════════════════════════════
//   // ALICE BLUE WEBSOCKET
//   // ══════════════════════════════════════════════════════════════
//   async startReal(userSession, userId) {
//     this.userSession = userSession;
//     this.userId      = userId;
//     if (!this.pollActive) this.startYahooPolling();

//     if (!this.hasInternet) {
//       console.log('ℹ️  No internet — Alice Blue WS also unavailable. Using simulation.');
//       return;
//     }

//     try {
//       const axios = require('axios');
//       await axios.post(
//         `${BASE_URL}/open-api/od/v1/profile/createWsSess`,
//         { source: 'API', userId },
//         { headers: { Authorization: `Bearer ${userSession}`, 'Content-Type': 'application/json' }, timeout: 8000 }
//       );
//       this._connectAB();
//     } catch (err) {
//       if (err.response?.status === 401) {
//         console.log('⚠️  Alice Blue session expired — please re-login your client');
//       } else {
//         console.warn('AB WS session failed:', err.message);
//       }
//     }
//   }

//   _connectAB() {
//     try { if (this.ws) this.ws.terminate(); } catch (e) {}
//     this.ws = new WebSocket(AB_WS, { handshakeTimeout: 10000 });

//     this.ws.on('open', () => {
//       const t = this._sha256(this._sha256(this.userSession));
//       this.ws.send(JSON.stringify({
//         susertoken: t, t: 'c',
//         actid: `${this.userId}_API`, uid: `${this.userId}_API`, source: 'API'
//       }));
//     });

//     this.ws.on('message', raw => {
//       try { this._onABMsg(JSON.parse(raw.toString())); } catch (e) {}
//     });

//     this.ws.on('close', () => {
//       this.abAuthed = false;
//       clearInterval(this.heartbeatTimer);
//       setTimeout(() => { if (this.userSession && this.hasInternet) this._connectAB(); }, 5000);
//     });

//     this.ws.on('error', () => {});
//   }

//   _onABMsg(msg) {
//     if (msg.t === 'cf') {
//       if (String(msg.k).toUpperCase() === 'OK') {
//         console.log('⚡ Alice Blue WS authenticated — real-time feed active!');
//         this.abAuthed = true;
//         this.heartbeatTimer = setInterval(() => {
//           if (this.ws?.readyState === WebSocket.OPEN)
//             this.ws.send(JSON.stringify({ k: '', t: 'h' }));
//         }, 50000);
//         if (this.pendingSubs.size) { this._sendABSub([...this.pendingSubs]); this.pendingSubs.clear(); }
//         if (this.subscribedKeys.size) this._sendABSub([...this.subscribedKeys]);
//       }
//       return;
//     }

//     if (msg.t === 'tk' || msg.t === 'tf') {
//       const exchange  = msg.e  || '';
//       const token     = msg.tk || '';
//       if (!exchange || !token) return;
//       const cacheKey  = `${exchange}:${token}`;
//       const prev      = this.priceCache.get(cacheKey) || {};
//       const ltp       = parseFloat(msg.lp ?? prev.ltp      ?? 0);
//       const open      = parseFloat(msg.o  ?? prev.open     ?? ltp);
//       const high      = parseFloat(msg.h  ?? prev.high     ?? ltp);
//       const low       = parseFloat(msg.l  ?? prev.low      ?? ltp);
//       const prevClose = parseFloat(msg.c  ?? prev.prevClose ?? ltp);
//       const volume    = parseInt  (msg.v  ?? prev.volume   ?? 0);

//       const existingMeta = this.tokenToMeta.get(cacheKey);
//       if (msg.ts && !existingMeta) {
//         const m = { token, exchange, symbol: msg.ts, name: msg.ts.replace(/-EQ$/i,'') };
//         this.tokenToMeta.set(cacheKey, m);
//         this.metaMap.set(msg.ts, m);
//         this.symbolToToken.set(msg.ts, token);
//       }
//       const meta = existingMeta || this.tokenToMeta.get(cacheKey) || {};
//       const priceObj = {
//         ltp: +ltp.toFixed(2), open: +open.toFixed(2),
//         high: +Math.max(high,ltp).toFixed(2), low: +Math.min(low,ltp).toFixed(2),
//         prevClose: +prevClose.toFixed(2), volume,
//         change: +(ltp-prevClose).toFixed(2),
//         changePct: +(prevClose>0?(ltp-prevClose)/prevClose*100:0).toFixed(2),
//         timestamp: Date.now(), marketState: 'Open', isSimulated: false
//       };
//       const aliceSym = meta.symbol || msg.ts;
//       if (aliceSym) this._savePrice(aliceSym, priceObj);
//     }
//   }

//   _sendABSub(wsKeys) {
//     if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
//     for (let i = 0; i < wsKeys.length; i += 50)
//       this.ws.send(JSON.stringify({ k: wsKeys.slice(i,i+50).join('#'), t: 't' }));
//   }

//   subscribe(instruments) {
//     if (!instruments?.length) return;
//     instruments.forEach(inst => {
//       const cacheKey = `${inst.exchange}:${inst.token}`;
//       const wsKey    = `${inst.exchange}|${inst.token}`;
//       this.tokenToMeta.set(cacheKey, inst);
//       this.metaMap.set(inst.symbol, inst);
//       this.symbolToToken.set(inst.symbol, inst.token);
//       if (!this.subscribedKeys.has(wsKey)) {
//         this.subscribedKeys.add(wsKey);
//         if (this.abAuthed && this.ws?.readyState === WebSocket.OPEN)
//           this._sendABSub([wsKey]);
//         else
//           this.pendingSubs.add(wsKey);
//       }
//     });
//   }

//   // ══════════════════════════════════════════════════════════════
//   // PRICE GETTERS
//   // ══════════════════════════════════════════════════════════════
//   getBySymbol(exchange, symbol) {
//     return this.priceCache.get(symbol) ||
//            this.priceCache.get(symbol + '-EQ') ||
//            this.priceCache.get(`${exchange}:${this.symbolToToken.get(symbol)}`);
//   }

//   getByToken(exchange, token) {
//     const sym = this.tokenToMeta.get(`${exchange}:${token}`)?.symbol;
//     return sym ? this.priceCache.get(sym) : null;
//   }

//   getAllPrices() {
//     const out = {};
//     this.priceCache.forEach((price, key) => {
//       if (price.symbol && key === price.symbol) out[key] = price;
//     });
//     return out;
//   }

//   isRealTime()  { return this.abAuthed; }
//   hasNetwork()  { return this.hasInternet; }
//   isSimulating(){ return !this.hasInternet && !this.abAuthed; }

//   generateCandleData(symbol, exchange = 'NSE', intervalLabel = '1min', count = 60) {
//     const price = this.getBySymbol(exchange, symbol) || this.priceCache.get(symbol);
//     const ltp   = price?.ltp       || 1000;
//     const opn   = price?.open      || ltp * 0.99;
//     const hi    = price?.high      || ltp * 1.005;
//     const lo    = price?.low       || ltp * 0.995;
//     const vol   = price?.volume    || 5000000;
//     const ms    = intervalLabel === '5min' ? 300000 : intervalLabel === '1hour' ? 3600000 : 60000;
//     const now   = Date.now();
//     const out   = [];
//     let p = opn;

//     for (let i = count; i >= 0; i--) {
//       const progress = (count - i) / count;
//       const trend    = (ltp - opn) * progress;
//       const noise    = (Math.random() - 0.48) * ltp * 0.005;
//       const o  = p;
//       const c  = Math.max(opn + trend + noise, 0.01);
//       const h  = Math.min(Math.max(o,c)*(1+Math.random()*0.003), hi+ltp*0.002);
//       const l  = Math.max(Math.min(o,c)*(1-Math.random()*0.003), lo-ltp*0.002);
//       out.push({ time:now-i*ms, open:+o.toFixed(2), high:+h.toFixed(2),
//                  low:+l.toFixed(2), close:+c.toFixed(2),
//                  volume:Math.floor(vol/count*(0.5+Math.random())), isGreen:c>=o });
//       p = c;
//     }
//     if (out.length) {
//       out[out.length-1].close   = +ltp.toFixed(2);
//       out[out.length-1].high    = +Math.max(out[out.length-1].high, ltp).toFixed(2);
//       out[out.length-1].low     = +Math.min(out[out.length-1].low,  ltp).toFixed(2);
//       out[out.length-1].isGreen = ltp >= out[out.length-1].open;
//     }
//     return out;
//   }

//   _sha256(str) { return crypto.createHash('sha256').update(str).digest('hex'); }
// }

// module.exports = new LivePriceService();




/**
 * LivePriceService
 * ─────────────────────────────────────────────────────────────
 * Priority 1: Alice Blue WebSocket — real-time ms feed
 *             (requires active session + internet on server)
 *
 * Priority 2: Yahoo Finance / NSE polling
 *             (requires server to have internet access)
 *
 * Fallback: Realistic simulation (market-hours aware)
 *           Used ONLY when server has no internet — for dev/testing
 *
 * NOTE: If you see "No internet / DNS failed" in logs, your Node.js
 * server machine cannot reach external URLs. Fix options:
 *   - Check firewall / antivirus blocking outbound HTTPS
 *   - Check DNS (try setting 8.8.8.8 in network settings)
 *   - If running in Docker: add --network=host flag
 * ─────────────────────────────────────────────────────────────
 */

const WebSocket = require('ws');
const crypto = require('crypto');
const https = require('https');
const EventEmitter = require('events');
require('dotenv').config();

const BASE_URL = process.env.ALICE_BASE_URL || 'https://a3.aliceblueonline.com';
const AB_WS = 'wss://ws1.aliceblueonline.com/NorenWS';

// ─── Master stock list ─────────────────────────────────────────────────────
// [aliceSymbol, yahooTicker, displayName, exchange, token, basePrice]
const STOCKS = [
  ['RELIANCE-EQ', 'RELIANCE.NS', 'Reliance Industries', 'NSE', '1922', 2980],
  ['TCS-EQ', 'TCS.NS', 'TCS', 'NSE', '11536', 3900],
  ['HDFCBANK-EQ', 'HDFCBANK.NS', 'HDFC Bank', 'NSE', '1333', 1685],
  ['INFY-EQ', 'INFY.NS', 'Infosys', 'NSE', '1594', 1780],
  ['ICICIBANK-EQ', 'ICICIBANK.NS', 'ICICI Bank', 'NSE', '4963', 1295],
  ['KOTAKBANK-EQ', 'KOTAKBANK.NS', 'Kotak Bank', 'NSE', '10999', 1910],
  ['HINDUNILVR-EQ', 'HINDUNILVR.NS', 'Hindustan Unilever', 'NSE', '1270', 2340],
  ['AXISBANK-EQ', 'AXISBANK.NS', 'Axis Bank', 'NSE', '10794', 1195],
  ['LT-EQ', 'LT.NS', 'L&T', 'NSE', '11483', 3680],
  ['ITC-EQ', 'ITC.NS', 'ITC Ltd', 'NSE', '1232', 470],
  ['SBIN-EQ', 'SBIN.NS', 'State Bank of India', 'NSE', '3045', 805],
  ['BHARTIARTL-EQ', 'BHARTIARTL.NS', 'Bharti Airtel', 'NSE', '18391', 1840],
  ['BAJFINANCE-EQ', 'BAJFINANCE.NS', 'Bajaj Finance', 'NSE', '317', 7250],
  ['WIPRO-EQ', 'WIPRO.NS', 'Wipro', 'NSE', '11532', 487],
  ['HCLTECH-EQ', 'HCLTECH.NS', 'HCL Technologies', 'NSE', '7229', 1920],
  ['MARUTI-EQ', 'MARUTI.NS', 'Maruti Suzuki', 'NSE', '14977', 12800],
  ['TATAMOTORS-EQ', 'TATAMOTORS.NS', 'Tata Motors', 'NSE', '884', 875],
  ['TATASTEEL-EQ', 'TATASTEEL.NS', 'Tata Steel', 'NSE', '2475', 166],
  ['SUNPHARMA-EQ', 'SUNPHARMA.NS', 'Sun Pharma', 'NSE', '3456', 1780],
  ['TITAN-EQ', 'TITAN.NS', 'Titan Company', 'NSE', '467', 3460],
  ['ADANIPORTS-EQ', 'ADANIPORTS.NS', 'Adani Ports', 'NSE', '21808', 1385],
  ['NESTLEIND-EQ', 'NESTLEIND.NS', 'Nestle India', 'NSE', '17963', 2370],
  ['ULTRACEMCO-EQ', 'ULTRACEMCO.NS', 'UltraTech Cement', 'NSE', '11915', 10800],
  ['NTPC-EQ', 'NTPC.NS', 'NTPC Ltd', 'NSE', '2142', 375],
  ['POWERGRID-EQ', 'POWERGRID.NS', 'Power Grid', 'NSE', '14978', 330],
  ['ONGC-EQ', 'ONGC.NS', 'ONGC', 'NSE', '1660', 278],
  ['BAJAJFINSV-EQ', 'BAJAJFINSV.NS', 'Bajaj Finserv', 'NSE', '16675', 1850],
  ['ASIANPAINT-EQ', 'ASIANPAINT.NS', 'Asian Paints', 'NSE', '13', 2490],
  ['TECHM-EQ', 'TECHM.NS', 'Tech Mahindra', 'NSE', '11703', 1760],
  ['HINDALCO-EQ', 'HINDALCO.NS', 'Hindalco Industries', 'NSE', '1348', 705],
  ['JSWSTEEL-EQ', 'JSWSTEEL.NS', 'JSW Steel', 'NSE', '3300', 930],
  ['DMART-EQ', 'DMART.NS', 'Avenue Supermarts', 'NSE', '20374', 4760],
  ['DRREDDY-EQ', 'DRREDDY.NS', "Dr Reddy's Labs", 'NSE', '1042', 6680],
  ['CIPLA-EQ', 'CIPLA.NS', 'Cipla Ltd', 'NSE', '14309', 1650],
  ['COALINDIA-EQ', 'COALINDIA.NS', 'Coal India', 'NSE', '1656', 417],
  ['HEROMOTOCO-EQ', 'HEROMOTOCO.NS', 'Hero MotoCorp', 'NSE', '1394', 4290],
  ['INDUSINDBK-EQ', 'INDUSINDBK.NS', 'IndusInd Bank', 'NSE', '3672', 1075],
  ['DIVISLAB-EQ', 'DIVISLAB.NS', "Divi's Laboratories", 'NSE', '2303', 5820],
  ['BAJAJ-AUTO-EQ', 'BAJAJ-AUTO.NS', 'Bajaj Auto', 'NSE', '20286', 8990],
  ['EICHERMOT-EQ', 'EICHERMOT.NS', 'Eicher Motors', 'NSE', '910', 4640],
  ['GRASIM-EQ', 'GRASIM.NS', 'Grasim Industries', 'NSE', '1234', 2730],
  ['APOLLOHOSP-EQ', 'APOLLOHOSP.NS', 'Apollo Hospitals', 'NSE', '157', 6850],
  ['BRITANNIA-EQ', 'BRITANNIA.NS', 'Britannia Industries', 'NSE', '547', 5430],
  ['TATACONSUM-EQ', 'TATACONSUM.NS', 'Tata Consumer', 'NSE', '2975', 1095],
  ['PIDILITIND-EQ', 'PIDILITIND.NS', 'Pidilite Industries', 'NSE', '2664', 2960],
  ['HAVELLS-EQ', 'HAVELLS.NS', 'Havells India', 'NSE', '1041', 1810],
  ['SIEMENS-EQ', 'SIEMENS.NS', 'Siemens India', 'NSE', '3104', 7480],
  ['AMBUJACEM-EQ', 'AMBUJACEM.NS', 'Ambuja Cements', 'NSE', '1270', 625],
  ['SHREECEM-EQ', 'SHREECEM.NS', 'Shree Cement', 'NSE', '3431', 27800],
  ['BERGEPAINT-EQ', 'BERGEPAINT.NS', 'Berger Paints', 'NSE', '434', 520],
  ['NIFTY 50', '^NSEI', 'Nifty 50 Index', 'NSE', '26000', 22450],
  ['NIFTY BANK', '^NSEBANK', 'Bank Nifty Index', 'NSE', '26009', 48350],
  ['SENSEX', '^BSESN', 'BSE Sensex', 'BSE', '1', 74500],
];

// ─── Minimal HTTPS GET (no axios) ─────────────────────────────────────────
function httpsGet(url, extraHeaders = {}, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    try { // [TRY/CATCH ADDED]
      const u = new URL(url);
      const req = https.request({
        hostname: u.hostname, path: u.pathname + u.search, method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          ...extraHeaders
        },
        timeout: timeoutMs
      }, res => {
        let data = '';
        res.on('data', c => { data += c; });
        res.on('end', () => resolve({ status: res.statusCode, data, headers: res.headers }));
      });
      req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
      req.on('error', reject);
      req.end();
    } catch (err) {
      reject(err);
    }
  });
}

// ─── Check if internet is reachable ───────────────────────────────────────
async function checkInternet() {
  try { // [TRY/CATCH ADDED]
    const r = await httpsGet('https://query1.finance.yahoo.com/v8/finance/chart/TCS.NS?interval=1d&range=1d', {}, 6000);
    return r.status === 200;
  } catch (e) {
    return false;
  }
}

class LivePriceService extends EventEmitter {
  constructor() {
    super();
    try { // [TRY/CATCH ADDED]
      this.priceCache = new Map();
      this.symbolToToken = new Map();
      this.tokenToMeta = new Map();
      this.yahooToAlice = new Map();
      this.aliceToYahoo = new Map();
      this.metaMap = new Map();

      // Alice Blue WS
      this.ws = null;
      this.abAuthed = false;
      this.userSession = null;
      this.userId = null;
      this.heartbeatTimer = null;
      this.subscribedKeys = new Set();
      this.pendingSubs = new Set();

      // Polling
      this.pollTimer = null;
      this.pollActive = false;
      this.hasInternet = false;

      // Simulation (fallback)
      this.simIntervals = new Map();
      this.simOpen = new Map(); // track day's open for simulation

      this._initMeta();
    } catch (err) {
      console.error('LivePriceService constructor error:', err);
      throw err; // fatal, cannot proceed
    }
  }

  _initMeta() {
    try { // [TRY/CATCH ADDED]
      STOCKS.forEach(([alice, yahoo, name, exchange, token]) => {
        this.aliceToYahoo.set(alice, yahoo);
        this.yahooToAlice.set(yahoo, alice);
        this.metaMap.set(alice, { symbol: alice, name, exchange, token });
        this.symbolToToken.set(alice, token);
        this.tokenToMeta.set(`${exchange}:${token}`, { symbol: alice, name, exchange, token });
      });
    } catch (err) {
      console.error('_initMeta error:', err);
    }
  }

  // ══════════════════════════════════════════════════════════════
  // MAIN ENTRY POINT — auto-detects internet and starts correct mode
  // ══════════════════════════════════════════════════════════════
  async startYahooPolling() {
    try { // [TRY/CATCH ADDED]
      if (this.pollActive) return;
      this.pollActive = true;

      console.log('🔍 Checking internet connectivity...');
      this.hasInternet = await checkInternet();

      if (this.hasInternet) {
        console.log('✅ Internet available — fetching REAL NSE prices from Yahoo Finance');
        await this._pollYahoo(); // immediate first fetch
        this.pollTimer = setInterval(() => this._pollYahoo(), 3000);
      } else {
        console.log('');
        console.log('⚠️  ─────────────────────────────────────────────────────────');
        console.log('⚠️  NO INTERNET ACCESS on this machine.');
        console.log('⚠️  Your Node.js server cannot reach external price APIs.');
        console.log('⚠️');
        console.log('⚠️  Fix options:');
        console.log('⚠️  1. Check if firewall/antivirus is blocking outbound HTTPS');
        console.log('⚠️  2. Set DNS to 8.8.8.8 in your network adapter settings');
        console.log('⚠️  3. If Docker: use --network=host flag');
        console.log('⚠️  4. Disable VPN if active');
        console.log('⚠️');
        console.log('⚠️  USING SIMULATION MODE (prices are NOT real)');
        console.log('⚠️  ─────────────────────────────────────────────────────────');
        console.log('');
        this._startSimulation();
      }
    } catch (err) {
      console.error('startYahooPolling error:', err);
      // fallback to simulation
      this.hasInternet = false;
      this._startSimulation();
    }
  }

  stopYahooPolling() {
    try { // [TRY/CATCH ADDED]
      clearInterval(this.pollTimer);
      this.pollActive = false;
      this._stopSimulation();
    } catch (err) {
      console.error('stopYahooPolling error:', err);
    }
  }

  // ══════════════════════════════════════════════════════════════
  // YAHOO FINANCE POLLING (when internet available)
  // ══════════════════════════════════════════════════════════════
  async _pollYahoo() {
    try { // [TRY/CATCH ADDED]
      const tickers = STOCKS.map(s => s[1]);
      // Split into chunks of 20 to avoid URL length limits
      const CHUNK = 20;
      for (let i = 0; i < tickers.length; i += CHUNK) {
        const chunk = tickers.slice(i, i + CHUNK);
        await this._fetchYahooChunk(chunk).catch(() => { });
      }
    } catch (err) {
      console.error('_pollYahoo error:', err);
    }
  }

  async _fetchYahooChunk(tickers) {
    try { // [TRY/CATCH ADDED]
      const promises = tickers.map(ticker => this._fetchOneTicker(ticker));
      await Promise.allSettled(promises);
    } catch (err) {
      console.error('_fetchYahooChunk error:', err);
    }
  }

  async _fetchOneTicker(ticker) {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d&includePrePost=false`;
      const resp = await httpsGet(url);
      if (resp.status !== 200) return;

      const json = JSON.parse(resp.data);
      const result = json?.chart?.result?.[0];
      if (!result) return;

      const meta = result.meta;
      const alice = this.yahooToAlice.get(ticker);
      if (!alice) return;

      const ltp = meta.regularMarketPrice || 0;
      const prevClose = meta.previousClose || meta.chartPreviousClose || ltp;
      const open = meta.regularMarketOpen || prevClose;
      const high = meta.regularMarketDayHigh || ltp;
      const low = meta.regularMarketDayLow || ltp;
      const volume = meta.regularMarketVolume || 0;
      const change = ltp - prevClose;
      const changePct = prevClose > 0 ? (change / prevClose * 100) : 0;

      const priceObj = {
        ltp: +ltp.toFixed(2),
        open: +open.toFixed(2),
        high: +high.toFixed(2),
        low: +low.toFixed(2),
        prevClose: +prevClose.toFixed(2),
        volume,
        change: +change.toFixed(2),
        changePct: +changePct.toFixed(2),
        timestamp: Date.now(),
        marketState: meta.tradingSession || (meta.marketState === 'REGULAR' ? 'Open' : 'Closed'),
        isSimulated: false,
      };

      this._savePrice(alice, priceObj);
    } catch (e) {
      // silent per ticker
    }
  }

  // ══════════════════════════════════════════════════════════════
  // SIMULATION (fallback when NO internet)
  // ══════════════════════════════════════════════════════════════
  _startSimulation() {
    try { // [TRY/CATCH ADDED]
      // Only simulate during market hours: Mon-Fri 9:15am - 3:30pm IST
      // Outside hours: show last known prices (frozen)
      const now = new Date();
      const ist = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
      const h = ist.getHours(), m = ist.getMinutes(), day = ist.getDay();
      const isMarketHours = day >= 1 && day <= 5 && (h > 9 || (h === 9 && m >= 15)) && h < 15 || (h === 15 && m <= 30);

      STOCKS.forEach(([alice, , name, exchange, token, basePrice]) => {
        // Simulate realistic opening: ±0.8% from prev close
        const prevClose = basePrice;
        const open = +(prevClose * (1 + (Math.random() - 0.5) * 0.016)).toFixed(2);
        this.simOpen.set(alice, open);

        let ltp = open;
        const seed = this._mkPrice(ltp, open, open, open, prevClose, 0, false);
        this._savePrice(alice, { ...seed, isSimulated: true });

        if (!isMarketHours) return; // don't simulate outside market hours

        const iv = setInterval(() => {
          try { // [TRY/CATCH ADDED]
            const prev = this.priceCache.get(alice) || seed;
            if (!prev) return;

            // Realistic random walk with mean-reversion toward VWAP
            const vwap = (prev.open + prev.high + prev.low + prev.ltp) / 4;
            const meanRev = (vwap - prev.ltp) * 0.001;
            const noise = (Math.random() - 0.499) * prev.ltp * 0.0008;
            const newLtp = Math.max(+(prev.ltp + meanRev + noise).toFixed(2), 0.01);

            const updated = this._mkPrice(
              newLtp, prev.open,
              Math.max(prev.high, newLtp),
              Math.min(prev.low, newLtp),
              prev.prevClose,
              prev.volume + Math.floor(Math.random() * 200),
              true
            );

            this._savePrice(alice, updated);
          } catch (e) {
            console.error(`Simulation interval error for ${alice}:`, e);
          }
        }, 1500 + Math.floor(Math.random() * 1000));

        this.simIntervals.set(alice, iv);
      });

      console.log(`📊 Simulation started for ${STOCKS.length} stocks (⚠️ NOT real prices)`);
    } catch (err) {
      console.error('_startSimulation error:', err);
    }
  }

  _stopSimulation() {
    try { // [TRY/CATCH ADDED]
      this.simIntervals.forEach(iv => clearInterval(iv));
      this.simIntervals.clear();
    } catch (err) {
      console.error('_stopSimulation error:', err);
    }
  }

  _mkPrice(ltp, open, high, low, prevClose, volume, isSimulated) {
    try { // [TRY/CATCH ADDED]
      const change = +(ltp - prevClose).toFixed(2);
      const changePct = prevClose > 0 ? +(change / prevClose * 100).toFixed(2) : 0;
      return {
        ltp, open, high, low, prevClose, volume, change, changePct,
        timestamp: Date.now(), marketState: 'Open', isSimulated
      };
    } catch (err) {
      console.error('_mkPrice error:', err);
      return { ltp, open, high, low, prevClose, volume, change: 0, changePct: 0, timestamp: Date.now(), marketState: 'Open', isSimulated };
    }
  }

  // ══════════════════════════════════════════════════════════════
  // SHARED CACHE WRITE
  // ══════════════════════════════════════════════════════════════
  _savePrice(alice, priceObj) {
    try { // [TRY/CATCH ADDED]
      const meta = this.metaMap.get(alice) || {};
      const full = {
        ...priceObj,
        symbol: alice,
        name: meta.name || alice,
        exchange: meta.exchange || 'NSE',
        token: meta.token || '',
      };
      const prev = this.priceCache.get(alice);
      this.priceCache.set(alice, full);
      if (meta.token) this.priceCache.set(`${meta.exchange}:${meta.token}`, full);

      if (!prev || prev.ltp !== full.ltp || prev.changePct !== full.changePct) {
        this.emit('price_update', {
          key: `${meta.exchange}:${meta.token}`,
          symbol: alice,
          exchange: meta.exchange || 'NSE',
          token: meta.token || '',
          name: full.name,
          data: full
        });
      }
    } catch (err) {
      console.error('_savePrice error:', err);
    }
  }

  // ══════════════════════════════════════════════════════════════
  // ALICE BLUE WEBSOCKET
  // ══════════════════════════════════════════════════════════════
  async startReal(userSession, userId) {
    try { // [TRY/CATCH ADDED]
      this.userSession = userSession;
      this.userId = userId;
      if (!this.pollActive) this.startYahooPolling();

      if (!this.hasInternet) {
        console.log('ℹ️  No internet — Alice Blue WS also unavailable. Using simulation.');
        return;
      }

      try {
        const axios = require('axios');
        await axios.post(
          `${BASE_URL}/open-api/od/v1/profile/createWsSess`,
          { source: 'API', userId },
          { headers: { Authorization: `Bearer ${userSession}`, 'Content-Type': 'application/json' }, timeout: 8000 }
        );
        this._connectAB();
      } catch (err) {
        if (err.response?.status === 401) {
          console.log('⚠️  Alice Blue session expired — please re-login your client');
        } else {
          console.warn('AB WS session failed:', err.message);
        }
      }
    } catch (err) {
      console.error('startReal error:', err);
    }
  }

  _connectAB() {
    try { // [TRY/CATCH ADDED]
      try { if (this.ws) this.ws.terminate(); } catch (e) { }
      this.ws = new WebSocket(AB_WS, { handshakeTimeout: 10000 });

      this.ws.on('open', () => {
        try { // [TRY/CATCH ADDED]
          const t = this._sha256(this._sha256(this.userSession));
          this.ws.send(JSON.stringify({
            susertoken: t, t: 'c',
            actid: `${this.userId}_API`, uid: `${this.userId}_API`, source: 'API'
          }));
        } catch (err) {
          console.error('WebSocket open handler error:', err);
        }
      });

      this.ws.on('message', raw => {
        try { this._onABMsg(JSON.parse(raw.toString())); } catch (e) { }
      });

      this.ws.on('close', () => {
        this.abAuthed = false;
        clearInterval(this.heartbeatTimer);
        setTimeout(() => { if (this.userSession && this.hasInternet) this._connectAB(); }, 5000);
      });

      this.ws.on('error', (err) => {
        console.error('WebSocket error:', err.message);
      });
    } catch (err) {
      console.error('_connectAB error:', err);
    }
  }

  _onABMsg(msg) {
    try { // [TRY/CATCH ADDED]
      if (msg.t === 'cf') {
        if (String(msg.k).toUpperCase() === 'OK') {
          console.log('⚡ Alice Blue WS authenticated — real-time feed active!');
          this.abAuthed = true;
          this.heartbeatTimer = setInterval(() => {
            try { // [TRY/CATCH ADDED]
              if (this.ws?.readyState === WebSocket.OPEN)
                this.ws.send(JSON.stringify({ k: '', t: 'h' }));
            } catch (e) { }
          }, 50000);
          if (this.pendingSubs.size) { this._sendABSub([...this.pendingSubs]); this.pendingSubs.clear(); }
          if (this.subscribedKeys.size) this._sendABSub([...this.subscribedKeys]);
        }
        return;
      }

      if (msg.t === 'tk' || msg.t === 'tf') {
        const exchange = msg.e || '';
        const token = msg.tk || '';
        if (!exchange || !token) return;
        const cacheKey = `${exchange}:${token}`;
        const prev = this.priceCache.get(cacheKey) || {};
        const ltp = parseFloat(msg.lp ?? prev.ltp ?? 0);
        const open = parseFloat(msg.o ?? prev.open ?? ltp);
        const high = parseFloat(msg.h ?? prev.high ?? ltp);
        const low = parseFloat(msg.l ?? prev.low ?? ltp);
        const prevClose = parseFloat(msg.c ?? prev.prevClose ?? ltp);
        const volume = parseInt(msg.v ?? prev.volume ?? 0);

        const existingMeta = this.tokenToMeta.get(cacheKey);
        if (msg.ts && !existingMeta) {
          const m = { token, exchange, symbol: msg.ts, name: msg.ts.replace(/-EQ$/i, '') };
          this.tokenToMeta.set(cacheKey, m);
          this.metaMap.set(msg.ts, m);
          this.symbolToToken.set(msg.ts, token);
        }
        const meta = existingMeta || this.tokenToMeta.get(cacheKey) || {};
        const priceObj = {
          ltp: +ltp.toFixed(2), open: +open.toFixed(2),
          high: +Math.max(high, ltp).toFixed(2), low: +Math.min(low, ltp).toFixed(2),
          prevClose: +prevClose.toFixed(2), volume,
          change: +(ltp - prevClose).toFixed(2),
          changePct: +(prevClose > 0 ? (ltp - prevClose) / prevClose * 100 : 0).toFixed(2),
          timestamp: Date.now(), marketState: 'Open', isSimulated: false
        };
        const aliceSym = meta.symbol || msg.ts;
        if (aliceSym) this._savePrice(aliceSym, priceObj);
      }
    } catch (err) {
      console.error('_onABMsg error:', err);
    }
  }

  _sendABSub(wsKeys) {
    try { // [TRY/CATCH ADDED]
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
      for (let i = 0; i < wsKeys.length; i += 50)
        this.ws.send(JSON.stringify({ k: wsKeys.slice(i, i + 50).join('#'), t: 't' }));
    } catch (err) {
      console.error('_sendABSub error:', err);
    }
  }

  subscribe(instruments) {
    try { // [TRY/CATCH ADDED]
      if (!instruments?.length) return;
      instruments.forEach(inst => {
        const cacheKey = `${inst.exchange}:${inst.token}`;
        const wsKey = `${inst.exchange}|${inst.token}`;
        this.tokenToMeta.set(cacheKey, inst);
        this.metaMap.set(inst.symbol, inst);
        this.symbolToToken.set(inst.symbol, inst.token);
        if (!this.subscribedKeys.has(wsKey)) {
          this.subscribedKeys.add(wsKey);
          if (this.abAuthed && this.ws?.readyState === WebSocket.OPEN)
            this._sendABSub([wsKey]);
          else
            this.pendingSubs.add(wsKey);
        }
      });
    } catch (err) {
      console.error('subscribe error:', err);
    }
  }

  // ══════════════════════════════════════════════════════════════
  // PRICE GETTERS
  // ══════════════════════════════════════════════════════════════
  getBySymbol(exchange, symbol) {
    try { // [TRY/CATCH ADDED]
      return this.priceCache.get(symbol) ||
        this.priceCache.get(symbol + '-EQ') ||
        this.priceCache.get(`${exchange}:${this.symbolToToken.get(symbol)}`);
    } catch (err) {
      console.error('getBySymbol error:', err);
      return null;
    }
  }

  getByToken(exchange, token) {
    try { // [TRY/CATCH ADDED]
      const sym = this.tokenToMeta.get(`${exchange}:${token}`)?.symbol;
      return sym ? this.priceCache.get(sym) : null;
    } catch (err) {
      console.error('getByToken error:', err);
      return null;
    }
  }

  getAllPrices() {
    try { // [TRY/CATCH ADDED]
      const out = {};
      this.priceCache.forEach((price, key) => {
        if (price.symbol && key === price.symbol) out[key] = price;
      });
      return out;
    } catch (err) {
      console.error('getAllPrices error:', err);
      return {};
    }
  }

  isRealTime() { return this.abAuthed; }
  hasNetwork() { return this.hasInternet; }
  isSimulating() { return !this.hasInternet && !this.abAuthed; }

  generateCandleData(symbol, exchange = 'NSE', intervalLabel = '1min', count = 60) {
    try { // [TRY/CATCH ADDED]
      const price = this.getBySymbol(exchange, symbol) || this.priceCache.get(symbol);
      const ltp = price?.ltp || 1000;
      const opn = price?.open || ltp * 0.99;
      const hi = price?.high || ltp * 1.005;
      const lo = price?.low || ltp * 0.995;
      const vol = price?.volume || 5000000;
      const ms = intervalLabel === '5min' ? 300000 : intervalLabel === '1hour' ? 3600000 : 60000;
      const now = Date.now();
      const out = [];
      let p = opn;

      for (let i = count; i >= 0; i--) {
        const progress = (count - i) / count;
        const trend = (ltp - opn) * progress;
        const noise = (Math.random() - 0.48) * ltp * 0.005;
        const o = p;
        const c = Math.max(opn + trend + noise, 0.01);
        const h = Math.min(Math.max(o, c) * (1 + Math.random() * 0.003), hi + ltp * 0.002);
        const l = Math.max(Math.min(o, c) * (1 - Math.random() * 0.003), lo - ltp * 0.002);
        out.push({
          time: now - i * ms, open: +o.toFixed(2), high: +h.toFixed(2),
          low: +l.toFixed(2), close: +c.toFixed(2),
          volume: Math.floor(vol / count * (0.5 + Math.random())), isGreen: c >= o
        });
        p = c;
      }
      if (out.length) {
        out[out.length - 1].close = +ltp.toFixed(2);
        out[out.length - 1].high = +Math.max(out[out.length - 1].high, ltp).toFixed(2);
        out[out.length - 1].low = +Math.min(out[out.length - 1].low, ltp).toFixed(2);
        out[out.length - 1].isGreen = ltp >= out[out.length - 1].open;
      }
      return out;
    } catch (err) {
      console.error('generateCandleData error:', err);
      return [];
    }
  }

  _sha256(str) { return crypto.createHash('sha256').update(str).digest('hex'); }
}

// Wrap the entire module export in a try-catch to catch any initialization errors
let livePriceInstance;
try { // [TRY/CATCH ADDED]
  livePriceInstance = new LivePriceService();
} catch (err) {
  console.error('FATAL: Could not initialize LivePriceService:', err);
  // Provide a dummy instance with no-op methods to prevent crashes
  livePriceInstance = new EventEmitter();
  livePriceInstance.priceCache = new Map();
  livePriceInstance.symbolToToken = new Map();
  livePriceInstance.getBySymbol = () => null;
  livePriceInstance.getByToken = () => null;
  livePriceInstance.getAllPrices = () => ({});
  livePriceInstance.startYahooPolling = () => console.warn('LivePriceService unavailable');
  livePriceInstance.stopYahooPolling = () => { };
  livePriceInstance.startReal = () => { };
  livePriceInstance.subscribe = () => { };
  livePriceInstance.generateCandleData = () => [];
  livePriceInstance.isRealTime = () => false;
  livePriceInstance.hasNetwork = () => false;
  livePriceInstance.isSimulating = () => true;
}
module.exports = livePriceInstance;