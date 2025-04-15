const express = require("express");
const router = express.Router();
const adminController = require("../controller/adminController");
const { isAdmin } = require("../middlewares/authMiddleware");
const asyncHandler = require("../middlewares/asyncHandler");
const { body, param, query } = require("express-validator");
const validationMiddleware = require("../middlewares/validationMiddleware");

// 모든 관리자 라우트에 isAdmin 미들웨어 적용
router.use(isAdmin);

/**
 * 대시보드 관련 라우트
 */

// GET /admin - 관리자 대시보드 페이지
router.get("/", asyncHandler(adminController.renderDashboard));

// GET /admin/dashboard - 대시보드 페이지 (리다이렉트)
router.get("/dashboard", (req, res) => res.redirect("/admin"));

/**
 * 통계 관련 라우트
 */

// GET /admin/stats - 통계 대시보드 페이지
router.get("/stats", asyncHandler(adminController.renderStatsDashboard));

/**
 * 사용자 관리 관련 라우트
 */

// GET /admin/users - 사용자 관리 페이지
router.get(
  "/users",
  [
    query("page").optional().isInt({ min: 1 }).withMessage("페이지 번호는 1 이상의 정수여야 합니다."),
    validationMiddleware,
  ],
  asyncHandler(adminController.renderUserManagement)
);

// POST /admin/users/status - 사용자 상태 변경 API
router.post(
  "/users/status",
  [
    body("userId").isMongoId().withMessage("유효하지 않은 사용자 ID입니다."),
    body("isActive").isBoolean().withMessage("활성화 상태는 true/false 값이어야 합니다."),
    validationMiddleware,
  ],
  asyncHandler(adminController.updateUserStatus)
);

// POST /admin/users/role - 사용자 역할 변경 API
router.post(
  "/users/role",
  [
    body("userId").isMongoId().withMessage("유효하지 않은 사용자 ID입니다."),
    body("role").isIn(["user", "admin"]).withMessage("역할은 'user' 또는 'admin'이어야 합니다."),
    validationMiddleware,
  ],
  asyncHandler(adminController.updateUserRole)
);

/**
 * 게시물 관리 관련 라우트
 */

// GET /admin/posts - 게시물 관리 페이지
router.get(
  "/posts",
  [
    query("page").optional().isInt({ min: 1 }).withMessage("페이지 번호는 1 이상의 정수여야 합니다."),
    query("status").optional().isIn(["all", "published", "draft"]).withMessage("유효하지 않은 상태 필터입니다."),
    validationMiddleware,
  ],
  asyncHandler(adminController.renderPostManagement)
);

/**
 * 댓글 관리 관련 라우트
 */

// GET /admin/comments - 댓글 관리 페이지
router.get(
  "/comments",
  [
    query("page").optional().isInt({ min: 1 }).withMessage("페이지 번호는 1 이상의 정수여야 합니다."),
    validationMiddleware,
  ],
  asyncHandler(adminController.renderCommentManagement)
);

/**
 * 설정 관련 라우트
 */

// GET /admin/settings - 블로그 설정 페이지
router.get("/settings", asyncHandler(adminController.renderSettings));

// POST /admin/settings - 설정 저장 처리
router.post("/settings", asyncHandler(adminController.saveSettings));

/**
 * 콘텐츠 관리 관련 라우트
 */

// GET /admin/content - 콘텐츠 관리 페이지
router.get("/content", asyncHandler(adminController.renderContentManagement));

module.exports = router;
