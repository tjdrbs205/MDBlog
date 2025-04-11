const express = require("express");
const router = express.Router();
const menuController = require("../constroller/menuController");

router.get("/", menuController.list);
router.post("/", menuController.create);
router.post("/:id/delete", menuController.delete);

module.exports = router;
