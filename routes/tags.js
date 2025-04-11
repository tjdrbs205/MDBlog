const express = require("express");
const router = express.Router();
const tagController = require("../constroller/tagController");

router.get("/", tagController.list);
router.post("/", tagController.create);

module.exports = router;
