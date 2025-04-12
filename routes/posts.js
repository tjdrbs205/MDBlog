const express = require("express");
const router = express.Router();
const postController = require("../constroller/postController");

const { isLoggedIn } = require("../middlewares/authMiddleware");

//form
router.get("/new", isLoggedIn, postController.renderNewForm); // new form
router.get("/:id/edit", isLoggedIn, postController.renderEditForm); // edit form

//process
router.get("/", postController.getAllPosts); // list
router.post("/", isLoggedIn, postController.createPost); // create
router.get("/:id", postController.getPostDetail); // detail
router.post("/:id/edit", isLoggedIn, postController.updatePost); // edit
router.post("/:id/delete", isLoggedIn, postController.deletePost); // delete

module.exports = router;
