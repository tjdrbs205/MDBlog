/**
 * 태그 관련 라우터
 * URL 경로 정의 및 컨트롤러 함수와 연결
 */
const express = require("express");
const router = express.Router();
const tagController = require("../controller/tagController");
const { isLoggedIn, isAdmin } = require("../middlewares/authMiddleware");
const asyncHandler = require("../middlewares/asyncHandler");
const { body, param, query } = require("express-validator");
const validationMiddleware = require("../middlewares/validationMiddleware");

/**
 * 태그 목록 및 관리 관련 라우트
 */

// GET /tags - 태그 목록 조회 및 관리 페이지
router.get("/", asyncHandler(tagController.list));

// POST /tags - 태그 생성 (로그인 필요)
router.post(
  "/",
  isLoggedIn,
  [body("name").notEmpty().withMessage("태그 이름을 입력해주세요.").trim(), validationMiddleware],
  asyncHandler(tagController.create)
);

// POST /tags/:id/delete - 태그 삭제 (관리자만 가능)
router.post(
  "/:id/delete",
  isLoggedIn,
  isAdmin,
  [param("id").isMongoId().withMessage("유효하지 않은 태그 ID입니다."), validationMiddleware],
  asyncHandler(tagController.delete)
);

/**
 * 태그별 게시물 조회 라우트
 */

// GET /tags/:id - 특정 태그의 게시물 목록 조회
router.get(
  "/:id",
  [
    param("id").isMongoId().withMessage("유효하지 않은 태그 ID입니다."),
    query("page").optional().isInt({ min: 1 }).withMessage("페이지 번호는 1 이상의 정수여야 합니다."),
    validationMiddleware,
  ],
  asyncHandler(tagController.filter)
);

module.exports = router;
