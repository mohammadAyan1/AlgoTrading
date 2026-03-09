import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';

const WSContext = createContext(null);

export function WSProvider({ children }) {
  const [prices, setPrices] = useState({});
  const [connected, setConnected] = useState(false);
  const [priceMode, setPriceMode] = useState('connecting'); // 'ab_live' | 'yahoo' | 'sim' | 'connecting'
  const [source, setSource] = useState('Connecting…');
  const wsRef = useRef(null);
  const reconnectRef = useRef(null);

  const connect = useCallback(() => {
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const host = window.location.protocol === "https:" ? "algotrading-backend-wfn4.onrender.com" : window.location.hostname + ":5000";

    // const host = window.location.hostname;
    const url = `${protocol}://${host}/ws`;
    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => { setConnected(true); clearTimeout(reconnectRef.current); };

      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data);

          if (msg.type === 'INITIAL_PRICES') {
            setPrices(msg.data || {});
            setSource(msg.source || '');
            if (msg.badge === 'AB_LIVE') setPriceMode('ab_live');
            else if (msg.badge === 'YAHOO') setPriceMode('yahoo');
            else setPriceMode('sim');
          }

          else if (msg.type === 'PRICE_UPDATE') {
            setPrices(prev => ({
              ...prev,
              [msg.symbol]: {
                ...prev[msg.symbol],
                ...msg.data,
                symbol: msg.symbol,
                name: msg.name || prev[msg.symbol]?.name || msg.symbol,
                exchange: msg.exchange || prev[msg.symbol]?.exchange || 'NSE',
                token: msg.token || prev[msg.symbol]?.token || '',
                isSimulated: msg.data?.isSimulated ?? prev[msg.symbol]?.isSimulated,
              }
            }));
          }
        } catch (e) { }
      };

      ws.onclose = () => { setConnected(false); reconnectRef.current = setTimeout(connect, 3000); };
      ws.onerror = () => ws.close();
    } catch (e) {
      reconnectRef.current = setTimeout(connect, 5000);
    }
  }, []);

  useEffect(() => {
    connect();
    return () => { clearTimeout(reconnectRef.current); try { wsRef.current?.close(); } catch (e) { } };
  }, [connect]);

  const getPrice = (symbol) => prices[symbol] || prices[symbol?.replace(/-EQ$/i, '')] || null;
  const subscribe = (symbols) => {
    if (wsRef.current?.readyState === WebSocket.OPEN)
      wsRef.current.send(JSON.stringify({ type: 'SUBSCRIBE', symbols }));
  };

  return (
    <WSContext.Provider value={{ prices, connected, source, priceMode, getPrice, subscribe }}>
      {children}
    </WSContext.Provider>
  );
}

export const useLivePrices = () => useContext(WSContext);
