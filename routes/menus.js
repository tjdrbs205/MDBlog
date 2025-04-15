const express = require("express");
const router = express.Router();
const menuController = require("../controller/menuController");
const asyncHandler = require("../middlewares/asyncHandler");
const { isLoggedIn, isAdmin } = require("../middlewares/authMiddleware");

// 메뉴 목록 조회
router.get("/", isLoggedIn, isAdmin, asyncHandler(menuController.list));

// 메뉴 생성 (관리자만 가능)
router.post("/", isLoggedIn, isAdmin, asyncHandler(menuController.create));

// 메뉴 삭제 (관리자만 가능)
router.post("/:id/delete", isLoggedIn, isAdmin, asyncHandler(menuController.delete));

// 메뉴 순서 변경 (관리자만 가능)
router.post("/reorder", isLoggedIn, isAdmin, asyncHandler(menuController.reorder));

module.exports = router;
