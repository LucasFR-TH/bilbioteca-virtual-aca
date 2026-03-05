/**
 * src/models/Category.js
 * Modelo de Categoría — Clasificación temática de documentos
 */

const BaseModel = require("./BaseModel");

class Category extends BaseModel {
  /**
   * @param {Object} data
   * @param {string} data.id
   * @param {string} data.name
   * @param {string} data.slug
   * @param {string} data.description
   * @param {string} data.color
   * @param {string} data.icon
   */
  constructor(data = {}) {
    super(data);
    this.name        = data.name        || "";
    this.slug        = data.slug        || "";
    this.description = data.description || "";
    this.color       = data.color       || "#7a7068";
    this.icon        = data.icon        || "📁";

    // Relaciones
    this.documents = data.documents || [];
  }

  get documentCount() {
    return this.documents.length;
  }

  validate() {
    const errors = [];
    if (!this.name || this.name.trim().length < 2)
      errors.push("El nombre de la categoría es obligatorio.");
    if (!this.color || !/^#[0-9A-Fa-f]{6}$/.test(this.color))
      errors.push("El color debe ser un hexadecimal válido (#rrggbb).");
    return { valid: errors.length === 0, errors };
  }

  toJSON() {
    return {
      ...super.toJSON(),
      name:        this.name,
      slug:        this.slug,
      description: this.description,
      color:       this.color,
      icon:        this.icon,
    };
  }

  toAPI() {
    return {
      ...this.toJSON(),
      documentCount: this.documentCount,
    };
  }
}

module.exports = Category;
