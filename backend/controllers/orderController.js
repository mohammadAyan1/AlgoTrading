const db = require('../config/db');
const aliceBlueService = require('../services/aliceBlueService');
const scripMaster = require('../services/scripMasterService');
const livePriceService = require('../services/websocketService');

// ─────────────────────────────────────────────────────────────────────────────
// resolveInstrumentId — Alice Blue ko NUMERIC TOKEN chahiye, sirf symbol nahi
// e.g. ADANIPORTS-EQ → "21808", CIPLA-EQ → "14309"
// EC941 error aata hai jab ye empty ho
// ─────────────────────────────────────────────────────────────────────────────
function resolveInstrumentId(tradingSymbol, exchange, providedId) {
  // 1. Already provided by frontend? Use it
  const p = String(providedId || '').trim();
  if (p !== '') return p;

  // 2. Scrip master lookup by symbol
  const exch = (exchange || 'NSE').toUpperCase();
  const inst = scripMaster.getBySymbol(exch, tradingSymbol);
  if (inst && inst.token) return String(inst.token);

  // 3. Try without -EQ suffix
  const sym2 = tradingSymbol.replace(/-EQ$/i, '');
  const inst2 = scripMaster.getBySymbol(exch, sym2);
  if (inst2 && inst2.token) return String(inst2.token);

  // 4. Live price cache
  if (livePriceService && livePriceService.symbolToToken) {
    const t = livePriceService.symbolToToken.get(tradingSymbol)
      || livePriceService.symbolToToken.get(sym2);
    if (t) return String(t);
  }

  return null;
}

async function getClientWithSession(clientId) {
  const [rows] = await db.query('SELECT * FROM clients WHERE id = ? AND is_active = 1', [clientId]);
  if (!rows.length) throw new Error('Client not found');
  if (!rows[0].user_session) throw new Error(`Client "${rows[0].name}" ka session expire ho gaya — dobara login karo`);
  return rows[0];
}


