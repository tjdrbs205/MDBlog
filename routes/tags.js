const express = require("express");
const router = express.Router();
const tagController = require("../controller/tagController");
const asyncHandler = require("../middlewares/asyncHandler");
const { isLoggedIn, isAdmin } = require("../middlewares/authMiddleware");

// 태그 목록 조회
router.get("/", asyncHandler(tagController.list));

// 태그 생성 (로그인 필요)
router.post("/", isLoggedIn, asyncHandler(tagController.create));

// 태그 삭제 (관리자만 가능)
router.post(
  "/:id/delete",
  isLoggedIn,
  isAdmin,
  asyncHandler(tagController.delete)
);

module.exports = router;
