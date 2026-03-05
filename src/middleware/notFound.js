/**
 * src/middleware/notFound.js
 */
module.exports = (req, res) => {
  res.status(404).render("errors/404", { title: "Página no encontrada" });
};
