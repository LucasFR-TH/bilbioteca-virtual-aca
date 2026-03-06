/**
 * src/controllers/SectionController.js
 *
 * Maneja:
 *   GET /secciones                → lista las 8 secciones
 *   GET /secciones/:id            → contenido raíz de la sección (subcarpetas + archivos)
 *   GET /secciones/:id/:folderId  → contenido de una subcarpeta
 */

const driveService              = require("../services/DriveService");
const { SECTIONS, getSectionById } = require("../config/sections");

class SectionController {

  // ── INDEX — Grilla de secciones ──────────────────────────

  index = async (req, res, next) => {
    try {
      res.render("sections/index", {
        title:    "Secciones",
        sections: SECTIONS,
      });
    } catch (err) { next(err); }
  };

  // ── SHOW — Contenido raíz de una sección ─────────────────

  show = async (req, res, next) => {
    try {
      const section = getSectionById(req.params.id);
      if (!section) return res.status(404).render("errors/404", { title: "Sección no encontrada" });

      // Si el folderId aún no está configurado
      if (!section.folderId || section.folderId === "FOLDER_ID_AQUI") {
        return res.render("sections/show", {
          title:     section.label,
          section,
          subfolders: [],
          documents:  [],
          breadcrumb: [{ label: section.label, url: null }],
          notConfigured: true,
        });
      }

      const files     = await driveService.listFiles(section.folderId);
      const subfolders = files.filter(f => f.isFolder);
      const documents  = files.filter(f => !f.isFolder);

      res.render("sections/show", {
        title:     section.label,
        section,
        subfolders,
        documents,
        breadcrumb: [{ label: section.label, url: null }],
        notConfigured: false,
        currentFolderId: section.folderId,
      });
    } catch (err) { next(err); }
  };

  // ── SUBFOLDER — Contenido de una subcarpeta ───────────────

  subfolder = async (req, res, next) => {
    try {
      const section = getSectionById(req.params.id);
      if (!section) return res.status(404).render("errors/404", { title: "Sección no encontrada" });

      const { folderId } = req.params;

      // Obtener nombre de la carpeta actual
      let folderName = req.query.name || "Subcarpeta";

      const files      = await driveService.listFiles(folderId);
      const subfolders  = files.filter(f => f.isFolder);
      const documents   = files.filter(f => !f.isFolder);

      // Breadcrumb simple: Sección → Carpeta actual
      const breadcrumb = [
        { label: section.label,  url: `/secciones/${section.id}` },
        { label: folderName,     url: null },
      ];

      res.render("sections/show", {
        title:     `${folderName} — ${section.label}`,
        section,
        subfolders,
        documents,
        breadcrumb,
        notConfigured: false,
        currentFolderId: folderId,
      });
    } catch (err) { next(err); }
  };

  // ── REFRESH CACHE — Invalida caché de una sección ─────────

  refreshCache = async (req, res, next) => {
    try {
      const section = getSectionById(req.params.id);
      if (!section) return res.status(404).json({ error: "Sección no encontrada" });

      driveService.clearCache(section.folderId);
      res.json({ success: true, message: `Caché de "${section.label}" invalidada` });
    } catch (err) { next(err); }
  };
}

module.exports = new SectionController();
