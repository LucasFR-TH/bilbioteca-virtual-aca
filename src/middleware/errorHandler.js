/**
 * src/middleware/errorHandler.js
 */
module.exports = (err, req, res, next) => {
  console.error("[Error]", err.stack || err.message);
  const status = err.status || 500;
  res.status(status).render("errors/500", {
    title:   "Error del servidor",
    message: process.env.NODE_ENV === "development" ? err.message : "Algo salió mal.",
    stack:   process.env.NODE_ENV === "development" ? err.stack : null,
  });
};
