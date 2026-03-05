/**
 * src/routes/apiRoutes.js
 * API REST — Endpoints JSON para integraciones externas
 */

const express            = require("express");
const router             = express.Router();
const DocumentRepository = require("../repositories/DocumentRepository");
const CategoryRepository = require("../repositories/CategoryRepository");
const FolderRepository   = require("../repositories/FolderRepository");

const docRepo    = new DocumentRepository();
const catRepo    = new CategoryRepository();
const folderRepo = new FolderRepository();

// ── Documentos ───────────────────────────────────────────────
router.get("/documents",         (req, res) => {
  const { q, category, folder, type } = req.query;
  const results = docRepo.search(q || "", { categoryId: category, folderId: folder, fileType: type });
  res.json({ success: true, data: results.map(d => d.toAPI()), total: results.length });
});

router.get("/documents/stats",   (req, res) => {
  res.json({ success: true, data: docRepo.getStats() });
});

router.get("/documents/:id",     (req, res) => {
  const doc = docRepo.findByIdWithRelations(req.params.id);
  if (!doc) return res.status(404).json({ success: false, error: "No encontrado" });
  res.json({ success: true, data: doc.toAPI() });
});

router.post("/documents",        (req, res) => {
  try {
    const doc = docRepo.createDocument(req.body);
    res.status(201).json({ success: true, data: doc.toAPI() });
  } catch (err) {
    res.status(422).json({ success: false, error: err.message });
  }
});

router.put("/documents/:id",     (req, res) => {
  try {
    const doc = docRepo.update(req.params.id, req.body);
    if (!doc) return res.status(404).json({ success: false, error: "No encontrado" });
    res.json({ success: true, data: doc.toAPI() });
  } catch (err) {
    res.status(422).json({ success: false, error: err.message });
  }
});

router.delete("/documents/:id",  (req, res) => {
  const ok = docRepo.delete(req.params.id);
  res.json({ success: ok });
});

router.post("/documents/:id/download", (req, res) => {
  const doc = docRepo.incrementDownload(req.params.id);
  if (!doc) return res.status(404).json({ success: false, error: "No encontrado" });
  res.json({ success: true, downloadUrl: doc.downloadUrl });
});

// ── Categorías ───────────────────────────────────────────────
router.get("/categories",        (req, res) => {
  const cats = catRepo.findAll();
  res.json({ success: true, data: cats.map(c => c.toAPI()) });
});

// ── Carpetas ─────────────────────────────────────────────────
router.get("/folders",           (req, res) => {
  const tree = folderRepo.buildTree();
  res.json({ success: true, data: tree.map(f => f.toAPI()) });
});

module.exports = router;
