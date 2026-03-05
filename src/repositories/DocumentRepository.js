/**
 * src/repositories/DocumentRepository.js
 * Repositorio de Documentos — Consultas específicas del dominio
 */

const BaseRepository    = require("./BaseRepository");
const Document          = require("../models/Document");
const CategoryRepository = require("./CategoryRepository");
const FolderRepository  = require("./FolderRepository");

class DocumentRepository extends BaseRepository {
  constructor() {
    super("documents", Document);
  }

  // ── Consultas con populate ───────────────────────────────

  /**
   * Obtiene todos los documentos con categoría y carpeta incluidos
   * @returns {Document[]}
   */
  findAllWithRelations() {
    const documents  = this.findAll();
    const catRepo    = new CategoryRepository();
    const folderRepo = new FolderRepository();

    return documents.map(doc => {
      doc.category = catRepo.findById(doc.categoryId);
      doc.folder   = folderRepo.findById(doc.folderId);
      return doc;
    });
  }

  /**
   * Obtiene un documento por ID con relaciones
   * @param {string} id
   * @returns {Document|null}
   */
  findByIdWithRelations(id) {
    const doc = this.findById(id);
    if (!doc) return null;

    const catRepo    = new CategoryRepository();
    const folderRepo = new FolderRepository();
    doc.category = catRepo.findById(doc.categoryId);
    doc.folder   = folderRepo.findById(doc.folderId);
    return doc;
  }

  /**
   * Obtiene un documento por slug con relaciones
   * @param {string} slug
   * @returns {Document|null}
   */
  findBySlugWithRelations(slug) {
    const doc = this.findBySlug(slug);
    if (!doc) return null;
    return this.findByIdWithRelations(doc.id);
  }

  // ── Filtros especializados ───────────────────────────────

  /**
   * Documentos activos (sin archivar)
   * @returns {Document[]}
   */
  findActive() {
    return this.findWhere(d => d.status === Document.STATUS.ACTIVE);
  }

  /**
   * Documentos por categoría
   * @param {string} categoryId
   * @returns {Document[]}
   */
  findByCategory(categoryId) {
    return this.findWhere(d => d.categoryId === categoryId && d.status === Document.STATUS.ACTIVE);
  }

  /**
   * Documentos por carpeta
   * @param {string} folderId
   * @returns {Document[]}
   */
  findByFolder(folderId) {
    return this.findWhere(d => d.folderId === folderId && d.status === Document.STATUS.ACTIVE);
  }

  /**
   * Documentos destacados
   * @returns {Document[]}
   */
  findFeatured() {
    return this.findWhere(d => d.featured === true && d.status === Document.STATUS.ACTIVE);
  }

  // ── Búsqueda de texto libre ──────────────────────────────

  /**
   * Búsqueda full-text sobre título, descripción y tags
   * @param {string} query
   * @param {Object} filters — { categoryId, folderId, fileType, status }
   * @returns {Document[]}
   */
  search(query = "", filters = {}) {
    const docs = this.findAllWithRelations();

    return docs.filter(doc => {
      // Filtro de estado
      const statusFilter = filters.status || Document.STATUS.ACTIVE;
      if (doc.status !== statusFilter) return false;

      // Filtros adicionales
      if (filters.categoryId && doc.categoryId !== filters.categoryId) return false;
      if (filters.folderId   && doc.folderId   !== filters.folderId)   return false;
      if (filters.fileType   && doc.fileType   !== filters.fileType.toUpperCase()) return false;

      // Búsqueda de texto
      return doc.matchesSearch(query);
    });
  }

  // ── Operaciones de negocio ───────────────────────────────

  /**
   * Crea un documento generando slug automáticamente
   * @param {Object} data
   * @returns {Document}
   */
  createDocument(data) {
    const slug = this.generateSlug(data.title);
    return this.create({ ...data, slug, downloadCount: 0, status: Document.STATUS.ACTIVE });
  }

  /**
   * Incrementa el contador de descargas
   * @param {string} id
   * @returns {Document|null}
   */
  incrementDownload(id) {
    const doc = this.findById(id);
    if (!doc) return null;
    return this.update(id, { downloadCount: (doc.downloadCount || 0) + 1 });
  }

  /**
   * Archiva un documento
   * @param {string} id
   * @returns {Document|null}
   */
  archive(id) {
    return this.update(id, { status: Document.STATUS.ARCHIVED });
  }

  // ── Estadísticas ─────────────────────────────────────────

  /**
   * Estadísticas generales de los documentos
   * @returns {Object}
   */
  getStats() {
    const all = this.findAll();
    const byType     = {};
    const byCategory = {};

    all.forEach(doc => {
      byType[doc.fileType]      = (byType[doc.fileType] || 0) + 1;
      byCategory[doc.categoryId] = (byCategory[doc.categoryId] || 0) + 1;
    });

    return {
      total:      all.length,
      active:     all.filter(d => d.status === Document.STATUS.ACTIVE).length,
      archived:   all.filter(d => d.status === Document.STATUS.ARCHIVED).length,
      featured:   all.filter(d => d.featured).length,
      totalDownloads: all.reduce((sum, d) => sum + (d.downloadCount || 0), 0),
      byType,
      byCategory,
    };
  }
}

module.exports = DocumentRepository;
