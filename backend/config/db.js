// const mysql = require('mysql2/promise');
// require('dotenv').config();

// const pool = mysql.createPool({
//   host: process.env.DB_HOST || 'localhost',
//   port: process.env.DB_PORT || 3306,
//   user: process.env.DB_USER || 'root',
//   password: process.env.DB_PASSWORD || '',
//   database: process.env.DB_NAME || 'alice_trading',
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0,
//   timezone: '+05:30'
// });

// // Test connection
// pool.getConnection()
//   .then(conn => {
//     console.log('✅ MySQL Database connected successfully');
//     conn.release();
//   })
//   .catch(err => {
//     console.error('❌ Database connection error:', err.message);
//   });

// module.exports = pool;

const mysql = require("mysql2/promise");
require("dotenv").config();
const fs = require('fs');
const path = require("path");

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000,
  ssl: {
    ca: fs.readFileSync(path.join(__dirname, "ca.pem")),
    rejectUnauthorized: true
  }
});
module.exports = pool;