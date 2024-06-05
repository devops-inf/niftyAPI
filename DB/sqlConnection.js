
const mysql = require('mysql2/promise');

// Database connection setup
const dbConfig = {
  host: 'rs19.cphost.co.za',
  user: 'infini13_kabelo',
  password: 'OjD%52FeXP?@',
  database: 'infini13_infini13_niftydb',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Create a connection pool
const pool = mysql.createPool(dbConfig);

module.exports = pool;





