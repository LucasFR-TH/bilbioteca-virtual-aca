/**
 * src/models/Document.js
 * Modelo de Documento — Entidad principal de la biblioteca
 */

const BaseModel = require("./BaseModel");

// Tipos de archivo permitidos
const FILE_TYPES = Object.freeze({
  PDF:  { label: "PDF",  icon: "📄", color: "#e74c3c" },
  DOCX: { label: "DOCX", icon: "📝", color: "#2980b9" },
  XLSX: { label: "XLSX", icon: "📊", color: "#27ae60" },
  PPTX: { label: "PPTX", icon: "📑", color: "#e67e22" },
  DOC:  { label: "DOC",  icon: "📝", color: "#2980b9" },
  XLS:  { label: "XLS",  icon: "📊", color: "#27ae60" },
});

// Estados posibles del documento
const STATUS = Object.freeze({
  ACTIVE:   "active",
  ARCHIVED: "archived",
  DRAFT:    "draft",
});

class Document extends BaseModel {
  /**
   * @param {Object} data
   * @param {string}   data.id
   * @param {string}   data.title
   * @param {string}   data.slug
   * @param {string}   data.description
   * @param {string}   data.categoryId
   * @param {string}   data.folderId
   * @param {string}   data.fileType        — PDF | DOCX | XLSX | PPTX
   * @param {string}   data.driveId         — ID del archivo en Google Drive
   * @param {string}   data.driveUrl        — URL completa en Drive
   * @param {string[]} data.tags
   * @param {string}   data.status          — active | archived | draft
   * @param {boolean}  data.featured
   * @param {number}   data.downloadCount
   */
  constructor(data = {}) {
    super(data);
    this.title         = data.title         || "";
    this.slug          = data.slug          || "";
    this.description   = data.description   || "";
    this.categoryId    = data.categoryId    || null;
    this.folderId      = data.folderId      || null;
    this.fileType      = (data.fileType     || "PDF").toUpperCase();
    this.driveId       = data.driveId       || "";
    this.driveUrl      = data.driveUrl      || "";
    this.tags          = Array.isArray(data.tags) ? data.tags : [];
    this.status        = data.status        || STATUS.ACTIVE;
    this.featured      = Boolean(data.featured);
    this.downloadCount = Number(data.downloadCount) || 0;

    // Relaciones (se populan desde el Repository)
    this.category = data.category || null;
    this.folder   = data.folder   || null;
  }

  // ── Getters computados ───────────────────────────────────

  /** Metadatos del tipo de archivo */
  get fileTypeMeta() {
    return FILE_TYPES[this.fileType] || FILE_TYPES.PDF;
  }

  /** URL de vista previa embebida de Google Drive */
  get previewUrl() {
    return `https://drive.google.com/file/d/${this.driveId}/preview`;
  }

  /** URL de descarga directa desde Google Drive */
  get downloadUrl() {
    return `https://drive.google.com/uc?export=download&id=${this.driveId}`;
  }

  /** ¿El documento está publicado? */
  get isActive() {
    return this.status === STATUS.ACTIVE;
  }

  /** ¿Está archivado? */
  get isArchived() {
    return this.status === STATUS.ARCHIVED;
  }

  /** Texto de resumen corto para tarjetas */
  get excerpt() {
    return this.description.length > 120
      ? this.description.substring(0, 120) + "…"
      : this.description;
  }

  /** Fecha formateada para mostrar */
  get formattedDate() {
    return this.createdAt.toLocaleDateString("es-AR", {
      year:  "numeric",
      month: "long",
      day:   "numeric",
    });
  }

  // ── Métodos ──────────────────────────────────────────────

  /** Incrementa el contador de descargas */
  registerDownload() {
    this.downloadCount += 1;
    this.touch();
    return this;
  }

  /** Archiva el documento */
  archive() {
    this.status = STATUS.ARCHIVED;
    this.touch();
    return this;
  }

  /** Reactiva el documento */
  activate() {
    this.status = STATUS.ACTIVE;
    this.touch();
    return this;
  }

  /** Verifica si el documento coincide con una consulta de búsqueda */
  matchesSearch(query) {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      this.title.toLowerCase().includes(q)       ||
      this.description.toLowerCase().includes(q) ||
      this.tags.some(t => t.toLowerCase().includes(q))
    );
  }

  /** Validaciones del modelo */
  validate() {
    const errors = [];
    if (!this.title || this.title.trim().length < 3)
      errors.push("El título debe tener al menos 3 caracteres.");
    if (!this.driveId || this.driveId === "REEMPLAZAR_CON_ID_REAL")
      errors.push("El ID de Google Drive es obligatorio.");
    if (!this.categoryId)
      errors.push("La categoría es obligatoria.");
    if (!this.folderId)
      errors.push("La carpeta es obligatoria.");
    if (!FILE_TYPES[this.fileType])
      errors.push(`Tipo de archivo inválido: ${this.fileType}`);
    return { valid: errors.length === 0, errors };
  }

  /** Serializa solo los campos que se persisten en la DB */
  toJSON() {
    return {
      ...super.toJSON(),
      title:         this.title,
      slug:          this.slug,
      description:   this.description,
      categoryId:    this.categoryId,
      folderId:      this.folderId,
      fileType:      this.fileType,
      driveId:       this.driveId,
      driveUrl:      this.driveUrl,
      tags:          this.tags,
      status:        this.status,
      featured:      this.featured,
      downloadCount: this.downloadCount,
    };
  }

  /** Serializa para la API (incluye campos computados) */
  toAPI() {
    return {
      ...this.toJSON(),
      previewUrl:   this.previewUrl,
      downloadUrl:  this.downloadUrl,
      fileTypeMeta: this.fileTypeMeta,
      excerpt:      this.excerpt,
    };
  }
}

Document.FILE_TYPES = FILE_TYPES;
Document.STATUS     = STATUS;

module.exports = Document;
