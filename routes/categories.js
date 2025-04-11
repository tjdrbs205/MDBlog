const express = require("express");
const router = express.Router();
const categoryController = require("../constroller/categoryController");

router.get("/", categoryController.list);
router.post("/", categoryController.create);
router.get("/:id/posts", categoryController.filter);

module.exports = router;
