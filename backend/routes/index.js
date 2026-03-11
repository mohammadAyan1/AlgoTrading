const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const orderController = require('../controllers/orderController');
const marketController = require('../controllers/marketController');
const authController = require("../controllers/authController")

const { checkAuthMiddleware } = require("../middleware/authChecker")


const marketRoutes = require("./marketRoutes");


// -- Auth --------------------

router.get("/auth", authController.checkAuth)
router.post("/login-user", authController.loginUser)

router.use("/market", marketRoutes);
// ── CLIENTS ────────────────────────────────────────────────────────────────
router.get('/clients', clientController.getAllClients);
router.get('/clients/sessions', checkAuthMiddleware, clientController.getSessionStatus);
router.get('/clients/:id', clientController.getClient);
router.post('/clients', clientController.createClient);
router.put('/clients/:id', clientController.updateClient);
router.delete('/clients/:id', clientController.deleteClient);
router.get('/clients/:id/login-url', clientController.getLoginUrl);
router.post('/clients/:id/activate-session', clientController.activateSession);
router.get('/clients/:id/profile', clientController.getClientProfile);
router.get('/clients/:id/limits', clientController.getClientLimits);

// ── REGULAR ORDERS ─────────────────────────────────────────────────────────
router.post('/orders/:clientId/place', orderController.placeOrder);
router.post('/orders/:clientId/cancel', orderController.cancelOrder);
router.get('/orders/:clientId/book', orderController.getOrderBook);
router.get('/orders/:clientId/trades', orderController.getTrades);
router.get('/orders/:clientId/holdings', orderController.getHoldings);
router.get('/orders/:clientId/positions', orderController.getPositions);

// ── GTT / CONDITIONAL ORDERS ───────────────────────────────────────────────
router.post('/orders/:clientId/gtt/place', orderController.placeGTTOrder);
router.put('/orders/:clientId/gtt/modify', orderController.modifyGTTOrder);
router.post('/orders/:clientId/gtt/cancel', orderController.cancelGTTOrder);
router.get('/orders/:clientId/gtt', orderController.getGTTOrders);

// ── BULK ORDERS ────────────────────────────────────────────────────────────
router.post('/orders/bulk/place', orderController.placeBulkOrder);
router.post('/orders/bulk/gtt', orderController.placeBulkGTTOrder);

// ── LOGS ───────────────────────────────────────────────────────────────────
router.get('/orders-log', orderController.getOrdersLog);
router.get('/conditional-orders', orderController.getConditionalOrdersDB);

// ── MARKET DATA ────────────────────────────────────────────────────────────
router.get('/market/prices', marketController.getLivePrices);
router.get('/market/price/:symbol', marketController.getSymbolPrice);
router.get('/market/candles/:symbol', marketController.getCandleData);
router.get('/market/search', marketController.searchInstruments);
router.get('/market/instruments', marketController.getAllInstruments);
router.get('/market/status', marketController.getStatus);
router.post('/market/subscribe', marketController.subscribeSymbols);
router.get('/market/watchlist', marketController.getWatchlist);
router.post('/market/watchlist', marketController.addToWatchlist);
router.delete('/market/watchlist/:id', marketController.removeFromWatchlist);
// Contract Master
router.get('/market/instruments-stats', marketController.getInstrumentsStats);
router.post('/market/reload-instruments', marketController.reloadInstruments);
// Proxy: frontend se contract master fetch karo (agar backend mein internet nahi)
router.get('/market/contract-master-url', marketController.getContractMasterUrl);
router.get('/market/contract-master', marketController.getContractMaster);

module.exports = router;
