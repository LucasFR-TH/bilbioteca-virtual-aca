/**
 * app.js — Punto de entrada principal
 * Biblioteca Digital — Arquitectura MVC
 */

require("dotenv").config();
const express       = require("express");
const expressLayouts = require("express-ejs-layouts");
const methodOverride = require("method-override");
const morgan        = require("morgan");
const path          = require("path");

// ── Rutas ────────────────────────────────────────────────────
const indexRoutes    = require("./src/routes/index");
const documentRoutes = require("./src/routes/documentRoutes");
const folderRoutes   = require("./src/routes/folderRoutes");
const categoryRoutes = require("./src/routes/categoryRoutes");
const searchRoutes   = require("./src/routes/searchRoutes");
const apiRoutes      = require("./src/routes/apiRoutes");

// ── Middleware ───────────────────────────────────────────────
const errorHandler   = require("./src/middleware/errorHandler");
const notFound       = require("./src/middleware/notFound");

const app = express();
const PORT = process.env.PORT || 3000;

// ── Configuración de Motor de Vistas ────────────────────────
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(expressLayouts);
app.set("layout", "layouts/main");

// ── Middleware Global ────────────────────────────────────────
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

// ── Variables Globales para Vistas ───────────────────────────
app.use((req, res, next) => {
  res.locals.currentPath = req.path;
  res.locals.appName     = "Biblioteca Digital";
  next();
});

// ── Registro de Rutas ────────────────────────────────────────
app.use("/",              indexRoutes);
app.use("/documents",     documentRoutes);
app.use("/folders",       folderRoutes);
app.use("/categories",    categoryRoutes);
app.use("/search",        searchRoutes);
app.use("/api",           apiRoutes);

// ── Manejo de Errores ────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Iniciar Servidor ─────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n📚 Biblioteca Digital corriendo en http://localhost:${PORT}`);
  console.log(`   Entorno: ${process.env.NODE_ENV || "development"}\n`);
});

module.exports = app;
