/**
 * 카테고리 관련 라우터
 * URL 경로 정의 및 컨트롤러 함수와 연결
 */
const express = require("express");
const router = express.Router();
const categoryController = require("../controller/categoryController");
const { isLoggedIn, isAdmin } = require("../middlewares/authMiddleware");
const asyncHandler = require("../middlewares/asyncHandler");
const { body, param, query } = require("express-validator");
const validationMiddleware = require("../middlewares/validationMiddleware");

/**
 * 카테고리 목록 및 관리 관련 라우트
 */

// GET /categories - 카테고리 목록 조회 및 관리 페이지
router.get("/", asyncHandler(categoryController.list));

// POST /categories - 카테고리 생성 (로그인 필요)
router.post(
  "/",
  isLoggedIn,
  [
    body("name").notEmpty().withMessage("카테고리 이름을 입력해주세요.").trim(),
    body("parent").optional({ nullable: true }),
    validationMiddleware,
  ],
  asyncHandler(categoryController.create)
);

// POST /categories/update - 카테고리 업데이트 (로그인 및 관리자 권한 필요)
router.post(
  "/update",
  isLoggedIn,
  isAdmin,
  [
    body("id").notEmpty().withMessage("카테고리 ID가 필요합니다."),
    body("name").notEmpty().withMessage("카테고리 이름을 입력해주세요.").trim(),
    body("parent").optional({ nullable: true }),
    validationMiddleware,
  ],
  asyncHandler(categoryController.update)
);

// POST /categories/:id/delete - 카테고리 삭제 (로그인 및 관리자 권한 필요)
router.post(
  "/:id/delete",
  isLoggedIn,
  isAdmin,
  [param("id").isMongoId().withMessage("유효하지 않은 카테고리 ID입니다."), validationMiddleware],
  asyncHandler(categoryController.delete)
);

/**
 * 카테고리별 게시물 조회 라우트
 */

// GET /categories/:id - 특정 카테고리의 게시물 목록 조회
router.get(
  "/:id",
  [
    param("id").isMongoId().withMessage("유효하지 않은 카테고리 ID입니다."),
    query("page").optional().isInt({ min: 1 }).withMessage("페이지 번호는 1 이상의 정수여야 합니다."),
    validationMiddleware,
  ],
  asyncHandler(categoryController.filter)
);

module.exports = router;
