/**
 * src/routes/sectionRoutes.js
 */
const express    = require("express");
const router     = express.Router();
const controller = require("../controllers/SectionController");

router.get("/",                        controller.index);
router.get("/:id",                     controller.show);
router.get("/:id/carpeta/:folderId",   controller.subfolder);
router.post("/:id/refresh",            controller.refreshCache);

module.exports = router;
