/**
 * src/routes/index.js — Ruta principal (dashboard)
 */

const express = require("express");
const router  = express.Router();
const DocumentRepository = require("../repositories/DocumentRepository");
const CategoryRepository = require("../repositories/CategoryRepository");
const FolderRepository   = require("../repositories/FolderRepository");

router.get("/", async (req, res, next) => {
  try {
    const docRepo    = new DocumentRepository();
    const catRepo    = new CategoryRepository();
    const folderRepo = new FolderRepository();

    const featured   = docRepo.findFeatured().map(doc => {
      const cats = catRepo.findAll();
      doc.category = cats.find(c => c.id === doc.categoryId) || null;
      return doc;
    });
    const recent     = docRepo.findAllWithRelations()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 6);
    const categories = catRepo.findAll().map(cat => {
      cat.documents = docRepo.findByCategory(cat.id);
      return cat;
    });
    const folderTree = folderRepo.buildTree();
    const stats      = docRepo.getStats();

    res.render("index", { title: "Biblioteca Digital", featured, recent, categories, folderTree, stats });
  } catch (err) { next(err); }
});

module.exports = router;
