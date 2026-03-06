# 🚀 AliceTrade - Alice Blue Multi-Client Trading Platform

Alice Blue API ke saath ek powerful multi-client trading platform jo aapko ek saath multiple clients ke liye stock buy/sell karne deta hai, conditional (GTT) orders set karne deta hai, aur live stock prices dekhne deta hai.

---

## ✨ Features

- **Multi-Client Management** – Multiple Alice Blue accounts ek jagah manage karo
- **Bulk Orders** – Ek hi click mein sabhi clients ke liye order place karo
- **Conditional Orders (GTT)** – Price target set karo, auto-execute hoga
  - Tata ka stock 100 pe buy karna hai? Trigger set karo, jab 100 pe aaye automatically buy ho jayega
- **Live Stock Prices** – Real-time price updates (WebSocket se)
- **Candlestick Chart** – Green/Red bar chart (professional stock market style)
- **Portfolio View** – Holdings, Positions, Order Book, Trades

---

## 🛠️ Prerequisites

1. **Node.js** (v18+) – https://nodejs.org
2. **MySQL** (v8+) – https://mysql.com
3. **Alice Blue Developer Account** – https://a3.aliceblueonline.com

---

## 📦 Installation & Setup

### Step 1: Database Setup

```sql
-- MySQL mein ye commands run karo:
CREATE DATABASE alice_trading;
```

Phir `database/schema.sql` file ko import karo:
```bash
mysql -u root -p alice_trading < database/schema.sql
```

### Step 2: Backend Setup

```bash
cd backend
npm install

# .env file edit karo:
# DB_PASSWORD=your_mysql_password set karo
# JWT_SECRET=koi_bhi_random_string

npm run dev   # Development mode
# ya
npm start     # Production mode
```

Backend `http://localhost:5000` pe chalega.

### Step 3: Frontend Setup

```bash
cd frontend
npm install
npm start
```

Frontend `http://localhost:3000` pe chalega.

---

## 🔑 Alice Blue API Setup (Per Client)

1. **Alice Blue Developer Portal** https://a3.aliceblueonline.com pe login karo
2. "Apps" section mein new app create karo
3. App Code aur API Secret copy karo
4. Platform mein "Clients" section mein client add karo (App Code + API Secret ke saath)
5. "Login" button click karo → Alice Blue login page khulega
6. Login karne ke baad URL mein `authCode` milega → use copy karo
7. Platform mein "Activate Session" mein paste karo

---

## 📋 API Reference

### Alice Blue Base URLs
- **REST API**: `https://a3.aliceblueonline.com`
- **Auth**: `https://ant.aliceblueonline.com`

### Authentication Flow
```
1. userId + authCode + apiSecret → SHA-256 → checksum
2. POST /open-api/od/v1/vendor/getUserDetails { checkSum }
3. Response: { userSession } → use as Bearer token
```

### Key APIs Used

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/open-api/od/v1/vendor/getUserDetails` | Get session |
| POST | `/open-api/od/v1/orders/placeorder` | Place order |
| GET | `/open-api/od/v1/orders/book` | Order book |
| POST | `/open-api/od/v1/orders/gtt/execute` | GTT order |
| GET | `/open-api/od/v1/orders/gtt/orderbook` | GTT order book |
| GET | `/open-api/od/v1/holdings/CNC` | Holdings |
| GET | `/open-api/od/v1/positions` | Positions |
| GET | `/open-api/od/v1/limits/` | Funds & limits |
| GET | `/open-api/od/v1/profile/` | User profile |

---

## 🎯 GTT Order Types

| GTT Type | Matlab | Use Case |
|----------|--------|----------|
| `LTP_B_O` | LTP Below Order | BUY jab price NEECHE aaye (dip pe khareedna) |
| `LTP_A_O` | LTP Above Order | SELL jab price UPAR jaye (profit pe bechna) |

**Example**: Tata Motors 850 pe buy karna hai, abhi 870 chal raha hai:
- Symbol: TATAMOTORS
- Transaction: BUY
- Trigger Price (gttValue): 850
- Order Price (price): 852
- GTT Type: LTP_B_O (buy when below 850)

---

## 📁 Project Structure

```
alice-trading-platform/
├── backend/
│   ├── server.js              # Main server + WebSocket
│   ├── config/db.js           # MySQL connection
│   ├── routes/index.js        # All API routes
│   ├── controllers/
│   │   ├── clientController.js  # Client management
│   │   ├── orderController.js   # Orders + GTT + Bulk
│   │   └── marketController.js  # Live prices
│   └── services/
│       ├── aliceBlueService.js  # Alice Blue API wrapper
│       └── websocketService.js  # Live price streaming
├── frontend/
│   └── src/
│       ├── App.jsx              # Main layout
│       ├── components/
│       │   ├── ClientManager.jsx    # Add/manage clients
│       │   ├── OrderPanel.jsx       # Place orders
│       │   ├── ConditionalOrders.jsx # GTT orders
│       │   ├── CandlestickChart.jsx  # Price chart
│       │   ├── LivePriceTicker.jsx   # Market watch
│       │   └── Portfolio.jsx         # Holdings/positions
│       └── context/WSContext.jsx    # WebSocket prices
└── database/schema.sql         # MySQL tables
```

---

## ⚠️ Important Notes

1. **Session Expiry**: Alice Blue session ~24 ghante mein expire hoti hai, dobara login karna padega
2. **Rate Limits**: 1800 requests per 15 minutes (orders unlimited)
3. **Demo Mode**: Jab real WebSocket available nahi, prices simulate hote hain
4. **GTT Orders**: Ye server-side trigger hote hain, platform band hone ke baad bhi kaam karte hain

---

## 🔒 Security

- API secrets encrypted nahi hain by default - production mein encryption add karo
- `.env` file ko git mein share mat karo
- JWT secret strong rakho

---

## 📞 Support

Alice Blue API Documentation: https://ant.aliceblueonline.com/productdocumentation/
