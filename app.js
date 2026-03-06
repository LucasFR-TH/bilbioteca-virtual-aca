/**
 * app.js — Punto de entrada principal
 * Biblioteca Digital — Arquitectura MVC + Drive API
 */

require("dotenv").config();
const express        = require("express");
const expressLayouts = require("express-ejs-layouts");
const methodOverride = require("method-override");
const morgan         = require("morgan");
const path           = require("path");

// ── Rutas ────────────────────────────────────────────────────
const indexRoutes    = require("./src/routes/index");
const documentRoutes = require("./src/routes/documentRoutes");
const folderRoutes   = require("./src/routes/folderRoutes");
const categoryRoutes = require("./src/routes/categoryRoutes");
const searchRoutes   = require("./src/routes/searchRoutes");
const sectionRoutes  = require("./src/routes/sectionRoutes");
const apiRoutes      = require("./src/routes/apiRoutes");

// ── Middleware ───────────────────────────────────────────────
const errorHandler   = require("./src/middleware/errorHandler");
const notFound       = require("./src/middleware/notFound");

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Motor de vistas ──────────────────────────────────────────
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(expressLayouts);
app.set("layout", "layouts/main");

// ── Middleware global ────────────────────────────────────────
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

// ── Variables globales para vistas ───────────────────────────
app.use((req, res, next) => {
  res.locals.currentPath = req.path;
  res.locals.appName     = "Biblioteca Digital";
  next();
});

// ── Registro de rutas ────────────────────────────────────────
app.use("/",           indexRoutes);
app.use("/documents",  documentRoutes);
app.use("/folders",    folderRoutes);
app.use("/categories", categoryRoutes);
app.use("/search",     searchRoutes);
app.use("/secciones",  sectionRoutes);
app.use("/api",        apiRoutes);

// ── Manejo de errores ────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Iniciar servidor ─────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n📚 Biblioteca Digital en http://localhost:${PORT}`);
  console.log(`📂 Secciones:            http://localhost:${PORT}/secciones`);
  console.log(`🔍 Buscador:             http://localhost:${PORT}/search`);
  console.log(`   Entorno: ${process.env.NODE_ENV || "development"}\n`);
});

module.exports = app;
