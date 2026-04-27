// ============================================================
// db.js  -  Projnet shared MySQL connection pool
// ============================================================
// Lives at WebSite/db.js so that every controller can reach it
// with a single-level relative path:  require("../db")
//
// Uses mysql2's promise interface so controllers can use
// async/await without any extra wrapping.
//
// The pool is created once and reused for the lifetime of
// the process (Singleton pattern). A startup probe confirms
// the database is reachable before the server begins accepting
// traffic; if it fails the process exits immediately with a
// clear error rather than silently accepting requests that
// will all crash.
// ============================================================

require("dotenv").config();
const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host:             process.env.DB_HOST     || "localhost",
  port:             parseInt(process.env.DB_PORT, 10) || 3306,
  user:             process.env.DB_USER     || "root",
  password:         process.env.DB_PASSWORD || "",
  database:         process.env.DB_NAME     || "projnet",
  waitForConnections: true,
  connectionLimit:  10,
  queueLimit:       0,
});

// Probe the connection once at startup.
pool.getConnection()
  .then((conn) => {
    console.log("[DB] Connected to MySQL successfully.");
    conn.release();
  })
  .catch((err) => {
    console.error("[DB] Connection failed:", err.message);
    console.error("[DB] Check your .env file and confirm MySQL is running.");
    process.exit(1);
  });

module.exports = pool;
