/**
 * src/routes/documentRoutes.js
 */
const express    = require("express");
const router     = express.Router();
const controller = require("../controllers/DocumentController");

router.get("/",           controller.index);
router.get("/new",        controller.new);
router.post("/",          controller.create);
router.get("/:id",        controller.show);
router.get("/:id/edit",   controller.edit);
router.post("/:id",       controller.update);   // _method=PUT via method-override
router.delete("/:id",     controller.archive);
router.get("/:id/download", controller.download);

module.exports = router;
