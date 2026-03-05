/**
 * src/config/database.js
 * Configuración y conexión a la base de datos JSON
 */

const path = require("path");

const config = {
  development: {
    dbPath: path.join(__dirname, "../database/db.json"),
    encoding: "utf-8",
  },
  production: {
    dbPath: path.join(__dirname, "../database/db.json"),
    encoding: "utf-8",
  },
  test: {
    dbPath: path.join(__dirname, "../database/db.test.json"),
    encoding: "utf-8",
  },
};

const env = process.env.NODE_ENV || "development";

module.exports = config[env];
