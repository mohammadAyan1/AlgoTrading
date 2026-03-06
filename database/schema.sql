-- Alice Blue Multi-Client Trading Platform Database Schema
CREATE DATABASE IF NOT EXISTS alice_trading;
USE alice_trading;

-- Clients Table: Store multiple broker client credentials
CREATE TABLE IF NOT EXISTS clients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  user_id VARCHAR(50) NOT NULL UNIQUE,
  app_code VARCHAR(100) NOT NULL,
  api_secret VARCHAR(255) NOT NULL,
  user_session VARCHAR(2000) DEFAULT NULL,
  session_expires_at DATETIME DEFAULT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Conditional Orders Table: Store GTT/conditional order rules
CREATE TABLE IF NOT EXISTS conditional_orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT NOT NULL,
  trading_symbol VARCHAR(100) NOT NULL,
  exchange VARCHAR(20) NOT NULL,
  transaction_type ENUM('BUY', 'SELL') NOT NULL,
  order_type VARCHAR(20) NOT NULL DEFAULT 'LIMIT',
  product VARCHAR(30) NOT NULL DEFAULT 'LONGTERM',
  quantity INT NOT NULL,
  trigger_price DECIMAL(12,2) NOT NULL,
  order_price DECIMAL(12,2) NOT NULL,
  instrument_id VARCHAR(50),
  gtt_type VARCHAR(20) DEFAULT 'LTP_B_O',
  status ENUM('PENDING', 'PLACED', 'TRIGGERED', 'CANCELLED', 'FAILED') DEFAULT 'PENDING',
  alice_order_id VARCHAR(100) DEFAULT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- Orders Log Table: Track all placed orders
CREATE TABLE IF NOT EXISTS orders_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT NOT NULL,
  alice_order_id VARCHAR(100),
  trading_symbol VARCHAR(100) NOT NULL,
  exchange VARCHAR(20) NOT NULL,
  transaction_type ENUM('BUY', 'SELL') NOT NULL,
  order_type VARCHAR(20) NOT NULL,
  product VARCHAR(30) NOT NULL,
  quantity INT NOT NULL,
  price DECIMAL(12,2),
  status VARCHAR(50),
  order_source ENUM('MANUAL', 'CONDITIONAL', 'BULK') DEFAULT 'MANUAL',
  response_data JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- Watchlist Table
CREATE TABLE IF NOT EXISTS watchlist (
  id INT AUTO_INCREMENT PRIMARY KEY,
  trading_symbol VARCHAR(100) NOT NULL,
  exchange VARCHAR(20) NOT NULL,
  instrument_id VARCHAR(50),
  display_name VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_symbol (trading_symbol, exchange)
);

-- Bulk Order Groups: Place same order for multiple clients at once
CREATE TABLE IF NOT EXISTS bulk_order_groups (
  id INT AUTO_INCREMENT PRIMARY KEY,
  group_name VARCHAR(100),
  trading_symbol VARCHAR(100) NOT NULL,
  exchange VARCHAR(20) NOT NULL,
  transaction_type ENUM('BUY', 'SELL') NOT NULL,
  order_type VARCHAR(20) NOT NULL,
  product VARCHAR(30) NOT NULL,
  quantity INT NOT NULL,
  price DECIMAL(12,2),
  status ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'PARTIAL', 'FAILED') DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bulk_order_clients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  bulk_order_id INT NOT NULL,
  client_id INT NOT NULL,
  alice_order_id VARCHAR(100),
  status ENUM('PENDING', 'SUCCESS', 'FAILED') DEFAULT 'PENDING',
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (bulk_order_id) REFERENCES bulk_order_groups(id) ON DELETE CASCADE,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- Insert some sample watchlist items
INSERT IGNORE INTO watchlist (trading_symbol, exchange, display_name) VALUES
('TATAMOTORS', 'NSE', 'Tata Motors'),
('RELIANCE', 'NSE', 'Reliance Industries'),
('INFY', 'NSE', 'Infosys'),
('TCS', 'NSE', 'TCS'),
('HDFCBANK', 'NSE', 'HDFC Bank'),
('SBIN', 'NSE', 'State Bank of India'),
('BAJFINANCE', 'NSE', 'Bajaj Finance'),
('WIPRO', 'NSE', 'Wipro');
