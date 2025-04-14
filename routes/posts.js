const express = require("express");
const router = express.Router();
const postController = require("../controller/postController");
const { isLoggedIn, isAuthor, isAdmin } = require("../middlewares/authMiddleware");
const asyncHandler = require("../middlewares/asyncHandler");
const Post = require("../models/Post");

// 게시물 목록 조회
router.get("/", asyncHandler(postController.listPosts));

// 인기 게시물 목록 조회
router.get("/popular", asyncHandler(postController.listPopularPosts));

// 아카이브 페이지 (월별, 연도별 게시물)
router.get("/archive", asyncHandler(postController.getArchive));

// 내 게시물 목록 조회 (관리자만 가능)
router.get("/my-posts", isAdmin, asyncHandler(postController.getMyPosts));

// 새 게시물 작성 폼 (관리자만 가능)
router.get("/new", isAdmin, asyncHandler(postController.renderNewForm));

// 게시물 생성 (관리자만 가능)
router.post("/", isAdmin, asyncHandler(postController.createPost));

// 게시물 상세 조회
router.get("/:id", asyncHandler(postController.getPostDetail));

// 게시물 수정 폼 (관리자만 가능)
router.get("/:id/edit", isAdmin, asyncHandler(postController.renderEditForm));

// 게시물 수정 (관리자만 가능)
router.post("/:id/edit", isAdmin, asyncHandler(postController.updatePost));

// 게시물 삭제 (관리자만 가능)
router.post("/:id/delete", isAdmin, asyncHandler(postController.deletePost));

// 댓글 추가 (로그인 필요)
router.post("/:id/comments", isLoggedIn, asyncHandler(postController.addComment));

// 댓글 삭제 (로그인 및 댓글 작성자 확인 필요)
router.post(
  "/:postId/comments/:commentId/delete",
  isLoggedIn,
  asyncHandler(postController.deleteComment)
);

module.exports = router;
