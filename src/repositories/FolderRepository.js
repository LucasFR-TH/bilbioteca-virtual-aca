/**
 * src/repositories/FolderRepository.js
 * Repositorio de Carpetas — Árbol jerárquico de carpetas
 */

const BaseRepository = require("./BaseRepository");
const Folder         = require("../models/Folder");

class FolderRepository extends BaseRepository {
  constructor() {
    super("folders", Folder);
  }

  /**
   * Obtiene carpetas raíz (sin padre)
   * @returns {Folder[]}
   */
  findRoots() {
    return this.findWhere(f => f.parentId === null);
  }

  /**
   * Obtiene subcarpetas de una carpeta padre
   * @param {string} parentId
   * @returns {Folder[]}
   */
  findChildren(parentId) {
    return this.findWhere(f => f.parentId === parentId);
  }

  /**
   * Construye el árbol completo de carpetas
   * @returns {Folder[]} — Carpetas raíz con `children` populados
   */
  buildTree() {
    const roots = this.findRoots();
    return roots.map(root => {
      root.children = this.findChildren(root.id);
      return root;
    });
  }

  /**
   * Obtiene una carpeta con su padre y sus hijos
   * @param {string} id
   * @returns {Folder|null}
   */
  findByIdWithRelations(id) {
    const folder = this.findById(id);
    if (!folder) return null;

    if (folder.parentId) {
      folder.parent = this.findById(folder.parentId);
    }
    folder.children = this.findChildren(id);
    return folder;
  }

  /**
   * Crea una carpeta generando slug automáticamente
   * @param {Object} data
   * @returns {Folder}
   */
  createFolder(data) {
    const slug = this.generateSlug(data.name);
    return this.create({ ...data, slug });
  }
}

module.exports = FolderRepository;
