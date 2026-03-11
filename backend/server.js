
const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
require('dotenv').config();
const cookieParser = require("cookie-parser");



const { loadContracts } = require("./controllers/contractMaster");

const routes = require('./routes/index');
const livePriceService = require('./services/websocketService');
const scripMaster = require('./services/scripMasterService');

const app = express();
app.set("trust proxy", 1);
const server = http.createServer(app);
app.use(cookieParser());
try {
  app.use(cors({
    origin: [process.env.FRONTEND_URL, 'http://localhost:3000', "https://algotrading-fv76.onrender.com", "https://mytrading.sfroadways.com"],
    credentials: true
  }));

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use('/api', routes);
} catch (error) {
  console.error("Middleware setup error:", error.message);
}

app.get('/health', (req, res) => {
  try {
    res.json({
      status: 'ok',
      internet: livePriceService.hasNetwork(),
      priceSource: livePriceService.isRealTime()
        ? 'AliceBlue WS'
        : livePriceService.hasNetwork()
          ? 'Yahoo Finance'
          : 'Simulation',
      instruments: scripMaster.getStats(),
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

const wss = new WebSocket.Server({ server, path: '/ws' });
const browsers = new Set();

const getSourceInfo = () => {
  try {
    if (livePriceService.isRealTime())
      return { source: 'AliceBlue WebSocket (real-time)', badge: 'AB_LIVE' };

    if (livePriceService.hasNetwork())
      return { source: 'Yahoo Finance NSE (live data)', badge: 'YAHOO' };

    return { source: 'Simulation (server has no internet)', badge: 'SIM' };

  } catch (error) {
    console.error("Source Info Error:", error.message);
    return { source: "UNKNOWN", badge: "ERR" };
  }
};

wss.on('connection', ws => {
  try {
    browsers.add(ws);

    ws.send(JSON.stringify({
      type: 'INITIAL_PRICES',
      ...getSourceInfo(),
      data: livePriceService.getAllPrices()
    }));

    ws.on('message', raw => {
      try {
        const msg = JSON.parse(raw);

        if (msg.type === 'SUBSCRIBE') {
          ws.subscribedSymbols = new Set(msg.symbols || []);
        }

      } catch (err) {
        console.error("WS message parse error:", err.message);
      }
    });

    ws.on('close', () => browsers.delete(ws));
    ws.on('error', () => browsers.delete(ws));

  } catch (error) {
    console.error("WebSocket connection error:", error.message);
  }
});

livePriceService.on('price_update', ({ symbol, exchange, token, name, data }) => {
  try {
    if (!symbol) return;

    const payload = JSON.stringify({
      type: 'PRICE_UPDATE',
      symbol,
      exchange,
      token,
      name,
      data
    });

    browsers.forEach(client => {
      try {
        if (client.readyState !== WebSocket.OPEN) return;
        if (client.subscribedSymbols?.size && !client.subscribedSymbols.has(symbol)) return;

        client.send(payload);

      } catch (err) {
        console.error("WS send error:", err.message);
      }
    });

  } catch (error) {
    console.error("Price update error:", error.message);
  }
});

app.use((err, req, res, next) => {
  console.error("Global Error:", err.message);
  res.status(500).json({
    success: false,
    message: err.message
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, async () => {
  try {

    console.log(`
╔══════════════════════════════════════════════════╗
║  AliceTrade Backend  →  http://localhost:${PORT}
║  WebSocket          →  ws://localhost:${PORT}/ws
╚══════════════════════════════════════════════════╝
`);

    await loadContracts();

    await scripMaster.init();

  } catch (error) {
    console.error("Startup Error:", error.message);
  }
});

module.exports = { app, server };