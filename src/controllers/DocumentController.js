/**
 * src/controllers/DocumentController.js
 * Controlador de Documentos — Lógica de negocio y orquestación
 * Maneja el ciclo completo: recibir request → usar repository → renderizar view
 */

const DocumentRepository  = require("../repositories/DocumentRepository");
const CategoryRepository  = require("../repositories/CategoryRepository");
const FolderRepository    = require("../repositories/FolderRepository");
const Document            = require("../models/Document");

class DocumentController {
  constructor() {
    this.docRepo      = new DocumentRepository();
    this.catRepo      = new CategoryRepository();
    this.folderRepo   = new FolderRepository();
  }

  // ── INDEX — Listado de documentos ───────────────────────

  /**
   * GET /documents
   * Muestra el listado completo de documentos (con filtros opcionales)
   */
  index = async (req, res, next) => {
    try {
      const { category, folder, type, q } = req.query;

      const filters = {};
      if (category) filters.categoryId = category;
      if (folder)   filters.folderId   = folder;
      if (type)     filters.fileType   = type;

      const documents   = this.docRepo.search(q || "", filters);
      const categories  = this.catRepo.findAll();
      const folderTree  = this.folderRepo.buildTree();
      const stats       = this.docRepo.getStats();

      res.render("documents/index", {
        title:      "Documentos",
        documents,
        categories,
        folderTree,
        stats,
        filters:    { category, folder, type, q },
        fileTypes:  Object.keys(Document.FILE_TYPES),
      });
    } catch (err) {
      next(err);
    }
  };

  // ── SHOW — Detalle de un documento ──────────────────────

  /**
   * GET /documents/:id
   */
  show = async (req, res, next) => {
    try {
      const doc = this.docRepo.findByIdWithRelations(req.params.id);
      if (!doc) return res.status(404).render("errors/404", { title: "Documento no encontrado" });

      // Documentos relacionados de la misma categoría
      const related = this.docRepo
        .findByCategory(doc.categoryId)
        .filter(d => d.id !== doc.id)
        .slice(0, 4)
        .map(d => {
          d.category = doc.category;
          return d;
        });

      res.render("documents/show", {
        title:   doc.title,
        doc,
        related,
      });
    } catch (err) {
      next(err);
    }
  };

  // ── NEW — Formulario de creación ─────────────────────────

  /**
   * GET /documents/new
   */
  new = async (req, res, next) => {
    try {
      const categories = this.catRepo.findAll();
      const folders    = this.folderRepo.findAll();

      res.render("documents/form", {
        title:      "Nuevo Documento",
        doc:        null,
        categories,
        folders,
        fileTypes:  Object.keys(Document.FILE_TYPES),
        errors:     [],
        formAction: "/documents",
        formMethod: "POST",
      });
    } catch (err) {
      next(err);
    }
  };

  // ── CREATE — Persiste nuevo documento ────────────────────

  /**
   * POST /documents
   */
  create = async (req, res, next) => {
    try {
      const { title, description, categoryId, folderId, fileType, driveId, driveUrl, tags, featured } = req.body;

      const tagsArray = tags
        ? tags.split(",").map(t => t.trim().toLowerCase()).filter(Boolean)
        : [];

      const doc = this.docRepo.createDocument({
        title,
        description,
        categoryId,
        folderId,
        fileType,
        driveId,
        driveUrl: driveUrl || `https://drive.google.com/file/d/${driveId}/view`,
        tags:     tagsArray,
        featured: featured === "on",
      });

      res.redirect(`/documents/${doc.id}`);
    } catch (err) {
      // Si es error de validación, re-renderiza el form con errores
      if (err.message.startsWith("Validación")) {
        const categories = this.catRepo.findAll();
        const folders    = this.folderRepo.findAll();
        return res.status(422).render("documents/form", {
          title:      "Nuevo Documento",
          doc:        req.body,
          categories,
          folders,
          fileTypes:  Object.keys(Document.FILE_TYPES),
          errors:     [err.message],
          formAction: "/documents",
          formMethod: "POST",
        });
      }
      next(err);
    }
  };

  // ── EDIT — Formulario de edición ─────────────────────────

  /**
   * GET /documents/:id/edit
   */
  edit = async (req, res, next) => {
    try {
      const doc = this.docRepo.findByIdWithRelations(req.params.id);
      if (!doc) return res.status(404).render("errors/404", { title: "Documento no encontrado" });

      const categories = this.catRepo.findAll();
      const folders    = this.folderRepo.findAll();

      res.render("documents/form", {
        title:      `Editar: ${doc.title}`,
        doc,
        categories,
        folders,
        fileTypes:  Object.keys(Document.FILE_TYPES),
        errors:     [],
        formAction: `/documents/${doc.id}?_method=PUT`,
        formMethod: "POST",
      });
    } catch (err) {
      next(err);
    }
  };

  // ── UPDATE — Actualiza documento ─────────────────────────

  /**
   * PUT /documents/:id
   */
  update = async (req, res, next) => {
    try {
      const { title, description, categoryId, folderId, fileType, driveId, driveUrl, tags, featured } = req.body;

      const tagsArray = tags
        ? tags.split(",").map(t => t.trim().toLowerCase()).filter(Boolean)
        : [];

      const doc = this.docRepo.update(req.params.id, {
        title,
        description,
        categoryId,
        folderId,
        fileType,
        driveId,
        driveUrl: driveUrl || `https://drive.google.com/file/d/${driveId}/view`,
        tags:     tagsArray,
        featured: featured === "on",
        slug:     this.docRepo.generateSlug(title),
      });

      if (!doc) return res.status(404).render("errors/404", { title: "Documento no encontrado" });

      res.redirect(`/documents/${doc.id}`);
    } catch (err) {
      next(err);
    }
  };

  // ── ARCHIVE — Archiva documento ──────────────────────────

  /**
   * DELETE /documents/:id
   */
  archive = async (req, res, next) => {
    try {
      const doc = this.docRepo.archive(req.params.id);
      if (!doc) return res.status(404).json({ error: "Documento no encontrado" });
      res.redirect("/documents");
    } catch (err) {
      next(err);
    }
  };

  // ── DOWNLOAD — Registra descarga ─────────────────────────

  /**
   * GET /documents/:id/download
   * Registra la descarga y redirige al archivo en Drive
   */
  download = async (req, res, next) => {
    try {
      const doc = this.docRepo.findById(req.params.id);
      if (!doc) return res.status(404).json({ error: "Documento no encontrado" });

      this.docRepo.incrementDownload(doc.id);

      res.redirect(doc.downloadUrl);
    } catch (err) {
      next(err);
    }
  };
}

module.exports = new DocumentController();
