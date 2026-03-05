/**
 * src/routes/categoryRoutes.js
 */
const express = require("express");
const router  = express.Router();
const { CategoryController } = require("../controllers/SearchController");

router.get("/",       CategoryController.index);
router.post("/",      CategoryController.create);
router.get("/:id",    CategoryController.show);
router.delete("/:id", CategoryController.delete);

module.exports = router;
