/**
 * src/controllers/SearchController.js
 *
 * Búsqueda universal: recorre todas las secciones en Drive
 * y filtra por nombre, sección, subcarpeta y tipo de archivo.
 *
 * Query params:
 *   q         → texto libre (nombre de documento)
 *   section   → id de sección  (ej: "actividades")
 *   subfolder → nombre de subcarpeta
 *   type      → tipo de archivo (ej: "PDF", "DOCX")
 */

const driveService           = require("../services/DriveService");
const { SECTIONS }           = require("../config/sections");

const SearchController = {

  search: async (req, res, next) => {
    try {
      const { q, section, subfolder, type } = req.query;

      const hasQuery = q || section || subfolder || type;

      let results   = [];
      let allTypes  = [];
      let allFolders = [];

      if (hasQuery) {
        results = await driveService.searchAcrossSections(SECTIONS, q, {
          sectionId: section  || null,
          subfolder: subfolder || null,
          fileType:  type      || null,
        });

        // Calcular listas únicas para los filtros desplegables
        allTypes   = [...new Set(results.map(d => d.typeLabel))].sort();
        allFolders = [...new Set(results.map(d => d.folder))].sort();
      }

      res.render("search/results", {
        title:       q ? `Resultados: "${q}"` : "Buscar documentos",
        query:       q       || "",
        filterSection:   section   || "",
        filterSubfolder: subfolder || "",
        filterType:      type      || "",
        results,
        total:       results.length,
        sections:    SECTIONS,
        allTypes,
        allFolders,
        hasQuery:    !!hasQuery,
      });
    } catch (err) { next(err); }
  },
};

module.exports = { SearchController };
