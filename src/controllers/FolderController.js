/**
 * src/controllers/FolderController.js
 */

const FolderRepository   = require("../repositories/FolderRepository");
const DocumentRepository = require("../repositories/DocumentRepository");
const CategoryRepository = require("../repositories/CategoryRepository");

class FolderController {
  constructor() {
    this.folderRepo = new FolderRepository();
    this.docRepo    = new DocumentRepository();
    this.catRepo    = new CategoryRepository();
  }

  /** GET /folders */
  index = async (req, res, next) => {
    try {
      const folderTree = this.folderRepo.buildTree();
      const stats      = this.docRepo.getStats();
      res.render("folders/index", { title: "Carpetas", folderTree, stats });
    } catch (err) { next(err); }
  };

  /** GET /folders/:id */
  show = async (req, res, next) => {
    try {
      const folder = this.folderRepo.findByIdWithRelations(req.params.id);
      if (!folder) return res.status(404).render("errors/404", { title: "Carpeta no encontrada" });

      const documents  = this.docRepo.findByFolder(folder.id);
      const categories = this.catRepo.findAll();
      const enriched   = documents.map(doc => {
        doc.category = categories.find(c => c.id === doc.categoryId) || null;
        return doc;
      });

      res.render("folders/show", { title: folder.name, folder, documents: enriched });
    } catch (err) { next(err); }
  };

  /** POST /folders */
  create = async (req, res, next) => {
    try {
      const { name, description, parentId, color, icon } = req.body;
      this.folderRepo.createFolder({ name, description, parentId: parentId || null, color: color || "#7a7068", icon: icon || "📁" });
      res.redirect("/folders");
    } catch (err) { next(err); }
  };

  /** PUT /folders/:id */
  update = async (req, res, next) => {
    try {
      const { name, description, color, icon } = req.body;
      const folder = this.folderRepo.update(req.params.id, {
        name, description, color, icon,
        slug: this.folderRepo.generateSlug(name),
      });
      if (!folder) return res.status(404).render("errors/404", { title: "Carpeta no encontrada" });
      res.redirect(`/folders/${folder.id}`);
    } catch (err) { next(err); }
  };

  /** DELETE /folders/:id */
  delete = async (req, res, next) => {
    try {
      // No eliminar si tiene documentos
      const docs = this.docRepo.findByFolder(req.params.id);
      if (docs.length > 0) {
        return res.status(400).json({ error: "No se puede eliminar una carpeta con documentos." });
      }
      this.folderRepo.delete(req.params.id);
      res.redirect("/folders");
    } catch (err) { next(err); }
  };
}

module.exports = new FolderController();
