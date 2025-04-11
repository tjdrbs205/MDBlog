const express = require("express");
const router = express.Router();
const postController = require("../constroller/postController");

//form
router.get("/new", postController.renderNewForm); // new form
router.get("/:id/edit", postController.renderEditForm); // edit form

//process
router.get("/", postController.getAllPosts); // list
router.post("/", postController.createPost); // create
router.get("/:id", postController.getPostDetail); // detail
router.post("/:id/edit", postController.updatePost); // edit
router.post("/:id/delete", postController.deletePost); // delete

module.exports = router;
