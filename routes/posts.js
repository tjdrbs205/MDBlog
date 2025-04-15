/**
 * 게시물 관련 라우터
 * URL 경로 정의 및 컨트롤러 함수와 연결
 */
const express = require("express");
const router = express.Router();
const postController = require("../controller/postController");
const { isLoggedIn, isAuthor, isAdmin } = require("../middlewares/authMiddleware");
const asyncHandler = require("../middlewares/asyncHandler");
const { body, param, query } = require("express-validator");
const validationMiddleware = require("../middlewares/validationMiddleware");

/**
 * 게시물 목록 관련 라우트
 */

// GET /posts - 게시물 목록 조회
router.get(
  "/",
  // 선택적 쿼리 파라미터 유효성 검사
  [
    query("page").optional().isInt({ min: 1 }).withMessage("페이지 번호는 1 이상의 정수여야 합니다."),
    query("sort").optional().isIn(["newest", "oldest", "title", "views"]).withMessage("유효하지 않은 정렬 기준입니다."),
    validationMiddleware,
  ],
  asyncHandler(postController.listPosts)
);

// GET /posts/popular - 인기 게시물 목록 조회
router.get(
  "/popular",
  [
    query("page").optional().isInt({ min: 1 }).withMessage("페이지 번호는 1 이상의 정수여야 합니다."),
    validationMiddleware,
  ],
  asyncHandler(postController.listPopularPosts)
);

// GET /posts/archive - 아카이브 페이지 (월별, 연도별 게시물)
router.get(
  "/archive",
  [
    query("year").optional().isInt({ min: 2000, max: 2100 }).withMessage("유효한 연도를 입력하세요."),
    query("month").optional().isInt({ min: 1, max: 12 }).withMessage("유효한 월(1-12)을 입력하세요."),
    validationMiddleware,
  ],
  asyncHandler(postController.getArchive)
);

// GET /posts/my-posts - 내 게시물 목록 조회 (관리자만 가능)
router.get("/my-posts", isAdmin, asyncHandler(postController.getMyPosts));

/**
 * 게시물 작성/편집 관련 라우트
 */

// GET /posts/new - 새 게시물 작성 폼 (관리자만 가능)
router.get("/new", isAdmin, asyncHandler(postController.renderNewForm));

// POST /posts - 게시물 생성 (관리자만 가능)
router.post(
  "/",
  isAdmin,
  [
    body("title").notEmpty().withMessage("제목을 입력해주세요.").trim(),
    body("content").notEmpty().withMessage("내용을 입력해주세요.").trim(),
    body("isPublic").optional().isBoolean().withMessage("공개 여부는 true/false 값이어야 합니다."),
    body("status").optional().isIn(["published", "draft"]).withMessage("유효하지 않은 상태값입니다."),
    validationMiddleware,
  ],
  asyncHandler(postController.createPost)
);

/**
 * 개별 게시물 관련 라우트
 */

// 게시물 ID 파라미터 검증 미들웨어
const validatePostId = [param("id").isMongoId().withMessage("유효하지 않은 게시물 ID입니다."), validationMiddleware];

// GET /posts/:id - 게시물 상세 조회
router.get("/:id", validatePostId, asyncHandler(postController.getPostDetail));

// GET /posts/:id/edit - 게시물 수정 폼 (관리자만 가능)
router.get("/:id/edit", isAdmin, validatePostId, asyncHandler(postController.renderEditForm));

// POST /posts/:id/edit - 게시물 수정 (관리자만 가능)
router.post(
  "/:id/edit",
  isAdmin,
  validatePostId,
  [
    body("title").notEmpty().withMessage("제목을 입력해주세요.").trim(),
    body("content").notEmpty().withMessage("내용을 입력해주세요.").trim(),
    body("isPublic").optional().isBoolean().withMessage("공개 여부는 true/false 값이어야 합니다."),
    body("status").optional().isIn(["published", "draft"]).withMessage("유효하지 않은 상태값입니다."),
    validationMiddleware,
  ],
  asyncHandler(postController.updatePost)
);

// POST /posts/:id/delete - 게시물 삭제 (관리자만 가능)
router.post("/:id/delete", isAdmin, validatePostId, asyncHandler(postController.deletePost));

// DELETE /posts/:id - 게시물 삭제 (DELETE 메서드 지원 추가)
router.delete("/:id", isAdmin, validatePostId, asyncHandler(postController.deletePost));

/**
 * 댓글 관련 라우트
 */

// POST /posts/:id/comments - 댓글 추가 (로그인 필요)
router.post(
  "/:id/comments",
  isLoggedIn,
  validatePostId,
  [body("content").notEmpty().withMessage("댓글 내용을 입력해주세요.").trim(), validationMiddleware],
  asyncHandler(postController.addComment)
);

// POST /posts/:postId/comments/:commentId/delete - 댓글 삭제 (로그인 및 댓글 작성자 확인 필요)
router.post(
  "/:postId/comments/:commentId/delete",
  isLoggedIn,
  [
    param("postId").isMongoId().withMessage("유효하지 않은 게시물 ID입니다."),
    param("commentId").isMongoId().withMessage("유효하지 않은 댓글 ID입니다."),
    validationMiddleware,
  ],
  asyncHandler(postController.deleteComment)
);

module.exports = router;
