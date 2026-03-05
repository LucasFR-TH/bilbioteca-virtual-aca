/**
 * src/repositories/BaseRepository.js
 * Repositorio base — Acceso genérico a la base de datos JSON
 * Implementa el patrón Repository con operaciones CRUD completas.
 */

const fs     = require("fs");
const path   = require("path");
const { v4: uuidv4 } = require("uuid");
const dbConfig = require("../config/database");

class BaseRepository {
  /**
   * @param {string} collection — Nombre de la colección en db.json (ej: "documents")
   * @param {Function} ModelClass — Clase del modelo a instanciar
   */
  constructor(collection, ModelClass) {
    this.collection = collection;
    this.ModelClass = ModelClass;
    this.dbPath     = dbConfig.dbPath;
  }

  // ── I/O de base de datos ─────────────────────────────────

  /**
   * Lee y parsea el archivo db.json completo
   * @returns {Object}
   */
  _readDB() {
    const raw = fs.readFileSync(this.dbPath, "utf-8");
    return JSON.parse(raw);
  }

  /**
   * Escribe el objeto completo de vuelta al archivo db.json
   * @param {Object} db
   */
  _writeDB(db) {
    fs.writeFileSync(this.dbPath, JSON.stringify(db, null, 2), "utf-8");
  }

  /**
   * Obtiene todos los registros planos de la colección
   * @returns {Object[]}
   */
  _getCollection() {
    const db = this._readDB();
    return db[this.collection] || [];
  }

  /**
   * Reemplaza la colección entera
   * @param {Object[]} items
   */
  _setCollection(items) {
    const db = this._readDB();
    db[this.collection] = items;
    this._writeDB(db);
  }

  // ── Operaciones CRUD ─────────────────────────────────────

  /**
   * Obtiene todos los registros como instancias del modelo
   * @returns {BaseModel[]}
   */
  findAll() {
    const items = this._getCollection();
    return this.ModelClass.fromArray(items);
  }

  /**
   * Busca por ID
   * @param {string} id
   * @returns {BaseModel|null}
   */
  findById(id) {
    const items = this._getCollection();
    const found = items.find(item => item.id === id);
    return found ? this.ModelClass.fromJSON(found) : null;
  }

  /**
   * Busca por slug
   * @param {string} slug
   * @returns {BaseModel|null}
   */
  findBySlug(slug) {
    const items = this._getCollection();
    const found = items.find(item => item.slug === slug);
    return found ? this.ModelClass.fromJSON(found) : null;
  }

  /**
   * Filtra registros según un predicado
   * @param {Function} predicate
   * @returns {BaseModel[]}
   */
  findWhere(predicate) {
    const items = this._getCollection();
    return this.ModelClass.fromArray(items.filter(predicate));
  }

  /**
   * Busca el primer registro que cumpla el predicado
   * @param {Function} predicate
   * @returns {BaseModel|null}
   */
  findOne(predicate) {
    const items = this._getCollection();
    const found = items.find(predicate);
    return found ? this.ModelClass.fromJSON(found) : null;
  }

  /**
   * Crea un nuevo registro
   * @param {Object} data — Datos planos (sin id ni timestamps)
   * @returns {BaseModel}
   */
  create(data) {
    const now = new Date().toISOString();
    const newItem = {
      ...data,
      id:        uuidv4(),
      createdAt: now,
      updatedAt: now,
    };

    const instance = this.ModelClass.fromJSON(newItem);
    const { valid, errors } = instance.validate();
    if (!valid) {
      throw new Error(`Validación fallida: ${errors.join(", ")}`);
    }

    const items = this._getCollection();
    items.push(newItem);
    this._setCollection(items);

    return instance;
  }

  /**
   * Actualiza un registro existente por ID
   * @param {string} id
   * @param {Object} data — Campos a actualizar (parcial)
   * @returns {BaseModel|null}
   */
  update(id, data) {
    const items    = this._getCollection();
    const index    = items.findIndex(item => item.id === id);
    if (index === -1) return null;

    const updated = {
      ...items[index],
      ...data,
      id:        items[index].id,       // ID inmutable
      createdAt: items[index].createdAt, // createdAt inmutable
      updatedAt: new Date().toISOString(),
    };

    const instance = this.ModelClass.fromJSON(updated);
    const { valid, errors } = instance.validate();
    if (!valid) {
      throw new Error(`Validación fallida: ${errors.join(", ")}`);
    }

    items[index] = updated;
    this._setCollection(items);

    return instance;
  }

  /**
   * Elimina un registro por ID
   * @param {string} id
   * @returns {boolean}
   */
  delete(id) {
    const items    = this._getCollection();
    const filtered = items.filter(item => item.id !== id);
    if (filtered.length === items.length) return false;
    this._setCollection(filtered);
    return true;
  }

  /**
   * Cuenta los registros (con filtro opcional)
   * @param {Function} [predicate]
   * @returns {number}
   */
  count(predicate = null) {
    const items = this._getCollection();
    return predicate ? items.filter(predicate).length : items.length;
  }

  /**
   * Verifica si existe un registro por ID
   * @param {string} id
   * @returns {boolean}
   */
  exists(id) {
    return this.findById(id) !== null;
  }

  /**
   * Genera un slug único desde un texto
   * @param {string} text
   * @returns {string}
   */
  generateSlug(text) {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")  // quita tildes
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");
  }
}

module.exports = BaseRepository;
