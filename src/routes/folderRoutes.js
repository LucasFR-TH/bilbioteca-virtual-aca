/**
 * src/routes/folderRoutes.js
 */
const express    = require("express");
const router     = express.Router();
const controller = require("../controllers/FolderController");

router.get("/",         controller.index);
router.post("/",        controller.create);
router.get("/:id",      controller.show);
router.post("/:id",     controller.update);   // _method=PUT
router.delete("/:id",   controller.delete);

module.exports = router;
