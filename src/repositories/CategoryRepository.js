/**
 * src/repositories/CategoryRepository.js
 */

const BaseRepository = require("./BaseRepository");
const Category       = require("../models/Category");

class CategoryRepository extends BaseRepository {
  constructor() {
    super("categories", Category);
  }

  createCategory(data) {
    const slug = this.generateSlug(data.name);
    return this.create({ ...data, slug });
  }
}

module.exports = CategoryRepository;
