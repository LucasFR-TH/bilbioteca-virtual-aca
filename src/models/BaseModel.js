/**
 * src/models/BaseModel.js
 * Clase base abstracta para todos los modelos (OOP)
 */

class BaseModel {
  /**
   * @param {Object} data — Datos planos para hidratar el modelo
   */
  constructor(data = {}) {
    this.id        = data.id        || null;
    this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
    this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
  }

  /**
   * Serializa el modelo a un objeto plano (para persistir en DB)
   * @returns {Object}
   */
  toJSON() {
    return {
      id:        this.id,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }

  /**
   * Serializa el modelo para respuestas de la API
   * @returns {Object}
   */
  toAPI() {
    return this.toJSON();
  }

  /**
   * Marca el modelo como modificado (actualiza updatedAt)
   */
  touch() {
    this.updatedAt = new Date();
    return this;
  }

  /**
   * Valida el modelo. Implementar en subclases.
   * @returns {{ valid: boolean, errors: string[] }}
   */
  validate() {
    return { valid: true, errors: [] };
  }

  /**
   * Crea una instancia desde datos planos
   * @param {Object} data
   * @returns {BaseModel}
   */
  static fromJSON(data) {
    return new this(data);
  }

  /**
   * Crea múltiples instancias desde un array
   * @param {Object[]} items
   * @returns {BaseModel[]}
   */
  static fromArray(items = []) {
    return items.map(item => this.fromJSON(item));
  }
}

module.exports = BaseModel;
