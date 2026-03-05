/**
 * src/controllers/SearchController.js
 */

const DocumentRepository = require("../repositories/DocumentRepository");
const CategoryRepository = require("../repositories/CategoryRepository");
const FolderRepository   = require("../repositories/FolderRepository");

class SearchController {
  constructor() {
    this.docRepo    = new DocumentRepository();
    this.catRepo    = new CategoryRepository();
    this.folderRepo = new FolderRepository();
  }

  /** GET /search?q=...&category=...&type=... */
  search = async (req, res, next) => {
    try {
      const { q = "", category, folder, type } = req.query;

      const filters = {};
      if (category) filters.categoryId = category;
      if (folder)   filters.folderId   = folder;
      if (type)     filters.fileType   = type;

      const results    = this.docRepo.search(q, filters);
      const categories = this.catRepo.findAll();
      const folderTree = this.folderRepo.buildTree();

      res.render("search/results", {
        title:      `Búsqueda: "${q}"`,
        results,
        categories,
        folderTree,
        query:      q,
        filters:    { category, folder, type },
        totalFound: results.length,
      });
    } catch (err) { next(err); }
  };
}

// ─────────────────────────────────────────────────────────────

/**
 * src/controllers/CategoryController.js
 */

class CategoryController {
  constructor() {
    this.catRepo = new CategoryRepository();
    this.docRepo = new DocumentRepository();
  }

  /** GET /categories */
  index = async (req, res, next) => {
    try {
      const categories = this.catRepo.findAll();
      const stats      = this.docRepo.getStats();

      const enriched = categories.map(cat => {
        cat.documents = this.docRepo.findByCategory(cat.id);
        return cat;
      });

      res.render("categories/index", { title: "Categorías", categories: enriched, stats });
    } catch (err) { next(err); }
  };

  /** GET /categories/:id */
  show = async (req, res, next) => {
    try {
      const category = this.catRepo.findById(req.params.id);
      if (!category) return res.status(404).render("errors/404", { title: "Categoría no encontrada" });

      const documents = this.docRepo.findByCategory(category.id);
      documents.forEach(doc => { doc.category = category; });

      res.render("categories/show", { title: category.name, category, documents });
    } catch (err) { next(err); }
  };

  /** POST /categories */
  create = async (req, res, next) => {
    try {
      const { name, description, color, icon } = req.body;
      this.catRepo.createCategory({ name, description, color, icon });
      res.redirect("/categories");
    } catch (err) { next(err); }
  };

  /** DELETE /categories/:id */
  delete = async (req, res, next) => {
    try {
      const docs = this.docRepo.findByCategory(req.params.id);
      if (docs.length > 0) {
        return res.status(400).json({ error: "No se puede eliminar una categoría con documentos." });
      }
      this.catRepo.delete(req.params.id);
      res.redirect("/categories");
    } catch (err) { next(err); }
  };
}

module.exports = {
  SearchController:   new SearchController(),
  CategoryController: new CategoryController(),
};
