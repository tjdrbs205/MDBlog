const express = require("express");
const router = express.Router();
const adminController = require("../controller/adminController");
const { isLoggedIn, isAdmin } = require("../middlewares/authMiddleware");
const asyncHandler = require("../middlewares/asyncHandler");

// GET /admin - 관리자 대시보드
router.get("/", isLoggedIn, isAdmin, asyncHandler(adminController.dashboard));

// GET /admin/users - 사용자 목록 페이지 (관리자용)
router.get(
  "/users",
  isLoggedIn,
  isAdmin,
  asyncHandler(adminController.listUsers)
);

// POST /admin/users/role - 사용자 역할 변경 (관리자용)
router.post(
  "/users/role",
  isLoggedIn,
  isAdmin,
  asyncHandler(adminController.changeUserRole)
);

module.exports = router;
