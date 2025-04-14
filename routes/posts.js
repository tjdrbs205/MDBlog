const express = require("express");
const router = express.Router();
const postController = require("../controller/postController");
const { isLoggedIn, isAuthor } = require("../middlewares/authMiddleware");
const asyncHandler = require("../middlewares/asyncHandler");
const Post = require("../models/Post");

// 게시물 목록 조회
router.get("/", asyncHandler(postController.listPosts));

// 인기 게시물 목록 조회
router.get("/popular", asyncHandler(postController.listPopularPosts));

// 아카이브 페이지 (월별, 연도별 게시물)
router.get("/archive", asyncHandler(postController.getArchive));

// 내 게시물 목록 조회 (로그인 필요)
router.get("/my-posts", isLoggedIn, asyncHandler(postController.getMyPosts));

// 새 게시물 작성 폼 (로그인 필요)
router.get("/new", isLoggedIn, asyncHandler(postController.renderNewForm));

// 게시물 생성 (로그인 필요)
router.post("/", isLoggedIn, asyncHandler(postController.createPost));

// 게시물 상세 조회
router.get("/:id", asyncHandler(postController.getPostDetail));

// 게시물 수정 폼 (로그인 및 작성자 확인 필요)
router.get("/:id/edit", isLoggedIn, asyncHandler(postController.renderEditForm));

// 게시물 수정 (로그인 및 작성자 확인 필요)
router.post("/:id/edit", isLoggedIn, asyncHandler(postController.updatePost));

// 게시물 삭제 (로그인 및 작성자 확인 필요)
router.post("/:id/delete", isLoggedIn, asyncHandler(postController.deletePost));

// 댓글 추가 (로그인 필요)
router.post("/:id/comments", isLoggedIn, asyncHandler(postController.addComment));

// 댓글 삭제 (로그인 및 댓글 작성자 확인 필요)
router.post(
  "/:postId/comments/:commentId/delete",
  isLoggedIn,
  asyncHandler(postController.deleteComment)
);

module.exports = router;
