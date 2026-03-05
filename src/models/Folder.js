/**
 * src/models/Folder.js
 * Modelo de Carpeta — Organización jerárquica de documentos
 */

const BaseModel = require("./BaseModel");

class Folder extends BaseModel {
  /**
   * @param {Object}      data
   * @param {string}      data.id
   * @param {string}      data.name
   * @param {string}      data.slug
   * @param {string|null} data.parentId   — null si es carpeta raíz
   * @param {string}      data.color
   * @param {string}      data.icon
   * @param {string}      data.description
   */
  constructor(data = {}) {
    super(data);
    this.name        = data.name        || "";
    this.slug        = data.slug        || "";
    this.parentId    = data.parentId    || null;
    this.color       = data.color       || "#7a7068";
    this.icon        = data.icon        || "📁";
    this.description = data.description || "";

    // Relaciones (se populan desde el Repository)
    this.parent   = data.parent   || null;
    this.children = data.children || [];
    this.documents = data.documents || [];
  }

  // ── Getters ──────────────────────────────────────────────

  /** ¿Es carpeta raíz? */
  get isRoot() {
    return this.parentId === null;
  }

  /** ¿Tiene subcarpetas? */
  get hasChildren() {
    return this.children.length > 0;
  }

  /** Cantidad de documentos directos */
  get documentCount() {
    return this.documents.length;
  }

  /** Ruta legible: "Padre › Hijo" */
  get breadcrumbPath() {
    if (!this.parent) return this.name;
    const parentName = typeof this.parent === "object"
      ? this.parent.name
      : this.parent;
    return `${parentName} › ${this.name}`;
  }

  // ── Métodos ──────────────────────────────────────────────

  validate() {
    const errors = [];
    if (!this.name || this.name.trim().length < 2)
      errors.push("El nombre de la carpeta debe tener al menos 2 caracteres.");
    return { valid: errors.length === 0, errors };
  }

  toJSON() {
    return {
      ...super.toJSON(),
      name:        this.name,
      slug:        this.slug,
      parentId:    this.parentId,
      color:       this.color,
      icon:        this.icon,
      description: this.description,
    };
  }

  toAPI() {
    return {
      ...this.toJSON(),
      isRoot:        this.isRoot,
      hasChildren:   this.hasChildren,
      documentCount: this.documentCount,
      breadcrumbPath: this.breadcrumbPath,
    };
  }
}

module.exports = Folder;
