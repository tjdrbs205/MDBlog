const express = require("express");
const router = express.Router();
const postController = require("../constroller/postController");

router.get("/", postController.getAllPosts);
router.get("/new", postController.renderNewForm);
router.post("/", postController.createPost);
router.get("/:id", postController.getPostDetail);

module.exports = router;