function getBrokerOrderId(result) {
  return (
    result?.result?.[0]?.brokerOrderId ||
    result?.result?.[0]?.orderNumber ||
    result?.result?.[0]?.orderNo ||
    result?.data?.[0]?.brokerOrderId ||
    result?.data?.[0]?.orderNumber ||
    null
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// REGULAR ORDERS
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/orders/:clientId/place
exports.placeOrder = async (req, res) => {
  try {
    const data = req.body;
    const instrumentId = resolveInstrumentId(data.tradingSymbol, data.exchange, data.instrumentId);
    if (!instrumentId) {
      return res.status(400).json({
        success: false,
        message: `instrumentId nahi mila "${data.tradingSymbol}" ke liye (${data.exchange}). Search dropdown se symbol choose karo.`
      });
    }
    const payload = { ...data, instrumentId };
    const client = await getClientWithSession(req.params.clientId);
    const result = await aliceBlueService.placeOrder(client.user_session, payload);

    await db.query(
      `INSERT INTO orders_log
       (client_id, alice_order_id, trading_symbol, exchange, transaction_type,
        order_type, product, quantity, price, status, order_source, response_data)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [client.id,
      getBrokerOrderId(result),
      payload.tradingSymbol, payload.exchange, payload.transactionType,
      payload.orderType, payload.product, payload.quantity, payload.price || 0,
      result.status === 'Ok' ? 'SUCCESS' : 'FAILED',
        'MANUAL', JSON.stringify(result)]
    ).catch(() => { }); // don't fail order if logging fails

    res.json({ success: true, data: result });
  } catch (err) {
    console.error('placeOrder error:', err.message);
    res.status(400).json({ success: false, message: err.message });
  }
};

// POST /api/orders/bulk/place
exports.placeBulkOrder = async (req, res) => {
  try {
    const { clientIds, orderData, groupName } = req.body;
    if (!clientIds?.length) return res.status(400).json({ success: false, message: 'clientIds array required' });

    const instrumentId = resolveInstrumentId(orderData.tradingSymbol, orderData.exchange, orderData.instrumentId);
    if (!instrumentId) {
      return res.status(400).json({
        success: false,
        message: `instrumentId nahi mila "${orderData.tradingSymbol}" ke liye. Search dropdown se symbol choose karo.`
      });
    }
    const payload = { ...orderData, instrumentId };

    const [grp] = await db.query(
      `INSERT INTO bulk_order_groups
       (group_name, trading_symbol, exchange, transaction_type, order_type, product, quantity, price, status)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [groupName || `Bulk-${Date.now()}`, payload.tradingSymbol, payload.exchange,
      payload.transactionType, payload.orderType, payload.product,
      payload.quantity, payload.price || 0, 'PROCESSING']
    );

    const results = await Promise.allSettled(clientIds.map(async (cid) => {
      const client = await getClientWithSession(cid);
      const result = await aliceBlueService.placeOrder(client.user_session, payload);
      const status = result.status === 'Ok' ? 'SUCCESS' : 'FAILED';
      await db.query(
        `INSERT INTO bulk_order_clients (bulk_order_id, client_id, alice_order_id, status, error_message)
         VALUES (?,?,?,?,?)`,
        [grp.insertId, cid, getBrokerOrderId(result), status, result.message || null]
      ).catch(() => { });
      return { clientId: cid, clientName: client.name, status, orderId: getBrokerOrderId(result), rawResult: result };
    }));

    const data = results.map(r => r.status === 'fulfilled' ? r.value : { status: 'FAILED', error: r.reason?.message });
    const ok = data.filter(r => r.status === 'SUCCESS').length;
    await db.query('UPDATE bulk_order_groups SET status=? WHERE id=?',
      [ok === clientIds.length ? 'COMPLETED' : ok === 0 ? 'FAILED' : 'PARTIAL', grp.insertId]);

    res.json({ success: true, message: `${ok}/${clientIds.length} orders placed`, data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// POST /api/orders/:clientId/cancel
exports.cancelOrder = async (req, res) => {
  try {
    const { orderNumber, exchangeOrderNumber } = req.body;
    if (!orderNumber) return res.status(400).json({ success: false, message: 'orderNumber required' });
    const client = await getClientWithSession(req.params.clientId);
    const result = await aliceBlueService.cancelOrder(client.user_session, { orderNumber, exchangeOrderNumber });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.getOrderBook = async (req, res) => {
  try {
    const client = await getClientWithSession(req.params.clientId);
    res.json({ success: true, data: await aliceBlueService.getOrderBook(client.user_session) });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
};

exports.getTrades = async (req, res) => {
  try {
    const client = await getClientWithSession(req.params.clientId);
    res.json({ success: true, data: await aliceBlueService.getTrades(client.user_session) });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
};

exports.getHoldings = async (req, res) => {
  try {
    const client = await getClientWithSession(req.params.clientId);
    res.json({ success: true, data: await aliceBlueService.getHoldings(client.user_session) });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
};

exports.getPositions = async (req, res) => {
  try {
    const client = await getClientWithSession(req.params.clientId);
    res.json({ success: true, data: await aliceBlueService.getPositions(client.user_session) });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
};

// ─────────────────────────────────────────────────────────────────────────────
// GTT (CONDITIONAL) ORDERS
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/orders/:clientId/gtt/place
exports.placeGTTOrder = async (req, res) => {
  try {
    const data = req.body;

    // Validate required fields
    if (!data.gttValue || Number(data.gttValue) <= 0)
      return res.status(400).json({ success: false, message: 'Trigger price (gttValue) required aur > 0 hona chahiye' });
    if (!data.price || Number(data.price) <= 0)
      return res.status(400).json({ success: false, message: 'Order price required aur > 0 hona chahiye' });
    if (!data.gttType)
      return res.status(400).json({ success: false, message: 'gttType required: LTP_B_O (buy below) ya LTP_A_O (sell above)' });

    const instrumentId = resolveInstrumentId(data.tradingSymbol, data.exchange, data.instrumentId);
    if (!instrumentId) {
      return res.status(400).json({
        success: false,
        message: `instrumentId nahi mila "${data.tradingSymbol}" ke liye. Search dropdown se symbol choose karo.`
      });
    }

    const payload = {
      tradingSymbol: data.tradingSymbol,
      exchange: data.exchange,
      transactionType: data.transactionType,
      orderType: data.orderType || 'LIMIT',
      product: data.product || 'LONGTERM',
      validity: data.validity || 'DAY',
      quantity: String(parseInt(data.quantity) || 1),
      price: Number(data.price),
      orderComplexity: data.orderComplexity || 'REGULAR',
      instrumentId,
      gttType: data.gttType || (String(data.transactionType || '').toUpperCase() === 'BUY' ? 'LTP_B_O' : 'LTP_A_O'),
      gttValue: String(Number(data.gttValue)),
    };

    const client = await getClientWithSession(req.params.clientId);
    const result = await aliceBlueService.placeGTTOrder(client.user_session, payload);




    await db.query(
      `INSERT INTO conditional_orders
       (client_id, trading_symbol, exchange, transaction_type, order_type, product,
        quantity, trigger_price, order_price, instrument_id, gtt_type, status, alice_order_id)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [client.id, payload.tradingSymbol, payload.exchange, payload.transactionType,
      payload.orderType, payload.product, payload.quantity,
      payload.gttValue, payload.price, instrumentId, payload.gttType,
      result.status === 'Ok' ? 'PLACED' : 'FAILED',
      getBrokerOrderId(result)]
    ).catch(() => { });

    res.json({ success: true, data: result });
  } catch (err) {
    console.error('placeGTTOrder error:', err.message);
    res.status(400).json({ success: false, message: err.message });
  }
};

// PUT /api/orders/:clientId/gtt/modify
exports.modifyGTTOrder = async (req, res) => {
  try {
    const data = req.body;
    if (!data.orderNumber && !data.brokerOrderId) return res.status(400).json({ success: false, message: 'orderNumber/brokerOrderId required' });

    const instrumentId = resolveInstrumentId(data.tradingSymbol, data.exchange, data.instrumentId);
    const payload = { ...data, ...(instrumentId ? { instrumentId } : {}), brokerOrderId: data.brokerOrderId || data.orderNumber };



    const client = await getClientWithSession(req.params.clientId);
    const result = await aliceBlueService.modifyGTTOrder(client.user_session, payload);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// POST /api/orders/:clientId/gtt/cancel
exports.cancelGTTOrder = async (req, res) => {
  try {
    const { orderNumber } = req.body;
    if (!orderNumber) return res.status(400).json({ success: false, message: 'orderNumber required' });
    const client = await getClientWithSession(req.params.clientId);
    const result = await aliceBlueService.cancelGTTOrder(client.user_session, { brokerOrderId: orderNumber });
    await db.query(
      "UPDATE conditional_orders SET status='CANCELLED' WHERE client_id=? AND alice_order_id=?",
      [client.id, orderNumber]
    ).catch(() => { });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// POST /api/orders/bulk/gtt
exports.placeBulkGTTOrder = async (req, res) => {
  try {
    const { clientIds, gttData } = req.body;
    if (!clientIds?.length) return res.status(400).json({ success: false, message: 'clientIds required' });

    const instrumentId = resolveInstrumentId(gttData.tradingSymbol, gttData.exchange, gttData.instrumentId);
    if (!instrumentId) {
      return res.status(400).json({
        success: false,
        message: `instrumentId nahi mila "${gttData.tradingSymbol}" ke liye. Search dropdown se symbol choose karo.`
      });
    }
    const payload = {
      tradingSymbol: gttData.tradingSymbol,
      exchange: gttData.exchange,
      transactionType: gttData.transactionType,
      orderType: gttData.orderType || 'LIMIT',
      product: gttData.product || 'LONGTERM',
      validity: gttData.validity || 'DAY',
      quantity: String(parseInt(gttData.quantity) || 1),
      price: Number(gttData.price),
      orderComplexity: gttData.orderComplexity || 'REGULAR',
      instrumentId,
      gttType: gttData.gttType,
      gttValue: String(Number(gttData.gttValue)),
    };

    const results = await Promise.allSettled(clientIds.map(async (cid) => {
      const client = await getClientWithSession(cid);
      const result = await aliceBlueService.placeGTTOrder(client.user_session, payload);
      const status = result.status === 'Ok' ? 'PLACED' : 'FAILED';
      await db.query(
        `INSERT INTO conditional_orders
         (client_id, trading_symbol, exchange, transaction_type, order_type, product,
          quantity, trigger_price, order_price, instrument_id, gtt_type, status, alice_order_id)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [cid, payload.tradingSymbol, payload.exchange, payload.transactionType,
          payload.orderType, payload.product, payload.quantity,
          payload.gttValue, payload.price, instrumentId, payload.gttType,
          status, getBrokerOrderId(result)]
      ).catch(() => { });
      return { clientId: cid, clientName: client.name, status, orderId: getBrokerOrderId(result) };
    }));

    const data = results.map(r => r.status === 'fulfilled' ? r.value : { status: 'FAILED', error: r.reason?.message });
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.getGTTOrders = async (req, res) => {
  try {
    const client = await getClientWithSession(req.params.clientId);
    res.json({ success: true, data: await aliceBlueService.getGTTOrderBook(client.user_session) });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
};

exports.getConditionalOrdersDB = async (req, res) => {
  try {
    const { clientId } = req.query;
    let q = `SELECT co.*, c.name as client_name FROM conditional_orders co
             JOIN clients c ON co.client_id = c.id`;
    const params = [];
    if (clientId) { q += ' WHERE co.client_id = ?'; params.push(clientId); }
    q += ' ORDER BY co.created_at DESC LIMIT 200';
    const [rows] = await db.query(q, params);
    res.json({ success: true, data: rows });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
};

exports.getOrdersLog = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT ol.*, c.name as client_name FROM orders_log ol
       JOIN clients c ON ol.client_id = c.id ORDER BY ol.created_at DESC LIMIT 200`
    );
    res.json({ success: true, data: rows });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
};

