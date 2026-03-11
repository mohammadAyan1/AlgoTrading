
const axios = require('axios');
const crypto = require('crypto');
require('dotenv').config();

const BASE_URL = process.env.ALICE_BASE_URL || 'https://a3.aliceblueonline.com';
const AUTH_URL = process.env.ALICE_AUTH_URL || 'https://ant.aliceblueonline.com';

class AliceBlueService {

  getLoginUrl(appCode) {
    try {
      return `${AUTH_URL}/?appcode=${appCode}`;
    } catch (error) {
      console.error("Login URL error:", error.message);
      throw error;
    }
  }

  createChecksum(userId, authCode, apiSecret) {
    try {
      return crypto
        .createHash('sha256')
        .update(userId + authCode + apiSecret)
        .digest('hex');
    } catch (error) {
      console.error("Checksum error:", error.message);
      throw error;
    }
  }

  getHeaders(userSession) {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${userSession}`
    };
  }

  formatApiError(error, fallback = 'Request failed') {
    const data = error?.response?.data;
    const message =
      data?.message ||
      data?.error ||
      data?.statusMessage ||
      error?.message ||
      fallback;
    return typeof message === 'string' ? message : JSON.stringify(message);
  }

  async getUserSession(checksum) {
    try {

      const res = await axios.post(
        `${BASE_URL}/open-api/od/v1/vendor/getUserDetails`,
        { checkSum: checksum },
        { headers: { 'Content-Type': 'application/json' } }
      );

      return res.data;

    } catch (error) {

      console.error(
        "getUserSession error:",
        error.response?.data || error.message
      );

      throw new Error("Failed to get user session");

    }
  }

  async getProfile(userSession) {
    try {

      const res = await axios.get(
        `${BASE_URL}/open-api/od/v1/profile/`,
        { headers: this.getHeaders(userSession) }
      );

      return res.data;

    } catch (error) {

      console.error(
        "getProfile error:",
        error.response?.data || error.message
      );

      throw new Error("Failed to fetch profile");

    }
  }

  async getLimits(userSession) {
    try {

      const res = await axios.get(
        `${BASE_URL}/open-api/od/v1/limits/`,
        { headers: this.getHeaders(userSession) }
      );

      return res.data;

    } catch (error) {

      console.error(
        "getLimits error:",
        error.response?.data || error.message
      );

      throw new Error("Failed to fetch limits");

    }
  }

  // ── Place Order ─────────────────────────────────────

  async placeOrder(userSession, orderData) {

    try {
      // price: Number(orderData.price || 0),

      const payload = {
        tradingSymbol: orderData.tradingSymbol,
        exchange: orderData.exchange,
        transactionType: orderData.transactionType,
        orderType: orderData.orderType || 'MARKET',
        product: orderData.product || 'INTRADAY',
        validity: orderData.validity || 'DAY',
        quantity: String(orderData.quantity),
        price: null,
        orderComplexity: orderData.orderComplexity || 'REGULAR',
        instrumentId: String(orderData.instrumentId)
      };

      console.log(payload, "Order payload");

      const res = await axios.post(
        `${BASE_URL}/open-api/od/v1/orders/placeorder`,
        [payload],
        { headers: this.getHeaders(userSession) }
      );

      return res.data;

    } catch (error) {

      console.error(
        "placeOrder error:",
        error.response?.data || error.message
      );

      throw new Error(this.formatApiError(error, "Failed to place order"));

    }
  }

  async modifyOrder(userSession, orderData) {
    try {

      const res = await axios.post(
        `${BASE_URL}/open-api/od/v1/orders/modify`,
        orderData,
        { headers: this.getHeaders(userSession) }
      );

      return res.data;

    } catch (error) {

      console.error(
        "modifyOrder error:",
        error.response?.data || error.message
      );

      throw new Error(this.formatApiError(error, "Failed to modify order"));

    }
  }

  async cancelOrder(userSession, orderData) {
    try {

      const res = await axios.post(
        `${BASE_URL}/open-api/od/v1/orders/cancel`,
        orderData,
        { headers: this.getHeaders(userSession) }
      );

      return res.data;

    } catch (error) {

      console.error(
        "cancelOrder error:",
        error.response?.data || error.message
      );

      throw new Error(this.formatApiError(error, "Failed to cancel order"));

    }
  }

  async getOrderBook(userSession) {
    try {

      const res = await axios.get(
        `${BASE_URL}/open-api/od/v1/orders/book`,
        { headers: this.getHeaders(userSession) }
      );

      return res.data;

    } catch (error) {

      console.error(
        "getOrderBook error:",
        error.response?.data || error.message
      );

      throw new Error("Failed to fetch order book");

    }
  }

  async getTrades(userSession) {
    try {

      const res = await axios.get(
        `${BASE_URL}/open-api/od/v1/orders/trades`,
        { headers: this.getHeaders(userSession) }
      );


      console.log(res?.data);


      return res.data;




    } catch (error) {

      console.error(
        "getTrades error:",
        error.response?.data || error.message
      );

      throw new Error("Failed to fetch trades");

    }
  }

  // ── GTT Orders ─────────────────────────────────────

  async placeGTTOrder(userSession, gttData) {
    try {

      const payload = {
        tradingSymbol: gttData.tradingSymbol,
        exchange: gttData.exchange,
        transactionType: gttData.transactionType,
        orderType: gttData.orderType || 'LIMIT',
        product: gttData.product || 'LONGTERM',
        validity: gttData.validity || 'DAY',
        quantity: String(gttData.quantity),
        price: Number(gttData.price),
        orderComplexity: gttData.orderComplexity || 'REGULAR',
        instrumentId: String(gttData.instrumentId),
        gttType: gttData.gttType,
        gttValue: String(gttData.gttValue)
      };

      try {
        const res = await axios.post(
          `${BASE_URL}/open-api/od/v1/orders/gtt/place`,
          payload,
          { headers: this.getHeaders(userSession) }
        );
        return res.data;
      } catch (primaryError) {
        // Backward compatibility: some Alice Blue environments still expose /gtt/execute.
        const fallbackRes = await axios.post(
          `${BASE_URL}/open-api/od/v1/orders/gtt/execute`,
          payload,
          { headers: this.getHeaders(userSession) }
        );
        return fallbackRes.data;
      }

    } catch (error) {

      console.error(
        "placeGTTOrder error:",
        error.response?.data || error.message
      );

      throw new Error(this.formatApiError(error, "Failed to place GTT order"));

    }
  }

  async modifyGTTOrder(userSession, gttData) {
    try {

      const payloadData = {
        tradingSymbol: gttData.tradingSymbol,
        exchange: gttData.exchange,
        orderType: gttData.orderType || 'LIMIT',
        product: gttData.product || 'LONGTERM',
        validity: gttData.validity || 'DAY',
        quantity: String(gttData.quantity),
        price: Number(gttData.price),
        orderComplexity: gttData.orderComplexity || 'REGULAR',
        instrumentId: String(gttData.instrumentId),
        gttType: gttData.gttType,
        gttValue: String(gttData.gttValue),
        brokerOrderId: gttData.brokerOrderId || gttData.orderNumber
      };

      const res = await axios.post(
        `${BASE_URL}/open-api/od/v1/orders/gtt/modify`,
        payloadData,
        { headers: this.getHeaders(userSession) }
      );

      return res.data;

    } catch (error) {

      console.error(
        "modifyGTTOrder error:",
        error.response?.data || error.message
      );

      throw new Error(this.formatApiError(error, "Failed to modify GTT order"));

    }
  }

  async cancelGTTOrder(userSession, orderData) {
    try {

      const res = await axios.post(
        `${BASE_URL}/open-api/od/v1/orders/gtt/cancel`,
        orderData,
        { headers: this.getHeaders(userSession) }
      );

      return res.data;

    } catch (error) {

      console.error(
        "cancelGTTOrder error:",
        error.response?.data || error.message
      );

      throw new Error(this.formatApiError(error, "Failed to cancel GTT order"));

    }
  }

  async getGTTOrderBook(userSession) {
    try {

      const res = await axios.get(
        `${BASE_URL}/open-api/od/v1/orders/gtt/orderbook`,
        { headers: this.getHeaders(userSession) }
      );

      return res.data;

    } catch (error) {

      console.error(
        "getGTTOrderBook error:",
        error.response?.data || error.message
      );

      throw new Error("Failed to fetch GTT orders");

    }
  }

  // ── Portfolio ─────────────────────────────────────

  async getHoldings(userSession) {
    try {

      const res = await axios.get(
        `${BASE_URL}/open-api/od/v1/holdings/CNC`,
        { headers: this.getHeaders(userSession) }
      );

      return res.data;

    } catch (error) {

      console.error(
        "getHoldings error:",
        error.response?.data || error.message
      );

      throw new Error("Failed to fetch holdings");

    }
  }

  async getPositions(userSession) {
    try {

      const res = await axios.get(
        `${BASE_URL}/open-api/od/v1/positions/`,
        { headers: this.getHeaders(userSession) }
      );

      return res.data;

    } catch (error) {

      console.error(
        "getPositions error:",
        error.response?.data || error.message
      );

      throw new Error("Failed to fetch positions");

    }
  }

}

module.exports = new AliceBlueService();
