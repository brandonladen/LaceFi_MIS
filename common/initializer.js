const Database = require('better-sqlite3');
const logger = require('./logger');

const db = new Database('subscriptions.db');

function initializeDatabase() {
  try {
    // Create subscribers table with router and location details
    db.exec(`
      CREATE TABLE IF NOT EXISTS subscribers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone_number TEXT NOT NULL,
        payment_code TEXT NOT NULL,
        amount INTEGER NOT NULL,
        payment_date DATETIME NOT NULL,
        subscription_end_date DATETIME NOT NULL,
        subscription_type TEXT NOT NULL,
        router_name TEXT,         -- Added to store Wi-Fi name (e.g., Lace-Fi#01)
        router_location TEXT,     -- Added to store location of the router (e.g., Victoria GHH, room 23)
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create payments table for financial tracking
    db.exec(`
      CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        payment_code TEXT NOT NULL,
        amount INTEGER NOT NULL,
        payment_date DATETIME NOT NULL,
        subscriber_id INTEGER,
        FOREIGN KEY(subscriber_id) REFERENCES subscribers(id)
      )
    `);

    // Create users table
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          role TEXT DEFAULT 'user',  
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);      

    logger.info('Database initialized successfully');
  } catch (error) {
    logger.error('Database initialization failed:', error);
    throw error;
  }
}

module.exports = {
  db,
  initializeDatabase
};
