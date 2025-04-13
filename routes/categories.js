const express = require("express");
const router = express.Router();
const categoryController = require("../controller/categoryController");
const asyncHandler = require("../middlewares/asyncHandler");
const { isLoggedIn, isAdmin } = require("../middlewares/authMiddleware");

// 카테고리 목록 조회
router.get("/", asyncHandler(categoryController.list));

// 카테고리 생성 (관리자만 가능)
router.post("/", isLoggedIn, isAdmin, asyncHandler(categoryController.create));

// 특정 카테고리의 게시물 조회
router.get("/:id/posts", asyncHandler(categoryController.filter));

module.exports = router;
